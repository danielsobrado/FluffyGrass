/**
 * Stone palettes and the tone→colour ramp.
 *
 * A palette is four paint values — shadow, mid, light, and edge-wear accent.
 * The colours stay close to the terrain so stones read as part of the same
 * world, while the stronger value separation keeps broad facets readable.
 *
 * Which palette a stone gets is a placement decision, not a geometry decision:
 * geometry carries only ramp positions and placement resolves final colours.
 */

export interface StoneLinearColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export interface StonePalette {
  readonly key: string;
  readonly shadow: StoneLinearColor;
  readonly mid: StoneLinearColor;
  readonly light: StoneLinearColor;
  readonly edge: StoneLinearColor;
  /** Colour of growth at the stone's base. */
  readonly moss: StoneLinearColor;
  /** Global multiplier on baked edge wear; keeps some sets matte. */
  readonly edgeStrength: number;
}

function srgbChannelToLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

export function linearFromHex(hex: string): StoneLinearColor {
  const value = parseInt(hex.slice(1), 16);
  return {
    r: srgbChannelToLinear(((value >> 16) & 0xff) / 255),
    g: srgbChannelToLinear(((value >> 8) & 0xff) / 255),
    b: srgbChannelToLinear((value & 0xff) / 255),
  };
}

function palette(
  key: string,
  shadow: string,
  mid: string,
  light: string,
  edge: string,
  moss: string,
  edgeStrength: number,
): StonePalette {
  return {
    key,
    shadow: linearFromHex(shadow),
    mid: linearFromHex(mid),
    light: linearFromHex(light),
    edge: linearFromHex(edge),
    moss: linearFromHex(moss),
    edgeStrength,
  };
}

/**
 * Muted production families. The previous highlights were pale enough to turn
 * top faces chalky under the scene sun and ACES tone mapping; these retain the
 * same hue families while keeping the painted edge as an accent, not an outline.
 */
export const STONE_PALETTES = {
  /** Meadow lowland: sage grey-green. */
  meadowSage: palette(
    "meadow-sage",
    "#41483b",
    "#6d7661",
    "#98a486",
    "#c6cfaa",
    "#5f793e",
    0.82,
  ),
  /** Dry steppe: warm tan and muted umber. */
  steppeTan: palette(
    "steppe-tan",
    "#51462f",
    "#807157",
    "#a99a78",
    "#d2c3a2",
    "#7c7944",
    0.78,
  ),
  /** Alpine and high altitude: cool granite grey. */
  graniteGrey: palette(
    "granite-grey",
    "#41433f",
    "#676a63",
    "#8f9289",
    "#b9bcb3",
    "#63774a",
    0.86,
  ),
  /** Deep-shade mossy variant used for occasional lowland accents. */
  mossy: palette(
    "mossy",
    "#394337",
    "#5d6a54",
    "#839374",
    "#b2c09d",
    "#517337",
    0.72,
  ),
} as const;

export type StonePaletteKey = keyof typeof STONE_PALETTES;

export interface StoneTintParams {
  /** Multiplied into every ramp colour; 1 is neutral. */
  readonly valueScale: number;
  /** How much of the baked moss susceptibility grows here, in [0, 1]. */
  readonly moss?: number;
  /** Blended towards a second palette for borders and altitude bands. */
  readonly secondary?: StonePalette;
  readonly secondaryBlend?: number;
}

const RAMP_BANDING_STRENGTH = 0.62;
const MOSS_COLOR_STRENGTH = 0.72;

function mixChannel(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sampleRamp(
  paletteColors: StonePalette,
  tone: number,
): [number, number, number] {
  // Pull values towards four broad paint bands while retaining enough
  // interpolation for the contact gradient and edge transition to stay soft.
  const quantized = Math.round(tone * 3) / 3;
  const banded = tone + (quantized - tone) * RAMP_BANDING_STRENGTH;
  if (banded < 0.5) {
    const t = banded * 2;
    return [
      mixChannel(paletteColors.shadow.r, paletteColors.mid.r, t),
      mixChannel(paletteColors.shadow.g, paletteColors.mid.g, t),
      mixChannel(paletteColors.shadow.b, paletteColors.mid.b, t),
    ];
  }
  const t = (banded - 0.5) * 2;
  return [
    mixChannel(paletteColors.mid.r, paletteColors.light.r, t),
    mixChannel(paletteColors.mid.g, paletteColors.light.g, t),
    mixChannel(paletteColors.mid.b, paletteColors.light.b, t),
  ];
}

/**
 * Resolve final linear vertex colours from baked tones and wears.
 *
 * `target` must hold `tones.length * 3` floats; pass an offset to colorize in
 * place inside a merged chunk attribute.
 */
export function colorizeStoneVertices(
  tones: Float32Array,
  wears: Float32Array,
  mosses: Float32Array,
  paletteColors: StonePalette,
  tint: StoneTintParams,
  target: Float32Array,
  targetOffset = 0,
): void {
  const secondary = tint.secondary;
  const blend = tint.secondaryBlend ?? 0;
  const mossAmount = tint.moss ?? 0;
  for (let index = 0; index < tones.length; index += 1) {
    let [r, g, b] = sampleRamp(paletteColors, tones[index]);
    let edgeR = paletteColors.edge.r;
    let edgeG = paletteColors.edge.g;
    let edgeB = paletteColors.edge.b;
    let edgeStrength = paletteColors.edgeStrength;
    let mossR = paletteColors.moss.r;
    let mossG = paletteColors.moss.g;
    let mossB = paletteColors.moss.b;
    if (secondary && blend > 0) {
      const [r2, g2, b2] = sampleRamp(secondary, tones[index]);
      r = mixChannel(r, r2, blend);
      g = mixChannel(g, g2, blend);
      b = mixChannel(b, b2, blend);
      edgeR = mixChannel(edgeR, secondary.edge.r, blend);
      edgeG = mixChannel(edgeG, secondary.edge.g, blend);
      edgeB = mixChannel(edgeB, secondary.edge.b, blend);
      edgeStrength = mixChannel(edgeStrength, secondary.edgeStrength, blend);
      mossR = mixChannel(mossR, secondary.moss.r, blend);
      mossG = mixChannel(mossG, secondary.moss.g, blend);
      mossB = mixChannel(mossB, secondary.moss.b, blend);
    }

    const wear = wears[index] * edgeStrength;
    if (wear > 0) {
      r = mixChannel(r, edgeR, wear);
      g = mixChannel(g, edgeG, wear);
      b = mixChannel(b, edgeB, wear);
    }

    // Moss stays subordinate to the stone value structure. Full-strength green
    // on a bright facet reads as painted colour rather than organic growth.
    const moss = mosses[index] * mossAmount * MOSS_COLOR_STRENGTH;
    if (moss > 0) {
      r = mixChannel(r, mossR, moss);
      g = mixChannel(g, mossG, moss);
      b = mixChannel(b, mossB, moss);
    }

    const offset = targetOffset + index * 3;
    target[offset] = r * tint.valueScale;
    target[offset + 1] = g * tint.valueScale;
    target[offset + 2] = b * tint.valueScale;
  }
}
