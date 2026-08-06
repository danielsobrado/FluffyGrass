import {
  SUBPATCHES_PER_AXIS,
  calculateSubpatchBoundsRadius,
  createSubpatchCenters,
  createSubpatchGeometry,
  partitionBlades,
} from "./grass-v0.9.6-atlas-geometry.js";
import { createAtlasRasterizer } from "./grass-v0.9.6-atlas-raster.js";

export function createAtlasRuntime(world, templateAtlas) {
  const grass = world.grass;
  const Vector3 = world.camera.position.constructor;
  const Vector2 = grass.previousReconcilePosition.constructor;
  const CanvasTexture = templateAtlas.texture.constructor;
  const BufferGeometry = templateAtlas.geometry.constructor;
  const Float32BufferAttribute =
    templateAtlas.geometry.getAttribute("position").constructor;
  const { decodeHemiOctahedral, drawFrame } = createAtlasRasterizer(Vector3);

  return function createSubpatchAtlas(blades, geometryConfig, patchSize, config) {
    const cellSize = config.frameResolution + config.padding * 2;
    const viewPageSize = config.viewsPerAxis * cellSize;
    const atlasSize = viewPageSize * SUBPATCHES_PER_AXIS;
    const canvas = document.createElement("canvas");
    canvas.width = atlasSize;
    canvas.height = atlasSize;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("Unable to create the v0.9.6 grass atlas canvas context.");
    }

    let maximumHeight = geometryConfig.bladeHeightMax;
    for (const blade of blades) {
      maximumHeight = Math.max(maximumHeight, blade.height);
    }
    const centerHeight = maximumHeight * 0.5;
    const subpatchSize = patchSize / SUBPATCHES_PER_AXIS;
    const halfSubpatch = subpatchSize * 0.5;
    const horizontalExtent =
      Math.SQRT2 * halfSubpatch +
      geometryConfig.bladeLeanMax +
      geometryConfig.bladeWidthMax;
    const cardRadius =
      Math.hypot(horizontalExtent, centerHeight) * config.cameraMargin;
    const boundsRadius = calculateSubpatchBoundsRadius(
      cardRadius,
      centerHeight,
      halfSubpatch,
    );
    const centers = createSubpatchCenters(Vector2, patchSize);
    const partitions = partitionBlades(blades);

    context.clearRect(0, 0, atlasSize, atlasSize);
    for (let subpatchIndex = 0; subpatchIndex < partitions.length; subpatchIndex += 1) {
      const pageX = subpatchIndex % SUBPATCHES_PER_AXIS;
      const pageY = Math.floor(subpatchIndex / SUBPATCHES_PER_AXIS);
      const canvasPageY = SUBPATCHES_PER_AXIS - 1 - pageY;
      const pageOffsetX = pageX * viewPageSize;
      const pageOffsetY = canvasPageY * viewPageSize;
      const subpatchCenter = centers[subpatchIndex];
      const center = new Vector3(
        subpatchCenter.x,
        centerHeight,
        subpatchCenter.y,
      );

      for (let gridY = 0; gridY < config.viewsPerAxis; gridY += 1) {
        for (let gridX = 0; gridX < config.viewsPerAxis; gridX += 1) {
          const direction = decodeHemiOctahedral(
            (gridX + 0.5) / config.viewsPerAxis,
            (gridY + 0.5) / config.viewsPerAxis,
          );
          const canvasRow = config.viewsPerAxis - 1 - gridY;
          drawFrame(
            context,
            partitions[subpatchIndex],
            direction,
            pageOffsetX + gridX * cellSize,
            pageOffsetY + canvasRow * cellSize,
            config.frameResolution,
            config.padding,
            center,
            cardRadius,
          );
        }
      }
    }

    const texture = new CanvasTexture(canvas);
    texture.name = "world-grass-subpatch-hemi-octahedral-atlas";
    texture.colorSpace = templateAtlas.texture.colorSpace;
    texture.premultiplyAlpha = true;
    texture.wrapS = templateAtlas.texture.wrapS;
    texture.wrapT = templateAtlas.texture.wrapT;
    texture.minFilter = templateAtlas.texture.minFilter;
    texture.magFilter = templateAtlas.texture.magFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 4;
    texture.needsUpdate = true;

    return {
      texture,
      geometry: createSubpatchGeometry(
        BufferGeometry,
        Float32BufferAttribute,
        cardRadius,
        centers,
      ),
      centerHeight,
      radius: boundsRadius,
      cardRadius,
      viewsPerAxis: config.viewsPerAxis,
      subpatchesPerAxis: SUBPATCHES_PER_AXIS,
      frameResolution: config.frameResolution,
      padding: config.padding,
      atlasSize,
    };
  };
}
