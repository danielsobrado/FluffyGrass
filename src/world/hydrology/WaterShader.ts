import { WATER_FLOW_FRAGMENT_FUNCTIONS } from "./WaterFlowShader";
import { WATER_VISIBLE_COVERAGE_THRESHOLD } from "./WaterMaterialTuning";

export const WATER_VERTEX_DECLARATIONS = `
attribute vec4 waterData;
attribute vec2 waterInteraction;
varying vec4 vWaterData;
varying vec2 vWaterInteraction;
varying vec3 vWaterWorldPosition;
varying vec3 vWaterWorldNormal;
`;

export const WATER_VERTEX_POSITION = `
vWaterData = waterData;
vWaterInteraction = waterInteraction;
vWaterWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
vWaterWorldNormal = (modelMatrix * vec4(objectNormal, 0.0)).xyz;
`;

export const WATER_FRAGMENT_DECLARATIONS = `
uniform float uWaterTime;
uniform float uWaterOpacity;
uniform float uWaterRippleStrength;
uniform float uWaterRippleScale;
uniform float uWaterFlowSpeed;
uniform float uWaterFoamStrength;
uniform float uWaterFresnelStrength;
uniform float uWaterDepthFade;
uniform float uWaterDetailDistance;
uniform float uWaterLakeWaveStrength;
uniform sampler2D uWaterFlowNoise;
uniform float uWaterFlowNoiseScale;
uniform float uWaterFlowNoiseStrength;
uniform float uWaterGlintStrength;
uniform float uWaterStoneWakeStrength;
uniform vec3 uWaterShallow;
uniform vec3 uWaterDeep;
uniform vec3 uWaterReflection;
uniform vec3 uWaterFoam;
uniform vec3 uWaterAbsorption;
uniform vec3 uWaterSunDirection;
uniform float uWaterFresnelF0;
varying vec4 vWaterData;
varying vec2 vWaterInteraction;
varying vec3 vWaterWorldPosition;
varying vec3 vWaterWorldNormal;
${WATER_FLOW_FRAGMENT_FUNCTIONS}
`;

