import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js";

const VERSION = "v0.9.3-ultra-near-grass";
const CORE_RADIUS = 4;
const FADE_RADIUS = 5;
const REBUILD_DISTANCE = 0.35;
const REBUILD_INTERVAL_SECONDS = 0.2;
const MAX_ULTRA_BLADES = 6000;
const INTERACTION_STRENGTH_SCALE = 0.94 / 0.8;
const SOURCE_MIN_INSTANCES = 1000;
const SOURCE_MAX_INSTANCES = 10000;
const OFFSET_MIN = 0.035;
const OFFSET_MAX = 0.11;
const TWO_PI = Math.PI * 2;

const characterPosition = new THREE.Vector3();
const previousBuildPosition = new THREE.Vector3(
  Number.POSITIVE_INFINITY,
  0,
  Number.POSITIVE_INFINITY,
);
const sourceInstanceMatrix = new THREE.Matrix4();
const worldInstanceMatrix = new THREE.Matrix4();
const bladeScale = new THREE.Vector3();

let scene;
let characterRoot;
let ultraMesh;
let lastRebuildTime = Number.NEGATIVE_INFINITY;

applyBranding();
requestAnimationFrame(update);

function applyBranding() {
  document.title = `Drusniel World · ${VERSION}`;
  const title = document.querySelector(".title strong");
  if (title) {
    title.textContent = `Drusniel World · ${VERSION}`;
  }
  const subtitle = document.querySelector(".title span");
  if (subtitle) {
    subtitle.textContent =
      "2× blades through 4 m · dense hybrid LOD · stronger interactive wake";
  }
}

function update(timestamp) {
  scene = window.__drusnielScene;
  if (!scene) {
    requestAnimationFrame(update);
    return;
  }

  characterRoot ??= findCharacterRoot(scene);
  if (!characterRoot) {
    requestAnimationFrame(update);
    return;
  }

  characterRoot.getWorldPosition(characterPosition);
  strengthenInteraction(scene);

  const elapsedSeconds = timestamp / 1000;
  const moved = previousBuildPosition.distanceToSquared(characterPosition);
  if (
    elapsedSeconds - lastRebuildTime >= REBUILD_INTERVAL_SECONDS &&
    (moved >= REBUILD_DISTANCE * REBUILD_DISTANCE || !ultraMesh)
  ) {
    rebuildUltraNearLayer(scene);
    previousBuildPosition.copy(characterPosition);
    lastRebuildTime = elapsedSeconds;
  }

  requestAnimationFrame(update);
}

function findCharacterRoot(world) {
  let best;
  let bestMeshCount = 0;

  for (const child of world.children) {
    if (!(child instanceof THREE.Group)) {
      continue;
    }
    let meshCount = 0;
    child.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        meshCount += 1;
      }
    });
    if (meshCount > bestMeshCount) {
      best = child;
      bestMeshCount = meshCount;
    }
  }

  return bestMeshCount >= 8 ? best : undefined;
}

function findSourceTiles(world) {
  const tiles = [];
  world.traverse((object) => {
    if (
      !(object instanceof THREE.InstancedMesh) ||
      object === ultraMesh ||
      !object.userData.drusnielManagedGrass ||
      object.count < SOURCE_MIN_INSTANCES ||
      object.count > SOURCE_MAX_INSTANCES ||
      !object.material?.userData?.grassUniforms
    ) {
      return;
    }

    if (intersectsUltraRadius(object)) {
      tiles.push(object);
    }
  });
  return tiles;
}

function intersectsUltraRadius(tile) {
  const bounds = tile.boundingBox;
  if (!bounds) {
    return true;
  }

  const distanceX = Math.max(
    bounds.min.x - characterPosition.x,
    0,
    characterPosition.x - bounds.max.x,
  );
  const distanceZ = Math.max(
    bounds.min.z - characterPosition.z,
    0,
    characterPosition.z - bounds.max.z,
  );
  return Math.hypot(distanceX, distanceZ) <= FADE_RADIUS + 1;
}

