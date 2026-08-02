import type { GUI } from "dat.gui";
import * as THREE from "three";
import type { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GrassConfigLoader } from "./internal/GrassConfigLoader";
import { GrassDistribution } from "./GrassDistribution";
import { GrassGeometryFactory } from "./GrassGeometryFactory";
import { GrassLodController } from "./GrassLodController";
import { GrassPatchGrid } from "./GrassPatchGrid";
import { GrassNearMaterial } from "./materials/GrassNearMaterial";
import { WindField } from "./wind/WindField";

interface GrassSystemDependencies {
  scene: THREE.Scene;
  textureLoader: THREE.TextureLoader;
  gltfLoader: GLTFLoader;
}

export class GrassSystem {
  private readonly configLoader = new GrassConfigLoader();
  private readonly distribution = new GrassDistribution();
  private readonly geometryFactory = new GrassGeometryFactory();
  private readonly material = new GrassNearMaterial();
  private readonly wind = new WindField();
  private patchGrid?: GrassPatchGrid;
  private lodController?: GrassLodController;
  private mesh?: THREE.InstancedMesh;
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
    if (this.mesh) {
      this.dependencies.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = undefined;
    }

    this.material.material.dispose();
    this.patchGrid?.clear();
  }

  private async createGrass(surface: THREE.Mesh): Promise<void> {
    const config = await this.configLoader.load();
    const [geometry, alphaTexture, noiseTexture] = await Promise.all([
      this.geometryFactory.load(
        this.dependencies.gltfLoader,
        config.modelPath,
        config.geometryName,
        config.geometryScale,
      ),
      this.dependencies.textureLoader.loadAsync(config.alphaTexturePath),
      this.dependencies.textureLoader.loadAsync(config.noiseTexturePath),
    ]);

    noiseTexture.wrapS = THREE.RepeatWrapping;
    noiseTexture.wrapT = THREE.RepeatWrapping;
    this.material.setupTextures(alphaTexture, noiseTexture);

    const mesh = new THREE.InstancedMesh(
      geometry,
      this.material.material,
      config.instanceCount,
    );
    mesh.name = "grass-near";
    mesh.receiveShadow = true;
    mesh.castShadow = false;

    this.distribution.populate(mesh, surface, config.instanceCount);
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();

    this.patchGrid = new GrassPatchGrid(config.patchSize);
    this.patchGrid.register("grass-root", mesh, surface);
    this.lodController = new GrassLodController(config.lod);

    this.mesh = mesh;
    this.dependencies.scene.add(mesh);
  }
}
