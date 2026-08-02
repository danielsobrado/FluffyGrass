import type { GUI } from "dat.gui";
import * as THREE from "three";
import type { GrassConfig } from "./GrassConfig";
import { GrassConfigLoader } from "./internal/GrassConfigLoader";
import {
  GrassDistribution,
  type GrassPlacement,
} from "./GrassDistribution";
import {
  GrassGeometryFactory,
  type GrassGeometryVariants,
} from "./GrassGeometryFactory";
import { GrassLodController } from "./GrassLodController";
import {
  GrassLodLevel,
  GrassPatchGrid,
  type GrassPatch,
} from "./GrassPatchGrid";
import { GrassNearMaterial } from "./materials/GrassNearMaterial";
import { WindField } from "./wind/WindField";

interface GrassSystemDependencies {
  scene: THREE.Scene;
}

interface PatchBucket {
  id: string;
  gridX: number;
  gridZ: number;
  placements: GrassPlacement[];
}

const MID_WIND_SCALE = 0.62;

export class GrassSystem {
  private readonly configLoader = new GrassConfigLoader();
  private readonly distribution = new GrassDistribution();
  private readonly geometryFactory = new GrassGeometryFactory();
  private readonly material = new GrassNearMaterial();
  private readonly wind = new WindField();
  private readonly meshes: THREE.InstancedMesh[] = [];
  private readonly sourceGeometries: THREE.BufferGeometry[] = [];
  private patchGrid?: GrassPatchGrid;
  private lodController?: GrassLodController;
  private initialization?: Promise<void>;

  constructor(private readonly dependencies: GrassSystemDependencies) {}

  attachGui(gui: GUI): void {
    this.material.setupGUI(gui);
  }

  initialize(surface: THREE.Mesh): Promise<void> {
    if (!this.initialization) {
      this.initialization = this.createGrass(surface);
    }

    return this.initialization;
  }

  update(deltaSeconds: number, camera: THREE.Camera): void {
    this.material.update(this.wind.update(deltaSeconds));
    if (this.patchGrid && this.lodController) {
      this.lodController.update(camera, this.patchGrid.values());
    }
  }

  dispose(): void {
    for (const mesh of this.meshes) {
      this.dependencies.scene.remove(mesh);
      mesh.geometry.dispose();
    }
    this.meshes.length = 0;

    for (const geometry of this.sourceGeometries) {
      geometry.dispose();
    }
    this.sourceGeometries.length = 0;

    this.material.material.dispose();
    this.patchGrid?.clear();
  }

  private async createGrass(surface: THREE.Mesh): Promise<void> {
    const config = await this.configLoader.load();
    const variants = this.geometryFactory.createLodVariants(
      config.geometry,
      config.distribution.seed,
    );
    this.sourceGeometries.push(...variants.near, ...variants.mid);

    this.material.configure(config.material, config.wind);
    this.patchGrid = new GrassPatchGrid(config.patchSize);
    this.lodController = new GrassLodController(config.lod);

    const placements = this.distribution.generate(
      surface,
      config.instanceCount,
      config.distribution,
    );
    const buckets = this.createPatchBuckets(placements, this.patchGrid);

    for (const bucket of buckets.values()) {
      const patch = this.createPatch(bucket, variants, config);
      this.patchGrid.register(patch);
      this.dependencies.scene.add(patch.nearMesh, patch.midMesh);
      this.meshes.push(patch.nearMesh, patch.midMesh);
    }

    console.info(
      `[FluffyGrass] Created ${buckets.size} grass patches from ${placements.length} clumps.`,
    );
  }

  private createPatchBuckets(
    placements: GrassPlacement[],
    grid: GrassPatchGrid,
  ): Map<string, PatchBucket> {
    const buckets = new Map<string, PatchBucket>();

    for (const placement of placements) {
      const id = grid.keyFor(placement.position);
      let bucket = buckets.get(id);
      if (!bucket) {
        const [gridX, gridZ] = grid.coordinatesFor(placement.position);
        bucket = { id, gridX, gridZ, placements: [] };
        buckets.set(id, bucket);
      }
      bucket.placements.push(placement);
    }

    return buckets;
  }

  private createPatch(
    bucket: PatchBucket,
    variants: GrassGeometryVariants,
    config: GrassConfig,
  ): GrassPatch {
    const variantIndex =
      this.hashPatch(bucket.gridX, bucket.gridZ, config.distribution.seed) %
      config.geometry.variantCount;
    const variationValues = this.createVariationValues(bucket.placements);
    const ditherSeed = this.hashPatch(
      bucket.gridX,
      bucket.gridZ,
      config.distribution.seed ^ 0x85ebca6b,
    );

    const nearMesh = this.createMesh(
      `grass-near-${bucket.id}`,
      variants.near[variantIndex],
      bucket.placements,
      variationValues,
    );
    const midMesh = this.createMesh(
      `grass-mid-${bucket.id}`,
      variants.mid[variantIndex],
      bucket.placements,
      variationValues,
    );
    midMesh.visible = false;

    this.material.bindMesh(nearMesh, ditherSeed, false, 1);
    this.material.bindMesh(midMesh, ditherSeed, true, MID_WIND_SCALE);

    const bounds = new THREE.Box3();
    if (nearMesh.boundingBox) {
      bounds.copy(nearMesh.boundingBox);
    }
    if (midMesh.boundingBox) {
      bounds.union(midMesh.boundingBox);
    }
    bounds.expandByScalar(
      config.wind.strength +
        config.wind.flutterStrength +
        config.geometry.bladeLeanMax,
    );

    return {
      id: bucket.id,
      gridX: bucket.gridX,
      gridZ: bucket.gridZ,
      bounds,
      nearMesh,
      midMesh,
      lod: GrassLodLevel.Near,
      distance: 0,
      inFrustum: true,
      nearCoverage: 1,
      midDistanceFade: 1,
    };
  }

  private createMesh(
    name: string,
    sourceGeometry: THREE.BufferGeometry,
    placements: GrassPlacement[],
    variationValues: Float32Array,
  ): THREE.InstancedMesh {
    const geometry = this.geometryFactory.createInstancedGeometry(
      sourceGeometry,
      variationValues,
    );
    const mesh = new THREE.InstancedMesh(
      geometry,
      this.material.material,
      placements.length,
    );
    mesh.name = name;
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.frustumCulled = false;

    placements.forEach((placement, index) => {
      mesh.setMatrixAt(index, placement.matrix);
    });
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    return mesh;
  }

  private createVariationValues(placements: GrassPlacement[]): Float32Array {
    const values = new Float32Array(placements.length * 4);
    placements.forEach((placement, index) => {
      values.set(placement.variation, index * 4);
    });
    return values;
  }

  private hashPatch(gridX: number, gridZ: number, seed: number): number {
    let value = Math.imul(gridX, 374761393) + Math.imul(gridZ, 668265263) + seed;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return (value ^ (value >>> 16)) >>> 0;
  }
}
