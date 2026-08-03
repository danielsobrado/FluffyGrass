import * as THREE from "three";
import { SnowflowCharacter } from "../character/SnowflowCharacter";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";
import type { DenseWorldSpawn } from "../world/DenseSpawnLocator";
import type { TerrainField } from "../world/TerrainField";
import type { WorldConfig } from "../world/WorldConfig";
import { ThirdPersonInput } from "./ThirdPersonInput";
import type { WorldController, WorldControlMode } from "./WorldController";

const CAMERA_COLLISION_SAMPLES = [0.35, 0.6, 0.85] as const;
const CAMERA_POSITION_RATE = 12;
const MIN_MOVEMENT_SPEED = 0.05;

export class ThirdPersonController implements WorldController {
  private readonly input: ThirdPersonInput;
  private readonly character: SnowflowCharacter;
  private readonly position = new THREE.Vector3();
  private readonly spawnPosition = new THREE.Vector3();
  private readonly velocity = new THREE.Vector3();
  private readonly desiredVelocity = new THREE.Vector3();
  private readonly velocityDelta = new THREE.Vector3();
  private readonly moveInput = new THREE.Vector2();
  private readonly lookInput = new THREE.Vector2();
  private readonly cameraForward = new THREE.Vector3();
  private readonly cameraRight = new THREE.Vector3();
  private readonly movement = new THREE.Vector3();
  private readonly groundNormal = new THREE.Vector3(0, 1, 0);
  private readonly cameraTarget = new THREE.Vector3();
  private readonly desiredCameraPosition = new THREE.Vector3();
  private readonly cameraSample = new THREE.Vector3();
  private facing = 0;
  private spawnFacing = 0;
  private cameraYaw = 0;
  private cameraElevation: number;
  private cameraDistance: number;
  private speed = 0;
  private previousSpeed = 0;
  private acceleration = 0;
  private distanceTravelled = 0;

  constructor(
    scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    canvas: HTMLCanvasElement,
    private readonly field: TerrainField,
    private readonly config: WorldConfig,
    profile: RuntimeProfile,
    spawn: DenseWorldSpawn,
  ) {
    this.input = new ThirdPersonInput(canvas, profile, config);
    this.character = new SnowflowCharacter(scene, config.characterScale);
    this.cameraElevation = THREE.MathUtils.degToRad(
      config.characterCameraElevationDegrees,
    );
    this.cameraDistance = config.characterCameraDistance;
    this.spawnPosition.set(
      spawn.position.x,
      field.sampleHeight(spawn.position.x, spawn.position.z),
      spawn.position.z,
    );
    this.spawnFacing = normalizeAngle(spawn.yaw + Math.PI);
    this.reset();
  }

  update(deltaSeconds: number): void {
    const delta = THREE.MathUtils.clamp(deltaSeconds, 0, 0.1);
    if (this.input.consumeReset()) {
      this.reset();
      return;
    }

    this.updateCameraInput();
    this.updateMovement(delta);
    this.updateCamera(delta, false);
    this.character.update(delta, {
      position: this.position,
      groundNormal: this.groundNormal,
      facing: this.facing,
      speed: this.speed,
      runSpeed: this.config.characterRunSpeed,
      acceleration: this.acceleration,
      distanceTravelled: this.distanceTravelled,
    });
  }

  dispose(): void {
    this.input.dispose();
    this.character.dispose();
  }

  getSpeed(): number {
    return this.speed;
  }

  getInputDiagnostics(): string {
    return this.input.getDiagnostics();
  }

  getStreamingPosition(): THREE.Vector3 {
    return this.position;
  }

  getMode(): WorldControlMode {
    return "third-person";
  }

  private reset(): void {
    this.position.copy(this.spawnPosition);
    this.velocity.set(0, 0, 0);
    this.desiredVelocity.set(0, 0, 0);
    this.facing = this.spawnFacing;
    this.cameraYaw = this.spawnFacing;
    this.cameraElevation = THREE.MathUtils.degToRad(
      this.config.characterCameraElevationDegrees,
    );
    this.cameraDistance = this.config.characterCameraDistance;
    this.speed = 0;
    this.previousSpeed = 0;
    this.acceleration = 0;
    this.distanceTravelled = 0;
    this.field.sampleNormal(
      this.position.x,
      this.position.z,
      this.groundNormal,
    );
    this.updateCamera(1, true);
    this.character.update(0, {
      position: this.position,
      groundNormal: this.groundNormal,
      facing: this.facing,
      speed: 0,
      runSpeed: this.config.characterRunSpeed,
      acceleration: 0,
      distanceTravelled: 0,
    });
  }

  private updateCameraInput(): void {
    this.input.consumeLookDelta(this.lookInput);
    this.cameraYaw = normalizeAngle(this.cameraYaw + this.lookInput.x);
    this.cameraElevation = THREE.MathUtils.clamp(
      this.cameraElevation + this.lookInput.y,
      THREE.MathUtils.degToRad(this.config.characterCameraMinElevationDegrees),
      THREE.MathUtils.degToRad(this.config.characterCameraMaxElevationDegrees),
    );
    this.cameraDistance = THREE.MathUtils.clamp(
      this.cameraDistance + this.input.consumeZoomDelta(),
      this.config.characterCameraMinDistance,
      this.config.characterCameraMaxDistance,
    );
  }

