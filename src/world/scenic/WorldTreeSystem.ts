import * as THREE from "three";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import { WorldTreeField } from "./WorldTreeField";
import {
  TREE_COMPACT_RADIUS,
  TREE_DESKTOP_RADIUS,
  TREE_REBUILD_STEP,
} from "./WorldScenicTuning";

const BARK = new THREE.Color("#5a4633");
const FOLIAGE = new THREE.Color("#3d6a32");
const FOLIAGE_TIP = new THREE.Color("#6b9448");
const scratch = new THREE.Object3D();
const up = new THREE.Vector3(0, 1, 0);
const lean = new THREE.Vector3();

export class WorldTreeSystem {
  private readonly field: WorldTreeField;
  private readonly trunkMesh: THREE.InstancedMesh;
  private readonly canopyMesh: THREE.InstancedMesh;
  private readonly radius: number;
  private readonly maxCount: number;
  private builtX = Number.NaN;
  private builtZ = Number.NaN;
  private disposed = false;

  constructor(
    scene: THREE.Scene,
    terrain: TerrainField,
    config: WorldConfig,
    profile: RuntimeProfile,
    shadows: boolean,
  ) {
    this.field = new WorldTreeField(terrain, config);
    this.radius = profile.compact ? TREE_COMPACT_RADIUS : TREE_DESKTOP_RADIUS;
    this.maxCount = profile.compact ? 36 : 96;

    const bark = new THREE.MeshStandardMaterial({
      color: BARK,
      roughness: 0.92,
      metalness: 0,
    });
    const leaves = new THREE.MeshStandardMaterial({
      color: FOLIAGE,
      roughness: 0.78,
      metalness: 0,
    });
    leaves.emissive.copy(FOLIAGE_TIP).multiplyScalar(0.04);

    let trunk: THREE.CylinderGeometry | undefined;
    let canopy: THREE.IcosahedronGeometry | undefined;
    let trunkMesh: THREE.InstancedMesh | undefined;
    let canopyMesh: THREE.InstancedMesh | undefined;
    try {
      trunk = new THREE.CylinderGeometry(0.07, 0.13, 1, 8, 1, false);
      trunk.translate(0, 0.5, 0);
      canopy = new THREE.IcosahedronGeometry(1, 1);
      canopy.translate(0, 0.15, 0);

      trunkMesh = new THREE.InstancedMesh(trunk, bark, this.maxCount);
      canopyMesh = new THREE.InstancedMesh(canopy, leaves, this.maxCount);
      trunkMesh.name = "world-tree-trunks";
      canopyMesh.name = "world-tree-canopies";
      trunkMesh.castShadow = shadows;
      canopyMesh.castShadow = shadows;
      trunkMesh.receiveShadow = shadows;
      canopyMesh.receiveShadow = shadows;
      trunkMesh.frustumCulled = false;
      canopyMesh.frustumCulled = false;
      trunkMesh.count = 0;
      canopyMesh.count = 0;
      scene.add(trunkMesh, canopyMesh);

      this.trunkMesh = trunkMesh;
      this.canopyMesh = canopyMesh;
    } catch (error) {
      trunkMesh?.removeFromParent();
      canopyMesh?.removeFromParent();
      trunk?.dispose();
      canopy?.dispose();
      bark.dispose();
      leaves.dispose();
      throw error;
    }
  }

  update(focus: THREE.Vector3): void {
    if (this.disposed) {
      return;
    }
    if (
      Number.isFinite(this.builtX) &&
      Math.abs(focus.x - this.builtX) < TREE_REBUILD_STEP &&
      Math.abs(focus.z - this.builtZ) < TREE_REBUILD_STEP
    ) {
      return;
    }
    this.builtX = focus.x;
    this.builtZ = focus.z;
    const trees = this.field.collect(focus.x, focus.z, this.radius);
    const count = Math.min(trees.length, this.maxCount);
    for (let index = 0; index < count; index += 1) {
      const tree = trees[index];
      lean.set(tree.leanX, 1, tree.leanZ).normalize();
      scratch.position.set(tree.x, tree.y, tree.z);
      scratch.quaternion.setFromUnitVectors(up, lean);
      scratch.rotateY(tree.yaw);
      scratch.scale.set(1, tree.height, 1);
      scratch.updateMatrix();
      this.trunkMesh.setMatrixAt(index, scratch.matrix);

      scratch.position.set(tree.x, tree.y + tree.height * 0.72, tree.z);
      scratch.scale.setScalar(tree.canopyScale * 1.35);
      scratch.updateMatrix();
      this.canopyMesh.setMatrixAt(index, scratch.matrix);
    }
    this.trunkMesh.count = count;
    this.canopyMesh.count = count;
    this.trunkMesh.instanceMatrix.needsUpdate = true;
    this.canopyMesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.trunkMesh.removeFromParent();
    this.canopyMesh.removeFromParent();
    this.trunkMesh.geometry.dispose();
    this.canopyMesh.geometry.dispose();
    disposeMaterial(this.trunkMesh.material);
    disposeMaterial(this.canopyMesh.material);
  }
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    for (const entry of material) {
      entry.dispose();
    }
    return;
  }
  material.dispose();
}
