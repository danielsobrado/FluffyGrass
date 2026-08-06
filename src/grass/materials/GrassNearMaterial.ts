import type { GUI } from "dat.gui";
import * as THREE from "three";
import type {
  GrassLodConfig,
  GrassMaterialConfig,
  GrassWindConfig,
} from "../GrassConfig";
import type { GrassArtDirection } from "../GrassArtDirection";
import { grassTrailField } from "../interaction/GrassTrailField";
import {
  GRASS_PALETTE_GLSL,
  setBalancedGrassPaletteColors,
} from "./GrassPaletteShader";

const DEFAULT_TRAIL_MAX_ANGLE = 1.29;
const DEFAULT_TRAIL_WOBBLE_FREQUENCY = 12;
const DEFAULT_TRAIL_WOBBLE_AMPLITUDE = 0.16;

/** How far the normal tilts towards each edge of the blade's trough. */
const DEFAULT_BLADE_CURVATURE = 0.55;
const DEFAULT_SHEEN_STRENGTH = 0.09;
const DEFAULT_SHEEN_POWER = 42;
const DEFAULT_SHEEN_FADE_DISTANCE = 18;
/** Radians per metre along the wind; roughly seventy metres between crests. */
const DEFAULT_GUST_FRONT_SCALE = 0.085;
const DEFAULT_GUST_FRONT_SPEED = 0.55;
/** How far a lull drops the bend. The envelope only ever scales it down. */
const DEFAULT_GUST_FRONT_DEPTH = 0.55;
/**
 * World size of one device pixel per metre of camera distance,
 * `2 * tan(fov / 2) / drawingBufferHeight`. Replaced on the first resize; the
 * default matches a 60-degree vertical field of view at 1080 device pixels.
 */
const DEFAULT_PIXEL_WORLD_SCALE = 0.00107;
const MINIMUM_BLADE_PIXEL_WIDTH = 1.15;
/**
 * Ceiling on the widened half-width. The single-blade bounds reserve a safety
 * margin an order larger than a blade's own half-width, and this stays inside
 * it so a widened blade cannot leave the bound its tile is culled against.
 */
const MAXIMUM_BLADE_WIDEN_METRES = 0.02;

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
uniform float uGrassLodInvert;
uniform float uGrassArtDensityScale;
uniform float uGrassBladeCurvature;
uniform float uGrassGustFrontScale;
uniform float uGrassGustFrontSpeed;
uniform float uGrassGustFrontDepth;
uniform float uGrassSheenFadeDistance;
varying vec2 vGrassSheen;

vec3 grassRotateAroundAxis(
  vec3 value,
  vec3 axis,
  float sine,
  float cosine
) {
  return value * cosine + cross(axis, value) * sine +
    axis * dot(axis, value) * (1.0 - cosine);
}
`;

// Only the layer that is actually large enough on screen to shimmer compiles
// the sub-pixel width clamp. Everything else keeps the plain vertex path.
const VERTEX_SUBPIXEL_DECLARATIONS = `
uniform float uGrassPixelWorldScale;
uniform float uGrassMinPixelWidth;
uniform float uGrassBladeHalfWidth;
uniform float uGrassMaxWidenDistance;
`;

// Only materials that can actually be reached by the character compile these.
// Mid blades start grassNearDistance from the CAMERA while the trail square is
// centred on the CHARACTER, so the nearest mid blade sits grassNearDistance
// minus characterCameraMaxDistance from the trail centre — 14 m against a 12 m
// half-extent as configured. WorldConfigLoader enforces that margin; without it
// mid blades would fall inside the trail and spring upright at the handoff.
const VERTEX_TRAIL_DECLARATIONS = `
uniform sampler2D uGrassTrailMap;
uniform vec2 uGrassTrailCenter;
uniform float uGrassTrailInverseCoverage;
uniform float uGrassTrailStrength;
uniform float uGrassTrailMaxAngle;
uniform float uGrassTrailWobbleFrequency;
uniform float uGrassTrailWobbleAmplitude;
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

