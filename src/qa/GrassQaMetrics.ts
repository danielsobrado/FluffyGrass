import type * as THREE from "three";
import type { GrassFrameStats, GrassRendererStats } from "./GrassQaTypes";

export class GrassQaMetrics {
  sampleFrames(durationSeconds: number, collect: boolean): Promise<number[]> {
    return new Promise((resolve) => {
      const durationMs = durationSeconds * 1_000;
      const samples: number[] = [];
      let startTime = 0;
      let previousTime = 0;

      const step = (time: number): void => {
        if (startTime === 0) {
          startTime = time;
          previousTime = time;
        } else if (collect) {
          samples.push(time - previousTime);
          previousTime = time;
        }

        if (time - startTime >= durationMs) {
          resolve(samples);
          return;
        }
        requestAnimationFrame(step);
      };

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
