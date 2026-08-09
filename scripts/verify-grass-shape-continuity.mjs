import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[grass-shape] ${message}`);
  }
}

const grassConfig = read("public/config/grass.yaml");
const nearFactory = read("src/world/grass/WorldSingleBladeTileFactory.ts");
const midFactory = read("src/world/grass/WorldGrassPatchGeometryFactory.ts");
const farFactory = read("src/world/grass/WorldGrassImpostorAtlasFactory.ts");

const bladeCurve = Number(
  grassConfig.match(/^bladeCurve:\s*([0-9.]+)$/m)?.[1],
);
assert(Number.isFinite(bladeCurve), "bladeCurve must exist in grass.yaml.");

for (const [label, source] of [
  ["near", nearFactory],
  ["mid", midFactory],
  ["far", farFactory],
]) {
  assert(
    source.includes("resolveGrassBladeArcPoint"),
    `${label} grass must resolve its blade tip from the shared rest arc.`,
  );
}

if (bladeCurve > 0) {
  assert(
    midFactory.includes("tip.y") &&
      !midFactory.includes("tipX,\n        spec.height * heightScale,\n        tipZ"),
    "Mid grass must use the curved tip's vertical reach, not the old full height.",
  );
  assert(
    farFactory.includes("tip.y") &&
      !farFactory.includes("tipX,\n      blade.height,\n      tipZ"),
    "Far atlas blades must use the curved tip's vertical reach.",
  );
  assert(
    farFactory.includes("calculateGrassBladeCurveReach") &&
      farFactory.includes("maximumBladeLength, grass.bladeCurve"),
    "Far atlas bounds must reserve the configured blade-curve reach.",
  );
}

const curveDirection =
  "const curveX = -Math.sin(spec.facingAngle) * tip.z;";
assert(
  midFactory.includes(curveDirection) &&
    farFactory.includes(
      curveDirection.replaceAll("spec.facingAngle", "blade.facingAngle"),
    ),
  "Mid geometry and the far atlas must bend the rest arc in the same plane direction.",
);

console.log(`[grass-shape] LOD shape continuity verified (bladeCurve=${bladeCurve}).`);
