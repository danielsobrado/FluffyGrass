import type { WorldConfig } from "../WorldConfig";
import {
  RIVER_BANK_INCISION_SCALE,
  RIVER_BASE_MAX_WIDTH_SCALE,
  RIVER_BASE_MIN_WIDTH_SCALE,
  RIVER_CHANNEL_DEPTH_SHARE,
  RIVER_CHANNEL_INNER,
  RIVER_CHANNEL_OUTER,
  RIVER_DEPTH_EDGE_START,
  RIVER_GLOBAL_MAX_WIDTH_SCALE,
  RIVER_GLOBAL_MIN_WIDTH_SCALE,
  RIVER_MORPH_MAX_ABS,
  RIVER_MORPH_PRIMARY_WEIGHT,
  RIVER_MORPH_SECONDARY_WEIGHT,
  RIVER_SECONDARY_AMPLITUDE,
  RIVER_SHELF_DEPTH_SHARE,
  RIVER_SHELF_START,
} from "./RiverTuning";

const TWO_PI = Math.PI * 2;
const RIVER_EDGE_FEATHER = 0.8;
const RIVER_LOD_VISIBLE_EDGE_FACTOR = 0.75;
const RIVER_ALTITUDE_FADE = 18;
const RIVER_LATERAL_OFFSET = 0.18;
const RIVER_MAX_MEANDER_SCALE = 1.15;
export const HYDROLOGY_RIVER_MAX_WIDTH_SCALE = RIVER_GLOBAL_MAX_WIDTH_SCALE;

export interface RiverSample {
  coverage: number;
  bank: number;
  proximity: number;
  flowX: number;
  flowZ: number;
  morphology: number;
  bend: number;
  lateral: number;
  localHalfWidth: number;
  bedDepth: number;
  incisionDepth: number;
}

export function createRiverSample(): RiverSample {
  return {
    coverage: 0,
    bank: 0,
    proximity: 0,
    flowX: 0,
    flowZ: 0,
    morphology: 0,
    bend: 0,
    lateral: 0,
    localHalfWidth: 0,
    bedDepth: 0,
    incisionDepth: 0,
  };
}

function clearRiverSample(target: RiverSample): RiverSample {
  target.coverage = 0;
  target.bank = 0;
  target.proximity = 0;
  target.flowX = 0;
  target.flowZ = 0;
  target.morphology = 0;
  target.bend = 0;
  target.lateral = 0;
  target.localHalfWidth = 0;
  target.bedDepth = 0;
  target.incisionDepth = 0;
  return target;
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
    config.riverWidth * RIVER_GLOBAL_MAX_WIDTH_SCALE * 0.5 +
    config.waterHumidityRadius
  );
}

export function resolveHydrologyRiverMinimumVisibleHalfWidth(
  config: WorldConfig,
): number {
  return (
    config.riverWidth * RIVER_GLOBAL_MIN_WIDTH_SCALE * 0.5 +
    RIVER_EDGE_FEATHER * RIVER_LOD_VISIBLE_EDGE_FACTOR
  );
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
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
  baseHalfWidth: number;
  flowSign: number;
}

/** One lane evaluated at the sampled x, keeping the phases the winner needs. */
interface RiverLane {
  shape: RiverLaneShape;
  signedDistance: number;
  distance: number;
  primaryPhase: number;
  secondaryPhase: number;
  primarySin: number;
  secondarySin: number;
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
    baseHalfWidth: 0,
    flowSign: 1,
  };
}

function createLane(): RiverLane {
  return {
    shape: createLaneShape(),
    signedDistance: 0,
    distance: 0,
    primaryPhase: 0,
    secondaryPhase: 0,
    primarySin: 0,
    secondarySin: 0,
  };
}

