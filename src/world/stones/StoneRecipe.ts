import { StoneRandom } from "./StoneRandom";

/**
 * Shape grammar for the stylized stone set.
 *
 * Every stone is one convex mass: a ring of side planes with taper, a tilted
 * top, bevel rings at the crown and the ground contact, and a few broad
 * diagonal cuts. Archetypes are curated parameter families over that grammar,
 * not separate generators — which is what keeps the whole population reading
 * as one asset set, the property the reference boards are organised around.
 *
 * All profile values live in a normalized space (base radius ~0.5, height 1)
 * and only become metres through {@link StoneDimensions} at the end.
 */

export type StoneArchetypeId =
  | "pebble"
  | "boulder"
  | "slab"
  | "block"
  | "shard"
  | "outcrop";

export const STONE_ARCHETYPE_IDS: readonly StoneArchetypeId[] = [
  "pebble",
  "boulder",
  "slab",
  "block",
  "shard",
  "outcrop",
];

interface Band {
  readonly min: number;
  readonly max: number;
}

export interface StoneArchetypeSpec {
  readonly id: StoneArchetypeId;
  readonly sideCount: readonly [number, number];
  /** Fractional radius jitter per side, smoothed once around the ring. */
  readonly radiusJitter: Band;
  /** How much narrower the profile gets per unit height. */
  readonly taper: Band;
  /** Crown footprint as a fraction of the body profile. */
  readonly topScale: Band;
  /** Height of the crown bevel ring, as a fraction of the body. */
  readonly topBevelHeight: Band;
  /** Maximum top-plane tilt (slope, not radians). */
  readonly topTiltMax: number;
  /** Ground-contact inset and bevel ring height. */
  readonly contactInset: Band;
  readonly contactBevelHeight: Band;
  /** Horizontal shear per unit height; shard leans are deliberate. */
  readonly lean: Band;
  readonly cutCount: readonly [number, number];
  readonly cutDepth: Band;
  /** Upward component of cut-plane normals. */
  readonly cutNormalY: Band;
  /** Metre aspect ratios applied by placement scale. */
  readonly heightRatio: Band;
  readonly depthRatio: Band;
  /** Baseline strength of the painted edge-wear accent. */
  readonly edgeWear: number;
  /** Fraction of final height sunk into the terrain at placement. */
  readonly embed: Band;
}

