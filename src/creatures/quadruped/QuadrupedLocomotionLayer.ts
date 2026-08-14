import * as THREE from "three";
import type { ActorAnimationInput } from "../../actor/animation/ActorAnimationInput";
import type { ActorLocomotionLayer } from "../../actor/animation/ActorAnimationProfile";
import type { ActorGait } from "../../actor/animation/ActorGait";
import type { ActorPose } from "../../actor/animation/ActorPose";
import type { ActorEasing } from "../../actor/animation/ActorPoseBlender";
import type { QuadrupedRigBones } from "./QuadrupedRigDefinition";

export const QUADRUPED_STATE_IDLE = 0;
export const QUADRUPED_STATE_WALK = 1;

const STATE_NAMES = ["idle", "walk"] as const;
const IDLE_SPEED_THRESHOLD = 0.06;
const LIMB_SWING = 0.52;
const LIMB_FOLD = 0.42;
const BREATH_FREQUENCY = 1.1;
const BREATH_AMPLITUDE = 0.008;

/**
 * A four-legged walk.
 *
 * It shares no equations with the humanoid layer — the point of the shared
 * runtime is that it does not have to. Each limb reads its own phase from the
 * gait table and folds in the direction its chain's pole selects, and the whole
 * thing writes into the same pose buffers the player uses.
 */
export class QuadrupedLocomotionLayer implements ActorLocomotionLayer {
  readonly stateCount = STATE_NAMES.length;
  private animationTime = 0;

  constructor(private readonly bones: QuadrupedRigBones) {}

  stateName(state: number): string {
    return STATE_NAMES[state] ?? "idle";
  }

  selectState(input: ActorAnimationInput): number {
    return input.speed < IDLE_SPEED_THRESHOLD
      ? QUADRUPED_STATE_IDLE
      : QUADRUPED_STATE_WALK;
  }

  transitionDuration(): number {
    return 0.22;
  }

  transitionEasing(): ActorEasing {
    return "smooth";
  }

  reset(): void {
    this.animationTime = 0;
  }

  advanceTime(deltaSeconds: number): void {
    this.animationTime += deltaSeconds;
  }

  generatePose(
    input: ActorAnimationInput,
    state: number,
    _stateTimeSeconds: number,
    gait: ActorGait,
    target: ActorPose,
  ): void {
    const bones = this.bones;
    const speed01 = THREE.MathUtils.clamp(input.normalizedSpeed, 0, 1);
    const gaitBlend =
      state === QUADRUPED_STATE_WALK && input.grounded
        ? THREE.MathUtils.smoothstep(speed01, 0.02, 0.2)
        : 0;

    target.resetToBind();

    // Body bob rides the doubled cycle: four footfalls per stride give two
    // support peaks, so the body dips twice per cycle rather than once.
    const cyclePhase = gait.getPhase() * Math.PI * 2;
    const bob =
      -Math.abs(Math.sin(cyclePhase * 2)) * 0.018 * gaitBlend +
      Math.sin(this.animationTime * BREATH_FREQUENCY) *
        BREATH_AMPLITUDE *
        (1 - gaitBlend);
    target.setTranslation(bones.bodyCenter, 0, bob, 0);
    target.setEuler(bones.spine, Math.sin(cyclePhase) * 0.03 * gaitBlend, 0, 0);
    target.setEuler(bones.neck, -0.12 - speed01 * 0.06, 0, 0);
    target.setEuler(bones.head, 0.1, 0, 0);

    this.poseLimbPair(target, gait, gaitBlend, 0, 1, bones.frontUpper, bones.frontLower, -1);
    this.poseLimbPair(target, gait, gaitBlend, 2, 3, bones.hindUpper, bones.hindLower, 1);
  }

  /**
   * Swings one pair of limbs from their own gait phases.
   *
   * `foldSign` is which way the mid joint folds: front limbs fold backward,
   * hind limbs forward.
   */
  private poseLimbPair(
    target: ActorPose,
    gait: ActorGait,
    gaitBlend: number,
    leftEffector: number,
    rightEffector: number,
    upper: readonly number[],
    lower: readonly number[],
    foldSign: number,
  ): void {
    for (let index = 0; index < 2; index += 1) {
      const effector = index === 0 ? leftEffector : rightEffector;
      const planted = gait.getPlantWeight(effector);
      const stance = gait.getStanceProgress(effector);
      const swing = gait.getSwingProgress(effector);
      // Stance and swing traverse the same arc in opposite directions. Contact
      // weight is only a blend factor and must not be used as phase progress.
      const stride = gait.isInStance(effector)
        ? Math.cos(Math.PI * (1 - stance)) * 0.5
        : Math.cos(Math.PI * (1 - swing)) * -0.5;
      target.setEuler(upper[index], stride * LIMB_SWING * gaitBlend, 0, 0);
      const fold = (1 - planted) * (1 - Math.abs(swing * 2 - 1));
      target.setEuler(
        lower[index],
        foldSign * fold * LIMB_FOLD * gaitBlend,
        0,
        0,
      );
    }
  }
}
