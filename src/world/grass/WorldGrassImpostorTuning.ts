export const IMPOSTOR_ALPHA_CUTOFF = 0.18;
// Camera-facing grass cards only read as grass close to the horizon. Fading
// them before a top-down view exposes their rectangular footprint avoids the
// tiled aerial ring while the real mid mesh covers the foreground.
export const IMPOSTOR_AERIAL_FADE_START = 0.12;
export const IMPOSTOR_AERIAL_FADE_END = 0.28;
export const IMPOSTOR_BASE_COLOR_BLEND = 0.74;
export const IMPOSTOR_ROOT_LIGHT_MIN = 0.88;
export const IMPOSTOR_ROOT_LIGHT_MAX = 1.01;
