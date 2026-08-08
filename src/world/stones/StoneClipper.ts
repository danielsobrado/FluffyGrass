import type { StoneRecipe } from "./StoneRecipe";
import { hashStoneCell } from "./StoneRandom";

/**
 * Convex polyhedron construction from half-spaces.
 *
 * Every face is built directly on its own plane: a large quad laid out on the
 * plane is clipped by every *other* half-space, and whatever survives is that
 * plane's face. A convex body assembled this way is watertight by
 * construction — there is no incremental cap bookkeeping to get wrong, which
 * is exactly where the classic clip-and-cap formulation leaks (missing lids,
 * flipped slivers) once epsilons stack up.
 *
 * Broad deliberate planes are the whole point of this generator: they give the
 * stylized faceted silhouette that noise-displaced spheres never produce.
 * Everything stays in plain numbers; Three.js enters only at the adapter.
 */

export type StonePlaneRole =
  | "bottom"
  | "top"
  | "side"
  | "top-bevel"
  | "contact-bevel"
  | "edge-bevel"
  | "cut";

export interface StonePlane {
  readonly nx: number;
  readonly ny: number;
  readonly nz: number;
  readonly constant: number;
  readonly id: string;
  readonly role: StonePlaneRole;
}

export interface StoneVec3 {
  x: number;
  y: number;
  z: number;
}

export interface StonePolygon {
  readonly planeId: string;
  readonly role: StonePlaneRole;
  readonly points: StoneVec3[];
}

const PLANE_EPSILON = 1e-7;
/** Adjacent points closer than this collapse; normalized units (~stone ≈ 1). */
const POINT_MERGE_EPSILON = 2.5e-4;
const MINIMUM_FACE_AREA = 5e-6;
/** Local gap-healing passes; each merges at least one pair of corners. */
const MAX_HEAL_PASSES = 4;
/**
 * Radius for merging corners that provably border a hole. Wider than the
 * global weld because these corners are already known to be spurious.
 */
const HEAL_RADIUS = 1.2e-2;
/** Half-extent of the seed quad laid on each plane before clipping. */
const FACE_QUAD_EXTENT = 6;
/** Cuts must clear the contact footprint by this much normalized height. */
const CUT_GROUND_CLEARANCE = 0.02;
const CUT_MINIMUM_EFFECTIVE_DEPTH = 0.015;
/**
 * Chips are an order of magnitude shallower than cuts, so they need their own
 * floor — the cut minimum would reject every one of them.
 */
const CHIP_MINIMUM_EFFECTIVE_DEPTH = 0.004;
/** Broad cuts below this share of the exposed surface are visual noise. */
const MINIMUM_MAJOR_CUT_AREA_SHARE = 0.055;
/** Normalized chamfer depth: deliberately tiny, but real geometry. */
const EDGE_CHAMFER_DEPTH = 0.01;
const EDGE_CHAMFER_MIN_LENGTH = 0.14;
const TOP_BAND_HEIGHT_VARIATION = 0.38;
const CONTACT_BAND_HEIGHT_VARIATION = 0.45;

/**
 * Smooth deterministic variation around a cyclic side ring. Independent
 * heights would make saw teeth; neighboring samples keep the edge geological
 * while preventing one level manufactured band from circling the stone.
 */
function sideBandVariation(
  seed: number,
  side: number,
  sideCount: number,
  salt: number,
): number {
  const sample = (index: number): number =>
    (hashStoneCell(seed, (index + sideCount) % sideCount, salt) /
      4294967296 -
      0.5) *
    2;
  return (
    sample(side - 1) * 0.2 +
    sample(side) * 0.6 +
    sample(side + 1) * 0.2
  );
}

function normalizePlane(
  nx: number,
  ny: number,
  nz: number,
  constant: number,
  id: string,
  role: StonePlaneRole,
): StonePlane {
  const length = Math.hypot(nx, ny, nz);
  return {
    nx: nx / length,
    ny: ny / length,
    nz: nz / length,
    constant: constant / length,
    id,
    role,
  };
}

