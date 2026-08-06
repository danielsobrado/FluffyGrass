import * as THREE from "three";
import type { GrassArtDirection } from "../../grass/GrassArtDirection";
import {
  GRASS_ACCENT_SPECIES,
  GRASS_ACCENT_TINTS,
  GRASS_MAX_ACCENT_SPECIES,
  GRASS_MAX_ACCENT_TINTS,
} from "../../grass/biome/GrassAccentSpecies";
import {
  GRASS_BIOME_PROFILES,
  GRASS_MAX_BIOMES,
} from "../../grass/biome/GrassBiomeProfile";
import type {
  GrassMaterialConfig,
  GrassWindConfig,
} from "../../grass/GrassConfig";
import {
  GRASS_LIGHT_MIX_GLSL,
  GRASS_PALETTE_GLSL,
  setBalancedGrassPaletteColors,
} from "../../grass/materials/GrassPaletteShader";
import {
  GRASS_GUST_FRONT_SCALE,
  GRASS_GUST_FRONT_SPEED,
  GRASS_WIND_NOISE_SCALE,
  GRASS_WIND_NOISE_SPEED,
} from "../../grass/wind/WindNoiseTexture";
import type { WorldDetailFoliageAtlas } from "./WorldDetailFoliageAtlasFactory";

/**
 * One material for the whole accent layer: every species, every tint, and every
 * biome resolve from per-instance data against bounded uniform arrays, so the
 * layer's look can grow without ever growing its draw count. That is the same
 * property the biome palette rows have, and it is the reason the 80.lv
 * channel-packing idea belongs here at all.
 *
 * Two deliberate differences from the blade layers:
 *
 * - This is the only grass material that may `discard`, and only for the atlas
 *   alpha cutout. Cutout cards cannot avoid it, and the instance count here is
 *   three orders of magnitude below the near field, so the early-Z property the
 *   blade materials are gated on is untouched.
 * - Wind is a per-species scalar times a height ramp rather than a texel mask.
 *   A mask cannot act in the vertex stage on a six-vertex card; the gust noise
 *   field is shared with every other layer, so accents bend with the same wind.
 */

/** Alpha below this is cut. Loosened with distance, as the impostors do. */
const DETAIL_FOLIAGE_ALPHA_CUTOFF = 0.42;
/** How high the wind ramp bites: 0 at the root, 1 at the card top. */
const DETAIL_FOLIAGE_WIND_RAMP_POWER = 1.5;
/**
 * Card sway as a fraction of card height per unit of configured wind strength.
 * The placement bounds charge for this exact product, so the two must move
 * together — {@link WorldDetailFoliageField} imports it rather than repeating a
 * literal, the same discipline the impostor shear factor is under.
 */
export const DETAIL_FOLIAGE_WIND_SHEAR_FACTOR = 0.4;

