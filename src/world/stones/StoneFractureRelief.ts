/**
 * Waving the break line so a formation reads as fractured rather than sliced.
 *
 * A fragment is its parent's half-spaces plus one more, and a plane through a
 * convex body meets it in a flat polygon with straight edges. That is what puts
 * a dead-straight crack down the middle of a mated pair: the line you see is
 * the rim of that polygon, and no amount of shading fixes a straight line.
 *
 * The rim can still be moved, because the mesh welds by position rather than by
 * plane: displacing every copy of a rim point together leaves the body
 * watertight and merely stops it being exactly convex along the break. So this
 * pass pushes the rim along the break normal by a smooth low-frequency field.
 *
 * Two properties make it safe to do to both halves independently:
 *
 * - The field is evaluated in the parent's own frame and along a direction
 *   whose sign is canonicalised, so the halves receive identical displacements.
 *   Since their breaks face opposite ways, one bulges exactly where the other
 *   hollows and the pieces still nest.
 * - It is smooth rather than per-vertex random, so neighbouring rim points move
 *   together. A sawtooth would invert the chamfer facets that sit along the rim,
 *   and a wavering crack looks more like geology than a zigzag does anyway.
 *
 * The break *face* is barely visible on a mated pair -- the two faces look at
 * each other -- so this deliberately spends its budget on the outline.
 */

import type { StonePolygon, StoneVec3 } from "./StoneClipper";
import { STONE_MESH_QUANTIZE } from "./StoneGeometryTuning";
import { hashStoneCell } from "./StoneRandom";
import type { StoneRecipe } from "./StoneRecipe";

/**
 * Peak displacement in unit body space, where a body's radius is about 0.5.
 *
 * Held well under the depth of the edge chamfers that run along the rim: past
 * that the relief stops warping those facets and starts turning them inside
 * out.
 */
export const STONE_FRACTURE_RELIEF = 0.018;

/** Height over which the relief fades in, so ground contact stays flat. */
const RELIEF_GROUND_FADE = 0.14;

/** Lattice period of the waver, in unit body space. */
const RELIEF_PERIOD_HEIGHT = 0.42;
const RELIEF_PERIOD_ALONG = 0.55;

const RELIEF_SEED_XOR = 0x52656c66;

export function addStoneFractureRelief(
  polygons: StonePolygon[],
  recipe: StoneRecipe,
): StonePolygon[] {
  const fracture = recipe.fracture;
  if (!fracture) return polygons;

  // Horizontal only: the break leans at most a little off vertical, and a
  // vertical component would lift rim points off the ground cap.
  const horizontal = Math.hypot(fracture.nx, fracture.nz);
  if (!(horizontal > 1e-6)) return polygons;
  // The sibling stores this plane negated, so the raw normal cannot be used as
  // a shared direction. Fixing the sign by the dominant component recovers one
  // both halves agree on, exactly, from opposite inputs.
  const flip = canonicalSign(fracture.nx, fracture.nz);
  const directionX = (fracture.nx / horizontal) * flip;
  const directionZ = (fracture.nz / horizontal) * flip;
  // Along-break tangent, for the second axis of the field.
  const tangentX = -directionZ;
  const tangentZ = directionX;

  const rim = new Set<string>();
  for (const polygon of polygons) {
    if (polygon.role !== "fracture") continue;
    for (const point of polygon.points) {
      rim.add(quantizeKey(point));
    }
  }
  if (rim.size === 0) return polygons;

  // Walk every polygon rather than the break's own points: a rim point is a
  // corner of the side faces that meet it too, and moving only one copy would
  // tear the shell open.
  const moved = new Set<string>();
  for (const polygon of polygons) {
    for (const point of polygon.points) {
      const key = quantizeKey(point);
      if (!rim.has(key) || moved.has(key)) continue;
      moved.add(key);
      const along = point.x * tangentX + point.z * tangentZ;
      const amount =
        smoothField(along, point.y, recipe.seed) *
        STONE_FRACTURE_RELIEF *
        groundFade(point.y);
      point.x += directionX * amount;
      point.z += directionZ * amount;
    }
  }
  return polygons;
}

function canonicalSign(nx: number, nz: number): number {
  const dominant = Math.abs(nx) >= Math.abs(nz) ? nx : nz;
  return dominant < 0 ? -1 : 1;
}

function quantizeKey(point: StoneVec3): string {
  return `${Math.round(point.x / STONE_MESH_QUANTIZE)}:${Math.round(
    point.y / STONE_MESH_QUANTIZE,
  )}:${Math.round(point.z / STONE_MESH_QUANTIZE)}`;
}

function groundFade(y: number): number {
  if (y <= 0) return 0;
  if (y >= RELIEF_GROUND_FADE) return 1;
  const amount = y / RELIEF_GROUND_FADE;
  return amount * amount * (3 - 2 * amount);
}

/** Smooth signed value noise on the break plane, in [-1, 1]. */
function smoothField(along: number, height: number, seed: number): number {
  const u = along / RELIEF_PERIOD_ALONG;
  const v = height / RELIEF_PERIOD_HEIGHT;
  const cellU = Math.floor(u);
  const cellV = Math.floor(v);
  const fadeU = fade(u - cellU);
  const fadeV = fade(v - cellV);
  const top =
    lattice(cellU, cellV, seed) * (1 - fadeU) +
    lattice(cellU + 1, cellV, seed) * fadeU;
  const bottom =
    lattice(cellU, cellV + 1, seed) * (1 - fadeU) +
    lattice(cellU + 1, cellV + 1, seed) * fadeU;
  return top * (1 - fadeV) + bottom * fadeV;
}

function fade(amount: number): number {
  return amount * amount * (3 - 2 * amount);
}

function lattice(u: number, v: number, seed: number): number {
  return (hashStoneCell(u, v, seed ^ RELIEF_SEED_XOR) / 4294967296) * 2 - 1;
}
