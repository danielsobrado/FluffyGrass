import * as THREE from "three";
import type { GrassConfig } from "../../grass/GrassConfig";
import {
  resolveGrassCanopyAo,
  sampleGrassMacroVigor,
} from "../../grass/GrassFieldVariation";
import { GrassGeometryFactory } from "../../grass/GrassGeometryFactory";
import { SeededRandom } from "../../grass/internal/SeededRandom";
import type { GrassNearMaterial } from "../../grass/materials/GrassNearMaterial";
import {
  GRASS_BIOME_PROFILES,
  GRASS_BIOME_VERSION,
} from "../../grass/biome/GrassBiomeProfile";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import { sampleStoneGrassClearance } from "../stones/StoneClearance";
import { TERRAIN_NORMAL_STEP, type TerrainField } from "../TerrainField";
import { TerrainHeightLattice } from "../TerrainHeightLattice";
import type { WorldConfig } from "../WorldConfig";
import {
  createGrassHabitatSample,
  resolveGrassClusterArchetype,
  sampleGrassHabitat,
  type GrassHabitatSample,
} from "./GrassHabitatField";
import {
  createGrassClusterProfile,
  mixGrassAngle,
  resolveGrassClusterCoverage,
  resolveGrassClusterProfile,
  type GrassClusterProfile,
} from "./GrassClusterProfile";
import {
  calculateGrassBladeCurveReach,
  calculateGrassSingleBladeRootBoundsRadius,
  resolveGrassBladeArcPoint,
} from "./GrassRuntimeMath";
import {
  createGrassBiomeSample,
  pickGrassBiomeIndex,
  resolveGrassBiomeDensity,
  sampleGrassBiome,
  type GrassBiomeSample,
} from "./WorldBiomeField";

export interface WorldSingleBladeTile {
  key: number;
  tileX: number;
  tileZ: number;
  mesh: THREE.InstancedMesh;
  bladeCount: number;
  /**
   * Every blade's LOD dither, ascending, matching the instance order in the
   * buffers. The vertex shader keeps a blade when `dither <= coverage`, so with
   * the instances sorted the survivors are always a prefix and the draw can be
   * truncated with `mesh.count` instead of submitting blades that the shader
   * would only collapse to zero area.
   */
  sortedDithers: Float32Array;
  /** Reference-counted placement data shared by complementary near layers. */
  placementKey: string;
}

export interface WorldSingleBladeTileBuildOptions {
  key: number;
  tileX: number;
  tileZ: number;
  densityMultiplier: number;
  bladeSegments: number;
  receiveShadows: boolean;
  seedSalt: number;
  namePrefix: string;
  material: GrassNearMaterial;
}

export interface WorldSingleBladeTileBuildJob {
  options: WorldSingleBladeTileBuildOptions;
  placementKey: string;
  stage: TileBuildStage;
  cachedPlacement?: WorldSingleBladePlacement;
  requestedCount: number;
  columns: number;
  rows: number;
  cellWidth: number;
  cellDepth: number;
  originX: number;
  originZ: number;
  tileCenterX: number;
  tileCenterZ: number;
  random: SeededRandom;
  matrixValues: Float32Array;
  variations: Float32Array;
  coverages: Float32Array;
  biomes: Float32Array;
  bounds: THREE.Box3;
  nextIndex: number;
  bladeCount: number;
  /** Cached heights for this tile's normals; see {@link TerrainHeightLattice}. */
  heightLattice?: TerrainHeightLattice;
  sortOrder?: Uint32Array;
  sortScratch?: Uint32Array;
  dithers?: Float32Array;
  ditherBits?: Uint32Array;
  radixCounts?: Uint32Array;
  radixOffsets?: Uint32Array;
  radixPass: number;
  finalizeIndex: number;
  sortedDithers?: Float32Array;
  reorderVisited?: Uint8Array;
  reorderMatrixScratch?: Float32Array;
  reorderVariationScratch?: Float32Array;
  reorderCycleStart?: number;
  reorderCycleTarget?: number;
  reorderCoverageScratch?: number;
  reorderBiomeScratch?: number;
  centerY: number;
}

export interface WorldSingleBladeTileBuildResult {
  complete: boolean;
  tile?: WorldSingleBladeTile;
  /** The placement completed successfully but contains no drawable blades. */
  empty?: boolean;
}

const TWO_PI = Math.PI * 2;
const MIN_SUITABILITY = 0.08;
/**
 * Cells per axis in a tuft. Grass does not grow on a lattice: it grows in
 * tufts whose blades share a root, fan outwards, and match each other in
 * height. A jittered grid of independently oriented blades is uniform at every
 * scale above one blade, and that uniformity is the single largest structural
 * difference between this field and a hand-authored one.
 */
const CLUMP_CELLS = 3;
const CLUMP_CENTER_JITTER = 0.15;
const CLUMP_RADIUS_SALT = 0x5b;
const CLUMP_ASPECT_SALT = 0x6d;
const CLUMP_ELLIPSE_ANGLE_SALT = 0x7f;
const CLUMP_DIRECTION_SALT = 0x91;
const CLUMP_LEAN_SALT = 0xa5;
const CLUMP_TALL_GROUP_SALT = 0xb7;
const CLUMP_ASYMMETRY_SALT = 0xc9;
const CLUMP_HOLE_SALT = 0xdb;
const CLUMP_HEIGHT_SALT = 0x4f;
const CLUMP_PLANE_SALT = 0xed;
/**
 * Furthest a blade can end up from the cell that enumerated it, in cells: half
 * the block it belongs to, plus the tuft centre's own wander, plus the tuft's
 * own reach. The cached height lattice is grown by this so a tufted blade still
 * samples its normal from inside the cached area.
 */
