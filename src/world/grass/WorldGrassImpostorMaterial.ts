import * as THREE from "three";
import type { GrassArtDirection } from "../../grass/GrassArtDirection";
import {
  GRASS_PALETTE_GLSL,
  setBalancedGrassPaletteColors,
} from "../../grass/materials/GrassPaletteShader";
import type {
  GrassLodConfig,
  GrassMaterialConfig,
  GrassWindConfig,
} from "../../grass/GrassConfig";
import {
  GRASS_IMPOSTOR_FOOTPRINT_SCALE,
  GRASS_MID_IMPOSTOR_UNDERFILL,
} from "../../grass/GrassLodTuning";
import type { WorldGrassImpostorAtlas } from "./WorldGrassImpostorAtlasFactory";
import {
  IMPOSTOR_ALPHA_CUTOFF,
  IMPOSTOR_BASE_COLOR_BLEND,
  IMPOSTOR_COLOR_SCALE,
  IMPOSTOR_DITHER_SEED,
} from "./WorldGrassImpostorTuning";

const VERTEX_SHADER = `
#include <common>
#include <lights_pars_begin>
attribute vec4 instanceVariation;
attribute float instanceCoverage;
uniform float uCenterHeight;
uniform float uTime;
uniform vec2 uWindDirection;
uniform float uWindStrength;
uniform float uDitherSeed;
uniform float uNearDistance;
uniform float uMidDistance;
uniform float uFarDistance;
uniform float uTransitionDistance;
uniform float uMidImpostorUnderfill;
uniform float uNormalUp;
uniform float uArtDensityScale;
varying vec2 vUv;
varying vec3 vLocalViewDirection;
varying float vInstanceSeed;
varying float vDryness;
varying float vRootAo;
varying float vFarEntry;
varying float vTerrainCoverage;
varying float vFieldCoverage;
varying vec3 vGrassIrradiance;
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
  vec3 center = rootCenter + basisY * uCenterHeight * scaleY;
  vec3 toCamera = normalize(cameraPosition - center);
  vec3 billboardRight = cross(basisY, toCamera);
  float billboardRightLength = length(billboardRight);
  billboardRight = billboardRightLength < 0.001
    ? basisX
    : billboardRight / billboardRightLength;
  vec3 billboardUp = normalize(cross(toCamera, billboardRight));
  vec2 windDirection = uWindDirection;
  float gust = sin(
    dot(center.xz, windDirection) * 0.045 +
    uTime * 0.7 +
    instanceVariation.x * 6.28318530718
  );
  center += vec3(windDirection.x, 0.0, windDirection.y) *
    gust * uWindStrength * 0.22;

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
  vTerrainCoverage = 1.0 - smoothstep(
    uFarDistance - uTransitionDistance,
    uFarDistance + uTransitionDistance,
    cameraDistance
  );
  // instanceCoverage carries the streaming fade-in, scaled on the CPU while a
  // chunk arrives. It used to be a separate uStreamCoverage uniform written per
  // mesh, which three collapses to one value across every card sharing this
  // material, so no card but the first ever faded.
  vFieldCoverage = instanceCoverage;
  float effectiveCoverage =
    vFarEntry * vTerrainCoverage * min(vFieldCoverage * uArtDensityScale, 1.0);
  if (effectiveCoverage <= 0.001) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  vec3 worldPosition = center +
    billboardRight * position.x * scaleX * ${GRASS_IMPOSTOR_FOOTPRINT_SCALE.toFixed(2)} +
    billboardUp * position.y * scaleY;
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

  vec3 localViewDirection = vec3(
    dot(toCamera, basisX),
    abs(dot(toCamera, basisY)),
    dot(toCamera, basisZ)
  );
  vLocalViewDirection = normalize(localViewDirection);
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
uniform float uFrameResolution;
uniform float uPadding;
uniform float uAtlasSize;
uniform float uAlphaCutoff;
uniform float uBlendViews;
uniform float uBaseColorBlend;
uniform float uColorScale;
uniform float uArtDensityScale;
uniform vec3 uBaseColor;
uniform vec3 uTipColor;
uniform vec3 uDryColor;
uniform float uTipColorStrength;
uniform float uRootDarkening;
uniform float uAmbientBoost;
uniform float uBacklightStrength;
varying vec2 vUv;
varying vec3 vLocalViewDirection;
varying float vInstanceSeed;
varying float vDryness;
varying float vRootAo;
varying float vFarEntry;
varying float vTerrainCoverage;
varying float vFieldCoverage;
varying vec3 vGrassIrradiance;
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
  vec2 safeUv = clamp(
    localUv,
    vec2(0.5 / uFrameResolution),
    vec2(1.0 - 0.5 / uFrameResolution)
  );
  vec2 pixel =
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
  float effectiveCoverage =
    vFarEntry * vTerrainCoverage * min(vFieldCoverage * uArtDensityScale, 1.0);
  // Cards with no coverage at all are already clipped in the vertex stage, so
  // only the stochastic cut is left here. This discard has to stay: it depends
  // on vUv, and the atlas alpha cutout below is a genuine per-fragment test.
  float dither = coverageNoise(floor(vUv * 64.0), vInstanceSeed * 97.0);
  if (dither > effectiveCoverage) {
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

  if (uBlendViews < 0.5) {
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
      floor(vUv * 48.0),
      vInstanceSeed * 173.0 + 0.37
    );
    vec2 selectedFrame = viewDither < weight00
      ? frame00
      : viewDither < weight00 + weight10
        ? vec2(frame11.x, frame00.y)
        : viewDither < weight00 + weight10 + weight01
          ? vec2(frame00.x, frame11.y)
          : frame11;
    // Stable stochastic bilinear selection reproduces the four-view average
    // with one atlas fetch. A true four-tap blend used to run whenever
    // vFarEntry < 0.999 — across the entire mid-to-far crossfade, which is
    // exactly where the cards are largest on screen and therefore where the
    // extra three fetches cost the most. Real mid blades are still drawing over
    // the cards throughout that band, so the slightly noisier silhouette the
    // stochastic path produces is not visible.
    atlasColor = sampleFrame(selectedFrame, vUv);
  }

  if (atlasColor.a < uAlphaCutoff) {
    discard;
  }

  vec3 bladeData = clamp(
    atlasColor.rgb / max(atlasColor.a, 0.001),
    vec3(0.0),
    vec3(1.0)
  );
  vec3 color = grassResolvePalette(
    uBaseColor,
    uTipColor,
    uDryColor,
    bladeData.r,
    bladeData.g,
    vDryness,
    vRootAo,
    uTipColorStrength,
    uRootDarkening
  );
  color = mix(color, uBaseColor, uBaseColorBlend);
  color *= uColorScale;
  vec3 grassLambertLight =
    color * vGrassIrradiance * RECIPROCAL_PI +
    color * uAmbientBoost;
  vec3 outgoingLight =
    mix(color, grassLambertLight, 0.38) +
    color * vGrassBackLight * uBacklightStrength * 0.2;
  gl_FragColor = vec4(outgoingLight, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

type ShaderUniforms = Record<string, { value: unknown }>;

export class WorldGrassImpostorMaterial {
  readonly material: THREE.ShaderMaterial;

  private readonly uniforms: ShaderUniforms;
  private readonly baseWindStrength: number;

  constructor(
    readonly atlas: WorldGrassImpostorAtlas,
    materialConfig: GrassMaterialConfig,
    windConfig: GrassWindConfig,
    lodConfig: GrassLodConfig,
    blendViews: boolean,
  ) {
    this.baseWindStrength = windConfig.strength;
    atlas.texture.generateMipmaps = false;
    atlas.texture.minFilter = THREE.LinearFilter;
    atlas.texture.needsUpdate = true;

    this.uniforms = {
      ...(THREE.UniformsUtils.clone(THREE.UniformsLib.fog) as ShaderUniforms),
      ...(THREE.UniformsUtils.clone(THREE.UniformsLib.lights) as ShaderUniforms),
      uAtlas: { value: atlas.texture },
      uViewsPerAxis: { value: atlas.viewsPerAxis },
      uFrameResolution: { value: atlas.frameResolution },
      uPadding: { value: atlas.padding },
      uAtlasSize: { value: atlas.atlasSize },
      uCenterHeight: { value: atlas.centerHeight },
      uAlphaCutoff: { value: IMPOSTOR_ALPHA_CUTOFF },
      uBlendViews: { value: blendViews ? 1 : 0 },
      uBaseColorBlend: { value: IMPOSTOR_BASE_COLOR_BLEND },
      uColorScale: { value: IMPOSTOR_COLOR_SCALE },
      uArtDensityScale: { value: 1 },
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
      uBaseColor: { value: new THREE.Color(materialConfig.baseColor) },
      uTipColor: { value: new THREE.Color(materialConfig.tipColor) },
      uDryColor: { value: new THREE.Color(materialConfig.dryColor) },
      uTipColorStrength: { value: 0.5 },
      uRootDarkening: { value: materialConfig.rootDarkening },
      uNormalUp: { value: materialConfig.normalUp },
      uAmbientBoost: { value: materialConfig.ambientBoost },
      uBacklightStrength: { value: materialConfig.backlightStrength },
    };
    setBalancedGrassPaletteColors(
      this.uniforms.uBaseColor.value as THREE.Color,
      this.uniforms.uTipColor.value as THREE.Color,
      this.uniforms.uDryColor.value as THREE.Color,
      materialConfig.baseColor,
      materialConfig.tipColor,
      materialConfig.dryColor,
    );
    this.material = new THREE.ShaderMaterial({
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
    });
    this.material.name = "world-grass-hemi-octahedral-impostor";
  }

  applyArtDirection(direction: GrassArtDirection): void {
    setBalancedGrassPaletteColors(
      this.uniforms.uBaseColor.value as THREE.Color,
      this.uniforms.uTipColor.value as THREE.Color,
      this.uniforms.uDryColor.value as THREE.Color,
      direction.baseColor,
      direction.tipColor,
      direction.dryColor,
    );
    this.uniforms.uTipColorStrength.value = direction.tipColorStrength;
    this.uniforms.uRootDarkening.value = direction.rootDarkening;
    this.uniforms.uNormalUp.value = direction.normalUp;
    this.uniforms.uAmbientBoost.value = direction.ambientBoost;
    this.uniforms.uBacklightStrength.value = direction.backlightStrength;
    this.uniforms.uBaseColorBlend.value = direction.impostorBaseColorBlend;
    this.uniforms.uColorScale.value = direction.impostorColorScale;
    this.uniforms.uArtDensityScale.value = direction.densityScale;
    this.uniforms.uWindStrength.value =
      this.baseWindStrength * direction.windStrengthScale;
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
