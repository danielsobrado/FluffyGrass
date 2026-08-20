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
    throw new Error(`[cloud-field] ${message}`);
  }
}

const field = read("src/world/sky/WorldCloudFieldShader.ts");
const sky = read("src/world/sky/WorldSkyCloudShader.ts");
const volume = read("src/world/sky/WorldCloudVolumeShader.ts");
const shadow = read("src/world/sky/WorldCloudShadowShader.ts");
const weather = read("src/world/sky/WorldCloudWeather.ts");

assert(
  field.includes("export const WORLD_CLOUD_FIELD_GLSL") &&
    field.includes("float cloudHash12(vec2 p)") &&
    field.includes("float cloudValueNoise(vec2 p)") &&
    field.includes("float cloudFbm(vec2 p)") &&
    field.includes("float cloudWeather(vec2 worldPosition)") &&
    field.includes("float cloudDensity(") &&
    field.includes("WORLD_CLOUD_COMPACT"),
  "Cloud hash/noise/FBM/weather/density must have one shared GLSL source with compact quality support.",
);
assert(
  field.includes("WORLD_CLOUD_VERTICAL_PROFILE_GLSL") &&
    field.includes("float cloudVerticalProfile(") &&
    field.includes("flatBase") &&
    field.includes("irregularTop"),
  "The vertical cloud profile must be shared by the visible volume and the shadow integrator.",
);
assert(
  sky.includes('from "./WorldCloudFieldShader"') &&
    sky.includes("${WORLD_CLOUD_FIELD_GLSL}") &&
    !sky.includes("float cloudHash12(vec2 p)"),
  "The sky must consume the shared cloud field rather than own a duplicate implementation.",
);
assert(
  volume.includes("WORLD_CLOUD_FIELD_GLSL") &&
    volume.includes("WORLD_CLOUD_VERTICAL_PROFILE_GLSL") &&
    !volume.includes("float cloudHash12(vec2 p)") &&
    !volume.includes("float cloudVerticalProfile(vec2 worldPosition"),
  "The volumetric pass must consume both shared cloud field modules without local copies.",
);
assert(
  shadow.includes("WORLD_CLOUD_FIELD_GLSL") &&
    shadow.includes("WORLD_CLOUD_VERTICAL_PROFILE_GLSL") &&
    !shadow.includes("float cloudHash12(vec2 p)"),
  "The ground transmittance pass must use the same cloud density/profile as the visible clouds.",
);
assert(
  field.includes("p = rotation * p * 2.02") &&
    weather.includes("FBM_FREQUENCY = 2.02") &&
    field.includes("mat2 rotation = mat2(0.8, 0.6, -0.6, 0.8)") &&
    weather.includes("FBM_ROTATION_COS = 0.8") &&
    weather.includes("FBM_ROTATION_SIN = 0.6") &&
    field.includes("smoothstep(0.28, 0.78, cloudWeather(worldPosition))") &&
    weather.includes("WEATHER_CLEAR_THRESHOLD = 0.28") &&
    weather.includes("WEATHER_OVERCAST_THRESHOLD = 0.78"),
  "CPU focus lighting and GPU cloud fields must retain matching macro constants and weather thresholds.",
);
assert(
  sky.includes("float cloudRayBreakup(") &&
    !sky.includes("sin(rayAngle * 17.0") &&
    !sky.includes("float rayBands"),
  "God rays must use irregular cloud-driven breakup instead of the visible angular sine bands from the old implementation.",
);

console.log(
  "[cloud-field] Shared CPU/GPU cloud morphology, vertical profile reuse, and band-free god-ray breakup verified.",
);
