import {
  OVERLAP_FOOTPRINT_FACTOR,
  OVERLAP_PADDING,
} from "./StoneClusterTuning";

/** Split pieces nest more tightly than unrelated stones while retaining a readable crack. */
const SPLIT_PADDING_SHARE = 0.35;

/** Root distance that keeps sibling pieces close enough to read as one fractured mass. */
export function resolveSplitHalfDistance(
  anchorFootprint: number,
  splitFootprint: number,
  crackGap: number,
): number {
  return (
    OVERLAP_FOOTPRINT_FACTOR * (anchorFootprint + splitFootprint) +
    OVERLAP_PADDING * SPLIT_PADDING_SHARE +
    crackGap
  );
}
