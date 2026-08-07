import * as THREE from "three";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";
import type { WorldConfig } from "../world/WorldConfig";
import {
  isEditableInputTarget,
  requestPointerLockSafely,
} from "./InputTarget";

interface PointerState {
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
const MAX_FRAME_DELTA_SECONDS = 0.1;
const POINTER_LOOK_SENSITIVITY = 0.004;
const MOUSE_LOOK_SENSITIVITY = 0.0022;

export class FlyController {
  private readonly keys = new Set<string>();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly movement = new THREE.Vector3();
  private readonly touchMovement = new THREE.Vector2();
  private readonly spawnPosition = new THREE.Vector3();
  private readonly usesPointerEvents = typeof window.PointerEvent !== "undefined";
  private yaw = 0;
  private pitch = -0.28;
  private spawnYaw = 0;
  private spawnPitch = -0.28;
  private speed: number;
  private verticalTouch = 0;
  private movePointer?: PointerState;
  private lookPointer?: PointerState;
  private mobileControls?: HTMLElement;
  private inputEventCount = 0;
  private lastInputType = "idle";
  private previousTouchAction = "";
  private disposed = false;

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
    this.previousTouchAction = canvas.style.touchAction;
    this.reset();
    this.bindEvents();
    if (profile.compact) {
      this.createMobileControls();
    }
  }

  update(deltaSeconds: number): void {
    if (this.disposed) {
      return;
    }
    const delta = THREE.MathUtils.clamp(
      Number.isFinite(deltaSeconds) ? deltaSeconds : 0,
      0,
      MAX_FRAME_DELTA_SECONDS,
    );
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
    if (this.disposed) {
      return;
    }
    this.camera.position.copy(this.spawnPosition);
    this.yaw = this.spawnYaw;
    this.pitch = this.spawnPitch;
    this.clearTransientInput();
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }

  getSpeed(): number {
    return this.speed;
  }