const VERTEX_SHADER = `
#include <common>
#include <lights_pars_begin>
attribute vec4 instanceVariation;
attribute float instanceCoverage;
attribute float instanceBiome;
attribute float instanceAccent;
uniform float uTime;
uniform vec2 uWindDirection;
uniform float uWindStrength;
uniform sampler2D uWindNoise;
uniform float uWindNoiseScale;
uniform float uWindNoiseSpeed;
uniform float uFadeDistance;
uniform float uFadeTransition;
uniform float uDensityScale;
uniform float uNormalUp;
uniform float uSpeciesWind[${GRASS_MAX_ACCENT_SPECIES}];
varying vec2 vUv;
flat varying vec2 vCell;
flat varying float vTint;
flat varying float vBiome;
varying float vDryness;
varying float vRootAo;
varying float vCameraDistance;
varying vec3 vGrassIrradiance;
varying float vGrassBackLight;
#include <fog_pars_vertex>

void main() {
  mat4 instanceModel = modelMatrix * instanceMatrix;
  vec3 axisX = instanceModel[0].xyz;
  vec3 axisY = instanceModel[1].xyz;
  float scaleX = max(length(axisX), 0.0001);
  float scaleY = max(length(axisY), 0.0001);
  vec3 cardUp = axisY / scaleY;
  vec3 root = (instanceModel * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 center = root + cardUp * scaleY * 0.5;
  float cameraDistance = distance(cameraPosition, center);

  // Coverage is per instance, and the CPU trims each tile's draw to the same
  // prefix, so this test only ever removes cards the trim could not reach yet.
  float coverage = (1.0 - smoothstep(
    uFadeDistance - uFadeTransition,
    uFadeDistance + uFadeTransition,
    cameraDistance
  )) * min(instanceCoverage * uDensityScale, 1.0);
  if (instanceVariation.x > coverage) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  float accent = instanceAccent;
  float speciesIndex = floor(accent / 16.0);
  float packedRemainder = accent - speciesIndex * 16.0;
  float variantRow = floor(packedRemainder / 8.0);
  vTint = packedRemainder - variantRow * 8.0;
  vCell = vec2(speciesIndex, variantRow);

  // Upright, yaw-only billboard. A card with a fixed facing vanishes edge-on,
  // which at this density reads as flowers blinking out as the camera turns;
  // pitching one to face the camera instead lifts it off the ground. Rotating
  // about world up is the only orientation that avoids both.
  vec3 toCamera = cameraPosition - root;
  vec3 flatToCamera = vec3(toCamera.x, 0.0, toCamera.z);
  float flatLength = length(flatToCamera);
  vec3 cardForward = flatLength < 0.001
    ? vec3(0.0, 0.0, 1.0)
    : flatToCamera / flatLength;
  vec3 cardRight = normalize(cross(vec3(0.0, 1.0, 0.0), cardForward));

  vec2 windDirection = uWindDirection;
  #ifdef GRASS_NOISE_WIND
    vec2 gustUv = root.xz * uWindNoiseScale -
      windDirection * (uTime * uWindNoiseSpeed);
    float gustNoise = texture2D(uWindNoise, gustUv).r;
  #else
    float gustNoise = 0.5 + 0.5 * sin(
      dot(root.xz, windDirection) * ${GRASS_GUST_FRONT_SCALE} -
      uTime * ${GRASS_GUST_FRONT_SPEED}
    );
  #endif

  vec3 worldPosition = root +
    cardRight * position.x * scaleX +
    cardUp * position.y * scaleY;
  int speciesRow = int(clamp(
    speciesIndex,
    0.0,
    float(${GRASS_MAX_ACCENT_SPECIES} - 1)
  ) + 0.5);
  float windRamp = pow(uv.y, ${DETAIL_FOLIAGE_WIND_RAMP_POWER.toFixed(2)});
  float sway = (gustNoise * 2.0 - 1.0) * uWindStrength *
    ${DETAIL_FOLIAGE_WIND_SHEAR_FACTOR.toFixed(2)} *
    uSpeciesWind[speciesRow] * instanceVariation.y;
  worldPosition += vec3(windDirection.x, 0.0, windDirection.y) *
    sway * windRamp * scaleY;

  vec4 mvPosition = viewMatrix * vec4(worldPosition, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Same lighting shape as the impostor cards: a card normal blended towards
  // the terrain up axis, evaluated once per vertex against the scene lights.
  vec3 accentWorldNormal = normalize(mix(cardForward, cardUp, uNormalUp));
  vec3 accentViewNormal = normalize(mat3(viewMatrix) * accentWorldNormal);
  vec3 irradiance = ambientLightColor;
  #if NUM_HEMI_LIGHTS > 0
    #pragma unroll_loop_start
    for (int i = 0; i < NUM_HEMI_LIGHTS; i++) {
      irradiance += getHemisphereLightIrradiance(
        hemisphereLights[i],
        accentViewNormal
      );
    }
    #pragma unroll_loop_end
  #endif
  #if NUM_DIR_LIGHTS > 0
    #pragma unroll_loop_start
    for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
      irradiance +=
        saturate(dot(accentViewNormal, directionalLights[i].direction)) *
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
  vGrassIrradiance = irradiance;

  vUv = uv;
  vBiome = instanceBiome;
  vRootAo = instanceVariation.z;
  vDryness = instanceVariation.w;
  vCameraDistance = cameraDistance;
  #include <fog_vertex>
}
`;

