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

type BuildStage = "collect" | "resolve" | "allocate" | "fill" | "finalize";

interface StoneRenderBuffers {
  readonly positions: Float32Array;
  readonly packedShorts: Int16Array;
  readonly packedBytes: Uint8Array;
  readonly indices: Uint16Array | Uint32Array;
}

export interface StoneRenderBatchBuildJob {
  readonly sources: readonly StoneRenderBatchSource[];
  readonly instances: StoneInstance[];
  readonly detailed: boolean[];
  readonly variants: StoneMeshData[];
  stage: BuildStage;
  sourceIndex: number;
  resolveIndex: number;
  fillIndex: number;
  vertexCount: number;
  indexCount: number;
  triangles: number;
  vertexCursor: number;
  indexCursor: number;
  hasDetailedGeometry: boolean;
  minimumX: number;
  minimumY: number;
  minimumZ: number;
  maximumX: number;
  maximumY: number;
  maximumZ: number;
  buffers?: StoneRenderBuffers;
}

export interface StoneRenderBatchBuildProgress {
  readonly complete: boolean;
  readonly result?: StoneRenderBatchGeometry;
  readonly empty?: boolean;
}

const UP = new THREE.Vector3(0, 1, 0);
const HASH_UNIT = 1 / 4294967296;
const GROWTH_SEED_SALT = 0x43b0d7;
const GROWTH_EPSILON = 1e-4;
const BYTE_MAX = 255;
const UINT16_MAX = 65535;
const INT16_NORMAL_MAX = 32767;

const SHORT_STRIDE = 6;
const NORMAL_OFFSET = 0;
const GROWTH_POSITION_OFFSET = 3;
const BYTE_STRIDE = 12;
const COLOR_OFFSET = 0;
const MOSS_OFFSET = 3;
const LICHEN_OFFSET = 4;
const GROWTH_SEED_OFFSET = 5;
const MOSS_COLOR_OFFSET = 6;
const LICHEN_COLOR_OFFSET = 9;

function packUnitByte(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * BYTE_MAX);
}

function packSignedInt16(value: number): number {
  return Math.round(
    Math.max(-1, Math.min(1, value)) * INT16_NORMAL_MAX,
  );
}

/** Deadline-sliced CPU merger for one static stone render batch. */
export class StoneRenderBatchBuilder {
  private readonly chunkScratch: StoneInstance[] = [];
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

  begin(sources: readonly StoneRenderBatchSource[]): StoneRenderBatchBuildJob {
    return {
      sources,
      instances: [],
      detailed: [],
      variants: [],
      stage: "collect",
      sourceIndex: 0,
      resolveIndex: 0,
      fillIndex: 0,
      vertexCount: 0,
      indexCount: 0,
      triangles: 0,
      vertexCursor: 0,
      indexCursor: 0,
      hasDetailedGeometry: false,
      minimumX: Number.POSITIVE_INFINITY,
      minimumY: Number.POSITIVE_INFINITY,
      minimumZ: Number.POSITIVE_INFINITY,
      maximumX: Number.NEGATIVE_INFINITY,
      maximumY: Number.NEGATIVE_INFINITY,
      maximumZ: Number.NEGATIVE_INFINITY,
    };
  }

  /** Convenience path for offline verification and probes. */
  build(
    sources: readonly StoneRenderBatchSource[],
  ): StoneRenderBatchGeometry | undefined {
    const job = this.begin(sources);
    const progress = this.advance(job, Number.POSITIVE_INFINITY);
    if (!progress.complete) {
      throw new Error("Infinite-deadline stone build did not complete.");
    }
    return progress.result;
  }

  advance(
    job: StoneRenderBatchBuildJob,
    deadline: number,
  ): StoneRenderBatchBuildProgress {
    while (performance.now() < deadline || deadline === Number.POSITIVE_INFINITY) {
      switch (job.stage) {
        case "collect":
          if (job.sourceIndex < job.sources.length) {
            this.collectSource(job, job.sources[job.sourceIndex]);
            job.sourceIndex += 1;
            continue;
          }
          if (job.instances.length === 0) {
            return { complete: true, empty: true };
          }
          job.stage = "resolve";
          continue;

        case "resolve":
          if (job.resolveIndex < job.instances.length) {
            this.resolveVariant(job, job.resolveIndex);
            job.resolveIndex += 1;
            continue;
          }
          job.stage = "allocate";
          continue;

        case "allocate":
          job.buffers = this.allocateBuffers(job.vertexCount, job.indexCount);
          job.stage = "fill";
          continue;

        case "fill":
          if (job.fillIndex < job.instances.length) {
            this.fillInstance(job, job.fillIndex);
            job.fillIndex += 1;
            continue;
          }
          job.stage = "finalize";
          continue;

        case "finalize":
          return { complete: true, result: this.finalize(job) };
      }
    }
    return { complete: false };
  }