const ARCHETYPES: Record<StoneArchetypeId, StoneArchetypeSpec> = {
  pebble: {
    id: "pebble",
    sideCount: [6, 7],
    radiusJitter: { min: 0.06, max: 0.13 },
    taper: { min: 0.04, max: 0.1 },
    topScale: { min: 0.6, max: 0.8 },
    topBevelHeight: { min: 0.3, max: 0.42 },
    topTiltMax: 0.12,
    contactInset: { min: 0.06, max: 0.1 },
    contactBevelHeight: { min: 0.14, max: 0.2 },
    lean: { min: 0, max: 0.05 },
    cutCount: [0, 0],
    cutDepth: { min: 0.05, max: 0.08 },
    cutNormalY: { min: 0.3, max: 0.6 },
    heightRatio: { min: 0.38, max: 0.6 },
    depthRatio: { min: 0.72, max: 1.35 },
    edgeWear: 0.55,
    embed: { min: 0.16, max: 0.3 },
  },
  boulder: {
    id: "boulder",
    sideCount: [7, 9],
    radiusJitter: { min: 0.07, max: 0.18 },
    // The profile only has two bands — the tapered side ring and the crown
    // bevel — so "rounded" has to come from both: near-zero taper plus a
    // shallow bevel gives vertical sides under a flat lid, which reads as a
    // drum rather than a boulder.
    taper: { min: 0.13, max: 0.24 },
    topScale: { min: 0.36, max: 0.56 },
    topBevelHeight: { min: 0.36, max: 0.56 },
    topTiltMax: 0.16,
    contactInset: { min: 0.05, max: 0.1 },
    contactBevelHeight: { min: 0.1, max: 0.16 },
    lean: { min: 0.02, max: 0.12 },
    cutCount: [1, 2],
    cutDepth: { min: 0.05, max: 0.12 },
    cutNormalY: { min: 0.25, max: 0.7 },
    heightRatio: { min: 0.55, max: 0.95 },
    depthRatio: { min: 0.72, max: 1.4 },
    edgeWear: 0.75,
    embed: { min: 0.12, max: 0.22 },
  },
  slab: {
    id: "slab",
    sideCount: [6, 8],
    radiusJitter: { min: 0.05, max: 0.11 },
    taper: { min: 0.05, max: 0.1 },
    topScale: { min: 0.68, max: 0.85 },
    topBevelHeight: { min: 0.2, max: 0.3 },
    topTiltMax: 0.22,
    contactInset: { min: 0.05, max: 0.09 },
    contactBevelHeight: { min: 0.1, max: 0.15 },
    lean: { min: 0, max: 0.08 },
    cutCount: [1, 2],
    cutDepth: { min: 0.06, max: 0.12 },
    cutNormalY: { min: 0.2, max: 0.6 },
    // Below ~0.34 a slab reads as a paper plate once placement scales it up;
    // uniform scale preserves the ratio, so thickness has to come from here.
    heightRatio: { min: 0.36, max: 0.54 },
    depthRatio: { min: 0.85, max: 1.3 },
    edgeWear: 0.8,
    embed: { min: 0.18, max: 0.32 },
  },
  block: {
    id: "block",
    sideCount: [5, 6],
    radiusJitter: { min: 0.04, max: 0.09 },
    taper: { min: 0.05, max: 0.12 },
    topScale: { min: 0.64, max: 0.82 },
    topBevelHeight: { min: 0.18, max: 0.28 },
    topTiltMax: 0.15,
    contactInset: { min: 0.05, max: 0.09 },
    contactBevelHeight: { min: 0.09, max: 0.14 },
    lean: { min: 0.02, max: 0.1 },
    cutCount: [1, 3],
    cutDepth: { min: 0.09, max: 0.18 },
    cutNormalY: { min: 0.15, max: 0.55 },
    heightRatio: { min: 0.55, max: 0.85 },
    depthRatio: { min: 0.7, max: 1.1 },
    edgeWear: 0.85,
    embed: { min: 0.1, max: 0.2 },
  },
  shard: {
    id: "shard",
    // A shard is an angular leaning wedge, not a pillar. Its character comes
    // from a small crown plus a strongly tilted top, so the silhouette rises to
    // a ridge rather than a flat cap: at topScale 0.45+ over a level top it
    // read as a menhir regardless of how the height was tuned.
    sideCount: [5, 6],
    radiusJitter: { min: 0.09, max: 0.18 },
    taper: { min: 0.13, max: 0.22 },
    // Crown scale and bevel height trade off against each other: a small crown
    // under a tall bevel is one continuous taper to an apex, which reads as a
    // tent. Keeping the bevel a distinct facet band leaves a truncated top.
    topScale: { min: 0.32, max: 0.48 },
    topBevelHeight: { min: 0.16, max: 0.28 },
    topTiltMax: 0.4,
    contactInset: { min: 0.03, max: 0.06 },
    contactBevelHeight: { min: 0.06, max: 0.1 },
    lean: { min: 0.1, max: 0.2 },
    cutCount: [2, 3],
    cutDepth: { min: 0.1, max: 0.2 },
    cutNormalY: { min: 0.1, max: 0.5 },
    heightRatio: { min: 0.8, max: 1.2 },
    depthRatio: { min: 0.72, max: 1.05 },
    edgeWear: 0.7,
    embed: { min: 0.08, max: 0.16 },
  },
  outcrop: {
    id: "outcrop",
    sideCount: [6, 8],
    radiusJitter: { min: 0.08, max: 0.16 },
    taper: { min: 0.1, max: 0.2 },
    topScale: { min: 0.5, max: 0.7 },
    topBevelHeight: { min: 0.2, max: 0.3 },
    topTiltMax: 0.2,
    contactInset: { min: 0.04, max: 0.08 },
    contactBevelHeight: { min: 0.08, max: 0.13 },
    lean: { min: 0, max: 0.12 },
    cutCount: [1, 3],
    cutDepth: { min: 0.1, max: 0.2 },
    cutNormalY: { min: 0.2, max: 0.65 },
    heightRatio: { min: 0.5, max: 0.8 },
    depthRatio: { min: 0.9, max: 1.4 },
    edgeWear: 0.65,
    embed: { min: 0.25, max: 0.4 },
  },
};

export function getStoneArchetype(id: StoneArchetypeId): StoneArchetypeSpec {
  return ARCHETYPES[id];
}

export interface StoneCut {
  /** Unit normal of the clipping half-space. */
  readonly normalX: number;
  readonly normalY: number;
  readonly normalZ: number;
  /** Fraction of the projected span removed by the cut. */
  readonly depthFraction: number;
}

export interface StoneRecipe {
  readonly archetype: StoneArchetypeId;
  readonly seed: number;
  /** Final local dimensions in metres before placement scale. */
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly sideAngles: readonly number[];
  readonly sideRadii: readonly number[];
  readonly taper: number;
  readonly topScale: number;
  readonly topBevelHeight: number;
  readonly topTiltX: number;
  readonly topTiltZ: number;
  readonly contactInset: number;
  readonly contactBevelHeight: number;
  readonly leanX: number;
  readonly leanZ: number;
  readonly cuts: readonly StoneCut[];
  readonly edgeWear: number;
  readonly embed: number;
}

const TWO_PI = Math.PI * 2;
const BASE_RADIUS = 0.5;
/**
 * Fractional jitter on the angular gap between neighbouring side planes. At
 * 0.45 the tightest gap stays near 38% of nominal spacing, matching the floor
 * the original specification enforced through retries.
 */
const SIDE_GAP_JITTER = 0.45;
/** Cuts closer in direction than this are rotated apart or dropped. */
const CUT_SIMILARITY_LIMIT = 0.96;
const GOLDEN_ANGLE = 2.399963229728653;

function rangeOf(random: StoneRandom, band: Band): number {
  return random.range(band.min, band.max);
}

