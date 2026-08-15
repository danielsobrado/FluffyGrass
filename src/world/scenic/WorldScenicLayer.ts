import * as THREE from "three";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import { WorldMeadowLife } from "./WorldMeadowLife";
import { WorldTreeSystem } from "./WorldTreeSystem";

/**
 * Trees and fauna owned as one failure domain beside stones and grass.
 * Ground rock is the stone field, not a second quad layer.
 */
export class WorldScenicLayer {
  private readonly trees: WorldTreeSystem;
  private readonly life: WorldMeadowLife;
  private disposed = false;

  constructor(
    scene: THREE.Scene,
    field: TerrainField,
    config: WorldConfig,
    profile: RuntimeProfile,
    spawn: THREE.Vector3,
    shadows: boolean,
  ) {
    this.trees = new WorldTreeSystem(scene, field, config, profile, shadows);
    this.life = new WorldMeadowLife(scene, field, spawn, profile);
  }

  update(deltaSeconds: number, focus: THREE.Vector3): void {
    if (this.disposed) {
      return;
    }
    this.trees.update(focus);
    this.life.update(deltaSeconds);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.trees.dispose();
    this.life.dispose();
  }
}
