import { buildStonePlanes, type StonePlane } from "./StoneClipper";
import { resolveStoneProfileHeights } from "./StoneProfile";
import { resolveStoneRecipe, STONE_ARCHETYPE_IDS } from "./StoneRecipe";

const SEEDS_PER_ARCHETYPE = 120;
const PLANE_TOLERANCE = 2e-5;
const MINIMUM_HEIGHT_GAP = 0.059;

function fail(message: string): never {
  throw new Error(`[stones-profile] ${message}`);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) fail(message);
}

function planeDistance(
  plane: StonePlane,
  x: number,
  y: number,
  z: number,
): number {
  return plane.nx * x + plane.ny * y + plane.nz * z - plane.constant;
}

/** Ensures the clipper consumes the same effective ring profile the scorer sees. */
export function verifyStoneProfiles(): string {
  let profilesChecked = 0;

  for (const archetype of STONE_ARCHETYPE_IDS) {
    for (let seed = 0; seed < SEEDS_PER_ARCHETYPE; seed += 1) {
      const recipe = resolveStoneRecipe(archetype, seed);
      const rings = recipe.profileRings;
      assert(rings.length === 5, `${archetype}:${seed} must have five profile rings.`);
      const planes = buildStonePlanes(recipe);
      const planesById = new Map(planes.map((plane) => [plane.id, plane]));

      for (let side = 0; side < recipe.sideAngles.length; side += 1) {
        const heights = resolveStoneProfileHeights(rings, side);
        assert(
          heights.length === rings.length,
          `${archetype}:${seed}:${side} profile height count changed.`,
        );
        for (let ring = 0; ring < rings.length; ring += 1) {
          assert(
            rings[ring].radii.length === recipe.sideAngles.length &&
              rings[ring].heightOffsets.length === recipe.sideAngles.length,
            `${archetype}:${seed}:${ring} profile ring width is inconsistent.`,
          );
          assert(
            Number.isFinite(heights[ring]),
            `${archetype}:${seed}:${side}:${ring} has a non-finite height.`,
          );
          if (ring > 0) {
            assert(
              heights[ring] - heights[ring - 1] >= MINIMUM_HEIGHT_GAP,
              `${archetype}:${seed}:${side} profile rings collapsed vertically.`,
            );
          }
        }

        const angle = recipe.sideAngles[side];
        const directionX = Math.cos(angle);
        const directionZ = Math.sin(angle);
        for (let segment = 0; segment < rings.length - 1; segment += 1) {
          const plane = planesById.get(`profile:${segment}:${side}`);
          assert(
            plane !== undefined,
            `${archetype}:${seed}:${side}:${segment} profile plane is missing.`,
          );
          const lower = rings[segment];
          const upper = rings[segment + 1];
          const lowerX = lower.centerX + directionX * lower.radii[side];
          const lowerZ = lower.centerZ + directionZ * lower.radii[side];
          const upperX = upper.centerX + directionX * upper.radii[side];
          const upperZ = upper.centerZ + directionZ * upper.radii[side];
          const lowerDistance = Math.abs(
            planeDistance(plane, lowerX, heights[segment], lowerZ),
          );
          const upperDistance = Math.abs(
            planeDistance(plane, upperX, heights[segment + 1], upperZ),
          );
          assert(
            lowerDistance <= PLANE_TOLERANCE &&
              upperDistance <= PLANE_TOLERANCE,
            `${archetype}:${seed}:${side}:${segment} plane diverges from profile (${lowerDistance}/${upperDistance}).`,
          );
        }
      }
      profilesChecked += 1;
    }
  }

  return `${profilesChecked} layered profiles`;
}
