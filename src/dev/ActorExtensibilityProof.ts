import type { WorldActorProofContext } from "../app/WorldActorProofContext";
import { ScriptedHumanoidActor } from "../character/npc/ScriptedHumanoidActor";
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
      { centerX: 0, centerZ: 0, ...NPC_PATH },
      sampleHeight,
      contact,
    );
    this.quadruped = new QuadrupedActor(
      this.context.scene,
      1,
      { centerX: 0, centerZ: 0, ...QUADRUPED_PATH },
      sampleHeight,
      contact,
    );
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.context.detach();
    this.npc.dispose();
    this.quadruped.dispose();
  }

  private readonly update = (deltaSeconds: number): void => {
    if (this.disposed) {
      return;
    }
    this.npc.update(deltaSeconds);
    this.quadruped.update(deltaSeconds);
  };
}
