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
  float occlusion = rootLight * bladeVariation * rootAo;
  vec3 shadedColor = paletteColor * occlusion;
  float groundContact = 1.0 - smoothstep(
    ${toGlslFloat(tuning.groundContactStart)},
    ${toGlslFloat(tuning.groundContactEnd)},
    progress
  );
  vec3 groundColor = mix(
    baseColor * ${toGlslFloat(tuning.groundContactBaseScale)},
    dryColor * ${toGlslFloat(tuning.groundContactDryScale)},
    dryness
  ) * occlusion;
  shadedColor = mix(
    shadedColor,
    groundColor,
    groundContact * ${toGlslFloat(tuning.groundContactStrength)}
  );
  // Root darkening and shade variation are scalars, so a blade can get darker
  // without its green ever getting less pure — and a dark, fully saturated
  // green is not a colour ACES can carry. Its output matrix takes red negative
  // and the clamp eats it: in a settled capture 7.5% of near-field vegetation
  // pixels had red at exactly zero, against 0.0% in the far field. That
  // clipping is most of what reads as a neon carpet rather than a meadow, and
  // no amount of palette retuning fixes it while the darkening stays purely
  // multiplicative. Ground contact mixes toward a brown/olive, but that mix is
  // still lit by the same occlusion so shadowed roots cannot lift.
  //
  // Shadowed vegetation is lit by the sky and by bounce off the ground, not by
  // nothing, so it loses saturation as it darkens. Letting it do that here puts
  // the albedo back inside the gamut as a side effect of being more correct.
  //
  // The blend runs toward the colour's own luminance, so it cannot shift the
  // field's brightness — which is what lets one shared function change every
  // LOD at once without moving the near/mid/far parity budget.
  return mix(
    shadedColor,
    vec3(dot(shadedColor, vec3(
      ${toGlslFloat(GRASS_LUMINANCE_WEIGHTS.x)},
      ${toGlslFloat(GRASS_LUMINANCE_WEIGHTS.y)},
      ${toGlslFloat(GRASS_LUMINANCE_WEIGHTS.z)}
    ))),
    clamp(
      (1.0 - occlusion) * ${toGlslFloat(tuning.shadowDesaturation)},
      0.0,
      1.0
    )
  );
}
`;
