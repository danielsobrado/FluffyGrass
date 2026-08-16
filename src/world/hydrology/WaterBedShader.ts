export const WATER_BED_FRAGMENT_FUNCTIONS = `
vec3 waterSampleRiverBed(
  vec2 bedPosition,
  vec2 flowDirection,
  float time,
  float riverAmount,
  float bedRiffle,
  float bedPool,
  float bedBank,
  float bedChannelCore,
  out float relief
) {
  vec4 bed = texture2D(uWaterBedNoise, bedPosition * uWaterBedScale);
  float pebble = bed.r;
  float shade = bed.a;
  float coarseBias =
    bedRiffle * 0.24 +
    bedChannelCore * 0.04 -
    bedPool * 0.16;
  pebble = saturate(pebble + coarseBias);
  float fineDeposition = saturate(
    bedPool * 0.20 +
    bedBank * 0.12
  );
  pebble *= 1.0 - fineDeposition;

  vec3 stone = mix(uWaterPebbleDark, uWaterPebbleLight, bed.g);
  vec3 sand = mix(uWaterPebbleLight, uWaterSand, 0.62) * (0.9 + bed.g * 0.2);
  vec3 color = mix(sand, stone, pebble);
  // Baked cobble shading may only take light away. The old 1.30 ceiling let a
  // lit cobble top exceed its own albedo, which is where the snow read began.
  color *= 0.42 + shade * 0.58;

  float sway = sin(time * 0.9 + bedPosition.x * 0.4 + bedPosition.y * 0.27);
  vec2 algaeDrift = flowDirection * sway * (0.06 + 0.22 * riverAmount);
  float algae = texture2D(
    uWaterBedNoise,
    (bedPosition + algaeDrift) * uWaterBedScale * 0.45
  ).b;
  algae = smoothstep(0.66, 0.93, algae) * uWaterAlgaeStrength;
  algae *= mix(1.0, 0.55, pebble);
  algae *= clamp(1.0 + bedBank * 0.24 - bedRiffle * 0.28, 0.58, 1.24);
  color = mix(color, uWaterAlgae * (0.68 + shade * 0.5), algae);

  relief = pebble * (1.0 - algae * 0.5);
  return color;
}
`;
