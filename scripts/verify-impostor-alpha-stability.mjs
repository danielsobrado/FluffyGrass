import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function fail(message) {
  throw new Error(`[impostor-alpha] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function readConstant(source, name) {
  const expression = source.match(
    new RegExp(`export const ${name}\\s*=\\s*([^;]+);`),
  )?.[1];
  const value = Number(expression);
  if (!Number.isFinite(value)) {
    fail(`Unable to read numeric constant ${name}.`);
  }
  return value;
}

function readYamlNumber(source, key) {
  const value = Number(
    source.match(new RegExp(`^${key}:\\s*([0-9.]+)$`, "m"))?.[1],
  );
  if (!Number.isFinite(value)) {
    fail(`Unable to read ${key} from configuration.`);
  }
  return value;
}

const material = read("src/world/grass/WorldGrassImpostorMaterial.ts");
const tuning = read("src/world/grass/WorldGrassImpostorTuning.ts");
const limits = read("src/grass/GrassImpostorLimits.ts");
const validator = read("src/grass/internal/GrassConfigValidator.ts");
const grassConfig = read("public/config/grass.yaml");

const alphaCutoff = readConstant(tuning, "IMPOSTOR_ALPHA_CUTOFF");
const minifiedAlphaCutoff = readConstant(
  tuning,
  "IMPOSTOR_MINIFIED_ALPHA_CUTOFF",
);
const minificationStart = readConstant(
  tuning,
  "IMPOSTOR_MINIFICATION_START_TEXELS_PER_PIXEL",
);
const minificationFull = readConstant(
  tuning,
  "IMPOSTOR_MINIFICATION_FULL_TEXELS_PER_PIXEL",
);
const viewDitherGridScale = readConstant(
  tuning,
  "IMPOSTOR_VIEW_DITHER_GRID_SCALE",
);
const minimumPadding = readConstant(limits, "GRASS_IMPOSTOR_MIN_PADDING");
const configuredPadding = readYamlNumber(grassConfig, "impostorPadding");

assert(
  alphaCutoff > 0 &&
    alphaCutoff < minifiedAlphaCutoff &&
    minifiedAlphaCutoff <= 1,
  "Minified alpha must harden from a valid near cutoff to a stronger cutoff no greater than one.",
);
assert(
  minificationStart >= 1 && minificationFull > minificationStart,
  "Minification thresholds must begin at or beyond one atlas texel per screen pixel and increase monotonically.",
);
assert(
  viewDitherGridScale > 0 && viewDitherGridScale <= 1,
  "View dither resolution must remain a positive fraction of the configured frame resolution.",
);
assert(
  minimumPadding >= minificationFull && configuredPadding >= minimumPadding,
  "Atlas padding must isolate neighbouring frames through the stochastic minification range.",
);
assert(
  validator.includes("config.impostor.padding < GRASS_IMPOSTOR_MIN_PADDING"),
  "Grass config validation must reject mip-unsafe impostor padding.",
);

assert(
  material.includes("uFrameResolution * max(") &&
    material.includes("fwidth(vUv.x)") &&
    material.includes("fwidth(vUv.y)"),
  "Impostor alpha hardening must be driven by projected atlas minification, not world distance.",
);
assert(
  material.includes("floor(vUv * uFrameResolution)") &&
    !material.includes("floor(vUv * 64.0)"),
  "Coverage dither must track the configured atlas frame resolution.",
);
assert(
  material.includes("uBlendViews < 0.5 || fullyMinified") &&
    material.includes("IMPOSTOR_VIEW_DITHER_GRID_SCALE.toFixed(2)"),
  "Strongly minified cards must stop stochastic view selection and view dither must scale with frame resolution.",
);
assert(
  material.includes("float dither = fullyMinified") &&
    material.includes("if (dither >= effectiveCoverage)"),
  "Strongly minified coverage must become coherent per subpatch and use a strict zero-safe threshold.",
);
assert(
  material.includes("float alphaThreshold = mix(alphaDither, 0.5, minification)") &&
    material.includes("if (alphaThreshold >= alphaCoverage)") &&
    !material.includes("if (alphaDither > alphaCoverage)"),
  "Alpha coverage must harden to a conventional cutout and never allow zero-coverage hash ties to survive.",
);
assert(
  !material.includes("vCameraDistance") &&
    !material.includes("IMPOSTOR_FAR_ALPHA_CUTOFF_SCALE"),
  "Alpha stability must stay screen-space driven and must not retain the old distance-coupled cutoff path.",
);

console.log(
  `[impostor-alpha] ${alphaCutoff.toFixed(2)} -> ${minifiedAlphaCutoff.toFixed(2)} cutoff, ` +
    `${minificationStart.toFixed(1)}-${minificationFull.toFixed(1)} texels/pixel hardening, ` +
    `${minimumPadding}px minimum gutter verified.`,
);
