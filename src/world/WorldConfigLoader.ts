import { FlatConfig } from "../config/FlatConfig";
import { FlatConfigValueReader } from "../config/FlatConfigValueReader";
import { validateSpawnConfig } from "./SpawnConfigValidator";
import type { WorldConfig } from "./WorldConfig";
import { WORLD_CONFIG_SCHEMA } from "./WorldConfigSchema";
import { validateWorldConfig } from "./WorldConfigValidator";
import { validateFaunaStreamingConfig } from "./scenic/FaunaConfigValidator";

const CONFIG_URL = "./config/world.yaml";

export class WorldConfigLoader {
  async load(url: string = CONFIG_URL): Promise<WorldConfig> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Unable to load world config from ${url}: HTTP ${response.status}.`,
      );
    }
    return this.parse(await response.text());
  }

  /** Parse and validate config source directly; the node verifiers use this. */
  parse(source: string): WorldConfig {
    const values = FlatConfig.parse(source, "world");
    const reader = new FlatConfigValueReader(values, "World");
    const config = {} as WorldConfig;

    for (const key of Object.keys(WORLD_CONFIG_SCHEMA) as (keyof WorldConfig)[]) {
      config[key] = reader.number(key, WORLD_CONFIG_SCHEMA[key]);
    }

    values.assertFullyConsumed();
    validateWorldConfig(config);
    validateSpawnConfig(config);
    validateFaunaStreamingConfig(config);
    return Object.freeze(config);
  }
}
