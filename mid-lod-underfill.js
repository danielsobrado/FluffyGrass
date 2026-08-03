import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js";

const SOURCE_INSTANCE_COUNT = 22000;
const MAX_FIND_ATTEMPTS = 180;
const NEAR_FADE_START = 16;
const NEAR_FADE_END = 32;
const FAR_FADE_START = 72;
const FAR_FADE_END = 88;
const MID_UNDERFILL = 0.46;
const FAR_COVERAGE = 0.92;

let attempts = 0;
requestAnimationFrame(installUnderfill);

function installUnderfill() {
  const scene = window.__drusnielScene;
  const source = findSourceGrass(scene);
  if (!scene || !source) {
    attempts += 1;
    if (attempts < MAX_FIND_ATTEMPTS) {
      requestAnimationFrame(installUnderfill);
    }
    return;
  }
  if (scene.getObjectByName("drusniel-mid-lod-underfill")) {
    return;
  }

  const geometry = createUnderfillGeometry();
  const material = createUnderfillMaterial();
  const underfill = new THREE.InstancedMesh(
    geometry,
    material,
    source.count,
  );
  underfill.name = "drusniel-mid-lod-underfill";
  underfill.userData.drusnielManagedGrass = true;
  underfill.castShadow = false;
  underfill.receiveShadow = false;
  underfill.frustumCulled = false;
  underfill.instanceMatrix.array.set(source.instanceMatrix.array);
  underfill.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  underfill.instanceMatrix.needsUpdate = true;
  scene.add(underfill);
}

function findSourceGrass(scene) {
  if (!scene) return undefined;
  let result;
  scene.traverse((object) => {
    if (
      result ||
      !(object instanceof THREE.InstancedMesh) ||
      object.count !== SOURCE_INSTANCE_COUNT ||
      object.userData.drusnielManagedGrass
    ) {
      return;
    }
    result = object;
  });
  return result;
}

function createUnderfillGeometry() {
  const positions = [];
  const uvs = [];
  const indices = [];
  const cardCount = 3;

  for (let card = 0; card < cardCount; card += 1) {
    const angle = (card / cardCount) * Math.PI;
    const rightX = Math.cos(angle) * 0.19;
    const rightZ = Math.sin(angle) * 0.19;
    const leanX = Math.sin(angle) * 0.08;
    const leanZ = -Math.cos(angle) * 0.08;
    const offset = positions.length / 3;

    positions.push(
      -rightX,
      0,
      -rightZ,
      rightX,
      0,
      rightZ,
      rightX * 0.62 + leanX,
      0.82,
      rightZ * 0.62 + leanZ,
      -rightX * 0.62 + leanX,
      0.82,
      -rightZ * 0.62 + leanZ,
    );
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    indices.push(
      offset,
      offset + 1,
      offset + 2,
      offset,
      offset + 2,
      offset + 3,
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createUnderfillMaterial() {
  const material = new THREE.MeshLambertMaterial({
    color: 0x3e7935,
    side: THREE.DoubleSide,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uUnderfillTime = { value: 0 };
    material.userData.underfillShader = shader;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uUnderfillTime;
varying float vUnderfillDistance;
varying float vUnderfillSeed;
varying float vUnderfillProgress;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vec4 underfillRoot = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
float underfillProgress = uv.y;
float underfillSeed = fract(sin(dot(underfillRoot.xz, vec2(12.9898, 78.233))) * 43758.5453);
float underfillWave = sin(
  dot(underfillRoot.xz, vec2(0.8, 0.35)) * 0.08 +
  uUnderfillTime * 1.4 +
  underfillSeed * 6.28318530718
);
transformed.x += underfillWave * 0.055 * pow(underfillProgress, 1.5);
vUnderfillDistance = distance(cameraPosition, underfillRoot.xyz);
vUnderfillSeed = underfillSeed;
vUnderfillProgress = underfillProgress;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying float vUnderfillDistance;
varying float vUnderfillSeed;
varying float vUnderfillProgress;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float underfillNearExit = smoothstep(
  ${NEAR_FADE_START.toFixed(1)},
  ${NEAR_FADE_END.toFixed(1)},
  vUnderfillDistance
);
float underfillFarEntry = smoothstep(
  ${FAR_FADE_START.toFixed(1)},
  ${FAR_FADE_END.toFixed(1)},
  vUnderfillDistance
);
float underfillCoverage = mix(
  underfillNearExit * ${MID_UNDERFILL.toFixed(2)},
  ${FAR_COVERAGE.toFixed(2)},
  underfillFarEntry
);
float underfillDither = fract(
  sin(dot(gl_FragCoord.xy, vec2(39.3468, 11.135)) + vUnderfillSeed * 91.7) *
  24634.6345
);
if (underfillDither > underfillCoverage) discard;
diffuseColor.rgb *= mix(
  vec3(0.78, 0.9, 0.74),
  vec3(1.03, 1.08, 0.94),
  vUnderfillProgress
);`,
      );
  };
  material.customProgramCacheKey = () => "drusniel-mid-underfill-v1";

  const clock = new THREE.Clock();
  const update = () => {
    const shader = material.userData.underfillShader;
    if (shader) {
      shader.uniforms.uUnderfillTime.value = clock.getElapsedTime();
    }
    requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
  return material;
}
