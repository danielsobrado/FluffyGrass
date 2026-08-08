import * as THREE from "three";
import type { WorldConfig } from "../WorldConfig";
import type { StoneField, StoneInstance } from "./StoneField";
import { STONE_PALETTES, colorizeStoneVertices } from "./StonePalette";

/**
 * Streams stones in around the camera, one merged mesh per terrain chunk.
 *
 * Merging instead of instancing is deliberate: a chunk holds a dozen or two
 * *different* low-poly variants (a few hundred triangles each), so per-variant
 * InstancedMesh would multiply draw calls for no batching win, while one
 * baked mesh per chunk costs a single draw, culls with the chunk's bounds,
 * and lets every instance carry its own palette in vertex colours for free.
 * Rebuilds only happen when a chunk streams in or crosses the detail band, so
 * the merge cost is a streaming cost, not a frame cost.
 */

interface StoneChunk {
  key: string;
  detail: boolean;
  mesh: THREE.Mesh;
  triangles: number;
  stones: number;
}

interface StoneChunkRequest {
  key: string;
  chunkX: number;
  chunkZ: number;
  detail: boolean;
  distance: number;
}

export interface StoneDiagnostics {
  activeChunks: number;
  queuedChunks: number;
  stones: number;
  triangles: number;
  lastBuildMs: number;
  maxBuildMs: number;
}

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Close-range surface grain.
 *
 * The stones are deliberately flat-value art, so this exists only to take the
 * plastic sheen off a facet that fills the screen. Three constraints keep it
 * from fighting the style or the architecture:
 *
 * - It reuses the terrain's own `perlinnoise.webp` in *world* space, so it
 *   adds one already-paid texture bind and no per-stone data. Unique textures
 *   would mean per-stone materials, which is one draw call per stone — the
 *   thing baked vertex colour exists to avoid.
 * - It is triplanar. Stones are convex and flat-shaded with faces pointing
 *   every direction, so a single projection would streak badly on the sides.
 * - It fades out entirely a few metres from the camera. The grain is only ever
 *   answering a close-range problem, and past that distance it would be
 *   sub-pixel noise that aliases as the camera moves.
 *
 * Amplitude is a multiplier on albedo, not a colour: it rides the palette
 * rather than tinting towards one.
 */
const STONE_GRAIN_VERTEX = `
varying vec3 vStoneWorldPosition;
varying vec3 vStoneWorldNormal;
`;

const STONE_GRAIN_POSITION = `
vStoneWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
vStoneWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
`;

const STONE_GRAIN_FRAGMENT = `
uniform sampler2D uStoneGrain;
uniform float uStoneGrainStrength;
uniform float uStoneGrainScale;
uniform vec2 uStoneGrainFade;
varying vec3 vStoneWorldPosition;
varying vec3 vStoneWorldNormal;
`;

const STONE_GRAIN_COLOR = `
float stoneGrainDistance = distance(cameraPosition, vStoneWorldPosition);
float stoneGrainFade = 1.0 - smoothstep(
  uStoneGrainFade.x,
  uStoneGrainFade.y,
  stoneGrainDistance
);
if (stoneGrainFade > 0.001) {
  // Triplanar weights from the face normal, sharpened so a face mostly uses
  // the one projection that suits it rather than a mush of all three.
  vec3 stoneBlend = pow(abs(vStoneWorldNormal), vec3(4.0));
  stoneBlend /= max(stoneBlend.x + stoneBlend.y + stoneBlend.z, 0.0001);
  vec2 stoneUvX = vStoneWorldPosition.zy * uStoneGrainScale;
  vec2 stoneUvY = vStoneWorldPosition.xz * uStoneGrainScale;
  vec2 stoneUvZ = vStoneWorldPosition.xy * uStoneGrainScale;
  float stoneGrain =
    texture2D(uStoneGrain, stoneUvX).r * stoneBlend.x +
    texture2D(uStoneGrain, stoneUvY).r * stoneBlend.y +
    texture2D(uStoneGrain, stoneUvZ).r * stoneBlend.z;
  // The detail texture clusters around the middle, so stretch away from it
  // before applying. Multiplying albedo keeps the palette's hue intact.
  diffuseColor.rgb *= 1.0 +
    (stoneGrain - 0.5) * 2.0 * uStoneGrainStrength * stoneGrainFade;
}
`;

