import {
  GRASS_ACCENT_SPECIES,
  GRASS_MAX_ACCENT_TINTS,
  type GrassAccentCategory,
} from "../../grass/biome/GrassAccentSpecies";
import type {
  GrassBiomeAccentSpecies,
  GrassBiomeProfile,
} from "../../grass/biome/GrassBiomeProfile";
import type { WorldEcologySample } from "../ecology/WorldEcologyField";
import {
  DETAIL_FOLIAGE_COMPANION_PICK_SALT,
  DETAIL_FOLIAGE_DOMINANT_DECISION_SALT,
  DETAIL_FOLIAGE_HEIGHT_SALT,
  DETAIL_FOLIAGE_INDEPENDENT_TINT_SALT,
  DETAIL_FOLIAGE_INDIVIDUAL_MATURITY_SALT,
  DETAIL_FOLIAGE_PHENOTYPE_SALT,
  DETAIL_FOLIAGE_TINT_COHERENCE_SALT,
  detailFoliageChannel01,
} from "./DetailFoliageRandom";
import type { DetailFoliageTuning } from "./DetailFoliageTuning";
import type { DetailFoliageDistributionSample } from "./WorldDetailFoliageDistribution";

export interface DetailFoliageSelection {
  speciesIndex: number;
  tintRow: number;
}

export function createDetailFoliageSelection(): DetailFoliageSelection {
  return { speciesIndex: 0, tintRow: 0 };
}

const HABITAT_WEIGHT_SUM = 4.6;

interface HabitatPreference {
  moisture: readonly [number, number];
  fertility: readonly [number, number];
  exposure: readonly [number, number];
  rockiness: readonly [number, number];
  disturbance: readonly [number, number];
}

const HABITAT_BY_KEY: Readonly<Record<string, HabitatPreference>> = Object.freeze({
  "grass-tuft": {
    moisture: [0.5, 1],
    fertility: [0.5, 1],
    exposure: [0.5, 1],
    rockiness: [0.5, 1],
    disturbance: [0.4, 1],
  },
  "low-shrub": {
    moisture: [0.55, 0.55],
    fertility: [0.65, 0.5],
    exposure: [0.55, 0.55],
    rockiness: [0.35, 0.55],
    disturbance: [0.1, 0.35],
  },
  fern: {
    moisture: [0.82, 0.42],
    fertility: [0.55, 0.6],
    exposure: [0.25, 0.45],
    rockiness: [0.45, 0.55],
    disturbance: [0.05, 0.25],
  },
  "small-fern": {
    moisture: [0.72, 0.5],
    fertility: [0.52, 0.65],
    exposure: [0.3, 0.5],
    rockiness: [0.6, 0.45],
    disturbance: [0.1, 0.35],
  },
  daisy: {
    moisture: [0.55, 0.55],
    fertility: [0.75, 0.42],
    exposure: [0.65, 0.5],
    rockiness: [0.25, 0.6],
    disturbance: [0.1, 0.4],
  },
  "round-bloom": {
    moisture: [0.58, 0.52],
    fertility: [0.68, 0.48],
    exposure: [0.55, 0.55],
    rockiness: [0.2, 0.55],
    disturbance: [0.1, 0.4],
  },
  "seed-head": {
    moisture: [0.22, 0.45],
    fertility: [0.35, 0.65],
    exposure: [0.8, 0.45],
    rockiness: [0.5, 0.65],
    disturbance: [0.25, 0.6],
  },
  "broadleaf-rosette": {
    moisture: [0.72, 0.45],
    fertility: [0.8, 0.38],
    exposure: [0.35, 0.5],
    rockiness: [0.2, 0.5],
    disturbance: [0.08, 0.3],
  },
});

const CATEGORY_INDEX: Record<GrassAccentCategory, number> = {
  tuft: 0,
  shrub: 1,
  fern: 2,
  broadleaf: 3,
  flower: 4,
  seed: 5,
};

