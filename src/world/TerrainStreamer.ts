import * as THREE from "three";
import type { GrassArtDirection } from "../grass/GrassArtDirection";
import type { WorldConfig } from "./WorldConfig";
import type { TerrainField } from "./TerrainField";
import { TerrainChunk, TerrainChunkBuilder } from "./TerrainChunk";

const TERRAIN_DETAIL_VERTEX = `
varying vec3 vTerrainWorldPosition;
`;

const TERRAIN_DETAIL_POSITION = `
vTerrainWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

const TERRAIN_DETAIL_FRAGMENT = `
uniform sampler2D uTerrainGrassDetail;
uniform vec3 uTerrainGrassTint;
uniform float uTerrainGrassTintStrength;
varying vec3 vTerrainWorldPosition;
`;

const TERRAIN_DETAIL_COLOR = `
float terrainGrassMask = smoothstep(
  0.015,
  0.12,
  diffuseColor.g - max(diffuseColor.r, diffuseColor.b)
);
vec2 terrainWind = normalize(vec2(0.8, 0.35));
vec2 terrainAcrossWind = vec2(-terrainWind.y, terrainWind.x);
vec2 terrainDetailUv = vec2(
  dot(vTerrainWorldPosition.xz, terrainWind) * 0.12,
  dot(vTerrainWorldPosition.xz, terrainAcrossWind) * 0.035
);
float terrainGrassDetail =
  texture2D(uTerrainGrassDetail, terrainDetailUv).r * 2.0 - 1.0;
float terrainDetailDistance = distance(cameraPosition, vTerrainWorldPosition);
float terrainDetailFade = 1.0 - smoothstep(300.0, 460.0, terrainDetailDistance);
diffuseColor.rgb *= 1.0 +
  terrainGrassDetail * 0.12 * terrainGrassMask * terrainDetailFade;
