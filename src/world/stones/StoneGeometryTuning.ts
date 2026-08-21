import type { StoneArchetypeId } from "./StoneRecipe";

export const STONE_SNAP_EPSILON = 1e-3;
export const STONE_MESH_QUANTIZE = 5e-4;
export const STONE_DEGENERATE_NORMAL_LENGTH = 1e-12;
/**
 * Occlusion in the seam where the body meets the ground.
 *
 * A stone reads as resting on the meadow rather than in it when nothing darkens
 * at the join: the turf goes bright right up to a body that is bright too, and
 * the eye gets no contact to sit the mass on. The floor is deep enough for the
 * seam to be visible at the distances stones are actually seen from, and the
 * height keeps it a seam rather than a gradient up the flank.
 */
export const STONE_CONTACT_SHADE_FLOOR = 0.64;
export const STONE_CONTACT_SHADE_HEIGHT = 0.3;
export const STONE_MOSS_CLIMB = 0.42;
export const STONE_MOSS_PATCH_SIZE = 0.26;
export const STONE_INDENTATION_MINIMUM_AREA = 0.035;

/**
 * Facet softening.
 *
 * The body is a convex polyhedron, so its many profile facets are an
 * approximation of one weathered curve rather than real fractures. Averaging
 * normals across the shallow breaks lets that curve read as a curve, while the
 * dihedral limit keeps cuts, chips, and notch rims crisp. The softening itself
 * writes nothing but the normal attribute — silhouette and counts are untouched
 * by it; the centre-fan retessellation below is what adds triangles.
 *
 * The limit is per archetype because the assumption behind it is per archetype.
 * A boulder's profile rings really are one weathered curve sampled coarsely, so
 * a wide limit is telling the truth about the shape. A shard, block, or slab is
 * meant to read as fracture: its ring boundaries are the fractures, and
 * averaging across a 58° break shades away exactly the planarity that separates
 * those families from a boulder. Six archetypes with one softening rule is six
 * silhouettes with one surface.
 */
export const STONE_SOFT_NORMAL_ANGLE_LIMIT = 1.02;
export const STONE_SOFT_NORMAL_COS_LIMIT = Math.cos(
  STONE_SOFT_NORMAL_ANGLE_LIMIT,
);
export const STONE_SOFT_NORMAL_STRENGTH = 0.82;

/**
 * Edge accents begin exactly where softening stops.
 *
 * Wear brightening and crease occlusion both paint an edge, so they must only
 * fire on edges the dihedral limit refused to smooth. Derived from that limit
 * rather than set beside it: an independent angle would drift into the smoothed
 * range and draw a bright line or a dark seam across a surface that no longer
 * has a visible break there.
 *
 * This is why softening cannot be tuned per archetype on its own. Moving the
 * limit without moving these moves the accents into or out of the smoothed
 * range; the two travel together, which is what `StoneFacetSoftening` bundles.
 */
export const STONE_WEAR_ANGLE_START = STONE_SOFT_NORMAL_ANGLE_LIMIT;
export const STONE_WEAR_ANGLE_FULL = STONE_SOFT_NORMAL_ANGLE_LIMIT + 0.5;

/** Angle span over which an unsmoothed break reaches full wear brightening. */
const STONE_WEAR_ANGLE_SPAN = STONE_WEAR_ANGLE_FULL - STONE_WEAR_ANGLE_START;

/**
 * One archetype's complete facet treatment: where normals stop averaging, how
 * far they average below that, and where the edge accents that begin at the
 * same threshold reach full strength.
 */
export interface StoneFacetSoftening {
  readonly angleLimit: number;
  readonly cosLimit: number;
  readonly strength: number;
  readonly wearAngleStart: number;
  readonly wearAngleFull: number;
}

/**
 * Dihedral limit and averaging strength per archetype, hardest first.
 *
 * `boulder` keeps the values the single global rule used, so the family the
 * rule was originally tuned against is unchanged; every other family moves
 * toward its own material. The strength falls with the limit on purpose: on a
 * fractured body even the breaks that stay inside the limit should only be
 * taken off full flatness, not rounded.
 */
const STONE_FACET_SOFTENING_BY_ARCHETYPE: Readonly<
  Record<StoneArchetypeId, readonly [angleLimit: number, strength: number]>
> = {
  // Weathered curve sampled as facets. Widest limit, fullest averaging.
  boulder: [STONE_SOFT_NORMAL_ANGLE_LIMIT, STONE_SOFT_NORMAL_STRENGTH],
  // Tumbled and small: nearly as round, but on-screen at a size where a fully
  // smooth pebble loses the last of its silhouette read.
  pebble: [0.92, 0.8],
  // Bedded mass with a rounded crown: curve above, structure at the bedding.
  outcrop: [0.78, 0.7],
  // Bedding planes are the point of a slab; they must survive as planes.
  slab: [0.6, 0.58],
  // Jointed block. Near-orthogonal faces meeting at hard arrises.
  block: [0.52, 0.52],
  // Fresh fracture, no weathering history to soften it.
  shard: [0.42, 0.44],
};

const STONE_FACET_SOFTENING: Readonly<
  Record<StoneArchetypeId, StoneFacetSoftening>
> = Object.freeze(
  Object.fromEntries(
    Object.entries(STONE_FACET_SOFTENING_BY_ARCHETYPE).map(
      ([archetype, [angleLimit, strength]]) => [
        archetype,
        Object.freeze({
          angleLimit,
          cosLimit: Math.cos(angleLimit),
          strength,
          wearAngleStart: angleLimit,
          wearAngleFull: angleLimit + STONE_WEAR_ANGLE_SPAN,
        }),
      ],
    ),
  ) as Record<StoneArchetypeId, StoneFacetSoftening>,
);

/** The facet treatment for one archetype. Wear angles travel with the limit. */
export function resolveStoneFacetSoftening(
  archetype: StoneArchetypeId,
): StoneFacetSoftening {
  return STONE_FACET_SOFTENING[archetype];
}
/**
 * Corner count above which a face is triangulated around its own centre.
 *
 * A corner fan routes every triangle of an n-gon through one shared corner, so
 * once corners carry differing normals that corner's value smears outward as
 * visible spokes. A centre vertex spreads the interpolation evenly for one
 * extra vertex and two extra triangles per face. Quads and triangles keep the
 * cheaper fan: their single diagonal is too short to streak.
 */
export const STONE_CENTROID_FAN_MIN_CORNERS = 5;
/** Concave dihedrals darken; the same signal drives crease occlusion. */
export const STONE_CREASE_SHADE = 0.42;
/** Height fraction reached by bounce light thrown up from the surrounding turf. */
export const STONE_BOUNCE_HEIGHT = 0.34;
export const STONE_BOUNCE_STRENGTH = 0.52;

/**
 * Value ramp driven by how far a corner faces up.
 *
 * This replaces a per-face role table. Once facets are smoothed, a role table
 * paints an albedo step onto an edge that now shades continuously, and the seam
 * is visible precisely where the softening was supposed to hide one. The corner
 * normal already carries "how exposed is this surface", is continuous wherever
 * the smoothing is, and steps only where the geometry genuinely breaks.
 */
export const STONE_TONE_FLOOR = 0.42;
export const STONE_TONE_RANGE = 0.56;
/**
 * Fresh fracture exposes paler stone. Safe as a per-face step because cuts are
 * steep enough that the dihedral limit already denies them smoothing, so the
 * albedo edge lands on a normal edge.
 */
export const STONE_CUT_ACCENT = 0.09;
