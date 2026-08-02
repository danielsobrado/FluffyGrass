import * as THREE from "three";
import type { TerrainField } from "./TerrainField";

export class TerrainChunk {
  readonly key: string;
  readonly mesh: THREE.Mesh;
  readonly resolution: number;

  constructor(
    readonly chunkX: number,
    readonly chunkZ: number,
    chunkSize: number,
    resolution: number,
    field: TerrainField,
    material: THREE.Material,
  ) {
    this.key = `${chunkX}:${chunkZ}`;
    this.resolution = resolution;
    this.mesh = new THREE.Mesh(
      this.createGeometry(chunkSize, resolution, field),
      material,
    );
    this.mesh.name = `terrain-${this.key}-r${resolution}`;
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
  }

  private createGeometry(
    chunkSize: number,
    resolution: number,
    field: TerrainField,
  ): THREE.BufferGeometry {
    const vertexCount = resolution * resolution;
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const cells = resolution - 1;
    const indices = new Uint32Array(cells * cells * 6);
    const originX = this.chunkX * chunkSize;
    const originZ = this.chunkZ * chunkSize;
    const normal = new THREE.Vector3();
    const color = new THREE.Color();
    let vertexOffset = 0;

    for (let zIndex = 0; zIndex < resolution; zIndex += 1) {
      const z = originZ + (zIndex / cells) * chunkSize;
      for (let xIndex = 0; xIndex < resolution; xIndex += 1) {
        const x = originX + (xIndex / cells) * chunkSize;
        const height = field.sampleHeight(x, z);
        field.sampleNormal(x, z, normal);
        const suitability = field.sampleGrassSuitability(
          x,
          z,
          height,
          normal,
        );
        field.sampleColor(x, z, height, normal, suitability, color);
        positions[vertexOffset] = x;
        positions[vertexOffset + 1] = height;
        positions[vertexOffset + 2] = z;
        normals[vertexOffset] = normal.x;
        normals[vertexOffset + 1] = normal.y;
        normals[vertexOffset + 2] = normal.z;
        colors[vertexOffset] = color.r;
        colors[vertexOffset + 1] = color.g;
        colors[vertexOffset + 2] = color.b;
        vertexOffset += 3;
      }
    }

    let indexOffset = 0;
    for (let zIndex = 0; zIndex < cells; zIndex += 1) {
      for (let xIndex = 0; xIndex < cells; xIndex += 1) {
        const row = zIndex * resolution + xIndex;
        indices[indexOffset] = row;
        indices[indexOffset + 1] = row + resolution;
        indices[indexOffset + 2] = row + 1;
        indices[indexOffset + 3] = row + 1;
        indices[indexOffset + 4] = row + resolution;
        indices[indexOffset + 5] = row + resolution + 1;
        indexOffset += 6;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }
}