export class WorldStoneSystem {
  private readonly chunks = new Map<string, StoneChunk>();
  private readonly queue: StoneChunkRequest[] = [];
  private readonly desired = new Map<string, StoneChunkRequest>();
  private readonly material = new THREE.MeshLambertMaterial({
    vertexColors: true,
  });
  private readonly instanceScratch: StoneInstance[] = [];
  private readonly matrixScratch = new THREE.Matrix4();
  private readonly quaternionScratch = new THREE.Quaternion();
  private readonly yawScratch = new THREE.Quaternion();
  private readonly normalScratch = new THREE.Vector3();
  private readonly positionScratch = new THREE.Vector3();
  private readonly scaleScratch = new THREE.Vector3();
  private readonly enabled: boolean;
  private readonly grainTexture?: THREE.Texture;
  private centerChunkX = Number.NaN;
  private centerChunkZ = Number.NaN;
  private lastBuildMs = 0;
  private maxBuildMs = 0;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly stoneField: StoneField,
    private readonly config: WorldConfig,
    private readonly compact: boolean,
    private readonly receiveShadows: boolean,
  ) {
    this.enabled = config.stonesEnabled >= 1;
    this.material.name = "world-stone-material";
    this.material.dithering = true;

    // At zero strength the shader is never touched at all, so dialling the
    // grain off costs nothing rather than costing a branch on every fragment.
    if (this.enabled && config.stoneGrainStrength > 0) {
      this.grainTexture = this.createGrainTexture();
      this.applyGrainShader(this.grainTexture);
    }
  }

  private createGrainTexture(): THREE.Texture {
    const texture = new THREE.TextureLoader().load("./perlinnoise.webp");
    texture.name = "world-stone-grain";
    texture.colorSpace = THREE.NoColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }

  private applyGrainShader(texture: THREE.Texture): void {
    const fadeEnd = this.config.stoneGrainFadeDistance;
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uStoneGrain = { value: texture };
      shader.uniforms.uStoneGrainStrength = {
        value: this.config.stoneGrainStrength,
      };
      shader.uniforms.uStoneGrainScale = {
        value: 1 / this.config.stoneGrainSize,
      };
      // Fading across the last third keeps the boundary from reading as a ring
      // on the ground around the camera.
      shader.uniforms.uStoneGrainFade = {
        value: new THREE.Vector2(fadeEnd * 0.6, fadeEnd),
      };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>${STONE_GRAIN_VERTEX}`)
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>${STONE_GRAIN_POSITION}`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>${STONE_GRAIN_FRAGMENT}`)
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>${STONE_GRAIN_COLOR}`,
        );
    };
    this.material.customProgramCacheKey = () => "world-stone-grain-v1";
    this.material.needsUpdate = true;
  }

  update(position: THREE.Vector3, buildDeadline: number): void {
    if (!this.enabled) {
      return;
    }
    const chunkX = Math.floor(position.x / this.config.chunkSize);
    const chunkZ = Math.floor(position.z / this.config.chunkSize);
    if (chunkX !== this.centerChunkX || chunkZ !== this.centerChunkZ) {
      this.centerChunkX = chunkX;
      this.centerChunkZ = chunkZ;
      this.reconcile();
    }
    this.processQueue(buildDeadline);
  }

  getDiagnostics(): StoneDiagnostics {
    let stones = 0;
    let triangles = 0;
    for (const chunk of this.chunks.values()) {
      stones += chunk.stones;
      triangles += chunk.triangles;
    }
    return {
      activeChunks: this.chunks.size,
      queuedChunks: this.queue.length,
      stones,
      triangles,
      lastBuildMs: this.lastBuildMs,
      maxBuildMs: this.maxBuildMs,
    };
  }

  dispose(): void {
    for (const chunk of this.chunks.values()) {
      this.removeChunk(chunk);
    }
    this.chunks.clear();
    this.queue.length = 0;
    this.desired.clear();
    this.material.dispose();
    this.grainTexture?.dispose();
  }

  private reconcile(): void {
    const radius = this.compact
      ? this.config.stoneRadiusCompact
      : this.config.stoneRadiusDesktop;
    const detailRadius = Math.min(radius, this.config.stoneDetailRadius);
    const halfWorld = this.config.worldSize * 0.5;
    this.desired.clear();

    for (let dz = -radius; dz <= radius; dz += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const chunkX = this.centerChunkX + dx;
        const chunkZ = this.centerChunkZ + dz;
        const originX = chunkX * this.config.chunkSize;
        const originZ = chunkZ * this.config.chunkSize;
        if (
          originX < -halfWorld ||
          originZ < -halfWorld ||
          originX + this.config.chunkSize > halfWorld ||
          originZ + this.config.chunkSize > halfWorld
        ) {
          continue;
        }
        const distance = Math.max(Math.abs(dx), Math.abs(dz));
        const key = `${chunkX}:${chunkZ}`;
        this.desired.set(key, {
          key,
          chunkX,
          chunkZ,
          detail: distance <= detailRadius,
          distance,
        });
      }
    }

    for (const [key, chunk] of this.chunks) {
      if (!this.desired.has(key)) {
        this.removeChunk(chunk);
        this.chunks.delete(key);
      }
    }

    this.queue.length = 0;
    for (const request of this.desired.values()) {
      const existing = this.chunks.get(request.key);
      if (!existing || existing.detail !== request.detail) {
        this.queue.push(request);
      }
    }
    this.queue.sort((left, right) => left.distance - right.distance);
  }

  private processQueue(buildDeadline: number): void {
    let built = 0;
    while (
      this.queue.length > 0 &&
      built < this.config.stoneChunksPerFrame &&
      performance.now() < buildDeadline
    ) {
      const request = this.queue.shift();
      if (!request || this.desired.get(request.key) !== request) {
        continue;
      }
      const existing = this.chunks.get(request.key);
      if (existing && existing.detail === request.detail) {
        continue;
      }
      const startedAt = performance.now();
      const chunk = this.buildChunk(request);
      this.lastBuildMs = performance.now() - startedAt;
      this.maxBuildMs = Math.max(this.maxBuildMs, this.lastBuildMs);
      if (existing) {
        this.removeChunk(existing);
        this.chunks.delete(existing.key);
      }
      if (chunk) {
        this.chunks.set(chunk.key, chunk);
        this.scene.add(chunk.mesh);
      }
      built += 1;
    }
  }

  private buildChunk(request: StoneChunkRequest): StoneChunk | undefined {
    const instances = this.stoneField.collectChunkInstances(
      request.chunkX,
      request.chunkZ,
      request.detail,
      this.instanceScratch,
    );
    if (instances.length === 0) {
      return undefined;
    }

    let vertexCount = 0;
    let indexCount = 0;
    for (const instance of instances) {
      const variant = this.stoneField.getVariant(
        instance.archetype,
        instance.variantIndex,
      );
      vertexCount += variant.metrics.vertexCount;
      indexCount += variant.indices.length;
    }

    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const indices =
      vertexCount <= 65535
        ? new Uint16Array(indexCount)
        : new Uint32Array(indexCount);

    let vertexCursor = 0;
    let indexCursor = 0;
    let triangles = 0;

    for (const instance of instances) {
      const variant = this.stoneField.getVariant(
        instance.archetype,
        instance.variantIndex,
      );

      // Lean the stone into the slope by a fraction of the terrain normal:
      // pebbles ride the ground, monoliths stay deliberately upright.
      this.normalScratch
        .set(instance.normalX, instance.normalY, instance.normalZ)
        .multiplyScalar(instance.tiltStrength)
        .addScaledVector(UP, 1 - instance.tiltStrength)
        .normalize();
      this.quaternionScratch.setFromUnitVectors(UP, this.normalScratch);
      this.yawScratch.setFromAxisAngle(UP, instance.rotationY);
      this.quaternionScratch.multiply(this.yawScratch);
      this.matrixScratch.compose(
        this.positionScratch.set(
          instance.x,
          instance.height - instance.sink,
          instance.z,
        ),
        this.quaternionScratch,
        this.scaleScratch.setScalar(instance.scale),
      );

      const elements = this.matrixScratch.elements;
      const sourcePositions = variant.positions;
      const sourceNormals = variant.normals;
      const count = variant.metrics.vertexCount;
      for (let index = 0; index < count; index += 1) {
        const source = index * 3;
        const target = (vertexCursor + index) * 3;
        const px = sourcePositions[source];
        const py = sourcePositions[source + 1];
        const pz = sourcePositions[source + 2];
        positions[target] =
          elements[0] * px + elements[4] * py + elements[8] * pz + elements[12];
        positions[target + 1] =
          elements[1] * px + elements[5] * py + elements[9] * pz + elements[13];
        positions[target + 2] =
          elements[2] * px + elements[6] * py + elements[10] * pz + elements[14];
        const nx = sourceNormals[source];
        const ny = sourceNormals[source + 1];
        const nz = sourceNormals[source + 2];
        // Uniform scale: rotating the normal by the same matrix basis and
        // renormalizing is exact.
        const rx = elements[0] * nx + elements[4] * ny + elements[8] * nz;
        const ry = elements[1] * nx + elements[5] * ny + elements[9] * nz;
        const rz = elements[2] * nx + elements[6] * ny + elements[10] * nz;
        const inverseLength = 1 / Math.hypot(rx, ry, rz);
        normals[target] = rx * inverseLength;
        normals[target + 1] = ry * inverseLength;
        normals[target + 2] = rz * inverseLength;
      }

      const palette = STONE_PALETTES[instance.paletteKey];
      colorizeStoneVertices(
        variant.tones,
        variant.wears,
        variant.mosses,
        palette,
        {
          valueScale: instance.valueScale,
          moss: instance.moss,
          secondary:
            instance.graniteBlend > 0.01 && palette !== STONE_PALETTES.graniteGrey
              ? STONE_PALETTES.graniteGrey
              : undefined,
          secondaryBlend: instance.graniteBlend,
        },
        colors,
        vertexCursor * 3,
      );

      const sourceIndices = variant.indices;
      for (let index = 0; index < sourceIndices.length; index += 1) {
        indices[indexCursor + index] = sourceIndices[index] + vertexCursor;
      }
      indexCursor += sourceIndices.length;
      vertexCursor += count;
      triangles += variant.metrics.triangleCount;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.name = `world-stones-${request.key}`;
    mesh.castShadow = false;
    mesh.receiveShadow = this.receiveShadows;
    mesh.matrixAutoUpdate = false;

    return {
      key: request.key,
      detail: request.detail,
      mesh,
      triangles,
      stones: instances.length,
    };
  }

  private removeChunk(chunk: StoneChunk): void {
    this.scene.remove(chunk.mesh);
    chunk.mesh.geometry.dispose();
  }
}
