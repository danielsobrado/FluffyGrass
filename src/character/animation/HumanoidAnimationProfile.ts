import type {
  ActorAnimationProfile,
  ActorPoseStage,
  ActorSecondaryMotion,
} from "../../actor/animation/ActorAnimationProfile";
import { ActorGait } from "../../actor/animation/ActorGait";
import type { ActorRigDefinition } from "../../actor/rig/ActorRigDefinition";
import type { HumanoidRigBones } from "../rig/HumanoidRigBones";
import {
  createHumanoidLocomotionFacts,
  HumanoidLocomotionLayer,
  type HumanoidLocomotionFacts,
} from "./HumanoidLocomotionLayer";
import {
  HUMANOID_STANCE_DUTY_FACTOR,
  HUMANOID_STRIDE_LENGTH_METERS,
} from "./HumanoidLocomotionTuning";

export interface HumanoidAnimationProfileOptions {
  readonly definition: ActorRigDefinition;
  readonly bones: HumanoidRigBones;
  readonly landingRecoverySeconds: number;
  /**
   * The jump and landing facts this actor's mover writes into. Callers create
   * it first when a secondary module needs to read the same impulses.
   */
  readonly facts?: HumanoidLocomotionFacts;
  readonly secondaryMotion?: readonly ActorSecondaryMotion[];
  readonly ikStages?: readonly ActorPoseStage[];
}

/**
 * Everything a humanoid actor installs on the shared runtime.
 *
 * The player and any humanoid NPC build this the same way. What differs between
 * them is which stages and secondary modules they pass in — an NPC with no cape
 * simply supplies no cloth module, rather than disabling one.
 */
export interface HumanoidAnimationProfile extends ActorAnimationProfile {
  readonly locomotion: HumanoidLocomotionLayer;
  readonly facts: HumanoidLocomotionFacts;
}

export function createHumanoidAnimationProfile(
  options: HumanoidAnimationProfileOptions,
): HumanoidAnimationProfile {
  const facts = options.facts ?? createHumanoidLocomotionFacts();
  const locomotion = new HumanoidLocomotionLayer(
    options.bones,
    facts,
    options.landingRecoverySeconds,
  );
  // Two feet, phase-opposed. The same gait object with a four-entry table is
  // what a quadruped walks on.
  const gait = new ActorGait({
    strideLengthMeters: HUMANOID_STRIDE_LENGTH_METERS,
    effectors: [
      { phaseOffset: 0, dutyFactor: HUMANOID_STANCE_DUTY_FACTOR },
      { phaseOffset: 0.5, dutyFactor: HUMANOID_STANCE_DUTY_FACTOR },
    ],
  });
  return {
    definition: options.definition,
    locomotion,
    gait,
    facts,
    ikStages: options.ikStages,
    secondaryMotion: options.secondaryMotion,
    enforceJointLimits: true,
  };
}
