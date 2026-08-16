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
    throw new Error(`[bootstrap-lifecycle] ${message}`);
  }
}

const source = read("src/main.ts");
const listener = source.indexOf('window.addEventListener("pagehide", handlePageHide)');
const islandImport = source.indexOf('await import("./app/IslandApp")');
const worldImport = source.indexOf('await import("./app/WorldApp")');
const appStart = source.indexOf("app.start()");

assert(
  source.includes("let disposed = false") &&
    source.includes("const handlePageHide = (event: PageTransitionEvent): void =>") &&
    source.includes("if (event.persisted || disposed)") &&
    source.includes("disposed = true") &&
    source.includes("disposeRuntime()") &&
    listener >= 0 &&
    listener < islandImport &&
    listener < worldImport &&
    listener < appStart,
  "Non-BFCache pagehide cleanup must own runtime resources before asynchronous application setup begins.",
);

assert(
  /const world = await WorldApp\.create\(canvas, profile\);[\s\S]*?app = world;[\s\S]*?if \(disposed\) \{[\s\S]*?disposeRuntime\(\);[\s\S]*?return;/.test(
    source,
  ) &&
    /await island\.initialize\(\);[\s\S]*?if \(disposed\) \{[\s\S]*?return;/.test(
      source,
    ),
  "Applications resolving after pagehide must not continue bootstrap or start without an owner.",
);

assert(
  source.includes('await import("./runtime/AnimationBlendingHud"') &&
    source.includes('await import("./runtime/WorldDiagnosticsController"') &&
    source.includes('await import("./qa/WorldVisualMatrixRunner"') &&
    source.includes('await import("./dev/ActorExtensibilityProof"') &&
    (source.match(/if \(disposed\) \{/g)?.length ?? 0) >= 6,
  "Optional asynchronous runtime modules must re-check bootstrap ownership before publishing resources.",
);

assert(
  /catch \(error\) \{[\s\S]*?disposed = true;[\s\S]*?window\.removeEventListener\("pagehide", handlePageHide\);[\s\S]*?disposeRuntime\(\);[\s\S]*?throw error;/.test(
    source,
  ),
  "Failed bootstrap must remove its navigation listener and release all partially created owners.",
);

console.log(
  "[bootstrap-lifecycle] Async navigation ownership and startup rollback verified.",
);