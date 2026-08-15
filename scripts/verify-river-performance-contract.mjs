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
    throw new Error(`[river-perf] ${message}`);
  }
}

function extractFunction(source, name) {
  const start = source.indexOf(`private ${name}(`);
  const fallback = source.indexOf(`${name}(`);
  const index = start >= 0 ? start : fallback;
  assert(index >= 0, `Unable to find ${name}().`);
  let depth = 0;
  let started = false;
  for (let cursor = index; cursor < source.length; cursor += 1) {
    const character = source[cursor];
    if (character === "{") {
      depth += 1;
      started = true;
    } else if (character === "}") {
      depth -= 1;
      if (started && depth === 0) {
        return source.slice(index, cursor + 1);
      }
    }
  }
  throw new Error(`[river-perf] Unable to extract ${name}().`);
}

function countMatches(source, pattern) {
  return source.match(pattern)?.length ?? 0;
}

const riverField = read("src/world/hydrology/RiverField.ts");
const hydrologyField = read("src/world/hydrology/HydrologyField.ts");
const waterShader = read("src/world/hydrology/WaterShader.ts");
const waterMaterial = read("src/world/hydrology/WaterMaterialController.ts");
const bedShader = read("src/world/hydrology/WaterBedMaterialShader.ts");
const bedFunctions = read("src/world/hydrology/WaterBedShader.ts");
const bedMaterial = read("src/world/hydrology/WaterBedMaterialController.ts");
const interaction = read("src/world/hydrology/WaterInteractionField.ts");
const resolver = read("src/world/hydrology/WaterChunkInteractionResolver.ts");
const streamer = read("src/world/TerrainStreamer.ts");
const chunkGeometry = read("src/world/hydrology/WaterChunkGeometry.ts");

const sampleLane = extractFunction(riverField, "sampleLane");
const resolveSelected = extractFunction(riverField, "resolveSelectedLane");

assert(
  countMatches(sampleLane, /Math\.sin\s*\(/g) === 2,
  "sampleLane() must use exactly two centreline sine evaluations.",
);
assert(
  !sampleLane.includes("Math.cos"),
  "Cosine work must remain selected-lane work, not per-candidate-lane work.",
);
assert(
  countMatches(resolveSelected, /Math\.cos\s*\(/g) === 2,
  "The selected lane must evaluate both centreline cosines once.",
);
assert(
  !riverField.includes("simplex") &&
    !riverField.includes("perlin") &&
    !riverField.includes("valueNoise") &&
    !waterShader.includes("uWaterRiverNoise") &&
    !waterMaterial.includes("createWaterRiver") &&
    !bedMaterial.includes("createWaterRiver"),
  "River morphology must not introduce a new noise texture or sampler.",
);
assert(
  /const WAKE_SAMPLE_COUNT = 3;/.test(interaction),
  "Stone wakes must keep WAKE_SAMPLE_COUNT = 3.",
);
assert(
  chunkGeometry.includes('setAttribute("waterData"') &&
    chunkGeometry.includes("new THREE.BufferAttribute(this.data, 4)"),
  "waterData must remain four floats.",
);
assert(
  chunkGeometry.includes('setAttribute(\n      "waterInteraction"') ||
    chunkGeometry.includes('"waterInteraction"'),
  "waterInteraction attribute must remain present.",
);
assert(
  chunkGeometry.includes("new THREE.BufferAttribute(this.interactions, 2)"),
  "waterInteraction must remain two floats.",
);
assert(
  !waterShader.includes("riverMorphology") &&
    !waterShader.includes("riverBend") &&
    !waterShader.includes("riverLateral") &&
    !chunkGeometry.includes("riverMorphology") &&
    !chunkGeometry.includes("riverBend") &&
    !chunkGeometry.includes("riverLateral"),
  "Morphology, bend, and lateral must stay CPU-only in this pass.",
);
assert(
  hydrologyField.includes("riverMorphology") &&
    hydrologyField.includes("riverBend") &&
    hydrologyField.includes("riverLateral"),
  "CPU hydrology samples must expose morphology semantics for QA.",
);

const surfaceSamplerCount = countMatches(
  waterShader,
  /uniform\s+sampler2D\s+/g,
);
const bedSamplerCount = countMatches(bedShader, /uniform\s+sampler2D\s+/g);
assert(
  surfaceSamplerCount === 1 && waterShader.includes("uWaterFlowNoise"),
  "Surface water must keep a single sampler2D uniform.",
);
assert(
  bedSamplerCount === 1 && bedShader.includes("uWaterBedNoise"),
  "Riverbed shading must keep a single sampler2D uniform.",
);
assert(
  countMatches(bedFunctions, /texture2D\s*\(\s*uWaterBedNoise/g) === 2,
  "Riverbed composition must reuse the existing two bed texture samples.",
);
assert(
  waterMaterial.includes("forceSinglePass = true"),
  "Water surface must remain forceSinglePass.",
);
assert(
  streamer.includes("new WaterMaterialController(config, compact)") &&
    streamer.includes("new WaterBedMaterialController(config, compact)") &&
    streamer.includes("this.waterMaterialController?.material") &&
    streamer.includes("this.waterBedMaterialController?.material"),
  "TerrainStreamer must own the shared water and bed controllers.",
);
assert(
  !/class TerrainChunk[\s\S]*new WaterMaterialController/.test(
    read("src/world/TerrainChunk.ts"),
  ),
  "Water materials must not be created per terrain chunk.",
);

const downhillIndex = resolver.indexOf("resolveDownhillWaterFlow");
const interactionIndex = resolver.indexOf("interactionField.sample");
assert(
  downhillIndex >= 0 && interactionIndex > downhillIndex,
  "Downhill flow must be resolved before stone interaction sampling.",
);

console.log(
  "[river-perf] Static river performance architecture contract verified.",
);
