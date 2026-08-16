import {
  clusterMinimumSeparation,
  maxNormalizedReach,
} from "./stones/StoneClusterTuning";
import type { WorldConfig } from "./WorldConfig";

/**
 * Geometric proofs for the fixed macro neighborhoods used by stone placement.
 */
export function validateStoneClusterGeometry(config: WorldConfig): void {
  const epsilon = 1e-6;
  if (config.stoneClusterRadiusMin >= config.stoneClusterRadiusMax) {
    throw new Error("stoneClusterRadiusMin must be lower than stoneClusterRadiusMax.");
  }
  if (config.stoneClusterAspectMin > config.stoneClusterAspectMax) {
    throw new Error("stoneClusterAspect range is reversed.");
  }
  if (config.stoneClusterBudgetMin > config.stoneClusterBudgetMax) {
    throw new Error("stoneClusterBudget range is reversed.");
  }
  if (config.stoneClusterCoreRatio >= config.stoneClusterShoulderRatio) {
    throw new Error(
      "stoneClusterCoreRatio must be lower than stoneClusterShoulderRatio.",
    );
  }
  if (config.stoneClusterShoulderRatio >= config.stoneClusterHaloRatio) {
    throw new Error(
      "stoneClusterShoulderRatio must be lower than stoneClusterHaloRatio.",
    );
  }

  const spacing = config.stoneClusterSpacing;
  const maxInfluenceRadius =
    config.stoneClusterRadiusMax *
    maxNormalizedReach(config.stoneClusterHaloRatio);
  const queryReach = maxInfluenceRadius + config.stoneCellSize * 0.5;
  const nearestUnqueriedCenter =
    spacing * (1.5 - config.stoneClusterCenterJitter);
  if (queryReach >= nearestUnqueriedCenter - epsilon) {
    throw new Error(
      "Stone cluster footprint, jitter, and cell size must stay inside the fixed 3x3 macro query.",
    );
  }

  const nearestTwoAwayCenter =
    spacing * (2 - 2 * config.stoneClusterCenterJitter);
  const maxConflictDistance = clusterMinimumSeparation(
    spacing,
    maxInfluenceRadius,
    maxInfluenceRadius,
  );
  if (nearestTwoAwayCenter <= maxConflictDistance + epsilon) {
    throw new Error(
      "Stone cluster conflict suppression must stay inside immediate macro neighbors.",
    );
  }
}
