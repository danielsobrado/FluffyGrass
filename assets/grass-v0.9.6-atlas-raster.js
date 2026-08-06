const MIN_PIXEL_BASE_WIDTH = 1.05;
const BYTE_MAX = 255;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function createAtlasRasterizer(Vector3) {
  const worldUp = new Vector3(0, 1, 0);
  const projectedPoint = new Float64Array(2);

  function projectPoint(
    pointX,
    pointY,
    pointZ,
    right,
    up,
    center,
    frameX,
    frameY,
    frameResolution,
    radius,
  ) {
    const localX = pointX - center.x;
    const localY = pointY - center.y;
    const localZ = pointZ - center.z;
    const inverseDiameter = 1 / (radius * 2);
    projectedPoint[0] =
      frameX +
      (0.5 +
        (localX * right.x + localY * right.y + localZ * right.z) *
          inverseDiameter) *
        frameResolution;
    projectedPoint[1] =
      frameY +
      (0.5 -
        (localX * up.x + localY * up.y + localZ * up.z) * inverseDiameter) *
        frameResolution;
  }

  function projectBlade(
    blade,
    viewDirection,
    right,
    up,
    center,
    frameX,
    frameY,
    frameResolution,
    radius,
  ) {
    const halfWidth = blade.width * 0.5;
    const widthX = Math.cos(blade.facingAngle) * halfWidth;
    const widthZ = Math.sin(blade.facingAngle) * halfWidth;
    const tipX = blade.rootX + Math.cos(blade.leanAngle) * blade.lean;
    const tipZ = blade.rootZ + Math.sin(blade.leanAngle) * blade.lean;
    const leftX = blade.rootX - widthX;
    const leftZ = blade.rootZ - widthZ;
    const rightRootX = blade.rootX + widthX;
    const rightRootZ = blade.rootZ + widthZ;

    projectPoint(
      leftX, 0, leftZ, right, up, center,
      frameX, frameY, frameResolution, radius,
    );
    let projectedLeftX = projectedPoint[0];
    let projectedLeftY = projectedPoint[1];
    projectPoint(
      rightRootX, 0, rightRootZ, right, up, center,
      frameX, frameY, frameResolution, radius,
    );
    let projectedRightX = projectedPoint[0];
    let projectedRightY = projectedPoint[1];
    projectPoint(
      tipX, blade.height, tipZ, right, up, center,
      frameX, frameY, frameResolution, radius,
    );
    const projectedTipX = projectedPoint[0];
    const projectedTipY = projectedPoint[1];

    const deltaX = projectedRightX - projectedLeftX;
    const deltaY = projectedRightY - projectedLeftY;
    const width = Math.hypot(deltaX, deltaY);
    if (width < MIN_PIXEL_BASE_WIDTH) {
      const centerX = (projectedLeftX + projectedRightX) * 0.5;
      const centerY = (projectedLeftY + projectedRightY) * 0.5;
      const directionX = width > 1e-5 ? deltaX / width : 1;
      const directionY = width > 1e-5 ? deltaY / width : 0;
      const halfBaseWidth = MIN_PIXEL_BASE_WIDTH * 0.5;
      projectedLeftX = centerX - directionX * halfBaseWidth;
      projectedLeftY = centerY - directionY * halfBaseWidth;
      projectedRightX = centerX + directionX * halfBaseWidth;
      projectedRightY = centerY + directionY * halfBaseWidth;
    }

    const averageX = (leftX + rightRootX + tipX) / 3 - center.x;
    const averageY = blade.height / 3 - center.y;
    const averageZ = (leftZ + rightRootZ + tipZ) / 3 - center.z;
    return {
      depth:
        averageX * viewDirection.x +
        averageY * viewDirection.y +
        averageZ * viewDirection.z,
      leftX: projectedLeftX,
      leftY: projectedLeftY,
      rightX: projectedRightX,
      rightY: projectedRightY,
      tipX: projectedTipX,
      tipY: projectedTipY,
      shade: blade.shade,
    };
  }

  function encodeDataColor(bladeProgress, shade, dryness) {
    const red = Math.round(clamp(bladeProgress, 0, 1) * BYTE_MAX);
    const green = Math.round(clamp(shade, 0, 1) * BYTE_MAX);
    const blue = Math.round(clamp(dryness, 0, 1) * BYTE_MAX);
    return `rgb(${red}, ${green}, ${blue})`;
  }

  function drawFrame(
    context,
    blades,
    viewDirection,
    offsetX,
    offsetY,
    frameResolution,
    padding,
    center,
    radius,
  ) {
    const right = new Vector3().crossVectors(worldUp, viewDirection);
    if (right.lengthSq() < 1e-6) {
      right.set(1, 0, 0);
    } else {
      right.normalize();
    }
    const up = new Vector3().crossVectors(viewDirection, right).normalize();
    const projected = blades.map((blade) =>
      projectBlade(
        blade, viewDirection, right, up, center,
        offsetX + padding, offsetY + padding, frameResolution, radius,
      ),
    );
    projected.sort((left, rightBlade) => left.depth - rightBlade.depth);

    context.save();
    context.beginPath();
    context.rect(
      offsetX + padding,
      offsetY + padding,
      frameResolution,
      frameResolution,
    );
    context.clip();

    for (const blade of projected) {
      const shade = clamp(blade.shade, 0, 1);
      const dryness = clamp((0.2 - blade.shade) * 0.8, 0, 0.22);
      const baseX = (blade.leftX + blade.rightX) * 0.5;
      const baseY = (blade.leftY + blade.rightY) * 0.5;
      const baseEdgeX = blade.rightX - blade.leftX;
      const baseEdgeY = blade.rightY - blade.leftY;
      const baseLength = Math.hypot(baseEdgeX, baseEdgeY);
      let normalX = baseLength > 1e-5 ? -baseEdgeY / baseLength : 0;
      let normalY = baseLength > 1e-5 ? baseEdgeX / baseLength : -1;
      let projectedHeight =
        (blade.tipX - baseX) * normalX +
        (blade.tipY - baseY) * normalY;
      if (projectedHeight < 0) {
        normalX *= -1;
        normalY *= -1;
        projectedHeight *= -1;
      }
      if (projectedHeight < 1e-4) {
        const tipDistance = Math.max(
          Math.hypot(blade.tipX - baseX, blade.tipY - baseY),
          1e-4,
        );
        normalX = (blade.tipX - baseX) / tipDistance;
        normalY = (blade.tipY - baseY) / tipDistance;
        projectedHeight = tipDistance;
      }
      const gradient = context.createLinearGradient(
        baseX,
        baseY,
        baseX + normalX * projectedHeight,
        baseY + normalY * projectedHeight,
      );
      gradient.addColorStop(0, encodeDataColor(0, shade, dryness));
      gradient.addColorStop(1, encodeDataColor(1, shade, dryness * 0.75));
      context.fillStyle = gradient;
      context.beginPath();
      context.moveTo(blade.leftX, blade.leftY);
      context.lineTo(blade.rightX, blade.rightY);
      context.lineTo(blade.tipX, blade.tipY);
      context.closePath();
      context.fill();
    }

    context.restore();
  }

  function decodeHemiOctahedral(u, v) {
    const squareX = u * 2 - 1;
    const squareY = v * 2 - 1;
    const x = (squareX + squareY) * 0.5;
    const z = (squareX - squareY) * 0.5;
    const y = Math.max(0, 1 - Math.abs(x) - Math.abs(z));
    return new Vector3(x, y, z).normalize();
  }

  return { decodeHemiOctahedral, drawFrame };
}
