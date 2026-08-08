import { hashStoneCell, hashStoneLabel } from "./StoneRandom";
import type { StoneRecipe } from "./StoneRecipe";
import type {
  StonePolygon,
  StonePlaneRole,
  StoneVec3,
} from "./StoneClipper";
import { buildStonePolyhedron } from "./StoneClipper";

/**
 * Builds render-ready mesh data from a stone recipe.
 *
 * The mesh is flat-shaded and carries *shading data* instead of final colours:
 * per-corner `tone` (dark→light position on a palette ramp) and `wear` (how
 * strongly the painted edge highlight applies). Palettes are resolved per
 * placed instance when chunks are merged, so one geometry serves every biome
 * tint without new draw calls, and recolouring never regenerates topology.
 *
 * Larger faces are built as rim → inset ring → centroid. Every rim vertex of
 * a convex polyhedron lies on silhouette edges, so painting wear at the rim
 * needs interior vertices to interpolate against; the inset ring pins the
 * highlight into a narrow band along the facet border — the hand-painted edge
 * line of the reference boards — instead of a glow smeared to the centre.
 */

export interface StoneMeshData {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  /** Palette-ramp position per vertex, in [0, 1]. */
  readonly tones: Float32Array;
  /** Edge-highlight strength per vertex, in [0, 1]. */
  readonly wears: Float32Array;
  readonly indices: Uint16Array;
  readonly metrics: StoneMeshMetrics;
}

export interface StoneMeshMetrics {
  readonly vertexCount: number;
  readonly triangleCount: number;
  /** Height of the stone in metres before placement scale. */
  readonly height: number;
  /** Furthest XZ distance of any contact vertex from the origin. */
  readonly contactRadius: number;
  /** Furthest XZ distance of any vertex from the origin. */
  readonly footprintRadius: number;
  /** Fraction of height to sink into terrain, from the recipe. */
  readonly embed: number;
  readonly fingerprint: number;
}

const SNAP_EPSILON = 1e-3;
/**
 * Shared-vertex quantization. Faces are built independently per plane, so one
 * geometric corner arrives once per adjacent face with float differences up to
 * the clipper's merge epsilon; half a millimetre folds those together without
 * ever fusing genuinely distinct stone corners.
 */
const QUANTIZE = 5e-4;
/**
 * Newell-vector length below which a face has no usable normal. This is a
 * NaN guard, not a quality filter — face culling belongs to the clipper, which
 * heals the holes it creates.
 */
const DEGENERATE_NORMAL_LENGTH = 1e-12;
/** Dihedral angles below this stay unlit; above the upper bound fully lit. */
const WEAR_ANGLE_START = 0.32;
const WEAR_ANGLE_FULL = 0.85;

const ROLE_TONE: Record<StonePlaneRole, number> = {
  top: 0.95,
  "top-bevel": 0.78,
  side: 0.46,
  cut: 0.6,
  "contact-bevel": 0.26,
  bottom: 0.06,
};

interface WorkingFace {
  role: StonePlaneRole;
  planeId: string;
  points: { x: number; y: number; z: number }[];
  shared: number[];
  normalX: number;
  normalY: number;
  normalZ: number;
  area: number;
}

