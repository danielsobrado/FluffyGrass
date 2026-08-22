import * as THREE from "three";

/**
 * The curve that maps rendered light to screen.
 *
 * The largest single lever on whether this world reads as the stylized
 * reference or as a washed-out photograph, and it was previously an unremarked
 * default. ACES is a film curve: it exists to make bright, saturated colour
 * behave like film stock, which it does by desaturating highlights toward white
 * and pulling midtones down. That is the correct answer for a photographic
 * renderer and the wrong one here — every vivid green in the palette arrives on
 * screen as olive, and the tip colours the grass shader works hardest to
 * produce are exactly the values ACES flattens first.
 *
 * Khronos PBR Neutral was designed for the opposite goal: it holds hue and
 * saturation through the midtones and only rolls off near clipping. The
 * stylized palette survives it, which is the whole reason the palette exists.
 */
export const WORLD_TONE_MAPPING = THREE.NeutralToneMapping;

export const WORLD_DEFAULT_SKY = "#bfd9f2";
export const WORLD_DEFAULT_FOG = "#c2d6b8";
export const WORLD_DEFAULT_HEMISPHERE_SKY = "#bfd9f2";
export const WORLD_DEFAULT_HEMISPHERE_GROUND = "#7d8f5a";
export const WORLD_DEFAULT_SUN = "#fff2d8";
/**
 * Key and fill, set against each other rather than tuned in isolation.
 *
 * The reference look is a high-key sunlit meadow, and what makes it read that
 * way is not brightness — it is the *ratio*. A strong sun against a weak fill
 * gives cast shadows real weight, which is what lets a rock, a tuft, or a
 * character sit in the grass instead of hovering over it. Lifting both together
 * produces a bright picture with no shadows in it, which reads as overcast no
 * matter how high the numbers go.
 */
export const WORLD_DEFAULT_SUN_INTENSITY = 3.05;
export const WORLD_DEFAULT_HEMISPHERE_INTENSITY = 0.46;
export const WORLD_DEFAULT_DESKTOP_FOG_DENSITY = 0.0035;
export const WORLD_DEFAULT_COMPACT_FOG_DENSITY = 0.0042;
export const WORLD_DEFAULT_EXPOSURE = 1.28;
export const WORLD_OVERCAST_FOG = "#b9c8c7";
export const WORLD_OVERCAST_HEMISPHERE_SKY = "#b8c7d0";
export const WORLD_OVERCAST_HEMISPHERE_GROUND = "#728078";
export const WORLD_OVERCAST_SUN = "#f4f1ea";
export const WORLD_OVERCAST_FOG_DENSITY_SCALE = 1.08;
export const WORLD_OVERCAST_EXPOSURE_SCALE = 0.96;
export const WORLD_SKY_ZENITH = "#8ec0e8";
export const WORLD_SKY_HORIZON = "#d5e4c8";
export const WORLD_SKY_HAZE = "#c2d6b8";
export const WORLD_SKY_SUN = "#fff4d2";
export const WORLD_ZELDA_SKY = WORLD_DEFAULT_SKY;
export const WORLD_ZELDA_FOG = WORLD_DEFAULT_FOG;
export const WORLD_ZELDA_HEMISPHERE_GROUND = WORLD_DEFAULT_HEMISPHERE_GROUND;
export const WORLD_ZELDA_SUN = WORLD_DEFAULT_SUN;
export const WORLD_ZELDA_HEMISPHERE_INTENSITY = WORLD_DEFAULT_HEMISPHERE_INTENSITY;
export const WORLD_ZELDA_FOG_DENSITY = WORLD_DEFAULT_DESKTOP_FOG_DENSITY;
export const WORLD_ZELDA_EXPOSURE = WORLD_DEFAULT_EXPOSURE;
export const WORLD_SUN_SHADOW_DISTANCE = 200;
export const WORLD_SUN_SHADOW_HALF_EXTENT = 8;
export const WORLD_SUN_DIRECTION = [350, 500, 220] as const;