/** Body planes for a recipe; cuts are resolved separately against the body. */
export function buildStonePlanes(recipe: StoneRecipe): StonePlane[] {
  const planes: StonePlane[] = [];
  planes.push({
    nx: 0,
    ny: -1,
    nz: 0,
    constant: 0,
    id: "bottom",
    role: "bottom",
  });
  planes.push(
    normalizePlane(recipe.topTiltX, 1, recipe.topTiltZ, 1, "top", "top"),
  );

  const sideCount = recipe.sideAngles.length;
  for (let side = 0; side < sideCount; side += 1) {
    const angle = recipe.sideAngles[side];
    const radius = recipe.sideRadii[side];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    planes.push(
      normalizePlane(cos, recipe.taper, sin, radius, `side:${side}`, "side"),
    );
    const contactHeight =
      recipe.contactBevelHeight *
      (1 +
        sideBandVariation(recipe.seed, side, sideCount, 0x436f6e74) *
          CONTACT_BAND_HEIGHT_VARIATION);
    const contactSlope = recipe.contactInset / contactHeight;
    planes.push(
      normalizePlane(
        cos,
        -contactSlope,
        sin,
        radius - recipe.contactInset,
        `contact-bevel:${side}`,
        "contact-bevel",
      ),
    );
    const topBevelHeight =
      recipe.topBevelHeight *
      (1 +
        sideBandVariation(recipe.seed, side, sideCount, 0x546f7042) *
          TOP_BAND_HEIGHT_VARIATION);
    const bevelStart = 1 - topBevelHeight;
    const radiusAtStart = radius - recipe.taper * bevelStart;
    const radiusAtTop = Math.max(
      0.08,
      (radius - recipe.taper) * recipe.topScale,
    );
    const bevelSlope = (radiusAtStart - radiusAtTop) / topBevelHeight;
    planes.push(
      normalizePlane(
        cos,
        bevelSlope,
        sin,
        radiusAtStart + bevelSlope * bevelStart,
        `top-bevel:${side}`,
        "top-bevel",
      ),
    );
  }
  return planes;
}

function planeDistance(plane: StonePlane, point: StoneVec3): number {
  return (
    plane.nx * point.x +
    plane.ny * point.y +
    plane.nz * point.z -
    plane.constant
  );
}

function nearlySame(a: StoneVec3, b: StoneVec3): boolean {
  return (
    Math.abs(a.x - b.x) <= POINT_MERGE_EPSILON &&
    Math.abs(a.y - b.y) <= POINT_MERGE_EPSILON &&
    Math.abs(a.z - b.z) <= POINT_MERGE_EPSILON
  );
}

function cleanPolygonPoints(points: StoneVec3[]): StoneVec3[] {
  const cleaned: StoneVec3[] = [];
  for (const point of points) {
    if (cleaned.length === 0 || !nearlySame(cleaned[cleaned.length - 1], point)) {
      cleaned.push(point);
    }
  }
  while (
    cleaned.length > 1 &&
    nearlySame(cleaned[0], cleaned[cleaned.length - 1])
  ) {
    cleaned.pop();
  }
  return cleaned;
}

function polygonArea(points: StoneVec3[]): number {
  let newellX = 0;
  let newellY = 0;
  let newellZ = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    newellX += (current.y - next.y) * (current.z + next.z);
    newellY += (current.z - next.z) * (current.x + next.x);
    newellZ += (current.x - next.x) * (current.y + next.y);
  }
  return Math.hypot(newellX, newellY, newellZ) * 0.5;
}

/** Sutherland–Hodgman clip of a convex polygon by one half-space. */
function clipPolygonByHalfSpace(
  points: StoneVec3[],
  plane: StonePlane,
): StoneVec3[] {
  const clipped: StoneVec3[] = [];
  const count = points.length;
  for (let index = 0; index < count; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % count];
    const currentDistance = planeDistance(plane, current);
    const nextDistance = planeDistance(plane, next);
    const currentInside = currentDistance <= PLANE_EPSILON;
    const nextInside = nextDistance <= PLANE_EPSILON;

    if (currentInside) {
      clipped.push(current);
    }
    if (currentInside !== nextInside) {
      const denominator = currentDistance - nextDistance;
      if (Math.abs(denominator) > PLANE_EPSILON) {
        const t = Math.min(1, Math.max(0, currentDistance / denominator));
        clipped.push({
          x: current.x + (next.x - current.x) * t,
          y: current.y + (next.y - current.y) * t,
          z: current.z + (next.z - current.z) * t,
        });
      }
    }
  }
  return clipped;
}

