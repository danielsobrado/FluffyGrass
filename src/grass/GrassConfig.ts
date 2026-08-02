export interface GrassLodConfig {
  nearMaxDistance: number;
  midMaxDistance: number;
  farMaxDistance: number;
}

export interface GrassConfig {
  modelPath: string;
  geometryName: string;
  instanceCount: number;
  geometryScale: number;
  patchSize: number;
  alphaTexturePath: string;
  noiseTexturePath: string;
  lod: GrassLodConfig;
}
