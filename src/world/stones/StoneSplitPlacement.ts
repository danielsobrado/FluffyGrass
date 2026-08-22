import {
  OVERLAP_FOOTPRINT_FACTOR,
  OVERLAP_PADDING,
} from "./StoneClusterTuning";

/** Root distance that preserves the normal footprint overlap contract plus a crack gap. */
export function resolveSplitHalfDistance(
  anchorFootprint: number,
  splitFootprint: number,
  crackGap: number,
): number {
  return (
    OVERLAP_FOOTPRINT_FACTOR * (anchorFootprint + splitFootprint) +
    OVERLAP_PADDING +
    crackGap
  );
}
