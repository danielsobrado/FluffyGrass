import { ECOLOGY_ROCK_SLOPE_START } from "../ecology/WorldEcologyTuning";
import type { StoneArchetypeId } from "./StoneRecipe";

/**
 * Algorithm constants for macro stone geology.
 *
 * Production art knobs live in YAML. This file is the closed set of named
 * thresholds, family tables, and reach math the placement algorithm is allowed
 * to depend on. If a process is consistently wrong, change it here and cover
 * it with a deterministic test rather than adding another config slider.
 */

export type StoneClusterProcess = "compact" | "ridge" | "scree" | "fan";
export type StoneClusterRole = "anchor" | "secondary" | "debris";

export const STONE_CLUSTER_DOMAIN = 0x434c5354;
export const STONE_CELL_DOMAIN = 0x570e5;
export const STONE_ROCK_SEED_XOR = 0x51f0e5;
export const STONE_STRIKE_SEED_XOR = 0x5bd1e995;
export const STONE_GEOLOGY_FINE_SEED_XOR = 0x9e3779b9;

/** Metres per cell of the geological strike field. */
export const STRIKE_PERIOD = 130;

export const STONE_CLUSTER_RIDGE_CONVEXITY = 0.25;
export const STONE_CLUSTER_FAN_CONCAVITY = -0.25;
export const STONE_CLUSTER_FAN_MIN_SLOPE = 0.08;

export const STONE_CLUSTER_MEMBER_JITTER = 0.035;
export const STONE_CLUSTER_FAN_MAX_LATERAL = 0.68;

export const GOLDEN_ANGLE = 2.399963229728653;
export const CLUSTER_MIN_SPACING_RATIO = 0.68;
export const CLUSTER_INFLUENCE_SEPARATION_RATIO = 0.88;
export const CLUSTER_PRIORITY_RANDOM_SHARE = 0.18;
export const DOWNHILL_GRADIENT_MIN = 0.02;
export const QUERY_EPSILON = 1e-6;

export const RAW_CANDIDATE_CACHE_LIMIT = 512;
export const STONE_CLUSTER_DESCRIPTOR_CACHE_LIMIT = 512;
export const STONE_CLUSTER_RESOLVED_CACHE_LIMIT = 256;
export const STONE_CLUSTER_CACHE_KEEP_RATIO = 0.6;

export const STONE_CELL_MACRO_QUERY_COUNT = 9;
export const STONE_CLUSTER_CONFLICT_NEIGHBOR_COUNT = 8;

export const MEMBER_LABELS: readonly string[] = [
  "member:0",
  "member:1",
  "member:2",
  "member:3",
  "member:4",
  "member:5",
  "member:6",
  "member:7",
  "member:8",
  "member:9",
  "member:10",
  "member:11",
];

export const ANCHOR_BIOME_MULTIPLIERS: readonly (readonly number[])[] = [
  [0, 1.2, 1.15, 0.65, 0.15, 0.75],
  [0, 1, 1.15, 1.05, 0.75, 0.95],
  [0, 0.85, 1, 1.1, 1.2, 1.25],
];

export const SPLIT_CHANCE = 0.28;
export const SPLIT_GAP_MIN = 0.08;
export const SPLIT_GAP_MAX = 0.3;
export const SPLIT_CORE_OFFSET_FACTOR = 0.6;

export const OVERLAP_FOOTPRINT_FACTOR = 0.78;
export const OVERLAP_PADDING = 0.12;
export const OVERLAP_PUSH_EXTRA = 0.04;
export const OVERLAP_COINCIDENT_EPSILON = 1e-6;

export const ROLE_YAW_EXTRA: Readonly<Record<StoneClusterRole, number>> = {
  anchor: 0,
  secondary: 0.1,
  debris: 0.28,
};

export const COMPACT_DIRECTION_SPREAD = 0.35;
export const COMPACT_ASPECT_BLEND = 0.55;
export const SCREE_ASPECT_BLEND = 0.45;
export const FAN_ASPECT_BLEND = 0.45;

export type ClusterFamilyWeights = Readonly<
  Partial<Record<StoneArchetypeId, number>>
>;

export const SECONDARY_FAMILY: Readonly<
  Record<StoneArchetypeId, ClusterFamilyWeights>
