import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js";

const PALETTE = new Map([
  [0x081020, 0x090713],
  [0x131b2f, 0x17102c],
  [0x3b3934, 0x29213d],
  [0x0c0806, 0x09070e],
  [0x2a1c14, 0x403854],
  [0x1f3250, 0x65508f],
  [0xb3b8c2, 0xcbd2df],
]);

const DROW_SKIN = 0x403854;
const DROW_HAIR = 0xe8ebf4;
const DROW_EYES = 0xd45cff;
const FPS_SAMPLE_SECONDS = 1;
const NEAR_TILE_SIZE = 8;
const NEAR_DENSITY = 48;
const NEAR_DISTANCE = 20;
const NEAR_TRANSITION = 6;
const NEAR_TILES_PER_FRAME = 1;
const INTERACTION_RADIUS = 1.55;
const INTERACTION_STRENGTH = 0.8;
const INTERACTION_TRAIL_LENGTH = 2.8;
const INTERACTION_RESPONSE = 7.5;
const FULL_EFFECT_SPEED = 4;
const MIN_MOVEMENT_SPEED = 0.05;
const TERRAIN_SIZE = 420;
const TWO_PI = Math.PI * 2;

let worldScene;
let originalGrass;
let characterRoot;
let styled = false;
let farGrassConverted = false;
let averageFps = 0;
let fpsFrames = 0;
let fpsElapsed = 0;
let previousTimestamp = performance.now();
let centerTileX = Number.NaN;
let centerTileZ = Number.NaN;
let nearMaterial;
let nearGeometry;
let farMaterial;

const nearTiles = new Map();
const desiredNearTiles = new Set();
const nearQueue = [];
const characterPosition = new THREE.Vector3();
const previousCharacterPosition = new THREE.Vector3();
const characterVelocity = new THREE.Vector2();
const interactionStart = new THREE.Vector2();
const interactionEnd = new THREE.Vector2();
const interactionDirection = new THREE.Vector2(0, 1);
const interactionTargetStart = new THREE.Vector2();
const normal = new THREE.Vector3();

const originalAdd = THREE.Object3D.prototype.add;
THREE.Object3D.prototype.add = function (...objects) {
  const result = originalAdd.apply(this, objects);
  if (
    this instanceof THREE.Scene &&
    objects.some((object) => !object.userData.drusnielManagedGrass)
  ) {
    worldScene = this;
    queueMicrotask(refreshWorldEnhancements);
  }
  return result;
};

brandPage();
requestAnimationFrame(updateFrame);

function brandPage() {
  document.title = "Drusniel World · Dense Drow Grass";
  const title = document.querySelector(".title strong");
  const subtitle = document.querySelector(".title span");
  if (title) title.textContent = "Drusniel World";
  if (subtitle) {
    subtitle.textContent =
      "Drow adventurer · dense single-blade near LOD · interactive grass wake";
  }

  const status = document.querySelector("#status");
  if (!status) return;
  const observer = new MutationObserver(updateStatusHeading);
  observer.observe(status, { childList: true, characterData: true, subtree: true });
  updateStatusHeading();
}

function updateFrame(timestamp) {
  const deltaSeconds = Math.min(
    Math.max((timestamp - previousTimestamp) / 1000, 0),
    0.1,
  );
  previousTimestamp = timestamp;
  updateFps(deltaSeconds);
  updateInteractiveGrass(deltaSeconds, timestamp / 1000);
  requestAnimationFrame(updateFrame);
}

function updateFps(deltaSeconds) {
  fpsFrames += 1;
  fpsElapsed += deltaSeconds;
  if (fpsElapsed >= FPS_SAMPLE_SECONDS) {
    averageFps = fpsFrames / fpsElapsed;
    fpsFrames = 0;
    fpsElapsed = 0;
    updateStatusHeading();
  } else if (averageFps === 0 && fpsElapsed > 0) {
    averageFps = fpsFrames / fpsElapsed;
  }
}

function updateStatusHeading() {
  const status = document.querySelector("#status");
  if (!status) return;
  const lines = (status.textContent ?? "").split("\n");
  const nearBladeCount = [...nearTiles.values()].reduce(
    (total, tile) => total + tile.count,
    0,
  );
  const heading =
    `Avg FPS ${averageFps.toFixed(1)} · ` +
    `${nearBladeCount.toLocaleString()} nearby single blades`;
  if (lines[0] === heading) return;
  lines[0] = heading;
  status.textContent = lines.join("\n");
}

