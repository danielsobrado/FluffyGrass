import * as THREE from "three";
import { WORLD_SUN_DIRECTION } from "../../app/WorldEnvironmentTuning";

export const WATER_MATERIAL_CACHE_KEY = "world-water-hydrology-v9";
export const WATER_BED_MATERIAL_CACHE_KEY = "world-water-bed-v2";
export const WATER_VISIBLE_COVERAGE_THRESHOLD = 0.012;
export const WATER_FLOW_NOISE_SEED_SALT = 0x6c8e9cf5;
export const WATER_BED_NOISE_SEED_SALT = 0x3b1f7a2d;
export const WATER_SHALLOW_COLOR = new THREE.Color("#55949d");
export const WATER_DEEP_COLOR = new THREE.Color("#244f63");
export const WATER_REFLECTION_COLOR = new THREE.Color("#a8cad5");
export const WATER_FOAM_COLOR = new THREE.Color("#d8e7df");
export const WATER_SPECULAR_COLOR = new THREE.Color("#e4f4f5");
export const WATER_PEBBLE_DARK_COLOR = new THREE.Color("#5d5647");
export const WATER_PEBBLE_LIGHT_COLOR = new THREE.Color("#cdc5b0");
export const WATER_SAND_COLOR = new THREE.Color("#6a6150");
export const WATER_ALGAE_COLOR = new THREE.Color("#41682c");
/** In-scatter hue for the Beer-Lambert optical-depth model. */
export const WATER_ABSORPTION_COLOR = new THREE.Color("#6c9c8e");
export const WATER_IOR = 1.333;
export const WATER_F0 = ((WATER_IOR - 1) / (WATER_IOR + 1)) ** 2;
export const WATER_SUN_DIRECTION = new THREE.Vector3(
  ...WORLD_SUN_DIRECTION,
).normalize();
/** Compact profiles keep identity but drop micro glint/caustic/wake energy. */
export const WATER_COMPACT_DETAIL_SCALE = 0.55;