// A real blade is troughed across its width, so its two edges catch the light
// at different angles and every blade in the field carries its own gradient.
// Flat quad normals biased towards the canopy give the whole field one shading
// response instead, which is most of why procedural grass reads as a carpet.
//
// The width direction is recovered from the flat quad's own face normal rather
// than stored per vertex, so this works unchanged for the single-blade geometry
// (width along local X) and for clump geometry, whose blades each face a
// different way. It also leaves `grassWidthAxis` and `grassSide` in scope for
// the sub-pixel width clamp further down.
const VERTEX_NORMAL = `
vec3 grassWidthAxis = cross(vec3(0.0, 1.0, 0.0), objectNormal);
float grassWidthAxisLength = length(grassWidthAxis);
grassWidthAxis = grassWidthAxisLength > 0.0001
  ? grassWidthAxis / grassWidthAxisLength
  : vec3(1.0, 0.0, 0.0);
float grassSide = uv.x * 2.0 - 1.0;
objectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), uGrassNormalUp));
objectNormal = normalize(
  objectNormal + grassWidthAxis * (grassSide * uGrassBladeCurvature)
);
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

GRASS_SHEEN_VARYING

float grassCoverage = 1.0;
GRASS_SUBPIXEL_WIDTH

if (grassKeepBlade && grassProgress > 0.001) {
  vec2 grassWindDirection = uGrassWindDirection;
  mat3 grassInstanceBasis = mat3(instanceMatrix);
  float grassHorizontalScale = max(length(grassInstanceBasis[0]), 0.0001);
  float grassVerticalScale = max(length(grassInstanceBasis[1]), 0.0001);
  float grassDepthScale = max(length(grassInstanceBasis[2]), 0.0001);
  // A gust front travelling along the wind, tens of metres between crests. The
  // local term below has a sub-metre wavelength and a per-instance phase, so on
  // its own it can only ever produce uncorrelated chatter — no amount of tuning
  // makes a wave out of it. The envelope only ever scales the bend down, which
  // is what lets the reserved bounds and the configured wind strength keep
  // their existing meaning.
  float grassGustFront = sin(
    dot(grassWorldRoot.xz, grassWindDirection) * uGrassGustFrontScale -
    uGrassTime * uGrassGustFrontSpeed
  );
  float grassGustEnvelope =
    1.0 - uGrassGustFrontDepth * (0.5 - 0.5 * grassGustFront);
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
  ) * instanceVariation.y * grassStiffness * pow(grassProgress, 1.65) *
    uGrassWindLodScale * grassGustEnvelope;
  vec3 grassWorldWind = vec3(grassWindDirection.x, 0.0, grassWindDirection.y);
  // Rotate about the root instead of translating the vertex. Translation makes
  // a bent blade longer than a straight one; the trail bend below documents
  // that as the source of the rubbery look and was rewritten to rotate, but the
  // wind path kept the old form and stretched every blade it moved.
  vec2 grassWindLocal = vec2(
    dot(grassWorldWind, grassInstanceBasis[0] / grassHorizontalScale),
    dot(grassWorldWind, grassInstanceBasis[2] / grassDepthScale)
  );
  float grassWindSin = sin(grassBend);
  float grassWindCos = cos(grassBend);
  float grassWindHeight = transformed.y;
  transformed.x += grassWindLocal.x * grassWindHeight * grassWindSin *
    (grassVerticalScale / grassHorizontalScale);
  transformed.z += grassWindLocal.y * grassWindHeight * grassWindSin *
    (grassVerticalScale / grassDepthScale);
  transformed.y *= grassWindCos;
  vec3 grassWindAxis = vec3(grassWindLocal.y, 0.0, -grassWindLocal.x);
  float grassWindAxisLength = length(grassWindAxis);
  if (grassWindAxisLength > 0.0001) {
    vec3 grassWindAxisView = normalize(
      mat3(modelViewMatrix) * grassInstanceBasis *
        (grassWindAxis / grassWindAxisLength)
    );
    vNormal = normalize(grassRotateAroundAxis(
      vNormal,
      grassWindAxisView,
      grassWindSin,
      grassWindCos
    ));
  }
GRASS_TRAIL_BEND
}

`;

// x: how much of the specular lobe survives at this distance, y: how thin the
// blade is here. The mid material compiles out the fade calculation entirely.
const VERTEX_SHEEN_VARYING = `
vGrassSheen = vec2(
  1.0 - smoothstep(
    uGrassSheenFadeDistance * 0.55,
    uGrassSheenFadeDistance,
    grassCameraDistance
  ),
  mix(0.55, 1.0, grassProgress)
);
`;

