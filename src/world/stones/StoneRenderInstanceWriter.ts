import * as THREE from "three";
import type { WorldConfig } from "../WorldConfig";
import {
  resolveStoneGrowthWeightsInto,
  type StoneGrowthWeights,
} from "./StoneGrowthField";
import type { StoneMeshData } from "./StoneGeometry";
import type { StoneInstance } from "./StoneField";
import {
  STONE_PALETTES,
  colorizeStoneVertices,
  resolveStoneGrowthColors,
} from "./StonePalette";
import {
  STONE_BYTE_MAX,
  STONE_BYTE_STRIDE,
  STONE_COLOR_OFFSET,
  STONE_GROWTH_POSITION_OFFSET,
  STONE_GROWTH_SEED_OFFSET,
  STONE_LICHEN_COLOR_OFFSET,
  STONE_LICHEN_OFFSET,
  STONE_MOSS_COLOR_OFFSET,
  STONE_MOSS_OFFSET,
  STONE_NORMAL_OFFSET,
  STONE_SHORT_STRIDE,
  STONE_WEATHERING_OFFSET,
  STONE_WET_OFFSET,
  packStoneSignedInt16,
  packStoneUnitByte,
  type StoneRenderBuffers,
  type StoneRenderBounds,
} from "./StoneRenderPacking";
import { hashStoneCell } from "./StoneRandom";
import {
  collectStoneOccluders,
  resolveStoneContactOcclusion,
  type StoneOccluder,
} from "./StoneContactOcclusion";
import { resolveStoneVertexWetness } from "./StoneWetness";

/** The batch a stone is being written into, for neighbour contact shade. */
export interface StoneRenderBatchNeighbours {
  readonly instances: readonly StoneInstance[];
  readonly variants: readonly StoneMeshData[];
  readonly index: number;
}

export interface StoneRenderWriteState extends StoneRenderBounds {
  vertexCursor: number;
  indexCursor: number;
  readonly originX: number;
  readonly originY: number;
  readonly originZ: number;
}

const UP = new THREE.Vector3(0, 1, 0);
const HASH_UNIT = 1 / 4294967296;
const GROWTH_SEED_SALT = 0x43b0d7;
const GROWTH_EPSILON = 1e-4;

/** Packs one placed stone into a static render batch without per-vertex objects. */
export class StoneRenderInstanceWriter {
  private readonly matrixScratch = new THREE.Matrix4();
  private readonly quaternionScratch = new THREE.Quaternion();
  private readonly yawScratch = new THREE.Quaternion();
  private readonly normalScratch = new THREE.Vector3();
  private readonly positionScratch = new THREE.Vector3();
  private readonly scaleScratch = new THREE.Vector3();
  private readonly growthScratch: StoneGrowthWeights = { moss: 0, lichen: 0 };
  private readonly occluderScratch: StoneOccluder[] = [];
  private contactScratch = new Float32Array(0);

  /** One buffer reused across every stone in a batch; never shrinks. */
  private contactScratchFor(vertexCount: number): Float32Array {
    if (this.contactScratch.length < vertexCount) {
      this.contactScratch = new Float32Array(vertexCount);
    }
    return this.contactScratch;
  }

  constructor(
    private readonly config: WorldConfig,
    private readonly mossExposureDirection: THREE.Vector3,
  ) {}