const COMPATIBILITY = [
  [1, 0.65, 0.65, 0.75, 0.7, 0.7],
  [0.9, 1, 0.65, 0.9, 0.3, 0.25],
  [0.8, 0.55, 1, 0.9, 0.25, 0.15],
  [0.85, 0.75, 0.85, 1, 0.45, 0.2],
  [0.85, 0.25, 0.3, 0.65, 0.55, 0.3],
  [0.9, 0.3, 0.15, 0.2, 0.3, 1],
];

function clamp01(value: number): number {
  return value <= 0 ? 0 : value >= 1 ? 1 : value;
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (value <= edge0) {
    return 0;
  }
  if (value >= edge1) {
    return 1;
  }
  const amount = (value - edge0) / (edge1 - edge0);
  return amount * amount * (3 - 2 * amount);
}

function preference(value: number, target: number, tolerance: number): number {
  return clamp01(1 - Math.abs(value - target) / tolerance);
}

export function scoreDetailFoliageHabitat(
  speciesIndex: number,
  ecology: WorldEcologySample,
): number {
  const species = GRASS_ACCENT_SPECIES[speciesIndex];
  const habitat = species ? HABITAT_BY_KEY[species.key] : undefined;
  if (!habitat) {
    return 0.15;
  }
  const raw =
    (preference(ecology.moisture, habitat.moisture[0], habitat.moisture[1]) *
      1 +
      preference(ecology.fertility, habitat.fertility[0], habitat.fertility[1]) *
        1 +
      preference(ecology.exposure, habitat.exposure[0], habitat.exposure[1]) *
        0.7 +
      preference(ecology.rockiness, habitat.rockiness[0], habitat.rockiness[1]) *
        0.7 +
      preference(
        ecology.disturbance,
        habitat.disturbance[0],
        habitat.disturbance[1],
      ) *
        1.2) /
    HABITAT_WEIGHT_SUM;
  return 0.15 + 0.85 * raw;
}

function edgeBoost(
  key: string,
  pathFringe: number,
  stoneFringe: number,
  habitatDryness: number,
  tuning: DetailFoliageTuning,
): number {
  const edge = tuning.edgeCompanionStrength;
  if (key === "fern" || key === "small-fern" || key === "broadleaf-rosette") {
    return 1 + stoneFringe * tuning.stoneFringeStrength * edge;
  }
  if (key === "low-shrub") {
    return 1 + stoneFringe * 0.5 * tuning.stoneFringeStrength * edge;
  }
  if (key === "daisy" || key === "round-bloom") {
    return 1 + pathFringe * tuning.pathFringeStrength * edge;
  }
  if (key === "seed-head") {
    return 1 + pathFringe * habitatDryness * tuning.pathFringeStrength * edge;
  }
  return 1;
}

function adjustedWeight(
  entry: GrassBiomeAccentSpecies,
  ecology: WorldEcologySample,
  habitatDryness: number,
  pathFringe: number,
  stoneFringe: number,
  tuning: DetailFoliageTuning,
): number {
  const species = GRASS_ACCENT_SPECIES[entry.speciesIndex];
  const habitatScore = scoreDetailFoliageHabitat(entry.speciesIndex, ecology);
  const weight = entry.weight * lerp(1, habitatScore, tuning.ecologyStrength);
  if (!(weight > 0) || !Number.isFinite(weight) || !species) {
    return 0;
  }
  return (
    weight *
    edgeBoost(species.key, pathFringe, stoneFringe, habitatDryness, tuning)
  );
}

function companionScaledWeight(
  entry: GrassBiomeAccentSpecies,
  ecology: WorldEcologySample,
  habitatDryness: number,
  pathFringe: number,
  stoneFringe: number,
  tuning: DetailFoliageTuning,
  dominantCategory: GrassAccentCategory | undefined,
): number {
  const weight = adjustedWeight(
    entry,
    ecology,
    habitatDryness,
    pathFringe,
    stoneFringe,
    tuning,
  );
  if (weight <= 0 || dominantCategory === undefined) {
    return weight;
  }
  const species = GRASS_ACCENT_SPECIES[entry.speciesIndex];
  if (!species) {
    return 0;
  }
  return (
    weight *
    COMPATIBILITY[CATEGORY_INDEX[dominantCategory]][
      CATEGORY_INDEX[species.category]
    ]
  );
}

