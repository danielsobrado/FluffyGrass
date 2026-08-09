import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

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
