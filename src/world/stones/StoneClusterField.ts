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
  CLUSTER_PRIORITY_RANDOM_SHARE,
  clusterCacheKeepCount,
  clusterEnvironmentMossBase,
  clusterGridKey,
  clusterMinimumSeparation,
  clusterWinsConflict,
  COMPACT_ASPECT_BLEND,
  COMPACT_DIRECTION_SPREAD,
  DESCRIPTOR_CACHE_LIMIT,
  DOWNHILL_GRADIENT_EPSILON,
  FAN_ASPECT_BLEND,
  fillClusterConflictNeighbors,
  lerp,
  RAW_CANDIDATE_CACHE_LIMIT,
  SCREE_ASPECT_BLEND,
  smoothstep,
  STONE_CLUSTER_DOMAIN,
  STONE_GEOLOGY_FINE_SEED_XOR,
  STONE_ROCK_SEED_XOR,
  STONE_STRIKE_SEED_XOR,
  STRIKE_PERIOD,
  trimOldestCacheEntries,
  type StoneClusterProcess,
  type StoneMacroCoord,
} from "./StoneClusterTuning";

export interface StoneClusterCandidate {
  readonly gridX: number;
  readonly gridZ: number;
  readonly seed: number;
  readonly centerX: number;
  readonly centerZ: number;
  readonly height: number;
  readonly geologyPotential: number;
  readonly moisture: number;
  readonly fertility: number;
  readonly exposure: number;
  readonly disturbance: number;
  readonly surfaceRockiness: number;
  readonly landformSlope: number;
  readonly landformConvexity: number;
  readonly landformGradientX: number;
  readonly landformGradientZ: number;
  readonly suitability: number;
  readonly rawActive: boolean;
  readonly priority: number;
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
  readonly mossBase: number;
  readonly mossBias: number;
}

export interface StoneClusterDescriptor extends StoneClusterCandidate {
  readonly active: boolean;
}

/**
 * Macro geological lattice for world stones.
 *
 * Raw candidates are independent of neighbors. Final descriptors apply
 * eight-neighbor conflict suppression. Terrain and ecology are sampled once
 * per uncached raw candidate at the jittered center.
 */
export class StoneClusterField {
  private readonly rawCandidates = new Map<string, StoneClusterCandidate>();
  private readonly descriptors = new Map<string, StoneClusterDescriptor>();
  private readonly rockSeed: number;
  private readonly landformScratch: TerrainLandform = createTerrainLandform();
  private readonly hydrologyScratch: HydrologySample = createHydrologySample();
  private readonly pathScratch = new THREE.Vector2();
  private readonly ecologyScratch: WorldEcologySample = createEcologySample();
  private readonly biomeScratch = createGrassBiomeSample();
  private readonly conflictScratch: StoneMacroCoord[] = [];
  private readonly conflictNeighborX = new Int32Array(8);
  private readonly conflictNeighborZ = new Int32Array(8);

  constructor(
    private readonly field: TerrainField,
    private readonly config: WorldConfig,
  ) {
    this.rockSeed = (config.seed ^ STONE_ROCK_SEED_XOR) >>> 0;
  }

  getRawCandidate(gridX: number, gridZ: number): StoneClusterCandidate {
    const key = clusterGridKey(gridX, gridZ);
    const cached = this.rawCandidates.get(key);
    if (cached) {
      return cached;
    }
    const candidate = this.createRawCandidate(gridX, gridZ);
    if (this.rawCandidates.size >= RAW_CANDIDATE_CACHE_LIMIT) {
      trimOldestCacheEntries(
        this.rawCandidates,
        clusterCacheKeepCount(RAW_CANDIDATE_CACHE_LIMIT),
      );
    }
    this.rawCandidates.set(key, candidate);
    return candidate;
  }

  getDescriptor(gridX: number, gridZ: number): StoneClusterDescriptor {
    const key = clusterGridKey(gridX, gridZ);
    const cached = this.descriptors.get(key);
    if (cached) {
      return cached;
    }
    const raw = this.getRawCandidate(gridX, gridZ);
    const descriptor: StoneClusterDescriptor = {
      ...raw,
      active: raw.rawActive && this.winsConflict(raw),
    };
    if (this.descriptors.size >= DESCRIPTOR_CACHE_LIMIT) {
      trimOldestCacheEntries(
        this.descriptors,
        clusterCacheKeepCount(DESCRIPTOR_CACHE_LIMIT),
      );
    }
    this.descriptors.set(key, descriptor);
    return descriptor;
  }

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

