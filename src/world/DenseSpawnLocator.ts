import * as THREE from "three";
import type { WorldConfig } from "./WorldConfig";
import type { TerrainField } from "./TerrainField";

const HEADING_SAMPLE_COUNT = 8;
const COARSE_STEP_MULTIPLIER = 4;
const REFINE_CANDIDATE_COUNT = 8;
const AREA_SAMPLE_OFFSETS = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export interface DenseWorldSpawn {
  position: THREE.Vector3;
  yaw: number;
  pitch: number;
  suitability: number;
}

interface SpawnCandidate {
  x: number;
  z: number;
  suitability: number;
}

export class DenseSpawnLocator {
  private readonly normal = new THREE.Vector3();

  constructor(
    private readonly field: TerrainField,
    private readonly config: WorldConfig,
  ) {}

  find(): DenseWorldSpawn {
    const halfWorld = this.config.worldSize * 0.5 - this.config.chunkSize;
    const radius = Math.min(this.config.spawnSearchRadius, halfWorld);
    const step = this.config.spawnSearchStep;
    let bestX = 0;
    let bestZ = 0;
    let bestSuitability = Number.NEGATIVE_INFINITY;
    const coarseStep = step * COARSE_STEP_MULTIPLIER;
    const coarseCandidates: SpawnCandidate[] = [];
    const sampledSuitability = new Map<string, number>();
    const sampleCandidate = (x: number, z: number): number => {
      const key = `${x}:${z}`;
      const cached = sampledSuitability.get(key);
      if (cached !== undefined) {
        return cached;
      }
      const suitability = this.sampleAreaSuitability(x, z);
      sampledSuitability.set(key, suitability);
      return suitability;
    };

    // Biome suitability is spatially coherent, so find the best broad regions
    // first and spend the configured fine step only around those candidates.
    for (let z = -radius; z <= radius; z += coarseStep) {
      for (let x = -radius; x <= radius; x += coarseStep) {
        const suitability = sampleCandidate(x, z);
        coarseCandidates.push({ x, z, suitability });
        if (suitability > bestSuitability) {
          bestX = x;
          bestZ = z;
          bestSuitability = suitability;
        }
      }
    }

    coarseCandidates.sort(
      (left, right) => right.suitability - left.suitability,
    );
    const candidatesToRefine = Math.min(
      REFINE_CANDIDATE_COUNT,
      coarseCandidates.length,
    );
    for (let index = 0; index < candidatesToRefine; index += 1) {
      const candidate = coarseCandidates[index];
      for (
        let z = candidate.z - coarseStep;
        z <= candidate.z + coarseStep;
        z += step
      ) {
        if (z < -radius || z > radius) {
          continue;
        }
        for (
          let x = candidate.x - coarseStep;
          x <= candidate.x + coarseStep;
          x += step
        ) {
          if (x < -radius || x > radius) {
            continue;
          }
          const suitability = sampleCandidate(x, z);
          if (suitability > bestSuitability) {
            bestX = x;
            bestZ = z;
            bestSuitability = suitability;
          }
        }
      }
    }

    const height = this.field.sampleHeight(bestX, bestZ);
    return {
      position: new THREE.Vector3(
        bestX,
        height + this.config.spawnEyeHeight,
        bestZ,
      ),
      yaw: this.resolveHeading(bestX, bestZ),
      pitch: THREE.MathUtils.degToRad(this.config.spawnPitchDegrees),
      suitability: THREE.MathUtils.clamp(bestSuitability, 0, 1),
    };
  }

  private sampleAreaSuitability(x: number, z: number): number {
    let total = 0;
    const radius = this.config.spawnNeighborhoodRadius;

    for (const [offsetX, offsetZ] of AREA_SAMPLE_OFFSETS) {
      const sampleX = x + offsetX * radius;
      const sampleZ = z + offsetZ * radius;
      const height = this.field.sampleHeight(sampleX, sampleZ);
      this.field.sampleNormal(sampleX, sampleZ, this.normal);
      total += this.field.sampleGrassSuitability(
        sampleX,
        sampleZ,
        height,
        this.normal,
      );
    }

    return total / AREA_SAMPLE_OFFSETS.length;
  }

  private resolveHeading(x: number, z: number): number {
    const distance = this.config.spawnNeighborhoodRadius * 2;
    let bestSuitability = Number.NEGATIVE_INFINITY;
    let directionX = 0;
    let directionZ = -1;

    for (let index = 0; index < HEADING_SAMPLE_COUNT; index += 1) {
      const angle = (index / HEADING_SAMPLE_COUNT) * Math.PI * 2;
      const candidateX = Math.sin(angle);
      const candidateZ = Math.cos(angle);
      const suitability = this.sampleAreaSuitability(
        x + candidateX * distance,
        z + candidateZ * distance,
      );
      if (suitability > bestSuitability) {
        bestSuitability = suitability;
        directionX = candidateX;
        directionZ = candidateZ;
      }
    }

    return Math.atan2(-directionX, -directionZ);
  }
}
