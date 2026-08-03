import * as THREE from "three";
import type {
  GrassLodConfig,
  GrassMaterialConfig,
  GrassWindConfig,
} from "../../grass/GrassConfig";
import type { WorldGrassImpostorAtlas } from "./WorldGrassImpostorAtlasFactory";
import {
  IMPOSTOR_AERIAL_FADE_END,
  IMPOSTOR_AERIAL_FADE_START,
  IMPOSTOR_ALPHA_CUTOFF,
  IMPOSTOR_BASE_COLOR_BLEND,
  IMPOSTOR_COLOR_SCALE,
  IMPOSTOR_ROOT_LIGHT_MAX,
  IMPOSTOR_ROOT_LIGHT_MIN,
} from "./WorldGrassImpostorTuning";

const VERTEX_SHADER = `
attribute vec4 instanceVariation;
attribute float instanceCoverage;
uniform float uCenterHeight;
uniform float uTime;
uniform vec2 uWindDirection;
uniform float uWindStrength;
uniform float uDitherSeed;
uniform float uMidDistance;
uniform float uFarDistance;
uniform float uTransitionDistance;
varying vec2 vUv;
varying vec3 vLocalViewDirection;
varying float vInstanceSeed;
varying float vDryness;
varying float vRootAo;
varying float vFarEntry;
varying float vTerrainCoverage;
varying float vViewElevation;
varying float vFieldCoverage;
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
  // The CPU stores this uniform normalized, so keep the per-vertex path free
  // of a redundant square root.
  vec2 windDirection = uWindDirection;
  float gust = sin(
    dot(center.xz, windDirection) * 0.045 +
    uTime * 0.7 +
    instanceVariation.x * 6.28318530718
  );
  center += vec3(windDirection.x, 0.0, windDirection.y) *
    gust * uWindStrength * 0.22;

  vec3 worldPosition = center +
    billboardRight * position.x * scaleX +
    billboardUp * position.y * scaleY;
  vec4 mvPosition = viewMatrix * vec4(worldPosition, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  vec3 localViewDirection = vec3(
    dot(toCamera, basisX),
    abs(dot(toCamera, basisY)),
    dot(toCamera, basisZ)
  );
  vLocalViewDirection = normalize(localViewDirection);
  vViewElevation = abs(dot(toCamera, basisY));
  vUv = uv;
  vInstanceSeed = fract(instanceVariation.x + uDitherSeed);
  vDryness = instanceVariation.w;
  vRootAo = instanceVariation.z;
  vFieldCoverage = instanceCoverage;
  float cameraDistance = distance(cameraPosition, center);
  vFarEntry = smoothstep(
    uMidDistance - uTransitionDistance,
    uMidDistance + uTransitionDistance,
    cameraDistance
  );
  vTerrainCoverage = 1.0 - smoothstep(
    uFarDistance - uTransitionDistance,
    uFarDistance + uTransitionDistance,
    cameraDistance
  );
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
uniform float uAerialFadeStart;
uniform float uAerialFadeEnd;
uniform float uBaseColorBlend;
uniform float uStreamCoverage;
uniform vec3 uBaseColor;
uniform vec3 uDryColor;
varying vec2 vUv;
varying vec3 vLocalViewDirection;
varying float vInstanceSeed;
varying float vDryness;
varying float vRootAo;
varying float vFarEntry;
varying float vTerrainCoverage;
varying float vViewElevation;
varying float vFieldCoverage;
#include <fog_pars_fragment>

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
  // Distance coverage is complementary to the mid-blade fade. Suppressing
  // cards by elevation made the mid layer reach zero before the far layer
  // appeared, leaving a grass-free annulus in aerial views.
  float effectiveCoverage =
    vFarEntry * vTerrainCoverage *
    uStreamCoverage * vFieldCoverage;
  float dither = coverageNoise(floor(vUv * 64.0), vInstanceSeed * 97.0);
  if (
    effectiveCoverage <= 0.001 ||
    dither > effectiveCoverage
  ) {
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
    atlasColor.rgb *= atlasColor.a;
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

    vec4 color00 = sampleFrame(frame00, vUv);
    vec4 color10 = sampleFrame(vec2(frame11.x, frame00.y), vUv);
    vec4 color01 = sampleFrame(vec2(frame00.x, frame11.y), vUv);
    vec4 color11 = sampleFrame(frame11, vUv);
    color00.rgb *= color00.a;
    color10.rgb *= color10.a;
    color01.rgb *= color01.a;
    color11.rgb *= color11.a;
    vec4 color0 = mix(color00, color10, frameBlend.x);
    vec4 color1 = mix(color01, color11, frameBlend.x);
    atlasColor = mix(color0, color1, frameBlend.y);
  }

  if (atlasColor.a < uAlphaCutoff) {
    discard;
  }

  vec3 color = atlasColor.rgb / max(atlasColor.a, 0.001);
  float terrainMatch = mix(
    uBaseColorBlend,
    1.0,
    smoothstep(uAerialFadeStart, uAerialFadeEnd, vViewElevation)
  );
  color = mix(color, uBaseColor, terrainMatch);
  color = mix(color, uDryColor, vDryness * 0.04);
  color *= ${IMPOSTOR_COLOR_SCALE.toFixed(2)};
  color *= mix(${IMPOSTOR_ROOT_LIGHT_MIN.toFixed(2)}, ${IMPOSTOR_ROOT_LIGHT_MAX.toFixed(2)}, vRootAo);
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

type ShaderUniforms = Record<string, { value: unknown }>;

export class WorldGrassImpostorMaterial {
  readonly material: THREE.ShaderMaterial;

  private readonly uniforms: ShaderUniforms;

  constructor(
    readonly atlas: WorldGrassImpostorAtlas,
    materialConfig: GrassMaterialConfig,
    windConfig: GrassWindConfig,
    lodConfig: GrassLodConfig,
    blendViews: boolean,
  ) {
    atlas.texture.generateMipmaps = false;
    atlas.texture.minFilter = THREE.LinearFilter;
    atlas.texture.needsUpdate = true;

    this.uniforms = {
      ...(THREE.UniformsUtils.clone(THREE.UniformsLib.fog) as ShaderUniforms),
      uAtlas: { value: atlas.texture },
      uViewsPerAxis: { value: atlas.viewsPerAxis },
      uFrameResolution: { value: atlas.frameResolution },
      uPadding: { value: atlas.padding },
      uAtlasSize: { value: atlas.atlasSize },
      uCenterHeight: { value: atlas.centerHeight },
      uAlphaCutoff: { value: IMPOSTOR_ALPHA_CUTOFF },
      uBlendViews: { value: blendViews ? 1 : 0 },
      uAerialFadeStart: { value: IMPOSTOR_AERIAL_FADE_START },
      uAerialFadeEnd: { value: IMPOSTOR_AERIAL_FADE_END },
      uBaseColorBlend: { value: IMPOSTOR_BASE_COLOR_BLEND },
      uStreamCoverage: { value: 1 },
      uDitherSeed: { value: 0 },
      uMidDistance: { value: lodConfig.midMaxDistance },
      uFarDistance: { value: lodConfig.farMaxDistance },
      uTransitionDistance: { value: lodConfig.transitionDistance },
      uTime: { value: 0 },
      uWindDirection: {
        value: new THREE.Vector2(
          windConfig.directionX,
          windConfig.directionZ,
        ).normalize(),
      },
      uWindStrength: { value: windConfig.strength },
      uBaseColor: { value: new THREE.Color(materialConfig.baseColor) },
      uDryColor: { value: new THREE.Color(materialConfig.dryColor) },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      side: THREE.DoubleSide,
      transparent: false,
      depthWrite: true,
      depthTest: true,
      fog: true,
      toneMapped: true,
    });
    this.material.name = "world-grass-hemi-octahedral-impostor";
  }

  bindMesh(mesh: THREE.InstancedMesh, ditherSeed: number): void {
    mesh.userData.grassStreamCoverage = 0;
    mesh.onBeforeRender = () => {
      this.uniforms.uDitherSeed.value = ditherSeed / 4294967296;
      this.uniforms.uStreamCoverage.value =
        mesh.userData.grassStreamCoverage ?? 1;
    };
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
