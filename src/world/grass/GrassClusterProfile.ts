import type { WorldConfig } from "../WorldConfig";
import {
  GRASS_CLUSTER_ACCENT,
  GRASS_CLUSTER_DENSE_NORMAL,
  GRASS_CLUSTER_FLATTENED,
  GRASS_CLUSTER_SHORT_DRY,
  GRASS_CLUSTER_SPARSE_OPEN,
  GRASS_CLUSTER_TALL_WET,
  type GrassHabitatSample,
} from "./GrassHabitatField";

export interface GrassClusterProfile {
  heightScale: number;
  widthScale: number;
  understoryShare: number;
  accentShare: number;
  planeCoherence: number;
  asymmetry: number;
  drynessScale: number;
  drynessOffset: number;
  coverageScale: number;
  edgeCoverage: number;
  leanScale: number;
  gapStrength: number;
}

const MIN_MAIN_TIER_SHARE = 0.22;
const MIN_EDGE_COVERAGE = 0.4;
const MAX_PLANE_COHERENCE = 0.5;
const BASE_HEIGHT_IDENTITY_MIN = 0.94;
const BASE_HEIGHT_IDENTITY_RANGE = 0.12;
const BASE_ASYMMETRY_MIN = 0.05;
const BASE_ASYMMETRY_RANGE = 0.2;
const EDGE_FADE_START = 0.72;
const GAP_INNER_START = 0.18;
const GAP_INNER_FULL = 0.34;
const GAP_OUTER_FULL = 0.58;
const GAP_OUTER_END = 0.82;
const GAP_WAVE_START = 0.05;
const GAP_WAVE_END = 0.2;
const GAP_IDENTITY_START = 0.55;
const GAP_IDENTITY_END = 0.95;

const SPARSE_HEIGHT_SCALE = 0.96;
const SPARSE_WIDTH_SCALE = 1.08;
const SPARSE_UNDERSTORY_SHARE = 0.3;
const SPARSE_PLANE_SCALE = 0.65;
const SPARSE_DRYNESS_OFFSET = 0.015;
const SPARSE_COVERAGE_SCALE = 0.56;
const SPARSE_EDGE_SCALE = 0.72;
const SPARSE_LEAN_SCALE = 0.95;
const SPARSE_GAP_STRENGTH = 0.62;

const WET_HEIGHT_SCALE = 1.14;
const WET_WIDTH_SCALE = 0.94;
const WET_UNDERSTORY_SHARE = 0.28;
const WET_PLANE_SCALE = 1.25;
const WET_DRYNESS_SCALE = 0.5;
const WET_EDGE_COVERAGE = 0.94;
const WET_LEAN_SCALE = 0.78;
const WET_GAP_STRENGTH = 0.03;

const DRY_HEIGHT_SCALE = 0.78;
const DRY_WIDTH_SCALE = 1.06;
const DRY_UNDERSTORY_SHARE = 0.56;
const DRY_PLANE_SCALE = 0.64;
const DRY_DRYNESS_SCALE = 1.02;
const DRY_DRYNESS_OFFSET = 0.1;
const DRY_COVERAGE_SCALE = 0.88;
const DRY_EDGE_SCALE = 0.7;
const DRY_LEAN_SCALE = 1.05;
const DRY_GAP_STRENGTH = 0.54;

const FLATTENED_HEIGHT_SCALE = 0.8;
const FLATTENED_WIDTH_SCALE = 1.03;
const FLATTENED_UNDERSTORY_SHARE = 0.56;
const FLATTENED_PLANE_SCALE = 1.12;
const FLATTENED_ASYMMETRY_SCALE = 1.18;
const FLATTENED_DRYNESS_OFFSET = 0.04;
const FLATTENED_COVERAGE_SCALE = 0.9;
const FLATTENED_EDGE_SCALE = 0.74;
const FLATTENED_LEAN_SCALE = 1.75;
const FLATTENED_GAP_STRENGTH = 0.46;

const ACCENT_HEIGHT_SCALE = 1.1;
const ACCENT_WIDTH_SCALE = 0.98;
const ACCENT_UNDERSTORY_SHARE = 0.34;
const ACCENT_PLANE_SCALE = 1.08;
const ACCENT_EDGE_COVERAGE = 0.9;
const ACCENT_LEAN_SCALE = 0.95;
const ACCENT_GAP_STRENGTH = 0.08;

