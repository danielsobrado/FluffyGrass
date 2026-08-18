import * as THREE from "three";
import { disposeResources } from "../../render/ResourceDisposal";
import type { WorldVisibilityConfig } from "../../render/visibility/WorldVisibilityConfig";
import type { WorldVisibilitySystem } from "../../render/visibility/WorldVisibilitySystem";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import { WorldTreeField, type WorldTreeInstance } from "./WorldTreeField";
import {
  TREE_CELL_SIZE,
  TREE_COMPACT_RADIUS,
  TREE_DESKTOP_RADIUS,
  TREE_REBUILD_STEP,
} from "./WorldScenicTuning";

const BARK = new THREE.Color("#5a4633");
const FOLIAGE = new THREE.Color("#3d6a32");
const FOLIAGE_TIP = new THREE.Color("#6b9448");
const TREE_CANOPY_RENDER_SCALE = 1.35;
/** Covers tree-lattice cells intersecting both edges of a render cell. */
const TREE_CELL_CAPACITY_BORDER = 2;

interface TreeRenderCell {
  readonly key: string;
  readonly centerX: number;
  readonly centerZ: number;
  readonly trunkMesh: THREE.InstancedMesh;
  readonly canopyMesh: THREE.InstancedMesh;
  readonly localBounds: THREE.Box3;
  readonly worldSphere: THREE.Sphere;
  featureRadius: number;
}

const scratch = new THREE.Object3D();
const up = new THREE.Vector3(0, 1, 0);
const lean = new THREE.Vector3();

/**
 * Spatially batched deterministic trees.
 *
 * The old implementation put the full streamed tree radius into two giant
 * instanced meshes and disabled frustum culling. Cells keep instancing while
 * restoring useful bounds for frustum, screen-size, and terrain occlusion.
 */
export class WorldTreeSystem {
  private readonly field: WorldTreeField;
  private readonly radius: number;
  private readonly maxCount: number;
  private readonly renderCellSize: number;
  private readonly maxInstancesPerCell: number;
  private readonly cells = new Map<string, TreeRenderCell>();
  private readonly trunkGeometry: THREE.CylinderGeometry;
  private readonly canopyGeometry: THREE.IcosahedronGeometry;
  private readonly barkMaterial: THREE.MeshStandardMaterial;
  private readonly leavesMaterial: THREE.MeshStandardMaterial;
  private builtX = Number.NaN;
  private builtZ = Number.NaN;
  private disposed = false;

  constructor(
    private readonly scene: THREE.Scene,
    terrain: TerrainField,
    config: WorldConfig,
    private readonly visibilityConfig: WorldVisibilityConfig,
    profile: RuntimeProfile,
    private readonly shadows: boolean,
  ) {
    this.field = new WorldTreeField(terrain, config);
    this.radius = profile.compact ? TREE_COMPACT_RADIUS : TREE_DESKTOP_RADIUS;
    this.maxCount = profile.compact ? 36 : 96;
    this.renderCellSize = visibilityConfig.scenicCellSize;
    const latticeCellsPerRenderCell = Math.ceil(
      this.renderCellSize / TREE_CELL_SIZE + TREE_CELL_CAPACITY_BORDER,
    );
    this.maxInstancesPerCell = latticeCellsPerRenderCell ** 2;

    let barkMaterial: THREE.MeshStandardMaterial | undefined;
    let leavesMaterial: THREE.MeshStandardMaterial | undefined;
    let trunkGeometry: THREE.CylinderGeometry | undefined;
    let canopyGeometry: THREE.IcosahedronGeometry | undefined;
    try {
      barkMaterial = new THREE.MeshStandardMaterial({
        color: BARK,
        roughness: 0.92,
        metalness: 0,
      });
      leavesMaterial = new THREE.MeshStandardMaterial({
        color: FOLIAGE,
        roughness: 0.78,
        metalness: 0,
      });
      leavesMaterial.emissive.copy(FOLIAGE_TIP).multiplyScalar(0.04);

      trunkGeometry = new THREE.CylinderGeometry(0.07, 0.13, 1, 8, 1, false);
      trunkGeometry.translate(0, 0.5, 0);
      trunkGeometry.computeBoundingBox();
      trunkGeometry.computeBoundingSphere();
      canopyGeometry = new THREE.IcosahedronGeometry(1, 1);
      canopyGeometry.translate(0, 0.15, 0);
      canopyGeometry.computeBoundingBox();
      canopyGeometry.computeBoundingSphere();

      this.barkMaterial = barkMaterial;
      this.leavesMaterial = leavesMaterial;
      this.trunkGeometry = trunkGeometry;
      this.canopyGeometry = canopyGeometry;
    } catch (error) {
      disposeResources([
        trunkGeometry,
        canopyGeometry,
        barkMaterial,
        leavesMaterial,
      ]);
      throw error;
    }
  }