/**
 * A large quad on the plane, wound counter-clockwise when viewed from outside
 * (along the outward normal).
 */
function seedQuadOnPlane(plane: StonePlane): StoneVec3[] {
  const absX = Math.abs(plane.nx);
  const absY = Math.abs(plane.ny);
  const absZ = Math.abs(plane.nz);
  let referenceX = 0;
  let referenceY = 0;
  let referenceZ = 0;
  if (absX <= absY && absX <= absZ) {
    referenceX = 1;
  } else if (absY <= absZ) {
    referenceY = 1;
  } else {
    referenceZ = 1;
  }
  let tangentX = referenceY * plane.nz - referenceZ * plane.ny;
  let tangentY = referenceZ * plane.nx - referenceX * plane.nz;
  let tangentZ = referenceX * plane.ny - referenceY * plane.nx;
  const tangentLength = Math.hypot(tangentX, tangentY, tangentZ);
  tangentX /= tangentLength;
  tangentY /= tangentLength;
  tangentZ /= tangentLength;
  const bitangentX = plane.ny * tangentZ - plane.nz * tangentY;
  const bitangentY = plane.nz * tangentX - plane.nx * tangentZ;
  const bitangentZ = plane.nx * tangentY - plane.ny * tangentX;

  const centerX = plane.nx * plane.constant;
  const centerY = plane.ny * plane.constant;
  const centerZ = plane.nz * plane.constant;
  const extent = FACE_QUAD_EXTENT;

  const corner = (tangentSign: number, bitangentSign: number): StoneVec3 => ({
    x:
      centerX +
      (tangentX * tangentSign + bitangentX * bitangentSign) * extent,
    y:
      centerY +
      (tangentY * tangentSign + bitangentY * bitangentSign) * extent,
    z:
      centerZ +
      (tangentZ * tangentSign + bitangentZ * bitangentSign) * extent,
  });

  // With bitangent = normal × tangent, (tangent, bitangent, normal) is
  // right-handed, so this order is counter-clockwise seen from outside.
  const quad = [corner(1, 1), corner(-1, 1), corner(-1, -1), corner(1, -1)];

  // Newell insurance: reverse if the winding disagrees with the outward
  // normal. Cheap, and it makes the construction immune to basis mistakes.
  let newellX = 0;
  let newellY = 0;
  let newellZ = 0;
  for (let index = 0; index < quad.length; index += 1) {
    const current = quad[index];
    const next = quad[(index + 1) % quad.length];
    newellX += (current.y - next.y) * (current.z + next.z);
    newellY += (current.z - next.z) * (current.x + next.x);
    newellZ += (current.x - next.x) * (current.y + next.y);
  }
  if (newellX * plane.nx + newellY * plane.ny + newellZ * plane.nz < 0) {
    quad.reverse();
  }
  return quad;
}

/**
 * Build every face of the convex body bounded by `planes`. Faces that get
 * fully clipped away (a plane made redundant by tighter neighbours) simply do
 * not appear.
 */
export function facesFromPlanes(planes: StonePlane[]): StonePolygon[] {
  // Leaks here come from *near-concurrent planes*, not from bad bookkeeping.
  // Where three planes almost meet at a point, their pairwise intersections
  // land a fraction of a millimetre apart and leave a tiny triangular gap
  // between three otherwise correct faces. Welding those corners onto one
  // representative closes the gap exactly.
  //
  // Removing the "offending" plane instead is actively wrong, and was tried:
  // deleting a face leaves its neighbours holding edges that now border
  // nothing, which converts one small gap into a larger one. Diagnosed on
  // shard:142, where the three gap corners sat 1.8e-3 apart — just outside an
  // earlier 1.5e-3 weld radius.
  //
  // A single global weld radius cannot close every case either: raising it far
  // enough for the worst near-concurrency starts collapsing legitimate short
  // edges elsewhere and creates new gaps. So the global pass stays tight and
  // any residue is healed locally, where a wider radius is safe because those
  // corners provably border a hole.
  //
  // Order matters. Dropping sliver faces has to happen *before* healing, for
  // the same reason dropping planes was wrong: a discarded face leaves its
  // neighbours holding unmatched edges. Healing afterwards closes whatever the
  // drop opened, so this function's postcondition is a closed surface.
  const welded = weldFaces(buildFacesOnce(planes));
  const substantial = welded.filter(
    (face) => polygonArea(face.points) >= MINIMUM_FACE_AREA,
  );
  return healBoundaryGaps(substantial);
}

