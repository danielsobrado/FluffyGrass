import * as THREE from "three";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import { WorldLitterSystem } from "./WorldLitterSystem";
import { WorldMeadowLife } from "./WorldMeadowLife";
import { WorldTreeSystem } from "./WorldTreeSystem";

/**
 * Trees, litter, and fauna owned as one failure domain beside stones and grass.
 */
export class WorldScenicLayer {
  private readonly trees: WorldTreeSystem;
  private readonly litter: WorldLitterSystem;
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
    this.litter = new WorldLitterSystem(scene, field, profile);
    this.life = new WorldMeadowLife(scene, field, spawn, profile);
  }

  update(deltaSeconds: number, focus: THREE.Vector3): void {
    if (this.disposed) {
      return;
    }
    this.trees.update(focus);
    this.litter.update(focus);
    this.life.update(deltaSeconds);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.trees.dispose();
    this.litter.dispose();
    this.life.dispose();
  }
}
