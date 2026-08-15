import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

/** One-shot capture of the pre-cluster deterministic stone cost. */
const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

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
  const scratch = [];
  const archetypeCounts = {
    pebble: 0,
    boulder: 0,
    slab: 0,
    block: 0,
    shard: 0,
    outcrop: 0,
  };
  let totalRoots = 0;
  let detailedTriangles = 0;
  let coarseTriangles = 0;
  let maxRootsInChunk = 0;

  for (let chunkZ = -6; chunkZ <= 6; chunkZ += 1) {
    for (let chunkX = -6; chunkX <= 6; chunkX += 1) {
      const instances = stones.collectChunkInstances(
        chunkX,
        chunkZ,
        true,
        scratch,
      );
      totalRoots += instances.length;
      maxRootsInChunk = Math.max(maxRootsInChunk, instances.length);
      for (const instance of instances) {
        archetypeCounts[instance.archetype] += 1;
        detailedTriangles += stones.getVariant(
          instance.archetype,
          instance.variantIndex,
          true,
        ).metrics.triangleCount;
        coarseTriangles += stones.getVariant(
          instance.archetype,
          instance.variantIndex,
          false,
        ).metrics.triangleCount;
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        totalRoots,
        archetypeCounts,
        detailedTriangles,
        coarseTriangles,
        maxRootsInChunk,
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}
