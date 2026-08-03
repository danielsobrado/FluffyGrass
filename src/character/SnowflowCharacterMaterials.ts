import * as THREE from "three";

const PALETTE = Object.freeze({
  robe: 0x090713,
  mantle: 0x17102c,
  tunic: 0x29213d,
  leather: 0x09070e,
  skin: 0x403854,
  trim: 0x65508f,
  fur: 0xcbd2df,
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
    tunic: createMaterial(PALETTE.tunic, 0.84, THREE.DoubleSide),
    leather: createMaterial(PALETTE.leather, 0.62, THREE.FrontSide),
    skin: createMaterial(PALETTE.skin, 0.82, THREE.FrontSide),
    trim: createMaterial(PALETTE.trim, 0.68, THREE.DoubleSide, 0.18),
    fur: createMaterial(PALETTE.fur, 0.76, THREE.DoubleSide),
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
