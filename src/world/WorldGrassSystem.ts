import * as THREE from "three";
import type { GrassConfig } from "../grass/GrassConfig";
import { GrassGeometryFactory } from "../grass/GrassGeometryFactory";
import { GrassLodController } from "../grass/GrassLodController";
import {
  GrassLodLevel,
  type GrassPatch,
} from "../grass/GrassPatchGrid";
import { GrassConfigLoader } from "../grass/internal/GrassConfigLoader";
import { SeededRandom } from "../grass/internal/SeededRandom";
import { GrassNearMaterial } from "../grass/materials/GrassNearMaterial";
import { WindField } from "../grass/wind/WindField";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";
import type { TerrainField } from "./TerrainField";
import type { WorldConfig } from "./WorldConfig";
import { WorldGrassImpostorAtlasFactory } from "./grass/WorldGrassImpostorAtlasFactory";
import { WorldGrassImpostorMaterial } from "./grass/WorldGrassImpostorMaterial";
import { WorldGrassPatchGeometryFactory } from "./grass/WorldGrassPatchGeometryFactory";

interface WorldGrassPatch extends GrassPatch {
  farMesh: THREE.InstancedMesh;
  midCoverage: number;
  farCoverage: number;
}

interface GrassChunkRequest {
  key: string;
  chunkX: number;
  chunkZ: number;
  distance: number;
}

export interface WorldGrassDiagnostics {
  activePatches: number;
  queuedPatches: number;
  visibleNearPatches: number;
  visibleMidPatches: number;
  visibleFarPatches: number;
  clumps: number;
  blades: number;
  impostors: number;
}

const TWO_PI = Math.PI * 2;
const MID_WIND_SCALE = 0.62;
const FIELD_COVERAGE_MIN = 0.16;
const FIELD_COVERAGE_FULL = 0.5;

export class WorldGrassSystem {
  private readonly configLoader = new GrassConfigLoader();
  private readonly geometryFactory = new GrassGeometryFactory();
  private readonly patchGeometryFactory = new WorldGrassPatchGeometryFactory();
  private readonly impostorAtlasFactory = new WorldGrassImpostorAtlasFactory();
  private readonly material = new GrassNearMaterial();
  private readonly impostorMaterials: WorldGrassImpostorMaterial[] = [];
  private readonly wind = new WindField();
  private readonly patches = new Map<string, WorldGrassPatch>();
  private readonly queue: GrassChunkRequest[] = [];
  private readonly desired = new Map<string, GrassChunkRequest>();
  private readonly cameraPosition = new THREE.Vector3();
  private nearGeometries: THREE.BufferGeometry[] = [];
  private midGeometries: THREE.BufferGeometry[] = [];
  private grassConfig?: GrassConfig;
  private lodController?: GrassLodController;
  private nearBladesPerPatch = 0;
  private midBladesPerPatch = 0;
  private centerChunkX = Number.NaN;
  private centerChunkZ = Number.NaN;
  private initialized = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly field: TerrainField,
    private readonly worldConfig: WorldConfig,
    private readonly profile: RuntimeProfile,
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const grassConfig = await this.configLoader.load();
    const variants = this.patchGeometryFactory.createLodVariants(
      grassConfig.geometry,
      this.worldConfig,
      this.profile.compact,
      this.worldConfig.seed,
    );
    this.grassConfig = grassConfig;
    this.nearGeometries = variants.near;
    this.midGeometries = variants.mid;
    this.nearBladesPerPatch = variants.nearBladesPerPatch;
    this.midBladesPerPatch = variants.midBladesPerPatch;
    this.material.configure(grassConfig.material, grassConfig.wind);

    for (const bladeVariant of variants.bladeVariants) {
      const atlas = this.impostorAtlasFactory.create(
        bladeVariant,
        grassConfig.geometry,
        grassConfig.material,
        this.worldConfig.grassPatchSize,
        grassConfig.impostor,
      );
      this.impostorMaterials.push(
        new WorldGrassImpostorMaterial(
          atlas,
          grassConfig.material,
          grassConfig.wind,
        ),
      );
    }

