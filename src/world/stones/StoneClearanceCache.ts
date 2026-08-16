import type { WorldConfig } from "../WorldConfig";
import {
  STONE_CELL_SOURCE_MARGIN,
} from "./StoneClusterTuning";
import type { StoneField, StoneInstance } from "./StoneField";

const CACHE_LIMIT = 512;
const CELL_KEY_MARGIN = 4;
const EDGE_EPSILON = 1e-6;
const CLEARANCE_INNER_SCALE = 0.72;
/** Root displacement uses one source cell; clearance can extend through the next. */
const CLEARANCE_SOURCE_CELL_MARGIN = STONE_CELL_SOURCE_MARGIN + 1;

interface StoneClearanceCandidate {
  x: number;
  z: number;
  clearRadius: number;
  innerRadius: number;
  reach: number;
  reachSquared: number;
}

function smoothstep(value: number, minimum: number, maximum: number): number {
  if (value <= minimum) return 0;
  if (value >= maximum) return 1;
  const amount = (value - minimum) / (maximum - minimum);
  return amount * amount * (3 - 2 * amount);
}

/**
 * Amortizes stone clearance across all grass blades sharing a stone cell.
 * The expensive deterministic placement walk runs once per neighborhood rather
 * than once per blade; hot samples are one numeric Map lookup plus distance tests.
 */
export class StoneClearanceCache {
  private readonly neighborhoods = new Map<number, StoneClearanceCandidate[]>();
  private readonly chunkScratch: StoneInstance[] = [];
  private readonly cellKeyOffset: number;
  private readonly cellKeyStride: number;
  private readonly feather: number;

  constructor(
    private readonly field: StoneField,
    private readonly config: WorldConfig,
  ) {
    const halfCells =
      Math.ceil(config.worldSize / (config.stoneCellSize * 2)) +
      CELL_KEY_MARGIN;
    this.cellKeyOffset = halfCells;
    this.cellKeyStride = halfCells * 2 + 1;
    this.feather = config.stoneGrassClearanceFeather;
  }

  sample(x: number, z: number, extraRadius = 0): number {
    const cellX = Math.floor(x / this.config.stoneCellSize);
    const cellZ = Math.floor(z / this.config.stoneCellSize);
    const candidates = this.getNeighborhood(cellX, cellZ);
    let mask = 1;

    if (extraRadius === 0) {
      for (const candidate of candidates) {
        const offsetX = x - candidate.x;
        const offsetZ = z - candidate.z;
        const distanceSquared = offsetX * offsetX + offsetZ * offsetZ;
        if (distanceSquared >= candidate.reachSquared) continue;

        mask *= smoothstep(
          Math.sqrt(distanceSquared),
          candidate.innerRadius,
          candidate.reach,
        );
        if (mask <= 0.02) return 0;
      }
      return mask;
    }

    for (const candidate of candidates) {
      const radius = candidate.clearRadius + extraRadius;
      const reach = radius + this.feather;
      const offsetX = x - candidate.x;
      const offsetZ = z - candidate.z;
      const distanceSquared = offsetX * offsetX + offsetZ * offsetZ;
      if (distanceSquared >= reach * reach) continue;

      mask *= smoothstep(
        Math.sqrt(distanceSquared),
        radius * CLEARANCE_INNER_SCALE,
        reach,
      );
      if (mask <= 0.02) return 0;
    }
    return mask;
  }

  clear(): void {
    this.neighborhoods.clear();
  }

  private getNeighborhood(
    cellX: number,
    cellZ: number,
  ): StoneClearanceCandidate[] {
    const key = this.cellKey(cellX, cellZ);
    const cached = this.neighborhoods.get(key);
    if (cached) return cached;

    const cellSize = this.config.stoneCellSize;
    const chunkSize = this.config.chunkSize;
    const minimumX = (cellX - CLEARANCE_SOURCE_CELL_MARGIN) * cellSize;
    const minimumZ = (cellZ - CLEARANCE_SOURCE_CELL_MARGIN) * cellSize;
    const maximumX =
      (cellX + 1 + CLEARANCE_SOURCE_CELL_MARGIN) * cellSize;
    const maximumZ =
      (cellZ + 1 + CLEARANCE_SOURCE_CELL_MARGIN) * cellSize;
    const firstChunkX = Math.floor(minimumX / chunkSize);
    const firstChunkZ = Math.floor(minimumZ / chunkSize);
    const lastChunkX = Math.floor((maximumX - EDGE_EPSILON) / chunkSize);
    const lastChunkZ = Math.floor((maximumZ - EDGE_EPSILON) / chunkSize);
    const candidates: StoneClearanceCandidate[] = [];

    for (let chunkZ = firstChunkZ; chunkZ <= lastChunkZ; chunkZ += 1) {
      for (let chunkX = firstChunkX; chunkX <= lastChunkX; chunkX += 1) {
        const instances = this.field.collectChunkInstances(
          chunkX,
          chunkZ,
          true,
          this.chunkScratch,
        );
        for (const instance of instances) {
          if (
            instance.clearRadius > 0 &&
            instance.x >= minimumX &&
            instance.x < maximumX &&
            instance.z >= minimumZ &&
            instance.z < maximumZ
          ) {
            const reach = instance.clearRadius + this.feather;
            candidates.push({
              x: instance.x,
              z: instance.z,
              clearRadius: instance.clearRadius,
              innerRadius: instance.clearRadius * CLEARANCE_INNER_SCALE,
              reach,
              reachSquared: reach * reach,
            });
          }
        }
      }
    }

    if (this.neighborhoods.size >= CACHE_LIMIT) {
      const oldestKey = this.neighborhoods.keys().next().value;
      if (oldestKey !== undefined) {
        this.neighborhoods.delete(oldestKey);
      }
    }
    this.neighborhoods.set(key, candidates);
    return candidates;
  }

  private cellKey(cellX: number, cellZ: number): number {
    return (
      (cellX + this.cellKeyOffset) * this.cellKeyStride +
      cellZ +
      this.cellKeyOffset
    );
  }
}
