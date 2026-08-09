import type { WorldConfig } from "../WorldConfig";
import { StoneClearanceCache } from "./StoneClearanceCache";
import type { StoneField } from "./StoneField";

export interface StoneClearanceRegistration {
  dispose(): void;
}

let activeField: StoneField | undefined;
let activeCache: StoneClearanceCache | undefined;
let activeOwner: symbol | undefined;

function applyStoneClearanceField(
  field: StoneField | undefined,
  config?: WorldConfig,
): void {
  activeCache?.clear();
  activeField = field;
  activeCache = field && config ? new StoneClearanceCache(field, config) : undefined;
}

/** Register the deterministic stone field used by grass placement. */
export function registerStoneClearanceField(
  field: StoneField | undefined,
  config?: WorldConfig,
): StoneClearanceRegistration {
  const owner = Symbol("stone-clearance-owner");
  activeOwner = owner;
  applyStoneClearanceField(field, config);
  let disposed = false;

  return {
    dispose(): void {
      if (disposed) {
        return;
      }
      disposed = true;
      if (activeOwner !== owner) {
        return;
      }
      activeOwner = undefined;
      applyStoneClearanceField(undefined);
    },
  };
}

/**
 * Direct registration retained for isolated probes and regression scenes.
 * Runtime systems should prefer registerStoneClearanceField for owned cleanup.
 */
export function setStoneClearanceField(
  field: StoneField | undefined,
  config?: WorldConfig,
): void {
  activeOwner = undefined;
  applyStoneClearanceField(field, config);
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
