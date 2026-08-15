import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

/** Build gate for procedural stone geometry, runtime behavior, and cost. */
const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

const configSource = readFileSync(
  resolve(REPOSITORY_ROOT, "public/config/world.yaml"),
  "utf8",
);
const baseline = JSON.parse(
  readFileSync(
    resolve(REPOSITORY_ROOT, "qa/stones/stone-performance-baseline.json"),
    "utf8",
  ),
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
  const verification = await server.ssrLoadModule(
    "/src/world/stones/StoneVerification.ts",
  );
  const profileVerification = await server.ssrLoadModule(
    "/src/world/stones/StoneProfileVerification.ts",
  );
  const runtimeVerification = await server.ssrLoadModule(
    "/src/world/stones/StoneRuntimeVerification.ts",
  );
  const growthVerification = await server.ssrLoadModule(
    "/src/world/stones/StoneGrowthVerification.ts",
  );
  const clusterVerification = await server.ssrLoadModule(
    "/src/world/stones/StoneClusterVerification.ts",
  );
  const clusterPerformanceVerification = await server.ssrLoadModule(
    "/src/world/stones/StoneClusterPerformanceVerification.ts",
  );
  const shaderVerification = await server.ssrLoadModule(
    "/src/world/stones/StoneShaderPerformanceVerification.ts",
  );
  const performanceVerification = await server.ssrLoadModule(
    "/src/world/stones/StoneRenderPerformanceVerification.ts",
  );
  const systemPerformanceVerification = await server.ssrLoadModule(
    "/src/world/stones/StoneSystemPerformanceVerification.ts",
  );

  const summary = await verification.verifyStones(configSource);
  const profileSummary = profileVerification.verifyStoneProfiles();
  const runtimeSummary = runtimeVerification.verifyRuntimeStoneVariants(
    configSource,
  );
  const growthSummary = growthVerification.verifyStoneGrowthField();
  const clusterSummary = clusterVerification.verifyStoneClusters(configSource);
  const clusterPerformanceSummary =
    clusterPerformanceVerification.verifyStoneClusterPerformance(
      configSource,
      baseline,
    );
  const shaderSummary =
    shaderVerification.verifyStoneShaderPerformance(configSource);
  const performanceSummary =
    performanceVerification.verifyStoneRenderPerformance(configSource);
  const systemPerformanceSummary =
    systemPerformanceVerification.verifyStoneSystemPerformance(configSource);

  console.log(
    `[stones] OK · ${summary} · ${profileSummary} · ${runtimeSummary} · ${growthSummary} · ${clusterSummary} · ${clusterPerformanceSummary} · ${shaderSummary} · ${performanceSummary} · ${systemPerformanceSummary}`,
  );
} catch (error) {
  console.error(`[stones] ${error?.message ?? error}`);
  process.exitCode = 1;
} finally {
  await server.close();
}
