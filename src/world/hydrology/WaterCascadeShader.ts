/**
 * Falling water.
 *
 * A curtain is not a river surface seen edge-on: it accelerates, it separates
 * into strands, it is thin and bright where it leaves the lip and dense and
 * white where it lands. Everything here keys off the fall progress carried in
 * the geometry, so one material covers a 2 m cascade and a 20 m plunge.
 */
export const WATER_CASCADE_VERTEX_DECLARATIONS = `
attribute vec3 cascade;
varying vec3 vCascade;
varying vec3 vCascadeWorldPosition;
`;

export const WATER_CASCADE_VERTEX_POSITION = `
vCascade = cascade;
vCascadeWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

export const WATER_CASCADE_FRAGMENT_DECLARATIONS = `
uniform float uCascadeTime;
uniform float uCascadeFoamStrength;
uniform float uCascadeMistStrength;
uniform float uCascadeDetailDistance;
uniform sampler2D uCascadeNoise;
uniform float uCascadeNoiseScale;
uniform vec3 uCascadeWater;
uniform vec3 uCascadeFoam;
uniform vec3 uCascadeMist;
varying vec3 vCascade;
varying vec3 vCascadeWorldPosition;
`;

export const WATER_CASCADE_FRAGMENT = `
float cascadeAcross = vCascade.x;
float cascadeFall = clamp(vCascade.y, 0.0, 1.0);
float cascadeDrop = max(0.5, vCascade.z);

float cascadeDistance = distance(cameraPosition, vCascadeWorldPosition);
float cascadeDetail = 1.0 - smoothstep(
  uCascadeDetailDistance * 0.55,
  uCascadeDetailDistance,
  cascadeDistance
);

/**
 * Water in free fall keeps accelerating, so the streaks stretch and speed up on
 * the way down. Scrolling at a constant rate is the single thing that most
 * makes a curtain read as a texture on a wall rather than as falling water.
 *
 * The domain is deliberately many tiles across and only a few tall: that ratio
 * is what turns the noise into vertical strands instead of a cloudy wash. An
 * earlier version scaled both axes by the noise scale and covered less than one
 * tile in each, which is why the sheet came out looking like frosted glass.
 */
float cascadeSpeed = 0.55 + 2.4 * cascadeFall;
float cascadeStretch = mix(1.0, 3.2, cascadeFall);
float cascadeStrandUv = cascadeAcross * 6.0;
float cascadeFlowUv =
  cascadeFall * cascadeDrop * uCascadeNoiseScale * 2.6 / cascadeStretch -
  uCascadeTime * cascadeSpeed;
vec4 cascadeNoise = texture2D(uCascadeNoise, vec2(cascadeStrandUv, cascadeFlowUv));
vec4 cascadeCoarse = texture2D(
  uCascadeNoise,
  vec2(cascadeStrandUv * 0.37 + 0.21, cascadeFlowUv * 0.44 - uCascadeTime * 0.35)
);

/**
 * Strands. The sheet leaves the lip whole and pulls apart as it falls, so the
 * fine layer is mixed in only once the fall is under way. Without the coarse
 * layer underneath, every strand is the same width and the curtain stripes.
 */
float cascadeBreakup = smoothstep(0.1, 0.95, cascadeFall);
float cascadeStrand = mix(cascadeCoarse.r, cascadeNoise.g, 0.4 + 0.45 * cascadeBreakup);
float cascadeGap = smoothstep(0.28, 0.72, cascadeStrand);
float cascadeSheet = 1.0 - cascadeBreakup * cascadeGap * 0.85;

// The lip runs thin and bright; the middle aerates; the base is whitewater.
float cascadeCrest = 1.0 - smoothstep(0.0, 0.12, cascadeFall);
// Broken by the strand noise so the base is a ragged boil, not a painted band.
float cascadeImpact = saturate(
  smoothstep(0.55, 1.0, cascadeFall) *
  (0.55 + 0.75 * cascadeCoarse.b) +
  smoothstep(0.86, 1.0, cascadeFall) * 0.35
);
/**
 * Aeration is what makes falling water white, and it starts the moment the
 * sheet leaves the lip rather than only at the base. Holding it low through the
 * middle left the curtain a grey pane between a bright crest and a bright foot.
 */
float cascadeAeration = saturate(
  0.28 + cascadeBreakup * 0.62 + cascadeImpact * 0.95 +
  (1.0 - cascadeGap) * 0.24 * cascadeDetail
);

vec3 cascadeColor = mix(uCascadeWater, uCascadeFoam, cascadeAeration);
cascadeColor = mix(cascadeColor, uCascadeMist, cascadeImpact * uCascadeMistStrength * 0.5);
// Falling water is lit from every side at once and is the brightest thing in a
// gorge. Keeping it near its own albedo, rather than shading it down like a
// surface, is what stops it reading as a pane of dirty glass.
cascadeColor *= 0.96 + cascadeSheet * 0.16 + cascadeCrest * 0.24;

/**
 * The curtain has to lose its own silhouette at both edges and at the base, or
 * the geometry's rectangle shows. Noise on the edge stops that boundary being a
 * straight line down the sides of the fall.
 */
float cascadeEdgeNoise = 0.55 + cascadeCoarse.g * 0.3;
float cascadeEdge = 1.0 - smoothstep(0.36 * cascadeEdgeNoise, 0.98, abs(cascadeAcross));
/**
 * The gaps between strands have to be genuinely see-through. A curtain that is
 * uniformly semi-opaque is a wall; one you can read the gorge through in the
 * gaps, with dense white water between them, is a waterfall.
 */
float cascadeAlpha = saturate(
  (0.16 + cascadeAeration * 0.95 * uCascadeFoamStrength) *
  cascadeEdge *
  mix(0.12, 1.0, cascadeSheet)
);
// Spray at the base has no surface of its own, so it thins out instead of
// ending on the cut line where the curtain geometry stops.
cascadeAlpha *= 1.0 - smoothstep(0.82, 1.0, cascadeFall) * 0.55;
cascadeAlpha = max(cascadeAlpha, cascadeCrest * 0.5 * cascadeEdge);

diffuseColor.rgb = cascadeColor;
diffuseColor.a *= cascadeAlpha;
`;
