import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Deterministic checks on the near-grass tuft distribution.
 *
 * The naturalness work replaced a fixed circular clump grammar with per-tuft
 * radius, ellipse, orientation, dominant heading, and a focused morphology
 * profile. This reproduces the stable placement maths and verifies that the
 * production source still consumes the same config-backed contract.
 */

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
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
const profileSource = read("src/world/grass/GrassClusterProfile.ts");
const patchFactorySource = read(
  "src/world/grass/WorldGrassPatchGeometryFactory.ts",
);

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
  planeCoherence: readYamlNumber(
    worldConfigSource,
    "grassClumpPlaneCoherence",
  ),
};

assert(
  factorySource.includes("grassClumpRadiusScaleMin") &&
    factorySource.includes("grassClumpAspectMin") &&
    factorySource.includes("grassClumpRadialExponent") &&
    factorySource.includes("grassClumpDominantDirectionWeight") &&
    factorySource.includes("grassClumpRadialDirectionWeight") &&
    factorySource.includes("resolveGrassClusterProfile(") &&
    factorySource.includes("resolveGrassClusterCoverage(") &&
    factorySource.includes("mixGrassAngle(") &&
    factorySource.includes("this.clusterProfile.leanTowardMax") &&
    factorySource.includes("GRASS_PLACEMENT_VERSION = 14") &&
    factorySource.includes("placement-${GRASS_PLACEMENT_VERSION}"),
  "The tuft distribution must read its shape and morphology from configuration and version its placement cache key.",
);
assert(
  profileSource.includes("GRASS_CLUSTER_TALL_WET") &&
    profileSource.includes("GRASS_CLUSTER_SHORT_DRY") &&
    profileSource.includes("GRASS_CLUSTER_FLATTENED") &&
    profileSource.includes("GRASS_CLUSTER_SPARSE_OPEN") &&
    profileSource.includes("leanTowardMax"),
  "Clump morphology must retain the habitat archetype families and absolute flattened-rest lean control.",
);
assert(
  config.radialExponent >= 0.5 && config.radialExponent <= 0.75,
  `Radial exponent ${config.radialExponent} is outside the configured range.`,
);
assert(
  config.dominantWeight + config.radialWeight <= 0.9,
  "Structured heading weights must leave room for independent randomness.",
);
assert(
  config.planeCoherence > 0 && config.planeCoherence <= 0.5,
  "Blade-plane coherence must be present but must not collapse a tuft into one fan.",
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

const innerHalfRadius = tile.filter((blade) => blade.sampleRadius <= 0.5).length;
const innerShare = innerHalfRadius / tile.length;
assert(
  innerShare <= 0.42,
  `Tuft roots are still centre-concentrated: ${(innerShare * 100).toFixed(
    1,
  )}% inside half the radius (uniform-by-area is 25%, the old rule was 50%).`,
);

function circularSpread(headings) {
  let sumX = 0;
  let sumZ = 0;
  for (const heading of headings) {
    sumX += Math.sin(heading);
    sumZ += Math.cos(heading);
  }
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
    `${(innerShare * 100).toFixed(1)}% inside half-radius, ` +
    `heading spread ${meanClumpSpread.toFixed(3)} per tuft against ` +
    `${fieldSpread.toFixed(3)} across the field, ` +
    `${distinctRadii.size} distinct radii, roots inside ` +
    `${maximumOffset.toFixed(3)} m of their tuft centre, deterministic and ` +
    "consistent across the tile boundary.",
);

function readFactoryNumber(key) {
  const value = Number(
    factorySource.match(new RegExp(`${key}\\s*=\\s*([0-9.]+)`))?.[1],
  );
  if (!Number.isFinite(value)) {
    fail(`WorldSingleBladeTileFactory has no numeric ${key}.`);
  }
  return value;
}

const understoryShare = readYamlNumber(
  worldConfigSource,
  "grassUnderlayerFraction",
);
const accentShare = readYamlNumber(worldConfigSource, "grassAccentBladeShare");
const understoryScale = readYamlNumber(
  worldConfigSource,
  "grassUnderstoryHeightScale",
);
const mainScale = readYamlNumber(worldConfigSource, "grassMainHeightScale");
const accentScale = readYamlNumber(worldConfigSource, "grassAccentHeightScale");
const heightJitter = readYamlNumber(worldConfigSource, "grassBladeHeightJitter");
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
assert(
  mainScale / understoryScale >= 1.5 && accentScale / mainScale >= 1.15,
  `Blade tiers are too close to separate: ${understoryScale}/${mainScale}/${accentScale}.`,
);
assert(
  accentScale <= verticalScaleMax,
  `Accent tier ${accentScale} exceeds the charged vertical ceiling ${verticalScaleMax}.`,
);
const smallestBiomeHeightBand = 0.7;
assert(
  verticalScaleMin <=
    smallestBiomeHeightBand * understoryScale * (1 - heightJitter),
  `Vertical floor ${verticalScaleMin} clamps the understory tier away.`,
);
assert(
  profileSource.includes("resolveGrassClusterProfile") &&
    profileSource.includes("resolveGrassClusterCoverage") &&
    profileSource.includes("drynessScale") &&
    profileSource.includes("leanScale") &&
    profileSource.includes("leanTowardMax") &&
    factorySource.includes("sampleGrassHabitat") &&
    factorySource.includes("resolveGrassClusterArchetype") &&
    factorySource.includes("this.clusterProfile.leanTowardMax") &&
    factorySource.includes("CLUMP_LEAN_SALT") &&
    factorySource.includes("CLUMP_TALL_GROUP_SALT") &&
    factorySource.includes("CLUMP_ASYMMETRY_SALT") &&
    factorySource.includes("CLUMP_HOLE_SALT"),
  "Near blades must derive morphology from shared habitat and stable clump identity.",
);
for (const key of [
  "grassUnderlayerFraction",
  "grassAccentBladeShare",
  "grassUnderstoryHeightScale",
  "grassMainHeightScale",
  "grassAccentHeightScale",
  "grassBladeHeightJitter",
]) {
  assert(
    patchFactorySource.includes(key),
    `Mid/far patch source must retain ${key} for tier parity.`,
  );
}

console.log(
  `[grass-placement] config-backed blade tiers ${understoryScale}/${mainScale}/${accentScale} ` +
    `at baseline shares ${understoryShare}/${(1 - understoryShare - accentShare).toFixed(
      3,
    )}/${accentShare}, jitter ±${heightJitter}, inside vertical scale ` +
    `[${verticalScaleMin}, ${verticalScaleMax}] and shared by mid/far source blades.`,
);
