import type { GrassConfig } from "../GrassConfig";
import {
  GRASS_IMPOSTOR_MAX_ATLAS_SIZE,
  GRASS_IMPOSTOR_SUBPATCHES_PER_AXIS,
} from "../GrassImpostorLimits";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function validateGrassConfig(config: GrassConfig): void {
  if (config.geometry.variantCount > config.instanceCount) {
    throw new Error("variantCount must not exceed instanceCount.");
  }
  if (config.geometry.bladesPerClump < 3) {
    throw new Error("bladesPerClump must be at least 3.");
  }
  if (config.geometry.bladeSegments < 2) {
    throw new Error("bladeSegments must be at least 2.");
  }
  if (config.geometry.midBladesPerClump < 2) {
    throw new Error("midBladesPerClump must be at least 2.");
  }
  if (config.geometry.midBladeSegments < 1) {
    throw new Error("midBladeSegments must be at least 1.");
  }
  if (config.geometry.midBladesPerClump > config.geometry.bladesPerClump) {
    throw new Error("midBladesPerClump must not exceed bladesPerClump.");
  }
  if (config.geometry.midBladeSegments >= config.geometry.bladeSegments) {
    throw new Error("midBladeSegments must be lower than bladeSegments.");
  }
  if (config.geometry.bladeHeightMin > config.geometry.bladeHeightMax) {
    throw new Error("bladeHeightMin must be less than or equal to bladeHeightMax.");
  }
  if (config.geometry.bladeWidthMin > config.geometry.bladeWidthMax) {
    throw new Error("bladeWidthMin must be less than or equal to bladeWidthMax.");
  }
  if (config.geometry.bladeLeanMin > config.geometry.bladeLeanMax) {
    throw new Error("bladeLeanMin must be less than or equal to bladeLeanMax.");
  }
  if (config.distribution.densityMin > config.distribution.densityMax) {
    throw new Error("densityMin must be less than or equal to densityMax.");
  }
  if (
    config.lod.nearMaxDistance >= config.lod.midMaxDistance ||
    config.lod.midMaxDistance >= config.lod.farMaxDistance
  ) {
    throw new Error("Grass LOD distances must increase from near to far.");
  }
  if (config.lod.transitionDistance >= config.lod.nearMaxDistance) {
    throw new Error("transitionDistance must be lower than nearMaxDistance.");
  }
  if (
    config.lod.hysteresisDistance >=
    config.lod.nearMaxDistance - config.lod.transitionDistance
  ) {
    throw new Error("hysteresisDistance is too large for the near LOD band.");
  }
  if (
    Math.hypot(config.wind.directionX, config.wind.directionZ) < Number.EPSILON
  ) {
    throw new Error("Grass wind direction must not be zero.");
  }
  for (const [label, color] of [
    ["baseColor", config.material.baseColor],
    ["tipColor", config.material.tipColor],
    ["dryColor", config.material.dryColor],
  ] as const) {
    if (!HEX_COLOR_PATTERN.test(color)) {
      throw new Error(`Grass config value ${label} must be a six-digit hex color.`);
    }
  }
  if (config.impostor.viewsPerAxis < 2) {
    throw new Error("impostorViewsPerAxis must be at least 2.");
  }
  if (config.impostor.viewsPerAxis > 16) {
    throw new Error("impostorViewsPerAxis must not exceed 16.");
  }
  if (config.impostor.frameResolution < 32) {
    throw new Error("impostorFrameResolution must be at least 32.");
  }

  const atlasSize =
    (config.impostor.frameResolution + config.impostor.padding * 2) *
    config.impostor.viewsPerAxis *
    GRASS_IMPOSTOR_SUBPATCHES_PER_AXIS;
  if (atlasSize > GRASS_IMPOSTOR_MAX_ATLAS_SIZE) {
    throw new Error(
      `Impostor atlas size must not exceed ${GRASS_IMPOSTOR_MAX_ATLAS_SIZE} pixels.`,
    );
  }
  if (config.impostor.cameraMargin < 1) {
    throw new Error("impostorCameraMargin must be at least 1.");
  }
}
