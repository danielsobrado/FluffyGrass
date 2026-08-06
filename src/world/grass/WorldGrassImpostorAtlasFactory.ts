import * as THREE from "three";
import type {
  GrassGeometryConfig,
  GrassImpostorConfig,
} from "../../grass/GrassConfig";
import {
  GRASS_IMPOSTOR_BOUNDS_SAFETY_MARGIN,
  GRASS_IMPOSTOR_FOOTPRINT_SCALE,
  GRASS_IMPOSTOR_MAX_HORIZONTAL_SCALE,
  GRASS_IMPOSTOR_MAX_VERTICAL_SCALE,
  GRASS_IMPOSTOR_MAX_WIND_DISPLACEMENT,
} from "../../grass/GrassLodTuning";
import type { WorldGrassBladeSpec } from "./WorldGrassPatchGeometryFactory";
import { calculateGrassImpostorRootBoundsRadius } from "./GrassRuntimeMath";

export interface WorldGrassImpostorAtlas {
  texture: THREE.CanvasTexture;
  geometry: THREE.BufferGeometry;
  centerHeight: number;
  /**
   * Conservative culling bound around the card's root, well larger than the
   * card itself. Do not use it as a card dimension — {@link cardRadius} is the
   * quad's own half-extent.
   */
  radius: number;
  /** Half-extent of the billboard quad in local units. */
  cardRadius: number;
  viewsPerAxis: number;
  frameResolution: number;
  padding: number;
  atlasSize: number;
}

interface ProjectedBlade {
  depth: number;
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
  tipX: number;
  tipY: number;
  shade: number;
}

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const MIN_PIXEL_BASE_WIDTH = 1.05;
const BYTE_MAX = 255;

export class WorldGrassImpostorAtlasFactory {
  private readonly projectedPoint = new Float64Array(2);

  create(
    blades: readonly WorldGrassBladeSpec[],
    grass: GrassGeometryConfig,
    patchSize: number,
    config: GrassImpostorConfig,
  ): WorldGrassImpostorAtlas {
    const cellSize = config.frameResolution + config.padding * 2;
    const atlasSize = config.viewsPerAxis * cellSize;
    const canvas = document.createElement("canvas");
    canvas.width = atlasSize;
    canvas.height = atlasSize;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error(
        "Unable to create the grass impostor atlas canvas context.",
      );
    }

    let maximumHeight = grass.bladeHeightMax;
    for (const blade of blades) {
      maximumHeight = Math.max(maximumHeight, blade.height);
    }
    const centerHeight = maximumHeight * 0.5;
    const halfPatch = patchSize * 0.5;
    const cardRadius =
      Math.sqrt(halfPatch * halfPatch * 2 + centerHeight * centerHeight) *
      config.cameraMargin;
    const boundsRadius = calculateGrassImpostorRootBoundsRadius({
      cardRadius,
      centerHeight,
      footprintScale: GRASS_IMPOSTOR_FOOTPRINT_SCALE,
      maximumHorizontalScale: GRASS_IMPOSTOR_MAX_HORIZONTAL_SCALE,
      maximumVerticalScale: GRASS_IMPOSTOR_MAX_VERTICAL_SCALE,
      maximumWindDisplacement: GRASS_IMPOSTOR_MAX_WIND_DISPLACEMENT,
      safetyMargin: GRASS_IMPOSTOR_BOUNDS_SAFETY_MARGIN,
    });

