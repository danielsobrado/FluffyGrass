import * as THREE from "three";
import type { SnowflowCharacterRig } from "./SnowflowCharacterGeometry";

const DROW_SKIN = 0x665686;
const DROW_SKIN_EMISSIVE = 0x120e20;
const DROW_HAIR = 0xf1f0ff;
const DROW_EYES = 0xe66cff;
const DROW_HOOD_EDGE = 0x584477;
const SHADOW_CASTER = true;
const SHADOW_RECEIVER = true;

export function addDrowCharacterFeatures(rig: SnowflowCharacterRig): void {
  const skin = new THREE.MeshStandardMaterial({
    color: DROW_SKIN,
    emissive: DROW_SKIN_EMISSIVE,
    emissiveIntensity: 0.45,
    roughness: 0.78,
    metalness: 0,
  });
  const hair = createMaterial(DROW_HAIR, 0.64);
  const eyes = new THREE.MeshStandardMaterial({
    color: DROW_EYES,
    emissive: DROW_EYES,
    emissiveIntensity: 4,
    roughness: 0.2,
    metalness: 0,
  });
  const hoodEdge = createMaterial(DROW_HOOD_EDGE, 0.7);
  rig.materials.push(skin, hair, eyes, hoodEdge);

  pullHoodBack(rig, hoodEdge);
  addFace(rig, skin);
  addEar(rig, skin, -1);
  addEar(rig, skin, 1);
  addHair(rig, hair);
  addEyes(rig, eyes);
}

function pullHoodBack(
  rig: SnowflowCharacterRig,
  edgeMaterial: THREE.Material,
): void {
  rig.hood.position.z = -0.055;
  rig.hood.scale.set(1.03, 1.01, 0.76);
  rig.hood.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return;
    }
    if (object.geometry.type === "TubeGeometry") {
      object.material = edgeMaterial;
    }
  });
}

function addFace(
  rig: SnowflowCharacterRig,
  material: THREE.Material,
): void {
  const geometry = new THREE.SphereGeometry(0.102, 24, 16);
  const face = addMesh(rig, geometry, material);
  face.name = "drow-visible-face";
  face.position.set(0, 1.655, 0.122);
  face.scale.set(0.82, 1.04, 0.3);
}

function addEar(
  rig: SnowflowCharacterRig,
  material: THREE.Material,
  side: -1 | 1,
): void {
  const geometry = new THREE.ConeGeometry(0.035, 0.2, 10, 1, false);
  const ear = addMesh(rig, geometry, material);
  ear.name = side < 0 ? "drow-left-ear" : "drow-right-ear";
  ear.position.set(side * 0.148, 1.665, 0.065);
  ear.rotation.z = side * -Math.PI * 0.5;
  ear.rotation.y = side * 0.16;
  ear.scale.z = 0.68;
}

function addHair(rig: SnowflowCharacterRig, material: THREE.Material): void {
  const capGeometry = new THREE.SphereGeometry(
    0.108,
    24,
    12,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.52,
  );
  const cap = addMesh(rig, capGeometry, material);
  cap.name = "drow-hair-cap";
  cap.position.set(0, 1.688, 0.01);
  cap.scale.set(1.06, 0.92, 1.02);

  for (const side of [-1, 1] as const) {
    const sideLock = addMesh(
      rig,
      new THREE.ConeGeometry(0.024, 0.24, 10, 1, false),
      material,
    );
    sideLock.name =
      side < 0 ? "drow-left-hair-lock" : "drow-right-hair-lock";
    sideLock.position.set(side * 0.086, 1.635, 0.13);
    sideLock.rotation.z = side * 0.22;
    sideLock.rotation.x = -0.18;
  }

  for (const side of [-1, 0, 1] as const) {
    const fringe = addMesh(
      rig,
      new THREE.ConeGeometry(0.017, 0.12, 8, 1, false),
      material,
    );
    fringe.name = `drow-hair-fringe-${side}`;
    fringe.position.set(side * 0.035, 1.705, 0.151);
    fringe.rotation.x = -0.2;
    fringe.rotation.z = side * 0.16;
  }
}

function addEyes(rig: SnowflowCharacterRig, material: THREE.Material): void {
  for (const side of [-1, 1] as const) {
    const geometry = new THREE.SphereGeometry(0.019, 14, 10);
    const eye = addMesh(rig, geometry, material);
    eye.name = side < 0 ? "drow-left-eye" : "drow-right-eye";
    eye.position.set(side * 0.034, 1.67, 0.154);
    eye.scale.set(1.15, 0.55, 0.38);
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