function smoothstep(value: number, minimum: number, maximum: number): number {
  if (value <= minimum) {
    return 0;
  }
  if (value >= maximum) {
    return 1;
  }
  const amount = (value - minimum) / (maximum - minimum);
  return amount * amount * (3 - 2 * amount);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function generateStoneMesh(recipe: StoneRecipe): StoneMeshData {
  const polygons = buildStonePolyhedron(recipe);

  // The clipper welds shared corners, so one geometric corner is the *same*
  // object in every face that touches it. Any in-place edit therefore has to
  // visit unique objects, not polygon corners — transforming per corner
  // applies the scale once per adjacent face, which silently cubes it on a
  // three-face corner and flattens the whole population.
  const uniquePoints = new Set<StoneVec3>();
  for (const polygon of polygons) {
    for (const point of polygon.points) {
      uniquePoints.add(point);
    }
  }

  // Final metre-space transform: scale plus lean shear. Lean multiplies by y,
  // so the contact plane is preserved exactly.
  for (const point of uniquePoints) {
    const shearedX = point.x + recipe.leanX * point.y;
    const shearedZ = point.z + recipe.leanZ * point.y;
    point.x = recipe.width * shearedX;
    point.y = recipe.height * point.y;
    point.z = recipe.depth * shearedZ;
    if (Math.abs(point.y) <= SNAP_EPSILON) {
      point.y = 0;
    }
  }

  // Recentre on the contact centroid so placement rotation pivots where the
  // stone actually stands.
  let contactX = 0;
  let contactZ = 0;
  let contactCount = 0;
  for (const polygon of polygons) {
    if (polygon.role !== "bottom") {
      continue;
    }
    for (const point of polygon.points) {
      contactX += point.x;
      contactZ += point.z;
      contactCount += 1;
    }
  }
  if (contactCount > 0) {
    contactX /= contactCount;
    contactZ /= contactCount;
    for (const point of uniquePoints) {
      point.x -= contactX;
      point.z -= contactZ;
    }
  }

  const faces = buildWorkingFaces(polygons);
  const edgeSharpness = buildEdgeSharpness(faces);

  let maxY = 0;
  for (const face of faces) {
    for (const point of face.points) {
      maxY = Math.max(maxY, point.y);
    }
  }
  const heightMetres = Math.max(maxY, 1e-3);

  // Count output size: banded faces emit rim + inset ring + centroid.
  let vertexCount = 0;
  let triangleCount = 0;
  for (const face of faces) {
    const corners = face.points.length;
    if (faceBandLayout(face) === "plain") {
      vertexCount += corners;
      triangleCount += corners - 2;
    } else {
      vertexCount += corners * 2 + 1;
      triangleCount += corners * 3;
    }
  }

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const tones = new Float32Array(vertexCount);
  const wears = new Float32Array(vertexCount);
  const indices = new Uint16Array(triangleCount * 3);

  let vertexCursor = 0;
  let indexCursor = 0;
  let contactRadius = 0;
  let footprintRadius = 0;

  for (const face of faces) {
    const corners = face.points.length;
    const faceTone = resolveFaceTone(face, recipe);
    const baseVertex = vertexCursor;
    const layout = faceBandLayout(face);

    let centroidX = 0;
    let centroidY = 0;
    let centroidZ = 0;
    for (const point of face.points) {
      centroidX += point.x;
      centroidY += point.y;
      centroidZ += point.z;
    }
    centroidX /= corners;
    centroidY /= corners;
    centroidZ /= corners;

    const emitVertex = (
      x: number,
      y: number,
      z: number,
      tone: number,
      wear: number,
    ): number => {
      const offset = vertexCursor * 3;
      positions[offset] = x;
      positions[offset + 1] = y;
      positions[offset + 2] = z;
      normals[offset] = face.normalX;
      normals[offset + 1] = face.normalY;
      normals[offset + 2] = face.normalZ;
      tones[vertexCursor] = tone;
      wears[vertexCursor] = wear;
      const emitted = vertexCursor;
      vertexCursor += 1;
      return emitted;
    };

    const cornerTone = (y: number): number => {
      const heightShade = 0.68 + 0.32 * smoothstep(y, 0, heightMetres * 0.55);
      return clamp01(faceTone * heightShade);
    };

    for (let corner = 0; corner < corners; corner += 1) {
      const point = face.points[corner];
      emitVertex(
        point.x,
        point.y,
        point.z,
        cornerTone(point.y),
        resolveCornerWear(face, corner, edgeSharpness, recipe),
      );
      const radial = Math.hypot(point.x, point.z);
      footprintRadius = Math.max(footprintRadius, radial);
      if (point.y === 0) {
        contactRadius = Math.max(contactRadius, radial);
      }
    }

    if (layout === "plain") {
      for (let corner = 1; corner < corners - 1; corner += 1) {
        indices[indexCursor] = baseVertex;
        indices[indexCursor + 1] = baseVertex + corner;
        indices[indexCursor + 2] = baseVertex + corner + 1;
        indexCursor += 3;
      }
      continue;
    }

    // Inset ring: the highlight band ends here, so its width follows the
    // face size but stays in painted-line territory on hero faces.
    const bandWidth = Math.min(0.16, 0.04 + Math.sqrt(face.area) * 0.16);
    for (let corner = 0; corner < corners; corner += 1) {
      const point = face.points[corner];
      const towardX = centroidX - point.x;
      const towardY = centroidY - point.y;
      const towardZ = centroidZ - point.z;
      const distance = Math.hypot(towardX, towardY, towardZ);
      const step = distance > 1e-6 ? Math.min(0.45, bandWidth / distance) : 0;
      emitVertex(
        point.x + towardX * step,
        point.y + towardY * step,
        point.z + towardZ * step,
        cornerTone(point.y + towardY * step),
        0,
      );
    }
    const centroidIndex = emitVertex(
      centroidX,
      centroidY,
      centroidZ,
      cornerTone(centroidY),
      0,
    );

    for (let corner = 0; corner < corners; corner += 1) {
      const next = (corner + 1) % corners;
      const rimA = baseVertex + corner;
      const rimB = baseVertex + next;
      const insetA = baseVertex + corners + corner;
      const insetB = baseVertex + corners + next;
      indices[indexCursor] = rimA;
      indices[indexCursor + 1] = rimB;
      indices[indexCursor + 2] = insetB;
      indices[indexCursor + 3] = rimA;
      indices[indexCursor + 4] = insetB;
      indices[indexCursor + 5] = insetA;
      indices[indexCursor + 6] = insetA;
      indices[indexCursor + 7] = insetB;
      indices[indexCursor + 8] = centroidIndex;
      indexCursor += 9;
    }
  }

  const metrics: StoneMeshMetrics = {
    vertexCount,
    triangleCount,
    height: heightMetres,
    contactRadius,
    footprintRadius,
    embed: recipe.embed,
    fingerprint: fingerprintMesh(positions, tones),
  };

  return { positions, normals, tones, wears, indices, metrics };
}

/**
 * Whether a face is big enough to carry the inset highlight band. Undersides
 * never band — nothing down there is ever lit.
 */
function faceBandLayout(face: WorkingFace): "plain" | "banded" {
  if (face.role === "bottom" || face.points.length < 3) {
    return "plain";
  }
  return face.area >= 0.02 ? "banded" : "plain";
}

function buildWorkingFaces(polygons: StonePolygon[]): WorkingFace[] {
  const sharedIndex = new Map<string, number>();
  let nextShared = 0;
  const faces: WorkingFace[] = [];

  for (const polygon of polygons) {
    if (polygon.points.length < 3) {
      continue;
    }
    // Newell normal and area in final metre space.
    let newellX = 0;
    let newellY = 0;
    let newellZ = 0;
    for (let index = 0; index < polygon.points.length; index += 1) {
      const current = polygon.points[index];
      const next = polygon.points[(index + 1) % polygon.points.length];
      newellX += (current.y - next.y) * (current.z + next.z);
      newellY += (current.z - next.z) * (current.x + next.x);
      newellZ += (current.x - next.x) * (current.y + next.y);
    }
    const length = Math.hypot(newellX, newellY, newellZ);
    const area = length * 0.5;
    // Only reject what cannot produce a normal at all. Culling by area here
    // would silently hole the *rendered* mesh: the clipper guarantees a closed
    // surface and has already dropped its own slivers, so any face arriving
    // with real area is load-bearing, and dropping it leaves its neighbours
    // with edges that border nothing.
    if (!(length > DEGENERATE_NORMAL_LENGTH)) {
      continue;
    }

    const shared: number[] = [];
    for (const point of polygon.points) {
      const key = `${Math.round(point.x / QUANTIZE)}:${Math.round(
        point.y / QUANTIZE,
      )}:${Math.round(point.z / QUANTIZE)}`;
      let index = sharedIndex.get(key);
      if (index === undefined) {
        index = nextShared;
        sharedIndex.set(key, index);
        nextShared += 1;
      }
      shared.push(index);
    }

    faces.push({
      role: polygon.role,
      planeId: polygon.planeId,
      points: polygon.points,
      shared,
      normalX: newellX / length,
      normalY: newellY / length,
      normalZ: newellZ / length,
      area,
    });
  }
  return faces;
}

/** Sharpness in [0, 1] per undirected shared-vertex edge key. */
function buildEdgeSharpness(faces: WorkingFace[]): Map<string, number> {
  interface EdgeFace {
    normalX: number;
    normalY: number;
    normalZ: number;
  }
  const firstFace = new Map<string, EdgeFace>();
  const sharpness = new Map<string, number>();

  for (const face of faces) {
    const count = face.shared.length;
    for (let index = 0; index < count; index += 1) {
      const a = face.shared[index];
      const b = face.shared[(index + 1) % count];
      if (a === b) {
        continue;
      }
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const existing = firstFace.get(key);
      if (!existing) {
        firstFace.set(key, {
          normalX: face.normalX,
          normalY: face.normalY,
          normalZ: face.normalZ,
        });
        continue;
      }
      const dot =
        existing.normalX * face.normalX +
        existing.normalY * face.normalY +
        existing.normalZ * face.normalZ;
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
      sharpness.set(
        key,
        smoothstep(angle, WEAR_ANGLE_START, WEAR_ANGLE_FULL),
      );
    }
  }
  return sharpness;
}

function resolveFaceTone(face: WorkingFace, recipe: StoneRecipe): number {
  const roleTone = ROLE_TONE[face.role];
  // Per-face jitter is the facet patchwork of the reference boards; hashing
  // the plane id keeps it stable for a seed.
  const jitter =
    (hashStoneCell(
      recipe.seed,
      hashStoneLabel(face.planeId),
      0x51f0a3,
    ) /
      4294967296 -
      0.5) *
    0.16;
  // Sun-facing bias: faces already tilted upward carry a lighter paint value,
  // independent of runtime lighting.
  const upBias = Math.max(0, face.normalY) * 0.12;
  return clamp01(roleTone + jitter + upBias);
}

function resolveCornerWear(
  face: WorkingFace,
  corner: number,
  edgeSharpness: Map<string, number>,
  recipe: StoneRecipe,
): number {
  const count = face.shared.length;
  const current = face.shared[corner];
  const previous = face.shared[(corner + count - 1) % count];
  const next = face.shared[(corner + 1) % count];
  const keyA =
    previous < current ? `${previous}:${current}` : `${current}:${previous}`;
  const keyB = current < next ? `${current}:${next}` : `${next}:${current}`;
  const sharpA = edgeSharpness.get(keyA) ?? 0;
  const sharpB = edgeSharpness.get(keyB) ?? 0;
  const sharp = Math.pow(Math.max(sharpA, sharpB), 0.75);
  if (sharp <= 0) {
    return 0;
  }

  // Hand-painted irregularity: the highlight swells and fades along an edge.
  const point = face.points[corner];
  const alongJitter =
    0.55 +
    0.45 *
      (hashStoneCell(
        Math.round(point.x * 37 + point.y * 91),
        Math.round(point.z * 53 - point.y * 17),
        recipe.seed,
      ) /
        4294967296);
  // Downward-facing contact edges stay matte; light wear lives on the crown.
  const crownBias = 0.35 + 0.65 * clamp01(face.normalY * 0.5 + 0.62);
  return clamp01(sharp * alongJitter * crownBias * recipe.edgeWear);
}

function fingerprintMesh(
  positions: Float32Array,
  tones: Float32Array,
): number {
  let hash = 0x811c9dc5;
  const mix = (value: number): void => {
    hash = Math.imul(hash ^ (value & 0xffff), 0x01000193) >>> 0;
    hash = Math.imul(hash ^ ((value >>> 16) & 0xffff), 0x01000193) >>> 0;
  };
  for (let index = 0; index < positions.length; index += 1) {
    mix(Math.round(positions[index] / QUANTIZE) | 0);
  }
  for (let index = 0; index < tones.length; index += 1) {
    mix(Math.round(tones[index] * 1024) | 0);
  }
  return hash >>> 0;
}
