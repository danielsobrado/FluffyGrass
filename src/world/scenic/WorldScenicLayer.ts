import * as THREE from "three";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import { WorldFaunaSystem } from "./WorldFaunaSystem";
import { WorldTreeSystem } from "./WorldTreeSystem";

/**
 * Trees and fauna owned as one failure domain beside stones and grass.
 * Ground rock is the stone field, not a second quad layer.
 */
export class WorldScenicLayer {
  private readonly trees: WorldTreeSystem;
  private readonly life: WorldFaunaSystem;
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
    this.trees.update(focus);
    if (!this.faunaEnabled) {
      return;
    }
    // Fauna is ticked inside the controls subsystem, so a fault here would
    // otherwise take the player's own movement down with it. It gets the same
    // treatment stones get one level up: fail once, release, keep rendering.
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