    this.lodController = new GrassLodController({
      nearMaxDistance: this.worldConfig.grassNearDistance,
      midMaxDistance: this.worldConfig.grassMidDistance,
      farMaxDistance: this.worldConfig.grassFarDistance,
      transitionDistance: this.worldConfig.grassTransitionDistance,
      hysteresisDistance: this.worldConfig.grassHysteresisDistance,
    });
    this.initialized = true;
  }

  update(deltaSeconds: number, camera: THREE.Camera): void {
    if (!this.initialized || !this.lodController) {
      return;
    }

    const elapsedSeconds = this.wind.update(deltaSeconds);
    this.material.update(elapsedSeconds);
    for (const impostorMaterial of this.impostorMaterials) {
      impostorMaterial.update(elapsedSeconds);
    }

    camera.getWorldPosition(this.cameraPosition);
    const chunkX = Math.floor(this.cameraPosition.x / this.worldConfig.chunkSize);
    const chunkZ = Math.floor(this.cameraPosition.z / this.worldConfig.chunkSize);
    if (chunkX !== this.centerChunkX || chunkZ !== this.centerChunkZ) {
      this.centerChunkX = chunkX;
      this.centerChunkZ = chunkZ;
      this.reconcile();
    }

    for (
      let index = 0;
      index < this.worldConfig.grassChunksPerFrame && this.queue.length > 0;
      index += 1
    ) {
      const request = this.queue.shift();
      if (!request || !this.desired.has(request.key)) {
        continue;
      }
      const patch = this.createPatch(request);
      if (patch) {
        this.patches.set(request.key, patch);
        this.scene.add(patch.nearMesh, patch.midMesh, patch.farMesh);
      }
    }

    this.lodController.update(camera, this.patches.values());
  }

  getDiagnostics(): WorldGrassDiagnostics {
    let visibleNearPatches = 0;
    let visibleMidPatches = 0;
    let visibleFarPatches = 0;
    let bladePatches = 0;
    let blades = 0;
    let impostors = 0;

    for (const patch of this.patches.values()) {
      bladePatches += patch.instanceCount;
      visibleNearPatches += patch.nearMesh.visible ? 1 : 0;
      visibleMidPatches += patch.midMesh.visible ? 1 : 0;
      visibleFarPatches += patch.farMesh.visible ? 1 : 0;
      blades += Math.round(
        patch.instanceCount *
          (patch.nearCoverage * this.nearBladesPerPatch +
            patch.midCoverage * this.midBladesPerPatch +
            patch.farCoverage * this.nearBladesPerPatch),
      );
      if (patch.farMesh.visible) {
        impostors += patch.instanceCount;
      }
    }

    return {
      activePatches: this.patches.size,
      queuedPatches: this.queue.length,
      visibleNearPatches,
      visibleMidPatches,
      visibleFarPatches,
      clumps: bladePatches,
      blades,
      impostors,
    };
  }

  dispose(): void {
    for (const patch of this.patches.values()) {
      this.removePatch(patch);
    }
    this.patches.clear();
    this.queue.length = 0;
    this.desired.clear();
    for (const geometry of [...this.nearGeometries, ...this.midGeometries]) {
      geometry.dispose();
    }
    this.nearGeometries = [];
    this.midGeometries = [];
    this.material.material.dispose();
    for (const impostorMaterial of this.impostorMaterials) {
      impostorMaterial.dispose();
    }
    this.impostorMaterials.length = 0;
  }

  private reconcile(): void {
    const radius = this.profile.compact
      ? this.worldConfig.grassRadiusCompact
      : this.worldConfig.grassRadiusDesktop;
    const halfWorld = this.worldConfig.worldSize * 0.5;
    this.desired.clear();

    for (let dz = -radius; dz <= radius; dz += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const chunkX = this.centerChunkX + dx;
        const chunkZ = this.centerChunkZ + dz;
        const originX = chunkX * this.worldConfig.chunkSize;
        const originZ = chunkZ * this.worldConfig.chunkSize;
        if (
          originX < -halfWorld ||
          originZ < -halfWorld ||
          originX + this.worldConfig.chunkSize > halfWorld ||
          originZ + this.worldConfig.chunkSize > halfWorld
        ) {
          continue;
        }
        const key = `${chunkX}:${chunkZ}`;
        this.desired.set(key, {
          key,
          chunkX,
          chunkZ,
          distance: Math.max(Math.abs(dx), Math.abs(dz)),
        });
      }
    }

    for (const [key, patch] of this.patches) {
      if (!this.desired.has(key)) {
        this.removePatch(patch);
        this.patches.delete(key);
      }
    }

    this.queue.length = 0;
    for (const request of this.desired.values()) {
      if (!this.patches.has(request.key)) {
        this.queue.push(request);
      }
    }
    this.queue.sort((left, right) => left.distance - right.distance);
  }

  private createPatch(request: GrassChunkRequest): WorldGrassPatch | undefined {
    const grassConfig = this.grassConfig;
    if (!grassConfig) {
      return undefined;
    }

    const patchesPerAxis = Math.round(
      this.worldConfig.chunkSize / this.worldConfig.grassPatchSize,
    );
    const cellSize = this.worldConfig.chunkSize / patchesPerAxis;
    const jitterRadius =
      cellSize * this.worldConfig.grassPatchJitter * 0.5;
    const random = new SeededRandom(
      this.hash(request.chunkX, request.chunkZ, this.worldConfig.seed),
    );
    const matrices: THREE.Matrix4[] = [];
    const variations: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3();
    const align = new THREE.Quaternion();
    const yaw = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const position = new THREE.Vector3();
    const matrix = new THREE.Matrix4();
    const originX = request.chunkX * this.worldConfig.chunkSize;
    const originZ = request.chunkZ * this.worldConfig.chunkSize;

    for (let patchZ = 0; patchZ < patchesPerAxis; patchZ += 1) {
      for (let patchX = 0; patchX < patchesPerAxis; patchX += 1) {
        const x =
          originX +
          (patchX + 0.5) * cellSize +
          random.range(-jitterRadius, jitterRadius);
        const z =
          originZ +
          (patchZ + 0.5) * cellSize +
          random.range(-jitterRadius, jitterRadius);
        const height = this.field.sampleHeight(x, z);
        this.field.sampleNormal(x, z, normal);
        const suitability = this.field.sampleGrassSuitability(
          x,
          z,
          height,
          normal,
        );
        const coverage = THREE.MathUtils.smoothstep(
          suitability,
          FIELD_COVERAGE_MIN,
          FIELD_COVERAGE_FULL,
        );
        if (random.next() > coverage) {
          continue;
        }

        position.set(x, height - grassConfig.distribution.rootSink, z);
        align.setFromUnitVectors(up, normal);
        yaw.setFromAxisAngle(up, random.range(0, TWO_PI));
        align.multiply(yaw);
        const horizontalScale = random.range(0.96, 1.04);
        const heightScale =
          1 +
          random.range(
            -grassConfig.distribution.heightVariation,
            grassConfig.distribution.heightVariation,
          );
        scale.set(horizontalScale, heightScale, horizontalScale);
        matrix.compose(position, align, scale);
        matrices.push(matrix.clone());
        variations.push(
          random.next(),
          random.range(0.82, 1.14),
          random.range(0.97, 1.04),
          THREE.MathUtils.clamp(
            (1 - suitability) * 0.34 + random.range(0, 0.09),
            0,
            1,
          ),
        );
      }
    }

    if (matrices.length === 0) {
      return undefined;
    }

    const variationValues = new Float32Array(variations);
    const variantIndex =
      this.hash(request.chunkX, request.chunkZ, this.worldConfig.seed + 97) %
      grassConfig.geometry.variantCount;
    const nearMesh = this.createMesh(
      `world-grass-near-${request.key}`,
      this.nearGeometries[variantIndex],
      this.material.material,
      matrices,
      variationValues,
    );
    const midMesh = this.createMesh(
      `world-grass-mid-${request.key}`,
      this.midGeometries[variantIndex],
      this.material.material,
      matrices,
      variationValues,
    );
    const impostorMaterial = this.impostorMaterials[variantIndex];
    const farMesh = this.createMesh(
      `world-grass-far-${request.key}`,
      impostorMaterial.atlas.geometry,
      impostorMaterial.material,
      matrices,
      variationValues,
    );
    midMesh.visible = false;
    farMesh.visible = false;

    const ditherSeed = this.hash(
      request.chunkX,
      request.chunkZ,
      this.worldConfig.seed + 193,
    );
    this.material.bindMesh(nearMesh, ditherSeed, false, 1);
    this.material.bindMesh(midMesh, ditherSeed, true, MID_WIND_SCALE);
    impostorMaterial.bindMesh(farMesh, ditherSeed ^ 0x85ebca6b);

    const bounds = new THREE.Box3();
    if (nearMesh.boundingBox) {
      bounds.copy(nearMesh.boundingBox);
    }
    if (midMesh.boundingBox) {
      bounds.union(midMesh.boundingBox);
    }
    bounds.expandByScalar(
      Math.max(
        grassConfig.wind.strength +
          grassConfig.wind.flutterStrength +
          grassConfig.geometry.bladeLeanMax,
        impostorMaterial.atlas.radius * 0.25,
      ),
    );

    return {
      id: request.key,
      gridX: request.chunkX,
      gridZ: request.chunkZ,
      bounds,
      nearMesh,
      midMesh,
      farMesh,
      instanceCount: matrices.length,
      lod: GrassLodLevel.Near,
      distance: 0,
      inFrustum: true,
      nearCoverage: 1,
      midCoverage: 0,
      farCoverage: 0,
    };
  }

  private createMesh(
    name: string,
    sourceGeometry: THREE.BufferGeometry,
    material: THREE.Material,
    matrices: THREE.Matrix4[],
    variationValues: Float32Array,
  ): THREE.InstancedMesh {
    const geometry = this.geometryFactory.createInstancedGeometry(
      sourceGeometry,
      variationValues,
    );
    const mesh = new THREE.InstancedMesh(
      geometry,
      material,
      matrices.length,
    );
    mesh.name = name;
    mesh.castShadow = false;
    mesh.receiveShadow = this.profile.shadows;
    mesh.frustumCulled = false;
    matrices.forEach((instanceMatrix, index) => {
      mesh.setMatrixAt(index, instanceMatrix);
    });
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    return mesh;
  }

  private removePatch(patch: WorldGrassPatch): void {
    this.scene.remove(patch.nearMesh, patch.midMesh, patch.farMesh);
    patch.nearMesh.geometry.dispose();
    patch.midMesh.geometry.dispose();
    patch.farMesh.geometry.dispose();
  }

  private hash(x: number, z: number, seed: number): number {
    let value = Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return (value ^ (value >>> 16)) >>> 0;
  }
}
