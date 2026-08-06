const MAX_IN_FLIGHT_QUERIES = 6;
const MAX_GPU_SAMPLES = 120;
const NANOSECONDS_PER_MILLISECOND = 1_000_000;
const HUD_UPDATE_INTERVAL_MS = 250;
const MID_INDICES_PER_BLADE = 3;

export function attachWorldDiagnostics(app, options = {}) {
  try {
    const scene = app?.scene;
    const renderer = app?.renderer;
    const grass = app?.grass;
    if (!scene || !renderer || !grass) {
      throw new Error("World diagnostics require scene, renderer, and grass systems.");
    }

    const probe = new GrassWorkloadProbe(grass);
    const gpuTimer = new GpuFrameTimer(
      renderer,
      options.gpuTiming === true && options.statsPanelEnabled !== true,
    );
    const hud = new WorldDiagnosticsHud();
    const originalRender = renderer.render;
    let lastHudUpdate = 0;

    renderer.render = function renderWithDiagnostics(renderScene, camera) {
      if (renderScene !== scene) {
        return originalRender.call(renderer, renderScene, camera);
      }

      probe.prepareFrame();
      gpuTimer.beginFrame();
      try {
        return originalRender.call(renderer, renderScene, camera);
      } finally {
        gpuTimer.endFrame();
        probe.finishFrame();
        const now = performance.now();
        if (now - lastHudUpdate >= HUD_UPDATE_INTERVAL_MS) {
          lastHudUpdate = now;
          hud.update(probe.getSnapshot(), gpuTimer.getStats());
        }
      }
    };

    return {
      dispose() {
        renderer.render = originalRender;
        hud.dispose();
        gpuTimer.dispose();
      },
    };
  } catch (error) {
    console.warn("[Drusniel World] Workload diagnostics unavailable.", error);
    return undefined;
  }
}

class GrassWorkloadProbe {
  constructor(grass) {
    this.grass = grass;
    this.instrumentedMeshes = new WeakSet();
    this.meshKinds = new WeakMap();
    this.currentFrame = createEmptyFrameWorkload();
    this.lastFrame = createEmptyFrameWorkload();
  }

  prepareFrame() {
    this.currentFrame = createEmptyFrameWorkload();
    const near = this.grass.nearField;
    this.instrumentTileField(near?.baseField, "near-base");
    this.instrumentTileField(near?.baseDetailedField, "near-detail");
    this.instrumentTileField(near?.ultraNearField, "near-ultra");

    for (const patch of this.grass.patches ?? []) {
      this.instrumentMesh(patch.midMesh, "mid");
    }
    for (const group of this.grass.farGroups ?? []) {
      this.instrumentMesh(group.mesh, "far");
    }
  }

  finishFrame() {
    this.lastFrame = this.currentFrame;
  }

  getSnapshot() {
    const near = this.grass.nearField;
    const nearResidentUniqueInstances =
      sumResidentInstances(near?.baseField) +
      sumResidentInstances(near?.ultraNearField);
    const nearBladesPerPatch = this.grass.nearBladesPerPatch ?? 0;
    const midBladesPerPatch = this.grass.midBladesPerPatch ?? 0;
    let residentPatchInstances = 0;
    let patchLogical = 0;
    let visiblePatchLogical = 0;

    for (const patch of this.grass.patches ?? []) {
      residentPatchInstances += patch.instanceCount;
      const logical = Math.round(
        patch.instanceCount *
          (patch.midCoverage * midBladesPerPatch +
            patch.farCoverage * nearBladesPerPatch),
      );
      patchLogical += logical;
      if (patch.inFrustum) {
        visiblePatchLogical += logical;
      }
    }

    return {
      ...this.lastFrame,
      ready: this.grass.initialized === true,
      residentPatchInstances,
      nearResidentUniqueInstances,
      logicalBladeEquivalents: nearResidentUniqueInstances + patchLogical,
      visibleLogicalBladeEquivalents:
        this.lastFrame.nearBaseInstances +
        this.lastFrame.nearUltraInstances +
        visiblePatchLogical,
    };
  }

  instrumentTileField(field, kind) {
    for (const tile of field?.tiles?.values() ?? []) {
      this.instrumentMesh(tile.mesh, kind);
    }
  }

  instrumentMesh(mesh, kind) {
    if (!mesh) {
      return;
    }
    this.meshKinds.set(mesh, kind);
    if (this.instrumentedMeshes.has(mesh)) {
      return;
    }
    this.instrumentedMeshes.add(mesh);
    const original = mesh.onBeforeRender;
    mesh.onBeforeRender = (...args) => {
      this.recordSubmission(mesh);
      original.call(mesh, ...args);
    };
  }

  recordSubmission(mesh) {
    const kind = this.meshKinds.get(mesh);
    if (!kind) {
      return;
    }
    const instances = Math.max(0, mesh.count);
    const submittedIndices = resolveSubmittedIndexCount(mesh.geometry);

    switch (kind) {
      case "near-base":
        this.currentFrame.nearBaseInstances += instances;
        this.addNearTriangles(instances, submittedIndices);
        break;
      case "near-detail":
        this.currentFrame.nearDetailInstances += instances;
        this.addNearTriangles(instances, submittedIndices);
        break;
      case "near-ultra":
        this.currentFrame.nearUltraInstances += instances;
        this.addNearTriangles(instances, submittedIndices);
        break;
      case "mid":
        this.currentFrame.midSubmittedVertices += submittedIndices * instances;
        this.currentFrame.midSubmittedBlades +=
          Math.floor(submittedIndices / MID_INDICES_PER_BLADE) * instances;
        break;
      case "far":
        this.currentFrame.farSubmittedCards += instances;
        break;
    }
  }

