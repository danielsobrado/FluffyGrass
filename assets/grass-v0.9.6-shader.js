const RELEASE_VERSION = "v0.9.6";
const SUBPATCHES_PER_AXIS = 2;
const IMPOSTOR_FOOTPRINT_SCALE = 1.12;
const MAX_HORIZONTAL_SCALE = 1.1;
const MAX_VERTICAL_SCALE = 1.2;
const MAX_WIND_DISPLACEMENT = 0.08;
const BOUNDS_SAFETY_MARGIN = 0.15;
const MIN_PIXEL_BASE_WIDTH = 1.05;
const BYTE_MAX = 255;

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Unable to apply ${label}: expected shader source was not found.`);
  }
  return source.replace(search, replacement);
}

export function patchVertexShader(source) {
  if (source.includes("attribute vec2 grassSubpatchOffset;")) {
    return source;
  }

  let output = replaceRequired(
    source,
    "attribute float instanceBiome;",
    `attribute float instanceBiome;\nattribute vec2 grassSubpatchOffset;\nattribute float grassSubpatchIndex;`,
    "subpatch vertex attributes",
  );
  output = replaceRequired(
    output,
    "flat varying float vBiome;",
    `flat varying float vBiome;\nflat varying float vSubpatchIndex;`,
    "subpatch vertex varying",
  );
  output = replaceRequired(
    output,
    `  vec3 rootCenter = (instanceModel * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 center = rootCenter + basisY * uCenterHeight * scaleY;
  vec3 toCamera = normalize(cameraPosition - center);
  vec3 billboardRight = cross(basisY, toCamera);
  float billboardRightLength = length(billboardRight);
  billboardRight = billboardRightLength < 0.001
    ? basisX
    : billboardRight / billboardRightLength;
  vec3 billboardUp = normalize(cross(toCamera, billboardRight));`,
    `  vec3 rootCenter = (instanceModel * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 subpatchRoot = rootCenter +
    basisX * grassSubpatchOffset.x * scaleX +
    basisZ * grassSubpatchOffset.y * scaleX;
  vec3 center = subpatchRoot + basisY * uCenterHeight * scaleY;
  vec3 toCamera = normalize(cameraPosition - center);

  vec3 worldUp = vec3(0.0, 1.0, 0.0);
  vec3 cardUp = normalize(mix(worldUp, basisY, 0.35));
  vec3 planarView = toCamera - cardUp * dot(toCamera, cardUp);
  float planarViewLength = length(planarView);
  if (planarViewLength < 0.001) {
    planarView = basisZ - cardUp * dot(basisZ, cardUp);
    planarViewLength = length(planarView);
  }
  planarView /= max(planarViewLength, 0.001);
  vec3 cylindricalRight = normalize(cross(cardUp, planarView));
  vec3 sphericalRight = cross(basisY, toCamera);
  float sphericalRightLength = length(sphericalRight);
  sphericalRight = sphericalRightLength < 0.001
    ? basisX
    : sphericalRight / sphericalRightLength;
  vec3 sphericalUp = normalize(cross(toCamera, sphericalRight));
  float worldElevation = abs(dot(toCamera, worldUp));
  float aerialBlend = smoothstep(0.22, 0.48, worldElevation);
  vec3 billboardRight = normalize(mix(
    cylindricalRight,
    sphericalRight,
    aerialBlend
  ));
  vec3 billboardUp = normalize(mix(cardUp, sphericalUp, aerialBlend));`,
    "upright subpatch billboarding",
  );
  output = replaceRequired(
    output,
    `  vec3 localViewDirection = vec3(
    dot(toCamera, basisX),
    abs(dot(toCamera, basisY)),
    dot(toCamera, basisZ)
  );
  vLocalViewDirection = normalize(localViewDirection);
  vCameraDistance = cameraDistance;
  vGustNoise = gustNoise;
  vBiome = instanceBiome;
  vUv = uv;`,
    `  float localElevation = abs(dot(toCamera, basisY));
  float atlasElevation = mix(
    min(localElevation, 0.10),
    localElevation,
    aerialBlend
  );
  vec3 localViewDirection = vec3(
    dot(toCamera, basisX),
    atlasElevation,
    dot(toCamera, basisZ)
  );
  vLocalViewDirection = normalize(localViewDirection);
  vCameraDistance = cameraDistance;
  vGustNoise = gustNoise;
  vBiome = instanceBiome;
  vSubpatchIndex = grassSubpatchIndex;
  vUv = uv;`,
    "horizon atlas selection",
  );
  return output;
}

export function patchFragmentShader(source) {
  if (source.includes("uniform float uSubpatchesPerAxis;")) {
    return source;
  }

  let output = replaceRequired(
    source,
    "uniform float uViewsPerAxis;",
    `uniform float uViewsPerAxis;\nuniform float uSubpatchesPerAxis;`,
    "subpatch atlas uniform",
  );
  output = replaceRequired(
    output,
    "flat varying float vBiome;",
    `flat varying float vBiome;\nflat varying float vSubpatchIndex;`,
    "subpatch fragment varying",
  );
  output = replaceRequired(
    output,
    `vec4 sampleFrame(vec2 frameIndex, vec2 localUv) {
  float cellSize = uFrameResolution + uPadding * 2.0;
  vec2 safeUv = clamp(`,
    `vec4 sampleFrame(vec2 frameIndex, vec2 localUv) {
  float cellSize = uFrameResolution + uPadding * 2.0;
  float pageSize = uViewsPerAxis * cellSize;
  vec2 pageIndex = vec2(
    mod(vSubpatchIndex, uSubpatchesPerAxis),
    floor(vSubpatchIndex / uSubpatchesPerAxis)
  );
  vec2 safeUv = clamp(`,
    "subpatch atlas page selection",
  );
  output = replaceRequired(
    output,
    `  vec2 pixel =
    frameIndex * cellSize +`,
    `  vec2 pixel =
    pageIndex * pageSize +
    frameIndex * cellSize +`,
    "subpatch atlas page offset",
  );
  output = replaceRequired(
    output,
    "float dither = coverageNoise(floor(vUv * 64.0), vInstanceSeed * 97.0);",
    `float dither = coverageNoise(
    floor(vUv * 64.0),
    vInstanceSeed * 97.0 + vSubpatchIndex * 0.217
  );`,
    "subpatch coverage dither",
  );
  output = replaceRequired(
    output,
    "vInstanceSeed * 173.0 + 0.37",
    "vInstanceSeed * 173.0 + vSubpatchIndex * 0.131 + 0.37",
    "subpatch view dither",
  );
  output = replaceRequired(
    output,
    `  float cutoff = uAlphaCutoff * mix(
    1.0,
    0.55,
    smoothstep(uMidDistance, uFarDistance, vCameraDistance)
  );
  if (atlasColor.a < cutoff) {
    discard;
  }`,
    `  float distanceProgress = smoothstep(
    uMidDistance,
    uFarDistance,
    vCameraDistance
  );
  float cutoff = uAlphaCutoff * mix(
    1.0,
    1.15,
    distanceProgress
  );
  float alphaWidth = max(fwidth(atlasColor.a), 0.00392156862745098);
  float alphaCoverage = smoothstep(
    cutoff - alphaWidth,
    cutoff + alphaWidth,
    atlasColor.a
  );
  float alphaDither = coverageNoise(
    floor(vUv * uFrameResolution),
    vInstanceSeed * 211.0 +
      vSubpatchIndex * 0.173 +
      0.61
  );
  if (alphaDither > alphaCoverage) {
    discard;
  }`,
    "stable horizon alpha",
  );
  return output;
}