const FRAGMENT_SHADER = `
uniform sampler2D uAtlas;
uniform vec2 uAtlasSize;
uniform float uCellResolution;
uniform float uCellPadding;
uniform float uAlphaCutoff;
uniform float uFadeDistance;
uniform float uAmbientBoost;
uniform float uBacklightStrength;
uniform vec3 uBiomeBase[${GRASS_MAX_BIOMES}];
uniform vec3 uBiomeTip[${GRASS_MAX_BIOMES}];
uniform vec3 uBiomeDry[${GRASS_MAX_BIOMES}];
uniform vec2 uBiomeShade[${GRASS_MAX_BIOMES}];
uniform vec3 uAccentTint[${GRASS_MAX_ACCENT_TINTS}];
varying vec2 vUv;
flat varying vec2 vCell;
flat varying float vTint;
flat varying float vBiome;
varying float vDryness;
varying float vRootAo;
varying float vCameraDistance;
varying vec3 vGrassIrradiance;
varying float vGrassBackLight;
#include <common>
#include <fog_pars_fragment>
${GRASS_PALETTE_GLSL}

void main() {
  float cellSize = uCellResolution + uCellPadding * 2.0;
  vec2 safeUv = clamp(
    vUv,
    vec2(0.5 / uCellResolution),
    vec2(1.0 - 0.5 / uCellResolution)
  );
  vec2 pixel = vCell * cellSize + vec2(uCellPadding) + safeUv * uCellResolution;
  vec4 atlasColor = texture2D(uAtlas, pixel / uAtlasSize);
  // Minification erodes thin alpha, so the cutout loosens with distance for the
  // same reason the impostor cards' does: a fern must not dissolve before the
  // dither fade has taken it.
  float cutoff = uAlphaCutoff * mix(
    1.0,
    0.55,
    smoothstep(uFadeDistance * 0.4, uFadeDistance, vCameraDistance)
  );
  // The only discard in any grass material, and only for the cutout.
  if (atlasColor.a < cutoff) {
    discard;
  }

  vec3 accentData = clamp(
    atlasColor.rgb / max(atlasColor.a, 0.001),
    vec3(0.0),
    vec3(1.0)
  );
  int biomeRow = int(clamp(vBiome, 0.0, float(${GRASS_MAX_BIOMES} - 1)) + 0.5);
  vec3 color = grassResolvePalette(
    uBiomeBase[biomeRow],
    uBiomeTip[biomeRow],
    uBiomeDry[biomeRow],
    accentData.r,
    accentData.g,
    vDryness,
    vRootAo,
    uBiomeShade[biomeRow].y,
    uBiomeShade[biomeRow].x
  );
  int tintRow = int(clamp(
    vTint,
    0.0,
    float(${GRASS_MAX_ACCENT_TINTS} - 1)
  ) + 0.5);
  // The article's B mask, but the colour is per instance rather than per
  // material: one atlas cell is a white daisy here and a lavender one uphill.
  color = mix(color, uAccentTint[tintRow], accentData.b);
  vec3 lambertLight =
    color * vGrassIrradiance * RECIPROCAL_PI +
    color * uAmbientBoost;
  vec3 outgoingLight =
    mix(color, lambertLight, ${GRASS_LIGHT_MIX_GLSL}) +
    color * vGrassBackLight * uBacklightStrength * 0.2;
  gl_FragColor = vec4(outgoingLight, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

type ShaderUniforms = Record<string, { value: unknown }>;

function createBiomeColorRows(color: THREE.ColorRepresentation): THREE.Color[] {
  return Array.from({ length: GRASS_MAX_BIOMES }, () => new THREE.Color(color));
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

export interface WorldDetailFoliageMaterialOptions {
  fadeDistance: number;
  fadeTransition: number;
  noiseWind: boolean;
}

export class WorldDetailFoliageMaterial {
  readonly material: THREE.ShaderMaterial;

  private readonly uniforms: ShaderUniforms;
  private readonly baseWindStrength: number;
  private artRootDarkening: number;
  private artTipColorStrength = 0.5;

  constructor(
    readonly atlas: WorldDetailFoliageAtlas,
    materialConfig: GrassMaterialConfig,
    windConfig: GrassWindConfig,
    options: WorldDetailFoliageMaterialOptions,
  ) {
    this.baseWindStrength = windConfig.strength;
    this.artRootDarkening = materialConfig.rootDarkening;

    const speciesWind = new Float32Array(GRASS_MAX_ACCENT_SPECIES);
    for (const species of GRASS_ACCENT_SPECIES) {
      speciesWind[species.index] = species.windWeight;
    }

    this.uniforms = {
      ...(THREE.UniformsUtils.clone(THREE.UniformsLib.fog) as ShaderUniforms),
      ...(THREE.UniformsUtils.clone(THREE.UniformsLib.lights) as ShaderUniforms),
      uAtlas: { value: atlas.texture },
      uAtlasSize: { value: new THREE.Vector2(atlas.width, atlas.height) },
      uCellResolution: { value: atlas.cellResolution },
      uCellPadding: { value: atlas.padding },
      uAlphaCutoff: { value: DETAIL_FOLIAGE_ALPHA_CUTOFF },
      uFadeDistance: { value: options.fadeDistance },
      uFadeTransition: { value: options.fadeTransition },
      uDensityScale: { value: 1 },
      uSpeciesWind: { value: speciesWind },
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
      uNormalUp: { value: materialConfig.normalUp },
      uAmbientBoost: { value: materialConfig.ambientBoost },
      uBacklightStrength: { value: materialConfig.backlightStrength },
      uBiomeBase: { value: createBiomeColorRows(materialConfig.baseColor) },
      uBiomeTip: { value: createBiomeColorRows(materialConfig.tipColor) },
      uBiomeDry: { value: createBiomeColorRows(materialConfig.dryColor) },
      uBiomeShade: {
        value: createBiomeShadeRows(materialConfig.rootDarkening, 0.5),
      },
      uAccentTint: {
        value: GRASS_ACCENT_TINTS.map((tint) => new THREE.Color(tint.color)),
      },
    };
    this.setPaletteColors(
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
      defines: options.noiseWind ? { GRASS_NOISE_WIND: 1 } : {},
    });
    this.material.name = "world-grass-detail-foliage";
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
    this.uniforms.uWindStrength.value =
      this.baseWindStrength * direction.windStrengthScale;
  }

  setWindNoise(texture: THREE.Texture, scale: number, speed: number): void {
    this.uniforms.uWindNoise.value = texture;
    this.uniforms.uWindNoiseScale.value = scale;
    this.uniforms.uWindNoiseSpeed.value = speed;
  }

  /**
   * The keep threshold the field's CPU draw trim reproduces. Both sides must
   * read the same value or the trim stops being conservative.
   */
  setDensityScale(scale: number): void {
    this.uniforms.uDensityScale.value = scale;
  }

  setFade(distance: number, transition: number): void {
    this.uniforms.uFadeDistance.value = distance;
    this.uniforms.uFadeTransition.value = transition;
  }

  update(elapsedSeconds: number): void {
    this.uniforms.uTime.value = elapsedSeconds;
  }

  dispose(): void {
    this.material.dispose();
    this.atlas.texture.dispose();
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
}
