import * as THREE from "three";
import type { ActorAnimationInput } from "../../actor/animation/ActorAnimationInput";
import type { ActorLocomotionLayer } from "../../actor/animation/ActorAnimationProfile";
import type { ActorGait } from "../../actor/animation/ActorGait";
import type { ActorPose } from "../../actor/animation/ActorPose";
import type { ActorEasing } from "../../actor/animation/ActorPoseBlender";
import type { HumanoidRigBones } from "../rig/HumanoidRigBones";
import {
  HUMANOID_APEX_VELOCITY_THRESHOLD,
  HUMANOID_ARM_BACKSWING_SCALE,
  HUMANOID_ARM_FORWARD_BIAS,
  HUMANOID_IDLE_BREATH_AMPLITUDE,
  HUMANOID_IDLE_BREATH_FREQUENCY,
  HUMANOID_IDLE_SPEED_THRESHOLD,
  HUMANOID_RUN_SPEED_FRACTION,
  HUMANOID_SHIN_SWING,
  HUMANOID_TAKEOFF_DURATION_SECONDS,
  HUMANOID_THIGH_SWING,
  HUMANOID_TRANSITION_AIRBORNE_SECONDS,
  HUMANOID_TRANSITION_DEFAULT_SECONDS,
  HUMANOID_TRANSITION_LANDING_SECONDS,
} from "./HumanoidLocomotionTuning";

/** Locomotion states, indexed. Nothing outside this family sees these values. */
export const HUMANOID_STATE_IDLE = 0;
export const HUMANOID_STATE_WALK = 1;
export const HUMANOID_STATE_RUN = 2;
export const HUMANOID_STATE_TAKEOFF = 3;
export const HUMANOID_STATE_RISE = 4;
export const HUMANOID_STATE_APEX = 5;
export const HUMANOID_STATE_FALL = 6;
export const HUMANOID_STATE_LAND = 7;

const STATE_NAMES = [
  "idle",
  "walk",
  "run",
  "takeoff",
  "rise",
  "apex",
  "fall",
  "land",
] as const;

/**
 * Jump and landing facts the humanoid family adds to the shared snapshot.
 *
 * These are one-frame impulses owned by whatever moves the actor — the player
 * controller, or an NPC's own movement — and are deliberately not part of the
 * universal {@link ActorAnimationInput}.
 */
export interface HumanoidLocomotionFacts {
  jumpStarted: boolean;
  landed: boolean;
  landingImpact: number;
}

export function createHumanoidLocomotionFacts(): HumanoidLocomotionFacts {
  return { jumpStarted: false, landed: false, landingImpact: 0 };
}

/**
 * The player's shipped gait, ported onto pose buffers.
 *
 * The equations are unchanged from the pivot-group implementation; what changed
 * is that they write into an {@link ActorPose} instead of setting rotations on
 * render objects. Torso lean is still applied at the chest alone rather than
 * distributed down the new spine chain, so this migration reproduces the
 * recorded baseline instead of restyling the walk.
 */
export class HumanoidLocomotionLayer implements ActorLocomotionLayer {
  readonly stateCount = STATE_NAMES.length;
  private animationTime = 0;
  private landingStrength = 0;

  constructor(
    private readonly bones: HumanoidRigBones,
    private readonly facts: HumanoidLocomotionFacts,
    private readonly landingRecoverySeconds: number,
  ) {}

  stateName(state: number): string {
    return STATE_NAMES[state] ?? "idle";
  }

