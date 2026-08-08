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
 * Every logical polygon remains one exactly flat-shaded face. Important edges
 * are chamfered by the clipper as actual narrow polygons, so broad faces no
 * longer need inset rings, centroid fans, or perturbed normals to fake wear.
 */

export interface StoneMeshData {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  /** Palette-ramp position per vertex, in [0, 1]. */
  readonly tones: Float32Array;
  /** Edge-highlight strength per vertex, in [0, 1]. */
  readonly wears: Float32Array;
  /**
   * Moss susceptibility per vertex, in [0, 1]. How readily this point *would*
   * take moss, not how much it has: the amount is a placement decision, so one
   * geometry serves a damp meadow and a dry steppe without regenerating.
   */
  readonly mosses: Float32Array;
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
/** Darkest tone multiplier where a stone meets the ground. */
const CONTACT_SHADE_FLOOR = 0.62;
/** Fraction of stone height over which the contact darkening lifts. */
const CONTACT_SHADE_HEIGHT = 0.22;
/**
 * Fraction of stone height that moss can climb. Moss creeps up from the
 * ground, so the band is what ties a stone to the terrain it stands in — the
 * lower third reads as damp, the crown stays clean.
 */
const MOSS_CLIMB = 0.42;
/** Metres per blotch of the moss patchiness hash. */
const MOSS_PATCH_SIZE = 0.26;
/** Dihedral angles below this stay unlit; above the upper bound fully lit. */
const WEAR_ANGLE_START = 0.32;
const WEAR_ANGLE_FULL = 0.85;

const ROLE_TONE: Record<StonePlaneRole, number> = {
  top: 0.95,
  "top-bevel": 0.78,
  side: 0.46,
  cut: 0.6,
  "contact-bevel": 0.26,
  "edge-bevel": 0.7,
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

/**
 * Replace one broad exposed polygon with a shallow recessed patch. This is a
 * genuine concavity (an annular set of wall quads plus a floor), not another
 * convex clipping plane. It is deliberately sparse so the notch reads as a
 * broken-away pocket rather than a procedural stamp across the whole set.
 */
function addStoneIndentation(
  polygons: StonePolygon[],
  recipe: StoneRecipe,
): StonePolygon[] {
  if (recipe.archetype === "pebble" || recipe.archetype === "shard") {
    return polygons;
  }
  const roll =
    hashStoneCell(recipe.seed, hashStoneLabel(recipe.archetype), 0x4e6f7463) /
    4294967296;
  const indentationCount = roll < 0.02 ? 3 : roll < 0.1 ? 2 : roll < 0.35 ? 1 : 0;
  let result = polygons;
  for (let indentation = 0; indentation < indentationCount; indentation += 1) {
    result = addSingleStoneIndentation(result, recipe, indentation);
  }
  return result;
}

function polygonAreaAndNormal(
  polygon: StonePolygon,
): readonly [number, number, number, number] {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let corner = 0; corner < polygon.points.length; corner += 1) {
    const a = polygon.points[corner];
    const b = polygon.points[(corner + 1) % polygon.points.length];
    nx += (a.y - b.y) * (a.z + b.z);
    ny += (a.z - b.z) * (a.x + b.x);
    nz += (a.x - b.x) * (a.y + b.y);
  }
  const length = Math.hypot(nx, ny, nz);
  return [length * 0.5, nx / length, ny / length, nz / length];
}

function addSingleStoneIndentation(
  polygons: StonePolygon[],
  recipe: StoneRecipe,
  indentation: number,
): StonePolygon[] {
  const candidates = polygons
    .map((polygon, index) => ({
      polygon,
      index,
      area: polygonAreaAndNormal(polygon)[0],
    }))
    .filter(
      ({ polygon, area }) =>
        (polygon.role === "side" || polygon.role === "top") &&
        polygon.points.length >= 4 &&
        area >= 0.035,
    )
    .sort((left, right) => right.area - left.area)
    .slice(0, 4);
  if (candidates.length === 0) return polygons;
  const choice =
    hashStoneCell(recipe.seed, indentation, 0x496e6465) % candidates.length;
  const selected = candidates[choice];
  const selectedIndex = selected.index;
  const face = selected.polygon;
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const point of face.points) {
    cx += point.x;
    cy += point.y;
    cz += point.z;
  }
  cx /= face.points.length;
  cy /= face.points.length;
  cz /= face.points.length;
  const [, nx, ny, nz] = polygonAreaAndNormal(face);
  const detailRoll =
    hashStoneCell(recipe.seed, indentation, 0x44657074) / 4294967296;
  const insetScale = 0.62 + detailRoll * 0.14;
  const depth = 0.025 + detailRoll * 0.035;
  const inner = face.points.map((point, corner) => {
    const cornerVariation =
      hashStoneCell(recipe.seed, indentation * 17 + corner, 0x496e7365) /
      4294967296;
    const cornerScale = insetScale * (0.86 + cornerVariation * 0.24);
    const cornerDepth = depth * (0.82 + cornerVariation * 0.28);
    return {
      x: cx + (point.x - cx) * cornerScale - nx * cornerDepth,
      y: cy + (point.y - cy) * cornerScale - ny * cornerDepth,
      z: cz + (point.z - cz) * cornerScale - nz * cornerDepth,
    };
  });
  const replacement: StonePolygon[] = [];
  for (let index = 0; index < face.points.length; index += 1) {
    const next = (index + 1) % face.points.length;
    replacement.push({
      planeId: `notch-wall:${indentation}:${face.planeId}:${index}`,
      role: "cut",
      points: [face.points[index], face.points[next], inner[next], inner[index]],
    });
  }
  replacement.push({
    planeId: `notch-floor:${indentation}:${face.planeId}`,
    role: "cut",
    points: inner,
  });
  return [
    ...polygons.slice(0, selectedIndex),
    ...replacement,
    ...polygons.slice(selectedIndex + 1),
  ];
}

