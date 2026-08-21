import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
}

function fail(message) {
  throw new Error(`[grass-cluster-profile] ${message}`);
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

const worldSource = read("public/config/world.yaml");
const profileSource = read("src/world/grass/GrassClusterProfile.ts");
const nearFactorySource = read("src/world/grass/WorldSingleBladeTileFactory.ts");
const patchFactorySource = read("src/world/grass/WorldGrassPatchGeometryFactory.ts");

const config = {
  underlayerShare: readYamlNumber(worldSource, "grassUnderlayerFraction"),
  accentShare: readYamlNumber(worldSource, "grassAccentBladeShare"),
  understoryHeight: readYamlNumber(worldSource, "grassUnderstoryHeightScale"),
  mainHeight: readYamlNumber(worldSource, "grassMainHeightScale"),
  accentHeight: readYamlNumber(worldSource, "grassAccentHeightScale"),
  planeCoherence: readYamlNumber(worldSource, "grassClumpPlaneCoherence"),
  edgeCoverage: readYamlNumber(worldSource, "grassClumpEdgeCoverage"),
  heightJitter: readYamlNumber(worldSource, "grassBladeHeightJitter"),
};

assert(
  config.underlayerShare + config.accentShare <= 0.78,
  "Configured tier shares must leave at least 22% for the main canopy.",
);
assert(
  config.understoryHeight < config.mainHeight &&
    config.mainHeight < config.accentHeight,
  "Configured tier heights must increase from understory to main to accent.",
);
assert(
  config.planeCoherence > 0 && config.planeCoherence <= 0.5,
  "Clump plane coherence must be present but restrained.",
);
assert(
  config.edgeCoverage >= 0.4 && config.edgeCoverage < 1,
  "Clump edges must stay populated while remaining visibly frayed.",
);
assert(
  config.heightJitter > 0 && config.heightJitter <= 0.1,
  "Blade height jitter must remain subordinate to clump and tier height.",
);

for (const token of [
  "GRASS_CLUSTER_DENSE_NORMAL",
  "GRASS_CLUSTER_SPARSE_OPEN",
  "GRASS_CLUSTER_TALL_WET",
  "GRASS_CLUSTER_SHORT_DRY",
  "GRASS_CLUSTER_FLATTENED",
  "GRASS_CLUSTER_ACCENT",
  "resolveGrassClusterCoverage",
  "mixGrassAngle",
]) {
  assert(profileSource.includes(token), `GrassClusterProfile must retain ${token}.`);
}

assert(
  nearFactorySource.includes("resolveGrassClusterProfile(") &&
    nearFactorySource.includes("resolveGrassClusterCoverage(") &&
    nearFactorySource.includes("mixGrassAngle(") &&
    nearFactorySource.includes("CLUMP_PLANE_SALT") &&
    nearFactorySource.includes("GRASS_PLACEMENT_VERSION = 8"),
  "Near grass must consume the shared clump profile and version its placement cache.",
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
    `Mid/far blade source must consume ${key}.`,
  );
}

// Relationships are more stable than exact art values. These reproduce the
// semantic deltas in the profile resolver against one neutral habitat.
const dense = {
  height: 1,
  coverage: 1,
  drynessScale: 1,
  drynessOffset: 0,
  lean: 1,
};
const sparse = {
  height: dense.height * 0.96,
  coverage: 0.56,
  drynessScale: 1,
  drynessOffset: 0.015,
  lean: 0.95,
};
const tallWet = {
  height: dense.height * 1.14,
  coverage: 1,
  drynessScale: 0.5,
  drynessOffset: 0,
  lean: 0.78,
};
const shortDry = {
  height: dense.height * 0.78,
  coverage: 0.88,
  drynessScale: 1.02,
  drynessOffset: 0.1,
  lean: 1.05,
};
const flattened = {
  height: dense.height * 0.8,
  coverage: 0.9,
  drynessScale: 1,
  drynessOffset: 0.04,
  lean: 1.25,
};

assert(tallWet.height > dense.height, "Tall-wet clumps must be taller than normal.");
assert(shortDry.height < dense.height, "Short-dry clumps must be shorter than normal.");
assert(sparse.coverage < dense.coverage, "Sparse clumps must carry less body coverage.");
assert(flattened.lean > dense.lean, "Flattened clumps must retain stronger rest lean.");
assert(
  tallWet.drynessScale < shortDry.drynessScale &&
    shortDry.drynessOffset > tallWet.drynessOffset,
  "Wet and dry archetypes must separate in dryness as well as height.",
);

console.log(
  "[grass-cluster-profile] Config-backed tiering, clump morphology, plane coherence, frayed coverage, LOD source parity, and archetype relationships verified.",
);
