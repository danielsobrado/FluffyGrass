import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

/**
 * Build gate for the procedural stones.
 *
 * Unlike the other verifiers, this one loads the real modules through Vite
 * SSR instead of re-deriving their maths: the geometry checks exercise a
 * convex half-space clipper, and a hand-maintained copy of that clipper is
 * exactly the kind of divergence-prone duplicate the other scripts warn
 * about. Vite is already a dependency; no test framework is added.
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
  const summary = await verification.verifyStones(configSource);
  console.log(`[stones] OK · ${summary}`);
} catch (error) {
  console.error(`[stones] ${error?.message ?? error}`);
  process.exitCode = 1;
} finally {
  await server.close();
}
