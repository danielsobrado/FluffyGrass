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
  const performanceVerification = await server.ssrLoadModule(
    "/src/world/stones/StoneRenderPerformanceVerification.ts",
  );

  const summary = await verification.verifyStones(configSource);
  const profileSummary = profileVerification.verifyStoneProfiles();
  const runtimeSummary = runtimeVerification.verifyRuntimeStoneVariants(
    configSource,
  );
  const growthSummary = growthVerification.verifyStoneGrowthField();
  const performanceSummary =
    performanceVerification.verifyStoneRenderPerformance(configSource);

  console.log(
    `[stones] OK · ${summary} · ${profileSummary} · ${runtimeSummary} · ${growthSummary} · ${performanceSummary}`,
  );
} catch (error) {
  console.error(`[stones] ${error?.message ?? error}`);
  process.exitCode = 1;
} finally {
  await server.close();
}
