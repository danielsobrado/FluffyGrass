import * as THREE from "three";
import type { GrassConfig } from "../grass/GrassConfig";
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

interface WorldGrassPatch extends GrassPatch {
  farMesh: THREE.InstancedMesh;
  midCoverage: number;
  farCoverage: number;
  streamCoverage: number;
}

interface GrassChunkRequest {
  key: string;
  chunkX: number;
  chunkZ: number;
  distance: number;
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
  matrixValues: Float32Array;
  variations: Float32Array;
  coverages: Float32Array;
  instanceCount: number;
  up: THREE.Vector3;
  normal: THREE.Vector3;
  align: THREE.Quaternion;
  yaw: THREE.Quaternion;
  scale: THREE.Vector3;
  position: THREE.Vector3;
  matrix: THREE.Matrix4;
  bounds: THREE.Box3;
  meshBounds?: THREE.Box3;
  finalizeStage: number;
  variationValues?: Float32Array;
  variantIndex?: number;
  nearMesh?: THREE.InstancedMesh;
  midMesh?: THREE.InstancedMesh;
  farMesh?: THREE.InstancedMesh;
}

interface GrassChunkFinalizeResult {
  complete: boolean;
  patch?: WorldGrassPatch;
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
  private readonly patches = new Map<string, WorldGrassPatch>();
  private readonly queue: GrassChunkRequest[] = [];
  private readonly desired = new Map<string, GrassChunkRequest>();
  private readonly retirementQueue: string[] = [];
  private readonly retiring = new Set<string>();
  private readonly cameraPosition = new THREE.Vector3();
  private readonly previousReconcilePosition = new THREE.Vector2();
  private nearGeometries: THREE.BufferGeometry[] = [];
  private midGeometries: THREE.BufferGeometry[] = [];
  private grassConfig?: GrassConfig;
  private lodController?: GrassLodController;
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

