import { buildStonePolyhedron } from "./StoneClipper";
import {
  addStoneFractureRelief,
  STONE_FRACTURE_RELIEF,
} from "./StoneFractureRelief";
import { generateStoneMesh } from "./StoneGeometry";
import {
  canFractureStoneArchetype,
  resolveStoneFragmentRecipe,
  stoneFormationSplits,
} from "./StoneFormation";
import { STONE_ARCHETYPE_IDS } from "./StoneRecipe";
import { resolveQualityStoneRecipe } from "./StoneShapeQuality";

const ENVELOPE_EPSILON = 0.012 + STONE_FRACTURE_RELIEF;
const RIM_EPSILON = 5e-3;
/** Smooth mineral fields may differ slightly across a healed rim point. */
const MINERAL_RIM_EPSILON = 0.04;
const MINIMUM_SPLIT_RATE = 0.7;
const VARIANTS = 16;

function fail(message: string): never {
  throw new Error(`[stone-formations] ${message}`);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) fail(message);
}

/** Two fragments of one parent occupy its volume and keep one mated geology. */
export function verifyStoneFormations(): string {
  let pairs = 0;
  for (const archetype of STONE_ARCHETYPE_IDS) {
    let splits = 0;
    for (let variant = 0; variant < VARIANTS; variant += 1) {
      const seed = (variant * 2654435761 + archetype.length * 97) >>> 0;
      const parent = resolveQualityStoneRecipe(archetype, seed);
      if (!stoneFormationSplits(parent)) continue;
      assert(
        canFractureStoneArchetype(archetype),
        `${archetype} is not a fracturable family but produced a formation.`,
      );
      splits += 1;
      pairs += 1;
      verifyPair(archetype, seed, parent);
    }
    if (!canFractureStoneArchetype(archetype)) {
      assert(
        splits === 0,
        `${archetype} produced ${splits} formations despite being whole-bodied.`,
      );
      continue;
    }
    assert(
      splits / VARIANTS >= MINIMUM_SPLIT_RATE,
      `${archetype} split only ${splits}/${VARIANTS} variants.`,
    );
  }
  assert(pairs > 0, "No archetype produced a formation at all.");
  return `${pairs} mated formations`;
}

function verifyPair(
  archetype: string,
  seed: number,
  parent: ReturnType<typeof resolveQualityStoneRecipe>,
): void {
  const recipeA = resolveStoneFragmentRecipe(parent, "a");
  const recipeB = resolveStoneFragmentRecipe(parent, "b");
  const fractureA = recipeA.fracture;
  const fractureB = recipeB.fracture;
  assert(
    fractureA !== undefined && fractureB !== undefined,
    `${archetype}:${seed} produced a formation without a break.`,
  );
  assert(
    Math.abs(fractureA.nx + fractureB.nx) < 1e-9 &&
      Math.abs(fractureA.ny + fractureB.ny) < 1e-9 &&
      Math.abs(fractureA.nz + fractureB.nz) < 1e-9 &&
      Math.abs(fractureA.constant + fractureB.constant) < 1e-9,
    `${archetype}:${seed} halves do not share one break plane.`,
  );

  const rims = [recipeA, recipeB].map((recipe) => {
    const relieved = addStoneFractureRelief(
      buildStonePolyhedron(recipe, false),
      recipe,
    );
    const points = [];
    for (const face of relieved) {
      if (face.role !== "fracture") continue;
      for (const point of face.points) points.push(point);
    }
    assert(
      points.length > 0,
      `${archetype}:${seed} lost its break face during clipping.`,
    );
    return points;
  });
  for (const [near, far] of [
    [rims[0], rims[1]],
    [rims[1], rims[0]],
  ] as const) {
    for (const point of near) {
      let closest = Number.POSITIVE_INFINITY;
      for (const other of far) {
        closest = Math.min(
          closest,
          Math.hypot(point.x - other.x, point.y - other.y, point.z - other.z),
        );
      }
      assert(
        closest < RIM_EPSILON,
        `${archetype}:${seed} break outlines diverge by ${closest.toFixed(4)} at (${point.x.toFixed(4)}, ${point.y.toFixed(4)}, ${point.z.toFixed(4)}).`,
      );
    }
  }

  const whole = generateStoneMesh(parent, false);
  const major = generateStoneMesh(recipeA, false);
  const minor = generateStoneMesh(recipeB, false);
  assert(
    major.metrics.triangleCount + minor.metrics.triangleCount <
      whole.metrics.triangleCount * 2,
    `${archetype}:${seed} costs more as two halves than as two whole stones.`,
  );
  verifyMineralContinuity(archetype, seed, major, minor);

  const bounds = meshBounds(whole);
  for (const [name, fragment] of [
    ["a", major],
    ["b", minor],
  ] as const) {
    const shiftX =
      fragment.metrics.contactOffsetX - whole.metrics.contactOffsetX;
    const shiftZ =
      fragment.metrics.contactOffsetZ - whole.metrics.contactOffsetZ;
    for (let index = 0; index < fragment.positions.length; index += 3) {
      const x = fragment.positions[index] + shiftX;
      const y = fragment.positions[index + 1];
      const z = fragment.positions[index + 2] + shiftZ;
      assert(
        x >= bounds.minimumX - ENVELOPE_EPSILON &&
          x <= bounds.maximumX + ENVELOPE_EPSILON &&
          y >= bounds.minimumY - ENVELOPE_EPSILON &&
          y <= bounds.maximumY + ENVELOPE_EPSILON &&
          z >= bounds.minimumZ - ENVELOPE_EPSILON &&
          z <= bounds.maximumZ + ENVELOPE_EPSILON,
        `${archetype}:${seed} fragment ${name} leaves the parent envelope at (${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}).`,
      );
    }
  }
}

