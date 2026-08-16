import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const THIRD_PARTY_NOTICE = resolve(REPOSITORY_ROOT, "THIRD_PARTY_NOTICES.md");
const SKELETON_DIRECTORY = resolve(
  REPOSITORY_ROOT,
  "public",
  "models",
  "skeletons",
);
const SKELETON_MODELS = Object.freeze([
  "Skeleton_Mage.glb",
  "Skeleton_Minion.glb",
  "Skeleton_Rogue.glb",
  "Skeleton_Warrior.glb",
  "skeleton_texture.png",
]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[legal-notices] ${message}`);
  }
}

const notice = readFileSync(THIRD_PARTY_NOTICE, "utf8");
for (const required of [
  "## Three.js",
  "## stats-gl",
  "## KayKit Character Pack: Skeletons",
  "KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0",
  "CC0 1.0 Universal",
  "public/models/skeletons/LICENSE.txt",
  "public/models/skeletons/CREDITS.md",
  "## Snowflow procedural character",
]) {
  assert(
    notice.includes(required),
    `THIRD_PARTY_NOTICES.md is missing required shipped dependency notice: ${required}.`,
  );
}

for (const fileName of ["CREDITS.md", "LICENSE.txt", ...SKELETON_MODELS]) {
  assert(
    existsSync(resolve(SKELETON_DIRECTORY, fileName)),
    `Shipped skeleton asset set is missing ${fileName}.`,
  );
}

const credits = readFileSync(resolve(SKELETON_DIRECTORY, "CREDITS.md"), "utf8");
const license = readFileSync(resolve(SKELETON_DIRECTORY, "LICENSE.txt"), "utf8");
assert(
  credits.includes("KayKit Character Pack: Skeletons") &&
    credits.includes("CC0 1.0 Universal"),
  "Skeleton provenance must name the upstream pack and CC0 license.",
);
assert(
  license.includes("CC0 1.0 Universal"),
  "Skeleton asset directory must ship the CC0 1.0 license text.",
);

console.log(
  "[legal-notices] Shipped runtime/model dependency notices and skeleton provenance verified.",
);