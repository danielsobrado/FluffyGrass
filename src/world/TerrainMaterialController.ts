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

const MATERIAL_CACHE_KEY = "world-terrain-ecosystem-surface-v10-stone-contact";

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
        uTerrainGrassTintStrength: { value: 0.5 },
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
        uTerrainSoilRich: { value: new THREE.Color("#5b4931") },
        uTerrainSoilDry: { value: new THREE.Color("#9a794b") },
        uTerrainPathSoil: { value: new THREE.Color("#795a38") },
        uTerrainPathDust: { value: new THREE.Color("#c49a62") },
        uTerrainPathGrit: { value: new THREE.Color("#b7a47f") },
        /**
         * Ground worked over by a stone sitting in it. Darker and less red than
         * uTerrainSoilRich because it is soil in permanent shade holding
         * moisture, not open topsoil; the dry side of the mix in the shader
         * borrows uTerrainPathGrit for the mineral fines instead.
         */
        uTerrainStoneContactSoil: { value: new THREE.Color("#4a3626") },
        uTerrainStoneContactReach: { value: 1.35 },
        uTerrainStoneContactDarkening: { value: 0.26 },
        uTerrainStoneOcclusionStrength: { value: 0.3 },
        /**
         * Cliff rock. Two tones close together on purpose: a wide span between
         * a near-black and a pale grey turns every wisp of the continuous noise
         * into a marble vein, which is exactly how the first pass at this read.
         * Lithology supplies the variation now, and it needs far less range.
         */
        uTerrainRockBase: { value: new THREE.Color("#6f604d") },
        uTerrainRockWarm: { value: new THREE.Color("#91704e") },
        uTerrainRockReliefStrength: { value: 0.85 },
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
    this.uniforms.uTerrainGrassTintStrength.value =
      direction.terrainGrassTintStrength;
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
        .replace(
          "#include <common>",
          `#include <common>${TERRAIN_DETAIL_VERTEX}`,
        )
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
