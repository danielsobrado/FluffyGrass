import * as THREE from "three";
import type { GrassGeometryConfig } from "./GrassConfig";
import { SeededRandom } from "./internal/SeededRandom";

const TWO_PI = Math.PI * 2;
const GEOMETRY_SEED_OFFSET = 0x9e3779b9;

interface ClumpShapeConfig {
  bladesPerClump: number;
  bladeSegments: number;
  clumpRadius: number;
  bladeHeightMin: number;
  bladeHeightMax: number;
  bladeWidthMin: number;
  bladeWidthMax: number;
  bladeLeanMin: number;
  bladeLeanMax: number;
}

export interface GrassGeometryVariants {
  near: THREE.BufferGeometry[];
  mid: THREE.BufferGeometry[];
}

export class GrassGeometryFactory {
  createLodVariants(
    config: GrassGeometryConfig,
    seed: number,
  ): GrassGeometryVariants {
    const midConfig: ClumpShapeConfig = {
      bladesPerClump: config.midBladesPerClump,
      bladeSegments: config.midBladeSegments,
      clumpRadius: config.clumpRadius * config.midRadiusScale,
      bladeHeightMin: config.bladeHeightMin * config.midHeightScale,
      bladeHeightMax: config.bladeHeightMax * config.midHeightScale,
      bladeWidthMin: config.bladeWidthMin * config.midWidthScale,
      bladeWidthMax: config.bladeWidthMax * config.midWidthScale,
      bladeLeanMin: config.bladeLeanMin * config.midLeanScale,
      bladeLeanMax: config.bladeLeanMax * config.midLeanScale,
    };

    return {
      near: this.createVariants(config, config.variantCount, seed),
      mid: this.createVariants(
        midConfig,
        config.variantCount,
        seed ^ GEOMETRY_SEED_OFFSET,
      ),
    };
  }

  createInstancedGeometry(
    source: THREE.BufferGeometry,
    variationValues: Float32Array,
    coverageValues?: Float32Array,
    sharedAttributes?: {
      variation: THREE.InstancedBufferAttribute;
      coverage: THREE.InstancedBufferAttribute;
      biome?: THREE.InstancedBufferAttribute;
    },
    biomeValues?: Float32Array,
  ): THREE.InstancedBufferGeometry {
    const geometry = new THREE.InstancedBufferGeometry();
    if (source.index) {
      geometry.setIndex(source.index);
    }

    for (const [name, attribute] of Object.entries(source.attributes)) {
      geometry.setAttribute(name, attribute);
    }

    geometry.setAttribute(
      "instanceVariation",
      sharedAttributes?.variation ??
        new THREE.InstancedBufferAttribute(variationValues, 4),
    );
    const instanceCount = variationValues.length / 4;
    const resolvedCoverage =
      coverageValues ?? new Float32Array(instanceCount).fill(1);
    geometry.setAttribute(
      "instanceCoverage",
      sharedAttributes?.coverage ??
        new THREE.InstancedBufferAttribute(resolvedCoverage, 1),
    );
    // One float per instance selects the palette row. Layers that predate
    // biomes, and the island regression scene, get a zero-filled buffer rather
    // than an unbound attribute: an unbound attribute reads whatever generic
    // value was last set, which is exactly the class of bug per-instance data
    // exists to avoid.
    geometry.setAttribute(
      "instanceBiome",
      sharedAttributes?.biome ??
        new THREE.InstancedBufferAttribute(
          biomeValues ?? new Float32Array(instanceCount),
          1,
        ),
    );
    geometry.boundingBox = source.boundingBox?.clone() ?? null;
    geometry.boundingSphere = source.boundingSphere?.clone() ?? null;
    return geometry;
  }