/** Continuous lowland river corridors with deterministic per-river variation. */
export class RiverField {
  private readonly primaryFrequency: number;
  private readonly secondaryFrequency: number;
  private readonly maximumInfluenceHalfWidth: number;
  /**
   * Direct-mapped on the low index bits. A sample only ever needs the two
   * adjacent lanes around z, which always land in different slots, so a row
   * sweep resolves each lane's hashes once instead of once per sample.
   */
  private readonly laneShapes: RiverLaneShape[] = Array.from(
    { length: LANE_SHAPE_CACHE_SIZE },
    createLaneShape,
  );
  private readonly laneA: RiverLane = createLane();
  private readonly laneB: RiverLane = createLane();

  constructor(private readonly config: WorldConfig) {
    this.primaryFrequency = TWO_PI / (config.riverSpacing * 1.7);
    this.secondaryFrequency = TWO_PI / (config.riverSpacing * 0.63);
    this.maximumInfluenceHalfWidth =
      config.riverWidth * RIVER_GLOBAL_MAX_WIDTH_SCALE * 0.5 +
      Math.max(
        RIVER_EDGE_FEATHER,
        config.riverBankWidth,
        config.waterHumidityRadius,
      );
  }

  sample(
    x: number,
    z: number,
    height: number,
    target: RiverSample,
  ): RiverSample {
    if (height >= this.config.riverMaxAltitude) {
      return clearRiverSample(target);
    }
    const lowerIndex = Math.floor(z / this.config.riverSpacing);
    this.sampleLane(lowerIndex, x, z, this.laneA);
    this.sampleLane(lowerIndex + 1, x, z, this.laneB);
    const lane =
      this.laneA.distance <= this.laneB.distance ? this.laneA : this.laneB;
    if (lane.distance > this.maximumInfluenceHalfWidth) {
      return clearRiverSample(target);
    }
    this.resolveSelectedLane(lane, height, target);
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
    const primarySin = Math.sin(primaryPhase);
    const secondarySin = Math.sin(secondaryPhase);
    const centerZ =
      shape.laneOffset +
      primarySin * shape.amplitude +
      secondarySin * shape.amplitude * RIVER_SECONDARY_AMPLITUDE;
    const signedDistance = z - centerZ;

    target.shape = shape;
    target.signedDistance = signedDistance;
    target.distance = Math.abs(signedDistance);
    target.primaryPhase = primaryPhase;
    target.secondaryPhase = secondaryPhase;
    target.primarySin = primarySin;
    target.secondarySin = secondarySin;
  }

