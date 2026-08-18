export interface WorldVisibilityConfig {
  screenSpaceEnabled: number;
  terrainOcclusionEnabled: number;
  scenicCellSize: number;
  treeMinPixels: number;
  stoneMinPixels: number;
  stoneFeatureRadiusScale: number;
  terrainOcclusionNearDistance: number;
  terrainOcclusionStep: number;
  terrainOcclusionMaxSamples: number;
  terrainOcclusionHeightBias: number;
  terrainOcclusionRayCount: number;
  occlusionReuseDistance: number;
  shadowDistance: number;
}
