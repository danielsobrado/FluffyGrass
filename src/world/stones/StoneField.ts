import * as THREE from "three";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import { sampleGrassBiome, pickGrassBiomeIndex } from "../grass/WorldBiomeField";
import { hashStoneCell, StoneRandom } from "./StoneRandom";
import {
  STONE_ARCHETYPE_IDS,
  resolveStoneRecipe,
  type StoneArchetypeId,
} from "./StoneRecipe";
import { generateStoneMesh, type StoneMeshData } from "./StoneGeometry";
import { type StonePaletteKey } from "./StonePalette";

/**
 * Deterministic world-space stone placement.
 *
 * Like the walking ways and the biome field, stone placement is a pure
 * function of world position: any system can ask "which stones stand near
 * (x, z)?" and get the same answer the streamer used to build them. That is
 * what lets grass placement clear blades from under stones without the two
 * systems ever talking to each other — they both read the same field.
 *
 * Placement logic, in order:
 * - a low-frequency *rockiness* field gathers stones into rocky hillsides and
 *   leaves clean meadows between them, with a sparse baseline everywhere;
 * - biome weighting (meadow < dry steppe < alpine) and an altitude boost fill
 *   the highlands, echoing the terrain shader's own rock colouring;
 * - slope picks the family: level ground carries pebbles, boulders, and
 *   slabs, slopes turn to embedded outcrops, blocks, and shards;
 * - walking ways reject anything that would block the tread, but small stones
 *   are *encouraged* on the verge just beyond it, so ways read as lined
 *   rather than sterile;
 * - larger stones seed satellite clusters of smaller ones in a shared palette.
 *
 * Cell results are cached; the cache is transparent (pure regeneration).
 */

export interface StoneInstance {
  readonly x: number;
  readonly z: number;
  /** Terrain height at (x, z); the mesh origin sits at height - sink. */
  readonly height: number;
  readonly sink: number;
  readonly rotationY: number;
  readonly scale: number;
  readonly archetype: StoneArchetypeId;
  readonly variantIndex: number;
  readonly paletteKey: StonePaletteKey;
  /** Blend towards granite with altitude, resolved at colorize time. */
  readonly graniteBlend: number;
  readonly valueScale: number;
  /** Terrain normal at the root, and how strongly to align to it. */
  readonly normalX: number;
  readonly normalY: number;
  readonly normalZ: number;
  readonly tiltStrength: number;
  /** Metres of grass cleared around the footprint; 0 for nestling pebbles. */
  readonly clearRadius: number;
}

interface ArchetypeWeights {
  readonly ids: readonly StoneArchetypeId[];
  readonly weights: readonly number[];
}

const LEVEL_WEIGHTS: readonly ArchetypeWeights[] = [
  // meadow
  {
    ids: STONE_ARCHETYPE_IDS,
    weights: [0.26, 0.34, 0.16, 0.12, 0.03, 0.09],
  },
  // dry steppe
  {
    ids: STONE_ARCHETYPE_IDS,
    weights: [0.22, 0.3, 0.18, 0.15, 0.05, 0.1],
  },
  // alpine
  {
    ids: STONE_ARCHETYPE_IDS,
    weights: [0.16, 0.28, 0.13, 0.15, 0.14, 0.14],
  },
];

const SLOPE_WEIGHTS: ArchetypeWeights = {
  ids: STONE_ARCHETYPE_IDS,
  weights: [0.12, 0.2, 0.08, 0.2, 0.14, 0.26],
};

const BIOME_DENSITY = [1, 1.4, 1.7];
const BIOME_PALETTE: readonly StonePaletteKey[] = [
  "meadowSage",
  "steppeTan",
  "graniteGrey",
];

const SCALE_BANDS: Record<StoneArchetypeId, readonly [number, number]> = {
  pebble: [0.22, 0.55],
  boulder: [0.8, 2.2],
  slab: [1.1, 2.6],
  block: [0.85, 2],
  shard: [1.3, 2.8],
  outcrop: [1.5, 3.4],
};

