import type { GUI } from "dat.gui";
import * as THREE from "three";
import type {
  GrassLodConfig,
  GrassMaterialConfig,
  GrassWindConfig,
} from "../GrassConfig";
import type { GrassArtDirection } from "../GrassArtDirection";
import { grassInteractionField } from "../interaction/GrassInteractionField";
import {
  GRASS_PALETTE_GLSL,
  setBalancedGrassPaletteColors,
} from "./GrassPaletteShader";

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
uniform float uGrassNearDistance;
uniform float uGrassMidDistance;
uniform float uGrassTransitionDistance;
uniform float uGrassDetailMode;
uniform float uGrassDetailNearDistance;
uniform float uGrassDetailTransitionDistance;
uniform vec2 uGrassInteractionStart;
uniform vec2 uGrassInteractionEnd;
uniform vec2 uGrassInteractionDirection;
uniform float uGrassInteractionRadius;
uniform float uGrassInteractionStrength;
uniform float uGrassLodInvert;
uniform float uGrassArtDensityScale;
`;

// The streamed world resolves coverage per blade from its own camera distance.
const VERTEX_KEEP_WORLD_LOD = `
bool grassKeepLod = uGrassLodInvert < 0.5
  ? grassDither <= grassNearCoverage
  : grassDither > grassNearCoverage && grassDither > grassFarDistanceEntry;
`;

// The island regression scene is a single small object framed whole by an
// orbiting camera, so its near/mid split is one threshold for the entire scene
// rather than a per-blade distance fade. That threshold is a genuine
// material-level uniform here; it used to be written per mesh, which three
// silently collapsed to whichever patch drew first.
const VERTEX_KEEP_THRESHOLD_LOD = `
bool grassKeepLod = uGrassLodInvert < 0.5
  ? grassDither <= uGrassLodThreshold
  : grassDither > uGrassLodThreshold && grassDither <= uGrassDistanceFade;
`;

const VERTEX_THRESHOLD_DECLARATIONS = `
uniform float uGrassLodThreshold;
uniform float uGrassDistanceFade;
`;

const VERTEX_SHADING_DECLARATIONS = `
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
`;

const VERTEX_WIND = `
vec4 grassWorldRoot = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
float grassDither = fract(
  grassBladeShade * 0.754877666 +
  grassPhase * 0.569840296 +
  instanceVariation.x +
  uGrassDitherSeed
);
float grassFieldDither = fract(
  grassBladeShade * 0.438289 +
  grassPhase * 0.819173 +
  instanceVariation.x * 0.347193 +
  uGrassDitherSeed * 1.618034
);
float grassCameraDistance = distance(cameraPosition, grassWorldRoot.xyz);
float grassNearCoverage = 1.0 - smoothstep(
  uGrassNearDistance - uGrassTransitionDistance,
  uGrassNearDistance + uGrassTransitionDistance,
  grassCameraDistance
);
float grassFarDistanceEntry = smoothstep(
  uGrassMidDistance - uGrassTransitionDistance,
  uGrassMidDistance + uGrassTransitionDistance,
  grassCameraDistance
);
float grassDetailCoverage = 1.0 - smoothstep(
  uGrassDetailNearDistance - uGrassDetailTransitionDistance,
  uGrassDetailNearDistance + uGrassDetailTransitionDistance,
  grassCameraDistance
);
GRASS_KEEP_LOD
bool grassKeepDetail = uGrassDetailMode < 0.5 ||
  (uGrassDetailMode < 1.5
    ? grassDither > grassDetailCoverage
    : grassDither <= grassDetailCoverage);
// instanceCoverage carries both the per-instance field coverage and the
// streaming fade-in. Both used to be separate uniforms, but three only uploads
// a shared material's uniforms once per contiguous run of draws, so per-mesh
// values never reached the GPU. Per-instance data has no such problem.
bool grassKeepBlade =
  grassKeepLod &&
  grassKeepDetail &&
  grassFieldDither <= min(instanceCoverage * uGrassArtDensityScale, 1.0);

if (!grassKeepBlade) {
  // Every vertex in a blade shares the keep decision, so a rejected blade
  // collapses to a zero-area triangle and is dropped at primitive assembly.
  // This is the only place blades are rejected: evaluating it here rather than
  // as a fragment discard is what lets the fragment shader stay early-Z
  // friendly, and it is also exact, since the decision no longer depends on
  // interpolating a constant varying across the triangle.
  transformed = vec3(0.0);
}

