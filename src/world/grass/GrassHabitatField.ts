import {
  GRASS_MACRO_DRYNESS_STRENGTH,
  sampleGrassMacroDryness,
  sampleGrassMacroVigor,
} from "../../grass/GrassFieldVariation";
import type { WorldEcologySample } from "../ecology/WorldEcologyField";
import type { WorldConfig } from "../WorldConfig";

/**
 * Grass-specific habitat derived from ecology, biome, and one low-frequency
 * patch signal. Callers already own ecology and biome values; this mapper does
 * not resample terrain, hydrology, or ecology.
 */
export interface GrassHabitatSample {
  density: number;
  /** Final density as a retained share of this biome's expected baseline. */
  densityRetention: number;
  height: number;
  dryness: number;
  clumpScale: number;
  underlayer: number;
  directionalLean: number;
  accentChance: number;
}

export const GRASS_CLUSTER_DENSE_NORMAL = 0;
export const GRASS_CLUSTER_SPARSE_OPEN = 1;
export const GRASS_CLUSTER_TALL_WET = 2;
export const GRASS_CLUSTER_SHORT_DRY = 3;
export const GRASS_CLUSTER_FLATTENED = 4;
export const GRASS_CLUSTER_ACCENT = 5;
export const GRASS_CLUSTER_ARCHETYPE_COUNT = 6;

const ARCHETYPE_SALT = 0xa3;
const GRASS_DENSITY_EPSILON = 0.0001;

export function createGrassHabitatSample(): GrassHabitatSample {
  return {
    density: 1,
    densityRetention: 1,
    height: 1,
    dryness: 0,
    clumpScale: 1,
    underlayer: 0.34,
    directionalLean: 0,
    accentChance: 0,
  };
}

