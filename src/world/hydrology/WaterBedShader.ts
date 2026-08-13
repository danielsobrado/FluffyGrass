export const WATER_BED_FRAGMENT_FUNCTIONS = `
/**
 * Where the bed appears from here. The sheet is drawn at the water surface, so the
 * bed has to be stepped down to along the view ray, and the wave slope bends that
 * step the way real refraction does - which is what makes the stones swim about.
 */
vec2 waterResolveBedPosition(vec2 slope, float depth) {
  vec3 viewRay = normalize(vWaterWorldPosition - cameraPosition);
  // Clamped so a grazing view smears the bed instead of shooting it to infinity.
  float descent = depth / max(0.25, -viewRay.y);
  return vWaterWorldPosition.xz +
    viewRay.xz * descent +
    slope * depth * uWaterBedRefraction;
}

/** Cobbles, sand, and algae as one opaque bed colour, before any water tint. */
vec3 waterSampleRiverBed(
  vec2 bedPosition,
  vec2 flowDirection,
  float time,
  float riverAmount,
  out float relief
) {
  vec4 bed = texture2D(uWaterBedNoise, bedPosition * uWaterBedScale);
  float pebble = bed.r;
  float shade = bed.a;

  vec3 stone = mix(uWaterPebbleDark, uWaterPebbleLight, bed.g);
  // Sand between the stones stays flatter and paler than the cobbles standing in it.
  vec3 sand = mix(uWaterPebbleLight, uWaterSand, 0.62) * (0.9 + bed.g * 0.2);
  vec3 color = mix(sand, stone, pebble);
  // The baked dome light is what turns flat discs into stones you can pick out.
  color *= 0.52 + shade * 0.78;

  // Algae streams downstream where there is current and only breathes where there
  // is not, so the sway leans on the flow direction and never fully stops.
  float sway = sin(time * 0.9 + bedPosition.x * 0.4 + bedPosition.y * 0.27);
  vec2 algaeDrift = flowDirection * sway * (0.06 + 0.22 * riverAmount);
  float algae = texture2D(uWaterBedNoise, (bedPosition + algaeDrift) * uWaterBedScale * 0.45).b;
  algae = smoothstep(0.66, 0.93, algae) * uWaterAlgaeStrength;
  // Weed takes hold in the sand and on stone tops, not on bare swept gravel.
  algae *= mix(1.0, 0.55, pebble);
  color = mix(color, uWaterAlgae * (0.68 + shade * 0.5), algae);

  relief = pebble * (1.0 - algae * 0.5);
  return color;
}
`;
