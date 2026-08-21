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
    throw new Error(`[cloud-shadow] ${message}`);
  }
}

function yamlNumber(source, key) {
  const match = source.match(new RegExp(`^${key}:\\s*(-?[0-9.]+)\\s*$`, "m"));
  assert(match, `Missing numeric runtime key ${key}.`);
  const value = Number(match[1]);
  assert(Number.isFinite(value), `Runtime key ${key} must be finite.`);
  return value;
}

const runtime = read("public/config/runtime.yaml");
const runtimeType = read("src/runtime/RuntimeConfig.ts");
const loader = read("src/runtime/RuntimeConfigLoader.ts");
const cloudReader = read("src/runtime/RuntimeCloudConfigReader.ts");
const shadowMap = read("src/world/sky/WorldCloudShadowMap.ts");
const shadowShader = read("src/world/sky/WorldCloudShadowShader.ts");
const sampler = read("src/world/sky/WorldCloudShadowSamplerShader.ts");
const uniforms = read("src/world/sky/WorldCloudShadowUniforms.ts");
const patch = read("src/render/WorldCloudShadowMaterialPatch.ts");
const integrator = read("src/world/sky/WorldCloudShadowSceneIntegrator.ts");
const controller = read("src/app/WorldCloudShadowController.ts");
const environment = read("src/app/WorldEnvironmentController.ts");
const lighting = read("src/app/WorldCloudEnvironmentLighting.ts");
const diagnostics = read("src/app/WorldCloudShadowDebugPanel.ts");

for (const prefix of ["desktop", "compact"]) {
  const strength = yamlNumber(runtime, `${prefix}CloudShadowStrength`);
  const minimum = yamlNumber(runtime, `${prefix}CloudMinimumDirectTransmittance`);
  const resolution = yamlNumber(runtime, `${prefix}CloudShadowMapResolution`);
  const worldSize = yamlNumber(runtime, `${prefix}CloudShadowWorldSize`);
  const steps = yamlNumber(runtime, `${prefix}CloudShadowSteps`);
  const edgeFade = yamlNumber(runtime, `${prefix}CloudShadowEdgeFade`);
  const fadeStart = yamlNumber(runtime, `${prefix}CloudShadowDistanceFadeStart`);
  const fadeEnd = yamlNumber(runtime, `${prefix}CloudShadowDistanceFadeEnd`);
  const darkestAuthored = Math.max(minimum, 1 - strength);
  assert(strength >= 0 && strength <= 0.35, `${prefix} shadow strength is unsafe.`);
  assert(minimum >= 0.65 && minimum <= 1, `${prefix} minimum transmittance is unsafe.`);
  assert(darkestAuthored >= minimum, `${prefix} authored transmittance violates its floor.`);
  assert(resolution >= 64 && resolution <= 512, `${prefix} resolution is outside the bounded quality range.`);
  assert(worldSize >= 256, `${prefix} world footprint is too small for broad cloud shadows.`);
  assert(steps >= 1 && steps <= 6, `${prefix} integration step count is outside the bounded range.`);
  assert(edgeFade >= 0 && edgeFade <= 0.25, `${prefix} edge fade is invalid.`);
  assert(fadeEnd > fadeStart, `${prefix} distance fade must be ordered.`);
}

