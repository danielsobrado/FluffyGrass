export const WATER_VERTEX_DECLARATIONS = `
attribute vec4 waterData;
varying vec4 vWaterData;
varying vec3 vWaterWorldPosition;
`;

export const WATER_VERTEX_POSITION = `
vWaterData = waterData;
vWaterWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
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
uniform vec3 uWaterShallow;
uniform vec3 uWaterDeep;
uniform vec3 uWaterReflection;
uniform vec3 uWaterFoam;
varying vec4 vWaterData;
varying vec3 vWaterWorldPosition;
`;

export const WATER_SURFACE_FRAGMENT = `
float waterCoverageRaw = saturate(vWaterData.x);
vec3 waterScreenDx = dFdx(vWaterWorldPosition);
vec3 waterScreenDy = dFdy(vWaterWorldPosition);
vec3 waterGeometricNormal = normalize(cross(waterScreenDx, waterScreenDy));
if (waterGeometricNormal.y < 0.0) waterGeometricNormal = -waterGeometricNormal;
if (waterCoverageRaw < 0.012) discard;

float waterCoverage = smoothstep(0.015, 0.34, waterCoverageRaw);
float waterDepth = max(0.0, vWaterData.y);
vec2 waterPackedFlow = vWaterData.zw;
float waterRiverAmount = saturate(length(waterPackedFlow));
vec2 waterFlowDirection = waterRiverAmount > 0.001
  ? waterPackedFlow / waterRiverAmount
  : normalize(vec2(0.78, 0.63));
if (waterRiverAmount > 0.001 && waterGeometricNormal.y > 0.05) {
  vec2 waterHeightGradient =
    -waterGeometricNormal.xz / waterGeometricNormal.y;
  if (dot(waterHeightGradient, waterFlowDirection) > 0.0) {
    waterFlowDirection = -waterFlowDirection;
  }
}
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

vec2 waterLakeSlope = vec2(0.0);
if (waterRiverAmount < 0.98) {
  vec2 waterLakeDirectionA = normalize(vec2(0.86, 0.51));
  vec2 waterLakeDirectionB = normalize(vec2(-0.39, 0.92));
  vec2 waterLakeDirectionC = normalize(vec2(0.21, -0.98));
  float waterLakePhaseA =
    dot(waterPosition, waterLakeDirectionA) * waterScale * 1.12 +
    waterTime * 0.46;
  float waterLakePhaseB =
    dot(waterPosition, waterLakeDirectionB) * waterScale * 1.83 -
    waterTime * 0.31;
  float waterLakePhaseC =
    dot(waterPosition, waterLakeDirectionC) * waterScale * 2.71 +
    waterTime * 0.22;
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
    dot(waterPosition, waterFlowPerpendicular) * waterScale * 2.85 +
    dot(waterPosition, waterFlowDirection) * waterScale * 0.34 -
    waterTime * uWaterFlowSpeed * 2.2;
  waterRiverPhaseB =
    dot(waterPosition, waterFlowPerpendicular) * waterScale * 5.1 -
    dot(waterPosition, waterFlowDirection) * waterScale * 0.18 -
    waterTime * uWaterFlowSpeed * 3.65;
  waterRiverPhaseC =
    dot(waterPosition, waterFlowDirection) * waterScale * 1.35 +
    dot(waterPosition, waterFlowPerpendicular) * waterScale * 0.72 -
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
  float waterMicroPhaseA =
    dot(waterPosition, waterMicroDirectionA) * waterScale * 7.4 +
    waterTime * 1.34;
  float waterMicroPhaseB =
    dot(waterPosition, waterMicroDirectionB) * waterScale * 10.1 -
    waterTime * 1.08;
  waterMicroSlope =
    (waterMicroDirectionA * cos(waterMicroPhaseA) * 0.16 +
      waterMicroDirectionB * cos(waterMicroPhaseB) * 0.11) *
    waterDetailWeight;
}

float waterWaveStrength = uWaterRippleStrength * mix(
  uWaterLakeWaveStrength,
  1.0,
  waterRiverAmount
);
vec2 waterSlope = mix(
  waterLakeSlope,
  waterRiverSlope,
  waterRiverAmount
) * waterWaveStrength + waterMicroSlope * uWaterRippleStrength;

vec3 waterWorldNormal = normalize(
  waterGeometricNormal + vec3(-waterSlope.x, 0.0, -waterSlope.y)
);
normal = normalize((viewMatrix * vec4(waterWorldNormal, 0.0)).xyz);

float waterDepthFactor = 1.0 - exp(
  -waterDepth / max(0.01, uWaterDepthFade)
);
vec3 waterSurfaceColor = mix(
  uWaterShallow,
  uWaterDeep,
  saturate(waterDepthFactor * 0.82 + waterCoverage * 0.18)
);

if (waterRiverAmount > 0.02) {
  float waterFlowSheen =
    0.5 +
    0.5 * sin(
      dot(waterPosition, waterFlowPerpendicular) * waterScale * 3.7 -
      waterTime * uWaterFlowSpeed * 1.9
    );
  waterSurfaceColor *= 0.975 + waterFlowSheen * 0.035 * waterRiverAmount;
}

vec3 waterViewDirection = normalize(cameraPosition - vWaterWorldPosition);
float waterFacing = saturate(dot(waterWorldNormal, waterViewDirection));
float waterFresnel = 0.0204 + 0.9796 * pow(1.0 - waterFacing, 5.0);
float waterFresnelVisual = saturate(waterFresnel * uWaterFresnelStrength);
waterSurfaceColor = mix(
  waterSurfaceColor,
  uWaterReflection,
  waterFresnelVisual * 0.34
);

float waterShoreBand =
  (1.0 - smoothstep(0.16, 0.66, waterCoverageRaw)) *
  smoothstep(0.025, 0.11, waterCoverageRaw);
waterShoreBand *= 1.0 - smoothstep(0.28, 0.9, waterDepth);
float waterRiverFoam = 0.0;
if (waterRiverAmount > 0.02 && waterDetailWeight > 0.001) {
  float waterRifflePattern = 0.5 + 0.5 * sin(
    waterRiverPhaseA * 1.43 + sin(waterRiverPhaseB) * 0.86
  );
  waterRiverFoam =
    smoothstep(0.82, 0.97, waterRifflePattern) *
    waterRiverAmount *
    waterDetailWeight;
}
float waterFoamAmount = saturate(
  (waterShoreBand * 0.78 + waterRiverFoam * 0.16) * uWaterFoamStrength
);
waterSurfaceColor = mix(waterSurfaceColor, uWaterFoam, waterFoamAmount);

diffuseColor.rgb = waterSurfaceColor;
float waterDepthOpacity = mix(0.58, 1.0, waterDepthFactor);
float waterFresnelOpacity = mix(0.78, 1.0, waterFresnelVisual);
float waterAlpha =
  uWaterOpacity *
  waterCoverage *
  waterDepthOpacity *
  waterFresnelOpacity;
waterAlpha = mix(waterAlpha, min(1.0, waterAlpha + 0.22), waterFoamAmount);
diffuseColor.a *= waterAlpha;
`;
