import * as THREE from "three";
import { TerrainField } from "../TerrainField";
import { WorldConfigLoader } from "../WorldConfigLoader";
import { StoneClearanceCache } from "./StoneClearanceCache";
import { StoneField, type StoneInstance } from "./StoneField";
import {
  StoneRenderBatchBuilder,
  type StoneRenderBatchSource,
} from "./StoneRenderBatchBuilder";

function fail(message: string): never {
  throw new Error(`[stones-performance] ${message}`);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) fail(message);
}

function maximumBatchCount(radius: number, batchAxis: number): number {
  let maximum = 0;
  for (let phaseX = 0; phaseX < batchAxis; phaseX += 1) {
    for (let phaseZ = 0; phaseZ < batchAxis; phaseZ += 1) {
      const batches = new Set<string>();
      for (let dz = -radius; dz <= radius; dz += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          batches.add(
            `${Math.floor((phaseX + dx) / batchAxis)}:${Math.floor(
              (phaseZ + dz) / batchAxis,
            )}`,
          );
        }
      }
      maximum = Math.max(maximum, batches.size);
    }
  }
  return maximum;
}

function buildRepresentativeBatch(
  stones: StoneField,
  builder: StoneRenderBatchBuilder,
  batchAxis: number,
): ReturnType<StoneRenderBatchBuilder["build"]> {
  const scratch: StoneInstance[] = [];
  for (let chunkZ = -6; chunkZ <= 6; chunkZ += 1) {
    for (let chunkX = -6; chunkX <= 6; chunkX += 1) {
      if (stones.collectChunkInstances(chunkX, chunkZ, true, scratch).length === 0) {
        continue;
      }
      const batchX = Math.floor(chunkX / batchAxis) * batchAxis;
      const batchZ = Math.floor(chunkZ / batchAxis) * batchAxis;
      const sources: StoneRenderBatchSource[] = [];
      for (let dz = 0; dz < batchAxis; dz += 1) {
        for (let dx = 0; dx < batchAxis; dx += 1) {
          sources.push({
            chunkX: batchX + dx,
            chunkZ: batchZ + dz,
            detailed: true,
          });
        }
      }
      return builder.build(sources);
    }
  }
  return undefined;
}

function attribute(
  geometry: THREE.BufferGeometry,
  name: string,
): THREE.BufferAttribute {
  return geometry.getAttribute(name) as THREE.BufferAttribute;
}

function verifyClearanceAmortization(
  config: ReturnType<WorldConfigLoader["parse"]>,
): void {
  let chunkCollections = 0;
  const fakeField = {
    collectChunkInstances(
      _chunkX: number,
      _chunkZ: number,
      _includeSmall: boolean,
      out: StoneInstance[],
    ): StoneInstance[] {
      chunkCollections += 1;
      out.length = 0;
      return out;
    },
  } as unknown as StoneField;
  const cache = new StoneClearanceCache(fakeField, config);
  const origin = config.stoneCellSize * 2.25;
  for (let index = 0; index < 4096; index += 1) {
    const offset = (index % 32) * (config.stoneCellSize / 128);
    cache.sample(origin + offset, origin + offset * 0.5);
  }
  assert(
    chunkCollections <= 4,
    `Clearance cache repeated ${chunkCollections} chunk collections inside one stone cell.`,
  );
}

