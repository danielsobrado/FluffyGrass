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
    throw new Error(`[water-render] ${message}`);
  }
}

const waterShader = read("src/world/hydrology/WaterShader.ts");
const waterMaterial = read("src/world/hydrology/WaterMaterialController.ts");
const bedShader = read("src/world/hydrology/WaterBedMaterialShader.ts");
const bedMaterial = read("src/world/hydrology/WaterBedMaterialController.ts");
const bedFunctions = read("src/world/hydrology/WaterBedShader.ts");
const tuning = read("src/world/hydrology/WaterMaterialTuning.ts");
const streamer = read("src/world/TerrainStreamer.ts");
const chunkGeometry = read("src/world/hydrology/WaterChunkGeometry.ts");

assert(
  !waterShader.includes("waterSampleRiverBed") &&
    !waterShader.includes("uWaterBedNoise") &&
    !waterShader.includes("waterCaustic") &&
    !waterMaterial.includes("createWaterBedTexture") &&
    !waterMaterial.includes("bedTexture"),
  "The water surface must not own bed pebbles, algae, or caustics.",
);
assert(
  waterShader.includes("waterTransmittance") &&
    waterShader.includes("uWaterAbsorption") &&
    waterShader.includes("uWaterFresnelF0") &&
    !waterShader.includes("waterFresnelOpacity"),
  "Optical depth must drive transmittance, and Fresnel must not own surface alpha.",
);
assert(
  waterShader.includes("uWaterSunDirection") &&
    waterShader.includes("waterSunSpecular") &&
    waterShader.includes("waterGlintBreakup"),
  "Sun glints must come from the physical sun response, with noise only as breakup.",
);
assert(
  waterMaterial.includes("depthWrite: false") &&
    waterMaterial.includes("transparent: true") &&
    waterMaterial.includes("WATER_COMPACT_DETAIL_SCALE"),
  "Water surface must stay transparent without depth writes and scale compact detail.",
);
assert(
  bedFunctions.includes("waterSampleRiverBed") &&
    bedShader.includes("waterSampleRiverBed") &&
    bedShader.includes("waterBedCaustic") &&
    bedShader.includes("uWaterCausticStrength") &&
    bedMaterial.includes("uWaterCausticStrength") &&
    bedFunctions.includes("bedRiffle") &&
    bedFunctions.includes("fineDeposition") &&
    bedShader.includes("uWaterRiverReferenceDepth") &&
    bedMaterial.includes("uWaterRiverReferenceDepth"),
  "The bed pass must own cobbles, algae, caustics, and depth-driven composition.",
);
assert(
  bedMaterial.includes("transparent: false") &&
    bedMaterial.includes("depthWrite: true") &&
    bedMaterial.includes("depthTest: true") &&
    bedMaterial.includes("alphaTest: 0.01") &&
    bedShader.includes("diffuseColor.a = 1.0") &&
    bedShader.includes("discard"),
  "The bed must depth-test and depth-write as opaque masked geometry.",
);
assert(
  streamer.includes("new WaterMaterialController(config, compact)") &&
    streamer.includes("new WaterBedMaterialController(config, compact)"),
  "Water quality must follow the streamer compact profile rather than user-agent checks.",
);
assert(
  chunkGeometry.includes("box.min.y -= maxDepth") &&
    chunkGeometry.includes("box.getBoundingSphere(sphere)"),
  "Shared water geometry bounds must cover the vertex-displaced bed.",
);
assert(
  waterShader.includes("waterSunPlusView") &&
    waterShader.includes("waterViewDiff") &&
    bedShader.includes("waterBedViewDiff"),
  "Water and bed shaders must guard against zero-length vector normalizations.",
);
assert(
  waterShader.includes("uWaterFlowNoise") &&
    waterMaterial.includes("uWaterFlowNoise") &&
    !waterShader.includes("uWaterRiverNoise") &&
    !waterMaterial.includes("uWaterRiverNoise"),
  "Surface water must keep its existing flow-noise sampler and must not add a river noise map.",
);
assert(
  waterShader.includes("waterLocalFlowSpeed") &&
    waterShader.includes("waterRiffleEnergy") &&
    waterShader.includes("uWaterShoreFoamWeight") &&
    waterShader.includes("waterPoolTint") &&
    waterMaterial.includes("uWaterRiverReferenceDepth") &&
    waterMaterial.includes("forceSinglePass = true"),
  "Local river energy, foam hierarchy, and restrained tint must stay on the existing surface pass.",
);
assert(
  tuning.includes("WATER_MATERIAL_CACHE_KEY") &&
    tuning.includes("WATER_BED_MATERIAL_CACHE_KEY") &&
    tuning.includes("WATER_F0") &&
    tuning.includes("WATER_ABSORPTION_COLOR"),
  "Water compile cache keys and optical constants must live in the tuning module.",
);

console.log(
  "[water-render] Surface/bed ownership, opaque bed depth, absorption, and compact quality verified.",
);
