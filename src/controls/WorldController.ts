import type * as THREE from "three";

export type WorldControlMode = "fly" | "third-person";

export interface WorldController {
  update(deltaSeconds: number): void;
  dispose(): void;
  getSpeed(): number;
  getInputDiagnostics(): string;
  getStreamingPosition(): THREE.Vector3;
  getMode(): WorldControlMode;
}
