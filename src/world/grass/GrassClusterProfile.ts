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
    understoryShare: 0.48,
    accentShare: 0,
    planeCoherence: 0.24,
    asymmetry: 0.12,
    drynessScale: 1,
    drynessOffset: 0,
    coverageScale: 1,
    edgeCoverage: 0.82,
    leanScale: 1,
    gapStrength: 0.12,
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
    tallIdentity > 0.62 ? config.grassAccentBladeShare * 1.8 : 0;
  target.planeCoherence = config.grassClumpPlaneCoherence;
  target.asymmetry =
    BASE_ASYMMETRY_MIN + asymmetryIdentity * BASE_ASYMMETRY_RANGE;
  target.drynessScale = 1;
  target.drynessOffset = 0;
  target.coverageScale = 1;
  target.edgeCoverage = config.grassClumpEdgeCoverage;
  target.leanScale = 1;
  target.gapStrength = 0.12;

  switch (archetype) {
    case GRASS_CLUSTER_SPARSE_OPEN:
      target.heightScale *= 0.96;
      target.widthScale *= 1.08;
      target.understoryShare = 0.3;
      target.accentShare =
        tallIdentity > 0.84 ? config.grassAccentBladeShare * 1.35 : 0;
      target.planeCoherence *= 0.65;
      target.drynessOffset = 0.015;
      target.coverageScale = 0.56;
      target.edgeCoverage *= 0.72;
      target.leanScale = 0.95;
      target.gapStrength = 0.62;
      break;
    case GRASS_CLUSTER_TALL_WET:
      target.heightScale *= 1.14;
      target.widthScale *= 0.94;
      target.understoryShare = 0.28;
      target.accentShare = config.grassAccentBladeShare * 2.7;
      target.planeCoherence *= 1.25;
      target.drynessScale = 0.5;
      target.edgeCoverage = Math.max(target.edgeCoverage, 0.94);
      target.leanScale = 0.78;
      target.gapStrength = 0.03;
      break;
    case GRASS_CLUSTER_SHORT_DRY:
      target.heightScale *= 0.78;
      target.widthScale *= 1.06;
      target.understoryShare = 0.56;
      target.accentShare = 0;
      target.planeCoherence *= 0.64;
      target.drynessScale = 1.02;
      target.drynessOffset = 0.1;
      target.coverageScale = 0.88;
      target.edgeCoverage *= 0.7;
      target.leanScale = 1.05;
      target.gapStrength = 0.54;
      break;
    case GRASS_CLUSTER_FLATTENED:
      target.heightScale *= 0.8;
      target.widthScale *= 1.03;
      target.understoryShare = 0.56;
      target.accentShare = 0;
      target.planeCoherence *= 1.12;
      target.asymmetry *= 1.18;
      target.drynessOffset = 0.04;
      target.coverageScale = 0.9;
      target.edgeCoverage *= 0.74;
      target.leanScale = 1.25;
      target.gapStrength = 0.46;
      break;
    case GRASS_CLUSTER_ACCENT:
      target.heightScale *= 1.1;
      target.widthScale *= 0.98;
      target.understoryShare = 0.34;
      target.accentShare = config.grassAccentBladeShare * 3.2;
      target.planeCoherence *= 1.08;
      target.edgeCoverage = Math.max(target.edgeCoverage, 0.9);
      target.leanScale = 0.95;
      target.gapStrength = 0.08;
      break;
    case GRASS_CLUSTER_DENSE_NORMAL:
    default:
      break;
  }

  target.understoryShare = lerp(
    target.understoryShare,
    habitat.underlayer,
    0.55,
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
  return clamp01(
    edgeCoverage * gapCoverage * profile.coverageScale,
  );
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
