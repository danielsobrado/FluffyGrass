import * as THREE from "three";
import { CharacterSpring } from "./CharacterSpring";
import { addDrowCharacterFeatures } from "./DrowCharacterFeatures";
import {
  buildSnowflowCharacter,
  type SnowflowCharacterRig,
} from "./SnowflowCharacterGeometry";

const UP = new THREE.Vector3(0, 1, 0);
/** Metres of travel per full gait cycle. The grass trail stamps feet from it. */
export const STRIDE_LENGTH_METERS = 1.55;
const MAX_SLOPE_TILT_RADIANS = THREE.MathUtils.degToRad(18);
const TAKEOFF_DURATION_SECONDS = 0.11;
const APEX_VELOCITY_THRESHOLD = 1.15;
const SECONDARY_FREQUENCY = 2.8;
const HAIR_FREQUENCY = 3.6;
// A positive arm rotation swings the hand behind the hip, and the cloak side
// panels only sweep clear of the body once the character is running — so an
// even arc pushed the hands through the cloth at walking pace. Damp the back
// half of the swing and bias the whole arc forward instead of shortening it.
const ARM_BACKSWING_SCALE = 0.55;
const ARM_FORWARD_BIAS = 0.09;

type CharacterMotionState =
  | "idle"
  | "walk"
  | "run"
  | "takeoff"
  | "rise"
  | "apex"
  | "fall"
  | "land";

export interface SnowflowCharacterPose {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  groundNormal: THREE.Vector3;
  facing: number;
  speed: number;
  runSpeed: number;
  acceleration: number;
  distanceTravelled: number;
  grounded: boolean;
  verticalVelocity: number;
  jumpStarted: boolean;
  landed: boolean;
  landingImpact: number;
}

function armSwing(stride: number, gaitBlend: number): number {
  const swing = stride * 0.5 * gaitBlend;
  return (
    (swing > 0 ? swing * ARM_BACKSWING_SCALE : swing) -
    ARM_FORWARD_BIAS * gaitBlend
  );
}

export class SnowflowCharacter {
  private readonly rig: SnowflowCharacterRig;
  private readonly desiredSlope = new THREE.Quaternion();
  private readonly limitedNormal = new THREE.Vector3();
  private readonly cloakBackX = new CharacterSpring();
  private readonly cloakLeftX = new CharacterSpring();
  private readonly cloakRightX = new CharacterSpring();
  private readonly cloakLeftZ = new CharacterSpring();
  private readonly cloakRightZ = new CharacterSpring();
  private readonly hairLeftX = new CharacterSpring();
  private readonly hairRightX = new CharacterSpring();
  private readonly hairLeftZ = new CharacterSpring();
  private readonly hairRightZ = new CharacterSpring();
  private state: CharacterMotionState = "idle";
  private stateTime = 0;
  private animationTime = 0;
  private landingStrength = 0;

  constructor(
    scene: THREE.Scene,
    scale: number,
    private readonly landingRecoverySeconds: number,
  ) {
    this.rig = buildSnowflowCharacter(scene, scale);
    addDrowCharacterFeatures(this.rig);
  }

  update(deltaSeconds: number, pose: SnowflowCharacterPose): void {
    const delta = THREE.MathUtils.clamp(deltaSeconds, 0, 0.1);
    this.animationTime += delta;
    this.rig.root.position.copy(pose.position);
    this.rig.heading.rotation.y = pose.facing;
    this.updateState(delta, pose);
    this.updateSlope(pose.grounded ? pose.groundNormal : UP, delta);
    this.updateBodyPose(pose);
    this.updateSecondaryMotion(delta, pose);
  }

  dispose(): void {
    this.rig.root.removeFromParent();
    for (const geometry of this.rig.geometries) {
      geometry.dispose();
    }
    for (const material of this.rig.materials) {
      material.dispose();
    }
  }

  getState(): CharacterMotionState {
    return this.state;
  }

