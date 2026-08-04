import presetData from "./GrassArtPresets.json";

export type GrassArtDirectionKey = keyof typeof presetData;

export interface GrassArtDirection {
  key: GrassArtDirectionKey;
  label: string;
  baseColor: string;
  tipColor: string;
  dryColor: string;
  rootDarkening: number;
  tipColorStrength: number;
  normalUp: number;
  ambientBoost: number;
  backlightStrength: number;
  impostorBaseColorBlend: number;
  impostorColorScale: number;
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

export const GRASS_ART_DIRECTIONS = Object.freeze(
  Object.fromEntries(
    Object.entries(presetData).map(([key, direction]) => [
      key,
      Object.freeze(direction),
    ]),
  ) as unknown as Record<GrassArtDirectionKey, GrassArtDirection>,
);

export function resolveGrassArtDirectionKey(
  value: string | null | undefined,
): GrassArtDirectionKey {
  return value &&
    Object.prototype.hasOwnProperty.call(GRASS_ART_DIRECTIONS, value)
    ? (value as GrassArtDirectionKey)
    : DEFAULT_GRASS_ART_DIRECTION_KEY;
}
