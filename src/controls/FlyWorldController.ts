import type * as THREE from "three";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";
import type { FlySpawn } from "./FlyController";
import { FlyController } from "./FlyController";
import type { WorldController, WorldControlMode } from "./WorldController";
import type { WorldConfig } from "../world/WorldConfig";

export class FlyWorldController
  extends FlyController
  implements WorldController
{
  private readonly streamingPosition: THREE.Vector3;

  constructor(
    camera: THREE.PerspectiveCamera,
    canvas: HTMLCanvasElement,
    config: WorldConfig,
    profile: RuntimeProfile,
    spawn: FlySpawn,
  ) {
    super(camera, canvas, config, profile, spawn);
    this.streamingPosition = camera.position;
  }

  getStreamingPosition(): THREE.Vector3 {
    return this.streamingPosition;
  }

  getMode(): WorldControlMode {
    return "fly";
  }
}
