import { GRASS_MAX_BIOMES } from "../grass/biome/GrassBiomeProfile";
import { TERRAIN_ROCK_FUNCTIONS } from "./terrain/TerrainRockShader";
import {
  TERRAIN_DRY_FIBRE_PULSE_MEAN,
  TERRAIN_SURFACE_NOISE_SIZE,
} from "./terrain/TerrainSurfaceNoiseTexture";

export const TERRAIN_DETAIL_VERTEX = `
#define TERRAIN_MAX_BIOMES ${GRASS_MAX_BIOMES}
attribute vec3 terrainPath;
attribute vec4 terrainEcology;
attribute vec4 terrainEnvironment;
attribute vec3 terrainBiome;
uniform vec3 uTerrainBiomeBase[TERRAIN_MAX_BIOMES];
uniform vec3 uTerrainBiomeTip[TERRAIN_MAX_BIOMES];
uniform vec3 uTerrainBiomeDry[TERRAIN_MAX_BIOMES];
uniform vec2 uTerrainBiomeShade[TERRAIN_MAX_BIOMES];
varying vec3 vTerrainWorldPosition;
varying vec3 vTerrainPath;
varying vec4 vTerrainEcology;
varying vec4 vTerrainEnvironment;
varying vec4 vTerrainBiomeBase;
varying vec3 vTerrainBiomeDry;
varying vec3 vTerrainBiomeCanopy;

int terrainResolveBiomeRow(float biome) {
  return int(clamp(biome, 0.0, float(TERRAIN_MAX_BIOMES - 1)) + 0.5);
}
`;

export const TERRAIN_DETAIL_POSITION = `
vTerrainWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
vTerrainPath = terrainPath;
vTerrainEcology = terrainEcology;
vTerrainEnvironment = terrainEnvironment;
int terrainBiomeA = terrainResolveBiomeRow(terrainBiome.x);
int terrainBiomeB = terrainResolveBiomeRow(terrainBiome.y);
float terrainBiomeBlend = saturate(terrainBiome.z);
vec3 terrainBiomeBase = mix(
  uTerrainBiomeBase[terrainBiomeA],
  uTerrainBiomeBase[terrainBiomeB],
  terrainBiomeBlend
);
vec3 terrainBiomeTip = mix(
  uTerrainBiomeTip[terrainBiomeA],
  uTerrainBiomeTip[terrainBiomeB],
  terrainBiomeBlend
);
vTerrainBiomeDry = mix(
  uTerrainBiomeDry[terrainBiomeA],
  uTerrainBiomeDry[terrainBiomeB],
  terrainBiomeBlend
);
vec2 terrainBiomeShade = mix(
  uTerrainBiomeShade[terrainBiomeA],
  uTerrainBiomeShade[terrainBiomeB],
  terrainBiomeBlend
);
vTerrainBiomeBase = vec4(
  terrainBiomeBase,
  mix(0.92, 0.78, saturate(terrainBiomeShade.x))
);
vTerrainBiomeCanopy = mix(
  terrainBiomeBase,
  terrainBiomeTip,
  saturate(terrainBiomeShade.y) * 0.42
);
`;

export const TERRAIN_DETAIL_FRAGMENT = `
uniform sampler2D uTerrainSurfaceNoise;
uniform float uTerrainNoiseWorldSize;
uniform float uTerrainMesoStrength;
uniform float uTerrainMicroStrength;
uniform float uTerrainNormalStrength;
uniform float uTerrainCanopyDarkening;
uniform float uTerrainGrassTintStrength;
uniform vec4 uTerrainLodDistances;
uniform vec2 uTerrainPathHalfWidth;
uniform float uTerrainPathEdge;
uniform float uTerrainPathClearance;
uniform float uTerrainPathGrassFeather;
uniform float uTerrainPathCoreDarkening;
uniform float uTerrainPathVergeDryness;
uniform float uTerrainWetSheenStrength;
uniform float uTerrainWetSheenPower;
uniform vec3 uTerrainSoilRich;
uniform vec3 uTerrainSoilDry;
uniform vec3 uTerrainPathSoil;
uniform vec3 uTerrainPathDust;
uniform vec3 uTerrainPathGrit;
varying vec3 vTerrainWorldPosition;
varying vec3 vTerrainPath;
varying vec4 vTerrainEcology;
varying vec4 vTerrainEnvironment;
varying vec4 vTerrainBiomeBase;
varying vec3 vTerrainBiomeDry;
varying vec3 vTerrainBiomeCanopy;
${TERRAIN_ROCK_FUNCTIONS}
`;

