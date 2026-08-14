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
uniform float uWaterDepthFade;
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
vec3 waterBedViewRay = normalize(vWaterBedWorldPosition - cameraPosition);
float waterBedGrazing = 1.0 - saturate(abs(waterBedViewRay.y));
float waterBedWobble = sin(
  dot(vWaterBedWorldPosition.xz, waterBedFlowPerpendicular) * 0.18 +
  uWaterTime * mix(0.12, 0.34, waterBedRiverAmount)
);
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
  waterBedRelief
);
waterBedColor *= 0.96 + waterBedRelief * 0.06;

float waterBedCoverage = smoothstep(0.025, 0.34, waterBedCoverageRaw);
float waterBedDepthVisibility = 1.0 - smoothstep(
  0.0,
  max(0.01, uWaterDepthFade) * 2.6,
  waterBedDepth
);
diffuseColor.rgb = waterBedColor;
diffuseColor.a *= uWaterBedStrength * waterBedCoverage * waterBedDepthVisibility;
`;