  write(
    instance: StoneInstance,
    variant: StoneMeshData,
    buffers: StoneRenderBuffers,
    state: StoneRenderWriteState,
    batch?: StoneRenderBatchNeighbours,
  ): void {
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
    const packedGrowthSeed = packStoneUnitByte(growthSeed);
    const packedMossR = packStoneUnitByte(growthColors.moss.r);
    const packedMossG = packStoneUnitByte(growthColors.moss.g);
    const packedMossB = packStoneUnitByte(growthColors.moss.b);
    const packedLichenR = packStoneUnitByte(growthColors.lichen.r);
    const packedLichenG = packStoneUnitByte(growthColors.lichen.g);
    const packedLichenB = packStoneUnitByte(growthColors.lichen.b);
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

    const occluderCount = batch
      ? collectStoneOccluders(
          batch.instances,
          batch.variants,
          batch.index,
          this.occluderScratch,
        )
      : 0;
    const contacts = this.contactScratchFor(variant.metrics.vertexCount);

    const elements = this.matrixScratch.elements;
    const inverseScale = 1 / instance.scale;
    const sourcePositions = variant.positions;
    const sourceNormals = variant.normals;
    const count = variant.metrics.vertexCount;
    for (let index = 0; index < count; index += 1) {
      const source = index * 3;
      const vertex = state.vertexCursor + index;
      const positionTarget = vertex * 3;
      const shortTarget = vertex * STONE_SHORT_STRIDE;
      const byteTarget = vertex * STONE_BYTE_STRIDE;
      const px = sourcePositions[source];
      const py = sourcePositions[source + 1];
      const pz = sourcePositions[source + 2];
      const worldX =
        elements[0] * px + elements[4] * py + elements[8] * pz + elements[12];
      const worldY =
        elements[1] * px + elements[5] * py + elements[9] * pz + elements[13];
      const worldZ =
        elements[2] * px + elements[6] * py + elements[10] * pz + elements[14];
      const localX = worldX - state.originX;
      const localY = worldY - state.originY;
      const localZ = worldZ - state.originZ;
      buffers.positions[positionTarget] = localX;
      buffers.positions[positionTarget + 1] = localY;
      buffers.positions[positionTarget + 2] = localZ;
      state.minimumX = Math.min(state.minimumX, localX);
      state.minimumY = Math.min(state.minimumY, localY);
      state.minimumZ = Math.min(state.minimumZ, localZ);
      state.maximumX = Math.max(state.maximumX, localX);
      state.maximumY = Math.max(state.maximumY, localY);
      state.maximumZ = Math.max(state.maximumZ, localZ);

      const nx = sourceNormals[source];
      const ny = sourceNormals[source + 1];
      const nz = sourceNormals[source + 2];
      // Placement is rotation plus positive uniform scale; dividing the scale
      // back out avoids a square root for every transformed vertex normal.
      const normalX =
        (elements[0] * nx + elements[4] * ny + elements[8] * nz) * inverseScale;
      const normalY =
        (elements[1] * nx + elements[5] * ny + elements[9] * nz) * inverseScale;
      const normalZ =
        (elements[2] * nx + elements[6] * ny + elements[10] * nz) * inverseScale;
      buffers.packedShorts[shortTarget + STONE_NORMAL_OFFSET] =
        packStoneSignedInt16(normalX);
      buffers.packedShorts[shortTarget + STONE_NORMAL_OFFSET + 1] =
        packStoneSignedInt16(normalY);
      buffers.packedShorts[shortTarget + STONE_NORMAL_OFFSET + 2] =
        packStoneSignedInt16(normalZ);

      const heightFraction = py * inverseGrowthHeight;
      buffers.packedShorts[shortTarget + STONE_GROWTH_POSITION_OFFSET] =
        packStoneSignedInt16(px * inverseGrowthRadius);
      buffers.packedShorts[shortTarget + STONE_GROWTH_POSITION_OFFSET + 1] =
        packStoneSignedInt16(heightFraction);
      buffers.packedShorts[shortTarget + STONE_GROWTH_POSITION_OFFSET + 2] =
        packStoneSignedInt16(pz * inverseGrowthRadius);

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
      buffers.packedBytes[byteTarget + STONE_MOSS_OFFSET] =
        packStoneUnitByte(this.growthScratch.moss);
      buffers.packedBytes[byteTarget + STONE_LICHEN_OFFSET] =
        packStoneUnitByte(this.growthScratch.lichen);
      buffers.packedBytes[byteTarget + STONE_GROWTH_SEED_OFFSET] =
        packedGrowthSeed;
      buffers.packedBytes[byteTarget + STONE_MOSS_COLOR_OFFSET] = packedMossR;
      buffers.packedBytes[byteTarget + STONE_MOSS_COLOR_OFFSET + 1] = packedMossG;
      buffers.packedBytes[byteTarget + STONE_MOSS_COLOR_OFFSET + 2] = packedMossB;
      buffers.packedBytes[byteTarget + STONE_LICHEN_COLOR_OFFSET] = packedLichenR;
      buffers.packedBytes[byteTarget + STONE_LICHEN_COLOR_OFFSET + 1] =
        packedLichenG;
      buffers.packedBytes[byteTarget + STONE_LICHEN_COLOR_OFFSET + 2] =
        packedLichenB;
      // Baked against world height rather than the body's own fraction: the
      // waterline is a property of the river, so two stones of different sizes
      // sitting side by side in it are wet to the same height, not to the same
      // share of themselves.
      // The palette mix for this value is already baked into the vertex colour
      // above; the shader gets the raw channel so close range can put a broken
      // edge on a boundary that vertex interpolation can only ramp across a
      // facet.
      buffers.packedBytes[byteTarget + STONE_WEATHERING_OFFSET] =
        packStoneUnitByte(variant.weatherings[index]);
      buffers.packedBytes[byteTarget + STONE_WET_OFFSET] = packStoneUnitByte(
        resolveStoneVertexWetness(instance.wetness, worldY),
      );
      contacts[index] =
        occluderCount > 0
          ? resolveStoneContactOcclusion(
              this.occluderScratch,
              occluderCount,
              worldX,
              worldY,
              worldZ,
              normalX,
              normalY,
              normalZ,
            )
          : 0;
    }

    colorizeStoneVertices(
      variant.tones,
      variant.wears,
      variant.bounces,
      variant.weatherings,
      variant.cavities,
      contacts,
      palette,
      tint,
      buffers.packedBytes,
      state.vertexCursor * STONE_BYTE_STRIDE + STONE_COLOR_OFFSET,
      STONE_BYTE_MAX,
      STONE_BYTE_STRIDE,
    );

    const sourceIndices = variant.indices;
    for (let index = 0; index < sourceIndices.length; index += 1) {
      buffers.indices[state.indexCursor + index] =
        sourceIndices[index] + state.vertexCursor;
    }
    state.indexCursor += sourceIndices.length;
    state.vertexCursor += count;
  }
}
