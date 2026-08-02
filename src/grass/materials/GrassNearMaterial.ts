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
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
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
float grassBend = (
  grassGust * uGrassWindStrength +
  grassFlutter * uGrassFlutterStrength
) * instanceVariation.y * pow(grassProgress, 1.65);
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
`;

const FRAGMENT_DECLARATIONS = `
uniform vec3 uGrassBaseColor;
uniform vec3 uGrassTipColor;
uniform vec3 uGrassDryColor;
uniform float uGrassRootDarkening;
uniform float uGrassAmbientBoost;
uniform float uGrassBacklightStrength;
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
`;

const FRAGMENT_COLOR = `
#include <color_fragment>
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
float grassBladeVariation = mix(0.86, 1.12, vGrassShade);
diffuseColor.rgb = grassColor * grassRootLight * grassBladeVariation * vGrassRootAo;
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
    this.material.customProgramCacheKey = () => "grass-near-material-v2";
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

  update(elapsedSeconds: number): void {
    this.uniforms.uGrassTime.value = elapsedSeconds;
  }

  setupGUI(gui: GUI): void {
    const folder = gui.addFolder("Grass Props");
    folder.addColor(this.colorControls, "baseColor").onChange((value) => {
      this.uniforms.uGrassBaseColor.value.set(value);
    });
    folder.addColor(this.colorControls, "tipColor").onChange((value) => {
      this.uniforms.uGrassTipColor.value.set(value);
    });
    folder.addColor(this.colorControls, "dryColor").onChange((value) => {
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
