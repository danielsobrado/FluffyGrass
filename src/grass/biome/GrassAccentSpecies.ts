/**
 * The detail-foliage species catalogue: ferns, flowers, seed heads, and the
 * sprigs between them.
 *
 * This is pure data with no renderer dependency, because four layers need to
 * agree on it: the biome profiles name species and tints, the atlas factory
 * bakes one cell per species, the placement field reads the height bands and
 * the macro gate each species belongs to, and the material uploads the wind
 * weights as a bounded uniform array. One catalogue keeps those four in step —
 * the same reason the biome profiles themselves are loaded once and validated.
 *
 * Both tables are capped at eight entries: the shader indexes them with a
 * per-instance row, exactly like the biome palette arrays, so their length is a
 * uniform-array size and never a draw-call or program count.
 */

export const GRASS_MAX_ACCENT_SPECIES = 8;
export const GRASS_MAX_ACCENT_TINTS = 8;

/**
 * Which macro field decides where a species belongs. The categories are what
 * make the field read as *mixed* rather than as a uniform sprinkle: flowers
 * follow vigour, seed heads follow dryness, ferns follow the poorer ground the
 * blade layer is already thinning on, and tufts fill everywhere. Those fields
 * disagree with each other spatially, so their union is patchy at metre scale
 * without any extra noise of its own.
 */
export type GrassAccentCategory = "tuft" | "fern" | "flower" | "seed";

export interface GrassAccentSpeciesDefinition {
  key: string;
  index: number;
  category: GrassAccentCategory;
  /** Card width as a fraction of its height. The atlas cell is drawn to match. */
  aspect: number;
  /** Wind response, in [0.3, 1]; the per-texel mask the article uses cannot act
   * in a vertex stage, so this scalar times a height ramp is its equivalent. */
  windWeight: number;
  /**
   * Card height band as a **multiple of the grass canopy height**, sampled per
   * instance and resolved to metres at build time.
   *
   * Relative, not absolute, and that is the whole point: an accent layer exists
   * to be seen, so every one of these bands is a statement about where a species
   * sits against the blades around it — a daisy's bloom at the canopy line, a
   * seed head above it, a small fern below. Absolute metres cannot express that.
   * They were tried first and the layer rendered invisible: the blade silhouette
   * pass had meanwhile taken the canopy from 0.83 m to 0.73 m while the accents
   * kept 0.3-0.7 m heights authored against an older, taller field, so ~1 500
   * cards were streaming, building, and drawing entirely underneath the grass.
   *
   * Anchoring to the canopy makes that failure impossible to reintroduce: blade
   * heights are config (`bladeHeightMin`/`Max`) and have changed once already.
   */
  canopyHeightBand: readonly [number, number];
}

/**
 * The canopy a band of 1.0 refers to: the height {@link
 * WorldSingleBladeTileFactory.createSingleBladeGeometry} builds a blade at,
 * which is the mean of the configured blade height range. Per-instance vertical
 * scale varies individual blades around it by roughly ±20%.
 */
export function resolveGrassCanopyHeight(
  bladeHeightMin: number,
  bladeHeightMax: number,
): number {
  return (bladeHeightMin + bladeHeightMax) * 0.5;
}

export const GRASS_ACCENT_SPECIES: readonly GrassAccentSpeciesDefinition[] =
  Object.freeze(
    (
      [
        {
          key: "grass-tuft",
          category: "tuft",
          aspect: 0.9,
          windWeight: 0.85,
          canopyHeightBand: [0.7, 0.95],
        },
        {
          key: "tall-tuft",
          category: "tuft",
          aspect: 0.6,
          windWeight: 1,
          canopyHeightBand: [1.0, 1.3],
        },
        {
          key: "fern",
          category: "fern",
          aspect: 1,
          windWeight: 0.35,
          canopyHeightBand: [0.85, 1.15],
        },
        {
          key: "small-fern",
          category: "fern",
          aspect: 0.95,
          windWeight: 0.4,
          canopyHeightBand: [0.58, 0.82],
        },
        {
          key: "daisy",
          category: "flower",
          aspect: 0.72,
          windWeight: 0.7,
          // Wild daisies should not form one mechanical horizon. The atlas
          // phenotype also varies stem length, so this broad card band produces
          // both blooms tucked into the canopy and occasional taller stems.
          canopyHeightBand: [0.88, 1.58],
        },
        {
          key: "round-bloom",
          category: "flower",
          aspect: 0.9,
          windWeight: 0.65,
          // A different band and aspect keep this family visibly distinct from
          // daisies even before petal shape and colour variation are applied.
          canopyHeightBand: [0.82, 1.46],
        },
        {
          key: "seed-head",
          category: "seed",
          aspect: 0.5,
          windWeight: 1,
          canopyHeightBand: [1.3, 1.72],
        },
        {
          key: "sprig",
          category: "tuft",
          aspect: 0.7,
          windWeight: 0.55,
          canopyHeightBand: [0.7, 1.0],
        },
      ] as const
    ).map((definition, index) =>
      Object.freeze({ ...definition, index } as GrassAccentSpeciesDefinition),
    ),
  );

/**
 * Tint rows for the atlas's B channel, which marks petals and seed clusters.
 *
 * The colour is per instance rather than per material, so one atlas yields a
 * broad natural wildflower mix with no extra draw and no second texture. The
 * palette stays deliberately muted so flowers sit inside the grass field rather
 * than reading as saturated markers. Accents are outside the LOD colour-parity
 * budget because they are not grass colour.
 */
export const GRASS_ACCENT_TINTS: readonly { key: string; color: string }[] =
  Object.freeze([
    { key: "white", color: "#ddd8c6" },
    { key: "cream", color: "#d4c7a3" },
    { key: "buttercup", color: "#c9ac62" },
    { key: "poppy-red", color: "#a56a5d" },
    { key: "pink", color: "#bf939e" },
    { key: "lavender", color: "#9f96ae" },
    { key: "straw", color: "#b9ad86" },
    { key: "sky-blue", color: "#8fa5ad" },
  ]);

/** The tint every untinted species uses. Their B channel is zero, so the row
 * is never read — naming it keeps `"none"` a valid profile value. */
export const GRASS_ACCENT_TINT_NONE = "none";

export function findGrassAccentSpecies(
  key: string,
): GrassAccentSpeciesDefinition | undefined {
  return GRASS_ACCENT_SPECIES.find((species) => species.key === key);
}

export function resolveGrassAccentTintRow(key: string): number {
  if (key === GRASS_ACCENT_TINT_NONE) {
    return 0;
  }
  const row = GRASS_ACCENT_TINTS.findIndex((tint) => tint.key === key);
  return row < 0 ? 0 : row;
}

/**
 * The one float each instance carries. Species, atlas variant row, and tint fit
 * a single attribute, which keeps the accent layer on the same four-attribute
 * budget as every other grass layer.
 */
export function packGrassAccent(
  speciesIndex: number,
  variantRow: number,
  tintRow: number,
): number {
  return speciesIndex * 16 + variantRow * 8 + tintRow;
}