> = {
  pebble: { pebble: 1 },
  boulder: { boulder: 0.55, slab: 0.2, block: 0.15, shard: 0.1 },
  slab: { slab: 0.5, block: 0.2, boulder: 0.2, shard: 0.1 },
  block: { block: 0.5, shard: 0.2, boulder: 0.2, slab: 0.1 },
  outcrop: { block: 0.35, shard: 0.3, slab: 0.2, boulder: 0.15 },
  shard: { shard: 0.5, block: 0.25, boulder: 0.15, slab: 0.1 },
};

export const DEBRIS_FAMILY: Readonly<
  Record<StoneArchetypeId, ClusterFamilyWeights>
> = {
  pebble: { pebble: 1 },
  boulder: { pebble: 0.7, boulder: 0.3 },
  slab: { pebble: 0.55, slab: 0.25, shard: 0.2 },
  block: { pebble: 0.45, block: 0.3, shard: 0.25 },
  outcrop: { pebble: 0.35, shard: 0.35, block: 0.3 },
  shard: { pebble: 0.45, shard: 0.55 },
};

export function clamp(value: number, minimum: number, maximum: number): number {
  return value < minimum ? minimum : value > maximum ? maximum : value;
}

export function clamp01(value: number): number {
  return value <= 0 ? 0 : value >= 1 ? 1 : value;
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export function smoothstep(
  value: number,
  minimum: number,
  maximum: number,
): number {
  if (value <= minimum) {
    return 0;
  }
  if (value >= maximum) {
    return 1;
  }
  const amount = (value - minimum) / (maximum - minimum);
  return amount * amount * (3 - 2 * amount);
}

/**
 * Conservative normalized root reach for broad-phase and 3x3 coverage.
 * Fan has the widest lateral rule, and minorRadius never exceeds majorRadius.
 */
export function maxNormalizedReach(halo: number): number {
  return Math.hypot(
    halo + STONE_CLUSTER_MEMBER_JITTER,
    halo * STONE_CLUSTER_FAN_MAX_LATERAL + STONE_CLUSTER_MEMBER_JITTER,
  );
}

export function clusterCacheKeepCount(limit: number): number {
  return Math.floor(limit * STONE_CLUSTER_CACHE_KEEP_RATIO);
}

export function trimOldestCacheEntries<K, V>(
  cache: Map<K, V>,
  keep: number,
): void {
  for (const key of cache.keys()) {
    if (cache.size <= keep) {
      return;
    }
    cache.delete(key);
  }
}

export function clusterGridKey(gridX: number, gridZ: number): string {
  return `${gridX}:${gridZ}`;
}

export function classifyStoneClusterProcess(
  slope: number,
  convexity: number,
): StoneClusterProcess {
  if (slope >= ECOLOGY_ROCK_SLOPE_START) {
    return "scree";
  }
  if (convexity >= STONE_CLUSTER_RIDGE_CONVEXITY) {
    return "ridge";
  }
  if (
    convexity <= STONE_CLUSTER_FAN_CONCAVITY &&
    slope >= STONE_CLUSTER_FAN_MIN_SLOPE
  ) {
    return "fan";
  }
  return "compact";
}

export function singletonProbability(
  geologyPotential: number,
  surfaceRockiness: number,
  singletonChance: number,
): number {
  const suitability = geologyPotential * (0.25 + 0.75 * surfaceRockiness);
  return singletonChance * lerp(0.35, 1, clamp01(suitability));
}

export function clusterRoleCounts(budget: number): {
  secondaryCount: number;
  debrisCount: number;
} {
  const secondaryCount = clamp(Math.floor((budget - 1) * 0.35), 1, 2);
  return {
    secondaryCount,
    debrisCount: budget - 1 - secondaryCount,
  };
}

/** Shortest signed difference on a π-period axis, not a 2π heading. */
export function axisDelta(from: number, to: number): number {
  const period = Math.PI;
  const half = period * 0.5;
  return ((((to - from) + half) % period) + period) % period - half;
}

export function axisLerp(from: number, to: number, amount: number): number {
  return from + axisDelta(from, to) * amount;
}

export interface StoneMacroCoord {
  gridX: number;
  gridZ: number;
}

export function fillStoneCellMacroCoordinates(
  cellX: number,
  cellZ: number,
  cellSize: number,
  spacing: number,
  out: StoneMacroCoord[],
): number {
  const cellCenterX = (cellX + 0.5) * cellSize;
  const cellCenterZ = (cellZ + 0.5) * cellSize;
  const macroX = Math.floor(cellCenterX / spacing);
  const macroZ = Math.floor(cellCenterZ / spacing);
  let index = 0;
  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const slot = out[index] ?? (out[index] = { gridX: 0, gridZ: 0 });
      slot.gridX = macroX + dx;
      slot.gridZ = macroZ + dz;
      index += 1;
    }
  }
  return STONE_CELL_MACRO_QUERY_COUNT;
}

