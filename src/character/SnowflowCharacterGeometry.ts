import * as THREE from "three";
import { addDrowCostumeGeometry } from "./DrowCostumeGeometry";
import {
  createSnowflowCharacterMaterials,
  type SnowflowCharacterMaterialSet,
} from "./SnowflowCharacterMaterials";

const SHADOW_RECEIVER = true;
const SHADOW_CASTER = true;

export interface SnowflowCharacterRig {
  root: THREE.Group;
  slope: THREE.Group;
  heading: THREE.Group;
  body: THREE.Group;
  pelvis: THREE.Group;
  torso: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  hood: THREE.Group;
  skirt: THREE.Group;
  skirtFront: THREE.Group;
  skirtLeft: THREE.Group;
  skirtRight: THREE.Group;
  cloakBack: THREE.Group;
  cloakLeft: THREE.Group;
  cloakRight: THREE.Group;
  hairLeft: THREE.Group;
  hairRight: THREE.Group;
  leftUpperArm: THREE.Group;
  leftForearm: THREE.Group;
  leftWrist: THREE.Group;
  rightUpperArm: THREE.Group;
  rightForearm: THREE.Group;
  rightWrist: THREE.Group;
  leftThigh: THREE.Group;
  leftShin: THREE.Group;
  leftFoot: THREE.Group;
  rightThigh: THREE.Group;
  rightShin: THREE.Group;
  rightFoot: THREE.Group;
  materials: THREE.Material[];
  geometries: THREE.BufferGeometry[];
}

export function buildSnowflowCharacter(
  scene: THREE.Scene,
  scale: number,
): SnowflowCharacterRig {
  const materials = createSnowflowCharacterMaterials();
  const geometries: THREE.BufferGeometry[] = [];
  const root = namedGroup("drusniel-character");
  const slope = namedGroup("character-slope");
  const heading = namedGroup("character-heading");
  const body = namedGroup("character-body");
  const pelvis = namedGroup("character-pelvis");
  const torso = namedGroup("character-torso");
  const neck = namedGroup("character-neck");
  const head = namedGroup("character-head");
  const hood = namedGroup("character-folded-hood");
  const skirt = namedGroup("character-skirt");
  const skirtFront = namedGroup("character-skirt-front");
  const skirtLeft = namedGroup("character-skirt-left");
  const skirtRight = namedGroup("character-skirt-right");
  const cloakBack = namedGroup("character-cloak-back");
  const cloakLeft = namedGroup("character-cloak-left");
  const cloakRight = namedGroup("character-cloak-right");
  const hairLeft = namedGroup("character-hair-left");
  const hairRight = namedGroup("character-hair-right");

  root.scale.setScalar(scale);
  root.add(slope);
  slope.add(heading);
  heading.add(body);
  body.add(pelvis);
  pelvis.position.y = 0.9;
  pelvis.add(torso, skirt);
  torso.position.y = 0.28;
  torso.add(neck, hood, cloakBack, cloakLeft, cloakRight);
  neck.position.y = 0.43;
  neck.add(head);
  head.position.y = 0.14;
  head.add(hairLeft, hairRight);
  skirt.position.y = 0.08;
  skirt.add(skirtFront, skirtLeft, skirtRight);
  scene.add(root);

  buildTorso(torso, geometries, materials);
  buildHead(head, geometries, materials);

  const leftUpperArm = buildArm(
    torso,
    geometries,
    materials,
    -1,
    "left",
  );
  const rightUpperArm = buildArm(
    torso,
    geometries,
    materials,
    1,
    "right",
  );
  const leftThigh = buildLeg(
    pelvis,
    geometries,
    materials,
    -1,
    "left",
  );
  const rightThigh = buildLeg(
    pelvis,
    geometries,
    materials,
    1,
    "right",
  );

  const rig: SnowflowCharacterRig = {
    root,
    slope,
    heading,
    body,
    pelvis,
    torso,
    neck,
    head,
    hood,
    skirt,
    skirtFront,
    skirtLeft,
    skirtRight,
    cloakBack,
    cloakLeft,
    cloakRight,
    hairLeft,
    hairRight,
    leftUpperArm,
    leftForearm: requireGroup(leftUpperArm, "left-forearm"),
    leftWrist: requireGroup(leftUpperArm, "left-wrist"),
    rightUpperArm,
    rightForearm: requireGroup(rightUpperArm, "right-forearm"),
    rightWrist: requireGroup(rightUpperArm, "right-wrist"),
    leftThigh,
    leftShin: requireGroup(leftThigh, "left-shin"),
    leftFoot: requireGroup(leftThigh, "left-foot"),
    rightThigh,
    rightShin: requireGroup(rightThigh, "right-shin"),
    rightFoot: requireGroup(rightThigh, "right-foot"),
    materials: Object.values(materials),
    geometries,
  };

  addDrowCostumeGeometry(rig, materials, geometries);
  return rig;
}

