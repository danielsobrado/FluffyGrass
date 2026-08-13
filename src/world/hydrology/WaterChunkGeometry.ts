import * as THREE from "three";
import type { HydrologySample } from "./HydrologyField";
import {
  createWaterInteractionSample,
  type WaterInteractionField,
  type WaterInteractionSample,
} from "./WaterInteractionField";
import { WATER_VISIBLE_COVERAGE_THRESHOLD } from "./WaterMaterialTuning";

const FLOW_EPSILON = 1e-6;

/** Owns water-only vertex packing and sparse wet-cell topology for one terrain chunk. */
export class WaterChunkGeometryBuilder {
  private readonly positions: Float32Array;
  private readonly normals: Float32Array;
  private readonly data: Float32Array;
  private readonly interactions: Float32Array;
  private readonly stoneClearances: Float32Array;
  private readonly interaction: WaterInteractionSample = createWaterInteractionSample();
  private readonly bedGradient = new THREE.Vector2();
  private maxCoverage = 0;

  constructor(
    private readonly resolution: number,
    private readonly interactionField: WaterInteractionField,
  ) {
    const vertexCount = resolution * resolution;
    this.positions = new Float32Array(vertexCount * 3);
    this.normals = new Float32Array(vertexCount * 3);
    this.data = new Float32Array(vertexCount * 4);
    this.interactions = new Float32Array(vertexCount * 2);
    this.stoneClearances = new Float32Array(vertexCount);
  }

  writeVertex(
    index: number,
    x: number,
    z: number,
    terrainHeight: number,
    hydrology: HydrologySample,
    stoneClearance: number,
  ): void {
    const positionOffset = index * 3;
    this.positions[positionOffset] = x;
    this.positions[positionOffset + 1] = hydrology.waterLevel;
    this.positions[positionOffset + 2] = z;
    this.normals[positionOffset] = 0;
    this.normals[positionOffset + 1] = 1;
    this.normals[positionOffset + 2] = 0;

    const dataOffset = index * 4;
    this.data[dataOffset] = hydrology.waterCoverage;
    this.data[dataOffset + 1] = Math.max(
      0,
      hydrology.waterLevel - terrainHeight,
    );
    this.data[dataOffset + 2] = hydrology.flowX * hydrology.riverCoverage;
    this.data[dataOffset + 3] = hydrology.flowZ * hydrology.riverCoverage;
    this.stoneClearances[index] = stoneClearance;
    this.maxCoverage = Math.max(this.maxCoverage, hydrology.waterCoverage);
  }

  createGeometry(): THREE.BufferGeometry | undefined {
    if (this.maxCoverage < WATER_VISIBLE_COVERAGE_THRESHOLD) return undefined;
    this.resolveFlowAndInteractions();
    const indices = this.createIndices();
    if (!indices) return undefined;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(this.normals, 3));
    geometry.setAttribute("waterData", new THREE.BufferAttribute(this.data, 4));
    geometry.setAttribute(
      "waterInteraction",
      new THREE.BufferAttribute(this.interactions, 2),
    );
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }

  private resolveFlowAndInteractions(): void {
    const vertexCount = this.resolution * this.resolution;
    for (let index = 0; index < vertexCount; index += 1) {
      const dataOffset = index * 4;
      if (this.data[dataOffset] < WATER_VISIBLE_COVERAGE_THRESHOLD) continue;

      const riverCoverage = Math.hypot(
        this.data[dataOffset + 2],
        this.data[dataOffset + 3],
      );
      let flowX = 0;
      let flowZ = 0;
      if (riverCoverage > FLOW_EPSILON) {
        flowX = this.data[dataOffset + 2] / riverCoverage;
        flowZ = this.data[dataOffset + 3] / riverCoverage;
        this.resolveBedGradient(index, this.bedGradient);
        if (this.bedGradient.x * flowX + this.bedGradient.y * flowZ > 0) {
          flowX = -flowX;
          flowZ = -flowZ;
        }
        this.data[dataOffset + 2] = flowX * riverCoverage;
        this.data[dataOffset + 3] = flowZ * riverCoverage;
      }

      const positionOffset = index * 3;
      this.interactionField.sample(
        this.positions[positionOffset],
        this.positions[positionOffset + 2],
        riverCoverage,
        flowX,
        flowZ,
        this.stoneClearances[index],
        this.interaction,
      );
      const interactionOffset = index * 2;
      this.interactions[interactionOffset] = this.interaction.obstacle;
      this.interactions[interactionOffset + 1] = this.interaction.wake;
    }
  }

  private resolveBedGradient(index: number, target: THREE.Vector2): void {
    const xIndex = index % this.resolution;
    const zIndex = Math.floor(index / this.resolution);
    const left = xIndex > 0 ? index - 1 : index;
    const right = xIndex + 1 < this.resolution ? index + 1 : index;
    const down = zIndex > 0 ? index - this.resolution : index;
    const up = zIndex + 1 < this.resolution ? index + this.resolution : index;

    const leftPosition = left * 3;
    const rightPosition = right * 3;
    const downPosition = down * 3;
    const upPosition = up * 3;
    const deltaX = this.positions[rightPosition] - this.positions[leftPosition];
    const deltaZ = this.positions[upPosition + 2] - this.positions[downPosition + 2];
    const bedLeft = this.positions[leftPosition + 1] - this.data[left * 4 + 1];
    const bedRight = this.positions[rightPosition + 1] - this.data[right * 4 + 1];
    const bedDown = this.positions[downPosition + 1] - this.data[down * 4 + 1];
    const bedUp = this.positions[upPosition + 1] - this.data[up * 4 + 1];

    target.set(
      Math.abs(deltaX) > FLOW_EPSILON ? (bedRight - bedLeft) / deltaX : 0,
      Math.abs(deltaZ) > FLOW_EPSILON ? (bedUp - bedDown) / deltaZ : 0,
    );
  }

  private createIndices(): Uint16Array | Uint32Array | undefined {
    const cells = this.resolution - 1;
    const vertexCount = this.resolution * this.resolution;
    const indices = vertexCount <= 65535
      ? new Uint16Array(cells * cells * 6)
      : new Uint32Array(cells * cells * 6);
    let writeOffset = 0;

    for (let zIndex = 0; zIndex < cells; zIndex += 1) {
      for (let xIndex = 0; xIndex < cells; xIndex += 1) {
        const row = zIndex * this.resolution + xIndex;
        const topLeft = row;
        const bottomLeft = row + this.resolution;
        const topRight = row + 1;
        const bottomRight = bottomLeft + 1;
        const maximumCoverage = Math.max(
          this.data[topLeft * 4],
          this.data[bottomLeft * 4],
          this.data[topRight * 4],
          this.data[bottomRight * 4],
        );
        if (maximumCoverage < WATER_VISIBLE_COVERAGE_THRESHOLD) continue;

        indices[writeOffset] = topLeft;
        indices[writeOffset + 1] = bottomLeft;
        indices[writeOffset + 2] = topRight;
        indices[writeOffset + 3] = topRight;
        indices[writeOffset + 4] = bottomLeft;
        indices[writeOffset + 5] = bottomRight;
        writeOffset += 6;
      }
    }

    return writeOffset > 0 ? indices.slice(0, writeOffset) : undefined;
  }
}
