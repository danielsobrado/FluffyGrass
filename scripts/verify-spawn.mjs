import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const CLEARANCE_RADIUS_SCALE = 0.5;
const EPSILON = 1e-9;

function assert(condition, message) {
  if (!condition) throw new Error(`[spawn] ${message}`);
}

const worldAppSource = readFileSync(
  resolve(REPOSITORY_ROOT, "src/app/WorldApp.ts"),
  "utf8",
);
assert(
  worldAppSource.includes("const stoneField = new StoneField(this.field, config)") &&
    worldAppSource.includes(
      "new DenseSpawnLocator(this.field, config, stoneField).find()",
    ) &&
    /new WorldStoneSystem\([\s\S]*?stoneField,[\s\S]*?config,/.test(worldAppSource),
  "World startup must reuse one deterministic stone field for spawn clearance and streaming.",
);

const server = await createServer({
  configFile: false,
  root: REPOSITORY_ROOT,
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true },
});

try {
  const THREE = await import("three");
  const { DenseSpawnLocator } = await server.ssrLoadModule(
    "/src/world/DenseSpawnLocator.ts",
  );
  const { TerrainField } = await server.ssrLoadModule(
    "/src/world/TerrainField.ts",
  );
  const { StoneField } = await server.ssrLoadModule(
    "/src/world/stones/StoneField.ts",
  );
  const { WORLD_CONFIG_SCHEMA } = await server.ssrLoadModule(
    "/src/world/WorldConfigSchema.ts",
  );
  const { validateWorldConfig } = await server.ssrLoadModule(
    "/src/world/WorldConfigValidator.ts",
  );

  const source = readFileSync(
    resolve(REPOSITORY_ROOT, "public/config/world.yaml"),
    "utf8",
  );
  const config = Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.replace(/#.*/, "").trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(":");
        return [line.slice(0, separator).trim(), Number(line.slice(separator + 1))];
      }),
  );
  for (const key of Object.keys(WORLD_CONFIG_SCHEMA)) {
    assert(Number.isFinite(config[key]), `World config is missing ${key}.`);
  }
  validateWorldConfig(config);

  const locate = () => {
    const terrain = new TerrainField(config);
    const stones = new StoneField(terrain, config);
    const spawn = new DenseSpawnLocator(terrain, config, stones).find();
    return { terrain, stones, spawn };
  };

  const first = locate();
  const second = locate();
  assert(
    Math.abs(first.spawn.position.x - second.spawn.position.x) <= EPSILON &&
      Math.abs(first.spawn.position.z - second.spawn.position.z) <= EPSILON,
    "The production seed must resolve the same spawn deterministically.",
  );

  const x = first.spawn.position.x;
  const z = first.spawn.position.z;
  const height = first.terrain.sampleHeight(x, z);
  const normal = new THREE.Vector3();
  first.terrain.sampleNormal(x, z, normal);
  const suitability = first.terrain.sampleGrassSuitability(x, z, height, normal);
  const clearanceRadius = config.characterScale * CLEARANCE_RADIUS_SCALE;
  const pathClearance = first.terrain.samplePathGrassMask(
    x,
    z,
    height,
    clearanceRadius,
  );
  const stoneClearance = first.stones.sampleGrassClearance(
    x,
    z,
    clearanceRadius,
  );

  assert(suitability > 0.25, "Spawn must remain on viable grass terrain.");
  assert(pathClearance > 0.5, "Spawn must clear the worn path corridor.");
  assert(stoneClearance > 0.5, "Spawn must clear procedural stone footprints.");

  console.log(
    `[spawn] Deterministic clear spawn ${x.toFixed(1)}, ${z.toFixed(1)} verified.`,
  );
} finally {
  await server.close();
}
