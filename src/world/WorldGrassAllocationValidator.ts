import { resolveGrassRosetteExpansion } from "./grass/GrassRuntimeMath";
import type { WorldConfig } from "./WorldConfig";

/**
 * Absolute allocation ceilings for valid-but-pathological world tuning.
 *
 * The shipped world uses 1,344 source blades per patch and 16,128 stacked
 * near-field blades per tile (base + ultra-near extra + density-boost extra).
 * These limits leave several times that tuning headroom while preventing a
 * large patch/tile size from turning one build job into an unbounded
 * typed-array or shared-geometry allocation.
 */
export const MAX_GRASS_SOURCE_BLADES_PER_PATCH = 8_192;
export const MAX_GRASS_MID_TRIANGLES_PER_RENDER_BATCH = 500_000;
export const MAX_NEAR_GRASS_STACKED_BLADES_PER_TILE = 40_000;

export function validateWorldGrassAllocationConfig(config: WorldConfig): void {
  const patchDensity = Math.max(
    config.grassBladesPerSquareMeterDesktop,
    config.grassBladesPerSquareMeterCompact,
  );
  const sourceBladesPerPatch = Math.max(
    1,
    Math.round(config.grassPatchSize ** 2 * patchDensity),
  );
  if (sourceBladesPerPatch > MAX_GRASS_SOURCE_BLADES_PER_PATCH) {
    throw new Error(
      `A grass patch would allocate ${sourceBladesPerPatch} source blades, above the ${MAX_GRASS_SOURCE_BLADES_PER_PATCH} safety ceiling.`,
    );
  }

  const patchesPerChunkAxis = config.chunkSize / config.grassPatchSize;
  const patchesPerBatchAxis =
    patchesPerChunkAxis / config.grassRenderBatchesPerAxis;
  const patchesPerBatch = patchesPerBatchAxis ** 2;
  const midBladesPerPatch = Math.max(
    1,
    Math.round(sourceBladesPerPatch * config.grassMidBladeFraction),
  );
  const midTrianglesPerBatch = midBladesPerPatch * patchesPerBatch;
  if (midTrianglesPerBatch > MAX_GRASS_MID_TRIANGLES_PER_RENDER_BATCH) {
    throw new Error(
      `A grass render batch would submit ${midTrianglesPerBatch} mid triangles, above the ${MAX_GRASS_MID_TRIANGLES_PER_RENDER_BATCH} safety ceiling.`,
    );
  }

  const desktopNearStack = resolveNearStackedBladeCount(
    config.grassNearTileSize,
    config.grassNearBladesPerSquareMeterDesktop,
    config.grassUltraNearDensityMultiplier,
    config.grassRosetteChance,
  );
  const compactNearStack = resolveNearStackedBladeCount(
    config.grassNearTileSize,
    config.grassNearBladesPerSquareMeterCompact,
    config.grassUltraNearDensityMultiplierCompact,
    config.grassRosetteChance,
  );
  const nearStackedBlades = Math.max(desktopNearStack, compactNearStack);
  if (nearStackedBlades > MAX_NEAR_GRASS_STACKED_BLADES_PER_TILE) {
    throw new Error(
      `A near-grass tile stack would allocate ${nearStackedBlades} blades, above the ${MAX_NEAR_GRASS_STACKED_BLADES_PER_TILE} safety ceiling.`,
    );
  }
}

function resolveNearStackedBladeCount(
  tileSize: number,
  density: number,
  ultraMultiplier: number,
  rosetteChance: number,
): number {
  // Base population, plus the extra ultra-near blades, plus the same extra
  // population carried outward by the one-triangle density-boost layer.
  // When the multiplier is 1 there is no extra population and no boost field.
  //
  // Rosettes emit several leaves from one placement cell, so the buffers a
  // tile reserves are the cell count times the expansion, not the cell count.
  // The ceiling has to charge the reservation rather than the expected
  // survivors, which coverage scaling holds constant.
  return Math.max(
    1,
    Math.round(
      tileSize ** 2 *
        density *
        (2 * ultraMultiplier - 1) *
        resolveGrassRosetteExpansion(rosetteChance),
    ),
  );
}
