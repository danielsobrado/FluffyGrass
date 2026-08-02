import * as THREE from "three";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";
import type { WorldConfig } from "../world/WorldConfig";

interface TouchState {
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface FlySpawn {
  position: THREE.Vector3;
  yaw: number;
  pitch: number;
}

const UP = new THREE.Vector3(0, 1, 0);
const MAX_TOUCH_DISTANCE = 70;

export class FlyController {
  private readonly keys = new Set<string>();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly movement = new THREE.Vector3();
  private readonly touchMovement = new THREE.Vector2();
  private readonly spawnPosition = new THREE.Vector3();
  private yaw = 0;
  private pitch = -0.28;
  private spawnYaw = 0;
  private spawnPitch = -0.28;
  private speed: number;
  private verticalTouch = 0;
  private moveTouch?: TouchState;
  private lookTouch?: TouchState;
  private mobileControls?: HTMLElement;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly canvas: HTMLCanvasElement,
    private readonly config: WorldConfig,
    private readonly profile: RuntimeProfile,
    spawn: FlySpawn,
  ) {
    this.speed = config.flySpeed;
    this.spawnPosition.copy(spawn.position);
    this.spawnYaw = spawn.yaw;
    this.spawnPitch = spawn.pitch;
    this.reset();
    this.bindEvents();
    if (profile.compact) {
      this.createMobileControls();
    }
  }

  update(deltaSeconds: number): void {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.1);
    const keyboardForward =
      (this.keys.has("KeyW") || this.keys.has("ArrowUp") ? 1 : 0) -
      (this.keys.has("KeyS") || this.keys.has("ArrowDown") ? 1 : 0);
    const keyboardRight =
      (this.keys.has("KeyD") || this.keys.has("ArrowRight") ? 1 : 0) -
      (this.keys.has("KeyA") || this.keys.has("ArrowLeft") ? 1 : 0);
    const keyboardVertical =
      (this.keys.has("KeyE") || this.keys.has("Space") ? 1 : 0) -
      (this.keys.has("KeyQ") || this.keys.has("ControlLeft") ? 1 : 0);
    const touchMovement = this.resolveTouchMovement();
    const forwardAmount = THREE.MathUtils.clamp(
      keyboardForward + touchMovement.y,
      -1,
      1,
    );
    const rightAmount = THREE.MathUtils.clamp(
      keyboardRight + touchMovement.x,
      -1,
      1,
    );
    const verticalAmount = THREE.MathUtils.clamp(
      keyboardVertical + this.verticalTouch,
      -1,
      1,
    );

    this.camera.getWorldDirection(this.forward);
    this.forward.y = 0;
    if (this.forward.lengthSq() < Number.EPSILON) {
      this.forward.set(0, 0, -1);
    }
    this.forward.normalize();
    this.right.crossVectors(this.forward, UP).normalize();
    this.movement
      .set(0, 0, 0)
      .addScaledVector(this.forward, forwardAmount)
      .addScaledVector(this.right, rightAmount)
      .addScaledVector(UP, verticalAmount);

    if (this.movement.lengthSq() > 1) {
      this.movement.normalize();
    }

