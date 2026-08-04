export type GrassArtDirectionKey =
  | "lush-hero"
  | "natural-meadow"
  | "golden-hour"
  | "cool-highland"
  | "dense-emerald"
  | "windswept";

export interface GrassArtDirection {
  key: GrassArtDirectionKey;
  label: string;
  baseColor: string;
  tipColor: string;
  dryColor: string;
  rootDarkening: number;
  normalUp: number;
  ambientBoost: number;
  backlightStrength: number;
  impostorBaseColorBlend: number;
  impostorColorScale: number;
  impostorRootLightMin: number;
  impostorRootLightMax: number;
  terrainGrassColor: string;
  terrainGrassTintStrength: number;
  densityScale: number;
  windStrengthScale: number;
  flutterStrengthScale: number;
  nearDistance: number;
  midDistance: number;
  farDistance: number;
  transitionDistance: number;
}

export const DEFAULT_GRASS_ART_DIRECTION_KEY: GrassArtDirectionKey =
  "lush-hero";

export const GRASS_ART_DIRECTIONS: Readonly<
  Record<GrassArtDirectionKey, GrassArtDirection>
> = Object.freeze({
  "lush-hero": Object.freeze({
    key: "lush-hero",
    label: "Lush Hero",
    baseColor: "#2f7c35",
    tipColor: "#91dc63",
    dryColor: "#83a653",
    rootDarkening: 0.7,
    normalUp: 0.72,
    ambientBoost: 0.24,
    backlightStrength: 0.22,
    impostorBaseColorBlend: 0.62,
    impostorColorScale: 0.94,
    impostorRootLightMin: 0.84,
    impostorRootLightMax: 1.04,
    terrainGrassColor: "#4d923f",
    terrainGrassTintStrength: 0.5,
    densityScale: 1,
    windStrengthScale: 1,
    flutterStrengthScale: 1.1,
    nearDistance: 24,
    midDistance: 80,
    farDistance: 280,
    transitionDistance: 8,
  }),
  "natural-meadow": Object.freeze({
    key: "natural-meadow",
    label: "Natural Meadow",
    baseColor: "#477b39",
    tipColor: "#82ad6d",
    dryColor: "#929563",
    rootDarkening: 0.82,
    normalUp: 0.78,
    ambientBoost: 0.18,
    backlightStrength: 0.14,
    impostorBaseColorBlend: 0.68,
    impostorColorScale: 0.82,
    impostorRootLightMin: 0.86,
    impostorRootLightMax: 1.02,
    terrainGrassColor: "#537743",
    terrainGrassTintStrength: 0.3,
    densityScale: 0.9,
    windStrengthScale: 0.85,
    flutterStrengthScale: 0.9,
    nearDistance: 22,
    midDistance: 72,
    farDistance: 250,
    transitionDistance: 8,
  }),
  "golden-hour": Object.freeze({
    key: "golden-hour",
    label: "Golden Hour",
    baseColor: "#587936",
    tipColor: "#b5c85d",
    dryColor: "#b09355",
    rootDarkening: 0.74,
    normalUp: 0.7,
    ambientBoost: 0.22,
    backlightStrength: 0.28,
    impostorBaseColorBlend: 0.64,
    impostorColorScale: 0.9,
    impostorRootLightMin: 0.82,
    impostorRootLightMax: 1.05,
    terrainGrassColor: "#718342",
    terrainGrassTintStrength: 0.44,
    densityScale: 0.94,
    windStrengthScale: 0.7,
    flutterStrengthScale: 0.8,
    nearDistance: 20,
    midDistance: 68,
    farDistance: 240,
    transitionDistance: 10,
  }),
  "cool-highland": Object.freeze({
    key: "cool-highland",
    label: "Cool Highland",
    baseColor: "#356d46",
    tipColor: "#79b886",
    dryColor: "#718d70",
    rootDarkening: 0.76,
    normalUp: 0.8,
    ambientBoost: 0.2,
    backlightStrength: 0.16,
    impostorBaseColorBlend: 0.66,
    impostorColorScale: 0.88,
    impostorRootLightMin: 0.84,
    impostorRootLightMax: 1.02,
    terrainGrassColor: "#45765a",
    terrainGrassTintStrength: 0.42,
    densityScale: 0.88,
    windStrengthScale: 1.25,
    flutterStrengthScale: 1.2,
    nearDistance: 22,
    midDistance: 86,
    farDistance: 270,
    transitionDistance: 10,
  }),
  "dense-emerald": Object.freeze({
    key: "dense-emerald",
    label: "Dense Emerald",
    baseColor: "#246f32",
    tipColor: "#83d957",
    dryColor: "#72974d",
    rootDarkening: 0.66,
    normalUp: 0.68,
    ambientBoost: 0.26,
    backlightStrength: 0.2,
    impostorBaseColorBlend: 0.6,
    impostorColorScale: 0.96,
    impostorRootLightMin: 0.82,
    impostorRootLightMax: 1.04,
    terrainGrassColor: "#3f8b3b",
    terrainGrassTintStrength: 0.54,
    densityScale: 1,
    windStrengthScale: 0.8,
    flutterStrengthScale: 0.9,
    nearDistance: 24,
    midDistance: 92,
    farDistance: 280,
    transitionDistance: 12,
  }),
  windswept: Object.freeze({
    key: "windswept",
    label: "Windswept Plains",
    baseColor: "#4c7638",
    tipColor: "#9fc064",
    dryColor: "#9a8d55",
    rootDarkening: 0.72,
    normalUp: 0.66,
    ambientBoost: 0.2,
    backlightStrength: 0.24,
    impostorBaseColorBlend: 0.65,
    impostorColorScale: 0.88,
    impostorRootLightMin: 0.82,
    impostorRootLightMax: 1.03,
    terrainGrassColor: "#647d42",
    terrainGrassTintStrength: 0.4,
    densityScale: 0.92,
    windStrengthScale: 1.65,
    flutterStrengthScale: 1.5,
    nearDistance: 20,
    midDistance: 78,
    farDistance: 260,
    transitionDistance: 12,
  }),
});

export function resolveGrassArtDirectionKey(
  value: string | null | undefined,
): GrassArtDirectionKey {
  return value &&
    Object.prototype.hasOwnProperty.call(GRASS_ART_DIRECTIONS, value)
    ? (value as GrassArtDirectionKey)
    : DEFAULT_GRASS_ART_DIRECTION_KEY;
}
