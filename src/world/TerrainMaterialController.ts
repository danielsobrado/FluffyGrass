import * as THREE from "three";
import type { GrassArtDirection } from "../grass/GrassArtDirection";
import type { WorldConfig } from "./WorldConfig";
import {
  TERRAIN_DETAIL_COLOR,
  TERRAIN_DETAIL_FRAGMENT,
  TERRAIN_DETAIL_POSITION,
  TERRAIN_DETAIL_VERTEX,
} from "./TerrainMaterialShader";

const MATERIAL_CACHE_KEY = "world-terrain-grass-detail-v3-paths";

export class TerrainMaterialController {
  readonly material = new THREE.MeshLambertMaterial({ vertexColors: true });
  private readonly grassDetailTexture = new THREE.TextureLoader().load(
    "./perlinnoise.webp",
  );
  private readonly grassArtUniforms = {
    uTerrainGrassTint: { value: new THREE.Color("#4d923f") },
    uTerrainGrassTintStrength: { value: 0.5 },
  };
  private readonly pathUniforms = {
    uTerrainPathHalfWidth: { value: new THREE.Vector2() },
    uTerrainPathEdge: { value: 0 },
    uTerrainPathSoil: { value: new THREE.Color("#574833") },
    uTerrainPathDust: { value: new THREE.Color("#8d7350") },
    uTerrainPathGrit: { value: new THREE.Color("#a1968a") },
  };

  constructor(
    config: WorldConfig,
    readonly shadows: boolean,
  ) {
    this.configureTexture();
    this.pathUniforms.uTerrainPathHalfWidth.value.set(
      config.pathWidth * 0.5,
      config.pathBranchWidth * 0.5,
    );
    this.pathUniforms.uTerrainPathEdge.value = config.pathEdgeRoughness;
    this.configureMaterial();
  }

  setGrassArtDirection(direction: GrassArtDirection): void {
    this.grassArtUniforms.uTerrainGrassTint.value.set(
      direction.terrainGrassColor,
    );
    this.grassArtUniforms.uTerrainGrassTintStrength.value =
      direction.terrainGrassTintStrength;
  }

  dispose(): void {
    this.material.dispose();
    this.grassDetailTexture.dispose();
  }

  private configureTexture(): void {
    this.grassDetailTexture.name = "world-terrain-grass-detail";
    this.grassDetailTexture.colorSpace = THREE.NoColorSpace;
    this.grassDetailTexture.wrapS = THREE.RepeatWrapping;
    this.grassDetailTexture.wrapT = THREE.RepeatWrapping;
    this.grassDetailTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.grassDetailTexture.magFilter = THREE.LinearFilter;
    this.grassDetailTexture.generateMipmaps = true;
  }

  private configureMaterial(): void {
    this.material.name = "world-terrain-material";
    this.material.dithering = true;
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTerrainGrassDetail = {
        value: this.grassDetailTexture,
      };
      Object.assign(shader.uniforms, this.grassArtUniforms);
      Object.assign(shader.uniforms, this.pathUniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>${TERRAIN_DETAIL_VERTEX}`)
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>${TERRAIN_DETAIL_POSITION}`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>${TERRAIN_DETAIL_FRAGMENT}`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>${TERRAIN_DETAIL_COLOR}`,
        );
    };
    this.material.customProgramCacheKey = () => MATERIAL_CACHE_KEY;
    this.material.needsUpdate = true;
  }
}
