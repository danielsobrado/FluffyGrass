import * as THREE from "three";
import type { TerrainField } from "./TerrainField";

/** Every grass layer and the character stay at the default 0. */
export const TERRAIN_RENDER_ORDER = 1;

const VERTEX_STAGE = 0;
const INDEX_STAGE = 1;
const FINALIZE_STAGE = 2;

export class TerrainChunk {
  readonly key: string;
  readonly mesh: THREE.Mesh;

  constructor(
    readonly chunkX: number,
    readonly chunkZ: number,
    readonly resolution: number,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    receiveShadow: boolean,
  ) {
    this.key = `${chunkX}:${chunkZ}`;
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = `terrain-${this.key}-r${resolution}`;
    this.mesh.receiveShadow = receiveShadow;
    this.mesh.castShadow = false;
    // Terrain is the widest and most expensive per-pixel layer in the scene: a
    // detail texture fetch plus shadow receiving over most of the frame. Its
    // material is created before the grass materials, so three's opaque sort
    // (renderOrder, then material.id, then depth) would otherwise shade it
    // first with nothing occluding it. Pushing it behind every grass layer lets
    // the depth buffer reject the terrain fragments the grass already covers.
    this.mesh.renderOrder = TERRAIN_RENDER_ORDER;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
  }
}

/** Builds the configured terrain mesh in bounded slices instead of blocking a frame. */
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
  private readonly indices: Uint16Array | Uint32Array;
  private readonly normal = new THREE.Vector3();
  private readonly color = new THREE.Color();
  private stage = VERTEX_STAGE;
  private nextVertex = 0;
  private nextCell = 0;

  constructor(
    private readonly chunkX: number,
    private readonly chunkZ: number,
    chunkSize: number,
    resolution: number,
    private readonly field: TerrainField,
    private readonly material: THREE.Material,
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
      this.field.sampleNormal(x, z, this.normal);
      const suitability = this.field.sampleGrassSuitability(
        x,
        z,
        height,
        this.normal,
      );
      this.field.sampleColor(
        x,
        z,
        height,
        this.normal,
        suitability,
        this.color,
      );

      const offset = this.nextVertex * 3;
      this.positions[offset] = x;
      this.positions[offset + 1] = height;
      this.positions[offset + 2] = z;
      this.normals[offset] = this.normal.x;
      this.normals[offset + 1] = this.normal.y;
      this.normals[offset + 2] = this.normal.z;
      this.colors[offset] = this.color.r;
      this.colors[offset + 1] = this.color.g;
      this.colors[offset + 2] = this.color.b;
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
    geometry.setIndex(new THREE.BufferAttribute(this.indices, 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    this.stage += 1;
    return new TerrainChunk(
      this.chunkX,
      this.chunkZ,
      this.resolution,
      geometry,
      this.material,
      this.receiveShadow,
    );
  }
}