/**
 * Close residual holes by merging only the corners that border them.
 *
 * Any edge belonging to one face instead of two bounds a hole. Its endpoints
 * are therefore corners the global weld should have merged and did not, so
 * they can be merged against each other at a wider radius without risking
 * geometry that is already correct.
 */
function healBoundaryGaps(faces: StonePolygon[]): StonePolygon[] {
  let current = faces;
  for (let pass = 0; pass < MAX_HEAL_PASSES; pass += 1) {
    const counts = new Map<string, number>();
    for (const face of current) {
      const count = face.points.length;
      for (let index = 0; index < count; index += 1) {
        const key = edgeKey(
          face.points[index],
          face.points[(index + 1) % count],
        );
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    const suspects = new Set<StoneVec3>();
    for (const face of current) {
      const count = face.points.length;
      for (let index = 0; index < count; index += 1) {
        const a = face.points[index];
        const b = face.points[(index + 1) % count];
        if (counts.get(edgeKey(a, b)) !== 2) {
          suspects.add(a);
          suspects.add(b);
        }
      }
    }
    if (suspects.size === 0) {
      return current;
    }

    const representatives = new Map<StoneVec3, StoneVec3>();
    const chosen: StoneVec3[] = [];
    for (const suspect of suspects) {
      let match: StoneVec3 | undefined;
      for (const candidate of chosen) {
        const dx = candidate.x - suspect.x;
        const dy = candidate.y - suspect.y;
        const dz = candidate.z - suspect.z;
        if (dx * dx + dy * dy + dz * dz <= HEAL_RADIUS * HEAL_RADIUS) {
          match = candidate;
          break;
        }
      }
      if (match) {
        representatives.set(suspect, match);
      } else {
        chosen.push(suspect);
      }
    }
    if (representatives.size === 0) {
      return current;
    }

    const healed: StonePolygon[] = [];
    for (const face of current) {
      const points: StoneVec3[] = [];
      for (const point of face.points) {
        const replacement = representatives.get(point) ?? point;
        if (points.length === 0 || points[points.length - 1] !== replacement) {
          points.push(replacement);
        }
      }
      while (points.length > 1 && points[0] === points[points.length - 1]) {
        points.pop();
      }
      if (points.length >= 3) {
        healed.push({ planeId: face.planeId, role: face.role, points });
      }
    }
    current = healed;
  }
  return current;
}

/** Quantization for edge identity; matches the build gate's own check. */
const EDGE_QUANTIZE = 5e-4;
/**
 * Global corner-weld radius. Kept tight: wide enough for ordinary float drift
 * between independently computed faces, narrow enough not to collapse real
 * short edges. Residual near-concurrency is handled by {@link healBoundaryGaps}.
 */
const WELD_EPSILON = 2e-3;

/**
 * Build one face per plane by clipping a large quad on that plane against
 * every other half-space. A plane made redundant by tighter neighbours simply
 * yields nothing.
 */
function buildFacesOnce(planes: StonePlane[]): StonePolygon[] {
  const faces: StonePolygon[] = [];
  for (const plane of planes) {
    let points = seedQuadOnPlane(plane);
    for (const other of planes) {
      if (other === plane) {
        continue;
      }
      points = clipPolygonByHalfSpace(points, other);
      if (points.length < 3) {
        break;
      }
    }
    const cleaned = cleanPolygonPoints(points);
    if (cleaned.length >= 3) {
      faces.push({ planeId: plane.id, role: plane.role, points: cleaned });
    }
  }
  return faces;
}

function edgeKey(a: StoneVec3, b: StoneVec3): string {
  const ka = `${Math.round(a.x / EDGE_QUANTIZE)}:${Math.round(a.y / EDGE_QUANTIZE)}:${Math.round(a.z / EDGE_QUANTIZE)}`;
  const kb = `${Math.round(b.x / EDGE_QUANTIZE)}:${Math.round(b.y / EDGE_QUANTIZE)}:${Math.round(b.z / EDGE_QUANTIZE)}`;
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
}

function weldFaces(faces: StonePolygon[]): StonePolygon[] {
  const buckets = new Map<string, StoneVec3[]>();
  const representative = (point: StoneVec3): StoneVec3 => {
    const cellX = Math.round(point.x / WELD_EPSILON);
    const cellY = Math.round(point.y / WELD_EPSILON);
    const cellZ = Math.round(point.z / WELD_EPSILON);
    for (let dz = -1; dz <= 1; dz += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const key = `${cellX + dx}:${cellY + dy}:${cellZ + dz}`;
          const bucket = buckets.get(key);
          if (!bucket) {
            continue;
          }
          for (const existing of bucket) {
            const offsetX = existing.x - point.x;
            const offsetY = existing.y - point.y;
            const offsetZ = existing.z - point.z;
            if (
              offsetX * offsetX + offsetY * offsetY + offsetZ * offsetZ <=
              WELD_EPSILON * WELD_EPSILON
            ) {
              return existing;
            }
          }
        }
      }
    }
    const ownKey = `${cellX}:${cellY}:${cellZ}`;
    const ownBucket = buckets.get(ownKey);
    if (ownBucket) {
      ownBucket.push(point);
    } else {
      buckets.set(ownKey, [point]);
    }
    return point;
  };

  const welded: StonePolygon[] = [];
  for (const face of faces) {
    const points: StoneVec3[] = [];
    for (const point of face.points) {
      const shared = representative(point);
      if (points.length === 0 || points[points.length - 1] !== shared) {
        points.push(shared);
      }
    }
    while (points.length > 1 && points[0] === points[points.length - 1]) {
      points.pop();
    }
    if (points.length >= 3 && polygonArea(points) >= MINIMUM_FACE_AREA) {
      welded.push({ planeId: face.planeId, role: face.role, points });
    }
  }
  return welded;
}