function resolveClumpMaxCellOffset(config: WorldConfig): number {
  const longestAxis = Math.max(
    config.grassClumpAspectMax,
    1 / config.grassClumpAspectMin,
  );
  return (
    (CLUMP_CELLS - 1) * 0.5 +
    CLUMP_CENTER_JITTER * CLUMP_CELLS +
    config.grassClumpRadiusScaleMax * CLUMP_CELLS * longestAxis
  );
}
const HEIGHT_LATTICE_SPACING = TERRAIN_NORMAL_STEP * 0.5;
const LATTICE_SUITABILITY_TOLERANCE = 0.05;
const DEADLINE_CHECK_INTERVAL = 256;
const INSTANCE_HORIZONTAL_SCALE_MAX = 1.2;
const INSTANCE_VERTICAL_SCALE_MIN = 0.3;
const INSTANCE_VERTICAL_SCALE_MAX = 1.22;
const MAXIMUM_ART_WIND_SCALE = 2;
const MAXIMUM_INSTANCE_WIND_SCALE = 1.16;
const MAXIMUM_WIND_STIFFNESS = 1.12;
const INTERACTION_VERTICAL_SCALE = 0.2;
const BOUNDS_SAFETY_MARGIN = 0.08;
// 0.5 * 0.754877666 + 0.5 * 0.569840296 — the constant part of the vertex
// shader's dither for single-blade geometry, whose shade and phase are both 0.5.
const SINGLE_BLADE_DITHER_BIAS = 0.662358981;
/** Bump whenever placement transforms or stable per-blade morphology changes. */
const GRASS_PLACEMENT_VERSION = 9;
const EMPTY_PLACEMENT_CACHE_LIMIT = 4096;
const PLACEMENT_LRU_LIMIT = 12;

type TileBuildStage =
  | "lattice"
  | "sampling"
  | "prepare-sort"
  | "prepare-dithers"
  | "radix-count"
  | "radix-scatter"
  | "reorder"
  | "center"
  | "mesh";

interface TileBuildBuffers {
  matrixValues: Float32Array;
  variations: Float32Array;
  coverages: Float32Array;
  biomes: Float32Array;
}

interface WorldSingleBladePlacement extends TileBuildBuffers {
  key: string;
  bladeCount: number;
  sortedDithers: Float32Array;
  instanceMatrix: THREE.InstancedBufferAttribute;
  variationAttribute: THREE.InstancedBufferAttribute;
  coverageAttribute: THREE.InstancedBufferAttribute;
  biomeAttribute: THREE.InstancedBufferAttribute;
  origin: THREE.Vector3;
  localBounds: THREE.Box3;
  boundingSphere: THREE.Sphere;
  references: number;
}

export class WorldSingleBladeTileFactory {
  private readonly geometryFactory = new GrassGeometryFactory();
  private readonly sourceGeometries = new Map<number, THREE.BufferGeometry>();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly normal = new THREE.Vector3();
  private readonly align = new THREE.Quaternion();
  private readonly yaw = new THREE.Quaternion();
  private readonly lean = new THREE.Quaternion();
  private readonly leanAxis = new THREE.Vector3();
  private readonly position = new THREE.Vector3();
  private readonly localPosition = new THREE.Vector3();
  private readonly scale = new THREE.Vector3();
  private readonly matrix = new THREE.Matrix4();
  private readonly biomeSample: GrassBiomeSample = createGrassBiomeSample();
  private readonly habitatSample: GrassHabitatSample = createGrassHabitatSample();
  private readonly clusterProfile: GrassClusterProfile = createGrassClusterProfile();
  private readonly placementCache = new Map<string, WorldSingleBladePlacement>();
  private readonly placementLru = new Map<string, WorldSingleBladePlacement>();
  private readonly emptyPlacementCache = new Map<string, true>();
  private readonly buildBufferPool = new Map<number, TileBuildBuffers[]>();
  private readonly latticePool: TerrainHeightLattice[] = [];
  private readonly sourceBladeHeight: number;

  constructor(
    private readonly field: TerrainField,
    private readonly worldConfig: WorldConfig,
    private readonly profile: RuntimeProfile,
    private readonly grassConfig: GrassConfig,
  ) {
    this.sourceBladeHeight =
      (grassConfig.geometry.bladeHeightMin +
        grassConfig.geometry.bladeHeightMax) *
      0.5;
  }

