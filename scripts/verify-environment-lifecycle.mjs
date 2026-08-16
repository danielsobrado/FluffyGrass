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
const environment = read("src/app/WorldEnvironmentController.ts");

assert(
  sky.includes("private environmentTarget?: THREE.WebGLRenderTarget") &&
    sky.includes("this.environmentTarget = this.pmrem.fromScene") &&
    sky.includes("this.scene.environment = this.environmentTarget.texture") &&
    sky.includes("this.environmentTarget?.dispose()") &&
    !sky.includes("environmentTexture?.dispose()"),
  "The PMREM output must stay owned as a WebGLRenderTarget and be disposed through the target lifecycle.",
);
assert(
  sky.includes("let bakeMaterial: THREE.ShaderMaterial | undefined") &&
    sky.includes("} catch (error) {") &&
    sky.includes("Sky environment bake unavailable; continuing without IBL.") &&
    sky.includes("this.environmentTarget = undefined") &&
    sky.includes("this.pmrem = undefined") &&
    sky.includes("} finally {") &&
    sky.includes("bakeMaterial?.dispose()"),
  "A failed desktop PMREM bake must release optional GPU resources and keep the sky dome available.",
);
assert(
  sky.includes("private disposed = false") &&
    /dispose\(\): void \{[\s\S]*?if \(this\.disposed\)[\s\S]*?this\.disposed = true/.test(
      sky,
    ) &&
    sky.includes("this.scene.environment === this.environmentTarget.texture") &&
    sky.includes("this.pmrem = undefined"),
  "Sky teardown must be idempotent and clear only the environment texture it still owns.",
);
assert(
  environment.includes("private disposed = false") &&
    /sky = new WorldSky\([\s\S]*?this\.sky = sky;[\s\S]*?this\.scene\.add\(this\.hemisphere, this\.sun, this\.sun\.target\)/.test(
      environment,
    ) &&
    /catch \(error\) \{[\s\S]*?disposeSafely\(sky, "Sky"\);[\s\S]*?disposeSafely\(this\.sun\.shadow, "Sun shadow"\);[\s\S]*?this\.scene\.remove\(this\.hemisphere, this\.sun, this\.sun\.target\);[\s\S]*?throw error;/.test(
      environment,
    ),
  "Environment lights and shadow resources must publish only after core sky construction succeeds and roll back on initialization failure.",
);
assert(
  /dispose\(\): void \{[\s\S]*?if \(this\.disposed\)[\s\S]*?this\.disposed = true;[\s\S]*?disposeSafely\(this\.sky, "Sky"\);[\s\S]*?disposeSafely\(this\.sun\.shadow, "Sun shadow"\);[\s\S]*?this\.scene\.remove\(this\.hemisphere, this\.sun, this\.sun\.target\)/.test(
    environment,
  ),
  "Environment teardown must release the shadow render target, stay idempotent, and remove lights even if cleanup fails.",
);

console.log("[environment-lifecycle] Sky, shadow, and fail-soft IBL ownership verified.");
