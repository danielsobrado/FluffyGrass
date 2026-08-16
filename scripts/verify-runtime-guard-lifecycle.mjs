import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const source = readFileSync(
  resolve(REPOSITORY_ROOT, "src/app/WorldRuntimeGuard.ts"),
  "utf8",
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[runtime-guard-lifecycle] ${message}`);
  }
}

assert(
  /constructor\([\s\S]*?try \{[\s\S]*?window\.addEventListener\("resize"[\s\S]*?this\.canvas\.addEventListener\("webglcontextrestored"[\s\S]*?\} catch \(error\) \{[\s\S]*?this\.unbindEvents\(\);[\s\S]*?throw error;/.test(
    source,
  ),
  "Runtime guard construction must roll back partially registered listeners before rethrowing.",
);

assert(
  /dispose\(\): void \{[\s\S]*?this\.disposed = true;[\s\S]*?this\.unbindEvents\(\);/.test(
    source,
  ),
  "Runtime guard disposal must converge on the same listener cleanup path.",
);

for (const listener of [
  'window.removeEventListener("resize", this.handleResize)',
  'window.removeEventListener("error", this.handleWindowError)',
  'window.removeEventListener("unhandledrejection", this.handleUnhandledRejection)',
  'this.canvas.removeEventListener("webglcontextlost", this.handleContextLost)',
  'this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored)',
]) {
  assert(source.includes(listener), `Missing cleanup contract: ${listener}.`);
}

console.log(
  "[runtime-guard-lifecycle] Transactional listener publication and teardown verified.",
);
