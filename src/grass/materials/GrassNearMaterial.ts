import type { GUI } from "dat.gui";
import * as THREE from "three";
import type { GrassMaterialConfig, GrassWindConfig } from "../GrassConfig";

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
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
varying float vGrassDither;
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
`;

const VERTEX_WIND_LOW_POWER = `
vec4 grassWorldRoot = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
vec2 grassWindDirection = normalize(uGrassWindDirection);
float grassGust = sin(
  dot(grassWorldRoot.xz, grassWindDirection) / uGrassGustScale +
  uGrassTime * uGrassGustSpeed +
  instanceVariation.x * 6.28318530718
);
float grassBend = grassGust * uGrassWindStrength * instanceVariation.y *
  grassProgress * grassProgress * uGrassWindLodScale;
mat3 grassInstanceBasis = mat3(instanceMatrix);
vec3 grassWorldWind = vec3(grassWindDirection.x, 0.0, grassWindDirection.y);
vec3 grassLocalWind = vec3(
  dot(grassWorldWind, grassInstanceBasis[0]),
  0.0,
  dot(grassWorldWind, grassInstanceBasis[2])
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
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
varying float vGrassDither;
`;

const FRAGMENT_COLOR_COMMON = `
float grassDither = vGrassDither;
bool grassKeepLod = uGrassLodInvert < 0.5
  ? grassDither <= uGrassLodThreshold
  : grassDither > uGrassLodThreshold;
if (!grassKeepLod || grassDither > uGrassDistanceFade) {
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
`;

const FRAGMENT_COLOR_LIT = `
#include <color_fragment>
${FRAGMENT_COLOR_COMMON}
totalEmissiveRadiance += diffuseColor.rgb * uGrassAmbientBoost;
`;

const FRAGMENT_COLOR_LOW_POWER = `
#include <color_fragment>
${FRAGMENT_COLOR_COMMON}
diffuseColor.rgb *= 1.0 + uGrassAmbientBoost * 0.35;
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
  readonly material: THREE.MeshLambertMaterial | THREE.MeshBasicMaterial;

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
  };

  constructor(private readonly lowPower = false) {
    const parameters: THREE.MeshBasicMaterialParameters = {
      side: THREE.DoubleSide,
      color: 0xffffff,
      transparent: false,
      depthWrite: true,
    };
    this.material = lowPower
      ? new THREE.MeshBasicMaterial(parameters)
      : new THREE.MeshLambertMaterial(parameters);
    this.material.name = lowPower
      ? "grass-near-material-compact"
      : "grass-near-material";
    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      let vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>${VERTEX_DECLARATIONS}`)
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>${lowPower ? VERTEX_WIND_LOW_POWER : VERTEX_WIND}`,
        );
      if (!lowPower) {
        vertexShader = vertexShader.replace(
          "#include <beginnormal_vertex>",
          `#include <beginnormal_vertex>\nobjectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), uGrassNormalUp));`,
        );
      }
      shader.vertexShader = vertexShader;

      let fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>${FRAGMENT_DECLARATIONS}`)
        .replace(
          "#include <color_fragment>",
          lowPower ? FRAGMENT_COLOR_LOW_POWER : FRAGMENT_COLOR_LIT,
        );
      if (!lowPower) {
        fragmentShader = fragmentShader.replace(
          "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",
          FRAGMENT_OUTPUT,
        );
      }
      shader.fragmentShader = fragmentShader;
    };
    this.material.customProgramCacheKey = () =>
      lowPower ? "grass-near-material-compact-v1" : "grass-near-material-v5";
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

  bindMesh(
    mesh: THREE.InstancedMesh,
    ditherSeed: number,
    invertLodCoverage: boolean,
    windScale: number,
  ): void {
    mesh.userData.grassLodThreshold = 1;
    mesh.userData.grassDistanceFade = 1;
    mesh.onBeforeRender = () => {
      this.uniforms.uGrassLodThreshold.value =
        mesh.userData.grassLodThreshold ?? 1;
      this.uniforms.uGrassLodInvert.value = invertLodCoverage ? 1 : 0;
      this.uniforms.uGrassDistanceFade.value =
        mesh.userData.grassDistanceFade ?? 1;
      this.uniforms.uGrassDitherSeed.value = ditherSeed / 4294967296;
      this.uniforms.uGrassWindLodScale.value = windScale;
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
