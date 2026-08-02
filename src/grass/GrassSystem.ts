import type { GUI } from "dat.gui";
import * as THREE from "three";
import { GrassConfigLoader } from "./internal/GrassConfigLoader";
import { GrassDistribution } from "./GrassDistribution";
import { GrassGeometryFactory } from "./GrassGeometryFactory";
import { GrassLodController } from "./GrassLodController";
import { GrassPatchGrid } from "./GrassPatchGrid";
import { GrassNearMaterial } from "./materials/GrassNearMaterial";
import { WindField } from "./wind/WindField";

interface GrassSystemDependencies {
  scene: THREE.Scene;
}

export class GrassSystem {
  private readonly configLoader = new GrassConfigLoader();
  private readonly distribution = new GrassDistribution();
  private readonly geometryFactory = new GrassGeometryFactory();
  private readonly material = new GrassNearMaterial();
  private readonly wind = new WindField();
  private readonly meshes: THREE.InstancedMesh[] = [];
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
    this.material.material.dispose();
    this.patchGrid?.clear();
  }

  private async createGrass(surface: THREE.Mesh): Promise<void> {
    const config = await this.configLoader.load();
    const geometries = this.geometryFactory.createVariants(
      config.geometry,
      config.distribution.seed,
    );

    this.material.configure(config.material, config.wind);
    this.patchGrid = new GrassPatchGrid(config.patchSize);
    this.lodController = new GrassLodController(config.lod);

    const baseCount = Math.floor(
      config.instanceCount / config.geometry.variantCount,
    );
    let remaining = config.instanceCount;

    geometries.forEach((geometry, variantIndex) => {
      const variantsLeft = geometries.length - variantIndex;
      const requestedCount =
        variantIndex === geometries.length - 1
          ? remaining
          : Math.min(baseCount, remaining - (variantsLeft - 1));
      remaining -= requestedCount;

      const mesh = new THREE.InstancedMesh(
        geometry,
        this.material.material,
        requestedCount,
      );
      mesh.name = `grass-near-${variantIndex}`;
      mesh.receiveShadow = true;
      mesh.castShadow = false;
      mesh.frustumCulled = true;

      this.distribution.populate(
        mesh,
        surface,
        requestedCount,
        config.distribution,
        variantIndex,
      );
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();

      this.patchGrid?.register(`grass-root-${variantIndex}`, mesh, surface);
      this.meshes.push(mesh);
      this.dependencies.scene.add(mesh);
    });
  }
}
