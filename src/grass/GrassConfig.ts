export interface GrassLodConfig {
  nearMaxDistance: number;
  midMaxDistance: number;
  farMaxDistance: number;
}

export interface GrassGeometryConfig {
  variantCount: number;
  bladesPerClump: number;
  bladeSegments: number;
  clumpRadius: number;
  bladeHeightMin: number;
  bladeHeightMax: number;
  bladeWidthMin: number;
  bladeWidthMax: number;
  bladeLeanMin: number;
  bladeLeanMax: number;
}

export interface GrassDistributionConfig {
  seed: number;
  rootSink: number;
  maxSlopeDegrees: number;
  heightVariation: number;
  widthVariation: number;
  densityMin: number;
  densityMax: number;
  densityScale: number;
}

export interface GrassWindConfig {
  directionX: number;
  directionZ: number;
  strength: number;
  gustScale: number;
  gustSpeed: number;
  flutterStrength: number;
  flutterSpeed: number;
}

export interface GrassMaterialConfig {
  baseColor: string;
  tipColor: string;
  dryColor: string;
  rootDarkening: number;
  normalUp: number;
  ambientBoost: number;
}

export interface GrassConfig {
  instanceCount: number;
  patchSize: number;
  geometry: GrassGeometryConfig;
  distribution: GrassDistributionConfig;
  wind: GrassWindConfig;
  material: GrassMaterialConfig;
  lod: GrassLodConfig;
}
