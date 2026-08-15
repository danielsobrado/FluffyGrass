import * as THREE from "three";
import {
  createGrassBiomeSample,
  pickGrassBiomeIndex,
  sampleGrassBiome,
} from "../grass/WorldBiomeField";
import {
  createTerrainLandform,
  type TerrainLandform,
} from "../ecology/TerrainLandformField";
import {
  createEcologySample,
  type WorldEcologySample,
} from "../ecology/WorldEcologyField";
import {
  createHydrologySample,
  type HydrologySample,
} from "../hydrology/HydrologyField";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import type { StonePaletteKey } from "./StonePalette";
import { hashStoneCell, StoneRandom } from "./StoneRandom";
import { BIOME_PALETTE } from "./StonePlacementProfile";
import {
  classifyStoneClusterProcess,
  clamp,
  clamp01,
  clusterCacheKeepCount,
  clusterGridKey,
  COMPACT_ASPECT_BLEND,
  COMPACT_DIRECTION_SPREAD,
  FAN_ASPECT_BLEND,
  lerp,
  maxNormalizedReach,
  SCREE_ASPECT_BLEND,
  smoothstep,
  STONE_CLUSTER_DESCRIPTOR_CACHE_LIMIT,
  STONE_CLUSTER_DOMAIN,
  STONE_GEOLOGY_FINE_SEED_XOR,
  STONE_ROCK_SEED_XOR,
  STONE_STRIKE_SEED_XOR,
  STRIKE_PERIOD,
  trimOldestCacheEntries,
  type StoneClusterProcess,
} from "./StoneClusterTuning";

/**
 * Macro geological lattice for world stones.
 *
 * One potential cluster per macro cell. The descriptor is a pure function of
 * coordinates and config: cache eviction may recompute, never rewrite, a
 * formation. Terrain and ecology are sampled once per uncached descriptor at
 * the jittered center.
 */

export interface StoneClusterDescriptor {
  readonly gridX: number;
  readonly gridZ: number;
  readonly seed: number;
  readonly active: boolean;
  readonly centerX: number;
  readonly centerZ: number;
  readonly height: number;
  readonly geologyPotential: number;
  readonly surfaceRockiness: number;
  readonly suitability: number;
  readonly process: StoneClusterProcess;
  readonly strike: number;
  readonly direction: number;
  readonly majorRadius: number;
  readonly minorRadius: number;
  readonly influenceRadius: number;
  readonly budget: number;
  readonly biomeIndex: number;
  readonly paletteKey: StonePaletteKey;
  readonly valueBase: number;
  readonly mossBias: number;
}

export class StoneClusterField {
  private readonly descriptors = new Map<string, StoneClusterDescriptor>();
  private readonly rockSeed: number;
  private readonly landformScratch: TerrainLandform = createTerrainLandform();
  private readonly hydrologyScratch: HydrologySample = createHydrologySample();
  private readonly pathScratch = new THREE.Vector2();
  private readonly ecologyScratch: WorldEcologySample = createEcologySample();
  private readonly normalScratch = new THREE.Vector3();
  private readonly biomeScratch = createGrassBiomeSample();
  private readonly normalizedReach: number;

  constructor(
    private readonly field: TerrainField,
    private readonly config: WorldConfig,
  ) {
    this.rockSeed = (config.seed ^ STONE_ROCK_SEED_XOR) >>> 0;
    this.normalizedReach = maxNormalizedReach(config.stoneClusterHaloRatio);
  }

  getDescriptor(gridX: number, gridZ: number): StoneClusterDescriptor {
    const key = clusterGridKey(gridX, gridZ);
    const cached = this.descriptors.get(key);
    if (cached) {
      return cached;
    }
    const descriptor = this.createDescriptor(gridX, gridZ);
    if (this.descriptors.size >= STONE_CLUSTER_DESCRIPTOR_CACHE_LIMIT) {
      trimOldestCacheEntries(
        this.descriptors,
        clusterCacheKeepCount(STONE_CLUSTER_DESCRIPTOR_CACHE_LIMIT),
      );
    }
    this.descriptors.set(key, descriptor);
    return descriptor;
  }

  /**
   * Underlying formation likelihood. Surface exposure is ecology.rockiness;
   * this field only answers whether rock is likely in the substrate.
   */
  sampleGeologyPotential(x: number, z: number): number {
    const coarse = this.valueNoise(x / 240, z / 240, this.rockSeed);
    const fine = this.valueNoise(
      (x * 2.7) / 240,
      (z * 2.7) / 240,
      this.rockSeed ^ STONE_GEOLOGY_FINE_SEED_XOR,
    );
    const field = (coarse + fine * 0.4) / 1.4;
    return smoothstep(field, 0.52, 0.78);
  }

  sampleStrike(x: number, z: number): number {
    return (
      this.valueNoise(
        x / STRIKE_PERIOD,
        z / STRIKE_PERIOD,
        this.rockSeed ^ STONE_STRIKE_SEED_XOR,
      ) * Math.PI
    );
  }

