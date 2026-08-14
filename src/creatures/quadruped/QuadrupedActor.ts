import * as THREE from "three";
import { createActorAnimationInput } from "../../actor/animation/ActorAnimationInput";
import type { ActorAnimationProfile } from "../../actor/animation/ActorAnimationProfile";
import { ActorAnimationRuntime } from "../../actor/animation/ActorAnimationRuntime";
import { ActorGait } from "../../actor/animation/ActorGait";
import { ActorContactIk } from "../../actor/ik/ActorContactIk";
import type { ActorTerrainContactSampler } from "../../actor/ik/ActorTerrainContact";
import { requireActorChain } from "../../actor/rig/ActorRigDefinition";
import { ActorRigInstance } from "../../actor/rig/ActorRigInstance";
import { buildQuadrupedBody } from "./QuadrupedBody";
import { QuadrupedLocomotionLayer } from "./QuadrupedLocomotionLayer";
import {
  QUADRUPED_CONTACT_CHAINS,
  QUADRUPED_PAW_DROP,
  quadrupedRig,
} from "./QuadrupedRigDefinition";

const DEGREES = Math.PI / 180;
const QUADRUPED_STRIDE_LENGTH_METERS = 1.2;
const QUADRUPED_STANCE_DUTY_FACTOR = 0.68;
const QUADRUPED_MAX_BODY_DROP = 0.16;
const QUADRUPED_MAX_PAW_ALIGN = 22 * DEGREES;
const QUADRUPED_CONTACT_SMOOTHING_RATE = 10;

export interface QuadrupedPath {
  readonly centerX: number;
  readonly centerZ: number;
  readonly radius: number;
  readonly speed: number;
}

/**
 * The quadruped proof actor.
 *
 * It uses a different rig definition, a different locomotion layer, and four
 * contact effectors instead of two, and it reaches the screen through exactly
 * the same pose buffers, blender, gait, two-bone IK, and contact IK the player
 * does. Nothing it needs is humanoid, and nothing humanoid is faked for it.
 */
export class QuadrupedActor {
  private readonly root = new THREE.Group();
  private readonly heading = new THREE.Group();
  private readonly rigInstance: ActorRigInstance;
  private readonly locomotion: QuadrupedLocomotionLayer;
  private readonly runtime: ActorAnimationRuntime;
  private readonly geometries: THREE.BufferGeometry[];
  private readonly materials: THREE.Material[];
  private readonly worldPosition = new THREE.Vector3();
  private readonly worldVelocity = new THREE.Vector3();
  private readonly groundNormal = new THREE.Vector3(0, 1, 0);
  private readonly previousPosition = new THREE.Vector3();
  private readonly input = createActorAnimationInput(
    this.worldPosition,
    this.worldVelocity,
    this.groundNormal,
  );
  private pathTime = 0;
  private distanceTravelled = 0;

  constructor(
    scene: THREE.Scene,
    scale: number,
    private readonly path: QuadrupedPath,
    private readonly sampleHeight: (x: number, z: number) => number,
    terrainContact?: ActorTerrainContactSampler,
  ) {
    const rig = quadrupedRig();
    this.root.name = "quadruped-proof";
    this.root.scale.setScalar(scale);
    this.root.add(this.heading);
    scene.add(this.root);
    this.rigInstance = new ActorRigInstance(rig.definition, this.heading);
    const body = buildQuadrupedBody(this.rigInstance, rig.bones);
    this.geometries = body.geometries;
    this.materials = body.materials;
    this.locomotion = new QuadrupedLocomotionLayer(rig.bones);

    // Four effectors, one per limb, sharing the humanoid's contact solver.
    const gait = new ActorGait({
      strideLengthMeters: QUADRUPED_STRIDE_LENGTH_METERS,
      effectors: QUADRUPED_CONTACT_CHAINS.map((chain) => ({
        phaseOffset: rig.definition.effectors.get(chain)?.phaseOffset ?? 0,
        dutyFactor: QUADRUPED_STANCE_DUTY_FACTOR,
      })),
    });
    const paws = [
      ...rig.bones.frontPaw,
      ...rig.bones.hindPaw,
    ];
    const profile: ActorAnimationProfile = {
      definition: rig.definition,
      locomotion: this.locomotion,
      gait,
      enforceJointLimits: true,
      ikStages:
        terrainContact === undefined
          ? undefined
          : [
              new ActorContactIk({
                definition: rig.definition,
                placement: this.heading,
                sampler: terrainContact,
                supportBone: rig.bones.bodyCenter,
                maxSupportDrop: QUADRUPED_MAX_BODY_DROP,
                maxAlignRadians: QUADRUPED_MAX_PAW_ALIGN,
                smoothingRate: QUADRUPED_CONTACT_SMOOTHING_RATE,
                effectors: QUADRUPED_CONTACT_CHAINS.map((chain, index) => ({
                  chain: requireActorChain(rig.definition, chain),
                  gaitEffector: index,
                  soleOffset: QUADRUPED_PAW_DROP,
                  alignBone: paws[index],
                })),
              }),
            ],
    };
    this.runtime = new ActorAnimationRuntime(profile, this.rigInstance);
    this.input.referenceSpeed = Math.max(path.speed, 0.001);
    this.placeOnPath(0);
    this.previousPosition.copy(this.worldPosition);
    this.runtime.reset(this.input);
  }

  update(deltaSeconds: number): void {
    const delta = THREE.MathUtils.clamp(
      Number.isFinite(deltaSeconds) ? deltaSeconds : 0,
      0,
      0.1,
    );
    this.pathTime += delta;
    this.previousPosition.copy(this.worldPosition);
    this.placeOnPath(this.pathTime);

    const deltaX = this.worldPosition.x - this.previousPosition.x;
    const deltaZ = this.worldPosition.z - this.previousPosition.z;
    const travelled = Math.hypot(deltaX, deltaZ);
    this.distanceTravelled += travelled;
    const speed = delta > 0 ? travelled / delta : 0;
    this.worldVelocity
      .subVectors(this.worldPosition, this.previousPosition)
      .divideScalar(delta > 0 ? delta : 1);
    this.input.speed = speed;
    this.input.normalizedSpeed = THREE.MathUtils.clamp(
      speed / this.input.referenceSpeed,
      0,
      1,
    );
    this.input.distanceTravelled = this.distanceTravelled;

    this.root.updateMatrixWorld(true);
    this.runtime.update(delta, this.input);
  }

  dispose(): void {
    this.runtime.dispose();
    this.rigInstance.dispose();
    this.root.removeFromParent();
    for (const geometry of this.geometries) {
      geometry.dispose();
    }
    for (const material of this.materials) {
      material.dispose();
    }
  }

  private placeOnPath(time: number): void {
    const angle =
      this.path.radius > 0 ? (time * this.path.speed) / this.path.radius : 0;
    const x = this.path.centerX + Math.cos(angle) * this.path.radius;
    const z = this.path.centerZ + Math.sin(angle) * this.path.radius;
    this.worldPosition.set(x, this.sampleHeight(x, z), z);
    this.input.facing = -angle;
    this.root.position.copy(this.worldPosition);
    this.heading.rotation.y = -angle;
  }
}
