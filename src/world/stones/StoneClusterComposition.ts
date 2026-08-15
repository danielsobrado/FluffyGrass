import type { WorldConfig } from "../WorldConfig";
import type { StoneArchetypeId } from "./StoneRecipe";
import { StoneRandom } from "./StoneRandom";
import type { StoneClusterDescriptor } from "./StoneClusterField";
import {
  axisLerp,
  clamp,
  clusterRoleCounts,
  DEBRIS_FAMILY,
  lerp,
  ROLE_YAW_EXTRA,
  SECONDARY_FAMILY,
  SPLIT_CHANCE,
  STONE_CLUSTER_MEMBER_JITTER,
  type StoneClusterProcess,
  type StoneClusterRole,
} from "./StoneClusterTuning";
import {
  LEVEL_WEIGHTS,
  pickFamilyArchetype,
  pickWeightedArchetype,
  SCALE_BANDS,
  scaleArchetypeWeight,
  SLOPE_WEIGHTS,
  withoutPebble,
} from "./StonePlacementProfile";

/**
 * Pure logical composition of one macro cluster.
 *
 * Terrain is not sampled here. The returned specs are immutable authored
 * members: overlap correction later may move a root, but it must not rewrite
 * scale, family, or the authored radial coordinate used for size hierarchy.
 */

export interface StoneClusterMemberSpec {
  readonly index: number;
  readonly role: StoneClusterRole;
  readonly archetype: StoneArchetypeId;
  readonly localU: number;
  readonly localV: number;
  readonly normalizedRadius: number;
  readonly scale: number;
  readonly rotationY: number;
  readonly variantIndex: number;
  readonly valueScale: number;
  readonly mossScale: number;
  readonly splitEligible: boolean;
  readonly fallback?: StoneClusterMemberSpec;
}

export class StoneClusterComposition {
  constructor(private readonly config: WorldConfig) {}

  compose(descriptor: StoneClusterDescriptor): readonly StoneClusterMemberSpec[] {
    if (!descriptor.active || descriptor.budget < 4) {
      return [];
    }
    const clusterRng = StoneRandom.fromSeed(descriptor.seed);
    const { secondaryCount, debrisCount } = clusterRoleCounts(descriptor.budget);
    const roles: StoneClusterRole[] = ["anchor"];
    for (let index = 0; index < secondaryCount; index += 1) {
      roles.push("secondary");
    }
    for (let index = 0; index < debrisCount; index += 1) {
      roles.push("debris");
    }

    const members: StoneClusterMemberSpec[] = [];
    let anchorArchetype: StoneArchetypeId = "boulder";
    let anchorScale = 1;
    const splitRoll = clusterRng.fork("split").chance(SPLIT_CHANCE);

    for (let index = 0; index < roles.length; index += 1) {
      const role = roles[index];
      const memberRng = clusterRng.fork(`member:${index}`);
      const spec = this.composeMember(
        descriptor,
        memberRng,
        index,
        role,
        anchorArchetype,
        anchorScale,
      );
      if (role === "anchor") {
        anchorArchetype = spec.archetype;
        anchorScale = spec.scale;
      }
      members.push(spec);
    }

    const firstSecondary = members.find((member) => member.role === "secondary");
    if (
      firstSecondary &&
      splitRoll &&
      (anchorArchetype === "boulder" || anchorArchetype === "block")
    ) {
      const fallbackRng = clusterRng.fork(`member:${firstSecondary.index}:fallback`);
      const fallback = this.composeMember(
        descriptor,
        fallbackRng,
        firstSecondary.index,
        "secondary",
        anchorArchetype,
        anchorScale,
      );
      members[firstSecondary.index] = {
        ...firstSecondary,
        splitEligible: true,
        fallback,
      };
    }

    return members;
  }

  private composeMember(
    descriptor: StoneClusterDescriptor,
    random: StoneRandom,
    index: number,
    role: StoneClusterRole,
    anchorArchetype: StoneArchetypeId,
    anchorScale: number,
  ): StoneClusterMemberSpec {
    const halo = this.config.stoneClusterHaloRatio;
    const core = this.config.stoneClusterCoreRatio;
    const shoulder = this.config.stoneClusterShoulderRatio;
    const offset = this.authoredOffset(descriptor.process, role, random, core, shoulder, halo);
    const archetype =
      role === "anchor"
        ? this.pickAnchorArchetype(descriptor, random)
        : pickFamilyArchetype(
            role === "secondary"
              ? SECONDARY_FAMILY[anchorArchetype]
              : DEBRIS_FAMILY[anchorArchetype],
            random,
          );
    const scale = this.resolveScale(
      descriptor,
      role,
      archetype,
      offset.normalizedRadius,
      halo,
      anchorScale,
      random,
    );
    const rotationY = this.resolveYaw(
      descriptor,
      role,
      archetype,
      random,
    );
    const variantIndex = random.integer(
      0,
      this.config.stoneVariantsPerArchetype - 1,
    );
    const valueScale = clamp(
      descriptor.valueBase + random.fork("value").signed(0.018),
      0.92,
      1.06,
    );
    const mossScale = random.fork("moss").range(0.94, 1.06);
    return {
      index,
      role,
      archetype,
      localU: offset.u,
      localV: offset.v,
      normalizedRadius: offset.normalizedRadius,
      scale,
      rotationY,
      variantIndex,
      valueScale,
      mossScale,
      splitEligible: false,
      fallback: undefined,
    };
  }

