import * as THREE from "three";
import type { GrassArtDirection } from "../../grass/GrassArtDirection";
import {
  GRASS_LIGHT_MIX_GLSL,
  GRASS_PALETTE_GLSL,
  setBalancedGrassPaletteColors,
} from "../../grass/materials/GrassPaletteShader";
import {
  GRASS_BIOME_PROFILES,
  GRASS_MAX_BIOMES,
} from "../../grass/biome/GrassBiomeProfile";
import type {
  GrassLodConfig,
  GrassMaterialConfig,
  GrassWindConfig,
} from "../../grass/GrassConfig";
import {
  GRASS_GUST_TIP_BOOST,
  GRASS_IMPOSTOR_FOOTPRINT_SCALE,
  GRASS_IMPOSTOR_WIND_SHEAR_FACTOR,
  GRASS_MID_IMPOSTOR_UNDERFILL,
} from "../../grass/GrassLodTuning";
import {
  GRASS_GUST_FRONT_SCALE,
  GRASS_GUST_FRONT_SPEED,
  GRASS_WIND_NOISE_SCALE,
  GRASS_WIND_NOISE_SPEED,
  grassCompactGustGlsl,
} from "../../grass/wind/WindNoiseTexture";
import type { WorldGrassImpostorAtlas } from "./WorldGrassImpostorAtlasFactory";
import {
  IMPOSTOR_AERIAL_BLEND_END,
  IMPOSTOR_AERIAL_BLEND_START,
  IMPOSTOR_ALPHA_CUTOFF,
  IMPOSTOR_ALPHA_DITHER_SEED,
  IMPOSTOR_ALPHA_MIN_WIDTH,
  IMPOSTOR_BASE_COLOR_BLEND,
  IMPOSTOR_COLOR_SCALE,
  IMPOSTOR_DITHER_SEED,
  IMPOSTOR_HORIZON_ATLAS_ELEVATION,
  IMPOSTOR_MINIFICATION_FULL_TEXELS_PER_PIXEL,
  IMPOSTOR_MINIFICATION_START_TEXELS_PER_PIXEL,
  IMPOSTOR_MINIFIED_ALPHA_CUTOFF,
  IMPOSTOR_MINIFIED_COVERAGE_SEED_OFFSET,
  IMPOSTOR_MINIFIED_COVERAGE_SUBPATCH_SCALE,
  IMPOSTOR_TERRAIN_DITHER_INSTANCE_SCALE,
  IMPOSTOR_TERRAIN_DITHER_SEED_SCALE,
  IMPOSTOR_TERRAIN_DITHER_SUBPATCH_SCALE,
  IMPOSTOR_TERRAIN_UP_BLEND,
  IMPOSTOR_VIEW_DITHER_GRID_SCALE,
} from "./WorldGrassImpostorTuning";

