/**
 * Stone palettes and the tone→colour ramp.
 *
 * Stone paint and biological growth are resolved separately. The base mesh
 * keeps broad value bands while the shared stone shader applies moss and
 * lichen masks, so close-range colony breakup can reveal the original stone.
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

export const STONE_PALETTES = {
  meadowSage: palette(
    "meadow-sage",
    "#41483b",
    "#6d7661",
    "#98a486",
    "#c6cfaa",
    "#566f41",
    "#9da276",
    0.82,
  ),
  steppeTan: palette(
    "steppe-tan",
    "#51462f",
    "#807157",
    "#a99a78",
    "#d2c3a2",
    "#72764a",
    "#b4aa72",
    0.78,
  ),
  graniteGrey: palette(
    "granite-grey",
    "#41433f",
    "#676a63",
    "#8f9289",
    "#b9bcb3",
    "#586f47",
    "#a6ad8d",
    0.86,
  ),
  mossy: palette(
    "mossy",
    "#394337",
    "#5d6a54",
    "#839374",
    "#b2c09d",
    "#526d41",
    "#929d70",
    0.72,
  ),
} as const;

export type StonePaletteKey = keyof typeof STONE_PALETTES;

export interface StoneTintParams {
  readonly valueScale: number;
  readonly secondary?: StonePalette;
  readonly secondaryBlend?: number;
}

const RAMP_BANDING_STRENGTH = 0.62;

function mixChannel(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
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

/** Allocation-free stone material colour resolution for chunk-build hot paths. */
export function colorizeStoneVertices(
  tones: Float32Array,
  wears: Float32Array,
  paletteColors: StonePalette,
  tint: StoneTintParams,
  target: Float32Array | Uint8Array,
  targetOffset = 0,
  targetScale = 1,
  targetStride = 3,
): void {
  const secondary = tint.secondary;
  const blend = tint.secondaryBlend ?? 0;
  const hasSecondary = secondary !== undefined && blend > 0;
  const valueScale = tint.valueScale * targetScale;

  for (let index = 0; index < tones.length; index += 1) {
    const tone = tones[index];
    const quantized = Math.round(tone * 3) / 3;
    const banded = tone + (quantized - tone) * RAMP_BANDING_STRENGTH;

    let r: number;
    let g: number;
    let b: number;
    let r2 = 0;
    let g2 = 0;
    let b2 = 0;

    if (banded < 0.5) {
      const amount = banded * 2;
      r = mixChannel(paletteColors.shadow.r, paletteColors.mid.r, amount);
      g = mixChannel(paletteColors.shadow.g, paletteColors.mid.g, amount);
      b = mixChannel(paletteColors.shadow.b, paletteColors.mid.b, amount);
      if (hasSecondary) {
        r2 = mixChannel(secondary.shadow.r, secondary.mid.r, amount);
        g2 = mixChannel(secondary.shadow.g, secondary.mid.g, amount);
        b2 = mixChannel(secondary.shadow.b, secondary.mid.b, amount);
      }
    } else {
      const amount = (banded - 0.5) * 2;
      r = mixChannel(paletteColors.mid.r, paletteColors.light.r, amount);
      g = mixChannel(paletteColors.mid.g, paletteColors.light.g, amount);
      b = mixChannel(paletteColors.mid.b, paletteColors.light.b, amount);
      if (hasSecondary) {
        r2 = mixChannel(secondary.mid.r, secondary.light.r, amount);
        g2 = mixChannel(secondary.mid.g, secondary.light.g, amount);
        b2 = mixChannel(secondary.mid.b, secondary.light.b, amount);
      }
    }

    let edgeR = paletteColors.edge.r;
    let edgeG = paletteColors.edge.g;
    let edgeB = paletteColors.edge.b;
    let edgeStrength = paletteColors.edgeStrength;
    if (hasSecondary) {
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

    const offset = targetOffset + index * targetStride;
    target[offset] = r * valueScale;
    target[offset + 1] = g * valueScale;
    target[offset + 2] = b * valueScale;
  }
}