function refreshWorldEnhancements() {
  if (!worldScene) return;
  recolorCharacter(worldScene);

  if (!originalGrass) {
    originalGrass = findOriginalGrass(worldScene);
  }
  if (originalGrass && !farGrassConverted) {
    convertOriginalGrassToPatchLod(originalGrass);
    farGrassConverted = true;
  }

  const headMesh = findHeadMesh(worldScene);
  if (headMesh?.parent && !styled) {
    addDrowFeatures(headMesh.parent);
    styled = true;
  }
  if (headMesh && !characterRoot) {
    characterRoot = findSceneChild(headMesh, worldScene);
    if (characterRoot) {
      characterRoot.getWorldPosition(characterPosition);
      previousCharacterPosition.copy(characterPosition);
      interactionStart.set(characterPosition.x, characterPosition.z);
      interactionEnd.copy(interactionStart);
      initializeNearGrass();
    }
  }
}

function findOriginalGrass(scene) {
  let grass;
  scene.traverse((object) => {
    if (grass || !(object instanceof THREE.InstancedMesh)) return;
    const parameters = object.geometry?.parameters;
    if (
      object.count >= 20000 &&
      Math.abs((parameters?.height ?? 0) - 0.9) < 0.01
    ) {
      grass = object;
    }
  });
  return grass;
}

function convertOriginalGrassToPatchLod(mesh) {
  const oldGeometry = mesh.geometry;
  const oldMaterial = mesh.material;
  mesh.geometry = createPatchGeometry();
  farMaterial = createPatchMaterial();
  mesh.material = farMaterial;
  mesh.name = "drusniel-mid-far-multiblade-patches";
  mesh.userData.drusnielManagedGrass = true;
  oldGeometry.dispose();
  if (Array.isArray(oldMaterial)) {
    oldMaterial.forEach((material) => material.dispose());
  } else {
    oldMaterial.dispose();
  }
}

function initializeNearGrass() {
  if (nearMaterial) return;
  nearGeometry = createSingleBladeGeometry();
  nearMaterial = createInteractiveNearMaterial();
  reconcileNearTiles(characterPosition);
}

function updateInteractiveGrass(deltaSeconds, elapsedSeconds) {
  if (!characterRoot || !nearMaterial) return;

  characterRoot.getWorldPosition(characterPosition);
  characterVelocity.set(
    (characterPosition.x - previousCharacterPosition.x) /
      Math.max(deltaSeconds, Number.EPSILON),
    (characterPosition.z - previousCharacterPosition.z) /
      Math.max(deltaSeconds, Number.EPSILON),
  );
  previousCharacterPosition.copy(characterPosition);
  const speed = characterVelocity.length();
  if (speed > MIN_MOVEMENT_SPEED) {
    interactionDirection.copy(characterVelocity).multiplyScalar(1 / speed);
  }

  interactionEnd.set(characterPosition.x, characterPosition.z);
  const movementBlend = THREE.MathUtils.smoothstep(
    speed,
    MIN_MOVEMENT_SPEED,
    FULL_EFFECT_SPEED,
  );
  interactionTargetStart
    .copy(interactionEnd)
    .addScaledVector(
      interactionDirection,
      -INTERACTION_TRAIL_LENGTH * movementBlend,
    );
  interactionStart.lerp(
    interactionTargetStart,
    1 - Math.exp(-INTERACTION_RESPONSE * deltaSeconds),
  );

  const strength =
    INTERACTION_STRENGTH * THREE.MathUtils.lerp(0.55, 1, movementBlend);
  updateGrassUniforms(
    nearMaterial.userData.grassUniforms,
    elapsedSeconds,
    strength,
  );
  if (farMaterial) {
    updateGrassUniforms(farMaterial.userData.grassUniforms, elapsedSeconds, 0);
  }

  const tileX = Math.floor(characterPosition.x / NEAR_TILE_SIZE);
  const tileZ = Math.floor(characterPosition.z / NEAR_TILE_SIZE);
  if (tileX !== centerTileX || tileZ !== centerTileZ) {
    centerTileX = tileX;
    centerTileZ = tileZ;
    reconcileNearTiles(characterPosition);
  }
  processNearTileQueue();
}

function updateGrassUniforms(uniforms, elapsedSeconds, strength) {
  if (!uniforms) return;
  uniforms.uTime.value = elapsedSeconds;
  uniforms.uCharacterPosition.value.set(
    characterPosition.x,
    characterPosition.z,
  );
  uniforms.uInteractionStart.value.copy(interactionStart);
  uniforms.uInteractionEnd.value.copy(interactionEnd);
  uniforms.uInteractionDirection.value.copy(interactionDirection);
  uniforms.uInteractionStrength.value = strength;
}

