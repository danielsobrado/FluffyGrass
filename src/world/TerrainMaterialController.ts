import * as THREE from "three";
import type { GrassArtDirection } from "../grass/GrassArtDirection";
import { disposeResources } from "../render/ResourceDisposal";
import { PATH_GRASS_FEATHER } from "./TerrainField";
import {
  TERRAIN_DETAIL_COLOR,
  TERRAIN_DETAIL_FRAGMENT,
  TERRAIN_DETAIL_NORMAL,
  TERRAIN_DETAIL_POSITION,
  TERRAIN_DETAIL_VERTEX,
  TERRAIN_WET_SHEEN,
} from "./TerrainMaterialShader";
import type { WorldConfig } from "./WorldConfig";
import { TerrainSurfacePalette } from "./terrain/TerrainSurfacePalette";
import { createTerrainSurfaceNoiseTexture } from "./terrain/TerrainSurfaceNoiseTexture";

const MATERIAL_CACHE_KEY = "world-terrain-ecosystem-surface-v6-cliff-rock";

export class TerrainMaterialController {
  readonly material: THREE.MeshLambertMaterial;
  private readonly surfaceNoiseTexture: THREE.DataTexture;
  private readonly palette = new TerrainSurfacePalette();
  private readonly uniforms: Record<string, THREE.IUniform>;
  private disposed = false;

  constructor(
    config: WorldConfig,
    readonly shadows: boolean,
  ) {
    const material = new THREE.MeshLambertMaterial({ vertexColors: true });
    let surfaceNoiseTexture: THREE.DataTexture | undefined;
    try {
      surfaceNoiseTexture = createTerrainSurfaceNoiseTexture(config.seed);
      this.material = material;
      this.surfaceNoiseTexture = surfaceNoiseTexture;
      this.uniforms = {
        uTerrainSurfaceNoise: { value: this.surfaceNoiseTexture },
        uTerrainNoiseWorldSize: { value: config.terrainGroundNoiseWorldSize },
        uTerrainMesoStrength: { value: config.terrainGroundMesoStrength },
        uTerrainMicroStrength: { value: config.terrainGroundMicroStrength },
        uTerrainNormalStrength: { value: config.terrainGroundNormalStrength },
        uTerrainCanopyDarkening: {
          value: config.terrainGroundCanopyDarkening,
        },
        uTerrainLodDistances: {
          value: new THREE.Vector4(
            config.grassUltraNearDistance,
            config.grassUltraNearTransitionDistance,
            config.grassNearDistance,
            config.grassMidDistance,
          ),
        },
        uTerrainPathHalfWidth: {
          value: new THREE.Vector2(
            config.pathWidth * 0.5,
            config.pathBranchWidth * 0.5,
          ),
        },
        uTerrainPathEdge: { value: config.pathEdgeRoughness },
        uTerrainPathClearance: { value: config.pathGrassClearance },
        uTerrainPathGrassFeather: { value: PATH_GRASS_FEATHER },
        uTerrainPathCoreDarkening: { value: config.terrainPathCoreDarkening },
        uTerrainPathVergeDryness: { value: config.terrainPathVergeDryness },
        uTerrainWetSheenStrength: { value: 0.55 },
        uTerrainWetSheenPower: { value: 42 },
        uTerrainSoilRich: { value: new THREE.Color("#40382b") },
        uTerrainSoilDry: { value: new THREE.Color("#66513b") },
        uTerrainPathSoil: { value: new THREE.Color("#574833") },
        uTerrainPathDust: { value: new THREE.Color("#8d7350") },
        uTerrainPathGrit: { value: new THREE.Color("#a1968a") },
        // Cliff rock. Dark, because rock is: an albedo bright enough to read
        // well on flat ground leaves a gorge wall looking like plaster.
        uTerrainRockDark: { value: new THREE.Color("#2b2723") },
        uTerrainRockLight: { value: new THREE.Color("#8a8074") },
        uTerrainBiomeBase: { value: this.palette.base },
        uTerrainBiomeTip: { value: this.palette.tip },
        uTerrainBiomeDry: { value: this.palette.dry },
        uTerrainBiomeShade: { value: this.palette.shade },
      };
      this.configureMaterial();
    } catch (error) {
      try {
        disposeResources([material, surfaceNoiseTexture]);
      } catch (cleanupError) {
        console.warn(
          "[Drusniel World] Terrain material construction cleanup failed.",
          cleanupError,
        );
      }
      throw error;
    }
  }

  setGrassArtDirection(direction: GrassArtDirection): void {
    if (this.disposed) {
      return;
    }
    this.palette.apply(direction);
    const lod = this.uniforms.uTerrainLodDistances.value as THREE.Vector4;
    lod.z = direction.nearDistance;
    lod.w = direction.midDistance;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    disposeResources([this.material, this.surfaceNoiseTexture]);
  }

  private configureMaterial(): void {
    this.material.name = "world-terrain-material";
    this.material.dithering = true;
    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>${TERRAIN_DETAIL_VERTEX}`)
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>${TERRAIN_DETAIL_POSITION}`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>${TERRAIN_DETAIL_FRAGMENT}`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>${TERRAIN_DETAIL_COLOR}`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>${TERRAIN_DETAIL_NORMAL}`,
        )
        .replace(
          "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",
          `vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;${TERRAIN_WET_SHEEN}`,
        );
    };
    this.material.customProgramCacheKey = () => MATERIAL_CACHE_KEY;
    this.material.needsUpdate = true;
  }
}
