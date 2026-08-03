import * as THREE from "three";

const PALETTE = Object.freeze({
  cloak: 0x514d4b,
  robe: 0x342f30,
  mantle: 0x756f69,
  tunic: 0x3b3431,
  leather: 0x211a18,
  skin: 0x5f6474,
  trim: 0x81776e,
  fur: 0xb9b4ae,
  metal: 0x827d78,
  hair: 0xe7e5ec,
});

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
}

export function createSnowflowCharacterMaterials(): SnowflowCharacterMaterialSet {
  return {
    cloak: createMaterial(PALETTE.cloak, 0.92, THREE.DoubleSide),
    robe: createMaterial(PALETTE.robe, 0.9, THREE.DoubleSide),
    mantle: createMaterial(PALETTE.mantle, 0.88, THREE.DoubleSide),
    tunic: createMaterial(PALETTE.tunic, 0.86, THREE.DoubleSide),
    leather: createMaterial(PALETTE.leather, 0.68, THREE.FrontSide),
    skin: createMaterial(PALETTE.skin, 0.8, THREE.FrontSide),
    trim: createMaterial(PALETTE.trim, 0.76, THREE.DoubleSide),
    fur: createMaterial(PALETTE.fur, 0.94, THREE.DoubleSide),
    metal: createMaterial(PALETTE.metal, 0.42, THREE.FrontSide, 0.72),
    hair: createMaterial(PALETTE.hair, 0.7, THREE.DoubleSide),
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