const VERTEX_NO_SHEEN_VARYING = `
vGrassSheen = vec2(0.0, mix(0.55, 1.0, grassProgress));
`;

// A blade narrower than a pixel does not antialias away — it alternately covers
// and misses the pixel centre as the camera moves, and an opaque field of them
// sparkles. Widening the blade to a minimum projected width fixes the coverage;
// blending back towards the canopy colour by exactly the area that widening
// invented keeps the field's average brightness where it was, so the near band
// still matches the mid patches it hands over to.
//
// The widening is clamped well inside the bounds safety margin, so a blade can
// never grow out of the tile bound that frustum culling uses.
const VERTEX_SUBPIXEL_WIDTH = `
if (grassKeepBlade) {
  float grassWidthScale = max(length(vec3(instanceMatrix[0])), 0.0001);
  float grassSourceHalfWidth = uGrassBladeHalfWidth * grassWidthScale;
  float grassTargetHalfWidth = min(
    grassCameraDistance * uGrassPixelWorldScale * uGrassMinPixelWidth * 0.5,
    uGrassMaxWidenDistance
  );
  float grassWidenedHalfWidth = max(grassSourceHalfWidth, grassTargetHalfWidth);
  grassCoverage = grassSourceHalfWidth / grassWidenedHalfWidth;
  // grassSide is 0 at the single-triangle blade's apex, so the blade widens at
  // the base and keeps its point.
  transformed += grassWidthAxis *
    (grassSide * (grassWidenedHalfWidth - grassSourceHalfWidth) / grassWidthScale);
}
`;

// The blade rotates about its root instead of being translated sideways. The
// old path did `transformed += push * bend`, which made a bent blade longer than
// a straight one — the source of the rubbery look — and then subtracted a fixed
// fraction of the height to fake the crush back out. Rotating conserves the
// blade's length by construction, so the fudge is gone.
const VERTEX_TRAIL_BEND = `
  if (uGrassTrailStrength > 0.0) {
    // The AABB reject is the whole early-out: two compares before any fetch,
    // and the trail square only ever covers a couple of dozen metres around the
    // character while this layer draws every blade in the near band.
    vec2 grassTrailUv =
      (grassWorldRoot.xz - uGrassTrailCenter) * uGrassTrailInverseCoverage + 0.5;
    vec2 grassTrailInside = step(vec2(0.0), grassTrailUv) * step(grassTrailUv, vec2(1.0));
    if (grassTrailInside.x * grassTrailInside.y > 0.0) {
      vec4 grassTrailSample = texture2D(uGrassTrailMap, grassTrailUv);
      float grassTrailCrush = grassTrailSample.b;
      vec2 grassTrailDirection = grassTrailSample.rg * 2.0 - 1.0;
      float grassTrailDirectionLength = length(grassTrailDirection);
      if (grassTrailCrush > 0.004 && grassTrailDirectionLength > 0.02) {
        grassTrailDirection /= grassTrailDirectionLength;
        // Blades differ in how hard they resist, so a footprint is not a
        // uniformly flattened disc. This mixes in instanceVariation as well as
        // grassPhase: the single-blade layers instance one source blade, so a
        // phase-only seed would be identical for every blade in the field.
        float grassTrailSeed = fract(instanceVariation.x * 3.719 + grassPhase * 2.61803398875);
        float grassTrailStiffness = mix(1.22, 0.78, grassTrailSeed);
        // Saturating: blades directly under a foot flatten hard without the
        // response running away and pushing them through the ground.
        float grassTrailResponse = 1.0 - exp(-3.4 * grassTrailCrush * grassTrailStiffness);
        // Alpha is contact recency, re-seeded for as long as a contact covers
        // the texel, so this rings hardest while a foot is working the grass
        // and dies away over the second or so after it lifts.
        float grassTrailWobble = 1.0 + uGrassTrailWobbleAmplitude * grassTrailSample.a *
          sin(uGrassTime * uGrassTrailWobbleFrequency + grassTrailSeed * 6.28318530718);
        float grassTrailAngle = clamp(
          uGrassTrailMaxAngle * uGrassTrailStrength * grassTrailResponse * grassTrailWobble,
          0.0,
          1.48
        );
        // The angle grows towards the tip, so the blade curves instead of
        // tilting rigidly out of the ground.
        float grassTrailTheta = grassTrailAngle * pow(grassProgress, 0.85);
        float grassTrailSin = sin(grassTrailTheta);
        float grassTrailCos = cos(grassTrailTheta);
        vec3 grassTrailWorld = vec3(grassTrailDirection.x, 0.0, grassTrailDirection.y);
        vec2 grassTrailLocal = vec2(
          dot(grassTrailWorld, grassInstanceBasis[0] / grassHorizontalScale),
          dot(grassTrailWorld, grassInstanceBasis[2] / grassDepthScale)
        );
        // World height of this vertex is localY * verticalScale; a rotation by
        // theta moves it localY * verticalScale * sin(theta) horizontally and
        // leaves localY * cos(theta) of local height. Converting the horizontal
        // part back through the instance's own scales keeps non-uniformly
        // scaled blades correct.
        float grassTrailHeight = transformed.y;
        transformed.x += grassTrailLocal.x * grassTrailHeight * grassTrailSin *
          (grassVerticalScale / grassHorizontalScale);
        transformed.z += grassTrailLocal.y * grassTrailHeight * grassTrailSin *
          (grassVerticalScale / grassDepthScale);
        transformed.y *= grassTrailCos;
        vec3 grassTrailAxis = vec3(
          grassTrailLocal.y,
          0.0,
          -grassTrailLocal.x
        );
        float grassTrailAxisLength = length(grassTrailAxis);
        if (grassTrailAxisLength > 0.0001) {
          vec3 grassTrailAxisView = normalize(
            mat3(modelViewMatrix) * grassInstanceBasis *
              (grassTrailAxis / grassTrailAxisLength)
          );
          vNormal = normalize(grassRotateAroundAxis(
            vNormal,
            grassTrailAxisView,
            grassTrailSin,
            grassTrailCos
          ));
        }
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
vGrassColor = mix(
  grassResolvePalette(
    uGrassBaseColor,
    uGrassTipColor,
    uGrassDryColor,
    grassProgress,
    grassBladeShade,
    instanceVariation.w,
    instanceVariation.z,
    uGrassTipColorStrength,
    uGrassRootDarkening
  ),
  uGrassCanopyColor,
  1.0 - grassCoverage
);
`;

