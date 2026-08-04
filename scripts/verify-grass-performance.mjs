import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function fail(message) {
  throw new Error(`[grass-performance] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function readYamlNumber(source, key) {
  const match = source.match(new RegExp(`^${key}:\\s*([0-9.]+)$`, "m"));
  const value = Number(match?.[1]);
  if (!Number.isFinite(value)) {
    fail(`Unable to read ${key}.`);
  }
  return value;
}

function readSourceNumber(source, key) {
  const match = source.match(new RegExp(`const ${key}\\s*=\\s*([0-9.]+)`));
  const value = Number(match?.[1]);
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

function requestedBladesPerTile(tileSize, density, multiplier) {
  return Math.max(1, Math.round(tileSize ** 2 * density * multiplier));
}

function evaluateNearField(
  focusX,
  focusZ,
  density,
  parameters,
  legacy = false,
) {
  const segmentedTriangles = parameters.bladeSegments * 2;
  if (legacy) {
    const baseTiles = countTiles(
      parameters.legacyBaseRadius,
      parameters.tileSize,
      focusX,
      focusZ,
    );
    const ultraTiles = countTiles(
      parameters.ultraRadius,
      parameters.tileSize,
      focusX,
      focusZ,
    );
    return (
      baseTiles *
        requestedBladesPerTile(parameters.tileSize, density, 1) *
        segmentedTriangles +
      ultraTiles *
        requestedBladesPerTile(
          parameters.tileSize,
          density,
          parameters.ultraMultiplier - 1,
        ) *
        segmentedTriangles
    );
  }

  const baseTiles = countTiles(
    parameters.baseRadius,
    parameters.tileSize,
    focusX,
    focusZ,
  );
  const detailTiles = countTiles(
    parameters.detailRadius,
    parameters.tileSize,
    focusX,
    focusZ,
  );
  const ultraTiles = countTiles(
    parameters.ultraRadius,
    parameters.tileSize,
    focusX,
    focusZ,
  );
  return (
    baseTiles * requestedBladesPerTile(parameters.tileSize, density, 1) +
    detailTiles *
      requestedBladesPerTile(parameters.tileSize, density, 1) *
      segmentedTriangles +
    ultraTiles *
      requestedBladesPerTile(
        parameters.tileSize,
        density,
        parameters.ultraMultiplier - 1,
      ) *
      segmentedTriangles
  );
}

function sampleNearField(density, parameters) {
  const values = [];
  const phaseSamples = 64;
  for (let iz = 0; iz < phaseSamples; iz += 1) {
    for (let ix = 0; ix < phaseSamples; ix += 1) {
      values.push(
        evaluateNearField(
          (ix * parameters.tileSize) / phaseSamples,
          (iz * parameters.tileSize) / phaseSamples,
          density,
          parameters,
        ),
      );
    }
  }
  for (const [focusX, focusZ] of [
    [0, 0],
    [parameters.tileSize * 0.5, parameters.tileSize * 0.5],
    [parameters.tileSize * 0.5, parameters.tileSize * 0.375],
    [parameters.tileSize * 0.375, parameters.tileSize * 0.5],
  ]) {
    values.push(
      evaluateNearField(focusX, focusZ, density, parameters),
    );
  }

  const legacyValues = [];
  for (let iz = 0; iz < phaseSamples; iz += 1) {
    for (let ix = 0; ix < phaseSamples; ix += 1) {
      legacyValues.push(
        evaluateNearField(
          (ix * parameters.tileSize) / phaseSamples,
          (iz * parameters.tileSize) / phaseSamples,
          density,
          parameters,
          true,
        ),
      );
    }
  }

  return {
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    maximum: Math.max(...values),
    legacyAverage:
      legacyValues.reduce((sum, value) => sum + value, 0) /
      legacyValues.length,
  };
}

function estimateSubmittedLodTriangles(
  direction,
  bladeDensity,
  patchSize,
  farCards,
) {
  const farTriangleDensity = (farCards * 2) / patchSize ** 2;
  const midInnerRadius = Math.max(
    0,
    direction.nearDistance - direction.transitionDistance,
  );
  const midOuterRadius =
    direction.midDistance + direction.transitionDistance;
  const farInnerRadius = Math.max(
    0,
    direction.midDistance - direction.transitionDistance,
  );
  const farOuterRadius =
    direction.farDistance + direction.transitionDistance;
  const midArea =
    Math.PI * (midOuterRadius ** 2 - midInnerRadius ** 2);
  const farArea =
    Math.PI * (farOuterRadius ** 2 - farInnerRadius ** 2);
  // This deliberately charges full geometry anywhere a mesh can be visible.
  // Shader dithering/degeneration can reduce raster and ALU cost, but it does
  // not reduce submitted indices or vertex invocations.
  return midArea * bladeDensity + farArea * farTriangleDensity;
}

const worldConfig = read("public/config/world.yaml");
const grassConfig = read("public/config/grass.yaml");
const presets = JSON.parse(read("src/grass/GrassArtPresets.json"));
const nearField = read("src/world/grass/WorldNearGrassField.ts");
const tileFactory = read("src/world/grass/WorldSingleBladeTileFactory.ts");
const nearMaterial = read("src/grass/materials/GrassNearMaterial.ts");
const worldGrassSystem = read("src/world/WorldGrassSystem.ts");
const lodController = read("src/grass/GrassLodController.ts");
const lodTuning = read("src/grass/GrassLodTuning.ts");
const impostorMaterial = read(
  "src/world/grass/WorldGrassImpostorMaterial.ts",
);

const bladeSegments = readYamlNumber(grassConfig, "bladeSegments");
const tileSize = readYamlNumber(worldConfig, "grassNearTileSize");
const desktopDensity = readYamlNumber(
  worldConfig,
  "grassNearBladesPerSquareMeterDesktop",
);
const compactDensity = readYamlNumber(
  worldConfig,
  "grassNearBladesPerSquareMeterCompact",
);
const patchDesktopDensity = readYamlNumber(
  worldConfig,
  "grassBladesPerSquareMeterDesktop",
);
const patchCompactDensity = readYamlNumber(
  worldConfig,
  "grassBladesPerSquareMeterCompact",
);
const nearDistance = readYamlNumber(worldConfig, "grassNearDistance");
const transitionDistance = readYamlNumber(
  worldConfig,
  "grassTransitionDistance",
);
const ultraDistance = readYamlNumber(worldConfig, "grassUltraNearDistance");
const ultraTransition = readYamlNumber(
  worldConfig,
  "grassUltraNearTransitionDistance",
);
const ultraMultiplier = readYamlNumber(
  worldConfig,
  "grassUltraNearDensityMultiplier",
);
const midBladeFraction = readYamlNumber(worldConfig, "grassMidBladeFraction");
const farCards = readYamlNumber(worldConfig, "grassFarImpostorsPerPatch");
const batchesPerAxis = readYamlNumber(
  worldConfig,
  "grassRenderBatchesPerAxis",
);
const patchSize = readYamlNumber(worldConfig, "grassPatchSize");
const chunkSize = readYamlNumber(worldConfig, "chunkSize");
const boundsMargin = readSourceNumber(
  nearField,
  "SINGLE_BLADE_BOUNDS_MARGIN",
);
const maximumPresetNearFade = Math.max(
  ...Object.values(presets).map(
    (direction) => direction.nearDistance + direction.transitionDistance,
  ),
);

assert(desktopDensity === 72 && patchDesktopDensity === 72, "Desktop LOD density must remain 72 blades/m².");
assert(compactDensity === 48 && patchCompactDensity === 48, "Compact LOD density must remain 48 blades/m².");
assert(midBladeFraction === 1, "The performance path must retain every mid blade.");
assert(farCards === 2, "The performance path must retain exactly two far cards.");
assert(batchesPerAxis === 2, "Grass chunks must retain exactly four 32 m render batches.");
assert(chunkSize % patchSize === 0, "Chunk size must be divisible by patch size.");
const patchesPerAxis = chunkSize / patchSize;
assert(patchesPerAxis % batchesPerAxis === 0, "Patch rows must divide evenly into render batches.");
const patchesPerBatch = (patchesPerAxis / batchesPerAxis) ** 2;
assert(patchesPerBatch === 64, "Each render batch must contain at most 64 source patches.");

for (const [profile, density, expectedBladesPerPatch] of [
  ["desktop", patchDesktopDensity, 1152],
  ["compact", patchCompactDensity, 768],
]) {
  const bladesPerPatch = Math.round(patchSize ** 2 * density);
  const midBladesPerPatch = Math.round(bladesPerPatch * midBladeFraction);
  const farInstancesPerBatch = patchesPerBatch * farCards;
  const midTrianglesPerBatch = midBladesPerPatch * patchesPerBatch;
  assert(bladesPerPatch === expectedBladesPerPatch, `${profile} patch blade count changed.`);
  assert(midBladesPerPatch === bladesPerPatch, `${profile} mid blades no longer retain the full patch source.`);
  assert(farInstancesPerBatch === 128, `${profile} far-card batch count changed.`);
  assert(midTrianglesPerBatch + farInstancesPerBatch * 2 <= (profile === "desktop" ? 73984 : 49408), `${profile} mid/far batch triangle ceiling exceeded.`);
}

const nearParameters = {
  tileSize,
  bladeSegments,
  baseRadius: maximumPresetNearFade + boundsMargin,
  detailRadius: ultraDistance + ultraTransition + boundsMargin,
  ultraRadius: ultraDistance + ultraTransition,
  ultraMultiplier,
  legacyBaseRadius:
    nearDistance + transitionDistance + tileSize * Math.SQRT2,
};
const desktopNear = sampleNearField(desktopDensity, nearParameters);
const compactNear = sampleNearField(compactDensity, nearParameters);
const maximumNearBaselineRatio = Math.max(
  desktopNear.average / desktopNear.legacyAverage,
  compactNear.average / compactNear.legacyAverage,
);
assert(desktopNear.maximum <= 900_000, `Desktop near-field triangle ceiling exceeded: ${desktopNear.maximum}.`);
assert(compactNear.maximum <= 600_000, `Compact near-field triangle ceiling exceeded: ${compactNear.maximum}.`);
assert(desktopNear.average / desktopNear.legacyAverage <= 0.36, "Desktop near-field optimization regressed.");
assert(compactNear.average / compactNear.legacyAverage <= 0.36, "Compact near-field optimization regressed.");

const baselineMidDistances = {
  "lush-hero": 80,
  "natural-meadow": 72,
  "golden-hour": 68,
  "cool-highland": 86,
  "dense-emerald": 92,
  windswept: 78,
};
const submissionRatios = [];
for (const [key, direction] of Object.entries(presets)) {
  for (const [profile, density, baselineDensity] of [
    ["desktop", patchDesktopDensity, 36],
    ["compact", patchCompactDensity, 26],
  ]) {
    const baselineDirection = {
      ...direction,
      midDistance: baselineMidDistances[key],
    };
    const currentSubmission = estimateSubmittedLodTriangles(
      direction,
      density,
      patchSize,
      farCards,
    );
    const baselineSubmission = estimateSubmittedLodTriangles(
      baselineDirection,
      baselineDensity,
      patchSize,
      farCards,
    );
    const ratio = currentSubmission / baselineSubmission;
    submissionRatios.push(ratio);
    assert(
      Number.isFinite(ratio) && ratio <= 1.02,
      `${direction.label} ${profile} mid/far submission ratio ${ratio.toFixed(3)} exceeds 1.02.`,
    );
  }
}

assert(nearField.includes("bladeSegments: 1"), "The non-ultra base field must use one-triangle blades.");
assert(nearField.includes("world-grass-ultra-near-base-detail") && nearField.includes("bladeSegments: grassConfig.geometry.bladeSegments"), "Ultra-near must retain configured segmented geometry.");
assert(nearField.includes("MAXIMUM_ART_NEAR_FADE_DISTANCE") && nearField.includes("reconcileEveryFrame: true"), "The base tile shell must follow every-frame camera movement and the maximum preset fade.");
assert(tileFactory.includes("calculateGrassSingleBladeRootBoundsRadius") && !tileFactory.includes("const BOUNDS_PADDING = 1.5"), "Near bounds must be configuration-derived.");
assert(nearMaterial.includes("bool grassKeepBlade") && nearMaterial.includes("transformed = vec3(0.0)"), "Rejected blades must skip rasterization and wind work.");
assert(nearMaterial.includes("mesh.count = 0") && nearMaterial.includes("grassDisabledNearPatch = true") && lodController.includes("grassDisabledNearPatch !== true"), "The redundant streamed near mesh must remain disabled and invisible.");
assert(worldGrassSystem.includes("mesh.receiveShadow = false"), "Mid/far grass must not perform per-blade shadow reads.");
const underfill = Number(lodTuning.match(/GRASS_MID_IMPOSTOR_UNDERFILL\s*=\s*([0-9.]+)/)?.[1]);
assert(underfill === 0, "Far-card underfill must remain disabled in the full mid band.");
assert(impostorMaterial.includes("if (vFarEntry < 0.999)") && impostorMaterial.includes("atlasColor = sampleFrame(selectedFrame, vUv)"), "Far views must blend during the handoff and use one fetch fully far.");

console.log(
  `[grass-performance] Tile-enumerated near triangles avg/max: ` +
    `desktop ${Math.round(desktopNear.average).toLocaleString("en-US")}/${desktopNear.maximum.toLocaleString("en-US")}, ` +
    `compact ${Math.round(compactNear.average).toLocaleString("en-US")}/${compactNear.maximum.toLocaleString("en-US")}; ` +
    `near geometry ${(maximumNearBaselineRatio * 100).toFixed(1)}% of the fully segmented baseline; ` +
    `analytical mid/far submission envelope ${(Math.min(...submissionRatios) * 100).toFixed(1)}–${(Math.max(...submissionRatios) * 100).toFixed(1)}% of the prior baseline; ` +
    "every blade and two cards retained; transition 4-fetch, fully far 1-fetch.",
);
