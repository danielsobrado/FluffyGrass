import type { ActorBoneIndex } from "../../actor/rig/ActorBoneIndex";

/**
 * Resolved bone indexes for the humanoid topology.
 *
 * Every humanoid actor — the player and any humanoid NPC — shares one immutable
 * rig definition, so these indexes are resolved once when the definition is
 * built and then stored directly. No animation frame looks a bone up by name.
 */
export interface HumanoidRigBones {
  readonly actorRoot: ActorBoneIndex;
  readonly pelvis: ActorBoneIndex;
  readonly spineLower: ActorBoneIndex;
  readonly spineUpper: ActorBoneIndex;
  readonly chest: ActorBoneIndex;
  readonly neck: ActorBoneIndex;
  readonly head: ActorBoneIndex;
  readonly hairLeft: ActorBoneIndex;
  readonly hairRight: ActorBoneIndex;
  readonly hood: ActorBoneIndex;
  readonly cloakBack: ActorBoneIndex;
  readonly cloakLeft: ActorBoneIndex;
  readonly cloakRight: ActorBoneIndex;
  readonly clavicleLeft: ActorBoneIndex;
  readonly upperArmLeft: ActorBoneIndex;
  readonly forearmLeft: ActorBoneIndex;
  readonly handLeft: ActorBoneIndex;
  readonly clavicleRight: ActorBoneIndex;
  readonly upperArmRight: ActorBoneIndex;
  readonly forearmRight: ActorBoneIndex;
  readonly handRight: ActorBoneIndex;
  readonly skirt: ActorBoneIndex;
  readonly skirtFront: ActorBoneIndex;
  readonly skirtLeft: ActorBoneIndex;
  readonly skirtRight: ActorBoneIndex;
  readonly thighLeft: ActorBoneIndex;
  readonly shinLeft: ActorBoneIndex;
  readonly footLeft: ActorBoneIndex;
  readonly toeLeft: ActorBoneIndex;
  readonly thighRight: ActorBoneIndex;
  readonly shinRight: ActorBoneIndex;
  readonly footRight: ActorBoneIndex;
  readonly toeRight: ActorBoneIndex;
}

/** Chain names the humanoid profile solves. */
export const HUMANOID_CHAIN_LEG_LEFT = "leg.L";
export const HUMANOID_CHAIN_LEG_RIGHT = "leg.R";
export const HUMANOID_CHAIN_ARM_LEFT = "arm.L";
export const HUMANOID_CHAIN_ARM_RIGHT = "arm.R";

/** Contact effector names, consumed by gait and contact IK. */
export const HUMANOID_EFFECTOR_FOOT_LEFT = "foot.L";
export const HUMANOID_EFFECTOR_FOOT_RIGHT = "foot.R";

/** Mask names the humanoid profile resolves once at initialization. */
export const HUMANOID_MASK_FULL_BODY = "fullBody";
export const HUMANOID_MASK_LOWER_BODY = "lowerBody";
export const HUMANOID_MASK_UPPER_BODY = "upperBody";
export const HUMANOID_MASK_LEFT_ARM = "leftArm";
export const HUMANOID_MASK_RIGHT_ARM = "rightArm";
export const HUMANOID_MASK_HEAD_NECK = "headNeck";
