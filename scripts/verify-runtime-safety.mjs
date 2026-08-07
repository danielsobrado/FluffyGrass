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
const island = read("src/app/IslandApp.ts");
const qualityGovernor = read("src/runtime/GrassQualityGovernor.ts");
const tileField = read("src/world/grass/WorldSingleBladeTileField.ts");
const uiController = read("src/runtime/UiVisibilityController.ts");

assert(
  main.includes('params.get("diagnostics") === "1"') &&
    main.includes('await import(\n          "./runtime/WorldDiagnosticsController"') &&
    !main.includes('import { WorldDiagnosticsController }'),
  "Deep world diagnostics must remain opt-in and outside the default bundle path.",
);
assert(
  main.includes("app?.dispose()") &&
    main.includes("uiController.dispose()") &&
    main.includes("if (event.persisted || disposed)") &&
    main.includes("catch (error)"),
  "Bootstrap must release partially-created runtime resources and preserve bfcache restores.",
);
assert(
  island.includes('await import(\n      "../dev/GrassDevelopmentController"') &&
    !island.includes('import { GrassDevelopmentController }') &&
    island.includes("private disposed = false") &&
    island.includes("disposeObjectGeometry") &&
    island.includes("disposeObjectMaterials"),
  "Island QA code must stay lazy and loaded assets must have an explicit disposal path.",
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
  uiController.includes("removeEventListener") &&
    uiController.includes("private initialized = false"),
  "UI visibility controls must be disposable and initialization-idempotent.",
);

console.log("[runtime-safety] Production runtime lifecycle and hot-path guards verified.");
