import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const MAX_DESKTOP_BRIDGE_EXTRA_TRIANGLES = 180_000;
const MAX_COMPACT_BRIDGE_EXTRA_TRIANGLES = 100_000;

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function fail(message) {
  throw new Error(`[grass-bridge-lod] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function readYamlNumber(source, key) {
  const value = Number(
    source.match(new RegExp(`^${key}:\\s*([0-9.]+)$`, "m"))?.[1],
  );
  if (!Number.isFinite(value)) {
    fail(`Unable to read ${key}.`);
  }
  return value;
}

function readSourceNumber(source, key) {
  const value = Number(
    source.match(new RegExp(`const ${key}\\s*=\\s*([0-9.]+)`))?.[1],
  );
  if (!Number.isFinite(value)) {
    fail(`Unable to read source constant ${key}.`);
  }
  return value;
}

function distanceToTile(x, z, originX, originZ, tileSize) {
  const distanceX = Math.max(originX - x, 0, x - (originX + tileSize));
  const distanceZ = Math.max(originZ - z, 0, z - (originZ + tileSize));
  return Math.hypot(distanceX, distanceZ);
}

function countTiles(radius, tileSize, focusX, focusZ) {
  const centerTileX = Math.floor(focusX / tileSize);
  const centerTileZ = Math.floor(focusZ / tileSize);
  const offset = Math.max(1, Math.ceil(radius / tileSize));
  let count = 0;
  for (let dz = -offset; dz <= offset; dz += 1) {
    for (let dx = -offset; dx <= offset; dx += 1) {
      const tileX = centerTileX + dx;
      const tileZ = centerTileZ + dz;
      if (
        distanceToTile(
          focusX,
          focusZ,
          tileX * tileSize,
          tileZ * tileSize,
          tileSize,
        ) <= radius
      ) {
        count += 1;
      }
    }
  }
  return count;
}

function maximumResidentTiles(radius, tileSize) {
  const phaseSamples = 64;
  let maximum = 0;
  for (let z = 0; z < phaseSamples; z += 1) {
    for (let x = 0; x < phaseSamples; x += 1) {
      maximum = Math.max(
        maximum,
        countTiles(
          radius,
          tileSize,
          (x * tileSize) / phaseSamples,
          (z * tileSize) / phaseSamples,
        ),
      );
    }
  }
  return maximum;
}

const worldConfig = read("public/config/world.yaml");
const presets = JSON.parse(read("src/grass/GrassArtPresets.json"));
const nearField = read("src/world/grass/WorldNearGrassField.ts");
const tileField = read("src/world/grass/WorldSingleBladeTileField.ts");
const qualityGovernor = read("src/runtime/GrassQualityGovernor.ts");

const bridgeDistance = readYamlNumber(worldConfig, "grassNearBridgeDistance");
const bridgeTransition = readYamlNumber(
  worldConfig,
  "grassNearBridgeTransitionDistance",
);
const ultraDistance = readYamlNumber(worldConfig, "grassUltraNearDistance");
const ultraTransition = readYamlNumber(
  worldConfig,
  "grassUltraNearTransitionDistance",
);
const nearDistance = readYamlNumber(worldConfig, "grassNearDistance");
const nearTransition = readYamlNumber(worldConfig, "grassTransitionDistance");
const tileSize = readYamlNumber(worldConfig, "grassNearTileSize");
const desktopDensity = readYamlNumber(
  worldConfig,
  "grassNearBladesPerSquareMeterDesktop",
);
const compactDensity = readYamlNumber(
  worldConfig,
  "grassNearBladesPerSquareMeterCompact",
);
const boundsMargin = readSourceNumber(nearField, "SINGLE_BLADE_BOUNDS_MARGIN");

const bridgeFadeStart = bridgeDistance - bridgeTransition;
const bridgeFadeEnd = bridgeDistance + bridgeTransition;
const ultraFadeEnd = ultraDistance + ultraTransition;
const configuredNearFadeStart = nearDistance - nearTransition;

assert(
  bridgeFadeStart >= ultraFadeEnd,
  "Bridge entry must begin after ultra-near detail has finished.",
);
assert(
  bridgeFadeEnd <= configuredNearFadeStart,
  "Bridge entry must finish before the configured near-to-mid fade starts.",
);

const bridgeResidencyRadius = bridgeFadeEnd + boundsMargin;
const maximumBridgeTiles = maximumResidentTiles(
  bridgeResidencyRadius,
  tileSize,
);
for (const [profile, density, ceiling] of [
  ["desktop", desktopDensity, MAX_DESKTOP_BRIDGE_EXTRA_TRIANGLES],
  ["compact", compactDensity, MAX_COMPACT_BRIDGE_EXTRA_TRIANGLES],
]) {
  const bladesPerTile = Math.round(tileSize ** 2 * density);
  const conservativeExtraTriangles = maximumBridgeTiles * bladesPerTile;
  assert(
    conservativeExtraTriangles <= ceiling,
    `${profile} bridge shell adds ${conservativeExtraTriangles} conservative ` +
      `near triangles, above the ${ceiling} ceiling.`,
  );
}

const qualityScales = [
  ...qualityGovernor.matchAll(/nearDistanceScale:\s*([0-9.]+)/g),
].map((match) => Number(match[1]));
assert(
  qualityScales.length > 0 && qualityScales.every(Number.isFinite),
  "Unable to read grass quality near-distance scales.",
);

for (const direction of Object.values(presets)) {
  for (const scale of qualityScales) {
    const outerFadeStart =
      direction.nearDistance * scale - direction.transitionDistance;
    const preferredBridgeFadeEnd = bridgeFadeEnd * scale;
    const resolvedBridgeFadeEnd = Math.min(
      preferredBridgeFadeEnd,
      outerFadeStart,
    );
    const preferredBridgeTransition = bridgeTransition * scale;
    const resolvedBridgeTransition = Math.max(
      0.01,
      Math.min(
        preferredBridgeTransition,
        Math.max(0.01, (resolvedBridgeFadeEnd - ultraFadeEnd) * 0.5),
      ),
    );
    const resolvedBridgeFadeStart =
      resolvedBridgeFadeEnd - resolvedBridgeTransition * 2;

    assert(
      resolvedBridgeFadeEnd <= outerFadeStart + 1e-9,
      `${direction.label} bridge overlaps the patch fade at quality scale ${scale}.`,
    );
    assert(
      resolvedBridgeFadeStart >= ultraFadeEnd - 1e-9,
      `${direction.label} bridge overlaps ultra-near detail at quality scale ${scale}.`,
    );
  }
}

assert(
  nearField.includes("ditherSeed: BASE_SEED_SALT") &&
    nearField.includes('namePrefix: "world-grass-single-blades"') &&
    nearField.includes('namePrefix: "world-grass-near-bridge"') &&
    nearField.includes("densityMultiplier: 1"),
  "LOD0 and bridge must retain the same placement seed and source density.",
);
assert(
  nearField.includes("this.baseMaterial.setLodDensityScale(1)") &&
    nearField.includes("this.baseDetailMaterial.setLodDensityScale(1)") &&
    nearField.includes("this.bridgeMaterial.setLodDensityScale(densityScale)"),
  "Quality scaling must not open a dither gap between LOD0 and bridge.",
);
assert(
  nearField.includes("lodInnerCullDistance:") &&
    nearField.includes("setInnerCullDistance(") &&
    tileField.includes("isInsideInnerCull") &&
    tileField.includes("tile.mesh.boundingSphere") &&
    tileField.includes("tile.mesh.count = 0"),
  "Bridge tiles fully inside the zero-coverage core must skip submission.",
);
assert(
  nearField.includes("sheen: false"),
  "The bridge must remain cheaper than close LOD0 shading.",
);

console.log(
  "[grass-bridge-lod] Placement, staging, quality, and submission checks passed.",
);
