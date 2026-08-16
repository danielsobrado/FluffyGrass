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
    throw new Error(`[scenic-runtime] ${message}`);
  }
}

const scenicLayer = read("src/world/scenic/WorldScenicLayer.ts");
const faunaSystem = read("src/world/scenic/WorldFaunaSystem.ts");
const faunaField = read("src/world/scenic/WorldFaunaField.ts");
const treeField = read("src/world/scenic/WorldTreeField.ts");
const villagerBody = read("src/character/npc/VillagerBody.ts");
const scriptedHumanoid = read("src/character/npc/ScriptedHumanoidActor.ts");

assert(
  scenicLayer.includes("Trees disabled after a fault.") &&
    /try \{[\s\S]*?this\.trees\.update\(focus\);[\s\S]*?\} catch \(error\) \{/.test(
      scenicLayer,
    ),
  "Tree faults must stay inside the scenic failure domain.",
);
assert(
  scenicLayer.includes("Trees unavailable during initialization.") &&
    scenicLayer.includes("Fauna unavailable during initialization.") &&
    !/catch \(error\) \{[\s\S]{0,180}?throw error;/.test(scenicLayer),
  "Scenic constructor failures must disable only the failing optional system.",
);
assert(
  scenicLayer.includes("config.faunaEnabled < 1 || faunaCount === 0") &&
    scenicLayer.includes("this.life = undefined"),
  "Inactive or failed fauna must not retain a live scenic owner.",
);
assert(
  scenicLayer.includes("Tree cleanup failed.") &&
    scenicLayer.includes("Fauna cleanup failed.") &&
    scenicLayer.includes("this.disposeTrees();") &&
    scenicLayer.includes("this.disposeFauna();"),
  "Scenic cleanup failures must remain isolated from each other and the world owner.",
);
assert(
  faunaSystem.includes(
    "(this.slots.length === 0 && this.villagers.length === 0)",
  ) &&
    faunaSystem.includes("this.slots.length > 0 ? this.rebuildRoster(focus) : false") &&
    faunaSystem.includes("this.createSlot(scene, index, count") &&
    faunaSystem.includes("villagerCount,") &&
    faunaSystem.includes("index / Math.max(count, 1)"),
  "Deer decisions and villager routes must use the complete active profile counts for spacing.",
);
assert(
  faunaField.includes("const HASH_UNIT = 1 / 4294967296;") &&
    treeField.includes("const HASH_UNIT = 1 / 4294967296;") &&
    !faunaField.includes("4294967295") &&
    !treeField.includes("4294967295"),
  "Scenic uint32 hashes must map to [0, 1) so counts and variation channels never hit the upper endpoint.",
);
assert(
  villagerBody.includes("const geometries = placements.map") &&
    villagerBody.includes("mesh.removeFromParent()") &&
    villagerBody.includes("let disposed = false"),
  "Villager body construction must resolve shared geometry before attachment and roll back owned resources.",
);
const runtimeReset = scriptedHumanoid.indexOf("this.runtime.reset(this.input);");
const scenePublication = scriptedHumanoid.indexOf("scene.add(this.root);");
assert(
  runtimeReset >= 0 && scenePublication > runtimeReset,
  "Scripted humanoids must enter the scene only after construction and animation reset succeed.",
);

console.log("[scenic-runtime] Scenic ownership and independent fauna paths verified.");
