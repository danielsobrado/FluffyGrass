import { FlatConfig } from "../config/FlatConfig";
import type { WorldConfig } from "./WorldConfig";

const CONFIG_URL = "./config/world.yaml";

interface NumberRule {
  minimum?: number;
  maximum?: number;
  integer?: boolean;
}

type ConfigSchema = { [Key in keyof WorldConfig]: NumberRule };

const POSITIVE = Object.freeze({ minimum: Number.EPSILON });
const NON_NEGATIVE = Object.freeze({ minimum: 0 });
const POSITIVE_INTEGER = Object.freeze({ minimum: 1, integer: true });

const CONFIG_SCHEMA: ConfigSchema = {
  seed: { integer: true },
  worldSize: POSITIVE,
  chunkSize: POSITIVE,
  terrainRadiusDesktop: POSITIVE_INTEGER,
  terrainRadiusCompact: POSITIVE_INTEGER,
  grassRadiusDesktop: POSITIVE_INTEGER,
  grassRadiusCompact: POSITIVE_INTEGER,
  terrainNearResolution: { minimum: 3, integer: true },
  terrainMidResolution: { minimum: 3, integer: true },
  terrainFarResolution: { minimum: 3, integer: true },
  terrainChunksPerFrame: POSITIVE_INTEGER,
  grassChunksPerFrame: POSITIVE_INTEGER,
  grassPatchSize: POSITIVE,
  grassRenderBatchesPerAxis: POSITIVE_INTEGER,
  grassFarImpostorsPerPatch: { minimum: 1, maximum: 1, integer: true },
  grassBladesPerSquareMeterDesktop: { minimum: 4, maximum: 160 },
  grassBladesPerSquareMeterCompact: { minimum: 4, maximum: 160 },
  grassNearTileSize: POSITIVE,
  grassNearBladesPerSquareMeterDesktop: { minimum: 8, maximum: 180 },
  grassNearBladesPerSquareMeterCompact: { minimum: 8, maximum: 180 },
  grassUltraNearDistance: POSITIVE,
  grassUltraNearTransitionDistance: POSITIVE,
  grassUltraNearDensityMultiplier: { minimum: 1, maximum: 3 },
  grassUltraNearDensityMultiplierCompact: { minimum: 1, maximum: 3 },
  grassClumpRadiusScaleMin: { minimum: 0.2, maximum: 0.5 },
  grassClumpRadiusScaleMax: { minimum: 0.2, maximum: 0.5 },
  grassClumpAspectMin: { minimum: 0.6, maximum: 1 },
  grassClumpAspectMax: { minimum: 1, maximum: 1.5 },
  grassClumpRadialExponent: { minimum: 0.5, maximum: 0.75 },
  grassClumpDominantDirectionWeight: { minimum: 0, maximum: 1 },
  grassClumpRadialDirectionWeight: { minimum: 0, maximum: 1 },
  grassMidBladeFraction: { minimum: 0.05, maximum: 1 },
  grassUnderlayerFraction: { minimum: 0, maximum: 0.6 },
  grassPatchJitter: { minimum: 0, maximum: 0.9 },
  grassInteractionStrength: { minimum: 0, maximum: 2 },
  grassInteractionSpeedForFullEffect: POSITIVE,
  grassLandingPulseRadius: POSITIVE,
  grassLandingPulseStrength: { minimum: 0, maximum: 2 },
  grassLandingPulseDecay: POSITIVE,
  grassTrailResolution: { minimum: 64, maximum: 1024, integer: true },
  grassTrailCoverage: POSITIVE,
  grassTrailRecoveryRate: POSITIVE,
  grassTrailFreshnessRate: POSITIVE,
  grassTrailMaxAngleDegrees: { minimum: 10, maximum: 85 },
  grassTrailWobbleFrequency: NON_NEGATIVE,
  grassTrailWobbleAmplitude: { minimum: 0, maximum: 0.6 },
  grassFootContactRadius: POSITIVE,
  grassFootContactStrength: { minimum: 0, maximum: 2 },
  grassBodyContactRadius: POSITIVE,
  grassBodyContactStrength: { minimum: 0, maximum: 2 },
  spawnSearchRadius: POSITIVE,
  spawnSearchStep: POSITIVE,
  spawnNeighborhoodRadius: POSITIVE,
  spawnEyeHeight: POSITIVE,
  spawnPitchDegrees: { minimum: -45, maximum: 15 },
  baseHeight: {},
  rollingHeight: NON_NEGATIVE,
  mountainHeight: NON_NEGATIVE,
  mountainScale: POSITIVE,
  detailScale: POSITIVE,
  pathWidth: { minimum: 0.5, maximum: 12 },
  pathBranchWidth: { minimum: 0.4, maximum: 12 },
  pathSpacing: { minimum: 120, maximum: 4000 },
  pathEdgeRoughness: { minimum: 0, maximum: 2 },
  pathGrassClearance: { minimum: 0, maximum: 4 },
  grassMinAltitude: {},
  grassMaxAltitude: {},
  grassMaxSlopeDegrees: { minimum: 1, maximum: 89 },
  stonesEnabled: { minimum: 0, maximum: 1, integer: true },
  stoneCellSize: { minimum: 8, maximum: 64 },
  stoneDensity: { minimum: 0, maximum: 3 },
  stoneVariantsPerArchetype: { minimum: 2, maximum: 16, integer: true },
  stoneClusterChance: { minimum: 0, maximum: 1 },
  stoneGrassClearanceFeather: { minimum: 0.1, maximum: 2 },
  stoneRadiusDesktop: POSITIVE_INTEGER,
  stoneRadiusCompact: POSITIVE_INTEGER,
  stoneDetailRadius: POSITIVE_INTEGER,
  stoneRenderBatchChunksPerAxis: { minimum: 1, maximum: 4, integer: true },
  stoneChunksPerFrame: POSITIVE_INTEGER,
  stoneVergeChance: { minimum: 0, maximum: 1 },
  stoneGrainStrength: { minimum: 0, maximum: 0.5 },
  stoneGrainSize: { minimum: 0.05, maximum: 4 },
  stoneGrainFadeDistance: { minimum: 2, maximum: 120 },
  stoneGrowthDetailStrength: { minimum: 0, maximum: 1 },
  stoneGrowthDetailSize: { minimum: 0.05, maximum: 2 },
  stoneGrowthDetailFadeDistance: { minimum: 2, maximum: 120 },
  stoneMossExposureStrength: { minimum: 0, maximum: 1 },
  stoneMossExposureAzimuthDegrees: { minimum: -360, maximum: 360 },
  stoneMossExposureElevationDegrees: { minimum: 0, maximum: 90 },
  stoneMossStreakStrength: { minimum: 0, maximum: 1 },
  grassNearDistance: POSITIVE,
  grassMidDistance: POSITIVE,
  grassFarDistance: POSITIVE,
  grassTransitionDistance: POSITIVE,
  grassHysteresisDistance: NON_NEGATIVE,
  flySpeed: POSITIVE,
  flyBoostMultiplier: POSITIVE,
  flyMinSpeed: POSITIVE,
  flyMaxSpeed: POSITIVE,
  initialAltitude: POSITIVE,
  initialDistance: POSITIVE,
  characterScale: POSITIVE,
  characterWalkSpeed: POSITIVE,
  characterRunSpeed: POSITIVE,
  characterAcceleration: POSITIVE,
  characterDeceleration: POSITIVE,
  characterTurnRate: POSITIVE,
  characterJumpSpeed: POSITIVE,
  characterGravity: POSITIVE,
  characterFallGravityMultiplier: { minimum: 1, maximum: 3 },
  characterAirControl: { minimum: 0, maximum: 1 },
  characterCoyoteTime: { minimum: 0, maximum: 0.5 },
  characterJumpBufferTime: { minimum: 0, maximum: 0.5 },
  characterJumpHoldTime: { minimum: 0, maximum: 0.5 },
  characterJumpHoldGravityScale: { minimum: 0.1, maximum: 1 },
  characterLandingRecoveryTime: { minimum: 0.05, maximum: 1 },
  characterLandingImpactForFullEffect: POSITIVE,
  characterCameraDistance: POSITIVE,
  characterCameraMinDistance: POSITIVE,
  characterCameraMaxDistance: POSITIVE,
  characterCameraLookHeight: POSITIVE,
  characterCameraElevationDegrees: { minimum: -80, maximum: 80 },
  characterCameraMinElevationDegrees: { minimum: -80, maximum: 80 },
  characterCameraMaxElevationDegrees: { minimum: -80, maximum: 80 },
  characterCameraFollowRate: POSITIVE,
  characterCameraGroundClearance: POSITIVE,
  characterMouseLookSensitivity: POSITIVE,
  characterTouchLookSensitivity: POSITIVE,
  characterZoomSensitivity: POSITIVE,
};