  private collectSource(
    job: StoneRenderBatchBuildJob,
    source: StoneRenderBatchSource,
  ): void {
    const instances = this.stoneField.collectChunkInstances(
      source.chunkX,
      source.chunkZ,
      source.detailed,
      this.chunkScratch,
    );
    for (const instance of instances) {
      job.instances.push(instance);
      job.detailed.push(source.detailed);
      job.hasDetailedGeometry ||= source.detailed;
    }
  }

  private resolveVariant(job: StoneRenderBatchBuildJob, index: number): void {
    const instance = job.instances[index];
    const variant = this.stoneField.getVariant(
      instance.archetype,
      instance.variantIndex,
      job.detailed[index],
    );
    job.variants[index] = variant;
    job.vertexCount += variant.metrics.vertexCount;
    job.indexCount += variant.indices.length;
    job.triangles += variant.metrics.triangleCount;
  }

  private allocateBuffers(
    vertexCount: number,
    indexCount: number,
  ): StoneRenderBuffers {
    return {
      positions: new Float32Array(vertexCount * 3),
      packedShorts: new Int16Array(vertexCount * SHORT_STRIDE),
      packedBytes: new Uint8Array(vertexCount * BYTE_STRIDE),
      indices:
        vertexCount <= UINT16_MAX
          ? new Uint16Array(indexCount)
          : new Uint32Array(indexCount),
    };
  }

  private fillInstance(job: StoneRenderBatchBuildJob, instanceIndex: number): void {
    const buffers = job.buffers;
    if (!buffers) {
      throw new Error("Stone batch fill started before buffer allocation.");
    }

    const instance = job.instances[instanceIndex];
    const variant = job.variants[instanceIndex];
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
    const packedGrowthSeed = packUnitByte(growthSeed);
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
      const vertex = job.vertexCursor + index;
      const positionTarget = vertex * 3;
      const shortTarget = vertex * SHORT_STRIDE;
      const byteTarget = vertex * BYTE_STRIDE;
      const px = sourcePositions[source];
      const py = sourcePositions[source + 1];
      const pz = sourcePositions[source + 2];
      const worldX =
        elements[0] * px + elements[4] * py + elements[8] * pz + elements[12];
      const worldY =
        elements[1] * px + elements[5] * py + elements[9] * pz + elements[13];
      const worldZ =
        elements[2] * px + elements[6] * py + elements[10] * pz + elements[14];
      buffers.positions[positionTarget] = worldX;
      buffers.positions[positionTarget + 1] = worldY;
      buffers.positions[positionTarget + 2] = worldZ;
      job.minimumX = Math.min(job.minimumX, worldX);
      job.minimumY = Math.min(job.minimumY, worldY);
      job.minimumZ = Math.min(job.minimumZ, worldZ);
      job.maximumX = Math.max(job.maximumX, worldX);
      job.maximumY = Math.max(job.maximumY, worldY);
      job.maximumZ = Math.max(job.maximumZ, worldZ);

      const nx = sourceNormals[source];
      const ny = sourceNormals[source + 1];
      const nz = sourceNormals[source + 2];
      // Rotation + uniform positive scale: divide the scale back out instead
      // of normalizing every transformed vertex normal with a square root.
      const normalX =
        (elements[0] * nx + elements[4] * ny + elements[8] * nz) * inverseScale;
      const normalY =
        (elements[1] * nx + elements[5] * ny + elements[9] * nz) * inverseScale;
      const normalZ =
        (elements[2] * nx + elements[6] * ny + elements[10] * nz) * inverseScale;
      buffers.packedShorts[shortTarget + NORMAL_OFFSET] = packSignedInt16(normalX);
      buffers.packedShorts[shortTarget + NORMAL_OFFSET + 1] = packSignedInt16(normalY);
      buffers.packedShorts[shortTarget + NORMAL_OFFSET + 2] = packSignedInt16(normalZ);

      const heightFraction = py * inverseGrowthHeight;
      buffers.packedShorts[shortTarget + GROWTH_POSITION_OFFSET] =
        packSignedInt16(px * inverseGrowthRadius);
      buffers.packedShorts[shortTarget + GROWTH_POSITION_OFFSET + 1] =
        packSignedInt16(heightFraction);
      buffers.packedShorts[shortTarget + GROWTH_POSITION_OFFSET + 2] =
        packSignedInt16(pz * inverseGrowthRadius);

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
      buffers.packedBytes[byteTarget + MOSS_OFFSET] =
        packUnitByte(this.growthScratch.moss);
      buffers.packedBytes[byteTarget + LICHEN_OFFSET] =
        packUnitByte(this.growthScratch.lichen);
      buffers.packedBytes[byteTarget + GROWTH_SEED_OFFSET] = packedGrowthSeed;
      buffers.packedBytes[byteTarget + MOSS_COLOR_OFFSET] = packedMossR;
      buffers.packedBytes[byteTarget + MOSS_COLOR_OFFSET + 1] = packedMossG;
      buffers.packedBytes[byteTarget + MOSS_COLOR_OFFSET + 2] = packedMossB;
      buffers.packedBytes[byteTarget + LICHEN_COLOR_OFFSET] = packedLichenR;
      buffers.packedBytes[byteTarget + LICHEN_COLOR_OFFSET + 1] = packedLichenG;
      buffers.packedBytes[byteTarget + LICHEN_COLOR_OFFSET + 2] = packedLichenB;
    }

