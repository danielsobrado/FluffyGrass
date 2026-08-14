import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
// Raised for the actor-proof frame subscription. What landed here is a small
// orchestration hook the development-only extensibility proof attaches to; the
// proof itself lives outside the production bundle in src/dev.
const WORLD_APP_MAX_LINES = 560;
const TERRAIN_STREAMER_MAX_LINES = 300;
const HYDROLOGY_FIELD_MAX_LINES = 340;
const HYDROLOGY_CONFIG_VALIDATOR_MAX_LINES = 120;
const WATER_CHUNK_GEOMETRY_MAX_LINES = 180;
const WATER_INTERACTION_MAX_LINES = 120;
const WATER_FLOW_NOISE_MAX_LINES = 220;
const WATER_FLOW_SHADER_MAX_LINES = 100;
const WATER_BED_SHADER_MAX_LINES = 100;
const WATER_BED_TEXTURE_MAX_LINES = 220;
const WATER_MATERIAL_MAX_LINES = 180;
// Raised for the riverbed composite. The bed's map generation and GLSL live in
// WaterBedTexture/WaterBedShader under their own limits, so what landed here is
// only the surface blend this file exists to own.
const WATER_SHADER_MAX_LINES = 275;
const STONE_GEOMETRY_MAX_LINES = 340;
// Raised for the streamed-ring coverage mask. Chunk residency lives in
// WorldHorizonCoverage; the extra lines here are only the shell wiring it in.
const HORIZON_SHELL_MAX_LINES = 380;
const HORIZON_GRID_MAX_LINES = 120;
const HORIZON_MATERIAL_MAX_LINES = 120;
const HORIZON_COVERAGE_MAX_LINES = 120;
const EXTRACTED_MODULE_MAX_LINES = 260;
const CONFIG_LOADER_MAX_LINES = 220;
const CONFIG_READER_MAX_LINES = 120;

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
}

