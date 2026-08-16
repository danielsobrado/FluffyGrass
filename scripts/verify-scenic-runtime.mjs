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

assert(
  scenicLayer.includes("Trees disabled after a fault.") &&
    /try \{[\s\S]*?this\.trees\.update\(focus\);[\s\S]*?\} catch \(error\) \{/.test(
      scenicLayer,
    ),
  "Tree faults must stay inside the scenic failure domain.",
);
assert(
  scenicLayer.includes("config.faunaEnabled < 1 || faunaCount === 0") &&
    scenicLayer.includes("this.life = undefined"),
  "Inactive or failed fauna must not retain a live scenic owner.",
);
assert(
  faunaSystem.includes(
    "(this.slots.length === 0 && this.villagers.length === 0)",
  ) &&
    faunaSystem.includes("if (this.slots.length > 0)") &&
    faunaSystem.includes("villagerCount,") &&
    faunaSystem.includes("index / Math.max(count, 1)"),
  "Villagers must update without deer and use the active profile count for spacing.",
);

console.log("[scenic-runtime] Scenic ownership and independent fauna paths verified.");