function clamp01(value: number): number {
  return value <= 0 ? 0 : value >= 1 ? 1 : value;
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function hashLattice(x: number, z: number, seed: number): number {
  let value = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x: number, z: number, seed: number): number {
  const cellX = Math.floor(x);
  const cellZ = Math.floor(z);
  const fractionX = x - cellX;
  const fractionZ = z - cellZ;
  const weightX = fractionX * fractionX * (3 - 2 * fractionX);
  const weightZ = fractionZ * fractionZ * (3 - 2 * fractionZ);
  const corner00 = hashLattice(cellX, cellZ, seed);
  const corner10 = hashLattice(cellX + 1, cellZ, seed);
  const corner01 = hashLattice(cellX, cellZ + 1, seed);
  const corner11 = hashLattice(cellX + 1, cellZ + 1, seed);
  const lower = corner00 + (corner10 - corner00) * weightX;
  const upper = corner01 + (corner11 - corner01) * weightX;
  return lower + (upper - lower) * weightZ;
}

function sampleMacroPatch(x: number, z: number, config: WorldConfig): number {
  const period = Math.max(config.grassMacroPatchWorldSize, 1);
  const seed = (config.seed ^ 0x4f1b_2c8d) >>> 0;
  const coarse = valueNoise(x / period, z / period, seed);
  const fine = valueNoise((x * 2.15) / period, (z * 2.15) / period, seed ^ 0x9e3779b9);
  return (coarse + fine * 0.45) / 1.45;
}

/**
 * Maps existing ecological causes onto grass placement and shading.
 * `target` is filled in place so placement loops allocate nothing.
 */
export function sampleGrassHabitat(
  x: number,
  z: number,
  ecology: WorldEcologySample,
  biomeDensity: number,
  minimumClimateDensityRetention: number,
  heightBandMin: number,
  heightBandMax: number,
  drynessBias: number,
  accentDensity: number,
  config: WorldConfig,
  target: GrassHabitatSample,
): GrassHabitatSample {
  const moisture = clamp01(ecology.moisture);
  const fertility = clamp01(ecology.fertility);
  const exposure = clamp01(ecology.exposure);
  const disturbance = clamp01(ecology.disturbance);
  const rockiness = clamp01(ecology.rockiness);
  const vigor = sampleGrassMacroVigor(x, z);
  const hostile = Math.max(disturbance, rockiness, 1 - moisture);
  const patch = sampleMacroPatch(x, z, config);
  const patchMul =
    1 + (patch * 2 - 1) * config.grassMacroPatchStrength * (1 - hostile * 0.85);

  let density = biomeDensity;
  density *= 1 + moisture * fertility * config.grassWetDensityBoost;
  density *=
    1 -
    (1 - moisture) *
      config.grassDryDensityReduction *
      (0.62 + 0.38 * exposure);
  density *= patchMul;
  density = Math.max(
    density,
    biomeDensity * clamp01(minimumClimateDensityRetention),
  );
  density *= 1 - rockiness * config.grassRockDensityReduction;
  density *= 1 - disturbance * config.grassDisturbanceDensityReduction;
  target.density = clamp01(density);
  target.densityRetention = clamp01(
    target.density / Math.max(biomeDensity, GRASS_DENSITY_EPSILON),
  );

  const biomeHeight = lerp(heightBandMin, heightBandMax, vigor * 0.55 + 0.45 * patch);
  target.height = Math.max(
    0.58,
    Math.min(
      1.22,
      biomeHeight *
        (1 + moisture * fertility * config.grassWetHeightBoost) *
        (1 - (1 - moisture) * config.grassDryHeightReduction) *
        (1 - disturbance * 0.28) *
        (1 - rockiness * 0.16),
    ),
  );

  target.dryness = clamp01(
    (1 - moisture) * 0.58 +
      exposure * 0.14 +
      rockiness * 0.2 +
      disturbance * 0.16 +
      drynessBias +
      sampleGrassMacroDryness(x, z) * GRASS_MACRO_DRYNESS_STRENGTH +
      (1 - moisture) * config.grassDryColorStrength * 0.72,
  );
  // Dense habitats grow fuller clumps, while sparse ground opens enough that
  // the soil can visually participate instead of every surviving blade keeping
  // the same footprint.
  target.clumpScale = lerp(0.68, 1.27, target.density);
  target.underlayer = clamp01(
    lerp(0.34, 0.6, 1.1 - target.height) * (1 - disturbance * 0.68),
  );
  target.directionalLean = clamp01(disturbance * 0.76 + exposure * 0.16);
  target.accentChance = clamp01(
    accentDensity *
      fertility *
      (1 - disturbance) *
      (0.35 + moisture * 0.65) *
      (0.4 + target.density * 0.6),
  );
  return target;
}

/**
 * Stable tuft identity shared by every LOD that can name the same clump cell.
 * A small identity bias softens hard habitat thresholds without inventing a
 * second random scatter field.
 */
export function resolveGrassClusterArchetype(
  habitat: GrassHabitatSample,
  clumpColumn: number,
  clumpRow: number,
  config: WorldConfig,
): number {
  const roll = hashLattice(
    clumpColumn,
    clumpRow,
    (config.seed ^ ARCHETYPE_SALT) >>> 0,
    );
    const identityBias = (roll - 0.5) * 0.08;
    if (habitat.directionalLean + identityBias > 0.45) return GRASS_CLUSTER_FLATTENED;
    if (
      habitat.densityRetention + identityBias <
      config.grassSparseDensityRetentionThreshold
    ) {
      return GRASS_CLUSTER_SPARSE_OPEN;
    }
    if (habitat.dryness + identityBias > 0.4 && habitat.height < 1) {
      return GRASS_CLUSTER_SHORT_DRY;
    }
  if (habitat.height + identityBias > 1.01 && habitat.dryness < 0.36) {
    return GRASS_CLUSTER_TALL_WET;
  }
  if (habitat.accentChance > 0.2 && roll > 0.64) return GRASS_CLUSTER_ACCENT;
  return GRASS_CLUSTER_DENSE_NORMAL;
}
