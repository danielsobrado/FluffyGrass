import * as THREE from "three";

const MAX_IN_FLIGHT_QUERIES = 6;
const MAX_SAMPLES = 120;
const NANOSECONDS_PER_MILLISECOND = 1_000_000;

interface DisjointTimerQueryExtension {
  readonly TIME_ELAPSED_EXT: number;
  readonly GPU_DISJOINT_EXT: number;
}

export type GpuFrameTimerStatus = "disabled" | "unsupported" | "active";

export interface GpuFrameTimingStats {
  status: GpuFrameTimerStatus;
  sampleCount: number;
  medianMs?: number;
  p95Ms?: number;
}

export class GpuFrameTimer {
  private readonly gl?: WebGL2RenderingContext;
  private readonly extension?: DisjointTimerQueryExtension;
  private readonly inFlight: WebGLQuery[] = [];
  private readonly samples: number[] = [];
  private activeQuery?: WebGLQuery;
  private status: GpuFrameTimerStatus;
  private failed = false;

  constructor(renderer: THREE.WebGLRenderer, enabled: boolean) {
    if (!enabled) {
      this.status = "disabled";
      return;
    }

    const context = renderer.getContext();
    if (
      typeof WebGL2RenderingContext === "undefined" ||
      !(context instanceof WebGL2RenderingContext)
    ) {
      this.status = "unsupported";
      return;
    }

    const extension = context.getExtension(
      "EXT_disjoint_timer_query_webgl2",
    ) as DisjointTimerQueryExtension | null;
    if (!extension) {
      this.status = "unsupported";
      return;
    }

    this.gl = context;
    this.extension = extension;
    this.status = "active";
  }

  beginFrame(): void {
    this.poll();
    if (
      this.status !== "active" ||
      this.failed ||
      this.activeQuery ||
      this.inFlight.length >= MAX_IN_FLIGHT_QUERIES
    ) {
      return;
    }

    const query = this.gl?.createQuery();
    if (!query || !this.gl || !this.extension) {
      return;
    }

    try {
      this.gl.beginQuery(this.extension.TIME_ELAPSED_EXT, query);
      this.activeQuery = query;
    } catch (error) {
      this.gl.deleteQuery(query);
      this.disableAfterFailure(error);
    }
  }

  endFrame(): void {
    if (!this.activeQuery || !this.gl || !this.extension) {
      return;
    }

    const query = this.activeQuery;
    this.activeQuery = undefined;
    try {
      this.gl.endQuery(this.extension.TIME_ELAPSED_EXT);
      this.inFlight.push(query);
    } catch (error) {
      this.gl.deleteQuery(query);
      this.disableAfterFailure(error);
    }
  }

  getStats(): GpuFrameTimingStats {
    this.poll();
    if (this.status !== "active" || this.samples.length === 0) {
      return {
        status: this.status,
        sampleCount: this.samples.length,
      };
    }

    const sorted = [...this.samples].sort((left, right) => left - right);
    return {
      status: this.status,
      sampleCount: sorted.length,
      medianMs: percentile(sorted, 0.5),
      p95Ms: percentile(sorted, 0.95),
    };
  }

  dispose(): void {
    if (!this.gl) {
      return;
    }
    if (this.activeQuery) {
      this.gl.deleteQuery(this.activeQuery);
      this.activeQuery = undefined;
    }
    for (const query of this.inFlight) {
      this.gl.deleteQuery(query);
    }
    this.inFlight.length = 0;
    this.samples.length = 0;
  }

  private poll(): void {
    if (
      this.status !== "active" ||
      this.failed ||
      !this.gl ||
      !this.extension
    ) {
      return;
    }

    const disjoint = Boolean(
      this.gl.getParameter(this.extension.GPU_DISJOINT_EXT),
    );
    if (disjoint) {
      for (const query of this.inFlight) {
        this.gl.deleteQuery(query);
      }
      this.inFlight.length = 0;
      this.samples.length = 0;
      return;
    }

    while (this.inFlight.length > 0) {
      const query = this.inFlight[0];
      const available = Boolean(
        this.gl.getQueryParameter(query, this.gl.QUERY_RESULT_AVAILABLE),
      );
      if (!available) {
        break;
      }

      const nanoseconds = Number(
        this.gl.getQueryParameter(query, this.gl.QUERY_RESULT),
      );
      this.gl.deleteQuery(query);
      this.inFlight.shift();
      const milliseconds = nanoseconds / NANOSECONDS_PER_MILLISECOND;
      if (Number.isFinite(milliseconds) && milliseconds >= 0) {
        this.samples.push(milliseconds);
        if (this.samples.length > MAX_SAMPLES) {
          this.samples.shift();
        }
      }
    }
  }

  private disableAfterFailure(error: unknown): void {
    this.failed = true;
    this.status = "unsupported";
    console.warn("[Drusniel World] GPU frame timing disabled.", error);
  }
}

function percentile(sorted: readonly number[], fraction: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * fraction) - 1),
  );
  return sorted[index];
}
