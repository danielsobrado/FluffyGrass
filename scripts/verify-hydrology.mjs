import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const SAMPLE_STEP = 12;
const EPSILON = 1e-8;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[hydrology] ${message}`);
  }
}

const server = await createServer({
  configFile: false,
  root: REPOSITORY_ROOT,
  appType: "custom",
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true },
});

try {
  const THREE = await import("three");
  const { TerrainField } = await server.ssrLoadModule(
    "/src/world/TerrainField.ts",
  );
  const { TerrainChunkBuilder } = await server.ssrLoadModule(
    "/src/world/TerrainChunk.ts",
  );
  const { TerrainSurfaceField } = await server.ssrLoadModule(
    "/src/world/terrain/TerrainSurfaceField.ts",
  );
  const { createHydrologySample } = await server.ssrLoadModule(
    "/src/world/hydrology/HydrologyField.ts",
  );
  const { WORLD_CONFIG_SCHEMA } = await server.ssrLoadModule(
    "/src/world/WorldConfigSchema.ts",
  );
  const { validateWorldConfig } = await server.ssrLoadModule(
    "/src/world/WorldConfigValidator.ts",
  );

  const worldSource = readFileSync(
    resolve(REPOSITORY_ROOT, "public/config/world.yaml"),
    "utf8",
  );
  const config = Object.fromEntries(
    worldSource
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
  assert(config.waterEnabled === 1, "Production hydrology must be enabled.");

  const terrain = new TerrainField(config);
  const dryTerrain = new TerrainField({ ...config, waterEnabled: 0 });
  const hydrology = createHydrologySample();
  const surface = new TerrainSurfaceField(config);
  const targets = {
    ecology: new THREE.Vector4(),
    environment: new THREE.Vector4(),
    biome: new THREE.Vector3(),
  };
  const halfWorld = config.worldSize * 0.5;
  let riverSamples = 0;
  let lakeSamples = 0;
  let carvedSamples = 0;
  let wetPoint;
  const lakeLevels = new Map();

  for (let z = -halfWorld; z <= halfWorld; z += SAMPLE_STEP) {
    for (let x = -halfWorld; x <= halfWorld; x += SAMPLE_STEP) {
      const height = terrain.sampleHeight(x, z);
      const dryHeight = dryTerrain.sampleHeight(x, z);
      assert(
        height <= dryHeight + EPSILON,
        `Hydrology raised terrain at ${x}, ${z}.`,
      );
      if (dryHeight - height > 0.05) carvedSamples += 1;

      terrain.sampleHydrology(x, z, height, hydrology);
      if (hydrology.riverCoverage > 0.65) riverSamples += 1;
      if (hydrology.lakeCoverage > 0.65) {
        lakeSamples += 1;
        const levelKey = hydrology.waterLevel.toFixed(5);
        lakeLevels.set(levelKey, (lakeLevels.get(levelKey) ?? 0) + 1);
      }
      if (!wetPoint && hydrology.waterCoverage > 0.65) {
        wetPoint = { x, z, height };
      }

      if (hydrology.waterCoverage > 0.65) {
        assert(
          hydrology.waterLevel > height,
          "Open-water surface must remain above its carved bed.",
        );
        assert(
          terrain.sampleGrassSuitabilityWithoutSlope(x, z, height) < 0.08,
          "Open water must reject normal grass placement.",
        );
      }

      if (hydrology.waterProximity > 0.5 && hydrology.waterCoverage < 0.2) {
        const suitability = terrain.sampleGrassSuitabilityWithoutSlope(x, z, height);
        surface.sample(x, z, height, suitability, hydrology, targets);
        assert(
          targets.environment.z > 0.49 && targets.environment.y > 0,
          "Wet banks must carry water proximity and humidity semantics.",
        );
      }
    }
  }

  assert(carvedSamples > 100, "Hydrology must materially carve the production map.");
  assert(riverSamples > 20, "Production seed must contain visible river water.");
  assert(lakeSamples > 20, "Production seed must contain visible lake water.");
  assert(
    [...lakeLevels.values()].some((count) => count >= 4),
    "A lake must expose multiple samples at one exactly flat water level.",
  );
  assert(wetPoint, "Hydrology verification needs at least one open-water point.");

  const chunkX = Math.floor(wetPoint.x / config.chunkSize);
  const chunkZ = Math.floor(wetPoint.z / config.chunkSize);
  const terrainMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  const waterMaterial = new THREE.MeshBasicMaterial({ transparent: true });
  const builder = new TerrainChunkBuilder(
    chunkX,
    chunkZ,
    config.chunkSize,
    config.terrainNearResolution,
    terrain,
    surface,
    terrainMaterial,
    waterMaterial,
    false,
  );
  let chunk;
  while (!chunk) {
    chunk = builder.advance(1000);
  }
  assert(chunk.waterMesh, "A wet terrain chunk must build a water mesh.");
  assert(
    chunk.mesh.geometry.getAttribute("terrainEnvironment")?.itemSize === 4,
    "Terrain must carry altitude/humidity/water/stone environment channels.",
  );
  assert(
    chunk.waterMesh.geometry.getAttribute("waterCoverage")?.itemSize === 1,
    "Water mesh must carry shoreline coverage for fragment clipping.",
  );
  chunk.dispose();
  terrainMaterial.dispose();
  waterMaterial.dispose();

  console.log(
    `[hydrology] Rivers ${riverSamples}, lakes ${lakeSamples}, carved ${carvedSamples}; terrain/water integration verified.`,
  );
} finally {
  await server.close();
}