function rebuildUltraNearLayer(world) {
  const sourceTiles = findSourceTiles(world);
  if (sourceTiles.length === 0) {
    return;
  }

  ensureUltraMesh(world, sourceTiles[0]);
  if (!ultraMesh) {
    return;
  }

  let targetIndex = 0;
  for (const source of sourceTiles) {
    source.updateMatrixWorld(true);
    const sourceValues = source.instanceMatrix.array;

    for (
      let sourceIndex = 0;
      sourceIndex < source.count && targetIndex < MAX_ULTRA_BLADES;
      sourceIndex += 1
    ) {
      sourceInstanceMatrix.fromArray(sourceValues, sourceIndex * 16);
      worldInstanceMatrix.multiplyMatrices(
        source.matrixWorld,
        sourceInstanceMatrix,
      );

      const values = worldInstanceMatrix.elements;
      const deltaX = values[12] - characterPosition.x;
      const deltaZ = values[14] - characterPosition.z;
      const distance = Math.hypot(deltaX, deltaZ);
      if (distance > FADE_RADIUS) {
        continue;
      }

      const seed = hash01(
        Math.floor(values[12] * 97) ^
          Math.floor(values[14] * 131) ^
          sourceIndex,
      );
      const coverage =
        distance <= CORE_RADIUS
          ? 1
          : THREE.MathUtils.clamp(
              (FADE_RADIUS - distance) / (FADE_RADIUS - CORE_RADIUS),
              0,
              1,
            );
      if (seed > coverage) {
        continue;
      }

      const angle = hash01(sourceIndex * 31 + 7) * TWO_PI;
      const offset = THREE.MathUtils.lerp(
        OFFSET_MIN,
        OFFSET_MAX,
        hash01(sourceIndex * 47 + 13),
      );
      values[12] += Math.cos(angle) * offset;
      values[14] += Math.sin(angle) * offset;

      const horizontalScale = THREE.MathUtils.lerp(
        0.92,
        1.08,
        hash01(sourceIndex * 59 + 17),
      );
      const verticalScale = THREE.MathUtils.lerp(
        0.94,
        1.1,
        hash01(sourceIndex * 67 + 23),
      );
      bladeScale.set(horizontalScale, verticalScale, horizontalScale);
      worldInstanceMatrix.scale(bladeScale);
      ultraMesh.setMatrixAt(targetIndex, worldInstanceMatrix);
      targetIndex += 1;
    }
  }

  ultraMesh.count = targetIndex;
  ultraMesh.instanceMatrix.needsUpdate = true;
  ultraMesh.visible = targetIndex > 0;
}

function ensureUltraMesh(world, source) {
  if (ultraMesh) {
    return;
  }

  ultraMesh = new THREE.InstancedMesh(
    source.geometry,
    source.material,
    MAX_ULTRA_BLADES,
  );
  ultraMesh.name = "drusniel-ultra-near-single-blades";
  ultraMesh.userData.drusnielManagedGrass = true;
  ultraMesh.castShadow = false;
  ultraMesh.receiveShadow = true;
  ultraMesh.frustumCulled = false;
  ultraMesh.count = 0;
  ultraMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  world.add(ultraMesh);
}

function strengthenInteraction(world) {
  const materials = new Set();
  world.traverse((object) => {
    if (
      object instanceof THREE.InstancedMesh &&
      object.count >= SOURCE_MIN_INSTANCES &&
      object.count <= MAX_ULTRA_BLADES &&
      object.material?.userData?.grassUniforms
    ) {
      materials.add(object.material);
    }
  });

  for (const material of materials) {
    const uniform = material.userData.grassUniforms?.uInteractionStrength;
    if (uniform && Number.isFinite(uniform.value)) {
      uniform.value = Math.min(2, uniform.value * INTERACTION_STRENGTH_SCALE);
    }
  }
}

function hash01(value) {
  let hash = value | 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
}
