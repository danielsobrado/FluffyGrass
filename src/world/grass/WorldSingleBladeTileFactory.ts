import * as THREE from "three";
import type { GrassConfig } from "../../grass/GrassConfig";
import { GrassGeometryFactory } from "../../grass/GrassGeometryFactory";
import { SeededRandom } from "../../grass/internal/SeededRandom";
import type { GrassNearMaterial } from "../../grass/materials/GrassNearMaterial";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import { TERRAIN_NORMAL_STEP, type TerrainField } from "../TerrainField";
import { TerrainHeightLattice } from "../TerrainHeightLattice";
import type { WorldConfig } from "../WorldConfig";
import { calculateGrassSingleBladeRootBoundsRadius } from "./GrassRuntimeMath";

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
  requestedCount: number;
  columns: number;
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
  bounds: THREE.Box3;
  nextIndex: number;
  bladeCount: number;
  /** Cached heights for this tile's normals; see {@link TerrainHeightLattice}. */
  heightLattice: TerrainHeightLattice;
}

export interface WorldSingleBladeTileBuildResult {
  complete: boolean;
  tile?: WorldSingleBladeTile;
}

const TWO_PI = Math.PI * 2;
const POSITION_JITTER = 0.46;
const MIN_SUITABILITY = 0.08;
/**
 * Half the normal's own central-difference step, so the cached field still
 * resolves everything the normal is able to express. Measured worst-case
 * deviation from a directly sampled normal is under 0.07 degrees.
 */
const HEIGHT_LATTICE_SPACING = TERRAIN_NORMAL_STEP * 0.5;
/**
 * Slack on the acceptance threshold, covering the slope mask's error when the
 * normal comes from the lattice rather than from four direct height samples.
 *
 * The lattice normal deviates by well under a tenth of a degree, but suitability
 * is compared against a hard threshold, so a blade sitting exactly on it could
 * fall either way. Widening the test in the keep direction makes the accepted
 * set a superset of the directly sampled one: the tile can gain a couple of
 * borderline blades, never lose one. The slope mask's steepest slope is
 * 1.5 / 0.2 per unit of normal.y, so this covers roughly a half-degree of
 * deviation — several times the observed worst case.
 */
const LATTICE_SUITABILITY_TOLERANCE = 0.05;
/**
 * Reading the clock per blade cost more than 3% of a tile build, and closer to
 * a tenth of one once the sampling above got cheaper. Blades are uniform enough
 * that checking a block at a time still lands well inside a millisecond.
 */
const DEADLINE_CHECK_INTERVAL = 256;
const INSTANCE_HORIZONTAL_SCALE_MAX = 1.2;
const INSTANCE_VERTICAL_SCALE_MAX = 1.22;
const MAXIMUM_ART_WIND_SCALE = 2;
const MAXIMUM_INSTANCE_WIND_SCALE = 1.16;
const MAXIMUM_WIND_STIFFNESS = 1.12;
const INTERACTION_VERTICAL_SCALE = 0.2;
const BOUNDS_SAFETY_MARGIN = 0.05;
// 0.5 * 0.754877666 + 0.5 * 0.569840296 — the constant part of the vertex
// shader's dither for single-blade geometry, whose shade and phase are both 0.5.
const SINGLE_BLADE_DITHER_BIAS = 0.662358981;

export class WorldSingleBladeTileFactory {
  private readonly geometryFactory = new GrassGeometryFactory();
  private readonly sourceGeometries = new Map<number, THREE.BufferGeometry>();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly normal = new THREE.Vector3();
  private readonly align = new THREE.Quaternion();
  private readonly yaw = new THREE.Quaternion();
  private readonly position = new THREE.Vector3();
  private readonly localPosition = new THREE.Vector3();
  private readonly origin = new THREE.Vector3();
  private readonly scale = new THREE.Vector3();
  private readonly matrix = new THREE.Matrix4();

  constructor(
    private readonly field: TerrainField,
    private readonly worldConfig: WorldConfig,
    private readonly profile: RuntimeProfile,
    private readonly grassConfig: GrassConfig,
  ) {}

  beginBuild(
    options: WorldSingleBladeTileBuildOptions,
  ): WorldSingleBladeTileBuildJob | undefined {
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
    const columns = Math.ceil(Math.sqrt(requestedCount));
    const rows = Math.ceil(requestedCount / columns);
    const cellWidth = tileSize / columns;
    const cellDepth = tileSize / rows;
    const originX = options.tileX * tileSize;
    const originZ = options.tileZ * tileSize;
    const tileCenterX = originX + tileSize * 0.5;
    const tileCenterZ = originZ + tileSize * 0.5;
    // Jitter can push a blade a little outside the nominal tile and its normal
    // taps reach a further step beyond that, so the cached area is grown on
    // every side by both. A few hundred samples here replace roughly eighteen
    // thousand across the tile's blades.
    const latticeMargin = TERRAIN_NORMAL_STEP + Math.max(cellWidth, cellDepth);
    const heightLattice = new TerrainHeightLattice();
    heightLattice.build(
      this.field,
      originX - latticeMargin,
      originZ - latticeMargin,
      tileSize + latticeMargin * 2,
      HEIGHT_LATTICE_SPACING,
    );
    return {
      options,
      requestedCount,
      columns,
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
      matrixValues: new Float32Array(requestedCount * 16),
      variations: new Float32Array(requestedCount * 4),
      coverages: new Float32Array(requestedCount),
      bounds: new THREE.Box3(),
      nextIndex: 0,
      bladeCount: 0,
      heightLattice,
    };
  }

