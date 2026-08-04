// Mid geometry already retains every source blade. Keep far cards out of the
// mid band and crossfade them only at the mid-to-far boundary; this removes a
// full-screen layer of redundant overdraw without reducing blade density.
export const GRASS_MID_IMPOSTOR_UNDERFILL = 0;
export const GRASS_IMPOSTOR_FOOTPRINT_SCALE = 1.12;
export const GRASS_IMPOSTOR_MAX_HORIZONTAL_SCALE = 1.1;
export const GRASS_IMPOSTOR_MAX_VERTICAL_SCALE = 1.2;
export const GRASS_IMPOSTOR_MAX_WIND_DISPLACEMENT = 0.06;
export const GRASS_IMPOSTOR_BOUNDS_SAFETY_MARGIN = 0.15;