export function resolveStoneRecipe(
  archetypeId: StoneArchetypeId,
  seed: number,
): StoneRecipe {
  const spec = ARCHETYPES[archetypeId];
  const root = StoneRandom.fromSeed(seed).fork(`archetype:${archetypeId}`);

  const dimensions = root.fork("dimensions");
  const width = 1;
  const height = rangeOf(dimensions, spec.heightRatio);
  const depth = rangeOf(dimensions, spec.depthRatio);

  const profile = root.fork("profile");
  const sideCount = profile.integer(spec.sideCount[0], spec.sideCount[1]);
  const angleOffset = profile.range(0, TWO_PI / sideCount);
  const jitterAmplitude = rangeOf(profile, spec.radiusJitter);

  // Angles are built from jittered *gaps* normalized to a full turn, not from
  // jittered positions that are then sorted. Independently jittered positions
  // can land arbitrarily close together, and two nearly coincident side planes
  // produce a sliver face and a knife-edge silhouette — which is exactly what
  // a population generated that way looks like. Normalizing gaps bounds the
  // smallest gap at roughly (1 - jitter) / (1 + jitter) of nominal spacing, so
  // the ring stays irregular without ever degenerating.
  const angles = root.fork("side-angles");
  const gaps: number[] = [];
  let gapTotal = 0;
  for (let side = 0; side < sideCount; side += 1) {
    const gap = 1 + angles.signed(SIDE_GAP_JITTER);
    gaps.push(gap);
    gapTotal += gap;
  }
  const sideAngles: number[] = [];
  let cumulative = angleOffset;
  for (let side = 0; side < sideCount; side += 1) {
    sideAngles.push(cumulative);
    cumulative += (gaps[side] / gapTotal) * TWO_PI;
  }

  const radii = root.fork("side-radii");
  const rawRadii: number[] = [];
  for (let side = 0; side < sideCount; side += 1) {
    rawRadii.push(BASE_RADIUS * (1 + radii.signed(jitterAmplitude)));
  }
  // One cyclic smoothing pass keeps neighbouring facets related — pure
  // independent jitter reads as crumpled, not carved.
  const sideRadii: number[] = [];
  for (let side = 0; side < sideCount; side += 1) {
    const previous = rawRadii[(side + sideCount - 1) % sideCount];
    const next = rawRadii[(side + 1) % sideCount];
    sideRadii.push(previous * 0.25 + rawRadii[side] * 0.5 + next * 0.25);
  }

  const shape = root.fork("shape");
  const taper = rangeOf(shape, spec.taper);
  const topScale = rangeOf(shape, spec.topScale);
  const topBevelHeight = rangeOf(shape, spec.topBevelHeight);
  const topTiltX = shape.signed(spec.topTiltMax);
  const topTiltZ = shape.signed(spec.topTiltMax);
  const contactInset = rangeOf(shape, spec.contactInset);
  const contactBevelHeight = rangeOf(shape, spec.contactBevelHeight);

  const leanStream = root.fork("lean");
  const leanAngle = leanStream.range(0, TWO_PI);
  const leanStrength = rangeOf(leanStream, spec.lean);
  const leanX = Math.cos(leanAngle) * leanStrength;
  const leanZ = Math.sin(leanAngle) * leanStrength;

  const cutsStream = root.fork("cuts");
  const cutCount = cutsStream.integer(spec.cutCount[0], spec.cutCount[1]);
  const cuts: StoneCut[] = [];
  for (let index = 0; index < cutCount; index += 1) {
    const cutStream = root.fork(`cut:${index}`);
    const normalY = rangeOf(cutStream, spec.cutNormalY);
    let azimuth = cutStream.range(0, TWO_PI);
    const horizontal = Math.sqrt(Math.max(0, 1 - normalY * normalY));
    let attempts = 0;
    let accepted = false;
    while (attempts < 4 && !accepted) {
      const candidateX = Math.cos(azimuth) * horizontal;
      const candidateZ = Math.sin(azimuth) * horizontal;
      accepted = cuts.every(
        (existing) =>
          existing.normalX * candidateX +
            existing.normalY * normalY +
            existing.normalZ * candidateZ <
          CUT_SIMILARITY_LIMIT,
      );
      if (accepted) {
        cuts.push({
          normalX: candidateX,
          normalY,
          normalZ: candidateZ,
          depthFraction: rangeOf(cutStream, spec.cutDepth),
        });
      } else {
        azimuth += GOLDEN_ANGLE;
        attempts += 1;
      }
    }
  }

  const wearStream = root.fork("wear");
  const edgeWear = spec.edgeWear * wearStream.range(0.8, 1.2);
  const embed = rangeOf(wearStream, spec.embed);

  return {
    archetype: archetypeId,
    seed,
    width,
    height,
    depth,
    sideAngles,
    sideRadii,
    taper,
    topScale,
    topBevelHeight,
    topTiltX,
    topTiltZ,
    contactInset,
    contactBevelHeight,
    leanX,
    leanZ,
    cuts,
    edgeWear,
    embed,
  };
}
