import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function fail(message) {
  throw new Error(`[character-motion] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function readConstant(source, name) {
  const expression = source.match(
    new RegExp(`export const ${name}\\s*=\\s*([^;]+);`),
  )?.[1];
  const value = Number(expression);
  if (!Number.isFinite(value)) {
    fail(`Unable to read numeric constant ${name}.`);
  }
  return value;
}

const motion = read("src/character/CapeMotion.ts");
const geometry = read("src/character/CapeMotionGeometry.ts");
const tuning = read("src/character/CapeMotionTuning.ts");
const character = read("src/character/SnowflowCharacter.ts");

const minimumBend = readConstant(tuning, "CAPE_MIN_FORWARD_BEND");
const maximumBend = readConstant(tuning, "CAPE_MAX_FORWARD_BEND");
const maximumSideBend = readConstant(tuning, "CAPE_MAX_SIDE_BEND");
const flutterStrength = readConstant(tuning, "CAPE_FLUTTER_STRENGTH");
const boundsPadding = readConstant(tuning, "CAPE_BOUNDS_PADDING");
const updateEpsilon = readConstant(tuning, "CAPE_GEOMETRY_UPDATE_EPSILON");
const airflowStart = readConstant(tuning, "CAPE_AIRFLOW_START");
const airflowEnd = readConstant(tuning, "CAPE_AIRFLOW_END");

assert(minimumBend < maximumBend, "Cape forward-bend range is reversed.");
assert(maximumSideBend > 0, "Cape side-bend limit must be positive.");
assert(flutterStrength >= 0, "Cape flutter strength must be non-negative.");
assert(boundsPadding > 0, "Cape bounds require a positive safety padding.");
assert(updateEpsilon > 0, "Cape idle-update epsilon must be positive.");
assert(airflowStart >= 0 && airflowStart < airflowEnd, "Cape airflow range is invalid.");

assert(
  motion.includes("finiteOrZero") &&
    motion.includes("Math.abs(finiteOrZero(input.runSpeed))") &&
    motion.includes("CAPE_MIN_FORWARD_BEND") &&
    motion.includes("CAPE_MAX_FORWARD_BEND") &&
    motion.includes("CAPE_MAX_SIDE_BEND"),
  "Cape motion must sanitize runtime inputs and use named motion limits.",
);
assert(
  geometry.includes("shouldUpdate(") &&
    geometry.includes("CAPE_GEOMETRY_UPDATE_EPSILON") &&
    geometry.includes("position.array as Float32Array"),
  "Cape geometry must skip settled frames and update its dynamic buffer directly.",
);
assert(
  geometry.includes("setConservativeBounds") &&
    geometry.includes("new THREE.Sphere(new THREE.Vector3(), radius)") &&
    geometry.includes("CAPE_FLUTTER_STRENGTH + CAPE_BOUNDS_PADDING") &&
    !geometry.includes("boundingSphere.radius *="),
  "Cape bounds must be origin-centred and deformation-derived.",
);
assert(
  geometry.includes("visited.has(geometry)") &&
    geometry.includes("visited.add(geometry)"),
  "Shared cape shell geometry must only be deformed once per frame.",
);
assert(
  character.includes("this.updateSecondaryMotion(delta, pose)") &&
    character.includes("this.capeMotion.reset()"),
  "Character animation must feed clamped frame time and reset cape state.",
);

verifyBounds(flutterStrength, boundsPadding, minimumBend, maximumBend, maximumSideBend);

console.log(
  "[character-motion] Cape inputs, idle-update guard, shared geometry, and conservative deformation bounds verified.",
);

function verifyBounds(
  maximumFlutter,
  padding,
  minimumForwardBend,
  maximumForwardBend,
  maximumLateralBend,
) {
  const random = createRandom(0x5f3759df);
  for (let sample = 0; sample < 20_000; sample += 1) {
    const base = [
      randomRange(random, -0.7, 0.7),
      randomRange(random, -1.4, 0.1),
      randomRange(random, -0.25, 0.4),
    ];
    const bendX = randomRange(
      random,
      minimumForwardBend,
      maximumForwardBend,
    );
    const bendZ = randomRange(
      random,
      -maximumLateralBend,
      maximumLateralBend,
    );
    const rotated = rotateXThenZ(base, bendX, bendZ);
    rotated[2] += randomRange(random, -maximumFlutter, maximumFlutter);

    const sourceRadius = Math.hypot(...base);
    const resolvedRadius = Math.hypot(...rotated);
    const conservativeRadius = sourceRadius + maximumFlutter + padding;
    assert(
      resolvedRadius <= conservativeRadius + 1e-12,
      `Cape deformation escaped its bound at sample ${sample}.`,
    );
  }
}

function rotateXThenZ(point, angleX, angleZ) {
  const [x, y, z] = point;
  const cosineX = Math.cos(angleX);
  const sineX = Math.sin(angleX);
  const rotatedY = y * cosineX - z * sineX;
  const rotatedZ = y * sineX + z * cosineX;
  const cosineZ = Math.cos(angleZ);
  const sineZ = Math.sin(angleZ);
  return [
    x * cosineZ - rotatedY * sineZ,
    x * sineZ + rotatedY * cosineZ,
    rotatedZ,
  ];
}

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function randomRange(random, minimum, maximum) {
  return minimum + (maximum - minimum) * random();
}