  private pickAnchorArchetype(
    descriptor: StoneClusterDescriptor,
    random: StoneRandom,
  ): StoneArchetypeId {
    let weights =
      descriptor.process === "scree"
        ? SLOPE_WEIGHTS
        : LEVEL_WEIGHTS[descriptor.biomeIndex];
    weights = withoutPebble(weights);
    if (descriptor.process === "ridge") {
      weights = scaleArchetypeWeight(weights, "slab", 1.35);
      weights = scaleArchetypeWeight(weights, "outcrop", 1.35);
      weights = scaleArchetypeWeight(weights, "boulder", 0.7);
    } else if (descriptor.process === "scree") {
      weights = scaleArchetypeWeight(weights, "shard", 1.25);
      weights = scaleArchetypeWeight(weights, "outcrop", 1.15);
    } else if (descriptor.process === "fan") {
      weights = scaleArchetypeWeight(weights, "boulder", 1.25);
      weights = scaleArchetypeWeight(weights, "slab", 1.1);
      weights = scaleArchetypeWeight(weights, "shard", 0.75);
      weights = scaleArchetypeWeight(weights, "outcrop", 0.7);
    }
    return pickWeightedArchetype(weights, random);
  }

  private resolveScale(
    descriptor: StoneClusterDescriptor,
    role: StoneClusterRole,
    archetype: StoneArchetypeId,
    normalizedRadius: number,
    halo: number,
    anchorScale: number,
    random: StoneRandom,
  ): number {
    const band = SCALE_BANDS[archetype];
    if (role === "anchor") {
      let scale = lerp(band[0], band[1], random.range(0.62, 0.92));
      if (
        archetype === "boulder" &&
        descriptor.suitability >= 0.72 &&
        random.fork("landmark").chance(0.06)
      ) {
        scale *= random.fork("landmark-scale").range(1.7, 2.4);
      }
      return scale;
    }
    const radiusT = Math.min(1, normalizedRadius / halo);
    if (role === "secondary") {
      const radialScale = lerp(0.72, 0.48, radiusT);
      return clamp(
        anchorScale * radialScale * random.range(0.9, 1.08),
        band[0],
        band[1],
      );
    }
    const radialScale = lerp(0.38, 0.18, radiusT);
    return clamp(
      anchorScale * radialScale * random.range(0.85, 1.15),
      0.22,
      band[1],
    );
  }

  private resolveYaw(
    descriptor: StoneClusterDescriptor,
    role: StoneClusterRole,
    archetype: StoneArchetypeId,
    random: StoneRandom,
  ): number {
    const extra = ROLE_YAW_EXTRA[role];
    if (archetype === "pebble") {
      return random.range(0, Math.PI);
    }
    if (archetype === "outcrop") {
      return descriptor.strike + random.signed(0.18 + extra);
    }
    if (archetype === "slab") {
      return descriptor.strike + random.signed(0.22 + extra);
    }
    if (archetype === "block") {
      return descriptor.strike + random.signed(0.28 + extra);
    }
    if (archetype === "boulder") {
      return (
        axisLerp(descriptor.strike, descriptor.direction, 0.35) +
        random.signed(0.42 + extra)
      );
    }
    return descriptor.direction + random.signed(0.38 + extra);
  }

  private authoredOffset(
    process: StoneClusterProcess,
    role: StoneClusterRole,
    random: StoneRandom,
    core: number,
    shoulder: number,
    halo: number,
  ): { u: number; v: number; normalizedRadius: number } {
    if (role === "anchor") {
      if (process === "scree" || process === "fan") {
        const u = -0.16 + random.signed(0.04);
        const v = random.signed(0.05);
        return { u, v, normalizedRadius: Math.hypot(u, v) };
      }
      const u = random.signed(0.06);
      const v = random.signed(0.06);
      return { u, v, normalizedRadius: Math.hypot(u, v) };
    }

    const radius =
      role === "secondary"
        ? lerp(core * 0.55, shoulder * 0.92, random.next())
        : lerp(core, halo, Math.sqrt(random.next()));
    const offset = this.processOffset(process, role, radius, halo, random);
    offset.u += random.fork("jitter-u").signed(STONE_CLUSTER_MEMBER_JITTER);
    offset.v += random.fork("jitter-v").signed(STONE_CLUSTER_MEMBER_JITTER);
    return {
      u: offset.u,
      v: offset.v,
      normalizedRadius: radius,
    };
  }

  private processOffset(
    process: StoneClusterProcess,
    role: StoneClusterRole,
    radius: number,
    halo: number,
    random: StoneRandom,
  ): { u: number; v: number } {
    if (process === "compact") {
      const angle = random.range(0, Math.PI * 2);
      return { u: Math.cos(angle) * radius, v: Math.sin(angle) * radius };
    }
    if (process === "ridge") {
      const side = random.chance(0.5) ? -1 : 1;
      const spread = role === "secondary" ? 0.18 : 0.34;
      return { u: side * radius, v: random.signed(spread * radius) };
    }
    const span =
      process === "scree"
        ? role === "secondary"
          ? lerp(0.16, 0.3, radius / halo)
          : lerp(0.22, 0.48, radius / halo)
        : role === "secondary"
          ? lerp(0.24, 0.46, radius / halo)
          : lerp(0.32, 0.68, radius / halo);
    return { u: radius, v: random.signed(radius * span) };
  }
}
