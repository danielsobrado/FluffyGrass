import type { StoneRecipe } from "./StoneRecipe";
import type { StoneVec3 } from "./StoneClipper";
import { buildStonePolyhedron } from "./StoneClipper";
import {
  resolveStoneFacetSoftening,
  STONE_CENTROID_FAN_MIN_CORNERS,
  STONE_MESH_QUANTIZE,
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
import { buildStoneSoftNormals } from "./StoneSurfaceNormals";
import {
  averageStoneFaceCorners,
  resolveCornerBounce,
  resolveCornerEdgeShading,
  resolveCornerTone,
  resolveFaceTint,
  resolveMoss,
} from "./StoneVertexShading";

export interface StoneMeshData {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly tones: Float32Array;
  readonly wears: Float32Array;
  readonly bounces: Float32Array;
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
  // Normal averaging and the edge accents that start where it stops read the
  // same archetype treatment, so a family cannot end up smoothed by one rule
  // and accented by another.
  const softening = resolveStoneFacetSoftening(recipe.archetype);
  const edgeSharpness = buildStoneEdgeSharpness(faces, softening);
  const sharedFacePairs = countSharedStoneFacePairs(faces);
  const softNormals = buildStoneSoftNormals(faces, softening);
  const heightMetres = resolveStoneHeight(faces);
  const { vertexCount, triangleCount } = resolveMeshCounts(faces);

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const tones = new Float32Array(vertexCount);
  const wears = new Float32Array(vertexCount);
  const bounces = new Float32Array(vertexCount);
  const mosses = new Float32Array(vertexCount);
  const indices = new Uint16Array(triangleCount * 3);

  let vertexCursor = 0;
  let cornerCursor = 0;
  let indexCursor = 0;
  let contactRadius = 0;
  let footprintRadius = 0;

  for (const face of faces) {
    const corners = face.points.length;
    const faceTint = resolveFaceTint(face, recipe);
    const baseVertex = vertexCursor;

    for (let corner = 0; corner < corners; corner += 1) {
      const point = face.points[corner];
      const offset = vertexCursor * 3;
      const softOffset = cornerCursor * 3;
      positions[offset] = point.x;
      positions[offset + 1] = point.y;
      positions[offset + 2] = point.z;
      normals[offset] = softNormals[softOffset];
      normals[offset + 1] = softNormals[softOffset + 1];
      normals[offset + 2] = softNormals[softOffset + 2];

      const edgeShading = resolveCornerEdgeShading(
        face,
        corner,
        edgeSharpness,
        recipe,
      );
      const softNormalY = softNormals[softOffset + 1];
      wears[vertexCursor] = edgeShading.wear;
      tones[vertexCursor] = resolveCornerTone(
        faceTint,
        softNormalY,
        point.y,
        heightMetres,
        edgeShading.crease,
      );
      bounces[vertexCursor] = resolveCornerBounce(
        point.y,
        heightMetres,
        softNormalY,
        edgeShading.crease,
      );
      const baseMoss = resolveMoss(
        point.x,
        point.y,
        point.z,
        softNormalY,
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
      cornerCursor += 1;
    }

    if (corners >= STONE_CENTROID_FAN_MIN_CORNERS) {
      averageStoneFaceCorners(
        { positions, normals, tones, wears, bounces, mosses },
        baseVertex,
        corners,
        vertexCursor,
      );
      const centroidVertex = vertexCursor;
      vertexCursor += 1;
      for (let corner = 0; corner < corners; corner += 1) {
        indices[indexCursor] = centroidVertex;
        indices[indexCursor + 1] = baseVertex + corner;
        indices[indexCursor + 2] = baseVertex + ((corner + 1) % corners);
        indexCursor += 3;
      }
      continue;
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

  return {
    positions,
    normals,
    tones,
    wears,
    bounces,
    mosses,
    indices,
    metrics,
  };
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
    const corners = face.points.length;
    if (corners >= STONE_CENTROID_FAN_MIN_CORNERS) {
      vertexCount += corners + 1;
      triangleCount += corners;
    } else {
      vertexCount += corners;
      triangleCount += corners - 2;
    }
  }
  return { vertexCount, triangleCount };
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
