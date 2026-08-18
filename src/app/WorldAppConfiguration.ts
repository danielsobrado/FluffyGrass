import type { WorldVisibilityConfig } from "../render/visibility/WorldVisibilityConfig";
import { WorldVisibilityConfigLoader } from "../render/visibility/WorldVisibilityConfigLoader";
import { APP_VERSION } from "../version";
import type { WorldConfig } from "../world/WorldConfig";
import { WorldConfigLoader } from "../world/WorldConfigLoader";

export interface WorldAppConfiguration {
  readonly params: URLSearchParams;
  readonly world: WorldConfig;
  readonly visibility: WorldVisibilityConfig;
}

export async function loadWorldAppConfiguration(): Promise<WorldAppConfiguration> {
  const params = new URLSearchParams(window.location.search);
  const version = encodeURIComponent(APP_VERSION);
  const [loadedWorld, visibility] = await Promise.all([
    new WorldConfigLoader().load(`./config/world.yaml?v=${version}`),
    new WorldVisibilityConfigLoader().load(`./config/visibility.yaml?v=${version}`),
  ]);
  const world =
    params.get("riverTuning") === "1"
      ? (await import("../dev/RiverDevelopmentConfig")).applyRiverDevelopmentConfig(
          loadedWorld,
        )
      : loadedWorld;
  return { params, world, visibility };
}
