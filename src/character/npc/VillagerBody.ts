import * as THREE from "three";
import type { ActorBoneIndex } from "../../actor/rig/ActorBoneIndex";
import type { ActorRigInstance } from "../../actor/rig/ActorRigInstance";
import type { HumanoidRigBones } from "../rig/HumanoidRigBones";
import type { VillagerAssets } from "./VillagerAssets";
import type { VillagerPartSlot } from "./VillagerGeometry";

export interface VillagerBody {
  readonly meshes: readonly THREE.Mesh[];
  dispose(): void;
}

/**
 * Hangs a villager on the shared humanoid skeleton.
 *
 * One material for the whole person, because the palette is baked into the
 * vertices. Geometry belongs to the library and is never disposed here.
 */
export function buildVillagerBody(
  rigInstance: ActorRigInstance,
  bones: HumanoidRigBones,
  assets: VillagerAssets,
  variant: number,
  shadows: boolean,
): VillagerBody {
  const material = assets.createMaterial();
  const meshes: THREE.Mesh[] = [];
  const place = (slot: VillagerPartSlot, bone: ActorBoneIndex): void => {
    const mesh = new THREE.Mesh(assets.geometryFor(variant, slot), material);
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
    rigInstance.attach(bone, mesh);
    meshes.push(mesh);
  };

  place("pelvis", bones.pelvis);
  place("chest", bones.chest);
  place("head", bones.head);

  for (const [upperArm, forearm] of [
    [bones.upperArmLeft, bones.forearmLeft],
    [bones.upperArmRight, bones.forearmRight],
  ] as const) {
    place("upperArm", upperArm);
    place("forearm", forearm);
  }
  for (const [thigh, shin, foot] of [
    [bones.thighLeft, bones.shinLeft, bones.footLeft],
    [bones.thighRight, bones.shinRight, bones.footRight],
  ] as const) {
    place("thigh", thigh);
    place("shin", shin);
    place("boot", foot);
  }

  // Cloth bones are optional on a humanoid rig — an imported skeleton has none.
  // The tabard is simply absent rather than faked onto another joint.
  const tabardBone = bones.skirtFront ?? bones.skirt;
  if (tabardBone !== undefined) {
    place("tabard", tabardBone);
  }

  return { meshes, dispose: () => material.dispose() };
}