  beginBuild(
    options: WorldSingleBladeTileBuildOptions,
    cachedOnly = false,
  ): WorldSingleBladeTileBuildJob | null | undefined {
    if (options.densityMultiplier <= 0) {
      return undefined;
    }

    const tileSize = this.worldConfig.grassNearTileSize;
    const baseDensity = this.profile.compact
      ? this.worldConfig.grassNearBladesPerSquareMeterCompact
      : this.worldConfig.grassNearBladesPerSquareMeterDesktop;
    const requestedCount = Math.max(
      1,
      Math.round(
        tileSize * tileSize * baseDensity * options.densityMultiplier,
      ),
    );
    const placementKey = this.createPlacementKey(options);
    let cachedPlacement = this.placementCache.get(placementKey);
    if (!cachedPlacement) {
      cachedPlacement = this.placementLru.get(placementKey);
      if (cachedPlacement) {
        this.placementLru.delete(placementKey);
        this.rehydratePlacement(cachedPlacement);
        this.placementCache.set(placementKey, cachedPlacement);
      }
    }
    if (cachedPlacement) {
      return {
        options,
        placementKey,
        stage: "mesh",
        cachedPlacement,
        requestedCount,
        columns: 0,
        rows: 0,
        cellWidth: 0,
        cellDepth: 0,
        originX: 0,
        originZ: 0,
        tileCenterX: cachedPlacement.origin.x,
        tileCenterZ: cachedPlacement.origin.z,
        random: new SeededRandom(0),
        matrixValues: cachedPlacement.matrixValues,
        variations: cachedPlacement.variations,
        coverages: cachedPlacement.coverages,
        biomes: cachedPlacement.biomes,
        bounds: cachedPlacement.localBounds,
        nextIndex: requestedCount,
        bladeCount: cachedPlacement.bladeCount,
        radixPass: 0,
        finalizeIndex: 0,
        centerY: cachedPlacement.origin.y,
      };
    }
    if (this.emptyPlacementCache.has(placementKey)) {
      this.emptyPlacementCache.delete(placementKey);
      this.emptyPlacementCache.set(placementKey, true);
      return null;
    }
    if (cachedOnly) {
      return undefined;
    }
    const columns = Math.ceil(Math.sqrt(requestedCount));
    const rows = Math.ceil(requestedCount / columns);
    const cellWidth = tileSize / columns;
    const cellDepth = tileSize / rows;
    const originX = options.tileX * tileSize;
    const originZ = options.tileZ * tileSize;
    const tileCenterX = originX + tileSize * 0.5;
    const tileCenterZ = originZ + tileSize * 0.5;
    const latticeMargin =
      TERRAIN_NORMAL_STEP +
      resolveClumpMaxCellOffset(this.worldConfig) *
        Math.max(cellWidth, cellDepth);
    const heightLattice = this.latticePool.pop() ?? new TerrainHeightLattice();
    heightLattice.beginBuild(
      this.field,
      originX - latticeMargin,
      originZ - latticeMargin,
      tileSize + latticeMargin * 2,
      HEIGHT_LATTICE_SPACING,
    );
    const buffers = this.acquireBuildBuffers(requestedCount);
    return {
      options,
      placementKey,
      stage: "lattice",
      requestedCount,
      columns,
      rows,
      cellWidth,
      cellDepth,
      originX,
      originZ,
      tileCenterX,
      tileCenterZ,
      random: new SeededRandom(
        this.hash(
          options.tileX,
          options.tileZ,
          this.worldConfig.seed ^ options.seedSalt,
        ),
      ),
      matrixValues: buffers.matrixValues,
      variations: buffers.variations,
      coverages: buffers.coverages,
      biomes: buffers.biomes,
      bounds: new THREE.Box3(),
      nextIndex: 0,
      bladeCount: 0,
      heightLattice,
      radixPass: 0,
      finalizeIndex: 0,
      centerY: 0,
    };
  }

  advanceBuild(
    job: WorldSingleBladeTileBuildJob,
    deadline: number,
  ): WorldSingleBladeTileBuildResult {
    if (job.cachedPlacement) {
      return {
        complete: true,
        tile: this.createTile(job.options, job.cachedPlacement),
      };
    }

    if (job.stage === "lattice") {
      if (!job.heightLattice?.advanceBuild(deadline)) {
        return { complete: false };
      }
      job.stage = "sampling";
      return this.continueBuild(job, deadline);
    }

    if (job.stage === "sampling") {
      if (!this.advanceSampling(job, deadline)) {
        return { complete: false };
      }
      if (job.heightLattice) {
        this.latticePool.push(job.heightLattice);
        job.heightLattice = undefined;
      }
      if (job.bladeCount === 0) {
        this.releaseBuildBuffers(job.requestedCount, job);
        this.rememberEmptyPlacement(job.placementKey);
        return { complete: true, empty: true };
      }
      job.stage = "prepare-sort";
      return this.continueBuild(job, deadline);
    }

    return this.advanceFinalize(job, deadline);
  }

