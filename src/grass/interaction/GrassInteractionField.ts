import * as THREE from "three";

export interface GrassInteractionConfig {
  radius: number;
  strength: number;
  trailLength: number;
  response: number;
  speedForFullEffect: number;
  landingPulseRadius: number;
  landingPulseStrength: number;
  landingPulseDecay: number;
}

export interface GrassInteractionState {
  active: boolean;
  start: THREE.Vector2;
  end: THREE.Vector2;
  direction: THREE.Vector2;
  radius: number;
  strength: number;
}

const MAX_DELTA_SECONDS = 0.1;
const MIN_DIRECTION_SPEED = 0.05;
const IDLE_STRENGTH_RATIO = 0.55;
const MIN_PULSE_STRENGTH = 0.01;

class GrassInteractionField {
  private readonly state: GrassInteractionState = {
    active: false,
    start: new THREE.Vector2(),
    end: new THREE.Vector2(),
    direction: new THREE.Vector2(0, 1),
    radius: 1,
    strength: 0,
  };
  private readonly wakeStart = new THREE.Vector2();
  private readonly wakeEnd = new THREE.Vector2();
  private readonly wakeDirection = new THREE.Vector2(0, 1);
  private readonly targetStart = new THREE.Vector2();
  private readonly pulsePosition = new THREE.Vector2();
  private config?: Readonly<GrassInteractionConfig>;
  private wakeStrength = 0;
  private pulseStrength = 0;
  private pulseInitialStrength = 0;

  configure(config: GrassInteractionConfig): void {
    this.config = Object.freeze({ ...config });
    this.state.radius = config.radius;
  }

  reset(position: THREE.Vector3): void {
    this.wakeStart.set(position.x, position.z);
    this.wakeEnd.copy(this.wakeStart);
    this.targetStart.copy(this.wakeStart);
    this.wakeStrength =
      (this.config?.strength ?? 0) * IDLE_STRENGTH_RATIO;
    this.pulseStrength = 0;
    this.pulseInitialStrength = 0;
    this.applyWakeState();
  }

  update(
    deltaSeconds: number,
    position: THREE.Vector3,
    velocity: THREE.Vector3,
  ): void {
    const config = this.config;
    if (!config) {
      this.state.active = false;
      return;
    }

    const delta = THREE.MathUtils.clamp(
      deltaSeconds,
      0,
      MAX_DELTA_SECONDS,
    );
    const speed = Math.hypot(velocity.x, velocity.z);
    if (speed > MIN_DIRECTION_SPEED) {
      this.wakeDirection.set(velocity.x / speed, velocity.z / speed);
    }

    this.wakeEnd.set(position.x, position.z);
    const movementBlend = THREE.MathUtils.smoothstep(
      speed,
      MIN_DIRECTION_SPEED,
      config.speedForFullEffect,
    );
    this.targetStart
      .copy(this.wakeEnd)
      .addScaledVector(
        this.wakeDirection,
        -config.trailLength * movementBlend,
      );

    const blend = 1 - Math.exp(-config.response * delta);
    this.wakeStart.lerp(this.targetStart, blend);
    this.wakeStrength =
      config.strength *
      THREE.MathUtils.lerp(IDLE_STRENGTH_RATIO, 1, movementBlend);

    if (this.pulseStrength > MIN_PULSE_STRENGTH) {
      this.pulseStrength *= Math.exp(-config.landingPulseDecay * delta);
      this.applyPulseState(config);
    } else {
      this.pulseStrength = 0;
      this.applyWakeState();
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
    this.pulseStrength = Math.max(
      this.pulseStrength,
      this.pulseInitialStrength,
    );
  }

  deactivate(): void {
    this.state.active = false;
    this.state.strength = 0;
    this.pulseStrength = 0;
  }

  getState(): Readonly<GrassInteractionState> {
    return this.state;
  }

  private applyWakeState(): void {
    const config = this.config;
    this.state.start.copy(this.wakeStart);
    this.state.end.copy(this.wakeEnd);
    this.state.direction.copy(this.wakeDirection);
    this.state.radius = config?.radius ?? 1;
    this.state.strength = this.wakeStrength;
    this.state.active = config !== undefined;
  }

  private applyPulseState(config: Readonly<GrassInteractionConfig>): void {
    const progress =
      this.pulseInitialStrength > Number.EPSILON
        ? 1 - this.pulseStrength / this.pulseInitialStrength
        : 1;
    this.state.start.copy(this.pulsePosition);
    this.state.end.copy(this.pulsePosition);
    this.state.direction.copy(this.wakeDirection);
    this.state.radius =
      config.landingPulseRadius *
      THREE.MathUtils.lerp(
        0.55,
        1,
        THREE.MathUtils.clamp(progress * 1.8, 0, 1),
      );
    this.state.strength = this.pulseStrength;
    this.state.active = true;
  }
}

export const grassInteractionField = new GrassInteractionField();
