import type { StonePlaneRole } from "./StoneClipper";

export const STONE_SNAP_EPSILON = 1e-3;
export const STONE_MESH_QUANTIZE = 5e-4;
export const STONE_DEGENERATE_NORMAL_LENGTH = 1e-12;
export const STONE_CONTACT_SHADE_FLOOR = 0.62;
export const STONE_CONTACT_SHADE_HEIGHT = 0.22;
export const STONE_MOSS_CLIMB = 0.42;
export const STONE_MOSS_PATCH_SIZE = 0.26;
export const STONE_WEAR_ANGLE_START = 0.32;
export const STONE_WEAR_ANGLE_FULL = 0.85;
export const STONE_INDENTATION_MINIMUM_AREA = 0.035;

export const STONE_ROLE_TONE: Readonly<Record<StonePlaneRole, number>> = {
  top: 0.95,
  "top-bevel": 0.78,
  side: 0.46,
  cut: 0.6,
  "contact-bevel": 0.26,
  "edge-bevel": 0.7,
  bottom: 0.06,
};
