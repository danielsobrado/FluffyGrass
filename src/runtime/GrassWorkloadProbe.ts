import type * as THREE from "three";

const MID_INDICES_PER_BLADE = 3;
const FAR_INDICES_PER_CARD = 6;

type GrassMeshKind = "near-base" | "near-detail" | "near-ultra" | "mid" | "far";
type RenderCallback = THREE.InstancedMesh["onBeforeRender"];

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

interface RuntimeWorldApp {
  scene?: THREE.Scene;
  renderer?: THREE.WebGLRenderer;
  grass?: RuntimeGrassSystem;
}

interface FrameWorkload {
  nearBaseInstances: number;
  nearDetailInstances: number;
  nearUltraInstances: number;
  nearSubmittedTriangles: number;
  midSubmittedBlades: number;
  midSubmittedVertices: number;
  farSubmittedCards: number;
}

interface RenderHook {
  original: RenderCallback;
  wrapped: RenderCallback;
}

export interface WorldDiagnosticsRuntime {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  grass: RuntimeGrassSystem;
}

export interface GrassWorkloadSnapshot extends FrameWorkload {
  ready: boolean;
  residentPatchInstances: number;
  logicalBladeEquivalents: number;
  visibleLogicalBladeEquivalents: number;
  nearResidentUniqueInstances: number;
}

export function resolveWorldDiagnosticsRuntime(
  app: unknown,
): WorldDiagnosticsRuntime {
  const runtime = app as RuntimeWorldApp;
  if (!runtime.scene || !runtime.renderer || !runtime.grass) {
    throw new Error(
      "World diagnostics require scene, renderer, and grass systems.",
    );
  }
  return {
    scene: runtime.scene,
    renderer: runtime.renderer,
    grass: runtime.grass,
  };
}

export class GrassWorkloadProbe {
  private readonly instrumentedMeshes = new WeakSet<THREE.InstancedMesh>();
  private readonly meshKinds = new WeakMap<THREE.InstancedMesh, GrassMeshKind>();
  private readonly renderHooks = new Map<THREE.InstancedMesh, RenderHook>();
  private currentFrame = createEmptyFrameWorkload();
  private lastFrame = createEmptyFrameWorkload();

  constructor(private readonly grass: RuntimeGrassSystem) {}

  prepareFrame(): void {
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

  finishFrame(): void {
    this.lastFrame = this.currentFrame;
  }

  dispose(): void {
    for (const [mesh, hook] of this.renderHooks) {
      if (mesh.onBeforeRender === hook.wrapped) {
        mesh.onBeforeRender = hook.original;
      }
    }
    this.renderHooks.clear();
  }

  getSnapshot(): GrassWorkloadSnapshot {
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
    const wrapped: RenderCallback = (
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
    this.renderHooks.set(mesh, { original, wrapped });
    mesh.onBeforeRender = wrapped;
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
        this.currentFrame.farSubmittedCards +=
          Math.floor(submittedIndices / FAR_INDICES_PER_CARD) * instances;
        break;
    }
  }

  private addNearTriangles(instances: number, submittedIndices: number): void {
    this.currentFrame.nearSubmittedTriangles +=
      Math.floor(submittedIndices / 3) * instances;
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
