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

/**
 * Blade normals must be flattened on a schedule, not by one constant.
 *
 * At the shipped 0.76 more than three quarters of every normal was world up, so
 * a blade facing the sun and one facing away returned nearly the same Lambert
 * response: the near field had form only in colour. The same constant flattened
 * grassThinness, which is the transmission term, so the backlighting was
 * implemented correctly and then suppressed.
 *
 * The far end must still equal the impostor material's own flattening, or the
 * mid-to-far handoff shifts hue under a moving camera.
 */
{
  assert(
    nearMaterial.includes("uniform vec2 uGrassNormalUpRange;") &&
      nearMaterial.includes("float grassNormalUpHere = mix("),
    "Blade normal flattening must interpolate between a near and a far value.",
  );
  assert(
    !/uniform float uGrassNormalUp;/.test(nearMaterial),
    "The single-constant normal flattening must be gone.",
  );
  // The macro blade-plane normal bypasses Three.js's defaultnormal_vertex
  // instance correction, so it must explicitly divide by squared instance
  // scale. Phase 5 introduced broad, non-uniform blades; without this the
  // Phase 6 far normal is skewed by morphology instead of only by facing.
  assert(
    nearMaterial.includes("vec3 grassInstanceScaleSquared = vec3(") &&
      nearMaterial.includes(
        "grassBladePlaneNormal / max(grassInstanceScaleSquared, vec3(1e-8))",
      ),
    "The macro blade-plane normal must mirror Three.js inverse-scale correction for non-uniform instances.",
  );
  // The schedule rides the shading micro fade, which every near and mid layer
  // shares. Keying it to a LOD distance instead is what produced an earlier
  // brightness ring at 6-7 m.
  assert(
    /grassNormalUpHere = mix\(\s*uGrassNormalUpRange\.y,\s*uGrassNormalUpRange\.x,\s*grassMicroFade/.test(
      nearMaterial,
    ),
    "The flattening schedule must ride the shared micro fade rather than a LOD distance.",
  );

  const worldYaml = read("public/config/world.yaml");
  const nearScale = Number(
    worldYaml.match(/^grassNearNormalUpScale:\s*([0-9.]+)/m)?.[1],
  );
  assert(
    nearScale > 0.4 && nearScale < 1,
    `grassNearNormalUpScale ${nearScale} must genuinely reduce the near flattening.`,
  );

  // What the change is actually for: a blade facing the sun must return
  // materially more light than one facing away. Measured on the Lambert term
  // the mix produces, at a distance inside the micro fade.
  const farNormalUp = Math.max(
    ...Object.values(presets).map((preset) => preset.normalUp),
  );
  const nearNormalUp = farNormalUp * nearScale;
  const facingResponse = (bladeFacing, flatten) => {
    // Blade plane normal against a sun 35 degrees above the horizon.
    const sun = [Math.cos(0.61), Math.sin(0.61), 0];
    const normal = [
      bladeFacing * (1 - flatten),
      flatten,
      0,
    ];
    const length = Math.hypot(normal[0], normal[1], normal[2]) || 1;
    return Math.max(
      0,
      (normal[0] * sun[0] + normal[1] * sun[1] + normal[2] * sun[2]) / length,
    );
  };
  const nearRatio =
    facingResponse(1, nearNormalUp) / Math.max(facingResponse(-1, nearNormalUp), 1e-4);
  const oldRatio =
    facingResponse(1, farNormalUp) / Math.max(facingResponse(-1, farNormalUp), 1e-4);
  assert(
    nearRatio > oldRatio * 1.5,
    `Near blades separate sun-facing from sun-averted by ${nearRatio.toFixed(2)}x against ${oldRatio.toFixed(2)}x at the far flattening; the schedule is not buying form.`,
  );
}

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
