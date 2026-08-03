import * as THREE from "three";
import {
  createSnowflowHoodGeometry,
  createSnowflowHoodTrimGeometry,
} from "./SnowflowCharacterHood";
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
  torso: THREE.Group;
  head: THREE.Group;
  hood: THREE.Group;
  skirt: THREE.Group;
  leftUpperArm: THREE.Group;
  leftForearm: THREE.Group;
  rightUpperArm: THREE.Group;
  rightForearm: THREE.Group;
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
  const root = new THREE.Group();
  const slope = new THREE.Group();
  const heading = new THREE.Group();
  const body = new THREE.Group();

  root.name = "snowflow-character";
  root.scale.setScalar(scale);
  root.add(slope);
  slope.add(heading);
  heading.add(body);
  scene.add(root);

  const skirt = new THREE.Group();
  skirt.name = "snowflow-skirt";
  body.add(skirt);
  addMesh(
    skirt,
    geometries,
    new THREE.CylinderGeometry(0.18, 0.39, 0.92, 24, 6, true),
    materials.robe,
    0,
    0.52,
    0,
  );

  const mantle = addMesh(
    body,
    geometries,
    new THREE.CylinderGeometry(0.23, 0.37, 0.5, 24, 4, true),
    materials.mantle,
    0,
    1.17,
    -0.015,
  );
  mantle.scale.z = 0.78;

  const torso = new THREE.Group();
  torso.name = "snowflow-torso";
  torso.position.y = 0.96;
  body.add(torso);
  addMesh(
    torso,
    geometries,
    new THREE.CylinderGeometry(0.17, 0.15, 0.5, 20, 4, false),
    materials.trim,
    0,
    0.25,
    0,
  ).scale.z = 0.78;

  const belt = addMesh(
    body,
    geometries,
    new THREE.TorusGeometry(0.158, 0.022, 8, 28),
    materials.leather,
    0,
    0.99,
    0,
  );
  belt.rotation.x = Math.PI * 0.5;
  belt.scale.z = 0.8;

  const collar = addMesh(
    torso,
    geometries,
    new THREE.TorusGeometry(0.13, 0.027, 8, 28),
    materials.tunic,
    0,
    0.48,
    0.005,
  );
  collar.rotation.x = Math.PI * 0.5;
  collar.scale.z = 0.82;

  const head = new THREE.Group();
  head.name = "snowflow-head";
  body.add(head);
  addMesh(
    head,
    geometries,
    new THREE.SphereGeometry(0.095, 20, 14),
    materials.skin,
    0,
    1.655,
    0.01,
  ).scale.set(0.94, 1.08, 1);

  const scarf = addMesh(
    head,
    geometries,
    new THREE.CylinderGeometry(0.096, 0.088, 0.09, 24, 2, true),
    materials.trim,
    0,
    1.6,
    0.015,
  );
  scarf.scale.z = 1.05;

  const hood = new THREE.Group();
  hood.name = "snowflow-hood";
  body.add(hood);
  addMesh(
    hood,
    geometries,
    createSnowflowHoodGeometry(),
    materials.robe,
    0,
    0,
    0,
  );
  addMesh(
    hood,
    geometries,
    createSnowflowHoodTrimGeometry(),
    materials.fur,
    0,
    0,
    0,
  );

  const leftUpperArm = buildArm(
    body,
    geometries,
    materials,
    -1,
    "left",
  );
  const rightUpperArm = buildArm(
    body,
    geometries,
    materials,
    1,
    "right",
  );

  const leftThigh = buildLeg(
    body,
    geometries,
    materials,
    -1,
    "left",
  );
  const rightThigh = buildLeg(
    body,
    geometries,
    materials,
    1,
    "right",
  );

  const leftForearm = leftUpperArm.getObjectByName(
    "left-forearm",
  ) as THREE.Group;
  const rightForearm = rightUpperArm.getObjectByName(
    "right-forearm",
  ) as THREE.Group;
  const leftShin = leftThigh.getObjectByName("left-shin") as THREE.Group;
  const rightShin = rightThigh.getObjectByName("right-shin") as THREE.Group;
  const leftFoot = leftThigh.getObjectByName("left-foot") as THREE.Group;
  const rightFoot = rightThigh.getObjectByName("right-foot") as THREE.Group;

  return {
    root,
    slope,
    heading,
    body,
    torso,
    head,
    hood,
    skirt,
    leftUpperArm,
    leftForearm,
    rightUpperArm,
    rightForearm,
    leftThigh,
    leftShin,
    leftFoot,
    rightThigh,
    rightShin,
    rightFoot,
    materials: Object.values(materials),
    geometries,
  };
}

function buildArm(
  parent: THREE.Group,
  geometries: THREE.BufferGeometry[],
  materials: SnowflowCharacterMaterialSet,
  side: -1 | 1,
  name: "left" | "right",
): THREE.Group {
  const upperArm = new THREE.Group();
  upperArm.name = `${name}-upper-arm`;
  upperArm.position.set(side * 0.185, 1.4, 0);
  parent.add(upperArm);

  addMesh(
    upperArm,
    geometries,
    new THREE.CylinderGeometry(0.05, 0.065, 0.285, 14, 3, false),
    materials.robe,
    side * 0.022,
    -0.14,
    0,
  ).rotation.z = side * -0.16;

  const forearm = new THREE.Group();
  forearm.name = `${name}-forearm`;
  forearm.position.set(side * 0.045, -0.278, 0);
  upperArm.add(forearm);
  addMesh(
    forearm,
    geometries,
    new THREE.CylinderGeometry(0.042, 0.052, 0.265, 14, 3, false),
    materials.robe,
    side * 0.006,
    -0.13,
    0.01,
  );

  const cuff = addMesh(
    forearm,
    geometries,
    new THREE.TorusGeometry(0.055, 0.018, 6, 16),
    materials.fur,
    0,
    -0.245,
    0.012,
  );
  cuff.rotation.x = Math.PI * 0.5;

  const hand = addMesh(
    forearm,
    geometries,
    new THREE.SphereGeometry(0.046, 12, 8),
    materials.leather,
    0,
    -0.31,
    0.025,
  );
  hand.scale.set(0.9, 1.2, 0.82);
  return upperArm;
}

function buildLeg(
  parent: THREE.Group,
  geometries: THREE.BufferGeometry[],
  materials: SnowflowCharacterMaterialSet,
  side: -1 | 1,
  name: "left" | "right",
): THREE.Group {
  const thigh = new THREE.Group();
  thigh.name = `${name}-thigh`;
  thigh.position.set(side * 0.1, 0.9, 0);
  parent.add(thigh);
  addMesh(
    thigh,
    geometries,
    new THREE.CylinderGeometry(0.086, 0.112, 0.44, 14, 4, false),
    materials.robe,
    0,
    -0.22,
    0,
  );

  const shin = new THREE.Group();
  shin.name = `${name}-shin`;
  shin.position.set(0, -0.44, 0);
  thigh.add(shin);
  addMesh(
    shin,
    geometries,
    new THREE.CylinderGeometry(0.072, 0.086, 0.37, 14, 4, false),
    materials.robe,
    0,
    -0.185,
    0,
  );

  const foot = new THREE.Group();
  foot.name = `${name}-foot`;
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
