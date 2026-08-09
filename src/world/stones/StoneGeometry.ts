import { hashStoneCell, hashStoneLabel } from "./StoneRandom";
import type { StoneRecipe } from "./StoneRecipe";
import type { StoneVec3 } from "./StoneClipper";
import { buildStonePolyhedron } from "./StoneClipper";
import {
  STONE_CONTACT_SHADE_FLOOR,
  STONE_CONTACT_SHADE_HEIGHT,
  STONE_MESH_QUANTIZE,
  STONE_MOSS_CLIMB,
  STONE_MOSS_PATCH_SIZE,
  STONE_ROLE_TONE,
  STONE_SNAP_EPSILON,
} from "./StoneGeometryTuning";
import { addStoneIndentation } from "./StoneIndentation";
import {
  buildStoneEdgeSharpness,
  buildWorkingStoneFaces,
  chooseStoneFanRoot,
  countSharedStoneFacePairs,
  type WorkingStoneFace,
} from "./StoneMeshTopology";

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

function smoothstep(value: number, minimum: number, maximum: number): number {
  if (value <= minimum) return 0;
  if (value >= maximum) return 1;
  const amount = (value - minimum) / (maximum - minimum);
  return amount * amount * (3 - 2 * amount);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
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
    if (Math.abs(point.y) <= STONE_SNAP_EPSILON) {
      point.y = 0;
    }
  }

  centerStoneContact(polygons, uniquePoints);

  const faces = buildWorkingStoneFaces(polygons);
  const edgeSharpness = buildStoneEdgeSharpness(faces);
  const sharedFacePairs = countSharedStoneFacePairs(faces);
  const heightMetres = resolveStoneHeight(faces);
  const { vertexCount, triangleCount } = resolveMeshCounts(faces);

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

    for (let corner = 0; corner < corners; corner += 1) {
      const point = face.points[corner];
      const offset = vertexCursor * 3;
      positions[offset] = point.x;
      positions[offset + 1] = point.y;
      positions[offset + 2] = point.z;
      normals[offset] = face.normalX;
      normals[offset + 1] = face.normalY;
      normals[offset + 2] = face.normalZ;
      tones[vertexCursor] = resolveCornerTone(faceTone, point.y, heightMetres);
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

    const fanRoot = chooseStoneFanRoot(face, sharedFacePairs);
    for (let offset = 1; offset < corners - 1; offset += 1) {
      indices[indexCursor] = baseVertex + fanRoot;
      indices[indexCursor + 1] = baseVertex + ((fanRoot + offset) % corners);
      indices[indexCursor + 2] =
        baseVertex + ((fanRoot + offset + 1) % corners);
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

function centerStoneContact(
  polygons: ReturnType<typeof buildStonePolyhedron>,
  uniquePoints: ReadonlySet<StoneVec3>,
): void {
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
  if (contactCount === 0) {
    return;
  }

  contactX /= contactCount;
  contactZ /= contactCount;
  for (const point of uniquePoints) {
    point.x -= contactX;
    point.z -= contactZ;
  }
}

function resolveStoneHeight(faces: readonly WorkingStoneFace[]): number {
  let maxY = 0;
  for (const face of faces) {
    for (const point of face.points) {
      maxY = Math.max(maxY, point.y);
    }
  }
  return Math.max(maxY, 1e-3);
}

function resolveMeshCounts(faces: readonly WorkingStoneFace[]): {
  vertexCount: number;
  triangleCount: number;
} {
  let vertexCount = 0;
  let triangleCount = 0;
  for (const face of faces) {
    vertexCount += face.points.length;
    triangleCount += face.points.length - 2;
  }
  return { vertexCount, triangleCount };
}

function resolveCornerTone(
  faceTone: number,
  y: number,
  heightMetres: number,
): number {
  const heightShade = 0.74 + 0.26 * smoothstep(y, 0, heightMetres * 0.6);
  const contactShade =
    STONE_CONTACT_SHADE_FLOOR +
    (1 - STONE_CONTACT_SHADE_FLOOR) *
      smoothstep(y, 0, heightMetres * STONE_CONTACT_SHADE_HEIGHT);
  return clamp01(faceTone * heightShade * contactShade);
}

function resolveFaceTone(face: WorkingStoneFace, recipe: StoneRecipe): number {
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
  return clamp01(STONE_ROLE_TONE[face.role] + jitter + upBias);
}

function resolveMoss(
  x: number,
  y: number,
  z: number,
  normalY: number,
  heightMetres: number,
  recipe: StoneRecipe,
): number {
  const climb = 1 - smoothstep(y, 0, heightMetres * STONE_MOSS_CLIMB);
  if (climb <= 0) return 0;
  const facing = normalY >= 0 ? 0.45 + 0.55 * normalY : 0.45 + 0.3 * -normalY;
  const blotch =
    hashStoneCell(
      Math.round(x / STONE_MOSS_PATCH_SIZE) * 31 +
        Math.round(y / STONE_MOSS_PATCH_SIZE),
      Math.round(z / STONE_MOSS_PATCH_SIZE) * 17 -
        Math.round(y / STONE_MOSS_PATCH_SIZE),
      recipe.seed ^ 0x6d055,
    ) / 4294967296;
  const patch = smoothstep(climb * 1.35, blotch * 0.85, blotch * 0.85 + 0.3);
  return clamp01(climb * facing * patch);
}

function resolveCornerWear(
  face: WorkingStoneFace,
  corner: number,
  edgeSharpness: ReadonlyMap<string, number>,
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
    mix(Math.round(positions[index] / STONE_MESH_QUANTIZE) | 0);
  }
  for (let index = 0; index < tones.length; index += 1) {
    mix(Math.round(tones[index] * 1024) | 0);
  }
  return hash >>> 0;
}
