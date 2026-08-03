const MAX_DELTA_SECONDS = 0.1;
const TWO_PI = Math.PI * 2;

export class CharacterSpring {
  private velocity = 0;

  constructor(private value = 0) {}

  update(
    target: number,
    deltaSeconds: number,
    frequency: number,
    damping = 1,
  ): number {
    const delta = Math.min(Math.max(deltaSeconds, 0), MAX_DELTA_SECONDS);
    const angularFrequency = Math.max(frequency, 0.01) * TWO_PI;
    const dampingTerm = 1 + 2 * delta * damping * angularFrequency;
    const frequencySquared = angularFrequency * angularFrequency;
    const velocityTerm = delta * frequencySquared;
    const positionTerm = delta * velocityTerm;
    const inverseDeterminant = 1 / (dampingTerm + positionTerm);
    const nextValue =
      (dampingTerm * this.value +
        delta * this.velocity +
        positionTerm * target) *
      inverseDeterminant;
    const nextVelocity =
      (this.velocity + velocityTerm * (target - this.value)) *
      inverseDeterminant;
    this.value = nextValue;
    this.velocity = nextVelocity;
    return this.value;
  }

  addImpulse(velocity: number): void {
    this.velocity += velocity;
  }

  reset(value = 0): void {
    this.value = value;
    this.velocity = 0;
  }
}