  constructor(
    private readonly scene: THREE.Scene,
    private readonly field: TerrainField,
    private readonly worldConfig: WorldConfig,
    private readonly profile: RuntimeProfile,
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.status = "Loading grass configuration";
    const grassConfig = await this.configLoader.load(
      `./config/grass.yaml?v=${encodeURIComponent(APP_VERSION)}`,
    );
    await this.yieldToBrowser();

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
    const lodConfig = {
      nearMaxDistance: this.worldConfig.grassNearDistance,
      midMaxDistance: this.worldConfig.grassMidDistance,
      farMaxDistance: this.worldConfig.grassFarDistance,
      transitionDistance: this.worldConfig.grassTransitionDistance,
      hysteresisDistance: this.worldConfig.grassHysteresisDistance,
    };
    this.material.configureLod(lodConfig);

    for (let index = 0; index < variants.bladeVariants.length; index += 1) {
      this.status = `Creating impostor atlas ${index + 1}/${variants.bladeVariants.length}`;
      await this.yieldToBrowser();
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
    let blades = 0;
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
    for (const patch of this.patches.values()) {
      this.removePatch(patch);
    }
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
  }

  private processBuildQueue(): void {
    if (this.buildCooldownFrames > 0) {
      this.buildCooldownFrames -= 1;
      return;
    }

    while (!this.activeBuild && this.queue.length > 0) {
      const request = this.queue.shift();
      if (request && this.desired.has(request.key)) {
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
        if (result.patch) {
          this.patches.set(job.request.key, result.patch);
          this.scene.add(
            result.patch.nearMesh,
            result.patch.midMesh,
            result.patch.farMesh,
          );
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
      const patch = this.patches.get(key);
      if (patch) {
        this.removePatch(patch);
        this.patches.delete(key);
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
          this.worldConfig.grassFarDistance * 0.65,
        );
        predictedX += (travelX / travelLength) * lookahead;
        predictedZ += (travelZ / travelLength) * lookahead;
      }
    }
    this.previousReconcilePosition.set(currentX, currentZ);
    this.hasPreviousReconcilePosition = true;
    const preloadDistance = Math.min(
      radius * chunkSize,
      this.worldConfig.grassFarDistance +
        this.worldConfig.grassTransitionDistance +
        chunkSize,
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
          // The current camera chunk must never wait behind work that was
          // selected before a high-speed chunk crossing. A modest lookahead
          // then fills the direction of travel before the remaining ring.
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
    for (const key of this.patches.keys()) {
      if (!this.desired.has(key) && !this.retiring.has(key)) {
        this.retiring.add(key);
        this.retirementQueue.push(key);
      }
    }

    const centerKey = `${this.centerChunkX}:${this.centerChunkZ}`;
    if (
      this.desired.has(centerKey) &&
      !this.patches.has(centerKey) &&
      this.activeBuild &&
      this.activeBuild.request.key !== centerKey
    ) {
      // At maximum flight speed a job can remain inside the desired radius
      // for several crossings while the camera outruns it. Preempt that stale
      // work so the ground below the camera cannot turn into a square hole.
      this.discardPatchBuild(this.activeBuild);
      this.activeBuild = undefined;
    }

    this.queue.length = 0;
    for (const request of this.desired.values()) {
      if (
        !this.patches.has(request.key) &&
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

  private beginPatchBuild(request: GrassChunkRequest): GrassChunkBuildJob | undefined {
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
      matrixValues: new Float32Array(patchesPerAxis * patchesPerAxis * 16),
      variations: new Float32Array(patchesPerAxis * patchesPerAxis * 4),
      coverages: new Float32Array(patchesPerAxis * patchesPerAxis),
      instanceCount: 0,
      up: new THREE.Vector3(0, 1, 0),
      normal: new THREE.Vector3(),
      align: new THREE.Quaternion(),
      yaw: new THREE.Quaternion(),
      scale: new THREE.Vector3(),
      position: new THREE.Vector3(),
      matrix: new THREE.Matrix4(),
      bounds: new THREE.Box3(),
      finalizeStage: 0,
    };
  }

  private discardPatchBuild(job: GrassChunkBuildJob): void {
    for (const mesh of [job.nearMesh, job.midMesh, job.farMesh]) {
      if (mesh) {
        this.geometryFactory.disposeInstancedMesh(mesh);
      }
    }
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
      const instanceIndex = job.instanceCount;
      job.matrix.toArray(job.matrixValues, instanceIndex * 16);
      job.bounds.expandByPoint(job.position);
      const variationOffset = instanceIndex * 4;
      job.variations[variationOffset] = job.random.next();
      job.variations[variationOffset + 1] = job.random.range(0.82, 1.14);
      job.variations[variationOffset + 2] = job.random.range(0.97, 1.04);
      job.variations[variationOffset + 3] = THREE.MathUtils.clamp(
        (1 - suitability) * 0.34 + job.random.range(0, 0.09),
        0,
        1,
      );
      job.coverages[instanceIndex] = coverage;
      job.instanceCount += 1;
    }
  }

  private advancePatchFinalize(job: GrassChunkBuildJob): GrassChunkFinalizeResult {
    const {
      request,
      grassConfig,
      matrixValues,
      variations,
      coverages,
      instanceCount,
    } = job;

    if (instanceCount === 0) {
      return { complete: true };
    }

    if (!job.variationValues || job.variantIndex === undefined) {
      job.variationValues = variations.subarray(0, instanceCount * 4);
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
      job.meshBounds = job.bounds
        .clone()
        .expandByScalar(Math.max(impostorRadius, bladeExtent));
    }
    const variationValues = job.variationValues;
    const coverageValues = coverages.subarray(0, instanceCount);
    const variantIndex = job.variantIndex;

    if (job.finalizeStage === 0) {
      job.nearMesh = this.createMesh(
        `world-grass-near-${request.key}`,
        this.nearGeometries[variantIndex],
        this.material.material,
        matrixValues,
        instanceCount,
        variationValues,
        coverageValues,
        job.meshBounds,
      );
      job.finalizeStage += 1;
      return { complete: false };
    }
    if (job.finalizeStage === 1) {
      job.midMesh = this.createMesh(
        `world-grass-mid-${request.key}`,
        this.midGeometries[variantIndex],
        this.material.material,
        matrixValues,
        instanceCount,
        variationValues,
        coverageValues,
        job.meshBounds,
      );
      job.finalizeStage += 1;
      return { complete: false };
    }

    const impostorMaterial = this.impostorMaterials[variantIndex];
    if (job.finalizeStage === 2) {
      job.farMesh = this.createMesh(
        `world-grass-far-${request.key}`,
        impostorMaterial.atlas.geometry,
        impostorMaterial.material,
        matrixValues,
        instanceCount,
        variationValues,
        coverageValues,
        job.meshBounds,
      );
      job.finalizeStage += 1;
      return { complete: false };
    }

    const nearMesh = job.nearMesh;
    const midMesh = job.midMesh;
    const farMesh = job.farMesh;
    if (!nearMesh || !midMesh || !farMesh) {
      throw new Error(`Grass chunk ${request.key} finalized out of order.`);
    }
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

    const bounds = job.meshBounds?.clone() ?? job.bounds.clone();
    const boundingSphere = bounds.getBoundingSphere(new THREE.Sphere());

    return { complete: true, patch: {
      id: request.key,
      gridX: request.chunkX,
      gridZ: request.chunkZ,
      bounds,
      boundingSphere,
      nearMesh,
      midMesh,
      farMesh,
      instanceCount,
      lod: GrassLodLevel.Near,
      distance: 0,
      inFrustum: true,
      nearCoverage: 1,
      midCoverage: 0,
      farCoverage: 0,
      streamCoverage: 0,
    } };
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

  private hash(x: number, z: number, seed: number): number {
    let value = Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return (value ^ (value >>> 16)) >>> 0;
  }

  private yieldToBrowser(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}
