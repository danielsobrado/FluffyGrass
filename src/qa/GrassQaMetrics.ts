import type * as THREE from "three";
import type { GrassFrameStats, GrassRendererStats } from "./GrassQaTypes";

const MILLISECONDS_PER_SECOND = 1_000;

export class GrassQaMetrics {
  sampleFrames(durationSeconds: number, collect: boolean): Promise<number[]> {
    return new Promise((resolve) => {
      const durationMs =
        Math.max(0, Number.isFinite(durationSeconds) ? durationSeconds : 0) *
        MILLISECONDS_PER_SECOND;
      const samples: number[] = [];
      let elapsedMs = 0;
      let previousTime: number | undefined;

      const handleVisibilityChange = (): void => {
        if (document.hidden) {
          previousTime = undefined;
        }
      };
      const finish = (): void => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        resolve(samples);
      };
      const step = (time: number): void => {
        if (document.hidden) {
          previousTime = undefined;
          requestAnimationFrame(step);
          return;
        }
        if (previousTime === undefined) {
          previousTime = time;
          if (durationMs === 0) {
            finish();
            return;
          }
          requestAnimationFrame(step);
          return;
        }

        const frameDuration = Math.max(0, time - previousTime);
        previousTime = time;
        elapsedMs += frameDuration;
        if (collect) {
          samples.push(frameDuration);
        }

        if (elapsedMs >= durationMs) {
          finish();
          return;
        }
        requestAnimationFrame(step);
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      requestAnimationFrame(step);
    });
  }

  summarizeFrames(samples: number[]): GrassFrameStats {
    if (samples.length === 0) {
      return {
        samples: 0,
        meanMs: 0,
        p50Ms: 0,
        p95Ms: 0,
        p99Ms: 0,
        maxMs: 0,
      };
    }

    const sorted = [...samples].sort((left, right) => left - right);
    const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    return {
      samples: samples.length,
      meanMs: this.round(mean),
      p50Ms: this.round(this.percentile(sorted, 0.5)),
      p95Ms: this.round(this.percentile(sorted, 0.95)),
      p99Ms: this.round(this.percentile(sorted, 0.99)),
      maxMs: this.round(sorted[sorted.length - 1]),
    };
  }

  readRendererStats(renderer: THREE.WebGLRenderer): GrassRendererStats {
    const render = renderer.info.render;
    return {
      calls: render.calls,
      triangles: render.triangles,
      points: render.points,
      lines: render.lines,
    };
  }

  private percentile(sorted: number[], percentile: number): number {
    const index = Math.min(
      sorted.length - 1,
      Math.max(0, Math.ceil(sorted.length * percentile) - 1),
    );
    return sorted[index];
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
