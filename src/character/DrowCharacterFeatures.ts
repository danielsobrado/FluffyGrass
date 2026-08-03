import * as THREE from "three";
import type { SnowflowCharacterRig } from "./SnowflowCharacterGeometry";

const DROW_SKIN = 0x626879;
const DROW_SKIN_EMISSIVE = 0x10131d;
const DROW_HAIR = 0xe9e7ef;
const DROW_EYES = 0xd9b65c;
const DROW_EYE_GLOW = 0x7e6b28;
const SHADOW_CASTER = true;
const SHADOW_RECEIVER = true;

export function addDrowCharacterFeatures(rig: SnowflowCharacterRig): void {
  const skin = new THREE.MeshStandardMaterial({
    color: DROW_SKIN,
    emissive: DROW_SKIN_EMISSIVE,
    emissiveIntensity: 0.35,
    roughness: 0.78,
    metalness: 0,
  });
  const hair = createMaterial(DROW_HAIR, 0.66);
  const eyes = new THREE.MeshStandardMaterial({
    color: DROW_EYES,
    emissive: DROW_EYE_GLOW,
    emissiveIntensity: 2.8,
    roughness: 0.24,
    metalness: 0,
  });
  rig.materials.push(skin, hair, eyes);

  const baseFace = rig.head.getObjectByName("drow-base-face");
  if (baseFace instanceof THREE.Mesh) {
    baseFace.material = skin;
  }

  addEar(rig, skin, -1);
  addEar(rig, skin, 1);
  addHair(rig, hair);
  addEyes(rig, eyes);
  addBrows(rig, hair);
}

function addEar(
  rig: SnowflowCharacterRig,
  material: THREE.Material,
  side: -1 | 1,
): void {
  const geometry = new THREE.ConeGeometry(0.036, 0.22, 10, 1, false);
  const ear = addMesh(rig.head, rig, geometry, material);
  ear.name = side < 0 ? "drow-left-ear" : "drow-right-ear";
  ear.position.set(side * 0.15, 0.005, 0.02);
  ear.rotation.z = side * -Math.PI * 0.5;
  ear.rotation.y = side * 0.16;
  ear.scale.z = 0.68;
}

function addHair(rig: SnowflowCharacterRig, material: THREE.Material): void {
  const cap = addMesh(
    rig.head,
    rig,
    new THREE.SphereGeometry(
      0.118,
      24,
      12,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.56,
    ),
    material,
  );
  cap.name = "drow-hair-cap";
  cap.position.set(0, 0.035, -0.006);
  cap.scale.set(1.04, 0.96, 1.03);

  addHairSide(rig.hairLeft, rig, material, -1);
  addHairSide(rig.hairRight, rig, material, 1);

  for (const side of [-1, 0, 1] as const) {
    const fringe = addMesh(
      rig.head,
      rig,
      new THREE.ConeGeometry(0.016, 0.13, 8, 1, false),
      material,
    );
    fringe.name = `drow-hair-fringe-${side}`;
    fringe.position.set(side * 0.035, 0.045, 0.112);
    fringe.rotation.x = -0.22;
    fringe.rotation.z = side * 0.17;
  }
}

function addHairSide(
  parent: THREE.Group,
  rig: SnowflowCharacterRig,
  material: THREE.Material,
  side: -1 | 1,
): void {
  parent.position.set(side * 0.086, 0.015, 0.02);
  for (let index = 0; index < 3; index += 1) {
    const lock = addMesh(
      parent,
      rig,
      new THREE.ConeGeometry(0.022 - index * 0.002, 0.3 + index * 0.045, 9),
      material,
    );
    lock.name = `${side < 0 ? "left" : "right"}-hair-lock-${index}`;
    lock.position.set(
      side * index * 0.018,
      -0.12 - index * 0.03,
      0.055 - index * 0.02,
    );
    lock.rotation.z = side * (0.18 + index * 0.05);
    lock.rotation.x = -0.14 - index * 0.03;
  }
}

function addEyes(rig: SnowflowCharacterRig, material: THREE.Material): void {
  for (const side of [-1, 1] as const) {
    const geometry = new THREE.SphereGeometry(0.018, 14, 10);
    const eye = addMesh(rig.head, rig, geometry, material);
    eye.name = side < 0 ? "drow-left-eye" : "drow-right-eye";
    eye.position.set(side * 0.036, 0.005, 0.108);
    eye.scale.set(1.2, 0.52, 0.36);
  }
}

function addBrows(rig: SnowflowCharacterRig, material: THREE.Material): void {
  for (const side of [-1, 1] as const) {
    const brow = addMesh(
      rig.head,
      rig,
      new THREE.BoxGeometry(0.055, 0.009, 0.008),
      material,
    );
    brow.position.set(side * 0.04, 0.036, 0.112);
    brow.rotation.z = side * -0.12;
  }
}

function addMesh(
  parent: THREE.Object3D,
  rig: SnowflowCharacterRig,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = SHADOW_CASTER;
  mesh.receiveShadow = SHADOW_RECEIVER;
  parent.add(mesh);
  rig.geometries.push(geometry);
  return mesh;
}

function createMaterial(
  color: number,
  roughness: number,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
  });
}
