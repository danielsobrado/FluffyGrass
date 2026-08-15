import * as THREE from "three";
import type { ActorBoneIndex } from "../../actor/rig/ActorBoneIndex";
import type { ActorRigInstance } from "../../actor/rig/ActorRigInstance";
import type {
  QuadrupedBodyBuilder,
  QuadrupedBodyHandle,
} from "../quadruped/QuadrupedBodyContract";
import type { QuadrupedRigBones } from "../quadruped/QuadrupedRigDefinition";
import type { DeerAssets } from "./DeerAssets";
import type { DeerPartSlot, DeerVariant } from "./DeerGeometry";

/**
 * Dresses the shared four-legged skeleton as one particular deer.
 *
 * The actor receives this as a closure and never learns what a deer is. Coat
 * tint and variant are decided by whoever composes the herd, which is what lets
 * one library of geometry produce a stag, two does and a fawn that all look
 * related but not identical.
 */
export function createDeerBodyBuilder(
  assets: DeerAssets,
  variant: DeerVariant,
  tint: THREE.Color,
  shadows: boolean,
): QuadrupedBodyBuilder {
  return (rigInstance, bones) => {
    const material = assets.createMaterial(tint);
    const meshes = attachDeerMeshes(
      rigInstance,
      bones,
      assets,
      variant,
      material,
      shadows,
    );
    return {
      meshes,
      // Only the material: the merged buffers are the library's, and the next
      // deer to spawn is still drawing them.
      dispose: () => material.dispose(),
    } satisfies QuadrupedBodyHandle;
  };
}

/**
 * Hangs one merged mesh on each bone that carries geometry.
 *
 * Every offset is already baked into the merged buffers, so each mesh sits at
 * its bone's origin.
 */
function attachDeerMeshes(
  rigInstance: ActorRigInstance,
  bones: QuadrupedRigBones,
  assets: DeerAssets,
  variant: DeerVariant,
  material: THREE.Material,
  shadows: boolean,
): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  const place = (slot: DeerPartSlot, bone: ActorBoneIndex): void => {
    const mesh = new THREE.Mesh(assets.geometryFor(variant, slot), material);
    // Shadow casting is a per-actor decision the world makes from the device
    // profile and the animal's distance, not something the body asserts.
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
    rigInstance.attach(bone, mesh);
    meshes.push(mesh);
  };

  place("body", bones.bodyCenter);
  place("neck", bones.neck);
  place("head", bones.head);
  if (bones.ears.length === 2) {
    place("earLeft", bones.ears[0]);
    place("earRight", bones.ears[1]);
  }

  const tailSlots: DeerPartSlot[] = ["tailBase", "tailMid", "tailTip"];
  for (let index = 0; index < bones.tail.length; index += 1) {
    place(tailSlots[Math.min(index, tailSlots.length - 1)], bones.tail[index]);
  }

  for (let side = 0; side < 2; side += 1) {
    place("frontUpper", bones.frontUpper[side]);
    place("frontLower", bones.frontLower[side]);
    place("frontHoof", bones.frontPaw[side]);
    place("hindUpper", bones.hindUpper[side]);
    place("hindLower", bones.hindLower[side]);
    place("hindHoof", bones.hindPaw[side]);
  }

  return meshes;
}
