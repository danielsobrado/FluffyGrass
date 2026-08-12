import * as THREE from "three";
import {
  createHydrologySample,
  type HydrologySample,
} from "./hydrology/HydrologyField";
import type { TerrainField } from "./TerrainField";
import type {
  TerrainSurfaceField,
  TerrainSurfaceTargets,
} from "./terrain/TerrainSurfaceField";

/** Every grass layer and the character stay at the default 0. */
export const TERRAIN_RENDER_ORDER = 1;
export const WATER_RENDER_ORDER = 2;

const VERTEX_STAGE = 0;
const INDEX_STAGE = 1;
const FINALIZE_STAGE = 2;
const WATER_MIN_COVERAGE = 0.01;

export class TerrainChunk {
  readonly key: string;
  readonly mesh: THREE.Mesh;
  readonly waterMesh?: THREE.Mesh;

  constructor(
    readonly chunkX: number,
    readonly chunkZ: number,
    readonly resolution: number,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    receiveShadow: boolean,
    waterGeometry?: THREE.BufferGeometry,
    waterMaterial?: THREE.Material,
  ) {
    this.key = `${chunkX}:${chunkZ}`;
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = `terrain-${this.key}-r${resolution}`;
    this.mesh.receiveShadow = receiveShadow;
    this.mesh.castShadow = false;
    this.mesh.renderOrder = TERRAIN_RENDER_ORDER;

    if (waterGeometry && waterMaterial) {
      this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
      this.waterMesh.name = `water-${this.key}-r${resolution}`;
      this.waterMesh.receiveShadow = false;
      this.waterMesh.castShadow = false;
      this.waterMesh.renderOrder = WATER_RENDER_ORDER;
    }
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.waterMesh?.geometry.dispose();
  }
}

/** Builds terrain and matching water meshes in bounded slices. */
export class TerrainChunkBuilder {
  readonly key: string;
  readonly resolution: number;

  private readonly cells: number;
  private readonly step: number;
  private readonly originX: number;
  private readonly originZ: number;
  private readonly positions: Float32Array;
  private readonly normals: Float32Array;
  private readonly colors: Float32Array;
  private readonly paths: Float32Array;
  private readonly ecologies: Float32Array;
  private readonly environments: Float32Array;
  private readonly biomes: Float32Array;
  private readonly waterPositions: Float32Array;
  private readonly waterNormals: Float32Array;
  private readonly waterCoverages: Float32Array;
  private readonly indices: Uint16Array | Uint32Array;
  private readonly normal = new THREE.Vector3();
  private readonly color = new THREE.Color();
  private readonly pathDistances = new THREE.Vector2();
  private readonly ecology = new THREE.Vector4();
  private readonly environment = new THREE.Vector4();
  private readonly biome = new THREE.Vector3();
  private readonly hydrology: HydrologySample = createHydrologySample();
  private readonly surfaceTargets: TerrainSurfaceTargets = {
    ecology: this.ecology,
    environment: this.environment,
    biome: this.biome,
  };
  private stage = VERTEX_STAGE;
  private nextVertex = 0;
  private nextCell = 0;
  private maxWaterCoverage = 0;

  constructor(
    private readonly chunkX: number,
    private readonly chunkZ: number,
    chunkSize: number,
    resolution: number,
    private readonly field: TerrainField,
    private readonly surfaceField: TerrainSurfaceField,
    private readonly material: THREE.Material,
    private readonly waterMaterial: THREE.Material | undefined,
    private readonly receiveShadow: boolean,
  ) {
    this.key = `${chunkX}:${chunkZ}`;
    this.resolution = resolution;
    this.cells = resolution - 1;
    this.step = chunkSize / this.cells;
    this.originX = chunkX * chunkSize;
    this.originZ = chunkZ * chunkSize;
    const vertexCount = resolution * resolution;
    this.positions = new Float32Array(vertexCount * 3);
    this.normals = new Float32Array(vertexCount * 3);
    this.colors = new Float32Array(vertexCount * 3);
    this.paths = new Float32Array(vertexCount * 3);
    this.ecologies = new Float32Array(vertexCount * 4);
    this.environments = new Float32Array(vertexCount * 4);
    this.biomes = new Float32Array(vertexCount * 3);
    this.waterPositions = new Float32Array(vertexCount * 3);
    this.waterNormals = new Float32Array(vertexCount * 3);
    this.waterCoverages = new Float32Array(vertexCount);
    this.indices = vertexCount <= 65535
      ? new Uint16Array(this.cells * this.cells * 6)
      : new Uint32Array(this.cells * this.cells * 6);
  }

  advance(budgetMs: number): TerrainChunk | undefined {
    const deadline = performance.now() + budgetMs;
    let processed = 0;

    while (this.stage <= FINALIZE_STAGE) {
      if (processed > 0 && performance.now() >= deadline) {
        return undefined;
      }

      if (this.stage === VERTEX_STAGE) {
        processed += this.advanceVertices(deadline);
      } else if (this.stage === INDEX_STAGE) {
        processed += this.advanceIndices(deadline);
      } else {
        return this.finalize();
      }
    }

    return undefined;
  }

