export const WATER_BED_FRAGMENT_FUNCTIONS = `
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
  vec3 sand = mix(uWaterPebbleLight, uWaterSand, 0.62) * (0.9 + bed.g * 0.2);
  vec3 color = mix(sand, stone, pebble);
  color *= 0.52 + shade * 0.78;

  float sway = sin(time * 0.9 + bedPosition.x * 0.4 + bedPosition.y * 0.27);
  vec2 algaeDrift = flowDirection * sway * (0.06 + 0.22 * riverAmount);
  float algae = texture2D(
    uWaterBedNoise,
    (bedPosition + algaeDrift) * uWaterBedScale * 0.45
  ).b;
  algae = smoothstep(0.66, 0.93, algae) * uWaterAlgaeStrength;
  algae *= mix(1.0, 0.55, pebble);
  color = mix(color, uWaterAlgae * (0.68 + shade * 0.5), algae);

  relief = pebble * (1.0 - algae * 0.5);
  return color;
}
`;
