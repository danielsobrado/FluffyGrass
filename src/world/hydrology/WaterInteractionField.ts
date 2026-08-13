import { sampleStoneGrassClearance } from "../stones/StoneClearance";
import type { WorldConfig } from "../WorldConfig";
import type { HydrologySample } from "./HydrologyField";

const STONE_INTERACTION_EXTRA_RADIUS = 0.18;
const MIN_RIVER_WAKE_COVERAGE = 0.02;

export interface WaterInteractionSample {
  obstacle: number;
  wake: number;
}

export function createWaterInteractionSample(): WaterInteractionSample {
  return { obstacle: 0, wake: 0 };
}

/** Resolves stone-edge and downstream-wake masks from the shared stone field. */
export class WaterInteractionField {
  constructor(private readonly config: WorldConfig) {}

  sample(
    x: number,
    z: number,
    hydrology: HydrologySample,
    stoneClearance: number,
    target: WaterInteractionSample,
  ): WaterInteractionSample {
    target.obstacle = Math.max(0, Math.min(1, 1 - stoneClearance));
    target.wake = 0;

    if (
      this.config.waterStoneWakeStrength <= 0 ||
      hydrology.riverCoverage <= MIN_RIVER_WAKE_COVERAGE
    ) {
      return target;
    }

    const flowLength = Math.hypot(hydrology.flowX, hydrology.flowZ);
    if (!(flowLength > 1e-6)) {
      return target;
    }

    const wakeLength = this.config.waterStoneWakeLength;
    const flowX = hydrology.flowX / flowLength;
    const flowZ = hydrology.flowZ / flowLength;
    const upstreamClearance = sampleStoneGrassClearance(
      x - flowX * wakeLength,
      z - flowZ * wakeLength,
      STONE_INTERACTION_EXTRA_RADIUS,
    );
    const upstreamObstacle = Math.max(0, Math.min(1, 1 - upstreamClearance));
    target.wake =
      Math.max(0, upstreamObstacle - target.obstacle * 0.35) *
      hydrology.riverCoverage;
    return target;
  }
}
