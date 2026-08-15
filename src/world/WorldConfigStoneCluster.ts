import type { WorldConfig } from "./WorldConfig";

/**
 * Geometric proofs for formation lookup. Production queries a fixed 3x3 of
 * macro cells, so radius, halo, jitter, and stone-cell size must keep every
 * reachable formation inside that neighborhood.
 */
export function validateStoneClusterGeometry(config: WorldConfig): void {
  const queryEpsilon = 1e-6;
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
  const influenceRadius =
    config.stoneClusterRadiusMax * config.stoneClusterHaloRatio;
  if (influenceRadius > spacing * 0.5 + queryEpsilon) {
    throw new Error(
      "stoneClusterRadiusMax * stoneClusterHaloRatio must not exceed half of stoneClusterSpacing.",
    );
  }
  if (
    config.stoneCellSize * 0.5 +
      influenceRadius +
      config.stoneClusterCenterJitter * spacing >=
    spacing * 1.5 - queryEpsilon
  ) {
    throw new Error(
      "Stone cluster footprint, jitter, and cell size must stay inside the fixed 3x3 macro query.",
    );
  }
}
