/**
 * What a stone does to the ground it stands in, at the ground's own resolution.
 *
 * The terrain shader has always known how to paint contact soil -- compacted
 * earth against the body, mineral grit where runoff comes off it -- but it read
 * the stone's reach from an interpolated vertex attribute, and near terrain
 * carries vertices 2.56 m apart while a boulder's whole soil band is about
 * 1.2 m wide. Measured across the field, 61% of ground-clearing stones have
 * their entire band narrower than a single terrain quad: the effect either
 * vanished between vertices or smeared into a soft halo with no relation to the
 * footprint underneath it.
 *
 * The fix is not to send the band across the grid at all. A vertex carries
 * *which stone is nearest and how far its influence reaches*, and the fragment
 * shader measures its own distance to that centre. Interpolating a centre point
 * behaves far better than interpolating a falloff, because the four corners of
 * a quad near a stone almost always agree on which stone they are near -- and
 * where they disagree, the phantom centre lands between two bodies, in the gap,
 * which is where the band is weakest anyway.
 */

import type { StoneInstance } from "./StoneField";

/**
 * The three radii a stone imposes on the ground around it, outward from the
 * body: bare compacted earth, the soil stain fading out of it, and the ring of
 * thickened planting beyond that.
 */
export interface StoneGroundInfluence {
  readonly centerX: number;
  readonly centerZ: number;
  /** Ground the body clears entirely; full soil inside this. */
  readonly innerClearRadius: number;
  /** Where the soil stain has faded back to open meadow. */
  readonly contactSoilRadius: number;
  /** Outer edge of the planted band the skirt layer thickens. */
  readonly understoryBoostRadius: number;
  /** Reach of the contact shadow the body throws onto the ground. */
  readonly occlusionRadius: number;
}

/**
 * Share of the clear radius that reads as fully disturbed soil.
 *
 * Short of the clearance edge on purpose: the outer part of a cleared disc is
 * ground the stone shades and dries rather than ground it sits on, and running
 * full soil all the way out turns a rock into a painted brown plate.
 */
const SOIL_CORE_RATIO = 0.62;

/**
 * Share of a body's height that its contact shadow reaches out across the
 * ground. Short: past roughly half a body height the stone has dropped low
 * enough in the sky that what it still blocks is not worth a darkening.
 */
const OCCLUSION_HEIGHT_REACH = 0.55;

export function createStoneGroundInfluence(): StoneGroundInfluence {
  return {
    centerX: 0,
    centerZ: 0,
    innerClearRadius: 0,
    contactSoilRadius: 0,
    understoryBoostRadius: 0,
    occlusionRadius: 0,
  };
}

/** Mutable form, so sampling can fill one scratch value per vertex. */
export interface MutableStoneGroundInfluence {
  centerX: number;
  centerZ: number;
  innerClearRadius: number;
  contactSoilRadius: number;
  understoryBoostRadius: number;
  occlusionRadius: number;
}

export function createMutableStoneGroundInfluence(): MutableStoneGroundInfluence {
  return {
    centerX: 0,
    centerZ: 0,
    innerClearRadius: 0,
    contactSoilRadius: 0,
    understoryBoostRadius: 0,
    occlusionRadius: 0,
  };
}

/** The radii one stone imposes, given the clearance feather it was placed with. */
export function writeStoneGroundInfluence(
  instance: StoneInstance,
  feather: number,
  skirtWidth: number,
  out: MutableStoneGroundInfluence,
): void {
  out.centerX = instance.x;
  out.centerZ = instance.z;
  out.innerClearRadius = instance.clearRadius * SOIL_CORE_RATIO;
  out.contactSoilRadius = instance.clearRadius + feather;
  out.understoryBoostRadius = instance.clearRadius + skirtWidth;
  out.occlusionRadius = instance.occlusionRadius;
}

/**
 * Clears the influence to "no stone here", anchored at the sampling point.
 *
 * The anchor matters: a vertex with no stone still has its centre interpolated
 * toward its neighbours, and anchoring it at the vertex keeps that lerp inside
 * the quad instead of dragging the phantom centre toward the world origin.
 */
export function clearStoneGroundInfluence(
  x: number,
  z: number,
  out: MutableStoneGroundInfluence,
): void {
  out.centerX = x;
  out.centerZ = z;
  out.innerClearRadius = 0;
  out.contactSoilRadius = 0;
  out.understoryBoostRadius = 0;
  out.occlusionRadius = 0;
}

/**
 * How far a body's contact shadow reaches across the ground.
 *
 * Scaled by height rather than by footprint, because what darkens the ground is
 * the sky the body takes away, and a tall stone takes away a wedge of sky far
 * out while a flat one stops almost at its own edge. The peak is not scaled the
 * same way and is left to the shader: at the point of contact you are in the
 * angle between ground and body whatever the body is, so contact shade is close
 * to scale-invariant right at the base and only its reach really varies.
 */
export function resolveStoneOcclusionRadius(
  footprintRadius: number,
  bodyHeight: number,
): number {
  return footprintRadius + bodyHeight * OCCLUSION_HEIGHT_REACH;
}

/**
 * How strongly the contact band applies at `distance` from the stone centre.
 *
 * The terrain fragment shader mirrors this in GLSL rather than calling it --
 * there is no shared language between them -- so the two must be changed
 * together. It is stated here because probes and any CPU-side consumer need the
 * same curve, and two hand-written falloffs drift.
 */
export function resolveStoneContactBand(
  distance: number,
  innerClearRadius: number,
  contactSoilRadius: number,
): number {
  if (!(contactSoilRadius > 0)) return 0;
  if (distance <= innerClearRadius) return 1;
  if (distance >= contactSoilRadius) return 0;
  const amount =
    (distance - innerClearRadius) /
    Math.max(1e-4, contactSoilRadius - innerClearRadius);
  return 1 - amount * amount * (3 - 2 * amount);
}

/**
 * Contact shade at `distance` from the stone centre, in [0, 1].
 *
 * Squared rather than linear: the sky comes back quickly once you step out from
 * under a body, and a linear ramp reads as a painted halo, which is the failure
 * this is meant to avoid rather than repeat. Mirrored in the terrain fragment
 * shader, like the band above, and must be changed with it.
 */
export function resolveStoneContactShade(
  distance: number,
  occlusionRadius: number,
): number {
  if (!(occlusionRadius > 0)) return 0;
  if (distance >= occlusionRadius) return 0;
  const amount = distance / occlusionRadius;
  const shade = 1 - amount * amount * (3 - 2 * amount);
  return shade * shade;
}
