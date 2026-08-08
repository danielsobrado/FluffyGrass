import * as THREE from "three";
import type { WorldConfig } from "../WorldConfig";
import type { StoneField, StoneInstance } from "./StoneField";
import {
  STONE_PALETTES,
  colorizeStoneVertices,
  resolveStoneGrowthColors,
  type StonePaletteKey,
} from "./StonePalette";

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
const LICHEN_ENVIRONMENT: Record<StonePaletteKey, number> = {
  meadowSage: 0.24,
  steppeTan: 0.72,
  graniteGrey: 0.86,
  mossy: 0.16,
};

const STONE_SURFACE_VERTEX_COMMON = `
attribute float stoneMoss;
attribute float stoneLichen;
attribute vec3 stoneMossColor;
attribute vec3 stoneLichenColor;
varying vec3 vStoneWorldPosition;
varying vec3 vStoneWorldNormal;
varying float vStoneMoss;
varying float vStoneLichen;
varying vec3 vStoneMossColor;
varying vec3 vStoneLichenColor;
`;

const STONE_SURFACE_VERTEX_POSITION = `
vStoneWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
vStoneWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
vStoneMoss = stoneMoss;
vStoneLichen = stoneLichen;
vStoneMossColor = stoneMossColor;
vStoneLichenColor = stoneLichenColor;
`;

const STONE_GROWTH_FRAGMENT_COMMON = `
uniform float uStoneGrowthDetailStrength;
uniform float uStoneGrowthDetailScale;
uniform vec2 uStoneGrowthDetailFade;
uniform float uStoneMossStreakStrength;
varying vec3 vStoneWorldPosition;
varying vec3 vStoneWorldNormal;
varying float vStoneMoss;
varying float vStoneLichen;
varying vec3 vStoneMossColor;
varying vec3 vStoneLichenColor;

float stoneGrowthHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float stoneGrowthNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(stoneGrowthHash(i), stoneGrowthHash(i + vec2(1.0, 0.0)), u.x),
    mix(
      stoneGrowthHash(i + vec2(0.0, 1.0)),
      stoneGrowthHash(i + vec2(1.0, 1.0)),
      u.x
    ),
    u.y
  );
}

vec2 stoneGrowthProjection(vec3 position, vec3 normal) {
  vec3 axis = abs(normal);
  if (axis.y >= axis.x && axis.y >= axis.z) {
    return position.xz;
  }
  if (axis.x >= axis.z) {
    return position.zy;
  }
  return position.xy;
}
`;

const STONE_GROWTH_COLOR = `
vec3 stoneGrowthNormal = normalize(vStoneWorldNormal);
vec2 stoneGrowthUv = stoneGrowthProjection(vStoneWorldPosition, stoneGrowthNormal);
float stoneGrowthDistance = distance(cameraPosition, vStoneWorldPosition);
float stoneGrowthDetailFade = 1.0 - smoothstep(
  uStoneGrowthDetailFade.x,
  uStoneGrowthDetailFade.y,
  stoneGrowthDistance
);
float stoneColonyNoise = stoneGrowthNoise(
  stoneGrowthUv * uStoneGrowthDetailScale * 0.32 + vec2(7.31, 19.17)
);
float stoneColonyMask = smoothstep(
  0.18,
  0.72,
  stoneColonyNoise + vStoneMoss * 0.24
);
float stoneMossCoverage = vStoneMoss * mix(
  1.0,
  stoneColonyMask,
  min(0.86, uStoneGrowthDetailStrength * 0.86)
);

float stoneLichenNoise = stoneGrowthNoise(
  stoneGrowthUv * uStoneGrowthDetailScale * 1.45 + vec2(41.73, 8.91)
);
float stoneLichenCoverage = vStoneLichen * smoothstep(
  0.56,
  0.82,
  stoneLichenNoise
);

if (stoneGrowthDetailFade > 0.001 && (vStoneMoss + vStoneLichen) > 0.001) {
  float stoneFineNoise = stoneGrowthNoise(
    stoneGrowthUv * uStoneGrowthDetailScale * 2.35 + vec2(23.41, 57.13)
  );
  float stoneMossBreakup = smoothstep(
    0.27,
    0.76,
    stoneFineNoise * 0.64 + stoneColonyNoise * 0.36
  );
  stoneMossCoverage *= mix(
    1.0,
    stoneMossBreakup,
    uStoneGrowthDetailStrength * stoneGrowthDetailFade
  );

  float stoneSideAmount = 1.0 - abs(stoneGrowthNormal.y);
  float stoneRunoffNoise = stoneGrowthNoise(
    vec2(
      (vStoneWorldPosition.x + vStoneWorldPosition.z * 0.37) *
        uStoneGrowthDetailScale * 0.62,
      vStoneWorldPosition.y * uStoneGrowthDetailScale * 0.24
    ) + vec2(11.7, 3.9)
  );
  float stoneRunoff = smoothstep(0.24, 0.78, stoneRunoffNoise);
  stoneMossCoverage *= mix(
    1.0,
    0.55 + stoneRunoff * 0.58,
    uStoneMossStreakStrength * stoneSideAmount * stoneGrowthDetailFade
  );

  float stoneLichenFine = stoneGrowthNoise(
    stoneGrowthUv * uStoneGrowthDetailScale * 4.2 + vec2(71.1, 14.3)
  );
  float stoneLichenBreakup = smoothstep(
    0.62,
    0.86,
    stoneLichenFine * 0.68 + stoneLichenNoise * 0.32
  );
  stoneLichenCoverage *= mix(
    1.0,
    stoneLichenBreakup,
    uStoneGrowthDetailStrength * stoneGrowthDetailFade
  );
}

stoneMossCoverage = clamp(stoneMossCoverage, 0.0, 1.0);
stoneLichenCoverage = clamp(stoneLichenCoverage, 0.0, 1.0);
vec3 stoneLichenColor = vStoneLichenColor * mix(0.90, 1.08, stoneLichenNoise);
vec3 stoneMossColor = vStoneMossColor * mix(0.82, 1.08, stoneColonyNoise);
diffuseColor.rgb = mix(diffuseColor.rgb, stoneLichenColor, stoneLichenCoverage);
diffuseColor.rgb = mix(diffuseColor.rgb, stoneMossColor, stoneMossCoverage);
`;

