const MAX_DELTA_SECONDS = 0.05;
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
    const acceleration =
      (target - this.value) * angularFrequency * angularFrequency -
      2 * damping * angularFrequency * this.velocity;
    this.velocity += acceleration * delta;
    this.value += this.velocity * delta;
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
