import * as THREE from "three";
import type { WorldHorizonCoverage } from "./WorldHorizonCoverage";
import { WORLD_HORIZON_SINK_DEPTH } from "./WorldHorizonTuning";
import { WORLD_SUN_DIRECTION } from "../../app/WorldEnvironmentTuning";

const MATERIAL_CACHE_KEY = "world-horizon-shell-v4";
const HORIZON_SUN_DIRECTION = new THREE.Vector3(...WORLD_SUN_DIRECTION).normalize();
const HORIZON_VERTEX = /* glsl */ `
  uniform float uHorizonSinkDepth;
  uniform vec2 uHorizonSinkFade;
  uniform vec2 uHorizonSinkFocus;
  varying vec2 vHorizonWorldXZ;
  uniform vec3 uHorizonSunDirection;
  varying float vHorizonFaceGrade;
`;

const HORIZON_POSITION = /* glsl */ `
  vec2 horizonToFocus = abs(transformed.xz - uHorizonSinkFocus);
  float horizonRingDistance = max(horizonToFocus.x, horizonToFocus.y);
  float horizonBuried = 1.0 - smoothstep(
    uHorizonSinkFade.x,
    uHorizonSinkFade.y,
    horizonRingDistance
  );
  transformed.y -= uHorizonSinkDepth * horizonBuried;
  vHorizonWorldXZ = transformed.xz;
  vec3 horizonWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
  float horizonSunFacing = dot(horizonWorldNormal, uHorizonSunDirection);
  vHorizonFaceGrade = mix(
    0.88,
    1.04,
    smoothstep(-0.15, 0.35, horizonSunFacing)
  );
`;

const HORIZON_FRAGMENT = /* glsl */ `
  uniform sampler2D uTerrainCoverage;
  uniform float uTerrainCoverageHalfExtent;
  uniform float uTerrainCoverageWorldSize;
  varying vec2 vHorizonWorldXZ;
  varying float vHorizonFaceGrade;
`;

const HORIZON_FACE_GRADE = /* glsl */ `
  diffuseColor.rgb *= vHorizonFaceGrade;
`;
const HORIZON_COVERAGE_DISCARD = /* glsl */ `
  vec2 horizonCoverageUv =
    (vHorizonWorldXZ + vec2(uTerrainCoverageHalfExtent)) /
    uTerrainCoverageWorldSize;
  if (
    horizonCoverageUv.x >= 0.0 && horizonCoverageUv.y >= 0.0 &&
    horizonCoverageUv.x < 1.0 && horizonCoverageUv.y < 1.0 &&
    texture2D(uTerrainCoverage, horizonCoverageUv).r > 0.5
  ) {
    discard;
  }
`;

/**
 * Cheap far-terrain material with exact streamed-chunk ownership.
 *
 * The vertical sink remains as a fallback around chunks that are still being
 * built. Once a detailed chunk is resident, the coverage mask prevents the
 * coarse shell from rasterizing beneath it at all. This removes mountain
 * poke-through without increasing horizon tessellation or global sink depth.
 */
export class WorldHorizonMaterial {
  readonly material = new THREE.MeshLambertMaterial({ vertexColors: true });
  private readonly sinkFade = new THREE.Vector2();
  private readonly sinkFocus = new THREE.Vector2();

  constructor(
    ringGuaranteedRadius: number,
    ringOuterRadius: number,
    coverage: WorldHorizonCoverage,
  ) {
    this.sinkFade.set(ringGuaranteedRadius, ringOuterRadius);
    this.material.name = "world-horizon-material";
    this.material.dithering = true;
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uHorizonSinkDepth = { value: WORLD_HORIZON_SINK_DEPTH };
      shader.uniforms.uHorizonSinkFade = { value: this.sinkFade };
      shader.uniforms.uHorizonSinkFocus = { value: this.sinkFocus };
      shader.uniforms.uHorizonSunDirection = { value: HORIZON_SUN_DIRECTION };
      shader.uniforms.uTerrainCoverage = { value: coverage.texture };
      shader.uniforms.uTerrainCoverageHalfExtent = {
        value: coverage.worldHalfExtent,
      };
      shader.uniforms.uTerrainCoverageWorldSize = { value: coverage.worldSize };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>${HORIZON_VERTEX}`)
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>${HORIZON_POSITION}`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>${HORIZON_FRAGMENT}`)
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>${HORIZON_FACE_GRADE}`,
        )
        .replace(
          "#include <clipping_planes_fragment>",
          `#include <clipping_planes_fragment>${HORIZON_COVERAGE_DISCARD}`,
        );
    };
    this.material.customProgramCacheKey = () => MATERIAL_CACHE_KEY;
    this.material.needsUpdate = true;
  }

  update(focus: THREE.Vector3): void {
    this.sinkFocus.set(focus.x, focus.z);
  }

  dispose(): void {
    this.material.dispose();
  }
}
