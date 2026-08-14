import * as THREE from "three";
import type { ActorRigInstance } from "../../actor/rig/ActorRigInstance";
import type { HumanoidRigBones } from "../rig/HumanoidRigBones";
import {
  HUMANOID_ANKLE_OFFSET_Y,
  HUMANOID_ELBOW_OFFSET_Y,
  HUMANOID_KNEE_OFFSET_Y,
  HUMANOID_WRIST_OFFSET_Y,
} from "../rig/HumanoidRigTuning";

export interface ProxyHumanoidBody {
  readonly geometries: THREE.BufferGeometry[];
  readonly materials: THREE.Material[];
}

/**
 * A plain rigid body for non-player humanoid actors.
 *
 * The extensibility proof is about the animation layer, not about art, so this
 * is deliberately simple geometry attached to the shared humanoid bones. Every
 * geometry and material is created per instance and owned by the actor, which
 * is what makes disposing one NPC safe while others keep rendering.
 */
export function buildProxyHumanoidBody(
  rigInstance: ActorRigInstance,
  bones: HumanoidRigBones,
): ProxyHumanoidBody {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const cloth = new THREE.MeshLambertMaterial({ color: 0x4a5c74 });
  const skin = new THREE.MeshLambertMaterial({ color: 0xc9a583 });
  materials.push(cloth, skin);

  attach(rigInstance, bones.chest, geometries, cloth, cylinder(0.15, 0.18, 0.46), 0, 0.2, 0);
  attach(rigInstance, bones.head, geometries, skin, new THREE.SphereGeometry(0.11, 14, 10), 0, 0, 0.01);

  for (const [upperArm, forearm, hand] of [
    [bones.upperArmLeft, bones.forearmLeft, bones.handLeft],
    [bones.upperArmRight, bones.forearmRight, bones.handRight],
  ] as const) {
    attach(rigInstance, upperArm, geometries, cloth, cylinder(0.05, 0.062, 0.3), 0, HUMANOID_ELBOW_OFFSET_Y * 0.5, 0);
    attach(rigInstance, forearm, geometries, cloth, cylinder(0.042, 0.05, 0.28), 0, HUMANOID_WRIST_OFFSET_Y * 0.5, 0);
    attach(rigInstance, hand, geometries, skin, new THREE.SphereGeometry(0.048, 10, 8), 0, -0.055, 0.02);
  }

  for (const [thigh, shin, foot] of [
    [bones.thighLeft, bones.shinLeft, bones.footLeft],
    [bones.thighRight, bones.shinRight, bones.footRight],
  ] as const) {
    attach(rigInstance, thigh, geometries, cloth, cylinder(0.078, 0.098, 0.44), 0, HUMANOID_KNEE_OFFSET_Y * 0.5, 0);
    attach(rigInstance, shin, geometries, cloth, cylinder(0.063, 0.078, 0.37), 0, HUMANOID_ANKLE_OFFSET_Y * 0.5, 0);
    attach(rigInstance, foot, geometries, cloth, new THREE.BoxGeometry(0.12, 0.09, 0.26), 0, -0.045, 0.07);
  }

  return { geometries, materials };
}

function cylinder(
  topRadius: number,
  bottomRadius: number,
  height: number,
): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(topRadius, bottomRadius, height, 10, 1, false);
}

function attach(
  rigInstance: ActorRigInstance,
  bone: number,
  geometries: THREE.BufferGeometry[],
  material: THREE.Material,
  geometry: THREE.BufferGeometry,
  x: number,
  y: number,
  z: number,
): void {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  rigInstance.attach(bone, mesh);
  geometries.push(geometry);
}
