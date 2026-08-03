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

let worldScene;
let styled = false;
let averageFps = 0;
let fpsFrames = 0;
let fpsElapsed = 0;
let previousTimestamp = performance.now();

const originalAdd = THREE.Object3D.prototype.add;
THREE.Object3D.prototype.add = function (...objects) {
  const result = originalAdd.apply(this, objects);
  if (this instanceof THREE.Scene) {
    worldScene = this;
    queueMicrotask(applyDrowTheme);
  }
  return result;
};

brandPage();
requestAnimationFrame(sampleFps);

function brandPage() {
  document.title = "Drusniel World · Drow Adventurer";
  const title = document.querySelector(".title strong");
  const subtitle = document.querySelector(".title span");
  if (title) title.textContent = "Drusniel World";
  if (subtitle) subtitle.textContent = "Drow adventurer · direct GitHub Pages build";

  const status = document.querySelector("#status");
  if (!status) return;
  const observer = new MutationObserver(updateStatusHeading);
  observer.observe(status, { childList: true, characterData: true, subtree: true });
  updateStatusHeading();
}

function sampleFps(timestamp) {
  const deltaSeconds = Math.min((timestamp - previousTimestamp) / 1000, 0.1);
  previousTimestamp = timestamp;
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
  requestAnimationFrame(sampleFps);
}

function updateStatusHeading() {
  const status = document.querySelector("#status");
  if (!status) return;
  const lines = (status.textContent ?? "").split("\n");
  const heading = `Avg FPS ${averageFps.toFixed(1)} · Drow adventurer`;
  if (lines[0] === heading) return;
  lines[0] = heading;
  status.textContent = lines.join("\n");
}

function applyDrowTheme() {
  if (!worldScene) return;
  recolorCharacter(worldScene);
  if (styled) return;

  const headMesh = findHeadMesh(worldScene);
  if (!headMesh?.parent) return;
  addDrowFeatures(headMesh.parent);
  styled = true;
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
