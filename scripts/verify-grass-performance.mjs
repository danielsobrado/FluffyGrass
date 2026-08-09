import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
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
  farInstances,
  farSubpatches,
) {
  const farTriangleDensity =
    (farInstances * farSubpatches * 2) / patchSize ** 2;
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
const tileField = read("src/world/grass/WorldSingleBladeTileField.ts");
const terrainChunk = read("src/world/TerrainChunk.ts");
const nearMaterial = read("src/grass/materials/GrassNearMaterial.ts");
const worldGrassSystem = read("src/world/WorldGrassSystem.ts");
const lodController = read("src/grass/GrassLodController.ts");
const lodTuning = read("src/grass/GrassLodTuning.ts");
const patchGeometryFactory = read(
  "src/world/grass/WorldGrassPatchGeometryFactory.ts",
);
const impostorMaterial = read(
  "src/world/grass/WorldGrassImpostorMaterial.ts",
);
const impostorTuning = read(
  "src/world/grass/WorldGrassImpostorTuning.ts",
);
const impostorLimits = read("src/grass/GrassImpostorLimits.ts");
const trailField = read("src/grass/interaction/GrassTrailField.ts");
const interactionField = read(
  "src/grass/interaction/GrassInteractionField.ts",
);
const worldApp = read("src/app/WorldApp.ts");
const terrainStreamer = read("src/world/TerrainStreamer.ts");
const terrainField = read("src/world/TerrainField.ts");
const denseSpawnLocator = read("src/world/DenseSpawnLocator.ts");
const terrainHeightLattice = read("src/world/TerrainHeightLattice.ts");
const geometryFactory = read("src/grass/GrassGeometryFactory.ts");
const biomeProfileSource = read("src/grass/biome/GrassBiomeProfile.ts");
const biomeProfiles = JSON.parse(read("src/grass/biome/GrassBiomeProfiles.json"));
const biomeField = read("src/world/grass/WorldBiomeField.ts");
const qualityGovernor = read("src/runtime/GrassQualityGovernor.ts");
const impostorAtlasFactory = read(
  "src/world/grass/WorldGrassImpostorAtlasFactory.ts",
);
const accentSpeciesSource = read("src/grass/biome/GrassAccentSpecies.ts");
const detailFoliageField = read("src/world/grass/WorldDetailFoliageField.ts");
const detailFoliageMaterial = read(
  "src/world/grass/WorldDetailFoliageMaterial.ts",
);
const detailFoliageAtlasFactory = read(
  "src/world/grass/WorldDetailFoliageAtlasFactory.ts",
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
const compactUltraMultiplier = readYamlNumber(
  worldConfig,
  "grassUltraNearDensityMultiplierCompact",
);
const midBladeFraction = readYamlNumber(worldConfig, "grassMidBladeFraction");
const farCards = readYamlNumber(worldConfig, "grassFarImpostorsPerPatch");
const farSubpatchesPerAxis = readSourceNumber(
  impostorLimits,
  "GRASS_IMPOSTOR_SUBPATCHES_PER_AXIS",
);
const farSubpatches = farSubpatchesPerAxis ** 2;
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
// Compact density is now a reviewed ceiling rather than a fixed value: the
// mobile plan's A/B lowered it from 48 to 40 blades/m² (32 opened visible
// ground holes at third-person distance). Desktop is unchanged and stays exact.
assert(
  compactDensity === patchCompactDensity &&
    compactDensity <= 48 &&
    compactDensity >= 32,
  `Compact LOD density must stay within the reviewed 32-48 blades/m² band and match across layers: ${compactDensity}/${patchCompactDensity}.`,
);
assert(midBladeFraction === 1, "The performance path must retain every mid blade.");
assert(farCards === 1, "The far path must retain exactly one instance per source patch.");
assert(farSubpatchesPerAxis === 2 && farSubpatches === 4, "Each far instance must contain a 2x2 genuine subpatch layout.");
assert(batchesPerAxis === 2, "Grass chunks must retain exactly four 32 m render batches.");
assert(chunkSize % patchSize === 0, "Chunk size must be divisible by patch size.");
const patchesPerAxis = chunkSize / patchSize;
assert(patchesPerAxis % batchesPerAxis === 0, "Patch rows must divide evenly into render batches.");
const patchesPerBatch = (patchesPerAxis / batchesPerAxis) ** 2;
assert(patchesPerBatch === 64, "Each render batch must contain at most 64 source patches.");

for (const [profile, density, expectedBladesPerPatch] of [
  ["desktop", patchDesktopDensity, 1152],
  ["compact", patchCompactDensity, Math.round(patchSize ** 2 * patchCompactDensity)],
]) {
  const bladesPerPatch = Math.round(patchSize ** 2 * density);
  const midBladesPerPatch = Math.round(bladesPerPatch * midBladeFraction);
  const farInstancesPerBatch = patchesPerBatch * farCards;
  const farTrianglesPerBatch =
    farInstancesPerBatch * farSubpatches * 2;
  const midTrianglesPerBatch = midBladesPerPatch * patchesPerBatch;
  assert(bladesPerPatch === expectedBladesPerPatch, `${profile} patch blade count changed.`);
  assert(midBladesPerPatch === bladesPerPatch, `${profile} mid blades no longer retain the full patch source.`);
  assert(farInstancesPerBatch === 64, `${profile} far-instance batch count changed.`);
  assert(farTrianglesPerBatch === 512, `${profile} far-subpatch triangle count changed.`);
  assert(midTrianglesPerBatch + farTrianglesPerBatch <= (profile === "desktop" ? 74240 : 49664), `${profile} mid/far batch triangle ceiling exceeded.`);
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
// Compact carries its own ultra-near multiplier, so charging it the desktop
// stack would overstate the phone's near band by the difference — conservative,
// but it would also hide a real reduction from the summary below.
const compactNear = sampleNearField(compactDensity, {
  ...nearParameters,
  ultraMultiplier: compactUltraMultiplier,
});
const maximumNearBaselineRatio = Math.max(
  desktopNear.average / desktopNear.legacyAverage,
  compactNear.average / compactNear.legacyAverage,
);
assert(desktopNear.maximum <= 1_000_000, `Desktop near-field triangle ceiling exceeded: ${desktopNear.maximum}.`);
assert(compactNear.maximum <= 600_000, `Compact near-field triangle ceiling exceeded: ${compactNear.maximum}.`);
assert(desktopNear.average / desktopNear.legacyAverage <= 0.36, "Desktop near-field optimization regressed.");
assert(compactNear.average / compactNear.legacyAverage <= 0.36, "Compact near-field optimization regressed.");

const baselineMidDistances = {
  "lush-hero": 80,
  "natural-meadow": 72,
  "golden-hour": 68,
  "cool-highland": 86,
  "dense-emerald": 92,
  "zelda-field": 82,
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
      farSubpatches,
    );
    const baselineSubmission = estimateSubmittedLodTriangles(
      baselineDirection,
      baselineDensity,
      patchSize,
      farCards,
      farSubpatches,
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
assert(
  nearField.includes("resolveBaseVisibilityRadius") &&
    nearField.includes("setVisibilityRadius") &&
    nearField.includes("reconcileEveryFrame: true"),
  "The base tile shell must follow camera movement and the active preset fade.",
);
assert(tileFactory.includes("calculateGrassSingleBladeRootBoundsRadius") && !tileFactory.includes("const BOUNDS_PADDING = 1.5"), "Near bounds must be configuration-derived.");
assert(nearMaterial.includes("bool grassKeepBlade") && nearMaterial.includes("transformed = vec3(0.0)"), "Rejected blades must skip rasterization and wind work.");
assert(!worldGrassSystem.includes("world-grass-near-") && !worldGrassSystem.includes("nearGeometries") && !patchGeometryFactory.includes("near.push("), "The redundant streamed near clump mesh and its geometry must not be built at all.");
assert(!nearMaterial.includes("discard;"), "The near/mid keep test must stay in the vertex stage so the fragment shader remains early-Z friendly.");
assert(impostorMaterial.includes("if (effectiveCoverage <= 0.001)") && impostorMaterial.includes("gl_Position = vec4(2.0, 2.0, 2.0, 1.0)"), "Zero-coverage far cards must be clipped in the vertex stage.");
assert(worldGrassSystem.includes("mesh.matrixAutoUpdate = false") && tileFactory.includes("mesh.matrixAutoUpdate = false"), "Static grass meshes must not recompose their matrix every frame.");
assert(
  worldGrassSystem.includes(
    "mesh.instanceMatrix = new THREE.InstancedBufferAttribute",
  ) &&
    tileFactory.includes("const instanceMatrix = new THREE.InstancedBufferAttribute") &&
    tileFactory.includes("mesh.instanceMatrix = placement.instanceMatrix"),
  "Instance matrices must be adopted or shared, not copied into a second allocation.",
);
assert(
  tileFactory.includes(
    "new THREE.InstancedMesh(geometry, options.material.material, 0)",
  ) &&
    worldGrassSystem.includes(
      "new THREE.InstancedMesh(geometry, material, 0)",
    ),
  "Prefilled instanced meshes must not allocate and initialize a throwaway matrix buffer.",
);
assert(
  tileFactory.includes("beginBuild(") &&
    tileFactory.includes("advanceBuild(") &&
    tileField.includes("buildDeadline") &&
    terrainHeightLattice.includes("advanceBuild(deadline") &&
    tileFactory.includes('job.stage === "lattice"'),
  "Dense near-tile setup and placement must remain incremental and deadline-bound.",
);
assert(
  tileFactory.includes('job.stage === "radix-count"') &&
    tileFactory.includes('job.stage === "radix-scatter"') &&
    tileFactory.includes("advanceInPlaceReorder") &&
    tileFactory.includes("reorderCycleTarget") &&
    tileFactory.includes("processed % DEADLINE_CHECK_INTERVAL === 0") &&
    !tileFactory.includes("order.sort("),
  "Near-tile finalization must use deadline-sliced radix sorting and reordering without full-buffer copies.",
);
assert(
  patchGeometryFactory.includes("midSortedDithers") &&
    lodController.includes("setDrawRange(0, keptBlades * INDICES_PER_BLADE)"),
  "Mid geometry must stay descending-dither sorted and prefix-trimmed with drawRange.",
);

// The sub-pixel width clamp widens a blade towards a ceiling. That ceiling used
// to be a bare 0.02 m with nothing tying it to the blade: when the blades were
// widened past it, `max(source, min(target, ceiling))` collapsed to `source` and
// the clamp silently stopped doing anything — taking both the anti-sparkle
// widening and the mid layer's density-falloff coverage payback with it, in a
// way no gate could see. It must now be derived from the configured half-width.
const bladeWidthMin = readYamlNumber(grassConfig, "bladeWidthMin");
const bladeWidthMax = readYamlNumber(grassConfig, "bladeWidthMax");
const sourceHalfWidth = (bladeWidthMin + bladeWidthMax) * 0.25;
const widenRatio = readSourceNumber(nearMaterial, "MAXIMUM_BLADE_WIDEN_RATIO");
const widenCeiling = readSourceNumber(nearMaterial, "MAXIMUM_BLADE_WIDEN_METRES");
const boundsSafetyMargin = readSourceNumber(tileFactory, "BOUNDS_SAFETY_MARGIN");
assert(
  nearMaterial.includes("uGrassMaxWidenDistance.value = Math.min(") &&
    nearMaterial.includes("resolved * MAXIMUM_BLADE_WIDEN_RATIO"),
  "The sub-pixel widen ceiling must be derived from the configured blade half-width.",
);
const resolvedWidenCeiling = Math.min(
  sourceHalfWidth * widenRatio,
  widenCeiling,
);
assert(
  resolvedWidenCeiling > sourceHalfWidth,
  `The widen ceiling ${resolvedWidenCeiling.toFixed(4)} m is at or below the source ` +
    `half-width ${sourceHalfWidth.toFixed(4)} m, which disables the sub-pixel clamp entirely.`,
);
assert(
  widenCeiling - 0 < boundsSafetyMargin,
  "The absolute widen ceiling must stay inside the near-bounds safety margin.",
);
assert(
  tileField.includes("EVICTION_HYSTERESIS_TILES = 0.75") &&
    tileFactory.includes("PLACEMENT_LRU_LIMIT = 12") &&
    tileFactory.includes("placementLru"),
  "Near tiles must retain eviction hysteresis and the bounded placement LRU.",
);
assert(
  impostorAtlasFactory.includes("THREE.LinearMipmapLinearFilter") &&
    impostorAtlasFactory.includes("texture.generateMipmaps = true") &&
    impostorAtlasFactory.includes("grassSubpatchOffset") &&
    impostorAtlasFactory.includes("partitionBlades") &&
    impostorMaterial.includes("fwidth(atlasColor.a)") &&
    impostorMaterial.includes("IMPOSTOR_FAR_ALPHA_CUTOFF_SCALE") &&
    impostorMaterial.includes("cylindricalRight") &&
    impostorMaterial.includes("atlasElevation"),
  "Far atlases must use genuine subpatch cards, upright horizon billboards, and derivative-aware alpha coverage.",
);

const maxBiomes = Number(
  biomeProfileSource.match(/GRASS_MAX_BIOMES = (\d+)/)?.[1],
);
assert(
  maxBiomes === 8 &&
    nearMaterial.includes("#define GRASS_MAX_BIOMES ${GRASS_MAX_BIOMES}") &&
    impostorMaterial.includes("uBiomeBase[${GRASS_MAX_BIOMES}]"),
  "The biome loader and both shaders must share the eight-row palette ceiling.",
);
const orderedBiomes = Object.values(biomeProfiles).sort(
  (left, right) => left.index - right.index,
);
assert(
  orderedBiomes.length <= maxBiomes &&
    orderedBiomes.every((profile, index) => profile.index === index),
  "Biome indices must be dense and fit the shader palette arrays.",
);
for (const profile of orderedBiomes) {
  assert(
    profile.density > 0 &&
      profile.density <= 1 &&
      profile.heightBand[0] >= 0.7 &&
      profile.heightBand[1] <= 1.14 &&
      profile.widthBand[0] >= 0.76 &&
      profile.widthBand[1] <= 1.1 &&
      profile.windDamping >= 0.7 &&
      profile.windDamping <= 1,
    `Biome ${profile.label} exceeds density or analytical bounds ceilings.`,
  );
}
// Biome resolution costs two noise octaves plus a rank-table search, so it must
// stay in the build path. The per-frame paths are the LOD controller and the
// materials; naming them directly is a stronger and far less brittle check than
// trying to pattern-match proximity to an `update(` in the builder itself.
assert(
  biomeField.includes("sampleGrassBiome") &&
    tileFactory.includes("sampleGrassBiome(x, z)") &&
    worldGrassSystem.includes("sampleGrassBiome(x, z)") &&
    !lodController.includes("BiomeField") &&
    !lodController.includes("sampleGrassBiome") &&
    !nearMaterial.includes("sampleGrassBiome") &&
    !impostorMaterial.includes("sampleGrassBiome"),
  "Biome resolution must remain build-time-only, never on a per-frame path.",
);
// Blades rejected by terrain masks must not pay for a biome sample first.
assert(
  tileFactory.indexOf("if (suitability < MIN_SUITABILITY") <
    tileFactory.indexOf("const biomeSample = sampleGrassBiome(x, z)"),
  "Near tiles must sample the biome only for blades that survive placement.",
);
// Biome 0 carries the art direction's palette. A profile set that leaves it a
// minority makes the active preset stop describing what the world looks like.
const totalWorldShare = orderedBiomes.reduce(
  (sum, profile) => sum + profile.worldShare,
  0,
);
assert(
  orderedBiomes.every((profile) => profile.worldShare > 0) &&
    orderedBiomes[0].worldShare / totalWorldShare >= 0.4,
  "Biome 0 must hold at least 40% of the world.",
);
// The biome field must be rank-transformed before it is sliced: a raw sum of
// noise octaves is bell-shaped, and slicing that into shares gave the middle
// biome two thirds of the world regardless of what the profiles asked for.
assert(
  biomeField.includes("RANK_TABLE") && biomeField.includes("uniformField("),
  "The biome field must be remapped to a uniform variable before slicing.",
);
// ---------------------------------------------------------------------------
// Detail foliage (accent cards): ferns, flowers, seed heads.
//
// The layer's whole justification is that it is noise next to the mid band, so
// the checks below are about it staying that way: a bounded density, a bounded
// resident set, and the one place in the grass pipeline where a fragment
// `discard` is allowed to exist.
// ---------------------------------------------------------------------------
const accentTileSize = readSourceNumber(
  detailFoliageField,
  "DETAIL_FOLIAGE_TILE_SIZE",
);
const accentDensity = readSourceNumber(
  detailFoliageField,
  "DETAIL_FOLIAGE_DENSITY",
);
const accentDensityCeiling = readSourceNumber(
  detailFoliageField,
  "DETAIL_FOLIAGE_DENSITY_CEILING",
);
const accentFadeDistance = readSourceNumber(
  detailFoliageField,
  "DETAIL_FOLIAGE_FADE_DISTANCE",
);
const accentFadeTransition = readSourceNumber(
  detailFoliageField,
  "DETAIL_FOLIAGE_FADE_TRANSITION",
);
const accentResidencyMargin = readSourceNumber(
  detailFoliageField,
  "DETAIL_FOLIAGE_RESIDENCY_MARGIN",
);
const accentVisibilityRadius =
  accentFadeDistance + accentFadeTransition + accentResidencyMargin;
assert(
  accentDensity <= accentDensityCeiling && accentDensityCeiling <= 0.5,
  `Accent density ${accentDensity}/m² exceeds the ${accentDensityCeiling}/m² ceiling.`,
);
assert(
  accentFadeDistance + accentFadeTransition <= 30,
  "Accents must be gone by 30 m; past that they are sub-pixel sprinkles the mid band already provides.",
);

// Worst-case residency over every tile phase, the same enumeration the near
// field is measured with. Cards are counted before terrain masks and biome
// accentDensity reject any of them, so this is a strict ceiling.
const accentCardsPerTile = Math.round(accentTileSize ** 2 * accentDensity);
let accentResidentTiles = 0;
let accentDrawnTiles = 0;
for (let iz = 0; iz < 64; iz += 1) {
  for (let ix = 0; ix < 64; ix += 1) {
    const focusX = (ix * accentTileSize) / 64;
    const focusZ = (iz * accentTileSize) / 64;
    accentResidentTiles = Math.max(
      accentResidentTiles,
      countTiles(accentVisibilityRadius, accentTileSize, focusX, focusZ),
    );
    accentDrawnTiles = Math.max(
      accentDrawnTiles,
      countTiles(
        accentFadeDistance + accentFadeTransition,
        accentTileSize,
        focusX,
        focusZ,
      ),
    );
  }
}
const accentResidentCards = accentResidentTiles * accentCardsPerTile;
// Six vertices per card: two stacked quads sharing their middle row.
const accentVertices = accentResidentCards * 6;
assert(
  accentResidentCards <= 2500,
  `Accent resident card ceiling exceeded: ${accentResidentCards}.`,
);
assert(
  accentDrawnTiles <= 30,
  `Accent draw ceiling exceeded: ${accentDrawnTiles} tiles can draw at once.`,
);
assert(
  accentVertices <= 100_000,
  `Accent vertex ceiling exceeded: ${accentVertices}.`,
);
assert(
  detailFoliageField.includes("tile.mesh.visible = count > 0"),
  "Trimmed-to-empty accent tiles must stop submitting a draw entirely.",
);
assert(
  detailFoliageField.includes(
    "candidates.sort((left, right) => left.dither - right.dither)",
  ) &&
    detailFoliageField.includes("upperBound(") &&
    detailFoliageField.includes("DITHER_SAFETY_MARGIN"),
  "Accent tiles must stay dither-sorted so the draw can be trimmed to a prefix.",
);
// The near/mid materials owe their early-Z friendliness to rejecting in the
// vertex stage. Cutout cards genuinely cannot, so the accent material is the
// single exception — and its only discard must be the atlas alpha test, with
// the coverage rejection still done by collapsing the card off-screen.
const accentDiscards = detailFoliageMaterial.match(/discard;/g) ?? [];
assert(
  accentDiscards.length === 1 &&
    detailFoliageMaterial.includes("if (atlasColor.a < cutoff)") &&
    detailFoliageMaterial.includes("gl_Position = vec4(2.0, 2.0, 2.0, 1.0)"),
  "The accent material may discard only for the alpha cutout; coverage must be rejected in the vertex stage.",
);
assert(
  !nearMaterial.includes("discard;"),
  "The near/mid keep test must stay in the vertex stage even with accents shipped.",
);
assert(
  detailFoliageAtlasFactory.includes("THREE.LinearMipmapLinearFilter") &&
    detailFoliageAtlasFactory.includes("texture.generateMipmaps = true") &&
    detailFoliageMaterial.includes("smoothstep(uFadeDistance * 0.4, uFadeDistance"),
  "The accent atlas must keep mipmaps and compensate its alpha cutoff with distance.",
);
// Same rule as the blade layers: biome and macro resolution is build-time only.
assert(
  detailFoliageField.includes("sampleGrassBiome(x, z)") &&
    !detailFoliageMaterial.includes("sampleGrassBiome") &&
    !detailFoliageMaterial.includes("sampleGrassMacro"),
  "Accent biome and macro sampling must remain in the build path.",
);
// Species and tint rows are bounded uniform arrays indexed per instance, so
// growing the catalogue can never grow the draw count.
const maxAccentSpecies = Number(
  accentSpeciesSource.match(/GRASS_MAX_ACCENT_SPECIES = (\d+)/)?.[1],
);
const maxAccentTints = Number(
  accentSpeciesSource.match(/GRASS_MAX_ACCENT_TINTS = (\d+)/)?.[1],
);
const declaredSpecies = [
  ...accentSpeciesSource.matchAll(/key: "([a-z-]+)",\s+category:/g),
].map((match) => match[1]);
const declaredTints = [
  ...accentSpeciesSource.matchAll(/\{ key: "([a-z-]+)", color:/g),
].map((match) => match[1]);
assert(
  maxAccentSpecies === 8 &&
    maxAccentTints === 8 &&
    declaredSpecies.length === maxAccentSpecies &&
    declaredTints.length === maxAccentTints &&
    detailFoliageMaterial.includes(
      "uSpeciesWind[${GRASS_MAX_ACCENT_SPECIES}]",
    ) &&
    detailFoliageMaterial.includes("uAccentTint[${GRASS_MAX_ACCENT_TINTS}]"),
  "The accent catalogue and its shader uniform arrays must share one bounded size.",
);
for (const profile of orderedBiomes) {
  assert(
    profile.accentDensity === undefined ||
      (profile.accentDensity >= 0 && profile.accentDensity <= 1),
    `Biome ${profile.label} accentDensity must stay within [0, 1].`,
  );
  for (const entry of profile.accentSpecies ?? []) {
    assert(
      declaredSpecies.includes(entry.species) &&
        (entry.tint === "none" || declaredTints.includes(entry.tint)),
      `Biome ${profile.label} names an unknown accent species or tint.`,
    );
  }
}
// One material for every species, tint, and biome: the accent layer must never
// become a per-look material or a per-look draw.
assert(
  (detailFoliageField.match(/new THREE\.InstancedMesh\(/g) ?? []).length === 1 &&
    detailFoliageField.includes("this.material.material") &&
    (detailFoliageMaterial.match(/new THREE\.ShaderMaterial\(/g) ?? [])
      .length === 1,
  "Every accent tile must share the one accent material.",
);
const accentTierScales = [
  ...qualityGovernor.matchAll(/accentDensityScale:\s*([0-9.]+)/g),
].map((match) => Number(match[1]));
assert(
  accentTierScales.length === 4 &&
    accentTierScales.every(
      (scale, index) =>
        scale <= 1 && (index === 0 || scale <= accentTierScales[index - 1]),
    ) &&
    accentTierScales[accentTierScales.length - 1] === 0 &&
    qualityGovernor.includes("this.accentDensityScale,"),
  "Accent tiers must only lower coverage, end at zero, and ramp like every other tier scalar.",
);

// ---------------------------------------------------------------------------
// Mobile naturalness plan (G1-G6): the invariants none of the numeric checks
// above can see. Every one of these is a property that would regress silently.
// ---------------------------------------------------------------------------
// The compact profile owns its own ultra-near multiplier so that lowering phone
// density can never quietly thin the desktop near band with it.
assert(
  compactUltraMultiplier <= ultraMultiplier &&
    nearField.includes("grassUltraNearDensityMultiplierCompact"),
  "Compact must carry its own ultra-near multiplier, never above the desktop one.",
);
assert(
  compactDensity <= 48 && patchCompactDensity <= 48,
  `Compact density may only be lowered from the reviewed 48 blades/m²: ${compactDensity}.`,
);
assert(
  worldGrassSystem.indexOf("this.processBuildQueue(streamBuildDeadline)") <
    worldGrassSystem.indexOf("this.nearField.update(") &&
    worldGrassSystem.includes("DESKTOP_STREAM_BUILD_RESERVE_MS") &&
    worldApp.includes("performance.now() + grassBuildReserveMs"),
  "Mid/far grass streaming must receive bounded progress before near-field detail work.",
);
assert(
  nearField.includes("this.baseField?.update(focus, baseDeadline)") &&
    nearField.includes("this.buildCursor + offset") &&
    nearField.includes("remainingMs / remainingBuilders") &&
    nearField.includes("this.buildCursor = (this.buildCursor + 1)"),
  "Near grass builders must rotate and share their deadline instead of starving later layers.",
);
// Placement shape is configuration, validated at load, and versioned into the
// cache key — a cached tile built against the previous tuft rule must not
// survive in the LRU and draw beside freshly built neighbours.
const configLoader = read("src/world/WorldConfigLoader.ts");
assert(
  configLoader.includes("grassClumpRadiusScaleMin") &&
    configLoader.includes("grassClumpAspectMin") &&
    configLoader.includes("grassClumpRadialExponent") &&
    configLoader.includes("grassClumpRadiusScale range is reversed") &&
    configLoader.includes("of a blade's heading to independent randomness"),
  "Clump tuning must be schema-checked and cross-validated by the config loader.",
);
assert(
  tileFactory.includes("const GRASS_PLACEMENT_VERSION") &&
    tileFactory.includes("placement-${GRASS_PLACEMENT_VERSION}"),
  "The near placement cache key must carry the placement version.",
);
// Motion phase must decorrelate flutter and stiffness without touching either
// dither: the mid layer's CPU draw truncation reproduces grassDither exactly
// and depends on it carrying no per-instance term.
assert(
  nearMaterial.includes(
    "float grassMotionPhase = fract(grassPhase + instanceVariation.x);",
  ) &&
    nearMaterial.includes("grassMotionPhase * 6.28318530718") &&
    nearMaterial.includes("fract(grassMotionPhase * 1.61803398875)") &&
    nearMaterial.includes("grassPhase * 0.569840296") &&
    nearMaterial.includes("grassPhase * 0.819173") &&
    !nearMaterial.includes("grassMotionPhase * 0.569840296") &&
    !nearMaterial.includes("grassMotionPhase * 0.819173"),
  "Motion phase must drive flutter and stiffness only; both dithers must keep the source phase.",
);
// The near source blade leans through the instance transform, so plane azimuth
// and lean direction stay independent without a new attribute.
//
// This used to assert the source blade was flat, by pinning the single-triangle
// vertex push verbatim. That conflated two different things: *lean must not be
// baked* (the real invariant, since baking it re-couples azimuth to lean) with
// *the blade must have no shape*, which nothing required and which forced every
// blade to be a rigid plank. The blade now carries a rest arc along its own
// depth axis; it rotates with the blade's plane, so it re-couples nothing. What
// is checked instead is that the arc is the shared configuration-driven one and
// that the bounds charge its reach.
assert(
  !tileFactory.includes("const centerZ = lean * curve") &&
    tileFactory.includes("resolveGrassBladeArcPoint(height, curve, 1)") &&
    tileFactory.includes("bladeCurveReach: calculateGrassBladeCurveReach(") &&
    tileFactory.includes(
      "this.leanAxis.set(Math.cos(leanAngle), 0, -Math.sin(leanAngle))",
    ) &&
    tileFactory.includes("this.align.multiply(this.lean).multiply(this.yaw)") &&
    tileFactory.includes("INSTANCE_HORIZONTAL_SCALE_MAX) /"),
  "Near blades must lean by transform, scaled to the horizontal displacement the bounds charge.",
);
// The placement loop runs per blade over thousands of candidates per tile; the
// heading blend has to stay scalar rather than allocating vectors in it.
const samplingLoop = tileFactory.slice(
  tileFactory.indexOf("private advanceSampling("),
  tileFactory.indexOf("private advanceFinalize("),
);
assert(
  !/new THREE\.(Vector2|Vector3|Quaternion|Matrix4)\(/.test(samplingLoop) &&
    !/\bnew Array\(/.test(samplingLoop),
  "The near placement loop must not allocate per blade.",
);
// Compact wind: one shared expression for every layer, so a blade and the card
// that replaces it at distance cannot bend different ways.
const windNoise = read("src/grass/wind/WindNoiseTexture.ts");
assert(
  windNoise.includes("export function grassCompactGustGlsl") &&
    windNoise.includes("GRASS_GUST_CROSS_SCALE") &&
    nearMaterial.includes("grassCompactGustGlsl({") &&
    impostorMaterial.includes("grassCompactGustGlsl({") &&
    detailFoliageMaterial.includes("grassCompactGustGlsl({"),
  "Every layer's compact gust must come from the one shared expression.",
);
// The two waves' weights sum to one, so the envelope stays inside [0, 1] and
// the reserved wind displacement is unchanged.
const primaryWeight = readSourceNumber(windNoise, "GRASS_GUST_PRIMARY_WEIGHT");
const crossWeight = readSourceNumber(windNoise, "GRASS_GUST_CROSS_WEIGHT");
assert(
  Math.abs(primaryWeight + crossWeight - 1) < 1e-9,
  `Compact gust weights must sum to one: ${primaryWeight} + ${crossWeight}.`,
);
// Diagnostics stay honest: the HUD must name what each number measures rather
// than presenting a logical density estimate as render work.
const diagnosticsHud = read("src/runtime/WorldDiagnosticsHud.ts");
const workloadProbe = read("src/runtime/GrassWorkloadProbe.ts");
assert(
  diagnosticsHud.includes("Grass logical") &&
    diagnosticsHud.includes("Near resident") &&
    diagnosticsHud.includes("Mid submit") &&
    workloadProbe.includes("logicalBladeEquivalents") &&
    workloadProbe.includes("nearSubmittedTriangles") &&
    workloadProbe.includes("midSubmittedBlades"),
  "The workload HUD must report resident and submitted work as separate, named counters.",
);

const tierScales = [
  ...qualityGovernor.matchAll(/densityScale:\s*([0-9.]+)/g),
].map((match) => Number(match[1]));
assert(
  tierScales.length === 4 &&
    tierScales.every((scale, index) =>
      scale <= 1 && (index === 0 || scale <= tierScales[index - 1])
    ),
  "Quality tiers must only lower density from the preset budget.",
);
assert(
  tileFactory.includes("emptyPlacementCache") &&
    tileFactory.includes("empty: true") &&
    tileField.includes("emptyTiles") &&
    tileField.includes("result.empty"),
  "Completed-empty near tiles must be remembered instead of rebuilt while moving.",
);
assert(
  nearField.includes("cachedPlacementOnly: true") &&
    tileFactory.includes("placementCache") &&
    tileFactory.includes("variation: placement.variationAttribute") &&
    tileFactory.includes("mesh.instanceMatrix = placement.instanceMatrix") &&
    geometryFactory.includes("preserveSharedInstanceData"),
  "Complementary base/detail layers must reuse identical placement buffers.",
);
assert(
  tileField.includes("DISABLED_TILE_EVICTION_MS") &&
    tileField.includes("this.evictTiles()"),
  "Suspended near fields must eventually release their resident tile resources.",
);
assert(
  nearField.includes("focusGroundHeight") &&
    nearField.includes("setEnabled(nearFieldsEnabled)"),
  "Dense near grass must suspend when a fly camera is above its 3D LOD range.",
);
assert(
  worldGrassSystem.includes("sheen: false") &&
    nearMaterial.includes("if (vGrassSheen.x > 0.001)") &&
    nearMaterial.includes('sheen ? FRAGMENT_SHEEN_OUTPUT : ""'),
  "Mid grass must compile sheen out and near grass must skip its lobe after fade-out.",
);
assert(
  nearMaterial.includes("vNormal = normalize(grassRotateAroundAxis(") &&
    nearMaterial.includes("grassWindAxisView") &&
    nearMaterial.includes("grassTrailAxisView"),
  "Wind and trail deformation must rotate the lighting normal with the blade.",
);
assert(
  terrainField.includes("samplePathVisibility(height") &&
    terrainChunk.includes("new THREE.BufferAttribute(this.paths, 3)") &&
    terrainStreamer.includes("terrainPathVisibility") &&
    terrainStreamer.includes("abs(vTerrainPath.xy)"),
  "Terrain path altitude visibility must be interpolated separately from signed distances.",
);
assert(
  terrainStreamer.includes("buildDeadline - performance.now()") &&
    worldGrassSystem.includes("buildDeadline - performance.now()"),
  "Terrain and grass streaming must share the frame build deadline.",
);
assert(
  worldApp.includes("profile.shadows && !this.flyMode") &&
    worldApp.includes("if (!useFlyControls)"),
  "Fly mode must not allocate character-only trail targets or render an empty shadow map.",
);
assert(
  denseSpawnLocator.includes("COARSE_STEP_MULTIPLIER") &&
    denseSpawnLocator.includes("REFINE_CANDIDATE_COUNT") &&
    denseSpawnLocator.includes("sampledSuitability"),
  "Spawn selection must retain cached coarse-to-fine sampling instead of repeating overlapping evaluations.",
);
assert(
  worldGrassSystem.includes("mesh.position.copy(origin)") &&
    tileFactory.includes("mesh.position.copy(placement.origin)"),
  "Grass meshes must carry a real world position so opaque depth sorting works.",
);
assert(worldGrassSystem.includes("mesh.receiveShadow = false"), "Mid/far grass must not perform per-blade shadow reads.");
const underfill = Number(lodTuning.match(/GRASS_MID_IMPOSTOR_UNDERFILL\s*=\s*([0-9.]+)/)?.[1]);
assert(underfill === 0, "Far-card underfill must remain disabled in the full mid band.");
assert(!impostorMaterial.includes("vec4 color00 = sampleFrame") && impostorMaterial.includes("atlasColor = sampleFrame(selectedFrame, vUv)"), "Far views must reconstruct the blend stochastically with one atlas fetch, at every distance.");

// Per-mesh values cannot be uniforms. three uploads a material's custom uniforms
// only on the first draw of each contiguous same-material run (`refreshMaterial`
// in WebGLRenderer), and its opaque sort groups by material.id before depth, so
// every mesh sharing a material silently inherited the first one's values.
assert(
  !/\.onBeforeRender\s*=/.test(nearMaterial) &&
    !/\.onBeforeRender\s*=/.test(impostorMaterial),
  "Grass materials must not write per-mesh uniforms from onBeforeRender: three never uploads them.",
);
assert(
  nearField.includes("baseDetailMaterial") &&
    /detailMode:\s*1/.test(nearField) &&
    /detailMode:\s*2/.test(nearField),
  "The base and detail near layers must own separate materials so their detail modes both take effect.",
);
assert(
  worldGrassSystem.includes("applyStreamCoverage") &&
    !worldGrassSystem.includes("userData.grassStreamCoverage"),
  "Streaming fade-in must ride on the per-instance coverage attribute.",
);
assert(
  trailField.includes("const UPDATE_INTERVAL_SECONDS = 1 / 30") &&
    trailField.includes("accumulatedDeltaSeconds"),
  "The trail feedback pass must remain capped at 30 Hz with accumulated decay time.",
);
assert(
  trailField.indexOf("float distanceSquared = dot(offset, offset)") <
    trailField.indexOf("float distanceToContact = sqrt(distanceSquared)"),
  "Trail contacts must reject out-of-radius texels before square-root and falloff work.",
);
assert(
  trailField.includes("private readonly contacts = new Float32Array") &&
    !interactionField.includes("submitContact({"),
  "Frame-loop trail contacts must use fixed storage instead of transient objects.",
);
assert(
  nearMaterial.includes("vertexPalette") &&
    nearMaterial.includes("varying vec3 vGrassColor"),
  "Single-triangle grass layers must resolve the palette per vertex.",
);
assert(
  terrainChunk.includes("renderOrder = TERRAIN_RENDER_ORDER") &&
    /TERRAIN_RENDER_ORDER = ([1-9])/.test(terrainChunk),
  "Terrain must draw after grass so covered terrain fragments are depth-rejected.",
);

// Instance rows are sorted by the shader's dither key so the survivors of the
// LOD cull are a prefix, letting the draw be truncated with mesh.count. This
// must never drop a blade the shader would have kept, so the check below
// reproduces both sides in float32 and compares them directly.
assert(
  tileFactory.includes('job.stage === "radix-count"') &&
    tileFactory.includes("SINGLE_BLADE_DITHER_BIAS = 0.662358981"),
  "Single-blade tiles must sort their instances by the shader's dither key.",
);
const ditherMargin = Number(
  tileField.match(/DITHER_SAFETY_MARGIN = 1 \/ (\d+)/)?.[1],
);
assert(
  Number.isFinite(ditherMargin) && 1 / ditherMargin >= 1e-4,
  "The dither truncation margin must stay above float32 rounding error.",
);
verifyDitherTruncationIsLossless(1 / ditherMargin);

/**
 * The shader keeps a blade when `dither <= coverage`, evaluated per blade from
 * its own 3D camera distance. The CPU truncates the draw using coverage at the
 * tile's nearest point and a horizontal distance, both of which can only
 * overstate coverage. Confirm no blade survives the shader beyond the cut.
 */
function verifyDitherTruncationIsLossless(margin) {
  const bias = 0.662358981;
  const seed = 0x6a09e667 / 4294967296;
  const bladeCount = 4608;
  const near = nearDistance;
  const transition = transitionDistance;

  const dithers = new Float32Array(bladeCount);
  let state = 123456789;
  for (let index = 0; index < bladeCount; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const value = bias + state / 4294967296 + seed;
    dithers[index] = value - Math.floor(value);
  }
  dithers.sort();

  const fadeStart = near - transition;
  const fadeEnd = near + transition;
  for (let step = 0; step <= 400; step += 1) {
    // Nearest horizontal distance to the tile, and the farthest a blade inside
    // it can actually be from the camera: one tile diagonal plus 24 m of relief.
    const nearest = (step / 400) * (fadeEnd + 4);
    const farthest = Math.hypot(nearest + tileSize * Math.SQRT2, 24);
    const cutCoverage = coverageAt(nearest, fadeStart, fadeEnd) + margin;
    const count =
      nearest <= fadeStart
        ? bladeCount
        : nearest >= fadeEnd
          ? upperBoundIndex(dithers, cutCoverage)
          : upperBoundIndex(dithers, cutCoverage);
    for (let index = 0; index < bladeCount; index += 1) {
      // Best case for the shader: the blade sits at the tile's nearest point.
      const shaderCoverage = coverageAt(nearest, fadeStart, fadeEnd);
      const kept = dithers[index] <= shaderCoverage;
      assert(
        !kept || index < count,
        `Dither truncation dropped a kept blade at ${nearest.toFixed(2)} m (index ${index} of ${count}).`,
      );
    }
    void farthest;
  }
}

function coverageAt(distance, edge0, edge1) {
  const t = Math.min(1, Math.max(0, (distance - edge0) / (edge1 - edge0)));
  return 1 - t * t * (3 - 2 * t);
}

function upperBoundIndex(values, value) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (values[middle] <= value) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
}

console.log(
  `[grass-performance] Tile-enumerated near triangles avg/max: ` +
    `desktop ${Math.round(desktopNear.average).toLocaleString("en-US")}/${desktopNear.maximum.toLocaleString("en-US")}, ` +
    `compact ${Math.round(compactNear.average).toLocaleString("en-US")}/${compactNear.maximum.toLocaleString("en-US")}; ` +
    `near geometry ${(maximumNearBaselineRatio * 100).toFixed(1)}% of the fully segmented baseline; ` +
    `analytical mid/far submission envelope ${(Math.min(...submissionRatios) * 100).toFixed(1)}–${(Math.max(...submissionRatios) * 100).toFixed(1)}% of the prior baseline; ` +
    `accents ≤ ${accentResidentCards.toLocaleString("en-US")} cards / ` +
    `${accentDrawnTiles} draws / ${accentVertices.toLocaleString("en-US")} vertices, gone by ` +
    `${accentFadeDistance + accentFadeTransition} m; ` +
    "every blade and four baked subpatch cards retained in one far instance; " +
    "far views remain one-fetch with derivative-aware alpha coverage. " +
    "Near counts are the pre-truncation ceiling: tiles are sorted by dither and " +
    "the draw is cut to the surviving prefix at runtime.",
);
