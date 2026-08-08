/**
 * Stone palettes and the tone→colour ramp.
 *
 * A palette is four paint values — shadow, mid, light, and the edge-wear
 * accent — exactly the value structure of the reference boards (two to five
 * broad values per stone, lighter tops, pale worn edges). Colours are stored
 * linear so they can be written straight into vertex-colour attributes next to
 * the terrain's, which go through the same sRGB-hex → linear conversion.
 *
 * Which palette a stone gets is a placement decision (biome, altitude), not a
 * geometry decision: geometry carries only ramp positions.
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
  /**
   * Colour of growth at the stone's base. It has to differ in *hue* from the
   * stone, not just in value: the first pass picked colours a few percent off
   * each palette's own mid tone and the result read as dirt, or as nothing.
   */
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
 * The production families. Values sit deliberately close to the terrain's own
 * rock colours (#696b64 / #85857f) so stones read as outcrops of the same
 * world, then diverge by biome the way the grass profiles do.
 */
export const STONE_PALETTES = {
  /** Meadow lowland: sage grey-green, mossy shadows. */
  meadowSage: palette(
    "meadow-sage",
    "#464c3d",
    "#7d8468",
    "#b0b795",
    "#e6ebcb",
    "#5ba32c",
    1,
  ),
  /** Dry steppe: warm tan and umber. */
  steppeTan: palette(
    "steppe-tan",
    "#54492f",
    "#8d7d5c",
    "#bfae8b",
    "#efe2c2",
    "#a8a341",
    0.95,
  ),
  /** Alpine and high altitude: cool granite grey. */
  graniteGrey: palette(
    "granite-grey",
    "#3f423c",
    "#71746b",
    "#a3a59a",
    "#dcddd2",
    "#63a336",
    1.05,
  ),
  /** Deep-shade mossy variant used for occasional lowland accents. */
  mossy: palette(
    "mossy",
    "#3d4a35",
    "#6b7a58",
    "#9dad80",
    "#d5e3b0",
    "#4d9420",
    0.9,
  ),
} as const;

export type StonePaletteKey = keyof typeof STONE_PALETTES;

export interface StoneTintParams {
  /** Multiplied into every ramp colour; 1 is neutral. */
  readonly valueScale: number;
  /**
   * How much of the baked moss susceptibility actually grows here, in [0, 1].
   * A placement decision: damp meadow stones are mossy, dry steppe stones are
   * barely lichened, and the same geometry serves both.
   */
  readonly moss?: number;
  /** Blended towards a second palette for borders and altitude bands. */
  readonly secondary?: StonePalette;
  readonly secondaryBlend?: number;
}

function mixChannel(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sampleRamp(
  paletteColors: StonePalette,
  tone: number,
): [number, number, number] {
  // Soft three-stop ramp with a gentle quantize: enough banding to read as
  // painted values, not enough to posterize under real lighting.
  const banded = tone + (Math.round(tone * 3) / 3 - tone) * 0.45;
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

    // Moss last, over the worn edge: growth covers a weathered edge rather
    // than being polished away by it.
    const moss = mosses[index] * mossAmount;
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
