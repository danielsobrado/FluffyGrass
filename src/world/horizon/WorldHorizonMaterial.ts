import * as THREE from "three";
import { WORLD_HORIZON_SINK_DEPTH } from "./WorldHorizonTuning";

const MATERIAL_CACHE_KEY = "world-horizon-shell-v2";

/**
 * Sinks the shell beneath whatever the terrain streamer is currently holding,
 * then lets it rise to its true height once it is past the ring.
 *
 * The ring is a square block of chunks centred on the camera's chunk, so the
 * fade is measured in Chebyshev distance rather than radial distance. A radial
 * fade cannot describe a square boundary: tuned to clear the ring along the
 * axes it would surface the shell inside the ring's own corners, and tuned to
 * clear the corners it would leave the shell sunk in a visible trench beyond
 * where the ring actually ends.
 *
 * The streaming focus may sit anywhere within its own chunk, so the ring only
 * reaches a guaranteed `radius * chunkSize` and never extends past
 * `(radius + 1) * chunkSize`. The ramp runs exactly between those two, which is
 * the narrowest band that is fully buried at one end and certainly clear at the
 * other.
 */
const HORIZON_SINK_VERTEX = /* glsl */ `
  uniform float uHorizonSinkDepth;
  uniform vec2 uHorizonSinkFade;
  uniform vec2 uHorizonSinkFocus;
`;

const HORIZON_SINK_POSITION = /* glsl */ `
  vec2 horizonToFocus = abs(transformed.xz - uHorizonSinkFocus);
  float horizonRingDistance = max(horizonToFocus.x, horizonToFocus.y);
  float horizonBuried = 1.0 - smoothstep(
    uHorizonSinkFade.x,
    uHorizonSinkFade.y,
    horizonRingDistance
  );
  transformed.y -= uHorizonSinkDepth * horizonBuried;
`;

/**
 * The shell's material: the terrain's lighting model with none of its surface
 * work.
 *
 * This is the cheap end of the atmospheric LOD. The streamed terrain spends its
 * fragment shader on procedural meso and micro noise, path wear, ecology
 * blending, and a perturbed normal, all of which describe detail measured in
 * centimetres. The shell is never seen closer than a few hundred metres, where
 * one of its 16 m cells is a handful of pixels, so it carries vertex colour and
 * the scene's own lighting and fog and nothing else.
 */
export class WorldHorizonMaterial {
  readonly material = new THREE.MeshLambertMaterial({ vertexColors: true });
  private readonly sinkFade = new THREE.Vector2();
  private readonly sinkFocus = new THREE.Vector2();

  constructor(ringGuaranteedRadius: number, ringOuterRadius: number) {
    this.sinkFade.set(ringGuaranteedRadius, ringOuterRadius);
    this.material.name = "world-horizon-material";
    this.material.dithering = true;
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uHorizonSinkDepth = { value: WORLD_HORIZON_SINK_DEPTH };
      shader.uniforms.uHorizonSinkFade = { value: this.sinkFade };
      shader.uniforms.uHorizonSinkFocus = { value: this.sinkFocus };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>${HORIZON_SINK_VERTEX}`)
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>${HORIZON_SINK_POSITION}`,
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
