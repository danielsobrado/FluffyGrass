import { isNormalizedQuaternion } from "../math/ActorTransformMath";
import {
  ACTOR_MAX_BONE_COUNT,
  ACTOR_NO_BONE,
  isActorBoneIndex,
} from "./ActorBoneIndex";
import { isActorJointLimitOrdered } from "./ActorJointLimits";
import type { ActorRigDefinition } from "./ActorRigDefinition";

/**
 * Structural validation for a rig definition.
 *
 * A malformed rig must fail here, at initialization, rather than animate a
 * missing joint or hand a solver an impossible chain. Nothing in this module
 * knows about humanoids.
 */
export function validateActorRigDefinition(
  definition: ActorRigDefinition,
): void {
  const { name, boneCount, bones, parents } = definition;

  function fail(message: string): never {
    throw new Error(`Actor rig "${name}" is invalid: ${message}`);
  }

  if (!Number.isInteger(boneCount) || boneCount <= 0) {
    fail("bone count must be a positive integer.");
  }
  if (boneCount > ACTOR_MAX_BONE_COUNT) {
    fail(`bone count ${boneCount} exceeds the ${ACTOR_MAX_BONE_COUNT} limit.`);
  }
  if (bones.length !== boneCount || parents.length !== boneCount) {
    fail("bone table and parent table lengths disagree.");
  }
  if (definition.bindPositions.length !== boneCount * 3) {
    fail("bind position buffer does not match the bone count.");
  }
  if (definition.bindRotations.length !== boneCount * 4) {
    fail("bind rotation buffer does not match the bone count.");
  }
  if (
    definition.translatableFlags.length !== boneCount ||
    definition.secondaryFlags.length !== boneCount
  ) {
    fail("packed bone flag buffers do not match the bone count.");
  }

  const seenNames = new Set<string>();
  let rootCount = 0;
  for (let bone = 0; bone < boneCount; bone += 1) {
    const definitionBone = bones[bone];
    if (definitionBone.name.length === 0) {
      fail(`bone ${bone} has no name.`);
    }
    if (seenNames.has(definitionBone.name)) {
      fail(`bone name "${definitionBone.name}" is used more than once.`);
    }
    seenNames.add(definitionBone.name);

    const parent = parents[bone];
    if (parent === ACTOR_NO_BONE) {
      rootCount += 1;
    } else if (!isActorBoneIndex(parent, boneCount)) {
      fail(`bone "${definitionBone.name}" has an out-of-range parent.`);
    } else if (parent >= bone) {
      // Parents-first ordering is what makes the hierarchy provably acyclic and
      // lets every hierarchy walk be one forward pass.
      fail(
        `bone "${definitionBone.name}" is ordered before its parent, so the hierarchy is not a topologically sorted tree.`,
      );
    }

    for (let axis = 0; axis < 3; axis += 1) {
      if (!Number.isFinite(definition.bindPositions[bone * 3 + axis])) {
        fail(`bone "${definitionBone.name}" has a non-finite bind position.`);
      }
    }
    if (!isNormalizedQuaternion(definition.bindRotations, bone)) {
      fail(`bone "${definitionBone.name}" has a denormalized bind rotation.`);
    }
  }
  if (rootCount !== 1) {
    fail(`expected exactly one structural root but found ${rootCount}.`);
  }

  for (const [role, bone] of definition.roles) {
    if (!isActorBoneIndex(bone, boneCount)) {
      fail(`role "${role}" resolves outside the bone range.`);
    }
  }

  for (const [chainName, chain] of definition.chains) {
    for (const [label, bone] of [
      ["root", chain.root],
      ["mid", chain.mid],
      ["end", chain.end],
    ] as const) {
      if (!isActorBoneIndex(bone, boneCount)) {
        fail(`chain "${chainName}" has an out-of-range ${label} bone.`);
      }
    }
    if (parents[chain.mid] !== chain.root) {
      fail(`chain "${chainName}" mid joint is not a child of its root.`);
    }
    if (parents[chain.end] !== chain.mid) {
      fail(`chain "${chainName}" end effector is not a child of its mid joint.`);
    }
    if (
      chain.terminal !== ACTOR_NO_BONE &&
      !isActorBoneIndex(chain.terminal, boneCount)
    ) {
      fail(`chain "${chainName}" has an out-of-range terminal bone.`);
    }
    if (!(chain.upperLength > 0) || !(chain.lowerLength > 0)) {
      fail(`chain "${chainName}" has a non-positive segment length.`);
    }
    if (Math.hypot(chain.poleX, chain.poleY, chain.poleZ) < 1e-6) {
      fail(`chain "${chainName}" has no usable bend-pole direction.`);
    }
    if (
      !(chain.minBendRadians <= chain.maxBendRadians) ||
      !Number.isFinite(chain.minBendRadians) ||
      !Number.isFinite(chain.maxBendRadians)
    ) {
      fail(`chain "${chainName}" has an invalid bend range.`);
    }
  }

  for (const [effectorName, effector] of definition.effectors) {
    if (!definition.chains.has(effector.chain)) {
      fail(`effector "${effectorName}" references an undeclared chain.`);
    }
    if (!Number.isFinite(effector.phaseOffset)) {
      fail(`effector "${effectorName}" has a non-finite phase offset.`);
    }
  }

  for (const [maskName, mask] of definition.masks) {
    if (mask.length !== boneCount) {
      fail(`mask "${maskName}" does not match the bone count.`);
    }
    for (let bone = 0; bone < boneCount; bone += 1) {
      const weight = mask[bone];
      if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
        fail(`mask "${maskName}" has a weight outside 0..1.`);
      }
    }
  }

  for (const [socketKey, socket] of definition.sockets) {
    if (!isActorBoneIndex(socket.parent, boneCount)) {
      fail(`socket "${socketKey}" has an out-of-range parent bone.`);
    }
    if (
      !Number.isFinite(socket.positionX) ||
      !Number.isFinite(socket.positionY) ||
      !Number.isFinite(socket.positionZ)
    ) {
      fail(`socket "${socketKey}" has a non-finite offset.`);
    }
  }

  for (const limit of definition.jointLimits) {
    if (!isActorBoneIndex(limit.bone, boneCount)) {
      fail("a joint limit references an out-of-range bone.");
    }
    if (!isActorJointLimitOrdered(limit)) {
      fail(`joint limit on "${bones[limit.bone].name}" is reversed or non-finite.`);
    }
  }
}
