import * as THREE from "three";
import { CharacterSpring } from "./CharacterSpring";
import { CapeMotionGeometry } from "./CapeMotionGeometry";
import {
  CAPE_BASE_BACK_ANGLE,
  CAPE_FLUTTER_STRENGTH,
  CAPE_FORWARD_ACCELERATION_LAG,
  CAPE_FORWARD_DRAG,
  CAPE_LANDING_ROOT_IMPULSE,
  CAPE_LANDING_TAIL_IMPULSE,
  CAPE_MAX_DELTA_SECONDS,
  CAPE_MAX_LOCAL_ACCELERATION,
  CAPE_MAX_VERTICAL_SPEED,
  CAPE_ROOT_DAMPING,
  CAPE_ROOT_FREQUENCY,
  CAPE_SIDE_ACCELERATION_LAG,
  CAPE_SIDE_DRAG,
  CAPE_SIDE_REST_ANGLE,
  CAPE_TAIL_DAMPING,
  CAPE_TAIL_FORWARD_SCALE,
  CAPE_TAIL_FREQUENCY,
  CAPE_TAIL_SIDE_SCALE,
  CAPE_TAIL_VERTICAL_LAG,
  CAPE_VERTICAL_LAG,
} from "./CapeMotionTuning";

export interface CapeMotionInput {
  forwardVelocity: number;
  sideVelocity: number;
  verticalVelocity: number;
  runSpeed: number;
  landed: boolean;
  landingImpact: number;
}

export interface CapeMotionPose {
  bendX: number;
  bendZ: number;
}

export class CapeMotion {
  private readonly backX = new CharacterSpring(CAPE_BASE_BACK_ANGLE);
  private readonly leftX = new CharacterSpring(CAPE_BASE_BACK_ANGLE * 0.92);
  private readonly rightX = new CharacterSpring(CAPE_BASE_BACK_ANGLE * 0.92);
  private readonly leftZ = new CharacterSpring(-CAPE_SIDE_REST_ANGLE);
  private readonly rightZ = new CharacterSpring(CAPE_SIDE_REST_ANGLE);
  private readonly tailX = new CharacterSpring();
  private readonly tailZ = new CharacterSpring();
  private readonly geometry: CapeMotionGeometry;
  private elapsedSeconds = 0;
  private previousForwardVelocity = 0;
  private previousSideVelocity = 0;

  constructor(
    private readonly back: THREE.Group,
    private readonly left: THREE.Group,
    private readonly right: THREE.Group,
  ) {
    this.geometry = new CapeMotionGeometry(back, left, right);
    this.reset();
  }

