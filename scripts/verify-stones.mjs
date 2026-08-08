import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

/**
 * Build gate for the procedural stones.
 *
 * The verifier loads the real runtime modules through Vite SSR instead of
 * re-deriving geometry maths. Broad seed sweeps stress construction and profile
 * contracts; runtime checks exercise the exact quality-selected variants used
 * by StoneField for the configured world seed.
 */

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
  const summary = await verification.verifyStones(configSource);
  const profileSummary = profileVerification.verifyStoneProfiles();
  const runtimeSummary = runtimeVerification.verifyRuntimeStoneVariants(
    configSource,
  );
  const growthSummary = growthVerification.verifyStoneGrowthField();
  console.log(
    `[stones] OK · ${summary} · ${profileSummary} · ${runtimeSummary} · ${growthSummary}`,
  );
} catch (error) {
  console.error(`[stones] ${error?.message ?? error}`);
  process.exitCode = 1;
} finally {
  await server.close();
}
