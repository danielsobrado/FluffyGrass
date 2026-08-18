import * as THREE from "three";
import type { TerrainField } from "../../world/TerrainField";
import { TerrainOcclusionCuller } from "./TerrainOcclusionCuller";
import type { WorldVisibilityConfig } from "./WorldVisibilityConfig";

export interface VisibilityTestOptions {
  readonly featureRadius: number;
  readonly minimumProjectedPixels: number;
  readonly terrainOcclusion?: boolean;
}

export interface WorldVisibilityDiagnostics {
  candidates: number;
  accepted: number;
  frustumRejected: number;
  screenRejected: number;
  terrainRejected: number;
  terrainTests: number;
  terrainSamples: number;
  occlusionCacheHits: number;
}

interface CameraVisibilityDiagnostics {
  candidates: number;
  accepted: number;
  frustumRejected: number;
  screenRejected: number;
  terrainRejected: number;
}

/** Shared camera visibility state for resident static-world render cells. */
export class WorldVisibilitySystem {
  private readonly projectionViewMatrix = new THREE.Matrix4();
  private readonly frustum = new THREE.Frustum();
  private readonly cameraPosition = new THREE.Vector3();
  private readonly terrainOcclusion: TerrainOcclusionCuller;
  private viewportHeight = 0;
  private projectionScale = 0;
  private diagnostics: CameraVisibilityDiagnostics = createDiagnostics();

  constructor(
    field: TerrainField,
    private readonly config: WorldVisibilityConfig,
  ) {
    this.terrainOcclusion = new TerrainOcclusionCuller(field, config);
  }

  setViewportHeight(height: number): void {
    this.viewportHeight = Number.isFinite(height) && height > 0 ? height : 0;
  }

  update(camera: THREE.PerspectiveCamera): void {
    camera.updateMatrixWorld();
    camera.getWorldPosition(this.cameraPosition);
    this.projectionViewMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    this.frustum.setFromProjectionMatrix(this.projectionViewMatrix);
    this.projectionScale =
      this.viewportHeight > 0
        ? this.viewportHeight /
          (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5))
        : 0;
    this.diagnostics = createDiagnostics();
    this.terrainOcclusion.beginFrame(this.cameraPosition);
  }

  testStaticSphere(
    key: string,
    sphere: THREE.Sphere,
    options: VisibilityTestOptions,
  ): boolean {
    return this.testSphere(key, sphere, options, true);
  }

  testDynamicSphere(
    sphere: THREE.Sphere,
    options: VisibilityTestOptions,
  ): boolean {
    return this.testSphere("", sphere, options, false);
  }

  isShadowRelevant(sphere: THREE.Sphere): boolean {
    return this.distanceToSphere(sphere) <= this.config.shadowDistance;
  }

  getDiagnostics(): WorldVisibilityDiagnostics {
    return {
      ...this.diagnostics,
      ...this.terrainOcclusion.getDiagnostics(),
    };
  }

  dispose(): void {
    this.terrainOcclusion.dispose();
  }

  private testSphere(
    key: string,
    sphere: THREE.Sphere,
    options: VisibilityTestOptions,
    cacheTerrainResult: boolean,
  ): boolean {
    this.diagnostics.candidates += 1;
    if (!this.frustum.intersectsSphere(sphere)) {
      this.diagnostics.frustumRejected += 1;
      return false;
    }
    if (
      this.config.screenSpaceEnabled >= 1 &&
      this.isBelowProjectedSize(sphere, options)
    ) {
      this.diagnostics.screenRejected += 1;
      return false;
    }
    if (
      options.terrainOcclusion !== false &&
      this.config.terrainOcclusionEnabled >= 1 &&
      this.distanceToSphere(sphere) >=
        this.config.terrainOcclusionNearDistance &&
      this.terrainOcclusion.isOccluded(key, sphere, cacheTerrainResult)
    ) {
      this.diagnostics.terrainRejected += 1;
      return false;
    }
    this.diagnostics.accepted += 1;
    return true;
  }

  private isBelowProjectedSize(
    sphere: THREE.Sphere,
    options: VisibilityTestOptions,
  ): boolean {
    if (
      this.projectionScale <= 0 ||
      options.minimumProjectedPixels <= 0 ||
      options.featureRadius <= 0
    ) {
      return false;
    }
    const centerDistance = this.cameraPosition.distanceTo(sphere.center);
    if (centerDistance <= sphere.radius) {
      return false;
    }
    const projectedDiameter =
      (options.featureRadius * 2 * this.projectionScale) /
      Math.max(centerDistance - sphere.radius, Number.EPSILON);
    return projectedDiameter < options.minimumProjectedPixels;
  }

  private distanceToSphere(sphere: THREE.Sphere): number {
    return Math.max(
      0,
      this.cameraPosition.distanceTo(sphere.center) - sphere.radius,
    );
  }
}

function createDiagnostics(): CameraVisibilityDiagnostics {
  return {
    candidates: 0,
    accepted: 0,
    frustumRejected: 0,
    screenRejected: 0,
    terrainRejected: 0,
  };
}
