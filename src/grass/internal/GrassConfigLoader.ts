import type { GrassConfig } from "../GrassConfig";

const CONFIG_URL = "./config/grass.yaml";

interface ParsedConfig {
  [key: string]: string;
}

export class GrassConfigLoader {
  async load(url: string = CONFIG_URL): Promise<GrassConfig> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Unable to load grass config from ${url}: HTTP ${response.status}`,
      );
    }

    return this.parse(await response.text());
  }

  private parse(source: string): GrassConfig {
    const values = this.parseFlatYaml(source);

    return Object.freeze({
      modelPath: this.readString(values, "modelPath"),
      geometryName: this.readString(values, "geometryName"),
      instanceCount: this.readPositiveInteger(values, "instanceCount"),
      geometryScale: this.readPositiveNumber(values, "geometryScale"),
      patchSize: this.readPositiveNumber(values, "patchSize"),
      alphaTexturePath: this.readString(values, "alphaTexturePath"),
      noiseTexturePath: this.readString(values, "noiseTexturePath"),
      lod: Object.freeze({
        nearMaxDistance: this.readPositiveNumber(values, "nearMaxDistance"),
        midMaxDistance: this.readPositiveNumber(values, "midMaxDistance"),
        farMaxDistance: this.readPositiveNumber(values, "farMaxDistance"),
      }),
    });
  }

  private parseFlatYaml(source: string): ParsedConfig {
    const values: ParsedConfig = {};

    for (const [index, rawLine] of source.split(/\r?\n/).entries()) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf(":");
      if (separatorIndex <= 0) {
        throw new Error(`Invalid grass config at line ${index + 1}.`);
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
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
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }

    return value;
  }

  private readString(values: ParsedConfig, key: string): string {
    const value = values[key];
    if (!value) {
      throw new Error(`Missing grass config value: ${key}.`);
    }

    return value;
  }

  private readPositiveInteger(values: ParsedConfig, key: string): number {
    const value = this.readPositiveNumber(values, key);
    if (!Number.isInteger(value)) {
      throw new Error(`Grass config value ${key} must be an integer.`);
    }

    return value;
  }

  private readPositiveNumber(values: ParsedConfig, key: string): number {
    const rawValue = this.readString(values, key);
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`Grass config value ${key} must be a positive number.`);
    }

    return value;
  }
}
