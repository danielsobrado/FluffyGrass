export interface RuntimeTierConfig {
  cameraFov: number;
  cameraMargin: number;
  cameraElevation: number;
  maxPixelRatio: number;
  autoRotate: boolean;
  shadows: boolean;
  shadowMapSize: number;
  showGui: boolean;
  showDecorativeText: boolean;
}

export interface RuntimeConfig {
  compactMaxWidth: number;
  desktop: RuntimeTierConfig;
  compact: RuntimeTierConfig;
}

export interface RuntimeProfile extends RuntimeTierConfig {
  compact: boolean;
}
