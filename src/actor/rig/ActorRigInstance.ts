import * as THREE from "three";
import type { ActorRigDefinition } from "./ActorRigDefinition";

/**
 * The live Three.js representation of one actor.
 *
 * Many actors of a species share one immutable {@link ActorRigDefinition};
 * each owns its own instance. The instance owns its bones, its skeleton, and
 * its sockets, and nothing else — meshes attached to it belong to whoever
 * attached them, so disposing one actor can never free geometry another actor
 * is still drawing.
 *
 * It reads no input, samples no terrain, and decides no locomotion.
 */
export class ActorRigInstance {
  readonly definition: ActorRigDefinition;
  /** Bone objects indexed exactly as the definition indexes them. */
  readonly bones: readonly THREE.Bone[];
  /** Root bone of the hierarchy, parented to the caller's placement object. */
  readonly rootBone: THREE.Bone;
  readonly skeleton: THREE.Skeleton;
  private readonly sockets = new Map<string, THREE.Object3D>();
  private disposed = false;

  constructor(definition: ActorRigDefinition, parent: THREE.Object3D) {
    this.definition = definition;
    const bones: THREE.Bone[] = [];
    for (let index = 0; index < definition.boneCount; index += 1) {
      const bone = new THREE.Bone();
      bone.name = definition.bones[index].name;
      bone.position.set(
        definition.bindPositions[index * 3],
        definition.bindPositions[index * 3 + 1],
        definition.bindPositions[index * 3 + 2],
      );
      bone.quaternion.set(
        definition.bindRotations[index * 4],
        definition.bindRotations[index * 4 + 1],
        definition.bindRotations[index * 4 + 2],
        definition.bindRotations[index * 4 + 3],
      );
      const parentIndex = definition.parents[index];
      if (parentIndex >= 0) {
        bones[parentIndex].add(bone);
      }
      bones.push(bone);
    }
    this.bones = bones;
    this.rootBone = bones[0];
    parent.add(this.rootBone);

    for (const [key, socket] of definition.sockets) {
      const object = new THREE.Object3D();
      object.name = `socket:${key}`;
      object.position.set(
        socket.positionX,
        socket.positionY,
        socket.positionZ,
      );
      object.rotation.set(
        socket.rotationX,
        socket.rotationY,
        socket.rotationZ,
      );
      bones[socket.parent].add(object);
      this.sockets.set(key, object);
    }

    this.rootBone.updateMatrixWorld(true);
    this.skeleton = new THREE.Skeleton(bones);
  }

  getBone(index: number): THREE.Bone {
    const bone = this.bones[index];
    if (bone === undefined) {
      throw new Error(
        `Actor rig "${this.definition.name}" has no bone at index ${index}.`,
      );
    }
    return bone;
  }

  /**
   * Resolves a documented socket. Effect and gameplay systems must request the
   * sockets they need rather than fall back to the world origin.
   */
  requireSocket(key: string): THREE.Object3D {
    const socket = this.sockets.get(key);
    if (socket === undefined) {
      throw new Error(
        `Actor rig "${this.definition.name}" does not provide socket "${key}".`,
      );
    }
    return socket;
  }

  findSocket(key: string): THREE.Object3D | undefined {
    return this.sockets.get(key);
  }

  /** Attaches a rigid mesh or accessory to a bone. The caller keeps ownership. */
  attach(boneIndex: number, object: THREE.Object3D): void {
    this.getBone(boneIndex).add(object);
  }

  /**
   * Writes a pose's local transforms onto the bones.
   *
   * Translation is only read for bones the definition permits it on, so a
   * profile cannot accidentally slide a joint that is meant to be a pure
   * rotation.
   */
  applyPose(rotations: Float32Array, translations: Float32Array): void {
    const { boneCount, bindPositions, translatableFlags, secondaryFlags } =
      this.definition;
    for (let index = 0; index < boneCount; index += 1) {
      if (secondaryFlags[index] === 1) {
        // Cape, hair, and skirt panels belong to their secondary-motion module,
        // which runs after the pose is applied. Writing them here would only
        // fight it.
        continue;
      }
      const bone = this.bones[index];
      const rotationBase = index * 4;
      bone.quaternion.set(
        rotations[rotationBase],
        rotations[rotationBase + 1],
        rotations[rotationBase + 2],
        rotations[rotationBase + 3],
      );
      const positionBase = index * 3;
      if (translatableFlags[index] === 1) {
        bone.position.set(
          bindPositions[positionBase] + translations[positionBase],
          bindPositions[positionBase + 1] + translations[positionBase + 1],
          bindPositions[positionBase + 2] + translations[positionBase + 2],
        );
      }
    }
  }

  /** Refreshes bone and socket world matrices once, after the pose is applied. */
  updateWorldMatrices(): void {
    this.rootBone.updateMatrixWorld(true);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.rootBone.removeFromParent();
    this.sockets.clear();
    this.skeleton.dispose();
  }
}
