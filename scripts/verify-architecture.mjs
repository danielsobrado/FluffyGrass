import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const WORLD_APP_MAX_LINES = 540;
const STONE_GEOMETRY_MAX_LINES = 340;
const EXTRACTED_MODULE_MAX_LINES = 260;

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
const environment = read("src/app/WorldEnvironmentController.ts");
const frameMetrics = read("src/app/WorldFrameMetrics.ts");
const runtimeGuard = read("src/app/WorldRuntimeGuard.ts");
const statusHud = read("src/app/WorldStatusHud.ts");
const stoneGeometry = read("src/world/stones/StoneGeometry.ts");
const stoneIndentation = read("src/world/stones/StoneIndentation.ts");
const stoneTopology = read("src/world/stones/StoneMeshTopology.ts");

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
  frameMetrics.includes("beginFrame") && frameMetrics.includes("measure("),
  "Frame metrics must own FPS and subsystem timing.",
);
assert(
  statusHud.includes("this.element.textContent") &&
    !statusHud.includes("WorldGrassSystem") &&
    !statusHud.includes("TerrainStreamer"),
  "Status HUD must remain a presenter over snapshots rather than depend on world services.",
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

console.log("[architecture] Runtime and stone responsibility boundaries verified.");