  update(focus: THREE.Vector3, visibility: WorldVisibilitySystem): void {
    if (this.disposed) {
      return;
    }
    if (
      !Number.isFinite(this.builtX) ||
      Math.abs(focus.x - this.builtX) >= TREE_REBUILD_STEP ||
      Math.abs(focus.z - this.builtZ) >= TREE_REBUILD_STEP
    ) {
      this.rebuild(focus);
    }
    this.updateVisibility(visibility);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    for (const cell of this.cells.values()) {
      this.removeCell(cell);
    }
    this.cells.clear();
    disposeResources([
      this.trunkGeometry,
      this.canopyGeometry,
      this.barkMaterial,
      this.leavesMaterial,
    ]);
  }

  private rebuild(focus: THREE.Vector3): void {
    this.builtX = focus.x;
    this.builtZ = focus.z;
    const trees = this.field
      .collect(focus.x, focus.z, this.radius)
      .slice(0, this.maxCount);
    const groups = new Map<string, WorldTreeInstance[]>();

    for (const tree of trees) {
      const cellX = Math.floor(tree.x / this.renderCellSize);
      const cellZ = Math.floor(tree.z / this.renderCellSize);
      const key = `${cellX}:${cellZ}`;
      let group = groups.get(key);
      if (!group) {
        group = [];
        groups.set(key, group);
      }
      group.push(tree);
    }

    for (const [key, cell] of this.cells) {
      if (groups.has(key)) {
        continue;
      }
      this.removeCell(cell);
      this.cells.delete(key);
    }

    for (const [key, group] of groups) {
      const [cellX, cellZ] = key.split(":").map(Number);
      let cell = this.cells.get(key);
      if (!cell) {
        cell = this.createCell(key, cellX, cellZ);
        this.cells.set(key, cell);
      }
      this.populateCell(cell, group);
    }
  }

  private createCell(key: string, cellX: number, cellZ: number): TreeRenderCell {
    const centerX = (cellX + 0.5) * this.renderCellSize;
    const centerZ = (cellZ + 0.5) * this.renderCellSize;
    const trunkMesh = new THREE.InstancedMesh(
      this.trunkGeometry,
      this.barkMaterial,
      this.maxInstancesPerCell,
    );
    const canopyMesh = new THREE.InstancedMesh(
      this.canopyGeometry,
      this.leavesMaterial,
      this.maxInstancesPerCell,
    );

    trunkMesh.name = `world-tree-trunks-${key}`;
    canopyMesh.name = `world-tree-canopies-${key}`;
    trunkMesh.position.set(centerX, 0, centerZ);
    canopyMesh.position.set(centerX, 0, centerZ);
    trunkMesh.matrixAutoUpdate = false;
    canopyMesh.matrixAutoUpdate = false;
    trunkMesh.updateMatrix();
    canopyMesh.updateMatrix();
    trunkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    canopyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    trunkMesh.frustumCulled = true;
    canopyMesh.frustumCulled = true;
    trunkMesh.castShadow = false;
    canopyMesh.castShadow = false;
    trunkMesh.receiveShadow = this.shadows;
    canopyMesh.receiveShadow = this.shadows;
    trunkMesh.count = 0;
    canopyMesh.count = 0;

    try {
      this.scene.add(trunkMesh, canopyMesh);
      trunkMesh.updateMatrixWorld(true);
      canopyMesh.updateMatrixWorld(true);
    } catch (error) {
      trunkMesh.removeFromParent();
      canopyMesh.removeFromParent();
      throw error;
    }

    return {
      key,
      centerX,
      centerZ,
      trunkMesh,
      canopyMesh,
      localBounds: new THREE.Box3(),
      worldSphere: new THREE.Sphere(),
      featureRadius: 0,
    };
  }

