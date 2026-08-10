import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[flower-variety] ${message}`);
  }
}

const species = read("src/grass/biome/GrassAccentSpecies.ts");
const atlas = read("src/world/grass/WorldDetailFoliageAtlasFactory.ts");
const material = read("src/world/grass/WorldDetailFoliageMaterial.ts");

assert(
  species.includes("canopyHeightBand: [0.88, 1.58]") &&
    species.includes("canopyHeightBand: [0.82, 1.46]"),
  "Flower families must retain visibly different, broad height bands.",
);
assert(
  species.includes('key: "daisy"') &&
    species.includes("aspect: 0.72") &&
    species.includes('key: "round-bloom"') &&
    species.includes("aspect: 0.9"),
  "Flower families must retain distinct card proportions.",
);
assert(
  atlas.includes("private fillPetal(") &&
    atlas.includes("private drawCalyx(") &&
    atlas.includes("random.range(10, 14)") &&
    atlas.includes("random.range(7, 10)") &&
    atlas.includes("const branched = variant % 2 === 1") &&
    atlas.includes("budX"),
  "Flower atlas must retain distinct petal, calyx, and branched phenotypes.",
);
assert(
  atlas.includes("baseTint") &&
    atlas.includes("tipTint") &&
    atlas.includes("createLinearGradient(0, 0, length, 0)"),
  "Petals must retain semantic shade/tint gradients instead of flat fills.",
);
assert(
  material.includes("flat varying float vPhenotype") &&
    material.includes("float petalShade = mix(0.65, 1.12, accentData.g)") &&
    material.includes("float saturation = mix(0.82, 1.0") &&
    !material.includes(
      "color = mix(color, uAccentTint[tintRow], accentData.b);",
    ),
  "Flower tinting must retain per-pixel shade and stable per-instance variation.",
);

console.log(
  "[flower-variety] Height, silhouette, petal shading, and phenotype checks passed.",
);
