import * as THREE from "three";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";

export class GrassDistribution {
  populate(
    target: THREE.InstancedMesh,
    surface: THREE.Mesh,
    instanceCount: number,
  ): void {
    const sampler = new MeshSurfaceSampler(surface)
      .setWeightAttribute("color")
      .build();

    surface.updateWorldMatrix(true, false);

    const position = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const worldNormal = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    const randomRotation = new THREE.Quaternion();
    const matrix = new THREE.Matrix4();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(surface.matrixWorld);

    for (let index = 0; index < instanceCount; index += 1) {
      sampler.sample(position, normal);
      position.applyMatrix4(surface.matrixWorld);
      worldNormal.copy(normal).applyMatrix3(normalMatrix).normalize();

      quaternion.setFromUnitVectors(up, worldNormal);
      randomRotation.setFromAxisAngle(up, Math.random() * Math.PI * 2);
      quaternion.multiply(randomRotation);

      matrix.compose(position, quaternion, scale);
      target.setMatrixAt(index, matrix);
    }

    target.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    target.instanceMatrix.needsUpdate = true;
  }
}