function reconcileNearTiles(focus) {
  centerTileX = Math.floor(focus.x / NEAR_TILE_SIZE);
  centerTileZ = Math.floor(focus.z / NEAR_TILE_SIZE);
  const radius =
    NEAR_DISTANCE + NEAR_TRANSITION + NEAR_TILE_SIZE * Math.SQRT2 * 0.5;
  const offset = Math.ceil(radius / NEAR_TILE_SIZE);
  desiredNearTiles.clear();
  nearQueue.length = 0;

  for (let dz = -offset; dz <= offset; dz += 1) {
    for (let dx = -offset; dx <= offset; dx += 1) {
      const tileX = centerTileX + dx;
      const tileZ = centerTileZ + dz;
      const originX = tileX * NEAR_TILE_SIZE;
      const originZ = tileZ * NEAR_TILE_SIZE;
      const distance = distanceToTile(
        focus.x,
        focus.z,
        originX,
        originZ,
      );
      if (distance > radius || !tileWithinWorld(originX, originZ)) continue;
      const key = `${tileX}:${tileZ}`;
      desiredNearTiles.add(key);
      if (!nearTiles.has(key)) {
        nearQueue.push({ key, tileX, tileZ, distance });
      }
    }
  }

  for (const [key, tile] of nearTiles) {
    if (!desiredNearTiles.has(key)) {
      worldScene.remove(tile);
      tile.dispose();
      nearTiles.delete(key);
    }
  }
  nearQueue.sort((left, right) => left.distance - right.distance);
}

function processNearTileQueue() {
  for (
    let built = 0;
    built < NEAR_TILES_PER_FRAME && nearQueue.length > 0;
    built += 1
  ) {
    const request = nearQueue.shift();
    if (
      !request ||
      !desiredNearTiles.has(request.key) ||
      nearTiles.has(request.key)
    ) {
      built -= 1;
      continue;
    }
    const tile = createNearTile(request);
    if (tile) {
      nearTiles.set(request.key, tile);
      worldScene.add(tile);
      updateStatusHeading();
    }
  }
}

function createNearTile(request) {
  const requestedCount = Math.round(
    NEAR_TILE_SIZE * NEAR_TILE_SIZE * NEAR_DENSITY,
  );
  const columns = Math.ceil(Math.sqrt(requestedCount));
  const rows = Math.ceil(requestedCount / columns);
  const cellWidth = NEAR_TILE_SIZE / columns;
  const cellDepth = NEAR_TILE_SIZE / rows;
  const originX = request.tileX * NEAR_TILE_SIZE;
  const originZ = request.tileZ * NEAR_TILE_SIZE;
  const random = seededRandom(hashInt(request.tileX, request.tileZ, 42017));
  const mesh = new THREE.InstancedMesh(
    nearGeometry,
    nearMaterial,
    requestedCount,
  );
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const alignment = new THREE.Quaternion();
  const yaw = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let count = 0;

  for (let index = 0; index < requestedCount; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x =
      originX +
      (column + 0.5) * cellWidth +
      (random() - 0.5) * cellWidth * 0.92;
    const z =
      originZ +
      (row + 0.5) * cellDepth +
      (random() - 0.5) * cellDepth * 0.92;
    normalAt(x, z, normal);
    if (normal.y < 0.72) continue;
    position.set(x, heightAt(x, z) - 0.015, z);
    alignment.setFromUnitVectors(up, normal);
    yaw.setFromAxisAngle(up, random() * TWO_PI);
    quaternion.copy(alignment).multiply(yaw);
    scale.set(
      0.72 + random() * 0.56,
      0.72 + random() * 0.62,
      0.72 + random() * 0.56,
    );
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(count, matrix);
    count += 1;
  }

  if (count === 0) {
    mesh.dispose();
    return undefined;
  }
  mesh.count = count;
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.frustumCulled = true;
  mesh.userData.drusnielManagedGrass = true;
  mesh.boundingBox = new THREE.Box3(
    new THREE.Vector3(originX, -30, originZ),
    new THREE.Vector3(originX + NEAR_TILE_SIZE, 30, originZ + NEAR_TILE_SIZE),
  );
  mesh.boundingSphere = mesh.boundingBox.getBoundingSphere(new THREE.Sphere());
  return mesh;
}

