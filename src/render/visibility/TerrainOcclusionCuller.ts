import * as THREE from "three";
import type { TerrainField } from "../../world/TerrainField";
import type { WorldVisibilityConfig } from "./WorldVisibilityConfig";

export interface TerrainOcclusionDiagnostics {
  terrainTests: number;
  terrainSamples: number;
  occlusionCacheHits: number;
}

interface StaticOcclusionRecord {
  readonly centerX: number;
  readonly centerY: number;
  readonly centerZ: number;
  readonly radius: number;
  readonly occluded: boolean;
}

export class TerrainOcclusionCuller {
  private readonly cameraPosition = new THREE.Vector3();
  private readonly occlusionAnchor = new THREE.Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );
  private readonly staticOcclusion = new Map<string, StaticOcclusionRecord>();
  private diagnostics: TerrainOcclusionDiagnostics = createDiagnostics();

  constructor(
    private readonly field: TerrainField,
    private readonly config: WorldVisibilityConfig,
  ) {}

  beginFrame(cameraPosition: THREE.Vector3): void {
    this.cameraPosition.copy(cameraPosition);
    this.diagnostics = createDiagnostics();
    const reuseDistance = this.config.occlusionReuseDistance;
    if (
      this.cameraPosition.distanceToSquared(this.occlusionAnchor) >
      reuseDistance * reuseDistance
    ) {
      this.occlusionAnchor.copy(this.cameraPosition);
      this.staticOcclusion.clear();
    }
  }

  isOccluded(key: string, sphere: THREE.Sphere, cacheResult: boolean): boolean {
    if (cacheResult) {
      const cached = this.staticOcclusion.get(key);
      if (cached && boundsMatch(cached, sphere)) {
        this.diagnostics.occlusionCacheHits += 1;
        return cached.occluded;
      }
    }

    this.diagnostics.terrainTests += 1;
    const occluded = this.testSphere(sphere);
    if (cacheResult) {
      this.staticOcclusion.set(key, {
        centerX: sphere.center.x,
        centerY: sphere.center.y,
        centerZ: sphere.center.z,
        radius: sphere.radius,
        occluded,
      });
    }
    return occluded;
  }

  getDiagnostics(): TerrainOcclusionDiagnostics {
    return { ...this.diagnostics };
  }

  dispose(): void {
    this.staticOcclusion.clear();
  }

  private testSphere(sphere: THREE.Sphere): boolean {
    const dx = sphere.center.x - this.cameraPosition.x;
    const dz = sphere.center.z - this.cameraPosition.z;
    const horizontalDistance = Math.hypot(dx, dz);
    if (
      horizontalDistance <= sphere.radius ||
      horizontalDistance - sphere.radius <=
        this.config.terrainOcclusionNearDistance
    ) {
      return false;
    }

    const inverseDistance = 1 / horizontalDistance;
    const perpendicularX = -dz * inverseDistance;
    const perpendicularZ = dx * inverseDistance;
    const targetY = sphere.center.y + sphere.radius;
    const rayCount = this.config.terrainOcclusionRayCount;

    for (let ray = 0; ray < rayCount; ray += 1) {
      const normalizedOffset =
        rayCount === 1 ? 0 : (ray / (rayCount - 1)) * 2 - 1;
      const offset = normalizedOffset * sphere.radius;
      if (
        !this.isRayBlocked(
          sphere.center.x + perpendicularX * offset,
          sphere.center.z + perpendicularZ * offset,
          targetY,
          sphere.radius,
        )
      ) {
        return false;
      }
    }
    return true;
  }

  private isRayBlocked(
    targetX: number,
    targetZ: number,
    targetY: number,
    targetRadius: number,
  ): boolean {
    const dx = targetX - this.cameraPosition.x;
    const dz = targetZ - this.cameraPosition.z;
    const distance = Math.hypot(dx, dz);
    const start = this.config.terrainOcclusionNearDistance;
    const end =
      distance - Math.max(targetRadius, this.config.terrainOcclusionStep);
    if (end <= start) {
      return false;
    }

    const available = end - start;
    const samples = Math.min(
      Math.ceil(available / this.config.terrainOcclusionStep),
      this.config.terrainOcclusionMaxSamples,
    );
    const inverseDistance = 1 / distance;
    const directionX = dx * inverseDistance;
    const directionZ = dz * inverseDistance;
    const heightDelta = targetY - this.cameraPosition.y;
    const sampleSpacing = available / samples;

    for (let sample = 0; sample < samples; sample += 1) {
      const sampleDistance = start + sampleSpacing * (sample + 0.5);
      const ratio = sampleDistance * inverseDistance;
      const sightHeight = this.cameraPosition.y + heightDelta * ratio;
      const terrainHeight = this.field.sampleHeight(
        this.cameraPosition.x + directionX * sampleDistance,
        this.cameraPosition.z + directionZ * sampleDistance,
      );
      this.diagnostics.terrainSamples += 1;
      if (
        terrainHeight >=
        sightHeight + this.config.terrainOcclusionHeightBias
      ) {
        return true;
      }
    }
    return false;
  }
}

function boundsMatch(
  cached: StaticOcclusionRecord,
  sphere: THREE.Sphere,
): boolean {
  return (
    cached.centerX === sphere.center.x &&
    cached.centerY === sphere.center.y &&
    cached.centerZ === sphere.center.z &&
    cached.radius === sphere.radius
  );
}

function createDiagnostics(): TerrainOcclusionDiagnostics {
  return {
    terrainTests: 0,
    terrainSamples: 0,
    occlusionCacheHits: 0,
  };
}