  private createDescriptor(gridX: number, gridZ: number): StoneClusterDescriptor {
    const spacing = this.config.stoneClusterSpacing;
    const seed = hashStoneCell(
      gridX,
      gridZ,
      (this.config.seed ^ STONE_CLUSTER_DOMAIN) >>> 0,
    );
    const rng = StoneRandom.fromSeed(seed);
    const jitter = this.config.stoneClusterCenterJitter;
    const centerX =
      (gridX + 0.5 + rng.fork("center-x").signed(jitter)) * spacing;
    const centerZ =
      (gridZ + 0.5 + rng.fork("center-z").signed(jitter)) * spacing;

    const geologyPotential = this.sampleGeologyPotential(centerX, centerZ);
    const height = this.field.sampleHeight(centerX, centerZ);
    const landform = this.field.sampleLandform(
      centerX,
      centerZ,
      this.landformScratch,
    );
    const hydrology = this.field.sampleHydrology(
      centerX,
      centerZ,
      height,
      this.hydrologyScratch,
    );
    const pathDistances = this.field.samplePathDistances(
      centerX,
      centerZ,
      this.pathScratch,
    );
    const ecology = this.field.resolveEcology(
      centerX,
      centerZ,
      height,
      hydrology,
      pathDistances,
      this.ecologyScratch,
    );
    const biome = sampleGrassBiome(centerX, centerZ, this.biomeScratch);
    const biomeIndex = Math.min(
      pickGrassBiomeIndex(centerX, centerZ, biome),
      BIOME_PALETTE.length - 1,
    );
    const surfaceRockiness = ecology.rockiness;
    const surfaceVisibility = 0.18 + 0.82 * surfaceRockiness;
    const pathSurvival = 1 - 0.9 * ecology.disturbance;
    const suitability = clamp01(
      geologyPotential * surfaceVisibility * pathSurvival,
    );

    const densityResponse =
      1 - Math.exp(-this.config.stoneClusterDensityResponse * this.config.stoneDensity);
    const suitabilityResponse = smoothstep(suitability, 0.14, 0.72);
    const activationProbability =
      this.config.stoneClusterChance * densityResponse * suitabilityResponse;
    const active = rng.fork("activation").chance(activationProbability);

    const process = classifyStoneClusterProcess(landform.slope, landform.convexity);
    const strike = this.sampleStrike(centerX, centerZ);
    const normal = this.field.sampleNormal(centerX, centerZ, this.normalScratch);
    const downhillAngle = Math.atan2(normal.z, normal.x);
    let direction: number;
    if (process === "compact") {
      direction = strike + rng.fork("direction").signed(COMPACT_DIRECTION_SPREAD);
    } else if (process === "ridge") {
      direction = strike;
    } else {
      direction = downhillAngle;
    }

    const radiusT = smoothstep(suitability, 0.2, 0.85);
    const baseRadius = lerp(
      this.config.stoneClusterRadiusMin,
      this.config.stoneClusterRadiusMax,
      radiusT,
    );
    const majorRadius = clamp(
      baseRadius * rng.fork("radius").range(0.9, 1.1),
      this.config.stoneClusterRadiusMin,
      this.config.stoneClusterRadiusMax,
    );
    let aspect = rng
      .fork("aspect")
      .range(this.config.stoneClusterAspectMin, this.config.stoneClusterAspectMax);
    if (process === "compact") {
      aspect = lerp(aspect, 0.95, COMPACT_ASPECT_BLEND);
    } else if (process === "scree") {
      aspect = lerp(aspect, this.config.stoneClusterAspectMin, SCREE_ASPECT_BLEND);
    } else if (process === "fan") {
      aspect = lerp(aspect, 0.88, FAN_ASPECT_BLEND);
    }
    const minorRadius = majorRadius * aspect;
    const influenceRadius = majorRadius * this.normalizedReach;

    const budgetT = smoothstep(suitability, 0.25, 0.8);
    const budget = clamp(
      Math.round(
        lerp(
          this.config.stoneClusterBudgetMin,
          this.config.stoneClusterBudgetMax,
          budgetT,
        ),
      ),
      this.config.stoneClusterBudgetMin,
      this.config.stoneClusterBudgetMax,
    );

    const valueBase = rng.fork("value").range(0.96, 1.03);
    const mossBias = rng.fork("moss").range(0.88, 1.12);
    let paletteKey = BIOME_PALETTE[biomeIndex];
    if (
      biomeIndex === 0 &&
      surfaceRockiness < 0.35 &&
      rng.fork("palette-mossy").chance(0.22)
    ) {
      paletteKey = "mossy";
    }

    return {
      gridX,
      gridZ,
      seed,
      active,
      centerX,
      centerZ,
      height,
      geologyPotential,
      surfaceRockiness,
      suitability,
      process,
      strike,
      direction,
      majorRadius,
      minorRadius,
      influenceRadius,
      budget,
      biomeIndex,
      paletteKey,
      valueBase,
      mossBias,
    };
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
}
