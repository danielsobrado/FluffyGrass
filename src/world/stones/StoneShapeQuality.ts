import { buildStonePolyhedron, type StonePolygon } from "./StoneClipper";
import { hashStoneCell } from "./StoneRandom";
import {
  resolveStoneRecipe,
  type StoneArchetypeId,
  type StoneRecipe,
} from "./StoneRecipe";

const ATTEMPTS = 4;

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
  const primary = shares.slice(0, 5).reduce((sum, share) => sum + share, 0);
  const tiny = shares
    .filter((share) => share < 0.018)
    .reduce((sum, share) => sum + share, 0);
  const mediumCount = shares.filter(
    (share) => share >= 0.035 && share <= 0.16,
  ).length;
  const topShare =
    entries
      .filter((entry) => entry.face.role === "top")
      .reduce((sum, entry) => sum + entry.area, 0) / total;
  const verticalShare =
    entries
      .filter(
        (entry) =>
          entry.face.role === "side" &&
          entry.face.points.every((point) => point.y < 0.78),
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
      ? 0.22
      : recipe.archetype === "shard"
        ? 0.08
        : 0.15;
  const verticalLimit = recipe.archetype === "slab" ? 0.5 : 0.44;
  return (
    primary * 5.2 -
    tiny * 8 -
    Math.abs(topShare - targetTop) * 2.2 -
    Math.max(0, verticalShare - verticalLimit) * 4 +
    Math.min(mediumCount, 7) * 0.07 +
    Math.min(asymmetry, 0.24) * 2.5
  );
}

/** Deterministic best-of-four selection; attempt zero preserves old seeds. */
export function resolveQualityStoneRecipe(
  archetype: StoneArchetypeId,
  seed: number,
): StoneRecipe {
  let best = resolveStoneRecipe(archetype, seed);
  let bestScore = scoreStoneShape(best);
  for (let attempt = 1; attempt < ATTEMPTS; attempt += 1) {
    const candidate = resolveStoneRecipe(
      archetype,
      hashStoneCell(seed, attempt, 0x5175616c),
    );
    const candidateScore = scoreStoneShape(candidate);
    if (candidateScore > bestScore) {
      best = candidate;
      bestScore = candidateScore;
    }
  }
  return best;
}