function lineCount(source) {
  return source.split(/\r?\n/).length;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[architecture] ${message}`);
  }
}

const worldApp = read("src/app/WorldApp.ts");
const worldAppTuning = read("src/app/WorldAppTuning.ts");
const environment = read("src/app/WorldEnvironmentController.ts");
const frameMetrics = read("src/app/WorldFrameMetrics.ts");
const runtimeGuard = read("src/app/WorldRuntimeGuard.ts");
const statusHud = read("src/app/WorldStatusHud.ts");
const terrainChunk = read("src/world/TerrainChunk.ts");
const terrainField = read("src/world/TerrainField.ts");
const terrainStreamer = read("src/world/TerrainStreamer.ts");
const terrainMaterial = read("src/world/TerrainMaterialController.ts");
const terrainShader = read("src/world/TerrainMaterialShader.ts");
const hydrologyField = read("src/world/hydrology/HydrologyField.ts");
const hydrologyConfigValidator = read(
  "src/world/hydrology/HydrologyConfigValidator.ts",
);
const waterChunkGeometry = read("src/world/hydrology/WaterChunkGeometry.ts");
const waterInteraction = read("src/world/hydrology/WaterInteractionField.ts");
const waterFlowNoise = read("src/world/hydrology/WaterFlowNoiseTexture.ts");
const waterFlowShader = read("src/world/hydrology/WaterFlowShader.ts");
const waterBedShader = read("src/world/hydrology/WaterBedShader.ts");
const waterBedTexture = read("src/world/hydrology/WaterBedTexture.ts");
const waterMaterial = read("src/world/hydrology/WaterMaterialController.ts");
const waterShader = read("src/world/hydrology/WaterShader.ts");
const horizonShell = read("src/world/horizon/WorldHorizonShell.ts");
const horizonGrid = read("src/world/horizon/WorldHorizonGrid.ts");
const horizonMaterial = read("src/world/horizon/WorldHorizonMaterial.ts");
const horizonCoverage = read("src/world/horizon/WorldHorizonCoverage.ts");
const stoneSystem = read("src/world/stones/WorldStoneSystem.ts");
const stoneClearance = read("src/world/stones/StoneClearance.ts");
const stoneGeometry = read("src/world/stones/StoneGeometry.ts");
const stoneIndentation = read("src/world/stones/StoneIndentation.ts");
const stoneTopology = read("src/world/stones/StoneMeshTopology.ts");
const configReader = read("src/config/FlatConfigValueReader.ts");
const worldConfigLoader = read("src/world/WorldConfigLoader.ts");
const worldConfigSchema = read("src/world/WorldConfigSchema.ts");
const worldConfigValidator = read("src/world/WorldConfigValidator.ts");
const grassConfigLoader = read("src/grass/internal/GrassConfigLoader.ts");
const grassConfigValidator = read("src/grass/internal/GrassConfigValidator.ts");
const runtimeConfigLoader = read("src/runtime/RuntimeConfigLoader.ts");

assert(
  lineCount(worldApp) <= WORLD_APP_MAX_LINES,
  `WorldApp grew beyond ${WORLD_APP_MAX_LINES} lines; extract a responsibility instead of extending the composition root.`,
);
assert(
  worldApp.includes('from "./WorldEnvironmentController"') &&
    worldApp.includes('from "./WorldFrameMetrics"') &&
    worldApp.includes('from "./WorldRuntimeGuard"') &&
    worldApp.includes('from "./WorldStatusHud"'),
  "WorldApp must delegate environment, metrics, runtime guard, and HUD responsibilities.",
);
assert(
  !worldApp.includes("new THREE.HemisphereLight") &&
    !worldApp.includes("new THREE.DirectionalLight") &&
    !worldApp.includes('window.addEventListener("error"') &&
    !worldApp.includes(".textContent = ["),
  "WorldApp must remain an orchestrator rather than absorbing environment, browser-fault, or presentation logic.",
);
assert(
  worldApp.includes('runFrameSubsystem("stones"') &&
    worldApp.includes('subsystem === "stones"') &&
    worldApp.includes(
      "this.stonesEnabled = false;\n        this.stones.dispose();",
    ) &&
    !worldApp.includes("setStoneClearanceField"),
  "Stone streaming must have an independent failure domain and atomically release rendering plus clearance when it degrades.",
);
assert(
  worldAppTuning.includes("WORLD_DESKTOP_GRASS_BUILD_RESERVE_MS = 2.5") &&
    worldAppTuning.includes("WORLD_COMPACT_GRASS_BUILD_RESERVE_MS = 1.5") &&
    worldApp.includes(
      "this.streamingBuildDeadline - grassBuildReserveMs - stoneBuildReserveMs",
    ) &&
    worldApp.includes("this.streamingBuildDeadline - grassBuildReserveMs") &&
    worldApp.includes("cameraGroundHeight,\n      this.streamingBuildDeadline") &&
    !worldApp.includes("performance.now() + stoneBuildReserveMs") &&
    !worldApp.includes("performance.now() + grassBuildReserveMs"),
  "Terrain, stones, and grass must share one hard streaming deadline without creating budget after it expires.",
);
assert(
  worldApp.includes(
    "this.grassEnabled = false;\n      this.grass.dispose();",
  ),
  "Failed asynchronous grass initialization must immediately release partial GPU resources.",
);

for (const [name, source] of [
  ["WorldEnvironmentController", environment],
  ["WorldFrameMetrics", frameMetrics],
  ["WorldRuntimeGuard", runtimeGuard],
  ["WorldStatusHud", statusHud],
]) {
  assert(
    lineCount(source) <= EXTRACTED_MODULE_MAX_LINES,
    `${name} grew beyond ${EXTRACTED_MODULE_MAX_LINES} lines; split its responsibility before adding more behavior.`,
  );
}
assert(
  environment.includes("applyArtDirection") && environment.includes("updateShadow"),
  "World environment must own art-direction pairing and shadow tracking.",
);
assert(
  runtimeGuard.includes('window.addEventListener("error"') &&
    runtimeGuard.includes('window.removeEventListener("error"') &&
    runtimeGuard.includes("webglcontextlost") &&
    runtimeGuard.includes("webglcontextrestored"),
  "Runtime guard must own browser and WebGL fault lifecycle.",
);
assert(
  frameMetrics.includes(' | "stones"') &&
    frameMetrics.includes("stones: 0") &&
    frameMetrics.includes("beginFrame") &&
    frameMetrics.includes("measure("),
  "Frame metrics must independently own stone, terrain, grass, and render timing.",
);
assert(
  statusHud.includes("this.element.textContent") &&
    statusHud.includes("snapshot.stones") &&
    !statusHud.includes("WorldGrassSystem") &&
    !statusHud.includes("TerrainStreamer"),
  "Status HUD must remain a presenter over snapshots and expose stone diagnostics.",
);
assert(
  statusHud.includes("shouldUpdate(deltaSeconds") &&
    worldApp.indexOf("statusHud.shouldUpdate") <
      worldApp.indexOf("this.terrain.getDiagnostics()"),
  "HUD throttling must run before diagnostic snapshots are collected on the render path.",
);

assert(
  lineCount(terrainStreamer) <= TERRAIN_STREAMER_MAX_LINES &&
    terrainStreamer.includes("TerrainMaterialController") &&
    terrainStreamer.includes("WaterMaterialController") &&
    terrainStreamer.includes("WaterInteractionField") &&
    terrainStreamer.includes("private disposed = false") &&
    terrainStreamer.includes("chunk.getTriangleCount()") &&
    !terrainStreamer.includes("onBeforeCompile") &&
    !terrainStreamer.includes("TERRAIN_DETAIL_COLOR") &&
    !terrainStreamer.includes("MeshPhongMaterial") &&
    !terrainStreamer.includes("MeshPhysicalMaterial"),
  "TerrainStreamer must own residency/build scheduling and diagnostics, not shader or material construction.",
);
assert(
  terrainChunk.includes("WaterChunkGeometryBuilder") &&
    terrainChunk.includes("waterGeometryBuilder.writeVertex") &&
    terrainChunk.includes("waterGeometryBuilder.createGeometry") &&
    terrainChunk.includes("getTriangleCount()") &&
    !terrainChunk.includes("createWaterIndices") &&
    !terrainChunk.includes("WATER_VISIBLE_COVERAGE_THRESHOLD"),
  "Terrain chunks must delegate water packing/topology and expose their complete triangle cost.",
);
assert(
  lineCount(waterChunkGeometry) <= WATER_CHUNK_GEOMETRY_MAX_LINES &&
    waterChunkGeometry.includes("createIndices") &&
    waterChunkGeometry.includes("WATER_VISIBLE_COVERAGE_THRESHOLD") &&
    waterChunkGeometry.includes('"waterData"') &&
    waterChunkGeometry.includes('"waterInteraction"'),
  "Water chunk geometry must own packed attributes and sparse wet-cell topology.",
);
assert(
  lineCount(terrainMaterial) <= EXTRACTED_MODULE_MAX_LINES &&
    terrainMaterial.includes("onBeforeCompile") &&
    terrainMaterial.includes("setGrassArtDirection") &&
    terrainMaterial.includes("surfaceNoiseTexture.dispose()") &&
    terrainShader.includes("TERRAIN_DETAIL_COLOR"),
  "Terrain material and shader modules must own terrain rendering concerns outside the streamer.",
);
assert(
  lineCount(hydrologyField) <= HYDROLOGY_FIELD_MAX_LINES &&
    terrainField.includes('from "./hydrology/HydrologyField"') &&
    terrainField.includes("this.hydrology.carveHeight") &&
    hydrologyField.includes("sourceHeightCache") &&
    !hydrologyField.includes('from "../TerrainField"') &&
    !hydrologyField.includes("THREE."),
  "Hydrology must stay deterministic, preserve source-height semantics, and remain independent from terrain rendering.",
);
assert(
  lineCount(hydrologyConfigValidator) <=
      HYDROLOGY_CONFIG_VALIDATOR_MAX_LINES &&
    hydrologyConfigValidator.includes("validateHydrologyConfig") &&
    hydrologyConfigValidator.includes("resolveHydrologyLakeCellMargin") &&
    hydrologyConfigValidator.includes("resolveHydrologyRiverMinimumVisibleHalfWidth") &&
    worldConfigValidator.includes('from "./hydrology/HydrologyConfigValidator"') &&
    worldConfigValidator.includes("validateHydrologyConfig(config)") &&
    !worldConfigValidator.includes("resolveHydrologyLakeCellMargin"),
  "Hydrology cross-field invariants must remain isolated from the world validator.",
);
assert(
  lineCount(waterInteraction) <= WATER_INTERACTION_MAX_LINES &&
    waterInteraction.includes("WAKE_SAMPLE_COUNT") &&
    waterInteraction.includes("sampleStoneGrassClearance") &&
    waterInteraction.includes("waterStoneWakeLength") &&
    !waterInteraction.includes("THREE."),
  "Water/stone interaction must stay a small deterministic field outside rendering modules.",
);
assert(
  lineCount(waterFlowNoise) <= WATER_FLOW_NOISE_MAX_LINES &&
    waterFlowNoise.includes("periodicWorleyRidge") &&
    waterFlowNoise.includes("createWaterFlowNoiseTexture") &&
    waterFlowNoise.includes("THREE.DataTexture"),
  "Water flow noise generation must remain deterministic, bounded, and isolated from material lifecycle.",
);
assert(
  lineCount(waterFlowShader) <= WATER_FLOW_SHADER_MAX_LINES &&
    waterFlowShader.includes("waterSampleAdvectedNoise") &&
    waterFlowShader.includes("waterResolveStoneEdge") &&
    !waterFlowShader.includes("MeshPhysicalMaterial"),
  "Flow-noise GLSL helpers must stay separate from the physical material controller.",
);
assert(
  lineCount(waterBedTexture) <= WATER_BED_TEXTURE_MAX_LINES &&
    waterBedTexture.includes("periodicWorleyPebble") &&
    waterBedTexture.includes("createWaterBedTexture") &&
    waterBedTexture.includes("waterPeriodicValueNoise") &&
    !waterBedTexture.includes("MeshPhysicalMaterial"),
  "Riverbed map generation must reuse the shared periodic noise and stay outside material lifecycle.",
);
assert(
  lineCount(waterBedShader) <= WATER_BED_SHADER_MAX_LINES &&
    waterBedShader.includes("waterSampleRiverBed") &&
    waterBedShader.includes("waterResolveBedPosition") &&
    !waterBedShader.includes("THREE.") &&
    waterShader.includes('from "./WaterBedShader"') &&
    waterShader.includes("waterResolveBedPosition(waterSlope, waterDepth)"),
  "Riverbed GLSL must stay a separate helper that the surface shader only composites.",
);
assert(
  lineCount(waterMaterial) <= WATER_MATERIAL_MAX_LINES &&
    lineCount(waterShader) <= WATER_SHADER_MAX_LINES &&
    waterMaterial.includes("class WaterMaterialController") &&
    waterMaterial.includes("MeshPhysicalMaterial") &&
    waterMaterial.includes("THREE.DoubleSide") &&
    waterMaterial.includes("createWaterFlowNoiseTexture") &&
    waterMaterial.includes("flowNoiseTexture.dispose()") &&
    waterMaterial.includes("createWaterBedTexture") &&
    waterMaterial.includes("bedTexture.dispose()") &&
    waterMaterial.includes('from "./WaterShader"') &&
    waterMaterial.includes("onBeforeCompile") &&
    waterMaterial.includes("depthWrite: false") &&
    waterShader.includes('from "./WaterFlowShader"') &&
    waterShader.includes("WATER_SURFACE_FRAGMENT") &&
    waterShader.includes("waterSampleAdvectedNoise") &&
    waterShader.includes("waterStoneFoam") &&
    waterShader.includes("waterLightingNormal") &&
    waterShader.includes("gl_FrontFacing") &&
    !waterMaterial.includes("waterRiverPhaseA"),
  "Physical water lifecycle, flow helpers, and GLSL implementation must stay split and disposal-safe.",
);

assert(
  lineCount(horizonShell) <= HORIZON_SHELL_MAX_LINES &&
    lineCount(horizonGrid) <= HORIZON_GRID_MAX_LINES &&
    lineCount(horizonMaterial) <= HORIZON_MATERIAL_MAX_LINES &&
    lineCount(horizonCoverage) <= HORIZON_COVERAGE_MAX_LINES &&
    horizonShell.includes("private disposed = false") &&
    horizonShell.includes("createWorldHorizonAxis") &&
    horizonShell.includes("WorldHorizonMaterial") &&
    horizonShell.includes("WorldHorizonCoverage") &&
    !horizonShell.includes("onBeforeCompile") &&
    !horizonShell.includes("MeshLambertMaterial") &&
    !horizonShell.includes("new THREE.DataTexture") &&
    !horizonGrid.includes("THREE."),
  "The horizon shell must own its build alone, delegating grid mathematics, coverage, and material construction.",
);
assert(
  horizonShell.includes("catch (error)") && horizonShell.includes("this.dispose()"),
  "A horizon build fault must contain itself rather than take terrain streaming down with it.",
);
assert(
  horizonMaterial.includes("uHorizonSinkFocus") &&
    horizonMaterial.includes("max(horizonToFocus.x, horizonToFocus.y)"),
  "The shell's sink must follow the streamed ring focus and its square boundary in Chebyshev distance.",
);
assert(
  terrainStreamer.includes("config.horizonEnabled >= 1") &&
    terrainStreamer.includes("this.horizon?.update(position, buildDeadline)") &&
    terrainStreamer.includes("this.horizon?.dispose()") &&
    terrainStreamer.indexOf("this.processBuildQueue(buildDeadline)") <
      terrainStreamer.indexOf("this.horizon?.update") &&
    !worldApp.includes("WorldHorizonShell"),
  "Terrain residency must own the horizon shell, build it only after the ring, and keep it out of the composition root.",
);

assert(
  stoneSystem.includes("private disposed = false") &&
    stoneSystem.includes("if (this.disposed || !this.enabled) return") &&
    stoneSystem.includes("if (this.disposed)") &&
    stoneSystem.includes("registerStoneClearanceField") &&
    stoneSystem.includes("clearanceRegistration.dispose()") &&
    stoneClearance.includes("activeOwner") &&
    stoneClearance.includes("activeOwner !== owner"),
  "Stone lifecycle must be idempotent and registration-owned so stale systems cannot update or clear a newer field.",
);
assert(
  lineCount(stoneGeometry) <= STONE_GEOMETRY_MAX_LINES,
  `StoneGeometry grew beyond ${STONE_GEOMETRY_MAX_LINES} lines; keep topology and feature generation in dedicated modules.`,
);
assert(
  stoneGeometry.includes('from "./StoneIndentation"') &&
    stoneGeometry.includes('from "./StoneMeshTopology"') &&
    !stoneGeometry.includes("function addSingleStoneIndentation") &&
    !stoneGeometry.includes("function buildWorkingFaces") &&
    !stoneGeometry.includes("function removeCollinearCorners"),
  "StoneGeometry must stay focused on mesh transformation, shading, packing, and metrics.",
);
assert(
  !stoneIndentation.includes('from "./StoneGeometry"') &&
    stoneIndentation.includes("calculateStonePolygonAreaAndNormal"),
  "Stone indentation must depend on topology primitives, not the mesh packer.",
);
assert(
  !stoneTopology.includes('from "./StoneGeometry"') &&
    stoneTopology.includes("buildWorkingStoneFaces") &&
    stoneTopology.includes("chooseStoneFanRoot"),
  "Stone topology must stay independent from render packing.",
);

assert(
  lineCount(configReader) <= CONFIG_READER_MAX_LINES &&
    configReader.includes("class FlatConfigValueReader") &&
    configReader.includes("number(key") &&
    configReader.includes("boolean(key"),
  "Primitive flat-config reads must stay centralized and small.",
);
for (const [name, source] of [
  ["WorldConfigLoader", worldConfigLoader],
  ["GrassConfigLoader", grassConfigLoader],
  ["RuntimeConfigLoader", runtimeConfigLoader],
]) {
  assert(
    lineCount(source) <= CONFIG_LOADER_MAX_LINES,
    `${name} grew beyond ${CONFIG_LOADER_MAX_LINES} lines; move schema or domain validation out of the transport/parser layer.`,
  );
  assert(
    source.includes("FlatConfigValueReader"),
    `${name} must use the shared typed flat-config reader.`,
  );
}
assert(
  worldConfigLoader.includes("WORLD_CONFIG_SCHEMA") &&
    worldConfigLoader.includes("validateWorldConfig") &&
    !worldConfigLoader.includes("grassClumpRadiusScale range is reversed"),
  "WorldConfigLoader must orchestrate parsing rather than own schema or cross-field rules.",
);
assert(
  worldConfigSchema.includes("grassFarImpostorsPerPatch") &&
    worldConfigSchema.includes("waterEnabled") &&
    worldConfigSchema.includes("waterFlowNoiseStrength") &&
    worldConfigSchema.includes("waterStoneWakeStrength") &&
    worldConfigValidator.includes("validateWorldConfig") &&
    worldConfigValidator.includes("validateHydrologyConfig") &&
    grassConfigValidator.includes("validateGrassConfig"),
  "World, hydrology, advanced-water, and grass domain invariants must remain explicit outside their loaders.",
);

console.log(
  "[architecture] Runtime, terrain, hydrology, advanced water, config, and stone responsibility boundaries verified.",
);