export class WorldConfigLoader {
  async load(url: string = CONFIG_URL): Promise<WorldConfig> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Unable to load world config from ${url}: HTTP ${response.status}.`,
      );
    }
    return this.parse(await response.text());
  }

  /** Parse and validate config source directly; the node verifiers use this. */
  parse(source: string): WorldConfig {
    const values = FlatConfig.parse(source, "world");
    const config = {} as WorldConfig;
    for (const key of Object.keys(CONFIG_SCHEMA) as (keyof WorldConfig)[]) {
      config[key] = this.readNumber(values, key, CONFIG_SCHEMA[key]);
    }

    values.assertFullyConsumed();
    this.validate(config);
    return Object.freeze(config);
  }

  private validate(config: WorldConfig): void {
    const worldChunks = config.worldSize / config.chunkSize;
    if (worldChunks < 8) {
      throw new Error("worldSize must contain at least eight terrain chunks.");
    }
    if (!Number.isInteger(worldChunks) || worldChunks % 2 !== 0) {
      throw new Error(
        "worldSize must contain an even whole number of terrain chunks.",
      );
    }
    const patchesPerChunk = config.chunkSize / config.grassPatchSize;
    if (!Number.isInteger(patchesPerChunk)) {
      throw new Error("chunkSize must be divisible by grassPatchSize.");
    }
    if (!Number.isInteger(config.chunkSize / config.grassNearTileSize)) {
      throw new Error("chunkSize must be divisible by grassNearTileSize.");
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
      throw new Error(
        "Compact terrain radius must not exceed the desktop radius.",
      );
    }
    if (config.grassRadiusCompact > config.grassRadiusDesktop) {
      throw new Error(
        "Compact grass radius must not exceed the desktop radius.",
      );
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
      throw new Error(
        "Compact stone radius must not exceed the desktop radius.",
      );
    }
    if (
      config.stoneRadiusDesktop > config.terrainRadiusDesktop ||
      config.stoneRadiusCompact > config.terrainRadiusCompact
    ) {
      throw new Error("Stone streaming radius must not exceed terrain radius.");
    }
    if (config.pathWidth >= config.pathSpacing * 0.05) {
      throw new Error("pathWidth must stay far below pathSpacing.");
    }
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
      throw new Error(
        "grassTransitionDistance must be lower than grassNearDistance.",
      );
    }
    if (
      config.grassHysteresisDistance >=
      config.grassNearDistance - config.grassTransitionDistance
    ) {
      throw new Error("grassHysteresisDistance is too large for the near band.");
    }
    if (
      config.grassUltraNearTransitionDistance >=
      config.grassUltraNearDistance
    ) {
      throw new Error(
        "grassUltraNearTransitionDistance must be lower than grassUltraNearDistance.",
      );
    }
    if (
      config.grassUltraNearDistance +
        config.grassUltraNearTransitionDistance >
      config.grassNearDistance - config.grassTransitionDistance
    ) {
      throw new Error(
        "The complete ultra-near fade must end before the normal near-LOD fade begins.",
      );
    }
    this.validateGrassStreamRadius(
      "desktop",
      config.grassRadiusDesktop,
      config,
    );
    this.validateGrassStreamRadius(
      "compact",
      config.grassRadiusCompact,
      config,
    );
    if (
      config.flyMinSpeed > config.flySpeed ||
      config.flySpeed > config.flyMaxSpeed
    ) {
      throw new Error("flySpeed must be between flyMinSpeed and flyMaxSpeed.");
    }
    if (config.spawnSearchStep > config.spawnSearchRadius) {
      throw new Error("spawnSearchStep must not exceed spawnSearchRadius.");
    }
    if (config.spawnNeighborhoodRadius >= config.chunkSize * 0.5) {
      throw new Error(
        "spawnNeighborhoodRadius must be lower than half a chunk.",
      );
    }
    if (
      config.spawnSearchRadius >
      config.worldSize * 0.5 - config.chunkSize
    ) {
      throw new Error("spawnSearchRadius must remain inside the world bounds.");
    }
    if (
      config.grassBladesPerSquareMeterCompact >
      config.grassBladesPerSquareMeterDesktop
    ) {
      throw new Error(
        "Compact grass patch density must not exceed desktop density.",
      );
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
      throw new Error(
        "Grass interaction radii must be lower than grassNearDistance.",
      );
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
      throw new Error(
        "characterWalkSpeed must be lower than characterRunSpeed.",
      );
    }
    if (
      config.characterJumpHoldGravityScale >=
      config.characterFallGravityMultiplier
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
  }

  private validateGrassStreamRadius(
    profile: "desktop" | "compact",
    radius: number,
    config: WorldConfig,
  ): void {
    const fadeEnd = radius * config.chunkSize;
    if (
      fadeEnd - config.grassTransitionDistance <=
      config.grassMidDistance
    ) {
      throw new Error(
        `${profile} grass radius is too small for the configured mid LOD and transition.`,
      );
    }
  }

  private readNumber(
    values: FlatConfig,
    key: keyof WorldConfig,
    rule: NumberRule,
  ): number {
    const value = Number(values.read(key));
    if (!Number.isFinite(value)) {
      throw new Error(`World config value ${key} must be a number.`);
    }
    if (rule.integer && !Number.isInteger(value)) {
      throw new Error(`World config value ${key} must be an integer.`);
    }
    if (rule.minimum !== undefined && value < rule.minimum) {
      throw new Error(
        `World config value ${key} must be at least ${rule.minimum}.`,
      );
    }
    if (rule.maximum !== undefined && value > rule.maximum) {
      throw new Error(
        `World config value ${key} must be at most ${rule.maximum}.`,
      );
    }
    return value;
  }
}
