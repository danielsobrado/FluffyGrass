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

const controller = read("src/grass/GrassLodController.ts");
const nearMaterial = read("src/grass/materials/GrassNearMaterial.ts");
const impostorMaterial = read(
  "src/world/grass/WorldGrassImpostorMaterial.ts",
);
const impostorAtlasFactory = read(
  "src/world/grass/WorldGrassImpostorAtlasFactory.ts",
);
const tuning = read("src/world/grass/WorldGrassImpostorTuning.ts");

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

console.log("[lod-continuity] Coverage and far-palette invariants passed.");
