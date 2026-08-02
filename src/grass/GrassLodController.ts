import * as THREE from "three";
import type { GrassLodConfig } from "./GrassConfig";
import { GrassLodLevel, type GrassPatch } from "./GrassPatchGrid";

export class GrassLodController {
  private readonly cameraPosition = new THREE.Vector3();
  private readonly closestPoint = new THREE.Vector3();

  constructor(private readonly config: GrassLodConfig) {}

  update(camera: THREE.Camera, patches: Iterable<GrassPatch>): void {
    camera.getWorldPosition(this.cameraPosition);

    for (const patch of patches) {
      patch.bounds.clampPoint(this.cameraPosition, this.closestPoint);
      patch.lod = this.resolveLevel(
        this.cameraPosition.distanceTo(this.closestPoint),
      );
    }
  }

  private resolveLevel(distance: number): GrassLodLevel {
    if (distance <= this.config.nearMaxDistance) {
      return GrassLodLevel.Near;
    }
    if (distance <= this.config.midMaxDistance) {
      return GrassLodLevel.Mid;
    }
    if (distance <= this.config.farMaxDistance) {
      return GrassLodLevel.Far;
    }

    return GrassLodLevel.Terrain;
  }
}