const VERTEX_PALETTE_DECLARATIONS = `
uniform vec3 uGrassBaseColor;
uniform vec3 uGrassTipColor;
uniform vec3 uGrassDryColor;
uniform vec3 uGrassCanopyColor;
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
uniform float uGrassSheenStrength;
uniform float uGrassSheenPower;
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
varying vec2 vGrassSheen;
${GRASS_PALETTE_GLSL}
`;

const VERTEX_PALETTE_FRAGMENT_DECLARATIONS = `
uniform vec3 uGrassTipColor;
uniform float uGrassAmbientBoost;
uniform float uGrassBacklightStrength;
uniform float uGrassSheenStrength;
uniform float uGrassSheenPower;
varying vec3 vGrassColor;
varying vec2 vGrassSheen;
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
vec3 grassSheen = vec3(0.0);
#if NUM_DIR_LIGHTS > 0
  vec3 grassViewDirection = normalize(vViewPosition);
  vec3 grassSunDirection = directionalLights[0].direction;
  // Transmission, not a rim. Light has to reach the camera through the blade,
  // so the sun must be behind it, the blade must be turned edge-on to the sun,
  // and a thin tip passes more of it than the thick base. The term this
  // replaces had only the first of those three and so lit every blade facing
  // the camera equally, which reads as a plastic outline rather than a leaf.
  float grassIntoSun = saturate(dot(-grassViewDirection, grassSunDirection));
  float grassThinness = 1.0 - abs(dot(normal, grassSunDirection));
  grassBackLight = grassIntoSun * grassIntoSun * grassThinness * vGrassSheen.y;
GRASS_SHEEN_OUTPUT
#endif
vec3 grassLambertLight =
  reflectedLight.directDiffuse +
  reflectedLight.indirectDiffuse +
  totalEmissiveRadiance;
vec3 outgoingLight =
  mix(diffuseColor.rgb, grassLambertLight, 0.38) +
  mix(diffuseColor.rgb, uGrassTipColor, 0.35) *
    grassBackLight * uGrassBacklightStrength * 0.3 +
  grassSheen;
`;

