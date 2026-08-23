/**
 * One parent boulder, broken into two pieces that still fit together.
 *
 * The world renders stones from a shared pool of instanced meshes, so a
 * formation cannot be clipped per placement without giving every cluster its
 * own geometry. It does not need to be: the break is deterministic in the
 * parent's seed, which means both halves can be baked as ordinary pool variants
 * and paired at placement time. The pool grows by the fragments actually asked
 * for; the per-instance cost stays exactly what a whole stone costs.
 *
 * What this buys over the previous split -- the same variant placed twice,
 * smaller and turned around -- is that the two bodies are genuinely
 * complementary. Their broken faces are one plane seen from both sides, so the
 * pieces read as a rock that came apart rather than as a rock standing beside
 * its own copy. It also buys the first apparent concavity in the system: every
 * stone body is a half-space intersection and therefore strictly convex, but a
 * mated pair leaning together holds a shadowed re-entrant crack that no single
 * convex body can.
 */

import { buildStonePolyhedron, buildStoneSurfacePlanes } from "./StoneClipper";
import { calculateStonePolygonAreaAndNormal } from "./StoneMeshTopology";
import type { StoneMeshMetrics } from "./StoneGeometry";
import { StoneRandom } from "./StoneRandom";
import type {
  StoneArchetypeId,
  StoneFractureFace,
  StoneInheritedSurface,
  StoneRecipe,
} from "./StoneRecipe";

/** Which piece of a parent body a pooled variant carries. */
export type StoneFragmentId = "whole" | "a" | "b";

export const STONE_FRAGMENT_IDS: readonly StoneFragmentId[] = [
  "whole",
  "a",
  "b",
];

/**
 * Only massive bodies break into a readable formation. A pebble split in two is
 * two pebbles, and a shard is already a fragment of something.
 */
const FRACTURABLE_ARCHETYPES: ReadonlySet<StoneArchetypeId> =
  new Set<StoneArchetypeId>(["boulder", "block", "slab", "outcrop"]);

/**
 * How far off vertical the break may lean. A near-vertical joint leaves both
 * pieces standing on their own contact polygon; past this the smaller piece
 * starts to be a lid with no ground contact of its own.
 */
const FRACTURE_TILT_LIMIT = 0.26;

/**
 * Share of the body's extent along the break normal kept by fragment "a".
 *
 * Narrow, and deliberately close to even: the wider range this started from put
 * most seeds near its top, which left the minor piece a thin wedge rather than
 * a companion mass. A boulder that has parted reads best at roughly six to
 * four.
 */
const MAJOR_SHARE_MIN = 0.54;
const MAJOR_SHARE_MAX = 0.62;

/**
 * A break that takes less of the surface than this has clipped a corner, not
 * halved a boulder, and the pair would read as one stone with a chip.
 */
const MINIMUM_FRACTURE_AREA_SHARE = 0.09;

const PAIR_CACHE_LIMIT = 128;

/** Below this the two contact centroids coincide and there is no parting. */
const PARTING_EPSILON = 1e-4;

interface StoneFragmentPair {
  readonly a: StoneRecipe;
  readonly b: StoneRecipe;
}

const pairCache = new Map<string, StoneFragmentPair | undefined>();

export function canFractureStoneArchetype(
  archetype: StoneArchetypeId,
): boolean {
  return FRACTURABLE_ARCHETYPES.has(archetype);
}

/**
 * The recipe for one piece of `parent`, or the parent itself when the body
 * cannot carry a readable break. Callers treat a returned parent as a signal
 * that the formation did not form: placing the pair is only worthwhile when
 * both fragments differ from the whole.
 */
export function resolveStoneFragmentRecipe(
  parent: StoneRecipe,
  fragment: StoneFragmentId,
): StoneRecipe {
  if (fragment === "whole") return parent;
  const pair = resolveFragmentPair(parent);
  if (!pair) return parent;
  return fragment === "a" ? pair.a : pair.b;
}

/** Whether this parent actually produced two viable halves. */
export function stoneFormationSplits(parent: StoneRecipe): boolean {
  return resolveFragmentPair(parent) !== undefined;
}

