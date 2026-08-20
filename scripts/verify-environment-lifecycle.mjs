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
const cloudField = read("src/world/sky/WorldCloudFieldShader.ts");
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
const cloudShadowMap = read("src/world/sky/WorldCloudShadowMap.ts");
const cloudShadowShader = read("src/world/sky/WorldCloudShadowShader.ts");
const cloudShadowSampler = read(
  "src/world/sky/WorldCloudShadowSamplerShader.ts",
);
const cloudShadowIntegrator = read(
  "src/world/sky/WorldCloudShadowSceneIntegrator.ts",
);
const cloudShadowPatch = read("src/render/WorldCloudShadowMaterialPatch.ts");
const cloudShadowDebug = read("src/app/WorldCloudShadowDebugPanel.ts");
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
  cloudField.includes("float cloudFbm(vec2 p)") &&
    cloudField.includes("WORLD_CLOUD_COMPACT") &&
    cloudField.includes("float cloudDensity(") &&
    cloudField.includes("WORLD_CLOUD_VERTICAL_PROFILE_GLSL") &&
    cloudShader.includes("WORLD_CLOUD_GOD_RAYS") &&
    cloudShader.includes("float horizonFade") &&
    cloudShader.includes("float silverEdge") &&
    cloudShader.includes("float cloudSelfShadow(") &&
    cloudShader.includes("opticalTransmittance = exp(") &&
    cloudShader.includes("uCloudSilverLiningStrength") &&
    cloudShader.includes("float godRay") &&
    cloudShader.includes("float cloudRayBreakup(") &&
    !cloudShader.includes("sin(rayAngle * 17.0"),
  "The sky must retain scalable shared macro/detail shaping, horizon integration, Beer-Lambert body depth, self-shadowing, tunable silver lining, and irregular cheap god rays without angular banding.",
);
assert(
  cloudMaterial.includes("uCloudThickness") &&
    cloudMaterial.includes("uCloudExtinction") &&
    cloudMaterial.includes("uCloudSelfShadowStrength") &&
    cloudMaterial.includes("uCloudSilverLiningStrength") &&
    runtimeConfig.includes("shadowSampleRadius: number") &&
    runtimeConfig.includes("shadowMapResolution: number") &&
    runtimeConfig.includes("shadowWorldSize: number") &&
    runtimeConfig.includes("shadowSteps: number") &&
    runtimeConfig.includes("shadowDistanceFadeStart: number") &&
    runtimeConfig.includes("weatherGradeStrength: number") &&
    runtimeYaml.includes("desktopCloudShadowSampleRadius: 24") &&
    runtimeYaml.includes("desktopCloudShadowMapResolution: 256") &&
    runtimeYaml.includes("compactCloudShadowMapResolution: 128") &&
    runtimeYaml.includes("compactCloudMinimumDirectTransmittance: 0.90"),
  "Cloud body depth, global filtering, spatial shadow quality, and weather grading must remain explicit runtime tuning rather than shader literals.",
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
    cloudVolumeShader.includes("WORLD_CLOUD_VERTICAL_PROFILE_GLSL") &&
    cloudVolumeShader.includes("cloudJitter") &&
    cloudVolumeShader.includes("cloudVerticalProfile") &&
    cloudVolumeShader.includes("1.0 - exp(-opticalDepth)") &&
    cloudVolumeQuality.includes('"desktop" | "medium" | "mobile"') &&
    cloudVolumeQuality.includes("MEDIUM_MAX_STEPS = 6"),
  "Desktop clouds must use a low-resolution temporally reprojected volumetric deck with jittered bounded ray steps, shared morphology, wind-aware history rejection, and medium/mobile quality fallbacks.",
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
  "Global cloud direct-light occlusion must use a normalized five-tap low-frequency footprint and retain a hard transmittance floor.",
);
assert(
  cloudShadowShader.includes("WORLD_CLOUD_FIELD_GLSL") &&
    cloudShadowShader.includes("WORLD_CLOUD_VERTICAL_PROFILE_GLSL") &&
    cloudShadowShader.includes("physicalTransmittance = exp(") &&
    cloudShadowShader.includes("uCloudMinimumDirectTransmittance") &&
    cloudShadowMap.includes("new THREE.WebGLRenderTarget") &&
    cloudShadowMap.includes("THREE.LinearFilter") &&
    cloudShadowMap.includes("THREE.ClampToEdgeWrapping") &&
    cloudShadowMap.includes("Math.round(focusCloudX / texelSize) * texelSize") &&
    cloudShadowMap.includes("renderer.setRenderTarget(previousTarget)"),
  "Spatial cloud shadows must be one bounded, filtered, texel-snapped transmittance field that shares visible-cloud density and restores render state.",
);
assert(
  cloudShadowSampler.includes("uCloudBaseHeight - worldPosition.y") &&
    cloudShadowSampler.includes("edgeCoverage") &&
    cloudShadowSampler.includes("uCloudShadowDistanceFadeEnd") &&
    cloudShadowSampler.includes("uCloudFocusTransmittance") &&
    cloudShadowPatch.includes("reflectedLight.directDiffuse *= worldCloudDirectScale") &&
    cloudShadowPatch.includes("patchGrassBladeCloudShadowMaterial") &&
    cloudShadowPatch.includes("grassWorldRoot.xyz") &&
    cloudShadowIntegrator.includes("HORIZON_RESPONSE_STRENGTH = 0.35"),
  "Spatial consumers must project world height to the cloud plane, fade safely, normalize against global focus light, modulate direct light only, and keep high-overdraw grass sampling in the vertex path.",
);
assert(
  environment.includes('from "./WorldCloudEnvironmentLighting"') &&
    environment.includes("this.cloudLighting.update(safeDelta, focus, this.elapsedSeconds)") &&
    environment.includes("this.cloudShadow.update(") &&
    environment.includes("this.cloudShadowIntegrator.update(safeDelta)") &&
    cloudLighting.includes(
      "this.directAttenuationEnabled ? this.directTransmittance : 1",
    ) &&
    cloudLighting.includes("this.hemisphere.intensity = WORLD_DEFAULT_HEMISPHERE_INTENSITY") &&
    cloudLighting.includes("WORLD_OVERCAST_FOG_DENSITY_SCALE") &&
    cloudLighting.includes("WORLD_OVERCAST_EXPOSURE_SCALE") &&
    worldApp.includes("this.environment.update(deltaSeconds, focus);"),
  "Cloud weather must soften global direct sun while spatial correction restores local contrast; ambient light remains intact and the environment owns both paths.",
);
assert(
  cloudShadowDebug.includes("Spatial cloud shadow") &&
    cloudShadowDebug.includes("Global cloud direct") &&
    cloudShadowDebug.includes("Sun shadow map") &&
    cloudShadowDebug.includes("Grass") &&
    cloudShadowDebug.includes("Water") &&
    cloudShadowDebug.includes("readPixels") &&
    environment.includes("WorldCloudShadowDebugPanel.createIfRequested"),
  "Cloud diagnostics must expose independent binary-search toggles and a live transmittance preview without affecting normal sessions.",
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
    /catch \(error\) \{[\s\S]*?disposeSafely\(this\.cloudShadowDebug, "Cloud shadow diagnostics"\);[\s\S]*?disposeSafely\(sky, "Sky"\);[\s\S]*?disposeSafely\(this\.cloudShadowIntegrator, "Cloud shadow integration"\);[\s\S]*?disposeSafely\(this\.cloudShadow, "Cloud shadow map"\);[\s\S]*?disposeSafely\(this\.sun\.shadow, "Sun shadow"\);[\s\S]*?this\.scene\.remove\(this\.hemisphere, this\.sun, this\.sun\.target\);[\s\S]*?throw error;/.test(
      environment,
    ),
  "Environment lights, cloud targets/integration/diagnostics, and shadow resources must publish only after core sky construction succeeds and roll back on initialization failure.",
);
assert(
  /dispose\(\): void \{[\s\S]*?if \(this\.disposed\)[\s\S]*?this\.disposed = true;[\s\S]*?disposeSafely\(this\.cloudShadowDebug, "Cloud shadow diagnostics"\);[\s\S]*?disposeSafely\(this\.sky, "Sky"\);[\s\S]*?disposeSafely\(this\.cloudShadowIntegrator, "Cloud shadow integration"\);[\s\S]*?disposeSafely\(this\.cloudShadow, "Cloud shadow map"\);[\s\S]*?disposeSafely\(this\.sun\.shadow, "Sun shadow"\);[\s\S]*?this\.scene\.remove\(this\.hemisphere, this\.sun, this\.sun\.target\)/.test(
    environment,
  ),
  "Environment teardown must release cloud/debug/shadow render resources, stay idempotent, and remove lights even if cleanup fails.",
);

console.log(
  "[environment-lifecycle] Camera-relative sky, shared cloud morphology, temporal cloud volume, bounded spatial direct-light shadows, diagnostics, coherent weather grade, GPU-safe local shadows, restored PMREM, and fail-soft ownership verified.",
);
