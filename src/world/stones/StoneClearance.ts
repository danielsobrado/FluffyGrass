import type { WorldConfig } from "../WorldConfig";
import { StoneClearanceCache } from "./StoneClearanceCache";
import type { StoneField } from "./StoneField";

let activeField: StoneField | undefined;
let activeCache: StoneClearanceCache | undefined;

/** Register the deterministic stone field used by grass placement. */
export function setStoneClearanceField(
  field: StoneField | undefined,
  config?: WorldConfig,
): void {
  activeCache?.clear();
  activeField = field;
  activeCache = field && config ? new StoneClearanceCache(field, config) : undefined;
}

/**
 * How much grass survives stones at (x, z): 1 clear, 0 under a footprint.
 * Scenes that register config use the amortized neighborhood cache; isolated
 * probes that only register a field retain the exact direct sampler.
 */
export function sampleStoneGrassClearance(
  x: number,
  z: number,
  extraRadius = 0,
): number {
  if (activeCache) return activeCache.sample(x, z, extraRadius);
  return activeField ? activeField.sampleGrassClearance(x, z, extraRadius) : 1;
}
