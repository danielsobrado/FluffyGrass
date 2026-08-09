import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[runtime-safety] ${message}`);
  }
}

const main = read("src/main.ts");
const world = read("src/app/WorldApp.ts");
const island = read("src/app/IslandApp.ts");
const islandGrass = read("src/grass/GrassSystem.ts");
const interactionField = read("src/grass/interaction/GrassInteractionField.ts");
const trailField = read("src/grass/interaction/GrassTrailField.ts");
const qualityGovernor = read("src/runtime/GrassQualityGovernor.ts");
const diagnosticsController = read("src/runtime/WorldDiagnosticsController.ts");
const tileField = read("src/world/grass/WorldSingleBladeTileField.ts");
const thirdPersonController = read("src/controls/ThirdPersonController.ts");
const thirdPersonInput = read("src/controls/ThirdPersonInput.ts");
const flyController = read("src/controls/FlyController.ts");
const uiController = read("src/runtime/UiVisibilityController.ts");
const worldConfigSchema = read("src/world/WorldConfigSchema.ts");

assert(
  main.includes('params.get("diagnostics") === "1"') &&
    /await import\(\s*"\.\/runtime\/WorldDiagnosticsController"\s*\)/.test(main) &&
    !main.includes('import { WorldDiagnosticsController }'),
  "Deep world diagnostics must remain opt-in and outside the default bundle path.",
);
assert(
  main.includes('statsPanelEnabled: params.get("stats") === "1"') &&
    world.includes('await import("stats-gl")') &&
    world.includes("this.stats?.update()") &&
    diagnosticsController.includes("options.gpuTiming && !options.statsPanelEnabled"),
  "The lazy stats-gl panel and custom GPU timer must not issue overlapping GPU timing queries.",
);
assert(
  main.includes("app?.dispose()") &&
    main.includes("uiController.dispose()") &&
    main.includes("if (event.persisted || disposed)") &&
    main.includes("catch (error)"),
  "Bootstrap must release partially-created runtime resources and preserve bfcache restores.",
);
assert(
  world.includes("private disposed = false") &&
    world.includes("Number.isFinite(rawDeltaSeconds)") &&
    world.includes("Optional stats panel unavailable") &&
    /await import\(\s*"\.\.\/world\/grass\/WorldDetailFoliageAtlasFactory"\s*\)/.test(world) &&
    !world.includes('import { appendDetailFoliageAtlasDebugCanvas }'),
  "World runtime must be idempotent, frame-safe, and keep optional diagnostics off the default path.",
);
assert(
  /await import\(\s*"\.\.\/dev\/GrassDevelopmentController"\s*\)/.test(island) &&
    !island.includes('import { GrassDevelopmentController }') &&
    island.includes("private disposed = false") &&
    island.includes("disposeObjectGeometry") &&
    island.includes("disposeObjectMaterials"),
  "Island QA code must stay lazy and loaded assets must have an explicit disposal path.",
);
assert(
  islandGrass.includes("private disposed = false") &&
    islandGrass.includes("this.assertNotDisposed()") &&
    islandGrass.includes("if (this.disposed)") &&
    islandGrass.includes('throw new Error("GrassSystem has been disposed.")'),
  "Island grass initialization must not resurrect resources after disposal.",
);
assert(
  interactionField.includes("validateConfig(config)") &&
    interactionField.includes("Number.isFinite(deltaSeconds)") &&
    interactionField.includes("Number.isFinite(normalizedImpact)") &&
    interactionField.includes("Number.isFinite(pose.distanceTravelled)"),
  "Grass interaction state must reject invalid configuration and runtime input.",
);
assert(
  trailField.includes("validateConfig(next)") &&
    trailField.includes("areFinite(") &&
    trailField.includes("Number.isFinite(deltaSeconds)") &&
    trailField.includes("renderer.setRenderTarget(previousRenderTarget)") &&
    trailField.includes("this.resetPendingFrame()"),
  "Grass trail feedback must reject invalid inputs and restore renderer state after failures.",
);
assert(
  qualityGovernor.includes("Number.isFinite(deltaSeconds)") &&
    qualityGovernor.includes("MAX_SAMPLE_DELTA_SECONDS") &&
    qualityGovernor.includes("this.resetSamplingWindow()"),
  "Grass quality control must reject invalid or suspended-tab frame samples.",
);
assert(
  tileField.includes("tile.mesh.count = count") &&
    tileField.includes("tile.mesh.visible = count > 0") &&
    tileField.includes("enabled && tile.mesh.count > 0"),
  "Zero-count near-grass tiles must not remain visible draw submissions.",
);
assert(
  thirdPersonController.includes("Number.isFinite(deltaSeconds)") &&
    thirdPersonController.includes("private disposed = false") &&
    thirdPersonController.includes("if (this.disposed)"),
  "Third-person movement must reject invalid frame deltas and be disposal-safe.",
);
assert(
  flyController.includes("Number.isFinite(deltaSeconds)") &&
    flyController.includes("private disposed = false") &&
    flyController.includes("this.canvas.style.touchAction = this.previousTouchAction"),
  "Flight input must reject invalid frame deltas and restore canvas state on disposal.",
);
assert(
  thirdPersonInput.includes("private disposed = false") &&
    thirdPersonInput.includes("this.clearTransientInput()") &&
    thirdPersonInput.includes("this.canvas.style.touchAction = this.previousTouchAction"),
  "Third-person input must clear transient state and restore canvas state on disposal.",
);
assert(
  uiController.includes("removeEventListener") &&
    uiController.includes("private initialized = false"),
  "UI visibility controls must be disposable and initialization-idempotent.",
);
assert(
  worldConfigSchema.includes(
    "grassFarImpostorsPerPatch: { minimum: 1, maximum: 1, integer: true }",
  ),
  "World config must enforce the one-instance/four-card far-impostor contract.",
);

console.log("[runtime-safety] Production runtime lifecycle and hot-path guards verified.");
