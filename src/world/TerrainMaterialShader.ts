import { GRASS_MAX_BIOMES } from "../grass/biome/GrassBiomeProfile";
import { TERRAIN_SURFACE_NOISE_SIZE } from "./terrain/TerrainSurfaceNoiseTexture";

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
uniform vec3 uTerrainRockDark;
uniform vec3 uTerrainRockLight;
varying vec3 vTerrainWorldPosition;
varying vec3 vTerrainPath;
varying vec4 vTerrainEcology;
varying vec4 vTerrainEnvironment;
varying vec4 vTerrainBiomeBase;
varying vec3 vTerrainBiomeDry;
varying vec3 vTerrainBiomeCanopy;
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
float terrainUnderlayerAmount = terrainCoverage *
  mix(0.34, 0.78, terrainVigor) *
  mix(1.0, 0.52, terrainDryness);
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

float terrainDryFibre = smoothstep(0.68, 0.9, terrainMicroNoise.a) *
  terrainDryness * terrainCoverage * terrainMicroWeight *
  (1.0 - terrainWaterProximity * 0.82);
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
 * Everything before this point decides what grows and what washes up; none of it
 * can produce stone, so a steep face ended up wearing whichever soft material
 * won the ecology mix. Rock is therefore laid over the top wherever the ground
 * is steep enough that nothing could sit on it, and it wins outright: geology
 * first, cover second, water last as a modifier.
 *
 * Projection matters as much as palette. Sampling by world xz on a near-vertical
 * face stretches the noise into vertical smears, which is what made the gorge
 * read as deformed terrain. Cliff faces are projected along the face's own
 * horizontal tangent instead — two samples, not triplanar's three, because a
 * wall has only one interesting axis.
 */
if (terrainCliff > 0.001) {
  vec4 terrainRockNoise = textureGrad(
    uTerrainSurfaceNoise,
    terrainWallUv + vec2(0.19, 0.63),
    terrainWallDdx,
    terrainWallDdy
  );

  /**
   * Bedding as discrete beds, not a sine wash. What makes rock read as rock is
   * that it is built of separate beds, each with its own tone, meeting at sharp
   * partings. The height is quantised, each bed hashed for a tone through the
   * noise texture, and a thin recessive line cut at every boundary. This is
   * metre-scale structure: the answer to a melted-looking wall is never another
   * octave of noise.
   */
  float terrainBedWarp = (terrainBaseNoise.r - 0.5) * 1.4;
  float terrainBedCoord = vTerrainWorldPosition.y * 0.135 + terrainBedWarp * 0.42;
  float terrainBedIndex = floor(terrainBedCoord);
  float terrainBedFraction = fract(terrainBedCoord);
  // Hash lookups: the coordinate is piecewise constant, so an implicit level of
  // detail would read a mip chosen from the step at every bed boundary. Zero
  // gradients pin them to the base level, which is what a hash wants.
  float terrainBedTone = textureGrad(
    uTerrainSurfaceNoise,
    vec2(terrainBedIndex * 0.137 + 0.41, 0.317),
    vec2(0.0),
    vec2(0.0)
  ).r;
  float terrainParting =
    smoothstep(0.0, 0.05, terrainBedFraction) *
    (1.0 - smoothstep(0.93, 1.0, terrainBedFraction));

  // Fractures: wide, sparse, and offset bed by bed, or a joint running unbroken
  // down a whole cliff reads as a seam in a texture rather than as broken rock.
  float terrainFractureSeed = textureGrad(
    uTerrainSurfaceNoise,
    vec2(terrainBedIndex * 0.211 + 0.77, 0.629),
    vec2(0.0),
    vec2(0.0)
  ).g;
  float terrainFracture = 1.0 - abs(
    fract(terrainWallUv.x * 1.49 + terrainFractureSeed * 3.0) * 2.0 - 1.0
  );
  terrainFracture = pow(saturate(terrainFracture), 12.0);

  vec3 terrainRock = mix(
    uTerrainRockDark,
    uTerrainRockLight,
    saturate(terrainRockNoise.b * 0.78 + terrainBedTone * 0.52 - 0.14)
  );
  terrainRock *= 1.0 - terrainFracture * 0.62;
  terrainRock *= mix(0.72, 1.0, terrainParting);

  /**
   * Humidity as a modifier, never as a selector. Wet rock is darker and
   * glossier; it does not become gravel. The gloss half is already handled by
   * the wet-sheen pass below, which the widened band beneath now reaches.
   */
  terrainRock *= 1.0 - terrainWaterProximity * 0.22;

  diffuseColor.rgb = mix(diffuseColor.rgb, terrainRock, terrainCliff);
}

float terrainSurfaceNormalMask = max(
  terrainEcologyMask,
  saturate(terrainPathCore + terrainPathShoulder * 0.82)
);
float terrainMicroHeight = (
  (terrainMicroNoise.b - 0.5) * 0.7 +
  (terrainMicroNoise.a - 0.5) * 0.3
) * mix(1.0, 0.58, terrainWaterProximity);

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
if (
  terrainMicroWeight > 0.001 &&
  terrainSurfaceNormalMask > 0.001 &&
  abs(terrainDeterminant) > 1e-8
) {
  normal = normalize(
    abs(terrainDeterminant) * normal -
      terrainGradient * uTerrainNormalStrength * terrainMicroWeight *
        terrainSurfaceNormalMask * 0.12
  );
}
`;