  private advanceSampling(
    job: WorldSingleBladeTileBuildJob,
    deadline: number,
  ): boolean {
    const heightLattice = job.heightLattice;
    if (!heightLattice) {
      throw new Error(`Grass tile ${job.options.key} has no height lattice.`);
    }
    let processed = 0;
    while (
      job.nextIndex < job.requestedCount &&
      (processed === 0 ||
        processed % DEADLINE_CHECK_INTERVAL !== 0 ||
        performance.now() < deadline)
    ) {
      const index = job.nextIndex;
      job.nextIndex += 1;
      processed += 1;
      const column = index % job.columns;
      const row = Math.floor(index / job.columns);
      const globalColumn = job.options.tileX * job.columns + column;
      const globalRow = job.options.tileZ * job.rows + row;
      const clumpColumn = Math.floor(globalColumn / CLUMP_CELLS);
      const clumpRow = Math.floor(globalRow / CLUMP_CELLS);
      const clumpSpanX = job.cellWidth * CLUMP_CELLS;
      const clumpSpanZ = job.cellDepth * CLUMP_CELLS;
      const clumpCenterX =
        (clumpColumn + 0.5) * clumpSpanX +
        (this.clumpValue(clumpColumn, clumpRow, 0x1f) - 0.5) *
          2 *
          CLUMP_CENTER_JITTER *
          clumpSpanX;
      const clumpCenterZ =
        (clumpRow + 0.5) * clumpSpanZ +
        (this.clumpValue(clumpColumn, clumpRow, 0x2b) - 0.5) *
          2 *
          CLUMP_CENTER_JITTER *
          clumpSpanZ;
      const radiusScale =
        this.worldConfig.grassClumpRadiusScaleMin +
        (this.worldConfig.grassClumpRadiusScaleMax -
          this.worldConfig.grassClumpRadiusScaleMin) *
          this.clumpValue(clumpColumn, clumpRow, CLUMP_RADIUS_SALT);
      const aspect =
        this.worldConfig.grassClumpAspectMin +
        (this.worldConfig.grassClumpAspectMax -
          this.worldConfig.grassClumpAspectMin) *
          this.clumpValue(clumpColumn, clumpRow, CLUMP_ASPECT_SALT);
      const ellipseAngle =
        this.clumpValue(clumpColumn, clumpRow, CLUMP_ELLIPSE_ANGLE_SALT) *
        TWO_PI;
      const dominantAngle =
        this.clumpValue(clumpColumn, clumpRow, CLUMP_DIRECTION_SALT) * TWO_PI;
      const sampleAngle = job.random.range(0, TWO_PI);
      const sampleRadius = Math.pow(
        job.random.next(),
        this.worldConfig.grassClumpRadialExponent,
      );
      const ellipseX =
        Math.cos(sampleAngle) * sampleRadius * radiusScale * clumpSpanX * aspect;
      const ellipseZ =
        (Math.sin(sampleAngle) * sampleRadius * radiusScale * clumpSpanZ) /
        aspect;
      const ellipseCos = Math.cos(ellipseAngle);
      const ellipseSin = Math.sin(ellipseAngle);
      const offsetX = ellipseX * ellipseCos - ellipseZ * ellipseSin;
      const offsetZ = ellipseX * ellipseSin + ellipseZ * ellipseCos;
      const x = clumpCenterX + offsetX;
      const z = clumpCenterZ + offsetZ;
      const height = this.field.sampleHeight(x, z);
      const suitabilityWithoutSlope =
        this.field.sampleGrassSuitabilityWithoutSlope(x, z, height);
      if (suitabilityWithoutSlope < MIN_SUITABILITY) {
        continue;
      }
      const pathMask = this.field.samplePathGrassMask(x, z, height);
      if (pathMask <= 0) {
        continue;
      }
      const stoneMask = sampleStoneGrassClearance(x, z);
      if (stoneMask <= 0.02) {
        continue;
      }
      heightLattice.sampleNormal(x, z, TERRAIN_NORMAL_STEP, this.normal);
      const suitability =
        this.field.sampleGrassSlopeMask(this.normal) *
        suitabilityWithoutSlope *
        pathMask *
        stoneMask;
      if (suitability < MIN_SUITABILITY - LATTICE_SUITABILITY_TOLERANCE) {
        continue;
      }

      const biomeSample = sampleGrassBiome(x, z, this.biomeSample);
      const biomeIndex = pickGrassBiomeIndex(x, z, biomeSample);
      const biomeProfile = GRASS_BIOME_PROFILES[biomeIndex];
      const ecology = this.field.sampleEcologyAt(x, z, height);
      sampleGrassHabitat(
        x,
        z,
        ecology,
        resolveGrassBiomeDensity(biomeSample),
        biomeProfile.heightBand[0],
        biomeProfile.heightBand[1],
        biomeProfile.drynessBias,
        biomeProfile.accentDensity,
        this.worldConfig,
        this.habitatSample,
      );
      const archetype = resolveGrassClusterArchetype(
        this.habitatSample,
        clumpColumn,
        clumpRow,
        this.worldConfig.seed,
      );
      const tallGroup = this.clumpValue(
        clumpColumn,
        clumpRow,
        CLUMP_TALL_GROUP_SALT,
      );
      const gapIdentity = this.clumpValue(
        clumpColumn,
        clumpRow,
        CLUMP_HOLE_SALT,
      );
      resolveGrassClusterProfile(
        archetype,
        this.habitatSample,
        this.clumpValue(clumpColumn, clumpRow, CLUMP_HEIGHT_SALT),
        tallGroup,
        this.clumpValue(clumpColumn, clumpRow, CLUMP_ASYMMETRY_SALT),
        this.worldConfig,
        this.clusterProfile,
      );

      this.position.set(
        x,
        height - this.grassConfig.distribution.rootSink,
        z,
      );
      job.bounds.expandByPoint(this.position);
      this.align.setFromUnitVectors(this.up, this.normal);
      const radialLength = Math.hypot(offsetX, offsetZ);
      const dominantX = Math.sin(dominantAngle);
      const dominantZ = Math.cos(dominantAngle);
      const radialX = radialLength > 1e-4 ? offsetX / radialLength : dominantX;
      const radialZ = radialLength > 1e-4 ? offsetZ / radialLength : dominantZ;
      const independentAngle = job.random.range(0, TWO_PI);
      const dominantWeight =
        this.worldConfig.grassClumpDominantDirectionWeight;
      const radialWeight = this.worldConfig.grassClumpRadialDirectionWeight;
      const independentWeight = 1 - dominantWeight - radialWeight;
      const headingX =
        dominantX * dominantWeight +
        radialX * radialWeight +
        Math.sin(independentAngle) * independentWeight;
      const headingZ =
        dominantZ * dominantWeight +
        radialZ * radialWeight +
        Math.cos(independentAngle) * independentWeight;
      const leanAngle =
        Math.hypot(headingX, headingZ) > 1e-4
          ? Math.atan2(headingX, headingZ)
          : dominantAngle;
      const planeYaw = mixGrassAngle(
        job.random.range(0, TWO_PI),
        this.clumpValue(clumpColumn, clumpRow, CLUMP_PLANE_SALT) * TWO_PI,
        this.clusterProfile.planeCoherence,
      );
      const leanMin = this.grassConfig.geometry.bladeLeanMin;
      const leanMax = this.grassConfig.geometry.bladeLeanMax;
      const sharedLean =
        leanMin +
        (leanMax - leanMin) *
          (this.clumpValue(clumpColumn, clumpRow, CLUMP_LEAN_SALT) * 0.62 +
            this.habitatSample.directionalLean * 0.38);
      const shapedLean = THREE.MathUtils.lerp(
        sharedLean,
        leanMax,
        this.clusterProfile.leanTowardMax,
      );
      const leanDistance = THREE.MathUtils.clamp(
        shapedLean *
          this.clusterProfile.leanScale *
          job.random.range(0.92, 1.08),
        leanMin,
        leanMax,
      );
      const leanRotation = Math.atan2(
        (leanDistance * INSTANCE_HORIZONTAL_SCALE_MAX) /
          INSTANCE_VERTICAL_SCALE_MAX,
        this.sourceBladeHeight,
      );
      this.yaw.setFromAxisAngle(this.up, planeYaw);
      this.leanAxis.set(Math.cos(leanAngle), 0, -Math.sin(leanAngle));
      this.lean.setFromAxisAngle(this.leanAxis, leanRotation);
      this.align.multiply(this.lean).multiply(this.yaw);

      const vigor = sampleGrassMacroVigor(x, z);
      const bladeTier = job.random.next();
      const isAccentBlade =
        this.clusterProfile.accentShare > 0 &&
        bladeTier >= 1 - this.clusterProfile.accentShare;
      const tierScale = isAccentBlade
        ? this.worldConfig.grassAccentHeightScale
        : bladeTier < this.clusterProfile.understoryShare
          ? this.worldConfig.grassUnderstoryHeightScale
          : this.worldConfig.grassMainHeightScale;
      const side =
        radialLength > 1e-4
          ? (offsetX * dominantZ - offsetZ * dominantX) / radialLength
          : 0;
      const sideHeight =
        1 - this.clusterProfile.asymmetry * Math.max(0, side);
      const heightJitter = this.worldConfig.grassBladeHeightJitter;
      const verticalScale = THREE.MathUtils.clamp(
        this.clusterProfile.heightScale *
          tierScale *
          sideHeight *
          job.random.range(1 - heightJitter, 1 + heightJitter),
        INSTANCE_VERTICAL_SCALE_MIN,
        INSTANCE_VERTICAL_SCALE_MAX,
      );
      const horizontalScale = THREE.MathUtils.clamp(
        this.clusterProfile.heightScale *
          job.random.range(...biomeProfile.widthBand) *
          this.clusterProfile.widthScale,
        0.76,
        INSTANCE_HORIZONTAL_SCALE_MAX,
      );
      this.scale.set(
        horizontalScale,
        verticalScale,
        THREE.MathUtils.clamp(
          this.clusterProfile.heightScale *
            job.random.range(...biomeProfile.widthBand) *
            this.clusterProfile.widthScale,
          0.76,
          INSTANCE_HORIZONTAL_SCALE_MAX,
        ),
      );
      this.localPosition.set(
        this.position.x - job.tileCenterX,
        this.position.y,
        this.position.z - job.tileCenterZ,
      );
      this.matrix.compose(this.localPosition, this.align, this.scale);
      this.matrix.toArray(job.matrixValues, job.bladeCount * 16);
      const variationOffset = job.bladeCount * 4;
      job.variations[variationOffset] = job.random.next();
      job.variations[variationOffset + 1] =
        job.random.range(0.84, 1.16) * biomeProfile.windDamping;
      job.variations[variationOffset + 2] =
        resolveGrassCanopyAo(vigor, suitability) *
        job.random.range(0.992, 1.008);
      let dryness =
        this.habitatSample.dryness * this.clusterProfile.drynessScale +
        this.clusterProfile.drynessOffset;
      if (isAccentBlade && tallGroup > 0.7 && dryness > 0.12) {
        dryness = Math.min(1, dryness + 0.14);
      }
      job.variations[variationOffset + 3] = THREE.MathUtils.clamp(
        dryness + job.random.range(-0.008, 0.008),
        0,
        1,
      );
      const clusterCoverage = resolveGrassClusterCoverage(
        this.clusterProfile,
        sampleRadius,
        sampleAngle,
        gapIdentity,
      );
      job.coverages[job.bladeCount] =
        this.habitatSample.density *
        pathMask *
        stoneMask *
        clusterCoverage;
      job.biomes[job.bladeCount] = biomeIndex;
      job.bladeCount += 1;
    }

    return job.nextIndex >= job.requestedCount;
  }

