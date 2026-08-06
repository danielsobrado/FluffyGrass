import * as THREE from "three";
import {
  GpuFrameTimer,
  type GpuFrameTimingStats,
} from "./GpuFrameTimer";

const HUD_UPDATE_INTERVAL_MS = 250;
const MID_INDICES_PER_BLADE = 3;

interface RuntimeTile {
  bladeCount: number;
  mesh: THREE.InstancedMesh;
}

interface RuntimeTileField {
  tiles?: Map<number, RuntimeTile>;
}

interface RuntimeNearField {
  baseField?: RuntimeTileField;
  baseDetailedField?: RuntimeTileField;
  ultraNearField?: RuntimeTileField;
}

interface RuntimePatch {
  instanceCount: number;
  inFrustum: boolean;
  midCoverage: number;
  farCoverage: number;
  midMesh: THREE.InstancedMesh;
}

interface RuntimeFarGroup {
  mesh: THREE.InstancedMesh;
}

interface RuntimeGrassSystem {
  initialized?: boolean;
  patches?: Set<RuntimePatch>;
  farGroups?: Set<RuntimeFarGroup>;
  nearField?: RuntimeNearField;
  nearBladesPerPatch?: number;
  midBladesPerPatch?: number;
}

// Diagnostics is attached at the application boundary. These structural views
// keep the renderer hot path unchanged while isolating runtime-only inspection
// from the grass implementation itself.
interface RuntimeWorldApp {
  scene?: THREE.Scene;
  renderer?: THREE.WebGLRenderer;
  grass?: RuntimeGrassSystem;
}

type GrassMeshKind = "near-base" | "near-detail" | "near-ultra" | "mid" | "far";

interface FrameWorkload {
  nearBaseInstances: number;
  nearDetailInstances: number;
  nearUltraInstances: number;
  nearSubmittedTriangles: number;
  midSubmittedBlades: number;
  midSubmittedVertices: number;
  farSubmittedCards: number;
}

interface WorkloadSnapshot extends FrameWorkload {
  residentPatchInstances: number;
  logicalBladeEquivalents: number;
  visibleLogicalBladeEquivalents: number;
  nearResidentUniqueInstances: number;
}

export interface WorldDiagnosticsOptions {
  gpuTiming: boolean;
  statsPanelEnabled: boolean;
}

export class WorldDiagnosticsController {
  private readonly hud =
    document.querySelector<HTMLElement>("#world-stats");
  private readonly instrumentedMeshes = new WeakSet<THREE.InstancedMesh>();
  private readonly meshKinds = new WeakMap<THREE.InstancedMesh, GrassMeshKind>();
  private readonly gpuTimer: GpuFrameTimer;
  private readonly scene: THREE.Scene;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly grass: RuntimeGrassSystem;
  private readonly originalRender: THREE.WebGLRenderer["render"];
  private readonly observer?: MutationObserver;
  private currentFrame = createEmptyFrameWorkload();
  private lastFrame = createEmptyFrameWorkload();
  private baseHudText = "";
  private lastRenderedHudText = "";
  private lastHudUpdate = 0;

