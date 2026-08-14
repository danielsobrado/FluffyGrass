import * as THREE from "three";
import { SeededRandom } from "../../grass/internal/SeededRandom";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import { createHydrologySample } from "../hydrology/HydrologyField";
import type { TerrainField } from "../TerrainField";
import {
  LITTER_COMPACT_DENSITY,
  LITTER_COMPACT_RADIUS,
  LITTER_DESKTOP_DENSITY,
  LITTER_DESKTOP_RADIUS,
  LITTER_REBUILD_STEP,
} from "./WorldScenicTuning";

const DRY_LEAF = new THREE.Color("#8a7048");
const DARK_LEAF = new THREE.Color("#6a5536");
const scratch = new THREE.Object3D();
const normal = new THREE.Vector3();
const planeNormal = new THREE.Vector3(0, 0, 1);
const hydrology = createHydrologySample();
const LITTER_SEED = 0x4c495452;

export class WorldLitterSystem {
  private readonly mesh: THREE.InstancedMesh;
  private readonly radius: number;
  private readonly density: number;
  private readonly maxCount: number;
  private builtX = Number.NaN;
  private builtZ = Number.NaN;
  private disposed = false;

  constructor(
    scene: THREE.Scene,
    private readonly field: TerrainField,
    profile: RuntimeProfile,
  ) {
    this.radius = profile.compact ? LITTER_COMPACT_RADIUS : LITTER_DESKTOP_RADIUS;
    this.density = profile.compact ? LITTER_COMPACT_DENSITY : LITTER_DESKTOP_DENSITY;
    this.maxCount = Math.ceil(Math.PI * this.radius * this.radius * this.density);
    const geometry = new THREE.PlaneGeometry(0.16, 0.09);
    const material = new THREE.MeshStandardMaterial({
      color: DRY_LEAF,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.InstancedMesh(geometry, material, this.maxCount);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(this.maxCount * 3),
      3,
    );
    this.mesh.name = "world-ground-litter";
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
  }

  update(focus: THREE.Vector3): void {
    if (this.disposed) {
      return;
    }
    if (
      Number.isFinite(this.builtX) &&
      Math.abs(focus.x - this.builtX) < LITTER_REBUILD_STEP &&
      Math.abs(focus.z - this.builtZ) < LITTER_REBUILD_STEP
    ) {
      return;
    }
    this.builtX = focus.x;
    this.builtZ = focus.z;

    const random = new SeededRandom(
      hashCell(Math.floor(focus.x), Math.floor(focus.z), LITTER_SEED),
    );
    const area = Math.PI * this.radius * this.radius;
    const attempts = Math.min(this.maxCount, Math.ceil(area * this.density * 1.4));
    let count = 0;
    for (let index = 0; index < attempts && count < this.maxCount; index += 1) {
      const angle = random.next() * Math.PI * 2;
      const radius = Math.sqrt(random.next()) * this.radius;
      const x = focus.x + Math.cos(angle) * radius;
      const z = focus.z + Math.sin(angle) * radius;
      const height = this.field.sampleHeight(x, z);
      this.field.sampleHydrology(x, z, height, hydrology);
      if (hydrology.grassMask < 0.72 || hydrology.waterCoverage > 0.02) {
        continue;
      }
      this.field.sampleNormal(x, z, normal);
      scratch.position.set(x, height + 0.012, z);
      scratch.quaternion.setFromUnitVectors(planeNormal, normal);
      scratch.rotateZ(random.next() * Math.PI * 2);
      const size = 0.7 + random.next() * 0.8;
      scratch.scale.set(size, size, 1);
      scratch.updateMatrix();
      this.mesh.setMatrixAt(count, scratch.matrix);
      this.mesh.setColorAt(
        count,
        random.next() > 0.5 ? DRY_LEAF : DARK_LEAF,
      );
      count += 1;
    }
    this.mesh.count = count;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    disposeMaterial(this.mesh.material);
  }
}

function hashCell(x: number, z: number, seed: number): number {
  let value = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
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
