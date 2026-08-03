import type { WorldConfig } from "./WorldConfig";

const CONFIG_URL = "./config/world.yaml";

interface NumberRule {
  minimum?: number;
  maximum?: number;
  integer?: boolean;
}

type ParsedValues = Record<string, string>;
type ConfigSchema = { [Key in keyof WorldConfig]: NumberRule };

const POSITIVE = Object.freeze({ minimum: Number.EPSILON });
const NON_NEGATIVE = Object.freeze({ minimum: 0 });
const POSITIVE_INTEGER = Object.freeze({ minimum: 1, integer: true });

const CONFIG_SCHEMA: ConfigSchema = {
  seed: { integer: true },
  worldSize: POSITIVE,
  chunkSize: POSITIVE,
  terrainRadiusDesktop: POSITIVE_INTEGER,
  terrainRadiusCompact: POSITIVE_INTEGER,
  grassRadiusDesktop: POSITIVE_INTEGER,
  grassRadiusCompact: POSITIVE_INTEGER,
  terrainNearResolution: { minimum: 3, integer: true },
  terrainMidResolution: { minimum: 3, integer: true },
  terrainFarResolution: { minimum: 3, integer: true },
  terrainChunksPerFrame: POSITIVE_INTEGER,
  grassChunksPerFrame: POSITIVE_INTEGER,
  grassPatchSize: POSITIVE,
  grassBladesPerSquareMeterDesktop: { minimum: 4, maximum: 160 },
  grassBladesPerSquareMeterCompact: { minimum: 4, maximum: 160 },
  grassMidBladeFraction: { minimum: 0.05, maximum: 0.8 },
  grassUnderlayerFraction: { minimum: 0, maximum: 0.6 },
  grassPatchJitter: { minimum: 0, maximum: 0.9 },
  spawnSearchRadius: POSITIVE,
  spawnSearchStep: POSITIVE,
  spawnNeighborhoodRadius: POSITIVE,
  spawnEyeHeight: POSITIVE,
  spawnPitchDegrees: { minimum: -45, maximum: 15 },
  baseHeight: {},
  rollingHeight: NON_NEGATIVE,
  mountainHeight: NON_NEGATIVE,
  mountainScale: POSITIVE,
  detailScale: POSITIVE,
  grassMinAltitude: {},
  grassMaxAltitude: {},
  grassMaxSlopeDegrees: { minimum: 1, maximum: 89 },
  grassNearDistance: POSITIVE,
  grassMidDistance: POSITIVE,
  grassFarDistance: POSITIVE,
  grassTransitionDistance: POSITIVE,
  grassHysteresisDistance: NON_NEGATIVE,
  flySpeed: POSITIVE,
  flyBoostMultiplier: POSITIVE,
  flyMinSpeed: POSITIVE,
  flyMaxSpeed: POSITIVE,
  initialAltitude: POSITIVE,
  initialDistance: POSITIVE,
  characterScale: POSITIVE,
  characterWalkSpeed: POSITIVE,
  characterRunSpeed: POSITIVE,
  characterAcceleration: POSITIVE,
  characterDeceleration: POSITIVE,
  characterTurnRate: POSITIVE,
  characterCameraDistance: POSITIVE,
  characterCameraMinDistance: POSITIVE,
  characterCameraMaxDistance: POSITIVE,
  characterCameraLookHeight: POSITIVE,
  characterCameraElevationDegrees: { minimum: -80, maximum: 80 },
  characterCameraMinElevationDegrees: { minimum: -80, maximum: 80 },
  characterCameraMaxElevationDegrees: { minimum: -80, maximum: 80 },
  characterCameraFollowRate: POSITIVE,
  characterCameraGroundClearance: POSITIVE,
  characterMouseLookSensitivity: POSITIVE,
  characterTouchLookSensitivity: POSITIVE,
  characterZoomSensitivity: POSITIVE,
};

