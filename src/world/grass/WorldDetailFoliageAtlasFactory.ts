import * as THREE from "three";
import {
  GRASS_ACCENT_SPECIES,
  type GrassAccentSpeciesDefinition,
} from "../../grass/biome/GrassAccentSpecies";
import { SeededRandom } from "../../grass/internal/SeededRandom";

/**
 * Bakes the detail-foliage atlas with Canvas 2D at init, exactly as
 * {@link WorldGrassImpostorAtlasFactory} bakes the impostor atlas.
 *
 * The channels are semantic, not display colour — the same decision that keeps
 * the impostors preset- and biome-consistent for free:
 *
 * | channel | meaning |
 * | --- | --- |
 * | R | root-to-tip progress, fed to `grassResolvePalette` |
 * | G | per-shape shade, fed to the same palette |
 * | B | accent-tint strength on petals and seed clusters |
 * | A | coverage; premultiplied, mipped, and cut with a distance-compensated test |
 *
 * Nothing here is derived from reference imagery: every cell is drawn from a
 * seeded routine, so the atlas is deterministic, recolourable through the
 * shared palette, and carries no third-party licence.
 */

/** Drawn pixels per cell, before padding. */
export const DETAIL_FOLIAGE_CELL_RESOLUTION = 112;
/**
 * Transparent gutter around each cell. Coarse mip levels average across cell
 * boundaries; the gutter plus the shader's half-texel UV clamp keeps a species
 * from bleeding its neighbour's silhouette at distance.
 */
export const DETAIL_FOLIAGE_CELL_PADDING = 8;
/**
 * Two phenotype rows per species. Flower rows deliberately differ in petal
 * count, stem proportion, bloom scale, and asymmetry rather than merely changing
 * their random seed. That gives each species a recognizable family without
 * cloning one silhouette across the field.
 */
export const DETAIL_FOLIAGE_VARIANT_ROWS = 2;

export interface WorldDetailFoliageAtlas {
  texture: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
  species: readonly GrassAccentSpeciesDefinition[];
  columns: number;
  variantRows: number;
  cellResolution: number;
  padding: number;
  width: number;
  height: number;
}

const ATLAS_SEED = 0x5f_35_6d_11;
const BYTE_MAX = 255;

function encode(
  progress: number,
  shade: number,
  tintMask: number,
  alpha = 1,
): string {
  const red = Math.round(THREE.MathUtils.clamp(progress, 0, 1) * BYTE_MAX);
  const green = Math.round(THREE.MathUtils.clamp(shade, 0, 1) * BYTE_MAX);
  const blue = Math.round(THREE.MathUtils.clamp(tintMask, 0, 1) * BYTE_MAX);
  return `rgba(${red}, ${green}, ${blue}, ${THREE.MathUtils.clamp(alpha, 0, 1)})`;
}

export class WorldDetailFoliageAtlasFactory {
  create(): WorldDetailFoliageAtlas {
    const cellSize =
      DETAIL_FOLIAGE_CELL_RESOLUTION + DETAIL_FOLIAGE_CELL_PADDING * 2;
    const columns = GRASS_ACCENT_SPECIES.length;
    const width = columns * cellSize;
    const height = DETAIL_FOLIAGE_VARIANT_ROWS * cellSize;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error(
        "Unable to create the detail foliage atlas canvas context.",
      );
    }
    context.clearRect(0, 0, width, height);

