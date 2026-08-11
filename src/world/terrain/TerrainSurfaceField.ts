import * as THREE from "three";
import {
  GRASS_MACRO_DRYNESS_STRENGTH,
  sampleGrassMacroDryness,
  sampleGrassMacroVigor,
} from "../../grass/GrassFieldVariation";
import { GRASS_BIOME_PROFILES } from "../../grass/biome/GrassBiomeProfile";
import {
  resolveGrassBiomeDensity,
  sampleGrassBiome,
} from "../grass/WorldBiomeField";
import { sampleStoneGrassClearance } from "../stones/StoneClearance";

/** Packed semantic channels consumed by the terrain shader. */
export interface TerrainSurfaceTargets {
  /** suitability, vigor, dryness, biome density */
  ecology: THREE.Vector4;
  /** dominant biome, neighbor biome, neighbor blend, stone clearance */
  biome: THREE.Vector4;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Converts shared grass semantics into stable terrain material inputs. */
export class TerrainSurfaceField {
  sample(
    x: number,
    z: number,
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

    targets.ecology.set(
      clamp01(suitability),
      vigor,
      dryness,
      resolveGrassBiomeDensity(biome),
    );
    targets.biome.set(
      biome.indexA,
      biome.indexB,
      biome.blend,
      clamp01(sampleStoneGrassClearance(x, z)),
    );
  }
}