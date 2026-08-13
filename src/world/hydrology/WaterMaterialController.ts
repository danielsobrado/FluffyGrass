import * as THREE from "three";
import type { WorldConfig } from "../WorldConfig";
import {
  WATER_DEEP_COLOR,
  WATER_FOAM_COLOR,
  WATER_IOR,
  WATER_MATERIAL_CACHE_KEY,
  WATER_REFLECTION_COLOR,
  WATER_SHALLOW_COLOR,
  WATER_SPECULAR_COLOR,
} from "./WaterMaterialTuning";
import {
  WATER_FRAGMENT_DECLARATIONS,
  WATER_SURFACE_FRAGMENT,
  WATER_VERTEX_DECLARATIONS,
  WATER_VERTEX_POSITION,
} from "./WaterShader";

export class WaterMaterialController {
  readonly material: THREE.MeshPhysicalMaterial;
  private readonly uniforms: Record<string, THREE.IUniform>;

  constructor(config: WorldConfig) {
    this.material = new THREE.MeshPhysicalMaterial({
      color: WATER_SHALLOW_COLOR,
      roughness: config.waterRoughness,
      metalness: 0,
      ior: WATER_IOR,
      specularColor: WATER_SPECULAR_COLOR,
      specularIntensity: 1,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    this.uniforms = {
      uWaterTime: { value: 0 },
      uWaterOpacity: { value: config.waterOpacity },
      uWaterRippleStrength: { value: config.waterRippleStrength },
      uWaterRippleScale: { value: config.waterRippleScale },
      uWaterFlowSpeed: { value: config.waterFlowSpeed },
      uWaterFoamStrength: { value: config.waterFoamStrength },
      uWaterFresnelStrength: { value: config.waterFresnelStrength },
      uWaterDepthFade: { value: config.waterDepthFade },
      uWaterDetailDistance: { value: config.waterDetailDistance },
      uWaterLakeWaveStrength: { value: config.waterLakeWaveStrength },
      uWaterShallow: { value: WATER_SHALLOW_COLOR },
      uWaterDeep: { value: WATER_DEEP_COLOR },
      uWaterReflection: { value: WATER_REFLECTION_COLOR },
      uWaterFoam: { value: WATER_FOAM_COLOR },
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
        .replace(
          "#include <common>",
          `#include <common>${WATER_VERTEX_DECLARATIONS}`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>${WATER_VERTEX_POSITION}`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>${WATER_FRAGMENT_DECLARATIONS}`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>${WATER_SURFACE_FRAGMENT}`,
        );
    };
    this.material.customProgramCacheKey = () => WATER_MATERIAL_CACHE_KEY;
    this.material.needsUpdate = true;
  }
}
