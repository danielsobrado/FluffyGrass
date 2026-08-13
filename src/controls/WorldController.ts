import type * as THREE from "three";

export type WorldControlMode = "fly" | "third-person";

export interface WorldController {
  update(deltaSeconds: number): void;
  dispose(): void;
  getSpeed(): number;
  getInputDiagnostics(): string;
  getStreamingPosition(): THREE.Vector3;
  getMode(): WorldControlMode;
  /**
   * Move to a ground position, clamping into the world and settling onto the
   * surface there. Implementations snap the camera rather than easing it: the
   * destination is arbitrarily far away, so an eased follow would sweep the
   * streaming focus across the whole map and queue every chunk between.
   */
  teleport(x: number, z: number): void;
}
