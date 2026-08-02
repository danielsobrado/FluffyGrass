import * as THREE from "three";
import type { GrassLodConfig } from "./GrassConfig";
import { GrassLodLevel, type GrassPatch } from "./GrassPatchGrid";

const VISIBILITY_EPSILON = 0.001;

export class GrassLodController {
  private readonly cameraPosition = new THREE.Vector3();
  private readonly closestPoint = new THREE.Vector3();
  private readonly projectionViewMatrix = new THREE.Matrix4();
  private readonly frustum = new THREE.Frustum();

  constructor(private readonly config: GrassLodConfig) {}

  update(camera: THREE.Camera, patches: Iterable<GrassPatch>): void {
    camera.updateMatrixWorld();
    camera.getWorldPosition(this.cameraPosition);
    this.projectionViewMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    this.frustum.setFromProjectionMatrix(this.projectionViewMatrix);

    for (const patch of patches) {
      patch.inFrustum = this.frustum.intersectsBox(patch.bounds);
      patch.bounds.clampPoint(this.cameraPosition, this.closestPoint);
      patch.distance = this.cameraPosition.distanceTo(this.closestPoint);
      patch.lod = this.resolveLevel(patch.distance, patch.lod);
      patch.nearCoverage = this.resolveNearCoverage(patch.distance);
      patch.midDistanceFade = this.resolveMidDistanceFade(patch.distance);

      patch.nearMesh.visible =
        patch.inFrustum && patch.nearCoverage > VISIBILITY_EPSILON;
      patch.midMesh.visible =
        patch.inFrustum &&
        patch.nearCoverage < 1 - VISIBILITY_EPSILON &&
        patch.midDistanceFade > VISIBILITY_EPSILON;

      patch.nearMesh.userData.grassLodThreshold = patch.nearCoverage;
      patch.nearMesh.userData.grassDistanceFade = 1;
      patch.midMesh.userData.grassLodThreshold = patch.nearCoverage;
      patch.midMesh.userData.grassDistanceFade = patch.midDistanceFade;
    }
  }

  private resolveLevel(
    distance: number,
    currentLevel: GrassLodLevel,
  ): GrassLodLevel {
    const hysteresis = this.config.hysteresisDistance;

    if (currentLevel === GrassLodLevel.Near) {
      return distance > this.config.nearMaxDistance + hysteresis
        ? GrassLodLevel.Mid
        : GrassLodLevel.Near;
    }

    if (currentLevel === GrassLodLevel.Mid) {
      if (distance < this.config.nearMaxDistance - hysteresis) {
        return GrassLodLevel.Near;
      }
      return distance > this.config.farMaxDistance + hysteresis
        ? GrassLodLevel.Terrain
        : GrassLodLevel.Mid;
    }

    return distance < this.config.farMaxDistance - hysteresis
      ? GrassLodLevel.Mid
      : GrassLodLevel.Terrain;
  }

  private resolveNearCoverage(distance: number): number {
    const start =
      this.config.nearMaxDistance - this.config.transitionDistance;
    const end = this.config.nearMaxDistance + this.config.transitionDistance;
    return 1 - THREE.MathUtils.smoothstep(distance, start, end);
  }

  private resolveMidDistanceFade(distance: number): number {
    const start = this.config.farMaxDistance - this.config.transitionDistance;
    const end = this.config.farMaxDistance + this.config.transitionDistance;
    return 1 - THREE.MathUtils.smoothstep(distance, start, end);
  }
}
