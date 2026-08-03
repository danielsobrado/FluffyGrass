import type { GUI } from "dat.gui";
import * as THREE from "three";
import type {
  GrassLodConfig,
  GrassMaterialConfig,
  GrassWindConfig,
} from "../GrassConfig";
import { grassInteractionField } from "../interaction/GrassInteractionField";

const VERTEX_DECLARATIONS = `
attribute float grassProgress;
attribute float grassPhase;
attribute float grassBladeShade;
attribute vec4 instanceVariation;
attribute float instanceCoverage;
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
uniform float uGrassInteractionEnabled;
uniform vec2 uGrassInteractionStart;
uniform vec2 uGrassInteractionEnd;
uniform vec2 uGrassInteractionDirection;
uniform float uGrassInteractionRadius;
uniform float uGrassInteractionStrength;
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
varying float vGrassDither;
varying float vGrassFieldDither;
varying float vGrassFieldCoverage;
varying float vGrassNearCoverage;
varying float vGrassFarEntry;
varying float vGrassCameraDistance;
`;

const VERTEX_WIND = `
vec4 grassWorldRoot = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
vec2 grassWindDirection = uGrassWindDirection;
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
float grassHorizontalScale = max(length(grassInstanceBasis[0]), 0.0001);
float grassVerticalScale = max(length(grassInstanceBasis[1]), 0.0001);
vec3 grassWorldWind = vec3(grassWindDirection.x, 0.0, grassWindDirection.y);
vec3 grassLocalWind = vec3(
  dot(grassWorldWind, grassInstanceBasis[0] / grassHorizontalScale),
  dot(grassWorldWind, grassInstanceBasis[1] / grassVerticalScale),
  dot(grassWorldWind, grassInstanceBasis[2] / grassHorizontalScale)
);
transformed += grassLocalWind * grassBend;

if (uGrassInteractionEnabled > 0.5) {
  vec2 interactionSegment = uGrassInteractionEnd - uGrassInteractionStart;
  float interactionLengthSquared = max(dot(interactionSegment, interactionSegment), 0.0001);
  float interactionT = clamp(
    dot(grassWorldRoot.xz - uGrassInteractionStart, interactionSegment) /
      interactionLengthSquared,
    0.0,
    1.0
  );
  vec2 interactionClosest =
    uGrassInteractionStart + interactionSegment * interactionT;
  vec2 interactionOffset = grassWorldRoot.xz - interactionClosest;
  float interactionDistance = length(interactionOffset);
  vec2 interactionPerpendicular = vec2(
    -uGrassInteractionDirection.y,
    uGrassInteractionDirection.x
  );
  float interactionSide = dot(interactionOffset, interactionPerpendicular);
  float interactionFallbackSide =
    fract(instanceVariation.x * 91.173 + grassPhase * 17.731) < 0.5 ? -1.0 : 1.0;
  float resolvedSide = abs(interactionSide) > 0.0001
    ? sign(interactionSide)
    : interactionFallbackSide;
  vec2 interactionAway = interactionDistance > 0.0001
    ? interactionOffset / interactionDistance
    : interactionPerpendicular * resolvedSide;
  float interactionFalloff = 1.0 - smoothstep(
    uGrassInteractionRadius * 0.16,
    uGrassInteractionRadius,
    interactionDistance
  );
  float interactionProgress = pow(grassProgress, 1.22);
  float interactionBend =
    interactionFalloff * uGrassInteractionStrength * interactionProgress;
  vec3 interactionWorldPush = vec3(
    interactionAway.x,
    0.0,
    interactionAway.y
  );
  vec3 interactionLocalPush = vec3(
    dot(interactionWorldPush, grassInstanceBasis[0] / grassHorizontalScale),
    dot(interactionWorldPush, grassInstanceBasis[1] / grassVerticalScale),
    dot(interactionWorldPush, grassInstanceBasis[2] / grassHorizontalScale)
  );
  transformed += interactionLocalPush * interactionBend;
  transformed.y -= interactionFalloff * uGrassInteractionStrength * 0.2 * interactionProgress;
}

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
vGrassFieldDither = fract(
  grassBladeShade * 0.438289 +
  grassPhase * 0.819173 +
  instanceVariation.x * 0.347193 +
  uGrassDitherSeed * 1.618034
);
vGrassFieldCoverage = instanceCoverage;
float grassCameraDistance = distance(cameraPosition, grassWorldRoot.xyz);
vGrassCameraDistance = grassCameraDistance;
vGrassNearCoverage = 1.0 - smoothstep(
  uGrassNearDistance - uGrassTransitionDistance,
  uGrassNearDistance + uGrassTransitionDistance,
  grassCameraDistance
);
float grassFarDistanceEntry = smoothstep(
  uGrassMidDistance - uGrassTransitionDistance,
  uGrassMidDistance + uGrassTransitionDistance,
  grassCameraDistance
);
vGrassFarEntry = grassFarDistanceEntry;
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
uniform float uGrassNearDistance;
uniform float uGrassMidDistance;
uniform float uGrassTransitionDistance;
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
varying float vGrassDither;
varying float vGrassFieldDither;
varying float vGrassFieldCoverage;
varying float vGrassNearCoverage;
varying float vGrassFarEntry;
varying float vGrassCameraDistance;
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
  vGrassFieldDither > vGrassFieldCoverage ||
  grassDither > uGrassDistanceFade ||
  grassDither > uGrassStreamCoverage
) {
  discard;
}
float grassPaletteBlend = uGrassUseWorldLod > 0.5
  ? smoothstep(
      uGrassNearDistance - uGrassTransitionDistance,
      uGrassMidDistance + uGrassTransitionDistance,
      vGrassCameraDistance
    )
  : 0.0;
float grassTipBlend = smoothstep(0.08, 1.0, vGrassProgress);
float grassTipStrength = uGrassUseWorldLod > 0.5
  ? mix(0.82, 0.32, grassPaletteBlend)
  : 1.0;
vec3 grassHealthyColor = mix(
  uGrassBaseColor,
  uGrassTipColor,
  grassTipBlend * grassTipStrength
);
float grassDryBlend = vGrassDryness * (0.18 + grassTipBlend * 0.24);
if (uGrassUseWorldLod > 0.5) {
  grassDryBlend *= mix(1.0, 0.18, grassPaletteBlend);
}
vec3 grassColor = mix(
  grassHealthyColor,
  uGrassDryColor,
  grassDryBlend
);
float grassRootLight = mix(
  uGrassRootDarkening,
  1.0,
  smoothstep(0.0, 0.34, vGrassProgress)
);
grassRootLight = mix(grassRootLight, 1.0, grassPaletteBlend * 0.45);
float grassBladeVariation = mix(0.88, 1.06, vGrassShade);
grassBladeVariation = mix(
  grassBladeVariation,
  1.0,
  grassPaletteBlend * 0.55
);
diffuseColor.rgb = grassColor * grassRootLight * grassBladeVariation * vGrassRootAo;
diffuseColor.rgb *= mix(1.0, uGrassLodColorScale, grassPaletteBlend);
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
    uGrassInteractionEnabled: { value: 0 },
    uGrassInteractionStart: { value: new THREE.Vector2() },
    uGrassInteractionEnd: { value: new THREE.Vector2() },
    uGrassInteractionDirection: { value: new THREE.Vector2(0, 1) },
    uGrassInteractionRadius: { value: 1 },
    uGrassInteractionStrength: { value: 0 },
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
    this.material.customProgramCacheKey = () => "grass-near-material-v11";
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
    renderSingleBladeNear = false,
  ): void {
    if (useWorldLod && !invertLodCoverage && !renderSingleBladeNear) {
      mesh.count = 0;
      mesh.userData.grassDisabledNearPatch = true;
    }
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
      this.uniforms.uGrassInteractionEnabled.value = renderSingleBladeNear ? 1 : 0;
    };
  }

  update(elapsedSeconds: number): void {
    this.uniforms.uGrassTime.value = elapsedSeconds;
    const interaction = grassInteractionField.getState();
    this.uniforms.uGrassInteractionStart.value.copy(interaction.start);
    this.uniforms.uGrassInteractionEnd.value.copy(interaction.end);
    this.uniforms.uGrassInteractionDirection.value.copy(interaction.direction);
    this.uniforms.uGrassInteractionRadius.value = interaction.radius;
    this.uniforms.uGrassInteractionStrength.value = interaction.active
      ? interaction.strength
      : 0;
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
