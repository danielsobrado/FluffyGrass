import * as THREE from "three";
import type { SnowflowCharacterRig } from "./SnowflowCharacterGeometry";
import type { SnowflowCharacterMaterialSet } from "./SnowflowCharacterMaterials";

const SHADOW_CASTER = true;
const SHADOW_RECEIVER = true;

export function addDrowCostumeGeometry(
  rig: SnowflowCharacterRig,
  materials: SnowflowCharacterMaterialSet,
  geometries: THREE.BufferGeometry[],
): void {
  addShoulderMantle(rig, materials, geometries);
  addFoldedHood(rig, materials, geometries);
  addCloakPanels(rig, materials, geometries);
  addLayeredSkirt(rig, materials, geometries);
  addLeatherHarness(rig, materials, geometries);
  addMedallion(rig, materials, geometries);
  addBeltDagger(rig, materials, geometries);
}

function addShoulderMantle(
  rig: SnowflowCharacterRig,
  materials: SnowflowCharacterMaterialSet,
  geometries: THREE.BufferGeometry[],
): void {
  const y = 0.37;
  for (const side of [-1, 1] as const) {
    const shoulder = addMesh(
      rig.torso,
      geometries,
      new THREE.SphereGeometry(0.17, 14, 9),
      materials.fur,
      side * 0.19,
      y,
      -0.015,
    );
    shoulder.scale.set(1.3, 0.5, 0.86);
    shoulder.rotation.z = side * 0.08;

    for (let tuftIndex = 0; tuftIndex < 4; tuftIndex += 1) {
      const tuft = addMesh(
        rig.torso,
        geometries,
        new THREE.ConeGeometry(0.035, 0.15, 7),
        materials.fur,
        side * (0.12 + tuftIndex * 0.045),
        y - 0.06 - (tuftIndex % 2) * 0.018,
        0.035 - tuftIndex * 0.01,
      );
      tuft.rotation.z = side * (0.2 + tuftIndex * 0.06);
      tuft.rotation.x = -0.2;
    }
  }
}

function addFoldedHood(
  rig: SnowflowCharacterRig,
  materials: SnowflowCharacterMaterialSet,
  geometries: THREE.BufferGeometry[],
): void {
  rig.hood.position.set(0, 0.39, -0.11);
  const rim = addMesh(
    rig.hood,
    geometries,
    new THREE.TorusGeometry(0.15, 0.04, 8, 24),
    materials.cloak,
    0,
    0,
    0,
  );
  rim.rotation.x = Math.PI * 0.5;
  rim.scale.set(1.18, 0.82, 1);

  const fold = addMesh(
    rig.hood,
    geometries,
    new THREE.SphereGeometry(
      0.19,
      18,
      10,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.54,
    ),
    materials.cloak,
    0,
    0.01,
    -0.055,
  );
  fold.rotation.x = Math.PI * 0.5;
  fold.scale.set(1.15, 0.55, 0.88);
}

function addCloakPanels(
  rig: SnowflowCharacterRig,
  materials: SnowflowCharacterMaterialSet,
  geometries: THREE.BufferGeometry[],
): void {
  rig.cloakBack.position.set(0, 0.34, -0.15);
  rig.cloakLeft.position.set(-0.2, 0.33, -0.06);
  rig.cloakRight.position.set(0.2, 0.33, -0.06);

  const back = addMesh(
    rig.cloakBack,
    geometries,
    createPanelGeometry(0.58, 0.88, 1.25, -0.08),
    materials.cloak,
    0,
    -0.61,
    0,
  );
  back.rotation.x = -0.035;

  const left = addMesh(
    rig.cloakLeft,
    geometries,
    createPanelGeometry(0.28, 0.48, 1.16, -0.035),
    materials.mantle,
    -0.09,
    -0.56,
    0,
  );
  left.rotation.y = -0.24;
  left.rotation.z = -0.06;

  const right = addMesh(
    rig.cloakRight,
    geometries,
    createPanelGeometry(0.28, 0.48, 1.16, -0.035),
    materials.mantle,
    0.09,
    -0.56,
    0,
  );
  right.rotation.y = 0.24;
  right.rotation.z = 0.06;
}

