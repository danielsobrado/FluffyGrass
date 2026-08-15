import type { WorldConfig } from "../WorldConfig";
import { createLakeSample, LakeField } from "./LakeField";
import { createRiverSample, RiverField } from "./RiverField";

const SAMPLE_HEIGHT_EPSILON = 1e-9;
const SOURCE_HEIGHT_CACHE_SIZE = 8;

interface SourceHeightSample {
  x: number;
  z: number;
  carvedHeight: number;
  sourceHeight: number;
}

export interface HydrologySample {
  waterCoverage: number;
  waterProximity: number;
  humidityBoost: number;
  grassMask: number;
  waterLevel: number;
  riverCoverage: number;
  lakeCoverage: number;
  flowX: number;
  flowZ: number;
  riverMorphology: number;
  riverBend: number;
  riverLateral: number;
}

export function createHydrologySample(): HydrologySample {
  return {
    waterCoverage: 0,
    waterProximity: 0,
    humidityBoost: 0,
    grassMask: 1,
    waterLevel: 0,
    riverCoverage: 0,
    lakeCoverage: 0,
    flowX: 0,
    flowZ: 0,
    riverMorphology: 0,
    riverBend: 0,
    riverLateral: 0,
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function smoothstep(value: number, minimum: number, maximum: number): number {
  if (value <= minimum) return 0;
  if (value >= maximum) return 1;
  const amount = (value - minimum) / (maximum - minimum);
  return amount * amount * (3 - 2 * amount);
}

/** Coordinates terrain carving and the shared water/ecology semantics. */
export class HydrologyField {
  private readonly rivers: RiverField;
  private readonly lakes: LakeField;
  private readonly river = createRiverSample();
  private readonly lake = createLakeSample();
  private readonly sourceHeightCache: SourceHeightSample[] = Array.from(
    { length: SOURCE_HEIGHT_CACHE_SIZE },
    () => ({
      x: Number.NaN,
      z: Number.NaN,
      carvedHeight: Number.NaN,
      sourceHeight: Number.NaN,
    }),
  );
  private sourceHeightCursor = 0;
  private carvedSampleX = Number.NaN;
  private carvedSampleZ = Number.NaN;
  private carvedSampleHeight = Number.NaN;

  constructor(private readonly config: WorldConfig) {
    this.rivers = new RiverField(config);
    this.lakes = new LakeField(config);
  }

  carveHeight(x: number, z: number, height: number): number {
    if (this.config.waterEnabled < 1) return height;

    this.sampleStructure(x, z, height);
    let carved = height - this.river.incisionDepth;

    if (this.lake.basin > 0) {
      const core = 1 - clamp01(this.lake.normalizedDistance);
      const bedTarget =
        this.lake.waterLevel -
        this.config.lakeDepth * (0.72 + core * 0.28);
      carved = lerp(carved, Math.min(carved, bedTarget), this.lake.basin);
    }

    this.cacheSourceHeight(x, z, carved, height);
    this.carvedSampleX = x;
    this.carvedSampleZ = z;
    this.carvedSampleHeight = carved;
    return carved;
  }

  sample(
    x: number,
    z: number,
    carvedHeight: number,
    target: HydrologySample,
  ): HydrologySample {
    if (this.config.waterEnabled < 1) {
      return this.clear(carvedHeight, target);
    }

    if (
      x !== this.carvedSampleX ||
      z !== this.carvedSampleZ ||
      Math.abs(carvedHeight - this.carvedSampleHeight) > SAMPLE_HEIGHT_EPSILON
    ) {
      this.sampleStructure(
        x,
        z,
        this.resolveSourceHeight(x, z, carvedHeight) ?? carvedHeight,
      );
      this.carvedSampleX = x;
      this.carvedSampleZ = z;
      this.carvedSampleHeight = carvedHeight;
    }

    const waterCoverage = Math.max(this.river.coverage, this.lake.coverage);
    const waterProximity = Math.max(this.river.proximity, this.lake.proximity);
    const lakeSurfaceActive = this.lake.basin > 0.001;

    target.waterCoverage = clamp01(waterCoverage);
    target.waterProximity = clamp01(waterProximity);
    target.humidityBoost = clamp01(waterProximity * 0.68);
    target.grassMask = 1 - smoothstep(waterCoverage, 0.03, 0.28);
    target.waterLevel =
      (lakeSurfaceActive
        ? this.lake.waterLevel
        : carvedHeight + this.river.incisionDepth) +
      this.config.waterSurfaceOffset;
    target.riverCoverage = clamp01(this.river.coverage);
    target.lakeCoverage = clamp01(this.lake.coverage);
    target.flowX = this.river.flowX;
    target.flowZ = this.river.flowZ;
    target.riverMorphology = this.river.morphology;
    target.riverBend = this.river.bend;
    target.riverLateral = this.river.lateral;
    return target;
  }

  private cacheSourceHeight(
    x: number,
    z: number,
    carvedHeight: number,
    sourceHeight: number,
  ): void {
    const entry = this.sourceHeightCache[this.sourceHeightCursor];
    entry.x = x;
    entry.z = z;
    entry.carvedHeight = carvedHeight;
    entry.sourceHeight = sourceHeight;
    this.sourceHeightCursor =
      (this.sourceHeightCursor + 1) % this.sourceHeightCache.length;
  }

  private resolveSourceHeight(
    x: number,
    z: number,
    carvedHeight: number,
  ): number | undefined {
    for (const entry of this.sourceHeightCache) {
      if (
        entry.x === x &&
        entry.z === z &&
        Math.abs(entry.carvedHeight - carvedHeight) <= SAMPLE_HEIGHT_EPSILON
      ) {
        return entry.sourceHeight;
      }
    }
    return undefined;
  }

  private sampleStructure(x: number, z: number, height: number): void {
    this.rivers.sample(x, z, height, this.river);
    this.lakes.sample(x, z, height, this.lake);
  }

  private clear(height: number, target: HydrologySample): HydrologySample {
    target.waterCoverage = 0;
    target.waterProximity = 0;
    target.humidityBoost = 0;
    target.grassMask = 1;
    target.waterLevel = height;
    target.riverCoverage = 0;
    target.lakeCoverage = 0;
    target.flowX = 0;
    target.flowZ = 0;
    target.riverMorphology = 0;
    target.riverBend = 0;
    target.riverLateral = 0;
    return target;
  }
}
