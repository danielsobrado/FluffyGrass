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
    sky.includes("this.scene.remove(this.mesh)") &&
    sky.includes("this.pmrem?.dispose()") &&
    sky.includes("} finally {") &&
    sky.includes("bakeMaterial?.dispose()"),
  "A failed desktop sky bake must roll back the dome, PMREM resources, and temporary bake material.",
);
assert(
  environment.includes("private disposed = false") &&
    /sky = new WorldSky\([\s\S]*?this\.sky = sky;[\s\S]*?this\.scene\.add\(this\.hemisphere, this\.sun, this\.sun\.target\)/.test(
      environment,
    ) &&
    /catch \(error\) \{[\s\S]*?disposeSafely\(sky, "Sky"\);[\s\S]*?disposeSafely\(this\.sun\.shadow, "Sun shadow"\);[\s\S]*?this\.scene\.remove\(this\.hemisphere, this\.sun, this\.sun\.target\);[\s\S]*?throw error;/.test(
      environment,
    ),
  "Environment lights and shadow resources must publish only after sky construction succeeds and roll back on initialization failure.",
);
assert(
  /dispose\(\): void \{[\s\S]*?if \(this\.disposed\)[\s\S]*?this\.disposed = true;[\s\S]*?disposeSafely\(this\.sky, "Sky"\);[\s\S]*?disposeSafely\(this\.sun\.shadow, "Sun shadow"\);[\s\S]*?this\.scene\.remove\(this\.hemisphere, this\.sun, this\.sun\.target\)/.test(
    environment,
  ),
  "Environment teardown must release the shadow render target, stay idempotent, and remove lights even if cleanup fails.",
);

console.log("[environment-lifecycle] Sky, shadow, and environment ownership rollback verified.");
