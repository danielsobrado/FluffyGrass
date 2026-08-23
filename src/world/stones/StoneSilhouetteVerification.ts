import { buildStonePolyhedron } from "./StoneClipper";
import {
  scoreStoneRotationalSymmetry,
  scoreStoneSilhouette,
} from "./StoneSilhouetteQuality";
import { STONE_ARCHETYPE_IDS, type StoneArchetypeId } from "./StoneRecipe";
import { resolveQualityStoneRecipe } from "./StoneShapeQuality";

/** Seeds per family. Enough to describe a population, cheap enough to gate on. */
const SEEDS = 40;

/**
 * Recorded ceilings on how radially periodic each family is allowed to be, on
 * average, after selection.
 *
 * These are measurements with headroom, not targets. Their job is to catch the
 * case the shape scorer cannot: a tuning change that improves one seed while
 * quietly pushing a whole family back toward the lathe. Pebbles sit highest
 * because they carry the fewest sides, and fewest sides is what symmetry is.
 */
const SYMMETRY_CEILING: Readonly<Record<StoneArchetypeId, number>> = {
  pebble: 0.3,
  slab: 0.22,
  block: 0.16,
  boulder: 0.12,
  shard: 0.1,
  outcrop: 0.08,
};

/**
 * A body this periodic reads as turned rather than broken. A handful survive
 * selection because four candidates is not always enough to find a better one,
 * so this budgets them rather than forbidding them.
 */
const SEVERE_SYMMETRY = 0.45;
const SEVERE_SYMMETRY_BUDGET = 0.04;

/** Floor on the population's mean silhouette score, from the same recording. */
const SILHOUETTE_FLOOR = -0.2;

function fail(message: string): never {
  throw new Error(`[stone-silhouette] ${message}`);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    fail(message);
  }
}

/**
 * Population contract for the two screen-space shape metrics.
 *
 * Per-seed scoring already runs inside selection; what it cannot see is the
 * shape of the whole distribution, which is where this kind of tuning usually
 * goes wrong -- one family drifts while the seeds anyone is looking at stay
 * fine.
 */
export function verifyStoneSilhouetteQuality(): string {
  let silhouetteTotal = 0;
  let bodies = 0;
  let severe = 0;

  for (const archetype of STONE_ARCHETYPE_IDS) {
    let symmetryTotal = 0;
    for (let variant = 0; variant < SEEDS; variant += 1) {
      const seed = (variant * 2654435761 + archetype.length * 97) >>> 0;
      const faces = buildStonePolyhedron(
        resolveQualityStoneRecipe(archetype, seed),
        false,
      );
      const symmetry = scoreStoneRotationalSymmetry(faces);
      symmetryTotal += symmetry;
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

  return `silhouette ${silhouette.toFixed(3)} · ${severe}/${bodies} periodic`;
}
