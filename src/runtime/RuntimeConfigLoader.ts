import type { RuntimeConfig, RuntimeTierConfig } from "./RuntimeConfig";

const CONFIG_URL = "./config/runtime.yaml";

interface ParsedConfig {
  [key: string]: string;
}

export class RuntimeConfigLoader {
  async load(url: string = CONFIG_URL): Promise<RuntimeConfig> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Unable to load runtime config from ${url}: HTTP ${response.status}`,
      );
    }

    return this.parse(await response.text());
  }

  private parse(source: string): RuntimeConfig {
    const values = this.parseFlatYaml(source);
    return Object.freeze({
      compactMaxWidth: this.readPositiveNumber(values, "compactMaxWidth"),
      desktop: Object.freeze(this.readTier(values, "desktop")),
      compact: Object.freeze(this.readTier(values, "compact")),
    });
  }

  private readTier(
    values: ParsedConfig,
    prefix: "desktop" | "compact",
  ): RuntimeTierConfig {
    return {
      cameraFov: this.readRange(values, `${prefix}CameraFov`, 30, 90),
      cameraMargin: this.readRange(values, `${prefix}CameraMargin`, 1, 3),
      cameraElevation: this.readRange(
        values,
        `${prefix}CameraElevation`,
        0.1,
        3,
      ),
      maxPixelRatio: this.readRange(
        values,
        `${prefix}MaxPixelRatio`,
        0.5,
        3,
      ),
      autoRotate: this.readBoolean(values, `${prefix}AutoRotate`),
      shadows: this.readBoolean(values, `${prefix}Shadows`),
      shadowMapSize: this.readPowerOfTwo(values, `${prefix}ShadowMapSize`),
      showGui: this.readBoolean(values, `${prefix}ShowGui`),
      showDecorativeText: this.readBoolean(
        values,
        `${prefix}ShowDecorativeText`,
      ),
    };
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
        throw new Error(`Invalid runtime config at line ${index + 1}.`);
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

  private readBoolean(values: ParsedConfig, key: string): boolean {
    const value = this.readString(values, key).toLowerCase();
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    throw new Error(`Runtime config value ${key} must be true or false.`);
  }

  private readPowerOfTwo(values: ParsedConfig, key: string): number {
    const value = this.readPositiveInteger(values, key);
    if ((value & (value - 1)) !== 0) {
      throw new Error(`Runtime config value ${key} must be a power of two.`);
    }
    return value;
  }

  private readPositiveInteger(values: ParsedConfig, key: string): number {
    const value = this.readPositiveNumber(values, key);
    if (!Number.isInteger(value)) {
      throw new Error(`Runtime config value ${key} must be an integer.`);
    }
    return value;
  }

  private readPositiveNumber(values: ParsedConfig, key: string): number {
    const value = this.readNumber(values, key);
    if (value <= 0) {
      throw new Error(`Runtime config value ${key} must be positive.`);
    }
    return value;
  }

  private readRange(
    values: ParsedConfig,
    key: string,
    minimum: number,
    maximum: number,
  ): number {
    const value = this.readNumber(values, key);
    if (value < minimum || value > maximum) {
      throw new Error(
        `Runtime config value ${key} must be between ${minimum} and ${maximum}.`,
      );
    }
    return value;
  }

  private readNumber(values: ParsedConfig, key: string): number {
    const value = Number(this.readString(values, key));
    if (!Number.isFinite(value)) {
      throw new Error(`Runtime config value ${key} must be a number.`);
    }
    return value;
  }

  private readString(values: ParsedConfig, key: string): string {
    const value = values[key];
    if (!value) {
      throw new Error(`Missing runtime config value: ${key}.`);
    }
    return value;
  }
}
