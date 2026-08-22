/**
 * Stone palettes and the tone→colour ramp.
 *
 * Stone paint and biological growth are resolved separately. The base mesh
 * keeps broad value variation while the shared stone shader applies moss and
 * lichen masks, so close-range colony breakup can reveal the original stone.
 */

import { STONE_CONTACT_OCCLUSION } from "./StoneContactOcclusion";
import { STONE_BOUNCE_STRENGTH } from "./StoneGeometryTuning";

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
  /**
   * The two ends of weathering — bleached sun crust and iron-and-soil stain —
   * plus the warm dark that fills the cracks.
   */
  readonly crust: StoneLinearColor;
  readonly stain: StoneLinearColor;
  readonly cavity: StoneLinearColor;
  /** How readily this rock loses its staining. Damp families keep theirs. */
  readonly crustStrength: number;
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
  crust: string,
  stain: string,
  cavity: string,
  crustStrength: number,
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
    crust: linearFromHex(crust),
    stain: linearFromHex(stain),
    cavity: linearFromHex(cavity),
    crustStrength,
  };
}

/**
 * Warm mineral ramps calibrated under the world's Neutral tone mapping and
 * exposure. Direct sun supplies the bright cream highlight; the albedo itself
 * stays below chalk-white so exposed meadow stones retain beige/brown identity.
 */
export const STONE_PALETTES = {
  meadowSage: palette(
    "meadow-sage",
    "#464238",
    "#655d4f",
    "#887b67",
    "#9a8b74",
    "#536942",
    "#928f6d",
    0.6,
    "#a49881",
    "#684832",
    "#2b211a",
    0.5,
  ),
  steppeTan: palette(
    "steppe-tan",
    "#4b3e2d",
    "#6e5b45",
    "#90765d",
    "#a0886c",
    "#6c7048",
    "#aaa06b",
    0.6,
    "#ab9477",
    "#6b4932",
    "#30231b",
    0.6,
  ),
  graniteGrey: palette(
    "granite-grey",
    "#44413c",
    "#5d574f",
    "#797067",
    "#8d8276",
    "#536844",
    "#969779",
    0.64,
    "#988d80",
    "#604936",
    "#2b2521",
    0.52,
  ),
  mossy: palette(
    "mossy",
    "#3c4036",
    "#565b4b",
    "#70745f",
    "#878975",
    "#50683f",
    "#878f69",
    0.54,
    "#918b78",
    "#584431",
    "#251f19",
    0.4,
  ),
} as const;

export type StonePaletteKey = keyof typeof STONE_PALETTES;

export interface StoneTintParams {
  readonly valueScale: number;
  readonly secondary?: StonePalette;
  readonly secondaryBlend?: number;
}

/**
 * Light thrown back onto the lower body by the surrounding turf. It is one
 * colour for every palette because it belongs to the field, not to the rock.
 */
const TURF_BOUNCE = linearFromHex("#61763f");

/**
 * Only a trace of value stepping remains. Shape separation now comes from broad
 * facets and coherent mineral regions; stronger quantization redraws unwanted
 * horizontal contour bands across otherwise continuous faces.
 */
const RAMP_BANDING_STRENGTH = 0.08;

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
  bounces: Float32Array,
  weatherings: Float32Array,
  cavities: Float32Array,
  contacts: Float32Array | undefined,
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
    let crustR = paletteColors.crust.r;
    let crustG = paletteColors.crust.g;
    let crustB = paletteColors.crust.b;
    let crustStrength = paletteColors.crustStrength;
    let stainR = paletteColors.stain.r;
    let stainG = paletteColors.stain.g;
    let stainB = paletteColors.stain.b;
    let cavityR = paletteColors.cavity.r;
    let cavityG = paletteColors.cavity.g;
    let cavityB = paletteColors.cavity.b;
    if (hasSecondary) {
      crustR = mixChannel(crustR, secondary.crust.r, blend);
      crustG = mixChannel(crustG, secondary.crust.g, blend);
      crustB = mixChannel(crustB, secondary.crust.b, blend);
      crustStrength = mixChannel(crustStrength, secondary.crustStrength, blend);
      stainR = mixChannel(stainR, secondary.stain.r, blend);
      stainG = mixChannel(stainG, secondary.stain.g, blend);
      stainB = mixChannel(stainB, secondary.stain.b, blend);
      cavityR = mixChannel(cavityR, secondary.cavity.r, blend);
      cavityG = mixChannel(cavityG, secondary.cavity.g, blend);
      cavityB = mixChannel(cavityB, secondary.cavity.b, blend);
      r = mixChannel(r, r2, blend);
      g = mixChannel(g, g2, blend);
      b = mixChannel(b, b2, blend);
      edgeR = mixChannel(edgeR, secondary.edge.r, blend);
      edgeG = mixChannel(edgeG, secondary.edge.g, blend);
      edgeB = mixChannel(edgeB, secondary.edge.b, blend);
      edgeStrength = mixChannel(edgeStrength, secondary.edgeStrength, blend);
    }

    const weathering = (weatherings[index] - 0.5) * 2 * crustStrength;
    if (weathering > 0) {
      r = mixChannel(r, crustR, weathering);
      g = mixChannel(g, crustG, weathering);
      b = mixChannel(b, crustB, weathering);
    } else if (weathering < 0) {
      const stain = -weathering;
      r = mixChannel(r, stainR, stain);
      g = mixChannel(g, stainG, stain);
      b = mixChannel(b, stainB, stain);
    }

    const cavity = cavities[index];
    if (cavity > 0) {
      r = mixChannel(r, cavityR, cavity);
      g = mixChannel(g, cavityG, cavity);
      b = mixChannel(b, cavityB, cavity);
    }

    const wear = wears[index] * edgeStrength;
    if (wear > 0) {
      r = mixChannel(r, edgeR, wear);
      g = mixChannel(g, edgeG, wear);
      b = mixChannel(b, edgeB, wear);
    }

    const bounce = bounces[index] * STONE_BOUNCE_STRENGTH;
    if (bounce > 0) {
      r = mixChannel(r, TURF_BOUNCE.r, bounce);
      g = mixChannel(g, TURF_BOUNCE.g, bounce);
      b = mixChannel(b, TURF_BOUNCE.b, bounce);
    }

    const contact = contacts ? contacts[index] * STONE_CONTACT_OCCLUSION : 0;
    if (contact > 0) {
      r = mixChannel(r, cavityR, contact);
      g = mixChannel(g, cavityG, contact);
      b = mixChannel(b, cavityB, contact);
    }

    const offset = targetOffset + index * targetStride;
    target[offset] = r * valueScale;
    target[offset + 1] = g * valueScale;
    target[offset + 2] = b * valueScale;
  }
}
