import * as THREE from "three";
import {
  asWorldCloudShadowUniformRecord,
  type WorldCloudShadowUniforms,
} from "../world/sky/WorldCloudShadowUniforms";
import { WORLD_CLOUD_SHADOW_SAMPLER_GLSL } from "../world/sky/WorldCloudShadowSamplerShader";

const PATCH_CACHE_KEY = "world-cloud-shadow-v1";
const WORLD_POSITION_VARYING = "varying vec3 vWorldCloudPosition;";
const CLOUD_SCALE_VARYING = "varying float vWorldCloudDirectScale;";

export function patchStandardCloudShadowMaterial(
  material: THREE.Material,
  uniforms: WorldCloudShadowUniforms,
  responseStrength = 1,
): void {
  const previousCompile = material.onBeforeCompile;
  const previousCacheKey = material.customProgramCacheKey;
  material.onBeforeCompile = (shader, renderer) => {
    previousCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, asWorldCloudShadowUniformRecord(uniforms));
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>\n${WORLD_POSITION_VARYING}`,
      )
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>\nvWorldCloudPosition = worldPosition.xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\n${WORLD_POSITION_VARYING}\n${WORLD_CLOUD_SHADOW_SAMPLER_GLSL}`,
      )
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
float worldCloudDirectScale = mix(
  1.0,
  resolveRelativeCloudDirectLight(sampleWorldCloudTransmittance(
    vWorldCloudPosition,
    distance(cameraPosition, vWorldCloudPosition)
  )),
  ${responseStrength.toFixed(3)}
);
reflectedLight.directDiffuse *= worldCloudDirectScale;
reflectedLight.directSpecular *= worldCloudDirectScale;`,
      );
    if (material.name === "world-hydrology-water-material") {
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "float waterDistance = distance(cameraPosition, vWaterWorldPosition);",
          `float waterDistance = distance(cameraPosition, vWaterWorldPosition);
float waterCloudDirectScale = resolveRelativeCloudDirectLight(
  sampleWorldCloudTransmittance(vWaterWorldPosition, waterDistance)
);`,
        )
        .replace(
          "float waterGlint = waterSunSpecular * waterGlintBreakup *",
          "float waterGlint = waterSunSpecular * waterGlintBreakup * waterCloudDirectScale *",
        );
    }
  };
  material.customProgramCacheKey = () =>
    `${previousCacheKey.call(material)}|${PATCH_CACHE_KEY}|${responseStrength}`;
  material.needsUpdate = true;
}

export function patchGrassBladeCloudShadowMaterial(
  material: THREE.Material,
  uniforms: WorldCloudShadowUniforms,
): void {
  const previousCompile = material.onBeforeCompile;
  const previousCacheKey = material.customProgramCacheKey;
  material.onBeforeCompile = (shader, renderer) => {
    previousCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, asWorldCloudShadowUniformRecord(uniforms));
    const rootMarker =
      "vec4 grassWorldRoot = modelMatrix * vec4(instanceMatrix[3].xyz, 1.0);";
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>\n${CLOUD_SCALE_VARYING}\n${WORLD_CLOUD_SHADOW_SAMPLER_GLSL}`,
      )
      .replace(
        rootMarker,
        `${rootMarker}
vWorldCloudDirectScale = resolveRelativeCloudDirectLight(
  sampleWorldCloudTransmittance(
    grassWorldRoot.xyz,
    distance(cameraPosition, grassWorldRoot.xyz)
  )
);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\n${CLOUD_SCALE_VARYING}`,
      )
      .replace(
        "vec3 grassLambertLight =",
        `reflectedLight.directDiffuse *= vWorldCloudDirectScale;
grassBackLight *= vWorldCloudDirectScale;
grassSheen *= vWorldCloudDirectScale;
vec3 grassLambertLight =`,
      );
  };
  material.customProgramCacheKey = () =>
    `${previousCacheKey.call(material)}|${PATCH_CACHE_KEY}|grass-vertex`;
  material.needsUpdate = true;
}

export function patchGrassVertexLitShaderMaterial(
  material: THREE.ShaderMaterial,
  uniforms: WorldCloudShadowUniforms,
): void {
  Object.assign(material.uniforms, asWorldCloudShadowUniformRecord(uniforms));
  const cameraDistanceMarker =
    "float cameraDistance = distance(cameraPosition, center);";
  material.vertexShader = material.vertexShader
    .replace(
      "#include <common>",
      `#include <common>\n${WORLD_CLOUD_SHADOW_SAMPLER_GLSL}`,
    )
    .replace(
      cameraDistanceMarker,
      `${cameraDistanceMarker}
float worldCloudDirectScale = resolveRelativeCloudDirectLight(
  sampleWorldCloudTransmittance(center, cameraDistance)
);`,
    )
    .replace(
      "directionalLights[i].color;",
      "directionalLights[i].color * worldCloudDirectScale;",
    )
    .replace(
      "vGrassBackLight = pow(",
      "vGrassBackLight = worldCloudDirectScale * pow(",
    );
  material.customProgramCacheKey = () =>
    `${material.type}|${PATCH_CACHE_KEY}|grass-custom`;
  material.needsUpdate = true;
}
