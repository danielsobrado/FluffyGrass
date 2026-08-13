import type { WorldConfig } from "../WorldConfig";

const TWO_PI = Math.PI * 2;
const RIVER_EDGE_FEATHER = 0.8;
const RIVER_LOD_VISIBLE_EDGE_FACTOR = 0.75;
const RIVER_ALTITUDE_FADE = 18;
const RIVER_SECONDARY_AMPLITUDE = 0.3;
const RIVER_LATERAL_OFFSET = 0.18;
const RIVER_MIN_WIDTH_SCALE = 0.82;
const RIVER_MAX_MEANDER_SCALE = 1.15;
export const HYDROLOGY_RIVER_MAX_WIDTH_SCALE = 1.18;

export interface RiverSample {
  coverage: number;
  bank: number;
  proximity: number;
  flowX: number;
  flowZ: number;
}

export function createRiverSample(): RiverSample {
  return { coverage: 0, bank: 0, proximity: 0, flowX: 0, flowZ: 0 };
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

export function resolveHydrologyRiverMinimumVisibleHalfWidth(
  config: WorldConfig,
): number {
  return (
    config.riverWidth * RIVER_MIN_WIDTH_SCALE * 0.5 +
    RIVER_EDGE_FEATHER * RIVER_LOD_VISIBLE_EDGE_FACTOR
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

/** Per-lane values that depend only on the lane index, resolved once and reused. */
interface RiverLaneShape {
  index: number;
  laneOffset: number;
  phasePrimary: number;
  phaseSecondary: number;
  amplitude: number;
  halfWidth: number;
  flowSign: number;
}

/** One lane evaluated at the sampled x, keeping the phases the winner needs. */
interface RiverLane {
  shape: RiverLaneShape;
  distance: number;
  primaryPhase: number;
  secondaryPhase: number;
}

/** Power of two so the slot index is a mask away, and >= 2 so adjacent lanes fit. */
const LANE_SHAPE_CACHE_SIZE = 4;
const LANE_SHAPE_CACHE_MASK = LANE_SHAPE_CACHE_SIZE - 1;

function createLaneShape(): RiverLaneShape {
  return {
    index: Number.NaN,
    laneOffset: 0,
    phasePrimary: 0,
    phaseSecondary: 0,
    amplitude: 0,
    halfWidth: 0,
    flowSign: 1,
  };
}

/** Continuous lowland river corridors with deterministic per-river variation. */
export class RiverField {
  private readonly primaryFrequency: number;
  private readonly secondaryFrequency: number;
  /**
   * Direct-mapped on the low index bits. A sample only ever needs the two
   * adjacent lanes around z, which always land in different slots, so a row
   * sweep resolves each lane's hashes once instead of once per sample.
   */
  private readonly laneShapes: RiverLaneShape[] = Array.from(
    { length: LANE_SHAPE_CACHE_SIZE },
    createLaneShape,
  );
  private readonly laneA: RiverLane = {
    shape: createLaneShape(),
    distance: 0,
    primaryPhase: 0,
    secondaryPhase: 0,
  };
  private readonly laneB: RiverLane = {
    shape: createLaneShape(),
    distance: 0,
    primaryPhase: 0,
    secondaryPhase: 0,
  };

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
    const halfWidth = lane.shape.halfWidth;
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
          Math.max(0, halfWidth - RIVER_EDGE_FEATHER),
          halfWidth + RIVER_EDGE_FEATHER,
        )) *
      altitudeMask;
    target.bank =
      (1 -
        smoothstep(
          lane.distance,
          halfWidth,
          halfWidth + this.config.riverBankWidth,
        )) *
      altitudeMask;
    target.proximity =
      (1 -
        smoothstep(
          lane.distance,
          halfWidth,
          halfWidth + this.config.waterHumidityRadius,
        )) *
      altitudeMask;
    this.resolveFlow(lane, target);
    return target;
  }

  private sampleLane(
    index: number,
    x: number,
    z: number,
    target: RiverLane,
  ): void {
    const shape = this.resolveLaneShape(index);
    const primaryPhase = x * this.primaryFrequency + shape.phasePrimary;
    const secondaryPhase = x * this.secondaryFrequency + shape.phaseSecondary;
    const centerZ =
      shape.laneOffset +
      Math.sin(primaryPhase) * shape.amplitude +
      Math.sin(secondaryPhase) * shape.amplitude * RIVER_SECONDARY_AMPLITUDE;

    target.shape = shape;
    target.distance = Math.abs(z - centerZ);
    target.primaryPhase = primaryPhase;
    target.secondaryPhase = secondaryPhase;
  }

  /** Only the nearest lane contributes, so its tangent is resolved after the pick. */
  private resolveFlow(lane: RiverLane, target: RiverSample): void {
    const amplitude = lane.shape.amplitude;
    const derivative =
      Math.cos(lane.primaryPhase) * amplitude * this.primaryFrequency +
      Math.cos(lane.secondaryPhase) *
        amplitude *
        RIVER_SECONDARY_AMPLITUDE *
        this.secondaryFrequency;
    const flowSign = lane.shape.flowSign;
    // The meander derivative is bounded well inside float range, so the plain
    // tangent length is exact enough and far cheaper than Math.hypot.
    const flowLength = Math.sqrt(1 + derivative * derivative);

    target.flowX = flowSign / flowLength;
    target.flowZ = (flowSign * derivative) / flowLength;
  }

  private resolveLaneShape(index: number): RiverLaneShape {
    const shape = this.laneShapes[index & LANE_SHAPE_CACHE_MASK];
    if (shape.index === index) return shape;

    const seed = this.config.seed;
    const lateralOffset =
      (hash(index, seed + 1327) - 0.5) *
      this.config.riverSpacing *
      RIVER_LATERAL_OFFSET;
    const widthScale = lerp(
      RIVER_MIN_WIDTH_SCALE,
      HYDROLOGY_RIVER_MAX_WIDTH_SCALE,
      hash(index, seed + 1361),
    );

    shape.index = index;
    shape.laneOffset = index * this.config.riverSpacing + lateralOffset;
    shape.phasePrimary = hash(index, seed + 1301) * TWO_PI;
    shape.phaseSecondary = hash(index, seed + 1307) * TWO_PI;
    shape.amplitude =
      this.config.riverMeander *
      lerp(0.72, RIVER_MAX_MEANDER_SCALE, hash(index, seed + 1319));
    shape.halfWidth = this.config.riverWidth * widthScale * 0.5;
    shape.flowSign = hash(index, seed + 1373) < 0.5 ? -1 : 1;
    return shape;
  }
}