function pickWeightedEntry(
  profile: GrassBiomeProfile,
  ecology: WorldEcologySample,
  habitatDryness: number,
  pathFringe: number,
  stoneFringe: number,
  tuning: DetailFoliageTuning,
  roll: number,
  dominantCategory: GrassAccentCategory | undefined,
): GrassBiomeAccentSpecies | undefined {
  let total = 0;
  for (const entry of profile.accentSpecies) {
    const weight = companionScaledWeight(
      entry,
      ecology,
      habitatDryness,
      pathFringe,
      stoneFringe,
      tuning,
      dominantCategory,
    );
    if (weight > 0) {
      total += weight;
    }
  }
  if (total <= 0) {
    return undefined;
  }

  let target = clamp01(roll) * total;
  let lastPositive: GrassBiomeAccentSpecies | undefined;
  for (const entry of profile.accentSpecies) {
    const weight = companionScaledWeight(
      entry,
      ecology,
      habitatDryness,
      pathFringe,
      stoneFringe,
      tuning,
      dominantCategory,
    );
    if (weight <= 0) {
      continue;
    }
    lastPositive = entry;
    target -= weight;
    if (target <= 0) {
      return entry;
    }
  }
  return lastPositive;
}

function pickTintRow(
  profile: GrassBiomeProfile,
  speciesIndex: number,
  roll: number,
  fallback: number,
): number {
  let total = 0;
  for (const entry of profile.accentSpecies) {
    if (entry.speciesIndex === speciesIndex && entry.weight > 0) {
      total += entry.weight;
    }
  }
  if (total <= 0) {
    return fallback;
  }

  let target = clamp01(roll) * total;
  let lastPositive = fallback;
  for (const entry of profile.accentSpecies) {
    if (entry.speciesIndex !== speciesIndex || entry.weight <= 0) {
      continue;
    }
    lastPositive = entry.tintRow;
    target -= entry.weight;
    if (target <= 0) {
      return entry.tintRow;
    }
  }
  return lastPositive;
}

export function detailFoliageCorrelation(tuning: DetailFoliageTuning): number {
  return smoothstep(0, 0.75, clamp01(tuning.colonyStrength));
}

export function detailFoliageDominantProbability(
  distribution: DetailFoliageDistributionSample,
  tuning: DetailFoliageTuning,
): number {
  const localCoherence = lerp(0.9, 1, distribution.core);
  return clamp01(
    tuning.dominantFamilyShare *
      detailFoliageCorrelation(tuning) *
      localCoherence,
  );
}

export function detailFoliageEffectiveTintCoherence(
  tuning: DetailFoliageTuning,
): number {
  return tuning.tintCoherence * detailFoliageCorrelation(tuning);
}

export function detailFoliageHeightShift(
  distribution: DetailFoliageDistributionSample,
  tuning: DetailFoliageTuning,
): number {
  return (
    tuning.coreHeightBias *
    detailFoliageCorrelation(tuning) *
    (distribution.core - 0.5)
  );
}

export function detailFoliageHeightRoll(
  distribution: DetailFoliageDistributionSample,
  candidateHash: number,
  tuning: DetailFoliageTuning,
): number {
  return clamp01(
    detailFoliageChannel01(candidateHash, DETAIL_FOLIAGE_HEIGHT_SALT) +
      detailFoliageHeightShift(distribution, tuning),
  );
}

export function detailFoliageMaturity(
  distribution: DetailFoliageDistributionSample,
  candidateHash: number,
  tuning: DetailFoliageTuning,
): number {
  const correlation = detailFoliageCorrelation(tuning);
  const individual = detailFoliageChannel01(
    candidateHash,
    DETAIL_FOLIAGE_INDIVIDUAL_MATURITY_SALT,
  );
  const spatialMaturity = clamp01(
    0.75 * distribution.maturityRoll + 0.25 * distribution.core,
  );
  return lerp(
    individual,
    0.7 * spatialMaturity + 0.3 * individual,
    correlation,
  );
}

