import * as THREE from "three";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import {
  pickGrassBiomeIndex,
  sampleGrassBiome,
} from "../grass/WorldBiomeField";
import { hashStoneCell, StoneRandom } from "./StoneRandom";
import { type StoneArchetypeId } from "./StoneRecipe";
import { resolveQualityStoneRecipe } from "./StoneShapeQuality";
import { generateStoneMesh, type StoneMeshData } from "./StoneGeometry";
import { type StonePaletteKey } from "./StonePalette";
import {
  StoneClusterComposition,
  type StoneClusterMemberSpec,
} from "./StoneClusterComposition";
import {
  StoneClusterField,
  type StoneClusterDescriptor,
} from "./StoneClusterField";
import {
  clamp01,
  clusterCacheKeepCount,
  clusterGridKey,
  clusterLocalToWorld,
  clusterRadialWorld,
  OVERLAP_COINCIDENT_EPSILON,
  OVERLAP_FOOTPRINT_FACTOR,
  OVERLAP_PADDING,
  OVERLAP_PUSH_EXTRA,
  singletonProbability,
  smoothstep,
  SPLIT_CORE_OFFSET_FACTOR,
  SPLIT_GAP_MAX,
  SPLIT_GAP_MIN,
  STONE_CELL_DOMAIN,
  STONE_CLUSTER_RESOLVED_CACHE_LIMIT,
  trimOldestCacheEntries,
  type StoneClusterRole,
} from "./StoneClusterTuning";
import {
  BIOME_PALETTE,
  SCALE_BANDS,
  stoneMossBase,
} from "./StonePlacementProfile";

/**
 * Deterministic world-space stone placement.
 *
 * Stones are a consequence of geology, surface exposure, and erosion: a macro
 * lattice decides where formations exist, composition assigns an
 * anchor/secondary/debris family, and this field only validates those members
 * against terrain, paths, and one another. Quiet ground stays quiet except for
 * a rare singleton, and walking ways keep their own kicked-aside verge stones.
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
  /**
   * How much of the geometry's baked moss susceptibility actually grows here.
   * Damp lowland meadow is mossy, dry steppe barely lichened, and bare rock
   * above the grass line has almost nothing on it.
   */
  readonly moss: number;
  readonly valueScale: number;
  /** Terrain normal at the root, and how strongly to align to it. */
  readonly normalX: number;
  readonly normalY: number;
  readonly normalZ: number;
  readonly tiltStrength: number;
  /** Metres of grass cleared around the footprint; 0 for nestling pebbles. */
  readonly clearRadius: number;
}

export interface StoneResolvedMember {
  readonly instance: StoneInstance;
  readonly footprintRadius: number;
  readonly memberIndex: number;
  readonly role: StoneClusterRole;
  readonly isSplitHalf: boolean;
  readonly localU: number;
  readonly localV: number;
}

export interface StoneResolvedCluster {
  readonly members: readonly StoneResolvedMember[];
  readonly logicalSlots: number;
  readonly validationAttempts: number;
  readonly overlapCorrections: number;
  readonly splitEligibleSlots: number;
  readonly splitSucceeded: boolean;
  readonly usedFallback: boolean;
}

export interface StoneClusterBoundsSummary {
  activeClusters: number;
  compact: number;
  ridge: number;
  scree: number;
  fan: number;
  acceptedMembers: number;
  splits: number;
  singletons: number;
}

interface AcceptedMember {
  instance: StoneInstance;
  footprintRadius: number;
  memberIndex: number;
  role: StoneClusterRole;
  isSplitHalf: boolean;
  localU: number;
  localV: number;
}

const CELL_CACHE_LIMIT = 640;
const CELL_CACHE_TRIM = 384;
/** Generated verge stones may cross one source-cell edge. */
const CHUNK_SOURCE_CELL_MARGIN = 1;
/** Below this scale a stone nestles into grass instead of clearing it. */
const CLEAR_SCALE_CUTOFF = 0.5;
/** Slope gates on the terrain normal's Y component. */
const SLOPE_REJECT_NY = 0.62;
const PATH_DISTANCE_PLATEAU = 24;
const VERGE_BAND = 1.6;
const VERGE_STEP_PASSES = 4;
const VERGE_MAX_PER_CELL = 7;