function addLayeredSkirt(
  rig: SnowflowCharacterRig,
  materials: SnowflowCharacterMaterialSet,
  geometries: THREE.BufferGeometry[],
): void {
  const front = addMesh(
    rig.skirtFront,
    geometries,
    createPanelGeometry(0.28, 0.42, 0.79, 0.035),
    materials.robe,
    0,
    -0.39,
    0.12,
  );
  front.rotation.x = -0.04;

  const left = addMesh(
    rig.skirtLeft,
    geometries,
    createPanelGeometry(0.24, 0.38, 0.74, 0.015),
    materials.tunic,
    -0.12,
    -0.36,
    0.035,
  );
  left.rotation.y = -0.28;
  left.rotation.z = -0.08;

  const right = addMesh(
    rig.skirtRight,
    geometries,
    createPanelGeometry(0.24, 0.38, 0.74, 0.015),
    materials.tunic,
    0.12,
    -0.36,
    0.035,
  );
  right.rotation.y = 0.28;
  right.rotation.z = 0.08;

  addMesh(
    rig.skirt,
    geometries,
    createPanelGeometry(0.22, 0.31, 0.66, -0.025),
    materials.trim,
    0,
    -0.33,
    -0.13,
  );
}

function addLeatherHarness(
  rig: SnowflowCharacterRig,
  materials: SnowflowCharacterMaterialSet,
  geometries: THREE.BufferGeometry[],
): void {
  for (const side of [-1, 1] as const) {
    const strap = addMesh(
      rig.torso,
      geometries,
      new THREE.BoxGeometry(0.035, 0.54, 0.018),
      materials.leather,
      side * 0.075,
      0.2,
      0.14,
    );
    strap.rotation.z = side * 0.48;
  }

  const waistWrap = addMesh(
    rig.pelvis,
    geometries,
    new THREE.CylinderGeometry(0.185, 0.19, 0.16, 18, 2, true),
    materials.leather,
    0,
    0.07,
    0,
  );
  waistWrap.scale.z = 0.82;
}

function addMedallion(
  rig: SnowflowCharacterRig,
  materials: SnowflowCharacterMaterialSet,
  geometries: THREE.BufferGeometry[],
): void {
  const medallion = new THREE.Group();
  medallion.name = "drow-medallion";
  medallion.position.set(0, 0.08, 0.175);
  rig.torso.add(medallion);

  addMesh(
    medallion,
    geometries,
    new THREE.TorusGeometry(0.085, 0.012, 8, 24),
    materials.metal,
    0,
    0,
    0,
  );
  const disc = addMesh(
    medallion,
    geometries,
    new THREE.CylinderGeometry(0.067, 0.067, 0.018, 20),
    materials.leather,
    0,
    0,
    0,
  );
  disc.rotation.x = Math.PI * 0.5;

  addMesh(
    medallion,
    geometries,
    new THREE.TorusGeometry(0.038, 0.006, 6, 16),
    materials.metal,
    0,
    0,
    0.014,
  );
}

function addBeltDagger(
  rig: SnowflowCharacterRig,
  materials: SnowflowCharacterMaterialSet,
  geometries: THREE.BufferGeometry[],
): void {
  const dagger = new THREE.Group();
  dagger.name = "drow-belt-dagger";
  dagger.position.set(-0.23, 0.04, 0.02);
  dagger.rotation.z = 0.2;
  rig.pelvis.add(dagger);

  addMesh(
    dagger,
    geometries,
    new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8),
    materials.leather,
    0,
    -0.04,
    0,
  );
  const guard = addMesh(
    dagger,
    geometries,
    new THREE.BoxGeometry(0.12, 0.018, 0.025),
    materials.metal,
    0,
    -0.12,
    0,
  );
  guard.rotation.z = -0.08;
  const blade = addMesh(
    dagger,
    geometries,
    new THREE.ConeGeometry(0.045, 0.32, 4),
    materials.metal,
    0,
    -0.29,
    0,
  );
  blade.scale.z = 0.32;
}

function createPanelGeometry(
  topWidth: number,
  bottomWidth: number,
  height: number,
  centerDepth: number,
): THREE.BufferGeometry {
  const halfTop = topWidth * 0.5;
  const halfBottom = bottomWidth * 0.5;
  const halfHeight = height * 0.5;
  const positions = new Float32Array([
    -halfTop, halfHeight, 0,
    halfTop, halfHeight, 0,
    -halfBottom, 0, centerDepth,
    halfBottom, 0, centerDepth,
    -halfBottom * 0.86, -halfHeight, 0,
    halfBottom * 0.86, -halfHeight, 0,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      [0, 1, 1, 1, 0, 0.5, 1, 0.5, 0.08, 0, 0.92, 0],
      2,
    ),
  );
  geometry.setIndex([0, 2, 1, 1, 2, 3, 2, 4, 3, 3, 4, 5]);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function addMesh(
  parent: THREE.Object3D,
  geometries: THREE.BufferGeometry[],
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = SHADOW_CASTER;
  mesh.receiveShadow = SHADOW_RECEIVER;
  parent.add(mesh);
  geometries.push(geometry);
  return mesh;
}
