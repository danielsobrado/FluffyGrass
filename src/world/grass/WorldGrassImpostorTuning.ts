export const IMPOSTOR_ALPHA_CUTOFF = 0.16;
// Retained as color-matching thresholds. Coverage itself must stay independent
// of elevation so it remains complementary to the mid-blade distance fade.
export const IMPOSTOR_AERIAL_FADE_START = 0.12;
export const IMPOSTOR_AERIAL_FADE_END = 0.28;
// Pull the atlas toward the healthy base green while preserving enough baked
// blade contrast to read as grass. This removes the warm/yellow far-field cast.
export const IMPOSTOR_BASE_COLOR_BLEND = 0.68;
export const IMPOSTOR_COLOR_SCALE = 0.7;
export const IMPOSTOR_ROOT_LIGHT_MIN = 0.88;
export const IMPOSTOR_ROOT_LIGHT_MAX = 1.01;