  private winsConflict(raw: StoneClusterCandidate): boolean {
    const count = fillClusterConflictNeighbors(
      raw.gridX,
      raw.gridZ,
      this.conflictScratch,
    );
    for (let index = 0; index < count; index += 1) {
      const slot = this.conflictScratch[index];
      this.conflictNeighborX[index] = slot.gridX;
      this.conflictNeighborZ[index] = slot.gridZ;
    }
    const spacing = this.config.stoneClusterSpacing;
    for (let index = 0; index < count; index += 1) {
      const neighbor = this.getRawCandidate(
        this.conflictNeighborX[index],
        this.conflictNeighborZ[index],
      );
      if (!neighbor.rawActive) {
        continue;
      }
      const distance = Math.hypot(
        raw.centerX - neighbor.centerX,
        raw.centerZ - neighbor.centerZ,
      );
      const minimum = clusterMinimumSeparation(
        spacing,
        raw.influenceRadius,
        neighbor.influenceRadius,
      );
      if (distance >= minimum) {
        continue;
      }
      if (
        !clusterWinsConflict(
          raw.priority,
          raw.gridX,
          raw.gridZ,
          neighbor.priority,
          neighbor.gridX,
          neighbor.gridZ,
        )
      ) {
        return false;
      }
    }
    return true;
  }

  private createRawCandidate(
    gridX: number,
    gridZ: number,
  ): StoneClusterCandidate {
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
    // Hydrology must run before landform. `sampleHeight` leaves a same-point
    // carve cache that `sampleHydrology` consumes; landform lattice misses
    // call `sampleHeight` at other points and would make moisture depend on
    // whether those lattice cells were already memoized.
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
    const landform = this.field.sampleLandform(
      centerX,
      centerZ,
      this.landformScratch,
    );
    const landformSnapshot: TerrainLandform = {
      convexity: landform.convexity,
      slope: landform.slope,
      gradientX: landform.gradientX,
      gradientZ: landform.gradientZ,
    };
    const ecology = this.field.resolveEcologyFromLandform(
      height,
      landformSnapshot,
      hydrology,
      pathDistances,
      this.ecologyScratch,
    );
    const moisture = ecology.moisture;
    const fertility = ecology.fertility;
    const exposure = ecology.exposure;
    const disturbance = ecology.disturbance;
    const surfaceRockiness = ecology.rockiness;
    const biome = sampleGrassBiome(centerX, centerZ, this.biomeScratch);
    const biomeIndex = pickGrassBiomeIndex(centerX, centerZ, biome);
    const suitability = clamp01(
      geologyPotential *
        (0.18 + 0.82 * surfaceRockiness) *
        (1 - 0.9 * disturbance),
    );

    const densityResponse =
      1 -
      Math.exp(
        -this.config.stoneClusterDensityResponse * this.config.stoneDensity,
      );
    const suitabilityResponse = smoothstep(suitability, 0.14, 0.72);
    const rawActive = rng
      .fork("activation")
      .chance(
        clamp01(
          this.config.stoneClusterChance * densityResponse * suitabilityResponse,
        ),
      );
    const priority =
      suitability * (1 - CLUSTER_PRIORITY_RANDOM_SHARE) +
      rng.fork("priority").next() * CLUSTER_PRIORITY_RANDOM_SHARE;

    const process = classifyStoneClusterProcess(
      landformSnapshot.slope,
      landformSnapshot.convexity,
    );
    const strike = this.sampleStrike(centerX, centerZ);
    const gradientLength = Math.hypot(
      landformSnapshot.gradientX,
      landformSnapshot.gradientZ,
    );
    const downhillAngle =
      gradientLength >= DOWNHILL_GRADIENT_EPSILON
        ? Math.atan2(-landformSnapshot.gradientZ, -landformSnapshot.gradientX)
        : strike;
    const directionJitter = rng.fork("direction").signed(COMPACT_DIRECTION_SPREAD);
    let direction: number;
    if (process === "compact") {
      direction = strike + directionJitter;
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
    const influenceRadius = majorRadius * this.config.stoneClusterHaloRatio;

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

    const valueBase = rng.fork("value-base").range(0.97, 1.03);
    const mossBias = rng.fork("moss-bias").range(0.9, 1.1);
    const mossyHit = rng
      .fork("mossy-palette")
      .chance(clamp01(0.1 + moisture * 0.22 - exposure * 0.08));
    let paletteKey = BIOME_PALETTE[biomeIndex] ?? BIOME_PALETTE[0];
    if (paletteKey === "meadowSage" && moisture >= 0.42 && mossyHit) {
      paletteKey = "mossy";
    }

    return {
      gridX,
      gridZ,
      seed,
      centerX,
      centerZ,
      height,
      geologyPotential,
      moisture,
      fertility,
      exposure,
      disturbance,
      surfaceRockiness,
      landformSlope: landformSnapshot.slope,
      landformConvexity: landformSnapshot.convexity,
      landformGradientX: landformSnapshot.gradientX,
      landformGradientZ: landformSnapshot.gradientZ,
      suitability,
      rawActive,
      priority,
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
      mossBase: clusterEnvironmentMossBase(
        height,
        moisture,
        exposure,
        surfaceRockiness,
        this.config.grassMinAltitude,
        this.config.grassMaxAltitude,
      ),
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