function verifyMineralContinuity(
  archetype: string,
  seed: number,
  major: ReturnType<typeof generateStoneMesh>,
  minor: ReturnType<typeof generateStoneMesh>,
): void {
  let matches = 0;
  for (let a = 0; a < major.minerals.length; a += 1) {
    const ao = a * 3;
    const ax = major.positions[ao] + major.metrics.contactOffsetX;
    const ay = major.positions[ao + 1];
    const az = major.positions[ao + 2] + major.metrics.contactOffsetZ;
    let closest = Number.POSITIVE_INFINITY;
    let closestIndex = -1;
    for (let b = 0; b < minor.minerals.length; b += 1) {
      const bo = b * 3;
      const distance = Math.hypot(
        ax - (minor.positions[bo] + minor.metrics.contactOffsetX),
        ay - minor.positions[bo + 1],
        az - (minor.positions[bo + 2] + minor.metrics.contactOffsetZ),
      );
      if (distance < closest) {
        closest = distance;
        closestIndex = b;
      }
    }
    if (closest >= RIM_EPSILON || closestIndex < 0) continue;
    matches += 1;
    const difference = Math.abs(
      major.minerals[a] - minor.minerals[closestIndex],
    );
    assert(
      difference <= MINERAL_RIM_EPSILON,
      `${archetype}:${seed} mineral field jumps by ${difference.toFixed(3)} across a mated rim.`,
    );
  }
  assert(
    matches > 0,
    `${archetype}:${seed} has no matched generated rim vertices for mineral verification.`,
  );
}

function meshBounds(mesh: ReturnType<typeof generateStoneMesh>): {
  minimumX: number;
  minimumY: number;
  minimumZ: number;
  maximumX: number;
  maximumY: number;
  maximumZ: number;
} {
  let minimumX = Number.POSITIVE_INFINITY;
  let minimumY = Number.POSITIVE_INFINITY;
  let minimumZ = Number.POSITIVE_INFINITY;
  let maximumX = Number.NEGATIVE_INFINITY;
  let maximumY = Number.NEGATIVE_INFINITY;
  let maximumZ = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < mesh.positions.length; index += 3) {
    minimumX = Math.min(minimumX, mesh.positions[index]);
    maximumX = Math.max(maximumX, mesh.positions[index]);
    minimumY = Math.min(minimumY, mesh.positions[index + 1]);
    maximumY = Math.max(maximumY, mesh.positions[index + 1]);
    minimumZ = Math.min(minimumZ, mesh.positions[index + 2]);
    maximumZ = Math.max(maximumZ, mesh.positions[index + 2]);
  }
  return { minimumX, minimumY, minimumZ, maximumX, maximumY, maximumZ };
}
