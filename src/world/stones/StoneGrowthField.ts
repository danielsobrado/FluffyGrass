import type { StonePaletteKey } from "./StonePalette";

export interface StoneGrowthSample {
  readonly baseMossSusceptibility: number;
  readonly normalY: number;
  readonly heightFraction: number;
  readonly exposure: number;
  readonly exposureStrength: number;
  readonly environmentMoss: number;
  readonly paletteKey: StonePaletteKey;
  readonly graniteBlend: number;
}

export interface StoneGrowthWeights {
  readonly moss: number;
  readonly lichen: number;
}

const UPPER_LEDGE_MOSS_STRENGTH = 0.3;
const LICHEN_HEIGHT_FLOOR = 0.55;
const LICHEN_ENVIRONMENT: Record<StonePaletteKey, number> = {
  meadowSage: 0.24,
  steppeTan: 0.72,
  graniteGrey: 0.86,
  mossy: 0.16,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Resolve coarse growth before near-camera shader breakup. */
export function resolveStoneGrowthWeights(
  sample: StoneGrowthSample,
): StoneGrowthWeights {
  const heightFraction = clamp01(sample.heightFraction);
  const upperLedgeMoss =
    Math.pow(Math.max(0, sample.normalY), 1.5) *
    UPPER_LEDGE_MOSS_STRENGTH *
    heightFraction;
  const mossSusceptibility = Math.max(
    sample.baseMossSusceptibility,
    upperLedgeMoss,
  );
  const exposure = clamp01(sample.exposure);
  const shadeRetention = 1 - exposure * sample.exposureStrength;
  const moss = clamp01(
    mossSusceptibility * sample.environmentMoss * shadeRetention,
  );

  const biomeLichen = LICHEN_ENVIRONMENT[sample.paletteKey];
  const altitudeBoost = sample.graniteBlend * 0.34;
  const dampSuppression = 1 - sample.environmentMoss * 0.42;
  const lichenEnvironment = clamp01(
    (biomeLichen + altitudeBoost) * dampSuppression,
  );
  const lichenExposure = 0.38 + exposure * 0.62;
  const mossCompetition = 1 - moss * 0.5;
  const lichenHeight =
    LICHEN_HEIGHT_FLOOR +
    (1 - LICHEN_HEIGHT_FLOOR) * heightFraction;
  const lichen = clamp01(
    lichenEnvironment * lichenExposure * mossCompetition * lichenHeight,
  );

  return { moss, lichen };
}
