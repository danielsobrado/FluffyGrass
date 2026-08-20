import * as THREE from "three";
import {
  patchGrassBladeCloudShadowMaterial,
  patchGrassVertexLitShaderMaterial,
  patchStandardCloudShadowMaterial,
} from "../../render/WorldCloudShadowMaterialPatch";
import type { WorldCloudShadowUniforms } from "./WorldCloudShadowUniforms";

const RESCAN_INTERVAL_SECONDS = 0.5;
const HORIZON_RESPONSE_STRENGTH = 0.35;

export interface WorldCloudShadowIntegrationDiagnostics {
  patchedMaterials: number;
}

export class WorldCloudShadowSceneIntegrator {
  private readonly patched = new WeakSet<THREE.Material>();
  private scanCountdown = 0;
  private patchedCount = 0;
  private disposed = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly uniforms: WorldCloudShadowUniforms,
  ) {}

  update(deltaSeconds: number): void {
    if (this.disposed) {
      return;
    }
    this.scanCountdown -= Math.max(0, deltaSeconds);
    if (this.scanCountdown > 0) {
      return;
    }
    this.scanCountdown = RESCAN_INTERVAL_SECONDS;
    this.scene.traverse(this.visitObject);
  }

  getDiagnostics(): WorldCloudShadowIntegrationDiagnostics {
    return { patchedMaterials: this.patchedCount };
  }

  dispose(): void {
    this.disposed = true;
  }

  private readonly visitObject = (object: THREE.Object3D): void => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) {
      return;
    }
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      if (this.patched.has(material)) {
        continue;
      }
      if (this.patchMaterial(object, material)) {
        this.patched.add(material);
        this.patchedCount += 1;
      }
    }
  };

  private patchMaterial(object: THREE.Object3D, material: THREE.Material): boolean {
    const name = material.name;
    if (
      material instanceof THREE.ShaderMaterial &&
      (name === "world-grass-subpatch-hemi-octahedral-impostor" ||
        name === "world-grass-detail-foliage")
    ) {
      patchGrassVertexLitShaderMaterial(material, this.uniforms);
      return true;
    }
    if (
      material instanceof THREE.MeshLambertMaterial &&
      name.startsWith("world-grass-")
    ) {
      patchGrassBladeCloudShadowMaterial(material, this.uniforms);
      return true;
    }
    if (name === "world-horizon-material") {
      patchStandardCloudShadowMaterial(
        material,
        this.uniforms,
        HORIZON_RESPONSE_STRENGTH,
      );
      return true;
    }
    if (
      name === "world-terrain-material" ||
      name === "world-hydrology-water-material" ||
      name.startsWith("world-stone-") ||
      object.name.startsWith("world-tree-")
    ) {
      patchStandardCloudShadowMaterial(material, this.uniforms);
      return true;
    }
    return false;
  }
}
