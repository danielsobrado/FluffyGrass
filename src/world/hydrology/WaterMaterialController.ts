import * as THREE from "three";
import type { WorldConfig } from "../WorldConfig";

const MATERIAL_CACHE_KEY = "world-water-hydrology-v1";
const WATER_SHALLOW = new THREE.Color("#5d9aa2");
const WATER_DEEP = new THREE.Color("#315f70");
const WATER_SPECULAR = new THREE.Color("#d5edf0");

const WATER_VERTEX = `
attribute float waterCoverage;
varying float vWaterCoverage;
varying vec3 vWaterWorldPosition;
`;

const WATER_POSITION = `
vWaterCoverage = waterCoverage;
vWaterWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

const WATER_FRAGMENT = `
uniform float uWaterTime;
uniform float uWaterOpacity;
uniform float uWaterRippleStrength;
uniform float uWaterRippleScale;
uniform vec3 uWaterShallow;
uniform vec3 uWaterDeep;
varying float vWaterCoverage;
varying vec3 vWaterWorldPosition;
`;

const WATER_COLOR = `
if (vWaterCoverage < 0.015) discard;
float waterCoverage = smoothstep(0.02, 0.48, saturate(vWaterCoverage));
float waterWave =
  sin((vWaterWorldPosition.x + uWaterTime * 2.1) * uWaterRippleScale) * 0.55 +
  sin((vWaterWorldPosition.z - uWaterTime * 1.6) * uWaterRippleScale * 1.37) * 0.45;
vec3 waterColor = mix(
  uWaterShallow,
  uWaterDeep,
  smoothstep(0.18, 0.92, waterCoverage)
);
waterColor *= 1.0 + waterWave * uWaterRippleStrength * 0.08;
diffuseColor.rgb = waterColor;
diffuseColor.a *= uWaterOpacity * waterCoverage;
`;

const WATER_NORMAL = `
float waterSlopeX =
  cos((vWaterWorldPosition.x + uWaterTime * 2.1) * uWaterRippleScale) * 0.55;
float waterSlopeZ =
  cos((vWaterWorldPosition.z - uWaterTime * 1.6) * uWaterRippleScale * 1.37) * 0.45;
vec3 waterWorldPerturbation = vec3(-waterSlopeX, 0.0, -waterSlopeZ);
vec3 waterViewPerturbation = (viewMatrix * vec4(waterWorldPerturbation, 0.0)).xyz;
normal = normalize(normal + waterViewPerturbation * uWaterRippleStrength);
`;

export class WaterMaterialController {
  readonly material = new THREE.MeshPhongMaterial({
    color: WATER_SHALLOW,
    specular: WATER_SPECULAR,
    shininess: 88,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  private readonly uniforms: Record<string, THREE.IUniform>;

  constructor(config: WorldConfig) {
    this.uniforms = {
      uWaterTime: { value: 0 },
      uWaterOpacity: { value: config.waterOpacity },
      uWaterRippleStrength: { value: config.waterRippleStrength },
      uWaterRippleScale: { value: config.waterRippleScale },
      uWaterShallow: { value: WATER_SHALLOW },
      uWaterDeep: { value: WATER_DEEP },
    };
    this.configureMaterial();
  }

  update(elapsedSeconds: number): void {
    this.uniforms.uWaterTime.value = elapsedSeconds;
  }

  dispose(): void {
    this.material.dispose();
  }

  private configureMaterial(): void {
    this.material.name = "world-hydrology-water-material";
    this.material.dithering = true;
    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>${WATER_VERTEX}`)
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>${WATER_POSITION}`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>${WATER_FRAGMENT}`)
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>${WATER_COLOR}`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>${WATER_NORMAL}`,
        );
    };
    this.material.customProgramCacheKey = () => MATERIAL_CACHE_KEY;
    this.material.needsUpdate = true;
  }
}