export function generateStoneMesh(
  recipe: StoneRecipe,
  includeChips = false,
): StoneMeshData {
  const polygons = addStoneIndentation(
    buildStonePolyhedron(recipe, includeChips),
    recipe,
  );

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

  // Logical polygons triangulate only for the GPU; every triangle receives the
  // same exact face normal, so internal diagonals remain visually invisible.
  let vertexCount = 0;
  let triangleCount = 0;
  for (const face of faces) {
    const corners = face.points.length;
    vertexCount += corners + 1;
    triangleCount += corners;
  }

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const tones = new Float32Array(vertexCount);
  const wears = new Float32Array(vertexCount);
  const mosses = new Float32Array(vertexCount);
  const indices = new Uint16Array(triangleCount * 3);

  let vertexCursor = 0;
  let indexCursor = 0;
  let contactRadius = 0;
  let footprintRadius = 0;

  for (const face of faces) {
    const corners = face.points.length;
    const faceTone = resolveFaceTone(face, recipe);
    const baseVertex = vertexCursor;

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
      normalX = face.normalX,
      normalY = face.normalY,
      normalZ = face.normalZ,
    ): number => {
      const offset = vertexCursor * 3;
      positions[offset] = x;
      positions[offset + 1] = y;
      positions[offset + 2] = z;
      normals[offset] = normalX;
      normals[offset + 1] = normalY;
      normals[offset + 2] = normalZ;
      tones[vertexCursor] = tone;
      wears[vertexCursor] = wear;
      const baseMoss = resolveMoss(
        x,
        y,
        z,
        normalY,
        heightMetres,
        recipe,
      );
      const notchShelter = face.planeId.startsWith("notch-")
        ? 0.42 + 0.28 * (1 - Math.abs(normalY))
        : 0;
      mosses[vertexCursor] = Math.max(baseMoss, notchShelter);
      const emitted = vertexCursor;
      vertexCursor += 1;
      return emitted;
    };

    const cornerTone = (y: number): number => {
      // Two separate falls: a broad top-to-bottom gradient, and a tighter
      // darkening right at the ground. The second is what seats a stone in the
      // terrain instead of leaving it looking placed on top of it.
      const heightShade = 0.74 + 0.26 * smoothstep(y, 0, heightMetres * 0.6);
      const contactShade =
        CONTACT_SHADE_FLOOR +
        (1 - CONTACT_SHADE_FLOOR) *
          smoothstep(y, 0, heightMetres * CONTACT_SHADE_HEIGHT);
      return clamp01(faceTone * heightShade * contactShade);
    };

    for (let corner = 0; corner < corners; corner += 1) {
      const point = face.points[corner];
      emitVertex(
        point.x,
        point.y,
        point.z,
        cornerTone(point.y),
        resolveCornerWear(face, corner, edgeSharpness, recipe),
        face.normalX,
        face.normalY,
        face.normalZ,
      );
      const radial = Math.hypot(point.x, point.z);
      footprintRadius = Math.max(footprintRadius, radial);
      if (point.y === 0) {
        contactRadius = Math.max(contactRadius, radial);
      }
    }

    const centroidIndex = emitVertex(
      centroidX,
      centroidY,
      centroidZ,
      cornerTone(centroidY),
      0,
    );
    for (let corner = 0; corner < corners; corner += 1) {
      indices[indexCursor] = baseVertex + corner;
      indices[indexCursor + 1] = baseVertex + ((corner + 1) % corners);
      indices[indexCursor + 2] = centroidIndex;
      indexCursor += 3;
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

  return { positions, normals, tones, wears, mosses, indices, metrics };
}

/**
 * Whether a face is big enough to carry the inset highlight band. Undersides
 * never band — nothing down there is ever lit.
 */
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

/**
 * How readily a point takes moss.
 *
 * Three factors, all cheap and all baked once: how far it is above the ground,
 * which way it faces, and a blotch hash so the edge of the growth is ragged
 * rather than a clean waterline. Undersides keep a floor rather than going to
 * zero — the damp shade beneath an overhang is exactly where moss does best,
 * even though it faces down.
 */
function resolveMoss(
  x: number,
  y: number,
  z: number,
  normalY: number,
  heightMetres: number,
  recipe: StoneRecipe,
): number {
  const climb = 1 - smoothstep(y, 0, heightMetres * MOSS_CLIMB);
  if (climb <= 0) {
    return 0;
  }
  // Up-facing ledges hold moisture; vertical faces shed it. The floor keeps
  // sheltered undersides in play.
  const facing = normalY >= 0 ? 0.45 + 0.55 * normalY : 0.45 + 0.3 * -normalY;
  const blotch =
    hashStoneCell(
      Math.round(x / MOSS_PATCH_SIZE) * 31 + Math.round(y / MOSS_PATCH_SIZE),
      Math.round(z / MOSS_PATCH_SIZE) * 17 - Math.round(y / MOSS_PATCH_SIZE),
      recipe.seed ^ 0x6d055,
    ) / 4294967296;
  // Widening the blotch with depth into the band keeps growth continuous at
  // the base and broken at its upper edge, which is how it actually creeps.
  const patch = smoothstep(climb * 1.35, blotch * 0.85, blotch * 0.85 + 0.3);
  return clamp01(climb * facing * patch);
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
  const alongJitter = Math.pow(
    hashStoneCell(
      Math.round(point.x * 37 + point.y * 91),
      Math.round(point.z * 53 - point.y * 17),
      recipe.seed,
    ) / 4294967296,
    1.6,
  );
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
