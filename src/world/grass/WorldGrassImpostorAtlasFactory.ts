import * as THREE from "three";
import type {
  GrassGeometryConfig,
  GrassImpostorConfig,
  GrassMaterialConfig,
} from "../../grass/GrassConfig";
import type { WorldGrassBladeSpec } from "./WorldGrassPatchGeometryFactory";

export interface WorldGrassImpostorAtlas {
  texture: THREE.CanvasTexture;
  geometry: THREE.BufferGeometry;
  centerHeight: number;
  radius: number;
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
// Sub-pixel roots disappear under linear sampling at far distances and leave
// a smooth color wash. Keep a one-pixel footprint so the impostor retains the
// same vertical blade rhythm as the mid geometry at the crossfade.
const MIN_PIXEL_BASE_WIDTH = 1.05;
const COLOR_MIN = 0;
const COLOR_MAX = 1;

export class WorldGrassImpostorAtlasFactory {
  private readonly projectedPoint = new Float64Array(2);

  create(
    blades: readonly WorldGrassBladeSpec[],
    grass: GrassGeometryConfig,
    material: GrassMaterialConfig,
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
      throw new Error("Unable to create the grass impostor atlas canvas context.");
    }

    let maximumHeight = grass.bladeHeightMax;
    for (const blade of blades) {
      maximumHeight = Math.max(maximumHeight, blade.height);
    }
    const centerHeight = maximumHeight * 0.5;
    const halfPatch = patchSize * 0.5;
    const radius =
      Math.sqrt(halfPatch * halfPatch * 2 + centerHeight * centerHeight) *
      config.cameraMargin;

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
          material,
          direction,
          gridX * cellSize,
          canvasRow * cellSize,
          config.frameResolution,
          config.padding,
          centerHeight,
          radius,
        );
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.name = "world-grass-hemi-octahedral-atlas";
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;

    return {
      texture,
      geometry: this.createGeometry(radius),
      centerHeight,
      radius,
      viewsPerAxis: config.viewsPerAxis,
      frameResolution: config.frameResolution,
      padding: config.padding,
      atlasSize,
    };
  }

  private drawFrame(
    context: CanvasRenderingContext2D,
    blades: readonly WorldGrassBladeSpec[],
    material: GrassMaterialConfig,
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

    const baseColor = new THREE.Color(material.baseColor);
    const tipColor = new THREE.Color(material.tipColor);
    const dryColor = new THREE.Color(material.dryColor);
    const root = new THREE.Color();
    const tip = new THREE.Color();

    for (const blade of projected) {
      const shadeScale = 0.72 + blade.shade * 0.38;
      const dryAmount = THREE.MathUtils.clamp((0.2 - blade.shade) * 0.8, 0, 0.22);
      root
        .copy(baseColor)
        .lerp(dryColor, dryAmount)
        .multiplyScalar(shadeScale * material.rootDarkening);
      tip
        .copy(tipColor)
        .lerp(dryColor, dryAmount * 0.75)
        .multiplyScalar(shadeScale);
      this.clampColor(root);
      this.clampColor(tip);

      const gradient = context.createLinearGradient(
        (blade.leftX + blade.rightX) * 0.5,
        (blade.leftY + blade.rightY) * 0.5,
        blade.tipX,
        blade.tipY,
      );
      gradient.addColorStop(0, `#${root.getHexString()}`);
      gradient.addColorStop(1, `#${tip.getHexString()}`);
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

  private clampColor(color: THREE.Color): void {
    color.r = THREE.MathUtils.clamp(color.r, COLOR_MIN, COLOR_MAX);
    color.g = THREE.MathUtils.clamp(color.g, COLOR_MIN, COLOR_MAX);
    color.b = THREE.MathUtils.clamp(color.b, COLOR_MIN, COLOR_MAX);
  }
}
