import type { StonePaletteKey } from "./StonePalette";
import type { StoneArchetypeId } from "./StoneRecipe";
import type { StoneClusterProcess, StoneClusterRole } from "./StoneClusterTuning";

export type { StoneClusterProcess, StoneClusterRole };

export interface StoneClusterCandidate {
  readonly gridX: number;
  readonly gridZ: number;
  readonly seed: number;
  readonly centerX: number;
  readonly centerZ: number;
  readonly height: number;
  readonly geologyPotential: number;
  readonly moisture: number;
  readonly fertility: number;
  readonly exposure: number;
  readonly disturbance: number;
  readonly surfaceRockiness: number;
  readonly landformSlope: number;
  readonly landformConvexity: number;
  readonly landformGradientX: number;
  readonly landformGradientZ: number;
  readonly suitability: number;
  readonly rawActive: boolean;
  readonly priority: number;
  readonly process: StoneClusterProcess;
  readonly strike: number;
  readonly direction: number;
  readonly majorRadius: number;
  readonly minorRadius: number;
  readonly influenceRadius: number;
  readonly budget: number;
  readonly biomeIndex: number;
  readonly paletteKey: StonePaletteKey;
  readonly valueBase: number;
  readonly mossBase: number;
  readonly mossBias: number;
}

export interface StoneClusterDescriptor extends StoneClusterCandidate {
  readonly active: boolean;
}

export interface StoneClusterMemberSpec {
  readonly index: number;
  readonly role: StoneClusterRole;
  readonly archetype: StoneArchetypeId;
  readonly variantIndex: number;
  readonly u: number;
  readonly v: number;
  readonly rotationY: number;
  readonly scale: number;
  readonly valueScale: number;
  readonly environmentMoss: number;
  readonly splitOwner: boolean;
}

export interface StoneResolvedMember {
  readonly memberIndex: number;
  readonly x: number;
  readonly z: number;
  readonly height: number;
  readonly normalX: number;
  readonly normalY: number;
  readonly normalZ: number;
  readonly footprint: number;
  readonly sink: number;
  readonly clearRadius: number;
  readonly memberSpec: StoneClusterMemberSpec;
}

export interface StoneResolvedCluster {
  readonly gridX: number;
  readonly gridZ: number;
  readonly members: readonly StoneResolvedMember[];
}
