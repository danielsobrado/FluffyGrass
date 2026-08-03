import * as THREE from "three";

export enum GrassLodLevel {
  Near = 0,
  Mid = 1,
  Far = 2,
  Terrain = 3,
}

export interface GrassPatch {
  id: string;
  gridX: number;
  gridZ: number;
  bounds: THREE.Box3;
  boundingSphere: THREE.Sphere;
  nearMesh: THREE.InstancedMesh;
  midMesh: THREE.InstancedMesh;
  farMesh?: THREE.InstancedMesh;
  instanceCount: number;
  lod: GrassLodLevel;
  distance: number;
  inFrustum: boolean;
  nearCoverage: number;
  midCoverage?: number;
  farCoverage?: number;
  midDistanceFade?: number;
}

export class GrassPatchGrid {
  private readonly patches = new Map<string, GrassPatch>();

  constructor(readonly patchSize: number) {}

  keyFor(position: THREE.Vector3): string {
    return this.key(
      Math.floor(position.x / this.patchSize),
      Math.floor(position.z / this.patchSize),
    );
  }

  coordinatesFor(position: THREE.Vector3): readonly [number, number] {
    return [
      Math.floor(position.x / this.patchSize),
      Math.floor(position.z / this.patchSize),
    ];
  }

  register(patch: GrassPatch): void {
    if (this.patches.has(patch.id)) {
      throw new Error(`Grass patch ${patch.id} is already registered.`);
    }

    this.patches.set(patch.id, patch);
  }

  values(): IterableIterator<GrassPatch> {
    return this.patches.values();
  }

  clear(): void {
    this.patches.clear();
  }

  private key(gridX: number, gridZ: number): string {
    return `${gridX}:${gridZ}`;
  }
}
