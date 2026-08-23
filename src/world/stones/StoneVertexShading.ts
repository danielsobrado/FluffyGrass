import {
  STONE_BOUNCE_HEIGHT,
  STONE_CAVITY_CREASE,
  STONE_CAVITY_UNDERCUT,
  STONE_CRUST_BAND,
  STONE_CRUST_BLOTCH,
  STONE_CRUST_PATCH_SIZE,
  STONE_CRUST_THRESHOLD,
  STONE_STAIN_THRESHOLD,
  STONE_CONTACT_SHADE_FLOOR,
  STONE_CONTACT_SHADE_HEIGHT,
  STONE_CREASE_SHADE,
  STONE_CUT_ACCENT,
  STONE_FRACTURE_ACCENT,
  STONE_FRACTURE_EXPOSURE,
  STONE_FRACTURE_MOSS,
  STONE_FRACTURE_SLOT_CAVITY,
  STONE_FRACTURE_SLOT_HEIGHT,
  STONE_MINERAL_FACE_JITTER,
  STONE_MINERAL_PATCH_SIZE,
  STONE_MINERAL_TINT_STRENGTH,
  STONE_MOSS_CLIMB,
  STONE_MOSS_PATCH_SIZE,
  STONE_SOIL_STAIN_HEIGHT,
  STONE_SOIL_STAIN_STRENGTH,
  STONE_TONE_FLOOR,
  STONE_TONE_RANGE,
} from "./StoneGeometryTuning";
import type { WorkingStoneFace } from "./StoneMeshTopology";
import { hashStoneCell, hashStoneLabel } from "./StoneRandom";
import type { StoneRecipe } from "./StoneRecipe";

const STONE_MINERAL_SEED_XOR = 0x4d696e65;
const STONE_MINERAL_ZONE_SEED_XOR = 0x5a6f6e65;
const STONE_MINERAL_ZONE_DETAIL_SEED_XOR = 0x5265676e;

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
  readonly weatherings: Float32Array;
  readonly cavities: Float32Array;
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
  let weathering = 0;
  let cavity = 0;
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
    weathering += streams.weatherings[vertex];
    cavity += streams.cavities[vertex];
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
  streams.weatherings[target] = weathering * inverse;
  streams.cavities[target] = cavity * inverse;
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
 * Broad object-space mineral variation with a small residual face term.
 *
 * A formation break is the one face that is not weathered rock: it exposes the
 * body's interior, which is paler and less stained than anything the weather
 * has reached, so it lifts further than an ordinary cut does.
 *
 * Neighbouring facets inherit nearly the same base value, so the stone reads as
 * one mineral body instead of a collection of randomly tinted panels.
 */
