import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const presets = JSON.parse(
  readFileSync(
    resolve(REPOSITORY_ROOT, "src/grass/GrassArtPresets.json"),
    "utf8",
  ),
);
const tuning = JSON.parse(
  readFileSync(
    resolve(REPOSITORY_ROOT, "src/grass/materials/GrassPaletteTuning.json"),
    "utf8",
  ),
);

const MAX_AVERAGE_LUMINANCE_DELTA = 0.03;
const MAX_AVERAGE_RGB_DELTA = 0.025;
const MAX_SAMPLE_RMSE = 0.025;
const MAX_P95_SAMPLE_DELTA = 0.03;
// Semantic/source-distribution guard. Runtime WebGL compilation, atlas
// filtering, lighting, fog, and minification are verified separately in the
// browser smoke pass.
//
// This bounds the canopy depth an art preset may ask for. It is not what keeps
// an LOD handoff invisible — MAX_ROOT_TIP_LOD_DELTA below is, and it stays at
// one percent. Every LOD resolves the same palette function from the same root
// darkening uniform, so raising the absolute contrast moves near, mid, and far
// together: measured drift between them is under a twentieth of the budget at
// every value in this range. The bound sat at 8% while the presets all shipped
// root darkening around 0.97, which is a two percent effect and left the field
// with no canopy depth at all.
const MAX_ROOT_TIP_CONTRAST = 0.3;
const MAX_ROOT_TIP_LOD_DELTA = 0.01;
// The far light offset is a deliberate art control rather than LOD drift, so it
// is bounded to the art menu range instead of the parity tolerances above.
const MIN_FAR_LIGHT = 0.7;
const MAX_FAR_LIGHT = 1.15;
const MIN_FAR_SPATIAL_LUMINANCE_RANGE = 0.08;
const MAX_BACKLIGHT_STRENGTH = 0.12;
const LOD_DISTRIBUTION_SAMPLE_COUNT = 16384;
const SAMPLE_DRYNESS = [0, 0.05, 0.15, 0.3];
// Spans the canopy-occlusion range GrassFieldVariation can produce, not just
// the old zero-mean per-blade tone jitter.
const SAMPLE_ROOT_AO = [0.82, 0.94, 1, 1.06];
// Mirrors GRASS_MACRO_DRYNESS_STRENGTH and CANOPY_AO_STRENGTH in
// src/grass/GrassFieldVariation.ts. Both LODs apply them at the same world
// position from the same functions; the independent draws below are the
// worst case for the near-to-mid delta, since in the field the macro terms
// agree exactly and only the per-blade jitter differs.
const MACRO_DRYNESS_STRENGTH = 0.22;
const CANOPY_AO_STRENGTH = 0.17;
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const PRESET_NUMBER_FIELDS = [
  "rootDarkening",
  "tipColorStrength",
  "normalUp",
  "ambientBoost",
  "backlightStrength",
  "impostorBaseColorBlend",
  "impostorColorScale",
  "terrainGrassTintStrength",
  "densityScale",
  "windStrengthScale",
  "flutterStrengthScale",
  "nearDistance",
  "midDistance",
  "farDistance",
  "transitionDistance",
];
const TUNING_NUMBER_FIELDS = [
  "tipStart",
  "tipEnd",
  "tipLuminanceScale",
  "dryLuminanceScale",
  "shadeDrynessPivot",
  "shadeDrynessScale",
  "shadeDrynessMaximum",
  "instanceDrynessBase",
  "instanceDrynessTip",
  "drynessMaximum",
  "rootFadeEnd",
  "shadeLightMinimum",
  "shadeLightMaximum",
];

function fail(message) {
  throw new Error(`[lod-color] ${message}`);
}

function assertFinite(value, label) {
  if (!Number.isFinite(value)) {
    fail(`${label} must be finite.`);
  }
}

