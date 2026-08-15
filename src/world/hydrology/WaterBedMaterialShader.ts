import { WATER_BED_FRAGMENT_FUNCTIONS } from "./WaterBedShader";
import { WATER_VISIBLE_COVERAGE_THRESHOLD } from "./WaterMaterialTuning";

export const WATER_BED_VERTEX_DECLARATIONS = `
attribute vec4 waterData;
varying vec4 vWaterBedData;
varying vec3 vWaterBedWorldPosition;
`;

export const WATER_BED_VERTEX_POSITION = `
transformed.y -= max(0.0, waterData.y);
vWaterBedData = waterData;
vWaterBedWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

export const WATER_BED_FRAGMENT_DECLARATIONS = `
uniform float uWaterTime;
uniform sampler2D uWaterBedNoise;
uniform float uWaterBedScale;
uniform float uWaterBedStrength;
uniform float uWaterBedRefraction;
uniform float uWaterAlgaeStrength;
uniform float uWaterCausticStrength;
uniform float uWaterRiverReferenceDepth;
uniform vec3 uWaterPebbleDark;
uniform vec3 uWaterPebbleLight;
uniform vec3 uWaterSand;
uniform vec3 uWaterAlgae;
varying vec4 vWaterBedData;
varying vec3 vWaterBedWorldPosition;
${WATER_BED_FRAGMENT_FUNCTIONS}
`;

export const WATER_BED_COLOR_FRAGMENT = `
float waterBedCoverageRaw = saturate(vWaterBedData.x);
if (waterBedCoverageRaw < ${WATER_VISIBLE_COVERAGE_THRESHOLD}) discard;
if (uWaterBedStrength < 0.001) discard;

float waterBedDepth = max(0.0, vWaterBedData.y);
vec2 waterBedPackedFlow = vWaterBedData.zw;
float waterBedRiverAmount = saturate(length(waterBedPackedFlow));
vec2 waterBedFlowDirection = waterBedRiverAmount > 0.001
  ? waterBedPackedFlow / waterBedRiverAmount
  : normalize(vec2(0.78, 0.63));
vec2 waterBedFlowPerpendicular = vec2(
  -waterBedFlowDirection.y,
  waterBedFlowDirection.x
);
vec3 waterBedViewDiff = vWaterBedWorldPosition - cameraPosition;
vec3 waterBedViewRay = length(waterBedViewDiff) > 1e-4
  ? normalize(waterBedViewDiff)
  : vec3(0.0, -1.0, 0.0);
float waterBedGrazing = 1.0 - saturate(abs(waterBedViewRay.y));
float waterBedWobble = sin(
  dot(vWaterBedWorldPosition.xz, waterBedFlowPerpendicular) * 0.18 +
  uWaterTime * mix(0.12, 0.34, waterBedRiverAmount)
);
float bedDepthRatio =
  waterBedDepth / max(0.1, uWaterRiverReferenceDepth);
float bedChannelCore = smoothstep(0.40, 0.88, waterBedCoverageRaw);
float bedRiffle =
  waterBedRiverAmount *
  bedChannelCore *
  (1.0 - smoothstep(0.68, 1.02, bedDepthRatio));
float bedPool =
  waterBedRiverAmount *
  bedChannelCore *
  smoothstep(1.05, 1.24, bedDepthRatio);
float bedBank =
  waterBedRiverAmount *
  (1.0 - smoothstep(0.42, 0.86, waterBedCoverageRaw));
vec2 waterBedPosition = vWaterBedWorldPosition.xz +
  waterBedViewRay.xz * waterBedDepth * uWaterBedRefraction *
    (0.025 + waterBedGrazing * 0.05) +
  waterBedFlowPerpendicular * waterBedWobble * waterBedDepth *
    uWaterBedRefraction * 0.018;

float waterBedRelief = 0.0;
vec3 waterBedColor = waterSampleRiverBed(
  waterBedPosition,
  waterBedFlowDirection,
  uWaterTime,
  waterBedRiverAmount,
  bedRiffle,
  bedPool,
  bedBank,
  bedChannelCore,
  waterBedRelief
);
waterBedColor *= 0.96 + waterBedRelief * 0.06;
waterBedColor *= 1.0 - bedPool * 0.05;

float waterBedShallow = 1.0 - smoothstep(0.18, 2.4, waterBedDepth);
float waterBedCausticA = texture2D(
  uWaterBedNoise,
  waterBedPosition * uWaterBedScale * 2.35 + vec2(uWaterTime * 0.031, -uWaterTime * 0.019)
).r;
float waterBedCausticB = texture2D(
  uWaterBedNoise,
  waterBedPosition * uWaterBedScale * 1.62 - vec2(uWaterTime * 0.022, uWaterTime * 0.027)
).g;
float waterBedCaustic = waterBedCausticA * waterBedCausticB * waterBedShallow *
  uWaterCausticStrength;
waterBedColor *= 1.0 + waterBedCaustic * 0.28;

float waterBedCoverage = smoothstep(0.025, 0.34, waterBedCoverageRaw);
float waterBedDither = fract(dot(floor(mod(gl_FragCoord.xy, 4.0)), vec2(0.17, 0.37)));
if (waterBedCoverage * uWaterBedStrength < 0.14 + waterBedDither * 0.52) discard;
diffuseColor.rgb = waterBedColor;
diffuseColor.a = 1.0;
`;