function buildTorso(
  torso: THREE.Group,
  geometries: THREE.BufferGeometry[],
  materials: SnowflowCharacterMaterialSet,
): void {
  const chest = addMesh(
    torso,
    geometries,
    new THREE.CylinderGeometry(0.155, 0.19, 0.46, 18, 4, false),
    materials.tunic,
    0,
    0.2,
    0,
  );
  chest.scale.z = 0.76;

  const belt = addMesh(
    torso.parent ?? torso,
    geometries,
    new THREE.TorusGeometry(0.17, 0.025, 8, 28),
    materials.leather,
    0,
    0.08,
    0,
  );
  belt.rotation.x = Math.PI * 0.5;
  belt.scale.z = 0.82;
}

function buildHead(
  head: THREE.Group,
  geometries: THREE.BufferGeometry[],
  materials: SnowflowCharacterMaterialSet,
): void {
  const face = addMesh(
    head,
    geometries,
    new THREE.SphereGeometry(0.112, 24, 16),
    materials.skin,
    0,
    0,
    0.018,
  );
  face.name = "drow-base-face";
  face.scale.set(0.88, 1.08, 0.92);

  const neckGuard = addMesh(
    head,
    geometries,
    new THREE.CylinderGeometry(0.1, 0.088, 0.1, 20, 2, true),
    materials.trim,
    0,
    -0.105,
    0.006,
  );
  neckGuard.scale.z = 0.9;
}

function buildArm(
  parent: THREE.Group,
  geometries: THREE.BufferGeometry[],
  materials: SnowflowCharacterMaterialSet,
  side: -1 | 1,
  name: "left" | "right",
): THREE.Group {
  const upperArm = namedGroup(`${name}-upper-arm`);
  upperArm.position.set(side * 0.215, 0.33, 0);
  parent.add(upperArm);

  const upperMesh = addMesh(
    upperArm,
    geometries,
    new THREE.CylinderGeometry(0.052, 0.068, 0.3, 14, 3, false),
    materials.tunic,
    side * 0.018,
    -0.145,
    0,
  );
  upperMesh.rotation.z = side * -0.12;

  const forearm = namedGroup(`${name}-forearm`);
  forearm.position.set(side * 0.038, -0.29, 0);
  upperArm.add(forearm);
  addMesh(
    forearm,
    geometries,
    new THREE.CylinderGeometry(0.044, 0.054, 0.28, 14, 3, false),
    materials.tunic,
    0,
    -0.135,
    0.008,
  );
  addMesh(
    forearm,
    geometries,
    new THREE.CylinderGeometry(0.058, 0.052, 0.14, 14, 2, false),
    materials.leather,
    0,
    -0.19,
    0.012,
  );

  const wrist = namedGroup(`${name}-wrist`);
  wrist.position.set(0, -0.275, 0.012);
  forearm.add(wrist);
  const hand = addMesh(
    wrist,
    geometries,
    new THREE.SphereGeometry(0.048, 12, 8),
    materials.skin,
    0,
    -0.055,
    0.025,
  );
  hand.scale.set(0.86, 1.22, 0.8);
  return upperArm;
}

function buildLeg(
  parent: THREE.Group,
  geometries: THREE.BufferGeometry[],
  materials: SnowflowCharacterMaterialSet,
  side: -1 | 1,
  name: "left" | "right",
): THREE.Group {
  const thigh = namedGroup(`${name}-thigh`);
  thigh.position.set(side * 0.1, -0.02, 0);
  parent.add(thigh);
  addMesh(
    thigh,
    geometries,
    new THREE.CylinderGeometry(0.082, 0.105, 0.44, 14, 4, false),
    materials.robe,
    0,
    -0.22,
    0,
  );

  const shin = namedGroup(`${name}-shin`);
  shin.position.set(0, -0.44, 0);
  thigh.add(shin);
  addMesh(
    shin,
    geometries,
    new THREE.CylinderGeometry(0.068, 0.082, 0.37, 14, 4, false),
    materials.leather,
    0,
    -0.185,
    0,
  );

  const foot = namedGroup(`${name}-foot`);
  foot.position.set(0, -0.37, 0);
  shin.add(foot);
  const boot = addMesh(
    foot,
    geometries,
    new THREE.BoxGeometry(0.12, 0.11, 0.27, 2, 2, 3),
    materials.leather,
    0,
    -0.035,
    0.085,
  );
  boot.geometry.translate(0, 0, 0.025);
  return thigh;
}

function namedGroup(name: string): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  return group;
}

function requireGroup(parent: THREE.Group, name: string): THREE.Group {
  const group = parent.getObjectByName(name);
  if (!(group instanceof THREE.Group)) {
    throw new Error(`Character rig group ${name} is missing.`);
  }
  return group;
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
