import * as THREE from "three";
import type { WorldConfig } from "../WorldConfig";

const VERTEX_COMMON = `
attribute float stoneMoss;
attribute float stoneLichen;
attribute float stoneGrowthSeed;
attribute vec3 stoneMossColor;
attribute vec3 stoneLichenColor;
varying vec3 vStoneWorldPosition;
varying vec3 vStoneWorldNormal;
varying float vStoneMoss;
varying float vStoneLichen;
varying float vStoneGrowthSeed;
varying vec3 vStoneMossColor;
varying vec3 vStoneLichenColor;
`;

const VERTEX_POSITION = `
vStoneWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
vStoneWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
vStoneMoss = stoneMoss;
vStoneLichen = stoneLichen;
vStoneGrowthSeed = stoneGrowthSeed;
vStoneMossColor = stoneMossColor;
vStoneLichenColor = stoneLichenColor;
`;

const GROWTH_FRAGMENT_COMMON = `
uniform float uStoneGrowthDetailStrength;
uniform float uStoneGrowthDetailScale;
uniform vec2 uStoneGrowthDetailFade;
uniform float uStoneMossStreakStrength;
varying vec3 vStoneWorldPosition;
varying vec3 vStoneWorldNormal;
varying float vStoneMoss;
varying float vStoneLichen;
varying float vStoneGrowthSeed;
varying vec3 vStoneMossColor;
varying vec3 vStoneLichenColor;

float stoneGrowthHash(vec2 p) {
  vec3 p3 = fract(p.xyx * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float stoneGrowthNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(stoneGrowthHash(i), stoneGrowthHash(i + vec2(1.0, 0.0)), u.x),
    mix(
      stoneGrowthHash(i + vec2(0.0, 1.0)),
      stoneGrowthHash(i + vec2(1.0, 1.0)),
      u.x
    ),
    u.y
  );
}

vec2 stoneGrowthProjection(vec3 position, vec3 normal) {
  vec3 axis = abs(normal);
  if (axis.y >= axis.x && axis.y >= axis.z) {
    return position.xz;
  }
  if (axis.x >= axis.z) {
    return position.zy;
  }
  return position.xy;
}
`;

const GROWTH_COLOR = `
if ((vStoneMoss + vStoneLichen) > 0.001) {
  vec3 stoneGrowthNormal = normalize(vStoneWorldNormal);
  vec2 stoneGrowthOffset = vec2(
    vStoneGrowthSeed * 37.17,
    vStoneGrowthSeed * 71.93
  );
  vec2 stoneGrowthUv =
    stoneGrowthProjection(vStoneWorldPosition, stoneGrowthNormal) +
    stoneGrowthOffset;
  float stoneGrowthDistance = distance(cameraPosition, vStoneWorldPosition);
  float stoneGrowthDetailFade = 1.0 - smoothstep(
    uStoneGrowthDetailFade.x,
    uStoneGrowthDetailFade.y,
    stoneGrowthDistance
  );
  float stoneColonyNoise = stoneGrowthNoise(
    stoneGrowthUv * uStoneGrowthDetailScale * 0.32 + vec2(7.31, 19.17)
  );
  float stoneColonyMask = smoothstep(
    0.18,
    0.72,
    stoneColonyNoise + vStoneMoss * 0.24
  );
  float stoneMossCoverage = vStoneMoss * mix(
    1.0,
    stoneColonyMask,
    min(0.86, uStoneGrowthDetailStrength * 0.86)
  );

  float stoneLichenNoise = stoneGrowthNoise(
    stoneGrowthUv * uStoneGrowthDetailScale * 1.45 + vec2(41.73, 8.91)
  );
  float stoneLichenCoverage = vStoneLichen * smoothstep(
    0.56,
    0.82,
    stoneLichenNoise
  );

  if (stoneGrowthDetailFade > 0.001) {
    float stoneFineNoise = stoneGrowthNoise(
      stoneGrowthUv * uStoneGrowthDetailScale * 2.35 + vec2(23.41, 57.13)
    );
    float stoneMossBreakup = smoothstep(
      0.27,
      0.76,
      stoneFineNoise * 0.64 + stoneColonyNoise * 0.36
    );
    stoneMossCoverage *= mix(
      1.0,
      stoneMossBreakup,
      uStoneGrowthDetailStrength * stoneGrowthDetailFade
    );

    float stoneSideAmount = 1.0 - abs(stoneGrowthNormal.y);
    float stoneRunoffNoise = stoneGrowthNoise(
      vec2(
        (vStoneWorldPosition.x + vStoneWorldPosition.z * 0.37 +
          vStoneGrowthSeed * 13.0) * uStoneGrowthDetailScale * 0.62,
        vStoneWorldPosition.y * uStoneGrowthDetailScale * 0.24
      ) + vec2(11.7, 3.9)
    );
    float stoneRunoff = smoothstep(0.24, 0.78, stoneRunoffNoise);
    stoneMossCoverage *= mix(
      1.0,
      0.55 + stoneRunoff * 0.58,
      uStoneMossStreakStrength * stoneSideAmount * stoneGrowthDetailFade
    );

    float stoneLichenFine = stoneGrowthNoise(
      stoneGrowthUv * uStoneGrowthDetailScale * 4.2 + vec2(71.1, 14.3)
    );
    float stoneLichenBreakup = smoothstep(
      0.62,
      0.86,
      stoneLichenFine * 0.68 + stoneLichenNoise * 0.32
    );
    stoneLichenCoverage *= mix(
      1.0,
      stoneLichenBreakup,
      uStoneGrowthDetailStrength * stoneGrowthDetailFade
    );
  }

  stoneMossCoverage = clamp(stoneMossCoverage, 0.0, 1.0);
  stoneLichenCoverage = clamp(stoneLichenCoverage, 0.0, 1.0);
  vec3 stoneLichenColor =
    vStoneLichenColor * mix(0.90, 1.08, stoneLichenNoise);
  vec3 stoneMossColor =
    vStoneMossColor * mix(0.82, 1.08, stoneColonyNoise);
  diffuseColor.rgb = mix(
    diffuseColor.rgb,
    stoneLichenColor,
    stoneLichenCoverage
  );
  diffuseColor.rgb = mix(
    diffuseColor.rgb,
    stoneMossColor,
    stoneMossCoverage
  );
}
`;