const STONE_GRAIN_FRAGMENT_COMMON = `
uniform sampler2D uStoneGrain;
uniform float uStoneGrainStrength;
uniform float uStoneGrainScale;
uniform vec2 uStoneGrainFade;
`;

const STONE_GRAIN_COLOR = `
float stoneGrainDistance = distance(cameraPosition, vStoneWorldPosition);
float stoneGrainFade = 1.0 - smoothstep(
  uStoneGrainFade.x,
  uStoneGrainFade.y,
  stoneGrainDistance
);
if (stoneGrainFade > 0.001) {
  vec3 stoneBlend = pow(abs(vStoneWorldNormal), vec3(4.0));
  stoneBlend /= max(stoneBlend.x + stoneBlend.y + stoneBlend.z, 0.0001);
  vec2 stoneUvX = vStoneWorldPosition.zy * uStoneGrainScale;
  vec2 stoneUvY = vStoneWorldPosition.xz * uStoneGrainScale;
  vec2 stoneUvZ = vStoneWorldPosition.xy * uStoneGrainScale;
  float stoneGrain =
    texture2D(uStoneGrain, stoneUvX).r * stoneBlend.x +
    texture2D(uStoneGrain, stoneUvY).r * stoneBlend.y +
    texture2D(uStoneGrain, stoneUvZ).r * stoneBlend.z;
  diffuseColor.rgb *= 1.0 +
    (stoneGrain - 0.5) * 2.0 * uStoneGrainStrength * stoneGrainFade;
}
`;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

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
  private readonly mossExposureDirection = new THREE.Vector3();
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

    const azimuth = THREE.MathUtils.degToRad(
      config.stoneMossExposureAzimuthDegrees,
    );
    const elevation = THREE.MathUtils.degToRad(
      config.stoneMossExposureElevationDegrees,
    );
    const horizontal = Math.cos(elevation);
    this.mossExposureDirection
      .set(
        Math.cos(azimuth) * horizontal,
        Math.sin(elevation),
        Math.sin(azimuth) * horizontal,
      )
      .normalize();

    if (this.enabled && config.stoneGrainStrength > 0) {
      this.grainTexture = this.createGrainTexture();
    }
    if (this.enabled) {
      this.applySurfaceShader(this.grainTexture);
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

  private applySurfaceShader(texture?: THREE.Texture): void {
    const growthFadeEnd = this.config.stoneGrowthDetailFadeDistance;
    const grainFadeEnd = this.config.stoneGrainFadeDistance;
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uStoneGrowthDetailStrength = {
        value: this.config.stoneGrowthDetailStrength,
      };
      shader.uniforms.uStoneGrowthDetailScale = {
        value: 1 / this.config.stoneGrowthDetailSize,
      };
      shader.uniforms.uStoneGrowthDetailFade = {
        value: new THREE.Vector2(growthFadeEnd * 0.55, growthFadeEnd),
      };
      shader.uniforms.uStoneMossStreakStrength = {
        value: this.config.stoneMossStreakStrength,
      };

      let fragmentCommon = STONE_GROWTH_FRAGMENT_COMMON;
      let colorFragment = STONE_GROWTH_COLOR;
      if (texture) {
        shader.uniforms.uStoneGrain = { value: texture };
        shader.uniforms.uStoneGrainStrength = {
          value: this.config.stoneGrainStrength,
        };
        shader.uniforms.uStoneGrainScale = {
          value: 1 / this.config.stoneGrainSize,
        };
        shader.uniforms.uStoneGrainFade = {
          value: new THREE.Vector2(grainFadeEnd * 0.6, grainFadeEnd),
        };
        fragmentCommon += STONE_GRAIN_FRAGMENT_COMMON;
        colorFragment += STONE_GRAIN_COLOR;
      }

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>${STONE_SURFACE_VERTEX_COMMON}`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>${STONE_SURFACE_VERTEX_POSITION}`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>${fragmentCommon}`)
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>${colorFragment}`,
        );
    };
    this.material.customProgramCacheKey = () =>
      `world-stone-surface-v2:${texture ? "grain" : "growth"}`;
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
        request.detail,
      );
      vertexCount += variant.metrics.vertexCount;
      indexCount += variant.indices.length;
    }

    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const mosses = new Float32Array(vertexCount);
    const lichens = new Float32Array(vertexCount);
    const mossColors = new Float32Array(vertexCount * 3);
    const lichenColors = new Float32Array(vertexCount * 3);
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
        request.detail,
      );
      const palette = STONE_PALETTES[instance.paletteKey];
      const tint = {
        valueScale: instance.valueScale,
        secondary:
          instance.graniteBlend > 0.01 && palette !== STONE_PALETTES.graniteGrey
            ? STONE_PALETTES.graniteGrey
            : undefined,
        secondaryBlend: instance.graniteBlend,
      };
      const growthColors = resolveStoneGrowthColors(palette, tint);
      const lichenAmount = this.resolveLichenAmount(instance);

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
        const vertex = vertexCursor + index;
        const target = vertex * 3;
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
        const rx = elements[0] * nx + elements[4] * ny + elements[8] * nz;
        const ry = elements[1] * nx + elements[5] * ny + elements[9] * nz;
        const rz = elements[2] * nx + elements[6] * ny + elements[10] * nz;
        const inverseLength = 1 / Math.hypot(rx, ry, rz);
        const normalX = rx * inverseLength;
        const normalY = ry * inverseLength;
        const normalZ = rz * inverseLength;
        normals[target] = normalX;
        normals[target + 1] = normalY;
        normals[target + 2] = normalZ;

        const exposure = Math.max(
          0,
          normalX * this.mossExposureDirection.x +
            normalY * this.mossExposureDirection.y +
            normalZ * this.mossExposureDirection.z,
        );
        const shadeRetention =
          1 - exposure * this.config.stoneMossExposureStrength;
        mosses[vertex] = clamp01(
          variant.mosses[index] * instance.moss * shadeRetention,
        );
        const lichenExposure = 0.38 + exposure * 0.62;
        const mossCompetition = 1 - variant.mosses[index] * 0.5;
        lichens[vertex] = clamp01(
          lichenAmount * lichenExposure * mossCompetition,
        );

        mossColors[target] = growthColors.moss.r;
        mossColors[target + 1] = growthColors.moss.g;
        mossColors[target + 2] = growthColors.moss.b;
        lichenColors[target] = growthColors.lichen.r;
        lichenColors[target + 1] = growthColors.lichen.g;
        lichenColors[target + 2] = growthColors.lichen.b;
      }

      colorizeStoneVertices(
        variant.tones,
        variant.wears,
        palette,
        tint,
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
    geometry.setAttribute("stoneMoss", new THREE.BufferAttribute(mosses, 1));
    geometry.setAttribute("stoneLichen", new THREE.BufferAttribute(lichens, 1));
    geometry.setAttribute(
      "stoneMossColor",
      new THREE.BufferAttribute(mossColors, 3),
    );
    geometry.setAttribute(
      "stoneLichenColor",
      new THREE.BufferAttribute(lichenColors, 3),
    );
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.name = `world-stones-${request.key}`;
    mesh.castShadow = this.receiveShadows && request.detail;
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

  private resolveLichenAmount(instance: StoneInstance): number {
    const biomeAmount = LICHEN_ENVIRONMENT[instance.paletteKey];
    const altitudeBoost = instance.graniteBlend * 0.34;
    const dampSuppression = 1 - instance.moss * 0.42;
    return clamp01((biomeAmount + altitudeBoost) * dampSuppression);
  }

  private removeChunk(chunk: StoneChunk): void {
    this.scene.remove(chunk.mesh);
    chunk.mesh.geometry.dispose();
  }
}
