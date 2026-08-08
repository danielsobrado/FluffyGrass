import type { WorldConfig } from "../WorldConfig";
import type { StoneField, StoneInstance } from "./StoneField";

const CACHE_LIMIT = 512;
const CACHE_TRIM = 384;
const CELL_KEY_MASK = 0xffff;
const CELL_KEY_STRIDE = 0x10000;
const EDGE_EPSILON = 1e-6;

function cellKey(cellX: number, cellZ: number): number {
  return (
    ((cellX & CELL_KEY_MASK) * CELL_KEY_STRIDE + (cellZ & CELL_KEY_MASK)) >>> 0
  );
}

function smoothstep(value: number, minimum: number, maximum: number): number {
  if (value <= minimum) return 0;
  if (value >= maximum) return 1;
  const amount = (value - minimum) / (maximum - minimum);
  return amount * amount * (3 - 2 * amount);
}

/**
 * Amortizes stone clearance across all grass blades sharing a 16 m stone cell.
 * The expensive deterministic placement walk runs once per neighborhood rather
 * than once per blade; hot samples are one numeric Map lookup plus distance tests.
 */
export class StoneClearanceCache {
  private readonly neighborhoods = new Map<number, StoneInstance[]>();
  private readonly chunkScratch: StoneInstance[] = [];

  constructor(
    private readonly field: StoneField,
    private readonly config: WorldConfig,
  ) {}

  sample(x: number, z: number, extraRadius = 0): number {
    const cellX = Math.floor(x / this.config.stoneCellSize);
    const cellZ = Math.floor(z / this.config.stoneCellSize);
    const candidates = this.getNeighborhood(cellX, cellZ);
    const feather = this.config.stoneGrassClearanceFeather;
    let mask = 1;

    for (const instance of candidates) {
      const radius = instance.clearRadius + extraRadius;
      const reach = radius + feather;
      const offsetX = x - instance.x;
      const offsetZ = z - instance.z;
      const distanceSquared = offsetX * offsetX + offsetZ * offsetZ;
      if (distanceSquared >= reach * reach) continue;

      mask *= smoothstep(
        Math.sqrt(distanceSquared),
        radius * 0.72,
        reach,
      );
      if (mask <= 0.02) return 0;
    }
    return mask;
  }

  clear(): void {
    this.neighborhoods.clear();
  }

  private getNeighborhood(cellX: number, cellZ: number): StoneInstance[] {
    const key = cellKey(cellX, cellZ);
    const cached = this.neighborhoods.get(key);
    if (cached) return cached;

    const cellSize = this.config.stoneCellSize;
    const chunkSize = this.config.chunkSize;
    const minimumX = (cellX - 1) * cellSize;
    const minimumZ = (cellZ - 1) * cellSize;
    const maximumX = (cellX + 2) * cellSize;
    const maximumZ = (cellZ + 2) * cellSize;
    const firstChunkX = Math.floor(minimumX / chunkSize);
    const firstChunkZ = Math.floor(minimumZ / chunkSize);
    const lastChunkX = Math.floor((maximumX - EDGE_EPSILON) / chunkSize);
    const lastChunkZ = Math.floor((maximumZ - EDGE_EPSILON) / chunkSize);
    const candidates: StoneInstance[] = [];

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
            candidates.push(instance);
          }
        }
      }
    }

    if (this.neighborhoods.size >= CACHE_LIMIT) {
      for (const staleKey of this.neighborhoods.keys()) {
        this.neighborhoods.delete(staleKey);
        if (this.neighborhoods.size <= CACHE_TRIM) break;
      }
    }
    this.neighborhoods.set(key, candidates);
    return candidates;
  }
}
