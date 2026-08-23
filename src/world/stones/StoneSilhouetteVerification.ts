import { buildStonePolyhedron, type StonePolygon, type StoneVec3 } from "./StoneClipper";
import {
  measureStoneSilhouetteComplexity,
  scoreStoneRotationalSymmetry,
  scoreStoneSilhouette,
} from "./StoneSilhouetteQuality";
import {
  STONE_ARCHETYPE_IDS,
  resolveStoneRecipe,
  type StoneArchetypeId,
  type StoneRecipe,
} from "./StoneRecipe";
import { resolveQualityStoneRecipe, scoreStoneShape } from "./StoneShapeQuality";

/** Seeds per family. Enough to describe a population, cheap enough to gate on. */
const SEEDS = 40;

/**
 * Recorded ceilings on how radially periodic each family is allowed to be, on
 * average, after selection.
 */
const SYMMETRY_CEILING: Readonly<Record<StoneArchetypeId, number>> = {
  pebble: 0.3,
  slab: 0.22,
  block: 0.16,
  boulder: 0.12,
  shard: 0.1,
  outcrop: 0.08,
};

const SEVERE_SYMMETRY = 0.45;
const SEVERE_SYMMETRY_BUDGET = 0.04;
const SILHOUETTE_FLOOR = -0.2;
/** Prevent best-of-N selection from collapsing stones into a few ruler-long runs. */
const MEANINGFUL_CORNER_FLOOR = 5.5;
const TRANSFORM_SCORE_EPSILON = 1e-4;

function fail(message: string): never {
  throw new Error(`[stone-silhouette] ${message}`);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) fail(message);
}

/** Mirrors the post-clip transform in generateStoneMesh. */
function shippedBody(recipe: StoneRecipe): StonePolygon[] {
  const body = buildStonePolyhedron(recipe, false);
  const seen = new Set<StoneVec3>();
  for (const polygon of body) {
    for (const point of polygon.points) {
      if (seen.has(point)) continue;
      seen.add(point);
      const shearedX = point.x + recipe.leanX * point.y;
      const shearedZ = point.z + recipe.leanZ * point.y;
      point.x = recipe.width * shearedX;
      point.y = recipe.height * point.y;
      point.z = recipe.depth * shearedZ;
    }
  }
  return body;
}

/** Regression for the scorer bug where post-clip transforms were invisible. */
function verifyPostClipTransformAffectsScore(): void {
  const base = resolveStoneRecipe("boulder", 0x51f0e5);
  const transformed: StoneRecipe = {
    ...base,
    height: base.height * 0.68,
    depth: base.depth * 1.24,
    leanX: base.leanX + 0.21,
    leanZ: base.leanZ - 0.13,
  };
  const delta = Math.abs(scoreStoneShape(transformed) - scoreStoneShape(base));
  assert(
    delta > TRANSFORM_SCORE_EPSILON,
    "Stone quality scoring ignored the post-clip anisotropic scale/shear transform.",
  );
}

/** Population contract plus diagnostics for outline complexity. */
export function verifyStoneSilhouetteQuality(): string {
  verifyPostClipTransformAffectsScore();

  let silhouetteTotal = 0;
  let rawCornerTotal = 0;
  let meaningfulCornerTotal = 0;
  let maximumMeaningfulCorners = 0;
  let bodies = 0;
  let severe = 0;

  for (const archetype of STONE_ARCHETYPE_IDS) {
    let symmetryTotal = 0;
    for (let variant = 0; variant < SEEDS; variant += 1) {
      const seed = (variant * 2654435761 + archetype.length * 97) >>> 0;
      const faces = shippedBody(resolveQualityStoneRecipe(archetype, seed));
      const symmetry = scoreStoneRotationalSymmetry(faces);
      const complexity = measureStoneSilhouetteComplexity(faces);
      symmetryTotal += symmetry;
      rawCornerTotal += complexity.meanRawCorners;
      meaningfulCornerTotal += complexity.meanMeaningfulCorners;
      maximumMeaningfulCorners = Math.max(
        maximumMeaningfulCorners,
        complexity.maximumMeaningfulCorners,
      );
      if (symmetry > SEVERE_SYMMETRY) severe += 1;
      silhouetteTotal += scoreStoneSilhouette(faces);
      bodies += 1;
    }
    const mean = symmetryTotal / SEEDS;
    assert(
      mean <= SYMMETRY_CEILING[archetype],
      `${archetype} averages ${mean.toFixed(3)} rotational symmetry, over its ${SYMMETRY_CEILING[archetype]} ceiling.`,
    );
  }

  const silhouette = silhouetteTotal / bodies;
  assert(
    silhouette >= SILHOUETTE_FLOOR,
    `Population silhouette score fell to ${silhouette.toFixed(3)}, under the ${SILHOUETTE_FLOOR} floor.`,
  );
  const severeShare = severe / bodies;
  assert(
    severeShare <= SEVERE_SYMMETRY_BUDGET,
    `${severe}/${bodies} bodies are severely periodic, over the ${(SEVERE_SYMMETRY_BUDGET * 100).toFixed(0)}% budget.`,
  );
  const meanMeaningfulCorners = meaningfulCornerTotal / bodies;
  assert(
    meanMeaningfulCorners >= MEANINGFUL_CORNER_FLOOR,
    `Population meaningful silhouette corners fell to ${meanMeaningfulCorners.toFixed(2)}, under the ${MEANINGFUL_CORNER_FLOOR} floor.`,
  );

  return (
    `silhouette ${silhouette.toFixed(3)} · ${severe}/${bodies} periodic · ` +
    `corners ${(rawCornerTotal / bodies).toFixed(1)}→${meanMeaningfulCorners.toFixed(1)} (max ${maximumMeaningfulCorners}) · transformed-body guard`
  );
}
