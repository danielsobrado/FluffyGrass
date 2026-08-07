export interface WorldConfig {
  seed: number;
  worldSize: number;
  chunkSize: number;
  terrainRadiusDesktop: number;
  terrainRadiusCompact: number;
  grassRadiusDesktop: number;
  grassRadiusCompact: number;
  terrainNearResolution: number;
  terrainMidResolution: number;
  terrainFarResolution: number;
  terrainChunksPerFrame: number;
  grassChunksPerFrame: number;
  grassPatchSize: number;
  grassRenderBatchesPerAxis: number;
  grassFarImpostorsPerPatch: number;
  grassBladesPerSquareMeterDesktop: number;
  grassBladesPerSquareMeterCompact: number;
  grassNearTileSize: number;
  grassNearBladesPerSquareMeterDesktop: number;
  grassNearBladesPerSquareMeterCompact: number;
  grassUltraNearDistance: number;
  grassUltraNearTransitionDistance: number;
  grassUltraNearDensityMultiplier: number;
  /**
   * Compact devices carry their own ultra-near multiplier. The broad, opaque
   * blade silhouette does not need the desktop stack on a phone, and the two
   * profiles were previously forced to share one value, so lowering it for
   * compact would have silently thinned the desktop near band as well.
   */
  grassUltraNearDensityMultiplierCompact: number;
  /**
   * Natural near-grass tuft distribution.
   *
   * Grass does grow in tufts, but every tuft used to be the same tuft: one
   * radius, one circle, one radial heading rule. Randomising the values inside
   * a fixed grammar cannot fix that — the grammar itself has to vary, which is
   * what these do. All of them are resolved from a hash of the tuft's global
   * coordinates, so neighbouring tiles agree on a shared tuft and placement
   * stays byte-stable for a seed.
   */
  grassClumpRadiusScaleMin: number;
  grassClumpRadiusScaleMax: number;
  grassClumpAspectMin: number;
  grassClumpAspectMax: number;
  /**
   * Exponent on the unit radial sample. 0.5 is uniform over disc area; the
   * previous implementation used an effective 1.0, whose area density goes as
   * 1/r and piles most of a tuft's blades onto its centre.
   */
  grassClumpRadialExponent: number;
  /** Share of a blade's heading taken from its tuft's dominant direction. */
  grassClumpDominantDirectionWeight: number;
  /** Share taken from the outward radial direction; the rest is independent. */
  grassClumpRadialDirectionWeight: number;
  grassMidBladeFraction: number;
  grassUnderlayerFraction: number;
  grassPatchJitter: number;
  grassInteractionStrength: number;
  grassInteractionSpeedForFullEffect: number;
  grassLandingPulseRadius: number;
  grassLandingPulseStrength: number;
  grassLandingPulseDecay: number;
  grassTrailResolution: number;
  grassTrailCoverage: number;
  grassTrailRecoveryRate: number;
  grassTrailFreshnessRate: number;
  grassTrailMaxAngleDegrees: number;
  grassTrailWobbleFrequency: number;
  grassTrailWobbleAmplitude: number;
  grassFootContactRadius: number;
  grassFootContactStrength: number;
  grassBodyContactRadius: number;
  grassBodyContactStrength: number;
  spawnSearchRadius: number;
  spawnSearchStep: number;
  spawnNeighborhoodRadius: number;
  spawnEyeHeight: number;
  spawnPitchDegrees: number;
  baseHeight: number;
  rollingHeight: number;
  mountainHeight: number;
  mountainScale: number;
  detailScale: number;
  pathWidth: number;
  pathBranchWidth: number;
  pathSpacing: number;
  pathEdgeRoughness: number;
  pathGrassClearance: number;
  grassMinAltitude: number;
  grassMaxAltitude: number;
  grassMaxSlopeDegrees: number;
  /**
   * Procedural stones. `stonesEnabled` is the rollback flag: 0 removes every
   * stone and every grass-clearance effect without touching other systems.
   */
  stonesEnabled: number;
  /** Metres per placement cell; expected count scales with cell area. */
  stoneCellSize: number;
  /** Expected stones per 16 m cell in neutral meadow before biome factors. */
  stoneDensity: number;
  stoneVariantsPerArchetype: number;
  /** Chance a large grounded stone seeds a satellite cluster. */
  stoneClusterChance: number;
  /** Metres of soft edge on the grass cleared around a stone footprint. */
  stoneGrassClearanceFeather: number;
  stoneRadiusDesktop: number;
  stoneRadiusCompact: number;
  /** Chunk distance that still includes the small nestling stones. */
  stoneDetailRadius: number;
  stoneChunksPerFrame: number;
  grassNearDistance: number;
  grassMidDistance: number;
  grassFarDistance: number;
  grassTransitionDistance: number;
  grassHysteresisDistance: number;
  flySpeed: number;
  flyBoostMultiplier: number;
  flyMinSpeed: number;
  flyMaxSpeed: number;
  initialAltitude: number;
  initialDistance: number;
  characterScale: number;
  characterWalkSpeed: number;
  characterRunSpeed: number;
  characterAcceleration: number;
  characterDeceleration: number;
  characterTurnRate: number;
  characterJumpSpeed: number;
  characterGravity: number;
  characterFallGravityMultiplier: number;
  characterAirControl: number;
  characterCoyoteTime: number;
  characterJumpBufferTime: number;
  characterJumpHoldTime: number;
  characterJumpHoldGravityScale: number;
  characterLandingRecoveryTime: number;
  characterLandingImpactForFullEffect: number;
  characterCameraDistance: number;
  characterCameraMinDistance: number;
  characterCameraMaxDistance: number;
  characterCameraLookHeight: number;
  characterCameraElevationDegrees: number;
  characterCameraMinElevationDegrees: number;
  characterCameraMaxElevationDegrees: number;
  characterCameraFollowRate: number;
  characterCameraGroundClearance: number;
  characterMouseLookSensitivity: number;
  characterTouchLookSensitivity: number;
  characterZoomSensitivity: number;
}
