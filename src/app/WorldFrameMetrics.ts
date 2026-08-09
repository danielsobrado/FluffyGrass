import {
  WORLD_FPS_SAMPLE_INTERVAL_SECONDS,
  WORLD_FRAME_TIMING_SMOOTHING,
} from "./WorldAppTuning";

export type WorldFrameSubsystem =
  | "controls"
  | "terrain"
  | "grass"
  | "renderer"
  | "hud";

export interface WorldFrameTimings {
  controls: number;
  terrain: number;
  grass: number;
  renderer: number;
  hud: number;
}

export class WorldFrameMetrics {
  private frameCount = 0;
  private fpsSampleFrames = 0;
  private fpsSampleElapsed = 0;
  private averageFps = 0;
  private readonly timings: WorldFrameTimings = {
    controls: 0,
    terrain: 0,
    grass: 0,
    renderer: 0,
    hud: 0,
  };

  beginFrame(deltaSeconds: number): void {
    this.frameCount += 1;
    this.fpsSampleFrames += 1;
    this.fpsSampleElapsed += deltaSeconds;
    if (this.fpsSampleElapsed < WORLD_FPS_SAMPLE_INTERVAL_SECONDS) {
      if (this.averageFps === 0 && this.fpsSampleElapsed > 0) {
        this.averageFps = this.fpsSampleFrames / this.fpsSampleElapsed;
      }
      return;
    }
    this.averageFps = this.fpsSampleFrames / this.fpsSampleElapsed;
    this.fpsSampleFrames = 0;
    this.fpsSampleElapsed = 0;
  }

  measure(
    subsystem: WorldFrameSubsystem,
    callback: (deltaSeconds: number) => void,
    deltaSeconds: number,
  ): void {
    const startedAt = performance.now();
    callback(deltaSeconds);
    this.timings[subsystem] +=
      (performance.now() - startedAt - this.timings[subsystem]) *
      WORLD_FRAME_TIMING_SMOOTHING;
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  getAverageFps(): number {
    return this.averageFps;
  }

  getTimings(): Readonly<WorldFrameTimings> {
    return this.timings;
  }
}
