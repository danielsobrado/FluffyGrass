import * as THREE from "three";
import type { WorldConfig } from "./WorldConfig";

const COLOR_GRASS = new THREE.Color("#557a43");
const COLOR_DRY_GRASS = new THREE.Color("#71845a");
const COLOR_ROCK = new THREE.Color("#696b64");
const COLOR_HIGH_ROCK = new THREE.Color("#85857f");
const COLOR_DIRT = new THREE.Color("#6b5d45");
const COLOR_SCRATCH = new THREE.Color();

export class TerrainField {
  constructor(private readonly config: WorldConfig) {}

  sampleHeight(x: number, z: number): number {
    const broad = this.fbm(
      x * this.config.mountainScale,
      z * this.config.mountainScale,
      4,
      this.config.seed,
    );
    const warpedX =
      x +
      (this.valueNoise(
        x * this.config.mountainScale * 0.55,
        z * this.config.mountainScale * 0.55,
        this.config.seed + 17,
      ) -
        0.5) *
        210;
    const warpedZ =
      z +
      (this.valueNoise(
        x * this.config.mountainScale * 0.55,
        z * this.config.mountainScale * 0.55,
        this.config.seed + 29,
      ) -
        0.5) *
        210;
    const ridgeNoise = this.fbm(
      warpedX * this.config.mountainScale * 1.7,
      warpedZ * this.config.mountainScale * 1.7,
      5,
      this.config.seed + 101,
    );
    const ridges = Math.pow(1 - Math.abs(ridgeNoise * 2 - 1), 2.35);
    const mountainMask = THREE.MathUtils.smoothstep(broad, 0.48, 0.86);
    const rolling =
      (this.fbm(
        x * this.config.detailScale,
        z * this.config.detailScale,
        5,
        this.config.seed + 211,
      ) -
        0.5) *
      this.config.rollingHeight;
    const micro =
      (this.fbm(
        x * this.config.detailScale * 3.1,
        z * this.config.detailScale * 3.1,
        3,
        this.config.seed + 307,
      ) -
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
    const step = 1.5;
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
    const slopeLimit = Math.cos(
      THREE.MathUtils.degToRad(this.config.grassMaxSlopeDegrees),
    );
    const slopeMask = THREE.MathUtils.smoothstep(normal.y, slopeLimit, 0.94);
    const lowAltitude = THREE.MathUtils.smoothstep(
      height,
      this.config.grassMinAltitude,
      this.config.grassMinAltitude + 12,
    );
    const highAltitude =
      1 -
      THREE.MathUtils.smoothstep(
        height,
        this.config.grassMaxAltitude - 28,
        this.config.grassMaxAltitude,
      );
    const moisture = this.fbm(
      x * 0.0042,
      z * 0.0042,
      4,
      this.config.seed + 401,
    );
    const clearings = this.fbm(
      x * 0.011,
      z * 0.011,
      3,
      this.config.seed + 509,
    );
    const moistureMask = THREE.MathUtils.smoothstep(moisture, 0.28, 0.76);
    const clearingMask = THREE.MathUtils.smoothstep(clearings, 0.34, 0.58);
    const exposedRidge =
      1 -
      THREE.MathUtils.smoothstep(
        this.valueNoise(x * 0.002, z * 0.002, this.config.seed + 613),
        0.68,
        0.88,
      );

    return THREE.MathUtils.clamp(
      slopeMask *
        lowAltitude *
        highAltitude *
        moistureMask *
        clearingMask *
        exposedRidge,
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
    const altitude = THREE.MathUtils.smoothstep(
      height,
      this.config.grassMaxAltitude - 35,
      this.config.grassMaxAltitude + 50,
    );
    const dry = this.valueNoise(x * 0.006, z * 0.006, this.config.seed + 701);
    target.copy(COLOR_GRASS).lerp(COLOR_DRY_GRASS, dry * 0.55);
    target.lerp(COLOR_DIRT, 1 - grassSuitability);
    const rockAmount = Math.max(
      THREE.MathUtils.smoothstep(steepness, 0.12, 0.42),
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
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(a, b, sx),
      THREE.MathUtils.lerp(c, d, sx),
      sz,
    );
  }

  private hash(x: number, z: number, seed: number): number {
    let value = Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
  }
}
