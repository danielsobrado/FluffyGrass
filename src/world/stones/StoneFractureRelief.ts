/**
 * Waving structural break lines so generated stones read fractured rather than
 * sliced.
 *
 * Clipping a convex body with a plane produces perfectly straight rim edges.
 * The topology can stay unchanged: moving every copy of a rim point together
 * keeps the shell watertight while a small low-frequency displacement removes
 * the ruler-straight read. Formation fractures use the stronger treatment;
 * ordinary structural cuts use a subtler version so broad planes remain broad.
 */

import type { StonePolygon, StoneVec3 } from "./StoneClipper";
import { STONE_MESH_QUANTIZE } from "./StoneGeometryTuning";
import { hashStoneCell } from "./StoneRandom";
import type { StoneRecipe } from "./StoneRecipe";

/** Peak formation-fracture displacement in unit body space. */
export const STONE_FRACTURE_RELIEF = 0.018;
/** Structural cuts only need enough relief to stop reading as saw lines. */
export const STONE_CUT_RELIEF = 0.009;

/** Height over which relief fades in, so ground contact stays flat. */
const RELIEF_GROUND_FADE = 0.14;
/** Lattice period of the waver, in unit body space. */
const RELIEF_PERIOD_HEIGHT = 0.42;
const RELIEF_PERIOD_ALONG = 0.55;
/** Prevent intersecting breaks from accumulating an excessive displacement. */
const MAX_COMBINED_RELIEF = 0.021;
const RELIEF_SEED_XOR = 0x52656c66;
const CUT_RELIEF_SEED_XOR = 0x43757452;
const HORIZONTAL_EPSILON = 1e-6;

interface ReliefSource {
  readonly planeId: string;
  readonly role: "cut" | "fracture";
  readonly directionX: number;
  readonly directionZ: number;
  readonly tangentX: number;
  readonly tangentZ: number;
  readonly amplitude: number;
  readonly seed: number;
}

interface ReliefOffset {
  x: number;
  z: number;
}

/**
 * Apply matching relief to formation fractures and subtle relief to structural
 * cut rims. The exported name is retained because formation verification and
 * mesh generation share this pass.
 */
export function addStoneFractureRelief(
  polygons: StonePolygon[],
  recipe: StoneRecipe,
): StonePolygon[] {
  const sources = resolveReliefSources(recipe);
  if (sources.length === 0) return polygons;

  const offsets = new Map<string, ReliefOffset>();
  for (const source of sources) {
    const sourceKeys = new Set<string>();
    for (const polygon of polygons) {
      if (polygon.role !== source.role || polygon.planeId !== source.planeId) {
        continue;
      }
      for (const point of polygon.points) {
        const key = quantizeKey(point);
        if (sourceKeys.has(key)) continue;
        sourceKeys.add(key);
        const along = point.x * source.tangentX + point.z * source.tangentZ;
        const amount =
          smoothField(along, point.y, source.seed) *
          source.amplitude *
          groundFade(point.y);
        let offset = offsets.get(key);
        if (!offset) {
          offset = { x: 0, z: 0 };
          offsets.set(key, offset);
        }
        offset.x += source.directionX * amount;
        offset.z += source.directionZ * amount;
      }
    }
  }
  if (offsets.size === 0) return polygons;

  const moved = new Set<StoneVec3>();
  for (const polygon of polygons) {
    for (const point of polygon.points) {
      if (moved.has(point)) continue;
      moved.add(point);
      const offset = offsets.get(quantizeKey(point));
      if (!offset) continue;
      const length = Math.hypot(offset.x, offset.z);
      const scale =
        length > MAX_COMBINED_RELIEF ? MAX_COMBINED_RELIEF / length : 1;
      point.x += offset.x * scale;
      point.z += offset.z * scale;
    }
  }
  return polygons;
}

function resolveReliefSources(recipe: StoneRecipe): ReliefSource[] {
  const sources: ReliefSource[] = [];
  const fracture = recipe.fracture;
  if (fracture) {
    const source = createReliefSource(
      "fracture",
      "fracture",
      fracture.nx,
      fracture.nz,
      STONE_FRACTURE_RELIEF,
      recipe.seed,
    );
    if (source) sources.push(source);
  }

  for (let index = 0; index < recipe.cuts.length; index += 1) {
    const cut = recipe.cuts[index];
    const source = createReliefSource(
      `cut:${index}`,
      "cut",
      cut.normalX,
      cut.normalZ,
      STONE_CUT_RELIEF,
      hashStoneCell(recipe.seed, index, CUT_RELIEF_SEED_XOR),
    );
    if (source) sources.push(source);
  }
  return sources;
}

function createReliefSource(
  planeId: string,
  role: "cut" | "fracture",
  nx: number,
  nz: number,
  amplitude: number,
  seed: number,
): ReliefSource | undefined {
  const horizontal = Math.hypot(nx, nz);
  if (!(horizontal > HORIZONTAL_EPSILON)) return undefined;

  // Formation siblings store their break normal with opposite signs. A
  // canonical sign also makes ordinary cut relief independent of representation.
  const flip = canonicalSign(nx, nz);
  const directionX = (nx / horizontal) * flip;
  const directionZ = (nz / horizontal) * flip;
  return {
    planeId,
    role,
    directionX,
    directionZ,
    tangentX: -directionZ,
    tangentZ: directionX,
    amplitude,
    seed,
  };
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

/** Smooth signed value noise on a break plane, in [-1, 1]. */
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