function createSingleBladeGeometry() {
  const height = 0.82;
  const width = 0.038;
  const lean = 0.12;
  const segments = 2;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let segment = 0; segment <= segments; segment += 1) {
    const progress = segment / segments;
    const curve = progress * progress * (3 - 2 * progress);
    const halfWidth = width * Math.pow(1 - progress, 0.72);
    positions.push(
      -halfWidth,
      height * progress,
      lean * curve,
      halfWidth,
      height * progress,
      lean * curve,
    );
    uvs.push(0, progress, 1, progress);
  }
  for (let segment = 0; segment < segments; segment += 1) {
    const row = segment * 2;
    indices.push(row, row + 2, row + 1, row + 2, row + 3, row + 1);
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

function createPatchGeometry() {
  const positions = [];
  const uvs = [];
  const indices = [];
  const bladeCount = 6;

  for (let blade = 0; blade < bladeCount; blade += 1) {
    const angle = (blade / bladeCount) * TWO_PI + (blade % 2) * 0.37;
    const radius = blade === 0 ? 0 : 0.12 + (blade % 3) * 0.055;
    const rootX = Math.cos(angle) * radius;
    const rootZ = Math.sin(angle) * radius;
    const facing = angle + Math.PI * 0.5;
    const width = 0.055 + (blade % 2) * 0.012;
    const height = 0.64 + (blade % 3) * 0.12;
    const halfX = Math.cos(facing) * width;
    const halfZ = Math.sin(facing) * width;
    const tipX = rootX + Math.cos(angle) * 0.12;
    const tipZ = rootZ + Math.sin(angle) * 0.12;
    const offset = positions.length / 3;
    positions.push(
      rootX - halfX,
      0,
      rootZ - halfZ,
      rootX + halfX,
      0,
      rootZ + halfZ,
      tipX,
      height,
      tipZ,
    );
    uvs.push(0, 0, 1, 0, 0.5, 1);
    indices.push(offset, offset + 1, offset + 2);
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

function createInteractiveNearMaterial() {
  const uniforms = createGrassUniforms();
  const material = new THREE.MeshLambertMaterial({
    color: 0x4e833e,
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uTime;
uniform vec2 uCharacterPosition;
uniform vec2 uInteractionStart;
uniform vec2 uInteractionEnd;
uniform vec2 uInteractionDirection;
uniform float uInteractionRadius;
uniform float uInteractionStrength;
varying float vCharacterDistance;
varying float vBladeProgress;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vec4 grassRoot = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
float grassProgress = uv.y;
float grassPhase = fract(sin(dot(grassRoot.xz, vec2(12.9898, 78.233))) * 43758.5453);
vec2 grassWind = normalize(vec2(0.8, 0.35));
float grassWave = sin(dot(grassRoot.xz, grassWind) * 0.12 + uTime * 1.9 + grassPhase * 6.28318);
mat3 grassBasis = mat3(instanceMatrix);
float grassHorizontalScale = max(length(grassBasis[0]), 0.0001);
float grassVerticalScale = max(length(grassBasis[1]), 0.0001);
vec3 grassWorldWind = vec3(grassWind.x, 0.0, grassWind.y);
vec3 grassLocalWind = vec3(
  dot(grassWorldWind, grassBasis[0] / grassHorizontalScale),
  dot(grassWorldWind, grassBasis[1] / grassVerticalScale),
  dot(grassWorldWind, grassBasis[2] / grassHorizontalScale)
);
transformed += grassLocalWind * grassWave * 0.11 * pow(grassProgress, 1.6);
vec2 interactionSegment = uInteractionEnd - uInteractionStart;
float interactionLengthSquared = max(dot(interactionSegment, interactionSegment), 0.0001);
float interactionT = clamp(
  dot(grassRoot.xz - uInteractionStart, interactionSegment) /
    interactionLengthSquared,
  0.0,
  1.0
);
vec2 interactionClosest = uInteractionStart + interactionSegment * interactionT;
vec2 interactionOffset = grassRoot.xz - interactionClosest;
float interactionDistance = length(interactionOffset);
vec2 perpendicular = vec2(-uInteractionDirection.y, uInteractionDirection.x);
float fallbackSide = grassPhase < 0.5 ? -1.0 : 1.0;
vec2 interactionAway = interactionDistance > 0.0001
  ? interactionOffset / interactionDistance
  : perpendicular * fallbackSide;
float interactionFalloff = 1.0 - smoothstep(
  uInteractionRadius * 0.16,
  uInteractionRadius,
  interactionDistance
);
vec3 interactionWorldPush = vec3(interactionAway.x, 0.0, interactionAway.y);
vec3 interactionLocalPush = vec3(
  dot(interactionWorldPush, grassBasis[0] / grassHorizontalScale),
  dot(interactionWorldPush, grassBasis[1] / grassVerticalScale),
  dot(interactionWorldPush, grassBasis[2] / grassHorizontalScale)
);
float interactionBend = interactionFalloff * uInteractionStrength * pow(grassProgress, 1.2);
transformed += interactionLocalPush * interactionBend;
transformed.y -= interactionFalloff * uInteractionStrength * 0.2 * pow(grassProgress, 1.2);
vCharacterDistance = distance(grassRoot.xz, uCharacterPosition);
vBladeProgress = grassProgress;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uNearDistance;
uniform float uNearTransition;
varying float vCharacterDistance;
varying float vBladeProgress;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float nearCoverage = 1.0 - smoothstep(
  uNearDistance - uNearTransition,
  uNearDistance + uNearTransition,
  vCharacterDistance
);
float nearDither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
if (nearDither > nearCoverage) discard;
float tipBlend = smoothstep(0.0, 1.0, vBladeProgress);
diffuseColor.rgb *= mix(vec3(0.72, 0.82, 0.68), vec3(1.04, 1.14, 0.94), tipBlend);`,
      );
  };
  material.customProgramCacheKey = () => "drusniel-near-grass-v2";
  material.userData.grassUniforms = uniforms;
  return material;
}

function createPatchMaterial() {
  const uniforms = createGrassUniforms();
  const material = new THREE.MeshLambertMaterial({
    color: 0x47783a,
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uTime;
uniform vec2 uCharacterPosition;
varying float vCharacterDistance;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vec4 grassRoot = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
float grassProgress = uv.y;
float grassPhase = fract(sin(dot(grassRoot.xz, vec2(12.9898, 78.233))) * 43758.5453);
vec2 grassWind = normalize(vec2(0.8, 0.35));
float grassWave = sin(dot(grassRoot.xz, grassWind) * 0.09 + uTime * 1.4 + grassPhase * 6.28318);
mat3 grassBasis = mat3(instanceMatrix);
float horizontalScale = max(length(grassBasis[0]), 0.0001);
vec3 worldWind = vec3(grassWind.x, 0.0, grassWind.y);
vec3 localWind = vec3(
  dot(worldWind, grassBasis[0] / horizontalScale),
  0.0,
  dot(worldWind, grassBasis[2] / horizontalScale)
);
transformed += localWind * grassWave * 0.075 * pow(grassProgress, 1.5);
vCharacterDistance = distance(grassRoot.xz, uCharacterPosition);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uNearDistance;
uniform float uNearTransition;
varying float vCharacterDistance;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float patchCoverage = smoothstep(
  uNearDistance - uNearTransition,
  uNearDistance + uNearTransition,
  vCharacterDistance
);
float patchDither = fract(sin(dot(gl_FragCoord.xy, vec2(39.3468, 11.135))) * 24634.6345);
if (patchDither > patchCoverage) discard;`,
      );
  };
  material.customProgramCacheKey = () => "drusniel-patch-grass-v2";
  material.userData.grassUniforms = uniforms;
  return material;
}

function createGrassUniforms() {
  return {
    uTime: { value: 0 },
    uCharacterPosition: { value: new THREE.Vector2() },
    uInteractionStart: { value: new THREE.Vector2() },
    uInteractionEnd: { value: new THREE.Vector2() },
    uInteractionDirection: { value: new THREE.Vector2(0, 1) },
    uInteractionRadius: { value: INTERACTION_RADIUS },
    uInteractionStrength: { value: 0 },
    uNearDistance: { value: NEAR_DISTANCE },
    uNearTransition: { value: NEAR_TRANSITION },
  };
}

function recolorCharacter(scene) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      const replacement = PALETTE.get(material.color.getHex());
      if (replacement !== undefined) {
        material.color.setHex(replacement);
        material.needsUpdate = true;
      }
      const radius = object.geometry?.parameters?.radius;
      if (radius === 0.046) {
        material.color.setHex(DROW_SKIN);
        material.roughness = 0.82;
        material.needsUpdate = true;
      }
    }
  });
}

