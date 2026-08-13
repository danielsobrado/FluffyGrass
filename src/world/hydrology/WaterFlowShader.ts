export const WATER_FLOW_FRAGMENT_FUNCTIONS = `
vec4 waterSampleAdvectedNoise(
  sampler2D noiseTexture,
  vec2 position,
  vec2 flowDirection,
  float time,
  float scale,
  float speed
) {
  vec2 perpendicular = vec2(-flowDirection.y, flowDirection.x);
  vec2 flowSpace = vec2(
    dot(position, flowDirection),
    dot(position, perpendicular)
  );
  vec2 warpUv = position * scale * 0.31 + vec2(time * 0.007, -time * 0.005);
  vec2 warp = texture2D(noiseTexture, warpUv).rg * 2.0 - 1.0;
  float travel = time * speed * scale * 0.18;
  vec2 primaryUv =
    flowSpace * vec2(scale * 0.58, scale * 1.42) +
    warp * 0.075 +
    vec2(-travel, 0.0);
  vec2 secondaryUv =
    flowSpace.yx * vec2(scale * 1.11, scale * 0.73) +
    warp.yx * 0.052 +
    vec2(0.37, -travel * 0.61);
  vec4 primary = texture2D(noiseTexture, primaryUv);
  vec4 secondary = texture2D(noiseTexture, secondaryUv);
  return vec4(
    mix(primary.r, secondary.r, 0.34),
    mix(primary.g, secondary.g, 0.46),
    mix(primary.b, secondary.b, 0.38),
    max(primary.a, secondary.a * 0.92)
  );
}

float waterResolveStoneEdge(float obstacle) {
  return
    smoothstep(0.04, 0.42, obstacle) *
    (1.0 - smoothstep(0.72, 0.98, obstacle));
}
`;
