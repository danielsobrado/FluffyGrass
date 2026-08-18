import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[environment-lifecycle] ${message}`);
  }
}

const sky = read("src/world/sky/WorldSky.ts");
const cloudMaterial = read("src/world/sky/WorldSkyMaterial.ts");
const cloudShader = read("src/world/sky/WorldSkyCloudShader.ts");
const cloudWeather = read("src/world/sky/WorldCloudWeather.ts");
const cloudLighting = read("src/app/WorldCloudEnvironmentLighting.ts");
const cloudVolumeController = read(
  "src/world/sky/WorldSkyCloudVolumeController.ts",
);
const cloudVolumePass = read("src/world/sky/WorldCloudTemporalPass.ts");
const cloudVolumeShader = read("src/world/sky/WorldCloudVolumeShader.ts");
const cloudTemporalShader = read("src/world/sky/WorldCloudTemporalShader.ts");
const cloudVolumeQuality = read("src/world/sky/WorldCloudVolumeQuality.ts");
const environment = read("src/app/WorldEnvironmentController.ts");
const runtimeConfig = read("src/runtime/RuntimeConfig.ts");
const runtimeYaml = read("public/config/runtime.yaml");
const worldApp = read("src/app/WorldApp.ts");

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
  sky.includes("disableWorldSkyCloudsForEnvironmentBake(bakeMaterial)") &&
    cloudMaterial.includes("material.defines = {}") &&
    cloudMaterial.includes("material.needsUpdate = true"),
  "Cloud shader work must be removed from the one-shot PMREM bake so startup IBL does not pay the animated weather cost.",
);
assert(
  cloudShader.includes("float cloudFbm(vec2 p)") &&
    cloudShader.includes("WORLD_CLOUD_COMPACT") &&
    cloudShader.includes("WORLD_CLOUD_GOD_RAYS") &&
    cloudShader.includes("float horizonFade") &&
    cloudShader.includes("float silverEdge") &&
    cloudShader.includes("float cloudSelfShadow(") &&
    cloudShader.includes("opticalTransmittance = exp(") &&
    cloudShader.includes("uCloudSilverLiningStrength") &&
    cloudShader.includes("float godRay"),
  "The sky must retain scalable macro/detail shaping, horizon integration, Beer-Lambert body depth, self-shadowing, tunable silver lining, and cheap god rays.",
);
assert(
  cloudMaterial.includes("uCloudThickness") &&
    cloudMaterial.includes("uCloudExtinction") &&
    cloudMaterial.includes("uCloudSelfShadowStrength") &&
    cloudMaterial.includes("uCloudSilverLiningStrength") &&
    runtimeConfig.includes("shadowSampleRadius: number") &&
    runtimeConfig.includes("weatherGradeStrength: number") &&
    runtimeYaml.includes("desktopCloudShadowSampleRadius: 24") &&
    runtimeYaml.includes("compactCloudMinimumDirectTransmittance: 0.90"),
  "Cloud body depth, projected-shadow filtering, and weather grading must remain explicit runtime tuning rather than shader literals.",
);
assert(
  runtimeConfig.includes("volumetricEnabled: boolean") &&
    runtimeConfig.includes("volumetricResolutionScale: number") &&
    runtimeConfig.includes("volumetricSteps: number") &&
    runtimeConfig.includes("temporalBlend: number") &&
    runtimeYaml.includes("desktopCloudVolumetricEnabled: true") &&
    runtimeYaml.includes("desktopCloudVolumetricResolutionScale: 0.50") &&
    runtimeYaml.includes("desktopCloudVolumetricSteps: 8") &&
    runtimeYaml.includes("compactCloudVolumetricEnabled: false") &&
    cloudMaterial.includes("WORLD_CLOUD_TEMPORAL") &&
    cloudMaterial.includes("uCloudTemporalTexture") &&
    cloudVolumeController.includes("new WorldCloudTemporalPass") &&
    cloudVolumeController.includes("disableWorldSkyTemporalClouds") &&
    cloudVolumePass.includes("uPreviousViewProjection") &&
    cloudVolumePass.includes("this.historyTargets") &&
    cloudTemporalShader.includes("previousParcel.xz += uCloudWind * uDeltaSeconds") &&
    cloudTemporalShader.includes("alphaDifference") &&
    cloudVolumeShader.includes("WORLD_CLOUD_VOLUME_STEPS") &&
    cloudVolumeShader.includes("cloudJitter") &&
    cloudVolumeShader.includes("cloudVerticalProfile") &&
    cloudVolumeShader.includes("1.0 - exp(-opticalDepth)") &&
    cloudVolumeQuality.includes('"desktop" | "medium" | "mobile"') &&
    cloudVolumeQuality.includes("MEDIUM_MAX_STEPS = 6"),
  "Desktop clouds must use a low-resolution temporally reprojected volumetric deck with jittered bounded ray steps, wind-aware history rejection, and medium/mobile quality fallbacks.",
);
assert(
  cloudVolumeController.includes("uCloudViewportInverse") &&
    sky.includes("mesh.renderOrder = 900") &&
    cloudVolumePass.includes("renderer.getRenderTarget()") &&
    cloudVolumePass.includes("renderer.setRenderTarget(previousTarget)"),
  "Volumetric clouds must upsample only through depth-tested sky fragments and restore nested renderer state after the offscreen pass.",
);
assert(
  cloudWeather.includes('CloudWeatherRegime = "clear" | "fair" | "overcast" | "storm"') &&
    cloudWeather.includes("resolveCloudWeatherRegime(") &&
    cloudLighting.includes("this.weatherState.regime = resolveCloudWeatherRegime(this.weatherAmount)") &&
    cloudLighting.includes("this.scene.userData.worldCloudWeather = this.weatherState") &&
    cloudLighting.includes("delete this.scene.userData.worldCloudWeather") &&
    environment.includes('disposeSafely(this.cloudLighting, "Cloud lighting")'),
  "The shared world-space weather field must expose clear/fair/overcast/storm regimes and publish one allocation-free runtime state for future weather consumers.",
);
assert(
  cloudWeather.includes("SHADOW_CENTER_WEIGHT = 0.36") &&
    cloudWeather.includes("SHADOW_CARDINAL_WEIGHT = 0.16") &&
    cloudWeather.includes("worldX + radius") &&
    cloudWeather.includes("worldX - radius") &&
    cloudWeather.includes("worldZ + radius") &&
    cloudWeather.includes("worldZ - radius") &&
    cloudWeather.includes("config.minimumDirectTransmittance"),
  "Cloud direct-light occlusion must use a normalized five-tap low-frequency footprint and retain a hard transmittance floor.",
);
assert(
  environment.includes('from "./WorldCloudEnvironmentLighting"') &&
    environment.includes("this.cloudLighting.update(safeDelta, focus, this.elapsedSeconds)") &&
    cloudLighting.includes("WORLD_DEFAULT_SUN_INTENSITY * this.directTransmittance") &&
    cloudLighting.includes("this.hemisphere.intensity = WORLD_DEFAULT_HEMISPHERE_INTENSITY") &&
    cloudLighting.includes("WORLD_OVERCAST_FOG_DENSITY_SCALE") &&
    cloudLighting.includes("WORLD_OVERCAST_EXPOSURE_SCALE") &&
    worldApp.includes("this.environment.update(deltaSeconds, focus);"),
  "Cloud weather must soften only direct sun while a subtle shared lighting/fog/exposure grade keeps the world coherent without crushing ambient light.",
);
assert(
  environment.includes("private readonly shadowMapSize: number") &&
    /this\.shadowMapSize = Math\.max\([\s\S]*?Math\.min\([\s\S]*?this\.profile\.shadowMapSize,[\s\S]*?this\.renderer\.capabilities\.maxTextureSize/.test(
      environment,
    ) &&
    environment.includes("(2 * WORLD_SUN_SHADOW_HALF_EXTENT) / this.shadowMapSize") &&
    environment.includes("this.sun.shadow.mapSize.set(this.shadowMapSize, this.shadowMapSize)"),
  "Shadow-map allocation and texel snapping must use a size clamped to the active GPU texture limit.",
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
  "[environment-lifecycle] Camera-relative sky, filtered direct light, Beer-Lambert temporal cloud volume, coherent weather grade, scalable quality tiers, god rays, GPU-safe shadows, restored PMREM, and fail-soft IBL ownership verified.",
);