function findHeadMesh(scene) {
  let headMesh;
  scene.traverse((object) => {
    if (headMesh || !(object instanceof THREE.Mesh)) return;
    const radius = object.geometry?.parameters?.radius;
    if (radius === 0.095 && Math.abs(object.position.y - 1.655) < 0.001) {
      headMesh = object;
    }
  });
  return headMesh;
}

function findSceneChild(object, scene) {
  let current = object;
  while (current.parent && current.parent !== scene) {
    current = current.parent;
  }
  return current.parent === scene ? current : undefined;
}

function addDrowFeatures(head) {
  const skin = material(DROW_SKIN, 0.82);
  const hair = material(DROW_HAIR, 0.72);
  const eyes = new THREE.MeshStandardMaterial({
    color: DROW_EYES,
    emissive: DROW_EYES,
    emissiveIntensity: 2.4,
    roughness: 0.28,
    metalness: 0,
  });

  const hairCap = addMesh(
    head,
    new THREE.SphereGeometry(
      0.104,
      20,
      10,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.56,
    ),
    hair,
    0,
    1.68,
    -0.004,
  );
  hairCap.scale.set(1.03, 0.92, 1.02);

  for (const side of [-1, 1]) {
    const ear = addMesh(
      head,
      new THREE.ConeGeometry(0.032, 0.16, 8),
      skin,
      side * 0.13,
      1.665,
      0.005,
    );
    ear.rotation.z = side * -Math.PI * 0.5;
    ear.rotation.y = side * 0.1;
    ear.scale.z = 0.62;

    const eye = addMesh(
      head,
      new THREE.SphereGeometry(0.015, 12, 8),
      eyes,
      side * 0.033,
      1.672,
      0.099,
    );
    eye.scale.set(1, 0.58, 0.42);

    const lock = addMesh(
      head,
      new THREE.ConeGeometry(0.022, 0.19, 8),
      hair,
      side * 0.064,
      1.635,
      0.079,
    );
    lock.rotation.z = side * 0.2;
    lock.rotation.x = -0.12;
  }
}

