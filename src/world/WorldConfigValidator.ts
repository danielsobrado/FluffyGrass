import { validateHydrologyConfig } from "./hydrology/HydrologyConfigValidator";
import { createWorldHorizonAxis } from "./horizon/WorldHorizonGrid";
import { validateStoneClusterGeometry } from "./WorldConfigStoneCluster";
import type { WorldConfig } from "./WorldConfig";

const MAX_GRASS_PATCHES_PER_CHUNK_AXIS = 32;
const MAX_NEAR_GRASS_TILES_PER_CHUNK_AXIS = 32;
const MAX_SPAWN_SEARCH_STEPS_PER_RADIUS = 64;
/**
 * Triangle ceiling for the horizon shell.
 *
 * The shell is one static draw call whose whole argument is that it costs less
 * than the pop-in it removes, and the shipped 2 km world spends about 46,000
 * triangles on its streamed ring. A shell allowed to grow past this stops being
 * the cheap layer and starts competing with the terrain it backs.
 */
const MAX_HORIZON_TRIANGLES = 120000;

export function validateWorldConfig(config: WorldConfig): void {
  const worldChunks = config.worldSize / config.chunkSize;
  if (worldChunks < 8) {
    throw new Error("worldSize must contain at least eight terrain chunks.");
  }
  if (!Number.isInteger(worldChunks) || worldChunks % 2 !== 0) {
    throw new Error("worldSize must contain an even whole number of terrain chunks.");
  }
  if (config.terrainRadiusDesktop > worldChunks * 0.5) {
    throw new Error(
      "terrainRadiusDesktop must not exceed half of the world chunk count.",
    );
  }
  validateHorizonShell(config);

  const patchesPerChunk = config.chunkSize / config.grassPatchSize;
  if (!Number.isInteger(patchesPerChunk)) {
    throw new Error("chunkSize must be divisible by grassPatchSize.");
  }
  if (patchesPerChunk > MAX_GRASS_PATCHES_PER_CHUNK_AXIS) {
    throw new Error(
      `A chunk must not contain more than ${MAX_GRASS_PATCHES_PER_CHUNK_AXIS} grass patches per axis.`,
    );
  }
  const nearTilesPerChunk = config.chunkSize / config.grassNearTileSize;
  if (!Number.isInteger(nearTilesPerChunk)) {
    throw new Error("chunkSize must be divisible by grassNearTileSize.");
  }
  if (nearTilesPerChunk > MAX_NEAR_GRASS_TILES_PER_CHUNK_AXIS) {
    throw new Error(
      `A chunk must not contain more than ${MAX_NEAR_GRASS_TILES_PER_CHUNK_AXIS} near-grass tiles per axis.`,
    );
  }
  if (config.grassClumpRadiusScaleMin > config.grassClumpRadiusScaleMax) {
    throw new Error("grassClumpRadiusScale range is reversed.");
  }
  if (config.grassClumpAspectMin > config.grassClumpAspectMax) {
    throw new Error("grassClumpAspect range is reversed.");
  }
  if (
    config.grassClumpDominantDirectionWeight +
      config.grassClumpRadialDirectionWeight >
    0.9
  ) {
    throw new Error(
      "Clump dominant and radial direction weights must leave at least 10% " +
        "of a blade's heading to independent randomness.",
    );
  }
  if (
    config.detailFoliageClumpWorldSize >
    config.detailFoliageColonyWorldSize * 0.5
  ) {
    throw new Error(
      "detailFoliageClumpWorldSize must be at most half of detailFoliageColonyWorldSize.",
    );
  }
  if (config.grassRenderBatchesPerAxis > patchesPerChunk) {
    throw new Error(
      "grassRenderBatchesPerAxis must not exceed the patches per chunk axis.",
    );
  }
  if (
    config.terrainNearResolution <= config.terrainMidResolution ||
    config.terrainMidResolution <= config.terrainFarResolution
  ) {
    throw new Error("Terrain resolutions must decrease from near to far.");
  }
  const nearCells = config.terrainNearResolution - 1;
  const midCells = config.terrainMidResolution - 1;
  const farCells = config.terrainFarResolution - 1;
  if (nearCells % midCells !== 0 || midCells % farCells !== 0) {
    throw new Error(
      "Terrain LOD cell counts must divide evenly to preserve chunk edges.",
    );
  }
  if (config.terrainRadiusCompact > config.terrainRadiusDesktop) {
    throw new Error("Compact terrain radius must not exceed the desktop radius.");
  }
  if (config.grassRadiusCompact > config.grassRadiusDesktop) {
    throw new Error("Compact grass radius must not exceed the desktop radius.");
  }
  if (
    config.grassRadiusDesktop > config.terrainRadiusDesktop ||
    config.grassRadiusCompact > config.terrainRadiusCompact
  ) {
    throw new Error("Grass streaming radius must not exceed terrain radius.");
  }
  if (config.pathBranchWidth > config.pathWidth) {
    throw new Error("pathBranchWidth must not exceed pathWidth.");
  }
  if (config.stoneRadiusCompact > config.stoneRadiusDesktop) {
    throw new Error("Compact stone radius must not exceed the desktop radius.");
  }
  if (
    config.stoneRadiusDesktop > config.terrainRadiusDesktop ||
    config.stoneRadiusCompact > config.terrainRadiusCompact
  ) {
    throw new Error("Stone streaming radius must not exceed terrain radius.");
  }
  if (config.stoneDetailRadius > config.stoneRadiusDesktop) {
    throw new Error("stoneDetailRadius must not exceed stoneRadiusDesktop.");
  }
  if (
    config.stoneDetailRadiusCompact > config.stoneDetailRadius ||
    config.stoneDetailRadiusCompact > config.stoneRadiusCompact
  ) {
    throw new Error(
      "stoneDetailRadiusCompact must fit inside compact and desktop stone detail radii.",
    );
  }
  validateStoneClusters(config);
  if (config.pathWidth >= config.pathSpacing * 0.05) {
    throw new Error("pathWidth must stay far below pathSpacing.");
  }

  validateHydrologyConfig(config);

  if (config.grassMinAltitude >= config.grassMaxAltitude) {
    throw new Error("grassMinAltitude must be lower than grassMaxAltitude.");
  }
  if (
    config.grassNearDistance >= config.grassMidDistance ||
    config.grassMidDistance >= config.grassFarDistance
  ) {
    throw new Error("Grass LOD distances must increase from near to far.");
  }
  if (config.grassTransitionDistance >= config.grassNearDistance) {
    throw new Error("grassTransitionDistance must be lower than grassNearDistance.");
  }
  if (
    config.grassHysteresisDistance >=
    config.grassNearDistance - config.grassTransitionDistance
  ) {
    throw new Error("grassHysteresisDistance is too large for the near band.");
  }
  if (
    config.grassUltraNearTransitionDistance >= config.grassUltraNearDistance
  ) {
    throw new Error(
      "grassUltraNearTransitionDistance must be lower than grassUltraNearDistance.",
    );
  }
  if (
    config.grassUltraNearDistance + config.grassUltraNearTransitionDistance >
    config.grassNearDistance - config.grassTransitionDistance
  ) {
    throw new Error(
      "The complete ultra-near fade must end before the normal near-LOD fade begins.",
    );
  }
  if (
    config.grassNearBridgeTransitionDistance >= config.grassNearBridgeDistance
  ) {
    throw new Error(
      "grassNearBridgeTransitionDistance must be lower than grassNearBridgeDistance.",
    );
  }
  if (
    config.grassNearBridgeDistance - config.grassNearBridgeTransitionDistance <
    config.grassUltraNearDistance + config.grassUltraNearTransitionDistance
  ) {
    throw new Error(
      "The bridge LOD must start after the ultra-near detail fade has completed.",
    );
  }
  if (
    config.grassNearBridgeDistance + config.grassNearBridgeTransitionDistance >
    config.grassNearDistance - config.grassTransitionDistance
  ) {
    throw new Error(
      "The bridge LOD handoff must complete before the near-to-mid fade starts.",
    );
  }

  validateGrassStreamRadius("desktop", config.grassRadiusDesktop, config);
  validateGrassStreamRadius("compact", config.grassRadiusCompact, config);

  if (
    config.flyMinSpeed > config.flySpeed ||
    config.flySpeed > config.flyMaxSpeed
  ) {
    throw new Error("flySpeed must be between flyMinSpeed and flyMaxSpeed.");
  }
  if (config.spawnSearchStep > config.spawnSearchRadius) {
    throw new Error("spawnSearchStep must not exceed spawnSearchRadius.");
  }
  if (
    config.spawnSearchRadius / config.spawnSearchStep >
    MAX_SPAWN_SEARCH_STEPS_PER_RADIUS
  ) {
    throw new Error(
      `spawnSearchRadius must not exceed ${MAX_SPAWN_SEARCH_STEPS_PER_RADIUS} spawnSearchStep intervals.`,
    );
  }
  if (config.spawnNeighborhoodRadius >= config.chunkSize * 0.5) {
    throw new Error("spawnNeighborhoodRadius must be lower than half a chunk.");
  }
  if (config.spawnSearchRadius > config.worldSize * 0.5 - config.chunkSize) {
    throw new Error("spawnSearchRadius must remain inside the world bounds.");
  }
  if (
    config.grassBladesPerSquareMeterCompact >
    config.grassBladesPerSquareMeterDesktop
  ) {
    throw new Error("Compact grass patch density must not exceed desktop density.");
  }
  if (
    config.grassNearBladesPerSquareMeterCompact >
    config.grassNearBladesPerSquareMeterDesktop
  ) {
    throw new Error(
      "Compact single-blade density must not exceed desktop density.",
    );
  }
  if (
    config.grassNearBladesPerSquareMeterDesktop !==
      config.grassBladesPerSquareMeterDesktop ||
    config.grassNearBladesPerSquareMeterCompact !==
      config.grassBladesPerSquareMeterCompact
  ) {
    throw new Error(
      "Single-blade and patch LOD densities must match for a continuous handoff.",
    );
  }
  if (patchesPerChunk % config.grassRenderBatchesPerAxis !== 0) {
    throw new Error(
      "grassRenderBatchesPerAxis must divide the patches per chunk axis evenly.",
    );
  }
  if (
    config.grassLandingPulseRadius >= config.grassNearDistance ||
    config.grassFootContactRadius >= config.grassNearDistance ||
    config.grassBodyContactRadius >= config.grassNearDistance
  ) {
    throw new Error("Grass interaction radii must be lower than grassNearDistance.");
  }
  if (config.grassLandingPulseRadius >= config.grassTrailCoverage * 0.5) {
    throw new Error(
      "grassLandingPulseRadius must fit inside half of grassTrailCoverage.",
    );
  }
  if (
    config.grassTrailCoverage * 0.5 >=
    config.grassNearDistance - config.characterCameraMaxDistance
  ) {
    throw new Error(
      "Half of grassTrailCoverage must stay inside the interactive near band " +
        "(grassNearDistance minus characterCameraMaxDistance).",
    );
  }
  const trailTexelSize = config.grassTrailCoverage / config.grassTrailResolution;
  if (config.grassFootContactRadius < trailTexelSize) {
    throw new Error(
      "grassFootContactRadius must be at least one grass trail texel " +
        "(grassTrailCoverage / grassTrailResolution).",
    );
  }
  if (config.characterWalkSpeed >= config.characterRunSpeed) {
    throw new Error("characterWalkSpeed must be lower than characterRunSpeed.");
  }
  if (
    config.characterJumpHoldGravityScale >= config.characterFallGravityMultiplier
  ) {
    throw new Error(
      "Jump-hold gravity must remain below the falling gravity multiplier.",
    );
  }
  if (
    config.characterCameraMinDistance > config.characterCameraDistance ||
    config.characterCameraDistance > config.characterCameraMaxDistance
  ) {
    throw new Error(
      "characterCameraDistance must be between its minimum and maximum.",
    );
  }
  if (config.characterCameraDistance + 1.5 > config.grassUltraNearDistance) {
    throw new Error(
      "characterCameraDistance must keep the hero inside the ultra-near grass band.",
    );
  }
  if (
    config.characterCameraMinElevationDegrees >=
    config.characterCameraElevationDegrees ||
    config.characterCameraElevationDegrees >=
    config.characterCameraMaxElevationDegrees
  ) {
    throw new Error(
      "Character camera elevation must be between its minimum and maximum.",
    );
  }
  validateFauna(config);
}

