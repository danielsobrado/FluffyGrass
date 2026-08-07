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
  edgeStrength: number,
): StonePalette {
  return {
    key,
    shadow: linearFromHex(shadow),
    mid: linearFromHex(mid),
    light: linearFromHex(light),
    edge: linearFromHex(edge),
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
    "#5d6353",
    "#8b9179",
    "#b4b99e",
    "#e3e8cc",
    0.9,
  ),
  /** Dry steppe: warm tan and umber. */
  steppeTan: palette(
    "steppe-tan",
    "#6b5f48",
    "#98896b",
    "#c1b191",
    "#ecdfc0",
    0.85,
  ),
  /** Alpine and high altitude: cool granite grey. */
  graniteGrey: palette(
    "granite-grey",
    "#54564f",
    "#7d7f77",
    "#a6a79e",
    "#d8d9cf",
    0.95,
  ),
  /** Deep-shade mossy variant used for occasional lowland accents. */
  mossy: palette(
    "mossy",
    "#525e48",
    "#788768",
    "#a3b287",
    "#d2e0ae",
    0.8,
  ),
} as const;

export type StonePaletteKey = keyof typeof STONE_PALETTES;

export interface StoneTintParams {
  /** Multiplied into every ramp colour; 1 is neutral. */
  readonly valueScale: number;
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
