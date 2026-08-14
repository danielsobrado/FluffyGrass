import * as THREE from "three";
import {
  WORLD_DEFAULT_HEMISPHERE_GROUND,
  WORLD_SKY_ZENITH,
} from "../app/WorldEnvironmentTuning";

/**
 * Environment response, so the character stops reading as a cutout.
 *
 * The costume is deliberately near-black — a violet so dark it is almost
 * silhouette — and it sits in a bright yellow-green meadow. Sun and hemisphere
 * light alone leave it as a flat hole in the frame: correct in value, but with
 * no edge information, so the eye files it as pasted on rather than standing
 * there. The sky IBL fixes some of that on desktop and does not exist at all on
 * the compact profile, which is where the problem is worst.
 *
 * Two terms, both cheap enough for the compact profile. A skyward rim, which is
 * genuinely what a dark figure under an open sky looks like: the grazing angles
 * see the sky rather than the surface, and they see it strongest on the upper
 * surfaces. And a ground bounce from below, tinted the meadow's own green, which
 * ties the figure's underside to the ground it stands on.
 *
 * The bounce is modulated by the surface's own colour rather than added flat, so
 * it stays a material response — a wash added over everything equally would just
 * grey out the costume's blacks, which is the failure mode of doing this with
 * ambient.
 */
const CHARACTER_MATERIAL_CACHE_KEY = "snowflow-character-environment-v1";
const RIM_COLOR = new THREE.Color(WORLD_SKY_ZENITH);
const RIM_STRENGTH = 0.5;
const RIM_POWER = 3.2;
const BOUNCE_COLOR = new THREE.Color(WORLD_DEFAULT_HEMISPHERE_GROUND);
const BOUNCE_STRENGTH = 0.35;

const ENVIRONMENT_DECLARATIONS = `
uniform vec3 uCharacterRimColor;
uniform float uCharacterRimStrength;
uniform float uCharacterRimPower;
uniform vec3 uCharacterBounceColor;
uniform float uCharacterBounceStrength;
`;

const ENVIRONMENT_OUTPUT = `
vec3 characterUpView = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
vec3 characterViewDirection = normalize(vViewPosition);
float characterRim = pow(
  1.0 - saturate(dot(normal, characterViewDirection)),
  uCharacterRimPower
);
// Upper surfaces see more sky than lower ones, so the rim is not a uniform
// outline. Without this it reads as a drawn stroke rather than as light.
float characterSkyward = saturate(dot(normal, characterUpView) * 0.5 + 0.5);
outgoingLight += uCharacterRimColor *
  (characterRim * characterSkyward * uCharacterRimStrength);
float characterBounce = saturate(-dot(normal, characterUpView));
outgoingLight += uCharacterBounceColor * diffuseColor.rgb *
  (characterBounce * uCharacterBounceStrength);
`;

const PALETTE = Object.freeze({
  cloak: 0x50396f,
  robe: 0x2e2140,
  mantle: 0x5f4485,
  tunic: 0x3b2c55,
  leather: 0x261c33,
  skin: 0x77688f,
  trim: 0x715e99,
  fur: 0x6a5590,
  metal: 0xdbe1ee,
  hair: 0xd6cfe4,
  eye: 0xa81f36,
  cloakShell: 0x42305a,
  cloakLining: 0x6d2035,
});

const SKIN_SHEEN = 0x211a2e;
const EYE_GLOW = 0xc41f38;

export interface SnowflowCharacterMaterialSet {
  cloak: THREE.MeshStandardMaterial;
  robe: THREE.MeshStandardMaterial;
  mantle: THREE.MeshStandardMaterial;
  tunic: THREE.MeshStandardMaterial;
  leather: THREE.MeshStandardMaterial;
  skin: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  fur: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  hair: THREE.MeshStandardMaterial;
  eye: THREE.MeshStandardMaterial;
  cloakShell: THREE.MeshStandardMaterial;
  cloakLining: THREE.MeshStandardMaterial;
}

export function createSnowflowCharacterMaterials(): SnowflowCharacterMaterialSet {
  const skin = createMaterial(PALETTE.skin, 0.74, THREE.FrontSide);
  skin.emissive.setHex(SKIN_SHEEN);
  skin.emissiveIntensity = 0.4;

  const eye = createMaterial(PALETTE.eye, 0.22, THREE.FrontSide);
  eye.emissive.setHex(EYE_GLOW);
  eye.emissiveIntensity = 1.2;

  return {
    cloak: createMaterial(PALETTE.cloak, 0.92, THREE.DoubleSide),
    robe: createMaterial(PALETTE.robe, 0.9, THREE.DoubleSide),
    mantle: createMaterial(PALETTE.mantle, 0.88, THREE.DoubleSide),
    tunic: createMaterial(PALETTE.tunic, 0.86, THREE.DoubleSide),
    leather: createMaterial(PALETTE.leather, 0.62, THREE.FrontSide),
    skin,
    trim: createMaterial(PALETTE.trim, 0.7, THREE.DoubleSide),
    fur: createMaterial(PALETTE.fur, 0.94, THREE.DoubleSide),
    // The scene now has a sky IBL, so a little metalness actually reads.
    metal: createMaterial(PALETTE.metal, 0.34, THREE.FrontSide, 0.55),
    hair: createMaterial(PALETTE.hair, 0.82, THREE.DoubleSide),
    eye,
    // The cloak panels are drawn twice off one geometry: the outer shell takes
    // the faces pointing away from the body, the lining takes the rest.
    cloakShell: createMaterial(PALETTE.cloakShell, 0.94, THREE.FrontSide),
    cloakLining: createMaterial(PALETTE.cloakLining, 0.88, THREE.BackSide),
  };
}

function createMaterial(
  color: number,
  roughness: number,
  side: THREE.Side,
  metalness = 0,
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    side,
  });
  applyEnvironmentResponse(material);
  return material;
}

/**
 * One cache key for every costume material: the injected code is identical and
 * the uniforms are shared constants, so they can all share a compiled program.
 */
function applyEnvironmentResponse(material: THREE.MeshStandardMaterial): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCharacterRimColor = { value: RIM_COLOR };
    shader.uniforms.uCharacterRimStrength = { value: RIM_STRENGTH };
    shader.uniforms.uCharacterRimPower = { value: RIM_POWER };
    shader.uniforms.uCharacterBounceColor = { value: BOUNCE_COLOR };
    shader.uniforms.uCharacterBounceStrength = { value: BOUNCE_STRENGTH };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>${ENVIRONMENT_DECLARATIONS}`,
      )
      .replace(
        "vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;",
        `vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;${ENVIRONMENT_OUTPUT}`,
      );
  };
  material.customProgramCacheKey = () => CHARACTER_MATERIAL_CACHE_KEY;
}
