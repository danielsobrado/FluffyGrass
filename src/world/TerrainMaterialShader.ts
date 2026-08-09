export const TERRAIN_DETAIL_VERTEX = `
attribute vec3 terrainPath;
varying vec3 vTerrainWorldPosition;
varying vec3 vTerrainPath;
`;

export const TERRAIN_DETAIL_POSITION = `
vTerrainWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
vTerrainPath = terrainPath;
`;

export const TERRAIN_DETAIL_FRAGMENT = `
uniform sampler2D uTerrainGrassDetail;
uniform vec3 uTerrainGrassTint;
uniform float uTerrainGrassTintStrength;
uniform vec2 uTerrainPathHalfWidth;
uniform float uTerrainPathEdge;
uniform vec3 uTerrainPathSoil;
uniform vec3 uTerrainPathDust;
uniform vec3 uTerrainPathGrit;
varying vec3 vTerrainWorldPosition;
varying vec3 vTerrainPath;

const float TERRAIN_PATH_FEATHER = 0.15;
const float TERRAIN_PATH_VERGE = 0.85;
`;

export const TERRAIN_DETAIL_COLOR = `
float terrainGrassMask = smoothstep(
  0.015,
  0.12,
  diffuseColor.g - max(diffuseColor.r, diffuseColor.b)
);
vec2 terrainWind = normalize(vec2(0.8, 0.35));
vec2 terrainAcrossWind = vec2(-terrainWind.y, terrainWind.x);
vec2 terrainDetailUv = vec2(
  dot(vTerrainWorldPosition.xz, terrainWind) * 0.12,
  dot(vTerrainWorldPosition.xz, terrainAcrossWind) * 0.035
);
float terrainGrassDetail =
  texture2D(uTerrainGrassDetail, terrainDetailUv).r * 2.0 - 1.0;
float terrainDetailDistance = distance(cameraPosition, vTerrainWorldPosition);
float terrainDetailFade = 1.0 - smoothstep(300.0, 460.0, terrainDetailDistance);
diffuseColor.rgb *= 1.0 +
  terrainGrassDetail * 0.12 * terrainGrassMask * terrainDetailFade;
float terrainLuminance = dot(
  diffuseColor.rgb,
  vec3(0.2126, 0.7152, 0.0722)
);
vec3 terrainTintedGrass = uTerrainGrassTint * mix(
  0.72,
  1.18,
  smoothstep(0.12, 0.52, terrainLuminance)
);
diffuseColor.rgb = mix(
  diffuseColor.rgb,
  terrainTintedGrass,
  terrainGrassMask * uTerrainGrassTintStrength
);

float terrainPathMargin = min(
  abs(vTerrainPath.x) - uTerrainPathHalfWidth.x,
  abs(vTerrainPath.y) - uTerrainPathHalfWidth.y
);
vec2 terrainSoilDdx = dFdx(vTerrainWorldPosition.xz);
vec2 terrainSoilDdy = dFdy(vTerrainWorldPosition.xz);
float terrainPathVisibility = saturate(vTerrainPath.z);
if (
  terrainPathVisibility > 0.001 &&
  terrainPathMargin < uTerrainPathEdge + TERRAIN_PATH_VERGE
) {
  vec2 terrainSoilUv = vTerrainWorldPosition.xz;
  float terrainSoilCoarse = textureGrad(
    uTerrainGrassDetail,
    terrainSoilUv * 0.033,
    terrainSoilDdx * 0.033,
    terrainSoilDdy * 0.033
  ).r;
  float terrainSoilMedium = textureGrad(
    uTerrainGrassDetail,
    terrainSoilUv * 0.21,
    terrainSoilDdx * 0.21,
    terrainSoilDdy * 0.21
  ).r;
  float terrainSoilFine = textureGrad(
    uTerrainGrassDetail,
    terrainSoilUv * 0.83,
    terrainSoilDdx * 0.83,
    terrainSoilDdy * 0.83
  ).r;
  float terrainSoilEdgeNoise = clamp(
    (terrainSoilCoarse - 0.5) * 4.0 + (terrainSoilMedium - 0.5) * 2.0,
    -1.0,
    1.0
  );
  vec2 terrainPathDistance =
    abs(vTerrainPath.xy) + uTerrainPathEdge * terrainSoilEdgeNoise;
  vec2 terrainPathBands = vec2(1.0) - smoothstep(
    uTerrainPathHalfWidth - TERRAIN_PATH_FEATHER,
    uTerrainPathHalfWidth + TERRAIN_PATH_VERGE,
    terrainPathDistance
  );
  float terrainPathMask =
    max(terrainPathBands.x, terrainPathBands.y) * terrainPathVisibility;

  float terrainSoilGrain = clamp(
    0.5 +
      (terrainSoilCoarse - 0.5) * 1.5 +
      (terrainSoilMedium - 0.5) * 1.1 +
      (terrainSoilFine - 0.5) * 0.7,
    0.0,
    1.0
  );
  vec3 terrainSoil = mix(uTerrainPathSoil, uTerrainPathDust, terrainSoilGrain);
  terrainSoil *= mix(1.0, 0.86, terrainPathMask * terrainPathMask);
  float terrainSoilGrit =
    smoothstep(0.58, 0.78, terrainSoilFine) * terrainDetailFade;
  terrainSoil = mix(terrainSoil, uTerrainPathGrit, terrainSoilGrit * 0.35);
  diffuseColor.rgb = mix(diffuseColor.rgb, terrainSoil, terrainPathMask);
}
`;
