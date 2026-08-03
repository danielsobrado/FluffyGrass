import * as THREE from "three";
import type { GrassLodConfig } from "./GrassConfig";
import { GRASS_MID_IMPOSTOR_UNDERFILL } from "./GrassLodTuning";
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

      if (patch.farMesh) {
        this.updateThreeStagePatch(patch);
      } else {
        this.updateLegacyPatch(patch);
      }
    }
  }

  private updateThreeStagePatch(patch: GrassPatch): void {
    const farMesh = patch.farMesh;
    if (!farMesh) {
      return;
    }

    patch.lod = this.resolveLevel(patch.distance, patch.lod, true);
    patch.nearCoverage = this.resolveNearCoverage(patch.distance);
    const farEntry = this.resolveFarEntry(patch.distance);
    patch.midCoverage = Math.max(
      0,
      (1 - patch.nearCoverage) * (1 - farEntry),
    );
    patch.farCoverage = this.resolveFarCoverage(
      patch.distance,
      patch.nearCoverage,
      farEntry,
    );

    const farthestDistance =
      this.cameraPosition.distanceTo(patch.boundingSphere.center) +
      patch.boundingSphere.radius;
    const nearFadeStart =
      this.config.nearMaxDistance - this.config.transitionDistance;
    const nearFadeEnd =
      this.config.nearMaxDistance + this.config.transitionDistance;
    const farEntryEnd =
      this.config.midMaxDistance + this.config.transitionDistance;
    const terrainFadeEnd =
      this.config.farMaxDistance + this.config.transitionDistance;

    patch.nearMesh.visible =
      patch.inFrustum && patch.distance < nearFadeEnd;
    patch.midMesh.visible =
      patch.inFrustum &&
      farthestDistance > nearFadeStart &&
      patch.distance < farEntryEnd;
    farMesh.visible =
      patch.inFrustum &&
      farthestDistance > nearFadeStart &&
      patch.distance < terrainFadeEnd;

    patch.nearMesh.userData.grassLodThreshold = patch.nearCoverage;
    patch.nearMesh.userData.grassDistanceFade = 1;
    patch.midMesh.userData.grassLodThreshold = patch.nearCoverage;
    // World-space LOD coverage is already calculated per instance in the
    // material. Applying the patch-level mid coverage here as well intersects
    // two opposing dither ranges and makes the mid layer disappear halfway
    // through its transition to the far impostor.
    patch.midMesh.userData.grassDistanceFade = 1;
    farMesh.userData.grassImpostorCoverage = patch.farCoverage;
  }

  private updateLegacyPatch(patch: GrassPatch): void {
    patch.lod = this.resolveLevel(patch.distance, patch.lod, false);
    patch.nearCoverage = this.resolveNearCoverage(patch.distance);
    patch.midDistanceFade = this.resolveLegacyMidDistanceFade(patch.distance);
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

  private resolveLevel(
    distance: number,
    currentLevel: GrassLodLevel,
    hasFarImpostor: boolean,
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
      const upperDistance = hasFarImpostor
        ? this.config.midMaxDistance
        : this.config.farMaxDistance;
      return distance > upperDistance + hysteresis
        ? hasFarImpostor
          ? GrassLodLevel.Far
          : GrassLodLevel.Terrain
        : GrassLodLevel.Mid;
    }

    if (currentLevel === GrassLodLevel.Far && hasFarImpostor) {
      if (distance < this.config.midMaxDistance - hysteresis) {
        return GrassLodLevel.Mid;
      }
      return distance > this.config.farMaxDistance + hysteresis
        ? GrassLodLevel.Terrain
        : GrassLodLevel.Far;
    }

    if (distance >= this.config.farMaxDistance - hysteresis) {
      return GrassLodLevel.Terrain;
    }
    return hasFarImpostor ? GrassLodLevel.Far : GrassLodLevel.Mid;
  }

  private resolveNearCoverage(distance: number): number {
    const start =
      this.config.nearMaxDistance - this.config.transitionDistance;
    const end =
      this.config.nearMaxDistance + this.config.transitionDistance;
    return 1 - THREE.MathUtils.smoothstep(distance, start, end);
  }

  private resolveFarEntry(distance: number): number {
    const start = this.config.midMaxDistance - this.config.transitionDistance;
    const end = this.config.midMaxDistance + this.config.transitionDistance;
    return THREE.MathUtils.smoothstep(distance, start, end);
  }

  private resolveFarCoverage(
    distance: number,
    nearCoverage: number,
    entry: number,
  ): number {
    const terrainFadeStart =
      this.config.farMaxDistance - this.config.transitionDistance;
    const terrainFadeEnd =
      this.config.farMaxDistance + this.config.transitionDistance;
    const terrainFade = THREE.MathUtils.smoothstep(
      distance,
      terrainFadeStart,
      terrainFadeEnd,
    );
    const midUnderfill =
      (1 - nearCoverage) * GRASS_MID_IMPOSTOR_UNDERFILL;
    const densityCoverage = THREE.MathUtils.lerp(midUnderfill, 1, entry);
    return densityCoverage * (1 - terrainFade);
  }

  private resolveLegacyMidDistanceFade(distance: number): number {
    const start = this.config.farMaxDistance - this.config.transitionDistance;
    const end = this.config.farMaxDistance + this.config.transitionDistance;
    return 1 - THREE.MathUtils.smoothstep(distance, start, end);
  }
}
