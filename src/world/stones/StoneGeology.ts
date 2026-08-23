/**
 * What every stone in one formation inherits from the ground it came out of.
 *
 * A cluster already shared several things by accident of how it was composed:
 * the palette came from the biome, the fracture bearing from the macro strike,
 * the moss level from the local ecology. What it did not share was how far the
 * rock had *weathered*, and that is the loudest of them. Two boulders from one
 * outcrop have stood in the same rain for the same length of time; one crusted
 * pale and one iron-stained beside it reads as two rocks that happened to roll
 * together, however well their palettes match.
 *
 * This is deliberately a small descriptor rather than the full geological
 * fantasy. Fields are here only if something consumes them:
 *
 * - The mineral *pattern* cannot be shared. It is baked into vertex attributes
 *   per pooled variant, and per-cluster patterns would mean per-cluster meshes,
 *   which is the same trap the formation work avoided. What is shared instead
 *   is the weathering *level*, folded per instance at batch build, which is
 *   what the eye reads as "same rock" anyway.
 * - Dip is absent for the same reason. Tilting a fracture to a formation's dip
 *   means clipping geometry per formation; the bearing can be cancelled by yaw
 *   at placement, and the tilt cannot.
 */

import { hashStoneCell } from "./StoneRandom";
import type { StonePaletteKey } from "./StonePalette";

export interface StoneGeologyDescriptor {
  /** The cluster seed every member of this formation derives from. */
  readonly formationSeed: number;
  /** Bearing the formation's joints run on, shared by every member. */
  readonly strike: number;
  readonly paletteKey: StonePaletteKey;
  /**
   * How far this rock has weathered, signed around 0.
   *
   * Negative is fresh, crusted stone; positive is iron-stained and darkened.
   * Applied as a bias on each body's own weathering field rather than
   * replacing it, so members keep their individual banding while agreeing on
   * how old they are.
   */
  readonly weathering: number;
}

const GEOLOGY_WEATHERING_XOR = 0x57746872;

/**
 * How far a formation may sit from the middle of the weathering range.
 *
 * Modest on purpose. The channel it biases already spans crusted to stained
 * across one body, and a formation that pushes past this stops reading as rock
 * that weathered and starts reading as rock that was tinted.
 */
export const STONE_GEOLOGY_WEATHERING_RANGE = 0.16;

export function resolveStoneGeology(
  formationSeed: number,
  strike: number,
  paletteKey: StonePaletteKey,
): StoneGeologyDescriptor {
  const roll =
    hashStoneCell(formationSeed, 0, GEOLOGY_WEATHERING_XOR) / 4294967296;
  return {
    formationSeed,
    strike,
    paletteKey,
    weathering: (roll * 2 - 1) * STONE_GEOLOGY_WEATHERING_RANGE,
  };
}

/** A body's weathering channel, aged by the formation it belongs to. */
export function applyStoneGeologyWeathering(
  weathering: number,
  bias: number,
): number {
  const biased = weathering + bias;
  return biased <= 0 ? 0 : biased >= 1 ? 1 : biased;
}
