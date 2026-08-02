import type { GUI } from "dat.gui";
import * as THREE from "three";
import type {
  GrassLodConfig,
  GrassMaterialConfig,
  GrassWindConfig,
} from "../GrassConfig";

const VERTEX_DECLARATIONS = `
attribute float grassProgress;
attribute float grassPhase;
attribute float grassBladeShade;
attribute vec4 instanceVariation;
uniform float uGrassTime;
uniform vec2 uGrassWindDirection;
uniform float uGrassWindStrength;
uniform float uGrassGustScale;
uniform float uGrassGustSpeed;
uniform float uGrassFlutterStrength;
uniform float uGrassFlutterSpeed;
uniform float uGrassNormalUp;
uniform float uGrassWindLodScale;
uniform float uGrassDitherSeed;
uniform float uGrassUseWorldLod;
uniform float uGrassNearDistance;
uniform float uGrassMidDistance;
uniform float uGrassTransitionDistance;
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
varying float vGrassDither;
varying float vGrassNearCoverage;
varying float vGrassFarEntry;
`;

const VERTEX_WIND = `
vec4 grassWorldRoot = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
vec2 grassWindDirection = normalize(uGrassWindDirection);
float grassGust = sin(
  dot(grassWorldRoot.xz, grassWindDirection) / uGrassGustScale +
  uGrassTime * uGrassGustSpeed +
  instanceVariation.x * 6.28318530718
);
float grassFlutter = sin(
  dot(grassWorldRoot.xz, vec2(-grassWindDirection.y, grassWindDirection.x)) /
    (uGrassGustScale * 0.37) +
  uGrassTime * uGrassFlutterSpeed +
  grassPhase * 6.28318530718
);
float grassStiffness = mix(0.76, 1.12, fract(grassPhase * 1.61803398875));
float grassBend = (
  grassGust * uGrassWindStrength +
  grassFlutter * uGrassFlutterStrength
) * instanceVariation.y * grassStiffness * pow(grassProgress, 1.65) * uGrassWindLodScale;
mat3 grassInstanceBasis = mat3(instanceMatrix);
vec3 grassWorldWind = vec3(grassWindDirection.x, 0.0, grassWindDirection.y);
vec3 grassLocalWind = vec3(
  dot(grassWorldWind, normalize(grassInstanceBasis[0])),
  dot(grassWorldWind, normalize(grassInstanceBasis[1])),
  dot(grassWorldWind, normalize(grassInstanceBasis[2]))
);
transformed += grassLocalWind * grassBend;
vGrassProgress = grassProgress;
vGrassShade = grassBladeShade;
vGrassDryness = instanceVariation.w;
vGrassRootAo = instanceVariation.z;
vGrassDither = fract(
  grassBladeShade * 0.754877666 +
  grassPhase * 0.569840296 +
  instanceVariation.x +
  uGrassDitherSeed
);
float grassCameraDistance = distance(cameraPosition, grassWorldRoot.xyz);
vGrassNearCoverage = 1.0 - smoothstep(
  uGrassNearDistance - uGrassTransitionDistance,
  uGrassNearDistance + uGrassTransitionDistance,
  grassCameraDistance
);
vGrassFarEntry = smoothstep(
  uGrassMidDistance - uGrassTransitionDistance,
  uGrassMidDistance + uGrassTransitionDistance,
  grassCameraDistance
);
`;

const FRAGMENT_DECLARATIONS = `
uniform vec3 uGrassBaseColor;
uniform vec3 uGrassTipColor;
uniform vec3 uGrassDryColor;
uniform float uGrassRootDarkening;
uniform float uGrassAmbientBoost;
uniform float uGrassBacklightStrength;
uniform float uGrassLodThreshold;
uniform float uGrassLodInvert;
uniform float uGrassDistanceFade;
uniform float uGrassUseWorldLod;
uniform float uGrassLodColorScale;
uniform float uGrassStreamCoverage;
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
varying float vGrassDither;
varying float vGrassNearCoverage;
varying float vGrassFarEntry;
`;

