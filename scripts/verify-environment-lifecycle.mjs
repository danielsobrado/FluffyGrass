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
  sky.includes("vSkyDirection = worldPosition.xyz - cameraPosition;") &&
    !sky.includes("vSkyDirection = worldPosition.xyz;"),
  "The sky direction must be camera-relative so the horizon and sun do not parallax as the player crosses the world.",
);
assert(
  sky.includes('import { disposeResources } from "../../render/ResourceDisposal"') &&
    sky.includes("private environmentTarget?: THREE.WebGLRenderTarget") &&
    sky.includes("environmentTarget = pmrem.fromScene") &&
    sky.includes("this.environmentTarget = environmentTarget") &&
    sky.includes("this.scene.environment = environmentTarget.texture") &&
    !sky.includes("environmentTexture?.dispose()"),
  "The PMREM output must stay owned as a WebGLRenderTarget and be disposed through the target lifecycle.",
);
assert(
  sky.includes("this.mesh = createSkyMesh(this.scene)") &&
    sky.includes("function createSkyMesh(") &&
    sky.includes("let material: THREE.ShaderMaterial | undefined") &&
    sky.includes("let geometry: THREE.SphereGeometry | undefined") &&
    sky.includes("let mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> | undefined") &&
    sky.includes("Sky construction cleanup failed.") &&
    /catch \(error\) \{[\s\S]*?disposeResources\(\[[\s\S]*?mesh\?\.removeFromParent\(\)[\s\S]*?geometry,[\s\S]*?material,[\s\S]*?\]\);[\s\S]*?throw error;/.test(
      sky,
    ),
  "Sky dome construction must roll back unpublished/published mesh, geometry, and material before rethrowing the original setup error.",
);
assert(
  sky.includes("private initializeEnvironment(): void") &&
    sky.includes("new THREE.PMREMGenerator(this.renderer)") &&
    sky.includes("let environmentTarget: THREE.WebGLRenderTarget | undefined") &&
    sky.includes("let pmrem: THREE.PMREMGenerator | undefined") &&
    sky.includes("Sky environment bake unavailable; continuing without IBL.") &&
    sky.includes("Sky environment cleanup failed.") &&
    sky.includes("Sky bake material cleanup failed.") &&
    sky.includes("Sky PMREM generator cleanup failed.") &&
    sky.includes("disposeResources([environmentTarget])") &&
    sky.includes("bakeMaterial.dispose()") &&
    /finally \{[\s\S]*?pmrem\.dispose\(\)/.test(sky) &&
    !sky.includes("private pmrem?: THREE.PMREMGenerator") &&
    !sky.includes("this.pmrem = pmrem"),
  "Each desktop PMREM bake must release its temporary generator while the generated target remains owned by the sky.",
);
assert(
  sky.includes("private readonly environmentEnabled: boolean") &&
    sky.includes('addEventListener(\n          "webglcontextrestored"') &&
    sky.includes('removeEventListener(\n      "webglcontextrestored"') &&
    sky.includes("private readonly handleContextRestored") &&
    sky.includes("const previousTarget = this.environmentTarget") &&
    sky.includes("previousTarget.dispose()") &&
    sky.includes("this.initializeEnvironment()") &&
    sky.includes("Sky constructor rollback failed."),
  "Desktop sky IBL must rebake after WebGL restoration and own its restore listener through constructor rollback and normal teardown.",
);
assert(
  sky.includes("private disposed = false") &&
    /dispose\(\): void \{[\s\S]*?if \(this\.disposed\)[\s\S]*?this\.disposed = true/.test(
      sky,
    ) &&
    sky.includes("this.scene.environment === environmentTarget.texture") &&
    sky.includes("this.environmentTarget = undefined") &&
    sky.includes("{ dispose: () => this.mesh.removeFromParent() }") &&
    sky.includes("this.mesh.geometry") &&
    sky.includes("this.mesh.material") &&
    /disposeResources\(\[[\s\S]*?environmentTarget,[\s\S]*?\]\);/.test(sky),
  "Sky teardown must be idempotent, clear only the environment texture it still owns, and attempt every dome/IBL cleanup.",
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

console.log(
  "[environment-lifecycle] Camera-relative sky, shadow, context-restored PMREM, and fail-soft IBL ownership verified.",
);