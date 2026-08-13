import {
  STONE_BOUNCE_HEIGHT,
  STONE_CONTACT_SHADE_FLOOR,
  STONE_CONTACT_SHADE_HEIGHT,
  STONE_CREASE_SHADE,
  STONE_CUT_ACCENT,
  STONE_MOSS_CLIMB,
  STONE_MOSS_PATCH_SIZE,
  STONE_TONE_FLOOR,
  STONE_TONE_RANGE,
} from "./StoneGeometryTuning";
import type { WorkingStoneFace } from "./StoneMeshTopology";
import { hashStoneCell, hashStoneLabel } from "./StoneRandom";
import type { StoneRecipe } from "./StoneRecipe";

/**
 * Baked per-corner shading channels.
 *
 * Everything here is resolved once per mesh variant and packed into vertex
 * bytes, so the runtime cost of the whole look is zero. The channels are:
 * `tone` (value ramp position, including crease occlusion), `wear` (ridge
 * highlight), `moss` (growth potential), and `bounce` (turf light thrown back
 * up onto the lower body, which is what settles a stone into the field instead
 * of leaving it pasted on top).
 */

export interface StoneVertexStreams {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly tones: Float32Array;
  readonly wears: Float32Array;
  readonly bounces: Float32Array;
  readonly mosses: Float32Array;
}

/**
 * Resolve the centre vertex of a centroid fan from the corners already written
 * at `baseVertex`. Its position is the corner average, which for a planar
 * polygon lies exactly on the face, so the silhouette never moves; its shading
 * is the corner average, which is what makes the fan interpolate as one smooth
 * umbrella instead of spokes radiating from a chosen corner.
 */
export function averageStoneFaceCorners(
  streams: StoneVertexStreams,
  baseVertex: number,
  corners: number,
  target: number,
): void {
  let x = 0;
  let y = 0;
  let z = 0;
  let normalX = 0;
  let normalY = 0;
  let normalZ = 0;
  let tone = 0;
  let wear = 0;
  let bounce = 0;
  let moss = 0;
  for (let corner = 0; corner < corners; corner += 1) {
    const vertex = baseVertex + corner;
    const offset = vertex * 3;
    x += streams.positions[offset];
    y += streams.positions[offset + 1];
    z += streams.positions[offset + 2];
    normalX += streams.normals[offset];
    normalY += streams.normals[offset + 1];
    normalZ += streams.normals[offset + 2];
    tone += streams.tones[vertex];
    wear += streams.wears[vertex];
    bounce += streams.bounces[vertex];
    moss += streams.mosses[vertex];
  }

  const inverse = 1 / corners;
  const targetOffset = target * 3;
  streams.positions[targetOffset] = x * inverse;
  streams.positions[targetOffset + 1] = y * inverse;
  streams.positions[targetOffset + 2] = z * inverse;
  const length = Math.hypot(normalX, normalY, normalZ);
  const normalScale = length > 1e-12 ? 1 / length : 0;
  streams.normals[targetOffset] = normalX * normalScale;
  streams.normals[targetOffset + 1] = normalY * normalScale;
  streams.normals[targetOffset + 2] = normalZ * normalScale;
  streams.tones[target] = tone * inverse;
  streams.wears[target] = wear * inverse;
  streams.bounces[target] = bounce * inverse;
  streams.mosses[target] = moss * inverse;
}

export function smoothstep(
  value: number,
  minimum: number,
  maximum: number,
): number {
  if (value <= minimum) return 0;
  if (value >= maximum) return 1;
  const amount = (value - minimum) / (maximum - minimum);
  return amount * amount * (3 - 2 * amount);
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Per-face material variation. Small on purpose: it survives as a hint of
 * differing mineral faces without redrawing the creases the softening removed.
 */
export function resolveFaceTint(
  face: WorkingStoneFace,
  recipe: StoneRecipe,
): number {
  const jitter =
    (hashStoneCell(recipe.seed, hashStoneLabel(face.planeId), 0x51f0a3) /
      4294967296 -
      0.5) *
    0.09;
  return jitter + (face.role === "cut" ? STONE_CUT_ACCENT : 0);
}

/**
 * Height shading stays gentle now that facets are smooth: the lighting model
 * can separate top from side on its own, and a steep painted ramp on top of it
 * reads as dirt rather than form.
 */
export function resolveCornerTone(
  faceTint: number,
  normalY: number,
  y: number,
  heightMetres: number,
  crease: number,
): number {
  const exposure = STONE_TONE_FLOOR + STONE_TONE_RANGE * (0.5 + 0.5 * normalY);
  const heightShade = 0.86 + 0.14 * smoothstep(y, 0, heightMetres * 0.6);
  const contactShade =
    STONE_CONTACT_SHADE_FLOOR +
    (1 - STONE_CONTACT_SHADE_FLOOR) *
      smoothstep(y, 0, heightMetres * STONE_CONTACT_SHADE_HEIGHT);
  const creaseShade = 1 - STONE_CREASE_SHADE * crease;
  return clamp01(
    exposure * heightShade * contactShade * creaseShade + faceTint,
  );
}

/** Turf bounce reaches the lower body, strongest where the surface faces down. */
export function resolveCornerBounce(
  y: number,
  heightMetres: number,
  normalY: number,
  crease: number,
): number {
  const climb =
    1 - smoothstep(y, 0, Math.max(1e-4, heightMetres * STONE_BOUNCE_HEIGHT));
  if (climb <= 0) return 0;
  const facing = 0.34 + 0.66 * clamp01(0.5 - normalY * 0.5);
  return clamp01(climb * facing * (1 - crease * 0.45));
}

export function resolveMoss(
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

/**
 * Ridge highlight and crease occlusion share one signed dihedral lookup, so a
 * notch rim can never pick up the bright wear that belongs to an exposed edge.
 */
export function resolveCornerEdgeShading(
  face: WorkingStoneFace,
  corner: number,
  edgeSharpness: ReadonlyMap<string, number>,
  recipe: StoneRecipe,
): { wear: number; crease: number } {
  const count = face.shared.length;
  const current = face.shared[corner];
  const previous = face.shared[(corner + count - 1) % count];
  const next = face.shared[(corner + 1) % count];
  const keyA =
    previous < current ? `${previous}:${current}` : `${current}:${previous}`;
  const keyB = current < next ? `${current}:${next}` : `${next}:${current}`;
  const sharpA = edgeSharpness.get(keyA) ?? 0;
  const sharpB = edgeSharpness.get(keyB) ?? 0;

  const crease = clamp01(Math.max(-sharpA, -sharpB));
  const ridge = Math.max(0, Math.max(sharpA, sharpB));
  if (ridge <= 0) return { wear: 0, crease };

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
  return {
    wear: clamp01(
      Math.pow(ridge, 0.75) * alongJitter * crownBias * recipe.edgeWear,
    ),
    crease,
  };
}
