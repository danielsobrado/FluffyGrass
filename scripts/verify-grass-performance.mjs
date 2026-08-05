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
const trailField = read("src/grass/interaction/GrassTrailField.ts");
const interactionField = read(
  "src/grass/interaction/GrassInteractionField.ts",
);
const worldApp = read("src/app/WorldApp.ts");
const terrainStreamer = read("src/world/TerrainStreamer.ts");
const denseSpawnLocator = read("src/world/DenseSpawnLocator.ts");

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
assert(worldGrassSystem.includes("mesh.instanceMatrix = new THREE.InstancedBufferAttribute") && tileFactory.includes("mesh.instanceMatrix = new THREE.InstancedBufferAttribute"), "Instance matrices must be adopted, not copied into a second allocation.");
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
    tileField.includes("buildDeadline"),
  "Dense near-tile placement must remain incremental and deadline-bound.",
);
assert(
  nearField.includes("focusGroundHeight") &&
    nearField.includes("setEnabled(nearFieldsEnabled)"),
  "Dense near grass must suspend when a fly camera is above its 3D LOD range.",
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
    denseSpawnLocator.includes("REFINE_CANDIDATE_COUNT"),
  "Spawn selection must retain the coarse-to-fine search instead of scanning the full fine grid.",
);
assert(worldGrassSystem.includes("mesh.position.copy(origin)") && tileFactory.includes("mesh.position.copy(this.origin)"), "Grass meshes must carry a real world position so opaque depth sorting works.");
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
  tileFactory.includes("sortInstancesByDither") &&
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
    "every blade and two cards retained; far cards 1-fetch at every distance. " +
    "Near counts are the pre-truncation ceiling: tiles are sorted by dither and " +
    "the draw is cut to the surviving prefix at runtime.",
);