    const boost =
      this.keys.has("ShiftLeft") || this.keys.has("ShiftRight")
        ? this.config.flyBoostMultiplier
        : 1;
    this.camera.position.addScaledVector(
      this.movement,
      this.speed * boost * delta,
    );
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }

  reset(): void {
    this.camera.position.copy(this.spawnPosition);
    this.yaw = this.spawnYaw;
    this.pitch = this.spawnPitch;
    this.verticalTouch = 0;
    this.moveTouch = undefined;
    this.lookTouch = undefined;
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }

  getSpeed(): number {
    return this.speed;
  }

  dispose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("click", this.handleCanvasClick);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("pointercancel", this.handlePointerUp);
    this.mobileControls?.remove();
  }

  private bindEvents(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("click", this.handleCanvasClick);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerup", this.handlePointerUp);
    this.canvas.addEventListener("pointercancel", this.handlePointerUp);
    this.canvas.style.touchAction = "none";
  }

  private createMobileControls(): void {
    const controls = document.createElement("div");
    controls.className = "mobile-flight-controls";
    controls.innerHTML = `
      <button type="button" data-flight-reset aria-label="Return to dense field">⌂</button>
      <button type="button" data-flight-vertical="1" aria-label="Fly up">▲</button>
      <button type="button" data-flight-vertical="-1" aria-label="Fly down">▼</button>
    `;

    const resetButton = controls.querySelector<HTMLButtonElement>(
      "[data-flight-reset]",
    );
    resetButton?.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.reset();
    });

    for (const button of controls.querySelectorAll<HTMLButtonElement>(
      "[data-flight-vertical]",
    )) {
      const value = Number(button.dataset.flightVertical);
      const activate = (event: Event): void => {
        event.preventDefault();
        this.verticalTouch = value;
      };
      const deactivate = (event: Event): void => {
        event.preventDefault();
        if (this.verticalTouch === value) {
          this.verticalTouch = 0;
        }
      };
      button.addEventListener("pointerdown", activate);
      button.addEventListener("pointerup", deactivate);
      button.addEventListener("pointercancel", deactivate);
      button.addEventListener("pointerleave", deactivate);
    }
    document.body.appendChild(controls);
    this.mobileControls = controls;
  }

  private resolveTouchMovement(): THREE.Vector2 {
    if (!this.moveTouch) {
      return this.touchMovement.set(0, 0);
    }
    const x = THREE.MathUtils.clamp(
      (this.moveTouch.currentX - this.moveTouch.startX) / MAX_TOUCH_DISTANCE,
      -1,
      1,
    );
    const y = THREE.MathUtils.clamp(
      (this.moveTouch.startY - this.moveTouch.currentY) / MAX_TOUCH_DISTANCE,
      -1,
      1,
    );
    return this.touchMovement.set(x, y);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.keys.add(event.code);
    if (event.code === "KeyF") {
      this.reset();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private readonly handleCanvasClick = (): void => {
    if (!this.profile.compact && document.pointerLockElement !== this.canvas) {
      void this.canvas.requestPointerLock();
    }
  };

  private readonly handleMouseMove = (event: MouseEvent): void => {
    if (document.pointerLockElement !== this.canvas) {
      return;
    }
    this.rotate(event.movementX, event.movementY, 0.0022);
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    this.speed = THREE.MathUtils.clamp(
      this.speed * factor,
      this.config.flyMinSpeed,
      this.config.flyMaxSpeed,
    );
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === "mouse") {
      return;
    }
    this.canvas.setPointerCapture(event.pointerId);
    const state: TouchState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
    };
    if (event.clientX < window.innerWidth * 0.5 && !this.moveTouch) {
      this.moveTouch = state;
    } else if (!this.lookTouch) {
      this.lookTouch = state;
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.moveTouch?.pointerId === event.pointerId) {
      this.moveTouch.currentX = event.clientX;
      this.moveTouch.currentY = event.clientY;
      return;
    }
    if (this.lookTouch?.pointerId === event.pointerId) {
      const deltaX = event.clientX - this.lookTouch.currentX;
      const deltaY = event.clientY - this.lookTouch.currentY;
      this.lookTouch.currentX = event.clientX;
      this.lookTouch.currentY = event.clientY;
      this.rotate(deltaX, deltaY, 0.004);
    }
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.moveTouch?.pointerId === event.pointerId) {
      this.moveTouch = undefined;
    }
    if (this.lookTouch?.pointerId === event.pointerId) {
      this.lookTouch = undefined;
    }
  };

  private rotate(deltaX: number, deltaY: number, sensitivity: number): void {
    this.yaw -= deltaX * sensitivity;
    this.pitch = THREE.MathUtils.clamp(
      this.pitch - deltaY * sensitivity,
      -Math.PI * 0.48,
      Math.PI * 0.48,
    );
  }
}
