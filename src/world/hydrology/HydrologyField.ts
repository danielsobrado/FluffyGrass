import type { WorldConfig } from "../WorldConfig";
import { createLakeSample, LakeField } from "./LakeField";
import { createRiverSample, RiverField } from "./RiverField";

const SAMPLE_HEIGHT_EPSILON = 1e-9;

export interface HydrologySample {
  waterCoverage: number;
  waterProximity: number;
  humidityBoost: number;
  grassMask: number;
  waterLevel: number;
  riverCoverage: number;
  lakeCoverage: number;
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
    const riverDepth =
      this.config.riverDepth *
      (this.river.coverage * 0.72 + this.river.bank * 0.28);
    let carved = height - riverDepth;

    if (this.lake.basin > 0) {
      const core = 1 - clamp01(this.lake.normalizedDistance);
      const bedTarget =
        this.lake.waterLevel -
        this.config.lakeDepth * (0.72 + core * 0.28);
      carved = lerp(carved, Math.min(carved, bedTarget), this.lake.basin);
    }

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
      this.sampleStructure(x, z, carvedHeight);
    }

    const waterCoverage = Math.max(this.river.coverage, this.lake.coverage);
    const waterProximity = Math.max(this.river.proximity, this.lake.proximity);
    const riverWaterDepth =
      this.config.riverDepth * (0.58 + this.river.coverage * 0.12);

    target.waterCoverage = clamp01(waterCoverage);
    target.waterProximity = clamp01(waterProximity);
    target.humidityBoost = clamp01(waterProximity * 0.68);
    target.grassMask = 1 - smoothstep(waterCoverage, 0.03, 0.28);
    target.waterLevel =
      (this.lake.coverage > 0.01
        ? this.lake.waterLevel
        : carvedHeight + riverWaterDepth * this.river.coverage) +
      this.config.waterSurfaceOffset;
    target.riverCoverage = clamp01(this.river.coverage);
    target.lakeCoverage = clamp01(this.lake.coverage);
    return target;
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
    return target;
  }
}
