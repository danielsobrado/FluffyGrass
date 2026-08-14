import * as THREE from "three";
import { ScriptedHumanoidActor } from "../../character/npc/ScriptedHumanoidActor";
import { QuadrupedActor } from "../../creatures/quadruped/QuadrupedActor";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import type { TerrainField } from "../TerrainField";
import { WorldTerrainContactSampler } from "../WorldTerrainContactSampler";
import {
  FAUNA_NPC_RADIUS,
  FAUNA_NPC_SPEED,
  FAUNA_QUADRUPED_SPEED,
} from "./WorldScenicTuning";

/**
 * A few walkers around spawn so the meadow is not an empty tech demo.
 *
 * Compact devices keep one quadruped. Desktop adds a humanoid and a second
 * animal, all on deterministic circles that miss the player spawn.
 */
export class WorldMeadowLife {
  private readonly npc?: ScriptedHumanoidActor;
  private readonly animals: QuadrupedActor[] = [];
  private disposed = false;

  constructor(
    scene: THREE.Scene,
    field: TerrainField,
    spawn: THREE.Vector3,
    profile: RuntimeProfile,
  ) {
    const sampleHeight = (x: number, z: number): number => field.sampleHeight(x, z);
    const contact = new WorldTerrainContactSampler(field);
    this.animals.push(
      new QuadrupedActor(
        scene,
        1,
        {
          centerX: spawn.x - 11,
          centerZ: spawn.z + 8,
          radius: 9,
          speed: FAUNA_QUADRUPED_SPEED,
        },
        sampleHeight,
        contact,
      ),
    );
    if (profile.compact) {
      return;
    }
    this.npc = new ScriptedHumanoidActor(
      scene,
      1,
      {
        centerX: spawn.x + 9,
        centerZ: spawn.z + 3,
        radius: FAUNA_NPC_RADIUS,
        speed: FAUNA_NPC_SPEED,
        pauseSeconds: 2.4,
        walkSeconds: 6.2,
      },
      sampleHeight,
      contact,
    );
    this.animals.push(
      new QuadrupedActor(
        scene,
        1,
        {
          centerX: spawn.x + 16,
          centerZ: spawn.z - 7,
          radius: 11,
          speed: FAUNA_QUADRUPED_SPEED * 0.92,
        },
        sampleHeight,
        contact,
      ),
    );
  }

  update(deltaSeconds: number): void {
    if (this.disposed) {
      return;
    }
    this.npc?.update(deltaSeconds);
    for (const animal of this.animals) {
      animal.update(deltaSeconds);
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.npc?.dispose();
    for (const animal of this.animals) {
      animal.dispose();
    }
  }
}