const NORMAL_ACCENT_IDENTITY_THRESHOLD = 0.62;
const SPARSE_ACCENT_IDENTITY_THRESHOLD = 0.84;
const NORMAL_ACCENT_SHARE_SCALE = 1.8;
const SPARSE_ACCENT_SHARE_SCALE = 1.35;
const WET_ACCENT_SHARE_SCALE = 2.7;
const ACCENT_SHARE_SCALE = 3.2;
const DEFAULT_GAP_STRENGTH = 0.12;
const HABITAT_UNDERSTORY_BLEND = 0.55;

function clamp(value: number, minimum: number, maximum: number): number {
  return value <= minimum ? minimum : value >= maximum ? maximum : value;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const amount = clamp01((value - edge0) / (edge1 - edge0));
  return amount * amount * (3 - 2 * amount);
}

export function createGrassClusterProfile(): GrassClusterProfile {
  return {
    heightScale: 1,
    widthScale: 1,
    understoryShare: 0,
    accentShare: 0,
    planeCoherence: 0,
    asymmetry: BASE_ASYMMETRY_MIN,
    drynessScale: 1,
    drynessOffset: 0,
    coverageScale: 1,
    edgeCoverage: 1,
    leanScale: 1,
    gapStrength: 0,
  };
}

/**
 * Resolves one stable clump morphology into caller-owned storage.
 *
 * Habitat remains the causal source. Archetypes only bias that state into
 * recognisable silhouettes, while the identity samples make neighbouring
 * clumps differ without adding another world-space noise field.
 */
export function resolveGrassClusterProfile(
  archetype: number,
  habitat: GrassHabitatSample,
  heightIdentity: number,
  tallIdentity: number,
  asymmetryIdentity: number,
  config: WorldConfig,
  target: GrassClusterProfile,
): GrassClusterProfile {
  target.heightScale =
    habitat.height *
    (BASE_HEIGHT_IDENTITY_MIN + heightIdentity * BASE_HEIGHT_IDENTITY_RANGE);
  target.widthScale = habitat.clumpScale;
  target.understoryShare = config.grassUnderlayerFraction;
  target.accentShare =
    tallIdentity > NORMAL_ACCENT_IDENTITY_THRESHOLD
      ? config.grassAccentBladeShare * NORMAL_ACCENT_SHARE_SCALE
      : 0;
  target.planeCoherence = config.grassClumpPlaneCoherence;
  target.asymmetry =
    BASE_ASYMMETRY_MIN + asymmetryIdentity * BASE_ASYMMETRY_RANGE;
  target.drynessScale = 1;
  target.drynessOffset = 0;
  target.coverageScale = 1;
  target.edgeCoverage = config.grassClumpEdgeCoverage;
  target.leanScale = 1;
  target.gapStrength = DEFAULT_GAP_STRENGTH;

  switch (archetype) {
    case GRASS_CLUSTER_SPARSE_OPEN:
      target.heightScale *= SPARSE_HEIGHT_SCALE;
      target.widthScale *= SPARSE_WIDTH_SCALE;
      target.understoryShare = SPARSE_UNDERSTORY_SHARE;
      target.accentShare =
        tallIdentity > SPARSE_ACCENT_IDENTITY_THRESHOLD
          ? config.grassAccentBladeShare * SPARSE_ACCENT_SHARE_SCALE
          : 0;
      target.planeCoherence *= SPARSE_PLANE_SCALE;
      target.drynessOffset = SPARSE_DRYNESS_OFFSET;
      target.coverageScale = SPARSE_COVERAGE_SCALE;
      target.edgeCoverage *= SPARSE_EDGE_SCALE;
      target.leanScale = SPARSE_LEAN_SCALE;
      target.gapStrength = SPARSE_GAP_STRENGTH;
      break;
    case GRASS_CLUSTER_TALL_WET:
      target.heightScale *= WET_HEIGHT_SCALE;
      target.widthScale *= WET_WIDTH_SCALE;
      target.understoryShare = WET_UNDERSTORY_SHARE;
      target.accentShare = config.grassAccentBladeShare * WET_ACCENT_SHARE_SCALE;
      target.planeCoherence *= WET_PLANE_SCALE;
      target.drynessScale = WET_DRYNESS_SCALE;
      target.edgeCoverage = Math.max(target.edgeCoverage, WET_EDGE_COVERAGE);
      target.leanScale = WET_LEAN_SCALE;
      target.gapStrength = WET_GAP_STRENGTH;
      break;
    case GRASS_CLUSTER_SHORT_DRY:
      target.heightScale *= DRY_HEIGHT_SCALE;
      target.widthScale *= DRY_WIDTH_SCALE;
      target.understoryShare = DRY_UNDERSTORY_SHARE;
      target.accentShare = 0;
      target.planeCoherence *= DRY_PLANE_SCALE;
      target.drynessScale = DRY_DRYNESS_SCALE;
      target.drynessOffset = DRY_DRYNESS_OFFSET;
      target.coverageScale = DRY_COVERAGE_SCALE;
      target.edgeCoverage *= DRY_EDGE_SCALE;
      target.leanScale = DRY_LEAN_SCALE;
      target.gapStrength = DRY_GAP_STRENGTH;
      break;
    case GRASS_CLUSTER_FLATTENED:
      target.heightScale *= FLATTENED_HEIGHT_SCALE;
      target.widthScale *= FLATTENED_WIDTH_SCALE;
      target.understoryShare = FLATTENED_UNDERSTORY_SHARE;
      target.accentShare = 0;
      target.planeCoherence *= FLATTENED_PLANE_SCALE;
      target.asymmetry *= FLATTENED_ASYMMETRY_SCALE;
      target.drynessOffset = FLATTENED_DRYNESS_OFFSET;
      target.coverageScale = FLATTENED_COVERAGE_SCALE;
      target.edgeCoverage *= FLATTENED_EDGE_SCALE;
      target.leanScale = FLATTENED_LEAN_SCALE;
      target.gapStrength = FLATTENED_GAP_STRENGTH;
      break;
    case GRASS_CLUSTER_ACCENT:
      target.heightScale *= ACCENT_HEIGHT_SCALE;
      target.widthScale *= ACCENT_WIDTH_SCALE;
      target.understoryShare = ACCENT_UNDERSTORY_SHARE;
      target.accentShare = config.grassAccentBladeShare * ACCENT_SHARE_SCALE;
      target.planeCoherence *= ACCENT_PLANE_SCALE;
      target.edgeCoverage = Math.max(target.edgeCoverage, ACCENT_EDGE_COVERAGE);
      target.leanScale = ACCENT_LEAN_SCALE;
      target.gapStrength = ACCENT_GAP_STRENGTH;
      break;
    case GRASS_CLUSTER_DENSE_NORMAL:
    default:
      break;
  }

  target.understoryShare = lerp(
    target.understoryShare,
    habitat.underlayer,
    HABITAT_UNDERSTORY_BLEND,
  );
  target.accentShare = clamp01(target.accentShare);
  target.understoryShare = clamp(
    target.understoryShare,
    0,
    1 - target.accentShare - MIN_MAIN_TIER_SHARE,
  );
  target.planeCoherence = clamp(
    target.planeCoherence,
    0,
    MAX_PLANE_COHERENCE,
  );
  target.asymmetry = clamp(target.asymmetry, 0.04, 0.3);
  target.edgeCoverage = clamp(target.edgeCoverage, MIN_EDGE_COVERAGE, 1);
  target.coverageScale = clamp01(target.coverageScale);
  target.gapStrength = clamp01(target.gapStrength);
  return target;
}

