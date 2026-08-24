import * as THREE from "three";
import { GRASS_BIOME_PROFILES } from "../../grass/biome/GrassBiomeProfile";
import type { WorldEcologySample } from "../ecology/WorldEcologyField";
import type { HydrologySample } from "../hydrology/HydrologyField";
import type { WorldConfig } from "../WorldConfig";
import {
  createGrassBiomeSample,
  resolveGrassBiomeDensity,
  sampleGrassBiome,
  type GrassBiomeSample,
} from "../grass/WorldBiomeField";
import {
  createGrassHabitatSample,
  sampleGrassHabitat,
  type GrassHabitatSample,
} from "../grass/GrassHabitatField";
import {
  sampleStoneGrassClearance,
  sampleStoneGroundInfluence,
} from "../stones/StoneClearance";
import {
  createMutableStoneGroundInfluence,
  type MutableStoneGroundInfluence,
} from "../stones/StoneGroundInfluence";
import {
  sampleGrassMacroDryness,
  sampleGrassMacroVigor,
} from "../../grass/GrassFieldVariation";
import {
  TERRAIN_HUMIDITY_DRYNESS_WEIGHT,
  TERRAIN_HUMIDITY_VIGOR_WEIGHT,
} from "./TerrainSurfaceTuning";

/** Packed semantic channels consumed by the terrain shader. */
export interface TerrainSurfaceTargets {
  /** suitability, vigor, dryness, biome density */
  ecology: THREE.Vector4;
  /** normalized altitude, humidity, water proximity, stone clearance */
  environment: THREE.Vector4;
  /**
   * Dominant biome, neighbor biome, neighbor blend, and the macro dryness this
   * vertex was sampled with.
   *
   * The fourth channel exists so the fragment stage can subtract the
   * low-frequency dryness a vertex could resolve before adding the one it
   * evaluates itself. Without it the per-fragment field would double-count the
   * term `sampleGrassHabitat` already folded into `ecology.z`.
   */
  biome: THREE.Vector4;
  /** Dominant compacted-soil stone: centre XZ, inner radius, outer radius. */
  stoneContact: THREE.Vector4;
  /**
   * Dominant contact-shadow centre. Optional for older isolated probes; runtime
   * terrain always supplies it and the regression gate enforces that contract.
   */
  stoneOcclusionCenter?: THREE.Vector2;
  /** Reach of the independently selected contact-shadow owner. */
  stoneOcclusionRadius: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Converts shared grass and hydrology semantics into stable terrain inputs. */
export class TerrainSurfaceField {
  private readonly biomeSample: GrassBiomeSample = createGrassBiomeSample();
  private readonly habitatSample: GrassHabitatSample =
    createGrassHabitatSample();
  private readonly groundInfluence: MutableStoneGroundInfluence =
    createMutableStoneGroundInfluence();

  constructor(private readonly config: WorldConfig) {}

  sample(
    x: number,
    z: number,
    height: number,
    suitability: number,
    hydrology: HydrologySample,
    ecology: WorldEcologySample,
    targets: TerrainSurfaceTargets,
  ): void {
    const vigor = sampleGrassMacroVigor(x, z);
    const biome = sampleGrassBiome(x, z, this.biomeSample);
    const profileA = GRASS_BIOME_PROFILES[biome.indexA];
    const profileB = GRASS_BIOME_PROFILES[biome.indexB];
    const drynessBias = THREE.MathUtils.lerp(
      profileA?.drynessBias ?? 0,
      profileB?.drynessBias ?? profileA?.drynessBias ?? 0,
      biome.blend,
    );
    const heightMin = THREE.MathUtils.lerp(
      profileA?.heightBand[0] ?? 1,
      profileB?.heightBand[0] ?? profileA?.heightBand[0] ?? 1,
      biome.blend,
    );
    const heightMax = THREE.MathUtils.lerp(
      profileA?.heightBand[1] ?? 1,
      profileB?.heightBand[1] ?? profileA?.heightBand[1] ?? 1,
      biome.blend,
    );
    const accentDensity = THREE.MathUtils.lerp(
      profileA?.accentDensity ?? 0,
      profileB?.accentDensity ?? profileA?.accentDensity ?? 0,
      biome.blend,
    );
    const minimumClimateDensityRetention = THREE.MathUtils.lerp(
      profileA?.minimumClimateDensityRetention ?? 0,
      profileB?.minimumClimateDensityRetention ??
        profileA?.minimumClimateDensityRetention ??
        0,
      biome.blend,
    );
    sampleGrassHabitat(
      x,
      z,
      ecology,
      resolveGrassBiomeDensity(biome),
      minimumClimateDensityRetention,
      heightMin,
      heightMax,
      drynessBias,
      accentDensity,
      this.config,
      this.habitatSample,
    );
    const altitude = clamp01(
      (height - this.config.grassMinAltitude) /
        (this.config.grassMaxAltitude - this.config.grassMinAltitude),
    );
    const humidity = clamp01(
      (1 - this.habitatSample.dryness) * TERRAIN_HUMIDITY_DRYNESS_WEIGHT +
        vigor * TERRAIN_HUMIDITY_VIGOR_WEIGHT +
        hydrology.humidityBoost,
    );

    targets.ecology.set(
      clamp01(suitability),
      vigor,
      this.habitatSample.dryness,
      this.habitatSample.density,
    );
    targets.environment.set(
      altitude,
      humidity,
      hydrology.waterProximity,
      clamp01(sampleStoneGrassClearance(x, z)),
    );
    const influence = sampleStoneGroundInfluence(x, z, this.groundInfluence);
    targets.stoneContact.set(
      influence.centerX,
      influence.centerZ,
      influence.innerClearRadius,
      influence.contactSoilRadius,
    );
    targets.stoneOcclusionCenter?.set(
      influence.occlusionCenterX,
      influence.occlusionCenterZ,
    );
    targets.stoneOcclusionRadius = influence.occlusionRadius;
    targets.biome.set(
      biome.indexA,
      biome.indexB,
      biome.blend,
      sampleGrassMacroDryness(x, z),
    );
  }
}