  private advanceVertices(deadline: number): number {
    const total = this.resolution * this.resolution;
    let processed = 0;
    while (
      this.nextVertex < total &&
      (processed === 0 || performance.now() < deadline)
    ) {
      const xIndex = this.nextVertex % this.resolution;
      const zIndex = Math.floor(this.nextVertex / this.resolution);
      const x = this.originX + xIndex * this.step;
      const z = this.originZ + zIndex * this.step;
      const height = this.field.sampleHeight(x, z);
      this.field.sampleHydrology(x, z, height, this.hydrology);
      const suitabilityWithoutSlope =
        this.field.sampleGrassSuitabilityWithoutSlope(x, z, height);
      this.field.sampleNormal(x, z, this.normal);
      const suitability =
        this.field.sampleGrassSlopeMask(this.normal) * suitabilityWithoutSlope;
      this.field.sampleColor(
        x,
        z,
        height,
        this.normal,
        suitability,
        this.color,
      );
      this.field.samplePathDistances(x, z, this.pathDistances);
      this.surfaceField.sample(
        x,
        z,
        height,
        suitability,
        this.hydrology,
        this.surfaceTargets,
      );

      const offset = this.nextVertex * 3;
      this.paths[offset] = this.pathDistances.x;
      this.paths[offset + 1] = this.pathDistances.y;
      this.paths[offset + 2] = this.field.samplePathVisibility(height);
      this.positions[offset] = x;
      this.positions[offset + 1] = height;
      this.positions[offset + 2] = z;
      this.normals[offset] = this.normal.x;
      this.normals[offset + 1] = this.normal.y;
      this.normals[offset + 2] = this.normal.z;
      this.colors[offset] = this.color.r;
      this.colors[offset + 1] = this.color.g;
      this.colors[offset + 2] = this.color.b;

      const ecologyOffset = this.nextVertex * 4;
      this.ecologies[ecologyOffset] = this.ecology.x;
      this.ecologies[ecologyOffset + 1] = this.ecology.y;
      this.ecologies[ecologyOffset + 2] = this.ecology.z;
      this.ecologies[ecologyOffset + 3] = this.ecology.w;
      this.environments[ecologyOffset] = this.environment.x;
      this.environments[ecologyOffset + 1] = this.environment.y;
      this.environments[ecologyOffset + 2] = this.environment.z;
      this.environments[ecologyOffset + 3] = this.environment.w;

      const biomeOffset = this.nextVertex * 3;
      this.biomes[biomeOffset] = this.biome.x;
      this.biomes[biomeOffset + 1] = this.biome.y;
      this.biomes[biomeOffset + 2] = this.biome.z;

      this.waterPositions[offset] = x;
      this.waterPositions[offset + 1] = this.hydrology.waterLevel;
      this.waterPositions[offset + 2] = z;
      this.waterNormals[offset] = 0;
      this.waterNormals[offset + 1] = 1;
      this.waterNormals[offset + 2] = 0;
      this.waterCoverages[this.nextVertex] = this.hydrology.waterCoverage;
      this.maxWaterCoverage = Math.max(
        this.maxWaterCoverage,
        this.hydrology.waterCoverage,
      );

      this.nextVertex += 1;
      processed += 1;
    }
    if (this.nextVertex >= total) {
      this.stage = INDEX_STAGE;
    }
    return processed;
  }

  private advanceIndices(deadline: number): number {
    const total = this.cells * this.cells;
    let processed = 0;
    while (
      this.nextCell < total &&
      (processed === 0 || performance.now() < deadline)
    ) {
      const xIndex = this.nextCell % this.cells;
      const zIndex = Math.floor(this.nextCell / this.cells);
      const row = zIndex * this.resolution + xIndex;
      const offset = this.nextCell * 6;
      this.indices[offset] = row;
      this.indices[offset + 1] = row + this.resolution;
      this.indices[offset + 2] = row + 1;
      this.indices[offset + 3] = row + 1;
      this.indices[offset + 4] = row + this.resolution;
      this.indices[offset + 5] = row + this.resolution + 1;
      this.nextCell += 1;
      processed += 1;
    }
    if (this.nextCell >= total) {
      this.stage = FINALIZE_STAGE;
    }
    return processed;
  }

  private finalize(): TerrainChunk {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3),
    );
    geometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(this.normals, 3),
    );
    geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(this.colors, 3),
    );
    geometry.setAttribute(
      "terrainPath",
      new THREE.BufferAttribute(this.paths, 3),
    );
    geometry.setAttribute(
      "terrainEcology",
      new THREE.BufferAttribute(this.ecologies, 4),
    );
    geometry.setAttribute(
      "terrainEnvironment",
      new THREE.BufferAttribute(this.environments, 4),
    );
    geometry.setAttribute(
      "terrainBiome",
      new THREE.BufferAttribute(this.biomes, 3),
    );
    geometry.setIndex(new THREE.BufferAttribute(this.indices, 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const waterGeometry = this.createWaterGeometry();
    this.stage += 1;
    return new TerrainChunk(
      this.chunkX,
      this.chunkZ,
      this.resolution,
      geometry,
      this.material,
      this.receiveShadow,
      waterGeometry,
      waterGeometry ? this.waterMaterial : undefined,
    );
  }

  private createWaterGeometry(): THREE.BufferGeometry | undefined {
    if (!this.waterMaterial || this.maxWaterCoverage <= WATER_MIN_COVERAGE) {
      return undefined;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.waterPositions, 3),
    );
    geometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(this.waterNormals, 3),
    );
    geometry.setAttribute(
      "waterCoverage",
      new THREE.BufferAttribute(this.waterCoverages, 1),
    );
    geometry.setIndex(new THREE.BufferAttribute(this.indices, 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }
}
