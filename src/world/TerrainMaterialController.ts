import * as THREE from "three";
import type { GrassArtDirection } from "../grass/GrassArtDirection";
import { PATH_GRASS_FEATHER } from "./TerrainField";
import {
  TERRAIN_DETAIL_COLOR,
  TERRAIN_DETAIL_FRAGMENT,
  TERRAIN_DETAIL_NORMAL,
  TERRAIN_DETAIL_POSITION,
  TERRAIN_DETAIL_VERTEX,
} from "./TerrainMaterialShader";
import type { WorldConfig } from "./WorldConfig";
import { TerrainSurfacePalette } from "./terrain/TerrainSurfacePalette";
import { createTerrainSurfaceNoiseTexture } from "./terrain/TerrainSurfaceNoiseTexture";

const MATERIAL_CACHE_KEY = "world-terrain-ecosystem-surface-v3-hydrology";

export class TerrainMaterialController {
  readonly material = new THREE.MeshLambertMaterial({ vertexColors: true });
  private readonly surfaceNoiseTexture: THREE.DataTexture;
  private readonly palette = new TerrainSurfacePalette();
  private readonly uniforms: Record<string, THREE.IUniform>;

  constructor(
    config: WorldConfig,
    readonly shadows: boolean,
  ) {
    this.surfaceNoiseTexture = createTerrainSurfaceNoiseTexture(config.seed);
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
      uTerrainSoilRich: { value: new THREE.Color("#40382b") },
      uTerrainSoilDry: { value: new THREE.Color("#66513b") },
      uTerrainPathSoil: { value: new THREE.Color("#574833") },
      uTerrainPathDust: { value: new THREE.Color("#8d7350") },
      uTerrainPathGrit: { value: new THREE.Color("#a1968a") },
      uTerrainBiomeBase: { value: this.palette.base },
      uTerrainBiomeTip: { value: this.palette.tip },
      uTerrainBiomeDry: { value: this.palette.dry },
      uTerrainBiomeShade: { value: this.palette.shade },
    };
    this.configureMaterial();
  }

  setGrassArtDirection(direction: GrassArtDirection): void {
    this.palette.apply(direction);
    const lod = this.uniforms.uTerrainLodDistances.value as THREE.Vector4;
    lod.z = direction.nearDistance;
    lod.w = direction.midDistance;
  }

  dispose(): void {
    this.material.dispose();
    this.surfaceNoiseTexture.dispose();
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
        );
    };
    this.material.customProgramCacheKey = () => MATERIAL_CACHE_KEY;
    this.material.needsUpdate = true;
  }
}
