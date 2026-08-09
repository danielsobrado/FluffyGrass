import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const WORLD_APP_MAX_LINES = 540;
const TERRAIN_STREAMER_MAX_LINES = 300;
const STONE_GEOMETRY_MAX_LINES = 340;
const EXTRACTED_MODULE_MAX_LINES = 260;
const CONFIG_LOADER_MAX_LINES = 220;
const CONFIG_READER_MAX_LINES = 120;

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
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
const terrainStreamer = read("src/world/TerrainStreamer.ts");
const terrainMaterial = read("src/world/TerrainMaterialController.ts");
const terrainShader = read("src/world/TerrainMaterialShader.ts");
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
    worldApp.includes("this.streamingBuildDeadline - grassBuildReserveMs"),
  "The shared streaming budget must reserve bounded progress for terrain, stones, and grass instead of allowing an earlier subsystem to starve grass.",
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
    terrainStreamer.includes("private disposed = false") &&
    !terrainStreamer.includes("onBeforeCompile") &&
    !terrainStreamer.includes("TERRAIN_DETAIL_COLOR"),
  "TerrainStreamer must own residency/build scheduling, not shader or texture construction, and must be disposal-safe.",
);
assert(
  lineCount(terrainMaterial) <= EXTRACTED_MODULE_MAX_LINES &&
    terrainMaterial.includes("onBeforeCompile") &&
    terrainMaterial.includes("setGrassArtDirection") &&
    terrainMaterial.includes("grassDetailTexture.dispose()") &&
    terrainShader.includes("TERRAIN_DETAIL_COLOR"),
  "Terrain material and shader modules must own terrain rendering concerns outside the streamer.",
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
    worldConfigValidator.includes("validateWorldConfig") &&
    grassConfigValidator.includes("validateGrassConfig"),
  "World and grass domain invariants must remain explicit outside their loaders.",
);

console.log(
  "[architecture] Runtime, terrain, config, and stone responsibility boundaries verified.",
);