  addNearTriangles(instances, submittedIndices) {
    this.currentFrame.nearSubmittedTriangles +=
      Math.floor(submittedIndices / 3) * instances;
  }
}

class GpuFrameTimer {
  constructor(renderer, enabled) {
    this.inFlight = [];
    this.samples = [];
    this.activeQuery = undefined;
    this.failed = false;

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

    const extension = context.getExtension("EXT_disjoint_timer_query_webgl2");
    if (!extension) {
      this.status = "unsupported";
      return;
    }

    this.gl = context;
    this.extension = extension;
    this.status = "active";
  }

  beginFrame() {
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

  endFrame() {
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

  getStats() {
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

  dispose() {
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

  poll() {
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
        if (this.samples.length > MAX_GPU_SAMPLES) {
          this.samples.shift();
        }
      }
    }
  }

  disableAfterFailure(error) {
    this.failed = true;
    this.status = "unsupported";
    console.warn("[Drusniel World] GPU frame timing disabled.", error);
  }
}

class WorldDiagnosticsHud {
  constructor() {
    this.element = document.querySelector("#world-stats");
    this.baseText = "";
    this.renderedText = "";
    this.snapshot = undefined;
    this.gpu = undefined;

    if (!this.element) {
      return;
    }
    this.baseText = this.element.textContent ?? "";
    this.observer = new MutationObserver(() => this.handleMutation());
    this.observer.observe(this.element, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  update(snapshot, gpu) {
    this.snapshot = snapshot;
    this.gpu = gpu;
    this.render();
  }

  dispose() {
    this.observer?.disconnect();
  }

  handleMutation() {
    if (!this.element) {
      return;
    }
    const current = this.element.textContent ?? "";
    if (current === this.renderedText) {
      return;
    }
    this.baseText = current;
    this.render();
  }

  render() {
    if (!this.element || !this.baseText || !this.snapshot || !this.gpu) {
      return;
    }
    const output = [];
    let workloadInserted = false;

    for (const line of this.baseText.split("\n")) {
      if (line.startsWith("Grass submit ")) {
        continue;
      }
      if (isGrassSummaryLine(line) && this.snapshot.ready) {
        output.push(...formatWorkloadLines(this.snapshot));
        workloadInserted = true;
        continue;
      }
      if (line.startsWith("Draws ")) {
        const baseLine = line.replace(/ · GPU (?:off|N\/A|warming|scene).*$/, "");
        output.push(`${baseLine} · ${formatGpuTiming(this.gpu)}`);
        continue;
      }
      output.push(line);
    }

    if (!workloadInserted && this.snapshot.ready) {
      output.push(...formatWorkloadLines(this.snapshot));
    }

    const rendered = output.filter(Boolean).join("\n");
    if (rendered === this.renderedText) {
      return;
    }
    this.renderedText = rendered;
    this.element.textContent = rendered;
  }
}

function createEmptyFrameWorkload() {
  return {
    nearBaseInstances: 0,
    nearDetailInstances: 0,
    nearUltraInstances: 0,
    nearSubmittedTriangles: 0,
    midSubmittedBlades: 0,
    midSubmittedVertices: 0,
    farSubmittedCards: 0,
  };
}

function sumResidentInstances(field) {
  let total = 0;
  for (const tile of field?.tiles?.values() ?? []) {
    total += tile.bladeCount;
  }
  return total;
}

function resolveSubmittedIndexCount(geometry) {
  const available =
    geometry.index?.count ?? geometry.getAttribute("position").count;
  const start = Math.max(0, geometry.drawRange.start);
  const remaining = Math.max(0, available - start);
  const requested = Number.isFinite(geometry.drawRange.count)
    ? Math.max(0, geometry.drawRange.count)
    : remaining;
  return Math.min(remaining, requested);
}

function percentile(sorted, fraction) {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * fraction) - 1),
  );
  return sorted[index];
}

function isGrassSummaryLine(line) {
  return /^Grass [\d,]+ patches · [\d,]+ blades · [\d,]+ impostors$/.test(
    line,
  );
}

function formatWorkloadLines(snapshot) {
  const nearSubmitted =
    snapshot.nearBaseInstances +
    snapshot.nearDetailInstances +
    snapshot.nearUltraInstances;
  return [
    `Grass logical ${formatCompact(snapshot.logicalBladeEquivalents)} · visible ${formatCompact(snapshot.visibleLogicalBladeEquivalents)} · patch inst ${formatInteger(snapshot.residentPatchInstances)}`,
    `Near resident ${formatCompact(snapshot.nearResidentUniqueInstances)} unique · submit ${formatCompact(nearSubmitted)} inst / ${formatCompact(snapshot.nearSubmittedTriangles)} tris`,
    `Mid submit ${formatInteger(snapshot.midSubmittedBlades)} blades / ${formatCompact(snapshot.midSubmittedVertices)} verts · Far ${formatInteger(snapshot.farSubmittedCards)} cards`,
  ];
}

function formatGpuTiming(stats) {
  if (stats.status === "disabled") {
    return "GPU off (?gpuTiming=1)";
  }
  if (stats.status === "unsupported") {
    return "GPU N/A";
  }
  if (stats.medianMs === undefined || stats.p95Ms === undefined) {
    return "GPU warming";
  }
  return `GPU scene ${stats.medianMs.toFixed(2)} med / ${stats.p95Ms.toFixed(2)} p95 ms`;
}

function formatInteger(value) {
  return Math.max(0, Math.round(value)).toLocaleString();
}

function formatCompact(value) {
  const absolute = Math.max(0, value);
  if (absolute >= 1_000_000) {
    return `${(absolute / 1_000_000).toFixed(2)}M`;
  }
  if (absolute >= 100_000) {
    return `${Math.round(absolute / 1_000)}k`;
  }
  return formatInteger(absolute);
}
