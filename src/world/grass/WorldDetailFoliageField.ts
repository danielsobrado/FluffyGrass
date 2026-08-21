import * as THREE from "three";
import {
  GRASS_ACCENT_SPECIES,
  packGrassAccent,
  resolveGrassCanopyHeight,
} from "../../grass/biome/GrassAccentSpecies";
import {
  GRASS_BIOME_PROFILES,
} from "../../grass/biome/GrassBiomeProfile";
import { resolveGrassCanopyAo, sampleGrassMacroVigor } from "../../grass/GrassFieldVariation";
import type { GrassConfig } from "../../grass/GrassConfig";
import { SeededRandom } from "../../grass/internal/SeededRandom";
import { sampleStoneGrassClearance } from "../stones/StoneClearance";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import {
  detailFoliageVariantRow,
  detailFoliageHeightRoll,
  resolveDetailFoliageSelection,
  createDetailFoliageSelection,
} from "./DetailFoliageAffinity";
import {
  DETAIL_FOLIAGE_AO_SALT,
  DETAIL_FOLIAGE_BIOME_DENSITY_CHANNEL_SALT,
  DETAIL_FOLIAGE_CANDIDATE_SALT,
  DETAIL_FOLIAGE_DISTRIBUTION_KEEP_CHANNEL_SALT,
  DETAIL_FOLIAGE_DITHER_SALT,
  DETAIL_FOLIAGE_WIND_SALT,
  DETAIL_FOLIAGE_YAW_SALT,
  detailFoliageChannel01,
  detailFoliagePositionHash,
} from "./DetailFoliageRandom";
import type { DetailFoliageTuning } from "./DetailFoliageTuning";
import { calculateGrassSingleBladeRootBoundsRadius } from "./GrassRuntimeMath";
import {
  pickGrassBiomeIndex,
  resolveGrassBiomeDensity,
  sampleGrassBiome,
} from "./WorldBiomeField";
import {
  createGrassHabitatSample,
  sampleGrassHabitat,
  type GrassHabitatSample,
} from "./GrassHabitatField";
import {
  createDetailFoliageDistributionSample,
  WorldDetailFoliageDistribution,
} from "./WorldDetailFoliageDistribution";
import { DETAIL_FOLIAGE_WIND_SHEAR_FACTOR } from "./WorldDetailFoliageMaterial";
import type { WorldDetailFoliageMaterial } from "./WorldDetailFoliageMaterial";

/**
 * Placement for the accent layer: ferns, flowers, seed heads, low shrubs, and
 * broadleaf plants gathered into small plant communities.
 *
 * The layer is deliberately small — roughly one card per three square metres,
 * gone by 30 m — because that is what the reference look actually is: the
 * flowers in a hillside shot are a few pixels each, and it is the *mixture*
 * that reads, not any one plant. Composition comes from two continuous
 * world-space fields plus ecology, not from extra noise or neighbour searches.
 *
 * The build is deliberately simpler than {@link WorldSingleBladeTileFactory}:
 * a tile is ~90 candidates rather than ~4 600 blades, so it finishes inside a
 * tenth of a millisecond and needs neither incremental staging nor a radix
 * sort. It keeps the two properties that matter — instances sorted by dither so
 * the draw can be trimmed to a prefix, and world-space determinism so a tile
 * rebuilt after eviction is identical.
 */

/**
 * 16 m tiles rather than the blade layer's 8 m. The plan budgeted ≤ 30 extra
 * draws, and at 8 m the 32 m residency disc holds ~73 tiles — the "merge per
 * 2×2 tiles" escape hatch, taken up front. Culling granularity costs nothing
 * here: a whole tile is ~90 cards of six vertices.
 */
export const DETAIL_FOLIAGE_TILE_SIZE = 16;
/** Cards per square metre before the biome's own `accentDensity`. */
export const DETAIL_FOLIAGE_DENSITY = 0.35;
/**
 * Ceiling the performance gate holds the density to. Production tuning cannot
 * exceed this; composition may only stay equal or decrease.
 */
