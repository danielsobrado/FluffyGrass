import * as THREE from "three";
import type { GrassConfig } from "../../grass/GrassConfig";
import { GrassGeometryFactory } from "../../grass/GrassGeometryFactory";
import { SeededRandom } from "../../grass/internal/SeededRandom";
import type { GrassNearMaterial } from "../../grass/materials/GrassNearMaterial";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";

export interface WorldSingleBladeTile {
  key: string;
  mesh: THREE.InstancedMesh;
  bladeCount: number;
}

export interface WorldSingleBladeTileBuildOptions {
  key: string;
  tileX: number;
  tileZ: number;
  densityMultiplier: number;
  seedSalt: number;
  namePrefix: string;
  material: GrassNearMaterial;
}

const TWO_PI = Math.PI * 2;
const POSITION_JITTER = 0.46;
const MIN_SUITABILITY = 0.08;
const BOUNDS_PADDING = 1.5;

export class WorldSingleBladeTileFactory {
  private readonly geometryFactory = new GrassGeometryFactory();
  private readonly sourceGeometry: THREE.BufferGeometry;
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly normal = new THREE.Vector3();
  private readonly align = new THREE.Quaternion();
  private readonly yaw = new THREE.Quaternion();
  private readonly position = new THREE.Vector3();
  private readonly scale = new THREE.Vector3();
  private readonly matrix = new THREE.Matrix4();

  constructor(
    private readonly field: TerrainField,
    private readonly worldConfig: WorldConfig,
    private readonly profile: RuntimeProfile,
    private readonly grassConfig: GrassConfig,
  ) {
    this.sourceGeometry = this.createSingleBladeGeometry(grassConfig);
  }

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
      this.align.setFromUnitVectors(this.up, this.normal);
      this.yaw.setFromAxisAngle(this.up, random.range(0, TWO_PI));
      this.align.multiply(this.yaw);
      this.scale.set(
        random.range(0.76, 1.2),
        random.range(0.78, 1.22),
        random.range(0.76, 1.2),
      );
      this.matrix.compose(this.position, this.align, this.scale);
      this.matrix.toArray(matrixValues, bladeCount * 16);
      const variationOffset = bladeCount * 4;
      variations[variationOffset] = random.next();
      variations[variationOffset + 1] = random.range(0.84, 1.16);
      variations[variationOffset + 2] = random.range(0.98, 1.04);
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

    const geometry = this.geometryFactory.createInstancedGeometry(
      this.sourceGeometry,
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
    mesh.receiveShadow = this.profile.shadows;
    mesh.frustumCulled = true;
    mesh.instanceMatrix.array.set(matrixValues.subarray(0, bladeCount * 16));
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.instanceMatrix.needsUpdate = true;

    const bounds = new THREE.Box3(
      new THREE.Vector3(originX, -this.worldConfig.mountainHeight, originZ),
      new THREE.Vector3(
        originX + tileSize,
        this.worldConfig.mountainHeight + BOUNDS_PADDING,
        originZ + tileSize,
      ),
    );
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
    );

    return { key: options.key, mesh, bladeCount };
  }

  disposeTile(tile: WorldSingleBladeTile): void {
    this.geometryFactory.disposeInstancedMesh(tile.mesh);
  }

  dispose(): void {
    this.sourceGeometry.dispose();
  }

  private createSingleBladeGeometry(config: GrassConfig): THREE.BufferGeometry {
    const segments = Math.max(2, config.geometry.bladeSegments);
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

    for (let segment = 0; segment <= segments; segment += 1) {
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

    for (let segment = 0; segment < segments; segment += 1) {
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
