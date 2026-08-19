// Where does the visual matrix aim its stone poses, and where does the world
// actually put stone? Runs the real field code headless via vite ssrLoadModule,
// the same way scripts/verify-*.mjs do.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

// findWorldVisualLocations yields to the browser between scan rows so the page
// keeps painting. Headless there is no frame clock, so give it one.
globalThis.requestAnimationFrame ??= (callback) =>
  setTimeout(() => callback(Date.now()), 0);

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
  const { StoneClusterField } = await server.ssrLoadModule(
    "/src/world/stones/StoneClusterField.ts",
  );
  const { findWorldVisualLocations } = await server.ssrLoadModule(
    "/src/qa/WorldVisualMatrixLocations.ts",
  );

  const config = new WorldConfigLoader().parse(
    readFileSync(resolve(REPOSITORY_ROOT, "public/config/world.yaml"), "utf8"),
  );
  const field = new TerrainField(config);
  const clusters = new StoneClusterField(field, config);
  const halfWorld = config.worldSize * 0.5;
  // stone-world.html refuses a patch that leaves the world, so a site is only
  // photographable if its half-span fits too.
  const PROBE_HALF_SPAN = 160;
  const probeLimit = halfWorld - PROBE_HALF_SPAN;
  console.log(`world ${config.worldSize} m · half ${halfWorld} · probe limit ${probeLimit}`);

  // The app's own spawn, as the running world reported it in the HUD.
  const ORIGIN_X = 830;
  const ORIGIN_Z = 23;

  console.log(`spacing ${config.stoneClusterSpacing} m · chance ${config.stoneClusterChance}`);
  console.log(`density ${config.stoneDensity} · singleton ${config.stoneSingletonChance}`);

  // 1. Enumerate the macro lattice around the spawn.
  const spacing = config.stoneClusterSpacing;
  const RADIUS = 480;
  const cellRadius = Math.ceil(RADIUS / spacing);
  const originGridX = Math.round(ORIGIN_X / spacing);
  const originGridZ = Math.round(ORIGIN_Z / spacing);

  const active = [];
  let examined = 0;
  for (let gz = originGridZ - cellRadius; gz <= originGridZ + cellRadius; gz += 1) {
    for (let gx = originGridX - cellRadius; gx <= originGridX + cellRadius; gx += 1) {
      examined += 1;
      const descriptor = clusters.getDescriptor(gx, gz);
      if (!descriptor.active) continue;
      // The lattice runs past the world edge. Cells outside it are not places
      // anything can stand, and counting them inflated the "nearest cluster"
      // figure and sent the probe at coordinates it refuses to render.
      if (
        Math.abs(descriptor.centerX) > halfWorld ||
        Math.abs(descriptor.centerZ) > halfWorld
      ) {
        continue;
      }
      const dx = descriptor.centerX - ORIGIN_X;
      const dz = descriptor.centerZ - ORIGIN_Z;
      active.push({
        x: Math.round(descriptor.centerX * 10) / 10,
        z: Math.round(descriptor.centerZ * 10) / 10,
        distance: Math.round(Math.hypot(dx, dz) * 10) / 10,
        budget: descriptor.budget,
        major: Math.round(descriptor.majorRadius * 10) / 10,
        process: descriptor.process,
        suitability: Math.round(descriptor.suitability * 100) / 100,
        probeable:
          Math.abs(descriptor.centerX) <= probeLimit &&
          Math.abs(descriptor.centerZ) <= probeLimit,
      });
    }
  }
  active.sort((a, b) => a.distance - b.distance);
  console.log(
    `\nmacro lattice: ${active.length} active of ${examined} cells within ${RADIUS} m of spawn`,
  );
  for (const cluster of active.slice(0, 12)) {
    console.log(
      `  ${String(cluster.distance).padStart(6)} m  (${cluster.x}, ${cluster.z})  ` +
        `budget ${cluster.budget} · major ${cluster.major} m · ${cluster.process} · suit ${cluster.suitability}` +
        (cluster.probeable ? "" : "  [too close to world edge to probe]"),
    );
  }
  const probeable = active.filter((cluster) => cluster.probeable);
  console.log(`  ${probeable.length} of ${active.length} are probeable`);

  // 2. Where the pose search actually aims.
  const locations = await findWorldVisualLocations(field, ORIGIN_X, ORIGIN_Z);
  const aimed = ["stoneFormation", "rocky", "meadow"];
  console.log("\npose landmarks:");
  for (const key of aimed) {
    const point = locations[key];
    if (!point) continue;
    let nearest = Infinity;
    let nearestCluster = null;
    for (const cluster of active) {
      const d = Math.hypot(cluster.x - point.x, cluster.z - point.z);
      if (d < nearest) {
        nearest = d;
        nearestCluster = cluster;
      }
    }
    console.log(
      `  ${key.padEnd(15)} (${Math.round(point.x)}, ${Math.round(point.z)})  ` +
        `stoneVicinity ${point.stoneVicinity?.toFixed(3)} · rockiness ${point.rockiness?.toFixed(3)}`,
    );
    if (nearestCluster) {
      console.log(
        `  ${"".padEnd(15)} nearest active cluster ${Math.round(nearest * 10) / 10} m away ` +
          `at (${nearestCluster.x}, ${nearestCluster.z}), major radius ${nearestCluster.major} m`,
      );
    }
  }

  // 3. The nearest cluster is the honest place to point a camera.
  if (probeable.length > 0) {
    const best = probeable
      .slice()
      .sort((a, b) => b.budget * b.major - a.budget * a.major)[0];
    console.log(
      `\nrichest nearby cluster: (${best.x}, ${best.z}) at ${best.distance} m — ` +
        `budget ${best.budget}, major radius ${best.major} m, ${best.process}`,
    );
    console.log(`GROUND_TRUTH ${best.x} ${best.z}`);
    const closest = probeable[0];
    console.log(`CLOSEST ${closest.x} ${closest.z} ${closest.distance}`);
    console.log('TOP_PROBEABLE ' + JSON.stringify(probeable.slice(0, 5)));
  }
} finally {
  await server.close();
}
