/**
 * Effector-based gait cycle.
 *
 * The cycle is a single normalized phase; each contact effector reads it
 * through its own phase offset and duty factor. Two phase-opposed feet and four
 * paws in a walk sequence are the same object with different tables, so nothing
 * here assumes a leg count.
 */
/** Fraction of a cycle over which a plant weight eases in and out. */
const PLANT_BLEND_BAND = 0.08;

export interface ActorGaitEffectorProfile {
  /** Where in the cycle this effector plants, in cycles. */
  readonly phaseOffset: number;
  /** Fraction of the cycle spent planted. */
  readonly dutyFactor: number;
}

export interface ActorGaitProfile {
  /** Metres of ground travel per complete cycle. */
  readonly strideLengthMeters: number;
  readonly effectors: readonly ActorGaitEffectorProfile[];
}

export class ActorGait {
  /** Normalized cycle position in `[0, 1)`. */
  private phase = 0;
  /** Plant weight per effector, 1 while planted and 0 mid-swing. */
  private readonly plantWeights: Float32Array;
  /** Progress through each stance in `[0, 1]`. */
  private readonly stanceProgress: Float32Array;
  /** Whether each effector is currently inside its stance interval. */
  private readonly stanceFlags: Uint8Array;
  /** Swing progress per effector in `[0, 1]`, only meaningful while swinging. */
  private readonly swingProgress: Float32Array;

  constructor(private profile: ActorGaitProfile) {
    this.plantWeights = new Float32Array(profile.effectors.length);
    this.stanceProgress = new Float32Array(profile.effectors.length);
    this.stanceFlags = new Uint8Array(profile.effectors.length);
    this.swingProgress = new Float32Array(profile.effectors.length);
    this.resolveEffectors();
  }

  get effectorCount(): number {
    return this.plantWeights.length;
  }

  getPhase(): number {
    return this.phase;
  }

  /** Plant weight for one effector: 1 fully planted, 0 fully airborne. */
  getPlantWeight(effector: number): number {
    return this.plantWeights[effector];
  }

  /** Whether an effector is in the stance part of its gait cycle. */
  isInStance(effector: number): boolean {
    return this.stanceFlags[effector] === 1;
  }

  /** Progress through the stance arc in `[0, 1]`. */
  getStanceProgress(effector: number): number {
    return this.stanceProgress[effector];
  }

  /** Progress through the swing arc in `[0, 1]`, only meaningful while swinging. */
  getSwingProgress(effector: number): number {
    return this.swingProgress[effector];
  }

  /**
   * Advances the cycle from ground distance rather than time, so the gait stays
   * locked to the ground at any speed and never skates.
   */
  setFromDistance(distanceTravelled: number): void {
    const stride = this.profile.strideLengthMeters;
    if (!(stride > 0) || !Number.isFinite(distanceTravelled)) {
      return;
    }
    const cycles = distanceTravelled / stride;
    this.phase = cycles - Math.floor(cycles);
    this.resolveEffectors();
  }

  reset(): void {
    this.phase = 0;
    this.resolveEffectors();
  }

  private resolveEffectors(): void {
    const effectors = this.profile.effectors;
    for (let index = 0; index < effectors.length; index += 1) {
      const effector = effectors[index];
      const local = wrap01(this.phase - effector.phaseOffset);
      const duty = effector.dutyFactor;
      if (local < duty) {
        // Ramp the plant weight in and out so contact IK eases onto the ground
        // rather than snapping the effector down on the frame it lands.
        const band = Math.min(PLANT_BLEND_BAND, duty * 0.5);
        this.plantWeights[index] =
          band > 0
            ? Math.min(local / band, (duty - local) / band, 1)
            : 1;
        this.stanceFlags[index] = 1;
        this.stanceProgress[index] = duty > 0 ? local / duty : 0;
        this.swingProgress[index] = 0;
      } else {
        this.plantWeights[index] = 0;
        this.stanceFlags[index] = 0;
        this.stanceProgress[index] = 0;
        const swingSpan = 1 - duty;
        this.swingProgress[index] =
          swingSpan > 0 ? (local - duty) / swingSpan : 0;
      }
    }
  }
}

function wrap01(value: number): number {
  const wrapped = value - Math.floor(value);
  return wrapped < 0 ? wrapped + 1 : wrapped;
}
