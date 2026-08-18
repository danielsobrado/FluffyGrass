import { fetchConfigText } from "../../config/ConfigTextLoader";
import { FlatConfig } from "../../config/FlatConfig";
import { FlatConfigValueReader } from "../../config/FlatConfigValueReader";
import type { WorldVisibilityConfig } from "./WorldVisibilityConfig";
import { WORLD_VISIBILITY_CONFIG_SCHEMA } from "./WorldVisibilityConfigSchema";

const CONFIG_URL = "./config/visibility.yaml";

export class WorldVisibilityConfigLoader {
  async load(url: string = CONFIG_URL): Promise<WorldVisibilityConfig> {
    return this.parse(await fetchConfigText(url, "world visibility config"));
  }

  parse(source: string): WorldVisibilityConfig {
    const values = FlatConfig.parse(source, "world visibility");
    const reader = new FlatConfigValueReader(values, "World visibility");
    const config = {} as WorldVisibilityConfig;

    for (const key of Object.keys(
      WORLD_VISIBILITY_CONFIG_SCHEMA,
    ) as (keyof WorldVisibilityConfig)[]) {
      config[key] = reader.number(key, WORLD_VISIBILITY_CONFIG_SCHEMA[key]);
    }

    values.assertFullyConsumed();
    if (config.terrainOcclusionRayCount % 2 === 0) {
      throw new Error("terrainOcclusionRayCount must be odd so one ray stays centered.");
    }
    return Object.freeze(config);
  }
}