const EMPTY_RESOLVED: StoneResolvedCluster = {
  members: [],
  logicalSlots: 0,
  validationAttempts: 0,
  overlapCorrections: 0,
  splitEligibleSlots: 0,
  splitSucceeded: false,
  usedFallback: false,
};

export class StoneField {
  private readonly cellSize: number;
  private readonly cells = new Map<string, StoneInstance[]>();
  private readonly cellSingletons = new Map<string, number>();
  private readonly resolvedClusters = new Map<string, StoneResolvedCluster>();
  private readonly variants = new Map<string, StoneMeshData>();
  private readonly normalScratch = new THREE.Vector3();
  private readonly pathScratch = new THREE.Vector2();
  private readonly clusterField: StoneClusterField;
  private readonly composition: StoneClusterComposition;
  private readonly enabled: boolean;

  constructor(
    private readonly field: TerrainField,
    private readonly config: WorldConfig,
  ) {
    this.cellSize = config.stoneCellSize;
    this.enabled = config.stonesEnabled >= 1;
    this.clusterField = new StoneClusterField(field, config);
    this.composition = new StoneClusterComposition(config);
  }

  getClusterField(): StoneClusterField {
    return this.clusterField;
  }

  getClusterDescriptor(gridX: number, gridZ: number): StoneClusterDescriptor {
    return this.clusterField.getDescriptor(gridX, gridZ);
  }

  getResolvedCluster(gridX: number, gridZ: number): StoneResolvedCluster {
    const key = clusterGridKey(gridX, gridZ);
    const cached = this.resolvedClusters.get(key);
    if (cached) {
      return cached;
    }
    const resolved = this.resolveCluster(gridX, gridZ);
    if (this.resolvedClusters.size >= STONE_CLUSTER_RESOLVED_CACHE_LIMIT) {
      trimOldestCacheEntries(
        this.resolvedClusters,
        clusterCacheKeepCount(STONE_CLUSTER_RESOLVED_CACHE_LIMIT),
      );
    }
    this.resolvedClusters.set(key, resolved);
    return resolved;
  }

