import * as THREE from "three";

export interface GrassInteractionConfig {
  radius: number;
  strength: number;
  trailLength: number;
  response: number;
  speedForFullEffect: number;
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

class GrassInteractionField {
  private readonly state: GrassInteractionState = {
    active: false,
    start: new THREE.Vector2(),
    end: new THREE.Vector2(),
    direction: new THREE.Vector2(0, 1),
    radius: 1,
    strength: 0,
  };
  private readonly targetStart = new THREE.Vector2();
  private config?: Readonly<GrassInteractionConfig>;

  configure(config: GrassInteractionConfig): void {
    this.config = Object.freeze({ ...config });
    this.state.radius = config.radius;
  }

  reset(position: THREE.Vector3): void {
    this.state.start.set(position.x, position.z);
    this.state.end.copy(this.state.start);
    this.targetStart.copy(this.state.start);
    this.state.strength =
      (this.config?.strength ?? 0) * IDLE_STRENGTH_RATIO;
    this.state.active = this.config !== undefined;
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
      this.state.direction.set(velocity.x / speed, velocity.z / speed);
    }

    this.state.end.set(position.x, position.z);
    const movementBlend = THREE.MathUtils.smoothstep(
      speed,
      MIN_DIRECTION_SPEED,
      config.speedForFullEffect,
    );
    this.targetStart
      .copy(this.state.end)
      .addScaledVector(
        this.state.direction,
        -config.trailLength * movementBlend,
      );

    if (!this.state.active) {
      this.state.start.copy(this.targetStart);
    } else {
      const blend = 1 - Math.exp(-config.response * delta);
      this.state.start.lerp(this.targetStart, blend);
    }

    this.state.radius = config.radius;
    this.state.strength =
      config.strength *
      THREE.MathUtils.lerp(IDLE_STRENGTH_RATIO, 1, movementBlend);
    this.state.active = true;
  }

  deactivate(): void {
    this.state.active = false;
    this.state.strength = 0;
  }

  getState(): Readonly<GrassInteractionState> {
    return this.state;
  }
}

export const grassInteractionField = new GrassInteractionField();