const FRAGMENT_COLOR = `
#include <color_fragment>
float grassDither = vGrassDither;
bool grassKeepLod;
if (uGrassUseWorldLod > 0.5) {
  grassKeepLod = uGrassLodInvert < 0.5
    ? grassDither <= vGrassNearCoverage
    : grassDither > vGrassNearCoverage &&
      grassDither > vGrassFarEntry;
} else {
  grassKeepLod = uGrassLodInvert < 0.5
    ? grassDither <= uGrassLodThreshold
    : grassDither > uGrassLodThreshold;
}
if (
  !grassKeepLod ||
  grassDither > uGrassDistanceFade ||
  grassDither > uGrassStreamCoverage
) {
  discard;
}
float grassTipBlend = smoothstep(0.08, 1.0, vGrassProgress);
vec3 grassHealthyColor = mix(uGrassBaseColor, uGrassTipColor, grassTipBlend);
vec3 grassColor = mix(
  grassHealthyColor,
  uGrassDryColor,
  vGrassDryness * (0.18 + grassTipBlend * 0.24)
);
float grassRootLight = mix(
  uGrassRootDarkening,
  1.0,
  smoothstep(0.0, 0.34, vGrassProgress)
);
float grassBladeVariation = mix(0.72, 1.13, vGrassShade);
diffuseColor.rgb = grassColor * grassRootLight * grassBladeVariation * vGrassRootAo;
diffuseColor.rgb *= uGrassLodColorScale;
totalEmissiveRadiance += diffuseColor.rgb * uGrassAmbientBoost;
`;

const FRAGMENT_OUTPUT = `
float grassBackLight = 0.0;
#if NUM_DIR_LIGHTS > 0
  grassBackLight = pow(
    saturate(dot(-normalize(vViewPosition), directionalLights[0].direction)),
    2.0
  ) * smoothstep(0.18, 1.0, vGrassProgress);
#endif
vec3 outgoingLight =
  reflectedLight.directDiffuse +
  reflectedLight.indirectDiffuse +
  totalEmissiveRadiance +
  uGrassTipColor * grassBackLight * uGrassBacklightStrength;
`;

export class GrassNearMaterial {
  readonly material: THREE.MeshLambertMaterial;

  private readonly colorControls = {
    baseColor: "#273f22",
    tipColor: "#83a96b",
    dryColor: "#a8a06a",
  };

  private readonly uniforms = {
    uGrassTime: { value: 0 },
    uGrassWindDirection: { value: new THREE.Vector2(0.8, 0.35).normalize() },
    uGrassWindStrength: { value: 0.14 },
    uGrassGustScale: { value: 0.08 },
    uGrassGustSpeed: { value: 0.65 },
    uGrassFlutterStrength: { value: 0.035 },
    uGrassFlutterSpeed: { value: 3.4 },
    uGrassBaseColor: { value: new THREE.Color(this.colorControls.baseColor) },
    uGrassTipColor: { value: new THREE.Color(this.colorControls.tipColor) },
    uGrassDryColor: { value: new THREE.Color(this.colorControls.dryColor) },
    uGrassRootDarkening: { value: 0.55 },
    uGrassNormalUp: { value: 0.45 },
    uGrassAmbientBoost: { value: 0.12 },
    uGrassBacklightStrength: { value: 0.16 },
    uGrassLodThreshold: { value: 1 },
    uGrassLodInvert: { value: 0 },
    uGrassDistanceFade: { value: 1 },
    uGrassDitherSeed: { value: 0 },
    uGrassWindLodScale: { value: 1 },
    uGrassUseWorldLod: { value: 0 },
    uGrassNearDistance: { value: 0 },
    uGrassMidDistance: { value: 0 },
    uGrassTransitionDistance: { value: 1 },
    uGrassLodColorScale: { value: 1 },
    uGrassStreamCoverage: { value: 1 },
  };