  /**
   * Pre-generated mesh for an instance; built lazily, cached forever.
   *
   * `detailed` selects the chipped close-range form. Both come from the same
   * recipe and differ only by a handful of shallow corner facets, so a stone
   * keeps its identity across the swap — and the swap happens at the detail
   * radius, by which distance those facets are far below a pixel.
   */
  getVariant(
    archetype: StoneArchetypeId,
    variantIndex: number,
    detailed = false,
  ): StoneMeshData {
    const key = `${archetype}:${variantIndex}:${detailed ? "near" : "far"}`;
    let mesh = this.variants.get(key);
    if (!mesh) {
      const seed = hashStoneCell(
        variantIndex,
        hashStoneCell(archetype.length, variantIndex, this.config.seed),
        this.config.seed,
      );
      mesh = generateStoneMesh(
        resolveQualityStoneRecipe(archetype, seed),
        detailed,
      );
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
    const firstCellX =
      Math.floor(minX / this.cellSize) - CHUNK_SOURCE_CELL_MARGIN;
    const firstCellZ =
      Math.floor(minZ / this.cellSize) - CHUNK_SOURCE_CELL_MARGIN;
    const lastCellX =
      Math.floor((maxX - 1e-3) / this.cellSize) + CHUNK_SOURCE_CELL_MARGIN;
    const lastCellZ =
      Math.floor((maxZ - 1e-3) / this.cellSize) + CHUNK_SOURCE_CELL_MARGIN;
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

  summarizeBounds(
    minX: number,
    minZ: number,
    maxX: number,
    maxZ: number,
  ): StoneClusterBoundsSummary {
    const summary: StoneClusterBoundsSummary = {
      activeClusters: 0,
      compact: 0,
      ridge: 0,
      scree: 0,
      fan: 0,
      acceptedMembers: 0,
      splits: 0,
      singletons: 0,
    };
    if (!this.enabled) {
      return summary;
    }
    const spacing = this.config.stoneClusterSpacing;
    const pad = this.config.stoneClusterRadiusMax * 2;
    const firstGx = Math.floor((minX - pad) / spacing);
    const lastGx = Math.floor((maxX + pad) / spacing);
    const firstGz = Math.floor((minZ - pad) / spacing);
    const lastGz = Math.floor((maxZ + pad) / spacing);
    for (let gridZ = firstGz; gridZ <= lastGz; gridZ += 1) {
      for (let gridX = firstGx; gridX <= lastGx; gridX += 1) {
        const descriptor = this.clusterField.getDescriptor(gridX, gridZ);
        if (
          !descriptor.active ||
          descriptor.centerX < minX ||
          descriptor.centerX >= maxX ||
          descriptor.centerZ < minZ ||
          descriptor.centerZ >= maxZ
        ) {
          continue;
        }
        summary.activeClusters += 1;
        summary[descriptor.process] += 1;
        const resolved = this.getResolvedCluster(gridX, gridZ);
        summary.acceptedMembers += resolved.members.length;
        for (const member of resolved.members) {
          if (member.isSplitHalf) {
            summary.splits += 1;
          }
        }
      }
    }
    const firstCellX = Math.floor(minX / this.cellSize);
    const lastCellX = Math.floor((maxX - 1e-3) / this.cellSize);
    const firstCellZ = Math.floor(minZ / this.cellSize);
    const lastCellZ = Math.floor((maxZ - 1e-3) / this.cellSize);
    for (let cellZ = firstCellZ; cellZ <= lastCellZ; cellZ += 1) {
      for (let cellX = firstCellX; cellX <= lastCellX; cellX += 1) {
        this.getCellInstances(cellX, cellZ);
        summary.singletons += this.cellSingletons.get(`${cellX}:${cellZ}`) ?? 0;
      }
    }
    return summary;
  }

  sourceCellHasClusterInfluence(cellX: number, cellZ: number): boolean {
    const originX = cellX * this.cellSize;
    const originZ = cellZ * this.cellSize;
    const minX = originX;
    const minZ = originZ;
    const maxX = originX + this.cellSize;
    const maxZ = originZ + this.cellSize;
    const centerX = originX + this.cellSize * 0.5;
    const centerZ = originZ + this.cellSize * 0.5;
    const spacing = this.config.stoneClusterSpacing;
    const baseGx = Math.floor(centerX / spacing);
    const baseGz = Math.floor(centerZ / spacing);
    for (let gridZ = baseGz - 1; gridZ <= baseGz + 1; gridZ += 1) {
      for (let gridX = baseGx - 1; gridX <= baseGx + 1; gridX += 1) {
        const descriptor = this.clusterField.getDescriptor(gridX, gridZ);
        if (
          descriptor.active &&
          !this.circleMissesAabb(
            descriptor.centerX,
            descriptor.centerZ,
            descriptor.influenceRadius,
            minX,
            maxX,
            minZ,
            maxZ,
          )
        ) {
          return true;
        }
      }
    }
    return false;
  }

  private getCellInstances(cellX: number, cellZ: number): StoneInstance[] {
    const key = `${cellX}:${cellZ}`;
    const cached = this.cells.get(key);
    if (cached) {
      return cached;
    }
    const instances = this.generateCell(cellX, cellZ);
    if (this.cells.size >= CELL_CACHE_LIMIT) {
      for (const staleKey of this.cells.keys()) {
        this.cells.delete(staleKey);
        this.cellSingletons.delete(staleKey);
        if (this.cells.size <= CELL_CACHE_TRIM) {
          break;
        }
      }
    }
    this.cells.set(key, instances);
    return instances;
  }

  private generateCell(cellX: number, cellZ: number): StoneInstance[] {
    const random = StoneRandom.fromSeed(
      hashStoneCell(cellX, cellZ, this.config.seed ^ STONE_CELL_DOMAIN),
    );
    const originX = cellX * this.cellSize;
    const originZ = cellZ * this.cellSize;
    const centerX = originX + this.cellSize * 0.5;
    const centerZ = originZ + this.cellSize * 0.5;
    const minX = originX;
    const minZ = originZ;
    const maxX = originX + this.cellSize;
    const maxZ = originZ + this.cellSize;
    const cellKey = `${cellX}:${cellZ}`;

    const halfWorld = this.config.worldSize * 0.5;
    if (
      centerX < -halfWorld ||
      centerX > halfWorld ||
      centerZ < -halfWorld ||
      centerZ > halfWorld
    ) {
      this.cellSingletons.set(cellKey, 0);
      return [];
    }

    const instances: StoneInstance[] = [];
    const spacing = this.config.stoneClusterSpacing;
    const baseGx = Math.floor(centerX / spacing);
    const baseGz = Math.floor(centerZ / spacing);
    let influenceHits = false;
    for (let gridZ = baseGz - 1; gridZ <= baseGz + 1; gridZ += 1) {
      for (let gridX = baseGx - 1; gridX <= baseGx + 1; gridX += 1) {
        const descriptor = this.clusterField.getDescriptor(gridX, gridZ);
        if (!descriptor.active) {
          continue;
        }
        if (
          this.circleMissesAabb(
            descriptor.centerX,
            descriptor.centerZ,
            descriptor.influenceRadius,
            minX,
            maxX,
            minZ,
            maxZ,
          )
        ) {
          continue;
        }
        influenceHits = true;
        for (const member of this.getResolvedCluster(gridX, gridZ).members) {
          if (
            member.instance.x >= minX &&
            member.instance.x < maxX &&
            member.instance.z >= minZ &&
            member.instance.z < maxZ
          ) {
            instances.push(member.instance);
          }
        }
      }
    }

    let singletons = 0;
    if (!influenceHits) {
      singletons = this.addSingleton(
        random.fork("singleton"),
        originX,
        originZ,
        centerX,
        centerZ,
        instances,
      )
        ? 1
        : 0;
    }
    this.cellSingletons.set(cellKey, singletons);

    const geologyPotential = this.clusterField.sampleGeologyPotential(
      centerX,
      centerZ,
    );
    this.addVergeStones(
      random.fork("verge"),
      originX,
      originZ,
      geologyPotential,
      instances,
    );
    return instances;
  }

  private resolveCluster(gridX: number, gridZ: number): StoneResolvedCluster {
    const descriptor = this.clusterField.getDescriptor(gridX, gridZ);
    if (!descriptor.active) {
      return EMPTY_RESOLVED;
    }
    const specs = this.composition.compose(descriptor);
    if (specs.length === 0) {
      return EMPTY_RESOLVED;
    }
    const accepted: AcceptedMember[] = [];
    let validationAttempts = 0;
    let overlapCorrections = 0;
    let splitSucceeded = false;
    let usedFallback = false;
    const splitEligibleSlots = specs.some((spec) => spec.splitEligible) ? 1 : 0;

    const anchorSpec = specs[0];
    validationAttempts += 1;
    const anchor = this.placeNormalMember(
      descriptor,
      anchorSpec,
      accepted,
      false,
    );
    if (!anchor.member) {
      return {
        members: [],
        logicalSlots: specs.length,
        validationAttempts,
        overlapCorrections: 0,
        splitEligibleSlots,
        splitSucceeded: false,
        usedFallback: false,
      };
    }
    if (anchor.corrected) {
      overlapCorrections += 1;
    }
    accepted.push(anchor.member);

    for (let index = 1; index < specs.length; index += 1) {
      const spec = specs[index];
      if (spec.splitEligible && spec.fallback) {
        const splitRng = StoneRandom.fromSeed(descriptor.seed).fork(
          "split-geometry",
        );
        const splitAttempt = this.trySplitHalf(
          descriptor,
          spec,
          accepted[0],
          accepted.slice(1),
          splitRng,
        );
        validationAttempts += 1;
        if (splitAttempt) {
          accepted.push(splitAttempt);
          splitSucceeded = true;
          continue;
        }
        validationAttempts += 1;
        usedFallback = true;
        const fallback = this.placeNormalMember(
          descriptor,
          spec.fallback,
          accepted,
          true,
        );
        if (fallback.corrected) {
          overlapCorrections += 1;
        }
        if (fallback.member) {
          accepted.push(fallback.member);
        }
        continue;
      }
      validationAttempts += 1;
      const placed = this.placeNormalMember(descriptor, spec, accepted, true);
      if (placed.corrected) {
        overlapCorrections += 1;
      }
      if (placed.member) {
        accepted.push(placed.member);
      }
    }

    return {
      members: accepted.map((member) => ({ ...member })),
      logicalSlots: specs.length,
      validationAttempts,
      overlapCorrections,
      splitEligibleSlots,
      splitSucceeded,
      usedFallback,
    };
  }

  private trySplitHalf(
    descriptor: StoneClusterDescriptor,
    spec: StoneClusterMemberSpec,
    anchor: AcceptedMember,
    others: readonly AcceptedMember[],
    random: StoneRandom,
  ): AcceptedMember | undefined {
    const desiredGap =
      random.range(SPLIT_GAP_MIN, SPLIT_GAP_MAX) +
      anchor.footprintRadius * 1.05;
    if (
      desiredGap >
      descriptor.majorRadius *
        this.config.stoneClusterCoreRatio *
        SPLIT_CORE_OFFSET_FACTOR
    ) {
      return undefined;
    }
    const breakAngle =
      descriptor.strike + Math.PI * 0.5 + random.signed(0.35);
    const x = anchor.instance.x + Math.cos(breakAngle) * desiredGap;
    const z = anchor.instance.z + Math.sin(breakAngle) * desiredGap;
    if (!this.insideWorld(x, z)) {
      return undefined;
    }
    const height = this.field.sampleHeight(x, z);
    if (
      Math.abs(height - anchor.instance.height) >
      0.8 * Math.max(1, anchor.instance.scale)
    ) {
      return undefined;
    }
    const normal = this.field.sampleNormal(x, z, this.normalScratch);
    if (normal.y < SLOPE_REJECT_NY) {
      return undefined;
    }
    const scale = anchor.instance.scale * random.range(0.62, 0.92);
    const variant = this.getVariant(
      anchor.instance.archetype,
      anchor.instance.variantIndex,
    );
    const footprint = variant.metrics.footprintRadius * scale;
    if (
      scale >= CLEAR_SCALE_CUTOFF &&
      this.field.samplePathGrassMask(x, z, height, 0) <= 0.35
    ) {
      return undefined;
    }
    if (this.overlapsAny(x, z, footprint, others)) {
      return undefined;
    }
    const instance = this.createInstance(
      x,
      z,
      height,
      normal,
      anchor.instance.archetype,
      anchor.instance.variantIndex,
      scale,
      descriptor.strike + Math.PI + random.signed(0.4),
      descriptor.paletteKey,
      spec.valueScale,
      this.memberMoss(descriptor, spec, height),
      variant,
    );
    return {
      instance,
      footprintRadius: footprint,
      memberIndex: spec.index,
      role: "secondary",
      isSplitHalf: true,
      localU: spec.localU,
      localV: spec.localV,
    };
  }

  private placeNormalMember(
    descriptor: StoneClusterDescriptor,
    spec: StoneClusterMemberSpec,
    accepted: readonly AcceptedMember[],
    allowOverlapCorrection: boolean,
  ): { member?: AcceptedMember; corrected: boolean } {
    const root = clusterLocalToWorld(
      descriptor.centerX,
      descriptor.centerZ,
      descriptor.direction,
      descriptor.majorRadius,
      descriptor.minorRadius,
      spec.localU,
      spec.localV,
    );
    let x = root.x;
    let z = root.z;
    if (!this.insideWorld(x, z)) {
      return { corrected: false };
    }
    const sampled = this.samplePlacement(
      x,
      z,
      spec.archetype,
      spec.variantIndex,
      spec.scale,
    );
    if (!sampled) {
      return { corrected: false };
    }
    let { height, normal, footprint, variant } = sampled;
    if (this.pathBlocks(x, z, height, spec.scale, spec.archetype, footprint)) {
      return { corrected: false };
    }

    const overlap = this.findOverlap(x, z, footprint, accepted);
    let corrected = false;
    if (overlap) {
      if (!allowOverlapCorrection) {
        return { corrected: false };
      }
      const pushed = this.pushOutward(
        descriptor,
        spec,
        x,
        z,
        overlap.member,
        footprint,
      );
      if (!pushed) {
        return { corrected: false };
      }
      x = pushed.x;
      z = pushed.z;
      corrected = true;
      if (!this.insideWorld(x, z)) {
        return { corrected: true };
      }
      const resampled = this.samplePlacement(
        x,
        z,
        spec.archetype,
        spec.variantIndex,
        spec.scale,
      );
      if (!resampled) {
        return { corrected: true };
      }
      height = resampled.height;
      normal = resampled.normal;
      footprint = resampled.footprint;
      variant = resampled.variant;
      if (this.pathBlocks(x, z, height, spec.scale, spec.archetype, footprint)) {
        return { corrected: true };
      }
      if (this.overlapsAny(x, z, footprint, accepted)) {
        return { corrected: true };
      }
    }

    const instance = this.createInstance(
      x,
      z,
      height,
      normal,
      spec.archetype,
      spec.variantIndex,
      spec.scale,
      spec.rotationY,
      descriptor.paletteKey,
      spec.valueScale,
      this.memberMoss(descriptor, spec, height),
      variant,
    );
    return {
      member: {
        instance,
        footprintRadius: footprint,
        memberIndex: spec.index,
        role: spec.role,
        isSplitHalf: false,
        localU: spec.localU,
        localV: spec.localV,
      },
      corrected,
    };
  }

  private addSingleton(
    random: StoneRandom,
    originX: number,
    originZ: number,
    centerX: number,
    centerZ: number,
    instances: StoneInstance[],
  ): boolean {
    const height = this.field.sampleHeight(centerX, centerZ);
    const ecology = this.field.sampleEcologyAt(centerX, centerZ, height);
    const geologyPotential = this.clusterField.sampleGeologyPotential(
      centerX,
      centerZ,
    );
    const probability = singletonProbability(
      geologyPotential,
      ecology.rockiness,
      this.config.stoneSingletonChance,
    );
    if (!random.chance(probability)) {
      return false;
    }
    const x = originX + random.next() * this.cellSize;
    const z = originZ + random.next() * this.cellSize;
    if (!this.insideWorld(x, z)) {
      return false;
    }
    const familyRoll = random.next();
    const archetype: StoneArchetypeId =
      familyRoll < 0.7 ? "pebble" : familyRoll < 0.92 ? "boulder" : "slab";
    const band = SCALE_BANDS[archetype];
    let scale = random.range(band[0], band[1]);
    if (
      archetype === "boulder" &&
      geologyPotential > 0.45 &&
      random.fork("landmark").chance(0.06)
    ) {
      scale *= random.fork("landmark-scale").range(1.7, 2.4);
    }
    const variantIndex = random.integer(
      0,
      this.config.stoneVariantsPerArchetype - 1,
    );
    const sampled = this.samplePlacement(x, z, archetype, variantIndex, scale);
    if (!sampled) {
      return false;
    }
    if (
      this.pathBlocks(
        x,
        z,
        sampled.height,
        scale,
        archetype,
        sampled.footprint,
      )
    ) {
      return false;
    }
    const biomeSample = sampleGrassBiome(x, z);
    const biomeIndex = Math.min(
      pickGrassBiomeIndex(x, z, biomeSample),
      BIOME_PALETTE.length - 1,
    );
    const moss = clamp01(
      stoneMossBase(
        sampled.height,
        biomeIndex,
        ecology.rockiness,
        this.config.grassMinAltitude,
        this.config.grassMaxAltitude,
      ) * random.fork("moss").range(0.94, 1.06),
    );
    instances.push(
      this.createInstance(
        x,
        z,
        sampled.height,
        sampled.normal,
        archetype,
        variantIndex,
        scale,
        this.clusterField.sampleStrike(x, z) + random.signed(0.42),
        BIOME_PALETTE[biomeIndex],
        random.range(0.92, 1.06),
        moss,
        sampled.variant,
      ),
    );
    return true;
  }

  private addVergeStones(
    random: StoneRandom,
    originX: number,
    originZ: number,
    geologyPotential: number,
    instances: StoneInstance[],
  ): void {
    const clearance =
      this.config.pathWidth * 0.5 +
      this.config.pathEdgeRoughness +
      this.config.pathGrassClearance;
    const centerX = originX + this.cellSize * 0.5;
    const centerZ = originZ + this.cellSize * 0.5;
    const centerHeight = this.field.sampleHeight(centerX, centerZ);
    if (this.field.samplePathVisibility(centerHeight) <= 0.05) {
      return;
    }
    this.field.samplePathDistances(centerX, centerZ, this.pathScratch);
    const centerDistance = this.pathScratch.x;
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
      if (
        !attempt.chance(
          this.config.stoneVergeChance * (0.35 + 0.65 * geologyPotential),
        )
      ) {
        continue;
      }
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
      const acrossX = tangent.z;
      const acrossZ = -tangent.x;
      const side = distance >= 0 ? 1 : -1;
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
      const target = clearance + footprint + 0.1 + attempt.range(0, VERGE_BAND);
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
      if (!this.insideWorld(x, z)) {
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
      const alongAngle = Math.atan2(tangent.z, tangent.x);
      const moss = clamp01(
        stoneMossBase(
          stoneHeight,
          biomeIndex,
          geologyPotential,
          this.config.grassMinAltitude,
          this.config.grassMaxAltitude,
        ) * attempt.fork("moss").range(0.94, 1.06),
      );
      instances.push(
        this.createInstance(
          x,
          z,
          stoneHeight,
          normal,
          archetype,
          variantIndex,
          scale,
          alongAngle + attempt.signed(0.3),
          BIOME_PALETTE[biomeIndex],
          attempt.range(0.92, 1.06),
          moss,
          variant,
        ),
      );
    }
  }

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
      return undefined;
    }
    return { x: -gradientZ / length, z: gradientX / length };
  }