export function resolveFaceTint(
  face: WorkingStoneFace,
  recipe: StoneRecipe,
): number {
  let centerX = 0;
  let centerY = 0;
  let centerZ = 0;
  for (const point of face.points) {
    centerX += point.x;
    centerY += point.y;
    centerZ += point.z;
  }
  const inverse = 1 / Math.max(1, face.points.length);
  const mineral =
    (crustNoise(
      (centerX * inverse) / STONE_MINERAL_PATCH_SIZE,
      (centerY * inverse) / STONE_MINERAL_PATCH_SIZE,
      (centerZ * inverse) / STONE_MINERAL_PATCH_SIZE,
      recipe.seed ^ STONE_MINERAL_SEED_XOR,
    ) -
      0.5) *
    2 *
    STONE_MINERAL_TINT_STRENGTH;
  const faceJitter =
    (hashStoneCell(recipe.seed, hashStoneLabel(face.planeId), 0x51f0a3) /
      4294967296 -
      0.5) *
    2 *
    STONE_MINERAL_FACE_JITTER;
  const breakAccent =
    face.role === "fracture"
      ? STONE_FRACTURE_ACCENT
      : face.role === "cut"
        ? STONE_CUT_ACCENT
        : 0;
  return mineral + faceJitter + breakAccent;
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
  const exposure = Math.min(
    0.9,
    STONE_TONE_FLOOR + STONE_TONE_RANGE * (0.5 + 0.5 * normalY),
  );
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

/**
 * Moss reads how long a surface has been standing still, so the one face of a
 * formation that has not been standing at all keeps almost none of it. Not
 * quite none: a break that parted seasons ago has begun to take, and a hard
 * zero would draw the boundary as a decal edge along the rim.
 */
export function resolveMoss(
  x: number,
  y: number,
  z: number,
  normalY: number,
  heightMetres: number,
  recipe: StoneRecipe,
  broken = false,
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
  const growth = clamp01(climb * facing * patch);
  return broken ? growth * STONE_FRACTURE_MOSS : growth;
}

/**
 * Blotchy low-frequency field in object space, for boundaries that cross
 * facets. A per-face or per-corner hash cannot do this: it would draw the
 * boundary along the geometry, which is exactly the tell that the pattern is
 * being generated by the mesh rather than deposited on it.
 */
function crustNoise(x: number, y: number, z: number, seed: number): number {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const cellZ = Math.floor(z);
  const fractionX = x - cellX;
  const fractionY = y - cellY;
  const fractionZ = z - cellZ;
  const smoothX = fractionX * fractionX * (3 - 2 * fractionX);
  const smoothY = fractionY * fractionY * (3 - 2 * fractionY);
  const smoothZ = fractionZ * fractionZ * (3 - 2 * fractionZ);
  let value = 0;
  for (let corner = 0; corner < 8; corner += 1) {
    const offsetX = corner & 1;
    const offsetY = (corner >> 1) & 1;
    const offsetZ = (corner >> 2) & 1;
    const lattice =
      hashStoneCell(
        cellX + offsetX,
        cellZ + offsetZ,
        seed ^ ((cellY + offsetY) * 0x9e3779b1),
      ) / 4294967296;
    const weight =
      (offsetX ? smoothX : 1 - smoothX) *
      (offsetY ? smoothY : 1 - smoothY) *
      (offsetZ ? smoothZ : 1 - smoothZ);
    value += lattice * weight;
  }
  return value;
}

/**
 * Broad mineral zoning reuses the signed weathering channel: 0.5 is the base
 * rock, the pale end is exposed cream mineral, and the warm end is iron-rich
 * stone. Two low-frequency object-space fields create a few coherent regions
 * that cross facet boundaries. Height and exposure only bias those regions;
 * they no longer define the pattern, so the result cannot collapse into bands.
 */
export function resolveCornerWeathering(
  x: number,
  y: number,
  z: number,
  normalY: number,
  heightMetres: number,
  recipe: StoneRecipe,
  broken = false,
): number {
  const exposure = clamp01(normalY);
  const climb = smoothstep(y, heightMetres * 0.25, heightMetres * 0.8);
  const macroScale = STONE_MINERAL_PATCH_SIZE * 1.08;
  const detailScale = STONE_CRUST_PATCH_SIZE * 1.65;
  const macro = crustNoise(
    (x + z * 0.16) / macroScale,
    (y - x * 0.11) / (macroScale * 0.88),
    (z - y * 0.09) / macroScale,
    recipe.seed ^ STONE_MINERAL_ZONE_SEED_XOR,
  );
  const secondary = crustNoise(
    (x - z * 0.19) / detailScale,
    (y + z * 0.13) / (detailScale * 0.82),
    (z + x * 0.12) / detailScale,
    recipe.seed ^ STONE_MINERAL_ZONE_DETAIL_SEED_XOR,
  );
  const mineralZone = macro * 0.72 + secondary * 0.28;
  const soilContact =
    1 -
    smoothstep(y, heightMetres * 0.03, heightMetres * STONE_SOIL_STAIN_HEIGHT);
  const soilFacing = 0.55 + 0.45 * clamp01(1 - normalY);
  // A break has no soil stain to carry -- nothing has run down it and nothing
  // has splashed up it -- so that term is dropped rather than merely outweighed.
  const field =
    0.39 +
    (mineralZone - 0.5) * STONE_CRUST_BLOTCH * 1.05 +
    exposure * 0.12 +
    climb * 0.08 +
    (broken
      ? STONE_FRACTURE_EXPOSURE
      : -soilContact * soilFacing * STONE_SOIL_STAIN_STRENGTH);
  const crust = smoothstep(
    field,
    STONE_CRUST_THRESHOLD,
    STONE_CRUST_THRESHOLD + STONE_CRUST_BAND,
  );
  const stain =
    1 -
    smoothstep(
      field,
      STONE_STAIN_THRESHOLD - STONE_CRUST_BAND,
      STONE_STAIN_THRESHOLD,
    );
  return clamp01(0.5 + 0.5 * crust - 0.5 * stain);
}

/**
 * Warm dark in the cracks and under the overhangs.
 *
 * Crease already darkens the tone, but a value cut inside one palette turns a
 * crack the palette's own shadow colour, which on a sage or grey stone is a
 * cool grey slot. Real cavities are warm and much darker than any lit face:
 * they hold soil and shadow, not stone. Separating cavity from tone lets the
 * crack read as depth, which is what makes two touching masses separable.
 */
export function resolveCornerCavity(
  crease: number,
  normalY: number,
  broken = false,
  y = 0,
  heightMetres = 1,
): number {
  const undercut = clamp01(-normalY) * STONE_CAVITY_UNDERCUT;
  const base = crease * STONE_CAVITY_CREASE + undercut;
  if (!broken) return clamp01(base);
  // The slot between two halves is open to the sky at the top and pinched shut
  // at the ground, so the shadow that fills it belongs low. Darkening the whole
  // break face instead would bury the fresh stone that identifies it.
  const slot =
    1 -
    smoothstep(y, 0, Math.max(1e-4, heightMetres * STONE_FRACTURE_SLOT_HEIGHT));
  return clamp01(base + slot * STONE_FRACTURE_SLOT_CAVITY);
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
