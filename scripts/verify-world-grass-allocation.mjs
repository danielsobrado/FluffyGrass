import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[world-grass-allocation] ${message}`);
  }
}

function expectReject(action, pattern, message) {
  try {
    action();
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    assert(pattern.test(text), `${message} Received: ${text}`);
    return;
  }
  throw new Error(
    `[world-grass-allocation] ${message} Expected allocation to be rejected.`,
  );
}

const worldSource = readFileSync(
  resolve(REPOSITORY_ROOT, "public/config/world.yaml"),
  "utf8",
);
const loaderSource = readFileSync(
  resolve(REPOSITORY_ROOT, "src/world/WorldConfigLoader.ts"),
  "utf8",
);
assert(
  loaderSource.includes(
    'import { validateWorldGrassAllocationConfig } from "./WorldGrassAllocationValidator"',
  ) &&
    loaderSource.includes("validateWorldGrassAllocationConfig(config)"),
  "Every production world config load must enforce the grass allocation ceilings.",
);

const server = await createServer({
  configFile: false,
  root: REPOSITORY_ROOT,
  appType: "custom",
  logLevel: "silent",
  server: {
    middlewareMode: true,
    watch: null,
  },
  optimizeDeps: { noDiscovery: true },
});

try {
  const { WorldConfigLoader } = await server.ssrLoadModule(
    "/src/world/WorldConfigLoader.ts",
  );
  const limits = await server.ssrLoadModule(
    "/src/world/WorldGrassAllocationValidator.ts",
  );
  const {
    MAX_GRASS_SOURCE_BLADES_PER_PATCH,
    MAX_GRASS_MID_TRIANGLES_PER_RENDER_BATCH,
    MAX_NEAR_GRASS_STACKED_BLADES_PER_TILE,
    validateWorldGrassAllocationConfig,
  } = limits;
  const world = new WorldConfigLoader().parse(worldSource);

  validateWorldGrassAllocationConfig(world);
  assert(
    Math.round(
      world.grassPatchSize ** 2 *
        world.grassBladesPerSquareMeterDesktop,
    ) === 1344,
    "The shipped desktop source patch must remain the reviewed 1,344 blades.",
  );
  assert(
    Math.round(
      world.grassNearTileSize ** 2 *
        world.grassNearBladesPerSquareMeterDesktop *
        (2 * world.grassUltraNearDensityMultiplier - 1),
    ) === 16128,
    "The shipped desktop near-tile stack must remain the reviewed 16,128 blades.",
  );

  expectReject(
    () =>
      validateWorldGrassAllocationConfig({
        ...world,
        grassPatchSize: 16,
      }),
    new RegExp(`above the ${MAX_GRASS_SOURCE_BLADES_PER_PATCH} safety ceiling`),
    "Oversized source patches must fail before shared geometry allocation.",
  );

  expectReject(
    () =>
      validateWorldGrassAllocationConfig({
        ...world,
        chunkSize: 128,
        grassRenderBatchesPerAxis: 1,
      }),
    new RegExp(
      `above the ${MAX_GRASS_MID_TRIANGLES_PER_RENDER_BATCH} safety ceiling`,
    ),
    "Oversized mid render batches must fail before streaming starts.",
  );

  expectReject(
    () =>
      validateWorldGrassAllocationConfig({
        ...world,
        grassNearTileSize: 16,
        grassNearBladesPerSquareMeterDesktop: 180,
        grassUltraNearDensityMultiplier: 3,
      }),
    new RegExp(`above the ${MAX_NEAR_GRASS_STACKED_BLADES_PER_TILE} safety ceiling`),
    "Oversized near-tile stacks must fail before typed-array allocation.",
  );

  console.log(
    `[world-grass-allocation] Patch ${MAX_GRASS_SOURCE_BLADES_PER_PATCH}, batch ${MAX_GRASS_MID_TRIANGLES_PER_RENDER_BATCH}, near stack ${MAX_NEAR_GRASS_STACKED_BLADES_PER_TILE} ceilings and loader integration verified.`,
  );
} finally {
  await server.close();
}