float terrainLuminance = dot(
  diffuseColor.rgb,
  vec3(0.2126, 0.7152, 0.0722)
);
vec3 terrainTintedGrass = uTerrainGrassTint * mix(
  0.72,
  1.18,
  smoothstep(0.12, 0.52, terrainLuminance)
);
diffuseColor.rgb = mix(
  diffuseColor.rgb,
  terrainTintedGrass,
  terrainGrassMask * uTerrainGrassTintStrength
);
`;

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
  lastBuildMs: number;
  maxBuildMs: number;
}

const TERRAIN_BUILD_BUDGET_MS = 3;
const DESKTOP_TERRAIN_FRAME_BUDGET_MS = 2.5;
const COMPACT_TERRAIN_FRAME_BUDGET_MS = 1.5;

export class TerrainStreamer {
  private readonly chunks = new Map<string, TerrainChunk>();
  private readonly queue: ChunkRequest[] = [];
  private readonly desired = new Map<string, ChunkRequest>();
  private readonly grassDetailTexture = new THREE.TextureLoader().load(
    "./perlinnoise.webp",
  );
  private readonly material = new THREE.MeshLambertMaterial({
    vertexColors: true,
  });
  private readonly grassArtUniforms = {
    uTerrainGrassTint: { value: new THREE.Color("#4d923f") },
    uTerrainGrassTintStrength: { value: 0.5 },
  };
  private centerChunkX = Number.NaN;
  private centerChunkZ = Number.NaN;
  private activeBuild?: TerrainChunkBuilder;
  private lastBuildMs = 0;
  private maxBuildMs = 0;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly field: TerrainField,
    private readonly config: WorldConfig,
    private readonly compact: boolean,
    shadows: boolean,
  ) {
    this.grassDetailTexture.name = "world-terrain-grass-detail";
    this.grassDetailTexture.colorSpace = THREE.NoColorSpace;
    this.grassDetailTexture.wrapS = THREE.RepeatWrapping;
    this.grassDetailTexture.wrapT = THREE.RepeatWrapping;
    this.grassDetailTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.grassDetailTexture.magFilter = THREE.LinearFilter;
    this.grassDetailTexture.generateMipmaps = true;
    this.material.name = "world-terrain-material";
    this.material.dithering = true;
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTerrainGrassDetail = {
        value: this.grassDetailTexture,
      };
      Object.assign(shader.uniforms, this.grassArtUniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>${TERRAIN_DETAIL_VERTEX}`)
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>${TERRAIN_DETAIL_POSITION}`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>${TERRAIN_DETAIL_FRAGMENT}`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>${TERRAIN_DETAIL_COLOR}`,
        );
    };
    this.material.customProgramCacheKey = () =>
      "world-terrain-grass-detail-v2";
    this.material.needsUpdate = true;
    this.material.userData.shadows = shadows;
  }

  update(
    position: THREE.Vector3,
    buildDeadline = Number.POSITIVE_INFINITY,
  ): void {
    const chunkX = Math.floor(position.x / this.config.chunkSize);
    const chunkZ = Math.floor(position.z / this.config.chunkSize);
    if (chunkX !== this.centerChunkX || chunkZ !== this.centerChunkZ) {
      this.centerChunkX = chunkX;
      this.centerChunkZ = chunkZ;
      this.reconcile();
    }

    this.processBuildQueue(buildDeadline);
  }

  getDiagnostics(): TerrainDiagnostics {
    let triangles = 0;
    for (const chunk of this.chunks.values()) {
      const cells = chunk.resolution - 1;
      triangles += cells * cells * 2;
    }
    return {
      activeChunks: this.chunks.size,
      queuedChunks: this.queue.length + (this.activeBuild ? 1 : 0),
      triangles,
      lastBuildMs: this.lastBuildMs,
      maxBuildMs: this.maxBuildMs,
    };
  }

  dispose(): void {
    for (const chunk of this.chunks.values()) {
      this.removeChunk(chunk);
    }
    this.chunks.clear();
    this.queue.length = 0;
    this.activeBuild = undefined;
    this.desired.clear();
    this.material.dispose();
    this.grassDetailTexture.dispose();
  }

  setGrassArtDirection(direction: GrassArtDirection): void {
    this.grassArtUniforms.uTerrainGrassTint.value.set(
      direction.terrainGrassColor,
    );
    this.grassArtUniforms.uTerrainGrassTintStrength.value =
      direction.terrainGrassTintStrength;
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
      if (!request) {
        this.removeChunk(chunk);
        this.chunks.delete(key);
      }
    }

    const activeRequest = this.activeBuild
      ? this.desired.get(this.activeBuild.key)
      : undefined;
    if (
      this.activeBuild &&
      (!activeRequest || activeRequest.resolution !== this.activeBuild.resolution)
    ) {
      this.activeBuild = undefined;
    }

    const centerKey = `${this.centerChunkX}:${this.centerChunkZ}`;
    const centerRequest = this.desired.get(centerKey);
    const centerChunk = this.chunks.get(centerKey);
    if (
      centerRequest &&
      centerChunk?.resolution !== centerRequest.resolution &&
      this.activeBuild &&
      this.activeBuild.key !== centerKey
    ) {
      this.activeBuild = undefined;
    }

    this.queue.length = 0;
    for (const request of this.desired.values()) {
      const chunk = this.chunks.get(request.key);
      if (
        chunk?.resolution !== request.resolution &&
        !(
          this.activeBuild?.key === request.key &&
          this.activeBuild.resolution === request.resolution
        )
      ) {
        this.queue.push(request);
      }
    }
    this.queue.sort((left, right) => left.distance - right.distance);
  }

  private processBuildQueue(buildDeadline: number): void {
    while (!this.activeBuild && this.queue.length > 0) {
      const request = this.queue.shift();
      const desired = request ? this.desired.get(request.key) : undefined;
      if (!request || desired?.resolution !== request.resolution) {
        continue;
      }
      const existing = this.chunks.get(request.key);
      if (existing?.resolution === request.resolution) {
        continue;
      }
      this.activeBuild = new TerrainChunkBuilder(
        request.chunkX,
        request.chunkZ,
        this.config.chunkSize,
        request.resolution,
        this.field,
        this.material,
        this.material.userData.shadows === true,
      );
    }

    const build = this.activeBuild;
    if (!build) {
      this.lastBuildMs = 0;
      return;
    }
    const desired = this.desired.get(build.key);
    if (!desired || desired.resolution !== build.resolution) {
      this.activeBuild = undefined;
      return;
    }

    const frameBudget = this.compact
      ? COMPACT_TERRAIN_FRAME_BUDGET_MS
      : DESKTOP_TERRAIN_FRAME_BUDGET_MS;
    const availableBudget = Math.min(
      TERRAIN_BUILD_BUDGET_MS * this.config.terrainChunksPerFrame,
      frameBudget,
      buildDeadline - performance.now(),
    );
    if (availableBudget <= 0) {
      this.lastBuildMs = 0;
      return;
    }

    const startedAt = performance.now();
    const chunk = build.advance(availableBudget);
    this.lastBuildMs = performance.now() - startedAt;
    this.maxBuildMs = Math.max(this.maxBuildMs, this.lastBuildMs);
    if (!chunk) {
      return;
    }

    const existing = this.chunks.get(chunk.key);
    if (existing) {
      this.removeChunk(existing);
    }
    this.chunks.set(chunk.key, chunk);
    this.scene.add(chunk.mesh);
    this.activeBuild = undefined;
  }

  private removeChunk(chunk: TerrainChunk): void {
    this.scene.remove(chunk.mesh);
    chunk.dispose();
  }
}
