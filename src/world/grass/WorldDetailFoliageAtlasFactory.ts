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
 * | B | accent-tint mask: 1 on petals and seed clusters, 0 on stems and leaves |
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
 * Two rows of the same eight species, drawn from different seeds. The variant
 * is a per-instance row like the biome and the tint, so a second silhouette per
 * species costs one atlas row and no draw, program, or attribute.
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
      case "tall-tuft":
        this.drawTuft(context, random, 9, 0.95, 0.34);
        break;
      case "fern":
        this.drawFrond(context, random, 1, 0, 0.98);
        break;
      case "small-fern":
        this.drawFrond(context, random, 0.68, -0.42, 0.72);
        this.drawFrond(context, random, 0.66, 0.44, 0.7);
        break;
      case "daisy":
        this.drawDaisy(context, random);
        break;
      case "round-bloom":
        this.drawRoundBloom(context, random);
        break;
      case "seed-head":
        this.drawSeedHead(context, random);
        break;
      case "sprig":
        this.drawSprig(context, random);
        break;
      default:
        throw new Error(
          `No detail foliage drawing routine for species ${species.key}.`,
        );
    }

    // `restore` returns both the clip region and the card-space transform.
    context.restore();
  }

  /**
   * A fan of tapered blades sharing a root. `spread` is the half-angle in
   * radians and `width` the horizontal reach as a fraction of the card.
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
      const bladeHeight = height * random.range(0.6, 1) * (1 - Math.abs(side) * 0.22);
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
   * the tip. Ferns carry no tint mask and sit a shade darker than the tufts,
   * which is what separates them from grass at a glance.
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
      const length = (1 - along * 0.8) * 0.4 * scale * random.range(0.85, 1.1);
      const thickness = length * 0.42;
      // Pinnae reach outwards from the stem, drooping further towards the tip.
      // They are drawn along the local +x axis, so the left side is the same
      // rotation mirrored through π rather than a negated angle.
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
        context.ellipse(length * 0.5, 0, length * 0.5, thickness * 0.5, 0, 0, Math.PI * 2);
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
    const halfWidth = 0.016;
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
    context.quadraticCurveTo(lean * 0.35 - halfWidth * 0.5, height * 0.6, -halfWidth, 0);
    context.closePath();
    context.fill();

    for (const direction of [-1, 1]) {
      const along = random.range(0.22, 0.46);
      context.save();
      context.translate(lean * along * along, height * along);
      context.rotate(direction * random.range(0.6, 1.1));
      context.fillStyle = encode(0.4, shade * random.range(0.95, 1.15), 0);
      context.beginPath();
      context.ellipse(direction * 0.07, 0, 0.09, 0.028, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
  }

  private drawDaisy(
    context: CanvasRenderingContext2D,
    random: SeededRandom,
  ): void {
    const height = random.range(0.7, 0.8);
    const lean = random.range(-0.08, 0.08);
    this.drawStem(context, random, height, lean, random.range(0.34, 0.48));
    const centerX = lean;
    const centerY = height;
    const petals = 9;
    const petalLength = random.range(0.15, 0.19);
    for (let index = 0; index < petals; index += 1) {
      const angle = (index / petals) * Math.PI * 2 + random.range(-0.08, 0.08);
      context.save();
      context.translate(centerX, centerY);
      context.rotate(angle);
      // Petals are the accent: B = 1 hands them entirely to the per-instance
      // tint, so one atlas cell is a white, pink, or lavender daisy.
      context.fillStyle = encode(0.9, 0.9, 1);
      context.beginPath();
      context.ellipse(
        petalLength * 0.55,
        0,
        petalLength * 0.55,
        petalLength * 0.24,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
    }
    context.fillStyle = encode(0.75, 0.8, 0.6);
    context.beginPath();
    context.arc(centerX, centerY, petalLength * 0.34, 0, Math.PI * 2);
    context.fill();
  }

  private drawRoundBloom(
    context: CanvasRenderingContext2D,
    random: SeededRandom,
  ): void {
    const height = random.range(0.66, 0.76);
    const lean = random.range(-0.1, 0.1);
    this.drawStem(context, random, height, lean, random.range(0.32, 0.46));
    const radius = random.range(0.13, 0.16);
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2 + random.range(-0.12, 0.12);
      context.fillStyle = encode(0.85 + index * 0.02, 0.82, 1);
      context.beginPath();
      context.arc(
        lean + Math.cos(angle) * radius * 0.5,
        height + Math.sin(angle) * radius * 0.5,
        radius * 0.62,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    context.fillStyle = encode(0.7, 0.5, 0.35);
    context.beginPath();
    context.arc(lean, height, radius * 0.24, 0, Math.PI * 2);
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
      // Two staggered files up the stem read as a cluster; one file with a wide
      // jitter read as a zigzag.
      const seedX =
        lean * (0.6 + along * 0.4) +
        (index % 2 === 0 ? -1 : 1) * 0.022 +
        random.range(-0.008, 0.008);
      context.save();
      context.translate(seedX, seedY);
      context.rotate((index % 2 === 0 ? -1 : 1) * random.range(0.3, 0.7));
      // Seed clusters take the tint too, which is what turns the same cell into
      // straw heads on the steppe and pale ones in the meadow.
      context.fillStyle = encode(0.95, 0.78, 1);
      context.beginPath();
      context.ellipse(0, 0, 0.038, 0.016, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
  }

  private drawSprig(
    context: CanvasRenderingContext2D,
    random: SeededRandom,
  ): void {
    for (let stem = 0; stem < 3; stem += 1) {
      const lean = (stem - 1) * random.range(0.1, 0.18);
      const height = random.range(0.55, 0.85);
      const shade = random.range(0.38, 0.6);
      this.drawStem(context, random, height, lean, shade);
      for (let leaf = 0; leaf < 2; leaf += 1) {
        const along = 0.55 + leaf * 0.22;
        context.save();
        context.translate(lean * along * along, height * along);
        context.rotate((leaf % 2 === 0 ? 1 : -1) * random.range(0.5, 1));
        context.fillStyle = encode(0.6, shade, 0);
        context.beginPath();
        context.ellipse(0.05, 0, 0.06, 0.02, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
    }
  }
}

/**
 * `?accentAtlas=1` debug route: bakes the atlas and pins the canvas to the page
 * so all sixteen cells can be eyeballed, mirroring `?grassImpostorBake=1`. The
 * checkerboard behind it is what makes premultiplied alpha edges visible.
 */
export function appendDetailFoliageAtlasDebugCanvas(
  atlas: WorldDetailFoliageAtlas,
): void {
  const canvas = atlas.canvas;
  canvas.style.position = "fixed";
  canvas.style.left = "8px";
  canvas.style.top = "8px";
  canvas.style.zIndex = "20";
  canvas.style.width = `${Math.min(atlas.width, 1024)}px`;
  canvas.style.imageRendering = "pixelated";
  canvas.style.background =
    "repeating-conic-gradient(#444 0% 25%, #666 0% 50%) 50% / 16px 16px";
  document.body.appendChild(canvas);
}