  private constructor(
    app: RuntimeWorldApp,
    options: WorldDiagnosticsOptions,
  ) {
    if (!app.scene || !app.renderer || !app.grass) {
      throw new Error(
        "World diagnostics require scene, renderer, and grass systems.",
      );
    }
    this.scene = app.scene;
    this.renderer = app.renderer;
    this.grass = app.grass;
    this.originalRender = this.renderer.render;
    this.gpuTimer = new GpuFrameTimer(
      this.renderer,
      options.gpuTiming && !options.statsPanelEnabled,
    );

    if (this.hud) {
      this.baseHudText = this.hud.textContent ?? "";
      this.observer = new MutationObserver(this.handleHudMutation);
      this.observer.observe(this.hud, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }

    this.renderer.render = this.renderWithDiagnostics;
  }

  static attach(
    app: unknown,
    options: WorldDiagnosticsOptions,
  ): WorldDiagnosticsController | undefined {
    try {
      return new WorldDiagnosticsController(app as RuntimeWorldApp, options);
    } catch (error) {
      console.warn("[Drusniel World] Workload diagnostics unavailable.", error);
      return undefined;
    }
  }

  dispose(): void {
    this.renderer.render = this.originalRender;
    this.observer?.disconnect();
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

    this.prepareFrame();
    this.gpuTimer.beginFrame();
    try {
      this.originalRender.call(this.renderer, scene, camera);
    } finally {
      this.gpuTimer.endFrame();
      this.lastFrame = this.currentFrame;
      this.updateHudIfDue();
    }
  };

  private prepareFrame(): void {
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

  private instrumentTileField(
    field: RuntimeTileField | undefined,
    kind: GrassMeshKind,
  ): void {
    for (const tile of field?.tiles?.values() ?? []) {
      this.instrumentMesh(tile.mesh, kind);
    }
  }

  private instrumentMesh(
    mesh: THREE.InstancedMesh,
    kind: GrassMeshKind,
  ): void {
    this.meshKinds.set(mesh, kind);
    if (this.instrumentedMeshes.has(mesh)) {
      return;
    }
    this.instrumentedMeshes.add(mesh);
    const original = mesh.onBeforeRender;
    mesh.onBeforeRender = (
      renderer,
      scene,
      camera,
      geometry,
      material,
      group,
    ): void => {
      this.recordSubmission(mesh);
      original.call(
        mesh,
        renderer,
        scene,
        camera,
        geometry,
        material,
        group,
      );
    };
  }

  private recordSubmission(mesh: THREE.InstancedMesh): void {
    const kind = this.meshKinds.get(mesh);
    if (!kind) {
      return;
    }
    const instances = Math.max(0, mesh.count);
    const submittedIndices = resolveSubmittedIndexCount(mesh.geometry);

    switch (kind) {
      case "near-base":
        this.currentFrame.nearBaseInstances += instances;
        this.currentFrame.nearSubmittedTriangles +=
          Math.floor(submittedIndices / 3) * instances;
        break;
      case "near-detail":
        this.currentFrame.nearDetailInstances += instances;
        this.currentFrame.nearSubmittedTriangles +=
          Math.floor(submittedIndices / 3) * instances;
        break;
      case "near-ultra":
        this.currentFrame.nearUltraInstances += instances;
        this.currentFrame.nearSubmittedTriangles +=
          Math.floor(submittedIndices / 3) * instances;
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

  private readonly handleHudMutation = (): void => {
    if (!this.hud) {
      return;
    }
    const current = this.hud.textContent ?? "";
    if (current === this.lastRenderedHudText) {
      return;
    }
    this.baseHudText = current;
    this.renderHud();
  };

  private updateHudIfDue(): void {
    const now = performance.now();
    if (now - this.lastHudUpdate < HUD_UPDATE_INTERVAL_MS) {
      return;
    }
    this.lastHudUpdate = now;
    this.renderHud();
  }

  private renderHud(): void {
    if (!this.hud || !this.baseHudText) {
      return;
    }
    const snapshot = this.createSnapshot();
    const gpu = this.gpuTimer.getStats();
    const lines = this.baseHudText.split("\n");
    const output: string[] = [];
    let workloadInserted = false;

    for (const line of lines) {
      if (line.startsWith("Grass submit ")) {
        continue;
      }
      if (isGrassSummaryLine(line) && this.grass.initialized !== false) {
        output.push(...formatWorkloadLines(snapshot));
        workloadInserted = true;
        continue;
      }
      if (line.startsWith("Draws ")) {
        output.push(`${line} · ${formatGpuTiming(gpu)}`);
        continue;
      }
      output.push(line);
    }

    if (!workloadInserted && this.grass.initialized) {
      output.push(...formatWorkloadLines(snapshot));
    }

    const rendered = output.filter(Boolean).join("\n");
    if (rendered === this.lastRenderedHudText) {
      return;
    }
    this.lastRenderedHudText = rendered;
    this.hud.textContent = rendered;
  }

  private createSnapshot(): WorkloadSnapshot {
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
      residentPatchInstances,
      nearResidentUniqueInstances,
      logicalBladeEquivalents: nearResidentUniqueInstances + patchLogical,
      visibleLogicalBladeEquivalents:
        this.lastFrame.nearBaseInstances +
        this.lastFrame.nearUltraInstances +
        visiblePatchLogical,
    };
  }
}

function createEmptyFrameWorkload(): FrameWorkload {
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

function sumResidentInstances(field: RuntimeTileField | undefined): number {
  let total = 0;
  for (const tile of field?.tiles?.values() ?? []) {
    total += tile.bladeCount;
  }
  return total;
}

function resolveSubmittedIndexCount(geometry: THREE.BufferGeometry): number {
  const available =
    geometry.index?.count ?? geometry.getAttribute("position").count;
  const start = Math.max(0, geometry.drawRange.start);
  const remaining = Math.max(0, available - start);
  const requested = Number.isFinite(geometry.drawRange.count)
    ? Math.max(0, geometry.drawRange.count)
    : remaining;
  return Math.min(remaining, requested);
}

function isGrassSummaryLine(line: string): boolean {
  return /^Grass [\d,]+ patches · [\d,]+ blades · [\d,]+ impostors$/.test(
    line,
  );
}

function formatWorkloadLines(snapshot: WorkloadSnapshot): string[] {
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

function formatGpuTiming(stats: GpuFrameTimingStats): string {
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

function formatInteger(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString();
}

function formatCompact(value: number): string {
  const absolute = Math.max(0, value);
  if (absolute >= 1_000_000) {
    return `${(absolute / 1_000_000).toFixed(2)}M`;
  }
  if (absolute >= 100_000) {
    return `${Math.round(absolute / 1_000)}k`;
  }
  return formatInteger(absolute);
}
