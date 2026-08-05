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

const MAX_TOUCH_DISTANCE = 70;

export class ThirdPersonInput {
  private readonly keys = new Set<string>();
  private readonly touchMovement = new THREE.Vector2();
  private readonly lookDelta = new THREE.Vector2();
  private movePointer?: PointerState;
  private lookPointer?: PointerState;
  private mobileControls?: HTMLElement;
  private mobileSprint = false;
  private mobileJumpHeld = false;
  private jumpRequested = false;
  private resetRequested = false;
  private zoomDelta = 0;
  private inputEventCount = 0;
  private lastInputType = "idle";

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly profile: RuntimeProfile,
    private readonly config: WorldConfig,
  ) {
    this.bindEvents();
    if (profile.compact) {
      this.createMobileControls();
    }
  }

  getMovement(target: THREE.Vector2): THREE.Vector2 {
    const touch = this.resolveTouchMovement();
    const keyboardX =
      (this.keys.has("KeyD") || this.keys.has("ArrowRight") ? 1 : 0) -
      (this.keys.has("KeyA") || this.keys.has("ArrowLeft") ? 1 : 0);
    const keyboardY =
      (this.keys.has("KeyW") || this.keys.has("ArrowUp") ? 1 : 0) -
      (this.keys.has("KeyS") || this.keys.has("ArrowDown") ? 1 : 0);
    target.set(
      THREE.MathUtils.clamp(keyboardX + touch.x, -1, 1),
      THREE.MathUtils.clamp(keyboardY + touch.y, -1, 1),
    );
    if (target.lengthSq() > 1) {
      target.normalize();
    }
    return target;
  }

  consumeLookDelta(target: THREE.Vector2): THREE.Vector2 {
    target.copy(this.lookDelta);
    this.lookDelta.set(0, 0);
    return target;
  }

  consumeZoomDelta(): number {
    const delta = this.zoomDelta;
    this.zoomDelta = 0;
    return delta;
  }

  consumeJump(): boolean {
    const requested = this.jumpRequested;
    this.jumpRequested = false;
    return requested;
  }

  consumeReset(): boolean {
    const requested = this.resetRequested;
    this.resetRequested = false;
    return requested;
  }

  isJumpHeld(): boolean {
    return this.mobileJumpHeld || this.keys.has("Space");
  }

  isSprinting(): boolean {
    return (
      this.mobileSprint ||
      this.keys.has("ShiftLeft") ||
      this.keys.has("ShiftRight")
    );
  }

  getDiagnostics(): string {
    const movement = this.resolveTouchMovement();
    const active = [
      this.movePointer
        ? `move ${movement.x.toFixed(2)}/${movement.y.toFixed(2)}`
        : "",
      this.lookPointer ? "look" : "",
      this.isSprinting() ? "run" : "",
      this.isJumpHeld() ? "jump" : "",
    ].filter(Boolean);
    return `${active.join(" + ") || this.lastInputType} · events ${this.inputEventCount}`;
  }

  dispose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleWindowBlur);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("pointercancel", this.handlePointerUp);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.canvas.removeEventListener("click", this.handleCanvasClick);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("contextmenu", this.handleContextMenu);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }
    this.mobileControls?.remove();
  }

  private bindEvents(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleWindowBlur);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("pointermove", this.handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", this.handlePointerUp, {
      passive: false,
    });
    window.addEventListener("pointercancel", this.handlePointerUp, {
      passive: false,
    });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.canvas.addEventListener("click", this.handleCanvasClick);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    this.canvas.addEventListener("contextmenu", this.handleContextMenu);
    this.canvas.addEventListener("pointerdown", this.handlePointerDown, {
      passive: false,
    });
    this.canvas.style.touchAction = "none";
  }

  private createMobileControls(): void {
    const controls = document.createElement("div");
    controls.className = "mobile-character-controls";
    controls.innerHTML = `
      <button type="button" data-character-reset aria-label="Return to spawn">⌂</button>
      <button type="button" data-character-jump aria-label="Jump">JUMP</button>
      <button type="button" data-character-run aria-label="Run">RUN</button>
    `;

    controls
      .querySelector<HTMLButtonElement>("[data-character-reset]")
      ?.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.inputEventCount += 1;
        this.lastInputType = "reset";
        this.resetRequested = true;
      });

    const jumpButton = controls.querySelector<HTMLButtonElement>(
      "[data-character-jump]",
    );
    const setJump = (active: boolean, event: Event): void => {
      event.preventDefault();
      event.stopPropagation();
      if (active && !this.mobileJumpHeld) {
        this.jumpRequested = true;
        this.inputEventCount += 1;
        this.lastInputType = "jump";
      }
      this.mobileJumpHeld = active;
    };
    jumpButton?.addEventListener("pointerdown", (event) => setJump(true, event));
    jumpButton?.addEventListener("pointerup", (event) => setJump(false, event));
    jumpButton?.addEventListener("pointercancel", (event) => setJump(false, event));
    jumpButton?.addEventListener("pointerleave", (event) => setJump(false, event));

    const runButton = controls.querySelector<HTMLButtonElement>(
      "[data-character-run]",
    );
    const setSprint = (active: boolean, event: Event): void => {
      event.preventDefault();
      event.stopPropagation();
      this.mobileSprint = active;
      if (active) {
        this.inputEventCount += 1;
        this.lastInputType = "button";
      }
    };
    runButton?.addEventListener("pointerdown", (event) => setSprint(true, event));
    runButton?.addEventListener("pointerup", (event) => setSprint(false, event));
    runButton?.addEventListener("pointercancel", (event) =>
      setSprint(false, event),
    );
    runButton?.addEventListener("pointerleave", (event) =>
      setSprint(false, event),
    );

    document.body.appendChild(controls);
    this.mobileControls = controls;
  }

  private resolveTouchMovement(): THREE.Vector2 {
    if (!this.movePointer) {
      return this.touchMovement.set(0, 0);
    }
    return this.touchMovement.set(
      THREE.MathUtils.clamp(
        (this.movePointer.currentX - this.movePointer.startX) /
          MAX_TOUCH_DISTANCE,
        -1,
        1,
      ),
      THREE.MathUtils.clamp(
        (this.movePointer.startY - this.movePointer.currentY) /
          MAX_TOUCH_DISTANCE,
        -1,
        1,
      ),
    );
  }

  private assignPointer(event: PointerEvent): void {
    const state: PointerState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
    };
    if (event.clientX < window.innerWidth * 0.5 && !this.movePointer) {
      this.movePointer = state;
      this.lastInputType = `${event.pointerType || "pointer"}-move`;
    } else if (!this.lookPointer) {
      this.lookPointer = state;
      this.lastInputType = `${event.pointerType || "pointer"}-look`;
    }
    this.inputEventCount += 1;
  }

  private updatePointer(event: PointerEvent): boolean {
    if (this.movePointer?.pointerId === event.pointerId) {
      this.movePointer.currentX = event.clientX;
      this.movePointer.currentY = event.clientY;
      this.inputEventCount += 1;
      return true;
    }
    if (this.lookPointer?.pointerId === event.pointerId) {
      const deltaX = event.clientX - this.lookPointer.currentX;
      const deltaY = event.clientY - this.lookPointer.currentY;
      this.lookPointer.currentX = event.clientX;
      this.lookPointer.currentY = event.clientY;
      this.lookDelta.x += deltaX * this.config.characterTouchLookSensitivity;
      this.lookDelta.y -= deltaY * this.config.characterTouchLookSensitivity;
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
    this.movePointer = undefined;
    this.lookPointer = undefined;
    this.mobileSprint = false;
    this.mobileJumpHeld = false;
    this.jumpRequested = false;
    this.lookDelta.set(0, 0);
    this.keys.clear();
    this.lastInputType = "idle";
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (isEditableInputTarget(event.target)) {
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      if (!event.repeat) {
        this.jumpRequested = true;
      }
    }
    this.keys.add(event.code);
    this.lastInputType = event.code === "Space" ? "jump" : "keyboard";
    this.inputEventCount += 1;
    if (event.code === "KeyF") {
      this.resetRequested = true;
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
    this.lookDelta.x +=
      event.movementX * this.config.characterMouseLookSensitivity;
    this.lookDelta.y -=
      event.movementY * this.config.characterMouseLookSensitivity;
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.zoomDelta += event.deltaY * this.config.characterZoomSensitivity;
    this.inputEventCount += 1;
    this.lastInputType = "wheel";
  };

  private readonly handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.profile.compact && event.pointerType === "mouse") {
      return;
    }
    event.preventDefault();
    this.assignPointer(event);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.updatePointer(event)) {
      event.preventDefault();
    }
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.releasePointer(event.pointerId)) {
      event.preventDefault();
    }
  };
}
