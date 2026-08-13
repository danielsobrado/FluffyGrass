export const STONE_SNAP_EPSILON = 1e-3;
export const STONE_MESH_QUANTIZE = 5e-4;
export const STONE_DEGENERATE_NORMAL_LENGTH = 1e-12;
export const STONE_CONTACT_SHADE_FLOOR = 0.82;
export const STONE_CONTACT_SHADE_HEIGHT = 0.22;
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
 */
export const STONE_WEAR_ANGLE_START = STONE_SOFT_NORMAL_ANGLE_LIMIT;
export const STONE_WEAR_ANGLE_FULL = STONE_SOFT_NORMAL_ANGLE_LIMIT + 0.5;
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
