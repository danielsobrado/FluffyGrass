import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[config] ${message}`);
  }
}

async function expectReject(action, pattern, message) {
  try {
    await action();
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    assert(pattern.test(text), `${message} Received: ${text}`);
    return;
  }
  throw new Error(`[config] ${message} Expected configuration to be rejected.`);
}

const worldSource = read("public/config/world.yaml");
const grassSource = read("public/config/grass.yaml");
const runtimeSource = read("public/config/runtime.yaml");
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
  const { GrassConfigLoader } = await server.ssrLoadModule(
    "/src/grass/internal/GrassConfigLoader.ts",
  );
  const { RuntimeConfigLoader } = await server.ssrLoadModule(
    "/src/runtime/RuntimeConfigLoader.ts",
  );

  const originalFetch = globalThis.fetch;
  let responseSource = "";
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => responseSource,
  });

  try {
    const worldLoader = new WorldConfigLoader();
    const grassLoader = new GrassConfigLoader();
    const runtimeLoader = new RuntimeConfigLoader();
    const load = async (loader, source) => {
      responseSource = source;
      return loader.load("memory://config");
    };

    const world = await load(worldLoader, worldSource);
    const grass = await load(grassLoader, grassSource);
    const runtime = await load(runtimeLoader, runtimeSource);

    assert(
      world.grassFarImpostorsPerPatch === 1,
      "World config must retain the one-instance/four-card far-impostor contract.",
    );
    assert(grass.material.baseColor.startsWith("#"), "Grass colors must parse.");
    assert(
      runtime.desktop.shadowMapSize > 0 && runtime.compact.shadowMapSize > 0,
      "Runtime shadow-map sizes must parse.",
    );

    await expectReject(
      () => load(worldLoader, `${worldSource}\nunknownProductionSetting: 1\n`),
      /Unknown world config value: unknownProductionSetting/,
      "Unknown world keys must fail closed.",
    );
    await expectReject(
      () =>
        load(
          worldLoader,
          worldSource.replace(
            "grassNearBridgeDistance: 18",
            "grassNearBridgeDistance: 22",
          ),
        ),
      /bridge LOD handoff must complete before the near-to-mid fade starts/i,
      "Bridge entry must not overlap the patch LOD fade.",
    );
    await expectReject(
      () =>
        load(
          worldLoader,
          worldSource.replace("seed: 42017", "seed: 9007199254740992"),
        ),
      /seed must be a safe integer/,
      "Integer configuration must reject values that cannot be represented exactly.",
    );
    await expectReject(
      () => load(grassLoader, grassSource.replace("#2f7c35", "green")),
      /baseColor must be a six-digit hex color/,
      "Invalid grass colors must fail before rendering.",
    );
    await expectReject(
      () =>
        load(
          grassLoader,
          grassSource.replace("instanceCount: 1400", "instanceCount: 100001"),
        ),
      /instanceCount must not exceed 100000/,
      "Standalone grass allocation must reject pathological instance counts.",
    );
    await expectReject(
      () =>
        load(
          grassLoader,
          grassSource
            .replace("instanceCount: 1400", "instanceCount: 100000")
            .replace("bladesPerClump: 12", "bladesPerClump: 20"),
        ),
      /Configured near-grass workload must not exceed 5000000/,
      "Standalone grass allocation must cap the combined instance/topology workload.",
    );
    await expectReject(
      () =>
        load(
          runtimeLoader,
          runtimeSource.replace(
            "desktopShadowMapSize: 1024",
            "desktopShadowMapSize: 1000",
          ),
        ),
      /desktopShadowMapSize must be a power of two/,
      "Runtime shadow maps must remain power-of-two sized.",
    );
    await expectReject(
      () =>
        load(
          runtimeLoader,
          runtimeSource.replace(
            "desktopShadowMapSize: 1024",
            "desktopShadowMapSize: 32768",
          ),
        ),
      /desktopShadowMapSize must be at most 16384/,
      "Runtime shadow maps must stay within the product allocation ceiling.",
    );
    await expectReject(
      () =>
        load(
          runtimeLoader,
          runtimeSource.replace(
            "desktopShadowMapSize: 1024",
            "desktopShadowMapSize: 4294967297",
          ),
        ),
      /desktopShadowMapSize must be a power of two/,
      "Power-of-two validation must not be bypassed by 32-bit integer truncation.",
    );
    await expectReject(
      () =>
        load(
          runtimeLoader,
          runtimeSource.replace(
            "desktopShadowMapSize: 1024",
            "desktopShadowMapSize: 4503599627370495",
          ),
        ),
      /desktopShadowMapSize must be a power of two/,
      "Power-of-two validation must reject large integers whose logarithm rounds to an integer.",
    );

    console.log("[config] World, grass, and runtime configuration contracts verified.");
  } finally {
    globalThis.fetch = originalFetch;
  }
} finally {
  await server.close();
}
