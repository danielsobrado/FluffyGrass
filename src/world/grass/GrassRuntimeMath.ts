export interface GrassImpostorBoundsParameters {
  cardRadius: number;
  centerHeight: number;
  footprintScale: number;
  maximumHorizontalScale: number;
  maximumVerticalScale: number;
  maximumWindDisplacement: number;
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
