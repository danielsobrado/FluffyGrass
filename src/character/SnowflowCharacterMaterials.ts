import * as THREE from "three";

const PALETTE = Object.freeze({
  robe: 0x081020,
  mantle: 0x131b2f,
  tunic: 0x3b3934,
  leather: 0x0c0806,
  skin: 0x221812,
  trim: 0x1f3250,
  fur: 0xb3b8c2,
});

export interface SnowflowCharacterMaterialSet {
  robe: THREE.MeshStandardMaterial;
  mantle: THREE.MeshStandardMaterial;
  tunic: THREE.MeshStandardMaterial;
  leather: THREE.MeshStandardMaterial;
  skin: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  fur: THREE.MeshStandardMaterial;
}

export function createSnowflowCharacterMaterials(): SnowflowCharacterMaterialSet {
  return {
    robe: createMaterial(PALETTE.robe, 0.86, THREE.DoubleSide),
    mantle: createMaterial(PALETTE.mantle, 0.8, THREE.DoubleSide),
    tunic: createMaterial(PALETTE.tunic, 0.88, THREE.DoubleSide),
    leather: createMaterial(PALETTE.leather, 0.62, THREE.FrontSide),
    skin: createMaterial(PALETTE.skin, 0.9, THREE.FrontSide),
    trim: createMaterial(PALETTE.trim, 0.78, THREE.DoubleSide),
    fur: createMaterial(PALETTE.fur, 0.92, THREE.DoubleSide),
  };
}

function createMaterial(
  color: number,
  roughness: number,
  side: THREE.Side,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
    side,
  });
}
