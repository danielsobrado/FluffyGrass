export interface GrassImpostorBoundsParameters {
  cardRadius: number;
  centerHeight: number;
  footprintScale: number;
  maximumHorizontalScale: number;
  maximumVerticalScale: number;
  maximumWindDisplacement: number;
  safetyMargin: number;
}

/** Below this total turn the arc is a straight blade to within float precision. */
const GRASS_BLADE_ARC_EPSILON = 1e-4;

export interface GrassBladeArcPoint {
  y: number;
  z: number;
}

/**
 * A blade's rest curve, biased toward the upper half so the base stays planted.
 * `amount` is still the normalized vertex parameter; curvature accumulates
 * faster toward the tip. The tip at `amount = 1` matches the previous circular
 * arc, so reserved bounds do not change.
 */
export function resolveGrassBladeArcPoint(
  height: number,
  bladeCurve: number,
  amount: number,
): GrassBladeArcPoint {
  if (!(bladeCurve > GRASS_BLADE_ARC_EPSILON)) {
    return { y: height * amount, z: 0 };
  }
  const biased = amount * amount;
  const angle = bladeCurve * biased;
  return {
    y: (height * Math.sin(angle)) / bladeCurve,
    z: (height * (1 - Math.cos(angle))) / bladeCurve,
  };
}

/**
 * How far the rest curve alone carries a tip from its root, horizontally. The
 * bounds below and the geometry that builds the blade both read it from here so
 * a curve tuned in configuration cannot outgrow the box that culls it.
 */
export function calculateGrassBladeCurveReach(
  height: number,
  bladeCurve: number,
): number {
  return resolveGrassBladeArcPoint(height, bladeCurve, 1).z;
}

export interface GrassSingleBladeBoundsParameters {
  bladeHeight: number;
  bladeWidth: number;
  bladeLean: number;
  /** Horizontal reach of the rest curve; see {@link calculateGrassBladeCurveReach}. */
  bladeCurveReach: number;
  maximumHorizontalScale: number;
  maximumVerticalScale: number;
  windStrength: number;
  flutterStrength: number;
  maximumArtWindScale: number;
  maximumInstanceWindScale: number;
  maximumWindStiffness: number;
  maximumInteractionStrength: number;
  interactionVerticalScale: number;
  safetyMargin: number;
}

export function calculateGrassImpostorRootBoundsRadius(
  parameters: GrassImpostorBoundsParameters,
): number {
  const values = Object.values(parameters);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError(
      "Grass impostor bounds parameters must be finite and non-negative.",
    );
  }

  const horizontalExtent =
    parameters.cardRadius *
    parameters.maximumHorizontalScale *
    parameters.footprintScale;
  const verticalExtent =
    parameters.cardRadius * parameters.maximumVerticalScale;
  const cardExtent = Math.hypot(horizontalExtent, verticalExtent);
  const centerOffset =
    parameters.centerHeight * parameters.maximumVerticalScale;

  return (
    centerOffset +
    cardExtent +
    parameters.maximumWindDisplacement +
    parameters.safetyMargin
  );
}

export function calculateGrassSingleBladeRootBoundsRadius(
  parameters: GrassSingleBladeBoundsParameters,
): number {
  const values = Object.values(parameters);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError(
      "Grass single-blade bounds parameters must be finite and non-negative.",
    );
  }

  // The rest curve carries the tip out along the blade's own depth axis, which
  // the instance's horizontal scale stretches exactly as it does lean and width.
  const horizontalExtent =
    (parameters.bladeLean +
      parameters.bladeWidth +
      parameters.bladeCurveReach) *
    parameters.maximumHorizontalScale;
  const verticalExtent =
    parameters.bladeHeight * parameters.maximumVerticalScale;
  const sourceExtent = Math.hypot(horizontalExtent, verticalExtent);
  // Wind rotates a blade about its root rather than translating its vertices,
  // so the configured strengths are a bend angle in radians and the horizontal
  // sweep they produce scales with how tall the blade is. `sin` is bounded by
  // its argument, so charging the full angle keeps the bound conservative.
  const windExtent =
    (parameters.windStrength + parameters.flutterStrength) *
    parameters.maximumArtWindScale *
    parameters.maximumInstanceWindScale *
    parameters.maximumWindStiffness *
    parameters.bladeHeight *
    parameters.maximumVerticalScale;
  const interactionExtent = Math.hypot(
    parameters.maximumInteractionStrength,
    parameters.maximumInteractionStrength *
      parameters.interactionVerticalScale,
  );

  return (
    sourceExtent + windExtent + interactionExtent + parameters.safetyMargin
  );
}
