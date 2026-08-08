import * as THREE from "three";
import { WorldConfigLoader } from "../WorldConfigLoader";
import {
  applyStoneCoarseSurfaceShader,
  applyStoneSurfaceShader,
} from "./StoneGrowthShader";

interface ShaderProbe {
  uniforms: Record<string, { value: unknown }>;
  vertexShader: string;
  fragmentShader: string;
}

function fail(message: string): never {
  throw new Error(`[stones-shader] ${message}`);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) fail(message);
}

function probe(material: THREE.MeshLambertMaterial): ShaderProbe {
  const shader: ShaderProbe = {
    uniforms: {},
    vertexShader: "#include <common>\n#include <begin_vertex>",
    fragmentShader:
      "#include <common>\n#include <color_fragment>\n#include <opaque_fragment>",
  };
  material.onBeforeCompile(
    shader as unknown as THREE.WebGLProgramParametersWithUniforms,
    {} as THREE.WebGLRenderer,
  );
  return shader;
}

/** Verifies that far stones cannot regress into the near procedural shader. */
export function verifyStoneShaderPerformance(configSource: string): string {
  const config = new WorldConfigLoader().parse(configSource);

  const detailedMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  applyStoneSurfaceShader(detailedMaterial, config);
  const detailed = probe(detailedMaterial);
  assert(
    detailed.fragmentShader.includes("stoneGrowthDistanceSquared") &&
      detailed.fragmentShader.includes("stoneColony(") &&
      !detailed.fragmentShader.includes("distance(stoneGrowthLocalPosition"),
    "Detailed stone shader must use squared distance gates and colony tests.",
  );

  const coarseMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  applyStoneCoarseSurfaceShader(coarseMaterial);
  const coarse = probe(coarseMaterial);
  assert(
    !coarse.fragmentShader.includes("stoneGrowthNoise") &&
      !coarse.fragmentShader.includes("cameraPosition") &&
      !coarse.vertexShader.includes("stoneGrowthPosition") &&
      coarse.fragmentShader.includes("vStoneMoss"),
    "Coarse stone shader must stay free of camera-distance and procedural-noise work.",
  );

  detailedMaterial.dispose();
  coarseMaterial.dispose();
  return "squared near SDF/fades · noise-free coarse shader";
}
