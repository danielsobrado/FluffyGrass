import { buildStonePolyhedron, type StonePolygon } from "./StoneClipper";
import { resolveStoneProfileHeights } from "./StoneProfile";
import { hashStoneCell, hashStoneLabel } from "./StoneRandom";
import {
  resolveStoneRecipe,
  type StoneArchetypeId,
  type StoneRecipe,
} from "./StoneRecipe";

const ATTEMPTS = 4;
const QUALITY_CACHE_LIMIT = 256;
const QUALITY_SEED_SALT = 0x41727479;
const qualityRecipeCache = new Map<string, StoneRecipe>();

function polygonArea(face: StonePolygon): number {
  let x = 0;
  let y = 0;
  let z = 0;
  for (let index = 0; index < face.points.length; index += 1) {
    const a = face.points[index];
    const b = face.points[(index + 1) % face.points.length];
    x += (a.y - b.y) * (a.z + b.z);
    y += (a.z - b.z) * (a.x + b.x);
    z += (a.x - b.x) * (a.y + b.y);
  }
  return Math.hypot(x, y, z) * 0.5;
}

function verticalSpan(face: StonePolygon): number {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (const point of face.points) {
    minimum = Math.min(minimum, point.y);
    maximum = Math.max(maximum, point.y);
  }
  return maximum - minimum;
}

function ringSupport(
  recipe: StoneRecipe,
  ringIndex: number,
  side: number,
): number {
  const ring = recipe.profileRings[ringIndex];
  const angle = recipe.sideAngles[side];
  return (
    ring.radii[side] +
    Math.cos(angle) * ring.centerX +
    Math.sin(angle) * ring.centerZ
  );
}

function profileArtDirection(recipe: StoneRecipe): number {
  let turnScore = 0;
  let monotonicTaper = 0;
  for (let side = 0; side < recipe.sideAngles.length; side += 1) {
    const heights = resolveStoneProfileHeights(recipe.profileRings, side);
    const slopes: number[] = [];
    let alwaysNarrows = true;
    for (let ring = 0; ring < recipe.profileRings.length - 1; ring += 1) {
      const lowerSupport = ringSupport(recipe, ring, side);
      const upperSupport = ringSupport(recipe, ring + 1, side);
      slopes.push(
        (upperSupport - lowerSupport) /
          (heights[ring + 1] - heights[ring]),
      );
      if (upperSupport > lowerSupport * 1.015) {
        alwaysNarrows = false;
      }
    }
    if (alwaysNarrows) monotonicTaper += 1;
    for (let index = 1; index < slopes.length; index += 1) {
      const turn = Math.abs(slopes[index] - slopes[index - 1]);
      turnScore += Math.min(1, turn / 0.22);
    }
  }

  const sideCount = recipe.sideAngles.length;
  const maximumTurns = sideCount * Math.max(1, recipe.profileRings.length - 2);
  const turnShare = turnScore / maximumTurns;
  const monotonicShare = monotonicTaper / sideCount;
  const contact = recipe.profileRings[0];
  const top = recipe.profileRings[recipe.profileRings.length - 1];
  const centerWander = Math.hypot(
    top.centerX - contact.centerX,
    top.centerZ - contact.centerZ,
  );
  const wanderTarget = recipe.archetype === "pebble" ? 0.025 : 0.075;
  const wanderScore = Math.max(
    0,
    1 - Math.abs(centerWander - wanderTarget) / (wanderTarget * 1.5),
  );
  return turnShare * 1.4 + wanderScore * 0.45 - monotonicShare * 0.9;
}

/** Scores the final macro body, before optional near-range chips. */
export function scoreStoneShape(recipe: StoneRecipe): number {
  const faces = buildStonePolyhedron(recipe, false).filter(
    (face) =>
      face.role !== "bottom" &&
      face.role !== "contact-bevel" &&
      face.role !== "edge-bevel",
  );
  const entries = faces.map((face) => ({ face, area: polygonArea(face) }));
  const total = entries.reduce((sum, entry) => sum + entry.area, 0);
  if (!(total > 0)) return -100;

  const shares = entries
    .map((entry) => entry.area / total)
    .sort((left, right) => right - left);
  const primary = shares.slice(0, 6).reduce((sum, share) => sum + share, 0);
  const tiny = shares
    .filter((share) => share < 0.015)
    .reduce((sum, share) => sum + share, 0);
  const mediumCount = shares.filter(
    (share) => share >= 0.025 && share <= 0.14,
  ).length;
  const topShare =
    entries
      .filter((entry) => entry.face.role === "top")
      .reduce((sum, entry) => sum + entry.area, 0) / total;
  const longWallShare =
    entries
      .filter(
        (entry) =>
          entry.face.role === "side" && verticalSpan(entry.face) > 0.46,
      )
      .reduce((sum, entry) => sum + entry.area, 0) / total;

  const mean =
    recipe.sideRadii.reduce((sum, value) => sum + value, 0) /
    recipe.sideRadii.length;
  const asymmetry =
    Math.sqrt(
      recipe.sideRadii.reduce(
        (sum, value) => sum + (value - mean) ** 2,
        0,
      ) / recipe.sideRadii.length,
    ) / mean;
  const targetTop =
    recipe.archetype === "slab"
      ? 0.2
      : recipe.archetype === "shard"
        ? 0.07
        : 0.14;

  return (
    primary * 4.5 -
    tiny * 7.5 -
    Math.abs(topShare - targetTop) * 2 -
    longWallShare * 5 +
    Math.min(mediumCount, 9) * 0.055 +
    Math.min(asymmetry, 0.26) * 2.1 +
    profileArtDirection(recipe)
  );
}

function cacheRecipe(key: string, recipe: StoneRecipe): StoneRecipe {
  if (qualityRecipeCache.size >= QUALITY_CACHE_LIMIT) {
    const oldestKey = qualityRecipeCache.keys().next().value as
      | string
      | undefined;
    if (oldestKey !== undefined) {
      qualityRecipeCache.delete(oldestKey);
    }
  }
  qualityRecipeCache.set(key, recipe);
  return recipe;
}

function resolveArchetypeSeed(archetype: StoneArchetypeId, seed: number): number {
  return hashStoneCell(seed, hashStoneLabel(archetype), QUALITY_SEED_SALT);
}

/** Deterministic best-of-four selection with a bounded runtime cache. */
export function resolveQualityStoneRecipe(
  archetype: StoneArchetypeId,
  seed: number,
): StoneRecipe {
  const key = `${archetype}:${seed >>> 0}`;
  const cached = qualityRecipeCache.get(key);
  if (cached) {
    return cached;
  }

  const archetypeSeed = resolveArchetypeSeed(archetype, seed);
  let best = resolveStoneRecipe(archetype, archetypeSeed);
  let bestScore = scoreStoneShape(best);
  for (let attempt = 1; attempt < ATTEMPTS; attempt += 1) {
    const candidate = resolveStoneRecipe(
      archetype,
      hashStoneCell(archetypeSeed, attempt, 0x5175616c),
    );
    const candidateScore = scoreStoneShape(candidate);
    if (candidateScore > bestScore) {
      best = candidate;
      bestScore = candidateScore;
    }
  }
  return cacheRecipe(key, best);
}
