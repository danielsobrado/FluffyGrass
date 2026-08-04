export const IMPOSTOR_ALPHA_CUTOFF = 0.16;
// Retained as color-matching thresholds. Coverage itself must stay independent
// of elevation so it remains complementary to the mid-blade distance fade.
// Semantic atlas recoloring already matches real blades. Keep only a subtle
// base bias for sub-pixel stability instead of flattening the tip gradient.
export const IMPOSTOR_BASE_COLOR_BLEND = 0;
export const IMPOSTOR_COLOR_SCALE = 1;
