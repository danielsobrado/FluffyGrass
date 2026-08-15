import * as THREE from "three";
import type { WorldActorProofContext } from "../app/WorldActorProofContext";
import { GltfHumanoidActor } from "../character/gltf/GltfHumanoidActor";
import { ScriptedHumanoidActor } from "../character/npc/ScriptedHumanoidActor";
import {
  createVillagerAssets,
  type VillagerAssets,
} from "../character/npc/VillagerAssets";
import { createDeerAssets, type DeerAssets } from "../creatures/deer/DeerAssets";
import { createDeerBodyBuilder } from "../creatures/deer/DeerBody";
import { setDeerCoatTint } from "../creatures/deer/DeerPalette";
import { QuadrupedActor } from "../creatures/quadruped/QuadrupedActor";
import { WorldTerrainContactSampler } from "../world/WorldTerrainContactSampler";

interface AttachableWorld {
  attachActorProof(
    observer: (deltaSeconds: number) => void,
  ): WorldActorProofContext;
}

const NPC_PATH = {
  radius: 6,
  speed: 1.6,
  pauseSeconds: 2.2,
  walkSeconds: 5.5,
} as const;
const QUADRUPED_PATH = { radius: 9, speed: 1.9 } as const;
/**
 * The animal proof paces a line rather than wandering.
 *
 * The point of this harness is that starting, stopping and turning all work, and
 * a deterministic there-and-back exercises every one of those on a fixed cycle —
 * unlike the shipping behaviour, which is deliberately unpredictable.
 */
const QUADRUPED_PATROL_HALF_LENGTH = 7;
const QUADRUPED_PATROL_SECONDS = 9;

/**
 * Imported characters, patrolling a wider ring than the procedural proofs.
 *
 * The KayKit rigs stand roughly 1.7 units tall against this world's metre
 * scale, so they need no extra scaling; the patrol speeds are set to read as a
 * walk at their proportions rather than the player's.
 */
const SKELETON_PATROL = {
  radius: 13,
  speed: 1.35,
  pauseSeconds: 2.6,
  walkSeconds: 6.5,
} as const;
const SKELETON_MODELS = [
  "Skeleton_Warrior",
  "Skeleton_Rogue",
  "Skeleton_Mage",
  "Skeleton_Minion",
] as const;

/**
 * The development-only extensibility proof (`?actorProof=1`).
 *
 * It puts a scripted humanoid NPC and a quadruped into the running world beside
 * the player, all three animating simultaneously through the same actor
 * runtime. The humanoid shares the player's immutable rig definition without
 * touching player input; the quadruped uses a different topology with four
 * contact limbs. Disposing either leaves the other, and the player, untouched.
 *
 * This module is imported only when its query parameter is present, so it costs
 * the production bundle nothing.
 */
export class ActorExtensibilityProof {
  private readonly context: WorldActorProofContext;
  private readonly npc: ScriptedHumanoidActor;
  private readonly quadruped: QuadrupedActor;
  /** The proof owns its own libraries so it can be disposed independently. */
  private readonly deerAssets: DeerAssets = createDeerAssets();
  private readonly villagerAssets: VillagerAssets = createVillagerAssets();
  private readonly npcSteering = {
    targetX: NPC_PATH.radius,
    targetZ: QUADRUPED_PATROL_HALF_LENGTH,
    desiredSpeed: NPC_PATH.speed,
  };
  private readonly quadrupedSteering = {
    targetX: QUADRUPED_PATH.radius,
    targetZ: QUADRUPED_PATROL_HALF_LENGTH,
    desiredSpeed: QUADRUPED_PATH.speed,
  };
  private patrolSeconds = 0;
  private readonly imported: GltfHumanoidActor[] = [];
  private disposed = false;

  static attach(world: unknown): ActorExtensibilityProof | undefined {
    try {
      return new ActorExtensibilityProof(world as AttachableWorld);
    } catch (error) {
      console.warn("[Drusniel World] Actor proof unavailable.", error);
      return undefined;
    }
  }

  private constructor(world: AttachableWorld) {
    this.context = world.attachActorProof(this.update);
    const field = this.context.field;
    const sampleHeight = (x: number, z: number): number =>
      field.sampleHeight(x, z);
    const contact = new WorldTerrainContactSampler(field);
    // Both proof actors circle the origin, where the player spawns, so all
    // three are visible together.
    this.npc = new ScriptedHumanoidActor(
      this.context.scene,
      1,
      NPC_PATH.radius,
      0,
      this.villagerAssets,
      0,
      true,
      sampleHeight,
      contact,
    );
    this.npc.setReferenceSpeed(NPC_PATH.speed);
    const tint = new THREE.Color();
    setDeerCoatTint(tint, 0.5, 0.5);
    this.quadruped = new QuadrupedActor(
      this.context.scene,
      1,
      QUADRUPED_PATH.radius,
      0,
      createDeerBodyBuilder(this.deerAssets, "stag", tint, true),
      sampleHeight,
      contact,
    );
    // Imported characters stream in. A missing or malformed asset must leave
    // the procedural proofs and the player running, so the load is fire and
    // forget and reports rather than throws.
    void this.spawnImported(sampleHeight, contact);
  }

  private async spawnImported(
    sampleHeight: (x: number, z: number) => number,
    contact: WorldTerrainContactSampler,
  ): Promise<void> {
    for (let index = 0; index < SKELETON_MODELS.length; index += 1) {
      if (this.disposed) {
        return;
      }
      const name = SKELETON_MODELS[index];
      try {
        const actor = await GltfHumanoidActor.create(
          this.context.scene,
          {
            url: `./models/skeletons/${name}.glb`,
            textureUrl: "./models/skeletons/skeleton_texture.png",
            scale: 1,
            patrol: {
              centerX: 0,
              centerZ: 0,
              ...SKELETON_PATROL,
              // Spread them evenly around the ring.
              phase: (index / SKELETON_MODELS.length) * Math.PI * 2,
            },
          },
          sampleHeight,
          contact,
        );
        if (this.disposed) {
          actor.dispose();
          return;
        }
        this.imported.push(actor);
      } catch (error) {
        console.warn(`[Drusniel World] ${name} did not load.`, error);
      }
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.context.detach();
    this.npc.dispose();
    this.quadruped.dispose();
    this.deerAssets.dispose();
    this.villagerAssets.dispose();
    for (const actor of this.imported) {
      actor.dispose();
    }
    this.imported.length = 0;
  }

  private readonly update = (deltaSeconds: number): void => {
    if (this.disposed) {
      return;
    }
    this.patrolSeconds += deltaSeconds;
    this.npcSteering.targetZ =
      this.patrolSeconds % (QUADRUPED_PATROL_SECONDS * 2) < QUADRUPED_PATROL_SECONDS
        ? -QUADRUPED_PATROL_HALF_LENGTH
        : QUADRUPED_PATROL_HALF_LENGTH;
    this.npc.update(deltaSeconds, this.npcSteering);
    // A square wave between two ends of a line: the animal walks, arrives,
    // stops, turns and walks back, which is exactly the set of transitions this
    // proof exists to demonstrate.
    const outbound =
      this.patrolSeconds % (QUADRUPED_PATROL_SECONDS * 2) < QUADRUPED_PATROL_SECONDS;
    this.quadrupedSteering.targetZ = outbound
      ? QUADRUPED_PATROL_HALF_LENGTH
      : -QUADRUPED_PATROL_HALF_LENGTH;
    this.quadruped.update(deltaSeconds, this.quadrupedSteering);
    for (let index = 0; index < this.imported.length; index += 1) {
      this.imported[index].update(deltaSeconds);
    }
  };
}
