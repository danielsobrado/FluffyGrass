import * as THREE from "three";

export const TERRAIN_SURFACE_NOISE_SIZE = 256;
const BYTE_MAX = 255;
const TWO_PI = Math.PI * 2;

function hash(x: number, y: number, seed: number): number {
  let value = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function wrap(value: number, period: number): number {
  return ((value % period) + period) % period;
}

/** Periodic value noise, so every generated channel tiles without a seam. */
function periodicValueNoise(
  x: number,
  y: number,
  cells: number,
  seed: number,
): number {
  const scaledX = (x / TERRAIN_SURFACE_NOISE_SIZE) * cells;
  const scaledY = (y / TERRAIN_SURFACE_NOISE_SIZE) * cells;
  const cellX = Math.floor(scaledX);
  const cellY = Math.floor(scaledY);
  const fractionX = scaledX - cellX;
  const fractionY = scaledY - cellY;
  const weightX = fractionX * fractionX * (3 - 2 * fractionX);
  const weightY = fractionY * fractionY * (3 - 2 * fractionY);
  const x0 = wrap(cellX, cells);
  const x1 = wrap(cellX + 1, cells);
  const y0 = wrap(cellY, cells);
  const y1 = wrap(cellY + 1, cells);
  const lower = THREE.MathUtils.lerp(
    hash(x0, y0, seed),
    hash(x1, y0, seed),
    weightX,
  );
  const upper = THREE.MathUtils.lerp(
    hash(x0, y1, seed),
    hash(x1, y1, seed),
    weightX,
  );
  return THREE.MathUtils.lerp(lower, upper, weightY);
}

function fract(value: number): number {
  return value - Math.floor(value);
}

/** Writes one normalized RGBA sample and is periodic on both texture axes. */
export function sampleTerrainSurfaceNoisePixel(
  x: number,
  y: number,
  seed: number,
  target: Float64Array,
): void {
  const broad =
    periodicValueNoise(x, y, 2, seed + 11) * 0.68 +
    periodicValueNoise(x, y, 5, seed + 13) * 0.32;
  const meso =
    periodicValueNoise(x, y, 12, seed + 17) * 0.72 +
    periodicValueNoise(x, y, 27, seed + 19) * 0.28;
  const wrappedX = wrap(x, TERRAIN_SURFACE_NOISE_SIZE);
  const wrappedY = wrap(y, TERRAIN_SURFACE_NOISE_SIZE);
  const fine =
    periodicValueNoise(x, y, 48, seed + 23) * 0.62 +
    hash(wrappedX, wrappedY, seed + 29) * 0.38;
  const fibreCarrier = periodicValueNoise(x, y, 19, seed + 31);
  // Integer cycle counts make the directional carrier exactly periodic at
  // both edges. Arbitrary coefficients here produce a visible repeat seam.
  const fibrePhase =
    TWO_PI *
    ((x * 29) / TERRAIN_SURFACE_NOISE_SIZE +
      (y * 7) / TERRAIN_SURFACE_NOISE_SIZE);
  const fibre =
    0.5 +
    Math.sin(fibrePhase + fibreCarrier * 8.5) * 0.27 +
    (fract(fibreCarrier * 5.7) - 0.5) * 0.23;

  target[0] = THREE.MathUtils.clamp(broad, 0, 1);
  target[1] = THREE.MathUtils.clamp(meso, 0, 1);
  target[2] = THREE.MathUtils.clamp(fine, 0, 1);
  target[3] = THREE.MathUtils.clamp(fibre, 0, 1);
}

/**
 * A deterministic, seamless RGBA field generated once at startup.
 *
 * R carries broad patches, G meso variation, B fine soil grain, and A an
 * anisotropic organic/fibre pattern. Sampling those channels at rotated and
 * scaled world coordinates supplies the whole terrain surface without an
 * authored texture asset or a stack of per-fragment FBM octaves.
 */
export function createTerrainSurfaceNoiseTexture(seed: number): THREE.DataTexture {
  const data = new Uint8Array(
    TERRAIN_SURFACE_NOISE_SIZE * TERRAIN_SURFACE_NOISE_SIZE * 4,
  );
  const channels = new Float64Array(4);
  for (let y = 0; y < TERRAIN_SURFACE_NOISE_SIZE; y += 1) {
    for (let x = 0; x < TERRAIN_SURFACE_NOISE_SIZE; x += 1) {
      sampleTerrainSurfaceNoisePixel(x, y, seed, channels);
      const offset = (y * TERRAIN_SURFACE_NOISE_SIZE + x) * 4;
      data[offset] = Math.round(channels[0] * BYTE_MAX);
      data[offset + 1] = Math.round(channels[1] * BYTE_MAX);
      data[offset + 2] = Math.round(channels[2] * BYTE_MAX);
      data[offset + 3] = Math.round(channels[3] * BYTE_MAX);
    }
  }

  const texture = new THREE.DataTexture(
    data,
    TERRAIN_SURFACE_NOISE_SIZE,
    TERRAIN_SURFACE_NOISE_SIZE,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.name = "world-terrain-surface-noise";
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
