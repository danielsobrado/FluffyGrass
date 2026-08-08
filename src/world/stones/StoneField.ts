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

/**
 * Metres per cell of the geological strike field. Stones inside one cell share
 * a dominant orientation, which is what makes a group read as one outcrop
 * rather than as unrelated rocks that happen to be near each other.
 */
const STRIKE_PERIOD = 130;
/** Half-width of the yaw spread around the local strike, in radians. */
const STRIKE_SPREAD = 0.55;
/** Slope steepness at which scree is fully committed to the downhill side. */
const SCREE_FULL_SLOPE = 0.3;
/** Chance a large blocky stone is split into two pieces of one original. */
const SPLIT_CHANCE = 0.28;
/** Metres of gap between the halves of a split stone. */
const SPLIT_GAP = { min: 0.08, max: 0.3 };
/**
 * Value the path distance field saturates to away from any way. Beyond the
 * field's own cutoff it returns this constant, so the gradient there is zero
 * and carries no direction to align against.
 */
const PATH_DISTANCE_PLATEAU = 24;
/** Metres beyond the path clearance that verge stones may occupy. */
const VERGE_BAND = 1.6;
/** Refinement passes when walking a sample onto the verge line. */
const VERGE_STEP_PASSES = 4;
/** Verge stones per cell, before rockiness and chance. */
const VERGE_MAX_PER_CELL = 7;

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
      // Evict oldest-first. Map preserves insertion order, and the cache is
      // transparent — every entry is reproducible from its coordinates — so
      // eviction can never change what the world looks like, only how often
      // a cell is recomputed.
      for (const staleKey of this.cells.keys()) {
        this.cells.delete(staleKey);
        if (this.cells.size <= CELL_CACHE_TRIM) {
          break;
        }
      }
    }
    this.cells.set(key, instances);
    return instances;
  }

  /**
   * Local bedding direction, in radians.
   *
   * Real outcrops in one area share an orientation, so a fully random yaw is
   * what made clusters read as scattered. The field has a π period rather than
   * 2π because a strike is an axis, not a heading: a stone turned by half a
   * turn is still aligned with its neighbours.
   */
  private sampleStrike(x: number, z: number): number {
    return (
      this.valueNoise(
        x / STRIKE_PERIOD,
        z / STRIKE_PERIOD,
        this.rockSeed ^ 0x5bd1e995,
      ) * Math.PI
    );
  }

  /**
   * Downhill heading at (x, z), or undefined on ground too flat to have one.
   *
   * For a height field the surface normal already leans downhill, so its
   * horizontal part *is* the fall line — no extra height samples needed.
   */
  private sampleDownhill(
    normalX: number,
    normalZ: number,
  ): { angle: number; steepness: number } | undefined {
    const steepness = Math.hypot(normalX, normalZ);
    if (steepness < 0.02) {
      return undefined;
    }
    return { angle: Math.atan2(normalZ, normalX), steepness };
  }

  /**
   * Unit tangent of the walking way nearest (x, z), from the gradient of the
   * signed path-distance field. The gradient points across the way, so its
   * perpendicular runs along it — which is the axis a kerb stone should lie on.
   */
  private samplePathTangent(
    x: number,
    z: number,
  ): { x: number; z: number } | undefined {
    const step = 0.6;
    this.field.samplePathDistances(x + step, z, this.pathScratch);
    const east = this.pathScratch.x;
    this.field.samplePathDistances(x - step, z, this.pathScratch);
    const west = this.pathScratch.x;
    this.field.samplePathDistances(x, z + step, this.pathScratch);
    const north = this.pathScratch.x;
    this.field.samplePathDistances(x, z - step, this.pathScratch);
    const south = this.pathScratch.x;
    const gradientX = (east - west) / (2 * step);
    const gradientZ = (north - south) / (2 * step);
    const length = Math.hypot(gradientX, gradientZ);
    if (!(length > 1e-4)) {
      // Flat plateau: no way near enough to have a direction.
      return undefined;
    }
    return { x: -gradientZ / length, z: gradientX / length };
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
      (0.06 + 3.6 * rockiness) *
      lowlandFade *
      highBoost *
      BIOME_DENSITY[biomeIndex];

    let count = Math.floor(expected);
    if (random.chance(expected - count)) {
      count += 1;
    }
    count = Math.min(count, MAX_STONES_PER_CELL);

    // Note the ordinary-stone count can be zero here and the cell still has
    // work to do: a way crossing quiet ground gets no scattered stones but
    // should still be lined. An early return on count === 0 skipped the verge
    // pass for precisely the cells it exists to serve.
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

    this.addVergeStones(
      random.fork("verge"),
      originX,
      originZ,
      rockiness,
      instances,
    );
    return instances;
  }

  /**
   * Stones lining a walking way.
   *
   * The coherent story is that someone cut a way through rocky ground and
   * pushed the stones aside, so three things follow and all three are what
   * make it read as caused rather than decorated: the density *rises* just
   * outside the clearance instead of staying uniform, it only happens where
   * the ground was rocky to begin with, and the stones lie along the way
   * rather than at random angles.
   *
   * Placement uses the path distance field directly. Stepping a sample along
   * the field's own gradient by the distance it still needs to travel lands it
   * on the clearance edge in one move — the field is close to linear at this
   * scale, so there is no need to search.
   */
  private addVergeStones(
    random: StoneRandom,
    originX: number,
    originZ: number,
    rockiness: number,
    instances: StoneInstance[],
  ): void {
    const clearance =
      this.config.pathWidth * 0.5 +
      this.config.pathEdgeRoughness +
      this.config.pathGrassClearance;

    // Decide once, from the cell itself, whether a way passes close enough to
    // be worth lining. Ways are hundreds of metres apart, so testing random
    // points inside every cell in the world and hoping to land near one yields
    // almost nothing; this checks the cell centre and only then spends effort.
    const centerX = originX + this.cellSize * 0.5;
    const centerZ = originZ + this.cellSize * 0.5;
    const centerHeight = this.field.sampleHeight(centerX, centerZ);
    if (this.field.samplePathVisibility(centerHeight) <= 0.05) {
      return;
    }
    this.field.samplePathDistances(centerX, centerZ, this.pathScratch);
    const centerDistance = this.pathScratch.x;
    // The distance field saturates to a constant plateau away from any way, so
    // a saturated sample carries no gradient and nothing can be aligned to it.
    if (
      Math.abs(Math.abs(centerDistance) - PATH_DISTANCE_PLATEAU) < 0.01 ||
      Math.abs(centerDistance) > clearance + VERGE_BAND + this.cellSize * 0.8
    ) {
      return;
    }

    const centerTangent = this.samplePathTangent(centerX, centerZ);
    if (!centerTangent) {
      return;
    }

    const attempts = random.integer(1, VERGE_MAX_PER_CELL);
    for (let index = 0; index < attempts; index += 1) {
      const attempt = random.fork(`verge:${index}`);
      // Rockiness weights the result rather than gating it: a way cut through
      // soft ground still turns up the occasional stone, it just turns up far
      // fewer than one cut through a boulder field.
      if (
        !attempt.chance(this.config.stoneVergeChance * (0.35 + 0.65 * rockiness))
      ) {
        continue;
      }
      // Walk along the way from the cell centre rather than sampling the cell
      // uniformly. A cell is 16 m across and the distance field flattens out a
      // little beyond that, so uniform samples mostly landed on the plateau
      // where there is no way to align to — which is why the first version of
      // this produced roughly one stone per 350 m of path.
      const along = attempt.range(-0.5, 0.5) * this.cellSize;
      const sampleX = centerX + centerTangent.x * along;
      const sampleZ = centerZ + centerTangent.z * along;
      const height = this.field.sampleHeight(sampleX, sampleZ);
      if (this.field.samplePathVisibility(height) <= 0.05) {
        continue;
      }

      this.field.samplePathDistances(sampleX, sampleZ, this.pathScratch);
      const distance = this.pathScratch.x;
      if (
        Math.abs(Math.abs(distance) - PATH_DISTANCE_PLATEAU) < 0.01 ||
        Math.abs(distance) > clearance + VERGE_BAND + this.cellSize
      ) {
        continue;
      }

      const tangent = this.samplePathTangent(sampleX, sampleZ);
      if (!tangent) {
        continue;
      }
      // The gradient points across the way; stepping along it moves a sample
      // directly toward or away from the tread.
      // Perpendicular to the way, pointing the way distance increases. The
      // negation of this steps candidates *toward* the tread instead, which
      // is what put nearly every one of them outside the acceptance band.
      const acrossX = tangent.z;
      const acrossZ = -tangent.x;
      const side = distance >= 0 ? 1 : -1;

      // Kicked-aside stones are small: anything heavy stayed where it was and
      // the way bent around it instead. Chosen before the offset so the
      // footprint can be built into it — picking the offset first meant the
      // tightest ones were always rejected by the clearance check below.
      const archetype: StoneArchetypeId = attempt.chance(0.55)
        ? "pebble"
        : attempt.chance(0.6)
          ? "slab"
          : "boulder";
      const scale = attempt.range(0.22, 0.6);
      const variantIndex = attempt.integer(
        0,
        this.config.stoneVariantsPerArchetype - 1,
      );
      const variant = this.getVariant(archetype, variantIndex);
      const footprint = variant.metrics.footprintRadius * scale;

      // Measured to the stone's rim, so its body always clears the tread.
      const target =
        clearance + footprint + 0.1 + attempt.range(0, VERGE_BAND);
      // Walk toward the verge line, then accept anywhere inside a band rather
      // than insisting on an exact offset. The distance field follows contours
      // and is only locally linear, so demanding a precise landing threw away
      // most candidates that were in fact perfectly well placed; a band is
      // both more robust and closer to what the result should look like,
      // since a real verge is not a drawn line.
      let x = sampleX;
      let z = sampleZ;
      let currentDistance = distance;
      let stepAcrossX = acrossX;
      let stepAcrossZ = acrossZ;
      for (let pass = 0; pass < VERGE_STEP_PASSES; pass += 1) {
        const travel = side * target - currentDistance;
        if (Math.abs(travel) < 0.1) {
          break;
        }
        x += stepAcrossX * travel;
        z += stepAcrossZ * travel;
        this.field.samplePathDistances(x, z, this.pathScratch);
        currentDistance = this.pathScratch.x;
        if (Math.abs(Math.abs(currentDistance) - PATH_DISTANCE_PLATEAU) < 0.01) {
          break;
        }
        const stepTangent = this.samplePathTangent(x, z);
        if (!stepTangent) {
          break;
        }
        stepAcrossX = stepTangent.z;
        stepAcrossZ = -stepTangent.x;
      }

      const landed = Math.abs(currentDistance);
      const bandMin = clearance + footprint + 0.05;
      const bandMax = clearance + footprint + VERGE_BAND + 0.6;
      if (!(landed >= bandMin && landed <= bandMax)) {
        continue;
      }
      if (
        Math.abs(x) > this.config.worldSize * 0.5 - 2 ||
        Math.abs(z) > this.config.worldSize * 0.5 - 2
      ) {
        continue;
      }

      const stoneHeight = this.field.sampleHeight(x, z);
      const normal = this.field.sampleNormal(x, z, this.normalScratch);
      if (normal.y < SLOPE_REJECT_NY) {
        continue;
      }

      let blocked = false;
      for (const existing of instances) {
        const offsetX = existing.x - x;
        const offsetZ = existing.z - z;
        const minimum = (existing.clearRadius + footprint) * 0.85 + 0.2;
        if (offsetX * offsetX + offsetZ * offsetZ < minimum * minimum) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        continue;
      }

      const biomeSample = sampleGrassBiome(x, z);
      const biomeIndex = Math.min(
        pickGrassBiomeIndex(x, z, biomeSample),
        BIOME_PALETTE.length - 1,
      );
      // Aligned along the way, not to the regional strike: these were moved by
      // hand, so the way is the thing that ordered them.
      const alongAngle = Math.atan2(tangent.z, tangent.x);

      instances.push({
        x,
        z,
        height: stoneHeight,
        sink:
          variant.metrics.embed * variant.metrics.height * scale +
          (1 - normal.y) * 0.55 * scale,
        rotationY: alongAngle + attempt.signed(0.3),
        scale,
        archetype,
        variantIndex,
        paletteKey: BIOME_PALETTE[biomeIndex],
        graniteBlend: smoothstep(
          stoneHeight,
          this.config.grassMaxAltitude - 35,
          this.config.grassMaxAltitude + 30,
        ),
        valueScale: attempt.range(0.92, 1.06),
        normalX: normal.x,
        normalY: normal.y,
        normalZ: normal.z,
        tiltStrength: 0.8,
        clearRadius:
          scale >= CLEAR_SCALE_CUTOFF
            ? variant.metrics.contactRadius * scale * 0.92 + 0.08
            : 0,
      });
    }
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
      scale = Math.max(0.22, scale * random.range(0.3, 0.62));
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

    // Yaw follows the local bedding direction rather than being free. This is
    // the single change that makes neighbouring stones look related: a random
    // yaw per stone is what made a group read as scattered debris.
    const strike = this.sampleStrike(x, z);

    instances.push({
      x,
      z,
      height,
      sink,
      rotationY: strike + random.signed(STRIKE_SPREAD),
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

    // A split mass: the same variant placed twice, turned apart across a narrow
    // gap. Sharing the silhouette is what sells it — two *different* stones
    // side by side read as two stones, whereas one shape broken in two reads
    // as a rock that cracked, which is the two-stone composition on the
    // reference boards. The halves keep the palette and the strike, so the
    // grain appears to run through both.
    if (
      !isSatellite &&
      scale >= 0.75 &&
      (archetype === "block" || archetype === "boulder") &&
      random.chance(SPLIT_CHANCE)
    ) {
      const split = random.fork("split");
      const gap = split.range(SPLIT_GAP.min, SPLIT_GAP.max) + footprint * 1.05;
      // Break across the strike, so the split face aligns with the bedding.
      const breakAngle = strike + Math.PI * 0.5 + split.signed(0.35);
      const halfX = x + Math.cos(breakAngle) * gap;
      const halfZ = z + Math.sin(breakAngle) * gap;
      const halfHeight = this.field.sampleHeight(halfX, halfZ);
      if (Math.abs(halfHeight - height) <= 0.8 * Math.max(1, scale)) {
        const halfNormal = this.field.sampleNormal(
          halfX,
          halfZ,
          this.normalScratch,
        );
        if (halfNormal.y >= SLOPE_REJECT_NY) {
          const halfScale = scale * split.range(0.62, 0.92);
          const halfVariant = this.getVariant(archetype, variantIndex);
          instances.push({
            x: halfX,
            z: halfZ,
            height: halfHeight,
            sink:
              halfVariant.metrics.embed *
                halfVariant.metrics.height *
                halfScale +
              (1 - halfNormal.y) * 0.55 * halfScale,
            // Turned roughly half a turn so the two silhouettes mirror rather
            // than repeat, which is what makes them look like one broken mass.
            rotationY: strike + Math.PI + split.signed(0.4),
            scale: halfScale,
            archetype,
            variantIndex,
            paletteKey,
            graniteBlend,
            valueScale: random.range(0.92, 1.06),
            normalX: halfNormal.x,
            normalY: halfNormal.y,
            normalZ: halfNormal.z,
            tiltStrength,
            clearRadius:
              halfScale >= CLEAR_SCALE_CUTOFF
                ? halfVariant.metrics.contactRadius * halfScale * 0.92 + 0.08
                : 0,
          });
        }
      }
    }

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
      const satellites = random.integer(2, 4);
      // Debris falls downhill. Spreading satellites evenly around a parent is
      // the physically wrong answer on any slope, and it is what made clusters
      // read as a boulder with gravel arranged around it.
      const downhill = this.sampleDownhill(normal.x, normal.z);
      const screeCommitment = downhill
        ? Math.min(1, downhill.steepness / SCREE_FULL_SLOPE)
        : 0;
      for (let index = 0; index < satellites; index += 1) {
        const orbit = random.fork(`satellite:${index}`);
        const freeAngle = orbit.range(0, Math.PI * 2);
        // On flat ground this stays a full orbit; on a slope it narrows into
        // an apron below the parent.
        const angle = downhill
          ? downhill.angle +
            orbit.signed(Math.PI * (1 - 0.72 * screeCommitment))
          : freeAngle;
        const distance =
          footprint * orbit.range(0.75, 1.15) +
          orbit.range(0.1, 0.5) * scale +
          // Scree runs further downhill than it does sideways.
          screeCommitment * orbit.range(0, 1.1) * Math.max(0.6, scale);
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