    for (let row = 0; row < DETAIL_FOLIAGE_VARIANT_ROWS; row += 1) {
      for (const species of GRASS_ACCENT_SPECIES) {
        this.drawCell(context, species, species.index, row, cellSize);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.name = "world-grass-detail-foliage-atlas";
    // RGB stores progress, shade, and the tint mask, never display colour.
    texture.colorSpace = THREE.NoColorSpace;
    // Keep the semantic channels alpha-weighted through filtering; the shader
    // divides once after the fetch, as the impostor shader does.
    texture.premultiplyAlpha = true;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 4;
    texture.needsUpdate = true;

    return {
      texture,
      canvas,
      species: GRASS_ACCENT_SPECIES,
      columns,
      variantRows: DETAIL_FOLIAGE_VARIANT_ROWS,
      cellResolution: DETAIL_FOLIAGE_CELL_RESOLUTION,
      padding: DETAIL_FOLIAGE_CELL_PADDING,
      width,
      height,
    };
  }

  private drawCell(
    context: CanvasRenderingContext2D,
    species: GrassAccentSpeciesDefinition,
    column: number,
    row: number,
    cellSize: number,
  ): void {
    const resolution = DETAIL_FOLIAGE_CELL_RESOLUTION;
    const originX = column * cellSize + DETAIL_FOLIAGE_CELL_PADDING;
    const originY = row * cellSize + DETAIL_FOLIAGE_CELL_PADDING;
    const random = new SeededRandom(
      (ATLAS_SEED ^ (species.index * 0x9e3779b9) ^ (row * 0x85ebca6b)) >>> 0,
    );

    context.save();
    context.beginPath();
    context.rect(originX, originY, resolution, resolution);
    context.clip();
    // Draw in card space: x spans the card's own width (its aspect, in units of
    // card height) and y runs 0 at the root to 1 at the top, upwards. The
    // non-uniform scale is what lets each routine draw round petals as circles
    // and still have them render round on a card that is not square.
    context.setTransform(
      resolution / species.aspect,
      0,
      0,
      -resolution,
      originX + resolution * 0.5,
      originY + resolution,
    );

    switch (species.key) {
      case "grass-tuft":
        this.drawTuft(context, random, 11, 0.78, 0.62);
        break;
      case "low-shrub":
        this.drawLowShrub(context, random, row);
        break;
      case "fern":
        this.drawFrond(context, random, 1, 0, 0.98);
        break;
      case "small-fern":
        this.drawFrond(context, random, 0.68, -0.42, 0.72);
        this.drawFrond(context, random, 0.66, 0.44, 0.7);
        break;
      case "daisy":
        this.drawDaisy(context, random, row);
        break;
      case "round-bloom":
        this.drawRoundBloom(context, random, row);
        break;
      case "seed-head":
        this.drawSeedHead(context, random);
        break;
      case "broadleaf-rosette":
        this.drawBroadleafRosette(context, random, row);
        break;
      default:
        throw new Error(
          `No detail foliage drawing routine for species ${species.key}.`,
        );
    }

    context.restore();
  }

  /**
   * A fan of tapered blades sharing a root. `width` is the horizontal reach as
   * a fraction of the card.
   */
  private drawTuft(
    context: CanvasRenderingContext2D,
    random: SeededRandom,
    blades: number,
    height: number,
    width: number,
  ): void {
    for (let index = 0; index < blades; index += 1) {
      const side = (index / Math.max(1, blades - 1)) * 2 - 1;
      const lean = side * width * 0.5 * random.range(0.6, 1.15);
      const bladeHeight =
        height * random.range(0.6, 1) * (1 - Math.abs(side) * 0.22);
      const halfWidth = width * random.range(0.03, 0.05);
      const rootX = side * width * 0.06;
      const shade = random.range(0.4, 0.75);
      this.fillBlade(context, rootX, bladeHeight, halfWidth, lean, shade);
    }
  }

  /** One tapered blade, root at `rootX`, tip at `rootX + lean`. */
  private fillBlade(
    context: CanvasRenderingContext2D,
    rootX: number,
    height: number,
    halfWidth: number,
    lean: number,
    shade: number,
  ): void {
    const gradient = context.createLinearGradient(rootX, 0, rootX + lean, height);
    gradient.addColorStop(0, encode(0, shade * 0.86, 0));
    gradient.addColorStop(1, encode(1, shade, 0));
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(rootX - halfWidth, 0);
    context.lineTo(rootX + halfWidth, 0);
    context.lineTo(rootX + lean + halfWidth * 0.12, height);
    context.lineTo(rootX + lean - halfWidth * 0.12, height);
    context.closePath();
    context.fill();
  }

  /**
   * A fern frond: a curved central stem with pinnae pairs that shrink toward
   * the tip. Ferns carry no tint mask and sit a shade darker than the tufts.
   */
  private drawFrond(
    context: CanvasRenderingContext2D,
    random: SeededRandom,
    scale: number,
    baseX: number,
    curve: number,
  ): void {
    const height = 0.94 * scale;
    const tipLean = curve * 0.16 * scale;
    const shade = random.range(0.26, 0.4);
    const pinnaeShade = shade + 0.08;
    context.fillStyle = encode(0.35, shade, 0);
    context.beginPath();
    context.moveTo(baseX - 0.012 * scale, 0);
    context.quadraticCurveTo(
      baseX + tipLean * 0.4,
      height * 0.55,
      baseX + tipLean,
      height,
    );
    context.lineTo(baseX + tipLean, height);
    context.quadraticCurveTo(
      baseX + tipLean * 0.4 + 0.012 * scale,
      height * 0.55,
      baseX + 0.012 * scale,
      0,
    );
    context.closePath();
    context.fill();

    const pairs = 9;
    for (let index = 0; index < pairs; index += 1) {
      const along = 0.12 + (index / pairs) * 0.84;
      const stemX = baseX + tipLean * along * along;
      const stemY = height * along;
      const length =
        (1 - along * 0.8) * 0.4 * scale * random.range(0.85, 1.1);
      const thickness = length * 0.42;
      const droop = 0.18 + along * 0.35;
      const progress = 0.3 + along * 0.7;
      for (const direction of [-1, 1]) {
        context.save();
        context.translate(stemX, stemY);
        context.rotate(direction > 0 ? -droop : Math.PI + droop);
        context.fillStyle = encode(
          progress,
          pinnaeShade * random.range(0.9, 1.1),
          0,
        );
        context.beginPath();
        context.ellipse(
          length * 0.5,
          0,
          length * 0.5,
          thickness * 0.5,
          0,
          0,
          Math.PI * 2,
        );
        context.fill();
        context.restore();
      }
    }
  }

  /** A stem with two small leaves, shared by the flowering species. */
  private drawStem(
    context: CanvasRenderingContext2D,
    random: SeededRandom,
    height: number,
    lean: number,
    shade: number,
  ): void {
    const halfWidth = random.range(0.011, 0.019);
    context.fillStyle = encode(0.25, shade, 0);
    context.beginPath();
    context.moveTo(-halfWidth, 0);
    context.lineTo(halfWidth, 0);
    context.quadraticCurveTo(
      lean * 0.35 + halfWidth * 0.5,
      height * 0.6,
      lean + halfWidth * 0.4,
      height,
    );
    context.lineTo(lean - halfWidth * 0.4, height);
    context.quadraticCurveTo(
      lean * 0.35 - halfWidth * 0.5,
      height * 0.6,
      -halfWidth,
      0,
    );
    context.closePath();
    context.fill();

    const leafCount = random.next() < 0.28 ? 1 : 2;
    for (let leaf = 0; leaf < leafCount; leaf += 1) {
      const direction = leaf % 2 === 0 ? -1 : 1;
      const along = random.range(0.2, 0.52);
      const leafLength = random.range(0.07, 0.11);
      context.save();
      context.translate(lean * along * along, height * along);
      context.rotate(direction * random.range(0.55, 1.15));
      context.fillStyle = encode(
        0.35 + along * 0.2,
        shade * random.range(0.9, 1.12),
        0,
      );
      context.beginPath();
      context.ellipse(
        direction * leafLength * 0.55,
        0,
        leafLength * 0.55,
        leafLength * random.range(0.18, 0.3),
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
    }
  }

  /**
   * A tapered petal with a semantic shade and tint-strength gradient. Keeping
   * the tint mask below one near the flower centre lets the palette underneath
   * provide natural depth instead of replacing every petal with one flat RGB.
   */
  private fillPetal(
    context: CanvasRenderingContext2D,
    length: number,
    halfWidth: number,
    baseShade: number,
    tipShade: number,
    baseTint: number,
    tipTint: number,
  ): void {
    const gradient = context.createLinearGradient(0, 0, length, 0);
    gradient.addColorStop(0, encode(0.72, baseShade, baseTint));
    gradient.addColorStop(
      0.55,
      encode(0.9, (baseShade + tipShade) * 0.5, (baseTint + tipTint) * 0.5),
    );
    gradient.addColorStop(1, encode(1, tipShade, tipTint));
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(0, 0);
    context.bezierCurveTo(
      length * 0.16,
      -halfWidth * 0.9,
      length * 0.68,
      -halfWidth * 1.08,
      length,
      0,
    );
    context.bezierCurveTo(
      length * 0.7,
      halfWidth,
      length * 0.18,
      halfWidth * 0.82,
      0,
      0,
    );
    context.closePath();
    context.fill();

    context.strokeStyle = encode(
      0.84,
      baseShade * 0.72,
      Math.max(0.65, baseTint - 0.08),
      0.42,
    );
    context.lineWidth = Math.max(0.0022, halfWidth * 0.11);
    context.beginPath();
    context.moveTo(length * 0.08, 0);
    context.quadraticCurveTo(length * 0.5, halfWidth * 0.08, length * 0.86, 0);
    context.stroke();
  }

  private drawCalyx(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    shade: number,
  ): void {
    context.fillStyle = encode(0.6, shade, 0);
    for (const offset of [-0.5, 0, 0.5]) {
      context.save();
      context.translate(x, y - radius * 0.04);
      context.rotate(-Math.PI * 0.5 + offset);
      context.beginPath();
      context.ellipse(
        radius * 0.2,
        0,
        radius * 0.24,
        radius * 0.07,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
    }
  }

  private drawDaisy(
    context: CanvasRenderingContext2D,
    random: SeededRandom,
    variant: number,
  ): void {
    const narrow = variant % 2 === 1;
    const height = narrow
      ? random.range(0.78, 0.93)
      : random.range(0.62, 0.78);
    const lean = random.range(narrow ? -0.08 : -0.14, narrow ? 0.08 : 0.14);
    const stemShade = random.range(0.32, 0.5);
    this.drawStem(context, random, height, lean, stemShade);

    const centerX = lean;
    const centerY = height;
    const petals = Math.round(
      narrow ? random.range(10, 14) : random.range(7, 10),
    );
    const petalLength = narrow
      ? random.range(0.07, 0.095)
      : random.range(0.09, 0.12);
    this.drawCalyx(
      context,
      centerX,
      centerY,
      petalLength,
      stemShade * random.range(0.8, 1.05),
    );

    for (let index = 0; index < petals; index += 1) {
      // An occasional shorter or missing petal breaks the perfect gear shape.
      if (index > 0 && random.next() < 0.055) {
        continue;
      }
      const angle =
        (index / petals) * Math.PI * 2 + random.range(-0.11, 0.11);
      const length = petalLength * random.range(0.76, 1.18);
      const halfWidth =
        length *
        (narrow ? random.range(0.12, 0.17) : random.range(0.2, 0.28));
      context.save();
      context.translate(centerX, centerY);
      context.rotate(angle);
      this.fillPetal(
        context,
        length,
        halfWidth,
        random.range(0.55, 0.72),
        random.range(0.86, 1),
        random.range(0.78, 0.88),
        random.range(0.94, 1),
      );
      context.restore();
    }

    const centerRadius = petalLength * (narrow ? 0.25 : 0.31);
    context.fillStyle = encode(0.68, 0.42, 0.18);
    context.beginPath();
    context.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = encode(0.84, 0.7, 0.34);
    context.beginPath();
    context.arc(centerX, centerY, centerRadius * 0.68, 0, Math.PI * 2);
    context.fill();

    const centerDots = narrow ? 7 : 5;
    for (let index = 0; index < centerDots; index += 1) {
      const angle = (index / centerDots) * Math.PI * 2 + random.range(-0.2, 0.2);
      context.fillStyle = encode(0.95, random.range(0.72, 0.95), 0.42);
      context.beginPath();
      context.arc(
        centerX + Math.cos(angle) * centerRadius * 0.46,
        centerY + Math.sin(angle) * centerRadius * 0.46,
        centerRadius * random.range(0.08, 0.13),
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }

  private drawRoundBloom(
    context: CanvasRenderingContext2D,
    random: SeededRandom,
    variant: number,
  ): void {
    const branched = variant % 2 === 1;
    const height = branched
      ? random.range(0.76, 0.92)
      : random.range(0.6, 0.8);
    const lean = random.range(-0.16, 0.16);
    const stemShade = random.range(0.3, 0.47);
    this.drawStem(context, random, height, lean, stemShade);

    if (branched) {
      const side = random.next() < 0.5 ? -1 : 1;
      const branchStart = 0.58;
      const budX = lean * branchStart * branchStart + side * random.range(0.09, 0.14);
      const budY = height * random.range(0.62, 0.73);
      context.fillStyle = encode(0.38, stemShade * 0.92, 0);
      context.beginPath();
      context.moveTo(
        lean * branchStart * branchStart - 0.008,
        height * branchStart,
      );
      context.quadraticCurveTo(
        budX - side * 0.035,
        budY - 0.035,
        budX,
        budY,
      );
      context.lineTo(budX + side * 0.008, budY + 0.002);
      context.quadraticCurveTo(
        budX - side * 0.025,
        budY - 0.025,
        lean * branchStart * branchStart + 0.008,
        height * branchStart,
      );
      context.closePath();
      context.fill();
      context.save();
      context.translate(budX, budY);
      context.rotate(side * random.range(0.35, 0.7));
      context.fillStyle = encode(0.86, random.range(0.48, 0.66), 0.82);
      context.beginPath();
      context.ellipse(0, 0, 0.025, 0.04, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    const centerX = lean;
    const centerY = height;
    const petalCount = Math.round(
      branched ? random.range(5, 7) : random.range(4, 6),
    );
    const petalLength = branched
      ? random.range(0.075, 0.1)
      : random.range(0.095, 0.13);
    this.drawCalyx(
      context,
      centerX,
      centerY,
      petalLength,
      stemShade * random.range(0.82, 1.08),
    );

    for (let index = 0; index < petalCount; index += 1) {
      const angle =
        (index / petalCount) * Math.PI * 2 + random.range(-0.16, 0.16);
      const length = petalLength * random.range(0.78, 1.16);
      const halfWidth = length * random.range(0.28, 0.39);
      context.save();
      context.translate(centerX, centerY);
      context.rotate(angle);
      context.scale(1, random.range(0.88, 1.08));
      this.fillPetal(
        context,
        length,
        halfWidth,
        random.range(0.4, 0.6),
        random.range(0.72, 0.92),
        random.range(0.76, 0.88),
        random.range(0.9, 0.98),
      );
      context.restore();
    }

    const centerRadius = petalLength * random.range(0.2, 0.27);
    context.fillStyle = encode(0.62, 0.28, 0.12);
    context.beginPath();
    context.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = encode(0.78, 0.48, 0.24);
    context.beginPath();
    context.arc(centerX, centerY, centerRadius * 0.58, 0, Math.PI * 2);
    context.fill();
  }

  private drawLowShrub(
    context: CanvasRenderingContext2D,
    random: SeededRandom,
    variant: number,
  ): void {
    const mature = variant % 2 === 1;
    const branchCount = mature
      ? Math.round(random.range(6, 8))
      : 5;
    const leafCount = Math.round(
      mature ? random.range(12, 19) : random.range(14, 21),
    );
    const holeCount = mature ? 2 : 1;
    const holeAngles: number[] = [];
    for (let hole = 0; hole < holeCount; hole += 1) {
      holeAngles.push(random.range(-Math.PI * 0.45, Math.PI * 0.45));
    }
    const centerShade = random.range(0.22, 0.34);
    context.fillStyle = encode(0.18, centerShade, 0);
    context.beginPath();
    context.ellipse(
      random.range(-0.04, 0.05),
      0.16,
      mature ? 0.16 : 0.2,
      mature ? 0.12 : 0.16,
      random.range(-0.2, 0.2),
      0,
      Math.PI * 2,
    );
    context.fill();

    const aspect = 1.2;
    const span = mature ? 0.45 : 0.32;
    for (let index = 0; index < branchCount; index += 1) {
      const along = index / Math.max(1, branchCount - 1);
      const centerX =
        (along * 2 - 1) * span * aspect + random.range(-0.05, 0.05);
      const top = mature
        ? random.range(0.48, 0.92)
        : random.range(0.55, 0.86);
      const lean = centerX * random.range(0.15, 0.42);
      const shade = random.range(0.28, 0.42);
      context.fillStyle = encode(0.22, shade, 0);
      context.beginPath();
      context.moveTo(centerX * 0.12 - 0.018, 0);
      context.quadraticCurveTo(
        centerX * 0.55,
        top * 0.48,
        centerX + lean * 0.2,
        top,
      );
      context.lineTo(centerX + lean * 0.2 + 0.012, top);
      context.quadraticCurveTo(
        centerX * 0.55 + 0.01,
        top * 0.48,
        centerX * 0.12 + 0.018,
        0,
      );
      context.closePath();
      context.fill();
    }

    for (let index = 0; index < leafCount; index += 1) {
      const along = mature
        ? random.range(0.22, 0.94)
        : random.next() ** 1.35 * 0.85 + 0.12;
      const side = random.range(-span, span) * aspect;
      const angle = Math.atan2(along - 0.18, side);
      let blocked = false;
      for (const hole of holeAngles) {
        if (Math.abs(angle - hole) < 0.38) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        continue;
      }
      const length = mature
        ? random.range(0.1, 0.18)
        : random.range(0.08, 0.16);
      const width = length * random.range(0.38, mature ? 0.6 : 0.58);
      const leafX = side * (0.35 + along * 0.7) + random.range(-0.03, 0.03);
      const leafY = along;
      context.save();
      context.translate(leafX, leafY);
      context.rotate(angle + random.range(-0.35, 0.35));
      this.fillTaperedLeaf(
        context,
        length,
        width,
        0.35 + along * 0.6,
        random.range(0.34, 0.58) * (along > 0.7 ? 1.08 : 0.92),
      );
      context.restore();
    }

    if (mature) {
      const breakers = Math.round(random.range(1, 3));
      for (let index = 0; index < breakers; index += 1) {
        const side = index % 2 === 0 ? -1 : 1;
        context.save();
        context.translate(
          side * random.range(0.38, 0.52) * aspect,
          random.range(0.42, 0.7),
        );
        context.rotate(side * random.range(0.7, 1.2));
        this.fillTaperedLeaf(
          context,
          random.range(0.12, 0.18),
          random.range(0.05, 0.08),
          random.range(0.7, 0.9),
          random.range(0.42, 0.62),
        );
        context.restore();
      }
    }
  }

  private drawBroadleafRosette(
    context: CanvasRenderingContext2D,
    random: SeededRandom,
    variant: number,
  ): void {
    const mature = variant % 2 === 1;
    const leafCount = mature ? Math.round(random.range(6, 10)) : 7;
    const spacing = (Math.PI * 2) / leafCount;
    const jitter = mature ? 0.28 : 0.18;
    const oneSide = mature ? random.range(0.78, 0.92) : 1;
    const otherSide = mature ? random.range(1, 1.1) : 1;
    const rootX = random.range(-0.04, 0.04);
    const rootY = random.range(0.08, 0.16);
    context.fillStyle = encode(0.12, mature ? 0.28 : 0.22, 0);
    context.beginPath();
    context.ellipse(
      rootX,
      rootY,
      mature ? 0.07 : 0.09,
      mature ? 0.05 : 0.07,
      random.range(-0.2, 0.2),
      0,
      Math.PI * 2,
    );
    context.fill();

    for (let index = 0; index < leafCount; index += 1) {
      const angle =
        -Math.PI * 0.5 + index * spacing + random.range(-jitter, jitter);
      const sideScale = Math.cos(angle) >= 0 ? otherSide : oneSide;
      const length =
        (mature ? random.range(0.28, 0.52) : random.range(0.3, 0.46)) *
        sideScale;
      const width =
        length *
        (mature ? random.range(0.22, 0.36) : random.range(0.22, 0.34));
      const offset = random.range(0, 0.04);
      context.save();
      context.translate(
        rootX + Math.cos(angle) * offset,
        rootY + Math.sin(angle) * offset * 0.4,
      );
      context.rotate(angle + random.range(-0.12, 0.12));
      this.fillTaperedLeaf(
        context,
        length,
        width,
        0.28 + (index / leafCount) * 0.55,
        random.range(0.32, 0.55) * (0.92 + (index % 3) * 0.05),
      );
      context.restore();
    }
  }

  private fillTaperedLeaf(
    context: CanvasRenderingContext2D,
    length: number,
    width: number,
    progress: number,
    shade: number,
  ): void {
    const half = width * 0.5;
    const gradient = context.createLinearGradient(0, 0, length, 0);
    gradient.addColorStop(0, encode(progress * 0.35, shade * 0.78, 0));
    gradient.addColorStop(0.45, encode(progress * 0.72, shade, 0));
    gradient.addColorStop(
      1,
      encode(Math.min(1, progress + 0.18), Math.min(1, shade * 1.12), 0),
    );
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(length * 0.22, half * 0.55, length * 0.58, half);
    context.quadraticCurveTo(length * 0.86, half * 0.42, length, 0);
    context.quadraticCurveTo(length * 0.86, -half * 0.42, length * 0.58, -half);
    context.quadraticCurveTo(length * 0.22, -half * 0.55, 0, 0);
    context.closePath();
    context.fill();
  }

  private drawSeedHead(
    context: CanvasRenderingContext2D,
    random: SeededRandom,
  ): void {
    const height = random.range(0.72, 0.82);
    const lean = random.range(-0.1, 0.1);
    const shade = random.range(0.4, 0.55);
    const halfWidth = 0.014;
    context.fillStyle = encode(0.3, shade, 0);
    context.beginPath();
    context.moveTo(-halfWidth, 0);
    context.lineTo(halfWidth, 0);
    context.quadraticCurveTo(lean * 0.4, height * 0.6, lean, height);
    context.closePath();
    context.fill();

    const seeds = 14;
    for (let index = 0; index < seeds; index += 1) {
      const along = index / (seeds - 1);
      const seedY = height * (0.6 + along * 0.4);
      const seedX =
        lean * (0.6 + along * 0.4) +
        (index % 2 === 0 ? -1 : 1) * 0.022 +
        random.range(-0.008, 0.008);
      context.save();
      context.translate(seedX, seedY);
      context.rotate((index % 2 === 0 ? -1 : 1) * random.range(0.3, 0.7));
      context.fillStyle = encode(0.95, 0.78, 1);
      context.beginPath();
      context.ellipse(0, 0, 0.038, 0.016, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
  }
}
