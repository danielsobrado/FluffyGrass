import type { ConfigNumberRule } from "../../config/FlatConfigValueReader";
import type { WorldVisibilityConfig } from "./WorldVisibilityConfig";

type WorldVisibilityConfigSchema = {
  [Key in keyof WorldVisibilityConfig]: Readonly<ConfigNumberRule>;
};

export const WORLD_VISIBILITY_CONFIG_SCHEMA: WorldVisibilityConfigSchema = {
  screenSpaceEnabled: { minimum: 0, maximum: 1, integer: true },
  terrainOcclusionEnabled: { minimum: 0, maximum: 1, integer: true },
  scenicCellSize: { minimum: 32, maximum: 192 },
  treeMinPixels: { minimum: 0, maximum: 8 },
  stoneMinPixels: { minimum: 0, maximum: 8 },
  stoneFeatureRadiusScale: { minimum: 1, maximum: 4 },
  terrainOcclusionNearDistance: { minimum: 8, maximum: 160 },
  terrainOcclusionStep: { minimum: 4, maximum: 64 },
  terrainOcclusionMaxSamples: { minimum: 4, maximum: 64, integer: true },
  terrainOcclusionHeightBias: { minimum: 0.5, maximum: 12 },
  terrainOcclusionRayCount: { minimum: 1, maximum: 5, integer: true },
  occlusionReuseDistance: { minimum: 0.1, maximum: 4 },
  shadowDistance: { minimum: 0, maximum: 240 },
};