export const DETAIL_FOLIAGE_DENSITY_CEILING = 0.35;
/** Midpoint and half-width of the dither fade that ends the layer. */
export const DETAIL_FOLIAGE_FADE_DISTANCE = 27;
export const DETAIL_FOLIAGE_FADE_TRANSITION = 3;
/**
 * Lead on the residency radius, so a tile is resident before its cards can
 * draw. Without it a tile arrives exactly where the shader starts keeping
 * cards, and the whole tile appears at once when its build lands.
 */
const DETAIL_FOLIAGE_RESIDENCY_MARGIN = 2;
export const DETAIL_FOLIAGE_VISIBILITY_RADIUS =
  DETAIL_FOLIAGE_FADE_DISTANCE +
  DETAIL_FOLIAGE_FADE_TRANSITION +
  DETAIL_FOLIAGE_RESIDENCY_MARGIN;

const MIN_SUITABILITY = 0.08;
const TWO_PI = Math.PI * 2;
/** Matches the blade field: below this the residency set cannot change. */
const COUNT_MOVEMENT_EPSILON = 0.25;
/**
 * How far the focus may drift before the residency set is recomputed.
 *
 * Reconciling only on tile crossings is not enough, which is worth spelling out
 * because it looks like it should be: residency is a disc measured from the
 * *focus*, and the focus can travel the full diagonal of a tile — 22.6 m at
 * this tile size — without ever leaving it. A tile 45 m away at the last
 * crossing is not resident, and after that diagonal it sits 22.7 m away, well
 * inside the 30 m fade. It would stay empty until the next crossing and then
 * appear at once. One reconcile is ~25 distance tests over a reused request
 * array, so paying it per half-metre of travel is cheaper than the pop.
 */
const RECONCILE_MOVEMENT_EPSILON = 0.5;
/** float64 CPU dither versus float32 storage; keeps the trim conservative. */
const DITHER_SAFETY_MARGIN = 1 / 1024;
const EVICTION_HYSTERESIS_TILES = 0.5;
const BOUNDS_SAFETY_MARGIN = 0.05;
/** Ceilings the reserved bounds are computed from; see the material's ramp. */
const MAXIMUM_ART_WIND_SCALE = 2;
const MAXIMUM_INSTANCE_WIND_SCALE = 1.16;

/**
 * Tallest and widest a card can be, as multiples of the canopy height. Resolved
 * to metres against the live blade config in the factory below, so a change to
 * `bladeHeightMin`/`Max` carries the accents and their reserved bounds with it.
 */
const ACCENT_CANOPY_HEIGHT_MAX = GRASS_ACCENT_SPECIES.reduce(
  (maximum, species) => Math.max(maximum, species.canopyHeightBand[1]),
  0,
);
const ACCENT_CANOPY_WIDTH_MAX = GRASS_ACCENT_SPECIES.reduce(
  (maximum, species) =>
    Math.max(maximum, species.canopyHeightBand[1] * species.aspect),
  0,
);

export interface WorldDetailFoliageTile {
  key: number;
  tileX: number;
  tileZ: number;
  mesh: THREE.InstancedMesh;
  instanceCount: number;
  /** Every card's density dither, ascending, matching the instance buffer order. */
  sortedDithers: Float32Array;
}

interface TileRequest {
  key: number;
  tileX: number;
  tileZ: number;
  distance: number;
}

interface CandidateAccent {
  dither: number;
  matrix: Float32Array;
  windScale: number;
  rootAo: number;
  dryness: number;
  coverage: number;
  biome: number;
  accent: number;
}

/** Matches the GLSL `smoothstep(edge0, edge1, x)` the vertex shader uses. */
function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function upperBound(values: Float32Array, value: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (values[middle] <= value) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
}

/** Same allocation-free Cantor pairing the blade tiles key themselves with. */
function tileKey(tileX: number, tileZ: number): number {
  const x = tileX >= 0 ? tileX * 2 : -tileX * 2 - 1;
  const z = tileZ >= 0 ? tileZ * 2 : -tileZ * 2 - 1;
  const sum = x + z;
  return (sum * (sum + 1)) / 2 + z;
}