  selectState(
    input: ActorAnimationInput,
    currentState: number,
    stateTimeSeconds: number,
  ): number {
    if (this.facts.landed) {
      this.landingStrength = this.facts.landingImpact;
      return HUMANOID_STATE_LAND;
    }
    if (this.facts.jumpStarted) {
      return HUMANOID_STATE_TAKEOFF;
    }
    if (
      currentState === HUMANOID_STATE_TAKEOFF &&
      stateTimeSeconds < HUMANOID_TAKEOFF_DURATION_SECONDS
    ) {
      return HUMANOID_STATE_TAKEOFF;
    }
    if (!input.grounded) {
      if (input.verticalVelocity > HUMANOID_APEX_VELOCITY_THRESHOLD) {
        return HUMANOID_STATE_RISE;
      }
      if (input.verticalVelocity < -HUMANOID_APEX_VELOCITY_THRESHOLD) {
        return HUMANOID_STATE_FALL;
      }
      return HUMANOID_STATE_APEX;
    }
    if (
      currentState === HUMANOID_STATE_LAND &&
      stateTimeSeconds < this.landingRecoverySeconds
    ) {
      return HUMANOID_STATE_LAND;
    }
    if (input.speed < HUMANOID_IDLE_SPEED_THRESHOLD) {
      return HUMANOID_STATE_IDLE;
    }
    if (input.speed > input.referenceSpeed * HUMANOID_RUN_SPEED_FRACTION) {
      return HUMANOID_STATE_RUN;
    }
    return HUMANOID_STATE_WALK;
  }

  transitionDuration(_fromState: number, toState: number): number {
    if (toState === HUMANOID_STATE_LAND) {
      return HUMANOID_TRANSITION_LANDING_SECONDS;
    }
    if (
      toState === HUMANOID_STATE_TAKEOFF ||
      toState === HUMANOID_STATE_RISE ||
      toState === HUMANOID_STATE_APEX ||
      toState === HUMANOID_STATE_FALL
    ) {
      return HUMANOID_TRANSITION_AIRBORNE_SECONDS;
    }
    return HUMANOID_TRANSITION_DEFAULT_SECONDS;
  }

  transitionEasing(_fromState: number, toState: number): ActorEasing {
    return toState === HUMANOID_STATE_LAND ? "easeOut" : "smooth";
  }

  reset(): void {
    this.animationTime = 0;
    this.landingStrength = 0;
  }