/** Production contracts for draw-call count and resident vertex bandwidth. */
export function verifyStoneRenderPerformance(configSource: string): string {
  const config = new WorldConfigLoader().parse(configSource);
  assert(
    config.stoneRenderBatchChunksPerAxis >= 2,
    "Production stones must batch at least 2x2 terrain chunks per draw.",
  );
  verifyClearanceAmortization(config);

  const desktopUnbatched = (config.stoneRadiusDesktop * 2 + 1) ** 2;
  const compactUnbatched = (config.stoneRadiusCompact * 2 + 1) ** 2;
  const desktopBatches = maximumBatchCount(
    config.stoneRadiusDesktop,
    config.stoneRenderBatchChunksPerAxis,
  );
  const compactBatches = maximumBatchCount(
    config.stoneRadiusCompact,
    config.stoneRenderBatchChunksPerAxis,
  );
  assert(
    desktopBatches <= desktopUnbatched * 0.4,
    `Desktop stone batching regressed: ${desktopBatches}/${desktopUnbatched} draws.`,
  );
  assert(
    compactBatches <= compactUnbatched * 0.4,
    `Compact stone batching regressed: ${compactBatches}/${compactUnbatched} draws.`,
  );

  const terrain = new TerrainField(config);
  const stones = new StoneField(terrain, config);
  const azimuth = THREE.MathUtils.degToRad(
    config.stoneMossExposureAzimuthDegrees,
  );
  const elevation = THREE.MathUtils.degToRad(
    config.stoneMossExposureElevationDegrees,
  );
  const horizontal = Math.cos(elevation);
  const exposure = new THREE.Vector3(
    Math.cos(azimuth) * horizontal,
    Math.sin(elevation),
    Math.sin(azimuth) * horizontal,
  ).normalize();
  const builder = new StoneRenderBatchBuilder(stones, config, exposure);
  const result = buildRepresentativeBatch(
    stones,
    builder,
    config.stoneRenderBatchChunksPerAxis,
  );
  assert(result !== undefined, "Unable to find a representative stone render batch.");

  const geometry = result.geometry;
  const position = attribute(geometry, "position");
  const normal = attribute(geometry, "normal");
  const color = attribute(geometry, "color");
  const moss = attribute(geometry, "stoneMoss");
  const lichen = attribute(geometry, "stoneLichen");
  const seed = attribute(geometry, "stoneGrowthSeed");
  const growthPosition = attribute(geometry, "stoneGrowthPosition");
  const mossColor = attribute(geometry, "stoneMossColor");
  const lichenColor = attribute(geometry, "stoneLichenColor");

  assert(
    normal.array instanceof Int16Array && normal.normalized,
    "Stone normals must stay normalized Int16 attributes.",
  );
  assert(
    color.array instanceof Uint8Array && color.normalized,
    "Stone base colors must stay normalized byte attributes.",
  );
  assert(
    moss.array instanceof Uint8Array &&
      lichen.array instanceof Uint8Array &&
      moss.normalized &&
      lichen.normalized,
    "Stone biological coverage must stay normalized byte attributes.",
  );
  assert(
    seed.array instanceof Uint16Array && seed.normalized,
    "Stone growth seeds must stay normalized Uint16 attributes.",
  );
  assert(
    growthPosition.array instanceof Int16Array && growthPosition.normalized,
    "Stone local growth coordinates must stay normalized Int16 attributes.",
  );
  assert(
    mossColor.array instanceof Uint8Array &&
      lichenColor.array instanceof Uint8Array &&
      mossColor.normalized &&
      lichenColor.normalized,
    "Stone growth colors must stay normalized byte attributes.",
  );
  assert(
    geometry.boundingBox !== null && geometry.boundingSphere !== null,
    "Stone batches must provide precomputed culling bounds.",
  );

  const attributes = [
    position,
    normal,
    color,
    moss,
    lichen,
    seed,
    growthPosition,
    mossColor,
    lichenColor,
  ];
  const bytesPerVertex = attributes.reduce(
    (sum, current) =>
      sum + current.itemSize * current.array.BYTES_PER_ELEMENT,
    0,
  );
  assert(
    bytesPerVertex <= 40,
    `Stone vertex payload regressed to ${bytesPerVertex} bytes.`,
  );
  geometry.dispose();

  return `${desktopBatches}/${desktopUnbatched} desktop draws · ${compactBatches}/${compactUnbatched} compact draws · ${bytesPerVertex} B/vertex`;
}
