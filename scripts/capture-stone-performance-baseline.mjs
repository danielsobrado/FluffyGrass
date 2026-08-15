import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

/** Deterministic pre-change stone placement cost snapshot. */
const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const OUTPUT_PATH = resolve(
  REPOSITORY_ROOT,
  "qa/stones/stone-performance-baseline.json",
);
const CHUNK_MIN = -6;
const CHUNK_MAX = 6;

const configSource = readFileSync(
  resolve(REPOSITORY_ROOT, "public/config/world.yaml"),
  "utf8",
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
  const { WorldConfigLoader } = await server.ssrLoadModule(
    "/src/world/WorldConfigLoader.ts",
  );
  const { TerrainField } = await server.ssrLoadModule(
    "/src/world/TerrainField.ts",
  );
  const { StoneField } = await server.ssrLoadModule(
    "/src/world/stones/StoneField.ts",
  );

  const config = new WorldConfigLoader().parse(configSource);
  const terrain = new TerrainField(config);
  const stones = new StoneField(terrain, config);
  const includeSmallScratch = [];
  const farScratch = [];

  let includeSmallRoots = 0;
  let farRoots = 0;
  let maxRootsInChunk = 0;
  let detailedTrianglePotential = 0;
  let coarseTrianglePotential = 0;

  for (let chunkZ = CHUNK_MIN; chunkZ <= CHUNK_MAX; chunkZ += 1) {
    for (let chunkX = CHUNK_MIN; chunkX <= CHUNK_MAX; chunkX += 1) {
      const includeSmall = stones.collectChunkInstances(
        chunkX,
        chunkZ,
        true,
        includeSmallScratch,
      );
      includeSmallRoots += includeSmall.length;
      maxRootsInChunk = Math.max(maxRootsInChunk, includeSmall.length);
      for (const instance of includeSmall) {
        detailedTrianglePotential +=
          stones.getVariant(instance.archetype, instance.variantIndex, true)
            .indices.length / 3;
      }

      const far = stones.collectChunkInstances(
        chunkX,
        chunkZ,
        false,
        farScratch,
      );
      farRoots += far.length;
      for (const instance of far) {
        coarseTrianglePotential +=
          stones.getVariant(instance.archetype, instance.variantIndex, false)
            .indices.length / 3;
      }
    }
  }

  const baseline = {
    seed: config.seed,
    chunkMin: CHUNK_MIN,
    chunkMax: CHUNK_MAX,
    includeSmallRoots,
    farRoots,
    maxRootsInChunk,
    detailedTrianglePotential,
    coarseTrianglePotential,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(`${OUTPUT_PATH}`, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(
    `[stones-baseline] wrote ${OUTPUT_PATH} · ${includeSmallRoots} near roots · ${farRoots} far roots`,
  );
} catch (error) {
  console.error(`[stones-baseline] ${error?.message ?? error}`);
  process.exitCode = 1;
} finally {
  await server.close();
}