  private advanceFinalize(
    job: WorldSingleBladeTileBuildJob,
    deadline: number,
  ): WorldSingleBladeTileBuildResult {
    if (job.stage === "prepare-sort") {
      job.sortOrder = new Uint32Array(job.bladeCount);
      job.sortScratch = new Uint32Array(job.bladeCount);
      job.dithers = new Float32Array(job.bladeCount);
      job.ditherBits = new Uint32Array(
        job.dithers.buffer,
        job.dithers.byteOffset,
        job.dithers.length,
      );
      job.radixCounts = new Uint32Array(256);
      job.radixOffsets = new Uint32Array(256);
      job.finalizeIndex = 0;
      job.stage = "prepare-dithers";
      return this.continueBuild(job, deadline);
    }

    if (job.stage === "prepare-dithers") {
      const order = job.sortOrder;
      const dithers = job.dithers;
      if (!order || !dithers) {
        throw new Error(`Grass tile ${job.options.key} has no sort storage.`);
      }
      const ditherSeed = job.options.material.getDitherSeed();
      let processed = 0;
      while (
        job.finalizeIndex < job.bladeCount &&
        (processed === 0 ||
          processed % DEADLINE_CHECK_INTERVAL !== 0 ||
          performance.now() < deadline)
      ) {
        const index = job.finalizeIndex;
        order[index] = index;
        const value =
          SINGLE_BLADE_DITHER_BIAS +
          job.variations[index * 4] +
          ditherSeed;
        dithers[index] = value - Math.floor(value);
        job.finalizeIndex += 1;
        processed += 1;
      }
      if (job.finalizeIndex < job.bladeCount) {
        return { complete: false };
      }
      job.finalizeIndex = 0;
      job.radixCounts?.fill(0);
      job.stage = "radix-count";
      return this.continueBuild(job, deadline);
    }

    if (job.stage === "radix-count") {
      const order = job.sortOrder;
      const bits = job.ditherBits;
      const counts = job.radixCounts;
      const offsets = job.radixOffsets;
      if (!order || !bits || !counts || !offsets) {
        throw new Error(`Grass tile ${job.options.key} has incomplete radix state.`);
      }
      const shift = job.radixPass * 8;
      let processed = 0;
      while (
        job.finalizeIndex < job.bladeCount &&
        (processed === 0 ||
          processed % DEADLINE_CHECK_INTERVAL !== 0 ||
          performance.now() < deadline)
      ) {
        const source = order[job.finalizeIndex];
        counts[(bits[source] >>> shift) & 0xff] += 1;
        job.finalizeIndex += 1;
        processed += 1;
      }
      if (job.finalizeIndex < job.bladeCount) {
        return { complete: false };
      }
      let offset = 0;
      for (let bucket = 0; bucket < counts.length; bucket += 1) {
        offsets[bucket] = offset;
        offset += counts[bucket];
      }
      job.finalizeIndex = 0;
      job.stage = "radix-scatter";
      return this.continueBuild(job, deadline);
    }

    if (job.stage === "radix-scatter") {
      const order = job.sortOrder;
      const scratch = job.sortScratch;
      const bits = job.ditherBits;
      const offsets = job.radixOffsets;
      if (!order || !scratch || !bits || !offsets) {
        throw new Error(`Grass tile ${job.options.key} has incomplete radix state.`);
      }
      const shift = job.radixPass * 8;
      let processed = 0;
      while (
        job.finalizeIndex < job.bladeCount &&
        (processed === 0 ||
          processed % DEADLINE_CHECK_INTERVAL !== 0 ||
          performance.now() < deadline)
      ) {
        const source = order[job.finalizeIndex];
        const bucket = (bits[source] >>> shift) & 0xff;
        scratch[offsets[bucket]] = source;
        offsets[bucket] += 1;
        job.finalizeIndex += 1;
        processed += 1;
      }
      if (job.finalizeIndex < job.bladeCount) {
        return { complete: false };
      }
      job.sortOrder = scratch;
      job.sortScratch = order;
      job.radixPass += 1;
      job.finalizeIndex = 0;
      if (job.radixPass < 4) {
        job.radixCounts?.fill(0);
        job.stage = "radix-count";
      } else {
        job.sortedDithers = new Float32Array(job.bladeCount);
        job.reorderVisited = new Uint8Array(job.bladeCount);
        job.reorderMatrixScratch = new Float32Array(16);
        job.reorderVariationScratch = new Float32Array(4);
        job.stage = "reorder";
      }
      return this.continueBuild(job, deadline);
    }

    if (job.stage === "reorder") {
      if (!this.advanceInPlaceReorder(job, deadline)) {
        return { complete: false };
      }
      job.centerY = (job.bounds.min.y + job.bounds.max.y) * 0.5;
      job.finalizeIndex = 0;
      job.stage = "center";
      return this.continueBuild(job, deadline);
    }

    if (job.stage === "center") {
      let processed = 0;
      while (
        job.finalizeIndex < job.bladeCount &&
        (processed === 0 ||
          processed % DEADLINE_CHECK_INTERVAL !== 0 ||
          performance.now() < deadline)
      ) {
        job.matrixValues[job.finalizeIndex * 16 + 13] -= job.centerY;
        job.finalizeIndex += 1;
        processed += 1;
      }
      if (job.finalizeIndex < job.bladeCount) {
        return { complete: false };
      }
      job.stage = "mesh";
      return this.continueBuild(job, deadline);
    }

    const placement = this.createPlacement(job);
    return {
      complete: true,
      tile: this.createTile(job.options, placement),
    };
  }

