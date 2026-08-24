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
import { resolveGrassPlacementGrid } from "./grass/GrassClumpLattice";
import type { WorldConfig } from "./WorldConfig";
import { TerrainSurfacePalette } from "./terrain/TerrainSurfacePalette";
import { createTerrainSurfaceNoiseTexture } from "./terrain/TerrainSurfaceNoiseTexture";
import {
  createTerrainMacroFieldTexture,
  resolveTerrainMacroFieldExtent,
} from "./terrain/TerrainMacroFieldTexture";

const MATERIAL_CACHE_KEY = "world-terrain-ecosystem-surface-v16-clump-alignment";

export class TerrainMaterialController {
  readonly material: THREE.MeshLambertMaterial;
  private readonly surfaceNoiseTexture: THREE.DataTexture;
  private readonly macroFieldTexture?: THREE.DataTexture;
  private readonly palette = new TerrainSurfacePalette();
  private readonly uniforms: Record<string, THREE.IUniform>;
  private disposed = false;

  constructor(
    config: WorldConfig,
    readonly shadows: boolean,
    /**
     * Selects how the macro ecology fields reach the fragment stage.
     *
     * Desktop evaluates them exactly, sixteen integer hashes per ground
     * fragment. Integrated GPUs commonly issue integer multiplies at a quarter
     * of their float rate, so compact reads a baked 4 m grid of the same
     * functions instead and accepts about 1.5% of resampling error for it.
     */
    private readonly compact = false,
  ) {
    const material = new THREE.MeshLambertMaterial({ vertexColors: true });
    let surfaceNoiseTexture: THREE.DataTexture | undefined;
    let macroFieldTexture: THREE.DataTexture | undefined;
    try {
      surfaceNoiseTexture = createTerrainSurfaceNoiseTexture(config.seed);
      macroFieldTexture = compact
        ? createTerrainMacroFieldTexture(config.worldSize)
        : undefined;
      const nearDensity = compact
        ? config.grassNearBladesPerSquareMeterCompact
        : config.grassNearBladesPerSquareMeterDesktop;
      const basePlacementGrid = resolveGrassPlacementGrid(
        config.grassNearTileSize,
        nearDensity,
        1,
      );
      this.material = material;
      this.surfaceNoiseTexture = surfaceNoiseTexture;
      this.macroFieldTexture = macroFieldTexture;
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
        /**
         * The ground's own distance schedules.
         *
         * These used to be one vec4 filled from the grass preset's near and mid
         * distances, so the ground's micro grain, its meso mottling and its
         * canopy merge all changed across the same radii the vegetation handed
         * off at. That is what made the hillside band. They are independent
         * config now, and `setGrassArtDirection` no longer touches them.
         */
        uTerrainMicroRange: {
          value: new THREE.Vector2(
            config.terrainMicroDetailStart,
            config.terrainMicroDetailEnd,
          ),
        },
        uTerrainMesoRange: {
          value: new THREE.Vector2(
            config.terrainMesoDetailStart,
            config.terrainMesoDetailEnd,
          ),
        },
        uTerrainCanopyMergeRange: {
          value: new THREE.Vector2(
            config.terrainCanopyMergeStart,
            config.terrainCanopyMergeEnd,
          ),
        },
        uTerrainCanopyMergeStrength: {
          value: config.terrainCanopyMergeStrength,
        },
        uTerrainBandJitterRatio: { value: config.lodBandJitterRatio },
        uTerrainCommunityTintStrength: {
          value: config.terrainCommunityTintStrength,
        },
        /**
         * Damp organic ground under a closed leaf layer. Darker and cooler than
         * any soil tone, because it is not soil: it is accumulated leaf litter
         * and moss, and it has to be a different material from both the earth
         * beside it and the canopy above it or the broadleaf community reads as
         * more of the same green.
         */
        uTerrainMoss: { value: new THREE.Color("#4a5f34") },
        /**
         * The third soil tone. Grey-brown rather than warm, because two tones
         * mixed on one axis can only ever be one hue at two brightnesses --
         * which is what let the ground read as a single mustard fill wherever
         * the grass opened up.
         */
        uTerrainSoilGrey: { value: new THREE.Color("#7a6f5c") },
        uTerrainSoilHuePeriod: { value: config.terrainSoilHueWorldSize },
        uTerrainSoilHueSeed: { value: (config.seed ^ 0x5a_3d_11_07) >>> 0 },
        uTerrainSoilHueStrength: { value: config.terrainSoilHueStrength },
        uTerrainFleckStrength: { value: config.terrainGroundFleckStrength },
        /** Metres per cell of the soil mottle: the 2-5 m band nothing occupied. */
        uTerrainFleckPeriod: { value: 3.4 },
        uTerrainFleckSeed: { value: (config.seed ^ 0x6c_18_3b_a9) >>> 0 },
        uTerrainHollowDarkening: { value: config.terrainHollowDarkening },
        uTerrainHollowMoisture: { value: config.terrainHollowMoisture },
        uTerrainMossStrength: { value: config.terrainMossStrength },
        /**
         * Exact base near-grass clump span. Placement and terrain use the same
         * requested-count/grid resolver, including compact density and the
         * slightly different X/Z dimensions caused by rows versus columns.
         */
        uTerrainClumpSpan: {
          value: new THREE.Vector2(
            basePlacementGrid.clumpSpanX,
            basePlacementGrid.clumpSpanZ,
          ),
        },
        uTerrainClumpAo: { value: config.terrainClumpContactAo },
        uTerrainClumpLitter: { value: config.terrainClumpLitterStrength },
        uTerrainClumpSeed: { value: config.seed >>> 0 },
        uTerrainMacroField: { value: macroFieldTexture ?? null },
        uTerrainMacroFieldExtent: {
          value: new THREE.Vector2(
            resolveTerrainMacroFieldExtent(config.worldSize),
            resolveTerrainMacroFieldExtent(config.worldSize),
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
        uTerrainPathGrassEdge: { value: config.pathGrassEdgeRoughness },
        uTerrainVergeFleckStrength: {
          value: config.terrainVergeFleckStrength,
        },
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
        disposeResources([material, surfaceNoiseTexture, macroFieldTexture]);
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
    // Deliberately does not touch the ground's distance schedules. Deriving
    // them from the preset's near/mid distances is what put three ground terms
    // on the same two radii as three vegetation terms; the ground keeps its own
    // ranges whatever the art direction does with the grass.
    this.uniforms.uTerrainGrassTintStrength.value =
      direction.terrainGrassTintStrength;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    disposeResources([
      this.material,
      this.surfaceNoiseTexture,
      this.macroFieldTexture,
    ]);
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
          `#include <common>${
            this.compact ? "\n#define TERRAIN_MACRO_FIELD_TEXTURE\n" : ""
          }${TERRAIN_DETAIL_FRAGMENT}`,
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
    // The macro-field define changes the compiled program, so the two profiles
    // must not share a cache entry.
    this.material.customProgramCacheKey = () =>
      this.compact ? `${MATERIAL_CACHE_KEY}-macro-texture` : MATERIAL_CACHE_KEY;
    this.material.needsUpdate = true;
  }
}
