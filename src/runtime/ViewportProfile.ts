import type { RuntimeConfig, RuntimeProfile } from "./RuntimeConfig";

const COARSE_POINTER_QUERY = "(pointer: coarse)";

export function resolveRuntimeProfile(config: RuntimeConfig): RuntimeProfile {
  const compact =
    window.innerWidth <= config.compactMaxWidth ||
    window.matchMedia(COARSE_POINTER_QUERY).matches;
  const tier = compact ? config.compact : config.desktop;

  return Object.freeze({
    ...tier,
    compact,
  });
}
