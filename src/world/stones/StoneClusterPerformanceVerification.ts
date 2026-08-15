import { TerrainField } from "../TerrainField";
import { WorldConfigLoader } from "../WorldConfigLoader";
import { StoneField } from "./StoneField";

export interface StonePerformanceBaseline {
  readonly seed: number;
  readonly chunkMin: number;
  readonly chunkMax: number;
  readonly includeSmallRoots: number;
  readonly farRoots: number;
  readonly maxRootsInChunk: number;
  readonly detailedTrianglePotential: number;
  readonly coarseTrianglePotential: number;
}

function fail(message: string): never {
  throw new Error(`[stone-cluster-performance] ${message}`);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    fail(message);
  }
}

function collectMetrics(
  stones: StoneField,
  chunkMin: number,
  chunkMax: number,
): Omit<StonePerformanceBaseline, "seed"> {
  let includeSmallRoots = 0;
  let farRoots = 0;
  let maxRootsInChunk = 0;
  let detailedTrianglePotential = 0;
  let coarseTrianglePotential = 0;
  for (let chunkZ = chunkMin; chunkZ <= chunkMax; chunkZ += 1) {
    for (let chunkX = chunkMin; chunkX <= chunkMax; chunkX += 1) {
      const includeSmall: ReturnType<StoneField["collectChunkInstances"]> = [];
      stones.collectChunkInstances(chunkX, chunkZ, true, includeSmall);
      includeSmallRoots += includeSmall.length;
      maxRootsInChunk = Math.max(maxRootsInChunk, includeSmall.length);
      for (const instance of includeSmall) {
        detailedTrianglePotential +=
          stones.getVariant(instance.archetype, instance.variantIndex, true)
            .indices.length / 3;
      }
      const far: ReturnType<StoneField["collectChunkInstances"]> = [];
      stones.collectChunkInstances(chunkX, chunkZ, false, far);
      farRoots += far.length;
      for (const instance of far) {
        coarseTrianglePotential +=
          stones.getVariant(instance.archetype, instance.variantIndex, false)
            .indices.length / 3;
      }
    }
  }
  return {
    chunkMin,
    chunkMax,
    includeSmallRoots,
    farRoots,
    maxRootsInChunk,
    detailedTrianglePotential,
    coarseTrianglePotential,
  };
}

export function verifyStoneClusterPerformance(
  configSource: string,
  baseline: StonePerformanceBaseline,
): string {
  const config = new WorldConfigLoader().parse(configSource);
  assert(
    config.seed === baseline.seed,
    `Baseline seed ${baseline.seed} does not match shipped config seed ${config.seed}.`,
  );
  const terrain = new TerrainField(config);
  const stones = new StoneField(terrain, config);
  const metrics = collectMetrics(stones, baseline.chunkMin, baseline.chunkMax);
  assert(
    metrics.includeSmallRoots <= baseline.includeSmallRoots,
    `includeSmallRoots rose from ${baseline.includeSmallRoots} to ${metrics.includeSmallRoots}.`,
  );
  assert(
    metrics.farRoots <= baseline.farRoots,
    `farRoots rose from ${baseline.farRoots} to ${metrics.farRoots}.`,
  );
  assert(
    metrics.detailedTrianglePotential <= baseline.detailedTrianglePotential,
    `detailedTrianglePotential rose from ${baseline.detailedTrianglePotential} to ${metrics.detailedTrianglePotential}.`,
  );
  assert(
    metrics.coarseTrianglePotential <= baseline.coarseTrianglePotential,
    `coarseTrianglePotential rose from ${baseline.coarseTrianglePotential} to ${metrics.coarseTrianglePotential}.`,
  );
  const localCap = baseline.maxRootsInChunk + config.stoneClusterBudgetMax;
  assert(
    metrics.maxRootsInChunk <= localCap,
    `maxRootsInChunk ${metrics.maxRootsInChunk} exceeded ${localCap}.`,
  );
  return (
    `roots ${metrics.includeSmallRoots}/${metrics.farRoots} · ` +
    `tris ${metrics.detailedTrianglePotential}/${metrics.coarseTrianglePotential} · ` +
    `peak ${metrics.maxRootsInChunk}`
  );
}
