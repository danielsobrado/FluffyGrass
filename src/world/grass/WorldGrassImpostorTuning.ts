export const IMPOSTOR_ALPHA_CUTOFF = 0.16;
// Camera-facing grass cards only read as grass close to the horizon. Fading
// them before a top-down view exposes their rectangular footprint avoids the
// tiled aerial ring while the real mid mesh covers the foreground.
export const IMPOSTOR_AERIAL_FADE_START = 0.12;
export const IMPOSTOR_AERIAL_FADE_END = 0.28;
// Preserve most of the baked blade variation. A high base-color blend turns
// the far atlas into a flat green card and creates a material seam against the
// real mid blades. The lower blend keeps silhouettes and root-to-tip contrast,
// while the color scale holds the average luminance near the mid LOD.
export const IMPOSTOR_BASE_COLOR_BLEND = 0.38;
export const IMPOSTOR_COLOR_SCALE = 0.7;
export const IMPOSTOR_ROOT_LIGHT_MIN = 0.88;
export const IMPOSTOR_ROOT_LIGHT_MAX = 1.01;