/**
 * Formation lookup is a fixed 3x3 of macro cells. These inequalities are the
 * geometric proof that a formation two indices away cannot reach a stone cell
 * even after maximum center jitter, so production never needs a wider search.
 */
function validateStoneClusters(config: WorldConfig): void {
  validateStoneClusterGeometry(config);
}

/**
 * The quality bands have to be a ladder, or an actor can never resolve a level.
 *
 * Culling also has to happen inside the radius herds are collected over —
 * otherwise animals are streamed in already too far away to animate, and the
 * population silently costs more than it shows.
 */
function validateFauna(config: WorldConfig): void {
  if (config.faunaEnabled < 1) {
    return;
  }
  if (
    !(config.faunaFullDistance < config.faunaReducedDistance) ||
    !(config.faunaReducedDistance < config.faunaMinimalDistance) ||
    !(config.faunaMinimalDistance < config.faunaCullDistance)
  ) {
    throw new Error(
      "fauna animation LOD distances must increase from full to culled.",
    );
  }
  if (config.faunaCullDistance > config.faunaStreamRadius) {
    throw new Error("faunaCullDistance must not exceed faunaStreamRadius.");
  }
  if (config.faunaMinimalUpdateHz > config.faunaReducedUpdateHz) {
    throw new Error(
      "faunaMinimalUpdateHz must not exceed faunaReducedUpdateHz.",
    );
  }
}

