import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js";

const SOURCE_INSTANCE_COUNT = 22000;
const SOURCE_NAME = "drusniel-mid-far-multiblade-patches";
const UNDERFILL_NAME = "drusniel-mid-lod-underfill";
const MAX_FIND_ATTEMPTS = 180;
const CLUSTERS_PER_SOURCE = 3;
const OFFSET_RADIUS_MIN = 0.9;
const OFFSET_RADIUS_MAX = 1.65;
const NEAR_FADE_START = 16;
const NEAR_FADE_END = 32;
const FAR_FADE_START = 72;
const FAR_FADE_END = 88;
const MID_UNDERFILL = 0.74;
const FAR_COVERAGE = 1;
const TWO_PI = Math.PI * 2;

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
  if (scene.getObjectByName(UNDERFILL_NAME)) {
    return;
  }

  const geometry = createUnderfillGeometry();
  const material = createUnderfillMaterial();
  const underfill = new THREE.InstancedMesh(
    geometry,
    material,
    source.count * CLUSTERS_PER_SOURCE,
  );
  underfill.name = UNDERFILL_NAME;
  underfill.userData.drusnielManagedGrass = true;
  underfill.castShadow = false;
  underfill.receiveShadow = false;
  underfill.frustumCulled = false;
  underfill.position.copy(source.position);
  underfill.quaternion.copy(source.quaternion);
  underfill.scale.copy(source.scale);
  fillUnderfillMatrices(source, underfill);
  scene.add(underfill);
}

function findSourceGrass(scene) {
  if (!scene) return undefined;
  const namedSource = scene.getObjectByName(SOURCE_NAME);
  if (namedSource instanceof THREE.InstancedMesh) {
    return namedSource;
  }

  let result;
  scene.traverse((object) => {
    if (
      result ||
      !(object instanceof THREE.InstancedMesh) ||
      object.count !== SOURCE_INSTANCE_COUNT ||
      object.name === UNDERFILL_NAME
    ) {
      return;
    }
    result = object;
  });
  return result;
}

function fillUnderfillMatrices(source, underfill) {
  const sourceValues = source.instanceMatrix.array;
  const targetValues = underfill.instanceMatrix.array;

  for (let sourceIndex = 0; sourceIndex < source.count; sourceIndex += 1) {
    const sourceOffset = sourceIndex * 16;
    const axisXLength = Math.hypot(
      sourceValues[sourceOffset],
      sourceValues[sourceOffset + 1],
      sourceValues[sourceOffset + 2],
    ) || 1;
    const axisZLength = Math.hypot(
      sourceValues[sourceOffset + 8],
      sourceValues[sourceOffset + 9],
      sourceValues[sourceOffset + 10],
    ) || 1;
    const axisX = [
      sourceValues[sourceOffset] / axisXLength,
      sourceValues[sourceOffset + 1] / axisXLength,
      sourceValues[sourceOffset + 2] / axisXLength,
    ];
    const axisZ = [
      sourceValues[sourceOffset + 8] / axisZLength,
      sourceValues[sourceOffset + 9] / axisZLength,
      sourceValues[sourceOffset + 10] / axisZLength,
    ];
    const baseAngle = hash01(sourceIndex * 3 + 1) * TWO_PI;

    for (let cluster = 0; cluster < CLUSTERS_PER_SOURCE; cluster += 1) {
      const targetIndex = sourceIndex * CLUSTERS_PER_SOURCE + cluster;
      const targetOffset = targetIndex * 16;
      targetValues.set(
        sourceValues.subarray(sourceOffset, sourceOffset + 16),
        targetOffset,
      );

      if (cluster > 0) {
        const clusterSeed = hash01(sourceIndex * 11 + cluster * 17);
        const angle =
          baseAngle +
          ((cluster - 1) / (CLUSTERS_PER_SOURCE - 1)) * Math.PI +
          (clusterSeed - 0.5) * 0.45;
        const radius = THREE.MathUtils.lerp(
          OFFSET_RADIUS_MIN,
          OFFSET_RADIUS_MAX,
          hash01(sourceIndex * 29 + cluster * 7),
        );
        const localX = Math.cos(angle) * radius;
        const localZ = Math.sin(angle) * radius;
        targetValues[targetOffset + 12] +=
          axisX[0] * localX + axisZ[0] * localZ;
        targetValues[targetOffset + 13] +=
          axisX[1] * localX + axisZ[1] * localZ;
        targetValues[targetOffset + 14] +=
          axisX[2] * localX + axisZ[2] * localZ;
      }

      const horizontalScale = THREE.MathUtils.lerp(
        0.88,
        1.12,
        hash01(targetIndex * 31 + 5),
      );
      const verticalScale = THREE.MathUtils.lerp(
        0.9,
        1.16,
        hash01(targetIndex * 37 + 9),
      );
      scaleMatrixBasis(
        targetValues,
        targetOffset,
        horizontalScale,
        verticalScale,
      );
    }
  }

  underfill.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  underfill.instanceMatrix.needsUpdate = true;
}

function scaleMatrixBasis(values, offset, horizontalScale, verticalScale) {
  for (const index of [0, 1, 2, 8, 9, 10]) {
    values[offset + index] *= horizontalScale;
  }
  for (const index of [4, 5, 6]) {
    values[offset + index] *= verticalScale;
  }
}

function hash01(value) {
  let hash = value | 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
}

function createUnderfillGeometry() {
  const positions = [];
  const uvs = [];
  const indices = [];
  const cardCount = 2;

  for (let card = 0; card < cardCount; card += 1) {
    const angle = (card / cardCount) * Math.PI;
    const rightX = Math.cos(angle) * 0.22;
    const rightZ = Math.sin(angle) * 0.22;
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
      rightX * 0.58 + leanX,
      0.9,
      rightZ * 0.58 + leanZ,
      -rightX * 0.58 + leanX,
      0.9,
      -rightZ * 0.58 + leanZ,
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
transformed.x += underfillWave * 0.05 * pow(underfillProgress, 1.5);
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
vec2 underfillCell = floor(vUv * 32.0);
float underfillDither = fract(
  sin(dot(underfillCell, vec2(39.3468, 11.135)) + vUnderfillSeed * 91.7) *
  24634.6345
);
if (underfillDither > underfillCoverage) discard;
diffuseColor.rgb *= mix(
  vec3(0.8, 0.91, 0.76),
  vec3(1.03, 1.08, 0.95),
  vUnderfillProgress
);`,
      );
  };
  material.customProgramCacheKey = () => "drusniel-mid-underfill-v2";

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
