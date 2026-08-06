import type * as THREE from "three";
import { GpuFrameTimer } from "./GpuFrameTimer";
import {
  GrassWorkloadProbe,
  resolveWorldDiagnosticsRuntime,
} from "./GrassWorkloadProbe";
import { WorldDiagnosticsHud } from "./WorldDiagnosticsHud";

const HUD_UPDATE_INTERVAL_MS = 250;

export interface WorldDiagnosticsOptions {
  gpuTiming: boolean;
  statsPanelEnabled: boolean;
}

export class WorldDiagnosticsController {
  private readonly scene: THREE.Scene;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly originalRender: THREE.WebGLRenderer["render"];
  private readonly probe: GrassWorkloadProbe;
  private readonly gpuTimer: GpuFrameTimer;
  private readonly hud = new WorldDiagnosticsHud();
  private lastHudUpdate = 0;

  private constructor(app: unknown, options: WorldDiagnosticsOptions) {
    const runtime = resolveWorldDiagnosticsRuntime(app);
    this.scene = runtime.scene;
    this.renderer = runtime.renderer;
    this.originalRender = this.renderer.render;
    this.probe = new GrassWorkloadProbe(runtime.grass);
    this.gpuTimer = new GpuFrameTimer(
      this.renderer,
      options.gpuTiming && !options.statsPanelEnabled,
    );
    this.renderer.render = this.renderWithDiagnostics;
  }

  static attach(
    app: unknown,
    options: WorldDiagnosticsOptions,
  ): WorldDiagnosticsController | undefined {
    try {
      return new WorldDiagnosticsController(app, options);
    } catch (error) {
      console.warn("[Drusniel World] Workload diagnostics unavailable.", error);
      return undefined;
    }
  }

  dispose(): void {
    this.renderer.render = this.originalRender;
    this.hud.dispose();
    this.gpuTimer.dispose();
  }

  private readonly renderWithDiagnostics: THREE.WebGLRenderer["render"] = (
    scene,
    camera,
  ): void => {
    if (scene !== this.scene) {
      this.originalRender.call(this.renderer, scene, camera);
      return;
    }

    this.probe.prepareFrame();
    this.gpuTimer.beginFrame();
    try {
      this.originalRender.call(this.renderer, scene, camera);
    } finally {
      this.gpuTimer.endFrame();
      this.probe.finishFrame();
      this.updateHudIfDue();
    }
  };

  private updateHudIfDue(): void {
    const now = performance.now();
    if (now - this.lastHudUpdate < HUD_UPDATE_INTERVAL_MS) {
      return;
    }
    this.lastHudUpdate = now;
    this.hud.update(this.probe.getSnapshot(), this.gpuTimer.getStats());
  }
}
