import type { WorldConfig } from "../WorldConfig";

const TWO_PI = Math.PI * 2;
const RIVER_EDGE_FEATHER = 0.8;
const RIVER_ALTITUDE_FADE = 18;
const LAKE_EDGE_FEATHER_RATIO = 0.035;
const LAKE_PRIMARY_EDGE_LOBES = 5;
const LAKE_SECONDARY_EDGE_LOBES = 9;

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

function hash(x: number, z: number, seed: number): number {
  let value = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function repeatedDistance(value: number, period: number): number {
  const wrapped = value - Math.floor(value / period) * period;
  return Math.min(wrapped, period - wrapped);
}

/**
 * Deterministic hydrology semantics shared by terrain carving, grass placement,
 * terrain shading, and water rendering.
 */
export class HydrologyField {
  private riverCoverage = 0;
  private riverBank = 0;
  private riverProximity = 0;
  private lakeCoverage = 0;
  private lakeBasin = 0;
  private lakeProximity = 0;
  private lakeWaterLevel = 0;
  private lakeNormalizedDistance = Number.POSITIVE_INFINITY;

  constructor(private readonly config: WorldConfig) {}

  carveHeight(x: number, z: number, height: number): number {
    if (this.config.waterEnabled < 1) return height;

    this.sampleStructure(x, z, height);
    const riverDepth =
      this.config.riverDepth *
      (this.riverCoverage * 0.72 + this.riverBank * 0.28);
    let carved = height - riverDepth;

    if (this.lakeBasin > 0) {
      const core = 1 - clamp01(this.lakeNormalizedDistance);
      const bedTarget =
        this.lakeWaterLevel - this.config.lakeDepth * (0.72 + core * 0.28);
      const basinTarget = Math.min(carved, bedTarget);
      carved = lerp(carved, basinTarget, this.lakeBasin);
    }
    return carved;
  }

  sample(
    x: number,
    z: number,
    carvedHeight: number,
    target: HydrologySample,
  ): HydrologySample {
    if (this.config.waterEnabled < 1) {
      target.waterCoverage = 0;
      target.waterProximity = 0;
      target.humidityBoost = 0;
      target.grassMask = 1;
      target.waterLevel = carvedHeight;
      target.riverCoverage = 0;
      target.lakeCoverage = 0;
      return target;
    }

    this.sampleStructure(x, z, carvedHeight);
    const waterCoverage = Math.max(this.riverCoverage, this.lakeCoverage);
    const waterProximity = Math.max(this.riverProximity, this.lakeProximity);
    const lakeDominant = this.lakeCoverage >= this.riverCoverage;
    const riverWaterDepth =
      this.config.riverDepth * (0.58 + this.riverCoverage * 0.12);

    target.waterCoverage = clamp01(waterCoverage);
    target.waterProximity = clamp01(waterProximity);
    target.humidityBoost = clamp01(waterProximity * 0.68);
    target.grassMask = 1 - smoothstep(waterCoverage, 0.03, 0.28);
    target.waterLevel =
      (lakeDominant && this.lakeCoverage > 0.01
        ? this.lakeWaterLevel
        : carvedHeight + riverWaterDepth * this.riverCoverage) +
      this.config.waterSurfaceOffset;
    target.riverCoverage = clamp01(this.riverCoverage);
    target.lakeCoverage = clamp01(this.lakeCoverage);
    return target;
  }

  private sampleStructure(x: number, z: number, height: number): void {
    this.sampleRiver(x, z, height);
    this.sampleLake(x, z, height);
  }

  private sampleRiver(x: number, z: number, height: number): void {
    const spacing = this.config.riverSpacing;
    const phase = (this.config.seed % 8192) / 8192 * TWO_PI;
    const primaryFrequency = TWO_PI / (spacing * 1.7);
    const secondaryFrequency = TWO_PI / (spacing * 0.63);
    const meander =
      Math.sin(x * primaryFrequency + phase) * this.config.riverMeander +
      Math.sin(x * secondaryFrequency + phase * 1.73) *
        this.config.riverMeander *
        0.32;
    const distance = repeatedDistance(z + meander, spacing);
    const halfWidth = this.config.riverWidth * 0.5;
    const altitudeMask =
      1 -
      smoothstep(
        height,
        this.config.riverMaxAltitude - RIVER_ALTITUDE_FADE,
        this.config.riverMaxAltitude,
      );

    this.riverCoverage =
      (1 -
        smoothstep(
          distance,
          Math.max(0, halfWidth - RIVER_EDGE_FEATHER),
          halfWidth + RIVER_EDGE_FEATHER,
        )) *
      altitudeMask;
    this.riverBank =
      (1 -
        smoothstep(
          distance,
          halfWidth,
          halfWidth + this.config.riverBankWidth,
        )) *
      altitudeMask;
    this.riverProximity =
      (1 -
        smoothstep(
          distance,
          halfWidth,
          halfWidth + this.config.waterHumidityRadius,
        )) *
      altitudeMask;
  }

  private sampleLake(x: number, z: number, height: number): void {
    const spacing = this.config.lakeSpacing;
    const cellX = Math.floor(x / spacing);
    const cellZ = Math.floor(z / spacing);
    if (hash(cellX, cellZ, this.config.seed + 1201) >= this.config.lakeChance) {
      this.clearLake();
      return;
    }

    const margin = this.config.lakeRadiusMax + this.config.lakeShoreWidth + 2;
    const available = spacing - margin * 2;
    const centerX =
      cellX * spacing +
      margin +
      hash(cellX, cellZ, this.config.seed + 1213) * available;
    const centerZ =
      cellZ * spacing +
      margin +
      hash(cellX, cellZ, this.config.seed + 1223) * available;
    const baseRadius = lerp(
      this.config.lakeRadiusMin,
      this.config.lakeRadiusMax,
      hash(cellX, cellZ, this.config.seed + 1231),
    );
    const aspect = lerp(
      0.76,
      1.28,
      hash(cellX, cellZ, this.config.seed + 1237),
    );
    const angle = hash(cellX, cellZ, this.config.seed + 1249) * TWO_PI;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = x - centerX;
    const dz = z - centerZ;
    const localX = dx * cos + dz * sin;
    const localZ = -dx * sin + dz * cos;
    const radiusX = baseRadius * aspect;
    const radiusZ = baseRadius / aspect;
    const normalized = Math.hypot(localX / radiusX, localZ / radiusZ);
    const polar = Math.atan2(localZ / radiusZ, localX / radiusX);
    const edgePhase = hash(cellX, cellZ, this.config.seed + 1259) * TWO_PI;
    const edge =
      Math.sin(polar * LAKE_PRIMARY_EDGE_LOBES + edgePhase) *
        LAKE_EDGE_FEATHER_RATIO +
      Math.sin(polar * LAKE_SECONDARY_EDGE_LOBES - edgePhase * 0.71) *
        LAKE_EDGE_FEATHER_RATIO *
        0.45;
    const shapedDistance = normalized / (1 + edge);
    const levelNoise = hash(cellX, cellZ, this.config.seed + 1277);
    this.lakeWaterLevel =
      this.config.baseHeight +
      this.config.rollingHeight * lerp(0.06, 0.42, levelNoise);
    const altitudeMask =
      1 -
      smoothstep(
        height,
        this.lakeWaterLevel + this.config.lakeDepth * 0.8,
        this.lakeWaterLevel +
          this.config.lakeDepth +
          this.config.lakeShoreWidth,
      );
    const shoreRatio = this.config.lakeShoreWidth / Math.min(radiusX, radiusZ);
    const humidityRatio =
      this.config.waterHumidityRadius / Math.min(radiusX, radiusZ);

    this.lakeNormalizedDistance = shapedDistance;
    this.lakeCoverage =
      (1 - smoothstep(shapedDistance, 0.96, 1.02)) * altitudeMask;
    this.lakeBasin =
      (1 - smoothstep(shapedDistance, 1, 1 + shoreRatio)) * altitudeMask;
    this.lakeProximity =
      (1 - smoothstep(shapedDistance, 1, 1 + humidityRatio)) * altitudeMask;
  }

  private clearLake(): void {
    this.lakeCoverage = 0;
    this.lakeBasin = 0;
    this.lakeProximity = 0;
    this.lakeWaterLevel = 0;
    this.lakeNormalizedDistance = Number.POSITIVE_INFINITY;
  }
}
