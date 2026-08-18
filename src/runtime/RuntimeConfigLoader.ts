import { fetchConfigText } from "../config/ConfigTextLoader";
import { FlatConfig } from "../config/FlatConfig";
import {
  FlatConfigValueReader,
  POSITIVE_NUMBER_RULE,
} from "../config/FlatConfigValueReader";
import type {
  RuntimeCloudConfig,
  RuntimeConfig,
  RuntimeTierConfig,
} from "./RuntimeConfig";

const CONFIG_URL = "./config/runtime.yaml";
const MAX_SHADOW_MAP_SIZE = 16384;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export class RuntimeConfigLoader {
  async load(url: string = CONFIG_URL): Promise<RuntimeConfig> {
    return this.parse(await fetchConfigText(url, "runtime config"));
  }

  private parse(source: string): RuntimeConfig {
    const values = FlatConfig.parse(source, "runtime");
    const reader = new FlatConfigValueReader(values, "Runtime");
    const config = Object.freeze({
      compactMaxWidth: reader.number("compactMaxWidth", POSITIVE_NUMBER_RULE),
      desktop: Object.freeze(this.readTier(reader, "desktop")),
      compact: Object.freeze(this.readTier(reader, "compact")),
    });
    values.assertFullyConsumed();
    return config;
  }

  private readTier(
    reader: FlatConfigValueReader,
    prefix: "desktop" | "compact",
  ): RuntimeTierConfig {
    return {
      cameraFov: reader.number(`${prefix}CameraFov`, {
        minimum: 30,
        maximum: 90,
      }),
      cameraMargin: reader.number(`${prefix}CameraMargin`, {
        minimum: 1,
        maximum: 3,
      }),
      cameraElevation: reader.number(`${prefix}CameraElevation`, {
        minimum: 0.1,
        maximum: 3,
      }),
      maxPixelRatio: reader.number(`${prefix}MaxPixelRatio`, {
        minimum: 0.5,
        maximum: 3,
      }),
      autoRotate: reader.boolean(`${prefix}AutoRotate`),
      shadows: reader.boolean(`${prefix}Shadows`),
      shadowMapSize: this.readShadowMapSize(reader, prefix),
      showGui: reader.boolean(`${prefix}ShowGui`),
      showDecorativeText: reader.boolean(`${prefix}ShowDecorativeText`),
      cloud: Object.freeze(this.readCloud(reader, prefix)),
    };
  }

  private readCloud(
    reader: FlatConfigValueReader,
    prefix: "desktop" | "compact",
  ): RuntimeCloudConfig {
    const key = (suffix: string): string => `${prefix}Cloud${suffix}`;
    return {
      enabled: reader.boolean(key("Enabled")),
      coverage: reader.number(key("Coverage"), { minimum: 0, maximum: 1 }),
      softness: reader.number(key("Softness"), {
        exclusiveMinimum: 0,
        maximum: 0.35,
      }),
      opacity: reader.number(key("Opacity"), { minimum: 0, maximum: 1 }),
      baseHeight: reader.number(key("BaseHeight"), {
        minimum: 100,
        maximum: 3000,
      }),
      thickness: reader.number(key("Thickness"), {
        minimum: 40,
        maximum: 600,
      }),
      extinction: reader.number(key("Extinction"), {
        exclusiveMinimum: 0,
        maximum: 4,
      }),
      macroScale: reader.number(key("MacroScale"), {
        exclusiveMinimum: 0,
        maximum: 0.02,
      }),
      detailScale: reader.number(key("DetailScale"), {
        exclusiveMinimum: 0,
        maximum: 0.05,
      }),
      weatherScale: reader.number(key("WeatherScale"), {
        exclusiveMinimum: 0,
        maximum: 0.01,
      }),
      windX: reader.number(key("WindX"), { minimum: -100, maximum: 100 }),
      windZ: reader.number(key("WindZ"), { minimum: -100, maximum: 100 }),
      detailWindX: reader.number(key("DetailWindX"), {
        minimum: -100,
        maximum: 100,
      }),
      detailWindZ: reader.number(key("DetailWindZ"), {
        minimum: -100,
        maximum: 100,
      }),
      selfShadowStrength: reader.number(key("SelfShadowStrength"), {
        minimum: 0,
        maximum: 1,
      }),
      silverLiningStrength: reader.number(key("SilverLiningStrength"), {
        minimum: 0,
        maximum: 3,
      }),
      shadowStrength: reader.number(key("ShadowStrength"), {
        minimum: 0,
        maximum: 0.35,
      }),
      shadowSampleRadius: reader.number(key("ShadowSampleRadius"), {
        minimum: 0,
        maximum: 100,
      }),
      minimumDirectTransmittance: reader.number(
        key("MinimumDirectTransmittance"),
        { minimum: 0.65, maximum: 1 },
      ),
      lightResponseRate: reader.number(key("LightResponseRate"), {
        exclusiveMinimum: 0,
        maximum: 5,
      }),
      weatherGradeStrength: reader.number(key("WeatherGradeStrength"), {
        minimum: 0,
        maximum: 1,
      }),
      volumetricEnabled: reader.boolean(key("VolumetricEnabled")),
      volumetricResolutionScale: reader.number(key("VolumetricResolutionScale"), {
        minimum: 0.2,
        maximum: 0.75,
      }),
      volumetricSteps: reader.number(key("VolumetricSteps"), {
        minimum: 4,
        maximum: 12,
        integer: true,
      }),
      temporalBlend: reader.number(key("TemporalBlend"), {
        minimum: 0,
        maximum: 0.98,
      }),
      godRays: reader.boolean(key("GodRays")),
      godRayStrength: reader.number(key("GodRayStrength"), {
        minimum: 0,
        maximum: 0.5,
      }),
      ambientColor: this.readColor(reader, key("AmbientColor")),
      shadowColor: this.readColor(reader, key("ShadowColor")),
      sunlitColor: this.readColor(reader, key("SunlitColor")),
    };
  }

  private readShadowMapSize(
    reader: FlatConfigValueReader,
    prefix: "desktop" | "compact",
  ): number {
    const key = `${prefix}ShadowMapSize`;
    const size = reader.powerOfTwo(key);
    if (size > MAX_SHADOW_MAP_SIZE) {
      throw new Error(
        `Runtime config value ${key} must be at most ${MAX_SHADOW_MAP_SIZE}.`,
      );
    }
    return size;
  }

  private readColor(reader: FlatConfigValueReader, key: string): string {
    const value = reader.string(key);
    if (!HEX_COLOR.test(value)) {
      throw new Error(
        `Runtime config value ${key} must be a six-digit hexadecimal color.`,
      );
    }
    return value;
  }
}