    colorizeStoneVertices(
      variant.tones,
      variant.wears,
      palette,
      tint,
      buffers.packedBytes,
      job.vertexCursor * BYTE_STRIDE + COLOR_OFFSET,
      BYTE_MAX,
      BYTE_STRIDE,
    );

    const sourceIndices = variant.indices;
    for (let index = 0; index < sourceIndices.length; index += 1) {
      buffers.indices[job.indexCursor + index] =
        sourceIndices[index] + job.vertexCursor;
    }
    job.indexCursor += sourceIndices.length;
    job.vertexCursor += count;
  }

  private finalize(job: StoneRenderBatchBuildJob): StoneRenderBatchGeometry {
    const buffers = job.buffers;
    if (!buffers || job.vertexCursor !== job.vertexCount) {
      throw new Error("Stone batch finalized before all vertices were written.");
    }

    const geometry = new THREE.BufferGeometry();
    const shortData = new THREE.InterleavedBuffer(
      buffers.packedShorts,
      SHORT_STRIDE,
    );
    const byteData = new THREE.InterleavedBuffer(
      buffers.packedBytes,
      BYTE_STRIDE,
    );
    geometry.setAttribute("position", new THREE.BufferAttribute(buffers.positions, 3));
    geometry.setAttribute(
      "normal",
      new THREE.InterleavedBufferAttribute(
        shortData,
        3,
        NORMAL_OFFSET,
        true,
      ),
    );
    geometry.setAttribute(
      "stoneGrowthPosition",
      new THREE.InterleavedBufferAttribute(
        shortData,
        3,
        GROWTH_POSITION_OFFSET,
        true,
      ),
    );
    geometry.setAttribute(
      "color",
      new THREE.InterleavedBufferAttribute(byteData, 3, COLOR_OFFSET, true),
    );
    geometry.setAttribute(
      "stoneMoss",
      new THREE.InterleavedBufferAttribute(byteData, 1, MOSS_OFFSET, true),
    );
    geometry.setAttribute(
      "stoneLichen",
      new THREE.InterleavedBufferAttribute(byteData, 1, LICHEN_OFFSET, true),
    );
    geometry.setAttribute(
      "stoneGrowthSeed",
      new THREE.InterleavedBufferAttribute(
        byteData,
        1,
        GROWTH_SEED_OFFSET,
        true,
      ),
    );
    geometry.setAttribute(
      "stoneMossColor",
      new THREE.InterleavedBufferAttribute(
        byteData,
        3,
        MOSS_COLOR_OFFSET,
        true,
      ),
    );
    geometry.setAttribute(
      "stoneLichenColor",
      new THREE.InterleavedBufferAttribute(
        byteData,
        3,
        LICHEN_COLOR_OFFSET,
        true,
      ),
    );
    geometry.setIndex(new THREE.BufferAttribute(buffers.indices, 1));

    const centerX = (job.minimumX + job.maximumX) * 0.5;
    const centerY = (job.minimumY + job.maximumY) * 0.5;
    const centerZ = (job.minimumZ + job.maximumZ) * 0.5;
    geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3(job.minimumX, job.minimumY, job.minimumZ),
      new THREE.Vector3(job.maximumX, job.maximumY, job.maximumZ),
    );
    geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(centerX, centerY, centerZ),
      Math.hypot(
        job.maximumX - job.minimumX,
        job.maximumY - job.minimumY,
        job.maximumZ - job.minimumZ,
      ) * 0.5,
    );

    return {
      geometry,
      triangles: job.triangles,
      stones: job.instances.length,
      hasDetailedGeometry: job.hasDetailedGeometry,
    };
  }
}
