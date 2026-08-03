import * as THREE from "three";
import type { GrassConfig, GrassLodConfig } from "../../grass/GrassConfig";
import { GrassGeometryFactory } from "../../grass/GrassGeometryFactory";
import { GrassConfigLoader } from "../../grass/internal/GrassConfigLoader";
import { SeededRandom } from "../../grass/internal/SeededRandom";
import { GrassNearMaterial } from "../../grass/materials/GrassNearMaterial";
import { WindField } from "../../grass/wind/WindField";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import { APP_VERSION } from "../../version";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";

interface NearGrassTile {
  key: string;
  mesh: THREE.InstancedMesh;
  bladeCount: number;
}

interface NearGrassTileRequest {
  key: string;
  tileX: number;
  tileZ: number;
  distance: number;
}

const TWO_PI = Math.PI * 2;
const TILES_PER_FRAME = 1;
const POSITION_JITTER = 0.46;
const MIN_SUITABILITY = 0.08;
const BOUNDS_PADDING = 1.5;

export class WorldNearGrassField {
  private readonly configLoader = new GrassConfigLoader();
  private readonly geometryFactory = new GrassGeometryFactory();
  private readonly material = new GrassNearMaterial();
  private readonly wind = new WindField();
  private readonly tiles = new Map<string, NearGrassTile>();
  private readonly desired = new Set<string>();
  private readonly queue: NearGrassTileRequest[] = [];
  private sourceGeometry?: THREE.BufferGeometry;
  private grassConfig?: GrassConfig;
  private lodConfig?: GrassLodConfig;
  private centerTileX = Number.NaN;
  private centerTileZ = Number.NaN;
  private initialization?: Promise<void>;
  private initialized = false;
  private disposed = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly field: TerrainField,
    private readonly worldConfig: WorldConfig,
    private readonly profile: RuntimeProfile,
  ) {}

  initialize(): Promise<void> {
    if (this.disposed) {
      return Promise.reject(new Error("WorldNearGrassField has been disposed."));
    }
    if (!this.initialization) {
      this.initialization = this.initializeInternal();
    }
    return this.initialization;
  }

  update(deltaSeconds: number, focus: THREE.Vector3): void {
    if (!this.initialized || this.disposed) {
      return;
    }

    this.material.update(this.wind.update(deltaSeconds));
    const tileSize = this.worldConfig.grassNearTileSize;
    const tileX = Math.floor(focus.x / tileSize);
    const tileZ = Math.floor(focus.z / tileSize);
    if (tileX !== this.centerTileX || tileZ !== this.centerTileZ) {
      this.centerTileX = tileX;
      this.centerTileZ = tileZ;
      this.reconcile(focus);
    }

    for (let count = 0; count < TILES_PER_FRAME && this.queue.length > 0; count += 1) {
      const request = this.queue.shift();
      if (!request || !this.desired.has(request.key) || this.tiles.has(request.key)) {
        count -= 1;
        continue;
      }
      const tile = this.buildTile(request);
      if (tile) {
        this.tiles.set(request.key, tile);
        this.scene.add(tile.mesh);
      }
    }
  }

  getBladeCount(): number {
    let count = 0;
    for (const tile of this.tiles.values()) {
      count += tile.bladeCount;
    }
    return count;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.initialized = false;
    for (const tile of this.tiles.values()) {
      this.scene.remove(tile.mesh);
      this.geometryFactory.disposeInstancedMesh(tile.mesh);
    }
    this.tiles.clear();
    this.desired.clear();
    this.queue.length = 0;
    this.sourceGeometry?.dispose();
    this.sourceGeometry = undefined;
    this.material.material.dispose();
  }

  private async initializeInternal(): Promise<void> {
    const grassConfig = await this.configLoader.load(
      `./config/grass.yaml?v=${encodeURIComponent(APP_VERSION)}`,
    );
    if (this.disposed) {
      return;
    }

    this.grassConfig = grassConfig;
    this.lodConfig = {
      nearMaxDistance: this.worldConfig.grassNearDistance,
      midMaxDistance: this.worldConfig.grassMidDistance,
      farMaxDistance: this.worldConfig.grassFarDistance,
      transitionDistance: this.worldConfig.grassTransitionDistance,
      hysteresisDistance: this.worldConfig.grassHysteresisDistance,
    };
    this.sourceGeometry = this.createSingleBladeGeometry(grassConfig);
    this.material.configure(grassConfig.material, grassConfig.wind);
    this.material.configureLod(this.lodConfig);
    this.initialized = true;
  }

  private reconcile(focus: THREE.Vector3): void {
    const tileSize = this.worldConfig.grassNearTileSize;
    const radius =
      this.worldConfig.grassNearDistance +
      this.worldConfig.grassTransitionDistance +
      tileSize * Math.SQRT2;
    const offset = Math.ceil(radius / tileSize);
    this.desired.clear();
    const requests: NearGrassTileRequest[] = [];

    for (let dz = -offset; dz <= offset; dz += 1) {
      for (let dx = -offset; dx <= offset; dx += 1) {
        const tileX = this.centerTileX + dx;
        const tileZ = this.centerTileZ + dz;
        const originX = tileX * tileSize;
        const originZ = tileZ * tileSize;
        const distance = this.distanceToTile(
          focus.x,
          focus.z,
          originX,
          originZ,
          tileSize,
        );
        if (distance > radius) {
          continue;
        }
        const key = `${tileX}:${tileZ}`;
        this.desired.add(key);
        if (!this.tiles.has(key)) {
          requests.push({ key, tileX, tileZ, distance });
        }
      }
    }

    for (const [key, tile] of this.tiles) {
      if (!this.desired.has(key)) {
        this.scene.remove(tile.mesh);
        this.geometryFactory.disposeInstancedMesh(tile.mesh);
        this.tiles.delete(key);
      }
    }

    requests.sort((left, right) => left.distance - right.distance);
    this.queue.length = 0;
    this.queue.push(...requests);
  }

  private buildTile(request: NearGrassTileRequest): NearGrassTile | undefined {
    const grass = this.grassConfig;
    const sourceGeometry = this.sourceGeometry;
    if (!grass || !sourceGeometry) {
      return undefined;
    }

    const tileSize = this.worldConfig.grassNearTileSize;
    const density = this.profile.compact
      ? this.worldConfig.grassNearBladesPerSquareMeterCompact
      : this.worldConfig.grassNearBladesPerSquareMeterDesktop;
    const requestedCount = Math.max(1, Math.round(tileSize * tileSize * density));
    const columns = Math.ceil(Math.sqrt(requestedCount));
    const rows = Math.ceil(requestedCount / columns);
    const cellWidth = tileSize / columns;
    const cellDepth = tileSize / rows;
    const originX = request.tileX * tileSize;
    const originZ = request.tileZ * tileSize;
    const random = new SeededRandom(
      this.hash(request.tileX, request.tileZ, this.worldConfig.seed ^ 0x6a09e667),
    );
    const matrixValues = new Float32Array(requestedCount * 16);
    const variations = new Float32Array(requestedCount * 4);
    const coverages = new Float32Array(requestedCount);
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3();
    const align = new THREE.Quaternion();
    const yaw = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const matrix = new THREE.Matrix4();
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
      this.field.sampleNormal(x, z, normal);
      const suitability = this.field.sampleGrassSuitability(x, z, height, normal);
      if (suitability < MIN_SUITABILITY) {
        continue;
      }

      position.set(x, height - grass.distribution.rootSink, z);
      align.setFromUnitVectors(up, normal);
      yaw.setFromAxisAngle(up, random.range(0, TWO_PI));
      align.multiply(yaw);
      scale.set(
        random.range(0.76, 1.2),
        random.range(0.78, 1.22),
        random.range(0.76, 1.2),
      );
      matrix.compose(position, align, scale);
      matrix.toArray(matrixValues, bladeCount * 16);
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
      sourceGeometry,
      variations.subarray(0, bladeCount * 4),
      coverages.subarray(0, bladeCount),
    );
    const mesh = new THREE.InstancedMesh(geometry, this.material.material, bladeCount);
    mesh.name = `world-grass-single-blades-${request.key}`;
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
    this.material.bindMesh(
      mesh,
      this.hash(request.tileX, request.tileZ, this.worldConfig.seed),
      false,
      1,
      true,
      1,
      1,
      true,
    );

    return { key: request.key, mesh, bladeCount };
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
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("grassProgress", new THREE.Float32BufferAttribute(progress, 1));
    geometry.setAttribute("grassPhase", new THREE.Float32BufferAttribute(phases, 1));
    geometry.setAttribute("grassBladeShade", new THREE.Float32BufferAttribute(shades, 1));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }

  private distanceToTile(
    x: number,
    z: number,
    originX: number,
    originZ: number,
    tileSize: number,
  ): number {
    const distanceX = Math.max(originX - x, 0, x - (originX + tileSize));
    const distanceZ = Math.max(originZ - z, 0, z - (originZ + tileSize));
    return Math.hypot(distanceX, distanceZ);
  }

  private hash(x: number, z: number, seed: number): number {
    let value = Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return (value ^ (value >>> 16)) >>> 0;
  }
}
