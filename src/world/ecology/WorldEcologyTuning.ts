/**
 * Tuning for the ecological field layer.
 *
 * One rule governs how these combine, and it is the reason the fields are
 * multiplied rather than summed. Adding eight roughly-independent terms drives
 * their sum toward its mean by the central limit theorem, so a summed ecology
 * ends up "moderate" almost everywhere and the landscape reads as uniform
 * procedural mush. Limiting factors instead multiply, or take a minimum: the
 * scarcest resource caps growth, which is both how vegetation actually behaves
 * and what preserves the extremes that make a landscape legible.
 */

/** Baseline moisture before any landform, water, or exposure modifier. */
export const ECOLOGY_BASE_RAINFALL = 0.46;

/**
 * Landform gathering. A hollow concentrates what falls on the slopes above it;
 * a spur sheds. Applied as a multiplier on rainfall so the difference between a
 * gully and a ridge survives even far from any mapped water.
 */
export const ECOLOGY_CURVATURE_DRY = 0.55;
export const ECOLOGY_CURVATURE_WET = 1.55;

/**
 * Slope shedding. Steep ground loses water before it can soak in, and this is
 * what keeps a ridge dry even when it stands a short distance from a river:
 * proximity supplies water, slope refuses to hold it.
 */
export const ECOLOGY_SLOPE_SHED = 0.62;

/** Sun-facing ground dries out; sheltered ground stays damp. */
export const ECOLOGY_EXPOSURE_DRY = 0.78;
export const ECOLOGY_EXPOSURE_WET = 1.16;

/** Ambient share of insolation, so a shaded face is dim rather than black. */
export const ECOLOGY_EXPOSURE_AMBIENT = 0.34;

/** Weight of mapped rivers and lakes in the moisture supply. */
export const ECOLOGY_WATER_SUPPLY = 0.72;

/** Slope at which loose material stops resting on the surface. */
export const ECOLOGY_ROCK_SLOPE_START = 0.22;
export const ECOLOGY_ROCK_SLOPE_FULL = 0.62;
/** Convex ground strips its own cover and exposes what is underneath. */
export const ECOLOGY_ROCK_CONVEXITY = 0.42;
/** Fertile, moist ground buries stone under soil and litter. */
export const ECOLOGY_ROCK_SOIL_BURIAL = 0.72;

/**
 * Soil accumulates where material comes to rest: flat, concave, moist ground
 * that nothing keeps scraping bare.
 */
export const ECOLOGY_FERTILITY_MOISTURE_EXPONENT = 0.65;
export const ECOLOGY_FERTILITY_DISTURBANCE = 0.7;
/**
 * Working range of the raw accumulation product, measured across the world.
 * Stretching it here is what stops four mid-range factors multiplying into a
 * uniformly adequate soil everywhere.
 */
export const ECOLOGY_FERTILITY_FLOOR = 0.12;
export const ECOLOGY_FERTILITY_CEILING = 0.62;

/** Altitude band over which alpine thinning takes hold, as a share of the
 * configured grass altitude ceiling. */
export const ECOLOGY_ALPINE_FADE = 0.22;