export const TERRAIN_DETAIL_COLOR = `
float terrainDistance = distance(cameraPosition, vTerrainWorldPosition);

/**
 * Slope, from the geometry itself.
 *
 * The terrain attributes carry altitude, humidity, water proximity and stone
 * clearance, but never slope — so nothing here could tell a meadow from a cliff,
 * and the palette had no rock in it at all. The derivatives of the interpolated
 * world position give the true face normal for a couple of instructions, which
 * is cheaper than carrying another vertex stream and cannot fall out of step
 * with the surface actually being shaded.
 *
 * Taken at the top of the function on purpose: derivatives must not sit inside
 * non-uniform control flow.
 */
vec3 terrainFaceNormal = cross(
  dFdx(vTerrainWorldPosition),
  dFdy(vTerrainWorldPosition)
);
float terrainFaceLength = length(terrainFaceNormal);
terrainFaceNormal = terrainFaceLength > 1e-8
  ? terrainFaceNormal / terrainFaceLength
  : vec3(0.0, 1.0, 0.0);
if (terrainFaceNormal.y < 0.0) terrainFaceNormal = -terrainFaceNormal;
float terrainSlope = 1.0 - saturate(terrainFaceNormal.y);
float terrainCliff = smoothstep(0.38, 0.66, terrainSlope);

/**
 * Wall-aligned coordinates, resolved here rather than beside the rock below.
 * The rock samples sit inside a branch, and a texture lookup with an implicit
 * level of detail is undefined inside non-uniform control flow — which is why
 * the layers above already use textureGrad. The gradients have to be taken out
 * here where the branch cannot affect them.
 */
vec2 terrainWallTangent = normalize(
  vec2(-terrainFaceNormal.z, terrainFaceNormal.x) + vec2(1e-5)
);
vec2 terrainWallUv = vec2(
  dot(vTerrainWorldPosition.xz, terrainWallTangent),
  vTerrainWorldPosition.y
) * 0.037;
vec2 terrainWallDdx = dFdx(terrainWallUv);
vec2 terrainWallDdy = dFdy(terrainWallUv);
float terrainMicroWeight = 1.0 - smoothstep(
  uTerrainLodDistances.x,
  uTerrainLodDistances.x + uTerrainLodDistances.y,
  terrainDistance
);
float terrainMesoWeight = 1.0 - smoothstep(
  uTerrainLodDistances.z,
  uTerrainLodDistances.w,
  terrainDistance
);
float terrainFarMerge = smoothstep(
  uTerrainLodDistances.z,
  uTerrainLodDistances.w,
  terrainDistance
);

vec2 terrainBaseUv = vTerrainWorldPosition.xz / uTerrainNoiseWorldSize;
vec2 terrainBaseDdx = dFdx(terrainBaseUv);
vec2 terrainBaseDdy = dFdy(terrainBaseUv);
vec4 terrainBaseNoise = textureGrad(
  uTerrainSurfaceNoise,
  terrainBaseUv,
  terrainBaseDdx,
  terrainBaseDdy
);
vec4 terrainMesoNoise = vec4(0.5);
if (terrainMesoWeight > 0.001) {
  mat2 terrainMesoRotation = mat2(0.8, 0.6, -0.6, 0.8);
  vec2 terrainMesoUv = terrainMesoRotation * terrainBaseUv * 2.17 +
    vec2(0.317, 0.619);
  terrainMesoNoise = textureGrad(
    uTerrainSurfaceNoise,
    terrainMesoUv,
    terrainMesoRotation * terrainBaseDdx * 2.17,
    terrainMesoRotation * terrainBaseDdy * 2.17
  );
}

vec4 terrainMicroNoise = vec4(0.5);
if (terrainMicroWeight > 0.001) {
  mat2 terrainMicroRotation = mat2(0.94, -0.342, 0.342, 0.94);
  vec2 terrainMicroUv = terrainMicroRotation * terrainBaseUv *
    vec2(8.6, 5.4) + vec2(0.731, 0.143);
  vec2 terrainMicroDdx = terrainMicroRotation * terrainBaseDdx *
    vec2(8.6, 5.4);
  vec2 terrainMicroDdy = terrainMicroRotation * terrainBaseDdy *
    vec2(8.6, 5.4);
  float terrainMicroFootprint = max(
    length(terrainMicroDdx * ${TERRAIN_SURFACE_NOISE_SIZE.toFixed(1)}),
    length(terrainMicroDdy * ${TERRAIN_SURFACE_NOISE_SIZE.toFixed(1)})
  );
  terrainMicroWeight *= 1.0 - smoothstep(0.7, 2.1, terrainMicroFootprint);
  terrainMicroNoise = textureGrad(
    uTerrainSurfaceNoise,
    terrainMicroUv,
    terrainMicroDdx,
    terrainMicroDdy
  );
}

float terrainSuitability = saturate(vTerrainEcology.x);
float terrainVigor = saturate(vTerrainEcology.y);
float terrainDryness = saturate(vTerrainEcology.z);
float terrainBiomeDensity = saturate(vTerrainEcology.w);
float terrainAltitude = saturate(vTerrainEnvironment.x);
float terrainHumidity = saturate(vTerrainEnvironment.y);
float terrainWaterProximity = saturate(vTerrainEnvironment.z);
float terrainStoneClearance = saturate(vTerrainEnvironment.w);
float terrainRootScale = saturate(vTerrainBiomeBase.a);

vec2 terrainPathGrassHalfWidth = uTerrainPathHalfWidth + vec2(
  uTerrainPathEdge + uTerrainPathClearance
);
vec2 terrainPathGrassBands = smoothstep(
  terrainPathGrassHalfWidth,
  terrainPathGrassHalfWidth + vec2(uTerrainPathGrassFeather),
  abs(vTerrainPath.xy)
);
float terrainPathVisibility = saturate(vTerrainPath.z);
float terrainPathGrassMask = mix(
  1.0,
  min(terrainPathGrassBands.x, terrainPathGrassBands.y),
  terrainPathVisibility
);
float terrainPathExposure = 1.0 - terrainPathGrassMask;

float terrainEdgeNoise = clamp(
  (terrainBaseNoise.r - 0.5) * 1.35 +
    (terrainMesoNoise.g - 0.5) * terrainMesoWeight,
  -0.5,
  0.5
);
vec2 terrainCoreDistance = abs(vTerrainPath.xy) +
  uTerrainPathEdge * terrainEdgeNoise;
vec2 terrainCoreBands = vec2(1.0) - smoothstep(
  max(vec2(0.0), uTerrainPathHalfWidth - vec2(0.12)),
  uTerrainPathHalfWidth + vec2(0.28),
  terrainCoreDistance
);
float terrainPathCore = max(terrainCoreBands.x, terrainCoreBands.y) *
  terrainPathVisibility;
float terrainPathShoulder = max(0.0, terrainPathExposure - terrainPathCore);

terrainDryness = saturate(
  terrainDryness * (1.0 - terrainWaterProximity * 0.58) +
    terrainPathShoulder * uTerrainPathVergeDryness +
    smoothstep(0.72, 1.0, terrainAltitude) * 0.08
);
terrainHumidity = saturate(terrainHumidity - terrainPathExposure * 0.18);

float terrainMacroVariation = (terrainBaseNoise.r - 0.5) * 0.16;
float terrainMesoVariation = (terrainMesoNoise.g - 0.5) *
  uTerrainMesoStrength * terrainMesoWeight;
vec3 terrainSoil = mix(uTerrainSoilDry, uTerrainSoilRich, terrainHumidity);
terrainSoil *= mix(1.0, 0.62, terrainWaterProximity * 0.78);
terrainSoil *= 1.0 + terrainMacroVariation * 0.45 + terrainMesoVariation;

vec3 terrainUnderlayer = mix(
  vTerrainBiomeBase.rgb,
  vTerrainBiomeDry,
  terrainDryness * 0.9
);
terrainUnderlayer = mix(
  terrainUnderlayer,
  vTerrainBiomeBase.rgb * 0.72,
  terrainWaterProximity * 0.34
);
terrainUnderlayer *= terrainRootScale;
terrainUnderlayer *= 1.0 + terrainMacroVariation + terrainMesoVariation;
float terrainCoverage = smoothstep(0.08, 0.5, terrainSuitability) *
  terrainBiomeDensity * terrainPathGrassMask * terrainStoneClearance;
// terrainGrassTintStrength is the art lever for how much the ground reads as
// grass. 0.5 is the authored default and leaves the mix unchanged.
float terrainUnderlayerAmount = saturate(
  terrainCoverage *
    mix(0.34, 0.78, terrainVigor) *
    mix(1.0, 0.52, terrainDryness) *
    uTerrainGrassTintStrength * 2.0
);
vec3 terrainSurfaceColor = mix(
  terrainSoil,
  terrainUnderlayer,
  terrainUnderlayerAmount
);
vec3 terrainThatch = mix(uTerrainSoilDry, vTerrainBiomeDry, 0.48) * 0.7;
terrainSurfaceColor = mix(
  terrainSurfaceColor,
  terrainThatch,
  terrainCoverage * (1.0 - terrainDryness) * terrainVigor * 0.28
);

vec3 terrainCanopy = vTerrainBiomeCanopy;
terrainCanopy = mix(terrainCanopy, vTerrainBiomeDry, terrainDryness * 0.68);
terrainCanopy *= 0.78 + terrainMacroVariation;
terrainSurfaceColor = mix(
  terrainSurfaceColor,
  terrainCanopy,
  terrainFarMerge * terrainCoverage
);

float terrainDryFibrePulse = smoothstep(0.68, 0.9, terrainMicroNoise.a);
float terrainDryFibreAmount = terrainDryness * terrainCoverage *
  (1.0 - terrainWaterProximity * 0.82);
// Mean of the fibre pulse over the A channel. Holding it as
// terrainMicroWeight fades is what stops the ground brightening at the 6-7 m
// micro-detail cutoff; only the speckle (the variance around this mean)
// disappears. terrainMicroAlbedo is already zero-mean and needs no counterpart.
float terrainDryFibre = (
  ${TERRAIN_DRY_FIBRE_PULSE_MEAN.toFixed(4)} +
    (terrainDryFibrePulse - ${TERRAIN_DRY_FIBRE_PULSE_MEAN.toFixed(4)}) *
      terrainMicroWeight
) * terrainDryFibreAmount;
terrainSurfaceColor = mix(
  terrainSurfaceColor,
  vTerrainBiomeDry * 0.68,
  terrainDryFibre * 0.34
);
float terrainMicroAlbedo = (terrainMicroNoise.b - 0.5) *
  uTerrainMicroStrength * terrainMicroWeight;
terrainSurfaceColor *= 1.0 + terrainMicroAlbedo;
terrainSurfaceColor *= 1.0 -
  uTerrainCanopyDarkening * terrainCoverage * terrainVigor;

float shoreBand = smoothstep(
  0.94,
  1.0,
  terrainWaterProximity
);
/**
 * Shoreline is a depositional material and cannot form on a cliff face. Gating
 * it on slope is what stops a gorge wall standing inside the humidity radius
 * from being painted as gravel from top to bottom.
 */
float shoreExposure =
  shoreBand * (1.0 - terrainCoverage * 0.75) * (1.0 - terrainCliff);
float shorePatch = clamp(
  0.55 +
  (terrainBaseNoise.r - 0.5) * 0.90 +
  (terrainMesoNoise.g - 0.5) * 0.65,
  0.0,
  1.0
);
float shoreMud =
  shoreExposure *
  (1.0 - smoothstep(0.46, 0.63, shorePatch));
float shoreGravel =
  shoreExposure *
  smoothstep(0.68, 0.84, shorePatch);
terrainSurfaceColor = mix(
  terrainSurfaceColor,
  uTerrainSoilRich * 0.82,
  shoreMud
);
terrainSurfaceColor = mix(
  terrainSurfaceColor,
  uTerrainPathGrit,
  shoreGravel
);

float terrainEcologyMask = smoothstep(0.025, 0.34, terrainSuitability);
diffuseColor.rgb = mix(diffuseColor.rgb, terrainSurfaceColor, terrainEcologyMask);

float terrainPathGrain = clamp(
  0.5 +
    (terrainBaseNoise.r - 0.5) * 0.75 +
    (terrainMesoNoise.g - 0.5) * 0.9 * terrainMesoWeight +
    (terrainMicroNoise.b - 0.5) * 0.45 * terrainMicroWeight,
  0.0,
  1.0
);
vec3 terrainPathColor = mix(
  uTerrainPathSoil,
  uTerrainPathDust,
  terrainPathGrain
);
terrainPathColor *= 1.0 -
  uTerrainPathCoreDarkening * terrainPathCore * terrainPathCore;
float terrainGrit = smoothstep(0.64, 0.86, terrainMicroNoise.b) *
  terrainMicroWeight;
terrainPathColor = mix(terrainPathColor, uTerrainPathGrit, terrainGrit * 0.24);
diffuseColor.rgb = mix(
  diffuseColor.rgb,
  terrainPathColor,
  saturate(terrainPathCore + terrainPathShoulder * 0.82)
);

/**
 * Cliff rock, and the material priority the palette above was missing.
 *
 * Everything before this point decides what grows and what washes up; none of
 * it can produce stone, so a steep face ended up wearing whichever soft
 * material won the ecology mix. Rock is laid over the top wherever the ground
 * is too steep for anything to sit on, and it wins outright: geology first,
 * cover second, water last as a modifier. Its appearance lives in
 * TerrainRockShader; this decides only where it applies.
 */
float terrainRockRelief = 0.0;
if (terrainCliff > 0.001) {
  vec4 terrainWallNoise = textureGrad(
    uTerrainSurfaceNoise,
    terrainWallUv + vec2(0.19, 0.63),
    terrainWallDdx,
    terrainWallDdy
  );
  // The bed index is piecewise constant, so zero gradients pin the hash fetch
  // to the base level instead of letting the step at each boundary pick a mip.
  vec2 terrainBed = terrainResolveBed(
    vTerrainWorldPosition.y,
    (terrainBaseNoise.r - 0.5) * 1.4
  );
  vec4 terrainRockHash = textureGrad(
    uTerrainSurfaceNoise,
    vec2(terrainBed.x * 0.137 + 0.41, 0.317),
    vec2(0.0),
    vec2(0.0)
  );
  vec3 terrainRock = terrainResolveRock(
    terrainWallUv,
    vTerrainWorldPosition.y,
    (terrainBaseNoise.r - 0.5) * 1.4,
    terrainWallNoise,
    terrainRockHash,
    terrainWaterProximity,
    terrainRockRelief
  );
  diffuseColor.rgb = mix(diffuseColor.rgb, terrainRock, terrainCliff);
}

float terrainSurfaceNormalMask = max(
  max(terrainEcologyMask, terrainCliff),
  saturate(terrainPathCore + terrainPathShoulder * 0.82)
);
/**
 * Rock relief joins the height the normal pass already differentiates, so beds
 * and joints catch the light instead of being dark lines painted on a flat
 * face. Added outside the micro weighting because that fades with distance and
 * a cliff's structure must not: a gorge wall is read from across the gorge.
 */
float terrainMicroHeight = (
  (terrainMicroNoise.b - 0.5) * 0.7 +
  (terrainMicroNoise.a - 0.5) * 0.3
) * mix(1.0, 0.58, terrainWaterProximity) * terrainMicroWeight +
  terrainRockRelief * terrainCliff;

// The damp margin at the water's edge. terrainWaterProximity is a humidity
// halo that reaches waterHumidityRadius — tens of metres — which is right for
// deciding what grows but far too wide for what glistens. Only the very top of
// that ramp is ground actually wetted by the water, so the band is cut from
// there; the numbers below put it a few metres out from the bank.
//
// Grass cancels it. A wet meadow does not shine, because the blades hide the
// film of water that does: the sheen belongs to exposed mud, sand, and stone.
float terrainWetBand = smoothstep(0.94, 1.0, terrainWaterProximity) *
  (1.0 - terrainCoverage * 0.7);
`;

