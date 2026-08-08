import { hashStoneCell, hashStoneLabel } from "./StoneRandom";
import type { StoneRecipe } from "./StoneRecipe";
import type {
  StonePolygon,
  StonePlaneRole,
  StoneVec3,
} from "./StoneClipper";
import { buildStonePolyhedron } from "./StoneClipper";

/**
 * Builds render-ready flat-shaded mesh data from a stone recipe.
 *
 * Geometry carries palette position, wear, and moss susceptibility rather than
 * final colours so one cached variant can be reused across biome tints.
 */
export interface StoneMeshData {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly tones: Float32Array;
  readonly wears: Float32Array;
  readonly mosses: Float32Array;
  readonly indices: Uint16Array;
  readonly metrics: StoneMeshMetrics;
}

export interface StoneMeshMetrics {
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly height: number;
  readonly contactRadius: number;
  readonly footprintRadius: number;
  readonly embed: number;
  readonly fingerprint: number;
}

const SNAP_EPSILON = 1e-3;
const QUANTIZE = 5e-4;
const DEGENERATE_NORMAL_LENGTH = 1e-12;
const CONTACT_SHADE_FLOOR = 0.62;
const CONTACT_SHADE_HEIGHT = 0.22;
const MOSS_CLIMB = 0.42;
const MOSS_PATCH_SIZE = 0.26;
const WEAR_ANGLE_START = 0.32;
const WEAR_ANGLE_FULL = 0.85;
const INDENTATION_MINIMUM_AREA = 0.035;

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
  if (value <= minimum) return 0;
  if (value >= maximum) return 1;
  const amount = (value - minimum) / (maximum - minimum);
  return amount * amount * (3 - 2 * amount);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function polygonAreaAndNormal(
  polygon: StonePolygon,
): readonly [number, number, number, number] {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let corner = 0; corner < polygon.points.length; corner += 1) {
    const current = polygon.points[corner];
    const next = polygon.points[(corner + 1) % polygon.points.length];
    nx += (current.y - next.y) * (current.z + next.z);
    ny += (current.z - next.z) * (current.x + next.x);
    nz += (current.x - next.x) * (current.y + next.y);
  }
  const length = Math.hypot(nx, ny, nz);
  if (!(length > DEGENERATE_NORMAL_LENGTH)) {
    return [0, 0, 1, 0];
  }
  return [length * 0.5, nx / length, ny / length, nz / length];
}

