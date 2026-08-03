import { FlatConfig } from "../../config/FlatConfig";
import type { GrassConfig } from "../GrassConfig";

const CONFIG_URL = "./config/grass.yaml";

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
    const values = FlatConfig.parse(source, "grass");
    const config: GrassConfig = {
      instanceCount: this.readPositiveInteger(values, "instanceCount"),
      patchSize: this.readPositiveNumber(values, "patchSize"),
      geometry: {
        variantCount: this.readPositiveInteger(values, "variantCount"),
        bladesPerClump: this.readPositiveInteger(values, "bladesPerClump"),
        bladeSegments: this.readPositiveInteger(values, "bladeSegments"),
        clumpRadius: this.readPositiveNumber(values, "clumpRadius"),
        bladeHeightMin: this.readPositiveNumber(values, "bladeHeightMin"),
        bladeHeightMax: this.readPositiveNumber(values, "bladeHeightMax"),
        bladeWidthMin: this.readPositiveNumber(values, "bladeWidthMin"),
        bladeWidthMax: this.readPositiveNumber(values, "bladeWidthMax"),
        bladeLeanMin: this.readNonNegativeNumber(values, "bladeLeanMin"),
        bladeLeanMax: this.readNonNegativeNumber(values, "bladeLeanMax"),
        midBladesPerClump: this.readPositiveInteger(
          values,
          "midBladesPerClump",
        ),
        midBladeSegments: this.readPositiveInteger(values, "midBladeSegments"),
        midRadiusScale: this.readPositiveNumber(values, "midRadiusScale"),
        midHeightScale: this.readPositiveNumber(values, "midHeightScale"),
        midWidthScale: this.readPositiveNumber(values, "midWidthScale"),
        midLeanScale: this.readNonNegativeNumber(values, "midLeanScale"),
      },
      distribution: {
        seed: this.readInteger(values, "seed"),
        rootSink: this.readNonNegativeNumber(values, "rootSink"),
        maxSlopeDegrees: this.readRange(values, "maxSlopeDegrees", 0, 89),
        heightVariation: this.readRange(values, "heightVariation", 0, 0.95),
        widthVariation: this.readRange(values, "widthVariation", 0, 0.95),
        densityMin: this.readRange(values, "densityMin", 0, 1),
        densityMax: this.readRange(values, "densityMax", 0, 1),
        densityScale: this.readPositiveNumber(values, "densityScale"),
      },
      wind: {
        directionX: this.readNumber(values, "windDirectionX"),
        directionZ: this.readNumber(values, "windDirectionZ"),
        strength: this.readNonNegativeNumber(values, "windStrength"),
        gustScale: this.readPositiveNumber(values, "gustScale"),
        gustSpeed: this.readNonNegativeNumber(values, "gustSpeed"),
        flutterStrength: this.readNonNegativeNumber(values, "flutterStrength"),
        flutterSpeed: this.readNonNegativeNumber(values, "flutterSpeed"),
      },
      material: {
        baseColor: values.read("baseColor"),
        tipColor: values.read("tipColor"),
        dryColor: values.read("dryColor"),
        rootDarkening: this.readRange(values, "rootDarkening", 0, 1),
        normalUp: this.readRange(values, "normalUp", 0, 1),
        ambientBoost: this.readRange(values, "ambientBoost", 0, 1),
        backlightStrength: this.readRange(values, "backlightStrength", 0, 1),
      },
      lod: {
        nearMaxDistance: this.readPositiveNumber(values, "nearMaxDistance"),
        midMaxDistance: this.readPositiveNumber(values, "midMaxDistance"),
        farMaxDistance: this.readPositiveNumber(values, "farMaxDistance"),
        hysteresisDistance: this.readNonNegativeNumber(
          values,
          "hysteresisDistance",
        ),
        transitionDistance: this.readPositiveNumber(
          values,
          "transitionDistance",
        ),
      },
      qa: {
        warmupSeconds: this.readNonNegativeNumber(values, "qaWarmupSeconds"),
        sampleSeconds: this.readPositiveNumber(values, "qaSampleSeconds"),
      },
      impostor: {
        viewsPerAxis: this.readPositiveInteger(
          values,
          "impostorViewsPerAxis",
        ),
        frameResolution: this.readPositiveInteger(
          values,
          "impostorFrameResolution",
        ),
        padding: this.readNonNegativeInteger(values, "impostorPadding"),
        cameraMargin: this.readPositiveNumber(values, "impostorCameraMargin"),
      },
    };

    values.assertFullyConsumed();
    this.validate(config);
    return Object.freeze({
      ...config,
      geometry: Object.freeze(config.geometry),
      distribution: Object.freeze(config.distribution),
      wind: Object.freeze(config.wind),
      material: Object.freeze(config.material),
      lod: Object.freeze(config.lod),
      qa: Object.freeze(config.qa),
      impostor: Object.freeze(config.impostor),
    });
  }

  private validate(config: GrassConfig): void {
    if (config.geometry.variantCount > config.instanceCount) {
      throw new Error("variantCount must not exceed instanceCount.");
    }
    if (config.geometry.bladesPerClump < 3) {
      throw new Error("bladesPerClump must be at least 3.");
    }
    if (config.geometry.bladeSegments < 2) {
      throw new Error("bladeSegments must be at least 2.");
    }
    if (config.geometry.midBladesPerClump < 2) {
      throw new Error("midBladesPerClump must be at least 2.");
    }
    if (config.geometry.midBladeSegments < 1) {
      throw new Error("midBladeSegments must be at least 1.");
    }
    if (config.geometry.midBladesPerClump >= config.geometry.bladesPerClump) {
      throw new Error("midBladesPerClump must be lower than bladesPerClump.");
    }
    if (config.geometry.midBladeSegments >= config.geometry.bladeSegments) {
      throw new Error("midBladeSegments must be lower than bladeSegments.");
    }
    if (config.geometry.bladeHeightMin > config.geometry.bladeHeightMax) {
      throw new Error(
        "bladeHeightMin must be less than or equal to bladeHeightMax.",
      );
    }
    if (config.geometry.bladeWidthMin > config.geometry.bladeWidthMax) {
      throw new Error(
        "bladeWidthMin must be less than or equal to bladeWidthMax.",
      );
    }
    if (config.geometry.bladeLeanMin > config.geometry.bladeLeanMax) {
      throw new Error(
        "bladeLeanMin must be less than or equal to bladeLeanMax.",
      );
    }
    if (config.distribution.densityMin > config.distribution.densityMax) {
      throw new Error("densityMin must be less than or equal to densityMax.");
    }
    if (
      config.lod.nearMaxDistance >= config.lod.midMaxDistance ||
      config.lod.midMaxDistance >= config.lod.farMaxDistance
    ) {
      throw new Error("Grass LOD distances must increase from near to far.");
    }
    if (config.lod.transitionDistance >= config.lod.nearMaxDistance) {
      throw new Error("transitionDistance must be lower than nearMaxDistance.");
    }
    if (
      config.lod.hysteresisDistance >=
      config.lod.nearMaxDistance - config.lod.transitionDistance
    ) {
      throw new Error("hysteresisDistance is too large for the near LOD band.");
    }
    if (
      Math.hypot(config.wind.directionX, config.wind.directionZ) <
      Number.EPSILON
    ) {
      throw new Error("Grass wind direction must not be zero.");
    }
    if (config.impostor.viewsPerAxis < 2) {
      throw new Error("impostorViewsPerAxis must be at least 2.");
    }
    if (config.impostor.viewsPerAxis > 16) {
      throw new Error("impostorViewsPerAxis must not exceed 16.");
    }
    if (config.impostor.frameResolution < 32) {
      throw new Error("impostorFrameResolution must be at least 32.");
    }
    const atlasSize =
      (config.impostor.frameResolution + config.impostor.padding * 2) *
      config.impostor.viewsPerAxis;
    if (atlasSize > 4096) {
      throw new Error("Impostor atlas size must not exceed 4096 pixels.");
    }
    if (config.impostor.cameraMargin < 1) {
      throw new Error("impostorCameraMargin must be at least 1.");
    }
  }

  private readInteger(values: FlatConfig, key: string): number {
    const value = this.readNumber(values, key);
    if (!Number.isInteger(value)) {
      throw new Error(`Grass config value ${key} must be an integer.`);
    }
    return value;
  }

  private readPositiveInteger(values: FlatConfig, key: string): number {
    const value = this.readPositiveNumber(values, key);
    if (!Number.isInteger(value)) {
      throw new Error(`Grass config value ${key} must be an integer.`);
    }
    return value;
  }

  private readNonNegativeInteger(values: FlatConfig, key: string): number {
    const value = this.readNonNegativeNumber(values, key);
    if (!Number.isInteger(value)) {
      throw new Error(`Grass config value ${key} must be an integer.`);
    }
    return value;
  }

  private readPositiveNumber(values: FlatConfig, key: string): number {
    const value = this.readNumber(values, key);
    if (value <= 0) {
      throw new Error(`Grass config value ${key} must be positive.`);
    }
    return value;
  }

  private readNonNegativeNumber(values: FlatConfig, key: string): number {
    const value = this.readNumber(values, key);
    if (value < 0) {
      throw new Error(`Grass config value ${key} must not be negative.`);
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
        `Grass config value ${key} must be between ${minimum} and ${maximum}.`,
      );
    }
    return value;
  }

  private readNumber(values: FlatConfig, key: string): number {
    const value = Number(values.read(key));
    if (!Number.isFinite(value)) {
      throw new Error(`Grass config value ${key} must be a number.`);
    }
    return value;
  }
}