  constructor() {
    this.material = new THREE.MeshLambertMaterial({
      side: THREE.DoubleSide,
      color: 0xffffff,
      transparent: false,
      depthWrite: true,
    });
    this.material.name = "grass-near-material";
    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>${VERTEX_DECLARATIONS}`)
        .replace(
          "#include <beginnormal_vertex>",
          `#include <beginnormal_vertex>\nobjectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), uGrassNormalUp));`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>${VERTEX_WIND}`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>${FRAGMENT_DECLARATIONS}`)
        .replace("#include <color_fragment>", FRAGMENT_COLOR)
        .replace(
          "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",
          FRAGMENT_OUTPUT,
        );
    };
    this.material.customProgramCacheKey = () => "grass-near-material-v7";
  }

  configure(material: GrassMaterialConfig, wind: GrassWindConfig): void {
    this.colorControls.baseColor = material.baseColor;
    this.colorControls.tipColor = material.tipColor;
    this.colorControls.dryColor = material.dryColor;
    this.uniforms.uGrassBaseColor.value.set(material.baseColor);
    this.uniforms.uGrassTipColor.value.set(material.tipColor);
    this.uniforms.uGrassDryColor.value.set(material.dryColor);
    this.uniforms.uGrassRootDarkening.value = material.rootDarkening;
    this.uniforms.uGrassNormalUp.value = material.normalUp;
    this.uniforms.uGrassAmbientBoost.value = material.ambientBoost;
    this.uniforms.uGrassBacklightStrength.value = material.backlightStrength;
    this.uniforms.uGrassWindDirection.value
      .set(wind.directionX, wind.directionZ)
      .normalize();
    this.uniforms.uGrassWindStrength.value = wind.strength;
    this.uniforms.uGrassGustScale.value = wind.gustScale;
    this.uniforms.uGrassGustSpeed.value = wind.gustSpeed;
    this.uniforms.uGrassFlutterStrength.value = wind.flutterStrength;
    this.uniforms.uGrassFlutterSpeed.value = wind.flutterSpeed;
  }

  configureLod(config: GrassLodConfig): void {
    this.uniforms.uGrassNearDistance.value = config.nearMaxDistance;
    this.uniforms.uGrassMidDistance.value = config.midMaxDistance;
    this.uniforms.uGrassTransitionDistance.value = config.transitionDistance;
  }

  bindMesh(
    mesh: THREE.InstancedMesh,
    ditherSeed: number,
    invertLodCoverage: boolean,
    windScale: number,
    useWorldLod = false,
    lodColorScale = 1,
    initialStreamCoverage = 1,
  ): void {
    mesh.userData.grassLodThreshold = 1;
    mesh.userData.grassDistanceFade = 1;
    mesh.userData.grassStreamCoverage = initialStreamCoverage;
    mesh.onBeforeRender = () => {
      this.uniforms.uGrassLodThreshold.value =
        mesh.userData.grassLodThreshold ?? 1;
      this.uniforms.uGrassLodInvert.value = invertLodCoverage ? 1 : 0;
      this.uniforms.uGrassDistanceFade.value =
        mesh.userData.grassDistanceFade ?? 1;
      this.uniforms.uGrassDitherSeed.value = ditherSeed / 4294967296;
      this.uniforms.uGrassWindLodScale.value = windScale;
      this.uniforms.uGrassUseWorldLod.value = useWorldLod ? 1 : 0;
      this.uniforms.uGrassLodColorScale.value = lodColorScale;
      this.uniforms.uGrassStreamCoverage.value =
        mesh.userData.grassStreamCoverage ?? 1;
    };
  }

  update(elapsedSeconds: number): void {
    this.uniforms.uGrassTime.value = elapsedSeconds;
  }

  setupGUI(gui: GUI): void {
    const folder = gui.addFolder("Grass Props");
    folder.addColor(this.colorControls, "baseColor").onChange((value: string) => {
      this.uniforms.uGrassBaseColor.value.set(value);
    });
    folder.addColor(this.colorControls, "tipColor").onChange((value: string) => {
      this.uniforms.uGrassTipColor.value.set(value);
    });
    folder.addColor(this.colorControls, "dryColor").onChange((value: string) => {
      this.uniforms.uGrassDryColor.value.set(value);
    });
    folder
      .add(this.uniforms.uGrassWindStrength, "value", 0, 0.45, 0.005)
      .name("Wind Strength");
    folder
      .add(this.uniforms.uGrassFlutterStrength, "value", 0, 0.15, 0.0025)
      .name("Tip Flutter");
    folder
      .add(this.uniforms.uGrassNormalUp, "value", 0, 0.9, 0.01)
      .name("Normal Up");
    folder
      .add(this.uniforms.uGrassAmbientBoost, "value", 0, 0.4, 0.01)
      .name("Ambient Boost");
    folder
      .add(this.uniforms.uGrassBacklightStrength, "value", 0, 0.5, 0.01)
      .name("Backlight");
    folder.open();
  }
}
