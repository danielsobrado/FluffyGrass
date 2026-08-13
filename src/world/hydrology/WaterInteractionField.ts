import { sampleStoneGrassClearance } from "../stones/StoneClearance";
import type { WorldConfig } from "../WorldConfig";
import type { HydrologySample } from "./HydrologyField";

const STONE_INTERACTION_EXTRA_RADIUS = 0.75;
const MIN_RIVER_WAKE_COVERAGE = 0.02;
const WAKE_SAMPLE_COUNT = 3;
const WAKE_END_STRENGTH = 0.55;

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
    const expandedClearance = sampleStoneGrassClearance(
      x,
      z,
      STONE_INTERACTION_EXTRA_RADIUS,
    );
    target.obstacle = Math.max(
      0,
      Math.min(1, 1 - Math.min(stoneClearance, expandedClearance)),
    );
    target.wake = 0;

    if (
      this.config.stonesEnabled < 1 ||
      this.config.waterStoneWakeStrength <= 0 ||
      hydrology.riverCoverage <= MIN_RIVER_WAKE_COVERAGE
    ) {
      return target;
    }

    const flowLength = Math.hypot(hydrology.flowX, hydrology.flowZ);
    if (!(flowLength > 1e-6)) {
      return target;
    }

    const flowX = hydrology.flowX / flowLength;
    const flowZ = hydrology.flowZ / flowLength;
    let wake = 0;
    for (let index = 1; index <= WAKE_SAMPLE_COUNT; index += 1) {
      const progress = index / WAKE_SAMPLE_COUNT;
      const distance = this.config.waterStoneWakeLength * progress;
      const upstreamClearance = sampleStoneGrassClearance(
        x - flowX * distance,
        z - flowZ * distance,
        STONE_INTERACTION_EXTRA_RADIUS,
      );
      const upstreamObstacle = Math.max(0, Math.min(1, 1 - upstreamClearance));
      const strength = 1 - (1 - WAKE_END_STRENGTH) * progress;
      wake = Math.max(wake, upstreamObstacle * strength);
    }

    target.wake =
      Math.max(0, wake - target.obstacle * 0.35) * hydrology.riverCoverage;
    return target;
  }
}