function validateInputs() {
  const entries = Object.entries(presets);
  if (entries.length === 0) {
    fail("At least one grass art preset is required.");
  }
  for (const field of TUNING_NUMBER_FIELDS) {
    assertFinite(tuning[field], `Palette tuning ${field}`);
  }
  if (!(tuning.tipStart < tuning.tipEnd)) {
    fail("Palette tipStart must be lower than tipEnd.");
  }
  if (!(tuning.shadeLightMinimum <= tuning.shadeLightMaximum)) {
    fail("Palette shade-light range is reversed.");
  }
  for (const [key, preset] of entries) {
    if (preset.key !== key || typeof preset.label !== "string") {
      fail(`Preset ${key} has an invalid key or label.`);
    }
    for (const field of ["baseColor", "tipColor", "dryColor", "terrainGrassColor"]) {
      if (!COLOR_PATTERN.test(preset[field])) {
        fail(`Preset ${key} ${field} must be #RRGGBB.`);
      }
    }
    for (const field of PRESET_NUMBER_FIELDS) {
      assertFinite(preset[field], `Preset ${key} ${field}`);
    }
    if (
      preset.rootDarkening < 0 ||
      preset.rootDarkening > 1 ||
      preset.tipColorStrength < 0 ||
      preset.tipColorStrength > 1 ||
      preset.impostorBaseColorBlend < 0 ||
      preset.impostorBaseColorBlend > 1 ||
      preset.impostorColorScale < MIN_FAR_LIGHT ||
      preset.impostorColorScale > MAX_FAR_LIGHT
    ) {
      fail(`Preset ${key} contains an out-of-range palette control.`);
    }
    if (!(preset.nearDistance < preset.midDistance && preset.midDistance < preset.farDistance)) {
      fail(`Preset ${key} LOD distances must increase from near to far.`);
    }
  }
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function smoothstep(value, minimum, maximum) {
  const amount = clamp((value - minimum) / (maximum - minimum), 0, 1);
  return amount * amount * (3 - 2 * amount);
}

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createLodDistributionSamples() {
  const random = createSeededRandom(42017);
  const samples = [];
  for (let index = 0; index < LOD_DISTRIBUTION_SAMPLE_COUNT; index += 1) {
    // A uniformly sampled triangle has twice as much root area as tip area.
    const progress = 1 - Math.sqrt(1 - random());
    const suitability = 0.08 + random() * 0.92;
    const vigor = random();
    const macroDryness = random();
    const canopyAo = 1 - CANOPY_AO_STRENGTH * vigor * suitability;
    const underlayer = random() < 0.3;
    samples.push({
      progress,
      near: {
        shade: 0.5,
        dryness: clamp(
          (1 - suitability) * 0.25 +
            macroDryness * MACRO_DRYNESS_STRENGTH +
            random() * 0.06,
          0,
          1,
        ),
        rootAo: canopyAo * (0.985 + random() * 0.03),
      },
      mid: {
        shade: underlayer ? random() * 0.2 : 0.24 + random() * 0.76,
        dryness: clamp(
          (1 - suitability) * 0.34 +
            macroDryness * MACRO_DRYNESS_STRENGTH +
            random() * 0.09,
          0,
          1,
        ),
        rootAo: canopyAo * (0.97 + random() * 0.06),
      },
    });
  }
  return samples;
}

const LOD_DISTRIBUTION_SAMPLES = createLodDistributionSamples();

function srgbChannelToLinear(value) {
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function linearChannelToSrgb(value) {
  const clamped = clamp(value, 0, 1);
  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

function parseColor(value) {
  if (!COLOR_PATTERN.test(value)) {
    fail(`Invalid color ${String(value)}.`);
  }
  return [1, 3, 5].map((offset) =>
    srgbChannelToLinear(Number.parseInt(value.slice(offset, offset + 2), 16) / 255),
  );
}

function mixColor(left, right, amount) {
  return left.map((value, index) => lerp(value, right[index], amount));
}

function multiplyColor(color, scalar) {
  return color.map((value) => value * scalar);
}

function luminance(color) {
  return color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722;
}

function matchLuminance(color, targetLuminance) {
  return multiplyColor(color, targetLuminance / Math.max(luminance(color), 1e-4));
}

function createPalette(preset) {
  const baseColor = parseColor(preset.baseColor);
  const baseLuminance = Math.max(luminance(baseColor), 1e-4);
  return {
    baseColor,
    tipColor: matchLuminance(
      parseColor(preset.tipColor),
      baseLuminance * tuning.tipLuminanceScale,
    ),
    dryColor: matchLuminance(
      parseColor(preset.dryColor),
      baseLuminance * tuning.dryLuminanceScale,
    ),
  };
}

function resolvePalette(preset, palette, progress, shade, dryness, rootAo) {
  const tipProfile = smoothstep(progress, tuning.tipStart, tuning.tipEnd);
  const healthyColor = mixColor(
    palette.baseColor,
    palette.tipColor,
    tipProfile * preset.tipColorStrength,
  );
  const shadeDryness = clamp(
    (tuning.shadeDrynessPivot - shade) * tuning.shadeDrynessScale,
    0,
    tuning.shadeDrynessMaximum,
  );
  const instanceDryness =
    dryness *
    (tuning.instanceDrynessBase + tipProfile * tuning.instanceDrynessTip);
  const paletteColor = mixColor(
    healthyColor,
    palette.dryColor,
    clamp(shadeDryness + instanceDryness, 0, tuning.drynessMaximum),
  );
  const rootLight = lerp(
    preset.rootDarkening,
    1,
    smoothstep(progress, 0, tuning.rootFadeEnd),
  );
  const bladeVariation = lerp(
    tuning.shadeLightMinimum,
    tuning.shadeLightMaximum,
    shade,
  );
  return multiplyColor(paletteColor, rootLight * bladeVariation * rootAo);
}

function resolveImpostorPalette(
  preset,
  palette,
  progress,
  shade,
  dryness,
  rootAo,
) {
  const encodedProgress = Math.round(clamp(progress, 0, 1) * 255) / 255;
  const encodedShade = Math.round(clamp(shade, 0, 1) * 255) / 255;
  const semanticColor = resolvePalette(
    preset,
    palette,
    encodedProgress,
    encodedShade,
    dryness,
    rootAo,
  );
  return mixColor(
    semanticColor,
    palette.baseColor,
    preset.impostorBaseColorBlend,
  );
}

// The far light offset dims every impostor channel uniformly, so parity is
// measured before it is applied: the guard keeps catching semantic, blend, and
// palette divergence while the art direction stays free to darken the horizon.
function applyFarLight(preset, color) {
  return multiplyColor(color, preset.impostorColorScale);
}

function add(target, color) {
  for (let channel = 0; channel < 3; channel += 1) {
    target[channel] += color[channel];
  }
}

function average(total, count) {
  if (count <= 0) {
    fail("A deterministic color sample set was empty.");
  }
  return total.map((value) => value / count);
}

function colorDistance(left, right) {
  return Math.sqrt(
    left.reduce((sum, value, index) => sum + (value - right[index]) ** 2, 0) /
      3,
  );
}

function percentile(values, amount) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * amount) - 1)];
}