const GRAIN_FRAGMENT_COMMON = `
uniform sampler2D uStoneGrain;
uniform float uStoneGrainStrength;
uniform float uStoneGrainScale;
uniform vec2 uStoneGrainFade;
`;

const GRAIN_COLOR = `
float stoneGrainDistance = distance(cameraPosition, vStoneWorldPosition);
float stoneGrainFade = 1.0 - smoothstep(
  uStoneGrainFade.x,
  uStoneGrainFade.y,
  stoneGrainDistance
);
if (stoneGrainFade > 0.001) {
  vec3 stoneBlend = pow(abs(vStoneWorldNormal), vec3(4.0));
  stoneBlend /= max(stoneBlend.x + stoneBlend.y + stoneBlend.z, 0.0001);
  vec2 stoneUvX = vStoneWorldPosition.zy * uStoneGrainScale;
  vec2 stoneUvY = vStoneWorldPosition.xz * uStoneGrainScale;
  vec2 stoneUvZ = vStoneWorldPosition.xy * uStoneGrainScale;
  float stoneGrain =
    texture2D(uStoneGrain, stoneUvX).r * stoneBlend.x +
    texture2D(uStoneGrain, stoneUvY).r * stoneBlend.y +
    texture2D(uStoneGrain, stoneUvZ).r * stoneBlend.z;
  diffuseColor.rgb *= 1.0 +
    (stoneGrain - 0.5) * 2.0 * uStoneGrainStrength * stoneGrainFade;
}
`;

export function applyStoneSurfaceShader(
  material: THREE.MeshLambertMaterial,
  config: WorldConfig,
  grainTexture?: THREE.Texture,
): void {
  const growthFadeEnd = config.stoneGrowthDetailFadeDistance;
  const grainFadeEnd = config.stoneGrainFadeDistance;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uStoneGrowthDetailStrength = {
      value: config.stoneGrowthDetailStrength,
    };
    shader.uniforms.uStoneGrowthDetailScale = {
      value: 1 / config.stoneGrowthDetailSize,
    };
    shader.uniforms.uStoneGrowthDetailFade = {
      value: new THREE.Vector2(growthFadeEnd * 0.55, growthFadeEnd),
    };
    shader.uniforms.uStoneMossStreakStrength = {
      value: config.stoneMossStreakStrength,
    };

    let fragmentCommon = GROWTH_FRAGMENT_COMMON;
    let colorFragment = GROWTH_COLOR;
    if (grainTexture) {
      shader.uniforms.uStoneGrain = { value: grainTexture };
      shader.uniforms.uStoneGrainStrength = { value: config.stoneGrainStrength };
      shader.uniforms.uStoneGrainScale = { value: 1 / config.stoneGrainSize };
      shader.uniforms.uStoneGrainFade = {
        value: new THREE.Vector2(grainFadeEnd * 0.6, grainFadeEnd),
      };
      fragmentCommon += GRAIN_FRAGMENT_COMMON;
      colorFragment += GRAIN_COLOR;
    }

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>${VERTEX_COMMON}`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>${VERTEX_POSITION}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>${fragmentCommon}`)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>${colorFragment}`,
      );
  };

  material.customProgramCacheKey = () =>
    `world-stone-surface-v3:${grainTexture ? "grain" : "growth"}`;
  material.needsUpdate = true;
}
