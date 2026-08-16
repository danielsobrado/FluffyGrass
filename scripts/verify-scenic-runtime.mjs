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
    faunaSystem.includes("villagerCount,") &&
    faunaSystem.includes("index / Math.max(count, 1)"),
  "Villagers must update without deer and use the active profile count for spacing.",
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
