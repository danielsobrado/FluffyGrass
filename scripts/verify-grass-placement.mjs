import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Deterministic checks on the near-grass tuft distribution.
 *
 * The naturalness work replaced a fixed circular clump grammar with per-tuft
 * radius, ellipse, orientation, and dominant heading. None of that is visible to
 * a type checker and all of it is easy to regress into either extreme: back to
 * one repeated starburst, or forward into uniform white noise that no longer
 * reads as tufts at all. This reproduces the placement rules against the shipped
 * configuration and bounds both ends.
 *
 * It reproduces the sampling maths rather than importing the factory, which
 * needs three and a terrain field. The expressions below are asserted to still
 * exist in the factory source, so a divergence fails rather than passing
 * silently against a stale copy.
 *
 * One deliberate difference: the factory draws a blade's independent heading
 * only for roots that survive the terrain masks, while this draws one per cell
 * because it has no terrain. The random *stream* therefore diverges from a real
 * tile — the distributions this checks do not, which is what the histograms
 * below are about. The determinism check compares two runs of this generator,
 * so it verifies the rules are pure and seed-driven, not that a particular tile
 * matches a golden buffer.
 */

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function fail(message) {
  throw new Error(`[grass-placement] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function readYamlNumber(source, key) {
  const value = Number(
    source.match(new RegExp(`^${key}:\\s*([0-9.-]+)$`, "m"))?.[1],
  );
  if (!Number.isFinite(value)) {
    fail(`Unable to read ${key}.`);
  }
  return value;
}

const worldConfigSource = read("public/config/world.yaml");
const factorySource = read("src/world/grass/WorldSingleBladeTileFactory.ts");

const config = {
  seed: readYamlNumber(worldConfigSource, "seed"),
  radiusMin: readYamlNumber(worldConfigSource, "grassClumpRadiusScaleMin"),
  radiusMax: readYamlNumber(worldConfigSource, "grassClumpRadiusScaleMax"),
  aspectMin: readYamlNumber(worldConfigSource, "grassClumpAspectMin"),
  aspectMax: readYamlNumber(worldConfigSource, "grassClumpAspectMax"),
  radialExponent: readYamlNumber(worldConfigSource, "grassClumpRadialExponent"),
  dominantWeight: readYamlNumber(
    worldConfigSource,
    "grassClumpDominantDirectionWeight",
  ),
  radialWeight: readYamlNumber(
    worldConfigSource,
    "grassClumpRadialDirectionWeight",
  ),
};

// The configuration the shipped factory actually consumes. Repeating the
// expressions here would be worthless if the factory stopped using them.
assert(
  factorySource.includes("grassClumpRadiusScaleMin") &&
    factorySource.includes("grassClumpAspectMin") &&
    factorySource.includes("grassClumpRadialExponent") &&
    factorySource.includes("grassClumpDominantDirectionWeight") &&
    factorySource.includes("grassClumpRadialDirectionWeight") &&
    factorySource.includes("Math.pow(") &&
    factorySource.includes("GRASS_PLACEMENT_VERSION") &&
    factorySource.includes("placement-${GRASS_PLACEMENT_VERSION}"),
  "The tuft distribution must read its shape from configuration and version the placement cache key.",
);
// The old distribution is exactly `Math.pow(u, 1)`; the gate would pass against
// it if the exponent were ever widened back to 1.
assert(
  config.radialExponent >= 0.5 && config.radialExponent <= 0.75,
  `Radial exponent ${config.radialExponent} is outside the configured range.`,
);
assert(
  config.dominantWeight + config.radialWeight <= 0.9,
  "Structured heading weights must leave room for independent randomness.",
);

const TWO_PI = Math.PI * 2;
const CLUMP_CELLS = 3;
const CLUMP_CENTER_JITTER = 0.15;

function hash(x, z, seed) {
  let value = Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

function clumpValue(clumpX, clumpZ, salt) {
  return hash(clumpX, clumpZ, (config.seed ^ salt) >>> 0) / 4294967296;
}

/** The factory's SeededRandom, reproduced bit for bit. */
class SeededRandom {
  constructor(seed) {
    this.state = seed >>> 0;
  }

  next() {
    this.state += 0x6d2b79f5;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  range(minimum, maximum) {
    return minimum + (maximum - minimum) * this.next();
  }
}

const RADIUS_SALT = 0x5b;
const ASPECT_SALT = 0x6d;
const ELLIPSE_ANGLE_SALT = 0x7f;
const DIRECTION_SALT = 0x91;

function resolveClump(clumpColumn, clumpRow) {
  return {
    radiusScale:
      config.radiusMin +
      (config.radiusMax - config.radiusMin) *
        clumpValue(clumpColumn, clumpRow, RADIUS_SALT),
    aspect:
      config.aspectMin +
      (config.aspectMax - config.aspectMin) *
        clumpValue(clumpColumn, clumpRow, ASPECT_SALT),
    ellipseAngle:
      clumpValue(clumpColumn, clumpRow, ELLIPSE_ANGLE_SALT) * TWO_PI,
    dominantAngle: clumpValue(clumpColumn, clumpRow, DIRECTION_SALT) * TWO_PI,
  };
}

/**
 * Generates one tile's placements. `cellSpan` is the tile's cell size, which is
 * the only thing the tile geometry contributes to the tuft maths.
 */
function generateTile(tileX, tileZ, columns, rows, cellSpan, seedSalt) {
  const random = new SeededRandom(hash(tileX, tileZ, config.seed ^ seedSalt));
  const placements = [];
  for (let index = 0; index < columns * rows; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const globalColumn = tileX * columns + column;
    const globalRow = tileZ * rows + row;
    const clumpColumn = Math.floor(globalColumn / CLUMP_CELLS);
    const clumpRow = Math.floor(globalRow / CLUMP_CELLS);
    const clump = resolveClump(clumpColumn, clumpRow);
    const clumpSpan = cellSpan * CLUMP_CELLS;
    const clumpCenterX =
      (clumpColumn + 0.5) * clumpSpan +
      (clumpValue(clumpColumn, clumpRow, 0x1f) - 0.5) *
        2 *
        CLUMP_CENTER_JITTER *
        clumpSpan;
    const clumpCenterZ =
      (clumpRow + 0.5) * clumpSpan +
      (clumpValue(clumpColumn, clumpRow, 0x2b) - 0.5) *
        2 *
        CLUMP_CENTER_JITTER *
        clumpSpan;

    const sampleAngle = random.range(0, TWO_PI);
    const sampleRadius = Math.pow(random.next(), config.radialExponent);
    const ellipseX =
      Math.cos(sampleAngle) *
      sampleRadius *
      clump.radiusScale *
      clumpSpan *
      clump.aspect;
    const ellipseZ =
      (Math.sin(sampleAngle) * sampleRadius * clump.radiusScale * clumpSpan) /
      clump.aspect;
    const ellipseCos = Math.cos(clump.ellipseAngle);
    const ellipseSin = Math.sin(clump.ellipseAngle);
    const offsetX = ellipseX * ellipseCos - ellipseZ * ellipseSin;
    const offsetZ = ellipseX * ellipseSin + ellipseZ * ellipseCos;

    const radialLength = Math.hypot(offsetX, offsetZ);
    const dominantX = Math.sin(clump.dominantAngle);
    const dominantZ = Math.cos(clump.dominantAngle);
    const radialX = radialLength > 1e-4 ? offsetX / radialLength : dominantX;
    const radialZ = radialLength > 1e-4 ? offsetZ / radialLength : dominantZ;
    const independentAngle = random.range(0, TWO_PI);
    const independentWeight = 1 - config.dominantWeight - config.radialWeight;
    const headingX =
      dominantX * config.dominantWeight +
      radialX * config.radialWeight +
      Math.sin(independentAngle) * independentWeight;
    const headingZ =
      dominantZ * config.dominantWeight +
      radialZ * config.radialWeight +
      Math.cos(independentAngle) * independentWeight;
    const heading =
      Math.hypot(headingX, headingZ) > 1e-4
        ? Math.atan2(headingX, headingZ)
        : clump.dominantAngle;

    placements.push({
      x: clumpCenterX + offsetX,
      z: clumpCenterZ + offsetZ,
      offsetX,
      offsetZ,
      heading,
      clumpColumn,
      clumpRow,
      clump,
      radiusScale: clump.radiusScale,
      aspect: clump.aspect,
      clumpSpan,
      sampleRadius,
    });
  }
  return placements;
}

const columns = 68;
const rows = 68;
const cellSpan = 8 / columns;
const seedSalt = 0x6a09e667;
const tile = generateTile(0, 0, columns, rows, cellSpan, seedSalt);
const repeat = generateTile(0, 0, columns, rows, cellSpan, seedSalt);

// 1. Determinism: same seed, same tile, same buffers.
assert(
  tile.length === repeat.length &&
    tile.every(
      (blade, index) =>
        blade.x === repeat[index].x &&
        blade.z === repeat[index].z &&
        blade.heading === repeat[index].heading,
    ),
  "The same seed and tile must produce identical placement values.",
);

// 2. Cross-tile agreement: a tuft straddling a tile edge must resolve the same
// parameters from both sides, or a seam appears exactly on the boundary.
const neighbour = generateTile(1, 0, columns, rows, cellSpan, seedSalt);
const sharedClumps = new Map();
for (const blade of tile) {
  sharedClumps.set(`${blade.clumpColumn}:${blade.clumpRow}`, blade.clump);
}
let sharedChecked = 0;
for (const blade of neighbour) {
  const shared = sharedClumps.get(`${blade.clumpColumn}:${blade.clumpRow}`);
  if (!shared) {
    continue;
  }
  sharedChecked += 1;
  assert(
    shared.radiusScale === blade.clump.radiusScale &&
      shared.aspect === blade.clump.aspect &&
      shared.ellipseAngle === blade.clump.ellipseAngle &&
      shared.dominantAngle === blade.clump.dominantAngle,
    "Adjacent tiles disagree about a shared tuft's parameters.",
  );
}
assert(
  sharedChecked > 0,
  "The cross-tile check found no shared tuft; the fixture is not exercising it.",
);

// 3. Every root stays inside the configured maximum ellipse, which is what the
// height-lattice margin is sized from.
const longestAxis = Math.max(config.aspectMax, 1 / config.aspectMin);
const maximumOffset =
  config.radiusMax * CLUMP_CELLS * cellSpan * longestAxis + 1e-9;
for (const blade of tile) {
  assert(
    Math.hypot(blade.offsetX, blade.offsetZ) <= maximumOffset,
    `A root left the configured tuft ellipse: ${Math.hypot(
      blade.offsetX,
      blade.offsetZ,
    ).toFixed(4)} m against ${maximumOffset.toFixed(4)} m.`,
  );
}

// 4. Radius histogram: the old `u^1` sample put roughly half of every tuft
// inside a quarter of its area. Area-uniform sampling puts a quarter there.
// Anything at or above the old concentration is a regression.
const innerHalfRadius = tile.filter((blade) => blade.sampleRadius <= 0.5).length;
const innerShare = innerHalfRadius / tile.length;
assert(
  innerShare <= 0.42,
  `Tuft roots are still centre-concentrated: ${(innerShare * 100).toFixed(
    1,
  )}% inside half the radius (uniform-by-area is 25%, the old rule was 50%).`,
);

// 5. Direction histogram: local coherence without global alignment. Headings
// inside one tuft must be tighter than headings across the field, and neither
// may collapse to a single direction.
function circularSpread(headings) {
  let sumX = 0;
  let sumZ = 0;
  for (const heading of headings) {
    sumX += Math.sin(heading);
    sumZ += Math.cos(heading);
  }
  // 0 = perfectly aligned, 1 = uniformly spread.
  return 1 - Math.hypot(sumX, sumZ) / headings.length;
}

const perClump = new Map();
for (const blade of tile) {
  const key = `${blade.clumpColumn}:${blade.clumpRow}`;
  const list = perClump.get(key) ?? [];
  list.push(blade.heading);
  perClump.set(key, list);
}
const clumpSpreads = [...perClump.values()]
  .filter((list) => list.length >= 6)
  .map(circularSpread);
const meanClumpSpread =
  clumpSpreads.reduce((sum, value) => sum + value, 0) / clumpSpreads.length;
const fieldSpread = circularSpread(tile.map((blade) => blade.heading));
assert(
  meanClumpSpread < fieldSpread - 0.15,
  `Tufts have lost their local heading coherence: clump spread ${meanClumpSpread.toFixed(
    3,
  )} against field ${fieldSpread.toFixed(3)}.`,
);
assert(
  meanClumpSpread > 0.05,
  "Every blade in a tuft points the same way; the independent term is missing.",
);
assert(
  fieldSpread > 0.9,
  `The field has a global heading bias: spread ${fieldSpread.toFixed(3)}.`,
);

// 6. Tufts must not all be the same shape any more. The old grammar had one
// radius and one circle for every clump in the world.
const distinctRadii = new Set(
  [...perClump.keys()].map((key) => {
    const [column, row] = key.split(":").map(Number);
    return resolveClump(column, row).radiusScale;
  }),
);
const distinctAspects = new Set(
  [...perClump.keys()].map((key) => {
    const [column, row] = key.split(":").map(Number);
    return resolveClump(column, row).aspect;
  }),
);
assert(
  distinctRadii.size > perClump.size * 0.9 &&
    distinctAspects.size > perClump.size * 0.9,
  "Tufts are not drawing distinct radii and ellipses from their coordinates.",
);

console.log(
  `[grass-placement] ${tile.length} roots over ${perClump.size} tufts: ` +
    `${(innerShare * 100).toFixed(1)}% inside half-radius (was ~50%), ` +
    `heading spread ${meanClumpSpread.toFixed(3)} per tuft against ` +
    `${fieldSpread.toFixed(3)} across the field, ` +
    `${distinctRadii.size} distinct radii, roots inside ` +
    `${maximumOffset.toFixed(3)} m of their tuft centre, deterministic and ` +
    "consistent across the tile boundary.",
);

// --- Blade height tiers ---------------------------------------------------
//
// A canopy reads as a volume because it is several populations at once: a short
// understory filling the gaps, a main tier, and occasional long blades breaking
// the top line. Collapsing that back to one distribution is an easy and
// invisible regression — the blade count does not change, so nothing else here
// would notice. These reproduce the tier arithmetic against the shipped source.

function readFactoryNumber(key) {
  const value = Number(
    factorySource.match(new RegExp(`${key}\\s*=\\s*([0-9.]+)`))?.[1],
  );
  if (!Number.isFinite(value)) {
    fail(`WorldSingleBladeTileFactory has no numeric ${key}.`);
  }
  return value;
}

const understoryShare = readFactoryNumber("BLADE_TIER_UNDERSTORY_SHARE");
const accentShare = readFactoryNumber("BLADE_TIER_ACCENT_SHARE");
const understoryScale = readFactoryNumber("BLADE_TIER_UNDERSTORY_SCALE");
const mainScale = readFactoryNumber("BLADE_TIER_MAIN_SCALE");
const accentScale = readFactoryNumber("BLADE_TIER_ACCENT_SCALE");
const verticalScaleMax = readFactoryNumber("INSTANCE_VERTICAL_SCALE_MAX");
const verticalScaleMin = readFactoryNumber("INSTANCE_VERTICAL_SCALE_MIN");

assert(
  understoryShare > 0 && accentShare > 0 && understoryShare + accentShare < 1,
  `Blade tier shares must leave a main tier: ${understoryShare} + ${accentShare}.`,
);
assert(
  understoryScale < mainScale && mainScale < accentScale,
  "Blade tiers must be ordered understory < main < accent.",
);
// The whole point of the understory is that it is short enough to sit *under*
// the main tier rather than beside it. Two tiers a few percent apart would cost
// the same and produce one visual population.
assert(
  mainScale / understoryScale >= 1.5 && accentScale / mainScale >= 1.15,
  `Blade tiers are too close to separate: ${understoryScale}/${mainScale}/${accentScale}.`,
);
// The reserved bounds charge INSTANCE_VERTICAL_SCALE_MAX. An accent tier above
// it would not overrun the box — the clamp catches it — but every tall tuft
// would saturate to exactly the ceiling and the tier would stop varying.
assert(
  accentScale <= verticalScaleMax,
  `Accent tier ${accentScale} exceeds the charged vertical ceiling ${verticalScaleMax}.`,
);
// The floor has to admit the understory or the tier is silently clamped away.
const smallestBiomeHeightBand = 0.7;
assert(
  verticalScaleMin <= smallestBiomeHeightBand * understoryScale,
  `Vertical floor ${verticalScaleMin} clamps the understory tier away.`,
);
assert(
  factorySource.includes("sampleGrassHabitat") &&
    factorySource.includes("resolveGrassClusterArchetype") &&
    factorySource.includes("CLUMP_LEAN_SALT") &&
    factorySource.includes("habitatSample.dryness") &&
    factorySource.includes("GRASS_CLUSTER_TALL_WET") &&
    factorySource.includes("CLUMP_TALL_GROUP_SALT") &&
    factorySource.includes("CLUMP_ASYMMETRY_SALT") &&
    factorySource.includes("CLUMP_HOLE_SALT"),
  "Near blades must derive habitat, cluster archetypes, and correlated lean from shared clump identity.",
);

console.log(
  `[grass-placement] blade tiers ${understoryScale}/${mainScale}/${accentScale} ` +
    `at ${understoryShare}/${(1 - understoryShare - accentShare).toFixed(2)}/${accentShare} ` +
    `shares, inside vertical scale [${verticalScaleMin}, ${verticalScaleMax}].`,
);
