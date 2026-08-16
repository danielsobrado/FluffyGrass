export const RIVER_BASE_MIN_WIDTH_SCALE = 0.95;
export const RIVER_BASE_MAX_WIDTH_SCALE = 1.03;
export const RIVER_GLOBAL_MIN_WIDTH_SCALE = 0.82;
export const RIVER_GLOBAL_MAX_WIDTH_SCALE = 1.18;

export const RIVER_SECONDARY_AMPLITUDE = 0.3;

export const RIVER_MORPH_PRIMARY_WEIGHT = 0.72;
export const RIVER_MORPH_SECONDARY_WEIGHT = 0.28;
export const RIVER_MORPH_MAX_ABS = Math.max(
  RIVER_MORPH_PRIMARY_WEIGHT,
  RIVER_MORPH_SECONDARY_WEIGHT,
);

export const RIVER_SHELF_DEPTH_SHARE = 0.2;
export const RIVER_CHANNEL_DEPTH_SHARE = 0.8;
export const RIVER_SHELF_START = 0.68;
export const RIVER_CHANNEL_INNER = 0.1;
export const RIVER_CHANNEL_OUTER = 0.72;
export const RIVER_DEPTH_EDGE_START = 0.9;
export const RIVER_BANK_INCISION_SCALE = 0.08;

const WIDTH_ENVELOPE_EPSILON = 1e-9;

export function resolveRiverWidthEnvelope(
  riverWidthVariation: number,
  riverBendBankAsymmetry: number,
): { minWidthScale: number; maxWidthScale: number } {
  return {
    minWidthScale:
      RIVER_BASE_MIN_WIDTH_SCALE *
      (1 - riverWidthVariation) *
      (1 - riverBendBankAsymmetry),
    maxWidthScale:
      RIVER_BASE_MAX_WIDTH_SCALE *
      (1 + riverWidthVariation) *
      (1 + riverBendBankAsymmetry),
  };
}

export function validateRiverWidthEnvelope(
  riverWidthVariation: number,
  riverBendBankAsymmetry: number,
): void {
  const { minWidthScale, maxWidthScale } = resolveRiverWidthEnvelope(
    riverWidthVariation,
    riverBendBankAsymmetry,
  );
  if (maxWidthScale > RIVER_GLOBAL_MAX_WIDTH_SCALE + WIDTH_ENVELOPE_EPSILON) {
    throw new Error(
      "Combined river width variation and bend asymmetry exceed the 1.18 safety envelope.",
    );
  }
  if (minWidthScale < RIVER_GLOBAL_MIN_WIDTH_SCALE - WIDTH_ENVELOPE_EPSILON) {
    throw new Error(
      "Combined river width variation and bend asymmetry fall below the 0.82 safety envelope.",
    );
  }
}