export function fillConflictNeighborCoordinates(
  gridX: number,
  gridZ: number,
  out: StoneMacroCoord[],
): number {
  let index = 0;
  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dz === 0) {
        continue;
      }
      const slot = out[index] ?? (out[index] = { gridX: 0, gridZ: 0 });
      slot.gridX = gridX + dx;
      slot.gridZ = gridZ + dz;
      index += 1;
    }
  }
  return STONE_CLUSTER_CONFLICT_NEIGHBOR_COUNT;
}

export function clusterInfluenceIntersectsAabb(
  centerX: number,
  centerZ: number,
  influenceRadius: number,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
): boolean {
  const dx = Math.max(minX - centerX, 0, centerX - maxX);
  const dz = Math.max(minZ - centerZ, 0, centerZ - maxZ);
  return dx * dx + dz * dz <= influenceRadius * influenceRadius;
}

export function clusterMinimumSeparation(
  spacing: number,
  influenceRadius: number,
  neighborInfluenceRadius: number,
): number {
  return Math.max(
    spacing * CLUSTER_MIN_SPACING_RATIO,
    (influenceRadius + neighborInfluenceRadius) *
      CLUSTER_INFLUENCE_SEPARATION_RATIO,
  );
}

export function pushOverlapOnce(
  candidateX: number,
  candidateZ: number,
  candidateFootprint: number,
  existingX: number,
  existingZ: number,
  existingFootprint: number,
  outwardX: number,
  outwardZ: number,
): { x: number; z: number; moved: boolean } {
  const offsetX = candidateX - existingX;
  const offsetZ = candidateZ - existingZ;
  const distanceSquared = offsetX * offsetX + offsetZ * offsetZ;
  const minimum =
    OVERLAP_FOOTPRINT_FACTOR * (candidateFootprint + existingFootprint) +
    OVERLAP_PADDING;
  if (distanceSquared >= minimum * minimum) {
    return { x: candidateX, z: candidateZ, moved: false };
  }
  let pushX = offsetX;
  let pushZ = offsetZ;
  let distance = Math.sqrt(distanceSquared);
  if (distance <= OVERLAP_COINCIDENT_EPSILON) {
    const outwardLength = Math.hypot(outwardX, outwardZ);
    if (outwardLength > OVERLAP_COINCIDENT_EPSILON) {
      pushX = outwardX / outwardLength;
      pushZ = outwardZ / outwardLength;
    } else {
      pushX = 1;
      pushZ = 0;
    }
    distance = 0;
  } else {
    pushX /= distance;
    pushZ /= distance;
  }
  const needed = minimum - distance + OVERLAP_PUSH_EXTRA;
  return {
    x: candidateX + pushX * needed,
    z: candidateZ + pushZ * needed,
    moved: true,
  };
}

export function clusterLocalToWorld(
  centerX: number,
  centerZ: number,
  direction: number,
  majorRadius: number,
  minorRadius: number,
  localU: number,
  localV: number,
): { x: number; z: number } {
  const dirX = Math.cos(direction);
  const dirZ = Math.sin(direction);
  const perpX = -dirZ;
  const perpZ = dirX;
  return {
    x: centerX + dirX * (localU * majorRadius) + perpX * (localV * minorRadius),
    z: centerZ + dirZ * (localU * majorRadius) + perpZ * (localV * minorRadius),
  };
}

export function clusterRadialWorld(
  direction: number,
  majorRadius: number,
  minorRadius: number,
  localU: number,
  localV: number,
): { x: number; z: number } {
  const dirX = Math.cos(direction);
  const dirZ = Math.sin(direction);
  const perpX = -dirZ;
  const perpZ = dirX;
  return {
    x: dirX * (localU * majorRadius) + perpX * (localV * minorRadius),
    z: dirZ * (localU * majorRadius) + perpZ * (localV * minorRadius),
  };
}
