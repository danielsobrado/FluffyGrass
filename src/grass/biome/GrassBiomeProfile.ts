import profileData from "./GrassBiomeProfiles.json";

/**
 * Biome support is per-instance data, never a per-mesh uniform and never a new
 * material: every blade carries an `instanceBiome` row index, and the shaders
 * index bounded uniform arrays with it. Biome count therefore has no effect on
 * draw calls, program switches, or per-frame uniform uploads — the property to
 * defend in review for every future biome feature.
 *
 * The ceiling is a compile-time constant shared by the loader and the GLSL
 * `#define`, so a profile file that grows past the array size fails validation
 * instead of silently indexing out of bounds.
 */
export const GRASS_MAX_BIOMES = 8;

/**
 * Where a biome's colours come from.
 *
 * `art` means the row mirrors the active art-direction preset. Biome 0 must use
 * it: a single-biome world then renders byte-identically to a world with no
 * biome support at all, and switching art presets keeps working. `profile`
 * rows carry their own palette and ignore the preset's colours.
 */
export type GrassBiomePaletteSource = "art" | "profile";

export interface GrassBiomeProfile {
  key: string;
  index: number;
  label: string;
  paletteSource: GrassBiomePaletteSource;
  baseColor: string;
  tipColor: string;
  dryColor: string;
  rootDarkening: number;
  tipColorStrength: number;
  /**
   * Share of the world this biome occupies, relative to the other profiles.
   * Biome 0 should dominate: it carries the art direction's palette, so a world
   * where it is a minority reads as if the active preset were not applied.
   */
  worldShare: number;
  /** Relative blade coverage, multiplied into the art direction's own scale. */
  density: number;
  /** Clump height scale band; replaces the global constant band per blade. */
  heightBand: readonly [number, number];
  /** Horizontal scale band applied on top of the clump height scale. */
  widthBand: readonly [number, number];
  /** Added to the per-blade dryness before the existing clamp. */
  drynessBias: number;
  /** Scales the per-instance wind response; never above 1 (see bounds below). */
  windDamping: number;
  shapeFamily: string;
}

/**
 * Ceilings the reserved culling bounds are computed from. A profile that left
 * these ranges would make `calculateGrassSingleBladeRootBoundsRadius` wrong
 * without any code change, so the loader enforces them and
 * `verify-grass-performance` re-checks them from the JSON.
 *
 * - height 1.14 x the 1.06 per-blade jitter = 1.208, inside the 1.22 vertical
 *   instance ceiling.
 * - windDamping <= 1 keeps `instanceVariation.y` inside the 1.16 wind ceiling.
 *   Windier-than-meadow biomes belong in the art direction's global wind scale.
 */
export const GRASS_BIOME_HEIGHT_BAND_LIMIT = Object.freeze([0.7, 1.14] as const);
export const GRASS_BIOME_WIDTH_BAND_LIMIT = Object.freeze([0.76, 1.1] as const);
export const GRASS_BIOME_WIND_DAMPING_LIMIT = Object.freeze([0.7, 1] as const);

/**
 * Bumped whenever the profile set or the biome field changes shape. It is part
 * of the near-tile placement key, so editing a biome cannot resurrect a stale
 * cached tile built against the previous definition.
 */
export const GRASS_BIOME_VERSION = 1;

const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function fail(message: string): never {
  throw new Error(`[grass-biome] ${message}`);
}

function assertFiniteInRange(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`${label} must be a finite number.`);
  }
  if (value < minimum || value > maximum) {
    fail(`${label} must be within [${minimum}, ${maximum}], got ${value}.`);
  }
  return value;
}

function assertBand(
  value: unknown,
  limit: readonly [number, number],
  label: string,
): readonly [number, number] {
  if (!Array.isArray(value) || value.length !== 2) {
    fail(`${label} must be a two-element band.`);
  }
  const minimum = assertFiniteInRange(value[0], limit[0], limit[1], `${label} minimum`);
  const maximum = assertFiniteInRange(value[1], limit[0], limit[1], `${label} maximum`);
  if (minimum > maximum) {
    fail(`${label} is reversed.`);
  }
  return [minimum, maximum] as const;
}

