const SUBPATCHES_PER_AXIS = 2;
const IMPOSTOR_FOOTPRINT_SCALE = 1.12;
const MAX_HORIZONTAL_SCALE = 1.1;
const MAX_VERTICAL_SCALE = 1.2;
const MAX_WIND_DISPLACEMENT = 0.08;
const BOUNDS_SAFETY_MARGIN = 0.15;

export function calculateSubpatchBoundsRadius(cardRadius, centerHeight, halfSubpatch) {
  const horizontalExtent =
    cardRadius * MAX_HORIZONTAL_SCALE * IMPOSTOR_FOOTPRINT_SCALE;
  const verticalExtent = cardRadius * MAX_VERTICAL_SCALE;
  const cardBounds =
    centerHeight * MAX_VERTICAL_SCALE +
    Math.hypot(horizontalExtent, verticalExtent) +
    MAX_WIND_DISPLACEMENT +
    BOUNDS_SAFETY_MARGIN;
  return cardBounds + Math.SQRT2 * halfSubpatch * MAX_HORIZONTAL_SCALE;
}

export function createSubpatchCenters(Vector2, patchSize) {
  const halfSubpatch = patchSize / (SUBPATCHES_PER_AXIS * 2);
  const centers = [];
  for (let row = 0; row < SUBPATCHES_PER_AXIS; row += 1) {
    for (let column = 0; column < SUBPATCHES_PER_AXIS; column += 1) {
      centers.push(
        new Vector2(
          column === 0 ? -halfSubpatch : halfSubpatch,
          row === 0 ? -halfSubpatch : halfSubpatch,
        ),
      );
    }
  }
  return centers;
}

export function partitionBlades(blades) {
  const partitions = Array.from(
    { length: SUBPATCHES_PER_AXIS * SUBPATCHES_PER_AXIS },
    () => [],
  );
  for (const blade of blades) {
    const column = blade.rootX >= 0 ? 1 : 0;
    const row = blade.rootZ >= 0 ? 1 : 0;
    partitions[row * SUBPATCHES_PER_AXIS + column].push(blade);
  }
  return partitions;
}

export function createSubpatchGeometry(
  BufferGeometry,
  Float32BufferAttribute,
  radius,
  centers,
) {
  const positions = [];
  const uvs = [];
  const subpatchOffsets = [];
  const subpatchIndices = [];
  const indices = [];

  for (let subpatchIndex = 0; subpatchIndex < centers.length; subpatchIndex += 1) {
    const vertexOffset = positions.length / 3;
    positions.push(
      -radius, -radius, 0,
      radius, -radius, 0,
      radius, radius, 0,
      -radius, radius, 0,
    );
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    const center = centers[subpatchIndex];
    for (let vertex = 0; vertex < 4; vertex += 1) {
      subpatchOffsets.push(center.x, center.y);
      subpatchIndices.push(subpatchIndex);
    }
    indices.push(
      vertexOffset,
      vertexOffset + 1,
      vertexOffset + 2,
      vertexOffset,
      vertexOffset + 2,
      vertexOffset + 3,
    );
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute(
    "grassSubpatchOffset",
    new Float32BufferAttribute(subpatchOffsets, 2),
  );
  geometry.setAttribute(
    "grassSubpatchIndex",
    new Float32BufferAttribute(subpatchIndices, 1),
  );
  geometry.setIndex(indices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export { SUBPATCHES_PER_AXIS };
