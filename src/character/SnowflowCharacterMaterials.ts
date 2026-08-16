import * as THREE from "three";
import { applyActorEnvironmentResponse } from "../render/ActorEnvironmentResponse";
import { disposeResources } from "../render/ResourceDisposal";

/**
 * The costume is deliberately near-black — a violet so dark it is almost
 * silhouette — and it sits in a bright yellow-green meadow, which is the case
 * the shared actor environment response was written for. See
 * {@link applyActorEnvironmentResponse} for why the rim and bounce terms exist.
 */
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
  const owned: THREE.MeshStandardMaterial[] = [];
  const create = (
    color: number,
    roughness: number,
    side: THREE.Side,
    metalness = 0,
  ): THREE.MeshStandardMaterial => {
    const material = createMaterial(color, roughness, side, metalness);
    owned.push(material);
    return material;
  };

  try {
    const skin = create(PALETTE.skin, 0.74, THREE.FrontSide);
    skin.emissive.setHex(SKIN_SHEEN);
    skin.emissiveIntensity = 0.4;

    const eye = create(PALETTE.eye, 0.22, THREE.FrontSide);
    eye.emissive.setHex(EYE_GLOW);
    eye.emissiveIntensity = 1.2;

    return {
      cloak: create(PALETTE.cloak, 0.92, THREE.DoubleSide),
      robe: create(PALETTE.robe, 0.9, THREE.DoubleSide),
      mantle: create(PALETTE.mantle, 0.88, THREE.DoubleSide),
      tunic: create(PALETTE.tunic, 0.86, THREE.DoubleSide),
      leather: create(PALETTE.leather, 0.62, THREE.FrontSide),
      skin,
      trim: create(PALETTE.trim, 0.7, THREE.DoubleSide),
      fur: create(PALETTE.fur, 0.94, THREE.DoubleSide),
      metal: create(PALETTE.metal, 0.34, THREE.FrontSide, 0.55),
      hair: create(PALETTE.hair, 0.82, THREE.DoubleSide),
      eye,
      cloakShell: create(PALETTE.cloakShell, 0.94, THREE.FrontSide),
      cloakLining: create(PALETTE.cloakLining, 0.88, THREE.BackSide),
    };
  } catch (error) {
    try {
      disposeResources(owned);
    } catch (cleanupError) {
      console.warn(
        "[Drusniel World] Character material construction cleanup failed.",
        cleanupError,
      );
    }
    throw error;
  }
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
  try {
    applyActorEnvironmentResponse(material);
    return material;
  } catch (error) {
    try {
      disposeResources([material]);
    } catch (cleanupError) {
      console.warn(
        "[Drusniel World] Character material cleanup failed.",
        cleanupError,
      );
    }
    throw error;
  }
}
