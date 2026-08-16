import {
  OVERLAP_FOOTPRINT_FACTOR,
  OVERLAP_PADDING,
  SPLIT_GAP_MAX,
  SPLIT_GAP_MIN,
} from "./StoneClusterTuning";
import { resolveSplitHalfDistance } from "./StoneSplitPlacement";

const EPSILON = 1e-9;

function fail(message: string): never {
  throw new Error(`[stone-splits] ${message}`);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    fail(message);
  }
}

/** Deterministic contract that split roots cannot interpenetrate their anchor footprint. */
export function verifyStoneSplitPlacement(): string {
  const footprintPairs: readonly (readonly [number, number])[] = [
    [0.2, 0.15],
    [1, 0.92],
    [3, 2.76],
  ];
  for (const [anchorFootprint, splitFootprint] of footprintPairs) {
    const contactDistance =
      OVERLAP_FOOTPRINT_FACTOR * (anchorFootprint + splitFootprint) +
      OVERLAP_PADDING;
    for (const crackGap of [SPLIT_GAP_MIN, SPLIT_GAP_MAX]) {
      const distance = resolveSplitHalfDistance(
        anchorFootprint,
        splitFootprint,
        crackGap,
      );
      assert(
        distance + EPSILON >= contactDistance + crackGap,
        `Split distance ${distance} overlaps ${anchorFootprint}/${splitFootprint}.`,
      );
    }
  }
  return "footprint-safe split gaps";
}
