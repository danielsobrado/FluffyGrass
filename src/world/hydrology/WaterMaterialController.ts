import * as THREE from "three";
import type { WorldConfig } from "../WorldConfig";
import { createWaterBedTexture } from "./WaterBedTexture";
import { createWaterFlowNoiseTexture } from "./WaterFlowNoiseTexture";
import {
  WATER_ALGAE_COLOR,
  WATER_BED_NOISE_SEED_SALT,
  WATER_DEEP_COLOR,
  WATER_FLOW_NOISE_SEED_SALT,
  WATER_FOAM_COLOR,
  WATER_IOR,
  WATER_MATERIAL_CACHE_KEY,
  WATER_PEBBLE_DARK_COLOR,
  WATER_PEBBLE_LIGHT_COLOR,
  WATER_REFLECTION_COLOR,
  WATER_SAND_COLOR,
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
  private readonly flowNoiseTexture: THREE.DataTexture;
  private readonly bedTexture: THREE.DataTexture;
  private readonly uniforms: Record<string, THREE.IUniform>;

  constructor(config: WorldConfig) {
    this.flowNoiseTexture = createWaterFlowNoiseTexture(
      (config.seed ^ WATER_FLOW_NOISE_SEED_SALT) >>> 0,
    );
    this.bedTexture = createWaterBedTexture(
      (config.seed ^ WATER_BED_NOISE_SEED_SALT) >>> 0,
    );
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
      side: THREE.DoubleSide,
    });
    // This is one open height-field surface rather than a transparent volume.
    // Rendering back then front would shade/blend the same sheet twice.
    this.material.forceSinglePass = true;
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
      uWaterFlowNoise: { value: this.flowNoiseTexture },
      uWaterFlowNoiseScale: { value: config.waterFlowNoiseScale },
      uWaterFlowNoiseStrength: { value: config.waterFlowNoiseStrength },
      uWaterCausticStrength: { value: config.waterCausticStrength },
      uWaterGlintStrength: { value: config.waterGlintStrength },
      uWaterStoneWakeStrength: { value: config.waterStoneWakeStrength },
      uWaterBedNoise: { value: this.bedTexture },
      uWaterBedScale: { value: config.waterBedScale },
      uWaterBedStrength: { value: config.waterBedStrength },
      uWaterBedRefraction: { value: config.waterBedRefraction },
      uWaterAlgaeStrength: { value: config.waterAlgaeStrength },
      uWaterShallow: { value: WATER_SHALLOW_COLOR },
      uWaterDeep: { value: WATER_DEEP_COLOR },
      uWaterReflection: { value: WATER_REFLECTION_COLOR },
      uWaterFoam: { value: WATER_FOAM_COLOR },
      uWaterPebbleDark: { value: WATER_PEBBLE_DARK_COLOR },
      uWaterPebbleLight: { value: WATER_PEBBLE_LIGHT_COLOR },
      uWaterSand: { value: WATER_SAND_COLOR },
      uWaterAlgae: { value: WATER_ALGAE_COLOR },
    };
    this.configureMaterial();
  }

  update(elapsedSeconds: number): void {
    this.uniforms.uWaterTime.value = elapsedSeconds;
  }

  dispose(): void {
    this.flowNoiseTexture.dispose();
    this.bedTexture.dispose();
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
