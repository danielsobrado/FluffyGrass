import * as THREE from "three";
import {
  GRASS_MACRO_DRYNESS_STRENGTH,
  sampleGrassMacroDryness,
  sampleGrassMacroVigor,
} from "../../grass/GrassFieldVariation";
import { GRASS_BIOME_PROFILES } from "../../grass/biome/GrassBiomeProfile";
import type { WorldConfig } from "../WorldConfig";
import {
  resolveGrassBiomeDensity,
  sampleGrassBiome,
} from "../grass/WorldBiomeField";

/**
 * Optional world semantics that do not exist in the current generator yet.
 * A water or climate field can implement this interface without changing the
 * terrain material or its packed vertex contract.
 */
export interface TerrainEnvironmentSampler {
  sampleHumidity(x: number, z: number, height: number): number;
  sampleWaterProximity(x: number, z: number, height: number): number;
}

/** Packed semantic channels consumed by the terrain shader. */
export interface TerrainSurfaceTargets {
  /** suitability, vigor, dryness, biome density */
  ecology: THREE.Vector4;
  /** normalized altitude, humidity, water proximity, material scratch */
  environment: THREE.Vector4;
  /** dominant biome, neighbor biome, neighbor blend */
  biome: THREE.Vector3;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Converts terrain/grass semantics into stable material inputs at build time. */
export class TerrainSurfaceField {
  constructor(
    private readonly config: WorldConfig,
    private readonly environment?: TerrainEnvironmentSampler,
  ) {}

  sample(
    x: number,
    z: number,
    height: number,
    suitability: number,
    targets: TerrainSurfaceTargets,
  ): void {
    const vigor = sampleGrassMacroVigor(x, z);
    const macroDryness = sampleGrassMacroDryness(x, z);
    const biome = sampleGrassBiome(x, z);
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
        drynessBias,
    );
    const altitude = clamp01(
      (height - this.config.grassMinAltitude) /
        (this.config.grassMaxAltitude - this.config.grassMinAltitude),
    );
    const humidity = this.environment
      ? clamp01(this.environment.sampleHumidity(x, z, height))
      : clamp01((1 - dryness) * 0.68 + vigor * 0.32);
    const waterProximity = this.environment
      ? clamp01(this.environment.sampleWaterProximity(x, z, height))
      : 0;

    targets.ecology.set(
      clamp01(suitability),
      vigor,
      dryness,
      resolveGrassBiomeDensity(biome),
    );
    targets.environment.set(altitude, humidity, waterProximity, 0);
    targets.biome.set(biome.indexA, biome.indexB, biome.blend);
  }
}
