import type { WorldConfig } from "../WorldConfig";

const TWO_PI = Math.PI * 2;
const RIVER_EDGE_FEATHER = 0.8;
const RIVER_ALTITUDE_FADE = 18;
const RIVER_SECONDARY_AMPLITUDE = 0.3;
const RIVER_LATERAL_OFFSET = 0.18;
const RIVER_MAX_MEANDER_SCALE = 1.15;
export const HYDROLOGY_RIVER_MAX_WIDTH_SCALE = 1.18;

export interface RiverSample {
  coverage: number;
  bank: number;
  proximity: number;
}

export function createRiverSample(): RiverSample {
  return { coverage: 0, bank: 0, proximity: 0 };
}

export function resolveHydrologyRiverMinimumSeparation(
  config: WorldConfig,
): number {
  const maximumLateralShift =
    config.riverSpacing * RIVER_LATERAL_OFFSET * 0.5;
  const maximumMeander =
    config.riverMeander *
    RIVER_MAX_MEANDER_SCALE *
    (1 + RIVER_SECONDARY_AMPLITUDE);
  return config.riverSpacing - 2 * (maximumLateralShift + maximumMeander);
}

export function resolveHydrologyRiverWetHalfWidth(config: WorldConfig): number {
  return (
    config.riverWidth * HYDROLOGY_RIVER_MAX_WIDTH_SCALE * 0.5 +
    config.waterHumidityRadius
  );
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

function hash(index: number, seed: number): number {
  let value = Math.imul(index, 374761393) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

interface RiverLane {
  distance: number;
  halfWidth: number;
}

/** Continuous lowland river corridors with deterministic per-river variation. */
export class RiverField {
  private readonly primaryFrequency: number;
  private readonly secondaryFrequency: number;
  private readonly laneA: RiverLane = { distance: 0, halfWidth: 0 };
  private readonly laneB: RiverLane = { distance: 0, halfWidth: 0 };

  constructor(private readonly config: WorldConfig) {
    this.primaryFrequency = TWO_PI / (config.riverSpacing * 1.7);
    this.secondaryFrequency = TWO_PI / (config.riverSpacing * 0.63);
  }

  sample(
    x: number,
    z: number,
    height: number,
    target: RiverSample,
  ): RiverSample {
    const lowerIndex = Math.floor(z / this.config.riverSpacing);
    this.sampleLane(lowerIndex, x, z, this.laneA);
    this.sampleLane(lowerIndex + 1, x, z, this.laneB);
    const lane =
      this.laneA.distance <= this.laneB.distance ? this.laneA : this.laneB;
    const altitudeMask =
      1 -
      smoothstep(
        height,
        this.config.riverMaxAltitude - RIVER_ALTITUDE_FADE,
        this.config.riverMaxAltitude,
      );

    target.coverage =
      (1 -
        smoothstep(
          lane.distance,
          Math.max(0, lane.halfWidth - RIVER_EDGE_FEATHER),
          lane.halfWidth + RIVER_EDGE_FEATHER,
        )) *
      altitudeMask;
    target.bank =
      (1 -
        smoothstep(
          lane.distance,
          lane.halfWidth,
          lane.halfWidth + this.config.riverBankWidth,
        )) *
      altitudeMask;
    target.proximity =
      (1 -
        smoothstep(
          lane.distance,
          lane.halfWidth,
          lane.halfWidth + this.config.waterHumidityRadius,
        )) *
      altitudeMask;
    return target;
  }

  private sampleLane(
    index: number,
    x: number,
    z: number,
    target: RiverLane,
  ): void {
    const seed = this.config.seed;
    const phasePrimary = hash(index, seed + 1301) * TWO_PI;
    const phaseSecondary = hash(index, seed + 1307) * TWO_PI;
    const amplitude =
      this.config.riverMeander *
      lerp(0.72, RIVER_MAX_MEANDER_SCALE, hash(index, seed + 1319));
    const lateralOffset =
      (hash(index, seed + 1327) - 0.5) *
      this.config.riverSpacing *
      RIVER_LATERAL_OFFSET;
    const widthScale = lerp(
      0.82,
      HYDROLOGY_RIVER_MAX_WIDTH_SCALE,
      hash(index, seed + 1361),
    );
    const centerZ =
      index * this.config.riverSpacing +
      lateralOffset +
      Math.sin(x * this.primaryFrequency + phasePrimary) * amplitude +
      Math.sin(x * this.secondaryFrequency + phaseSecondary) *
        amplitude *
        RIVER_SECONDARY_AMPLITUDE;

    target.distance = Math.abs(z - centerZ);
    target.halfWidth = this.config.riverWidth * widthScale * 0.5;
  }
}