/**
 * Resolve the recipe's broad cuts into planes. Each cut measures the current
 * body so its depth is a fraction of the real span, and it is pushed off the
 * contact footprint so a cut can never undermine the base the stone stands on.
 */
export function resolveCutPlanes(
  bodyPlanes: StonePlane[],
  recipe: StoneRecipe,
  includeChips = false,
): StonePlane[] {
  const planes = [...bodyPlanes];
  const accepted: StonePlane[] = [];
  // Chips are ordinary cuts, only far shallower, and always resolved after the
  // broad ones so their depth is measured against a body that already has its
  // major planes. Omitting them is the entire difference between the near and
  // far form of a stone.
  const operations = includeChips
    ? [...recipe.cuts, ...recipe.chips]
    : recipe.cuts;
  const firstChip = recipe.cuts.length;
  for (let index = 0; index < operations.length; index += 1) {
    const cut = operations[index];
    const isChip = index >= firstChip;
    const faces = facesFromPlanes(planes);
    let minimumProjection = Number.POSITIVE_INFINITY;
    let maximumProjection = Number.NEGATIVE_INFINITY;
    let maximumGroundProjection = Number.NEGATIVE_INFINITY;
    for (const face of faces) {
      for (const point of face.points) {
        const projection =
          cut.normalX * point.x + cut.normalY * point.y + cut.normalZ * point.z;
        minimumProjection = Math.min(minimumProjection, projection);
        maximumProjection = Math.max(maximumProjection, projection);
        if (Math.abs(point.y) <= POINT_MERGE_EPSILON * 4) {
          maximumGroundProjection = Math.max(
            maximumGroundProjection,
            projection,
          );
        }
      }
    }
    const span = maximumProjection - minimumProjection;
    if (span <= PLANE_EPSILON) {
      continue;
    }
    const candidate = maximumProjection - cut.depthFraction * span;
    const guarded =
      maximumGroundProjection > Number.NEGATIVE_INFINITY
        ? Math.max(candidate, maximumGroundProjection + CUT_GROUND_CLEARANCE)
        : candidate;
    const minimumDepth = isChip
      ? CHIP_MINIMUM_EFFECTIVE_DEPTH
      : CUT_MINIMUM_EFFECTIVE_DEPTH;
    if ((maximumProjection - guarded) / span < minimumDepth) {
      continue;
    }
    const plane: StonePlane = {
      nx: cut.normalX,
      ny: cut.normalY,
      nz: cut.normalZ,
      constant: guarded,
      id: isChip ? `chip:${index - firstChip}` : `cut:${index}`,
      role: "cut",
    };
    // Shard cuts are silhouette-defining wedge planes; rejecting a small one
    // can restore the tall parent mass and make that family broader, not
    // cleaner. The area hierarchy gate targets the grounded families whose
    // cuts are surface articulation.
    if (!isChip && recipe.archetype !== "shard") {
      const candidateFaces = facesFromPlanes([...planes, plane]);
      const exposed = candidateFaces.filter(
        (face) => face.role !== "bottom" && face.role !== "contact-bevel",
      );
      const totalArea = exposed.reduce(
        (sum, face) => sum + polygonArea(face.points),
        0,
      );
      const cutArea = exposed
        .filter((face) => face.planeId === plane.id)
        .reduce((sum, face) => sum + polygonArea(face.points), 0);
      if (
        !(totalArea > 0) ||
        cutArea / totalArea < MINIMUM_MAJOR_CUT_AREA_SHARE
      ) {
        continue;
      }
    }
    planes.push(plane);
    accepted.push(plane);
  }
  return accepted;
}

