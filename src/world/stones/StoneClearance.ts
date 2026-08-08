import type { StoneField } from "./StoneField";

/**
 * Module-level clearance hook, following the `grassTrailField` precedent: the
 * grass placement paths sample stone clearance through this function instead
 * of threading a StoneField reference down every factory constructor. Scenes
 * without stones (island regression, isolated probes) simply never register a
 * field and the sampler is a constant 1.
 */

let activeField: StoneField | undefined;

export function setStoneClearanceField(field: StoneField | undefined): void {
  activeField = field;
}

/**
 * How much grass survives stones at (x, z): 1 clear, 0 under a footprint.
 * `extraRadius` widens the band by the placed thing's own reach, mirroring
 * {@link TerrainField.samplePathGrassMask}.
 */
export function sampleStoneGrassClearance(
  x: number,
  z: number,
  extraRadius = 0,
): number {
  return activeField ? activeField.sampleGrassClearance(x, z, extraRadius) : 1;
}