  advanceBuild(
    job: WorldSingleBladeTileBuildJob,
    deadline: number,
  ): WorldSingleBladeTileBuildResult {
    if (job.nextIndex >= job.requestedCount) {
      return { complete: true, tile: this.finalizeBuild(job) };
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
      const x =
        job.originX +
        (column + 0.5) * job.cellWidth +
        job.random.range(
          -job.cellWidth * POSITION_JITTER,
          job.cellWidth * POSITION_JITTER,
        );
      const z =
        job.originZ +
        (row + 0.5) * job.cellDepth +
        job.random.range(
          -job.cellDepth * POSITION_JITTER,
          job.cellDepth * POSITION_JITTER,
        );
      const height = this.field.sampleHeight(x, z);
      // Suitability is a product of masks in [0,1], so the slope-free part
      // bounds the whole. Blades that already fail here can never pass, and
      // rejecting now skips the four extra height samples a normal costs.
      const suitabilityWithoutSlope =
        this.field.sampleGrassSuitabilityWithoutSlope(x, z, height);
      if (suitabilityWithoutSlope < MIN_SUITABILITY) {
        continue;
      }
      job.heightLattice.sampleNormal(x, z, TERRAIN_NORMAL_STEP, this.normal);
      const suitability =
        this.field.sampleGrassSlopeMask(this.normal) * suitabilityWithoutSlope;
      if (suitability < MIN_SUITABILITY - LATTICE_SUITABILITY_TOLERANCE) {
        continue;
      }

      this.position.set(
        x,
        height - this.grassConfig.distribution.rootSink,
        z,
      );
      job.bounds.expandByPoint(this.position);
      this.align.setFromUnitVectors(this.up, this.normal);
      this.yaw.setFromAxisAngle(this.up, job.random.range(0, TWO_PI));
      this.align.multiply(this.yaw);
      this.scale.set(
        job.random.range(0.76, INSTANCE_HORIZONTAL_SCALE_MAX),
        job.random.range(0.78, INSTANCE_VERTICAL_SCALE_MAX),
        job.random.range(0.76, INSTANCE_HORIZONTAL_SCALE_MAX),
      );
      // Tile-relative transforms let the mesh carry a real world position, so
      // three can depth-sort tiles against each other instead of giving every
      // one the scene origin as its sort key.
      this.localPosition.set(
        this.position.x - job.tileCenterX,
        this.position.y,
        this.position.z - job.tileCenterZ,
      );
      this.matrix.compose(this.localPosition, this.align, this.scale);
      this.matrix.toArray(job.matrixValues, job.bladeCount * 16);
      const variationOffset = job.bladeCount * 4;
      job.variations[variationOffset] = job.random.next();
      job.variations[variationOffset + 1] = job.random.range(0.84, 1.16);
      job.variations[variationOffset + 2] = job.random.range(0.97, 1.03);
      job.variations[variationOffset + 3] = THREE.MathUtils.clamp(
        (1 - suitability) * 0.25 + job.random.range(0, 0.06),
        0,
        1,
      );
      job.coverages[job.bladeCount] = 1;
      job.bladeCount += 1;
    }

    // Sorting and GPU resource creation get their own later slice rather than
    // extending a sampling slice that has already exhausted its deadline.
    return { complete: false };
  }