function addEdgeChamferPlanes(planes: StonePlane[]): StonePlane[] {
  const faces = facesFromPlanes(planes);
  const planeById = new Map(planes.map((plane) => [plane.id, plane]));
  const edges = new Map<
    string,
    { a: StoneVec3; b: StoneVec3; faces: StonePolygon[] }
  >();
  for (const face of faces) {
    for (let index = 0; index < face.points.length; index += 1) {
      const a = face.points[index];
      const b = face.points[(index + 1) % face.points.length];
      const key = edgeKey(a, b);
      const edge = edges.get(key);
      if (edge) edge.faces.push(face);
      else edges.set(key, { a, b, faces: [face] });
    }
  }

  const chamfers: StonePlane[] = [];
  for (const edge of edges.values()) {
    if (edge.faces.length !== 2) continue;
    const [faceA, faceB] = edge.faces;
    if (
      faceA.role === "bottom" ||
      faceB.role === "bottom" ||
      faceA.role === "contact-bevel" ||
      faceB.role === "contact-bevel"
    ) {
      continue;
    }
    if (
      Math.hypot(
        edge.a.x - edge.b.x,
        edge.a.y - edge.b.y,
        edge.a.z - edge.b.z,
      ) < EDGE_CHAMFER_MIN_LENGTH
    ) {
      continue;
    }
    const a = planeById.get(faceA.planeId);
    const b = planeById.get(faceB.planeId);
    if (!a || !b) continue;
    const dot = a.nx * b.nx + a.ny * b.ny + a.nz * b.nz;
    if (dot > 0.88) continue;
    const nx = a.nx + b.nx;
    const ny = a.ny + b.ny;
    const nz = a.nz + b.nz;
    const length = Math.hypot(nx, ny, nz);
    if (!(length > 1e-6)) continue;
    const unitX = nx / length;
    const unitY = ny / length;
    const unitZ = nz / length;
    const edgeConstant = unitX * edge.a.x + unitY * edge.a.y + unitZ * edge.a.z;
    chamfers.push({
      nx: unitX,
      ny: unitY,
      nz: unitZ,
      constant: edgeConstant - EDGE_CHAMFER_DEPTH,
      id: `edge-bevel:${chamfers.length}`,
      role: "edge-bevel",
    });
  }
  return chamfers;
}

/**
 * Full normalized-space body for a recipe.
 *
 * `includeChips` selects the close-range form. Both forms come from the same
 * recipe and differ only by the chip planes, so a stone never changes identity
 * between them — it only loses facets a few centimetres across, which are far
 * below a pixel at the distance the swap happens.
 */
export function buildStonePolyhedron(
  recipe: StoneRecipe,
  includeChips = false,
): StonePolygon[] {
  const bodyPlanes = buildStonePlanes(recipe);
  const cutPlanes = resolveCutPlanes(bodyPlanes, recipe, includeChips);
  const structuralPlanes = [...bodyPlanes, ...cutPlanes];
  // Shards already carry a narrow crown/contact bevel and depend on long cuts
  // for their wedge silhouette; extra all-body chamfer planes can intersect a
  // distant side of such a thin form. Keep their deliberately sharp fracture.
  const chamfers =
    recipe.archetype === "shard"
      ? []
      : addEdgeChamferPlanes(structuralPlanes);
  return facesFromPlanes([...structuralPlanes, ...chamfers]);
}