if (grassKeepBlade && grassProgress > 0.001) {
  vec2 grassWindDirection = uGrassWindDirection;
  mat3 grassInstanceBasis = mat3(instanceMatrix);
  float grassHorizontalScale = max(length(grassInstanceBasis[0]), 0.0001);
  float grassVerticalScale = max(length(grassInstanceBasis[1]), 0.0001);
  float grassDepthScale = max(length(grassInstanceBasis[2]), 0.0001);
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
  vec3 grassWorldWind = vec3(grassWindDirection.x, 0.0, grassWindDirection.y);
  vec3 grassLocalWind = vec3(
    dot(grassWorldWind, grassInstanceBasis[0] / grassHorizontalScale),
    dot(grassWorldWind, grassInstanceBasis[1] / grassVerticalScale),
    dot(grassWorldWind, grassInstanceBasis[2] / grassDepthScale)
  );
  transformed += grassLocalWind * grassBend;

  // uGrassInteractionStrength is zero whenever the wake is inactive, so the
  // whole block folds away for free. This replaces a per-mesh "is this tile
  // near the character" uniform that could never be uploaded per mesh: the
  // falloff below is a strictly finer-grained, per-blade version of the same
  // rejection.
  if (uGrassInteractionStrength > 0.0) {
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
    float interactionFalloff = 1.0 - smoothstep(
      uGrassInteractionRadius * 0.16,
      uGrassInteractionRadius,
      interactionDistance
    );
    if (interactionFalloff > 0.0) {
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
      dot(interactionWorldPush, grassInstanceBasis[2] / grassDepthScale)
    );
    transformed += interactionLocalPush * interactionBend;
    transformed.y -= interactionFalloff * uGrassInteractionStrength * 0.2 * interactionProgress;
    }
  }
}

`;

// Only the shading inputs cross to the fragment stage. The coverage and dither
// terms are consumed entirely by the keep test above, so passing them on would
// burn interpolators the fragment shader no longer reads.
const VERTEX_SHADING = `
vGrassProgress = grassProgress;
vGrassShade = grassBladeShade;
vGrassDryness = instanceVariation.w;
vGrassRootAo = instanceVariation.z;
`;

// Layers whose blades are a single triangle resolve the palette here instead.
// Three vertices is far fewer evaluations than the fragments they cover, and at
// that size the difference between interpolating the resolved colour and
// resolving an interpolated progress is well under a quantisation step. The
// segmented ultra-near blades, which are the ones actually large on screen, keep
// the per-fragment path.
const VERTEX_PALETTE = `
vGrassColor = grassResolvePalette(
  uGrassBaseColor,
  uGrassTipColor,
  uGrassDryColor,
  grassProgress,
  grassBladeShade,
  instanceVariation.w,
  instanceVariation.z,
  uGrassTipColorStrength,
  uGrassRootDarkening
);
`;

const VERTEX_PALETTE_DECLARATIONS = `
uniform vec3 uGrassBaseColor;
uniform vec3 uGrassTipColor;
uniform vec3 uGrassDryColor;
uniform float uGrassRootDarkening;
uniform float uGrassTipColorStrength;
varying vec3 vGrassColor;
${GRASS_PALETTE_GLSL}
`;

const FRAGMENT_DECLARATIONS = `
uniform vec3 uGrassBaseColor;
uniform vec3 uGrassTipColor;
uniform vec3 uGrassDryColor;
uniform float uGrassRootDarkening;
uniform float uGrassTipColorStrength;
uniform float uGrassAmbientBoost;
uniform float uGrassBacklightStrength;
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
${GRASS_PALETTE_GLSL}
`;

const VERTEX_PALETTE_FRAGMENT_DECLARATIONS = `
uniform float uGrassAmbientBoost;
uniform float uGrassBacklightStrength;
varying vec3 vGrassColor;
`;

const VERTEX_PALETTE_FRAGMENT_COLOR = `
#include <color_fragment>
diffuseColor.rgb = vGrassColor;
totalEmissiveRadiance += diffuseColor.rgb * uGrassAmbientBoost;
`;

// No discard here. Every input to the keep test is constant across a blade
// (per-blade attributes, per-instance root distance, and uniforms), so the
// vertex stage already collapsed rejected blades to zero area and nothing
// reaching this point can fail the test. Keeping a discard in the shader would
// force late depth writes and disable early-Z for a layer whose whole cost is
// overdraw: near, mid, and single-blade grass all stack over the same pixels.
const FRAGMENT_COLOR = `
#include <color_fragment>
diffuseColor.rgb = grassResolvePalette(
  uGrassBaseColor,
  uGrassTipColor,
  uGrassDryColor,
  vGrassProgress,
  vGrassShade,
  vGrassDryness,
  vGrassRootAo,
  uGrassTipColorStrength,
  uGrassRootDarkening
);
totalEmissiveRadiance += diffuseColor.rgb * uGrassAmbientBoost;
`;

const FRAGMENT_OUTPUT = `
float grassBackLight = 0.0;
#if NUM_DIR_LIGHTS > 0
  grassBackLight = pow(
    saturate(dot(-normalize(vViewPosition), directionalLights[0].direction)),
    2.0
  );
