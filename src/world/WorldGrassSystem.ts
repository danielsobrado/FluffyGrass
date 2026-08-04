import * as THREE from "three";
import type { GrassConfig, GrassLodConfig } from "../grass/GrassConfig";
import { GrassGeometryFactory } from "../grass/GrassGeometryFactory";
import { GrassLodController } from "../grass/GrassLodController";
import {
  GrassLodLevel,
  type GrassPatch,
} from "../grass/GrassPatchGrid";
import { GrassConfigLoader } from "../grass/internal/GrassConfigLoader";
import { SeededRandom } from "../grass/internal/SeededRandom";
import { GrassNearMaterial } from "../grass/materials/GrassNearMaterial";
import { WindField } from "../grass/wind/WindField";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";
import { APP_VERSION } from "../version";
import type { TerrainField } from "./TerrainField";
import type { WorldConfig } from "./WorldConfig";
import { WorldGrassImpostorAtlasFactory } from "./grass/WorldGrassImpostorAtlasFactory";
import { WorldGrassImpostorMaterial } from "./grass/WorldGrassImpostorMaterial";
import { WorldGrassPatchGeometryFactory } from "./grass/WorldGrassPatchGeometryFactory";
import { WorldNearGrassField } from "./grass/WorldNearGrassField";

interface WorldGrassPatch extends GrassPatch {
  farMesh: THREE.InstancedMesh;
  midCoverage: number;
  farCoverage: number;
  streamCoverage: number;
}

interface WorldGrassChunk {
  key: string;
  patches: WorldGrassPatch[];
}

interface GrassChunkRequest {
  key: string;
  chunkX: number;
  chunkZ: number;
  distance: number;
}

interface GrassRenderBatchBuild {
  batchX: number;
  batchZ: number;
  matrixValues: Float32Array;
  variations: Float32Array;
  coverages: Float32Array;
  instanceCount: number;
  bounds: THREE.Box3;
  meshBounds?: THREE.Box3;
  variationValues?: Float32Array;
}

interface GrassChunkBuildJob {
  request: GrassChunkRequest;
  grassConfig: GrassConfig;
  patchesPerAxis: number;
  cellSize: number;
  jitterRadius: number;
  originX: number;
  originZ: number;
  nextCell: number;
  random: SeededRandom;
  batches: GrassRenderBatchBuild[];
  activeBatches?: GrassRenderBatchBuild[];
  up: THREE.Vector3;
  normal: THREE.Vector3;
  align: THREE.Quaternion;
  yaw: THREE.Quaternion;
  scale: THREE.Vector3;
  position: THREE.Vector3;
  matrix: THREE.Matrix4;
  finalizeStage: number;
  variantIndex?: number;
  completedPatches: WorldGrassPatch[];
}

interface GrassChunkFinalizeResult {
  complete: boolean;
  chunk?: WorldGrassChunk;
}

export interface WorldGrassDiagnostics {
  ready: boolean;
  status: string;
  activePatches: number;
  queuedPatches: number;
  visibleNearPatches: number;
  visibleMidPatches: number;
  visibleFarPatches: number;
  clumps: number;
  blades: number;
  impostors: number;
  lastBuildMs: number;
  maxBuildMs: number;
}

const TWO_PI = Math.PI * 2;
const MID_WIND_SCALE = 0.62;
const MID_COLOR_SCALE = 0.82;
const HOMOGENEOUS_VARIANT_INDEX = 0;
const WORLD_VARIANT_COUNT = 1;
const FIELD_COVERAGE_MIN = 0.16;
const FIELD_COVERAGE_FULL = 0.5;
const COMPACT_BUILD_COOLDOWN_FRAMES = 2;
const CHUNK_BUILD_WARNING_MS = 24;
const DESKTOP_BUILD_BUDGET_MS = 4;
const COMPACT_BUILD_BUDGET_MS = 2.5;
const CENTER_BUILD_BUDGET_MS = 6;
const STREAM_LOOKAHEAD_CHUNKS = 2;
const STREAM_FADE_SECONDS = 0.35;
const RETIREMENTS_PER_FRAME = 2;

