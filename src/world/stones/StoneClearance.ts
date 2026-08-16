import type { WorldConfig } from "../WorldConfig";
import { StoneClearanceCache } from "./StoneClearanceCache";
import type { StoneField } from "./StoneField";

export interface StoneClearanceRegistration {
  dispose(): void;
}

interface StoneClearanceOwner {
  readonly owner: symbol;
  readonly field: StoneField | undefined;
  readonly config: WorldConfig | undefined;
}

const owners: StoneClearanceOwner[] = [];
let activeField: StoneField | undefined;
let activeCache: StoneClearanceCache | undefined;

function applyStoneClearanceField(
  field: StoneField | undefined,
  config?: WorldConfig,
): void {
  activeCache?.clear();
  activeField = field;
  activeCache = field && config ? new StoneClearanceCache(field, config) : undefined;
}

function applyCurrentOwner(): void {
  const active = owners[owners.length - 1];
  applyStoneClearanceField(active?.field, active?.config);
}

/** Register the deterministic stone field used by grass placement. */
export function registerStoneClearanceField(
  field: StoneField | undefined,
  config?: WorldConfig,
): StoneClearanceRegistration {
  const registration: StoneClearanceOwner = {
    owner: Symbol("stone-clearance-owner"),
    field,
    config,
  };
  owners.push(registration);
  applyStoneClearanceField(field, config);
  let disposed = false;

  return {
    dispose(): void {
      if (disposed) {
        return;
      }
      disposed = true;
      const index = owners.findIndex(
        (candidate) => candidate.owner === registration.owner,
      );
      if (index < 0) {
        return;
      }
      const wasActive = index === owners.length - 1;
      owners.splice(index, 1);
      if (wasActive) {
        applyCurrentOwner();
      }
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
  owners.length = 0;
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
  field?: StoneField,
): number {
  if (activeCache && (!field || field === activeField)) {
    return activeCache.sample(x, z, extraRadius);
  }
  const source = field ?? activeField;
  return source ? source.sampleGrassClearance(x, z, extraRadius) : 1;
}