function validate(key: string, raw: Record<string, unknown>): GrassBiomeProfile {
  const index = raw.index;
  if (typeof index !== "number" || !Number.isInteger(index) || index < 0) {
    fail(`Biome ${key} needs a non-negative integer index.`);
  }
  if (typeof raw.label !== "string" || raw.label.length === 0) {
    fail(`Biome ${key} needs a label.`);
  }
  if (raw.paletteSource !== "art" && raw.paletteSource !== "profile") {
    fail(`Biome ${key} paletteSource must be "art" or "profile".`);
  }
  if (index === 0 && raw.paletteSource !== "art") {
    fail(
      "Biome 0 must take the art direction's palette so a single-biome world " +
        "renders identically to one without biome support.",
    );
  }
  for (const field of ["baseColor", "tipColor", "dryColor"] as const) {
    if (typeof raw[field] !== "string" || !COLOR_PATTERN.test(raw[field])) {
      fail(`Biome ${key} ${field} must be #RRGGBB.`);
    }
  }
  if (typeof raw.shapeFamily !== "string" || raw.shapeFamily.length === 0) {
    fail(`Biome ${key} needs a shapeFamily.`);
  }

  return {
    key,
    index,
    label: raw.label,
    paletteSource: raw.paletteSource,
    baseColor: raw.baseColor as string,
    tipColor: raw.tipColor as string,
    dryColor: raw.dryColor as string,
    rootDarkening: assertFiniteInRange(
      raw.rootDarkening,
      0,
      1,
      `Biome ${key} rootDarkening`,
    ),
    tipColorStrength: assertFiniteInRange(
      raw.tipColorStrength,
      0,
      1,
      `Biome ${key} tipColorStrength`,
    ),
    worldShare: assertFiniteInRange(
      raw.worldShare,
      0.01,
      1,
      `Biome ${key} worldShare`,
    ),
    density: assertFiniteInRange(raw.density, 0.0001, 1, `Biome ${key} density`),
    heightBand: assertBand(
      raw.heightBand,
      GRASS_BIOME_HEIGHT_BAND_LIMIT,
      `Biome ${key} heightBand`,
    ),
    widthBand: assertBand(
      raw.widthBand,
      GRASS_BIOME_WIDTH_BAND_LIMIT,
      `Biome ${key} widthBand`,
    ),
    drynessBias: assertFiniteInRange(
      raw.drynessBias,
      0,
      0.6,
      `Biome ${key} drynessBias`,
    ),
    windDamping: assertFiniteInRange(
      raw.windDamping,
      GRASS_BIOME_WIND_DAMPING_LIMIT[0],
      GRASS_BIOME_WIND_DAMPING_LIMIT[1],
      `Biome ${key} windDamping`,
    ),
    shapeFamily: raw.shapeFamily,
  };
}

function loadProfiles(): readonly GrassBiomeProfile[] {
  const entries = Object.entries(
    profileData as unknown as Record<string, Record<string, unknown>>,
  );
  if (entries.length === 0) {
    fail("At least one biome profile is required.");
  }
  if (entries.length > GRASS_MAX_BIOMES) {
    fail(
      `At most ${GRASS_MAX_BIOMES} biome profiles fit the bounded palette ` +
        `uniform arrays, found ${entries.length}.`,
    );
  }
  const profiles = entries.map(([key, raw]) => validate(key, raw));
  profiles.sort((left, right) => left.index - right.index);
  profiles.forEach((profile, position) => {
    if (profile.index !== position) {
      fail(
        `Biome indices must be dense from 0; ${profile.key} has index ` +
          `${profile.index} at position ${position}.`,
      );
    }
  });
  const totalShare = profiles.reduce(
    (sum, profile) => sum + profile.worldShare,
    0,
  );
  if (profiles.length > 1 && profiles[0].worldShare / totalShare < 0.4) {
    fail(
      "Biome 0 must hold at least 40% of the world: it carries the art " +
        "direction's palette, and a world where it is a minority no longer " +
        "looks like the active preset.",
    );
  }
  return Object.freeze(profiles.map((profile) => Object.freeze(profile)));
}

export const GRASS_BIOME_PROFILES = loadProfiles();

function bandMean(band: readonly [number, number]): number {
  return (band[0] + band[1]) * 0.5;
}

/**
 * A biome's height (or width) relative to biome 0.
 *
 * Near tiles apply the bands directly, because those bands *are* the clump
 * scale bands. Mid patches carry one scale for a whole 4 m patch, so they apply
 * a ratio instead — which makes biome 0 exactly 1 and keeps a single-biome
 * world byte-identical to one built before biomes existed.
 *
 * Clamped at 1: a biome may be shorter than the reference, never taller. A
 * taller field is an art-direction decision, and letting a profile exceed the
 * reference here would push the instance scale past the ceiling the impostor
 * and single-blade culling bounds are computed from.
 */
export function resolveGrassBiomeHeightRatio(profile: GrassBiomeProfile): number {
  return Math.min(
    1,
    bandMean(profile.heightBand) / bandMean(GRASS_BIOME_PROFILES[0].heightBand),
  );
}

export function resolveGrassBiomeWidthRatio(profile: GrassBiomeProfile): number {
  return Math.min(
    1,
    bandMean(profile.widthBand) / bandMean(GRASS_BIOME_PROFILES[0].widthBand),
  );
}