function hash(x: number, z: number, seed: number): number {
  let value = Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

export class WorldDetailFoliageFactory {
  private readonly geometry: THREE.BufferGeometry;
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly normal = new THREE.Vector3();
  private readonly align = new THREE.Quaternion();
  private readonly yaw = new THREE.Quaternion();
  private readonly position = new THREE.Vector3();
  private readonly localPosition = new THREE.Vector3();
  private readonly scale = new THREE.Vector3();
  private readonly matrix = new THREE.Matrix4();
  private readonly boundsPadding: number;
  /** What a species' `canopyHeightBand` of 1.0 resolves to, in metres. */
  private readonly canopyHeight: number;
  private readonly habitatSample: GrassHabitatSample = createGrassHabitatSample();
  private readonly distribution: WorldDetailFoliageDistribution;
  private readonly distributionSample = createDetailFoliageDistributionSample();
  private readonly selection = createDetailFoliageSelection();
  private tuning: DetailFoliageTuning;

  constructor(
    private readonly field: TerrainField,
    private readonly worldConfig: WorldConfig,
    private readonly grassConfig: GrassConfig,
    private readonly material: WorldDetailFoliageMaterial,
    tuning: DetailFoliageTuning,
  ) {
    this.tuning = { ...tuning };
    this.distribution = new WorldDetailFoliageDistribution(
      worldConfig.seed,
      this.tuning,
    );
    this.geometry = createDetailFoliageCardGeometry();
    this.canopyHeight = resolveGrassCanopyHeight(
      grassConfig.geometry.bladeHeightMin,
      grassConfig.geometry.bladeHeightMax,
    );
    this.boundsPadding = calculateGrassSingleBladeRootBoundsRadius({
      bladeHeight: ACCENT_CANOPY_HEIGHT_MAX * this.canopyHeight,
      bladeWidth: ACCENT_CANOPY_WIDTH_MAX * this.canopyHeight,
      bladeLean: 0,
      // Accent cards are flat crossed quads; only real blades carry a rest arc.
      bladeCurveReach: 0,
      maximumHorizontalScale: 1,
      maximumVerticalScale: 1,
      // The card's sway is the shear factor times the configured wind strength,
      // exactly as the vertex shader applies it; charging the full ramp keeps
      // the bound conservative.
      windStrength:
        this.grassConfig.wind.strength * DETAIL_FOLIAGE_WIND_SHEAR_FACTOR,
      flutterStrength: 0,
      maximumArtWindScale: MAXIMUM_ART_WIND_SCALE,
      maximumInstanceWindScale: MAXIMUM_INSTANCE_WIND_SCALE,
      maximumWindStiffness: 1,
      // Accents are not trail interactive: nothing bends them but the wind.
      maximumInteractionStrength: 0,
      interactionVerticalScale: 0,
      safetyMargin: BOUNDS_SAFETY_MARGIN,
    });
  }

  setTuning(tuning: DetailFoliageTuning): void {
    this.tuning = { ...tuning };
    this.distribution.setTuning(this.tuning);
  }

  build(
    key: number,
    tileX: number,
    tileZ: number,
    namePrefix: string,
  ): WorldDetailFoliageTile | undefined {
    const tileSize = DETAIL_FOLIAGE_TILE_SIZE;
    const requested = Math.max(
      1,
      Math.round(tileSize * tileSize * this.tuning.density),
    );
    const columns = Math.ceil(Math.sqrt(requested));
    const rows = Math.ceil(requested / columns);
    const cellWidth = tileSize / columns;
    const cellDepth = tileSize / rows;
    const originX = tileX * tileSize;
    const originZ = tileZ * tileSize;
    const centerX = originX + tileSize * 0.5;
    const centerZ = originZ + tileSize * 0.5;
    const positionRandom = new SeededRandom(
      hash(tileX, tileZ, (this.worldConfig.seed ^ 0x2c_1b_3a_57) >>> 0),
    );
    const candidates: CandidateAccent[] = [];
    const bounds = new THREE.Box3();

    for (let index = 0; index < requested; index += 1) {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = originX + (column + positionRandom.next()) * cellWidth;
      const z = originZ + (row + positionRandom.next()) * cellDepth;
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
      // Accent cards are wider than blades, so they stand a little further
      // back from stone footprints than the grass does.
      const stoneMask = sampleStoneGrassClearance(x, z, 0.3);
      if (stoneMask <= 0.05) {
        continue;
      }
      this.field.sampleNormal(x, z, this.normal);
      const suitability =
        this.field.sampleGrassSlopeMask(this.normal) *
        suitabilityWithoutSlope *
        pathMask *
        stoneMask;
      if (suitability < MIN_SUITABILITY) {
        continue;
      }

      const biomeSample = sampleGrassBiome(x, z);
      const biomeIndex = pickGrassBiomeIndex(x, z, biomeSample);
      const profile = GRASS_BIOME_PROFILES[biomeIndex];
      const ecology = this.field.sampleEcologyAt(x, z, height);
      sampleGrassHabitat(
        x,
        z,
        ecology,
        resolveGrassBiomeDensity(biomeSample),
        profile.minimumClimateDensityRetention,
        profile.heightBand[0],
        profile.heightBand[1],
        profile.drynessBias,
        profile.accentDensity,
        this.worldConfig,
        this.habitatSample,
      );
      if (this.habitatSample.accentChance < 0.06) {
        continue;
      }

      const candidateHash = detailFoliagePositionHash(
        x,
        z,
        this.worldConfig.seed,
        DETAIL_FOLIAGE_CANDIDATE_SALT,
      );
      if (
        detailFoliageChannel01(
          candidateHash,
          DETAIL_FOLIAGE_BIOME_DENSITY_CHANNEL_SALT,
        ) >= profile.accentDensity
      ) {
        continue;
      }

      const distribution = this.distribution.sample(
        x,
        z,
        this.distributionSample,
      );
      if (
        detailFoliageChannel01(
          candidateHash,
          DETAIL_FOLIAGE_DISTRIBUTION_KEEP_CHANNEL_SALT,
        ) >= distribution.keepMultiplier
      ) {
        continue;
      }

      if (
        !resolveDetailFoliageSelection(
          profile,
          ecology,
          this.habitatSample.dryness,
          pathMask,
          stoneMask,
          distribution,
          candidateHash,
          this.tuning,
          this.selection,
        )
      ) {
        continue;
      }

      const species = GRASS_ACCENT_SPECIES[this.selection.speciesIndex];
      const vigor = sampleGrassMacroVigor(x, z);
      const heightRoll = detailFoliageHeightRoll(
        distribution,
        candidateHash,
        this.tuning,
      );
      const cardHeight =
        lerp(
          species.canopyHeightBand[0],
          species.canopyHeightBand[1],
          heightRoll,
        ) * this.canopyHeight;
      const cardWidth = cardHeight * species.aspect;
      this.position.set(
        x,
        height - this.grassConfig.distribution.rootSink,
        z,
      );
      bounds.expandByPoint(this.position);
      this.align.setFromUnitVectors(this.up, this.normal);
      this.yaw.setFromAxisAngle(
        this.up,
        detailFoliageChannel01(candidateHash, DETAIL_FOLIAGE_YAW_SALT) * TWO_PI,
      );
      this.align.multiply(this.yaw);
      this.scale.set(cardWidth, cardHeight, cardWidth);
      this.localPosition.set(
        this.position.x - centerX,
        this.position.y,
        this.position.z - centerZ,
      );
      this.matrix.compose(this.localPosition, this.align, this.scale);
      const matrix = new Float32Array(16);
      this.matrix.toArray(matrix, 0);

      candidates.push({
        dither: detailFoliageChannel01(candidateHash, DETAIL_FOLIAGE_DITHER_SALT),
        matrix,
        windScale:
          lerp(
            0.84,
            1.16,
            detailFoliageChannel01(candidateHash, DETAIL_FOLIAGE_WIND_SALT),
          ) * profile.windDamping,
        rootAo:
          resolveGrassCanopyAo(vigor, suitability) *
          lerp(
            0.99,
            1.01,
            detailFoliageChannel01(candidateHash, DETAIL_FOLIAGE_AO_SALT),
          ),
        dryness: this.habitatSample.dryness,
        coverage: this.habitatSample.density * pathMask * stoneMask,
        biome: biomeIndex,
        accent: packGrassAccent(
          this.selection.speciesIndex,
          detailFoliageVariantRow(distribution, candidateHash, this.tuning),
          this.selection.tintRow,
        ),
      });
    }

    if (candidates.length === 0) {
      return undefined;
    }

    // Sorted by dither so the survivors of the shader's keep test are always a
    // prefix of the buffer and the draw can be cut with `mesh.count`.
    candidates.sort((left, right) => left.dither - right.dither);

    const count = candidates.length;
    const matrixValues = new Float32Array(count * 16);
    const variations = new Float32Array(count * 4);
    const coverages = new Float32Array(count);
    const biomes = new Float32Array(count);
    const accents = new Float32Array(count);
    const sortedDithers = new Float32Array(count);
    for (let index = 0; index < count; index += 1) {
      const candidate = candidates[index];
      matrixValues.set(candidate.matrix, index * 16);
      // The shader compares `instanceVariation.x` against coverage, so the
      // dither has to travel with the instance rather than beside it.
      variations[index * 4] = candidate.dither;
      variations[index * 4 + 1] = candidate.windScale;
      variations[index * 4 + 2] = candidate.rootAo;
      variations[index * 4 + 3] = candidate.dryness;
      coverages[index] = candidate.coverage;
      biomes[index] = candidate.biome;
      accents[index] = candidate.accent;
      sortedDithers[index] = candidate.dither;
    }

    const centerY = (bounds.min.y + bounds.max.y) * 0.5;
    for (let index = 0; index < count; index += 1) {
      matrixValues[index * 16 + 13] -= centerY;
    }
    const origin = new THREE.Vector3(centerX, centerY, centerZ);
    const localBounds = bounds.clone().expandByScalar(this.boundsPadding);
    localBounds.min.sub(origin);
    localBounds.max.sub(origin);

    const geometry = new THREE.InstancedBufferGeometry();
    if (this.geometry.index) {
      geometry.setIndex(this.geometry.index);
    }
    for (const [name, attribute] of Object.entries(this.geometry.attributes)) {
      geometry.setAttribute(name, attribute);
    }
    geometry.setAttribute(
      "instanceVariation",
      new THREE.InstancedBufferAttribute(variations, 4),
    );
    geometry.setAttribute(
      "instanceCoverage",
      new THREE.InstancedBufferAttribute(coverages, 1),
    );
    geometry.setAttribute(
      "instanceBiome",
      new THREE.InstancedBufferAttribute(biomes, 1),
    );
    geometry.setAttribute(
      "instanceAccent",
      new THREE.InstancedBufferAttribute(accents, 1),
    );

    const mesh = new THREE.InstancedMesh(geometry, this.material.material, 0);
    mesh.name = `${namePrefix}-${key}`;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = true;
    mesh.instanceMatrix = new THREE.InstancedBufferAttribute(matrixValues, 16);
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.count = count;
    mesh.position.copy(origin);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.boundingBox = localBounds;
    mesh.boundingSphere = localBounds.getBoundingSphere(new THREE.Sphere());

    return {
      key,
      tileX,
      tileZ,
      mesh,
      instanceCount: count,
      sortedDithers,
    };
  }

  disposeTile(tile: WorldDetailFoliageTile): void {
    const geometry = tile.mesh.geometry as THREE.InstancedBufferGeometry;
    // The card geometry is shared by every tile; detach it before disposal so
    // streaming one tile out cannot invalidate the others' GPU buffers.
    for (const name of Object.keys(this.geometry.attributes)) {
      geometry.deleteAttribute(name);
    }
    geometry.setIndex(null);
    geometry.dispose();
    tile.mesh.dispose();
  }

  dispose(): void {
    this.geometry.dispose();
  }
}

/**
 * Two stacked quads sharing their middle row: six vertices, four triangles.
 * The middle row is what lets a fern bend through its own length instead of
 * shearing as a rigid rectangle; duplicating it would cost two more vertices
 * for exactly the same silhouette.
 */
function createDetailFoliageCardGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  for (let row = 0; row <= 2; row += 1) {
    const v = row / 2;
    positions.push(-0.5, v, 0, 0.5, v, 0);
    uvs.push(0, v, 1, v);
  }
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex([0, 1, 3, 0, 3, 2, 2, 3, 5, 2, 5, 4]);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export interface WorldDetailFoliageFieldOptions {
  namePrefix: string;
  tilesPerFrame: number;
}

export class WorldDetailFoliageField {
  private readonly tiles = new Map<number, WorldDetailFoliageTile>();
  private readonly emptyTiles = new Set<number>();
  private readonly desired = new Set<number>();
  private readonly queue: TileRequest[] = [];
  /** Reused across reconciles; rebuilding it per call allocated every frame. */
  private readonly requests: TileRequest[] = [];
  private readonly reconciledFocus = new THREE.Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );
  private readonly countedFocus = new THREE.Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );
  private countsDirty = true;
  private enabled = true;
  private centerTileX = Number.NaN;
  private centerTileZ = Number.NaN;
  private densityScale = 1;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly factory: WorldDetailFoliageFactory,
    private readonly material: WorldDetailFoliageMaterial,
    private readonly options: Readonly<WorldDetailFoliageFieldOptions>,
  ) {}

  /**
   * The governor's accent scale. Pushed to the material as well, because the
   * CPU trim below and the shader's keep test must read the same threshold.
   */
  setDensityScale(scale: number): void {
    const resolved = THREE.MathUtils.clamp(scale, 0, 1);
    if (resolved === this.densityScale) {
      return;
    }
    this.densityScale = resolved;
    this.material.setDensityScale(resolved);
    this.countsDirty = true;
  }

  setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) {
      return;
    }
    this.enabled = enabled;
    this.queue.length = 0;
    if (enabled) {
      this.centerTileX = Number.NaN;
      this.centerTileZ = Number.NaN;
      this.countsDirty = true;
    } else {
      this.evictTiles();
    }
  }

  update(focus: THREE.Vector3, buildDeadline = Number.POSITIVE_INFINITY): void {
    if (!this.enabled) {
      return;
    }
    const tileX = Math.floor(focus.x / DETAIL_FOLIAGE_TILE_SIZE);
    const tileZ = Math.floor(focus.z / DETAIL_FOLIAGE_TILE_SIZE);
    const tileChanged =
      tileX !== this.centerTileX || tileZ !== this.centerTileZ;
    if (tileChanged) {
      this.centerTileX = tileX;
      this.centerTileZ = tileZ;
    }
    // See RECONCILE_MOVEMENT_EPSILON: crossing a tile is not the only way a
    // tile can enter the residency disc, because the disc follows the focus.
    if (
      tileChanged ||
      focus.distanceToSquared(this.reconciledFocus) >
        RECONCILE_MOVEMENT_EPSILON * RECONCILE_MOVEMENT_EPSILON
    ) {
      this.reconciledFocus.copy(focus);
      this.reconcile(focus);
    }
    this.processQueue(buildDeadline);
    if (
      this.countsDirty ||
      focus.distanceToSquared(this.countedFocus) >
        COUNT_MOVEMENT_EPSILON * COUNT_MOVEMENT_EPSILON
    ) {
      this.countedFocus.copy(focus);
      this.countsDirty = false;
      this.updateInstanceCounts(focus);
    }
  }

  getInstanceCount(): number {
    let count = 0;
    for (const tile of this.tiles.values()) {
      count += tile.instanceCount;
    }
    return count;
  }

  getDrawnInstanceCount(): number {
    let count = 0;
    for (const tile of this.tiles.values()) {
      count += tile.mesh.visible ? tile.mesh.count : 0;
    }
    return count;
  }

  getTileCount(): number {
    return this.tiles.size;
  }

  invalidate(): void {
    this.evictTiles();
    this.queue.length = 0;
    this.desired.clear();
    this.requests.length = 0;
    this.reconciledFocus.set(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    );
    this.countedFocus.set(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    );
  }

  dispose(): void {
    this.evictTiles();
    this.queue.length = 0;
    this.desired.clear();
  }

  /**
   * Trims each tile to the stable density subset. Distance visibility is a
   * continuous per-card alpha fade in the material; only tiles wholly beyond
   * that fade are hidden here to avoid empty draw submissions.
   */
  private updateInstanceCounts(focus: THREE.Vector3): void {
    const fadeEnd = DETAIL_FOLIAGE_FADE_DISTANCE + DETAIL_FOLIAGE_FADE_TRANSITION;
    for (const tile of this.tiles.values()) {
      const distance =
        this.distanceToTile(
          focus.x,
          focus.z,
          tile.tileX * DETAIL_FOLIAGE_TILE_SIZE,
          tile.tileZ * DETAIL_FOLIAGE_TILE_SIZE,
        ) - COUNT_MOVEMENT_EPSILON;
      const count =
        distance >= fadeEnd
          ? 0
          : upperBound(
              tile.sortedDithers,
              this.densityScale + DITHER_SAFETY_MARGIN,
            );
      tile.mesh.count = count;
      // A count of zero would still cost a draw submission and a bind, and past
      // the fade every resident tile behind the camera is in that state.
      tile.mesh.visible = count > 0;
    }
  }

  private reconcile(focus: THREE.Vector3): void {
    const offset = Math.max(
      1,
      Math.ceil(DETAIL_FOLIAGE_VISIBILITY_RADIUS / DETAIL_FOLIAGE_TILE_SIZE),
    );
    const requests = this.requests;
    requests.length = 0;
    this.desired.clear();

    for (let dz = -offset; dz <= offset; dz += 1) {
      for (let dx = -offset; dx <= offset; dx += 1) {
        const tileX = this.centerTileX + dx;
        const tileZ = this.centerTileZ + dz;
        const distance = this.distanceToTile(
          focus.x,
          focus.z,
          tileX * DETAIL_FOLIAGE_TILE_SIZE,
          tileZ * DETAIL_FOLIAGE_TILE_SIZE,
        );
        if (distance > DETAIL_FOLIAGE_VISIBILITY_RADIUS) {
          continue;
        }
        const key = tileKey(tileX, tileZ);
        this.desired.add(key);
        if (!this.tiles.has(key) && !this.emptyTiles.has(key)) {
          requests.push({ key, tileX, tileZ, distance });
        }
      }
    }

    for (const [key, tile] of this.tiles) {
      if (this.desired.has(key)) {
        continue;
      }
      const distance = this.distanceToTile(
        focus.x,
        focus.z,
        tile.tileX * DETAIL_FOLIAGE_TILE_SIZE,
        tile.tileZ * DETAIL_FOLIAGE_TILE_SIZE,
      );
      if (
        distance <=
        DETAIL_FOLIAGE_VISIBILITY_RADIUS +
          DETAIL_FOLIAGE_TILE_SIZE * EVICTION_HYSTERESIS_TILES
      ) {
        continue;
      }
      this.scene.remove(tile.mesh);
      this.factory.disposeTile(tile);
      this.tiles.delete(key);
      this.countsDirty = true;
    }
    for (const key of this.emptyTiles) {
      if (!this.desired.has(key)) {
        this.emptyTiles.delete(key);
      }
    }

    requests.sort((left, right) => left.distance - right.distance);
    this.queue.length = 0;
    for (const request of requests) {
      this.queue.push(request);
    }
  }

  private processQueue(buildDeadline: number): void {
    let built = 0;
    while (
      built < this.options.tilesPerFrame &&
      this.queue.length > 0 &&
      performance.now() < buildDeadline
    ) {
      const request = this.queue.shift();
      if (
        !request ||
        !this.desired.has(request.key) ||
        this.tiles.has(request.key)
      ) {
        continue;
      }
      built += 1;
      const tile = this.factory.build(
        request.key,
        request.tileX,
        request.tileZ,
        this.options.namePrefix,
      );
      if (!tile) {
        // Bare ground, a walking way, or a biome that spends no accents here.
        this.emptyTiles.add(request.key);
        continue;
      }
      this.tiles.set(tile.key, tile);
      this.scene.add(tile.mesh);
      this.countsDirty = true;
    }
  }

  private evictTiles(): void {
    for (const tile of this.tiles.values()) {
      this.scene.remove(tile.mesh);
      this.factory.disposeTile(tile);
    }
    this.tiles.clear();
    this.emptyTiles.clear();
    this.desired.clear();
    this.centerTileX = Number.NaN;
    this.centerTileZ = Number.NaN;
    this.countsDirty = true;
  }

  private distanceToTile(
    x: number,
    z: number,
    originX: number,
    originZ: number,
  ): number {
    const distanceX = Math.max(
      originX - x,
      0,
      x - (originX + DETAIL_FOLIAGE_TILE_SIZE),
    );
    const distanceZ = Math.max(
      originZ - z,
      0,
      z - (originZ + DETAIL_FOLIAGE_TILE_SIZE),
    );
    return Math.hypot(distanceX, distanceZ);
  }
}