/** Below this scale a stone nestles into grass instead of clearing it. */
const CLEAR_SCALE_CUTOFF = 0.5;
const MAX_STONES_PER_CELL = 3;
const CELL_CACHE_LIMIT = 640;
const CELL_CACHE_TRIM = 384;
/** Slope gates on the terrain normal's Y component. */
const SLOPE_REJECT_NY = 0.62;
const SLOPE_FAMILY_NY = 0.86;

function smoothstep(value: number, minimum: number, maximum: number): number {
  if (value <= minimum) {
    return 0;
  }
  if (value >= maximum) {
    return 1;
  }
  const amount = (value - minimum) / (maximum - minimum);
  return amount * amount * (3 - 2 * amount);
}

export class StoneField {
  private readonly cellSize: number;
  private readonly cells = new Map<string, StoneInstance[]>();
  private readonly variants = new Map<string, StoneMeshData>();
  private readonly normalScratch = new THREE.Vector3();
  private readonly pathScratch = new THREE.Vector2();
  private readonly rockSeed: number;
  private readonly enabled: boolean;

  constructor(
    private readonly field: TerrainField,
    private readonly config: WorldConfig,
  ) {
    this.cellSize = config.stoneCellSize;
    this.rockSeed = (config.seed ^ 0x51f0e5) >>> 0;
    this.enabled = config.stonesEnabled >= 1;
  }

  /** Pre-generated mesh for an instance; built lazily, cached forever. */
  getVariant(archetype: StoneArchetypeId, variantIndex: number): StoneMeshData {
    const key = `${archetype}:${variantIndex}`;
    let mesh = this.variants.get(key);
    if (!mesh) {
      const seed = hashStoneCell(
        variantIndex,
        hashStoneCell(archetype.length, variantIndex, this.config.seed),
        this.config.seed,
      );
      mesh = generateStoneMesh(resolveStoneRecipe(archetype, seed));
      this.variants.set(key, mesh);
    }
    return mesh;
  }

  /**
   * Every stone whose root lies inside the chunk. `includeSmall` false drops
   * the nestling classes for far chunks where they are sub-pixel anyway.
   */
  collectChunkInstances(
    chunkX: number,
    chunkZ: number,
    includeSmall: boolean,
    out: StoneInstance[],
  ): StoneInstance[] {
    out.length = 0;
    if (!this.enabled) {
      return out;
    }
    const chunkSize = this.config.chunkSize;
    const minX = chunkX * chunkSize;
    const minZ = chunkZ * chunkSize;
    const maxX = minX + chunkSize;
    const maxZ = minZ + chunkSize;
    const firstCellX = Math.floor(minX / this.cellSize);
    const firstCellZ = Math.floor(minZ / this.cellSize);
    const lastCellX = Math.floor((maxX - 1e-3) / this.cellSize);
    const lastCellZ = Math.floor((maxZ - 1e-3) / this.cellSize);
    for (let cellZ = firstCellZ; cellZ <= lastCellZ; cellZ += 1) {
      for (let cellX = firstCellX; cellX <= lastCellX; cellX += 1) {
        for (const instance of this.getCellInstances(cellX, cellZ)) {
          if (
            instance.x >= minX &&
            instance.x < maxX &&
            instance.z >= minZ &&
            instance.z < maxZ &&
            (includeSmall || instance.scale >= CLEAR_SCALE_CUTOFF)
          ) {
            out.push(instance);
          }
        }
      }
    }
    return out;
  }

