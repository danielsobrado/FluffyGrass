/** Sparse dressing for the meadow: trees and a few walkers. */

export const TREE_CELL_SIZE = 22;
export const TREE_DESKTOP_RADIUS = 96;
export const TREE_COMPACT_RADIUS = 52;
export const TREE_OCCUPANCY = 0.28;
export const TREE_MIN_FERTILITY = 0.22;
export const TREE_MAX_FERTILITY = 0.72;
export const TREE_MIN_MOISTURE = 0.28;
export const TREE_MAX_ROCKINESS = 0.55;
export const TREE_MIN_NORMAL_Y = 0.78;
export const TREE_MAX_WATER_COVERAGE = 0.04;
export const TREE_REBUILD_STEP = 8;

/**
 * Herd placement. Cells are large and sparse because deer arrive in groups:
 * these thresholds decide where a group lives, not where each animal stands.
 */
/**
 * Small enough that there is nearly always a herd within sight.
 *
 * A wider lattice reads better on paper — real herds are far apart — but with a
 * capped pool of animals it put the nearest deer 30 to 80 metres away, which in
 * rolling ground means the player walks past a "populated" meadow and never sees
 * an animal. Density here plus nearest-first recycling is what actually puts
 * deer in frame.
 */
export const HERD_CELL_SIZE = 38;
export const HERD_OCCUPANCY = 0.4;
export const HERD_MIN_NORMAL_Y = 0.76;
export const HERD_MAX_WATER_COVERAGE = 0.03;
export const HERD_MIN_GRASS_MASK = 0.8;
export const HERD_MIN_FERTILITY = 0.25;
export const HERD_MAX_ROCKINESS = 0.5;

/** How far the focus moves before the herd roster is recollected. */
export const FAUNA_REBUILD_STEP = 16;
/** Nothing may be recycled into view: animals appear at least this far away. */
export const FAUNA_SPAWN_MIN_PLAYER_DISTANCE = 16;
/** Extra margin past the cull distance before an actor is recycled. */
export const FAUNA_RETIRE_MARGIN = 25;
/** How close the player must be before a deer reacts, as a share of the cull distance. */
export const FAUNA_ALERT_RADIUS = 12;
export const FAUNA_FLEE_RADIUS = 6;
/** A fawn is a little over half the size of an adult. */
export const FAUNA_FAWN_SCALE = 0.62;
/** Dead band around every animation-quality threshold. */
export const FAUNA_QUALITY_HYSTERESIS = 4;
/** How far a villager's errands take them from the settlement they belong to. */
export const FAUNA_VILLAGER_ROUTE_RADIUS = 11;