/**
 * The shell's grid lines must land on the same coordinates the streamed chunks
 * sample, so that where the two meshes share a vertex they agree exactly rather
 * than to within a rounding error. The remaining checks bound cost and enforce
 * minimum coverage.
 */
function validateHorizonShell(config: WorldConfig): void {
  if (config.horizonEnabled < 1) {
    return;
  }
  const axis = createWorldHorizonAxis(
    config.worldSize,
    config.horizonSpacing,
    config.horizonApronRings,
    config.horizonApronGrowth,
  );
  const cells = axis.size - 1;
  const triangles = cells * cells * 2;
  if (triangles > MAX_HORIZON_TRIANGLES) {
    throw new Error(
      `The horizon shell would cost ${triangles} triangles, above the ${MAX_HORIZON_TRIANGLES} ceiling.`,
    );
  }
  const requiredApronReach =
    (Math.max(config.terrainRadiusDesktop, config.terrainRadiusCompact) + 1) *
    config.chunkSize;
  const apronReach = axis.outerHalfExtent - config.worldSize * 0.5;
  if (apronReach < requiredApronReach - 1e-3) {
    throw new Error(
      `The horizon apron must extend at least ${requiredApronReach} metres beyond the world edge.`,
    );
  }
}

function validateGrassStreamRadius(
  profile: "desktop" | "compact",
  radius: number,
  config: WorldConfig,
): void {
  const fadeEnd = radius * config.chunkSize;
  if (fadeEnd - config.grassTransitionDistance <= config.grassMidDistance) {
    throw new Error(
      `${profile} grass radius is too small for the configured mid LOD and transition.`,
    );
  }
}