    context.clearRect(0, 0, atlasSize, atlasSize);
    for (let gridY = 0; gridY < config.viewsPerAxis; gridY += 1) {
      for (let gridX = 0; gridX < config.viewsPerAxis; gridX += 1) {
        const direction = this.decodeHemiOctahedral(
          (gridX + 0.5) / config.viewsPerAxis,
          (gridY + 0.5) / config.viewsPerAxis,
        );
        const canvasRow = config.viewsPerAxis - 1 - gridY;
        this.drawFrame(
          context,
          blades,
          direction,
          gridX * cellSize,
          canvasRow * cellSize,
          config.frameResolution,
          config.padding,
          centerHeight,
          cardRadius,
        );
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.name = "world-grass-hemi-octahedral-atlas";
    // RGB stores normalized blade progress and shade, not display color.
    texture.colorSpace = THREE.NoColorSpace;
    // Keep semantic channels alpha-weighted through linear filtering. The
    // shader divides once after atlas-view selection.
    texture.premultiplyAlpha = true;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;

    return {
      texture,
      geometry: this.createGeometry(cardRadius),
      centerHeight,
      radius: boundsRadius,
      cardRadius,
      viewsPerAxis: config.viewsPerAxis,
      frameResolution: config.frameResolution,
      padding: config.padding,
      atlasSize,
    };
  }

  private drawFrame(
    context: CanvasRenderingContext2D,
    blades: readonly WorldGrassBladeSpec[],
    viewDirection: THREE.Vector3,
    offsetX: number,
    offsetY: number,
    frameResolution: number,
    padding: number,
    centerHeight: number,
    radius: number,
  ): void {
    const right = new THREE.Vector3().crossVectors(WORLD_UP, viewDirection);
    if (right.lengthSq() < 1e-6) {
      right.set(1, 0, 0);
    } else {
      right.normalize();
    }
    const up = new THREE.Vector3()
      .crossVectors(viewDirection, right)
      .normalize();
    const center = new THREE.Vector3(0, centerHeight, 0);
    const projected = blades.map((blade) =>
      this.projectBlade(
        blade,
        viewDirection,
        right,
        up,
        center,
        offsetX + padding,
        offsetY + padding,
        frameResolution,
        radius,
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
      const shade = THREE.MathUtils.clamp(blade.shade, 0, 1);
      const dryness = THREE.MathUtils.clamp(
        (0.2 - blade.shade) * 0.8,
        0,
        0.22,
      );
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
      // A gradient perpendicular to the projected root edge reproduces the
      // triangle's barycentric root-to-tip coordinate, including leaned views.
      const gradient = context.createLinearGradient(
        baseX,
        baseY,
        baseX + normalX * projectedHeight,
        baseY + normalY * projectedHeight,
      );
      // RGB remains palette-neutral: progress, shade, and optional dry mask.
      // The shared runtime palette reconstructs the display color.
      gradient.addColorStop(0, this.encodeDataColor(0, shade, dryness));
      gradient.addColorStop(
        1,
        this.encodeDataColor(1, shade, dryness * 0.75),
      );
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

  private projectBlade(
    blade: WorldGrassBladeSpec,
    viewDirection: THREE.Vector3,
    right: THREE.Vector3,
    up: THREE.Vector3,
    center: THREE.Vector3,
    frameX: number,
    frameY: number,
    frameResolution: number,
    radius: number,
  ): ProjectedBlade {
    const halfWidth = blade.width * 0.5;
    const widthX = Math.cos(blade.facingAngle) * halfWidth;
    const widthZ = Math.sin(blade.facingAngle) * halfWidth;
    const tipX = blade.rootX + Math.cos(blade.leanAngle) * blade.lean;
    const tipZ = blade.rootZ + Math.sin(blade.leanAngle) * blade.lean;
    const leftX = blade.rootX - widthX;
    const leftZ = blade.rootZ - widthZ;
    const rightRootX = blade.rootX + widthX;
    const rightRootZ = blade.rootZ + widthZ;
    this.projectPoint(
      leftX,
      0,
      leftZ,
      right,
      up,
      center,
      frameX,
      frameY,
      frameResolution,
      radius,
    );
    let projectedLeftX = this.projectedPoint[0];
    let projectedLeftY = this.projectedPoint[1];
    this.projectPoint(
      rightRootX,
      0,
      rightRootZ,
      right,
      up,
      center,
      frameX,
      frameY,
      frameResolution,
      radius,
    );
    let projectedRightX = this.projectedPoint[0];
    let projectedRightY = this.projectedPoint[1];
    this.projectPoint(
      tipX,
      blade.height,
      tipZ,
      right,
      up,
      center,
      frameX,
      frameY,
      frameResolution,
      radius,
    );
    const projectedTipX = this.projectedPoint[0];
    const projectedTipY = this.projectedPoint[1];

    const deltaX = projectedRightX - projectedLeftX;
    const deltaY = projectedRightY - projectedLeftY;
    const width = Math.hypot(deltaX, deltaY);
    if (width < MIN_PIXEL_BASE_WIDTH) {
      const centerX = (projectedLeftX + projectedRightX) * 0.5;
      const centerY = (projectedLeftY + projectedRightY) * 0.5;
      const directionX = width > 1e-5 ? deltaX / width : 1;
      const directionY = width > 1e-5 ? deltaY / width : 0;
      const halfWidth = MIN_PIXEL_BASE_WIDTH * 0.5;
      projectedLeftX = centerX - directionX * halfWidth;
      projectedLeftY = centerY - directionY * halfWidth;
      projectedRightX = centerX + directionX * halfWidth;
      projectedRightY = centerY + directionY * halfWidth;
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

  private projectPoint(
    pointX: number,
    pointY: number,
    pointZ: number,
    right: THREE.Vector3,
    up: THREE.Vector3,
    center: THREE.Vector3,
    frameX: number,
    frameY: number,
    frameResolution: number,
    radius: number,
  ): void {
    const localX = pointX - center.x;
    const localY = pointY - center.y;
    const localZ = pointZ - center.z;
    const inverseDiameter = 1 / (radius * 2);
    this.projectedPoint[0] =
      frameX +
      (0.5 +
        (localX * right.x + localY * right.y + localZ * right.z) *
          inverseDiameter) *
        frameResolution;
    this.projectedPoint[1] =
      frameY +
      (0.5 -
        (localX * up.x + localY * up.y + localZ * up.z) * inverseDiameter) *
        frameResolution;
  }

  private decodeHemiOctahedral(u: number, v: number): THREE.Vector3 {
    const squareX = u * 2 - 1;
    const squareY = v * 2 - 1;
    const x = (squareX + squareY) * 0.5;
    const z = (squareX - squareY) * 0.5;
    const y = Math.max(0, 1 - Math.abs(x) - Math.abs(z));
    return new THREE.Vector3(x, y, z).normalize();
  }

  private createGeometry(radius: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          -radius,
          -radius,
          0,
          radius,
          -radius,
          0,
          radius,
          radius,
          0,
          -radius,
          radius,
          0,
        ],
        3,
      ),
    );
    geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2),
    );
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }

  private encodeDataColor(
    bladeProgress: number,
    shade: number,
    dryness: number,
  ): string {
    const red = Math.round(
      THREE.MathUtils.clamp(bladeProgress, 0, 1) * BYTE_MAX,
    );
    const green = Math.round(THREE.MathUtils.clamp(shade, 0, 1) * BYTE_MAX);
    const blue = Math.round(THREE.MathUtils.clamp(dryness, 0, 1) * BYTE_MAX);
    return `rgb(${red}, ${green}, ${blue})`;
  }
}
