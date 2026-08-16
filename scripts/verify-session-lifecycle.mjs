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
    throw new Error(`[session-lifecycle] ${message}`);
  }
}

const main = read("src/main.ts");
const visualMatrix = read("src/qa/WorldVisualMatrixRunner.ts");
const metrics = read("src/qa/GrassQaMetrics.ts");

assert(
  main.includes("let visualMatrix: Disposable | undefined") &&
    main.includes("visualMatrix = runner") &&
    main.includes("disposeRuntimeSafely(") &&
    main.includes('disposeSafely("Application", () => app?.dispose())') &&
    main.includes('disposeSafely("UI controller", () => uiController.dispose())'),
  "Bootstrap must own optional visual QA and isolate cleanup so one failing owner cannot block the application teardown.",
);

assert(
  visualMatrix.includes("private readonly abortController = new AbortController()") &&
    visualMatrix.includes("this.abortController.abort()") &&
    visualMatrix.includes("delete windowWithQa.__FLUFFY_WORLD_VISUAL_QA__") &&
    visualMatrix.includes("this.abortController.signal") &&
    visualMatrix.includes("private disposed = false"),
  "Visual matrix QA must be disposable, abort pending samples, and release its published window API.",
);

assert(
  metrics.includes("signal?: AbortSignal") &&
    metrics.includes("cancelAnimationFrame(frameHandle)") &&
    metrics.includes('signal?.addEventListener("abort", handleAbort, { once: true })') &&
    metrics.includes('signal?.removeEventListener("abort", handleAbort)') &&
    metrics.includes('document.removeEventListener("visibilitychange", handleVisibilityChange)'),
  "QA frame sampling must cancel its RAF and listeners immediately when its owner is disposed.",
);

console.log("[session-lifecycle] Bootstrap and visual QA ownership verified.");
