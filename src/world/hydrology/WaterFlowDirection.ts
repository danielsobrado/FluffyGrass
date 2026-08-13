const FLOW_EPSILON = 1e-6;

export interface WaterFlowSample {
  riverCoverage: number;
  flowX: number;
  flowZ: number;
}

export function createWaterFlowSample(): WaterFlowSample {
  return { riverCoverage: 0, flowX: 0, flowZ: 0 };
}

/** Normalizes packed river flow and flips it toward the locally lower surface. */
export function resolveDownhillWaterFlow(
  index: number,
  resolution: number,
  positions: Float32Array,
  data: Float32Array,
  target: WaterFlowSample,
): WaterFlowSample {
  const dataOffset = index * 4;
  const riverCoverage = Math.hypot(
    data[dataOffset + 2],
    data[dataOffset + 3],
  );
  target.riverCoverage = riverCoverage;
  target.flowX = 0;
  target.flowZ = 0;
  if (!(riverCoverage > FLOW_EPSILON)) return target;

  let flowX = data[dataOffset + 2] / riverCoverage;
  let flowZ = data[dataOffset + 3] / riverCoverage;
  const xIndex = index % resolution;
  const zIndex = Math.floor(index / resolution);
  const left = xIndex > 0 ? index - 1 : index;
  const right = xIndex + 1 < resolution ? index + 1 : index;
  const down = zIndex > 0 ? index - resolution : index;
  const up = zIndex + 1 < resolution ? index + resolution : index;

  const leftPosition = left * 3;
  const rightPosition = right * 3;
  const downPosition = down * 3;
  const upPosition = up * 3;
  const deltaX = positions[rightPosition] - positions[leftPosition];
  const deltaZ = positions[upPosition + 2] - positions[downPosition + 2];
  const gradientX =
    Math.abs(deltaX) > FLOW_EPSILON
      ? (positions[rightPosition + 1] - positions[leftPosition + 1]) / deltaX
      : 0;
  const gradientZ =
    Math.abs(deltaZ) > FLOW_EPSILON
      ? (positions[upPosition + 1] - positions[downPosition + 1]) / deltaZ
      : 0;

  if (gradientX * flowX + gradientZ * flowZ > 0) {
    flowX = -flowX;
    flowZ = -flowZ;
  }
  data[dataOffset + 2] = flowX * riverCoverage;
  data[dataOffset + 3] = flowZ * riverCoverage;
  target.flowX = flowX;
  target.flowZ = flowZ;
  return target;
}