export class WorldConfigLoader {
  async load(url: string = CONFIG_URL): Promise<WorldConfig> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Unable to load world config from ${url}: HTTP ${response.status}.`,
      );
    }

    const values = this.parse(await response.text());
    const config = {} as WorldConfig;
    for (const key of Object.keys(CONFIG_SCHEMA) as (keyof WorldConfig)[]) {
      config[key] = this.readNumber(values, key, CONFIG_SCHEMA[key]);
    }

    this.validate(config);
    return Object.freeze(config);
  }

  private validate(config: WorldConfig): void {
    const worldChunks = config.worldSize / config.chunkSize;
    if (worldChunks < 8) {
      throw new Error("worldSize must contain at least eight terrain chunks.");
    }
    if (!Number.isInteger(worldChunks) || worldChunks % 2 !== 0) {
      throw new Error(
        "worldSize must contain an even whole number of terrain chunks.",
      );
    }
    if (!Number.isInteger(config.chunkSize / config.grassPatchSize)) {
      throw new Error("chunkSize must be divisible by grassPatchSize.");
    }
    if (
      config.terrainNearResolution <= config.terrainMidResolution ||
      config.terrainMidResolution <= config.terrainFarResolution
    ) {
      throw new Error("Terrain resolutions must decrease from near to far.");
    }
    const nearCells = config.terrainNearResolution - 1;
    const midCells = config.terrainMidResolution - 1;
    const farCells = config.terrainFarResolution - 1;
    if (nearCells % midCells !== 0 || midCells % farCells !== 0) {
      throw new Error(
        "Terrain LOD cell counts must divide evenly to preserve chunk edges.",
      );
    }
    if (config.grassMinAltitude >= config.grassMaxAltitude) {
      throw new Error("grassMinAltitude must be lower than grassMaxAltitude.");
    }
    if (
      config.grassNearDistance >= config.grassMidDistance ||
      config.grassMidDistance >= config.grassFarDistance
    ) {
      throw new Error("Grass LOD distances must increase from near to far.");
    }
    if (
      config.flyMinSpeed > config.flySpeed ||
      config.flySpeed > config.flyMaxSpeed
    ) {
      throw new Error("flySpeed must be between flyMinSpeed and flyMaxSpeed.");
    }
    if (config.spawnSearchStep > config.spawnSearchRadius) {
      throw new Error("spawnSearchStep must not exceed spawnSearchRadius.");
    }
    if (config.spawnNeighborhoodRadius >= config.chunkSize * 0.5) {
      throw new Error(
        "spawnNeighborhoodRadius must be lower than half a chunk.",
      );
    }
    if (
      config.spawnSearchRadius >
      config.worldSize * 0.5 - config.chunkSize
    ) {
      throw new Error("spawnSearchRadius must remain inside the world bounds.");
    }
    if (
      config.grassBladesPerSquareMeterCompact >
      config.grassBladesPerSquareMeterDesktop
    ) {
      throw new Error(
        "Compact grass blade density must not exceed desktop density.",
      );
    }
    if (config.characterWalkSpeed >= config.characterRunSpeed) {
      throw new Error(
        "characterWalkSpeed must be lower than characterRunSpeed.",
      );
    }
    if (
      config.characterCameraMinDistance > config.characterCameraDistance ||
      config.characterCameraDistance > config.characterCameraMaxDistance
    ) {
      throw new Error(
        "characterCameraDistance must be between its minimum and maximum.",
      );
    }
    if (
      config.characterCameraMinElevationDegrees >=
        config.characterCameraElevationDegrees ||
      config.characterCameraElevationDegrees >=
        config.characterCameraMaxElevationDegrees
    ) {
      throw new Error(
        "Character camera elevation must be between its minimum and maximum.",
      );
    }
  }

  private parse(source: string): ParsedValues {
    const values: ParsedValues = {};
    for (const [index, rawLine] of source.split(/\r?\n/).entries()) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }
      const separator = line.indexOf(":");
      if (separator <= 0) {
        throw new Error(`Invalid world config at line ${index + 1}.`);
      }
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      if (!value) {
        throw new Error(`Missing value for ${key} at line ${index + 1}.`);
      }
      values[key] = this.stripQuotes(value);
    }
    return values;
  }

  private readNumber(
    values: ParsedValues,
    key: keyof WorldConfig,
    rule: NumberRule,
  ): number {
    const rawValue = values[key];
    if (rawValue === undefined) {
      throw new Error(`Missing world config value: ${key}.`);
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      throw new Error(`World config value ${key} must be a number.`);
    }
    if (rule.integer && !Number.isInteger(value)) {
      throw new Error(`World config value ${key} must be an integer.`);
    }
    if (rule.minimum !== undefined && value < rule.minimum) {
      throw new Error(
        `World config value ${key} must be at least ${rule.minimum}.`,
      );
    }
    if (rule.maximum !== undefined && value > rule.maximum) {
      throw new Error(
        `World config value ${key} must be at most ${rule.maximum}.`,
      );
    }
    return value;
  }

  private stripQuotes(value: string): string {
    const first = value[0];
    const last = value[value.length - 1];
    return (first === '"' && last === '"') || (first === "'" && last === "'")
      ? value.slice(1, -1)
      : value;
  }
}