for (const key of [
  "shadowMapResolution",
  "shadowWorldSize",
  "shadowSteps",
  "shadowEdgeFade",
  "shadowDistanceFadeStart",
  "shadowDistanceFadeEnd",
]) {
  assert(runtimeType.includes(`${key}: number`), `RuntimeCloudConfig must expose ${key}.`);
}
assert(
  loader.includes("readRuntimeCloudConfig(reader, prefix)") &&
    cloudReader.includes('key("ShadowMapResolution")') &&
    cloudReader.includes('key("ShadowWorldSize")') &&
    cloudReader.includes('key("ShadowSteps")') &&
    cloudReader.includes("shadowDistanceFadeEnd <= shadowDistanceFadeStart"),
  "Cloud shadow quality knobs must be read by the dedicated validated runtime cloud config reader.",
);
assert(
  shadowShader.includes("physicalTransmittance = exp(-opticalDepth * uCloudExtinction)") &&
    shadowShader.includes("uCloudMinimumDirectTransmittance") &&
    shadowShader.includes("max(") &&
    shadowShader.includes("gl_FragColor = vec4(transmittance"),
  "The shadow target must store bounded direct-sun transmittance rather than black overlay opacity.",
);
assert(
  shadowMap.includes("THREE.RGBAFormat") &&
    shadowMap.includes("THREE.UnsignedByteType") &&
    shadowMap.includes("THREE.LinearFilter") &&
    shadowMap.includes("THREE.ClampToEdgeWrapping") &&
    shadowMap.includes("depthBuffer: false") &&
    shadowMap.includes("generateMipmaps = false") &&
    shadowMap.includes("Math.round(focusCloudX / texelSize) * texelSize") &&
    shadowMap.includes("renderer.setRenderTarget(previousTarget)"),
  "The transmittance target must be low-cost, filtered, texel-snapped, edge-safe, and restore nested renderer state.",
);
assert(
  sampler.includes("uCloudBaseHeight - worldPosition.y") &&
    sampler.includes("projectedCloudXZ") &&
    sampler.includes("return 1.0;") &&
    sampler.includes("edgeCoverage") &&
    sampler.includes("uCloudShadowDistanceFadeStart") &&
    sampler.includes("uCloudFocusTransmittance") &&
    sampler.includes("resolveRelativeCloudDirectLight"),
  "Consumers must project surface height into the cloud plane, fade map edges/distance to clear light, and normalize against focus attenuation.",
);
assert(
  uniforms.includes("uCloudShadowMap") &&
    uniforms.includes("uCloudShadowOriginXZ") &&
    uniforms.includes("uCloudFocusTransmittance"),
  "All consumers must share one stable cloud shadow uniform bundle.",
);
assert(
  patch.includes("reflectedLight.directDiffuse *= worldCloudDirectScale") &&
    patch.includes("reflectedLight.directSpecular *= worldCloudDirectScale") &&
    !patch.includes("diffuseColor *= worldCloudDirectScale") &&
    !patch.includes("outgoingLight *= worldCloudDirectScale"),
  "Spatial cloud shadows must modulate direct lighting only; material albedo, ambient light, and final outgoing light must stay intact.",
);
assert(
  patch.includes("patchGrassBladeCloudShadowMaterial") &&
    patch.includes("grassWorldRoot.xyz") &&
    patch.includes("vWorldCloudDirectScale") &&
    patch.includes("grassBackLight *= vWorldCloudDirectScale") &&
    patch.includes("grassSheen *= vWorldCloudDirectScale"),
  "High-overdraw blade grass must sample the cloud field per vertex/root and apply it to direct diffuse, transmission, and sheen.",
);
assert(
  patch.includes("patchGrassVertexLitShaderMaterial") &&
    patch.includes("directionalLights[i].color * worldCloudDirectScale") &&
    patch.includes("vGrassBackLight = worldCloudDirectScale * pow("),
  "Impostor and detail-foliage vertex lighting must share cloud direct-light modulation without fragment cloud lookups.",
);
assert(
  patch.includes("waterCloudDirectScale") &&
    patch.includes("waterGlintBreakup * waterCloudDirectScale") &&
    integrator.includes("HORIZON_RESPONSE_STRENGTH = 0.35") &&
    integrator.includes('object.name.startsWith("world-tree-")') &&
    integrator.includes('name.startsWith("world-stone-")'),
  "Water glints, distant horizon, stones, and trees must participate while preserving weaker atmospheric horizon contrast.",
);
assert(
  environment.includes("new WorldCloudShadowController") &&
    environment.includes("this.cloudShadow.update(safeDelta, focus, this.elapsedSeconds)") &&
    environment.includes('disposeSafely(this.cloudShadow, "Cloud shadow system")') &&
    controller.includes("new WorldCloudShadowMap") &&
    controller.includes("new WorldCloudShadowSceneIntegrator") &&
    controller.includes("this.map.update(") &&
    controller.includes("this.integrator.update(deltaSeconds)") &&
    controller.includes('disposeSafely(this.map, "Cloud shadow map")') &&
    lighting.includes("directAttenuationEnabled"),
  "Environment ownership must delegate map/integration lifecycle to the cloud-shadow controller and retain a diagnostic bypass for global direct attenuation.",
);
assert(
  lighting.includes("cloud.baseHeight - focus.y") &&
    lighting.includes("sampleX = focus.x + SUN_DIRECTION.x * cloudHeightAlongSun") &&
    lighting.includes("sampleZ = focus.z + SUN_DIRECTION.z * cloudHeightAlongSun"),
  "Focus transmittance must project from the actual focus world height onto the same cloud plane used by spatial consumers.",
);
assert(
  diagnostics.includes("Spatial cloud shadow") &&
    diagnostics.includes("Global cloud direct") &&
    diagnostics.includes("Sun shadow map") &&
    diagnostics.includes("Terrain") &&
    diagnostics.includes("Grass") &&
    diagnostics.includes("Water") &&
    diagnostics.includes("readPixels") &&
    diagnostics.includes("focus T") &&
    diagnostics.includes("originalVisibility") &&
    diagnostics.includes("this.originalVisibility.clear()"),
  "Diagnostics must support binary-search isolation, live transmittance inspection, and restore debug visibility state on disposal.",
);

console.log(
  "[cloud-shadow] Bounded world-space transmittance, direct-only material integration, height-correct focus normalization, grass vertex sampling, distance/edge safety, lifecycle, and diagnostics verified.",
);
