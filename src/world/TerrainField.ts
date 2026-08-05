import * as THREE from "three";
import type { WorldConfig } from "./WorldConfig";

const COLOR_GRASS = new THREE.Color("#466f3a");
const COLOR_DRY_GRASS = new THREE.Color("#66794f");
const COLOR_ROCK = new THREE.Color("#696b64");
const COLOR_HIGH_ROCK = new THREE.Color("#85857f");
const COLOR_DIRT = new THREE.Color("#665b45");
const COLOR_SCRATCH = new THREE.Color();

/**
 * Central-difference step for {@link TerrainField.sampleNormal}. Exported so a
 * cache reproducing the normal can use the identical step; the two disagree
 * silently otherwise.
 */
export const TERRAIN_NORMAL_STEP = 1.5;

// These helpers mirror THREE.MathUtils exactly, but keep the procedural field's
// innermost loops free of repeated namespace lookups and function indirection.
// A single grass placement evaluates hundreds of interpolations while sampling
// height, normal, and suitability, so this is a meaningful streaming hot path.
function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function smoothstep(value: number, minimum: number, maximum: number): number {
  if (value <= minimum) {
    return 0;
  }
  if (value >= maximum) {
    return 1;
  }
  const amount = (value - minimum) / (maximum - minimum);
  return amount * amount * (3 - 2 * amount);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export class TerrainField {
  private readonly grassSlopeLimit: number;
  private readonly grassSlopeFadeEnd: number;
  private noisePairLow = 0;
  private noisePairHigh = 0;

  constructor(private readonly config: WorldConfig) {
    this.grassSlopeLimit = Math.cos(
      THREE.MathUtils.degToRad(config.grassMaxSlopeDegrees),
    );
    this.grassSlopeFadeEnd = Math.min(0.98, this.grassSlopeLimit + 0.2);
  }

  sampleHeight(x: number, z: number): number {
    // Hoisted: this runs 19 value-noise evaluations deep and the config reads
    // sit between calls the optimizer cannot see through.
    const mountainScale = this.config.mountainScale;
    const detailScale = this.config.detailScale;
    const seed = this.config.seed;

    const broad = this.fbm(x * mountainScale, z * mountainScale, 4, seed);
    // Both warp axes read the same lattice cell and differ only by seed, so the
    // floor and smoothstep setup is shared instead of being done twice.
    const warpX = x * mountainScale * 0.55;
    const warpZ = z * mountainScale * 0.55;
    this.valueNoisePair(warpX, warpZ, seed + 17, seed + 29);
    const warpedX = x + (this.noisePairLow - 0.5) * 210;
    const warpedZ = z + (this.noisePairHigh - 0.5) * 210;
    const ridgeNoise = this.fbm(
      warpedX * mountainScale * 1.7,
      warpedZ * mountainScale * 1.7,
      5,
      seed + 101,
    );
    const ridges = Math.pow(1 - Math.abs(ridgeNoise * 2 - 1), 2.35);
    const mountainMask = smoothstep(broad, 0.48, 0.86);
    const rolling =
      (this.fbm(x * detailScale, z * detailScale, 5, seed + 211) - 0.5) *
      this.config.rollingHeight;
    const micro =
      (this.fbm(x * detailScale * 3.1, z * detailScale * 3.1, 3, seed + 307) -
        0.5) *
      3.5;

    return (
      this.config.baseHeight +
      rolling +
      micro +
      ridges * mountainMask * this.config.mountainHeight
    );
  }

  sampleNormal(x: number, z: number, target: THREE.Vector3): THREE.Vector3 {
    const step = TERRAIN_NORMAL_STEP;
    const left = this.sampleHeight(x - step, z);
    const right = this.sampleHeight(x + step, z);
    const down = this.sampleHeight(x, z - step);
    const up = this.sampleHeight(x, z + step);
    return target.set(left - right, step * 2, down - up).normalize();
  }

  sampleGrassSuitability(
    x: number,
    z: number,
    height: number,
    normal: THREE.Vector3,
  ): number {
    return (
      this.sampleGrassSlopeMask(normal) *
      this.sampleGrassSuitabilityWithoutSlope(x, z, height)
    );
  }

  /**
   * The slope factor of {@link sampleGrassSuitability}, split out because it is
   * the only one that needs a normal — and the normal costs four extra height
   * samples, roughly three quarters of the work of placing a blade.
   */
  sampleGrassSlopeMask(normal: THREE.Vector3): number {
    return smoothstep(
      normal.y,
      this.grassSlopeLimit,
      this.grassSlopeFadeEnd,
    );
  }

  /**
   * Every suitability factor except the slope mask.
   *
   * Suitability is a product of masks that are each in [0,1], so this value is
   * an upper bound on the final result: a caller whose acceptance threshold is
   * already missed here can reject before sampling a normal at all, and get
   * exactly the same answer it would have got the long way round.
   */
  sampleGrassSuitabilityWithoutSlope(
    x: number,
    z: number,
    height: number,
  ): number {
    const lowAltitude = smoothstep(
      height,
      this.config.grassMinAltitude,
      this.config.grassMinAltitude + 12,
    );
    const highAltitude =
      1 -
      smoothstep(
        height,
        this.config.grassMaxAltitude - 28,
        this.config.grassMaxAltitude,
      );

    // Broad biome noise creates coherent grasslands and coherent bare regions.
    const biome = this.fbm(
      x * 0.0017,
      z * 0.0017,
      4,
      this.config.seed + 401,
    );
    const biomeMask = smoothstep(biome, 0.34, 0.5);

    // Fine noise changes density inside a field without breaking it into tufts.
    const densityNoise = this.fbm(
      x * 0.0065,
      z * 0.0065,
      3,
      this.config.seed + 509,
    );
    const localDensity = lerp(
      0.78,
      1,
      smoothstep(densityNoise, 0.22, 0.78),
    );

    const exposedRidge = this.valueNoise(
      x * 0.002,
      z * 0.002,
      this.config.seed + 613,
    );
    const ridgeMask =
      1 - smoothstep(exposedRidge, 0.74, 0.92) * 0.7;

    return clamp(
      lowAltitude * highAltitude * biomeMask * localDensity * ridgeMask,
      0,
      1,
    );
  }

  sampleColor(
    x: number,
    z: number,
    height: number,
    normal: THREE.Vector3,
    grassSuitability: number,
    target: THREE.Color,
  ): THREE.Color {
    const steepness = 1 - normal.y;
    const altitude = smoothstep(
      height,
      this.config.grassMaxAltitude - 35,
      this.config.grassMaxAltitude + 50,
    );
    const dry = this.valueNoise(x * 0.006, z * 0.006, this.config.seed + 701);
    target.copy(COLOR_GRASS).lerp(COLOR_DRY_GRASS, dry * 0.42);
    target.lerp(COLOR_DIRT, 1 - grassSuitability);
    const rockAmount = Math.max(
      smoothstep(steepness, 0.12, 0.42),
      altitude,
    );
    COLOR_SCRATCH.copy(COLOR_ROCK).lerp(COLOR_HIGH_ROCK, altitude);
    return target.lerp(COLOR_SCRATCH, rockAmount);
  }

  private fbm(
    x: number,
    z: number,
    octaves: number,
    seed: number,
  ): number {
    let amplitude = 0.5;
    let frequency = 1;
    let value = 0;
    let normalization = 0;

    for (let octave = 0; octave < octaves; octave += 1) {
      value +=
        this.valueNoise(x * frequency, z * frequency, seed + octave * 1013) *
        amplitude;
      normalization += amplitude;
      amplitude *= 0.5;
      frequency *= 2.03;
    }

    return value / normalization;
  }

  /**
   * Two seeds sampled at one point, writing {@link noisePairLow} and
   * {@link noisePairHigh}. Only the hashes differ between the two, so the cell
   * coordinates and both smoothstep weights are computed once. Results go to
   * fields rather than a returned tuple to keep the streaming path allocation
   * free.
   */
  private valueNoisePair(
    x: number,
    z: number,
    seedLow: number,
    seedHigh: number,
  ): void {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const x1 = x0 + 1;
    const z1 = z0 + 1;
    const tx = x - x0;
    const tz = z - z0;
    const sx = tx * tx * (3 - 2 * tx);
    const sz = tz * tz * (3 - 2 * tz);

    const lowA = this.hash(x0, z0, seedLow);
    const lowB = this.hash(x1, z0, seedLow);
    const lowC = this.hash(x0, z1, seedLow);
    const lowD = this.hash(x1, z1, seedLow);
    const lowLower = lowA + (lowB - lowA) * sx;
    const lowUpper = lowC + (lowD - lowC) * sx;
    this.noisePairLow = lowLower + (lowUpper - lowLower) * sz;

    const highA = this.hash(x0, z0, seedHigh);
    const highB = this.hash(x1, z0, seedHigh);
    const highC = this.hash(x0, z1, seedHigh);
    const highD = this.hash(x1, z1, seedHigh);
    const highLower = highA + (highB - highA) * sx;
    const highUpper = highC + (highD - highC) * sx;
    this.noisePairHigh = highLower + (highUpper - highLower) * sz;
  }

  private valueNoise(x: number, z: number, seed: number): number {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const tx = x - x0;
    const tz = z - z0;
    const sx = tx * tx * (3 - 2 * tx);
    const sz = tz * tz * (3 - 2 * tz);
    const a = this.hash(x0, z0, seed);
    const b = this.hash(x0 + 1, z0, seed);
    const c = this.hash(x0, z0 + 1, seed);
    const d = this.hash(x0 + 1, z0 + 1, seed);
    // Inline the three bilinear interpolations: valueNoise is called hundreds
    // of times for each accepted grass patch, so even tiny call overhead is
    // amplified during streaming.
    const lower = a + (b - a) * sx;
    const upper = c + (d - c) * sx;
    return lower + (upper - lower) * sz;
  }

  private hash(x: number, z: number, seed: number): number {
    let value = Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
  }
}
