import type { StoneRecipe } from "./StoneRecipe";

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
/** Half-extent of the seed quad laid on each plane before clipping. */
const FACE_QUAD_EXTENT = 6;
/** Cuts must clear the contact footprint by this much normalized height. */
const CUT_GROUND_CLEARANCE = 0.02;
const CUT_MINIMUM_EFFECTIVE_DEPTH = 0.015;

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
    const contactSlope = recipe.contactInset / recipe.contactBevelHeight;
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
    const bevelStart = 1 - recipe.topBevelHeight;
    const radiusAtStart = radius - recipe.taper * bevelStart;
    const radiusAtTop = Math.max(
      0.08,
      (radius - recipe.taper) * recipe.topScale,
    );
    const bevelSlope = (radiusAtStart - radiusAtTop) / recipe.topBevelHeight;
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
    if (cleaned.length >= 3 && polygonArea(cleaned) >= MINIMUM_FACE_AREA) {
      faces.push({ planeId: plane.id, role: plane.role, points: cleaned });
    }
  }
  return weldFaces(faces);
}

/** Weld radius across faces; must stay far below every real feature size. */
const WELD_EPSILON = 1.5e-3;

/**
 * Snap coincident corners of *different* faces onto one shared point.
 *
 * Every face computes its boundary independently, so one geometric corner —
 * the meeting point of three or more planes — arrives once per face with
 * float drift that grows on near-parallel plane pairs. Welding to a shared
 * representative makes the polyhedron exactly closed: without it, sliver
 * chains clean up differently on each side of an edge and the seam leaks.
 */
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
): StonePlane[] {
  const planes = [...bodyPlanes];
  const accepted: StonePlane[] = [];
  for (let index = 0; index < recipe.cuts.length; index += 1) {
    const cut = recipe.cuts[index];
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
    if ((maximumProjection - guarded) / span < CUT_MINIMUM_EFFECTIVE_DEPTH) {
      continue;
    }
    const plane: StonePlane = {
      nx: cut.normalX,
      ny: cut.normalY,
      nz: cut.normalZ,
      constant: guarded,
      id: `cut:${index}`,
      role: "cut",
    };
    planes.push(plane);
    accepted.push(plane);
  }
  return accepted;
}

/** Full normalized-space body for a recipe. */
export function buildStonePolyhedron(recipe: StoneRecipe): StonePolygon[] {
  const bodyPlanes = buildStonePlanes(recipe);
  const cutPlanes = resolveCutPlanes(bodyPlanes, recipe);
  return facesFromPlanes([...bodyPlanes, ...cutPlanes]);
}
