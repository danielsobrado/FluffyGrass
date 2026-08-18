/**
 * Shared water optics for the high-quality preset.
 *
 * Reimplemented from the optical model in tuxalin/water-shader (MIT, recorded in
 * THIRD_PARTY_NOTICES.md) rather than copied: the useful idea there is that a
 * water surface should not read as one tinted sheet but as a transition, shore
 * to shallow to deep, driven by how far light actually travelled through the
 * column. Its projection, wind waves and screen-space lookups assume a
 * horizontal surface and are deliberately not taken — this project's flow
 * direction, regimes and bend asymmetry come from the hydrology and are better
 * than anything a wind model would produce.
 *
 * What the standard path already does well is kept: Beer-Lambert transmittance
 * over the real depth, with the bed drawn as opaque geometry beneath rather than
 * reconstructed from a refraction buffer. So this adds the parts that were
 * genuinely missing — a shore band that thins toward the waterline, a deep term
 * that saturates rather than darkening forever, and a Fresnel balance that
 * carries grazing reflection without washing the whole surface to sky.
 */
export const WATER_OPTICS_FRAGMENT_FUNCTIONS = `
uniform float uWaterOpticsQuality;
uniform vec3 uWaterAbsorption;
uniform float uWaterDepthFade;
uniform float uWaterFresnelF0;
uniform float uWaterOpticsShoreFade;
uniform float uWaterOpticsDeepStart;
uniform float uWaterOpticsReflectionGain;

/**
 * Optical depth along the view ray rather than straight down.
 *
 * A surface seen at a grazing angle is looked through for much further than its
 * vertical depth, which is why a pool goes deep-coloured toward the far bank and
 * pale at your feet. Clamped, because at the horizon the path length runs away.
 */
float waterOpticsPathLength(float depth, float viewY) {
  float grazing = 1.0 / max(0.18, abs(viewY));
  return depth * min(grazing, 4.5);
}

/**
 * Shore to shallow to deep, as one curve.
 *
 * Returns the weight of the deep tint. The shore end is faded rather than cut
 * so the waterline does not draw itself as a hard band, and the deep end
 * saturates so that a plunge pool does not keep darkening without limit.
 */
float waterOpticsDepthBlend(float pathLength) {
  float shore = smoothstep(0.0, uWaterOpticsShoreFade, pathLength);
  float deep = smoothstep(uWaterOpticsShoreFade, uWaterOpticsDeepStart, pathLength);
  return shore * mix(0.35, 1.0, deep);
}

/**
 * Surface colour and transmittance in one call.
 *
 * Kept here rather than inlined in the surface shader so the two presets sit
 * side by side and the surface shader stays about flow, regime and foam. The
 * transmittance is returned because the alpha term downstream needs the same
 * value, and recomputing it would let the two drift apart.
 */
vec3 waterOpticsResolveColor(
  vec3 shallow,
  vec3 deep,
  float depth,
  vec3 worldPosition,
  vec3 eye,
  out vec3 transmittance
) {
  vec3 absorption = (vec3(1.0) - uWaterAbsorption) / max(0.01, uWaterDepthFade);
  vec3 offset = worldPosition - eye;
  float viewY = length(offset) > 1e-4 ? normalize(offset).y : -1.0;
  float optical = uWaterOpticsQuality > 0.5
    ? waterOpticsPathLength(depth, viewY)
    : depth;
  transmittance = exp(-absorption * optical);
  vec3 color = shallow * transmittance + deep * (1.0 - transmittance);
  if (uWaterOpticsQuality > 0.5) {
    color = mix(shallow, color, waterOpticsDepthBlend(optical));
  }
  return color;
}

/**
 * Fresnel weight for the reflection mix.
 *
 * Schlick, with the grazing end pulled back deliberately. A physically exact
 * curve turns every shallow-angle pixel into sky, which is correct for a calm
 * lake seen from the shore and wrong for a river read from inside a gorge,
 * where it erases the depth the rest of this model just established.
 */
float waterOpticsFresnel(float facing) {
  float f0 = uWaterFresnelF0;
  float schlick = f0 + (1.0 - f0) * pow(1.0 - facing, 5.0);
  // The gain only applies to the high preset; standard keeps exact Schlick.
  return uWaterOpticsQuality > 0.5 ? schlick * uWaterOpticsReflectionGain : schlick;
}
`;