  update(deltaSeconds: number, input: CapeMotionInput): CapeMotionPose {
    const delta = THREE.MathUtils.clamp(
      deltaSeconds,
      0,
      CAPE_MAX_DELTA_SECONDS,
    );
    this.elapsedSeconds += delta;

    const runSpeed = Math.max(input.runSpeed, Number.EPSILON);
    const forward01 = THREE.MathUtils.clamp(
      input.forwardVelocity / runSpeed,
      -1,
      1,
    );
    const side01 = THREE.MathUtils.clamp(input.sideVelocity / runSpeed, -1, 1);
    const vertical01 = THREE.MathUtils.clamp(
      input.verticalVelocity / CAPE_MAX_VERTICAL_SPEED,
      -1,
      1,
    );
    const forwardAcceleration01 = this.calculateAcceleration(
      input.forwardVelocity,
      this.previousForwardVelocity,
      delta,
    );
    const sideAcceleration01 = this.calculateAcceleration(
      input.sideVelocity,
      this.previousSideVelocity,
      delta,
    );
    this.previousForwardVelocity = input.forwardVelocity;
    this.previousSideVelocity = input.sideVelocity;

    if (input.landed) {
      const impact = THREE.MathUtils.clamp(input.landingImpact, 0, 1);
      this.backX.addImpulse(impact * CAPE_LANDING_ROOT_IMPULSE);
      this.leftX.addImpulse(impact * CAPE_LANDING_ROOT_IMPULSE * 0.9);
      this.rightX.addImpulse(impact * CAPE_LANDING_ROOT_IMPULSE * 0.9);
      this.tailX.addImpulse(impact * CAPE_LANDING_TAIL_IMPULSE);
    }

    const targetX = THREE.MathUtils.clamp(
      CAPE_BASE_BACK_ANGLE +
        forward01 * CAPE_FORWARD_DRAG +
        forwardAcceleration01 * CAPE_FORWARD_ACCELERATION_LAG -
        vertical01 * CAPE_VERTICAL_LAG,
      -0.28,
      0.62,
    );
    const targetZ = THREE.MathUtils.clamp(
      -side01 * CAPE_SIDE_DRAG -
        sideAcceleration01 * CAPE_SIDE_ACCELERATION_LAG,
      -0.34,
      0.34,
    );
    const sidePanelBias = side01 * 0.055;

    const bendX = this.backX.update(
      targetX,
      delta,
      CAPE_ROOT_FREQUENCY,
      CAPE_ROOT_DAMPING,
    );
    const leftX = this.leftX.update(
      targetX * 0.92 - sidePanelBias,
      delta,
      CAPE_ROOT_FREQUENCY,
      CAPE_ROOT_DAMPING,
    );
    const rightX = this.rightX.update(
      targetX * 0.92 + sidePanelBias,
      delta,
      CAPE_ROOT_FREQUENCY,
      CAPE_ROOT_DAMPING,
    );
    const leftZ = this.leftZ.update(
      targetZ - CAPE_SIDE_REST_ANGLE,
      delta,
      CAPE_ROOT_FREQUENCY,
      CAPE_ROOT_DAMPING,
    );
    const rightZ = this.rightZ.update(
      targetZ + CAPE_SIDE_REST_ANGLE,
      delta,
      CAPE_ROOT_FREQUENCY,
      CAPE_ROOT_DAMPING,
    );

    this.back.rotation.x = bendX;
    this.left.rotation.set(leftX, 0, leftZ);
    this.right.rotation.set(rightX, 0, rightZ);

    const tailBendX = this.tailX.update(
      targetX * CAPE_TAIL_FORWARD_SCALE +
        forwardAcceleration01 * CAPE_FORWARD_ACCELERATION_LAG -
        vertical01 * CAPE_TAIL_VERTICAL_LAG,
      delta,
      CAPE_TAIL_FREQUENCY,
      CAPE_TAIL_DAMPING,
    );
    const tailBendZ = this.tailZ.update(
      targetZ * CAPE_TAIL_SIDE_SCALE +
        sideAcceleration01 * CAPE_SIDE_ACCELERATION_LAG,
      delta,
      CAPE_TAIL_FREQUENCY,
      CAPE_TAIL_DAMPING,
    );

    const relativeAirSpeed = Math.hypot(
      input.forwardVelocity,
      input.sideVelocity,
      input.verticalVelocity * 0.65,
    );
    const airflow = THREE.MathUtils.smoothstep(
      relativeAirSpeed / runSpeed,
      0.08,
      1.2,
    );
    const accelerationEnergy = Math.min(
      1,
      Math.hypot(forwardAcceleration01, sideAcceleration01),
    );
    const flutterAmplitude =
      CAPE_FLUTTER_STRENGTH *
      airflow *
      (0.55 + accelerationEnergy * 0.45);
    this.geometry.update(
      this.elapsedSeconds,
      tailBendX,
      tailBendZ,
      flutterAmplitude,
    );

    return {
      bendX,
      bendZ: (leftZ + rightZ) * 0.5,
    };
  }

  reset(): void {
    this.elapsedSeconds = 0;
    this.previousForwardVelocity = 0;
    this.previousSideVelocity = 0;
    this.backX.reset(CAPE_BASE_BACK_ANGLE);
    this.leftX.reset(CAPE_BASE_BACK_ANGLE * 0.92);
    this.rightX.reset(CAPE_BASE_BACK_ANGLE * 0.92);
    this.leftZ.reset(-CAPE_SIDE_REST_ANGLE);
    this.rightZ.reset(CAPE_SIDE_REST_ANGLE);
    this.tailX.reset();
    this.tailZ.reset();
    this.back.rotation.x = CAPE_BASE_BACK_ANGLE;
    this.left.rotation.set(
      CAPE_BASE_BACK_ANGLE * 0.92,
      0,
      -CAPE_SIDE_REST_ANGLE,
    );
    this.right.rotation.set(
      CAPE_BASE_BACK_ANGLE * 0.92,
      0,
      CAPE_SIDE_REST_ANGLE,
    );
    this.geometry.update(0, 0, 0, 0);
  }

  private calculateAcceleration(
    current: number,
    previous: number,
    deltaSeconds: number,
  ): number {
    if (deltaSeconds <= Number.EPSILON) {
      return 0;
    }
    return THREE.MathUtils.clamp(
      (current - previous) /
        deltaSeconds /
        CAPE_MAX_LOCAL_ACCELERATION,
      -1,
      1,
    );
  }
}