#endif
vec3 grassLambertLight =
  reflectedLight.directDiffuse +
  reflectedLight.indirectDiffuse +
  totalEmissiveRadiance;
vec3 outgoingLight =
  mix(diffuseColor.rgb, grassLambertLight, 0.38) +
  diffuseColor.rgb * grassBackLight * uGrassBacklightStrength * 0.2;
`;

/**
 * Per-material constants. These used to be written per mesh from
 * `onBeforeRender`, but three only uploads a material's custom uniforms on the
 * first draw of each contiguous same-material run (see `refreshMaterial` in
 * WebGLRenderer), and its opaque sort groups by `material.id` before depth. The
 * result was that every mesh sharing a material silently inherited the first
 * one's values. Anything that genuinely varies per mesh now lives in the
 * per-instance buffers instead; anything constant for a layer lives here.
 */
export interface GrassNearMaterialOptions {
  name: string;
  /** Distinct per option set, otherwise three reuses a cached program. */
  cacheKey: string;
  /** Mid layers keep the blades the near layer drops. */
  invertLodCoverage?: boolean;
  windLodScale?: number;
  /** 0 = no detail split, 1 = outside the detail radius, 2 = inside it. */
  detailMode?: number;
  /** Decorrelates the LOD dither between layers. */
  ditherSeed?: number;
  /**
   * Resolve LOD coverage per blade from its world-space camera distance
   * (default). The island regression scene instead drives one scene-wide
   * threshold, because its camera frames the whole object at a distance well
   * past the configured near and mid fades.
   */
  worldLod?: boolean;
  /**
   * Resolve the grass palette per vertex instead of per fragment. Only safe for
   * layers whose blades are a single triangle: with three vertices the colour
   * interpolates across a handful of pixels, but a segmented blade filling the
   * screen would visibly band.
   */
  vertexPalette?: boolean;
}

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
    uGrassTipColorStrength: { value: 0.5 },
    uGrassNormalUp: { value: 0.45 },
    uGrassAmbientBoost: { value: 0.12 },
    uGrassBacklightStrength: { value: 0.16 },
    uGrassLodInvert: { value: 0 },
    uGrassLodThreshold: { value: 1 },
    uGrassDistanceFade: { value: 1 },
    uGrassDitherSeed: { value: 0 },
    uGrassWindLodScale: { value: 1 },
    uGrassNearDistance: { value: 0 },
    uGrassMidDistance: { value: 0 },
    uGrassTransitionDistance: { value: 1 },
    uGrassDetailMode: { value: 0 },
    uGrassDetailNearDistance: { value: 0 },
    uGrassDetailTransitionDistance: { value: 1 },
    uGrassArtDensityScale: { value: 1 },
    uGrassInteractionStart: { value: new THREE.Vector2() },
    uGrassInteractionEnd: { value: new THREE.Vector2() },
    uGrassInteractionDirection: { value: new THREE.Vector2(0, 1) },
    uGrassInteractionRadius: { value: 1 },
    uGrassInteractionStrength: { value: 0 },
  };
  private baseWindStrength = 0.14;
  private baseFlutterStrength = 0.035;

  constructor(options: GrassNearMaterialOptions) {
    this.uniforms.uGrassLodInvert.value = options.invertLodCoverage ? 1 : 0;
    this.uniforms.uGrassWindLodScale.value = options.windLodScale ?? 1;
    this.uniforms.uGrassDetailMode.value = options.detailMode ?? 0;
    this.uniforms.uGrassDitherSeed.value =
      (options.ditherSeed ?? 0) / 4294967296;
    setBalancedGrassPaletteColors(
      this.uniforms.uGrassBaseColor.value,
      this.uniforms.uGrassTipColor.value,
      this.uniforms.uGrassDryColor.value,
      this.colorControls.baseColor,
      this.colorControls.tipColor,
      this.colorControls.dryColor,
    );
    this.material = new THREE.MeshLambertMaterial({
      side: THREE.DoubleSide,
      color: 0xffffff,
      transparent: false,
      depthWrite: true,
    });
    this.material.name = options.name;
    const vertexPalette = options.vertexPalette === true;
    const worldLod = options.worldLod !== false;
    // Selected at compile time rather than branched on a uniform: this is the
    // hottest code in the scene and the choice never varies for a material.
    const keepLod = worldLod
      ? VERTEX_KEEP_WORLD_LOD
      : VERTEX_KEEP_THRESHOLD_LOD;
    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>${VERTEX_DECLARATIONS}${
            worldLod ? "" : VERTEX_THRESHOLD_DECLARATIONS
          }${
            vertexPalette
              ? VERTEX_PALETTE_DECLARATIONS
              : VERTEX_SHADING_DECLARATIONS
          }`,
        )
        .replace(
          "#include <beginnormal_vertex>",
          `#include <beginnormal_vertex>\nobjectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), uGrassNormalUp));`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>${VERTEX_WIND.replace(
            "GRASS_KEEP_LOD",
            keepLod,
          )}${vertexPalette ? VERTEX_PALETTE : VERTEX_SHADING}`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>${
            vertexPalette
              ? VERTEX_PALETTE_FRAGMENT_DECLARATIONS
              : FRAGMENT_DECLARATIONS
          }`,
        )
        .replace(
          "#include <color_fragment>",
          vertexPalette ? VERTEX_PALETTE_FRAGMENT_COLOR : FRAGMENT_COLOR,
        )
        .replace(
          "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",
          FRAGMENT_OUTPUT,
        );
    };
    this.material.customProgramCacheKey = () => options.cacheKey;
  }

  configure(material: GrassMaterialConfig, wind: GrassWindConfig): void {
    this.colorControls.baseColor = material.baseColor;
    this.colorControls.tipColor = material.tipColor;
    this.colorControls.dryColor = material.dryColor;
    this.setPaletteColors();
    this.uniforms.uGrassRootDarkening.value = material.rootDarkening;
    this.uniforms.uGrassNormalUp.value = material.normalUp;
    this.uniforms.uGrassAmbientBoost.value = material.ambientBoost;
    this.uniforms.uGrassBacklightStrength.value = material.backlightStrength;
    this.uniforms.uGrassWindDirection.value
      .set(wind.directionX, wind.directionZ)
      .normalize();
    this.baseWindStrength = wind.strength;
    this.baseFlutterStrength = wind.flutterStrength;
    this.uniforms.uGrassWindStrength.value = wind.strength;
    this.uniforms.uGrassGustScale.value = wind.gustScale;
    this.uniforms.uGrassGustSpeed.value = wind.gustSpeed;
    this.uniforms.uGrassFlutterStrength.value = wind.flutterStrength;
    this.uniforms.uGrassFlutterSpeed.value = wind.flutterSpeed;
  }

  applyArtDirection(direction: GrassArtDirection): void {
    this.colorControls.baseColor = direction.baseColor;
    this.colorControls.tipColor = direction.tipColor;
    this.colorControls.dryColor = direction.dryColor;
    this.setPaletteColors();
    this.uniforms.uGrassRootDarkening.value = direction.rootDarkening;
    this.uniforms.uGrassTipColorStrength.value = direction.tipColorStrength;
    this.uniforms.uGrassNormalUp.value = direction.normalUp;
    this.uniforms.uGrassAmbientBoost.value = direction.ambientBoost;
    this.uniforms.uGrassBacklightStrength.value = direction.backlightStrength;
    this.uniforms.uGrassArtDensityScale.value = direction.densityScale;
    this.uniforms.uGrassWindStrength.value =
      this.baseWindStrength * direction.windStrengthScale;
    this.uniforms.uGrassFlutterStrength.value =
      this.baseFlutterStrength * direction.flutterStrengthScale;
  }

  /**
   * The `uGrassDitherSeed` value the vertex shader adds when deriving a blade's
   * LOD dither. Callers that want to predict the shader's keep decision on the
   * CPU need it.
   */
  getDitherSeed(): number {
    return this.uniforms.uGrassDitherSeed.value;
  }

  /** Threshold-LOD materials only; ignored when coverage is resolved per blade. */
  setLodThreshold(threshold: number, distanceFade = 1): void {
    this.uniforms.uGrassLodThreshold.value = threshold;
    this.uniforms.uGrassDistanceFade.value = distanceFade;
  }

  configureLod(config: GrassLodConfig): void {
    this.uniforms.uGrassNearDistance.value = config.nearMaxDistance;
    this.uniforms.uGrassMidDistance.value = config.midMaxDistance;
    this.uniforms.uGrassTransitionDistance.value = config.transitionDistance;
  }

  configureDetailLod(config: GrassLodConfig): void {
    this.uniforms.uGrassDetailNearDistance.value = config.nearMaxDistance;
    this.uniforms.uGrassDetailTransitionDistance.value =
      config.transitionDistance;
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

  private setPaletteColors(): void {
    setBalancedGrassPaletteColors(
      this.uniforms.uGrassBaseColor.value,
      this.uniforms.uGrassTipColor.value,
      this.uniforms.uGrassDryColor.value,
      this.colorControls.baseColor,
      this.colorControls.tipColor,
      this.colorControls.dryColor,
    );
  }

  setupGUI(
    gui: GUI,
    linkedMaterials: readonly GrassNearMaterial[] = [],
  ): void {
    const materials = [this, ...linkedMaterials];
    const folder = gui.addFolder("Grass Props");
    folder.addColor(this.colorControls, "baseColor").onChange((value: string) => {
      for (const material of materials) {
        material.colorControls.baseColor = value;
        material.setPaletteColors();
      }
    });
    folder.addColor(this.colorControls, "tipColor").onChange((value: string) => {
      for (const material of materials) {
        material.colorControls.tipColor = value;
        material.setPaletteColors();
      }
    });
    folder.addColor(this.colorControls, "dryColor").onChange((value: string) => {
      for (const material of materials) {
        material.colorControls.dryColor = value;
        material.setPaletteColors();
      }
    });
    folder
      .add(this.uniforms.uGrassTipColorStrength, "value", 0.15, 0.75, 0.01)
      .name("Tip Mix")
      .onChange((value: number) => {
        for (const material of linkedMaterials) {
          material.uniforms.uGrassTipColorStrength.value = value;
        }
      });
    folder
      .add(this.uniforms.uGrassWindStrength, "value", 0, 0.45, 0.005)
      .name("Wind Strength")
      .onChange((value: number) => {
        for (const material of linkedMaterials) {
          material.uniforms.uGrassWindStrength.value = value;
        }
      });
    folder
      .add(this.uniforms.uGrassFlutterStrength, "value", 0, 0.15, 0.0025)
      .name("Tip Flutter")
      .onChange((value: number) => {
        for (const material of linkedMaterials) {
          material.uniforms.uGrassFlutterStrength.value = value;
        }
      });
    folder
      .add(this.uniforms.uGrassNormalUp, "value", 0, 0.9, 0.01)
      .name("Normal Up")
      .onChange((value: number) => {
        for (const material of linkedMaterials) {
          material.uniforms.uGrassNormalUp.value = value;
        }
      });
    folder
      .add(this.uniforms.uGrassAmbientBoost, "value", 0, 0.4, 0.01)
      .name("Ambient Boost")
      .onChange((value: number) => {
        for (const material of linkedMaterials) {
          material.uniforms.uGrassAmbientBoost.value = value;
        }
      });
    folder
      .add(this.uniforms.uGrassBacklightStrength, "value", 0, 0.5, 0.01)
      .name("Backlight")
      .onChange((value: number) => {
        for (const material of linkedMaterials) {
          material.uniforms.uGrassBacklightStrength.value = value;
        }
      });
    folder.open();
  }
}