  generatePose(
    input: ActorAnimationInput,
    state: number,
    stateTimeSeconds: number,
    gait: ActorGait,
    target: ActorPose,
  ): void {
    const bones = this.bones;
    const speed01 = THREE.MathUtils.clamp(input.normalizedSpeed, 0, 1);
    const moving = THREE.MathUtils.smoothstep(speed01, 0.015, 0.12);
    const stridePhase = gait.getPhase() * Math.PI * 2;
    const stride = Math.sin(stridePhase);
    const oppositeStride = Math.sin(stridePhase + Math.PI);
    const doubleStep = 0.5 - 0.5 * Math.cos(stridePhase * 2);
    const gaitBlend =
      input.grounded && state !== HUMANOID_STATE_LAND
        ? moving * (0.35 + speed01 * 0.65)
        : 0;
    const accelerationLean = THREE.MathUtils.clamp(
      input.acceleration / 20,
      -0.18,
      0.32,
    );

    let leftThighX = oppositeStride * HUMANOID_THIGH_SWING * gaitBlend;
    let rightThighX = stride * HUMANOID_THIGH_SWING * gaitBlend;
    let leftShinX = Math.max(0, stride) * HUMANOID_SHIN_SWING * gaitBlend;
    let rightShinX =
      Math.max(0, oppositeStride) * HUMANOID_SHIN_SWING * gaitBlend;
    let leftArmX = armSwing(stride, gaitBlend);
    let rightArmX = armSwing(oppositeStride, gaitBlend);
    let leftArmZ = 0;
    let rightArmZ = 0;
    let forearmX = -0.12;
    let wristX = 0;
    let torsoX = 0.055 * speed01 + accelerationLean;
    const torsoZ = -stride * 0.035 * gaitBlend;
    let pelvisY =
      -doubleStep * 0.032 * gaitBlend +
      Math.sin(this.animationTime * HUMANOID_IDLE_BREATH_FREQUENCY) *
        HUMANOID_IDLE_BREATH_AMPLITUDE *
        (1 - moving);
    let skirtX = -stride * 0.025 * gaitBlend;
    const skirtZ = stride * 0.018 * gaitBlend;

    if (state === HUMANOID_STATE_TAKEOFF) {
      const phase = THREE.MathUtils.clamp(
        stateTimeSeconds / HUMANOID_TAKEOFF_DURATION_SECONDS,
        0,
        1,
      );
      const crouch = Math.sin(phase * Math.PI) * 0.72;
      pelvisY -= crouch * 0.1;
      leftThighX += crouch * 0.42;
      rightThighX += crouch * 0.42;
      leftShinX += crouch * 0.72;
      rightShinX += crouch * 0.72;
      leftArmX -= crouch * 0.55;
      rightArmX -= crouch * 0.55;
      torsoX += crouch * 0.16;
    } else if (state === HUMANOID_STATE_RISE) {
      leftThighX = 0.48;
      rightThighX = 0.28;
      leftShinX = 0.52;
      rightShinX = 0.4;
      leftArmX = -0.5;
      rightArmX = -0.5;
      leftArmZ = -0.18;
      rightArmZ = 0.18;
      forearmX = -0.34;
      torsoX = 0.08;
      skirtX = -0.08;
    } else if (state === HUMANOID_STATE_APEX) {
      leftThighX = 0.32;
      rightThighX = 0.32;
      leftShinX = 0.56;
      rightShinX = 0.56;
      leftArmX = -0.18;
      rightArmX = -0.18;
      leftArmZ = -0.32;
      rightArmZ = 0.32;
      forearmX = -0.2;
      torsoX = 0.02;
      pelvisY += 0.025;
    } else if (state === HUMANOID_STATE_FALL) {
      leftThighX = -0.08;
      rightThighX = -0.08;
      leftShinX = 0.16;
      rightShinX = 0.16;
      leftArmX = 0.16;
      rightArmX = 0.16;
      leftArmZ = -0.12;
      rightArmZ = 0.12;
      forearmX = -0.05;
      wristX = 0.12;
      torsoX = -0.03;
      skirtX = 0.08;
    } else if (state === HUMANOID_STATE_LAND) {
      const recovery = Math.max(this.landingRecoverySeconds, 0.01);
      const phase = THREE.MathUtils.clamp(stateTimeSeconds / recovery, 0, 1);
      const crouch = Math.sin(phase * Math.PI) * this.landingStrength;
      pelvisY -= crouch * 0.13;
      leftThighX = crouch * 0.5;
      rightThighX = crouch * 0.5;
      leftShinX = crouch * 0.82;
      rightShinX = crouch * 0.82;
      leftArmX = -crouch * 0.28;
      rightArmX = -crouch * 0.28;
      leftArmZ = -crouch * 0.1;
      rightArmZ = crouch * 0.1;
      torsoX = crouch * 0.18;
      skirtX = -crouch * 0.08;
    }

    target.resetToBind();
    target.setTranslation(bones.pelvis, 0, pelvisY, 0);
    target.setEuler(bones.chest, torsoX, 0, torsoZ);
    target.setEuler(bones.thighLeft, leftThighX, 0, 0);
    target.setEuler(bones.thighRight, rightThighX, 0, 0);
    target.setEuler(bones.shinLeft, leftShinX, 0, 0);
    target.setEuler(bones.shinRight, rightShinX, 0, 0);
    target.setEuler(
      bones.footLeft,
      -leftThighX * 0.22 - leftShinX * 0.5,
      0,
      0,
    );
    target.setEuler(
      bones.footRight,
      -rightThighX * 0.22 - rightShinX * 0.5,
      0,
      0,
    );
    target.setEuler(bones.upperArmLeft, leftArmX, 0, leftArmZ);
    target.setEuler(bones.upperArmRight, rightArmX, 0, rightArmZ);
    target.setEuler(bones.forearmLeft, forearmX, 0, 0);
    target.setEuler(bones.forearmRight, forearmX, 0, 0);
    target.setEuler(bones.handLeft, wristX, 0, 0);
    target.setEuler(bones.handRight, wristX, 0, 0);
    target.setEuler(bones.skirt, skirtX, 0, skirtZ);
  }

  /** Advances the idle breathing clock. Called once per frame by the profile. */
  advanceTime(deltaSeconds: number): void {
    this.animationTime += deltaSeconds;
  }
}

function armSwing(stride: number, gaitBlend: number): number {
  const swing = stride * 0.5 * gaitBlend;
  return (
    (swing > 0 ? swing * HUMANOID_ARM_BACKSWING_SCALE : swing) -
    HUMANOID_ARM_FORWARD_BIAS * gaitBlend
  );
}
