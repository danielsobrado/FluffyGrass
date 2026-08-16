import * as THREE from "three";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import { WorldFaunaSystem } from "./WorldFaunaSystem";
import { WorldTreeSystem } from "./WorldTreeSystem";

/**
 * Trees and fauna owned beside stones and grass without sharing player-control
 * failure state. Ground rock is the stone field, not a second quad layer.
 */
export class WorldScenicLayer {
  private readonly trees: WorldTreeSystem;
  private readonly life: WorldFaunaSystem;
  private treesEnabled = true;
  private faunaEnabled = true;
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
    this.life = new WorldFaunaSystem(scene, field, config, profile, spawn, shadows);
  }

  update(deltaSeconds: number, focus: THREE.Vector3): void {
    if (this.disposed) {
      return;
    }

    if (this.treesEnabled) {
      try {
        this.trees.update(focus);
      } catch (error) {
        console.warn("[Drusniel World] Trees disabled after a fault.", error);
        this.treesEnabled = false;
        this.trees.dispose();
      }
    }

    if (!this.faunaEnabled) {
      return;
    }
    // Scenic systems are ticked inside the controls subsystem, so faults here
    // must release only the failing scenic owner and keep player input alive.
    try {
      this.life.update(deltaSeconds, focus);
    } catch (error) {
      console.warn("[Drusniel World] Fauna disabled after a fault.", error);
      this.faunaEnabled = false;
      this.life.dispose();
    }
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
