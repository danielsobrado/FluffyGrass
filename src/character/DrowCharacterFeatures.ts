import * as THREE from "three";
import type { SnowflowCharacterRig } from "./SnowflowCharacterGeometry";

const DROW_SKIN = 0x403854;
const DROW_HAIR = 0xe8ebf4;
const DROW_EYES = 0xd45cff;
const SHADOW_CASTER = true;
const SHADOW_RECEIVER = true;

export function addDrowCharacterFeatures(rig: SnowflowCharacterRig): void {
  const skin = createMaterial(DROW_SKIN, 0.82);
  const hair = createMaterial(DROW_HAIR, 0.72);
  const eyes = new THREE.MeshStandardMaterial({
    color: DROW_EYES,
    emissive: DROW_EYES,
    emissiveIntensity: 2.4,
    roughness: 0.28,
    metalness: 0,
  });
  rig.materials.push(skin, hair, eyes);

  addEar(rig, skin, -1);
  addEar(rig, skin, 1);
  addHair(rig, hair);
  addEyes(rig, eyes);
}

function addEar(
  rig: SnowflowCharacterRig,
  material: THREE.Material,
  side: -1 | 1,
): void {
  const geometry = new THREE.ConeGeometry(0.032, 0.16, 8, 1, false);
  const ear = addMesh(rig, geometry, material);
  ear.name = side < 0 ? "drow-left-ear" : "drow-right-ear";
  ear.position.set(side * 0.13, 1.665, 0.005);
  ear.rotation.z = side * -Math.PI * 0.5;
  ear.rotation.y = side * 0.1;
  ear.scale.z = 0.62;
}

function addHair(rig: SnowflowCharacterRig, material: THREE.Material): void {
  const capGeometry = new THREE.SphereGeometry(
    0.104,
    20,
    10,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.56,
  );
  const cap = addMesh(rig, capGeometry, material);
  cap.name = "drow-hair-cap";
  cap.position.set(0, 1.68, -0.004);
  cap.scale.set(1.03, 0.92, 1.02);

  for (const side of [-1, 1] as const) {
    const lockGeometry = new THREE.ConeGeometry(0.022, 0.19, 8, 1, false);
    const lock = addMesh(rig, lockGeometry, material);
    lock.name = side < 0 ? "drow-left-hair-lock" : "drow-right-hair-lock";
    lock.position.set(side * 0.064, 1.635, 0.079);
    lock.rotation.z = side * 0.2;
    lock.rotation.x = -0.12;
  }
}

function addEyes(rig: SnowflowCharacterRig, material: THREE.Material): void {
  for (const side of [-1, 1] as const) {
    const geometry = new THREE.SphereGeometry(0.015, 12, 8);
    const eye = addMesh(rig, geometry, material);
    eye.name = side < 0 ? "drow-left-eye" : "drow-right-eye";
    eye.position.set(side * 0.033, 1.672, 0.099);
    eye.scale.set(1, 0.58, 0.42);
  }
}

function addMesh(
  rig: SnowflowCharacterRig,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = SHADOW_CASTER;
  mesh.receiveShadow = SHADOW_RECEIVER;
  rig.head.add(mesh);
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
