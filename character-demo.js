import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js";

const CONFIG = Object.freeze({
  terrainSize: 420,
  terrainSegments: 120,
  grassCount: 22000,
  grassHeight: 0.9,
  walkSpeed: 2.5,
  runSpeed: 5.4,
  acceleration: 26,
  deceleration: 30,
  turnRate: 11,
  cameraDistance: 6,
  cameraMinDistance: 2.8,
  cameraMaxDistance: 10,
  cameraElevation: THREE.MathUtils.degToRad(18),
  cameraMinElevation: THREE.MathUtils.degToRad(6),
  cameraMaxElevation: THREE.MathUtils.degToRad(58),
  cameraLookHeight: 1.32,
  cameraClearance: 0.7,
  cameraFollowRate: 4.5,
  mouseSensitivity: 0.0022,
  touchSensitivity: 0.004,
  zoomSensitivity: 0.004,
  characterScale: 1,
  strideLength: 1.55,
});

const COLORS = Object.freeze({
  sky: 0xbfd4df,
  fog: 0xbfd4df,
  groundLow: new THREE.Color(0x385c32),
  groundHigh: new THREE.Color(0x6f7b4e),
  grass: 0x3f7934,
  robe: 0x081020,
  mantle: 0x131b2f,
  tunic: 0x3b3934,
  leather: 0x0c0806,
  skin: 0x2a1c14,
  trim: 0x1f3250,
  fur: 0xb3b8c2,
});

const canvas = document.querySelector("#canvas");
const statusElement = document.querySelector("#status");
const runButton = document.querySelector("[data-run]");
const resetButton = document.querySelector("[data-reset]");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Canvas #canvas was not found.");
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.sky);
scene.fog = new THREE.FogExp2(COLORS.fog, 0.0065);

const camera = new THREE.PerspectiveCamera(
  58,
  window.innerWidth / window.innerHeight,
  0.1,
  900,
);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);

scene.add(new THREE.HemisphereLight(0xdceeff, 0x3f3a2d, 1.5));
const sun = new THREE.DirectionalLight(0xfff3d7, 2.35);
sun.position.set(120, 180, 90);
sun.castShadow = true;
sun.shadow.camera.left = -55;
sun.shadow.camera.right = 55;
sun.shadow.camera.top = 55;
sun.shadow.camera.bottom = -55;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 420;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const terrain = createTerrain();
scene.add(terrain);
const grass = createGrass();
scene.add(grass);
const character = createCharacter();
scene.add(character.root);

const keys = new Set();
const moveInput = new THREE.Vector2();
const touchMove = new THREE.Vector2();
const velocity = new THREE.Vector3();
const desiredVelocity = new THREE.Vector3();
const velocityDelta = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const movement = new THREE.Vector3();
const groundNormal = new THREE.Vector3(0, 1, 0);
const characterPosition = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();
const cameraSample = new THREE.Vector3();
const clock = new THREE.Clock();

let cameraYaw = 0;
let cameraElevation = CONFIG.cameraElevation;
let cameraDistance = CONFIG.cameraDistance;
let facing = 0;
let speed = 0;
let previousSpeed = 0;
let acceleration = 0;
let distanceTravelled = 0;
let animationTime = 0;
let mobileSprint = false;
let movePointer = null;
let lookPointer = null;
let frameCount = 0;
let statusElapsed = 0;

reset();
clock.start();
renderer.setAnimationLoop(render);

window.addEventListener("resize", handleResize);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", clearInput);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearInput();
});
canvas.addEventListener("click", () => {
  if (matchMedia("(pointer: fine)").matches && document.pointerLockElement !== canvas) {
    void canvas.requestPointerLock();
  }
});
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
canvas.addEventListener("wheel", handleWheel, { passive: false });
window.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("pointerdown", handlePointerDown, { passive: false });
window.addEventListener("pointermove", handlePointerMove, { passive: false });
window.addEventListener("pointerup", handlePointerUp, { passive: false });
window.addEventListener("pointercancel", handlePointerUp, { passive: false });