function resolveFragmentPair(
  parent: StoneRecipe,
): StoneFragmentPair | undefined {
  if (parent.fracture) return undefined;
  if (!canFractureStoneArchetype(parent.archetype)) return undefined;
  const key = `${parent.archetype}:${parent.seed}:${parent.silhouetteVariant}`;
  if (pairCache.has(key)) return pairCache.get(key);
  const pair = buildFragmentPair(parent);
  if (pairCache.size >= PAIR_CACHE_LIMIT) {
    const oldest = pairCache.keys().next().value as string | undefined;
    if (oldest !== undefined) pairCache.delete(oldest);
  }
  pairCache.set(key, pair);
  return pair;
}

function buildFragmentPair(parent: StoneRecipe): StoneFragmentPair | undefined {
  const plane = resolveFracturePlane(parent);
  if (!plane) return undefined;
  const inheritedSurface = resolveParentSurface(parent);
  const a: StoneRecipe = { ...parent, fracture: plane, inheritedSurface };
  const b: StoneRecipe = {
    ...parent,
    inheritedSurface,
    fracture: {
      nx: -plane.nx,
      ny: -plane.ny,
      nz: -plane.nz,
      constant: -plane.constant,
    },
  };
  if (!fragmentIsViable(a) || !fragmentIsViable(b)) return undefined;
  return { a, b };
}

/** The parent's surface where the parent put it, for both halves to inherit. */
function resolveParentSurface(parent: StoneRecipe): StoneInheritedSurface {
  return {
    coarse: buildStoneSurfacePlanes(parent, false),
    detailed: buildStoneSurfacePlanes(parent, true),
  };
}

/**
 * The break is placed by support distance rather than by a fixed offset, so the
 * same share of the body falls on the major side whatever the archetype's
 * proportions are.
 */
function resolveFracturePlane(
  parent: StoneRecipe,
): StoneFractureFace | undefined {
  const random = StoneRandom.fromSeed(parent.seed).fork("formation-fracture");
  const azimuth = random.fork("azimuth").range(0, Math.PI * 2);
  const tilt = random.fork("tilt").signed(FRACTURE_TILT_LIMIT);
  const inverse = 1 / Math.hypot(1, tilt);
  const nx = Math.cos(azimuth) * inverse;
  const ny = tilt * inverse;
  const nz = Math.sin(azimuth) * inverse;

  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (const polygon of buildStonePolyhedron(parent, false)) {
    for (const point of polygon.points) {
      const support = nx * point.x + ny * point.y + nz * point.z;
      if (support < minimum) minimum = support;
      if (support > maximum) maximum = support;
    }
  }
  if (!(maximum > minimum)) return undefined;

  const share = random.fork("share").range(MAJOR_SHARE_MIN, MAJOR_SHARE_MAX);
  return {
    nx,
    ny,
    nz,
    constant: minimum + (maximum - minimum) * share,
  };
}

function fragmentIsViable(recipe: StoneRecipe): boolean {
  const faces = buildStonePolyhedron(recipe, false);
  if (faces.length < 4) return false;
  let grounded = false;
  let fractureArea = 0;
  let totalArea = 0;
  for (const face of faces) {
    const [area] = calculateStonePolygonAreaAndNormal(face);
    totalArea += area;
    if (face.role === "fracture") fractureArea += area;
    if (face.role === "bottom" && area > 0) grounded = true;
  }
  if (!grounded || !(totalArea > 0)) return false;
  return fractureArea / totalArea >= MINIMUM_FRACTURE_AREA_SHARE;
}

/**
 * Where the minor half sits relative to the major one, in the major's own mesh
 * space and before any yaw is applied.
 *
 * Both fragments were centred on their own contact polygon when they were
 * baked, so the difference of those centrings is precisely the translation that
 * undoes the centring and puts the two pieces back on the plane they were cut
 * from. The crack gap is then the only thing separating them, and it runs along
 * the parting direction so the halves slide apart rather than shear.
 *
 * Returns undefined when the two centrings coincide, which means the break did
 * not actually divide the body and there is no direction to part along.
 */
export function resolveStoneFormationOffset(
  major: StoneMeshMetrics,
  minor: StoneMeshMetrics,
  scale: number,
  crackGap: number,
): { readonly x: number; readonly z: number } | undefined {
  const partingX = minor.contactOffsetX - major.contactOffsetX;
  const partingZ = minor.contactOffsetZ - major.contactOffsetZ;
  const parting = Math.hypot(partingX, partingZ);
  if (!(parting > PARTING_EPSILON)) return undefined;
  return {
    x: partingX * scale + (partingX / parting) * crackGap,
    z: partingZ * scale + (partingZ / parting) * crackGap,
  };
}
