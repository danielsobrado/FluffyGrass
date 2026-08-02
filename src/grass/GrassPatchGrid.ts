import * as THREE from "three";

export enum GrassLodLevel {
  Near = 0,
  Mid = 1,
  Far = 2,
  Terrain = 3,
}

export interface GrassPatch {
  id: string;
  bounds: THREE.Box3;
  mesh: THREE.InstancedMesh;
  lod: GrassLodLevel;
}

export class GrassPatchGrid {
  private readonly patches = new Map<string, GrassPatch>();

  constructor(readonly patchSize: number) {}

  register(
    id: string,
    mesh: THREE.InstancedMesh,
    surface: THREE.Mesh,
  ): GrassPatch {
    surface.geometry.computeBoundingBox();
    surface.updateWorldMatrix(true, false);

    const bounds = surface.geometry.boundingBox
      ? surface.geometry.boundingBox.clone().applyMatrix4(surface.matrixWorld)
      : new THREE.Box3().setFromObject(surface);

    const patch: GrassPatch = {
      id,
      bounds,
      mesh,
      lod: GrassLodLevel.Near,
    };

    this.patches.set(id, patch);
    return patch;
  }

  values(): IterableIterator<GrassPatch> {
    return this.patches.values();
  }

  clear(): void {
    this.patches.clear();
  }
}
