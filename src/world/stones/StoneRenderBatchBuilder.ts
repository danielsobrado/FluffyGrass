import * as THREE from "three";
import type { WorldConfig } from "../WorldConfig";
import {
  resolveStoneGrowthWeightsInto,
  type StoneGrowthWeights,
} from "./StoneGrowthField";
import type { StoneMeshData } from "./StoneGeometry";
import type { StoneField, StoneInstance } from "./StoneField";
import {
  STONE_PALETTES,
  colorizeStoneVertices,
  resolveStoneGrowthColors,
} from "./StonePalette";
import { hashStoneCell } from "./StoneRandom";

export interface StoneRenderBatchSource {
  readonly chunkX: number;
  readonly chunkZ: number;
  readonly detailed: boolean;
}

export interface StoneRenderBatchGeometry {
  readonly geometry: THREE.BufferGeometry;
  readonly triangles: number;
  readonly stones: number;
  readonly hasDetailedGeometry: boolean;
}

const UP = new THREE.Vector3(0, 1, 0);
const HASH_UNIT = 1 / 4294967296;
const GROWTH_SEED_SALT = 0x43b0d7;
const GROWTH_EPSILON = 1e-4;
const BYTE_MAX = 255;
const UINT16_MAX = 65535;
const INT16_NORMAL_MAX = 32767;

function packUnitByte(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * BYTE_MAX);
}

function packSignedInt16(value: number): number {
  return Math.round(
    Math.max(-1, Math.min(1, value)) * INT16_NORMAL_MAX,
  );
}

/** CPU-side merger for one static render batch. */
export class StoneRenderBatchBuilder {
  private readonly chunkScratch: StoneInstance[] = [];
  private readonly instances: StoneInstance[] = [];
  private readonly detailed: boolean[] = [];
  private readonly variants: StoneMeshData[] = [];
  private readonly matrixScratch = new THREE.Matrix4();
  private readonly quaternionScratch = new THREE.Quaternion();
  private readonly yawScratch = new THREE.Quaternion();
  private readonly normalScratch = new THREE.Vector3();
  private readonly positionScratch = new THREE.Vector3();
  private readonly scaleScratch = new THREE.Vector3();
  private readonly growthScratch: StoneGrowthWeights = { moss: 0, lichen: 0 };

  constructor(
    private readonly stoneField: StoneField,
    private readonly config: WorldConfig,
    private readonly mossExposureDirection: THREE.Vector3,
  ) {}

