import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function fail(message) {
  throw new Error(`[lod-continuity] ${message}`);
}

function readYamlNumber(source, key) {
  const value = Number(source.match(new RegExp(`^${key}:\\s*([0-9.]+)$`, "m"))?.[1]);
  if (!Number.isFinite(value)) {
    fail(`Unable to read ${key} from world.yaml.`);
  }
  return value;
}

const controller = read("src/grass/GrassLodController.ts");
const thirdPersonController = read("src/controls/ThirdPersonController.ts");
const nearMaterial = read("src/grass/materials/GrassNearMaterial.ts");
const impostorMaterial = read(
  "src/world/grass/WorldGrassImpostorMaterial.ts",
);
const impostorAtlasFactory = read(
  "src/world/grass/WorldGrassImpostorAtlasFactory.ts",
);
const tuning = read("src/world/grass/WorldGrassImpostorTuning.ts");
const worldGrassSystem = read("src/world/WorldGrassSystem.ts");
const nearField = read("src/world/grass/WorldNearGrassField.ts");
const worldConfig = read("public/config/world.yaml");

if (controller.includes("farAerialVisible")) {
  fail("CPU visibility must not suppress far meshes by aerial angle.");
}
if (
  !/patch\.midMesh\.userData\.grassDistanceFade\s*=\s*1\s*;/.test(
    controller,
  )
) {
  fail("World mid coverage must not be applied a second time per patch.");
}
if (/vFarEntry\s*\*\s*vTerrainCoverage\s*\*\s*aerialVisibility/.test(impostorMaterial)) {
  fail("Far coverage must stay complementary to the mid distance fade.");
}
if (
  !nearMaterial.includes("grassPaletteBlend") ||
  !nearMaterial.includes("vGrassCameraDistance")
) {
  fail("Real-blade colors must converge toward the far palette by distance.");
}
if (!impostorAtlasFactory.includes("shadeScale * material.rootDarkening")) {
  fail("The impostor atlas must share the configured blade-root darkening.");
}
if (
  !worldGrassSystem.includes("await this.nearField.initialize(grassConfig)") ||
  !worldGrassSystem.includes("this.nearField.update(deltaSeconds, this.cameraPosition)")
) {
  fail("The dense single-blade fields must be wired into WorldGrassSystem.");
}
if (thirdPersonController.includes("WorldNearGrassField")) {
  fail("ThirdPersonController must not create a duplicate near-grass field.");
}
if (
  !nearField.includes("grassUltraNearDensityMultiplier - 1") ||
  !nearField.includes("world-grass-ultra-near-blades")
) {
  fail("The ultra-near layer must add independent single-blade instances.");
}

const ultraNearDistance = readYamlNumber(worldConfig, "grassUltraNearDistance");
const ultraNearMultiplier = readYamlNumber(
  worldConfig,
  "grassUltraNearDensityMultiplier",
);
const interactionStrength = readYamlNumber(
  worldConfig,
  "grassInteractionStrength",
);
if (ultraNearDistance !== 4) {
  fail("The ultra-near grass distance must remain 4 metres.");
}
if (ultraNearMultiplier !== 2) {
  fail("The ultra-near grass layer must double total blade density.");
}
if (interactionStrength < 0.9) {
  fail("Character grass interaction must retain the stronger response.");
}

const baseBlend = Number(
  tuning.match(/IMPOSTOR_BASE_COLOR_BLEND\s*=\s*([0-9.]+)/)?.[1],
);
const dryBlend = Number(
  impostorMaterial.match(/vDryness\s*\*\s*([0-9.]+)\)/)?.[1],
);
if (!Number.isFinite(baseBlend) || baseBlend < 0.6) {
  fail("Far cards must retain the healthy-green base-color bias.");
}
if (!Number.isFinite(dryBlend) || dryBlend > 0.05) {
  fail("Far-card dry tint is warm enough to recreate the yellow seam.");
}

for (let sample = 0; sample <= 1000; sample += 1) {
  const farEntry = sample / 1000;
  for (const fieldCoverage of [0.02, 0.25, 0.5, 0.75, 1]) {
    const midCoverage = (1 - farEntry) * fieldCoverage;
    const farCoverage = farEntry * fieldCoverage;
    const totalCoverage = midCoverage + farCoverage;
    if (Math.abs(totalCoverage - fieldCoverage) > 1e-12) {
      fail(`Coverage gap at transition sample ${sample}.`);
    }
  }
}

console.log("[lod-continuity] Coverage, ultra-near density, ownership, and palette invariants passed.");