const VERTEX_SHADER = `
#include <common>
#include <lights_pars_begin>
attribute vec4 instanceVariation;
attribute float instanceCoverage;
attribute float instanceBiome;
attribute vec2 grassSubpatchOffset;
attribute float grassSubpatchIndex;
uniform float uCenterHeight;
uniform float uTime;
uniform vec2 uWindDirection;
uniform float uWindStrength;
uniform sampler2D uWindNoise;
uniform float uWindNoiseScale;
uniform float uWindNoiseSpeed;
uniform float uCardRadius;
uniform float uDitherSeed;
uniform float uNearDistance;
uniform float uMidDistance;
uniform float uFarDistance;
uniform float uTransitionDistance;
uniform float uMidImpostorUnderfill;
uniform float uNormalUp;
uniform float uArtDensityScale;
uniform float uCardsPerPatch;
varying vec2 vUv;
flat varying vec3 vLocalViewDirection;
flat varying float vGustNoise;
flat varying float vBiome;
flat varying float vSubpatchIndex;
flat varying float vInstanceSeed;
flat varying float vDryness;
flat varying float vRootAo;
flat varying float vFarEntry;
flat varying float vFieldCoverage;
flat varying vec3 vGrassIrradiance;
varying float vGrassBackLight;
#include <fog_pars_vertex>

void main() {
  mat4 instanceModel = modelMatrix * instanceMatrix;
  vec3 instanceAxisX = instanceModel[0].xyz;
  vec3 instanceAxisY = instanceModel[1].xyz;
  vec3 instanceAxisZ = instanceModel[2].xyz;
  float scaleX = max(length(instanceAxisX), 0.0001);
  float scaleY = max(length(instanceAxisY), 0.0001);
  vec3 basisX = instanceAxisX / scaleX;
  vec3 basisY = instanceAxisY / scaleY;
  vec3 basisZ = instanceAxisZ / scaleX;
  vec3 rootCenter = (instanceModel * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 subpatchRoot = rootCenter +
    basisX * grassSubpatchOffset.x * scaleX +
    basisZ * grassSubpatchOffset.y * scaleX;
  vec3 center = subpatchRoot + basisY * uCenterHeight * scaleY;
  vec3 toCamera = normalize(cameraPosition - center);

  vec3 worldUp = vec3(0.0, 1.0, 0.0);
  vec3 cardUp = normalize(mix(
    worldUp,
    basisY,
    ${IMPOSTOR_TERRAIN_UP_BLEND.toFixed(2)}
  ));
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
  float aerialBlend = smoothstep(
    ${IMPOSTOR_AERIAL_BLEND_START.toFixed(2)},
    ${IMPOSTOR_AERIAL_BLEND_END.toFixed(2)},
    worldElevation
  );
  vec3 billboardRight = normalize(mix(
    cylindricalRight,
    sphericalRight,
    aerialBlend
  ));
  vec3 billboardUp = normalize(mix(cardUp, sphericalUp, aerialBlend));

  vec2 windDirection = uWindDirection;
  #ifdef GRASS_NOISE_WIND
    vec2 gustUv = center.xz * uWindNoiseScale -
      windDirection * (uTime * uWindNoiseSpeed);
    float gustNoise = texture2D(uWindNoise, gustUv).r;
  #else
    ${grassCompactGustGlsl({
      target: "gustNoise",
      position: "center.xz",
      windDirection: "windDirection",
      time: "uTime",
      scale: GRASS_GUST_FRONT_SCALE.toFixed(3),
      speed: GRASS_GUST_FRONT_SPEED.toFixed(2),
    })}
  #endif

  // Coverage is per instance: every term below is a uniform or an instance
  // attribute, and only the comparison against the per-fragment dither is not.
  // A visible far batch spans 32 m, so it routinely holds instances still
  // inside the mid band whose coverage is zero — those are the closest, and
  // therefore largest, cards on screen. Rejecting them here clips the card
  // outright instead of rasterizing a full billboard that discards every pixel.
  float cameraDistance = distance(cameraPosition, center);
  float nearExit = smoothstep(
    uNearDistance - uTransitionDistance,
    uNearDistance + uTransitionDistance,
    cameraDistance
  );
  float fullFarEntry = smoothstep(
    uMidDistance - uTransitionDistance,
    uMidDistance + uTransitionDistance,
    cameraDistance
  );
  vFarEntry = mix(
    nearExit * uMidImpostorUnderfill,
    1.0,
    fullFarEntry
  );
  float terrainCoverage = 1.0 - smoothstep(
    uFarDistance - uTransitionDistance,
    uFarDistance + uTransitionDistance,
    cameraDistance
  );
  // Legacy multi-instance cards retain complementary weights. The production
  // path uses one instance whose geometry contains four genuine subpatch cards.
  float cardWeight = 1.0;
  if (uCardsPerPatch > 1.5) {
    float inverseCards = 1.0 / uCardsPerPatch;
    cardWeight = instanceVariation.y < 0.5
      ? mix(inverseCards, 1.0, fullFarEntry)
      : inverseCards * (1.0 - fullFarEntry);
  }
  vFieldCoverage = instanceCoverage * cardWeight;
  float effectiveCoverage =
    vFarEntry * min(vFieldCoverage * uArtDensityScale, 1.0);
  if (effectiveCoverage <= 0.001) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  // Nothing overlaps the far-to-terrain handoff, so a fragment screen-door
  // there becomes visible horizon dust. Fade whole 2x2 m subpatch cards instead;
  // at this range each card is small while its internal silhouette stays intact.
  float terrainDither = fract(
    instanceVariation.x * ${IMPOSTOR_TERRAIN_DITHER_INSTANCE_SCALE.toFixed(1)} +
    grassSubpatchIndex * ${IMPOSTOR_TERRAIN_DITHER_SUBPATCH_SCALE.toFixed(11)} +
    uDitherSeed * ${IMPOSTOR_TERRAIN_DITHER_SEED_SCALE.toFixed(11)}
  );
  if (terrainDither >= terrainCoverage) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  vec3 worldPosition = center +
    billboardRight * position.x * scaleX * ${GRASS_IMPOSTOR_FOOTPRINT_SCALE.toFixed(2)} +
    billboardUp * position.y * scaleY;
  // Root-to-tip shear matches real blade bending and remains within the
  // impostor wind displacement reserved by GrassLodTuning. uCardRadius is the
  // quad's own half-extent, not the (much larger) culling bound radius, so
  // position.y spans the full [0, 1] of the shear ramp.
  float shearProgress = saturate(position.y / max(uCardRadius, 0.0001) * 0.5 + 0.5);
  float sway = (gustNoise * 2.0 - 1.0) * uWindStrength *
    ${GRASS_IMPOSTOR_WIND_SHEAR_FACTOR.toFixed(2)};
  worldPosition += vec3(windDirection.x, 0.0, windDirection.y) *
    sway * shearProgress * scaleY;
  vec4 mvPosition = viewMatrix * vec4(worldPosition, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Source blades lie in local XY, so their geometric normal is local Z.
  // Blend that same axis toward the terrain normal just like the real-blade
  // material does before evaluating the scene lights.
  vec3 grassWorldNormal = normalize(mix(basisZ, basisY, uNormalUp));
  vec3 grassViewNormal = normalize(mat3(viewMatrix) * grassWorldNormal);
  vec3 grassIrradiance = ambientLightColor;
  #if NUM_HEMI_LIGHTS > 0
    #pragma unroll_loop_start
    for (int i = 0; i < NUM_HEMI_LIGHTS; i++) {
      grassIrradiance += getHemisphereLightIrradiance(
        hemisphereLights[i],
        grassViewNormal
      );
    }
    #pragma unroll_loop_end
  #endif
  #if NUM_DIR_LIGHTS > 0
    #pragma unroll_loop_start
    for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
      grassIrradiance +=
        saturate(dot(grassViewNormal, directionalLights[i].direction)) *
        directionalLights[i].color;
    }
    #pragma unroll_loop_end
    vGrassBackLight = pow(
      saturate(dot(normalize(mvPosition.xyz), directionalLights[0].direction)),
      2.0
    );
  #else
    vGrassBackLight = 0.0;
  #endif
  vGrassIrradiance = grassIrradiance;

  float localElevation = abs(dot(toCamera, basisY));
  float atlasElevation = mix(
    min(localElevation, ${IMPOSTOR_HORIZON_ATLAS_ELEVATION.toFixed(2)}),
    localElevation,
    aerialBlend
  );
  vec3 localViewDirection = vec3(
    dot(toCamera, basisX),
    atlasElevation,
    dot(toCamera, basisZ)
  );
  vLocalViewDirection = normalize(localViewDirection);
  vGustNoise = gustNoise;
  vBiome = instanceBiome;
  vSubpatchIndex = grassSubpatchIndex;
  vUv = uv;
  vInstanceSeed = fract(instanceVariation.x + uDitherSeed);
  vDryness = instanceVariation.w;
  vRootAo = instanceVariation.z;
  #include <fog_vertex>
}
`;