  private continueBuild(
    job: WorldSingleBladeTileBuildJob,
    deadline: number,
  ): WorldSingleBladeTileBuildResult {
    return performance.now() < deadline
      ? this.advanceBuild(job, deadline)
      : { complete: false };
  }

  private advanceInPlaceReorder(
    job: WorldSingleBladeTileBuildJob,
    deadline: number,
  ): boolean {
    const order = job.sortOrder;
    const dithers = job.dithers;
    const sortedDithers = job.sortedDithers;
    const visited = job.reorderVisited;
    const tempMatrix = job.reorderMatrixScratch;
    const tempVariation = job.reorderVariationScratch;
    if (
      !order ||
      !dithers ||
      !sortedDithers ||
      !visited ||
      !tempMatrix ||
      !tempVariation
    ) {
      throw new Error(`Grass tile ${job.options.key} has no reorder state.`);
    }
    let processed = 0;
    while (
      job.reorderCycleTarget !== undefined ||
      job.finalizeIndex < job.bladeCount
    ) {
      if (
        processed > 0 &&
        processed % DEADLINE_CHECK_INTERVAL === 0 &&
        performance.now() >= deadline
      ) {
        return false;
      }

      if (job.reorderCycleTarget === undefined) {
        const start = job.finalizeIndex;
        job.finalizeIndex += 1;
        if (visited[start]) {
          processed += 1;
          continue;
        }
        for (let component = 0; component < 16; component += 1) {
          tempMatrix[component] = job.matrixValues[start * 16 + component];
        }
        for (let component = 0; component < 4; component += 1) {
          tempVariation[component] = job.variations[start * 4 + component];
        }
        job.reorderCoverageScratch = job.coverages[start];
        job.reorderBiomeScratch = job.biomes[start];
        job.reorderCycleStart = start;
        job.reorderCycleTarget = start;
      }

      const start = job.reorderCycleStart;
      const target = job.reorderCycleTarget;
      if (start === undefined || target === undefined) {
        throw new Error(`Grass tile ${job.options.key} lost its reorder cycle.`);
      }
      visited[target] = 1;
      sortedDithers[target] = dithers[order[target]];
      const source = order[target];
      if (source === start) {
        job.matrixValues.set(tempMatrix, target * 16);
        job.variations.set(tempVariation, target * 4);
        job.coverages[target] = job.reorderCoverageScratch ?? 1;
        job.biomes[target] = job.reorderBiomeScratch ?? 0;
        job.reorderCycleStart = undefined;
        job.reorderCycleTarget = undefined;
        job.reorderCoverageScratch = undefined;
        job.reorderBiomeScratch = undefined;
      } else {
        job.matrixValues.copyWithin(target * 16, source * 16, source * 16 + 16);
        job.variations.copyWithin(target * 4, source * 4, source * 4 + 4);
        job.coverages[target] = job.coverages[source];
        job.biomes[target] = job.biomes[source];
        job.reorderCycleTarget = source;
      }
      processed += 1;
    }
    return true;
  }