export class WorldGrassSystem {
  private readonly configLoader = new GrassConfigLoader();
  private readonly geometryFactory = new GrassGeometryFactory();
  private readonly patchGeometryFactory = new WorldGrassPatchGeometryFactory();
  private readonly impostorAtlasFactory = new WorldGrassImpostorAtlasFactory();
  private readonly material = new GrassNearMaterial();
  private readonly impostorMaterials: WorldGrassImpostorMaterial[] = [];
  private readonly wind = new WindField();
  private readonly chunks = new Map<string, WorldGrassChunk>();
  private readonly patches = new Set<WorldGrassPatch>();
  private readonly queue: GrassChunkRequest[] = [];
  private readonly desired = new Map<string, GrassChunkRequest>();
  private readonly retirementQueue: string[] = [];
  private readonly retiring = new Set<string>();
  private readonly cameraPosition = new THREE.Vector3();
  private readonly previousReconcilePosition = new THREE.Vector2();
  private readonly nearField: WorldNearGrassField;
  private nearGeometries: THREE.BufferGeometry[] = [];
  private midGeometries: THREE.BufferGeometry[] = [];
  private grassConfig?: GrassConfig;
  private resolvedLodConfig?: GrassLodConfig;
  private lodController?: GrassLodController;
  private initialization?: Promise<void>;
  private nearBladesPerPatch = 0;
  private midBladesPerPatch = 0;
  private centerChunkX = Number.NaN;
  private centerChunkZ = Number.NaN;
  private hasPreviousReconcilePosition = false;
  private buildCooldownFrames = 0;
  private activeBuild?: GrassChunkBuildJob;
  private lastBuildMs = 0;
  private maxBuildMs = 0;
  private status = "Waiting for grass initialization";
  private initialized = false;
  private disposed = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly field: TerrainField,
    private readonly worldConfig: WorldConfig,
    private readonly profile: RuntimeProfile,
  ) {
    this.nearField = new WorldNearGrassField(
      scene,
      field,
      worldConfig,
      profile,
    );
  }

  initialize(): Promise<void> {
    if (this.disposed) {
      return Promise.reject(new Error("WorldGrassSystem has been disposed."));
    }
    if (!this.initialization) {
      this.initialization = this.initializeInternal();
    }
    return this.initialization;
  }

  update(deltaSeconds: number, camera: THREE.Camera): void {
    if (!this.initialized || !this.lodController) {
      return;
    }

    const elapsedSeconds = this.wind.update(deltaSeconds);
    this.material.update(elapsedSeconds);
    for (const impostorMaterial of this.impostorMaterials) {
      impostorMaterial.update(elapsedSeconds);
    }

    camera.getWorldPosition(this.cameraPosition);
    this.nearField.update(deltaSeconds, this.cameraPosition);
    const chunkX = Math.floor(this.cameraPosition.x / this.worldConfig.chunkSize);
    const chunkZ = Math.floor(this.cameraPosition.z / this.worldConfig.chunkSize);
    if (chunkX !== this.centerChunkX || chunkZ !== this.centerChunkZ) {
      this.centerChunkX = chunkX;
      this.centerChunkZ = chunkZ;
      this.reconcile();
    }

    this.processRetirementQueue();
    this.processBuildQueue();
    this.updateStreamCoverage(deltaSeconds);
    this.lodController.update(camera, this.patches.values());
  }

  getDiagnostics(): WorldGrassDiagnostics {
    let visibleNearPatches = 0;
    let visibleMidPatches = 0;
    let visibleFarPatches = 0;
    let bladePatches = 0;
    let blades = this.nearField.getBladeCount();
    let impostors = 0;

    for (const patch of this.patches.values()) {
      bladePatches += patch.instanceCount;
      visibleNearPatches += patch.nearMesh.visible ? 1 : 0;
      visibleMidPatches += patch.midMesh.visible ? 1 : 0;
      visibleFarPatches += patch.farMesh.visible ? 1 : 0;
      blades += Math.round(
        patch.instanceCount *
          (patch.nearCoverage * this.nearBladesPerPatch +
            patch.midCoverage * this.midBladesPerPatch +
            patch.farCoverage * this.nearBladesPerPatch),
      );
      if (patch.farMesh.visible) {
        impostors += patch.instanceCount;
      }
    }

    return {
      ready: this.initialized,
      status: this.status,
      activePatches: this.patches.size,
      queuedPatches: this.queue.length + (this.activeBuild ? 1 : 0),
      visibleNearPatches,
      visibleMidPatches,
      visibleFarPatches,
      clumps: bladePatches,
      blades,
      impostors,
      lastBuildMs: this.lastBuildMs,
      maxBuildMs: this.maxBuildMs,
    };
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.initialized = false;
    this.status = "Grass disposed";

    this.nearField.dispose();
    for (const chunk of this.chunks.values()) {
      this.removeChunk(chunk);
    }
    this.chunks.clear();
    this.patches.clear();
    this.queue.length = 0;
    this.retirementQueue.length = 0;
    this.retiring.clear();
    if (this.activeBuild) {
      this.discardPatchBuild(this.activeBuild);
    }
    this.activeBuild = undefined;
    this.desired.clear();
    for (const geometry of [...this.nearGeometries, ...this.midGeometries]) {
      geometry.dispose();
    }
    this.nearGeometries = [];
    this.midGeometries = [];
    this.material.material.dispose();
    for (const impostorMaterial of this.impostorMaterials) {
      impostorMaterial.dispose();
    }
    this.impostorMaterials.length = 0;
    this.resolvedLodConfig = undefined;
    this.lodController = undefined;
  }

  private async initializeInternal(): Promise<void> {
    this.status = "Loading grass configuration";
    const grassConfig = await this.configLoader.load(
      `./config/grass.yaml?v=${encodeURIComponent(APP_VERSION)}`,
    );
    this.assertNotDisposed();
    await this.yieldToBrowser();
    this.assertNotDisposed();

    this.status = "Creating blade geometry";
    const variants = this.patchGeometryFactory.createLodVariants(
      grassConfig.geometry,
      this.worldConfig,
      this.profile.compact,
      this.worldConfig.seed,
      WORLD_VARIANT_COUNT,
    );
    this.grassConfig = grassConfig;
    this.nearGeometries = variants.near;
    this.midGeometries = variants.mid;
    this.nearBladesPerPatch = variants.nearBladesPerPatch;
    this.midBladesPerPatch = variants.midBladesPerPatch;
    this.material.configure(grassConfig.material, grassConfig.wind);
    const lodConfig = this.resolveLodConfig();
    this.resolvedLodConfig = lodConfig;
    this.material.configureLod(lodConfig);

    this.status = "Creating dense single-blade fields";
    await this.nearField.initialize(grassConfig);
    this.assertNotDisposed();

    for (let index = 0; index < variants.bladeVariants.length; index += 1) {
      this.status = `Creating impostor atlas ${index + 1}/${variants.bladeVariants.length}`;
      await this.yieldToBrowser();
      this.assertNotDisposed();
      const atlas = this.impostorAtlasFactory.create(
        variants.bladeVariants[index],
        grassConfig.geometry,
        grassConfig.material,
        this.worldConfig.grassPatchSize,
        grassConfig.impostor,
      );
      this.impostorMaterials.push(
        new WorldGrassImpostorMaterial(
          atlas,
          grassConfig.material,
          grassConfig.wind,
          lodConfig,
          !this.profile.compact,
        ),
      );
    }

    this.lodController = new GrassLodController(lodConfig);
    this.status = "Grass ready";
    this.initialized = true;
  }

  private resolveLodConfig(): GrassLodConfig {
    const radius = this.profile.compact
      ? this.worldConfig.grassRadiusCompact
      : this.worldConfig.grassRadiusDesktop;
    const streamFadeEnd = radius * this.worldConfig.chunkSize;
    const farMaxDistance = Math.min(
      this.worldConfig.grassFarDistance,
      streamFadeEnd - this.worldConfig.grassTransitionDistance,
    );

    return {
      nearMaxDistance: this.worldConfig.grassNearDistance,
      midMaxDistance: this.worldConfig.grassMidDistance,
      farMaxDistance,
      transitionDistance: this.worldConfig.grassTransitionDistance,
      hysteresisDistance: this.worldConfig.grassHysteresisDistance,
    };
  }

  private processBuildQueue(): void {
    if (this.buildCooldownFrames > 0) {
      this.buildCooldownFrames -= 1;
      return;
    }

    while (!this.activeBuild && this.queue.length > 0) {
      const request = this.queue.shift();
      if (
        request &&
        this.desired.has(request.key)
      ) {
        this.activeBuild = this.beginPatchBuild(request);
      }
    }

    const job = this.activeBuild;
    if (!job) {
      return;
    }
    if (!this.desired.has(job.request.key)) {
      this.discardPatchBuild(job);
      this.activeBuild = undefined;
      return;
    }

    const startedAt = performance.now();
    const totalCells = job.patchesPerAxis * job.patchesPerAxis;
    const readyToFinalize = job.nextCell >= totalCells;
    let completedChunk = false;
    if (readyToFinalize) {
      const result = this.advancePatchFinalize(job);
      if (result.complete) {
        if (result.chunk) {
          this.chunks.set(job.request.key, result.chunk);
          for (const patch of result.chunk.patches) {
            this.patches.add(patch);
            this.scene.add(patch.nearMesh, patch.midMesh, patch.farMesh);
          }
        }
        this.activeBuild = undefined;
        completedChunk = true;
      }
    } else {
      const sliceBudget =
        job.request.distance <= 0
          ? Math.min(
              CENTER_BUILD_BUDGET_MS,
              this.profile.compact ? 4 : CENTER_BUILD_BUDGET_MS,
            )
          : this.profile.compact
            ? COMPACT_BUILD_BUDGET_MS
            : DESKTOP_BUILD_BUDGET_MS;
      this.advancePatchBuild(
        job,
        sliceBudget * this.worldConfig.grassChunksPerFrame,
      );
    }

    this.lastBuildMs = performance.now() - startedAt;
    this.maxBuildMs = Math.max(this.maxBuildMs, this.lastBuildMs);
    if (this.lastBuildMs > CHUNK_BUILD_WARNING_MS) {
      console.warn(
        `[FluffyGrass] Grass build slice took ${this.lastBuildMs.toFixed(1)} ms.`,
      );
    }

    if (this.profile.compact && completedChunk) {
      this.buildCooldownFrames = COMPACT_BUILD_COOLDOWN_FRAMES;
    }
  }

  private processRetirementQueue(): void {
    let retired = 0;
    while (retired < RETIREMENTS_PER_FRAME && this.retirementQueue.length > 0) {
      const key = this.retirementQueue.shift();
      if (!key) {
        continue;
      }
      if (this.desired.has(key)) {
        this.retiring.delete(key);
        continue;
      }
      const chunk = this.chunks.get(key);
      if (chunk) {
        this.removeChunk(chunk);
        this.chunks.delete(key);
      }
      this.retiring.delete(key);
      retired += 1;
    }
  }

  private updateStreamCoverage(deltaSeconds: number): void {
    const coverageStep = deltaSeconds / STREAM_FADE_SECONDS;
    for (const patch of this.patches.values()) {
      if (patch.streamCoverage >= 1) {
        continue;
      }
      patch.streamCoverage = Math.min(1, patch.streamCoverage + coverageStep);
      patch.nearMesh.userData.grassStreamCoverage = patch.streamCoverage;
      patch.midMesh.userData.grassStreamCoverage = patch.streamCoverage;
      patch.farMesh.userData.grassStreamCoverage = patch.streamCoverage;
    }
  }

  private reconcile(): void {
    const radius = this.profile.compact
      ? this.worldConfig.grassRadiusCompact
      : this.worldConfig.grassRadiusDesktop;
    const farMaxDistance =
      this.resolvedLodConfig?.farMaxDistance ??
      this.worldConfig.grassFarDistance;
    const halfWorld = this.worldConfig.worldSize * 0.5;
    const chunkSize = this.worldConfig.chunkSize;
    const currentX = this.cameraPosition.x;
    const currentZ = this.cameraPosition.z;
    let predictedX = currentX;
    let predictedZ = currentZ;
    if (this.hasPreviousReconcilePosition) {
      const travelX = currentX - this.previousReconcilePosition.x;
      const travelZ = currentZ - this.previousReconcilePosition.y;
      const travelLength = Math.hypot(travelX, travelZ);
      if (travelLength > 0.001) {
        const lookahead = Math.min(
          chunkSize * STREAM_LOOKAHEAD_CHUNKS,
          farMaxDistance * 0.65,
        );
        predictedX += (travelX / travelLength) * lookahead;
        predictedZ += (travelZ / travelLength) * lookahead;
      }
    }
    this.previousReconcilePosition.set(currentX, currentZ);
    this.hasPreviousReconcilePosition = true;
    const preloadDistance = Math.min(
      radius * chunkSize,
      farMaxDistance + this.worldConfig.grassTransitionDistance + chunkSize,
    );
    this.desired.clear();

    for (let dz = -radius; dz <= radius; dz += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const chunkX = this.centerChunkX + dx;
        const chunkZ = this.centerChunkZ + dz;
        const originX = chunkX * chunkSize;
        const originZ = chunkZ * chunkSize;
        if (
          originX < -halfWorld ||
          originZ < -halfWorld ||
          originX + chunkSize > halfWorld ||
          originZ + chunkSize > halfWorld
        ) {
          continue;
        }
        const currentDistance = this.horizontalDistanceToChunk(
          currentX,
          currentZ,
          originX,
          originZ,
          chunkSize,
        );
        const predictedDistance = this.horizontalDistanceToChunk(
          predictedX,
          predictedZ,
          originX,
          originZ,
          chunkSize,
        );
        if (Math.min(currentDistance, predictedDistance) > preloadDistance) {
          continue;
        }
        const key = `${chunkX}:${chunkZ}`;
        const isCameraChunk =
          chunkX === this.centerChunkX && chunkZ === this.centerChunkZ;
        this.desired.set(key, {
          key,
          chunkX,
          chunkZ,
          distance: isCameraChunk
            ? -1
            : Math.min(
                currentDistance,
                predictedDistance + chunkSize * 0.2,
              ),
        });
      }
    }

    // Keep a queued key marked until processRetirementQueue observes its
    // latest desired state. Clearing it as soon as it becomes desired again
    // allows rapid boundary crossings to enqueue the same key repeatedly.
    for (const key of this.chunks.keys()) {
      if (!this.desired.has(key) && !this.retiring.has(key)) {
        this.retiring.add(key);
        this.retirementQueue.push(key);
      }
    }

    const centerKey = `${this.centerChunkX}:${this.centerChunkZ}`;
    if (
      this.desired.has(centerKey) &&
      !this.chunks.has(centerKey) &&
      this.activeBuild &&
      this.activeBuild.request.key !== centerKey
    ) {
      this.discardPatchBuild(this.activeBuild);
      this.activeBuild = undefined;
    }

    this.queue.length = 0;
    for (const request of this.desired.values()) {
      if (
        !this.chunks.has(request.key) &&
        this.activeBuild?.request.key !== request.key
      ) {
        this.queue.push(request);
      }
    }
    this.queue.sort((left, right) => left.distance - right.distance);
  }

  private horizontalDistanceToChunk(
    x: number,
    z: number,
    originX: number,
    originZ: number,
    chunkSize: number,
  ): number {
    const distanceX = Math.max(originX - x, 0, x - (originX + chunkSize));
    const distanceZ = Math.max(originZ - z, 0, z - (originZ + chunkSize));
    return Math.hypot(distanceX, distanceZ);
  }

  private beginPatchBuild(
    request: GrassChunkRequest,
  ): GrassChunkBuildJob | undefined {
    const grassConfig = this.grassConfig;
    if (!grassConfig) {
      return undefined;
    }

    const patchesPerAxis = Math.round(
      this.worldConfig.chunkSize / this.worldConfig.grassPatchSize,
    );
    const cellSize = this.worldConfig.chunkSize / patchesPerAxis;
    const jitterRadius =
      cellSize * this.worldConfig.grassPatchJitter * 0.5;
    return {
      request,
      grassConfig,
      patchesPerAxis,
      cellSize,
      jitterRadius,
      originX: request.chunkX * this.worldConfig.chunkSize,
      originZ: request.chunkZ * this.worldConfig.chunkSize,
      nextCell: 0,
      random: new SeededRandom(
        this.hash(request.chunkX, request.chunkZ, this.worldConfig.seed),
      ),
      batches: this.createRenderBatchBuilds(patchesPerAxis),
      up: new THREE.Vector3(0, 1, 0),
      normal: new THREE.Vector3(),
      align: new THREE.Quaternion(),
      yaw: new THREE.Quaternion(),
      scale: new THREE.Vector3(),
      position: new THREE.Vector3(),
      matrix: new THREE.Matrix4(),
      finalizeStage: 0,
      completedPatches: [],
    };
  }

  private createRenderBatchBuilds(
    patchesPerAxis: number,
  ): GrassRenderBatchBuild[] {
    const batchesPerAxis = this.worldConfig.grassRenderBatchesPerAxis;
    const batches: GrassRenderBatchBuild[] = [];
    for (let batchZ = 0; batchZ < batchesPerAxis; batchZ += 1) {
      const startZ = Math.floor((batchZ * patchesPerAxis) / batchesPerAxis);
      const endZ = Math.floor(
        ((batchZ + 1) * patchesPerAxis) / batchesPerAxis,
      );
      for (let batchX = 0; batchX < batchesPerAxis; batchX += 1) {
        const startX = Math.floor((batchX * patchesPerAxis) / batchesPerAxis);
        const endX = Math.floor(
          ((batchX + 1) * patchesPerAxis) / batchesPerAxis,
        );
        const capacity = (endX - startX) * (endZ - startZ);
        batches.push({
          batchX,
          batchZ,
          matrixValues: new Float32Array(capacity * 16),
          variations: new Float32Array(capacity * 4),
          coverages: new Float32Array(capacity),
          instanceCount: 0,
          bounds: new THREE.Box3(),
        });
      }
    }
    return batches;
  }

  private discardPatchBuild(job: GrassChunkBuildJob): void {
    for (const patch of job.completedPatches) {
      this.removePatch(patch);
    }
    job.completedPatches.length = 0;
  }

  private advancePatchBuild(job: GrassChunkBuildJob, budgetMs: number): void {
    const deadline = performance.now() + budgetMs;
    const totalCells = job.patchesPerAxis * job.patchesPerAxis;
    let processed = 0;

    while (
      job.nextCell < totalCells &&
      (processed === 0 || performance.now() < deadline)
    ) {
      const patchX = job.nextCell % job.patchesPerAxis;
      const patchZ = Math.floor(job.nextCell / job.patchesPerAxis);
      job.nextCell += 1;
      processed += 1;

      const x =
        job.originX +
        (patchX + 0.5) * job.cellSize +
        job.random.range(-job.jitterRadius, job.jitterRadius);
      const z =
        job.originZ +
        (patchZ + 0.5) * job.cellSize +
        job.random.range(-job.jitterRadius, job.jitterRadius);
      const height = this.field.sampleHeight(x, z);
      this.field.sampleNormal(x, z, job.normal);
      const suitability = this.field.sampleGrassSuitability(
        x,
        z,
        height,
        job.normal,
      );
      const coverage = THREE.MathUtils.smoothstep(
        suitability,
        FIELD_COVERAGE_MIN,
        FIELD_COVERAGE_FULL,
      );
      if (coverage <= 0.02) {
        continue;
      }

      job.position.set(
        x,
        height - job.grassConfig.distribution.rootSink,
        z,
      );
      job.align.setFromUnitVectors(job.up, job.normal);
      job.yaw.setFromAxisAngle(job.up, job.random.range(0, TWO_PI));
      job.align.multiply(job.yaw);
      const horizontalScale = job.random.range(0.96, 1.04);
      const heightScale =
        1 +
        job.random.range(
          -job.grassConfig.distribution.heightVariation,
          job.grassConfig.distribution.heightVariation,
        );
      job.scale.set(horizontalScale, heightScale, horizontalScale);
      job.matrix.compose(job.position, job.align, job.scale);
      const batchesPerAxis = this.worldConfig.grassRenderBatchesPerAxis;
      const batchX = Math.min(
        batchesPerAxis - 1,
        Math.floor((patchX * batchesPerAxis) / job.patchesPerAxis),
      );
      const batchZ = Math.min(
        batchesPerAxis - 1,
        Math.floor((patchZ * batchesPerAxis) / job.patchesPerAxis),
      );
      const batch = job.batches[batchZ * batchesPerAxis + batchX];
      const instanceIndex = batch.instanceCount;
      job.matrix.toArray(batch.matrixValues, instanceIndex * 16);
      batch.bounds.expandByPoint(job.position);
      const variationOffset = instanceIndex * 4;
      batch.variations[variationOffset] = job.random.next();
      batch.variations[variationOffset + 1] = job.random.range(0.82, 1.14);
      batch.variations[variationOffset + 2] = job.random.range(0.97, 1.04);
      batch.variations[variationOffset + 3] = THREE.MathUtils.clamp(
        (1 - suitability) * 0.34 + job.random.range(0, 0.09),
        0,
        1,
      );
      batch.coverages[instanceIndex] = coverage;
      batch.instanceCount += 1;
    }
  }

  private advancePatchFinalize(job: GrassChunkBuildJob): GrassChunkFinalizeResult {
    const { request, grassConfig } = job;

    if (!job.activeBatches || job.variantIndex === undefined) {
      job.activeBatches = job.batches.filter(
        (batch) => batch.instanceCount > 0,
      );
      if (job.activeBatches.length === 0) {
        return {
          complete: true,
          chunk: { key: request.key, patches: [] },
        };
      }
      // A single variant per 64 m chunk creates obvious square tiles from an
      // aerial view. Per-instance transforms and material variation already
      // provide enough diversity without chunk-coherent atlas changes.
      job.variantIndex = Math.min(
        HOMOGENEOUS_VARIANT_INDEX,
        grassConfig.geometry.variantCount - 1,
      );
      const impostorRadius =
        this.impostorMaterials[job.variantIndex].atlas.radius;
      const bladeExtent =
        grassConfig.geometry.bladeHeightMax *
          (1 + grassConfig.distribution.heightVariation) +
        grassConfig.geometry.bladeLeanMax +
        grassConfig.wind.strength +
        grassConfig.wind.flutterStrength;
      const boundsPadding = Math.max(impostorRadius, bladeExtent);
      for (const batch of job.activeBatches) {
        batch.variationValues = batch.variations.subarray(
          0,
          batch.instanceCount * 4,
        );
        batch.meshBounds = batch.bounds.clone().expandByScalar(boundsPadding);
      }
    }

    const activeBatches = job.activeBatches;
    const variantIndex = job.variantIndex;
    const batch = activeBatches[job.finalizeStage];
    const patch = this.createRenderPatch(job, batch, variantIndex);
    job.completedPatches.push(patch);
    job.finalizeStage += 1;

    return job.finalizeStage >= activeBatches.length
      ? {
          complete: true,
          chunk: { key: request.key, patches: job.completedPatches },
        }
      : { complete: false };
  }

  private createRenderPatch(
    job: GrassChunkBuildJob,
    batch: GrassRenderBatchBuild,
    variantIndex: number,
  ): WorldGrassPatch {
    const { request } = job;
    const variationValues = batch.variationValues;
    const bounds = batch.meshBounds;
    if (!variationValues || !bounds) {
      throw new Error(`Grass batch ${request.key} finalized before bounds.`);
    }
    const coverageValues = batch.coverages.subarray(0, batch.instanceCount);
    const batchKey = `${request.key}:${batch.batchX}:${batch.batchZ}`;
    const nearMesh = this.createMesh(
      `world-grass-near-${batchKey}`,
      this.nearGeometries[variantIndex],
      this.material.material,
      batch.matrixValues,
      batch.instanceCount,
      variationValues,
      coverageValues,
      bounds,
    );
    const midMesh = this.createMesh(
      `world-grass-mid-${batchKey}`,
      this.midGeometries[variantIndex],
      this.material.material,
      batch.matrixValues,
      batch.instanceCount,
      variationValues,
      coverageValues,
      bounds,
    );
    const impostorMaterial = this.impostorMaterials[variantIndex];
    const farMesh = this.createMesh(
      `world-grass-far-${batchKey}`,
      impostorMaterial.atlas.geometry,
      impostorMaterial.material,
      batch.matrixValues,
      batch.instanceCount,
      variationValues,
      coverageValues,
      bounds,
    );
    midMesh.visible = false;
    farMesh.visible = false;

    const ditherSeed = this.hash(
      request.chunkX,
      request.chunkZ,
      this.worldConfig.seed + 193,
    );
    this.material.bindMesh(
      nearMesh,
      ditherSeed,
      false,
      1,
      true,
      MID_COLOR_SCALE,
      0,
    );
    this.material.bindMesh(
      midMesh,
      ditherSeed,
      true,
      MID_WIND_SCALE,
      true,
      MID_COLOR_SCALE,
      0,
    );
    impostorMaterial.bindMesh(farMesh, ditherSeed);

    const patchBounds = bounds.clone();
    const batchesPerAxis = this.worldConfig.grassRenderBatchesPerAxis;
    return {
      id: batchKey,
      gridX: request.chunkX * batchesPerAxis + batch.batchX,
      gridZ: request.chunkZ * batchesPerAxis + batch.batchZ,
      bounds: patchBounds,
      boundingSphere: patchBounds.getBoundingSphere(new THREE.Sphere()),
      nearMesh,
      midMesh,
      farMesh,
      instanceCount: batch.instanceCount,
      lod: GrassLodLevel.Near,
      distance: 0,
      inFrustum: true,
      nearCoverage: 1,
      midCoverage: 0,
      farCoverage: 0,
      streamCoverage: 0,
    };
  }

  private createMesh(
    name: string,
    sourceGeometry: THREE.BufferGeometry,
    material: THREE.Material,
    matrixValues: Float32Array,
    instanceCount: number,
    variationValues: Float32Array,
    coverageValues: Float32Array,
    bounds?: THREE.Box3,
  ): THREE.InstancedMesh {
    const geometry = this.geometryFactory.createInstancedGeometry(
      sourceGeometry,
      variationValues,
      coverageValues,
    );
    const mesh = new THREE.InstancedMesh(
      geometry,
      material,
      instanceCount,
    );
    mesh.name = name;
    mesh.castShadow = false;
    mesh.receiveShadow = this.profile.shadows;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.array.set(
      matrixValues.subarray(0, instanceCount * 16),
    );
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.instanceMatrix.needsUpdate = true;
    if (bounds) {
      mesh.boundingBox = bounds.clone();
      mesh.boundingSphere = bounds.getBoundingSphere(new THREE.Sphere());
    } else {
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    }
    return mesh;
  }

  private removePatch(patch: WorldGrassPatch): void {
    this.scene.remove(patch.nearMesh, patch.midMesh, patch.farMesh);
    this.geometryFactory.disposeInstancedMesh(patch.nearMesh);
    this.geometryFactory.disposeInstancedMesh(patch.midMesh);
    this.geometryFactory.disposeInstancedMesh(patch.farMesh);
  }

  private removeChunk(chunk: WorldGrassChunk): void {
    for (const patch of chunk.patches) {
      this.patches.delete(patch);
      this.removePatch(patch);
    }
  }

  private hash(x: number, z: number, seed: number): number {
    let value = Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return (value ^ (value >>> 16)) >>> 0;
  }

  private assertNotDisposed(): void {
    if (this.disposed) {
      throw new Error("WorldGrassSystem was disposed during initialization.");
    }
  }

  private yieldToBrowser(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}