  getInputDiagnostics(): string {
    const movement = this.resolveTouchMovement();
    const active = [
      this.movePointer ? `move ${movement.x.toFixed(2)}/${movement.y.toFixed(2)}` : "",
      this.lookPointer ? "look" : "",
      this.verticalTouch !== 0 ? `vertical ${this.verticalTouch}` : "",
    ].filter(Boolean);
    return `${active.join(" + ") || this.lastInputType} · events ${this.inputEventCount}`;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleWindowBlur);
    window.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.canvas.removeEventListener("click", this.handleCanvasClick);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("contextmenu", this.handleContextMenu);
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }

    if (this.usesPointerEvents) {
      this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
      window.removeEventListener("pointermove", this.handlePointerMove);
      window.removeEventListener("pointerup", this.handlePointerUp);
      window.removeEventListener("pointercancel", this.handlePointerUp);
    } else {
      this.canvas.removeEventListener("touchstart", this.handleTouchStart);
      window.removeEventListener("touchmove", this.handleTouchMove);
      window.removeEventListener("touchend", this.handleTouchEnd);
      window.removeEventListener("touchcancel", this.handleTouchEnd);
    }

    this.clearTransientInput();
    this.mobileControls?.remove();
    this.mobileControls = undefined;
    this.canvas.style.touchAction = this.previousTouchAction;
  }

  private bindEvents(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleWindowBlur);
    window.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.canvas.addEventListener("click", this.handleCanvasClick);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    this.canvas.addEventListener("contextmenu", this.handleContextMenu);

    if (this.usesPointerEvents) {
      this.canvas.addEventListener("pointerdown", this.handlePointerDown, {
        passive: false,
      });
      window.addEventListener("pointermove", this.handlePointerMove, {
        passive: false,
      });
      window.addEventListener("pointerup", this.handlePointerUp, {
        passive: false,
      });
      window.addEventListener("pointercancel", this.handlePointerUp, {
        passive: false,
      });
    } else {
      this.canvas.addEventListener("touchstart", this.handleTouchStart, {
        passive: false,
      });
      window.addEventListener("touchmove", this.handleTouchMove, {
        passive: false,
      });
      window.addEventListener("touchend", this.handleTouchEnd, {
        passive: false,
      });
      window.addEventListener("touchcancel", this.handleTouchEnd, {
        passive: false,
      });
    }

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
      event.stopPropagation();
      this.inputEventCount += 1;
      this.lastInputType = "reset";
      this.reset();
    });

    for (const button of controls.querySelectorAll<HTMLButtonElement>(
      "[data-flight-vertical]",
    )) {
      const value = Number(button.dataset.flightVertical);
      const activate = (event: Event): void => {
        event.preventDefault();
        event.stopPropagation();
        this.inputEventCount += 1;
        this.lastInputType = "button";
        this.verticalTouch = value;
      };
      const deactivate = (event: Event): void => {
        event.preventDefault();
        event.stopPropagation();
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
    if (!this.movePointer) {
      return this.touchMovement.set(0, 0);
    }
    const x = THREE.MathUtils.clamp(
      (this.movePointer.currentX - this.movePointer.startX) /
        MAX_TOUCH_DISTANCE,
      -1,
      1,
    );
    const y = THREE.MathUtils.clamp(
      (this.movePointer.startY - this.movePointer.currentY) /
        MAX_TOUCH_DISTANCE,
      -1,
      1,
    );
    return this.touchMovement.set(x, y);
  }

  private assignPointer(
    pointerId: number,
    clientX: number,
    clientY: number,
    inputType: string,
  ): void {
    const state: PointerState = {
      pointerId,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
    };
    if (clientX < window.innerWidth * 0.5 && !this.movePointer) {
      this.movePointer = state;
      this.lastInputType = `${inputType}-move`;
    } else if (!this.lookPointer) {
      this.lookPointer = state;
      this.lastInputType = `${inputType}-look`;
    }
    this.inputEventCount += 1;
  }

  private updatePointer(
    pointerId: number,
    clientX: number,
    clientY: number,
  ): boolean {
    if (this.movePointer?.pointerId === pointerId) {
      this.movePointer.currentX = clientX;
      this.movePointer.currentY = clientY;
      this.inputEventCount += 1;
      return true;
    }
    if (this.lookPointer?.pointerId === pointerId) {
      const deltaX = clientX - this.lookPointer.currentX;
      const deltaY = clientY - this.lookPointer.currentY;
      this.lookPointer.currentX = clientX;
      this.lookPointer.currentY = clientY;
      this.rotate(deltaX, deltaY, POINTER_LOOK_SENSITIVITY);
      this.inputEventCount += 1;
      return true;
    }
    return false;
  }

  private releasePointer(pointerId: number): boolean {
    let released = false;
    if (this.movePointer?.pointerId === pointerId) {
      this.movePointer = undefined;
      released = true;
    }
    if (this.lookPointer?.pointerId === pointerId) {
      this.lookPointer = undefined;
      released = true;
    }
    if (released) {
      this.inputEventCount += 1;
      this.lastInputType = "idle";
    }
    return released;
  }

  private clearTransientInput(): void {
    this.verticalTouch = 0;
    this.movePointer = undefined;
    this.lookPointer = undefined;
    this.keys.clear();
    this.lastInputType = "idle";
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (isEditableInputTarget(event.target)) {
      return;
    }
    this.keys.add(event.code);
    this.lastInputType = "keyboard";
    this.inputEventCount += 1;
    if (event.code === "KeyF") {
      this.reset();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private readonly handleWindowBlur = (): void => {
    this.clearTransientInput();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.clearTransientInput();
    }
  };

  private readonly handleCanvasClick = (): void => {
    if (!this.profile.compact && document.pointerLockElement !== this.canvas) {
      requestPointerLockSafely(this.canvas);
    }
  };

  private readonly handleMouseMove = (event: MouseEvent): void => {
    if (document.pointerLockElement !== this.canvas) {
      return;
    }
    this.rotate(event.movementX, event.movementY, MOUSE_LOOK_SENSITIVITY);
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

  private readonly handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.profile.compact && event.pointerType === "mouse") {
      return;
    }
    event.preventDefault();
    this.assignPointer(
      event.pointerId,
      event.clientX,
      event.clientY,
      event.pointerType || "pointer",
    );
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.updatePointer(event.pointerId, event.clientX, event.clientY)) {
      event.preventDefault();
    }
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.releasePointer(event.pointerId)) {
      event.preventDefault();
    }
  };

  private readonly handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault();
    for (const touch of Array.from(event.changedTouches)) {
      this.assignPointer(touch.identifier, touch.clientX, touch.clientY, "touch");
    }
  };

  private readonly handleTouchMove = (event: TouchEvent): void => {
    let handled = false;
    for (const touch of Array.from(event.changedTouches)) {
      handled =
        this.updatePointer(touch.identifier, touch.clientX, touch.clientY) ||
        handled;
    }
    if (handled) {
      event.preventDefault();
    }
  };

  private readonly handleTouchEnd = (event: TouchEvent): void => {
    let handled = false;
    for (const touch of Array.from(event.changedTouches)) {
      handled = this.releasePointer(touch.identifier) || handled;
    }
    if (handled) {
      event.preventDefault();
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
