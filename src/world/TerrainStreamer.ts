import * as THREE from "three";
import type { WorldConfig } from "./WorldConfig";
import type { TerrainField } from "./TerrainField";
import { TerrainChunk } from "./TerrainChunk";

interface ChunkRequest {
  key: string;
  chunkX: number;
  chunkZ: number;
  resolution: number;
  distance: number;
}

export interface TerrainDiagnostics {
  activeChunks: number;
  queuedChunks: number;
  triangles: number;
}

export class TerrainStreamer {
  private readonly chunks = new Map<string, TerrainChunk>();
  private readonly queue: ChunkRequest[] = [];
  private readonly desired = new Map<string, ChunkRequest>();
  private readonly material = new THREE.MeshLambertMaterial({
    vertexColors: true,
  });
  private centerChunkX = Number.NaN;
  private centerChunkZ = Number.NaN;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly field: TerrainField,
    private readonly config: WorldConfig,
    private readonly compact: boolean,
    shadows: boolean,
  ) {
    this.material.name = "world-terrain-material";
    this.material.dithering = true;
    this.material.needsUpdate = true;
    this.material.userData.shadows = shadows;
  }

  update(position: THREE.Vector3): void {
    const chunkX = Math.floor(position.x / this.config.chunkSize);
    const chunkZ = Math.floor(position.z / this.config.chunkSize);
    if (chunkX !== this.centerChunkX || chunkZ !== this.centerChunkZ) {
      this.centerChunkX = chunkX;
      this.centerChunkZ = chunkZ;
      this.reconcile();
    }

    const budget = this.config.terrainChunksPerFrame;
    for (let index = 0; index < budget && this.queue.length > 0; index += 1) {
      const request = this.queue.shift();
      if (!request || !this.desired.has(request.key)) {
        continue;
      }
      const existing = this.chunks.get(request.key);
      if (existing?.resolution === request.resolution) {
        continue;
      }
      if (existing) {
        this.removeChunk(existing);
      }
      const chunk = new TerrainChunk(
        request.chunkX,
        request.chunkZ,
        this.config.chunkSize,
        request.resolution,
        this.field,
        this.material,
      );
      chunk.mesh.receiveShadow = this.material.userData.shadows === true;
      this.chunks.set(request.key, chunk);
      this.scene.add(chunk.mesh);
    }
  }

  getDiagnostics(): TerrainDiagnostics {
    let triangles = 0;
    for (const chunk of this.chunks.values()) {
      const cells = chunk.resolution - 1;
      triangles += cells * cells * 2;
    }
    return {
      activeChunks: this.chunks.size,
      queuedChunks: this.queue.length,
      triangles,
    };
  }

  dispose(): void {
    for (const chunk of this.chunks.values()) {
      this.removeChunk(chunk);
    }
    this.chunks.clear();
    this.queue.length = 0;
    this.desired.clear();
    this.material.dispose();
  }

  private reconcile(): void {
    const radius = this.compact
      ? this.config.terrainRadiusCompact
      : this.config.terrainRadiusDesktop;
    const halfWorld = this.config.worldSize * 0.5;
    this.desired.clear();

    for (let dz = -radius; dz <= radius; dz += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const chunkX = this.centerChunkX + dx;
        const chunkZ = this.centerChunkZ + dz;
        const originX = chunkX * this.config.chunkSize;
        const originZ = chunkZ * this.config.chunkSize;
        if (
          originX < -halfWorld ||
          originZ < -halfWorld ||
          originX + this.config.chunkSize > halfWorld ||
          originZ + this.config.chunkSize > halfWorld
        ) {
          continue;
        }

        const distance = Math.max(Math.abs(dx), Math.abs(dz));
        const resolution =
          distance <= 1
            ? this.config.terrainNearResolution
            : distance <= Math.max(2, radius - 1)
              ? this.config.terrainMidResolution
              : this.config.terrainFarResolution;
        const key = `${chunkX}:${chunkZ}`;
        this.desired.set(key, {
          key,
          chunkX,
          chunkZ,
          resolution,
          distance,
        });
      }
    }

    for (const [key, chunk] of this.chunks) {
      const request = this.desired.get(key);
      if (!request || request.resolution !== chunk.resolution) {
        this.removeChunk(chunk);
        this.chunks.delete(key);
      }
    }

    this.queue.length = 0;
    for (const request of this.desired.values()) {
      const chunk = this.chunks.get(request.key);
      if (!chunk || chunk.resolution !== request.resolution) {
        this.queue.push(request);
      }
    }
    this.queue.sort((left, right) => left.distance - right.distance);
  }

  private removeChunk(chunk: TerrainChunk): void {
    this.scene.remove(chunk.mesh);
    chunk.dispose();
  }
}