  private updateState(deltaSeconds: number, pose: SnowflowCharacterPose): void {
    this.stateTime += deltaSeconds;
    let next = this.state;

    if (pose.landed) {
      next = "land";
      this.landingStrength = pose.landingImpact;
    } else if (pose.jumpStarted) {
      next = "takeoff";
    } else if (
      this.state === "takeoff" &&
      this.stateTime < TAKEOFF_DURATION_SECONDS
    ) {
      next = "takeoff";
    } else if (!pose.grounded) {
      next =
        pose.verticalVelocity > APEX_VELOCITY_THRESHOLD
          ? "rise"
          : pose.verticalVelocity < -APEX_VELOCITY_THRESHOLD
            ? "fall"
            : "apex";
    } else if (
      this.state === "land" &&
      this.stateTime < this.landingRecoverySeconds
    ) {
      next = "land";
    } else if (pose.speed < 0.08) {
      next = "idle";
    } else if (pose.speed > pose.runSpeed * 0.72) {
      next = "run";
    } else {
      next = "walk";
    }

    if (next !== this.state) {
      this.state = next;
      this.stateTime = 0;
    }
  }

  private updateSlope(normal: THREE.Vector3, deltaSeconds: number): void {
    this.limitedNormal.copy(normal);
    const slopeAngle = Math.acos(
      THREE.MathUtils.clamp(this.limitedNormal.dot(UP), -1, 1),
    );
    if (slopeAngle > MAX_SLOPE_TILT_RADIANS) {
      this.limitedNormal
        .lerp(UP, 1 - MAX_SLOPE_TILT_RADIANS / slopeAngle)
        .normalize();
    }
    this.desiredSlope.setFromUnitVectors(UP, this.limitedNormal);
    const blend = 1 - Math.exp(-9 * deltaSeconds);
    this.rig.slope.quaternion.slerp(this.desiredSlope, blend);
  }

