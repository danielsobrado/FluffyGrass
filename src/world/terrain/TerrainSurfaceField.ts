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
import { sampleGrassMacroVigor } from "../../grass/GrassFieldVariation";

/** Packed semantic channels consumed by the terrain shader. */
export interface TerrainSurfaceTargets {
  /** suitability, vigor, dryness, biome density */
  ecology: THREE.Vector4;
  /** normalized altitude, humidity, water proximity, stone clearance */
  environment: THREE.Vector4;
  /** dominant biome, neighbor biome, neighbor blend */
  biome: THREE.Vector3;
  /**
   * Nearest stone centre in world XZ, then the radii its contact band runs
   * between. The shader measures its own distance to that centre, so the band
   * lands at pixel resolution instead of at terrain-vertex resolution.
   */
  stoneContact: THREE.Vector4;
  /**
   * Reach of the nearest stone's contact shadow. Kept apart from the contact
   * band above because it is a different effect with a different radius: the
   * soil stain is what the stone has done to the ground, this is the sky the
   * stone is standing in front of, and it reaches further and falls on grass as
   * readily as on bare earth.
   */
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
      (1 - this.habitatSample.dryness) * 0.68 +
        vigor * 0.32 +
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
    targets.stoneOcclusionRadius = influence.occlusionRadius;
    targets.biome.set(biome.indexA, biome.indexB, biome.blend);
  }
}
