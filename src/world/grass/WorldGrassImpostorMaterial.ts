import * as THREE from "three";
import type {
  GrassLodConfig,
  GrassMaterialConfig,
  GrassWindConfig,
} from "../../grass/GrassConfig";
import type { WorldGrassImpostorAtlas } from "./WorldGrassImpostorAtlasFactory";

const VERTEX_SHADER = `
attribute vec4 instanceVariation;
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
#include <fog_pars_vertex>

void main() {
  mat4 instanceModel = modelMatrix * instanceMatrix;
  vec3 instanceAxisX = instanceModel[0].xyz;
  vec3 instanceAxisY = instanceModel[1].xyz;
  vec3 instanceAxisZ = instanceModel[2].xyz;
  float scaleX = max(length(instanceAxisX), 0.0001);
  float scaleY = max(length(instanceAxisY), 0.0001);
  vec3 basisX = instanceAxisX / scaleX;
  vec3 basisY = normalize(instanceAxisY);
  vec3 basisZ = normalize(instanceAxisZ);
  vec3 center = (instanceModel * vec4(0.0, uCenterHeight, 0.0, 1.0)).xyz;
  vec3 toCamera = normalize(cameraPosition - center);
  vec3 billboardRight = cross(basisY, toCamera);
  float billboardRightLength = length(billboardRight);
  billboardRight = billboardRightLength < 0.001
    ? basisX
    : billboardRight / billboardRightLength;
  vec3 billboardUp = normalize(cross(toCamera, billboardRight));
  vec2 windDirection = normalize(uWindDirection);
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
  vUv = uv;
  vInstanceSeed = fract(instanceVariation.x + uDitherSeed);
  vDryness = instanceVariation.w;
  vRootAo = instanceVariation.z;
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
uniform vec3 uDryColor;
varying vec2 vUv;
varying vec3 vLocalViewDirection;
varying float vInstanceSeed;
varying float vDryness;
varying float vRootAo;
varying float vFarEntry;
varying float vTerrainCoverage;
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
  vec2 pixel =
    frameIndex * cellSize +
    vec2(uPadding) +
    localUv * uFrameResolution;
  return texture2D(uAtlas, pixel / uAtlasSize);
}

void main() {
  float terrainDither = fract(vInstanceSeed * 0.754877666 + 0.438289);
  if (vInstanceSeed > vFarEntry || terrainDither > vTerrainCoverage) {
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
  color = mix(color, uDryColor, vDryness * 0.18);
  color *= mix(0.9, 1.04, vRootAo);
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

export class WorldGrassImpostorMaterial {
  readonly material: THREE.ShaderMaterial;

  private readonly uniforms: Record<string, { value: unknown }>;

  constructor(
    readonly atlas: WorldGrassImpostorAtlas,
    materialConfig: GrassMaterialConfig,
    windConfig: GrassWindConfig,
    lodConfig: GrassLodConfig,
    blendViews: boolean,
  ) {
    this.uniforms = {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uAtlas: { value: atlas.texture },
      uViewsPerAxis: { value: atlas.viewsPerAxis },
      uFrameResolution: { value: atlas.frameResolution },
      uPadding: { value: atlas.padding },
      uAtlasSize: { value: atlas.atlasSize },
      uCenterHeight: { value: atlas.centerHeight },
      uAlphaCutoff: { value: 0.12 },
      uBlendViews: { value: blendViews ? 1 : 0 },
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
    mesh.onBeforeRender = () => {
      this.uniforms.uDitherSeed.value = ditherSeed / 4294967296;
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
