import * as THREE from "three";
import type { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class GrassGeometryFactory {
  async load(
    loader: GLTFLoader,
    modelPath: string,
    geometryName: string,
    scale: number,
  ): Promise<THREE.BufferGeometry> {
    const gltf = await loader.loadAsync(modelPath);
    let sourceGeometry: THREE.BufferGeometry | undefined;

    gltf.scene.traverse((child) => {
      if (
        !sourceGeometry &&
        child instanceof THREE.Mesh &&
        child.name.includes(geometryName)
      ) {
        sourceGeometry = child.geometry;
      }
    });

    if (!sourceGeometry) {
      throw new Error(
        `Grass geometry containing "${geometryName}" was not found in ${modelPath}.`,
      );
    }

    const geometry = sourceGeometry.clone();
    geometry.scale(scale, scale, scale);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }
}
