import type { WorldConfig } from "./WorldConfig";

const CONFIG_URL = "./config/world.yaml";

type ParsedValues = Record<string, string>;

export class WorldConfigLoader {
  async load(url: string = CONFIG_URL): Promise<WorldConfig> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unable to load world config from ${url}: HTTP ${response.status}.`);
    }

    const values = this.parse(await response.text());
    const config: WorldConfig = {
      seed: this.integer(values, "seed"),
      worldSize: this.positive(values, "worldSize"),
      chunkSize: this.positive(values, "chunkSize"),
      terrainRadiusDesktop: this.positiveInteger(values, "terrainRadiusDesktop"),
      terrainRadiusCompact: this.positiveInteger(values, "terrainRadiusCompact"),
      grassRadiusDesktop: this.positiveInteger(values, "grassRadiusDesktop"),
      grassRadiusCompact: this.positiveInteger(values, "grassRadiusCompact"),
      terrainNearResolution: this.resolution(values, "terrainNearResolution"),
      terrainMidResolution: this.resolution(values, "terrainMidResolution"),
      terrainFarResolution: this.resolution(values, "terrainFarResolution"),
      terrainChunksPerFrame: this.positiveInteger(values, "terrainChunksPerFrame"),
      grassChunksPerFrame: this.positiveInteger(values, "grassChunksPerFrame"),
      grassClumpsPerSquareMeterDesktop: this.range(
        values,
        "grassClumpsPerSquareMeterDesktop",
        0.05,
        4,
      ),
      grassClumpsPerSquareMeterCompact: this.range(
        values,
        "grassClumpsPerSquareMeterCompact",
        0.05,
        4,
      ),
      spawnSearchRadius: this.positive(values, "spawnSearchRadius"),
      spawnSearchStep: this.positive(values, "spawnSearchStep"),
      spawnNeighborhoodRadius: this.positive(
        values,
        "spawnNeighborhoodRadius",
      ),
      spawnEyeHeight: this.positive(values, "spawnEyeHeight"),
      spawnPitchDegrees: this.range(values, "spawnPitchDegrees", -45, 15),
      baseHeight: this.number(values, "baseHeight"),
      rollingHeight: this.nonNegative(values, "rollingHeight"),
      mountainHeight: this.nonNegative(values, "mountainHeight"),
      mountainScale: this.positive(values, "mountainScale"),
      detailScale: this.positive(values, "detailScale"),
      grassMinAltitude: this.number(values, "grassMinAltitude"),
      grassMaxAltitude: this.number(values, "grassMaxAltitude"),
      grassMaxSlopeDegrees: this.range(values, "grassMaxSlopeDegrees", 1, 89),
      grassNearDistance: this.positive(values, "grassNearDistance"),
      grassMidDistance: this.positive(values, "grassMidDistance"),
      grassFarDistance: this.positive(values, "grassFarDistance"),
      grassTransitionDistance: this.positive(values, "grassTransitionDistance"),
      grassHysteresisDistance: this.nonNegative(
        values,
        "grassHysteresisDistance",
      ),
      flySpeed: this.positive(values, "flySpeed"),
      flyBoostMultiplier: this.positive(values, "flyBoostMultiplier"),
      flyMinSpeed: this.positive(values, "flyMinSpeed"),
      flyMaxSpeed: this.positive(values, "flyMaxSpeed"),
      initialAltitude: this.positive(values, "initialAltitude"),
      initialDistance: this.positive(values, "initialDistance"),
    };

    this.validate(config);
    return Object.freeze(config);
  }

  private validate(config: WorldConfig): void {
    if (config.worldSize / config.chunkSize < 8) {
      throw new Error("worldSize must contain at least eight terrain chunks.");
    }
    if (
      config.terrainNearResolution <= config.terrainMidResolution ||
      config.terrainMidResolution <= config.terrainFarResolution
    ) {
      throw new Error("Terrain resolutions must decrease from near to far.");
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
    if (config.flyMinSpeed > config.flySpeed || config.flySpeed > config.flyMaxSpeed) {
      throw new Error("flySpeed must be between flyMinSpeed and flyMaxSpeed.");
    }
    if (config.spawnSearchStep > config.spawnSearchRadius) {
      throw new Error("spawnSearchStep must not exceed spawnSearchRadius.");
    }
    if (config.spawnNeighborhoodRadius >= config.chunkSize * 0.5) {
      throw new Error("spawnNeighborhoodRadius must be lower than half a chunk.");
    }
    if (
      config.spawnSearchRadius >
      config.worldSize * 0.5 - config.chunkSize
    ) {
      throw new Error("spawnSearchRadius must remain inside the world bounds.");
    }
    if (
      config.grassClumpsPerSquareMeterCompact >
      config.grassClumpsPerSquareMeterDesktop
    ) {
      throw new Error(
        "Compact grass density must not exceed desktop grass density.",
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

  private stripQuotes(value: string): string {
    const first = value[0];
    const last = value[value.length - 1];
    return (first === '"' && last === '"') || (first === "'" && last === "'")
      ? value.slice(1, -1)
      : value;
  }

  private number(values: ParsedValues, key: string): number {
    const rawValue = values[key];
    if (rawValue === undefined) {
      throw new Error(`Missing world config value: ${key}.`);
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      throw new Error(`World config value ${key} must be a number.`);
    }
    return value;
  }

  private integer(values: ParsedValues, key: string): number {
    const value = this.number(values, key);
    if (!Number.isInteger(value)) {
      throw new Error(`World config value ${key} must be an integer.`);
    }
    return value;
  }

  private positive(values: ParsedValues, key: string): number {
    const value = this.number(values, key);
    if (value <= 0) {
      throw new Error(`World config value ${key} must be positive.`);
    }
    return value;
  }

  private positiveInteger(values: ParsedValues, key: string): number {
    const value = this.positive(values, key);
    if (!Number.isInteger(value)) {
      throw new Error(`World config value ${key} must be an integer.`);
    }
    return value;
  }

  private nonNegative(values: ParsedValues, key: string): number {
    const value = this.number(values, key);
    if (value < 0) {
      throw new Error(`World config value ${key} must not be negative.`);
    }
    return value;
  }

  private range(
    values: ParsedValues,
    key: string,
    minimum: number,
    maximum: number,
  ): number {
    const value = this.number(values, key);
    if (value < minimum || value > maximum) {
      throw new Error(
        `World config value ${key} must be between ${minimum} and ${maximum}.`,
      );
    }
    return value;
  }

  private resolution(values: ParsedValues, key: string): number {
    const value = this.positiveInteger(values, key);
    if (value < 3) {
      throw new Error(`World config value ${key} must be at least 3.`);
    }
    return value;
  }
}