  build(
    sources: readonly StoneRenderBatchSource[],
  ): StoneRenderBatchGeometry | undefined {
    this.collectInstances(sources);
    if (this.instances.length === 0) return undefined;

    let vertexCount = 0;
    let indexCount = 0;
    let triangles = 0;
    this.variants.length = this.instances.length;
    for (let index = 0; index < this.instances.length; index += 1) {
      const instance = this.instances[index];
      const variant = this.stoneField.getVariant(
        instance.archetype,
        instance.variantIndex,
        this.detailed[index],
      );
      this.variants[index] = variant;
      vertexCount += variant.metrics.vertexCount;
      indexCount += variant.indices.length;
      triangles += variant.metrics.triangleCount;
    }

    // Static render attributes are aggressively packed. Positions remain
    // Float32 because they are world-space, while normals/local coordinates use
    // normalized Int16 and colors/coverage use normalized bytes.
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Int16Array(vertexCount * 3);
    const colors = new Uint8Array(vertexCount * 3);
    const mosses = new Uint8Array(vertexCount);
    const lichens = new Uint8Array(vertexCount);
    const growthSeeds = new Uint16Array(vertexCount);
    const growthPositions = new Int16Array(vertexCount * 3);
    const mossColors = new Uint8Array(vertexCount * 3);
    const lichenColors = new Uint8Array(vertexCount * 3);
    const indices =
      vertexCount <= 65535
        ? new Uint16Array(indexCount)
        : new Uint32Array(indexCount);

    let vertexCursor = 0;
    let indexCursor = 0;
    let minimumX = Number.POSITIVE_INFINITY;
    let minimumY = Number.POSITIVE_INFINITY;
    let minimumZ = Number.POSITIVE_INFINITY;
    let maximumX = Number.NEGATIVE_INFINITY;
    let maximumY = Number.NEGATIVE_INFINITY;
    let maximumZ = Number.NEGATIVE_INFINITY;

    for (
      let instanceIndex = 0;
      instanceIndex < this.instances.length;
      instanceIndex += 1
    ) {
      const instance = this.instances[instanceIndex];
      const variant = this.variants[instanceIndex];
      const palette = STONE_PALETTES[instance.paletteKey];
      const tint = {
        valueScale: instance.valueScale,
        secondary:
          instance.graniteBlend > 0.01 && palette !== STONE_PALETTES.graniteGrey
            ? STONE_PALETTES.graniteGrey
            : undefined,
        secondaryBlend: instance.graniteBlend,
      };
      const growthColors = resolveStoneGrowthColors(palette, tint);
      const growthSeed =
        hashStoneCell(
          Math.round(instance.x * 8),
          Math.round(instance.z * 8),
          instance.variantIndex ^ GROWTH_SEED_SALT,
        ) * HASH_UNIT;
      const packedGrowthSeed = Math.round(growthSeed * UINT16_MAX);
      const packedMossR = packUnitByte(growthColors.moss.r);
      const packedMossG = packUnitByte(growthColors.moss.g);
      const packedMossB = packUnitByte(growthColors.moss.b);
      const packedLichenR = packUnitByte(growthColors.lichen.r);
      const packedLichenG = packUnitByte(growthColors.lichen.g);
      const packedLichenB = packUnitByte(growthColors.lichen.b);
      const inverseGrowthRadius =
        0.5 / Math.max(variant.metrics.footprintRadius, GROWTH_EPSILON);
      const inverseGrowthHeight =
        1 / Math.max(variant.metrics.height, GROWTH_EPSILON);

      this.normalScratch
        .set(instance.normalX, instance.normalY, instance.normalZ)
        .multiplyScalar(instance.tiltStrength)
        .addScaledVector(UP, 1 - instance.tiltStrength)
        .normalize();
      this.quaternionScratch.setFromUnitVectors(UP, this.normalScratch);
      this.yawScratch.setFromAxisAngle(UP, instance.rotationY);
      this.quaternionScratch.multiply(this.yawScratch);
      this.matrixScratch.compose(
        this.positionScratch.set(
          instance.x,
          instance.height - instance.sink,
          instance.z,
        ),
        this.quaternionScratch,
        this.scaleScratch.setScalar(instance.scale),
      );

      const elements = this.matrixScratch.elements;
      const inverseScale = 1 / instance.scale;
      const sourcePositions = variant.positions;
      const sourceNormals = variant.normals;
      const count = variant.metrics.vertexCount;
      for (let index = 0; index < count; index += 1) {
        const source = index * 3;
        const vertex = vertexCursor + index;
        const target = vertex * 3;
        const px = sourcePositions[source];
        const py = sourcePositions[source + 1];
        const pz = sourcePositions[source + 2];
        const worldX =
          elements[0] * px + elements[4] * py + elements[8] * pz + elements[12];
        const worldY =
          elements[1] * px + elements[5] * py + elements[9] * pz + elements[13];
        const worldZ =
          elements[2] * px + elements[6] * py + elements[10] * pz + elements[14];
        positions[target] = worldX;
        positions[target + 1] = worldY;
        positions[target + 2] = worldZ;
        minimumX = Math.min(minimumX, worldX);
        minimumY = Math.min(minimumY, worldY);
        minimumZ = Math.min(minimumZ, worldZ);
        maximumX = Math.max(maximumX, worldX);
        maximumY = Math.max(maximumY, worldY);
        maximumZ = Math.max(maximumZ, worldZ);

        const nx = sourceNormals[source];
        const ny = sourceNormals[source + 1];
        const nz = sourceNormals[source + 2];
        const normalX =
          (elements[0] * nx + elements[4] * ny + elements[8] * nz) * inverseScale;
        const normalY =
          (elements[1] * nx + elements[5] * ny + elements[9] * nz) * inverseScale;
        const normalZ =
          (elements[2] * nx + elements[6] * ny + elements[10] * nz) * inverseScale;
        normals[target] = packSignedInt16(normalX);
        normals[target + 1] = packSignedInt16(normalY);
        normals[target + 2] = packSignedInt16(normalZ);

        const heightFraction = py * inverseGrowthHeight;
        const exposure = Math.max(
          0,
          normalX * this.mossExposureDirection.x +
            normalY * this.mossExposureDirection.y +
            normalZ * this.mossExposureDirection.z,
        );
        resolveStoneGrowthWeightsInto(
          variant.mosses[index],
          normalY,
          heightFraction,
          exposure,
          this.config.stoneMossExposureStrength,
          instance.moss,
          instance.paletteKey,
          instance.graniteBlend,
          this.growthScratch,
        );
        mosses[vertex] = packUnitByte(this.growthScratch.moss);
        lichens[vertex] = packUnitByte(this.growthScratch.lichen);
        growthSeeds[vertex] = packedGrowthSeed;
        growthPositions[target] = packSignedInt16(px * inverseGrowthRadius);
        growthPositions[target + 1] = packSignedInt16(heightFraction);
        growthPositions[target + 2] = packSignedInt16(pz * inverseGrowthRadius);
        mossColors[target] = packedMossR;
        mossColors[target + 1] = packedMossG;
        mossColors[target + 2] = packedMossB;
        lichenColors[target] = packedLichenR;
        lichenColors[target + 1] = packedLichenG;
        lichenColors[target + 2] = packedLichenB;
      }

      colorizeStoneVertices(
        variant.tones,
        variant.wears,
        palette,
        tint,
        colors,
        vertexCursor * 3,
        BYTE_MAX,
      );

      const sourceIndices = variant.indices;
      for (let index = 0; index < sourceIndices.length; index += 1) {
        indices[indexCursor + index] = sourceIndices[index] + vertexCursor;
      }
      indexCursor += sourceIndices.length;
      vertexCursor += count;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3, true));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3, true));
    geometry.setAttribute("stoneMoss", new THREE.BufferAttribute(mosses, 1, true));
    geometry.setAttribute(
      "stoneLichen",
      new THREE.BufferAttribute(lichens, 1, true),
    );
    geometry.setAttribute(
      "stoneGrowthSeed",
      new THREE.BufferAttribute(growthSeeds, 1, true),
    );
    geometry.setAttribute(
      "stoneGrowthPosition",
      new THREE.BufferAttribute(growthPositions, 3, true),
    );
    geometry.setAttribute(
      "stoneMossColor",
      new THREE.BufferAttribute(mossColors, 3, true),
    );
    geometry.setAttribute(
      "stoneLichenColor",
      new THREE.BufferAttribute(lichenColors, 3, true),
    );
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    const centerX = (minimumX + maximumX) * 0.5;
    const centerY = (minimumY + maximumY) * 0.5;
    const centerZ = (minimumZ + maximumZ) * 0.5;
    geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3(minimumX, minimumY, minimumZ),
      new THREE.Vector3(maximumX, maximumY, maximumZ),
    );
    geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(centerX, centerY, centerZ),
      Math.hypot(
        maximumX - minimumX,
        maximumY - minimumY,
        maximumZ - minimumZ,
      ) * 0.5,
    );

    return {
      geometry,
      triangles,
      stones: this.instances.length,
      hasDetailedGeometry: this.detailed.some(Boolean),
    };
  }

  private collectInstances(sources: readonly StoneRenderBatchSource[]): void {
    this.instances.length = 0;
    this.detailed.length = 0;
    for (const source of sources) {
      const chunkInstances = this.stoneField.collectChunkInstances(
        source.chunkX,
        source.chunkZ,
        source.detailed,
        this.chunkScratch,
      );
      for (const instance of chunkInstances) {
        this.instances.push(instance);
        this.detailed.push(source.detailed);
      }
    }
  }
}
