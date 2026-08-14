import * as THREE from "three";
import {
  GRASS_MACRO_DRYNESS_STRENGTH,
  sampleGrassMacroDryness,
  sampleGrassMacroVigor,
} from "../../grass/GrassFieldVariation";
import { GRASS_BIOME_PROFILES } from "../../grass/biome/GrassBiomeProfile";
import type { HydrologySample } from "../hydrology/HydrologyField";
import type { WorldConfig } from "../WorldConfig";
import {
  createGrassBiomeSample,
  resolveGrassBiomeDensity,
  sampleGrassBiome,
  type GrassBiomeSample,
} from "../grass/WorldBiomeField";
import { sampleStoneGrassClearance } from "../stones/StoneClearance";

/** Packed semantic channels consumed by the terrain shader. */
export interface TerrainSurfaceTargets {
  /** suitability, vigor, dryness, biome density */
  ecology: THREE.Vector4;
  /** normalized altitude, humidity, water proximity, stone clearance */
  environment: THREE.Vector4;
  /** dominant biome, neighbor biome, neighbor blend */
  biome: THREE.Vector3;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Converts shared grass and hydrology semantics into stable terrain inputs. */
export class TerrainSurfaceField {
  private readonly biomeSample: GrassBiomeSample = createGrassBiomeSample();

  constructor(private readonly config: WorldConfig) {}

  sample(
    x: number,
    z: number,
    height: number,
    suitability: number,
    hydrology: HydrologySample,
    targets: TerrainSurfaceTargets,
  ): void {
    const vigor = sampleGrassMacroVigor(x, z);
    const macroDryness = sampleGrassMacroDryness(x, z);
    const biome = sampleGrassBiome(x, z, this.biomeSample);
    const profileA = GRASS_BIOME_PROFILES[biome.indexA];
    const profileB = GRASS_BIOME_PROFILES[biome.indexB];
    const drynessBias = THREE.MathUtils.lerp(
      profileA?.drynessBias ?? 0,
      profileB?.drynessBias ?? profileA?.drynessBias ?? 0,
      biome.blend,
    );
    const dryness = clamp01(
      (1 - suitability) * 0.34 +
        macroDryness * GRASS_MACRO_DRYNESS_STRENGTH +
        drynessBias -
        hydrology.humidityBoost * 0.38,
    );
    const altitude = clamp01(
      (height - this.config.grassMinAltitude) /
        (this.config.grassMaxAltitude - this.config.grassMinAltitude),
    );
    const humidity = clamp01(
      (1 - dryness) * 0.68 + vigor * 0.32 + hydrology.humidityBoost,
    );

    targets.ecology.set(
      clamp01(suitability),
      vigor,
      dryness,
      resolveGrassBiomeDensity(biome),
    );
    targets.environment.set(
      altitude,
      humidity,
      hydrology.waterProximity,
      clamp01(sampleStoneGrassClearance(x, z)),
    );
    targets.biome.set(biome.indexA, biome.indexB, biome.blend);
  }
}
