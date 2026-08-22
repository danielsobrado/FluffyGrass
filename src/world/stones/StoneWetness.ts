import type { HydrologySample } from "../hydrology/HydrologyField";

/**
 * How wet a stone is, and how far up its body the water reaches.
 *
 * Wet rock is the one surface in this world that Lambert alone cannot state.
 * Everything else the stones do — value bands, cavity, bevel highlights, moss —
 * is diffuse, and a diffuse-only stone at a river's edge reads exactly like the
 * same stone in a dry meadow. What separates them in life is gloss: a film of
 * water on stone throws a narrow highlight that dry stone never has, and it
 * darkens the albedo underneath it at the same time. Darkening alone produces a
 * muddy stone, not a wet one; the sheen alone produces a polished dry one. Both
 * together, in a band that ends at a waterline, is the whole effect.
 *
 * The band is deliberately cut from the same signal the terrain wet band uses
 * (`waterProximity`, top of the ramp only). A stone standing in a river and the
 * mud it stands in must agree about where the water is, or the shoreline
 * acquires two different edges.
 */

export interface StoneWetness {
  /** Peak wetness of this body: 0 dry, 1 running with water. */
  readonly strength: number;
  /** World height up to which the body is wetted. */
  readonly topY: number;
}

export const STONE_WETNESS_DRY: StoneWetness = Object.freeze({
  strength: 0,
  topY: 0,
});

/**
 * Where the terrain's own wet band begins. `waterProximity` is a humidity halo
 * reaching tens of metres, which is right for deciding what grows and far too
 * wide for what glistens; only the top of that ramp is ground the water has
 * actually touched.
 */
const SHORE_PROXIMITY_START = 0.94;
/** Spray carries further than splash, so it opens earlier on the same ramp. */
const SPRAY_PROXIMITY_START = 0.86;
/** Metres of splash above the waterline on a stone at the bank. */
const SPLASH_HEIGHT = 0.34;
/** A fall of this drop soaks everything around its plunge pool. */
const SPRAY_REFERENCE_DROP = 3;
/** Extra metres of body the spray of a full-sized fall keeps wet. */
const SPRAY_CLIMB = 1.6;
/** Vertical softness of the waterline itself. */
const WATERLINE_BAND = 0.18;

function smoothstep(value: number, minimum: number, maximum: number): number {
  if (value <= minimum) return 0;
  if (value >= maximum) return 1;
  const amount = (value - minimum) / (maximum - minimum);
  return amount * amount * (3 - 2 * amount);
}

function clamp01(value: number): number {
  return value <= 0 ? 0 : value >= 1 ? 1 : value;
}

/**
 * Resolve one stone's wetness from the hydrology under it.
 *
 * `waterLevel` is only trusted where there is water to have a level: away from
 * a channel it describes a surface that is not being drawn, and reading it
 * there would hang a waterline in dry grass.
 */
export function resolveStoneWetness(
  hydrology: HydrologySample,
  groundHeight: number,
): StoneWetness {
  const shore = smoothstep(hydrology.waterProximity, SHORE_PROXIMITY_START, 1);
  const spray =
    smoothstep(hydrology.waterProximity, SPRAY_PROXIMITY_START, 1) *
    clamp01(hydrology.riverFallDrop / SPRAY_REFERENCE_DROP);
  const strength = clamp01(Math.max(shore, spray));
  if (strength <= 0) {
    return STONE_WETNESS_DRY;
  }
  const surface =
    hydrology.waterCoverage > 0 || shore > 0
      ? Math.max(groundHeight, hydrology.waterLevel)
      : groundHeight;
  return {
    strength,
    topY: surface + SPLASH_HEIGHT + spray * SPRAY_CLIMB,
  };
}

/**
 * Wetness at one vertex, baked at batch build so the fragment shader pays
 * nothing for the waterline. Water does not climb, so this is a hard-edged
 * function of world height softened by a hand's width of capillary rise.
 */
export function resolveStoneVertexWetness(
  wetness: StoneWetness,
  worldY: number,
): number {
  if (wetness.strength <= 0) {
    return 0;
  }
  return (
    wetness.strength *
    (1 - smoothstep(worldY, wetness.topY - WATERLINE_BAND, wetness.topY))
  );
}
