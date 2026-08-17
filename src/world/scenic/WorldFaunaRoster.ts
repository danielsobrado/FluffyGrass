import type * as THREE from "three";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import { WorldFaunaField, type WorldFaunaMember } from "./WorldFaunaField";
import {
  FAUNA_REBUILD_STEP,
  FAUNA_SPAWN_MIN_PLAYER_DISTANCE,
} from "./WorldScenicTuning";

/**
 * The set of places a free animal could currently go.
 *
 * Kept apart from the population itself because it answers a different
 * question. The population owns actors and their animation cost; this owns only
 * the map — which herds exist near the player right now, and which of their
 * members is the best one for the next actor that needs a home.
 */
export class WorldFaunaRoster {
  private readonly herds: WorldFaunaField;
  private readonly available: WorldFaunaMember[] = [];
  private readonly streamRadius: number;
  private builtX = Number.NaN;
  private builtZ = Number.NaN;

  constructor(field: TerrainField, config: WorldConfig) {
    this.herds = new WorldFaunaField(field, config);
    this.streamRadius = config.faunaStreamRadius;
  }

  /**
   * Recollects the herd lattice when the player has actually gone somewhere.
   *
   * Guarded on focus movement the same way trees and litter are: collecting
   * herds is a terrain-sampling pass, and running it every frame would pay for
   * a decision that only changes once the player has moved.
   */
  refresh(focusX: number, focusZ: number, force = false): void {
    if (
      !force &&
      Number.isFinite(this.builtX) &&
      Math.abs(focusX - this.builtX) < FAUNA_REBUILD_STEP &&
      Math.abs(focusZ - this.builtZ) < FAUNA_REBUILD_STEP
    ) {
      return;
    }
    this.builtX = focusX;
    this.builtZ = focusZ;
    this.available.length = 0;
    for (const herd of this.herds.collect(focusX, focusZ, this.streamRadius)) {
      for (const member of herd.members) {
        this.available.push(member);
      }
    }
  }

  /**
   * Claims the nearest usable place, or nothing.
   *
   * Nearest first, so a limited pool of animals is always spent on the herds the
   * player can actually see. Taking them in cell order instead scatters the
   * population across the whole streaming radius and leaves the meadow in front
   * of the player empty while ten deer stand about beyond the fog.
   *
   * Never closer than the minimum, though: an animal fading in at ten metres is
   * worse than an empty meadow.
   */
  take(focus: THREE.Vector3): WorldFaunaMember | undefined {
    if (this.available.length === 0) {
      this.refresh(focus.x, focus.z, true);
    }
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < this.available.length; index += 1) {
      const member = this.available[index];
      const distance = Math.hypot(member.x - focus.x, member.z - focus.z);
      if (distance < FAUNA_SPAWN_MIN_PLAYER_DISTANCE || distance >= bestDistance) {
        continue;
      }
      bestDistance = distance;
      bestIndex = index;
    }
    if (bestIndex < 0) {
      return undefined;
    }
    return this.available.splice(bestIndex, 1)[0];
  }
}