runButton?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  mobileSprint = true;
  runButton.classList.add("active");
});
for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
  runButton?.addEventListener(type, (event) => {
    event.preventDefault();
    event.stopPropagation();
    mobileSprint = false;
    runButton.classList.remove("active");
  });
}
resetButton?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  reset();
});

function render() {
  const deltaSeconds = THREE.MathUtils.clamp(clock.getDelta(), 0, 0.1);
  animationTime += deltaSeconds;
  frameCount += 1;
  updateInput(deltaSeconds);
  updateCharacter(deltaSeconds);
  updateCamera(deltaSeconds);
  renderer.render(scene, camera);
  updateStatus(deltaSeconds);
}

function updateInput(deltaSeconds) {
  const keyboardX =
    (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
    (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  const keyboardY =
    (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
    (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
  moveInput.set(
    THREE.MathUtils.clamp(keyboardX + touchMove.x, -1, 1),
    THREE.MathUtils.clamp(keyboardY + touchMove.y, -1, 1),
  );
  if (moveInput.lengthSq() > 1) moveInput.normalize();

  forward.set(Math.sin(cameraYaw), 0, Math.cos(cameraYaw));
  right.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
  movement
    .set(0, 0, 0)
    .addScaledVector(forward, moveInput.y)
    .addScaledVector(right, moveInput.x);

  const moving = movement.lengthSq() > 1e-6;
  if (moving) movement.normalize();
  const sprinting =
    mobileSprint || keys.has("ShiftLeft") || keys.has("ShiftRight");
  const targetSpeed = moving
    ? sprinting
      ? CONFIG.runSpeed
      : CONFIG.walkSpeed
    : 0;
  desiredVelocity.copy(movement).multiplyScalar(targetSpeed);
  velocityDelta.subVectors(desiredVelocity, velocity);
  const maxChange =
    (moving ? CONFIG.acceleration : CONFIG.deceleration) * deltaSeconds;
  if (velocityDelta.lengthSq() > maxChange * maxChange) {
    velocityDelta.setLength(maxChange);
  }
  velocity.add(velocityDelta);

  previousSpeed = speed;
  speed = Math.hypot(velocity.x, velocity.z);
  acceleration =
    deltaSeconds > Number.EPSILON
      ? (speed - previousSpeed) / deltaSeconds
      : 0;

  if (speed > 0.05) {
    const desiredFacing = Math.atan2(velocity.x, velocity.z);
    facing = angleDamp(facing, desiredFacing, CONFIG.turnRate, deltaSeconds);
    if (document.pointerLockElement !== canvas && !lookPointer) {
      cameraYaw = angleDamp(
        cameraYaw,
        facing,
        CONFIG.cameraFollowRate,
        deltaSeconds,
      );
    }
  }

  const previousX = characterPosition.x;
  const previousZ = characterPosition.z;
  characterPosition.addScaledVector(velocity, deltaSeconds);
  const halfWorld = CONFIG.terrainSize * 0.47;
  characterPosition.x = THREE.MathUtils.clamp(
    characterPosition.x,
    -halfWorld,
    halfWorld,
  );
  characterPosition.z = THREE.MathUtils.clamp(
    characterPosition.z,
    -halfWorld,
    halfWorld,
  );
  characterPosition.y = heightAt(characterPosition.x, characterPosition.z);
  normalAt(characterPosition.x, characterPosition.z, groundNormal);
  distanceTravelled += Math.hypot(
    characterPosition.x - previousX,
    characterPosition.z - previousZ,
  );
}

function updateCharacter(deltaSeconds) {
  character.root.position.copy(characterPosition);
  character.heading.rotation.y = facing;
  const slope = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    groundNormal,
  );
  character.slope.quaternion.slerp(slope, 1 - Math.exp(-9 * deltaSeconds));

  const speed01 = THREE.MathUtils.clamp(speed / CONFIG.runSpeed, 0, 1);
  const moving = THREE.MathUtils.smoothstep(speed01, 0.015, 0.12);
  const phase =
    ((distanceTravelled / CONFIG.strideLength) % 1) * Math.PI * 2;
  const stride = Math.sin(phase);
  const opposite = Math.sin(phase + Math.PI);
  const doubleStep = 0.5 - 0.5 * Math.cos(phase * 2);
  const gait = moving * (0.35 + speed01 * 0.65);
  const accelerationLean = THREE.MathUtils.clamp(
    acceleration / 20,
    -0.2,
    0.38,
  );

  character.leftThigh.rotation.x = opposite * 0.7 * gait;
  character.rightThigh.rotation.x = stride * 0.7 * gait;
  character.leftShin.rotation.x = Math.max(0, stride) * 0.48 * gait;
  character.rightShin.rotation.x = Math.max(0, opposite) * 0.48 * gait;
  character.leftFoot.rotation.x =
    -character.leftThigh.rotation.x * 0.25 -
    character.leftShin.rotation.x * 0.55;
  character.rightFoot.rotation.x =
    -character.rightThigh.rotation.x * 0.25 -
    character.rightShin.rotation.x * 0.55;

  character.leftUpperArm.rotation.x = stride * 0.52 * gait;
  character.rightUpperArm.rotation.x = opposite * 0.52 * gait;
  character.leftForearm.rotation.x =
    -0.12 - Math.max(0, -stride) * 0.22 * gait;
  character.rightForearm.rotation.x =
    -0.12 - Math.max(0, -opposite) * 0.22 * gait;

  character.body.position.y =
    -doubleStep * 0.035 * gait +
    Math.sin(animationTime * 1.7) * 0.004 * (1 - moving);
  character.torso.rotation.x = 0.06 * speed01 + accelerationLean;
  character.torso.rotation.z = -stride * 0.035 * gait;
  character.skirt.rotation.x = -stride * 0.025 * gait;
  character.skirt.rotation.z = stride * 0.018 * gait;
}

function updateCamera(deltaSeconds) {
  cameraTarget.set(
    characterPosition.x,
    characterPosition.y + CONFIG.cameraLookHeight,
    characterPosition.z,
  );
  const horizontal = cameraDistance * Math.cos(cameraElevation);
  forward.set(Math.sin(cameraYaw), 0, Math.cos(cameraYaw));
  desiredCameraPosition
    .copy(cameraTarget)
    .addScaledVector(forward, -horizontal);
  desiredCameraPosition.y += cameraDistance * Math.sin(cameraElevation);

  for (const amount of [0.35, 0.6, 0.85]) {
    cameraSample.lerpVectors(cameraTarget, desiredCameraPosition, amount);
    const terrainHeight = heightAt(cameraSample.x, cameraSample.z);
    const lineHeight = THREE.MathUtils.lerp(
      cameraTarget.y,
      desiredCameraPosition.y,
      amount,
    );
    const penetration = terrainHeight + CONFIG.cameraClearance - lineHeight;
    if (penetration > 0) {
      desiredCameraPosition.y += penetration / amount;
    }
  }
  desiredCameraPosition.y = Math.max(
    desiredCameraPosition.y,
    heightAt(desiredCameraPosition.x, desiredCameraPosition.z) +
      CONFIG.cameraClearance,
  );

  camera.position.lerp(
    desiredCameraPosition,
    1 - Math.exp(-12 * deltaSeconds),
  );
  camera.lookAt(cameraTarget);

  sun.position.set(
    characterPosition.x + 120,
    characterPosition.y + 180,
    characterPosition.z + 90,
  );
  sun.target.position.copy(characterPosition);
  scene.add(sun.target);
}

function updateStatus(deltaSeconds) {
  if (!statusElement) return;
  statusElapsed += deltaSeconds;
  if (statusElapsed < 0.25) return;
  statusElapsed = 0;
  const sprinting =
    mobileSprint || keys.has("ShiftLeft") || keys.has("ShiftRight");
  statusElement.textContent = [
    `Frame ${frameCount.toLocaleString()} · third-person`,
    `XYZ ${characterPosition.x.toFixed(1)} / ${characterPosition.y.toFixed(1)} / ${characterPosition.z.toFixed(1)}`,
    `Speed ${speed.toFixed(2)} m/s · ${sprinting ? "run" : "walk"}`,
    `Grass ${CONFIG.grassCount.toLocaleString()} instances`,
    document.pointerLockElement === canvas
      ? "Mouse captured · Esc releases"
      : "Click the world to capture mouse",
  ].join("\n");
}

function reset() {
  characterPosition.set(0, heightAt(0, 0), 0);
  velocity.set(0, 0, 0);
  desiredVelocity.set(0, 0, 0);
  speed = 0;
  previousSpeed = 0;
  acceleration = 0;
  distanceTravelled = 0;
  facing = 0;
  cameraYaw = 0;
  cameraElevation = CONFIG.cameraElevation;
  cameraDistance = CONFIG.cameraDistance;
  normalAt(0, 0, groundNormal);
  camera.position.set(0, characterPosition.y + 3.2, -5.5);
  camera.lookAt(0, characterPosition.y + CONFIG.cameraLookHeight, 0);
}

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleKeyDown(event) {
  keys.add(event.code);
  if (event.code === "KeyF") reset();
}

function handleWheel(event) {
  event.preventDefault();
  cameraDistance = THREE.MathUtils.clamp(
    cameraDistance + event.deltaY * CONFIG.zoomSensitivity,
    CONFIG.cameraMinDistance,
    CONFIG.cameraMaxDistance,
  );
}

function handleMouseMove(event) {
  if (document.pointerLockElement !== canvas) return;
  cameraYaw = normalizeAngle(
    cameraYaw - event.movementX * CONFIG.mouseSensitivity,
  );
  cameraElevation = THREE.MathUtils.clamp(
    cameraElevation - event.movementY * CONFIG.mouseSensitivity,
    CONFIG.cameraMinElevation,
    CONFIG.cameraMaxElevation,
  );
}

function handlePointerDown(event) {
  if (event.pointerType === "mouse") return;
  event.preventDefault();
  const pointer = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    x: event.clientX,
    y: event.clientY,
  };
  if (event.clientX < window.innerWidth * 0.5 && !movePointer) {
    movePointer = pointer;
  } else if (!lookPointer) {
    lookPointer = pointer;
  }
}

function handlePointerMove(event) {
  if (movePointer?.id === event.pointerId) {
    event.preventDefault();
    movePointer.x = event.clientX;
    movePointer.y = event.clientY;
    touchMove.set(
      THREE.MathUtils.clamp((movePointer.x - movePointer.startX) / 70, -1, 1),
      THREE.MathUtils.clamp((movePointer.startY - movePointer.y) / 70, -1, 1),
    );
    return;
  }
  if (lookPointer?.id === event.pointerId) {
    event.preventDefault();
    const deltaX = event.clientX - lookPointer.x;
    const deltaY = event.clientY - lookPointer.y;
    lookPointer.x = event.clientX;
    lookPointer.y = event.clientY;
    cameraYaw = normalizeAngle(
      cameraYaw - deltaX * CONFIG.touchSensitivity,
    );
    cameraElevation = THREE.MathUtils.clamp(
      cameraElevation - deltaY * CONFIG.touchSensitivity,
      CONFIG.cameraMinElevation,
      CONFIG.cameraMaxElevation,
    );
  }
}

function handlePointerUp(event) {
  if (movePointer?.id === event.pointerId) {
    event.preventDefault();
    movePointer = null;
    touchMove.set(0, 0);
  }
  if (lookPointer?.id === event.pointerId) {
    event.preventDefault();
    lookPointer = null;
  }
}

function clearInput() {
  keys.clear();
  touchMove.set(0, 0);
  movePointer = null;
  lookPointer = null;
  mobileSprint = false;
  runButton?.classList.remove("active");
}

function createTerrain() {
  const geometry = new THREE.PlaneGeometry(
    CONFIG.terrainSize,
    CONFIG.terrainSize,
    CONFIG.terrainSegments,
    CONFIG.terrainSegments,
  );
  geometry.rotateX(-Math.PI * 0.5);
  const positions = geometry.getAttribute("position");
  const colors = new Float32Array(positions.count * 3);
  const color = new THREE.Color();
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getZ(index);
    const height = heightAt(x, z);
    positions.setY(index, height);
    const dry = THREE.MathUtils.smoothstep(height, 3, 15);
    color.copy(COLORS.groundLow).lerp(COLORS.groundHigh, dry * 0.55);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.96,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function createGrass() {
  const geometry = new THREE.PlaneGeometry(0.1, CONFIG.grassHeight, 1, 2);
  geometry.translate(0, CONFIG.grassHeight * 0.5, 0);
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index += 1) {
    const y = positions.getY(index) / CONFIG.grassHeight;
    positions.setX(index, positions.getX(index) + y * y * 0.08);
  }
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: COLORS.grass,
    roughness: 0.95,
    metalness: 0,
    side: THREE.DoubleSide,
    alphaTest: 0.05,
  });
  const mesh = new THREE.InstancedMesh(
    geometry,
    material,
    CONFIG.grassCount,
  );
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.frustumCulled = false;

  const random = seededRandom(42017);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const normal = new THREE.Vector3();
  let placed = 0;
  while (placed < CONFIG.grassCount) {
    const x = (random() - 0.5) * CONFIG.terrainSize * 0.94;
    const z = (random() - 0.5) * CONFIG.terrainSize * 0.94;
    normalAt(x, z, normal);
    if (normal.y < 0.82) continue;
    position.set(x, heightAt(x, z) + 0.01, z);
    quaternion.setFromEuler(
      new THREE.Euler(0, random() * Math.PI * 2, 0),
    );
    const heightScale = 0.55 + random() * 0.85;
    const widthScale = 0.65 + random() * 0.75;
    scale.set(widthScale, heightScale, widthScale);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(placed, matrix);
    placed += 1;
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function createCharacter() {
  const materials = {
    robe: material(COLORS.robe, 0.86, THREE.DoubleSide),
    mantle: material(COLORS.mantle, 0.8, THREE.DoubleSide),
    tunic: material(COLORS.tunic, 0.88, THREE.DoubleSide),
    leather: material(COLORS.leather, 0.62),
    skin: material(COLORS.skin, 0.9),
    trim: material(COLORS.trim, 0.78, THREE.DoubleSide),
    fur: material(COLORS.fur, 0.92, THREE.DoubleSide),
  };

  const root = new THREE.Group();
  root.scale.setScalar(CONFIG.characterScale);
  const slope = new THREE.Group();
  const heading = new THREE.Group();
  const body = new THREE.Group();
  root.add(slope);
  slope.add(heading);
  heading.add(body);

  const skirt = new THREE.Group();
  body.add(skirt);
  addMesh(
    skirt,
    new THREE.CylinderGeometry(0.18, 0.39, 0.92, 24, 6, true),
    materials.robe,
    0,
    0.52,
    0,
  );

  const mantle = addMesh(
    body,
    new THREE.CylinderGeometry(0.23, 0.37, 0.5, 24, 4, true),
    materials.mantle,
    0,
    1.17,
    -0.015,
  );
  mantle.scale.z = 0.78;

  const torso = new THREE.Group();
  torso.position.y = 0.96;
  body.add(torso);
  const torsoMesh = addMesh(
    torso,
    new THREE.CylinderGeometry(0.17, 0.15, 0.5, 20, 4, false),
    materials.trim,
    0,
    0.25,
    0,
  );
  torsoMesh.scale.z = 0.78;

  const belt = addMesh(
    body,
    new THREE.TorusGeometry(0.158, 0.022, 8, 28),
    materials.leather,
    0,
    0.99,
    0,
  );
  belt.rotation.x = Math.PI * 0.5;
  belt.scale.z = 0.8;

  const collar = addMesh(
    torso,
    new THREE.TorusGeometry(0.13, 0.027, 8, 28),
    materials.tunic,
    0,
    0.48,
    0.005,
  );
  collar.rotation.x = Math.PI * 0.5;
  collar.scale.z = 0.82;

  const head = new THREE.Group();
  body.add(head);
  const headMesh = addMesh(
    head,
    new THREE.SphereGeometry(0.095, 20, 14),
    materials.skin,
    0,
    1.655,
    0.01,
  );
  headMesh.scale.set(0.94, 1.08, 1);

  const scarf = addMesh(
    head,
    new THREE.CylinderGeometry(0.096, 0.088, 0.09, 24, 2, true),
    materials.trim,
    0,
    1.6,
    0.015,
  );
  scarf.scale.z = 1.05;

  const hood = new THREE.Group();
  body.add(hood);
  addMesh(hood, createHoodGeometry(), materials.robe, 0, 0, 0);
  addMesh(hood, createHoodTrimGeometry(), materials.fur, 0, 0, 0);

  const leftUpperArm = buildArm(body, materials, -1);
  const rightUpperArm = buildArm(body, materials, 1);
  const leftThigh = buildLeg(body, materials, -1);
  const rightThigh = buildLeg(body, materials, 1);

  return {
    root,
    slope,
    heading,
    body,
    torso,
    skirt,
    leftUpperArm,
    rightUpperArm,
    leftForearm: leftUpperArm.userData.forearm,
    rightForearm: rightUpperArm.userData.forearm,
    leftThigh,
    rightThigh,
    leftShin: leftThigh.userData.shin,
    rightShin: rightThigh.userData.shin,
    leftFoot: leftThigh.userData.foot,
    rightFoot: rightThigh.userData.foot,
  };
}

function buildArm(parent, materials, side) {
  const upperArm = new THREE.Group();
  upperArm.position.set(side * 0.185, 1.4, 0);
  parent.add(upperArm);
  const upperMesh = addMesh(
    upperArm,
    new THREE.CylinderGeometry(0.05, 0.065, 0.285, 14, 3, false),
    materials.robe,
    side * 0.022,
    -0.14,
    0,
  );
  upperMesh.rotation.z = side * -0.16;

  const forearm = new THREE.Group();
  forearm.position.set(side * 0.045, -0.278, 0);
  upperArm.add(forearm);
  addMesh(
    forearm,
    new THREE.CylinderGeometry(0.042, 0.052, 0.265, 14, 3, false),
    materials.robe,
    side * 0.006,
    -0.13,
    0.01,
  );
  const cuff = addMesh(
    forearm,
    new THREE.TorusGeometry(0.055, 0.018, 6, 16),
    materials.fur,
    0,
    -0.245,
    0.012,
  );
  cuff.rotation.x = Math.PI * 0.5;
  const hand = addMesh(
    forearm,
    new THREE.SphereGeometry(0.046, 12, 8),
    materials.leather,
    0,
    -0.31,
    0.025,
  );
  hand.scale.set(0.9, 1.2, 0.82);
  upperArm.userData.forearm = forearm;
  return upperArm;
}

function buildLeg(parent, materials, side) {
  const thigh = new THREE.Group();
  thigh.position.set(side * 0.1, 0.9, 0);
  parent.add(thigh);
  addMesh(
    thigh,
    new THREE.CylinderGeometry(0.086, 0.112, 0.44, 14, 4, false),
    materials.robe,
    0,
    -0.22,
    0,
  );

  const shin = new THREE.Group();
  shin.position.set(0, -0.44, 0);
  thigh.add(shin);
  addMesh(
    shin,
    new THREE.CylinderGeometry(0.072, 0.086, 0.37, 14, 4, false),
    materials.robe,
    0,
    -0.185,
    0,
  );

  const foot = new THREE.Group();
  foot.position.set(0, -0.37, 0);
  shin.add(foot);
  const boot = addMesh(
    foot,
    new THREE.BoxGeometry(0.12, 0.11, 0.27, 2, 2, 3),
    materials.leather,
    0,
    -0.035,
    0.085,
  );
  boot.geometry.translate(0, 0, 0.025);
  thigh.userData.shin = shin;
  thigh.userData.foot = foot;
  return thigh;
}

function createHoodGeometry() {
  const columns = 34;
  const rows = 9;
  const headCenter = new THREE.Vector3(0, 1.655, 0.005);
  const face = new THREE.Vector3(0, -0.28, 0.96).normalize();
  const horizontal = new THREE.Vector3(1, 0, 0);
  const vertical = new THREE.Vector3().crossVectors(face, horizontal);
  const center = headCenter.clone().addScaledVector(face, 0.105);
  const positions = [];
  const indices = [];
  const rim = new THREE.Vector3();
  const base = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const control = new THREE.Vector3();

  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows;
    const inverse = 1 - t;
    for (let column = 0; column < columns; column += 1) {
      const s = column / columns;
      hoodRimPoint(s, rim, center, horizontal, vertical);
      hoodBasePoint(s, base);
      const angle = s * Math.PI * 2;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      normal.set(sin, cos * 0.84, cos * -0.54).normalize();
      const radius = 0.205 + 0.062 * cos;
      control.copy(headCenter).addScaledVector(normal, radius);
      positions.push(
        inverse * inverse * rim.x +
          2 * inverse * t * control.x +
          t * t * base.x,
        inverse * inverse * rim.y +
          2 * inverse * t * control.y +
          t * t * base.y,
        inverse * inverse * rim.z +
          2 * inverse * t * control.z +
          t * t * base.z,
      );
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const next = (column + 1) % columns;
      const a = row * columns + column;
      const b = row * columns + next;
      const c = (row + 1) * columns + next;
      const d = (row + 1) * columns + column;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createHoodTrimGeometry() {
  const columns = 34;
  const headCenter = new THREE.Vector3(0, 1.655, 0.005);
  const face = new THREE.Vector3(0, -0.28, 0.96).normalize();
  const horizontal = new THREE.Vector3(1, 0, 0);
  const vertical = new THREE.Vector3().crossVectors(face, horizontal);
  const center = headCenter.clone().addScaledVector(face, 0.105);
  const points = [];
  for (let index = 0; index < columns; index += 1) {
    points.push(
      hoodRimPoint(
        index / columns,
        new THREE.Vector3(),
        center,
        horizontal,
        vertical,
      ),
    );
  }
  const curve = new THREE.CatmullRomCurve3(points, true, "centripetal", 0.4);
  return new THREE.TubeGeometry(curve, 64, 0.026, 6, true);
}

function hoodRimPoint(t, target, center, horizontal, vertical) {
  const angle = t * Math.PI * 2;
  return target
    .copy(center)
    .addScaledVector(horizontal, 0.152 * Math.sin(angle))
    .addScaledVector(vertical, 0.163 * Math.cos(angle));
}

function hoodBasePoint(t, target) {
  const angle = t * Math.PI * 2;
  return target.set(
    0.212 * Math.sin(angle),
    1.352,
    -0.012 - 0.182 * Math.cos(angle),
  );
}

function addMesh(parent, geometry, meshMaterial, x, y, z) {
  const mesh = new THREE.Mesh(geometry, meshMaterial);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function material(color, roughness, side = THREE.FrontSide) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
    side,
  });
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
  const rightHeight = heightAt(x + step, z);
  const down = heightAt(x, z - step);
  const up = heightAt(x, z + step);
  return target.set(left - rightHeight, step * 2, down - up).normalize();
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
  let value = Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
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

function angleDamp(current, target, rate, deltaSeconds) {
  const difference = normalizeAngle(target - current);
  return normalizeAngle(
    current + difference * (1 - Math.exp(-rate * deltaSeconds)),
  );
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