  private createPlacement(
    job: WorldSingleBladeTileBuildJob,
  ): WorldSingleBladePlacement {
    const sortedDithers = job.sortedDithers;
    if (!sortedDithers) {
      throw new Error(`Grass tile ${job.options.key} finalized without dithers.`);
    }
    const origin = new THREE.Vector3(
      job.tileCenterX,
      job.centerY,
      job.tileCenterZ,
    );
    const localBounds = job.bounds
      .clone()
      .expandByScalar(this.calculateBoundsPadding());
    localBounds.min.sub(origin);
    localBounds.max.sub(origin);
    const instanceMatrix = new THREE.InstancedBufferAttribute(
      job.matrixValues.subarray(0, job.bladeCount * 16),
      16,
    );
    instanceMatrix.setUsage(THREE.StaticDrawUsage);
    const variationAttribute = new THREE.InstancedBufferAttribute(
      job.variations.subarray(0, job.bladeCount * 4),
      4,
    );
    const coverageAttribute = new THREE.InstancedBufferAttribute(
      job.coverages.subarray(0, job.bladeCount),
      1,
    );
    const biomeAttribute = new THREE.InstancedBufferAttribute(
      job.biomes.subarray(0, job.bladeCount),
      1,
    );
    const placement: WorldSingleBladePlacement = {
      key: job.placementKey,
      matrixValues: job.matrixValues,
      variations: job.variations,
      coverages: job.coverages,
      biomes: job.biomes,
      bladeCount: job.bladeCount,
      sortedDithers,
      instanceMatrix,
      variationAttribute,
      coverageAttribute,
      biomeAttribute,
      origin,
      localBounds,
      boundingSphere: localBounds.getBoundingSphere(new THREE.Sphere()),
      references: 0,
    };
    this.placementCache.set(placement.key, placement);
    job.sortOrder = undefined;
    job.sortScratch = undefined;
    job.dithers = undefined;
    job.ditherBits = undefined;
    job.radixCounts = undefined;
    job.radixOffsets = undefined;
    job.reorderVisited = undefined;
    job.reorderMatrixScratch = undefined;
    job.reorderVariationScratch = undefined;
    job.reorderCycleStart = undefined;
    job.reorderCycleTarget = undefined;
    job.reorderCoverageScratch = undefined;
    job.reorderBiomeScratch = undefined;
    return placement;
  }

  private createTile(
    options: WorldSingleBladeTileBuildOptions,
    placement: WorldSingleBladePlacement,
  ): WorldSingleBladeTile {
    const sourceGeometry = this.getSourceGeometry(options.bladeSegments);
    const geometry = this.geometryFactory.createInstancedGeometry(
      sourceGeometry,
      placement.variations.subarray(0, placement.bladeCount * 4),
      placement.coverages.subarray(0, placement.bladeCount),
      {
        variation: placement.variationAttribute,
        coverage: placement.coverageAttribute,
        biome: placement.biomeAttribute,
      },
      placement.biomes.subarray(0, placement.bladeCount),
    );
    const mesh = new THREE.InstancedMesh(geometry, options.material.material, 0);
    mesh.name = `${options.namePrefix}-${options.key}`;
    mesh.castShadow = false;
    mesh.receiveShadow = options.receiveShadows && this.profile.shadows;
    mesh.frustumCulled = true;
    mesh.instanceMatrix = placement.instanceMatrix;
    mesh.count = placement.bladeCount;
    mesh.position.copy(placement.origin);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.boundingBox = placement.localBounds;
    mesh.boundingSphere = placement.boundingSphere;
    placement.references += 1;

    return {
      key: options.key,
      tileX: options.tileX,
      tileZ: options.tileZ,
      mesh,
      bladeCount: placement.bladeCount,
      sortedDithers: placement.sortedDithers,
      placementKey: placement.key,
    };
  }

  disposeTile(tile: WorldSingleBladeTile): void {
    const placement = this.placementCache.get(tile.placementKey);
    if (!placement) {
      this.geometryFactory.disposeInstancedMesh(tile.mesh);
      return;
    }
    placement.references -= 1;
    this.geometryFactory.disposeInstancedMesh(
      tile.mesh,
      placement.references > 0,
    );
    if (placement.references <= 0) {
      this.placementCache.delete(placement.key);
      this.parkPlacement(placement);
    }
  }

  private parkPlacement(placement: WorldSingleBladePlacement): void {
    this.placementLru.delete(placement.key);
    this.placementLru.set(placement.key, placement);
    while (this.placementLru.size > PLACEMENT_LRU_LIMIT) {
      const oldestKey = this.placementLru.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      const evicted = this.placementLru.get(oldestKey);
      this.placementLru.delete(oldestKey);
      if (evicted) {
        this.releaseBuildBuffers(evicted.matrixValues.length / 16, evicted);
      }
    }
  }

  private rehydratePlacement(placement: WorldSingleBladePlacement): void {
    const bladeCount = placement.bladeCount;
    placement.instanceMatrix = new THREE.InstancedBufferAttribute(
      placement.matrixValues.subarray(0, bladeCount * 16),
      16,
    );
    placement.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    placement.variationAttribute = new THREE.InstancedBufferAttribute(
      placement.variations.subarray(0, bladeCount * 4),
      4,
    );
    placement.coverageAttribute = new THREE.InstancedBufferAttribute(
      placement.coverages.subarray(0, bladeCount),
      1,
    );
    placement.biomeAttribute = new THREE.InstancedBufferAttribute(
      placement.biomes.subarray(0, bladeCount),
      1,
    );
  }

  cancelBuild(job: WorldSingleBladeTileBuildJob): void {
    if (job.cachedPlacement) {
      return;
    }
    if (job.heightLattice) {
      this.latticePool.push(job.heightLattice);
      job.heightLattice = undefined;
    }
    this.releaseBuildBuffers(job.requestedCount, job);
  }

  dispose(): void {
    for (const geometry of this.sourceGeometries.values()) {
      geometry.dispose();
    }
    this.sourceGeometries.clear();
    this.placementCache.clear();
    this.placementLru.clear();
    this.emptyPlacementCache.clear();
    this.buildBufferPool.clear();
    this.latticePool.length = 0;
  }