  private updateBodyPose(pose: SnowflowCharacterPose): void {
    const speed01 = THREE.MathUtils.clamp(pose.speed / pose.runSpeed, 0, 1);
    const moving = THREE.MathUtils.smoothstep(speed01, 0.015, 0.12);
    const stridePhase =
      ((pose.distanceTravelled / STRIDE_LENGTH_METERS) % 1) * Math.PI * 2;
    const stride = Math.sin(stridePhase);
    const oppositeStride = Math.sin(stridePhase + Math.PI);
    const doubleStep = 0.5 - 0.5 * Math.cos(stridePhase * 2);
    const gaitBlend =
      pose.grounded && this.state !== "land"
        ? moving * (0.35 + speed01 * 0.65)
        : 0;
    const accelerationLean = THREE.MathUtils.clamp(
      pose.acceleration / 20,
      -0.18,
      0.32,
    );

    let leftThighX = oppositeStride * 0.68 * gaitBlend;
    let rightThighX = stride * 0.68 * gaitBlend;
    let leftShinX = Math.max(0, stride) * 0.5 * gaitBlend;
    let rightShinX = Math.max(0, oppositeStride) * 0.5 * gaitBlend;
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
      Math.sin(this.animationTime * 1.7) * 0.004 * (1 - moving);
    let skirtX = -stride * 0.025 * gaitBlend;
    const skirtZ = stride * 0.018 * gaitBlend;

    if (this.state === "takeoff") {
      const phase = THREE.MathUtils.clamp(
        this.stateTime / TAKEOFF_DURATION_SECONDS,
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
    } else if (this.state === "rise") {
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
    } else if (this.state === "apex") {
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
    } else if (this.state === "fall") {
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
    } else if (this.state === "land") {
      const recovery = Math.max(this.landingRecoverySeconds, 0.01);
      const phase = THREE.MathUtils.clamp(this.stateTime / recovery, 0, 1);
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

    this.rig.body.position.y = pelvisY;
    this.rig.torso.rotation.set(torsoX, 0, torsoZ);
    this.rig.leftThigh.rotation.x = leftThighX;
    this.rig.rightThigh.rotation.x = rightThighX;
    this.rig.leftShin.rotation.x = leftShinX;
    this.rig.rightShin.rotation.x = rightShinX;
    this.rig.leftFoot.rotation.x = -leftThighX * 0.22 - leftShinX * 0.5;
    this.rig.rightFoot.rotation.x = -rightThighX * 0.22 - rightShinX * 0.5;
    this.rig.leftUpperArm.rotation.set(leftArmX, 0, leftArmZ);
    this.rig.rightUpperArm.rotation.set(rightArmX, 0, rightArmZ);
    this.rig.leftForearm.rotation.x = forearmX;
    this.rig.rightForearm.rotation.x = forearmX;
    this.rig.leftWrist.rotation.x = wristX;
    this.rig.rightWrist.rotation.x = wristX;
    this.rig.skirt.rotation.set(skirtX, 0, skirtZ);
  }

  private updateSecondaryMotion(
    deltaSeconds: number,
    pose: SnowflowCharacterPose,
  ): void {
    const sine = Math.sin(pose.facing);
    const cosine = Math.cos(pose.facing);
    const forwardVelocity = pose.velocity.x * sine + pose.velocity.z * cosine;
    const sideVelocity = pose.velocity.x * cosine - pose.velocity.z * sine;
    const forward01 = THREE.MathUtils.clamp(
      forwardVelocity / pose.runSpeed,
      -1,
      1,
    );
    const side01 = THREE.MathUtils.clamp(sideVelocity / pose.runSpeed, -1, 1);
    const vertical01 = THREE.MathUtils.clamp(pose.verticalVelocity / 9, -1, 1);

    if (pose.landed) {
      const impulse = pose.landingImpact * 1.8;
      this.cloakBackX.addImpulse(impulse);
      this.cloakLeftX.addImpulse(impulse * 0.9);
      this.cloakRightX.addImpulse(impulse * 0.9);
      this.hairLeftX.addImpulse(impulse * 0.45);
      this.hairRightX.addImpulse(impulse * 0.45);
    }

    // Cloak, hair and skirt panels all hang below their pivots, so a positive
    // X rotation is what sweeps them behind the character.
    const cloakTargetX = 0.035 + forward01 * 0.2 - vertical01 * 0.1;
    const sideTarget = -side01 * 0.14;
    this.rig.cloakBack.rotation.x = this.cloakBackX.update(
      cloakTargetX,
      deltaSeconds,
      SECONDARY_FREQUENCY,
      0.88,
    );
    this.rig.cloakLeft.rotation.x = this.cloakLeftX.update(
      cloakTargetX * 0.9,
      deltaSeconds,
      SECONDARY_FREQUENCY,
      0.86,
    );
    this.rig.cloakRight.rotation.x = this.cloakRightX.update(
      cloakTargetX * 0.9,
      deltaSeconds,
      SECONDARY_FREQUENCY,
      0.86,
    );
    this.rig.cloakLeft.rotation.z = this.cloakLeftZ.update(
      sideTarget - 0.035,
      deltaSeconds,
      SECONDARY_FREQUENCY,
      0.9,
    );
    this.rig.cloakRight.rotation.z = this.cloakRightZ.update(
      sideTarget + 0.035,
      deltaSeconds,
      SECONDARY_FREQUENCY,
      0.9,
    );

    const hairTargetX = cloakTargetX * 0.72 - vertical01 * 0.05;
    this.rig.hairLeft.rotation.x = this.hairLeftX.update(
      hairTargetX,
      deltaSeconds,
      HAIR_FREQUENCY,
      0.82,
    );
    this.rig.hairRight.rotation.x = this.hairRightX.update(
      hairTargetX,
      deltaSeconds,
      HAIR_FREQUENCY,
      0.82,
    );
    this.rig.hairLeft.rotation.z = this.hairLeftZ.update(
      sideTarget * 0.7 - 0.04,
      deltaSeconds,
      HAIR_FREQUENCY,
      0.84,
    );
    this.rig.hairRight.rotation.z = this.hairRightZ.update(
      sideTarget * 0.7 + 0.04,
      deltaSeconds,
      HAIR_FREQUENCY,
      0.84,
    );

    this.rig.skirtFront.rotation.x = cloakTargetX * 0.22;
    this.rig.skirtLeft.rotation.z = sideTarget * 0.35 - 0.025;
    this.rig.skirtRight.rotation.z = sideTarget * 0.35 + 0.025;
  }
}