/**
 * Replace a broad face with sparse faceted recesses. Every emitted polygon is
 * a triangle, so irregular corner depths cannot create twisted quads with one
 * synthetic normal.
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
        area >= INDENTATION_MINIMUM_AREA,
    )
    .sort((left, right) => right.area - left.area)
    .slice(0, 4);
  if (candidates.length === 0) return polygons;

  const choice =
    hashStoneCell(recipe.seed, indentation, 0x496e6465) % candidates.length;
  const selected = candidates[choice];
  const face = selected.polygon;
  let centerX = 0;
  let centerY = 0;
  let centerZ = 0;
  for (const point of face.points) {
    centerX += point.x;
    centerY += point.y;
    centerZ += point.z;
  }
  centerX /= face.points.length;
  centerY /= face.points.length;
  centerZ /= face.points.length;

  const [, normalX, normalY, normalZ] = polygonAreaAndNormal(face);
  const detailRoll =
    hashStoneCell(recipe.seed, indentation, 0x44657074) / 4294967296;
  const insetScale = 0.62 + detailRoll * 0.14;
  const depth = 0.025 + detailRoll * 0.035;
  const inner = face.points.map((point, corner) => {
    const variation =
      hashStoneCell(recipe.seed, indentation * 17 + corner, 0x496e7365) /
      4294967296;
    const scale = insetScale * (0.86 + variation * 0.24);
    const cornerDepth = depth * (0.82 + variation * 0.28);
    return {
      x: centerX + (point.x - centerX) * scale - normalX * cornerDepth,
      y: centerY + (point.y - centerY) * scale - normalY * cornerDepth,
      z: centerZ + (point.z - centerZ) * scale - normalZ * cornerDepth,
    };
  });
  const floorCenter: StoneVec3 = {
    x: centerX - normalX * depth,
    y: centerY - normalY * depth,
    z: centerZ - normalZ * depth,
  };

  const replacement: StonePolygon[] = [];
  for (let index = 0; index < face.points.length; index += 1) {
    const next = (index + 1) % face.points.length;
    const outerA = face.points[index];
    const outerB = face.points[next];
    const innerA = inner[index];
    const innerB = inner[next];
    replacement.push(
      {
        planeId: `notch-wall:${indentation}:${face.planeId}:${index}:0`,
        role: "cut",
        points: [outerA, outerB, innerB],
      },
      {
        planeId: `notch-wall:${indentation}:${face.planeId}:${index}:1`,
        role: "cut",
        points: [outerA, innerB, innerA],
      },
      {
        planeId: `notch-floor:${indentation}:${face.planeId}:${index}`,
        role: "cut",
        points: [innerA, innerB, floorCenter],
      },
    );
  }

  return [
    ...polygons.slice(0, selected.index),
    ...replacement,
    ...polygons.slice(selected.index + 1),
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

  const uniquePoints = new Set<StoneVec3>();
  for (const polygon of polygons) {
    for (const point of polygon.points) {
      uniquePoints.add(point);
    }
  }

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

  let contactX = 0;
  let contactZ = 0;
  let contactCount = 0;
  for (const polygon of polygons) {
    if (polygon.role !== "bottom") continue;
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

  let vertexCount = 0;
  let triangleCount = 0;
  for (const face of faces) {
    vertexCount += face.points.length;
    triangleCount += face.points.length - 2;
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

    const cornerTone = (y: number): number => {
      const heightShade = 0.74 + 0.26 * smoothstep(y, 0, heightMetres * 0.6);
      const contactShade =
        CONTACT_SHADE_FLOOR +
        (1 - CONTACT_SHADE_FLOOR) *
          smoothstep(y, 0, heightMetres * CONTACT_SHADE_HEIGHT);
      return clamp01(faceTone * heightShade * contactShade);
    };

    for (let corner = 0; corner < corners; corner += 1) {
      const point = face.points[corner];
      const offset = vertexCursor * 3;
      positions[offset] = point.x;
      positions[offset + 1] = point.y;
      positions[offset + 2] = point.z;
      normals[offset] = face.normalX;
      normals[offset + 1] = face.normalY;
      normals[offset + 2] = face.normalZ;
      tones[vertexCursor] = cornerTone(point.y);
      wears[vertexCursor] = resolveCornerWear(
        face,
        corner,
        edgeSharpness,
        recipe,
      );
      const baseMoss = resolveMoss(
        point.x,
        point.y,
        point.z,
        face.normalY,
        heightMetres,
        recipe,
      );
      const notchShelter = face.planeId.startsWith("notch-")
        ? 0.42 + 0.28 * (1 - Math.abs(face.normalY))
        : 0;
      mosses[vertexCursor] = Math.max(baseMoss, notchShelter);

      const radial = Math.hypot(point.x, point.z);
      footprintRadius = Math.max(footprintRadius, radial);
      if (point.y === 0) {
        contactRadius = Math.max(contactRadius, radial);
      }
      vertexCursor += 1;
    }

    for (let corner = 1; corner < corners - 1; corner += 1) {
      indices[indexCursor] = baseVertex;
      indices[indexCursor + 1] = baseVertex + corner;
      indices[indexCursor + 2] = baseVertex + corner + 1;
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

function buildWorkingFaces(polygons: StonePolygon[]): WorkingFace[] {
  const sharedIndex = new Map<string, number>();
  let nextShared = 0;
  const faces: WorkingFace[] = [];

  for (const polygon of polygons) {
    if (polygon.points.length < 3) continue;
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
    if (!(length > DEGENERATE_NORMAL_LENGTH)) continue;

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
      area: length * 0.5,
    });
  }
  return faces;
}

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
      if (a === b) continue;
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
  const jitter =
    (hashStoneCell(
      recipe.seed,
      hashStoneLabel(face.planeId),
      0x51f0a3,
    ) /
      4294967296 -
      0.5) *
    0.16;
  const upBias = Math.max(0, face.normalY) * 0.12;
  return clamp01(ROLE_TONE[face.role] + jitter + upBias);
}

function resolveMoss(
  x: number,
  y: number,
  z: number,
  normalY: number,
  heightMetres: number,
  recipe: StoneRecipe,
): number {
  const climb = 1 - smoothstep(y, 0, heightMetres * MOSS_CLIMB);
  if (climb <= 0) return 0;
  const facing = normalY >= 0 ? 0.45 + 0.55 * normalY : 0.45 + 0.3 * -normalY;
  const blotch =
    hashStoneCell(
      Math.round(x / MOSS_PATCH_SIZE) * 31 + Math.round(y / MOSS_PATCH_SIZE),
      Math.round(z / MOSS_PATCH_SIZE) * 17 - Math.round(y / MOSS_PATCH_SIZE),
      recipe.seed ^ 0x6d055,
    ) / 4294967296;
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
  if (sharp <= 0) return 0;

  const point = face.points[corner];
  const alongJitter = Math.pow(
    hashStoneCell(
      Math.round(point.x * 37 + point.y * 91),
      Math.round(point.z * 53 - point.y * 17),
      recipe.seed,
    ) / 4294967296,
    1.6,
  );
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