const FRAGMENT_SHADER = `
uniform sampler2D uAtlas;
uniform float uViewsPerAxis;
uniform float uSubpatchesPerAxis;
uniform float uFrameResolution;
uniform float uPadding;
uniform float uAtlasSize;
uniform float uAlphaCutoff;
uniform float uBlendViews;
uniform float uBaseColorBlend;
uniform float uColorScale;
uniform float uArtDensityScale;
uniform vec3 uBiomeBase[${GRASS_MAX_BIOMES}];
uniform vec3 uBiomeTip[${GRASS_MAX_BIOMES}];
uniform vec3 uBiomeDry[${GRASS_MAX_BIOMES}];
uniform vec2 uBiomeShade[${GRASS_MAX_BIOMES}];
uniform float uGustTipBoost;
uniform float uAmbientBoost;
uniform float uBacklightStrength;
varying vec2 vUv;
flat varying vec3 vLocalViewDirection;
flat varying float vGustNoise;
flat varying float vBiome;
flat varying float vSubpatchIndex;
flat varying float vInstanceSeed;
flat varying float vDryness;
flat varying float vRootAo;
flat varying float vFarEntry;
flat varying float vFieldCoverage;
flat varying vec3 vGrassIrradiance;
varying float vGrassBackLight;
#include <common>
#include <fog_pars_fragment>
${GRASS_PALETTE_GLSL}

vec2 encodeHemiOctahedral(vec3 direction) {
  vec3 foldedDirection = vec3(direction.x, abs(direction.y), direction.z);
  foldedDirection /= max(
    abs(foldedDirection.x) + foldedDirection.y + abs(foldedDirection.z),
    0.0001
  );
  vec2 diamond = foldedDirection.xz;
  vec2 square = vec2(
    diamond.x + diamond.y,
    diamond.x - diamond.y
  );
  return square * 0.5 + 0.5;
}

vec4 sampleFrame(vec2 frameIndex, vec2 localUv) {
  float cellSize = uFrameResolution + uPadding * 2.0;
  float pageSize = uViewsPerAxis * cellSize;
  vec2 pageIndex = vec2(
    mod(vSubpatchIndex, uSubpatchesPerAxis),
    floor(vSubpatchIndex / uSubpatchesPerAxis)
  );
  vec2 safeUv = clamp(
    localUv,
    vec2(0.5 / uFrameResolution),
    vec2(1.0 - 0.5 / uFrameResolution)
  );
  vec2 pixel =
    pageIndex * pageSize +
    frameIndex * cellSize +
    vec2(uPadding) +
    safeUv * uFrameResolution;
  return texture2D(uAtlas, pixel / uAtlasSize);
}

float coverageNoise(vec2 position, float seed) {
  vec3 value = fract(vec3(position.xyx) * 0.1031 + seed);
  value += dot(value, value.yzx + 33.33);
  return fract((value.x + value.y) * value.z);
}

void main() {
  // Dithered alpha works while the atlas is not strongly minified. Once several
  // atlas texels collapse into one screen pixel, screen-door coverage becomes
  // the isolated horizon speckles that TAA would normally hide. Resolve that
  // from projected size rather than world distance so FOV, viewport size, and
  // device pixel ratio cannot make the policy drift.
  float atlasTexelsPerPixel = uFrameResolution * max(
    fwidth(vUv.x),
    fwidth(vUv.y)
  );
  float minification = smoothstep(
    ${IMPOSTOR_MINIFICATION_START_TEXELS_PER_PIXEL.toFixed(2)},
    ${IMPOSTOR_MINIFICATION_FULL_TEXELS_PER_PIXEL.toFixed(2)},
    atlasTexelsPerPixel
  );
  bool fullyMinified =
    atlasTexelsPerPixel >= ${IMPOSTOR_MINIFICATION_FULL_TEXELS_PER_PIXEL.toFixed(2)};

  float effectiveCoverage =
    vFarEntry * min(vFieldCoverage * uArtDensityScale, 1.0);
  // Fine stochastic coverage is useful where real mid blades overlap the cards.
  // Once cards become tiny, field/stream coverage also resolves per subpatch so
  // no other low-coverage source can turn into isolated pixels at the horizon.
  float dither = fullyMinified
    ? coverageNoise(
        vec2(
          vSubpatchIndex,
          vSubpatchIndex * ${IMPOSTOR_MINIFIED_COVERAGE_SUBPATCH_SCALE.toFixed(11)}
        ),
        vInstanceSeed * 97.0 + ${IMPOSTOR_MINIFIED_COVERAGE_SEED_OFFSET.toFixed(2)}
      )
    : coverageNoise(
        floor(vUv * uFrameResolution),
        vInstanceSeed * 97.0 + vSubpatchIndex * 0.217
      );
  if (dither >= effectiveCoverage) {
    discard;
  }

  vec2 octahedralUv = clamp(
    encodeHemiOctahedral(normalize(vLocalViewDirection)),
    vec2(0.0),
    vec2(1.0)
  );
  vec2 framePosition = octahedralUv * uViewsPerAxis - 0.5;
  float maximumFrame = uViewsPerAxis - 1.0;
  vec4 atlasColor;

  // Once the card is minified enough to use coherent coverage, stochastic view
  // selection cannot add useful detail; it can only reintroduce salt-and-pepper
  // silhouette noise. Nearest-frame sampling is also cheaper in this band.
  if (uBlendViews < 0.5 || fullyMinified) {
    vec2 nearestFrame = clamp(
      floor(framePosition + 0.5),
      vec2(0.0),
      vec2(maximumFrame)
    );
    atlasColor = sampleFrame(nearestFrame, vUv);
  } else {
    vec2 frameBase = floor(framePosition);
    vec2 frameBlend = fract(framePosition);
    vec2 frame00 = clamp(frameBase, vec2(0.0), vec2(maximumFrame));
    vec2 frame11 = min(frame00 + vec2(1.0), vec2(maximumFrame));

    if (frameBase.x < 0.0 || frameBase.x >= maximumFrame) {
      frameBlend.x = 0.0;
      frame11.x = frame00.x;
    }
    if (frameBase.y < 0.0 || frameBase.y >= maximumFrame) {
      frameBlend.y = 0.0;
      frame11.y = frame00.y;
    }

    float weight00 = (1.0 - frameBlend.x) * (1.0 - frameBlend.y);
    float weight10 = frameBlend.x * (1.0 - frameBlend.y);
    float weight01 = (1.0 - frameBlend.x) * frameBlend.y;
    float viewDither = coverageNoise(
      floor(vUv * (
        uFrameResolution * ${IMPOSTOR_VIEW_DITHER_GRID_SCALE.toFixed(2)}
      )),
      vInstanceSeed * 173.0 + vSubpatchIndex * 0.131 + 0.37
    );
    vec2 selectedFrame = viewDither < weight00
      ? frame00
      : viewDither < weight00 + weight10
        ? vec2(frame11.x, frame00.y)
        : viewDither < weight00 + weight10 + weight01
          ? vec2(frame00.x, frame11.y)
          : frame11;
    // Stable stochastic bilinear selection reproduces the four-view average
    // with one atlas fetch while the card is large enough to benefit from it.
    atlasColor = sampleFrame(selectedFrame, vUv);
  }

  float cutoff = mix(
    uAlphaCutoff,
    ${IMPOSTOR_MINIFIED_ALPHA_CUTOFF.toFixed(2)},
    minification
  );
  if (fullyMinified) {
    // At minification == 1 the previous smoothstep + 0.5 threshold is exactly
    // equivalent to this hard cut. Skip derivative and hash work in the band
    // where those terms can no longer change the result.
    if (atlasColor.a <= cutoff) {
      discard;
    }
  } else {
    float alphaWidth = max(
      fwidth(atlasColor.a),
      ${IMPOSTOR_ALPHA_MIN_WIDTH}
    );
    float alphaCoverage = smoothstep(
      cutoff - alphaWidth,
      cutoff + alphaWidth,
      atlasColor.a
    );
    float alphaDither = coverageNoise(
      floor(vUv * uFrameResolution),
      vInstanceSeed * 211.0 +
        vSubpatchIndex * 0.173 +
        ${IMPOSTOR_ALPHA_DITHER_SEED.toFixed(2)}
    );
    // A strict >= is required: with >, a hash value of exactly zero survives an
    // alphaCoverage of zero and paints an opaque palette pixel in transparent
    // atlas space. Bias the stochastic threshold toward 0.5 as minification
    // rises; the fully-minified branch above takes over at the exact hard cut.
    float alphaThreshold = mix(alphaDither, 0.5, minification);
    if (alphaThreshold >= alphaCoverage) {
      discard;
    }
  }

  vec3 bladeData = clamp(
    atlasColor.rgb / max(atlasColor.a, 0.001),
    vec3(0.0),
    vec3(1.0)
  );
  int biomeRow = int(clamp(vBiome, 0.0, float(${GRASS_MAX_BIOMES} - 1)) + 0.5);
  vec3 color = grassResolvePalette(
    uBiomeBase[biomeRow],
    uBiomeTip[biomeRow],
    uBiomeDry[biomeRow],
    bladeData.r,
    bladeData.g,
    vDryness,
    vRootAo,
    uBiomeShade[biomeRow].y,
    uBiomeShade[biomeRow].x
  );
  color = mix(
    color,
    uBiomeTip[biomeRow],
    vGustNoise * uGustTipBoost * bladeData.r
  );
  color = mix(color, uBiomeBase[biomeRow], uBaseColorBlend);
  color *= uColorScale;
  vec3 grassLambertLight =
    color * vGrassIrradiance * RECIPROCAL_PI +
    color * uAmbientBoost;
  // Transmission is warmed towards the tip colour and scaled by the same
  // uniform as the near blades, with no extra per-LOD attenuation. The two used
  // to carry divergent hardcoded factors (0.2 here against 0.3 there) on top of
  // a shared strength, so a preset that tuned backlight moved the near field and
  // the cards by different amounts and the 54 m handoff shifted hue under it.
  vec3 outgoingLight =
    mix(color, grassLambertLight, ${GRASS_LIGHT_MIX_GLSL}) +
    mix(color, uBiomeTip[biomeRow], 0.35) *
      vGrassBackLight * uBacklightStrength;
  gl_FragColor = vec4(outgoingLight, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

type ShaderUniforms = Record<string, { value: unknown }>;

function createBiomeColorRows(color: THREE.ColorRepresentation): THREE.Color[] {
  return Array.from(
    { length: GRASS_MAX_BIOMES },
    () => new THREE.Color(color),
  );
}

function createBiomeShadeRows(
  rootDarkening: number,
  tipColorStrength: number,
): THREE.Vector2[] {
  return Array.from(
    { length: GRASS_MAX_BIOMES },
    () => new THREE.Vector2(rootDarkening, tipColorStrength),
  );
}

export class WorldGrassImpostorMaterial {
  readonly material: THREE.ShaderMaterial;

  private readonly uniforms: ShaderUniforms;
  private readonly baseWindStrength: number;
  private artRootDarkening: number;
  private artTipColorStrength = 0.5;

  constructor(
    readonly atlas: WorldGrassImpostorAtlas,
    materialConfig: GrassMaterialConfig,
    windConfig: GrassWindConfig,
    lodConfig: GrassLodConfig,
    blendViews: boolean,
    cardsPerPatch = 1,
    noiseWind = blendViews,
  ) {
    this.baseWindStrength = windConfig.strength;
    this.artRootDarkening = materialConfig.rootDarkening;
    let createdMaterial: THREE.ShaderMaterial | undefined;

    try {
      atlas.texture.anisotropy = 4;
      atlas.texture.needsUpdate = true;

      this.uniforms = {
        ...(THREE.UniformsUtils.clone(THREE.UniformsLib.fog) as ShaderUniforms),
        ...(THREE.UniformsUtils.clone(THREE.UniformsLib.lights) as ShaderUniforms),
        uAtlas: { value: atlas.texture },
        uViewsPerAxis: { value: atlas.viewsPerAxis },
        uSubpatchesPerAxis: { value: atlas.subpatchesPerAxis },
        uFrameResolution: { value: atlas.frameResolution },
        uPadding: { value: atlas.padding },
        uAtlasSize: { value: atlas.atlasSize },
        uCenterHeight: { value: atlas.centerHeight },
        uAlphaCutoff: { value: IMPOSTOR_ALPHA_CUTOFF },
        uBlendViews: { value: blendViews ? 1 : 0 },
        uBaseColorBlend: { value: IMPOSTOR_BASE_COLOR_BLEND },
        uColorScale: { value: IMPOSTOR_COLOR_SCALE },
        uArtDensityScale: { value: 1 },
        uCardsPerPatch: { value: cardsPerPatch },
        // Material-level: three cannot upload a per-mesh value for meshes that
        // share a material, so a per-chunk seed was never reaching the GPU.
        uDitherSeed: { value: IMPOSTOR_DITHER_SEED },
        uNearDistance: { value: lodConfig.nearMaxDistance },
        uMidDistance: { value: lodConfig.midMaxDistance },
        uFarDistance: { value: lodConfig.farMaxDistance },
        uTransitionDistance: { value: lodConfig.transitionDistance },
        uMidImpostorUnderfill: { value: GRASS_MID_IMPOSTOR_UNDERFILL },
        uTime: { value: 0 },
        uWindDirection: {
          value: new THREE.Vector2(
            windConfig.directionX,
            windConfig.directionZ,
          ).normalize(),
        },
        uWindStrength: { value: windConfig.strength },
        uWindNoise: { value: null as THREE.Texture | null },
        uWindNoiseScale: { value: GRASS_WIND_NOISE_SCALE },
        uWindNoiseSpeed: { value: GRASS_WIND_NOISE_SPEED },
        uCardRadius: { value: atlas.cardRadius },
        uGustTipBoost: { value: GRASS_GUST_TIP_BOOST },
        uBiomeBase: { value: createBiomeColorRows(materialConfig.baseColor) },
        uBiomeTip: { value: createBiomeColorRows(materialConfig.tipColor) },
        uBiomeDry: { value: createBiomeColorRows(materialConfig.dryColor) },
        uBiomeShade: {
          value: createBiomeShadeRows(materialConfig.rootDarkening, 0.5),
        },
        uNormalUp: { value: materialConfig.normalUp },
        uAmbientBoost: { value: materialConfig.ambientBoost },
        uBacklightStrength: { value: materialConfig.backlightStrength },
      };
      this.setPaletteColors(
        materialConfig.baseColor,
        materialConfig.tipColor,
        materialConfig.dryColor,
      );
      createdMaterial = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        side: THREE.DoubleSide,
        transparent: false,
        depthWrite: true,
        depthTest: true,
        fog: true,
        lights: true,
        toneMapped: true,
        // The gust model is compiled in, so it is its own decision rather than a
        // side effect of the view-blend setting: the governor turns blendViews
        // off at the lowest tier and must not silently swap the wind with it.
        defines: noiseWind ? { GRASS_NOISE_WIND: 1 } : {},
      });
      createdMaterial.name = "world-grass-subpatch-hemi-octahedral-impostor";
      this.material = createdMaterial;
    } catch (error) {
      createdMaterial?.dispose();
      atlas.texture.dispose();
      atlas.geometry.dispose();
      throw error;
    }
  }

  applyArtDirection(direction: GrassArtDirection): void {
    this.artRootDarkening = direction.rootDarkening;
    this.artTipColorStrength = direction.tipColorStrength;
    this.setPaletteColors(
      direction.baseColor,
      direction.tipColor,
      direction.dryColor,
    );
    this.uniforms.uNormalUp.value = direction.normalUp;
    this.uniforms.uAmbientBoost.value = direction.ambientBoost;
    this.uniforms.uBacklightStrength.value = direction.backlightStrength;
    this.uniforms.uBaseColorBlend.value = direction.impostorBaseColorBlend;
    this.uniforms.uColorScale.value = direction.impostorColorScale;
    this.uniforms.uArtDensityScale.value = direction.densityScale;
    this.uniforms.uWindStrength.value =
      this.baseWindStrength * direction.windStrengthScale;
    this.uniforms.uGustTipBoost.value =
      direction.gustTipBoost ?? GRASS_GUST_TIP_BOOST;
  }

  private setPaletteColors(
    baseColor: THREE.ColorRepresentation,
    tipColor: THREE.ColorRepresentation,
    dryColor: THREE.ColorRepresentation,
  ): void {
    const base = this.uniforms.uBiomeBase.value as THREE.Color[];
    const tip = this.uniforms.uBiomeTip.value as THREE.Color[];
    const dry = this.uniforms.uBiomeDry.value as THREE.Color[];
    const shade = this.uniforms.uBiomeShade.value as THREE.Vector2[];
    setBalancedGrassPaletteColors(
      base[0],
      tip[0],
      dry[0],
      baseColor,
      tipColor,
      dryColor,
    );
    shade[0].set(this.artRootDarkening, this.artTipColorStrength);
    for (let row = 1; row < GRASS_MAX_BIOMES; row += 1) {
      const profile = GRASS_BIOME_PROFILES[row];
      if (!profile || profile.paletteSource === "art") {
        base[row].copy(base[0]);
        tip[row].copy(tip[0]);
        dry[row].copy(dry[0]);
        shade[row].copy(shade[0]);
      } else {
        setBalancedGrassPaletteColors(
          base[row],
          tip[row],
          dry[row],
          profile.baseColor,
          profile.tipColor,
          profile.dryColor,
        );
        shade[row].set(profile.rootDarkening, profile.tipColorStrength);
      }
    }
  }

  setWindNoise(texture: THREE.Texture, scale: number, speed: number): void {
    this.uniforms.uWindNoise.value = texture;
    this.uniforms.uWindNoiseScale.value = scale;
    this.uniforms.uWindNoiseSpeed.value = speed;
  }

  setBlendViews(enabled: boolean): void {
    this.uniforms.uBlendViews.value = enabled ? 1 : 0;
  }

  configureLod(config: GrassLodConfig): void {
    this.uniforms.uNearDistance.value = config.nearMaxDistance;
    this.uniforms.uMidDistance.value = config.midMaxDistance;
    this.uniforms.uFarDistance.value = config.farMaxDistance;
    this.uniforms.uTransitionDistance.value = config.transitionDistance;
  }

  update(elapsedSeconds: number): void {
    this.uniforms.uTime.value = elapsedSeconds;
  }

  dispose(): void {
    this.material.dispose();
    this.atlas.texture.dispose();
    this.atlas.geometry.dispose();
  }
}