  private finalizeBuild(
    job: WorldSingleBladeTileBuildJob,
  ): WorldSingleBladeTile | undefined {
    const { options, bladeCount, matrixValues, variations, coverages, bounds } =
      job;
    if (bladeCount === 0) {
      return undefined;
    }

    const sortedDithers = this.sortInstancesByDither(
      matrixValues,
      variations,
      coverages,
      bladeCount,
      options.material.getDitherSeed(),
    );

    const sourceGeometry = this.getSourceGeometry(options.bladeSegments);
    const geometry = this.geometryFactory.createInstancedGeometry(
      sourceGeometry,
      variations.subarray(0, bladeCount * 4),
      coverages.subarray(0, bladeCount),
    );
    // InstancedMesh otherwise allocates and fills an identity matrix for every
    // instance before the completed static buffer replaces it.
    const mesh = new THREE.InstancedMesh(geometry, options.material.material, 0);
    mesh.name = `${options.namePrefix}-${options.key}`;
    mesh.castShadow = false;
    mesh.receiveShadow = options.receiveShadows && this.profile.shadows;
    mesh.frustumCulled = true;
    // Finish centring vertically now that the tile's terrain extent is known,
    // then convert the accumulated world bounds into the mesh-local space that
    // frustum culling expects.
    const centerY = (bounds.min.y + bounds.max.y) * 0.5;
    for (let index = 0; index < bladeCount; index += 1) {
      matrixValues[index * 16 + 13] -= centerY;
    }
    this.origin.set(job.tileCenterX, centerY, job.tileCenterZ);

    // Adopt the buffer the sampling loop already filled.
    mesh.instanceMatrix = new THREE.InstancedBufferAttribute(
      matrixValues.subarray(0, bladeCount * 16),
      16,
    );
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.count = bladeCount;

    bounds.expandByScalar(this.calculateBoundsPadding());
    bounds.min.sub(this.origin);
    bounds.max.sub(this.origin);
    mesh.position.copy(this.origin);
    // Single-blade tiles never move once built.
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.boundingBox = bounds;
    mesh.boundingSphere = bounds.getBoundingSphere(new THREE.Sphere());

    return {
      key: options.key,
      tileX: options.tileX,
      tileZ: options.tileZ,
      mesh,
      bladeCount,
      sortedDithers,
    };
  }

  /**
   * Reorders a tile's instance rows by the dither value the vertex shader
   * derives for each blade, ascending, and returns that sorted key array.
   *
   * The shader computes
   *   `fract(shade * 0.754877666 + phase * 0.569840296 + variation.x + seed)`.
   * Single-blade source geometry carries a constant 0.5 for both `shade` and
   * `phase` on every vertex, so the whole expression is per instance and can be
   * reproduced exactly here.
   */
  private sortInstancesByDither(
    matrixValues: Float32Array,
    variations: Float32Array,
    coverages: Float32Array,
    bladeCount: number,
    ditherSeed: number,
  ): Float32Array {
    const order = new Uint32Array(bladeCount);
    const dithers = new Float32Array(bladeCount);
    for (let index = 0; index < bladeCount; index += 1) {
      order[index] = index;
      const value = SINGLE_BLADE_DITHER_BIAS + variations[index * 4] + ditherSeed;
      dithers[index] = value - Math.floor(value);
    }
    order.sort((left, right) => dithers[left] - dithers[right]);

    const sortedMatrix = new Float32Array(bladeCount * 16);
    const sortedVariations = new Float32Array(bladeCount * 4);
    const sortedCoverages = new Float32Array(bladeCount);
    const sortedDithers = new Float32Array(bladeCount);
    for (let target = 0; target < bladeCount; target += 1) {
      const source = order[target];
      sortedMatrix.set(
        matrixValues.subarray(source * 16, source * 16 + 16),
        target * 16,
      );
      sortedVariations.set(
        variations.subarray(source * 4, source * 4 + 4),
        target * 4,
      );
      sortedCoverages[target] = coverages[source];
      sortedDithers[target] = dithers[source];
    }
    matrixValues.set(sortedMatrix);
    variations.set(sortedVariations);
    coverages.set(sortedCoverages);
    return sortedDithers;
  }

  disposeTile(tile: WorldSingleBladeTile): void {
    this.geometryFactory.disposeInstancedMesh(tile.mesh);
  }

  dispose(): void {
    for (const geometry of this.sourceGeometries.values()) {
      geometry.dispose();
    }
    this.sourceGeometries.clear();
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
    const lean =
      (config.geometry.bladeLeanMin + config.geometry.bladeLeanMax) * 0.5;
    const positions: number[] = [];
    const uvs: number[] = [];
    const progress: number[] = [];
    const phases: number[] = [];
    const shades: number[] = [];
    const indices: number[] = [];

    if (segments === 1) {
      positions.push(-width * 0.5, 0, 0, width * 0.5, 0, 0, 0, height, lean);
      uvs.push(0, 0, 1, 0, 0.5, 1);
      progress.push(0, 0, 1);
      phases.push(0.5, 0.5, 0.5);
      shades.push(0.5, 0.5, 0.5);
      indices.push(0, 1, 2);
    }

    for (let segment = 0; segments > 1 && segment <= segments; segment += 1) {
      const amount = segment / segments;
      const curve = amount * amount * (3 - 2 * amount);
      const taper = Math.pow(1 - amount, 0.72);
      const halfWidth = width * taper;
      const centerZ = lean * curve;
      positions.push(
        -halfWidth,
        height * amount,
        centerZ,
        halfWidth,
        height * amount,
        centerZ,
      );
      uvs.push(0, amount, 1, amount);
      progress.push(amount, amount);
      phases.push(0.5, 0.5);
      shades.push(0.5, 0.5);
    }

    for (let segment = 0; segments > 1 && segment < segments; segment += 1) {
      const row = segment * 2;
      indices.push(row, row + 2, row + 1, row + 2, row + 3, row + 1);
    }

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

  private hash(x: number, z: number, seed: number): number {
    let value = Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return (value ^ (value >>> 16)) >>> 0;
  }
}