function formatColor(color) {
  return `#${color
    .map((value) =>
      Math.round(linearChannelToSrgb(value) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function analyzePreset(preset) {
  const palette = createPalette(preset);
  const sampleDeltas = [];
  let sampleCount = 0;
  let squaredError = 0;

  for (let progressIndex = 0; progressIndex <= 32; progressIndex += 1) {
    const progress = progressIndex / 32;
    for (let shadeIndex = 0; shadeIndex <= 16; shadeIndex += 1) {
      const shade = shadeIndex / 16;
      for (const dryness of SAMPLE_DRYNESS) {
        for (const rootAo of SAMPLE_ROOT_AO) {
          const near = resolvePalette(
            preset,
            palette,
            progress,
            shade,
            dryness,
            rootAo,
          );
          const far = resolveImpostorPalette(
            preset,
            palette,
            progress,
            shade,
            dryness,
            rootAo,
          );
          const delta = colorDistance(near, far);
          sampleDeltas.push(delta);
          squaredError += delta ** 2 * 3;
          sampleCount += 1;
        }
      }
    }
  }

  const nearTotal = [0, 0, 0];
  const midTotal = [0, 0, 0];
  const farTotal = [0, 0, 0];
  const farParityTotal = [0, 0, 0];
  const nearRootTotal = [0, 0, 0];
  const midRootTotal = [0, 0, 0];
  const farRootTotal = [0, 0, 0];
  const nearTipTotal = [0, 0, 0];
  const midTipTotal = [0, 0, 0];
  const farTipTotal = [0, 0, 0];
  const farSpatialLuminances = [];
  const distributionDeltas = [];
  let rootCount = 0;
  let tipCount = 0;
  for (const sample of LOD_DISTRIBUTION_SAMPLES) {
    const near = resolvePalette(
      preset,
      palette,
      sample.progress,
      sample.near.shade,
      sample.near.dryness,
      sample.near.rootAo,
    );
    const mid = resolvePalette(
      preset,
      palette,
      sample.progress,
      sample.mid.shade,
      sample.mid.dryness,
      sample.mid.rootAo,
    );
    const farParity = resolveImpostorPalette(
      preset,
      palette,
      sample.progress,
      sample.mid.shade,
      sample.mid.dryness,
      sample.mid.rootAo,
    );
    const far = applyFarLight(preset, farParity);
    add(nearTotal, near);
    add(midTotal, mid);
    add(farTotal, far);
    add(farParityTotal, farParity);
    distributionDeltas.push(
      Math.max(
        colorDistance(near, mid),
        colorDistance(mid, farParity),
      ),
    );
    farSpatialLuminances.push(luminance(far));
    if (sample.progress <= 0.2) {
      add(nearRootTotal, near);
      add(midRootTotal, mid);
      add(farRootTotal, far);
      rootCount += 1;
    }
    if (sample.progress >= 0.8) {
      add(nearTipTotal, near);
      add(midTipTotal, mid);
      add(farTipTotal, far);
      tipCount += 1;
    }
  }

  const distributionCount = LOD_DISTRIBUTION_SAMPLES.length;
  const nearAverage = average(nearTotal, distributionCount);
  const midAverage = average(midTotal, distributionCount);
  const farAverage = average(farTotal, distributionCount);
  const farParityAverage = average(farParityTotal, distributionCount);
  const nearLuminance = luminance(nearAverage);
  const midLuminance = luminance(midAverage);
  const farLuminance = luminance(farAverage);
  const farParityLuminance = luminance(farParityAverage);
  const luminanceDelta = Math.max(
    Math.abs(midLuminance - nearLuminance) /
      Math.max(nearLuminance, 1e-6),
    Math.abs(farParityLuminance - midLuminance) /
      Math.max(midLuminance, 1e-6),
  );
  const averageRgbDelta = Math.max(
    colorDistance(nearAverage, midAverage),
    colorDistance(midAverage, farParityAverage),
  );
  const sampleRmse = Math.sqrt(squaredError / (sampleCount * 3));
  const p95SampleDelta = Math.max(
    percentile(sampleDeltas, 0.95),
    percentile(distributionDeltas, 0.95),
  );
  const nearRootLuminance = luminance(average(nearRootTotal, rootCount));
  const midRootLuminance = luminance(average(midRootTotal, rootCount));
  const nearTipLuminance = luminance(average(nearTipTotal, tipCount));
  const midTipLuminance = luminance(average(midTipTotal, tipCount));
  const farRootLuminance = luminance(average(farRootTotal, rootCount));
  const farTipLuminance = luminance(average(farTipTotal, tipCount));
  const nearRootTipContrast =
    Math.abs(nearTipLuminance - nearRootLuminance) /
    Math.max(nearLuminance, 1e-6);
  const midRootTipContrast =
    Math.abs(midTipLuminance - midRootLuminance) /
    Math.max(midLuminance, 1e-6);
  const farRootTipContrast =
    Math.abs(farTipLuminance - farRootLuminance) /
    Math.max(farLuminance, 1e-6);
  const rootTipLodDelta = Math.max(
    Math.abs(midRootTipContrast - nearRootTipContrast),
    Math.abs(farRootTipContrast - midRootTipContrast),
  );
  const spatialMinimum = percentile(farSpatialLuminances, 0.05);
  const spatialMaximum = percentile(farSpatialLuminances, 0.95);
  const farSpatialLuminanceRange =
    (spatialMaximum - spatialMinimum) /
    Math.max(farLuminance, 1e-6);

  const finiteResults = [
    ...nearAverage,
    ...midAverage,
    ...farAverage,
    ...farParityAverage,
    luminanceDelta,
    averageRgbDelta,
    sampleRmse,
    p95SampleDelta,
    nearRootTipContrast,
    midRootTipContrast,
    farRootTipContrast,
    rootTipLodDelta,
    farSpatialLuminanceRange,
  ];
  if (!finiteResults.every(Number.isFinite)) {
    fail(`${preset.label} produced a non-finite deterministic color metric.`);
  }

  return {
    nearAverage,
    midAverage,
    farAverage,
    luminanceDelta,
    averageRgbDelta,
    sampleRmse,
    p95SampleDelta,
    nearRootTipContrast,
    midRootTipContrast,
    farRootTipContrast,
    rootTipLodDelta,
    farSpatialLuminanceRange,
  };
}

validateInputs();
const failures = [];
for (const preset of Object.values(presets)) {
  const result = analyzePreset(preset);
  console.log(
    `[lod-color] ${preset.label.padEnd(17)} near ${formatColor(result.nearAverage)} ` +
      `mid ${formatColor(result.midAverage)} far ${formatColor(result.farAverage)} ` +
      `far light ${formatPercent(preset.impostorColorScale)} ` +
      `ΔL ${formatPercent(result.luminanceDelta)} ` +
      `p95 ${result.p95SampleDelta.toFixed(4)} ` +
      `root↔tip ${formatPercent(result.nearRootTipContrast)} / ` +
      `${formatPercent(result.midRootTipContrast)} / ` +
      `${formatPercent(result.farRootTipContrast)} ` +
      `semantic far range ${formatPercent(result.farSpatialLuminanceRange)}`,
  );

  if (result.luminanceDelta > MAX_AVERAGE_LUMINANCE_DELTA) {
    failures.push(
      `${preset.label} average LOD luminance differs by ${formatPercent(result.luminanceDelta)}.`,
    );
  }
  if (result.averageRgbDelta > MAX_AVERAGE_RGB_DELTA) {
    failures.push(
      `${preset.label} average LOD RGB delta is ${result.averageRgbDelta.toFixed(4)}.`,
    );
  }
  if (result.sampleRmse > MAX_SAMPLE_RMSE) {
    failures.push(
      `${preset.label} per-sample LOD RMSE is ${result.sampleRmse.toFixed(4)}.`,
    );
  }
  if (result.p95SampleDelta > MAX_P95_SAMPLE_DELTA) {
    failures.push(
      `${preset.label} p95 sample delta is ${result.p95SampleDelta.toFixed(4)}.`,
    );
  }
  if (result.nearRootTipContrast > MAX_ROOT_TIP_CONTRAST) {
    failures.push(
      `${preset.label} near root-to-tip contrast is ${formatPercent(result.nearRootTipContrast)}.`,
    );
  }
  if (result.midRootTipContrast > MAX_ROOT_TIP_CONTRAST) {
    failures.push(
      `${preset.label} mid root-to-tip contrast is ${formatPercent(result.midRootTipContrast)}.`,
    );
  }
  if (result.farRootTipContrast > MAX_ROOT_TIP_CONTRAST) {
    failures.push(
      `${preset.label} far root-to-tip contrast is ${formatPercent(result.farRootTipContrast)}.`,
    );
  }
  if (result.rootTipLodDelta > MAX_ROOT_TIP_LOD_DELTA) {
    failures.push(
      `${preset.label} root-to-tip contrast changes by ${formatPercent(result.rootTipLodDelta)} between LODs.`,
    );
  }
  if (result.farSpatialLuminanceRange < MIN_FAR_SPATIAL_LUMINANCE_RANGE) {
    failures.push(
      `${preset.label} far spatial luminance range is only ${formatPercent(result.farSpatialLuminanceRange)}.`,
    );
  }
  if (preset.backlightStrength > MAX_BACKLIGHT_STRENGTH) {
    failures.push(
      `${preset.label} backlight ${preset.backlightStrength} can recreate shiny tips.`,
    );
  }
}

if (failures.length > 0) {
  fail(failures.join("\n[lod-color] "));
}

console.log(
  "[lod-color] Seeded semantic near/mid source distributions and quantized far samples satisfy mean, p95, root-tip, and variation limits.",
);
