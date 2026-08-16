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
    throw new Error(`[environment-lifecycle] ${message}`);
  }
}

const sky = read("src/world/sky/WorldSky.ts");

assert(
  sky.includes("private environmentTarget?: THREE.WebGLRenderTarget") &&
    sky.includes("this.environmentTarget = this.pmrem.fromScene") &&
    sky.includes("this.scene.environment = this.environmentTarget.texture") &&
    sky.includes("this.environmentTarget?.dispose()") &&
    !sky.includes("environmentTexture?.dispose()"),
  "The PMREM output must stay owned as a WebGLRenderTarget and be disposed through the target lifecycle.",
);

console.log("[environment-lifecycle] Sky PMREM render-target ownership verified.");
