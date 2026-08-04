import * as THREE from "three";
import type { GrassConfig } from "../../grass/GrassConfig";
import { GrassGeometryFactory } from "../../grass/GrassGeometryFactory";
import { SeededRandom } from "../../grass/internal/SeededRandom";
import type { GrassNearMaterial } from "../../grass/materials/GrassNearMaterial";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import { calculateGrassSingleBladeRootBoundsRadius } from "./GrassRuntimeMath";

export interface WorldSingleBladeTile {
  key: string;
  tileX: number;
  tileZ: number;
  mesh: THREE.InstancedMesh;
  bladeCount: number;
}

export interface WorldSingleBladeTileBuildOptions {
  key: string;
  tileX: number;
  tileZ: number;
  densityMultiplier: number;
  bladeSegments: number;
  receiveShadows: boolean;
  detailMode: number;
  seedSalt: number;
  namePrefix: string;
  material: GrassNearMaterial;
}

const TWO_PI = Math.PI * 2;
const POSITION_JITTER = 0.46;
const MIN_SUITABILITY = 0.08;
const INSTANCE_HORIZONTAL_SCALE_MAX = 1.2;
const INSTANCE_VERTICAL_SCALE_MAX = 1.22;
const MAXIMUM_ART_WIND_SCALE = 2;
const MAXIMUM_INSTANCE_WIND_SCALE = 1.16;
const MAXIMUM_WIND_STIFFNESS = 1.12;
const INTERACTION_VERTICAL_SCALE = 0.2;
const BOUNDS_SAFETY_MARGIN = 0.05;

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

  build(options: WorldSingleBladeTileBuildOptions): WorldSingleBladeTile | undefined {
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
    const random = new SeededRandom(
      this.hash(
        options.tileX,
        options.tileZ,
        this.worldConfig.seed ^ options.seedSalt,
      ),
    );
    const matrixValues = new Float32Array(requestedCount * 16);
    const variations = new Float32Array(requestedCount * 4);
    const coverages = new Float32Array(requestedCount);
    const bounds = new THREE.Box3();
    let bladeCount = 0;

    for (let index = 0; index < requestedCount; index += 1) {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x =
        originX +
        (column + 0.5) * cellWidth +
        random.range(-cellWidth * POSITION_JITTER, cellWidth * POSITION_JITTER);
      const z =
        originZ +
        (row + 0.5) * cellDepth +
        random.range(-cellDepth * POSITION_JITTER, cellDepth * POSITION_JITTER);
      const height = this.field.sampleHeight(x, z);
      this.field.sampleNormal(x, z, this.normal);
      const suitability = this.field.sampleGrassSuitability(
        x,
        z,
        height,
        this.normal,
      );
      if (suitability < MIN_SUITABILITY) {
        continue;
      }

      this.position.set(
        x,
        height - this.grassConfig.distribution.rootSink,
        z,
      );
      bounds.expandByPoint(this.position);
      this.align.setFromUnitVectors(this.up, this.normal);
      this.yaw.setFromAxisAngle(this.up, random.range(0, TWO_PI));
      this.align.multiply(this.yaw);
      this.scale.set(
        random.range(0.76, INSTANCE_HORIZONTAL_SCALE_MAX),
        random.range(0.78, INSTANCE_VERTICAL_SCALE_MAX),
        random.range(0.76, INSTANCE_HORIZONTAL_SCALE_MAX),
      );
      // Tile-relative transforms let the mesh carry a real world position, so
      // three can depth-sort tiles against each other instead of giving every
      // one the scene origin as its sort key.
      this.localPosition.set(
        this.position.x - tileCenterX,
        this.position.y,
        this.position.z - tileCenterZ,
      );
      this.matrix.compose(this.localPosition, this.align, this.scale);
      this.matrix.toArray(matrixValues, bladeCount * 16);
      const variationOffset = bladeCount * 4;
      variations[variationOffset] = random.next();
      variations[variationOffset + 1] = random.range(0.84, 1.16);
      variations[variationOffset + 2] = random.range(0.97, 1.03);
      variations[variationOffset + 3] = THREE.MathUtils.clamp(
        (1 - suitability) * 0.25 + random.range(0, 0.06),
        0,
        1,
      );
      coverages[bladeCount] = 1;
      bladeCount += 1;
    }

    if (bladeCount === 0) {
      return undefined;
    }

    const sourceGeometry = this.getSourceGeometry(options.bladeSegments);
    const geometry = this.geometryFactory.createInstancedGeometry(
      sourceGeometry,
      variations.subarray(0, bladeCount * 4),
      coverages.subarray(0, bladeCount),
    );
    const mesh = new THREE.InstancedMesh(
      geometry,
      options.material.material,
      bladeCount,
    );
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
    this.origin.set(tileCenterX, centerY, tileCenterZ);

    // Adopt the buffer the loop already filled rather than copying it into the
    // second one InstancedMesh allocates.
    mesh.instanceMatrix = new THREE.InstancedBufferAttribute(
      matrixValues.subarray(0, bladeCount * 16),
      16,
    );
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    bounds.expandByScalar(this.calculateBoundsPadding());
    bounds.min.sub(this.origin);
    bounds.max.sub(this.origin);
    mesh.position.copy(this.origin);
    // Single-blade tiles never move once built.
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.boundingBox = bounds;
    mesh.boundingSphere = bounds.getBoundingSphere(new THREE.Sphere());
    options.material.bindMesh(
      mesh,
      this.hash(
        options.tileX,
        options.tileZ,
        this.worldConfig.seed ^ options.seedSalt,
      ),
      false,
      1,
      true,
      1,
      1,
      true,
      options.detailMode,
    );

    return {
      key: options.key,
      tileX: options.tileX,
      tileZ: options.tileZ,
      mesh,
      bladeCount,
    };
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
