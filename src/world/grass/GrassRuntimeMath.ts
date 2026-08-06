export interface GrassImpostorBoundsParameters {
  cardRadius: number;
  centerHeight: number;
  footprintScale: number;
  maximumHorizontalScale: number;
  maximumVerticalScale: number;
  maximumWindDisplacement: number;
  safetyMargin: number;
}

export interface GrassSingleBladeBoundsParameters {
  bladeHeight: number;
  bladeWidth: number;
  bladeLean: number;
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

  const horizontalExtent =
    (parameters.bladeLean + parameters.bladeWidth) *
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