/**
 * Continuous core/shoulder/edge coverage with a stable, irregular interior gap.
 * It never enumerates another population and never clips a circular boundary.
 */
export function resolveGrassClusterCoverage(
  profile: GrassClusterProfile,
  radialPosition: number,
  sampleAngle: number,
  gapIdentity: number,
): number {
  const edgeAmount = smoothstep(EDGE_FADE_START, 1, radialPosition);
  const edgeCoverage = lerp(1, profile.edgeCoverage, edgeAmount);
  const interiorBand =
    smoothstep(GAP_INNER_START, GAP_INNER_FULL, radialPosition) *
    (1 - smoothstep(GAP_OUTER_FULL, GAP_OUTER_END, radialPosition));
  const gapWave =
    1 -
    smoothstep(
      GAP_WAVE_START,
      GAP_WAVE_END,
      Math.abs(Math.sin(sampleAngle * 1.5 + gapIdentity * Math.PI * 2)),
    );
  const gapActivation = smoothstep(
    GAP_IDENTITY_START,
    GAP_IDENTITY_END,
    gapIdentity,
  );
  const gapCoverage =
    1 - profile.gapStrength * interiorBand * gapWave * gapActivation;
  return clamp01(edgeCoverage * gapCoverage * profile.coverageScale);
}

/** Circular interpolation that never takes the long way around the unit circle. */
export function mixGrassAngle(
  independentAngle: number,
  clumpAngle: number,
  coherence: number,
): number {
  const delta = Math.atan2(
    Math.sin(clumpAngle - independentAngle),
    Math.cos(clumpAngle - independentAngle),
  );
  return independentAngle + delta * clamp01(coherence);
}
