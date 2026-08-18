import type { RuntimeCloudConfig } from "../../runtime/RuntimeConfig";

export const WORLD_CLOUD_TIME_WRAP_SECONDS = 86_400;

const FBM_ROTATION_COS = 0.8;
const FBM_ROTATION_SIN = 0.6;
const FBM_FREQUENCY = 2.02;
const WEATHER_COVERAGE_SWING = 0.11;
const WEATHER_CLEAR_THRESHOLD = 0.28;
const WEATHER_OVERCAST_THRESHOLD = 0.78;

export function sampleCloudDirectTransmittance(
  config: Readonly<RuntimeCloudConfig>,
  compact: boolean,
  worldX: number,
  worldZ: number,
  timeSeconds: number,
): number {
  if (!config.enabled) {
    return 1;
  }
  const density = sampleCloudDensity(
    config,
    compact,
    worldX,
    worldZ,
    timeSeconds,
  );
  return Math.max(
    config.minimumDirectTransmittance,
    1 - density * config.shadowStrength,
  );
}

function sampleCloudDensity(
  config: Readonly<RuntimeCloudConfig>,
  compact: boolean,
  worldX: number,
  worldZ: number,
  timeSeconds: number,
): number {
  const macroX = worldX + config.windX * timeSeconds;
  const macroZ = worldZ + config.windZ * timeSeconds;
  const detailX = worldX + config.detailWindX * timeSeconds;
  const detailZ = worldZ + config.detailWindZ * timeSeconds;
  const macroScale = config.macroScale;
  const macro = fbm(
    macroX * macroScale,
    macroZ * macroScale,
    compact ? 2 : 3,
  );
  const warp = valueNoise(
    macroX * macroScale * 2.35 + 17.13,
    macroZ * macroScale * 2.35 - 9.71,
  );
  const detail = valueNoise(
    detailX * config.detailScale + 41.7,
    detailZ * config.detailScale - 26.4,
  );
  const weather = valueNoise(
    macroX * config.weatherScale - 73.1,
    macroZ * config.weatherScale + 52.8,
  );
  const weatherCoverage = smoothstep(
    WEATHER_CLEAR_THRESHOLD,
    WEATHER_OVERCAST_THRESHOLD,
    weather,
  );
  const threshold =
    config.coverage + (0.5 - weatherCoverage) * WEATHER_COVERAGE_SWING;
  const field = macro + (warp - 0.5) * 0.2 + (detail - 0.5) * 0.1;
  return smoothstep(
    threshold - config.softness,
    threshold + config.softness,
    field,
  );
}

function fbm(x: number, y: number, octaves: 2 | 3): number {
  let px = x;
  let py = y;
  let amplitude = 0.5;
  let total = 0;
  let weight = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    total += valueNoise(px, py) * amplitude;
    weight += amplitude;
    const rotatedX =
      (px * FBM_ROTATION_COS - py * FBM_ROTATION_SIN) * FBM_FREQUENCY;
    const rotatedY =
      (px * FBM_ROTATION_SIN + py * FBM_ROTATION_COS) * FBM_FREQUENCY;
    px = rotatedX + 11.7;
    py = rotatedY - 7.3;
    amplitude *= 0.5;
  }
  return weight > 0 ? total / weight : 0;
}

function valueNoise(x: number, y: number): number {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const localX = fract(x);
  const localY = fract(y);
  const blendX = localX * localX * (3 - 2 * localX);
  const blendY = localY * localY * (3 - 2 * localY);
  const a = hash12(cellX, cellY);
  const b = hash12(cellX + 1, cellY);
  const c = hash12(cellX, cellY + 1);
  const d = hash12(cellX + 1, cellY + 1);
  return mix(mix(a, b, blendX), mix(c, d, blendX), blendY);
}

function hash12(x: number, y: number): number {
  let px = fract(x * 0.1031);
  let py = fract(y * 0.1031);
  let pz = fract(x * 0.1031);
  const dot =
    px * (py + 33.33) + py * (pz + 33.33) + pz * (px + 33.33);
  px += dot;
  py += dot;
  pz += dot;
  return fract((px + py) * pz);
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1;
  }
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function fract(value: number): number {
  return value - Math.floor(value);
}
