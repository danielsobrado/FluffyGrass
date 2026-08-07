import * as THREE from "three";
import { STRIDE_LENGTH_METERS } from "../../character/SnowflowCharacter";
import { grassTrailField } from "./GrassTrailField";

export interface GrassInteractionConfig {
  strength: number;
  speedForFullEffect: number;
  landingPulseRadius: number;
  landingPulseStrength: number;
  landingPulseDecay: number;
  footContactRadius: number;
  footContactStrength: number;
  bodyContactRadius: number;
  bodyContactStrength: number;
}

export interface GrassInteractionPose {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  facing: number;
  distanceTravelled: number;
  grounded: boolean;
}

const FOOT_STRIDE_REACH = 0.42;
const FOOT_LATERAL_OFFSET = 0.16;
const MAX_DELTA_SECONDS = 0.1;
const MIN_DIRECTION_SPEED = 0.05;
const MIN_PULSE_STRENGTH = 0.02;
const IDLE_FOOT_RATIO = 0.45;
const FOOT_DIRECTIONAL_BLEND = 0.45;
const PULSE_START_RADIUS_FRACTION = 0.25;

class GrassInteractionField {
  private readonly direction = new THREE.Vector2(0, 1);
  private readonly pulsePosition = new THREE.Vector2();
  private config?: Readonly<GrassInteractionConfig>;
  private pulseStrength = 0;
  private pulseInitialStrength = 0;

  configure(config: GrassInteractionConfig): void {
    validateConfig(config);
    this.config = Object.freeze({ ...config });
  }

  reset(position: THREE.Vector3): void {
    this.pulseStrength = 0;
    this.pulseInitialStrength = 0;
    this.direction.set(0, 1);
    grassTrailField.setFocus(position.x, position.z);
  }

  update(deltaSeconds: number, pose: GrassInteractionPose): void {
    const config = this.config;
    if (!config) {
      return;
    }

    const delta = THREE.MathUtils.clamp(
      Number.isFinite(deltaSeconds) ? deltaSeconds : 0,
      0,
      MAX_DELTA_SECONDS,
    );
    const rawSpeed = Math.hypot(pose.velocity.x, pose.velocity.z);
    const speed = Number.isFinite(rawSpeed) ? rawSpeed : 0;
    if (speed > MIN_DIRECTION_SPEED) {
      this.direction.set(pose.velocity.x / speed, pose.velocity.z / speed);
    }

    grassTrailField.setFocus(pose.position.x, pose.position.z);

    if (pose.grounded) {
      this.submitFootContacts(config, pose, speed);
      this.submitBodyContact(config, pose);
    }

    if (this.pulseStrength > MIN_PULSE_STRENGTH) {
      this.submitPulseContact(config);
      this.pulseStrength *= Math.exp(-config.landingPulseDecay * delta);
    } else {
      this.pulseStrength = 0;
    }
  }