// Wet ground reads as wet through gloss, not through colour: darkening the
// albedo alone (which the soil mix above already does) just makes a muddy
// patch, not a wet one. Lambert has no specular lobe to modulate, so this adds
// one — narrow, and only where the water is.
//
// Kept in view space off the light's own direction rather than a sun uniform,
// so it cannot drift out of agreement with the light that is actually shading
// the terrain, and skipped entirely away from the water, where the branch is
// coherent across whole chunks.
export const TERRAIN_WET_SHEEN = `
#if NUM_DIR_LIGHTS > 0
  if (terrainWetBand > 0.001) {
    vec3 terrainSheenView = normalize(vViewPosition);
    vec3 terrainSheenHalf = normalize(
      directionalLights[0].direction + terrainSheenView
    );
    float terrainSheenLobe = pow(
      saturate(dot(normal, terrainSheenHalf)),
      uTerrainWetSheenPower
    );
    outgoingLight += directionalLights[0].color *
      (terrainSheenLobe * uTerrainWetSheenStrength * terrainWetBand);
  }
#endif
`;

export const TERRAIN_DETAIL_NORMAL = `
vec3 terrainViewPosition = (viewMatrix * vec4(
  vTerrainWorldPosition,
  1.0
)).xyz;
vec3 terrainSigmaX = dFdx(terrainViewPosition);
vec3 terrainSigmaY = dFdy(terrainViewPosition);
vec3 terrainR1 = cross(terrainSigmaY, normal);
vec3 terrainR2 = cross(normal, terrainSigmaX);
float terrainDeterminant = dot(terrainSigmaX, terrainR1);
float terrainHeightDdx = dFdx(terrainMicroHeight);
float terrainHeightDdy = dFdy(terrainMicroHeight);
vec3 terrainGradient = sign(terrainDeterminant) * (
  terrainHeightDdx * terrainR1 + terrainHeightDdy * terrainR2
);
// Micro detail fades with distance; cliff relief does not.
float terrainReliefWeight = max(terrainMicroWeight, terrainCliff);
if (
  terrainReliefWeight > 0.001 &&
  terrainSurfaceNormalMask > 0.001 &&
  abs(terrainDeterminant) > 1e-8
) {
  normal = normalize(
    abs(terrainDeterminant) * normal -
      terrainGradient * uTerrainNormalStrength * terrainReliefWeight *
        terrainSurfaceNormalMask * 0.12
  );
}
`;