  private samplePlacement(
    x: number,
    z: number,
    archetype: StoneArchetypeId,
    variantIndex: number,
    scale: number,
  ):
    | {
        height: number;
        normal: THREE.Vector3;
        footprint: number;
        variant: StoneMeshData;
      }
    | undefined {
    const height = this.field.sampleHeight(x, z);
    const normal = this.field.sampleNormal(x, z, this.normalScratch).clone();
    if (normal.y < SLOPE_REJECT_NY) {
      return undefined;
    }
    const variant = this.getVariant(archetype, variantIndex);
    const footprint = variant.metrics.footprintRadius * scale;
    return { height, normal, footprint, variant };
  }

  private pathBlocks(
    x: number,
    z: number,
    height: number,
    scale: number,
    archetype: StoneArchetypeId,
    footprint: number,
  ): boolean {
    const visibility = this.field.samplePathVisibility(height);
    if (visibility <= 0.05) {
      return false;
    }
    const distances = this.field.samplePathDistances(x, z, this.pathScratch);
    if (
      scale >= CLEAR_SCALE_CUTOFF &&
      this.field.resolvePathGrassMask(distances, height, 0) <= 0.35
    ) {
      return true;
    }
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
      return !(archetype === "pebble" && margin > -0.2);
    }
    return false;
  }

  private findOverlap(
    x: number,
    z: number,
    footprint: number,
    accepted: readonly AcceptedMember[],
  ): { member: AcceptedMember; distance: number; minimum: number } | undefined {
    for (const existing of accepted) {
      const offsetX = x - existing.instance.x;
      const offsetZ = z - existing.instance.z;
      const distance = Math.hypot(offsetX, offsetZ);
      const minimum =
        OVERLAP_FOOTPRINT_FACTOR * (footprint + existing.footprintRadius) +
        OVERLAP_PADDING;
      if (distance < minimum) {
        return { member: existing, distance, minimum };
      }
    }
    return undefined;
  }

  private overlapsAny(
    x: number,
    z: number,
    footprint: number,
    accepted: readonly AcceptedMember[],
  ): boolean {
    return this.findOverlap(x, z, footprint, accepted) !== undefined;
  }

  private pushOutward(
    descriptor: StoneClusterDescriptor,
    spec: StoneClusterMemberSpec,
    x: number,
    z: number,
    existing: AcceptedMember,
    footprint: number,
  ): { x: number; z: number } | undefined {
    let pushX = x - existing.instance.x;
    let pushZ = z - existing.instance.z;
    let length = Math.hypot(pushX, pushZ);
    if (length < OVERLAP_COINCIDENT_EPSILON) {
      const radial = clusterRadialWorld(
        descriptor.direction,
        descriptor.majorRadius,
        descriptor.minorRadius,
        spec.localU,
        spec.localV,
      );
      pushX = radial.x;
      pushZ = radial.z;
      length = Math.hypot(pushX, pushZ);
      if (length < OVERLAP_COINCIDENT_EPSILON) {
        pushX = Math.cos(descriptor.direction);
        pushZ = Math.sin(descriptor.direction);
        length = 1;
      }
    }
    const minimum =
      OVERLAP_FOOTPRINT_FACTOR * (footprint + existing.footprintRadius) +
      OVERLAP_PADDING;
    const current = Math.hypot(x - existing.instance.x, z - existing.instance.z);
    const needed = minimum - current + OVERLAP_PUSH_EXTRA;
    if (!(needed > 0) || !(length > 0)) {
      return undefined;
    }
    const inv = 1 / length;
    return {
      x: x + pushX * inv * needed,
      z: z + pushZ * inv * needed,
    };
  }

  private createInstance(
    x: number,
    z: number,
    height: number,
    normal: THREE.Vector3,
    archetype: StoneArchetypeId,
    variantIndex: number,
    scale: number,
    rotationY: number,
    paletteKey: StonePaletteKey,
    valueScale: number,
    moss: number,
    variant: StoneMeshData,
  ): StoneInstance {
    const used = variant;
    const graniteBlend = smoothstep(
      height,
      this.config.grassMaxAltitude - 35,
      this.config.grassMaxAltitude + 30,
    );
    const sink =
      used.metrics.embed * used.metrics.height * scale +
      (1 - normal.y) * 0.55 * scale;
    const clearBase = used.metrics.contactRadius * scale;
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
    return {
      x,
      z,
      height,
      sink,
      rotationY,
      scale,
      archetype,
      variantIndex,
      paletteKey,
      graniteBlend,
      valueScale,
      moss,
      normalX: normal.x,
      normalY: normal.y,
      normalZ: normal.z,
      tiltStrength,
      clearRadius,
    };
  }

  private memberMoss(
    descriptor: StoneClusterDescriptor,
    spec: StoneClusterMemberSpec,
    height: number,
  ): number {
    return clamp01(
      stoneMossBase(
        height,
        descriptor.biomeIndex,
        descriptor.surfaceRockiness,
        this.config.grassMinAltitude,
        this.config.grassMaxAltitude,
      ) *
        descriptor.mossBias *
        spec.mossScale,
    );
  }

  private insideWorld(x: number, z: number): boolean {
    const limit = this.config.worldSize * 0.5 - 2;
    return Math.abs(x) <= limit && Math.abs(z) <= limit;
  }

  private circleMissesAabb(
    centerX: number,
    centerZ: number,
    radius: number,
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
  ): boolean {
    const dx = Math.max(minX - centerX, 0, centerX - maxX);
    const dz = Math.max(minZ - centerZ, 0, centerZ - maxZ);
    return dx * dx + dz * dz > radius * radius;
  }
}
