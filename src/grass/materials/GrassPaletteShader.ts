import * as THREE from "three";
import tuning from "./GrassPaletteTuning.json";

const GRASS_LUMINANCE_WEIGHTS = new THREE.Vector3(0.2126, 0.7152, 0.0722);

function toGlslFloat(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError("Grass palette GLSL values must be finite.");
  }
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

function luminance(color: THREE.Color): number {
  return (
    color.r * GRASS_LUMINANCE_WEIGHTS.x +
    color.g * GRASS_LUMINANCE_WEIGHTS.y +
    color.b * GRASS_LUMINANCE_WEIGHTS.z
  );
}

export function setBalancedGrassPaletteColors(
  baseTarget: THREE.Color,
  tipTarget: THREE.Color,
  dryTarget: THREE.Color,
  baseColor: THREE.ColorRepresentation,
  tipColor: THREE.ColorRepresentation,
  dryColor: THREE.ColorRepresentation,
): void {
  baseTarget.set(baseColor);
  tipTarget.set(tipColor);
  dryTarget.set(dryColor);
  const baseLuminance = Math.max(luminance(baseTarget), 0.0001);
  tipTarget.multiplyScalar(
    (baseLuminance * tuning.tipLuminanceScale) /
      Math.max(luminance(tipTarget), 0.0001),
  );
  dryTarget.multiplyScalar(
    (baseLuminance * tuning.dryLuminanceScale) /
      Math.max(luminance(dryTarget), 0.0001),
  );
}

/**
 * How much of the lambert lighting response survives the stylization mix. Both
 * the real-blade and the impostor fragment shaders apply it to the same palette
 * result, so colour parity across LODs depends on the two staying identical.
 * It used to be typed as a literal in each shader; it now lives here once and
 * `verify-lod-continuity` reads it from this file.
 */
// Raised from 0.38, where nearly two thirds of a blade's final colour was flat
// unlit albedo. That is what kept shaded grass bright: a blade facing away from
// the sun still returned most of its albedo, so the field had no dark mass for
// sunlit blades to stand against. Depth in a canopy comes from the shadowed
// blades being genuinely dark, not from the lit ones being brighter.
export const GRASS_LIGHT_MIX = 0.62;
export const GRASS_LIGHT_MIX_GLSL = toGlslFloat(GRASS_LIGHT_MIX);

// One palette function is injected into both the real-blade and impostor
// fragment shaders. The impostor atlas stores blade progress and shade rather
// than baked RGB, so presets use this exact curve at every LOD.
export const GRASS_PALETTE_GLSL = `
vec3 grassResolvePalette(
  vec3 baseColor,
  vec3 tipColor,
  vec3 dryColor,
  float progress,
  float shade,
  float dryness,
  float rootAo,
  float tipColorStrength,
  float rootDarkening
) {
  float tipProfile = smoothstep(
    ${toGlslFloat(tuning.tipStart)},
    ${toGlslFloat(tuning.tipEnd)},
    progress
  );
  vec3 healthyColor = mix(
    baseColor,
    tipColor,
    tipProfile * tipColorStrength
  );
  float shadeDryness = clamp(
    (${toGlslFloat(tuning.shadeDrynessPivot)} - shade) *
      ${toGlslFloat(tuning.shadeDrynessScale)},
    0.0,
    ${toGlslFloat(tuning.shadeDrynessMaximum)}
  );
  float instanceDryness = dryness * (
    ${toGlslFloat(tuning.instanceDrynessBase)} +
    tipProfile * ${toGlslFloat(tuning.instanceDrynessTip)}
  );
  vec3 paletteColor = mix(
    healthyColor,
    dryColor,
    clamp(
      shadeDryness + instanceDryness,
      0.0,
      ${toGlslFloat(tuning.drynessMaximum)}
    )
  );
  float rootLight = mix(
    rootDarkening,
    1.0,
    smoothstep(0.0, ${toGlslFloat(tuning.rootFadeEnd)}, progress)
  );
  float bladeVariation = mix(
    ${toGlslFloat(tuning.shadeLightMinimum)},
    ${toGlslFloat(tuning.shadeLightMaximum)},
    shade
  );
  return paletteColor * rootLight * bladeVariation * rootAo;
}
`;
