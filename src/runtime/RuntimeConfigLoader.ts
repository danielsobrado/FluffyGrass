import { FlatConfig } from "../config/FlatConfig";
import type { RuntimeConfig, RuntimeTierConfig } from "./RuntimeConfig";

const CONFIG_URL = "./config/runtime.yaml";

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
    const values = FlatConfig.parse(source, "runtime");
    const config = Object.freeze({
      compactMaxWidth: this.readPositiveNumber(values, "compactMaxWidth"),
      desktop: Object.freeze(this.readTier(values, "desktop")),
      compact: Object.freeze(this.readTier(values, "compact")),
    });
    values.assertFullyConsumed();
    return config;
  }

  private readTier(
    values: FlatConfig,
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

  private readBoolean(values: FlatConfig, key: string): boolean {
    const value = values.read(key).toLowerCase();
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    throw new Error(`Runtime config value ${key} must be true or false.`);
  }

  private readPowerOfTwo(values: FlatConfig, key: string): number {
    const value = this.readPositiveInteger(values, key);
    if ((value & (value - 1)) !== 0) {
      throw new Error(`Runtime config value ${key} must be a power of two.`);
    }
    return value;
  }

  private readPositiveInteger(values: FlatConfig, key: string): number {
    const value = this.readPositiveNumber(values, key);
    if (!Number.isInteger(value)) {
      throw new Error(`Runtime config value ${key} must be an integer.`);
    }
    return value;
  }

  private readPositiveNumber(values: FlatConfig, key: string): number {
    const value = this.readNumber(values, key);
    if (value <= 0) {
      throw new Error(`Runtime config value ${key} must be positive.`);
    }
    return value;
  }

  private readRange(
    values: FlatConfig,
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

  private readNumber(values: FlatConfig, key: string): number {
    const value = Number(values.read(key));
    if (!Number.isFinite(value)) {
      throw new Error(`Runtime config value ${key} must be a number.`);
    }
    return value;
  }
}
