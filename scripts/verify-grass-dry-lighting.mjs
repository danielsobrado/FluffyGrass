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
  throw new Error(`[grass-dry-lighting] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

const tuning = JSON.parse(read("src/grass/materials/GrassPaletteTuning.json"));
const presets = JSON.parse(read("src/grass/GrassArtPresets.json"));
const nearMaterial = read("src/grass/materials/GrassNearMaterial.ts");

assert(
  tuning.dryLuminanceScale < 1 && tuning.dryLuminanceScale >= 0.75,
  "Dry palette luminance must stay below healthy base luminance without becoming unnaturally dark.",
);
assert(
  tuning.tipLuminanceScale <= 1.42,
  "Tip luminance must remain bounded so dry tips cannot turn into a pale field-wide highlight.",
);
assert(
  tuning.drynessMaximum <= 0.65,
  "Palette dryness mixing must stay bounded below full replacement.",
);
assert(
  tuning.groundContactDryScale <= 0.6,
  "Dry roots must remain grounded rather than becoming a bright straw line at the soil.",
);

const transmission = nearMaterial.match(
  /float grassWetTransmission = mix\(\s*([0-9.]+),\s*([0-9.]+),\s*1\.0 - vGrassDryness\s*\);/,
);
assert(transmission, "Near grass must retain dryness-aware leaf transmission.");
const dryTransmission = Number(transmission?.[1]);
const wetTransmission = Number(transmission?.[2]);
assert(
  Number.isFinite(dryTransmission) &&
    Number.isFinite(wetTransmission) &&
    dryTransmission < wetTransmission &&
    dryTransmission <= 0.85 &&
    wetTransmission <= 1.2,
  `Dry/wet transmission endpoints are unsafe: ${dryTransmission}/${wetTransmission}.`,
);
assert(
  nearMaterial.includes("grassBackLight * uGrassBacklightStrength") &&
    nearMaterial.includes("grassWetTransmission"),
  "Dryness-aware transmission must remain on the actual backlight path.",
);
assert(
  !/diffuseColor\.rgb\s*=\s*min\(/.test(nearMaterial) &&
    !/outgoingLight\s*=\s*min\(/.test(nearMaterial),
  "Grass lighting must not hide dry-color errors behind a final-output luminance clamp.",
);

const sheenStrength = Number(
  nearMaterial.match(/DEFAULT_SHEEN_STRENGTH\s*=\s*([0-9.]+)/)?.[1],
);
assert(
  Number.isFinite(sheenStrength) &&
    sheenStrength <= 0.04 &&
    nearMaterial.includes("smoothstep(0.3, 0.92, vGrassProgress)"),
  "Blade sheen must stay subtle and tip-weighted so roots cannot bleach into a pale band.",
);

const maximumBacklight = Math.max(
  ...Object.values(presets).map((preset) => preset.backlightStrength),
);
assert(
  maximumBacklight <= 0.35,
  `Preset backlight ${maximumBacklight} is high enough to reintroduce chalky dry masses.`,
);

console.log(
  `[grass-dry-lighting] Dry palette ${tuning.dryLuminanceScale.toFixed(2)}x, ` +
    `tip ${tuning.tipLuminanceScale.toFixed(2)}x, transmission ` +
    `${dryTransmission.toFixed(2)}-${wetTransmission.toFixed(2)}, ` +
    `sheen ${sheenStrength.toFixed(3)}, max preset backlight ` +
    `${maximumBacklight.toFixed(2)} verified without output clamps.`,
);
