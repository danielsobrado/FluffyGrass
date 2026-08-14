import * as THREE from "three";
import { createActorAnimationInput } from "../../actor/animation/ActorAnimationInput";
import { ActorAnimationRuntime } from "../../actor/animation/ActorAnimationRuntime";
import type { ActorTerrainContactSampler } from "../../actor/ik/ActorTerrainContact";
import { ActorRigInstance } from "../../actor/rig/ActorRigInstance";
import {
  createHumanoidAnimationProfile,
  type HumanoidAnimationProfile,
} from "../animation/HumanoidAnimationProfile";
import { createHumanoidContactIk } from "../animation/HumanoidContactIk";
import { humanoidRig } from "../rig/HumanoidRigDefinition";
import { buildProxyHumanoidBody } from "./ProxyHumanoidBody";

export interface ScriptedHumanoidPath {
  readonly centerX: number;
  readonly centerZ: number;
  readonly radius: number;
  /** Metres per second along the path. */
  readonly speed: number;
  /** Seconds paused at each stop, to prove start and stop transitions. */
  readonly pauseSeconds: number;
  /** Seconds of walking between pauses. */
  readonly walkSeconds: number;
}

/**
 * A non-player humanoid, built on exactly the same rig and profile as the
 * player.
 *
 * This exists to prove the shared actor layer is actually shared. It walks a
 * deterministic circle, stops, starts, and turns, driven entirely by scripted
 * movement facts. It has no reference to `ThirdPersonController`, reads no
 * input, and shares the immutable humanoid rig definition with the player while
 * owning its own rig instance, pose buffers, and runtime state.
 */
export class ScriptedHumanoidActor {
  private readonly root = new THREE.Group();
  private readonly heading = new THREE.Group();
  private readonly rigInstance: ActorRigInstance;
  private readonly profile: HumanoidAnimationProfile;
  private readonly runtime: ActorAnimationRuntime;
  private readonly geometries: THREE.BufferGeometry[];
  private readonly materials: THREE.Material[];
  private readonly worldPosition = new THREE.Vector3();
  private readonly worldVelocity = new THREE.Vector3();
  private readonly groundNormal = new THREE.Vector3(0, 1, 0);
  private readonly input = createActorAnimationInput(
    this.worldPosition,
    this.worldVelocity,
    this.groundNormal,
  );
  private readonly previousPosition = new THREE.Vector3();
  private pathTime = 0;
  private distanceTravelled = 0;
  private previousSpeed = 0;

  constructor(
    scene: THREE.Scene,
    scale: number,
    private readonly path: ScriptedHumanoidPath,
    private readonly sampleHeight: (x: number, z: number) => number,
    terrainContact?: ActorTerrainContactSampler,
  ) {
    const humanoid = humanoidRig();
    this.root.name = "scripted-humanoid";
    this.root.scale.setScalar(scale);
    this.root.add(this.heading);
    scene.add(this.root);
    this.rigInstance = new ActorRigInstance(humanoid.definition, this.heading);
    const body = buildProxyHumanoidBody(this.rigInstance, humanoid.bones);
    this.geometries = body.geometries;
    this.materials = body.materials;
    this.profile = createHumanoidAnimationProfile({
      definition: humanoid.definition,
      bones: humanoid.bones,
      landingRecoverySeconds: 0.25,
      ikStages:
        terrainContact === undefined
          ? undefined
          : [
              createHumanoidContactIk(
                humanoid.definition,
                humanoid.bones,
                terrainContact,
                this.heading,
              ),
            ],
    });
    this.runtime = new ActorAnimationRuntime(this.profile, this.rigInstance);
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
    this.input.acceleration = delta > 0 ? (speed - this.previousSpeed) / delta : 0;
    this.input.distanceTravelled = this.distanceTravelled;
    this.previousSpeed = speed;

    this.root.updateMatrixWorld(true);
    this.profile.locomotion.advanceTime(delta);
    this.runtime.update(delta, this.input);
  }

  dispose(): void {
    this.runtime.dispose();
    this.rigInstance.dispose();
    this.root.removeFromParent();
    // Only this actor's own geometry and materials. The rig definition it
    // shares with the player is immutable and owned by nobody.
    for (const geometry of this.geometries) {
      geometry.dispose();
    }
    for (const material of this.materials) {
      material.dispose();
    }
  }

  /**
   * Walks the circle, pausing on a fixed cycle.
   *
   * Deterministic on purpose: the same elapsed time always produces the same
   * pose, which is what makes this usable as a regression subject.
   */
  private placeOnPath(time: number): void {
    const cycle = this.path.walkSeconds + this.path.pauseSeconds;
    const cycles = Math.floor(time / cycle);
    const withinCycle = time - cycles * cycle;
    const walked =
      cycles * this.path.walkSeconds +
      Math.min(withinCycle, this.path.walkSeconds);
    const angle = this.path.radius > 0 ? (walked * this.path.speed) / this.path.radius : 0;
    const x = this.path.centerX + Math.cos(angle) * this.path.radius;
    const z = this.path.centerZ + Math.sin(angle) * this.path.radius;
    this.worldPosition.set(x, this.sampleHeight(x, z), z);
    // Face along the circle's tangent. Actor forward is +Z, so a world heading
    // of (sin f, cos f) matches the tangent (-sin a, cos a) when f is -a.
    const facing = -angle;
    this.input.facing = facing;
    this.root.position.copy(this.worldPosition);
    this.heading.rotation.y = facing;
  }
}
