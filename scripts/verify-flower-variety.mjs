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

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[flower-variety] ${message}`);
  }
}

const species = read("src/grass/biome/GrassAccentSpecies.ts");
const biomeProfile = read("src/grass/biome/GrassBiomeProfile.ts");
const affinity = read("src/world/grass/DetailFoliageAffinity.ts");
const atlas = read("src/world/grass/WorldDetailFoliageAtlasFactory.ts");
const material = read("src/world/grass/WorldDetailFoliageMaterial.ts");

assert(
  species.includes("canopyHeightBand: [0.88, 1.58]") &&
    species.includes("canopyHeightBand: [0.82, 1.46]"),
  "Flower families must retain visibly different, broad height bands.",
);
assert(
  species.includes('key: "low-shrub"') &&
    species.includes("index") &&
    /key: "low-shrub"[\s\S]*?category: "shrub"/.test(species) &&
    /key: "broadleaf-rosette"[\s\S]*?category: "broadleaf"/.test(species) &&
    !species.includes('key: "tall-tuft"') &&
    !species.includes('key: "sprig"'),
  "Species slots 1 and 7 must be low-shrub and broadleaf-rosette.",
);
assert(
  species.includes("GRASS_MAX_ACCENT_SPECIES = 8") &&
    [...species.matchAll(/key: "([a-z-]+)",\s+category:/g)].length === 8 &&
    species.includes('| "shrub"') &&
    species.includes('| "broadleaf"'),
  "The accent catalogue must stay at eight species and include shrub and broadleaf.",
);
assert(
  biomeProfile.includes("GRASS_MAX_ACCENT_PROFILE_ENTRIES = 16") &&
    biomeProfile.includes("source.length > GRASS_MAX_ACCENT_PROFILE_ENTRIES"),
  "Biome accent lists must keep the bounded 16-entry candidate-scan contract.",
);
assert(
  affinity.includes(
    "return smoothstep(0, 0.75, clamp01(tuning.colonyStrength));",
  ),
  "Colony strength must use the saturated spatial-correlation response.",
);
const tintPicker = affinity.slice(
  affinity.indexOf("function pickTintRow("),
  affinity.indexOf("export function detailFoliageCorrelation("),
);
assert(
  tintPicker.length > 0 && !tintPicker.includes("adjustedWeight("),
  "Tint picking must reuse same-species profile weights instead of rescoring ecology and edges.",
);
const heightBands = [
  ...species.matchAll(/canopyHeightBand: \[([0-9.]+), ([0-9.]+)\]/g),
];
const aspects = [...species.matchAll(/aspect: ([0-9.]+)/g)].map((match) =>
  Number(match[1]),
);
let maxHeight = 0;
let maxWidth = 0;
heightBands.forEach((match, index) => {
  const high = Number(match[2]);
  maxHeight = Math.max(maxHeight, high);
  maxWidth = Math.max(maxWidth, high * aspects[index]);
});
// The envelope the accent layer reserves, as multiples of canopy height.
// Raised from 1.72/1.314 when the structural species (ferns, rosettes, shrubs)
// were grown past the flowers: at the old ceiling a fern was 0.84 m in 0.73 m
// grass and read as a tall blade. These bounds are what the tile bounding
// sphere is padded by, so they are a culling cost and not a free knob.
assert(
  maxHeight <= 2.05 && maxWidth <= 1.96,
  `Accent canopy bounds exceeded: height ${maxHeight}, width ${maxWidth}.`,
);
const shrubAspect = Number(
  species.match(/key: "low-shrub"[\s\S]*?aspect: ([0-9.]+)/)?.[1],
);
const seedAspect = Number(
  species.match(/key: "seed-head"[\s\S]*?aspect: ([0-9.]+)/)?.[1],
);
const broadleafMax = Number(
  species.match(
    /key: "broadleaf-rosette"[\s\S]*?canopyHeightBand: \[[0-9.]+, ([0-9.]+)\]/,
  )?.[1],
);
const daisyMax = Number(
  species.match(
    /key: "daisy"[\s\S]*?canopyHeightBand: \[[0-9.]+, ([0-9.]+)\]/,
  )?.[1],
);
const seedMax = Number(
  species.match(
    /key: "seed-head"[\s\S]*?canopyHeightBand: \[[0-9.]+, ([0-9.]+)\]/,
  )?.[1],
);
assert(
  shrubAspect > seedAspect &&
    broadleafMax < daisyMax &&
    broadleafMax < seedMax,
  "Replacement plants must keep a lower, wider silhouette than seed heads and daisies.",
);
assert(
  atlas.includes("private drawLowShrub(") &&
    atlas.includes("private drawBroadleafRosette(") &&
    /drawLowShrub\([\s\S]*variant % 2 === 1/.test(atlas) &&
    /drawBroadleafRosette\([\s\S]*variant % 2 === 1/.test(atlas) &&
    atlas.includes("DETAIL_FOLIAGE_CELL_RESOLUTION = 112") &&
    atlas.includes("DETAIL_FOLIAGE_VARIANT_ROWS = 2") &&
    atlas.includes("columns * cellSize") &&
    !atlas.includes("drawSprig") &&
    !atlas.includes('case "tall-tuft"'),
  "Atlas must draw shrub and rosette phenotypes on the existing 8x2 1024x256 layout.",
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
  "[flower-variety] Height, silhouette, composition, shading, and phenotype checks passed.",
);
