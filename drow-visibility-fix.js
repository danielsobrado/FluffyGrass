import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js";

const DROW_SKIN = 0x665686;
const DROW_SKIN_EMISSIVE = 0x120e20;
const DROW_HAIR = 0xf1f0ff;
const DROW_EYES = 0xe66cff;
const DROW_HOOD_EDGE = 0x584477;
const MAX_FIND_ATTEMPTS = 180;

let attempts = 0;
requestAnimationFrame(applyVisibleDrowFeatures);

function applyVisibleDrowFeatures() {
  const headMesh = findOriginalHead();
  const head = headMesh?.parent;
  if (!head || !headMesh) {
    attempts += 1;
    if (attempts < MAX_FIND_ATTEMPTS) {
      requestAnimationFrame(applyVisibleDrowFeatures);
    }
    return;
  }
  if (head.userData.drowVisibilityFixed) {
    return;
  }
  head.userData.drowVisibilityFixed = true;

  hideLegacyDrowAdditions(head, headMesh);
  pullHoodBack(head.parent);

  const skin = new THREE.MeshStandardMaterial({
    color: DROW_SKIN,
    emissive: DROW_SKIN_EMISSIVE,
    emissiveIntensity: 0.45,
    roughness: 0.78,
    metalness: 0,
  });
  const hair = material(DROW_HAIR, 0.64);
  const eyes = new THREE.MeshStandardMaterial({
    color: DROW_EYES,
    emissive: DROW_EYES,
    emissiveIntensity: 4,
    roughness: 0.2,
    metalness: 0,
  });

  headMesh.material = skin;
  addFace(head, skin);
  addEar(head, skin, -1);
  addEar(head, skin, 1);
  addHair(head, hair);
  addEyes(head, eyes);

  const faceLight = new THREE.PointLight(0x9d87ff, 0.42, 2.2, 2);
  faceLight.position.set(0, 1.67, 0.38);
  head.add(faceLight);
}

function findOriginalHead() {
  let result;
  document.querySelector("canvas");
  for (const scene of findScenes()) {
    scene.traverse((object) => {
      if (result || !(object instanceof THREE.Mesh)) return;
      const radius = object.geometry?.parameters?.radius;
      if (radius === 0.095 && Math.abs(object.position.y - 1.655) < 0.001) {
        result = object;
      }
    });
  }
  return result;
}

function findScenes() {
  const scenes = [];
  const visited = new Set();
  const scan = (object) => {
    if (!object || visited.has(object)) return;
    visited.add(object);
    if (object instanceof THREE.Scene) scenes.push(object);
    if (object.children) {
      for (const child of object.children) scan(child);
    }
  };

  const rendererLists = THREE.Object3D.DEFAULT_UP ? window : {};
  for (const key of Object.getOwnPropertyNames(rendererLists)) {
    try {
      const value = rendererLists[key];
      if (value instanceof THREE.Scene || value instanceof THREE.Object3D) {
        scan(value);
      }
    } catch {
      // Browser globals can expose throwing accessors.
    }
  }

  if (scenes.length === 0) {
    const originalAdd = THREE.Object3D.prototype.add;
    if (!originalAdd.userData?.drowSceneCapture) {
      const wrappedAdd = function (...objects) {
        const result = originalAdd.apply(this, objects);
        if (this instanceof THREE.Scene) {
          window.__drusnielScene = this;
        }
        return result;
      };
      wrappedAdd.userData = { drowSceneCapture: true };
      THREE.Object3D.prototype.add = wrappedAdd;
    }
    if (window.__drusnielScene) scenes.push(window.__drusnielScene);
  }
  return scenes;
}

function hideLegacyDrowAdditions(head, originalHead) {
  head.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object === originalHead) return;
    const parameters = object.geometry?.parameters;
    const radius = parameters?.radius;
    const isLegacyEye = radius === 0.015;
    const isLegacyHairCap = radius === 0.104;
    const isLegacyCone =
      object.geometry.type === "ConeGeometry" &&
      (radius === 0.032 || radius === 0.022);
    if (isLegacyEye || isLegacyHairCap || isLegacyCone) {
      object.visible = false;
    }
  });
}

function pullHoodBack(body) {
  if (!body) return;
  for (const child of body.children) {
    const trim = child.children?.find(
      (object) =>
        object instanceof THREE.Mesh && object.geometry.type === "TubeGeometry",
    );
    if (!trim) continue;
    child.position.z = -0.055;
    child.scale.set(1.03, 1.01, 0.76);
    trim.material = material(DROW_HOOD_EDGE, 0.7);
    return;
  }
}

function addFace(head, skin) {
  const face = addMesh(
    head,
    new THREE.SphereGeometry(0.102, 24, 16),
    skin,
    0,
    1.655,
    0.122,
  );
  face.name = "drow-visible-face";
  face.scale.set(0.82, 1.04, 0.3);
}

function addEar(head, skin, side) {
  const ear = addMesh(
    head,
    new THREE.ConeGeometry(0.035, 0.2, 10),
    skin,
    side * 0.148,
    1.665,
    0.065,
  );
  ear.rotation.z = side * -Math.PI * 0.5;
  ear.rotation.y = side * 0.16;
  ear.scale.z = 0.68;
}

function addHair(head, hair) {
  const cap = addMesh(
    head,
    new THREE.SphereGeometry(
      0.108,
      24,
      12,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.52,
    ),
    hair,
    0,
    1.688,
    0.01,
  );
  cap.scale.set(1.06, 0.92, 1.02);

  for (const side of [-1, 1]) {
    const lock = addMesh(
      head,
      new THREE.ConeGeometry(0.024, 0.24, 10),
      hair,
      side * 0.086,
      1.635,
      0.13,
    );
    lock.rotation.z = side * 0.22;
    lock.rotation.x = -0.18;
  }

  for (const side of [-1, 0, 1]) {
    const fringe = addMesh(
      head,
      new THREE.ConeGeometry(0.017, 0.12, 8),
      hair,
      side * 0.035,
      1.705,
      0.151,
    );
    fringe.rotation.x = -0.2;
    fringe.rotation.z = side * 0.16;
  }
}

function addEyes(head, eyes) {
  for (const side of [-1, 1]) {
    const eye = addMesh(
      head,
      new THREE.SphereGeometry(0.019, 14, 10),
      eyes,
      side * 0.034,
      1.67,
      0.154,
    );
    eye.scale.set(1.15, 0.55, 0.38);
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
