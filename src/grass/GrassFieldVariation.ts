/**
 * Low-frequency variation shared by every grass LOD.
 *
 * Per-blade randomness alone produces a field that is uniform at any scale
 * larger than a blade: statistically identical everywhere, which is what makes
 * procedural grass read as a carpet rather than as a meadow. These functions
 * add the missing scales — dry patches, vigour bands, and canopy occlusion that
 * vary over metres rather than centimetres.
 *
 * Every LOD must call the same functions with the same world coordinates.
 * Near tiles, mid patches, and the far impostor instances all resolve the same
 * palette, so any macro term applied to one and not the others would show up as
 * a brightness step exactly at an LOD handoff. `verify-lod-color-parity`
 * reproduces the distributions below and bounds that step.
 *
 * These run once per blade at build time and never per frame. A single value
 * noise octave is four hashes; the terrain height sample and matrix compose
 * that surround them in the placement loop each cost considerably more.
 */

/** Metres per lattice cell of the dryness field. */
const DRYNESS_PERIOD = 27;
/** Metres per lattice cell of the vigour field, deliberately not a multiple. */
const VIGOR_PERIOD = 19;
const DRYNESS_SEED = 0x51_7c_c1_b7;
const VIGOR_SEED = 0x27_22_0a_95;

/**
 * How much of a blade's dryness comes from the macro field. Applied identically
 * at every LOD; raising it beyond roughly a quarter starts to push the p95
 * near-to-mid colour delta past the parity budget, because the two LODs draw
 * their remaining per-blade jitter independently.
 */
export const GRASS_MACRO_DRYNESS_STRENGTH = 0.22;

/**
 * Peak canopy occlusion, as a fraction of blade luminance, in the densest and
 * most vigorous parts of the field. This is the ambient term: it darkens whole
 * blades where they stand shoulder to shoulder, and it is what gives a dense
 * field visible depth instead of a flat green sheet. The progress-dependent
 * root darkening in the palette is the other half of the same effect.
 */
const CANOPY_AO_STRENGTH = 0.17;

function hashLattice(x: number, z: number, seed: number): number {
  let value = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

/** Smoothstep-interpolated value noise on a unit lattice, in [0, 1]. */
function valueNoise(x: number, z: number, seed: number): number {
  const cellX = Math.floor(x);
  const cellZ = Math.floor(z);
  const fractionX = x - cellX;
  const fractionZ = z - cellZ;
  const weightX = fractionX * fractionX * (3 - 2 * fractionX);
  const weightZ = fractionZ * fractionZ * (3 - 2 * fractionZ);
  const corner00 = hashLattice(cellX, cellZ, seed);
  const corner10 = hashLattice(cellX + 1, cellZ, seed);
  const corner01 = hashLattice(cellX, cellZ + 1, seed);
  const corner11 = hashLattice(cellX + 1, cellZ + 1, seed);
  const lower = corner00 + (corner10 - corner00) * weightX;
  const upper = corner01 + (corner11 - corner01) * weightX;
  return lower + (upper - lower) * weightZ;
}

/**
 * Two octaves so patches have both a broad shape and a ragged edge. The
 * second octave is halved in weight and normalised back to [0, 1].
 */
function patchNoise(x: number, z: number, period: number, seed: number): number {
  const coarse = valueNoise(x / period, z / period, seed);
  const fine = valueNoise((x * 2.7) / period, (z * 2.7) / period, seed ^ 0x9e3779b9);
  return (coarse + fine * 0.5) / 1.5;
}

/**
 * Broad dry patches, in [0, 1]. Feeds the palette's dryness input on top of the
 * terrain suitability term that was already there, so a well-watered slope can
 * still carry a dry crown and a poor one can stay green in a hollow.
 */
export function sampleGrassMacroDryness(x: number, z: number): number {
  return patchNoise(x, z, DRYNESS_PERIOD, DRYNESS_SEED);
}

/**
 * Growth vigour, in [0, 1]. Drives clump height banding and, with terrain
 * suitability, how strongly the canopy occludes itself.
 */
export function sampleGrassMacroVigor(x: number, z: number): number {
  return patchNoise(x, z, VIGOR_PERIOD, VIGOR_SEED);
}

/**
 * Whole-blade ambient occlusion from the surrounding canopy, as a multiplier on
 * blade luminance. Dense, vigorous grass sits in its own shade; sparse grass on
 * poor ground does not.
 *
 * `suitability` and `vigor` are both in [0, 1], so the result is bounded by
 * `[1 - CANOPY_AO_STRENGTH, 1]` and cannot drive the palette negative.
 */
export function resolveGrassCanopyAo(vigor: number, suitability: number): number {
  return 1 - CANOPY_AO_STRENGTH * vigor * suitability;
}