export const WATER_SURFACE_FRAGMENT = `
float waterCoverageRaw = saturate(vWaterData.x);
float waterNormalLength = length(vWaterWorldNormal);
vec3 waterGeometricNormal = waterNormalLength > 1e-4
  ? vWaterWorldNormal / waterNormalLength
  : vec3(0.0, 1.0, 0.0);
if (waterGeometricNormal.y < 0.0) waterGeometricNormal = -waterGeometricNormal;
if (waterCoverageRaw < ${WATER_VISIBLE_COVERAGE_THRESHOLD}) discard;

float waterCoverage = smoothstep(0.015, 0.34, waterCoverageRaw);
float waterDepth = max(0.0, vWaterData.y);
vec2 waterPackedFlow = vWaterData.zw;
float waterRiverAmount = saturate(length(waterPackedFlow));
vec2 waterFlowDirection = waterRiverAmount > 0.001
  ? waterPackedFlow / waterRiverAmount
  : normalize(vec2(0.78, 0.63));
vec2 waterFlowPerpendicular = vec2(-waterFlowDirection.y, waterFlowDirection.x);
vec2 waterPosition = vWaterWorldPosition.xz;
float waterDistance = distance(cameraPosition, vWaterWorldPosition);
float waterDetailWeight = 1.0 - smoothstep(
  uWaterDetailDistance * 0.55,
  uWaterDetailDistance,
  waterDistance
);
float waterScale = uWaterRippleScale;
float waterTime = uWaterTime;
vec4 waterFlowNoise = vec4(0.5);
if (waterDetailWeight > 0.001) {
  waterFlowNoise = waterSampleAdvectedNoise(
    waterPosition,
    waterFlowDirection,
    waterTime,
    uWaterFlowNoiseScale,
    uWaterFlowSpeed * mix(0.2, 1.0, waterRiverAmount)
  );
}
vec2 waterNoiseOffset = (waterFlowNoise.rg * 2.0 - 1.0) *
  uWaterFlowNoiseStrength * waterDetailWeight;
vec2 waterWavePosition = waterPosition +
  (waterFlowDirection * waterNoiseOffset.x +
    waterFlowPerpendicular * waterNoiseOffset.y) *
  (0.12 / max(0.01, uWaterFlowNoiseScale));

vec2 waterLakeSlope = vec2(0.0);
if (waterRiverAmount < 0.98) {
  vec2 waterLakeDirectionA = normalize(vec2(0.86, 0.51));
  vec2 waterLakeDirectionB = normalize(vec2(-0.39, 0.92));
  vec2 waterLakeDirectionC = normalize(vec2(0.21, -0.98));
  float waterLakePhaseA = dot(waterWavePosition, waterLakeDirectionA) * waterScale * 1.12 + waterTime * 0.46;
  float waterLakePhaseB = dot(waterWavePosition, waterLakeDirectionB) * waterScale * 1.83 - waterTime * 0.31;
  float waterLakePhaseC = dot(waterWavePosition, waterLakeDirectionC) * waterScale * 2.71 + waterTime * 0.22;
  waterLakeSlope =
    waterLakeDirectionA * cos(waterLakePhaseA) * 0.52 +
    waterLakeDirectionB * cos(waterLakePhaseB) * 0.31 +
    waterLakeDirectionC * cos(waterLakePhaseC) * 0.17;
}

float waterRiverPhaseA = 0.0;
float waterRiverPhaseB = 0.0;
float waterRiverPhaseC = 0.0;
vec2 waterRiverSlope = vec2(0.0);
if (waterRiverAmount > 0.02) {
  waterRiverPhaseA =
    dot(waterWavePosition, waterFlowPerpendicular) * waterScale * 2.85 +
    dot(waterWavePosition, waterFlowDirection) * waterScale * 0.34 -
    waterTime * uWaterFlowSpeed * 2.2;
  waterRiverPhaseB =
    dot(waterWavePosition, waterFlowPerpendicular) * waterScale * 5.1 -
    dot(waterWavePosition, waterFlowDirection) * waterScale * 0.18 -
    waterTime * uWaterFlowSpeed * 3.65;
  waterRiverPhaseC =
    dot(waterWavePosition, waterFlowDirection) * waterScale * 1.35 +
    dot(waterWavePosition, waterFlowPerpendicular) * waterScale * 0.72 -
    waterTime * uWaterFlowSpeed * 1.15;
  waterRiverSlope =
    waterFlowPerpendicular *
      (cos(waterRiverPhaseA) * 0.64 + cos(waterRiverPhaseB) * 0.27) +
    waterFlowDirection * cos(waterRiverPhaseC) * 0.16;
}

vec2 waterMicroSlope = vec2(0.0);
if (waterDetailWeight > 0.001) {
  vec2 waterMicroDirectionA = normalize(vec2(0.94, -0.34));
  vec2 waterMicroDirectionB = normalize(vec2(-0.62, -0.78));
  float waterMicroPhaseA = dot(waterWavePosition, waterMicroDirectionA) * waterScale * 7.4 + waterTime * 1.34;
  float waterMicroPhaseB = dot(waterWavePosition, waterMicroDirectionB) * waterScale * 10.1 - waterTime * 1.08;
  waterMicroSlope =
    (waterMicroDirectionA * cos(waterMicroPhaseA) * 0.16 +
      waterMicroDirectionB * cos(waterMicroPhaseB) * 0.11) *
    waterDetailWeight;
}

float waterStoneObstacle = saturate(vWaterInteraction.x);
float waterStoneWake = saturate(vWaterInteraction.y) * (1.0 - waterStoneObstacle);
float waterStoneEdge = waterResolveStoneEdge(waterStoneObstacle);
float waterStoneDepthMask = 1.0 - smoothstep(1.4, 4.2, waterDepth);
float waterStoneActivity = saturate(
  (waterStoneEdge * 0.82 + waterStoneWake * 0.64) *
  uWaterStoneWakeStrength * waterDetailWeight * waterStoneDepthMask *
  mix(0.3, 1.0, waterRiverAmount)
);
float waterWaveStrength = uWaterRippleStrength * mix(
  uWaterLakeWaveStrength,
  1.0,
  waterRiverAmount
);
vec2 waterNoiseSlope =
  (waterFlowPerpendicular * (waterFlowNoise.g - 0.5) * 0.42 +
    waterFlowDirection * (waterFlowNoise.r - 0.5) * 0.18) *
  uWaterFlowNoiseStrength * waterDetailWeight * mix(0.35, 1.0, waterRiverAmount);
vec2 waterSlope = mix(waterLakeSlope, waterRiverSlope, waterRiverAmount) *
  waterWaveStrength + waterMicroSlope * uWaterRippleStrength + waterNoiseSlope;
waterSlope +=
  (waterFlowPerpendicular * (waterFlowNoise.g - 0.5) * 0.28 +
    waterFlowDirection * (waterFlowNoise.r - 0.5) * 0.12) * waterStoneActivity;

vec3 waterWorldNormal = normalize(
  waterGeometricNormal + vec3(-waterSlope.x, 0.0, -waterSlope.y)
);
vec3 waterLightingNormal = gl_FrontFacing ? waterWorldNormal : -waterWorldNormal;
normal = normalize((viewMatrix * vec4(waterLightingNormal, 0.0)).xyz);

vec3 waterAbsorption = (vec3(1.0) - uWaterAbsorption) / max(0.01, uWaterDepthFade);
vec3 waterTransmittance = exp(-waterAbsorption * waterDepth);
vec3 waterSurfaceColor = uWaterShallow * waterTransmittance +
  uWaterDeep * (1.0 - waterTransmittance);

if (waterRiverAmount > 0.02) {
  float waterFlowSheen = 0.5 + 0.5 * sin(
    dot(waterWavePosition, waterFlowPerpendicular) * waterScale * 3.7 -
    waterTime * uWaterFlowSpeed * 1.9
  );
  waterSurfaceColor *= 0.975 + waterFlowSheen * 0.035 * waterRiverAmount;
}

vec3 waterViewDiff = cameraPosition - vWaterWorldPosition;
vec3 waterViewDirection = length(waterViewDiff) > 1e-4
  ? normalize(waterViewDiff)
  : vec3(0.0, 1.0, 0.0);
float waterFacing = saturate(dot(waterLightingNormal, waterViewDirection));
float waterFresnel = uWaterFresnelF0 +
  (1.0 - uWaterFresnelF0) * pow(1.0 - waterFacing, 5.0);
float waterFresnelVisual = saturate(waterFresnel * uWaterFresnelStrength);
waterSurfaceColor = mix(waterSurfaceColor, uWaterReflection, waterFresnelVisual * 0.42);
vec3 waterSunPlusView = uWaterSunDirection + waterViewDirection;
vec3 waterHalfVector = length(waterSunPlusView) > 1e-4
  ? normalize(waterSunPlusView)
  : waterLightingNormal;
float waterSunSpecular = pow(
  saturate(dot(waterLightingNormal, waterHalfVector)),
  96.0
);
float waterGlintBreakup = mix(0.62, 1.0, waterFlowNoise.a);
float waterGlint = waterSunSpecular * waterGlintBreakup *
  waterDetailWeight * uWaterGlintStrength;
waterSurfaceColor = mix(waterSurfaceColor, uWaterReflection, waterGlint * 0.16);

float waterShoreBand =
  (1.0 - smoothstep(0.16, 0.66, waterCoverageRaw)) *
  smoothstep(0.025, 0.11, waterCoverageRaw);
waterShoreBand *= 1.0 - smoothstep(0.28, 0.9, waterDepth);
float waterRiverFoam = 0.0;
if (waterRiverAmount > 0.02 && waterDetailWeight > 0.001) {
  float waterRifflePattern = 0.5 + 0.5 * sin(
    waterRiverPhaseA * 1.43 + sin(waterRiverPhaseB) * 0.86 +
    (waterFlowNoise.g - 0.5) * 2.2
  );
  waterRiverFoam = smoothstep(0.82, 0.97, waterRifflePattern) *
    waterRiverAmount * waterDetailWeight;
}
float waterStoneFoam = waterStoneActivity * (0.62 + waterFlowNoise.b * 0.38);
float waterFoamAmount = saturate(
  (waterShoreBand * 0.78 + waterRiverFoam * 0.16 + waterStoneFoam * 0.56) *
  uWaterFoamStrength
);
waterSurfaceColor = mix(waterSurfaceColor, uWaterFoam, waterFoamAmount);
roughnessFactor = clamp(
  roughnessFactor + waterRiverAmount * waterDetailWeight * 0.035 +
    waterStoneActivity * 0.08 + waterFoamAmount * 0.48 - waterGlint * 0.025,
  0.02,
  0.75
);

diffuseColor.rgb = waterSurfaceColor;
float waterTransmittanceLuma = dot(
  waterTransmittance,
  vec3(0.2126, 0.7152, 0.0722)
);
float waterAlpha = uWaterOpacity * waterCoverage *
  mix(0.16, 0.88, 1.0 - waterTransmittanceLuma);
waterAlpha = mix(waterAlpha, min(1.0, waterAlpha + 0.22), waterFoamAmount);
diffuseColor.a *= waterAlpha;
`;
