import * as THREE from "three";
import { STRIDE_LENGTH_METERS } from "../../character/SnowflowCharacter";
import { grassTrailField } from "./GrassTrailField";

/**
 * Turns character motion into grass contacts.
 *
 * This used to hold a single capsule — one segment plus a radius — that the
 * grass shader read directly. Blades bent away from wherever the character was
 * standing that frame and recovered the instant it moved on, so walking, running
 * and standing still all looked the same and no trail was ever visible.
 *
 * It now emits discrete contacts into {@link grassTrailField}, which keeps them.
 * The two feet stamp alternately from the same stride phase the character
 * animation runs on, the body contributes a small constant contact, and the
 * landing pulse is an expanding ring that adds to the trail rather than
 * replacing it.
 */

export interface GrassInteractionConfig {
  /** Global scale applied to every contact this field emits. */
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

/** How far ahead of and behind the body a planted foot reaches. */
const FOOT_STRIDE_REACH = 0.42;
/** Half the distance between the two feet. */
const FOOT_LATERAL_OFFSET = 0.16;
const MAX_DELTA_SECONDS = 0.1;
const MIN_DIRECTION_SPEED = 0.05;
const MIN_PULSE_STRENGTH = 0.02;
/** Fraction of the foot stamp that a standing character still applies. */
const IDLE_FOOT_RATIO = 0.45;
/** How strongly a stamp lays grass along the travel direction rather than out. */
const FOOT_DIRECTIONAL_BLEND = 0.45;
const PULSE_START_RADIUS_FRACTION = 0.25;

class GrassInteractionField {
  private readonly direction = new THREE.Vector2(0, 1);
  private readonly pulsePosition = new THREE.Vector2();
  private config?: Readonly<GrassInteractionConfig>;
  private pulseStrength = 0;
  private pulseInitialStrength = 0;

  configure(config: GrassInteractionConfig): void {
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

    const delta = THREE.MathUtils.clamp(deltaSeconds, 0, MAX_DELTA_SECONDS);
    const speed = Math.hypot(pose.velocity.x, pose.velocity.z);
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
    if (!config) {
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

  /**
   * The stride phase is the same expression the character animation uses, so a
   * stamp lands under the foot the player can see rather than under the body.
   * Only a foot bearing weight stamps; the swinging foot leaves nothing behind.
   */
  private submitFootContacts(
    config: Readonly<GrassInteractionConfig>,
    pose: GrassInteractionPose,
    speed: number,
  ): void {
    const stridePhase =
      ((pose.distanceTravelled / STRIDE_LENGTH_METERS) % 1) * Math.PI * 2;
    const stride = Math.sin(stridePhase);
    const movement = THREE.MathUtils.smoothstep(
      speed,
      MIN_DIRECTION_SPEED,
      config.speedForFullEffect,
    );
    // Local +Z is forward and local +X is right once the character's heading
    // group has been rotated by `facing`.
    const forwardX = Math.sin(pose.facing);
    const forwardZ = Math.cos(pose.facing);
    const rightX = Math.cos(pose.facing);
    const rightZ = -Math.sin(pose.facing);
    const reach = FOOT_STRIDE_REACH * movement;
    const speedScale = THREE.MathUtils.lerp(0.72, 1, movement);

    // The left leg is at its forward extreme at stride = +1 (the animation
    // drives its thigh from -stride) and its rearward extreme at -1, so the
    // stamp offset tracks stride directly. Weight is gated on -stride, which
    // confines stamping to the rear half of the stance phase.
    //
    // That gate is what keeps a print still on the ground: over that half-cycle
    // the foot travels 2 * FOOT_STRIDE_REACH backwards relative to the body
    // while the body advances STRIDE_LENGTH_METERS / 2 forwards, and those very
    // nearly cancel (0.84 m against 0.775 m). Retune FOOT_STRIDE_REACH against
    // STRIDE_LENGTH_METERS or the prints start sliding. The right foot mirrors.
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

  /**
   * Legs and skirt displace grass even when the character is not walking. This
   * replaces the old idle wake, which pushed at 55% strength across the full
   * 1.55 m radius and read as an invisible force field.
   */
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

  /**
   * An expanding ring rather than a disc: the impact throws grass outwards from
   * the landing point, and because the trail keeps what the ring already wrote,
   * the flattened centre stays flattened as the ring passes over it.
   */
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

/**
 * Stance weight for a foot. `phase` is positive through the half of the cycle
 * the foot spends on the ground; the smoothstep keeps a stamp from appearing and
 * vanishing instantly at the transition.
 */
function plantWeight(phase: number, movement: number): number {
  const planted = THREE.MathUtils.smoothstep(phase, -0.3, 0.35);
  return THREE.MathUtils.lerp(IDLE_FOOT_RATIO, planted, movement);
}

export const grassInteractionField = new GrassInteractionField();