  /** Cosines, morphology, and the provisional tangent are selected-lane work. */
  private resolveSelectedLane(
    lane: RiverLane,
    height: number,
    target: RiverSample,
  ): void {
    const amplitude = lane.shape.amplitude;
    const primaryCos = Math.cos(lane.primaryPhase);
    const secondaryCos = Math.cos(lane.secondaryPhase);
    const morphologyRaw =
      lane.primarySin * lane.secondarySin * RIVER_MORPH_PRIMARY_WEIGHT +
      primaryCos * secondaryCos * RIVER_MORPH_SECONDARY_WEIGHT;
    const morphology = clamp(morphologyRaw / RIVER_MORPH_MAX_ABS, -1, 1);

    const firstDerivative =
      primaryCos * amplitude * this.primaryFrequency +
      secondaryCos *
        amplitude *
        RIVER_SECONDARY_AMPLITUDE *
        this.secondaryFrequency;
    const secondDerivative =
      -lane.primarySin *
        amplitude *
        this.primaryFrequency *
        this.primaryFrequency -
      lane.secondarySin *
        amplitude *
        RIVER_SECONDARY_AMPLITUDE *
        this.secondaryFrequency *
        this.secondaryFrequency;
    const secondDerivativeReference = Math.max(
      1e-9,
      amplitude *
        (this.primaryFrequency * this.primaryFrequency +
          RIVER_SECONDARY_AMPLITUDE *
            this.secondaryFrequency *
            this.secondaryFrequency),
    );
    const tangentLength = Math.sqrt(1 + firstDerivative * firstDerivative);
    const curvature =
      secondDerivative /
      (tangentLength * tangentLength * tangentLength);
    const bend = clamp(curvature / secondDerivativeReference, -1, 1);

    const side =
      lane.signedDistance > 0 ? 1 : lane.signedDistance < 0 ? -1 : 0;
    const morphologyWidth = 1 + this.config.riverWidthVariation * morphology;
    const bendSide = bend * side;
    const bendWidth = 1 + this.config.riverBendBankAsymmetry * bendSide;
    const localHalfWidth =
      lane.shape.baseHalfWidth * morphologyWidth * bendWidth;
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
          Math.max(0, localHalfWidth - RIVER_EDGE_FEATHER),
          localHalfWidth + RIVER_EDGE_FEATHER,
        )) *
      altitudeMask;
    target.bank =
      (1 -
        smoothstep(
          lane.distance,
          localHalfWidth,
          localHalfWidth + this.config.riverBankWidth,
        )) *
      altitudeMask;
    target.proximity =
      (1 -
        smoothstep(
          lane.distance,
          localHalfWidth,
          localHalfWidth + this.config.waterHumidityRadius,
        )) *
      altitudeMask;

    const lateral = clamp(
      lane.signedDistance / Math.max(localHalfWidth, 1e-6),
      -1,
      1,
    );
    const absLateral = Math.abs(lateral);
    const channelCenter = -bend * this.config.riverBendChannelShift;
    const edgeMask =
      1 - smoothstep(absLateral, RIVER_DEPTH_EDGE_START, 1);
    const shelf =
      RIVER_SHELF_DEPTH_SHARE *
      (1 - smoothstep(absLateral, RIVER_SHELF_START, 1));
    const channelDistance = Math.abs(lateral - channelCenter);
    const channel =
      RIVER_CHANNEL_DEPTH_SHARE *
      (1 -
        smoothstep(channelDistance, RIVER_CHANNEL_INNER, RIVER_CHANNEL_OUTER));
    const section = clamp((shelf + channel) * edgeMask, 0, 1);
    const depthScale = 1 + this.config.riverDepthVariation * morphology;
    const bedDepth =
      this.config.riverDepth * section * depthScale * altitudeMask;
    const shoulderIncision =
      this.config.riverDepth *
      RIVER_BANK_INCISION_SCALE *
      target.bank *
      (1 - target.coverage);

    const flowSign = lane.shape.flowSign;
    target.flowX = flowSign / tangentLength;
    target.flowZ = (flowSign * firstDerivative) / tangentLength;
    target.morphology = morphology;
    target.bend = bend;
    target.lateral = lateral;
    target.localHalfWidth = localHalfWidth;
    target.bedDepth = bedDepth;
    target.incisionDepth = bedDepth + shoulderIncision;
  }

  private resolveLaneShape(index: number): RiverLaneShape {
    const shape = this.laneShapes[index & LANE_SHAPE_CACHE_MASK];
    if (shape.index === index) return shape;

    const seed = this.config.seed;
    const lateralOffset =
      (hash(index, seed + 1327) - 0.5) *
      this.config.riverSpacing *
      RIVER_LATERAL_OFFSET;
    const baseWidthScale = lerp(
      RIVER_BASE_MIN_WIDTH_SCALE,
      RIVER_BASE_MAX_WIDTH_SCALE,
      hash(index, seed + 1361),
    );

    shape.index = index;
    shape.laneOffset = index * this.config.riverSpacing + lateralOffset;
    shape.phasePrimary = hash(index, seed + 1301) * TWO_PI;
    shape.phaseSecondary = hash(index, seed + 1307) * TWO_PI;
    shape.amplitude =
      this.config.riverMeander *
      lerp(0.72, RIVER_MAX_MEANDER_SCALE, hash(index, seed + 1319));
    shape.baseHalfWidth = this.config.riverWidth * baseWidthScale * 0.5;
    shape.flowSign = hash(index, seed + 1373) < 0.5 ? -1 : 1;
    return shape;
  }
}