export function detailFoliageVariantRow(
  distribution: DetailFoliageDistributionSample,
  candidateHash: number,
  tuning: DetailFoliageTuning,
): number {
  const maturity = detailFoliageMaturity(distribution, candidateHash, tuning);
  const pMatureRow = clamp01(
    tuning.maturePhenotypeBias * (0.35 + 0.65 * maturity),
  );
  return detailFoliageChannel01(candidateHash, DETAIL_FOLIAGE_PHENOTYPE_SALT) <
    pMatureRow
    ? 1
    : 0;
}

export function pickDetailFoliageWeightedIndex(
  weights: ArrayLike<number>,
  roll: number,
): number {
  let total = 0;
  for (let index = 0; index < weights.length; index += 1) {
    const weight = weights[index];
    if (weight > 0 && Number.isFinite(weight)) {
      total += weight;
    }
  }
  if (total <= 0) {
    return -1;
  }

  let target = clamp01(roll) * total;
  let lastPositive = -1;
  for (let index = 0; index < weights.length; index += 1) {
    const weight = weights[index];
    if (!(weight > 0) || !Number.isFinite(weight)) {
      continue;
    }
    lastPositive = index;
    target -= weight;
    if (target <= 0) {
      return index;
    }
  }
  return lastPositive;
}

export function resolveDetailFoliageSelection(
  profile: GrassBiomeProfile,
  ecology: WorldEcologySample,
  habitatDryness: number,
  pathMask: number,
  stoneMask: number,
  distribution: DetailFoliageDistributionSample,
  candidateHash: number,
  tuning: DetailFoliageTuning,
  target: DetailFoliageSelection,
): boolean {
  const pathFringe = clamp01(4 * pathMask * (1 - pathMask));
  const stoneFringe = clamp01(4 * stoneMask * (1 - stoneMask));
  const dominant = pickWeightedEntry(
    profile,
    ecology,
    habitatDryness,
    pathFringe,
    stoneFringe,
    tuning,
    distribution.familyRoll,
    undefined,
  );
  if (!dominant) {
    return false;
  }

  const pDominant = detailFoliageDominantProbability(distribution, tuning);
  const useDominant =
    detailFoliageChannel01(candidateHash, DETAIL_FOLIAGE_DOMINANT_DECISION_SALT) <
    pDominant;
  let selected = dominant;
  if (!useDominant) {
    const companionRoll = detailFoliageChannel01(
      candidateHash,
      DETAIL_FOLIAGE_COMPANION_PICK_SALT,
    );
    const companion = pickWeightedEntry(
      profile,
      ecology,
      habitatDryness,
      pathFringe,
      stoneFringe,
      tuning,
      companionRoll,
      GRASS_ACCENT_SPECIES[dominant.speciesIndex]?.category,
    );
    selected =
      companion ??
      pickWeightedEntry(
        profile,
        ecology,
        habitatDryness,
        pathFringe,
        stoneFringe,
        tuning,
        companionRoll,
        undefined,
      ) ??
      dominant;
  }

  const species = GRASS_ACCENT_SPECIES[selected.speciesIndex];
  if (!species) {
    return false;
  }
  target.speciesIndex = selected.speciesIndex;
  if (species.category !== "flower") {
    target.tintRow = selected.tintRow;
    return true;
  }

  const colonyTintRow = pickTintRow(
    profile,
    selected.speciesIndex,
    distribution.tintRoll,
    selected.tintRow,
  );
  if (
    detailFoliageChannel01(candidateHash, DETAIL_FOLIAGE_TINT_COHERENCE_SALT) <
    detailFoliageEffectiveTintCoherence(tuning)
  ) {
    target.tintRow = colonyTintRow;
  } else {
    target.tintRow = pickTintRow(
      profile,
      selected.speciesIndex,
      detailFoliageChannel01(candidateHash, DETAIL_FOLIAGE_INDEPENDENT_TINT_SALT),
      selected.tintRow,
    );
  }
  if (target.tintRow < 0 || target.tintRow >= GRASS_MAX_ACCENT_TINTS) {
    target.tintRow = 0;
  }
  return true;
}
