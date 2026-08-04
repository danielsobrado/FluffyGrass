import * as THREE from "three";

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
    // The scene has no environment map, so keep metalness low: fully metallic
    // surfaces would have nothing to reflect and render near-black.
    metal: createMaterial(PALETTE.metal, 0.34, THREE.FrontSide, 0.25),
    hair: createMaterial(PALETTE.hair, 0.82, THREE.DoubleSide),
    eye,
  };
}

function createMaterial(
  color: number,
  roughness: number,
  side: THREE.Side,
  metalness = 0,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    side,
  });
}
