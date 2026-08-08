import * as THREE from "three";
import type { WorldConfig } from "../WorldConfig";
import { setStoneClearanceField } from "./StoneClearance";
import type { StoneField } from "./StoneField";
import { applyStoneSurfaceShader } from "./StoneGrowthShader";
import {
  StoneRenderBatchBuilder,
  type StoneRenderBatchBuildJob,
  type StoneRenderBatchSource,
} from "./StoneRenderBatchBuilder";

interface StoneBatch {
  readonly key: string;
  readonly signature: string;
  readonly mesh: THREE.Mesh;
  readonly triangles: number;
  readonly stones: number;
}

interface StoneBatchRequest {
  readonly key: string;
  readonly sources: StoneRenderBatchSource[];
  distance: number;
  signature: string;
}

interface ActiveStoneBuild {
  readonly request: StoneBatchRequest;
  readonly job: StoneRenderBatchBuildJob;
  cpuMs: number;
}

export interface StoneDiagnostics {
  /** Active render batches; retained for compatibility with existing diagnostics. */
  activeChunks: number;
  queuedChunks: number;
  stones: number;
  triangles: number;
  drawCalls: number;
  lastBuildMs: number;
  maxBuildMs: number;
}

export class WorldStoneSystem {
  private readonly batches = new Map<string, StoneBatch>();
  private readonly queue: StoneBatchRequest[] = [];
  private readonly desired = new Map<string, StoneBatchRequest>();
  /** Negative cache prevents deterministic empty batches rebuilding on every move. */
  private readonly emptySignatures = new Map<string, string>();
  private readonly material = new THREE.MeshLambertMaterial({
    vertexColors: true,
  });
  private readonly mossExposureDirection = new THREE.Vector3();
  private readonly builder: StoneRenderBatchBuilder;
  private readonly enabled: boolean;
  private readonly grainTexture?: THREE.Texture;
  private activeBuild?: ActiveStoneBuild;
  private centerChunkX = Number.NaN;
  private centerChunkZ = Number.NaN;
  private lastBuildMs = 0;
  private maxBuildMs = 0;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly stoneField: StoneField,
    private readonly config: WorldConfig,
    private readonly compact: boolean,
    private readonly receiveShadows: boolean,
  ) {
    this.enabled = config.stonesEnabled >= 1;
    this.material.name = "world-stone-material";
    this.material.dithering = true;

    const azimuth = THREE.MathUtils.degToRad(
      config.stoneMossExposureAzimuthDegrees,
    );
    const elevation = THREE.MathUtils.degToRad(
      config.stoneMossExposureElevationDegrees,
    );
    const horizontal = Math.cos(elevation);
    this.mossExposureDirection
      .set(
        Math.cos(azimuth) * horizontal,
        Math.sin(elevation),
        Math.sin(azimuth) * horizontal,
      )
      .normalize();
    this.builder = new StoneRenderBatchBuilder(
      stoneField,
      config,
      this.mossExposureDirection,
    );
    setStoneClearanceField(stoneField, config);

    if (this.enabled && config.stoneGrainStrength > 0) {
      this.grainTexture = this.createGrainTexture();
    }
    if (this.enabled) {
      applyStoneSurfaceShader(this.material, config, this.grainTexture);
    }
  }

  update(position: THREE.Vector3, buildDeadline: number): void {
    if (!this.enabled) return;

    const chunkX = Math.floor(position.x / this.config.chunkSize);
    const chunkZ = Math.floor(position.z / this.config.chunkSize);
    if (chunkX !== this.centerChunkX || chunkZ !== this.centerChunkZ) {
      this.centerChunkX = chunkX;
      this.centerChunkZ = chunkZ;
      this.reconcile();
    }
    this.processQueue(buildDeadline);
  }

  getDiagnostics(): StoneDiagnostics {
    let stones = 0;
    let triangles = 0;
    for (const batch of this.batches.values()) {
      stones += batch.stones;
      triangles += batch.triangles;
    }
    return {
      activeChunks: this.batches.size,
      queuedChunks: this.queue.length + (this.activeBuild ? 1 : 0),
      stones,
      triangles,
      drawCalls: this.batches.size,
      lastBuildMs: this.lastBuildMs,
      maxBuildMs: this.maxBuildMs,
    };
  }

  dispose(): void {
    this.activeBuild = undefined;
    for (const batch of this.batches.values()) {
      this.removeBatch(batch);
    }
    this.batches.clear();
    this.queue.length = 0;
    this.desired.clear();
    this.emptySignatures.clear();
    this.material.dispose();
    this.grainTexture?.dispose();
  }

  private createGrainTexture(): THREE.Texture {
    const texture = new THREE.TextureLoader().load("./perlinnoise.webp");
    texture.name = "world-stone-grain";
    texture.colorSpace = THREE.NoColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }

  private reconcile(): void {
    const radius = this.compact
      ? this.config.stoneRadiusCompact
      : this.config.stoneRadiusDesktop;
    const detailRadius = Math.min(radius, this.config.stoneDetailRadius);
    const batchAxis = this.config.stoneRenderBatchChunksPerAxis;
    const chunkSize = this.config.chunkSize;
    const halfWorld = this.config.worldSize * 0.5;
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

        const distance = Math.max(Math.abs(dx), Math.abs(dz));
        const batchX = Math.floor(chunkX / batchAxis);
        const batchZ = Math.floor(chunkZ / batchAxis);
        const key = `${batchX}:${batchZ}`;
        let request = this.desired.get(key);
        if (!request) {
          request = {
            key,
            sources: [],
            distance,
            signature: "",
          };
          this.desired.set(key, request);
        }
        request.distance = Math.min(request.distance, distance);
        request.sources.push({
          chunkX,
          chunkZ,
          detailed: distance <= detailRadius,
        });
      }
    }

    for (const request of this.desired.values()) {
      request.signature = request.sources
        .map(
          (source) =>
            `${source.chunkX},${source.chunkZ},${source.detailed ? 1 : 0}`,
        )
        .join(";");
    }

    for (const [key, batch] of this.batches) {
      if (!this.desired.has(key)) {
        this.removeBatch(batch);
        this.batches.delete(key);
      }
    }
    for (const key of this.emptySignatures.keys()) {
      if (!this.desired.has(key)) {
        this.emptySignatures.delete(key);
      }
    }

    if (this.activeBuild) {
      const wanted = this.desired.get(this.activeBuild.request.key);
      if (!wanted || wanted.signature !== this.activeBuild.request.signature) {
        this.activeBuild = undefined;
      }
    }

    this.queue.length = 0;
    for (const request of this.desired.values()) {
      const existing = this.batches.get(request.key);
      if (existing?.signature === request.signature) continue;
      if (this.emptySignatures.get(request.key) === request.signature) continue;
      if (
        this.activeBuild?.request.key === request.key &&
        this.activeBuild.request.signature === request.signature
      ) {
        continue;
      }
      this.queue.push(request);
    }
    // Pop from the end so queue removal is O(1), with nearest batches first.
    this.queue.sort((left, right) => right.distance - left.distance);
  }

  private processQueue(buildDeadline: number): void {
    let completed = 0;
    while (
      completed < this.config.stoneChunksPerFrame &&
      performance.now() < buildDeadline
    ) {
      if (!this.activeBuild) {
        const request = this.takeNextRequest();
        if (!request) return;
        this.activeBuild = {
          request,
          job: this.builder.begin(request.sources),
          cpuMs: 0,
        };
      }

      const active = this.activeBuild;
      const sliceStartedAt = performance.now();
      const progress = this.builder.advance(active.job, buildDeadline);
      active.cpuMs += performance.now() - sliceStartedAt;
      if (!progress.complete) return;

      const wanted = this.desired.get(active.request.key);
      if (!wanted || wanted.signature !== active.request.signature) {
        this.activeBuild = undefined;
        continue;
      }

      this.lastBuildMs = active.cpuMs;
      this.maxBuildMs = Math.max(this.maxBuildMs, active.cpuMs);
      this.commitBuild(active.request, progress.result);
      this.activeBuild = undefined;
      completed += 1;
    }
  }

  private takeNextRequest(): StoneBatchRequest | undefined {
    while (this.queue.length > 0) {
      const request = this.queue.pop();
      if (!request) return undefined;
      const wanted = this.desired.get(request.key);
      if (!wanted || wanted.signature !== request.signature) continue;
      const existing = this.batches.get(request.key);
      if (existing?.signature === request.signature) continue;
      if (this.emptySignatures.get(request.key) === request.signature) continue;
      return request;
    }
    return undefined;
  }

  private commitBuild(
    request: StoneBatchRequest,
    result: ReturnType<StoneRenderBatchBuilder["build"]>,
  ): void {
    const existing = this.batches.get(request.key);
    if (existing) {
      this.removeBatch(existing);
      this.batches.delete(existing.key);
    }

    if (!result) {
      this.emptySignatures.set(request.key, request.signature);
      return;
    }

    this.emptySignatures.delete(request.key);
    const mesh = new THREE.Mesh(result.geometry, this.material);
    mesh.name = `world-stones-${request.key}`;
    mesh.castShadow = this.receiveShadows && result.hasDetailedGeometry;
    mesh.receiveShadow = this.receiveShadows;
    mesh.matrixAutoUpdate = false;
    mesh.matrixWorldAutoUpdate = false;
    mesh.updateMatrix();
    mesh.updateMatrixWorld(true);

    const batch: StoneBatch = {
      key: request.key,
      signature: request.signature,
      mesh,
      triangles: result.triangles,
      stones: result.stones,
    };
    this.batches.set(batch.key, batch);
    this.scene.add(mesh);
  }

  private removeBatch(batch: StoneBatch): void {
    this.scene.remove(batch.mesh);
    batch.mesh.geometry.dispose();
  }
}