  private createPlacementKey(options: WorldSingleBladeTileBuildOptions): string {
    return `${options.tileX}:${options.tileZ}:${options.densityMultiplier}:${options.seedSalt}:${options.material.getDitherSeed()}:biome-${GRASS_BIOME_VERSION}:placement-${GRASS_PLACEMENT_VERSION}`;
  }

  private rememberEmptyPlacement(key: string): void {
    this.emptyPlacementCache.delete(key);
    this.emptyPlacementCache.set(key, true);
    while (this.emptyPlacementCache.size > EMPTY_PLACEMENT_CACHE_LIMIT) {
      const oldest = this.emptyPlacementCache.keys().next().value;
      if (oldest === undefined) {
        break;
      }
      this.emptyPlacementCache.delete(oldest);
    }
  }

  private acquireBuildBuffers(requestedCount: number): TileBuildBuffers {
    const pool = this.buildBufferPool.get(requestedCount);
    const buffers = pool?.pop();
    if (buffers) {
      return buffers;
    }
    return {
      matrixValues: new Float32Array(requestedCount * 16),
      variations: new Float32Array(requestedCount * 4),
      coverages: new Float32Array(requestedCount),
      biomes: new Float32Array(requestedCount),
    };
  }

  private releaseBuildBuffers(
    requestedCount: number,
    buffers: TileBuildBuffers,
  ): void {
    let pool = this.buildBufferPool.get(requestedCount);
    if (!pool) {
      pool = [];
      this.buildBufferPool.set(requestedCount, pool);
    }
    if (pool.length < 4) {
      pool.push({
        matrixValues: buffers.matrixValues,
        variations: buffers.variations,
        coverages: buffers.coverages,
        biomes: buffers.biomes,
      });
    }
  }

  private getSourceGeometry(bladeSegments: number): THREE.BufferGeometry {
    const segments = Math.max(1, Math.round(bladeSegments));
    let geometry = this.sourceGeometries.get(segments);
    if (!geometry) {
      geometry = this.createSingleBladeGeometry(this.grassConfig, segments);
      this.sourceGeometries.set(segments, geometry);
    }
    return geometry;
  }

  private calculateBoundsPadding(): number {
    return calculateGrassSingleBladeRootBoundsRadius({
      bladeHeight: this.grassConfig.geometry.bladeHeightMax,
      bladeWidth: this.grassConfig.geometry.bladeWidthMax,
      bladeLean: this.grassConfig.geometry.bladeLeanMax,
      bladeCurveReach: calculateGrassBladeCurveReach(
        this.grassConfig.geometry.bladeHeightMax,
        this.grassConfig.geometry.bladeCurve,
      ),
      maximumHorizontalScale: INSTANCE_HORIZONTAL_SCALE_MAX,
      maximumVerticalScale: INSTANCE_VERTICAL_SCALE_MAX,
      windStrength: this.grassConfig.wind.strength,
      flutterStrength: this.grassConfig.wind.flutterStrength,
      maximumArtWindScale: MAXIMUM_ART_WIND_SCALE,
      maximumInstanceWindScale: MAXIMUM_INSTANCE_WIND_SCALE,
      maximumWindStiffness: MAXIMUM_WIND_STIFFNESS,
      maximumInteractionStrength: Math.max(
        this.worldConfig.grassInteractionStrength,
        this.worldConfig.grassLandingPulseStrength,
      ),
      interactionVerticalScale: INTERACTION_VERTICAL_SCALE,
      safetyMargin: BOUNDS_SAFETY_MARGIN,
    });
  }

  private createSingleBladeGeometry(
    config: GrassConfig,
    segments: number,
  ): THREE.BufferGeometry {
    const height =
      (config.geometry.bladeHeightMin + config.geometry.bladeHeightMax) * 0.5;
    const width =
      (config.geometry.bladeWidthMin + config.geometry.bladeWidthMax) * 0.5;
    const positions: number[] = [];
    const uvs: number[] = [];
    const progress: number[] = [];
    const phases: number[] = [];
    const shades: number[] = [];
    const indices: number[] = [];
    const curve = config.geometry.bladeCurve;

    for (let segment = 0; segment < segments; segment += 1) {
      const amount = segment / segments;
      const taper = Math.pow(1 - amount, 0.72);
      const halfWidth = width * 0.5 * taper;
      const point = resolveGrassBladeArcPoint(height, curve, amount);
      positions.push(
        -halfWidth,
        point.y,
        point.z,
        halfWidth,
        point.y,
        point.z,
      );
      uvs.push(0, amount, 1, amount);
      progress.push(amount, amount);
      phases.push(0.5, 0.5);
      shades.push(0.5, 0.5);
    }

    const tip = resolveGrassBladeArcPoint(height, curve, 1);
    const tipVertex = positions.length / 3;
    positions.push(0, tip.y, tip.z);
    uvs.push(0.5, 1);
    progress.push(1);
    phases.push(0.5);
    shades.push(0.5);

    for (let segment = 0; segment < segments - 1; segment += 1) {
      const row = segment * 2;
      indices.push(row, row + 2, row + 1, row + 2, row + 3, row + 1);
    }
    const finalRow = (segments - 1) * 2;
    indices.push(finalRow, tipVertex, finalRow + 1);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute(
      "grassProgress",
      new THREE.Float32BufferAttribute(progress, 1),
    );
    geometry.setAttribute(
      "grassPhase",
      new THREE.Float32BufferAttribute(phases, 1),
    );
    geometry.setAttribute(
      "grassBladeShade",
      new THREE.Float32BufferAttribute(shades, 1),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }

  private clumpValue(clumpX: number, clumpZ: number, salt: number): number {
    return (
      this.hash(clumpX, clumpZ, (this.worldConfig.seed ^ salt) >>> 0) /
      4294967296
    );
  }

  private hash(x: number, z: number, seed: number): number {
    let value = Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return (value ^ (value >>> 16)) >>> 0;
  }
}
