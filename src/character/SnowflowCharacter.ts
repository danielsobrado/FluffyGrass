import * as THREE from "three";
import {
  buildSnowflowCharacter,
  type SnowflowCharacterRig,
} from "./SnowflowCharacterGeometry";

const UP = new THREE.Vector3(0, 1, 0);
const STRIDE_LENGTH_METERS = 1.55;
const MAX_SLOPE_TILT_RADIANS = THREE.MathUtils.degToRad(18);

export interface SnowflowCharacterPose {
  position: THREE.Vector3;
  groundNormal: THREE.Vector3;
  facing: number;
  speed: number;
  runSpeed: number;
  acceleration: number;
  distanceTravelled: number;
}

export class SnowflowCharacter {
  private readonly rig: SnowflowCharacterRig;
  private readonly desiredSlope = new THREE.Quaternion();
  private readonly limitedNormal = new THREE.Vector3();
  private animationTime = 0;

  constructor(scene: THREE.Scene, scale: number) {
    this.rig = buildSnowflowCharacter(scene, scale);
  }

  update(deltaSeconds: number, pose: SnowflowCharacterPose): void {
    const delta = THREE.MathUtils.clamp(deltaSeconds, 0, 0.1);
    this.animationTime += delta;
    this.rig.root.position.copy(pose.position);
    this.rig.heading.rotation.y = pose.facing;
    this.updateSlope(pose.groundNormal, delta);
    this.updateGait(pose);
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

  private updateGait(pose: SnowflowCharacterPose): void {
    const speed01 = THREE.MathUtils.clamp(pose.speed / pose.runSpeed, 0, 1);
    const moving = THREE.MathUtils.smoothstep(speed01, 0.015, 0.12);
    const stridePhase =
      ((pose.distanceTravelled / STRIDE_LENGTH_METERS) % 1) * Math.PI * 2;
    const stride = Math.sin(stridePhase);
    const oppositeStride = Math.sin(stridePhase + Math.PI);
    const doubleStep = 0.5 - 0.5 * Math.cos(stridePhase * 2);
    const gaitBlend = moving * (0.35 + speed01 * 0.65);
    const accelerationLean = THREE.MathUtils.clamp(
      pose.acceleration / 20,
      -0.2,
      0.38,
    );

    const legSwing = 0.7 * gaitBlend;
    const kneeLift = 0.48 * gaitBlend;
    this.rig.leftThigh.rotation.x = oppositeStride * legSwing;
    this.rig.rightThigh.rotation.x = stride * legSwing;
    this.rig.leftShin.rotation.x = Math.max(0, stride) * kneeLift;
    this.rig.rightShin.rotation.x = Math.max(0, oppositeStride) * kneeLift;
    this.rig.leftFoot.rotation.x =
      -this.rig.leftThigh.rotation.x * 0.25 - this.rig.leftShin.rotation.x * 0.55;
    this.rig.rightFoot.rotation.x =
      -this.rig.rightThigh.rotation.x * 0.25 - this.rig.rightShin.rotation.x * 0.55;

    const armSwing = 0.52 * gaitBlend;
    this.rig.leftUpperArm.rotation.x = stride * armSwing;
    this.rig.rightUpperArm.rotation.x = oppositeStride * armSwing;
    this.rig.leftForearm.rotation.x =
      -0.12 - Math.max(0, -stride) * 0.22 * gaitBlend;
    this.rig.rightForearm.rotation.x =
      -0.12 - Math.max(0, -oppositeStride) * 0.22 * gaitBlend;

    const bob = -doubleStep * 0.035 * gaitBlend;
    const breathing = Math.sin(this.animationTime * 1.7) * 0.004 * (1 - moving);
    this.rig.body.position.y = bob + breathing;
    this.rig.torso.rotation.x = 0.06 * speed01 + accelerationLean;
    this.rig.torso.rotation.z = -stride * 0.035 * gaitBlend;
    this.rig.skirt.rotation.x = -stride * 0.025 * gaitBlend;
    this.rig.skirt.rotation.z = stride * 0.018 * gaitBlend;
  }
}