  disposeInstancedMesh(
    mesh: THREE.InstancedMesh,
    preserveSharedInstanceData = false,
  ): void {
    const geometry = mesh.geometry as THREE.InstancedBufferGeometry;

    // Base attributes and the index are borrowed from a shared LOD variant.
    // Detach them before disposal so streaming one chunk out cannot
    // invalidate the GPU buffers used by every other chunk.
    for (const name of Object.keys(geometry.attributes)) {
      if (
        preserveSharedInstanceData ||
        (name !== "instanceVariation" &&
          name !== "instanceCoverage" &&
          name !== "instanceBiome")
      ) {
        geometry.deleteAttribute(name);
      }
    }
    geometry.setIndex(null);
    geometry.dispose();
    // A complementary mesh may still own these same instance attributes. Its
    // final disposal releases the shared GPU buffers; disposing this object now
    // would evict instanceMatrix and force the survivor to upload it again.
    if (!preserveSharedInstanceData) {
      mesh.dispose();
    }
  }

  private createVariants(
    config: ClumpShapeConfig,
    variantCount: number,
    seed: number,
  ): THREE.BufferGeometry[] {
    return Array.from({ length: variantCount }, (_, variantIndex) =>
      this.createClump(config, seed + variantIndex * GEOMETRY_SEED_OFFSET),
    );
  }

  private createClump(
    config: ClumpShapeConfig,
    seed: number,
  ): THREE.BufferGeometry {
    const random = new SeededRandom(seed);
    const positions: number[] = [];
    const uvs: number[] = [];
    const progressValues: number[] = [];
    const phaseValues: number[] = [];
    const shadeValues: number[] = [];
    const indices: number[] = [];

    for (let bladeIndex = 0; bladeIndex < config.bladesPerClump; bladeIndex += 1) {
      const rootAngle = random.range(0, TWO_PI);
      const rootDistance = Math.sqrt(random.next()) * config.clumpRadius;
      const rootX = Math.cos(rootAngle) * rootDistance;
      const rootZ = Math.sin(rootAngle) * rootDistance;
      const facingAngle = rootAngle + random.range(-0.85, 0.85);
      const widthX = Math.cos(facingAngle) * 0.5;
      const widthZ = Math.sin(facingAngle) * 0.5;
      const leanAngle = rootAngle + random.range(-0.65, 0.65);
      const lean = random.range(config.bladeLeanMin, config.bladeLeanMax);
      const leanX = Math.cos(leanAngle) * lean;
      const leanZ = Math.sin(leanAngle) * lean;
      const height = random.range(
        config.bladeHeightMin,
        config.bladeHeightMax,
      );
      const width = random.range(config.bladeWidthMin, config.bladeWidthMax);
      const phase = random.next();
      const shade = random.next();
      const bladeVertexOffset = positions.length / 3;

      for (let segment = 0; segment <= config.bladeSegments; segment += 1) {
        const progress = segment / config.bladeSegments;
        const curve = progress * progress * (3 - 2 * progress);
        const taper = Math.pow(1 - progress, 0.72);
        const halfWidth = width * taper;
        const centerX = rootX + leanX * curve;
        const centerZ = rootZ + leanZ * curve;
        const centerY = height * progress;

        positions.push(
          centerX - widthX * halfWidth,
          centerY,
          centerZ - widthZ * halfWidth,
          centerX + widthX * halfWidth,
          centerY,
          centerZ + widthZ * halfWidth,
        );
        uvs.push(0, progress, 1, progress);
        progressValues.push(progress, progress);
        phaseValues.push(phase, phase);
        shadeValues.push(shade, shade);
      }

      for (let segment = 0; segment < config.bladeSegments; segment += 1) {
        const row = bladeVertexOffset + segment * 2;
        indices.push(row, row + 2, row + 1, row + 2, row + 3, row + 1);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute(
      "grassProgress",
      new THREE.Float32BufferAttribute(progressValues, 1),
    );
    geometry.setAttribute(
      "grassPhase",
      new THREE.Float32BufferAttribute(phaseValues, 1),
    );
    geometry.setAttribute(
      "grassBladeShade",
      new THREE.Float32BufferAttribute(shadeValues, 1),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }
}
