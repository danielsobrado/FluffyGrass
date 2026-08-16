import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const source = readFileSync(
  resolve(REPOSITORY_ROOT, "src/qa/WorldVisualMatrixRunner.ts"),
  "utf8",
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[visual-qa-lifecycle] ${message}`);
  }
}

assert(
  source.includes("private applying = false") &&
    /private async apply\(index: number\)[\s\S]*?if \(this\.applying\) \{[\s\S]*?capture is already in progress[\s\S]*?this\.applying = true;[\s\S]*?try \{[\s\S]*?return await this\.capture\(pose, index\);[\s\S]*?\} finally \{[\s\S]*?this\.applying = false;/.test(
      source,
    ),
  "Visual matrix captures must serialize camera/sample ownership and release the busy flag on every exit path.",
);

assert(
  source.includes("private readonly abortController = new AbortController()") &&
    source.includes("this.abortController.abort()") &&
    source.includes("this.abortController.signal") &&
    source.includes("delete windowWithQa.__FLUFFY_WORLD_VISUAL_QA__"),
  "Visual matrix disposal must abort pending sampling and remove its published window API.",
);

console.log(
  "[visual-qa-lifecycle] Capture serialization and disposal ownership verified.",
);