  private populateCell(
    cell: TreeRenderCell,
    trees: readonly WorldTreeInstance[],
  ): void {
    if (trees.length > this.maxInstancesPerCell) {
      throw new Error(
        `Tree render cell ${cell.key} exceeds capacity ${this.maxInstancesPerCell}.`,
      );
    }

    let featureRadius = 0;
    for (let index = 0; index < trees.length; index += 1) {
      const tree = trees[index];
      lean.set(tree.leanX, 1, tree.leanZ).normalize();
      scratch.position.set(tree.x - cell.centerX, tree.y, tree.z - cell.centerZ);
      scratch.quaternion.setFromUnitVectors(up, lean);
      scratch.rotateY(tree.yaw);
      scratch.scale.set(1, tree.height, 1);
      scratch.updateMatrix();
      cell.trunkMesh.setMatrixAt(index, scratch.matrix);

      scratch.position.set(
        tree.x - cell.centerX,
        tree.y + tree.height * 0.72,
        tree.z - cell.centerZ,
      );
      scratch.scale.setScalar(tree.canopyScale * TREE_CANOPY_RENDER_SCALE);
      scratch.updateMatrix();
      cell.canopyMesh.setMatrixAt(index, scratch.matrix);
      featureRadius = Math.max(
        featureRadius,
        tree.height,
        tree.canopyScale * TREE_CANOPY_RENDER_SCALE,
      );
    }

    cell.trunkMesh.count = trees.length;
    cell.canopyMesh.count = trees.length;
    cell.trunkMesh.instanceMatrix.needsUpdate = true;
    cell.canopyMesh.instanceMatrix.needsUpdate = true;
    cell.trunkMesh.computeBoundingBox();
    cell.trunkMesh.computeBoundingSphere();
    cell.canopyMesh.computeBoundingBox();
    cell.canopyMesh.computeBoundingSphere();

    const trunkBounds = cell.trunkMesh.boundingBox;
    const canopyBounds = cell.canopyMesh.boundingBox;
    if (!trunkBounds || !canopyBounds) {
      throw new Error(`Tree render cell ${cell.key} did not resolve bounds.`);
    }
    cell.localBounds.copy(trunkBounds).union(canopyBounds);
    cell.localBounds.getBoundingSphere(cell.worldSphere);
    cell.worldSphere.center.x += cell.centerX;
    cell.worldSphere.center.z += cell.centerZ;
    cell.featureRadius = featureRadius;
  }

  private updateVisibility(visibility: WorldVisibilitySystem): void {
    for (const cell of this.cells.values()) {
      const shadowRelevant =
        this.shadows && visibility.isShadowRelevant(cell.worldSphere);
      const cameraVisible = visibility.testStaticSphere(
        `tree:${cell.key}`,
        cell.worldSphere,
        {
          featureRadius: cell.featureRadius,
          minimumProjectedPixels: this.visibilityConfig.treeMinPixels,
          terrainOcclusion: !shadowRelevant,
        },
      );
      const renderVisible = cameraVisible || shadowRelevant;
      cell.trunkMesh.visible = renderVisible;
      cell.canopyMesh.visible = renderVisible;
      cell.trunkMesh.castShadow = shadowRelevant;
      cell.canopyMesh.castShadow = shadowRelevant;
    }
  }

  private removeCell(cell: TreeRenderCell): void {
    cell.trunkMesh.removeFromParent();
    cell.canopyMesh.removeFromParent();
    cell.trunkMesh.dispose();
    cell.canopyMesh.dispose();
  }
}
