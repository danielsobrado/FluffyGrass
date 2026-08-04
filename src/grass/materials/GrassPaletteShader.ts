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