  pulse(position: THREE.Vector3, normalizedImpact: number): void {
    const config = this.config;
    if (
      !config ||
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.z) ||
      !Number.isFinite(normalizedImpact)
    ) {
      return;
    }
    const impact = THREE.MathUtils.clamp(normalizedImpact, 0, 1);
    this.pulsePosition.set(position.x, position.z);
    this.pulseInitialStrength = config.landingPulseStrength * impact;
    this.pulseStrength = Math.max(this.pulseStrength, this.pulseInitialStrength);
  }

  deactivate(): void {
    this.pulseStrength = 0;
    this.pulseInitialStrength = 0;
  }

  private submitFootContacts(
    config: Readonly<GrassInteractionConfig>,
    pose: GrassInteractionPose,
    speed: number,
  ): void {
    if (!Number.isFinite(pose.distanceTravelled) || !Number.isFinite(pose.facing)) {
      return;
    }
    const stridePhase =
      ((pose.distanceTravelled / STRIDE_LENGTH_METERS) % 1) * Math.PI * 2;
    const stride = Math.sin(stridePhase);
    const movement = THREE.MathUtils.smoothstep(
      speed,
      MIN_DIRECTION_SPEED,
      config.speedForFullEffect,
    );
    const forwardX = Math.sin(pose.facing);
    const forwardZ = Math.cos(pose.facing);
    const rightX = Math.cos(pose.facing);
    const rightZ = -Math.sin(pose.facing);
    const reach = FOOT_STRIDE_REACH * movement;
    const speedScale = THREE.MathUtils.lerp(0.72, 1, movement);

    this.submitFoot(
      config,
      pose,
      forwardX,
      forwardZ,
      rightX,
      rightZ,
      stride * reach,
      -FOOT_LATERAL_OFFSET,
      plantWeight(-stride, movement),
      speedScale,
    );
    this.submitFoot(
      config,
      pose,
      forwardX,
      forwardZ,
      rightX,
      rightZ,
      -stride * reach,
      FOOT_LATERAL_OFFSET,
      plantWeight(stride, movement),
      speedScale,
    );
  }

  private submitFoot(
    config: Readonly<GrassInteractionConfig>,
    pose: GrassInteractionPose,
    forwardX: number,
    forwardZ: number,
    rightX: number,
    rightZ: number,
    forwardOffset: number,
    lateralOffset: number,
    plant: number,
    speedScale: number,
  ): void {
    if (plant <= 0) {
      return;
    }
    grassTrailField.submitContact(
      pose.position.x + forwardX * forwardOffset + rightX * lateralOffset,
      pose.position.z + forwardZ * forwardOffset + rightZ * lateralOffset,
      config.footContactRadius,
      config.footContactStrength * config.strength * plant * speedScale,
      this.direction.x,
      this.direction.y,
      0,
      FOOT_DIRECTIONAL_BLEND,
    );
  }

  private submitBodyContact(
    config: Readonly<GrassInteractionConfig>,
    pose: GrassInteractionPose,
  ): void {
    grassTrailField.submitContact(
      pose.position.x,
      pose.position.z,
      config.bodyContactRadius,
      config.bodyContactStrength * config.strength,
      this.direction.x,
      this.direction.y,
      0,
      0.25,
    );
  }

  private submitPulseContact(config: Readonly<GrassInteractionConfig>): void {
    const progress =
      this.pulseInitialStrength > Number.EPSILON
        ? 1 - this.pulseStrength / this.pulseInitialStrength
        : 1;
    const radius = THREE.MathUtils.lerp(
      config.landingPulseRadius * PULSE_START_RADIUS_FRACTION,
      config.landingPulseRadius,
      THREE.MathUtils.clamp(progress * 1.6, 0, 1),
    );
    grassTrailField.submitContact(
      this.pulsePosition.x,
      this.pulsePosition.y,
      radius,
      this.pulseStrength,
      this.direction.x,
      this.direction.y,
      progress * 0.55,
      0,
    );
  }
}

function validateConfig(config: GrassInteractionConfig): void {
  const positive = [
    ["speedForFullEffect", config.speedForFullEffect],
    ["landingPulseRadius", config.landingPulseRadius],
    ["landingPulseDecay", config.landingPulseDecay],
    ["footContactRadius", config.footContactRadius],
    ["bodyContactRadius", config.bodyContactRadius],
  ] as const;
  for (const [label, value] of positive) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`Grass interaction ${label} must be a positive finite number.`);
    }
  }

  const nonNegative = [
    ["strength", config.strength],
    ["landingPulseStrength", config.landingPulseStrength],
    ["footContactStrength", config.footContactStrength],
    ["bodyContactStrength", config.bodyContactStrength],
  ] as const;
  for (const [label, value] of nonNegative) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Grass interaction ${label} must be a non-negative finite number.`);
    }
  }
}

function plantWeight(phase: number, movement: number): number {
  const planted = THREE.MathUtils.smoothstep(phase, -0.3, 0.35);
  return THREE.MathUtils.lerp(IDLE_FOOT_RATIO, planted, movement);
}

export const grassInteractionField = new GrassInteractionField();
