/**
 * Stone palettes and the tone→colour ramp.
 *
 * Stone paint and biological growth are resolved separately. The base mesh
 * keeps broad value bands while the shared stone shader applies moss and
 * lichen masks, so close-range colony breakup can reveal the original stone
 * instead of modulating an already-green vertex colour.
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
  readonly moss: StoneLinearColor;
  readonly lichen: StoneLinearColor;
  /** Global multiplier on baked edge wear; keeps some sets matte. */
  readonly edgeStrength: number;
}

export interface StoneGrowthColors {
  readonly moss: StoneLinearColor;
  readonly lichen: StoneLinearColor;
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
  lichen: string,
  edgeStrength: number,
): StonePalette {
  return {
    key,
    shadow: linearFromHex(shadow),
    mid: linearFromHex(mid),
    light: linearFromHex(light),
    edge: linearFromHex(edge),
    moss: linearFromHex(moss),
    lichen: linearFromHex(lichen),
    edgeStrength,
  };
}

/**
 * Muted production families. Moss remains darker and greener than the stone;
 * lichen is drier, paler and closer to olive-grey so exposed alpine and steppe
 * rocks do not simply look like meadow stones with less green on them.
 */
export const STONE_PALETTES = {
  meadowSage: palette(
    "meadow-sage",
    "#41483b",
    "#6d7661",
    "#98a486",
    "#c6cfaa",
    "#536f3d",
    "#9da276",
    0.82,
  ),
  steppeTan: palette(
    "steppe-tan",
    "#51462f",
    "#807157",
    "#a99a78",
    "#d2c3a2",
    "#6f7041",
    "#b4aa72",
    0.78,
  ),
  graniteGrey: palette(
    "granite-grey",
    "#41433f",
    "#676a63",
    "#8f9289",
    "#b9bcb3",
    "#586d45",
    "#a6ad8d",
    0.86,
  ),
  mossy: palette(
    "mossy",
    "#394337",
    "#5d6a54",
    "#839374",
    "#b2c09d",
    "#466a35",
    "#929d70",
    0.72,
  ),
} as const;

export type StonePaletteKey = keyof typeof STONE_PALETTES;

export interface StoneTintParams {
  /** Multiplied into every stone ramp colour; 1 is neutral. */
  readonly valueScale: number;
  /** Blended towards a second palette for borders and altitude bands. */
  readonly secondary?: StonePalette;
  readonly secondaryBlend?: number;
}

const RAMP_BANDING_STRENGTH = 0.62;

function mixChannel(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixColor(
  primary: StoneLinearColor,
  secondary: StoneLinearColor,
  amount: number,
): StoneLinearColor {
  return {
    r: mixChannel(primary.r, secondary.r, amount),
    g: mixChannel(primary.g, secondary.g, amount),
    b: mixChannel(primary.b, secondary.b, amount),
  };
}

function sampleRamp(
  paletteColors: StonePalette,
  tone: number,
): [number, number, number] {
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

export function resolveStoneGrowthColors(
  paletteColors: StonePalette,
  tint: StoneTintParams,
): StoneGrowthColors {
  const secondary = tint.secondary;
  const blend = tint.secondaryBlend ?? 0;
  if (!secondary || blend <= 0) {
    return { moss: paletteColors.moss, lichen: paletteColors.lichen };
  }
  return {
    moss: mixColor(paletteColors.moss, secondary.moss, blend),
    lichen: mixColor(paletteColors.lichen, secondary.lichen, blend),
  };
}

/** Resolve only the stone material colour. Biological growth is shader-applied. */
export function colorizeStoneVertices(
  tones: Float32Array,
  wears: Float32Array,
  paletteColors: StonePalette,
  tint: StoneTintParams,
  target: Float32Array,
  targetOffset = 0,
): void {
  const secondary = tint.secondary;
  const blend = tint.secondaryBlend ?? 0;
  for (let index = 0; index < tones.length; index += 1) {
    let [r, g, b] = sampleRamp(paletteColors, tones[index]);
    let edgeR = paletteColors.edge.r;
    let edgeG = paletteColors.edge.g;
    let edgeB = paletteColors.edge.b;
    let edgeStrength = paletteColors.edgeStrength;
    if (secondary && blend > 0) {
      const [r2, g2, b2] = sampleRamp(secondary, tones[index]);
      r = mixChannel(r, r2, blend);
      g = mixChannel(g, g2, blend);
      b = mixChannel(b, b2, blend);
      edgeR = mixChannel(edgeR, secondary.edge.r, blend);
      edgeG = mixChannel(edgeG, secondary.edge.g, blend);
      edgeB = mixChannel(edgeB, secondary.edge.b, blend);
      edgeStrength = mixChannel(edgeStrength, secondary.edgeStrength, blend);
    }

    const wear = wears[index] * edgeStrength;
    if (wear > 0) {
      r = mixChannel(r, edgeR, wear);
      g = mixChannel(g, edgeG, wear);
      b = mixChannel(b, edgeB, wear);
    }

    const offset = targetOffset + index * 3;
    target[offset] = r * tint.valueScale;
    target[offset + 1] = g * tint.valueScale;
    target[offset + 2] = b * tint.valueScale;
  }
}