  private updateMovement(deltaSeconds: number): void {
    this.input.getMovement(this.moveInput);
    this.cameraForward.set(
      Math.sin(this.cameraYaw),
      0,
      Math.cos(this.cameraYaw),
    );
    this.cameraRight.set(
      Math.cos(this.cameraYaw),
      0,
      -Math.sin(this.cameraYaw),
    );
    this.movement
      .set(0, 0, 0)
      .addScaledVector(this.cameraForward, this.moveInput.y)
      .addScaledVector(this.cameraRight, this.moveInput.x);

    const hasMovement = this.movement.lengthSq() > 1e-6;
    if (hasMovement) {
      this.movement.normalize();
    }
    const targetSpeed = hasMovement
      ? this.input.isSprinting()
        ? this.config.characterRunSpeed
        : this.config.characterWalkSpeed
      : 0;
    this.desiredVelocity.copy(this.movement).multiplyScalar(targetSpeed);
    this.velocityDelta.subVectors(this.desiredVelocity, this.velocity);
    const maxVelocityChange =
      (hasMovement
        ? this.config.characterAcceleration
        : this.config.characterDeceleration) * deltaSeconds;
    if (this.velocityDelta.lengthSq() > maxVelocityChange * maxVelocityChange) {
      this.velocityDelta.setLength(maxVelocityChange);
    }
    this.velocity.add(this.velocityDelta);

    this.previousSpeed = this.speed;
    this.speed = Math.hypot(this.velocity.x, this.velocity.z);
    this.acceleration =
      deltaSeconds > Number.EPSILON
        ? (this.speed - this.previousSpeed) / deltaSeconds
        : 0;

    if (this.speed > MIN_MOVEMENT_SPEED) {
      const desiredFacing = Math.atan2(this.velocity.x, this.velocity.z);
      this.facing = angleDamp(
        this.facing,
        desiredFacing,
        this.config.characterTurnRate,
        deltaSeconds,
      );
      if (this.lookInput.lengthSq() < 1e-8) {
        this.cameraYaw = angleDamp(
          this.cameraYaw,
          this.facing,
          this.config.characterCameraFollowRate,
          deltaSeconds,
        );
      }
    }

    const previousX = this.position.x;
    const previousZ = this.position.z;
    this.position.addScaledVector(this.velocity, deltaSeconds);
    const halfWorld = this.config.worldSize * 0.5 - 2;
    this.position.x = THREE.MathUtils.clamp(
      this.position.x,
      -halfWorld,
      halfWorld,
    );
    this.position.z = THREE.MathUtils.clamp(
      this.position.z,
      -halfWorld,
      halfWorld,
    );
    this.position.y = this.field.sampleHeight(
      this.position.x,
      this.position.z,
    );
    this.field.sampleNormal(
      this.position.x,
      this.position.z,
      this.groundNormal,
    );
    this.distanceTravelled += Math.hypot(
      this.position.x - previousX,
      this.position.z - previousZ,
    );
  }

  private updateCamera(deltaSeconds: number, immediate: boolean): void {
    this.cameraTarget.set(
      this.position.x,
      this.position.y + this.config.characterCameraLookHeight,
      this.position.z,
    );
    const horizontalDistance =
      this.cameraDistance * Math.cos(this.cameraElevation);
    this.cameraForward.set(
      Math.sin(this.cameraYaw),
      0,
      Math.cos(this.cameraYaw),
    );
    this.desiredCameraPosition
      .copy(this.cameraTarget)
      .addScaledVector(this.cameraForward, -horizontalDistance);
    this.desiredCameraPosition.y +=
      this.cameraDistance * Math.sin(this.cameraElevation);
    this.resolveCameraTerrainCollision();

    if (immediate) {
      this.camera.position.copy(this.desiredCameraPosition);
    } else {
      const blend = 1 - Math.exp(-CAMERA_POSITION_RATE * deltaSeconds);
      this.camera.position.lerp(this.desiredCameraPosition, blend);
      const cameraGround = this.field.sampleHeight(
        this.camera.position.x,
        this.camera.position.z,
      );
      this.camera.position.y = Math.max(
        this.camera.position.y,
        cameraGround + this.config.characterCameraGroundClearance,
      );
    }
    this.camera.lookAt(this.cameraTarget);
  }

  private resolveCameraTerrainCollision(): void {
    const clearance = this.config.characterCameraGroundClearance;
    for (const amount of CAMERA_COLLISION_SAMPLES) {
      this.cameraSample.lerpVectors(
        this.cameraTarget,
        this.desiredCameraPosition,
        amount,
      );
      const terrainHeight = this.field.sampleHeight(
        this.cameraSample.x,
        this.cameraSample.z,
      );
      const lineHeight = THREE.MathUtils.lerp(
        this.cameraTarget.y,
        this.desiredCameraPosition.y,
        amount,
      );
      const penetration = terrainHeight + clearance - lineHeight;
      if (penetration > 0) {
        this.desiredCameraPosition.y += penetration / amount;
      }
    }
    const cameraGround = this.field.sampleHeight(
      this.desiredCameraPosition.x,
      this.desiredCameraPosition.z,
    );
    this.desiredCameraPosition.y = Math.max(
      this.desiredCameraPosition.y,
      cameraGround + clearance,
    );
  }
}

function angleDamp(
  current: number,
  target: number,
  rate: number,
  deltaSeconds: number,
): number {
  const difference = normalizeAngle(target - current);
  return normalizeAngle(
    current + difference * (1 - Math.exp(-rate * deltaSeconds)),
  );
}

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
