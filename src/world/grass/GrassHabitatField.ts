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

export function createGrassHabitatSample(): GrassHabitatSample {
  return {
    density: 1,
    height: 1,
    dryness: 0,
    clumpScale: 1,
    underlayer: 0.35,
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
  density *= 1 - (1 - moisture) * exposure * config.grassDryDensityReduction;
  density *= 1 - rockiness * config.grassRockDensityReduction;
  density *= 1 - disturbance * config.grassDisturbanceDensityReduction;
  density *= patchMul;
  target.density = clamp01(density);

  const biomeHeight = lerp(heightBandMin, heightBandMax, vigor * 0.55 + 0.45 * patch);
  target.height = Math.max(
    0.7,
    Math.min(
      1.22,
      biomeHeight *
        (1 + moisture * fertility * config.grassWetHeightBoost) *
        (1 - (1 - moisture) * config.grassDryHeightReduction) *
        (1 - disturbance * 0.18),
    ),
  );

  target.dryness = clamp01(
    (1 - moisture) * 0.52 +
      exposure * 0.1 +
      rockiness * 0.16 +
      disturbance * 0.12 +
      drynessBias +
      sampleGrassMacroDryness(x, z) * GRASS_MACRO_DRYNESS_STRENGTH +
      (1 - moisture) * config.grassDryColorStrength * 0.28,
  );
  target.clumpScale = lerp(0.84, 1.14, target.density);
  target.underlayer = clamp01(lerp(0.18, 0.52, 1.08 - target.height) * (1 - disturbance));
  target.directionalLean = clamp01(disturbance * 0.72 + exposure * 0.18);
  target.accentChance = clamp01(accentDensity * fertility * (1 - disturbance) * moisture);
  return target;
}

/**
 * Stable tuft identity shared by every LOD that can name the same clump cell.
 */
export function resolveGrassClusterArchetype(
  habitat: GrassHabitatSample,
  clumpColumn: number,
  clumpRow: number,
  seed: number,
): number {
  const roll = hashLattice(clumpColumn, clumpRow, (seed ^ ARCHETYPE_SALT) >>> 0);
  if (habitat.directionalLean > 0.55) return GRASS_CLUSTER_FLATTENED;
  if (habitat.dryness > 0.52 && habitat.height < 0.92) return GRASS_CLUSTER_SHORT_DRY;
  if (habitat.density < 0.42) return GRASS_CLUSTER_SPARSE_OPEN;
  if (habitat.height > 1.04 && habitat.dryness < 0.3) return GRASS_CLUSTER_TALL_WET;
  if (habitat.accentChance > 0.28 && roll > 0.72) return GRASS_CLUSTER_ACCENT;
  return GRASS_CLUSTER_DENSE_NORMAL;
}