function addMesh(parent, geometry, meshMaterial, x, y, z) {
  const mesh = new THREE.Mesh(geometry, meshMaterial);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function material(color, roughness) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function tileWithinWorld(originX, originZ) {
  const halfWorld = TERRAIN_SIZE * 0.47;
  return (
    originX + NEAR_TILE_SIZE >= -halfWorld &&
    originZ + NEAR_TILE_SIZE >= -halfWorld &&
    originX <= halfWorld &&
    originZ <= halfWorld
  );
}

function distanceToTile(x, z, originX, originZ) {
  const distanceX = Math.max(
    originX - x,
    0,
    x - (originX + NEAR_TILE_SIZE),
  );
  const distanceZ = Math.max(
    originZ - z,
    0,
    z - (originZ + NEAR_TILE_SIZE),
  );
  return Math.hypot(distanceX, distanceZ);
}

function heightAt(x, z) {
  const broad = fbm(x * 0.012, z * 0.012, 4, 42017);
  const detail = fbm(x * 0.045, z * 0.045, 3, 42121);
  const ridge = 1 - Math.abs(fbm(x * 0.009, z * 0.009, 4, 42303) * 2 - 1);
  return (broad - 0.5) * 12 + (detail - 0.5) * 2.6 + ridge * ridge * 3.4;
}

function normalAt(x, z, target) {
  const step = 0.75;
  const left = heightAt(x - step, z);
  const right = heightAt(x + step, z);
  const down = heightAt(x, z - step);
  const up = heightAt(x, z + step);
  return target.set(left - right, step * 2, down - up).normalize();
}

function fbm(x, z, octaves, seed) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let normalization = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    value += valueNoise(x * frequency, z * frequency, seed + octave * 1013) * amplitude;
    normalization += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }
  return value / normalization;
}

function valueNoise(x, z, seed) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = x - x0;
  const tz = z - z0;
  const sx = tx * tx * (3 - 2 * tx);
  const sz = tz * tz * (3 - 2 * tz);
  const a = hash(x0, z0, seed);
  const b = hash(x0 + 1, z0, seed);
  const c = hash(x0, z0 + 1, seed);
  const d = hash(x0 + 1, z0 + 1, seed);
  const lower = a + (b - a) * sx;
  const upper = c + (d - c) * sx;
  return lower + (upper - lower) * sz;
}

function hash(x, z, seed) {
  return hashInt(x, z, seed) / 4294967295;
}

function hashInt(x, z, seed) {
  let value = Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