const FRAGMENT_SHEEN_OUTPUT = `
  // Skip both the half-vector normalization and the high-power lobe once the
  // contribution has faded. This branch is coherent across distant quads.
  if (vGrassSheen.x > 0.001) {
    vec3 grassHalfVector = normalize(grassSunDirection + grassViewDirection);
    grassSheen = directionalLights[0].color * (
      pow(saturate(dot(normal, grassHalfVector)), uGrassSheenPower) *
      uGrassSheenStrength * vGrassSheen.x
    );
  }
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
  /**
   * Sample the character's grass trail and bend blades into it. Only layers the
   * character can physically reach need this; for everything else the sampling
   * and the bend are compiled out entirely rather than branched over at
   * runtime, which is what the mid layer used to pay for on every blade.
   */
  interactive?: boolean;
  /**
   * Widen blades that project to less than a pixel, and pay the coverage back
   * in colour. Only the layer that owns the band where blades go sub-pixel
   * needs it; nearer layers never trigger the clamp and would pay for the test,
   * and the mid patches past it are already a different representation.
   */
  subPixelWidth?: boolean;
  /** Compile the close-range waxy highlight; distant mid grass disables it. */
  sheen?: boolean;
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
    uGrassCanopyColor: { value: new THREE.Color("#4d923f") },
    uGrassBladeCurvature: { value: DEFAULT_BLADE_CURVATURE },
    uGrassSheenStrength: { value: DEFAULT_SHEEN_STRENGTH },
    uGrassSheenPower: { value: DEFAULT_SHEEN_POWER },
    uGrassSheenFadeDistance: { value: DEFAULT_SHEEN_FADE_DISTANCE },
    uGrassGustFrontScale: { value: DEFAULT_GUST_FRONT_SCALE },
    uGrassGustFrontSpeed: { value: DEFAULT_GUST_FRONT_SPEED },
    uGrassGustFrontDepth: { value: DEFAULT_GUST_FRONT_DEPTH },
    uGrassPixelWorldScale: { value: DEFAULT_PIXEL_WORLD_SCALE },
    uGrassMinPixelWidth: { value: MINIMUM_BLADE_PIXEL_WIDTH },
    uGrassBladeHalfWidth: { value: 0.017 },
    uGrassMaxWidenDistance: { value: MAXIMUM_BLADE_WIDEN_METRES },
    uGrassTrailMap: { value: null as THREE.Texture | null },
    uGrassTrailCenter: { value: new THREE.Vector2() },
    uGrassTrailInverseCoverage: { value: 1 },
    uGrassTrailStrength: { value: 0 },
    uGrassTrailMaxAngle: { value: DEFAULT_TRAIL_MAX_ANGLE },
    uGrassTrailWobbleFrequency: { value: DEFAULT_TRAIL_WOBBLE_FREQUENCY },
    uGrassTrailWobbleAmplitude: { value: DEFAULT_TRAIL_WOBBLE_AMPLITUDE },
  };
  private readonly interactive: boolean;
  private baseWindStrength = 0.14;
  private baseFlutterStrength = 0.035;

  constructor(options: GrassNearMaterialOptions) {
    this.interactive = options.interactive === true;
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
    const subPixelWidth = options.subPixelWidth === true;
    const sheen = options.sheen !== false;
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
            this.interactive ? VERTEX_TRAIL_DECLARATIONS : ""
          }${
            worldLod ? "" : VERTEX_THRESHOLD_DECLARATIONS
          }${
            subPixelWidth ? VERTEX_SUBPIXEL_DECLARATIONS : ""
          }${
            vertexPalette
              ? VERTEX_PALETTE_DECLARATIONS
              : VERTEX_SHADING_DECLARATIONS
          }`,
        )
        .replace(
          "#include <beginnormal_vertex>",
          `#include <beginnormal_vertex>${VERTEX_NORMAL}`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>${VERTEX_WIND.replace(
            "GRASS_KEEP_LOD",
            keepLod,
          )
            .replace(
              "GRASS_SHEEN_VARYING",
              sheen ? VERTEX_SHEEN_VARYING : VERTEX_NO_SHEEN_VARYING,
            )
            .replace(
              "GRASS_SUBPIXEL_WIDTH",
              subPixelWidth ? VERTEX_SUBPIXEL_WIDTH : "",
            )
            .replace(
              "GRASS_TRAIL_BEND",
              this.interactive ? VERTEX_TRAIL_BEND : "",
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
          FRAGMENT_OUTPUT.replace(
            "GRASS_SHEEN_OUTPUT",
            sheen ? FRAGMENT_SHEEN_OUTPUT : "",
          ),
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
    // What a widened sub-pixel blade blends towards. The terrain already tints
    // itself with this colour under the canopy, so a blade that gives back the
    // coverage it did not earn converges on the ground it is standing in.
    this.uniforms.uGrassCanopyColor.value.set(direction.terrainGrassColor);
    // The specular lobe is gone before the near band hands over to the mid
    // patches, which do not carry one. Tying the fade to the preset's own near
    // distance keeps that true for every preset.
    this.uniforms.uGrassSheenFadeDistance.value = direction.nearDistance;
  }

  /**
   * World size of one device pixel per metre of camera distance. Only the
   * sub-pixel width clamp reads it, and only for the layer compiled with it.
   */
  setViewportPixelScale(pixelWorldScale: number): void {
    if (Number.isFinite(pixelWorldScale) && pixelWorldScale > 0) {
      this.uniforms.uGrassPixelWorldScale.value = pixelWorldScale;
    }
  }

  /** Half-width of the source blade the sub-pixel clamp is widening. */
  setBladeHalfWidth(halfWidth: number): void {
    this.uniforms.uGrassBladeHalfWidth.value = Math.max(halfWidth, 0.0001);
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
    if (!this.interactive) {
      return;
    }
    if (!grassTrailField.isEnabled()) {
      this.uniforms.uGrassTrailStrength.value = 0;
      return;
    }
    this.uniforms.uGrassTrailMap.value = grassTrailField.getTexture();
    this.uniforms.uGrassTrailCenter.value.copy(grassTrailField.getCenter());
    this.uniforms.uGrassTrailInverseCoverage.value =
      grassTrailField.getInverseCoverage();
    this.uniforms.uGrassTrailStrength.value = 1;
  }

  /** Bend shape for the character trail; supplied from the world config. */
  configureTrail(config: {
    maxAngleRadians: number;
    wobbleFrequency: number;
    wobbleAmplitude: number;
  }): void {
    this.uniforms.uGrassTrailMaxAngle.value = config.maxAngleRadians;
    this.uniforms.uGrassTrailWobbleFrequency.value = config.wobbleFrequency;
    this.uniforms.uGrassTrailWobbleAmplitude.value = config.wobbleAmplitude;
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
    folder
      .add(this.uniforms.uGrassBladeCurvature, "value", 0, 1.2, 0.01)
      .name("Blade Curve")
      .onChange((value: number) => {
        for (const material of linkedMaterials) {
          material.uniforms.uGrassBladeCurvature.value = value;
        }
      });
    folder
      .add(this.uniforms.uGrassSheenStrength, "value", 0, 0.3, 0.005)
      .name("Sheen")
      .onChange((value: number) => {
        for (const material of linkedMaterials) {
          material.uniforms.uGrassSheenStrength.value = value;
        }
      });
    folder
      .add(this.uniforms.uGrassSheenPower, "value", 8, 96, 1)
      .name("Sheen Focus")
      .onChange((value: number) => {
        for (const material of linkedMaterials) {
          material.uniforms.uGrassSheenPower.value = value;
        }
      });
    folder
      .add(this.uniforms.uGrassGustFrontDepth, "value", 0, 0.9, 0.01)
      .name("Gust Fronts")
      .onChange((value: number) => {
        for (const material of linkedMaterials) {
          material.uniforms.uGrassGustFrontDepth.value = value;
        }
      });
    folder
      .add(this.uniforms.uGrassGustFrontSpeed, "value", 0, 1.6, 0.01)
      .name("Gust Speed")
      .onChange((value: number) => {
        for (const material of linkedMaterials) {
          material.uniforms.uGrassGustFrontSpeed.value = value;
        }
      });
    folder.open();
  }
}