  /**
   * How much grass survives at (x, z): 1 clear of every stone, 0 under one.
   * `extraRadius` widens the cleared band by the footprint of whatever is
   * being placed, mirroring {@link TerrainField.samplePathGrassMask}.
   */
  sampleGrassClearance(x: number, z: number, extraRadius = 0): number {
    if (!this.enabled) {
      return 1;
    }
    const feather = this.config.stoneGrassClearanceFeather;
    const centerCellX = Math.floor(x / this.cellSize);
    const centerCellZ = Math.floor(z / this.cellSize);
    let mask = 1;
    for (let dz = -1; dz <= 1; dz += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const instances = this.getCellInstances(
          centerCellX + dx,
          centerCellZ + dz,
        );
        for (const instance of instances) {
          if (instance.clearRadius <= 0) {
            continue;
          }
          const radius = instance.clearRadius + extraRadius;
          const reach = radius + feather;
          const offsetX = x - instance.x;
          const offsetZ = z - instance.z;
          const distanceSquared = offsetX * offsetX + offsetZ * offsetZ;
          if (distanceSquared >= reach * reach) {
            continue;
          }
          const distance = Math.sqrt(distanceSquared);
          mask *= smoothstep(distance, radius * 0.72, reach);
          if (mask <= 0.02) {
            return 0;
          }
        }
      }
    }
    return mask;
  }

  private getCellInstances(cellX: number, cellZ: number): StoneInstance[] {
    const key = `${cellX}:${cellZ}`;
    const cached = this.cells.get(key);
    if (cached) {
      return cached;
    }
    const instances = this.generateCell(cellX, cellZ);
    if (this.cells.size >= CELL_CACHE_LIMIT) {
      let removed = 0;
      for (const staleKey of this.cells.keys()) {
        this.cells.delete(staleKey);
        removed += 1;
        if (this.cells.size <= CELL_CACHE_TRIM) {
          break;
        }
      }
      void removed;
    }
    this.cells.set(key, instances);
    return instances;
  }

  /** Two-octave value noise gathering stones into coherent rocky regions. */
  private sampleRockiness(x: number, z: number): number {
    const coarse = this.valueNoise(x / 240, z / 240, this.rockSeed);
    const fine = this.valueNoise(
      (x * 2.7) / 240,
      (z * 2.7) / 240,
      this.rockSeed ^ 0x9e3779b9,
    );
    const field = (coarse + fine * 0.4) / 1.4;
    return smoothstep(field, 0.52, 0.78);
  }

  private valueNoise(x: number, z: number, seed: number): number {
    const cellX = Math.floor(x);
    const cellZ = Math.floor(z);
    const fractionX = x - cellX;
    const fractionZ = z - cellZ;
    const weightX = fractionX * fractionX * (3 - 2 * fractionX);
    const weightZ = fractionZ * fractionZ * (3 - 2 * fractionZ);
    const corner00 = hashStoneCell(cellX, cellZ, seed) / 4294967296;
    const corner10 = hashStoneCell(cellX + 1, cellZ, seed) / 4294967296;
    const corner01 = hashStoneCell(cellX, cellZ + 1, seed) / 4294967296;
    const corner11 = hashStoneCell(cellX + 1, cellZ + 1, seed) / 4294967296;
    const lower = corner00 + (corner10 - corner00) * weightX;
    const upper = corner01 + (corner11 - corner01) * weightX;
    return lower + (upper - lower) * weightZ;
  }

  private generateCell(cellX: number, cellZ: number): StoneInstance[] {
    const random = StoneRandom.fromSeed(
      hashStoneCell(cellX, cellZ, this.config.seed ^ 0x570e5),
    );
    const originX = cellX * this.cellSize;
    const originZ = cellZ * this.cellSize;
    const centerX = originX + this.cellSize * 0.5;
    const centerZ = originZ + this.cellSize * 0.5;

    const halfWorld = this.config.worldSize * 0.5;
    if (
      centerX < -halfWorld ||
      centerX > halfWorld ||
      centerZ < -halfWorld ||
      centerZ > halfWorld
    ) {
      return [];
    }

    const rockiness = this.sampleRockiness(centerX, centerZ);
    const centerHeight = this.field.sampleHeight(centerX, centerZ);
    const lowlandFade =
      0.45 +
      0.55 *
        smoothstep(
          centerHeight,
          this.config.grassMinAltitude - 8,
          this.config.grassMinAltitude + 6,
        );
    const highBoost =
      1 +
      1.8 *
        smoothstep(
          centerHeight,
          this.config.grassMaxAltitude - 30,
          this.config.grassMaxAltitude + 40,
        );
    const biomeSample = sampleGrassBiome(centerX, centerZ);
    const biomeIndex = Math.min(
      pickGrassBiomeIndex(centerX, centerZ, biomeSample),
      BIOME_DENSITY.length - 1,
    );

    const areaScale = (this.cellSize * this.cellSize) / 256;
    const expected =
      this.config.stoneDensity *
      areaScale *
      (0.22 + 2.5 * rockiness) *
      lowlandFade *
      highBoost *
      BIOME_DENSITY[biomeIndex];

    let count = Math.floor(expected);
    if (random.chance(expected - count)) {
      count += 1;
    }
    count = Math.min(count, MAX_STONES_PER_CELL);
    if (count === 0) {
      return [];
    }

    const instances: StoneInstance[] = [];
    for (let index = 0; index < count; index += 1) {
      const candidate = random.fork(`stone:${index}`);
      const x = originX + candidate.next() * this.cellSize;
      const z = originZ + candidate.next() * this.cellSize;
      if (
        Math.abs(x) > halfWorld - 2 ||
        Math.abs(z) > halfWorld - 2
      ) {
        continue;
      }
      this.placeCandidate(x, z, candidate, rockiness, instances, false);
    }
    return instances;
  }

  private placeCandidate(
    x: number,
    z: number,
    random: StoneRandom,
    rockiness: number,
    instances: StoneInstance[],
    isSatellite: boolean,
  ): void {
    const height = this.field.sampleHeight(x, z);
    const normal = this.field.sampleNormal(x, z, this.normalScratch);
    if (normal.y < SLOPE_REJECT_NY) {
      return;
    }

    const biomeSample = sampleGrassBiome(x, z);
    const biomeIndex = Math.min(
      pickGrassBiomeIndex(x, z, biomeSample),
      BIOME_PALETTE.length - 1,
    );

    let archetype: StoneArchetypeId;
    if (isSatellite) {
      archetype = random.chance(0.7) ? "pebble" : "boulder";
    } else {
      const weights =
        normal.y < SLOPE_FAMILY_NY
          ? SLOPE_WEIGHTS
          : LEVEL_WEIGHTS[biomeIndex];
      archetype = this.pickArchetype(weights, random);
      // Monoliths belong to ridges and rocky fields, not lone meadows.
      if (
        archetype === "shard" &&
        height < this.config.grassMaxAltitude - 40 &&
        rockiness < 0.5
      ) {
        archetype = "boulder";
      }
    }

    const band = SCALE_BANDS[archetype];
    let scale = random.range(band[0], band[1]);
    if (isSatellite) {
      scale = Math.max(0.2, scale * 0.45);
    } else if (
      archetype === "boulder" &&
      rockiness > 0.45 &&
      random.chance(0.06)
    ) {
      // Rare landmark boulder anchoring a rocky field.
      scale *= random.range(1.7, 2.4);
    }
    const variantIndex = random.integer(
      0,
      this.config.stoneVariantsPerArchetype - 1,
    );
    const variant = this.getVariant(archetype, variantIndex);
    const footprint = variant.metrics.footprintRadius * scale;

    // Walking ways: keep the tread and its verge open. Path distances fade
    // out with altitude exactly like the visible ways themselves.
    const visibility = this.field.samplePathVisibility(height);
    if (visibility > 0.05) {
      const distances = this.field.samplePathDistances(x, z, this.pathScratch);
      const mainClear =
        this.config.pathWidth * 0.5 +
        this.config.pathEdgeRoughness +
        this.config.pathGrassClearance;
      const branchClear =
        this.config.pathBranchWidth * 0.5 +
        this.config.pathEdgeRoughness +
        this.config.pathGrassClearance;
      const mainMargin = Math.abs(distances.x) - mainClear - footprint;
      const branchMargin = Math.abs(distances.y) - branchClear - footprint;
      const margin = Math.min(mainMargin, branchMargin);
      if (margin < 0.35) {
        // On or over a way: only the occasional pebble survives at the very
        // edge of the verge, anything larger yields the road.
        const pebbleOnVerge =
          archetype === "pebble" && margin > -0.2 && random.chance(0.35);
        if (!pebbleOnVerge) {
          return;
        }
      } else if (
        margin < 3 &&
        scale < 1.1 &&
        !isSatellite &&
        random.chance(0.3)
      ) {
        // The verge band just beyond the clearance: an extra small stone so
        // ways read as lined by kicked-aside rock.
        const verge = random.fork("verge");
        this.placeCandidate(
          x + verge.signed(1.4),
          z + verge.signed(1.4),
          verge,
          rockiness,
          instances,
          true,
        );
      }
    }

    // Keep unrelated stones from interpenetrating inside a cell. Satellites
    // are placed around their parent deliberately and skip the check.
    if (!isSatellite) {
      for (const existing of instances) {
        const offsetX = existing.x - x;
        const offsetZ = existing.z - z;
        const minimum = (existing.clearRadius + footprint) * 0.85 + 0.3;
        if (offsetX * offsetX + offsetZ * offsetZ < minimum * minimum) {
          return;
        }
      }
    }

    const graniteBlend = smoothstep(
      height,
      this.config.grassMaxAltitude - 35,
      this.config.grassMaxAltitude + 30,
    );
    let paletteKey = BIOME_PALETTE[biomeIndex];
    if (
      paletteKey === "meadowSage" &&
      rockiness < 0.35 &&
      random.chance(0.22)
    ) {
      paletteKey = "mossy";
    }

    const sink =
      variant.metrics.embed * variant.metrics.height * scale +
      (1 - normal.y) * 0.55 * scale;
    const clearBase = variant.metrics.contactRadius * scale;
    const clearRadius =
      scale >= CLEAR_SCALE_CUTOFF ? clearBase * 0.92 + 0.08 : 0;

    const tiltStrength =
      archetype === "pebble"
        ? 0.85
        : archetype === "shard"
          ? 0.22
          : archetype === "outcrop" || archetype === "slab"
            ? 0.65
            : 0.45;

    instances.push({
      x,
      z,
      height,
      sink,
      rotationY: random.range(0, Math.PI * 2),
      scale,
      archetype,
      variantIndex,
      paletteKey,
      graniteBlend,
      valueScale: random.range(0.92, 1.06),
      normalX: normal.x,
      normalY: normal.y,
      normalZ: normal.z,
      tiltStrength,
      clearRadius,
    });

    // Larger grounded masses seed a family of satellites around themselves —
    // the two-stone and scatter-cluster compositions of the reference boards.
    if (
      !isSatellite &&
      scale >= 0.9 &&
      (archetype === "boulder" ||
        archetype === "outcrop" ||
        archetype === "slab" ||
        archetype === "block") &&
      random.chance(this.config.stoneClusterChance)
    ) {
      const satellites = random.integer(1, 3);
      for (let index = 0; index < satellites; index += 1) {
        const orbit = random.fork(`satellite:${index}`);
        const angle = orbit.range(0, Math.PI * 2);
        const distance = footprint + orbit.range(0.5, 1.6) * Math.max(0.8, scale);
        const satelliteX = x + Math.cos(angle) * distance;
        const satelliteZ = z + Math.sin(angle) * distance;
        const satelliteHeight = this.field.sampleHeight(
          satelliteX,
          satelliteZ,
        );
        // A satellite across a terrain break would float or bury itself.
        if (Math.abs(satelliteHeight - height) > 1.1 * Math.max(1, scale)) {
          continue;
        }
        this.placeCandidate(
          satelliteX,
          satelliteZ,
          orbit,
          rockiness,
          instances,
          true,
        );
      }
    }
  }

  private pickArchetype(
    weights: ArchetypeWeights,
    random: StoneRandom,
  ): StoneArchetypeId {
    let total = 0;
    for (const weight of weights.weights) {
      total += weight;
    }
    let roll = random.next() * total;
    for (let index = 0; index < weights.ids.length; index += 1) {
      roll -= weights.weights[index];
      if (roll <= 0) {
        return weights.ids[index];
      }
    }
    return weights.ids[weights.ids.length - 1];
  }
}
