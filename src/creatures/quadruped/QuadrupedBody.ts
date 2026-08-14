import * as THREE from "three";
import type { ActorRigInstance } from "../../actor/rig/ActorRigInstance";
import {
  QUADRUPED_BODY_HALF_LENGTH,
  QUADRUPED_LOWER_LIMB,
  QUADRUPED_UPPER_LIMB,
  type QuadrupedRigBones,
} from "./QuadrupedRigDefinition";

export interface QuadrupedBody {
  readonly geometries: THREE.BufferGeometry[];
  readonly materials: THREE.Material[];
}

/**
 * Rigid procedural geometry for the quadruped proof.
 *
 * Everything is attached directly to bones. The plan is explicit that the
 * animal proof should not gain skinning purely to demonstrate extensibility —
 * articulated rigid parts are enough to show four limbs planting correctly.
 */
export function buildQuadrupedBody(
  rigInstance: ActorRigInstance,
  bones: QuadrupedRigBones,
): QuadrupedBody {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const hide = new THREE.MeshLambertMaterial({ color: 0x8a6f4d });
  const dark = new THREE.MeshLambertMaterial({ color: 0x5c4630 });
  materials.push(hide, dark);

  const barrel = new THREE.CylinderGeometry(0.19, 0.17, QUADRUPED_BODY_HALF_LENGTH * 2.1, 12, 1, false);
  barrel.rotateX(Math.PI * 0.5);
  attach(rigInstance, bones.bodyCenter, geometries, hide, barrel, 0, 0, 0);
  attach(
    rigInstance,
    bones.neck,
    geometries,
    hide,
    tapered(0.11, 0.09, 0.2),
    0,
    0.07,
    0.07,
  );
  attach(rigInstance, bones.head, geometries, hide, new THREE.BoxGeometry(0.15, 0.14, 0.24), 0, 0, 0.07);
  attach(rigInstance, bones.head, geometries, dark, new THREE.BoxGeometry(0.09, 0.08, 0.1), 0, -0.02, 0.2);

  for (const segment of bones.tail) {
    attach(rigInstance, segment, geometries, dark, tapered(0.035, 0.025, 0.12), 0, 0, -0.06);
  }

  const limbs = [
    { upper: bones.frontUpper, lower: bones.frontLower, paw: bones.frontPaw },
    { upper: bones.hindUpper, lower: bones.hindLower, paw: bones.hindPaw },
  ];
  for (const limb of limbs) {
    for (let index = 0; index < 2; index += 1) {
      attach(
        rigInstance,
        limb.upper[index],
        geometries,
        hide,
        tapered(0.062, 0.05, QUADRUPED_UPPER_LIMB),
        0,
        -QUADRUPED_UPPER_LIMB * 0.5,
        0,
      );
      attach(
        rigInstance,
        limb.lower[index],
        geometries,
        hide,
        tapered(0.045, 0.036, QUADRUPED_LOWER_LIMB),
        0,
        -QUADRUPED_LOWER_LIMB * 0.5,
        0,
      );
      attach(
        rigInstance,
        limb.paw[index],
        geometries,
        dark,
        new THREE.BoxGeometry(0.075, 0.055, 0.11),
        0,
        -0.025,
        0.015,
      );
    }
  }

  return { geometries, materials };
}

function tapered(
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
