import * as THREE from "three";
import type { ActorPose } from "../animation/ActorPose";
import type { ActorPoseSpace } from "../animation/ActorPoseSpace";
import type { ActorRigDefinition } from "../rig/ActorRigDefinition";
import type { ActorTwoBoneChain } from "../rig/ActorRigChains";

/**
 * Analytic two-bone IK.
 *
 * It knows nothing about arms, knees, paws, or hands: it aims a chain's two
 * declared segments at a target, bends the mid joint in the plane the chain's
 * pole selects, and writes local rotations back into the pose. Humanoid legs,
 * humanoid arms, and quadruped front and hind limbs are all the same call.
 *
 * The solver reuses one set of scratch vectors and allocates nothing per solve.
 */
export class TwoBoneIk {
  private readonly rootPosition = new THREE.Vector3();
  private readonly targetPosition = new THREE.Vector3();
  private readonly midPosition = new THREE.Vector3();
  private readonly toTarget = new THREE.Vector3();
  private readonly pole = new THREE.Vector3();
  private readonly bendAxis = new THREE.Vector3();
  private readonly upperDirection = new THREE.Vector3();
  private readonly lowerDirection = new THREE.Vector3();
  private readonly segmentAxis = new THREE.Vector3();
  private readonly parentRotation = new THREE.Quaternion();
  private readonly rootModel = new THREE.Quaternion();
  private readonly swing = new THREE.Quaternion();
  private readonly localRotation = new THREE.Quaternion();

  constructor(private readonly definition: ActorRigDefinition) {}

  /**
   * Solves `chain` so its end effector reaches `target`, in model space.
   *
   * The target is clamped inside the chain's reach with a small margin, so a
   * chain never fully straightens and the mid joint keeps a defined bend
   * direction even when the target is far away.
   */
  solve(
    chain: ActorTwoBoneChain,
    target: THREE.Vector3,
    space: ActorPoseSpace,
    pose: ActorPose,
  ): void {
    const upper = chain.upperLength;
    const lower = chain.lowerLength;
    this.rootPosition.fromArray(space.positions, chain.root * 3);
    this.targetPosition.copy(target);
    this.toTarget.subVectors(this.targetPosition, this.rootPosition);

    const reach = upper + lower;
    const minimumReach = Math.abs(upper - lower) + REACH_MARGIN;
    const maximumReach = reach - REACH_MARGIN;
    let distance = this.toTarget.length();
    if (distance < 1e-6) {
      return;
    }
    if (distance > maximumReach) {
      this.toTarget.multiplyScalar(maximumReach / distance);
      distance = maximumReach;
    } else if (distance < minimumReach) {
      this.toTarget.multiplyScalar(minimumReach / distance);
      distance = minimumReach;
    }
    this.targetPosition.copy(this.rootPosition).add(this.toTarget);

    // Interior angle at the root, from the law of cosines.
    const cosineRoot = clampUnit(
      (upper * upper + distance * distance - lower * lower) /
        (2 * upper * distance),
    );
    let rootAngle = Math.acos(cosineRoot);
    // Bend at the mid joint, clamped into the chain's declared range.
    const cosineMid = clampUnit(
      (upper * upper + lower * lower - distance * distance) /
        (2 * upper * lower),
    );
    const bend = Math.PI - Math.acos(cosineMid);
    if (bend < chain.minBendRadians || bend > chain.maxBendRadians) {
      const clampedBend = clamp(
        bend,
        chain.minBendRadians,
        chain.maxBendRadians,
      );
      // Re-derive the root angle for the distance the clamped bend implies.
      const clampedDistance = Math.sqrt(
        Math.max(
          upper * upper +
            lower * lower -
            2 * upper * lower * Math.cos(Math.PI - clampedBend),
          1e-8,
        ),
      );
      rootAngle = Math.acos(
        clampUnit(
          (upper * upper + clampedDistance * clampedDistance - lower * lower) /
            (2 * upper * clampedDistance),
        ),
      );
    }

    // Bend plane: the pole, made perpendicular to the root-to-target line.
    this.toTarget.normalize();
    this.pole
      .set(chain.poleX, chain.poleY, chain.poleZ)
      .normalize();
    this.bendAxis.crossVectors(this.toTarget, this.pole);
    if (this.bendAxis.lengthSq() < 1e-8) {
      // Pole is parallel to the reach direction; pick any perpendicular so the
      // joint still has a defined bend rather than collapsing.
      this.bendAxis
        .set(this.toTarget.y, -this.toTarget.x, 0)
        .normalize();
      if (this.bendAxis.lengthSq() < 1e-8) {
        this.bendAxis.set(1, 0, 0);
      }
    } else {
      this.bendAxis.normalize();
    }

    this.upperDirection
      .copy(this.toTarget)
      .applyAxisAngle(this.bendAxis, -rootAngle);
    this.midPosition
      .copy(this.rootPosition)
      .addScaledVector(this.upperDirection, upper);
    this.lowerDirection
      .subVectors(this.targetPosition, this.midPosition)
      .normalize();

    this.aimSegment(
      chain.root,
      chain.upperAxisX,
      chain.upperAxisY,
      chain.upperAxisZ,
      this.upperDirection,
      space,
      pose,
    );
    // The mid joint's parent is the root, whose model rotation the aim above
    // just changed, so recompose it rather than reading the stale pass.
    this.rootModel.copy(this.parentRotation).multiply(this.localRotation);
    this.aimSegmentUnderParent(
      chain.mid,
      chain.lowerAxisX,
      chain.lowerAxisY,
      chain.lowerAxisZ,
      this.lowerDirection,
      this.rootModel,
      pose,
    );
  }

  private aimSegment(
    bone: number,
    axisX: number,
    axisY: number,
    axisZ: number,
    desired: THREE.Vector3,
    space: ActorPoseSpace,
    pose: ActorPose,
  ): void {
    const parent = this.definition.parents[bone];
    if (parent < 0) {
      this.parentRotation.identity();
    } else {
      this.parentRotation.fromArray(space.rotations, parent * 4);
    }
    this.aimSegmentUnderParent(
      bone,
      axisX,
      axisY,
      axisZ,
      desired,
      this.parentRotation,
      pose,
    );
  }

  /**
   * Rotates `bone` so its declared segment axis points along `desired`.
   *
   * The swing is computed in model space and then expressed in the bone's local
   * space, which is what the pose buffer stores.
   */
  private aimSegmentUnderParent(
    bone: number,
    axisX: number,
    axisY: number,
    axisZ: number,
    desired: THREE.Vector3,
    parentModel: THREE.Quaternion,
    pose: ActorPose,
  ): void {
    this.segmentAxis.set(axisX, axisY, axisZ).applyQuaternion(parentModel);
    this.swing.setFromUnitVectors(this.segmentAxis, desired);
    // local = parent^-1 * swing * parent
    this.localRotation
      .copy(parentModel)
      .invert()
      .multiply(this.swing)
      .multiply(parentModel);
    pose.rotations[bone * 4] = this.localRotation.x;
    pose.rotations[bone * 4 + 1] = this.localRotation.y;
    pose.rotations[bone * 4 + 2] = this.localRotation.z;
    pose.rotations[bone * 4 + 3] = this.localRotation.w;
  }
}

/** Keeps a chain just short of full extension so the bend plane stays defined. */
const REACH_MARGIN = 0.01;

function clampUnit(value: number): number {
  return value < -1 ? -1 : value > 1 ? 1 : value;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return value < minimum ? minimum : value > maximum ? maximum : value;
}
