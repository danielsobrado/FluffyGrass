import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[terrain-surface] ${message}`);
  }
}

function smoothstep(value, minimum, maximum) {
  if (value <= minimum) return 0;
  if (value >= maximum) return 1;
  const amount = (value - minimum) / (maximum - minimum);
  return amount * amount * (3 - 2 * amount);
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
  const { PATH_GRASS_FEATHER, TerrainField } = await server.ssrLoadModule(
    "/src/world/TerrainField.ts",
  );
  const { TerrainSurfaceField } = await server.ssrLoadModule(
    "/src/world/terrain/TerrainSurfaceField.ts",
  );
  const { TerrainSurfacePalette } = await server.ssrLoadModule(
    "/src/world/terrain/TerrainSurfacePalette.ts",
  );
  const { createHydrologySample } = await server.ssrLoadModule(
    "/src/world/hydrology/HydrologyField.ts",
  );
  const {
    TERRAIN_SURFACE_NOISE_SIZE,
    createTerrainSurfaceNoiseTexture,
    sampleTerrainSurfaceNoisePixel,
  } = await server.ssrLoadModule(
    "/src/world/terrain/TerrainSurfaceNoiseTexture.ts",
  );
  const {
    TERRAIN_DETAIL_COLOR,
    TERRAIN_DETAIL_FRAGMENT,
    TERRAIN_DETAIL_NORMAL,
    TERRAIN_DETAIL_VERTEX,
  } = await server.ssrLoadModule("/src/world/TerrainMaterialShader.ts");
  const { setStoneClearanceField } = await server.ssrLoadModule(
    "/src/world/stones/StoneClearance.ts",
  );
  const { WORLD_CONFIG_SCHEMA } = await server.ssrLoadModule(
    "/src/world/WorldConfigSchema.ts",
  );
  const worldSource = await import("node:fs").then(({ readFileSync }) =>
    readFileSync(resolve(REPOSITORY_ROOT, "public/config/world.yaml"), "utf8"),
  );
  const rawConfig = Object.fromEntries(
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
    assert(Number.isFinite(rawConfig[key]), `World config is missing ${key}.`);
  }

  const textureA = createTerrainSurfaceNoiseTexture(rawConfig.seed);
  const textureB = createTerrainSurfaceNoiseTexture(rawConfig.seed);
  const textureC = createTerrainSurfaceNoiseTexture(rawConfig.seed + 1);
  const bytesA = textureA.image.data;
  const bytesB = textureB.image.data;
  const bytesC = textureC.image.data;
  assert(
    bytesA.length ===
      TERRAIN_SURFACE_NOISE_SIZE * TERRAIN_SURFACE_NOISE_SIZE * 4,
    "Noise texture must remain RGBA 256x256.",
  );
  let differingSeedBytes = 0;
  for (let index = 0; index < bytesA.length; index += 257) {
    assert(bytesA[index] === bytesB[index], "Identical seeds must be byte stable.");
    if (bytesA[index] !== bytesC[index]) differingSeedBytes += 1;
  }
  assert(differingSeedBytes > 128, "Different seeds must materially change the noise field.");
  const periodicA = new Float64Array(4);
  const periodicB = new Float64Array(4);
  for (const [x, y] of [[37, 91], [211, 5], [-19, 277]]) {
    sampleTerrainSurfaceNoisePixel(x, y, rawConfig.seed, periodicA);
    sampleTerrainSurfaceNoisePixel(
      x + TERRAIN_SURFACE_NOISE_SIZE,
      y - TERRAIN_SURFACE_NOISE_SIZE,
      rawConfig.seed,
      periodicB,
    );
    for (let channel = 0; channel < 4; channel += 1) {
      assert(
        Math.abs(periodicA[channel] - periodicB[channel]) < 1e-12,
        `Noise channel ${channel} must tile exactly.`,
      );
    }
  }
  textureA.dispose();
  textureB.dispose();
  textureC.dispose();

  const terrain = new TerrainField(rawConfig);
  const worldHalfExtent = rawConfig.worldSize * 0.5;
  for (const [x, z] of [
    [worldHalfExtent + 0.01, 0],
    [-worldHalfExtent - 0.01, 0],
    [0, worldHalfExtent + 0.01],
    [0, -worldHalfExtent - 0.01],
  ]) {
    const height = terrain.sampleHeight(x, z);
    assert(
      terrain.sampleGrassSuitabilityWithoutSlope(x, z, height) === 0,
      "Grass suitability must be zero outside the bounded terrain world.",
    );
  }
  const surface = new TerrainSurfaceField(rawConfig);
  const hydrology = createHydrologySample();
  const normal = new THREE.Vector3();
  const pathDistance = new THREE.Vector2();
  const targets = {
    ecology: new THREE.Vector4(),
    environment: new THREE.Vector4(),
    biome: new THREE.Vector3(),
  };
  let biomeMask = 0;
  for (let z = -720; z <= 720; z += 36) {
    for (let x = -720; x <= 720; x += 36) {
      const height = terrain.sampleHeight(x, z);
      terrain.sampleHydrology(x, z, height, hydrology);
      terrain.sampleNormal(x, z, normal);
      const suitability = terrain.sampleGrassSuitability(x, z, height, normal);
      const ecology = terrain.sampleEcologyAt(x, z, height);
      surface.sample(x, z, height, suitability, hydrology, ecology, targets);
      for (const value of [
        ...targets.ecology.toArray(),
        ...targets.environment.toArray(),
      ]) {
        assert(
          Number.isFinite(value) && value >= 0 && value <= 1,
          `Surface semantic escaped [0,1]: ${value}.`,
        );
      }
      assert(
        targets.environment.w === 1,
        "Terrain without a registered stone field must keep full stone clearance.",
      );
      assert(
        Number.isInteger(targets.biome.x) && Number.isInteger(targets.biome.y),
        "Biome rows must remain integer attributes.",
      );
      assert(
        targets.biome.z >= 0 && targets.biome.z <= 0.5,
        "Biome blend must remain inside its dither border contract.",
      );
      biomeMask |= 1 << targets.biome.x;
    }
  }
  assert(
    (biomeMask & 0b111) === 0b111,
    "Surface sampling must encounter every biome row.",
  );

  setStoneClearanceField({
    sampleGrassClearance: () => 0.37,
  });
  try {
    const x = 73;
    const z = -41;
    const height = terrain.sampleHeight(x, z);
    terrain.sampleHydrology(x, z, height, hydrology);
    terrain.sampleNormal(x, z, normal);
    const suitability = terrain.sampleGrassSuitability(x, z, height, normal);
    const ecology = terrain.sampleEcologyAt(x, z, height);
    surface.sample(x, z, height, suitability, hydrology, ecology, targets);
    assert(
      Math.abs(targets.environment.w - 0.37) < 1e-12,
      "Terrain surface must carry the same stone clearance used by grass placement.",
    );
  } finally {
    setStoneClearanceField(undefined);
  }

  assert(
    TERRAIN_DETAIL_COLOR.includes(
      "uTerrainLodDistances.x + uTerrainLodDistances.y",
    ),
    "Ultra-near micro detail must stay full through its grass radius and fade afterward.",
  );
  assert(
    TERRAIN_DETAIL_COLOR.includes(
      "terrainBiomeDensity * terrainPathGrassMask * terrainStoneClearance",
    ),
    "Terrain vegetation coverage must include stone clearance.",
  );
  assert(
    TERRAIN_DETAIL_NORMAL.includes("terrainSurfaceNormalMask"),
    "Terrain micro normals must stay restricted to ecological ground and paths.",
  );
  assert(
    TERRAIN_DETAIL_VERTEX.includes("attribute vec4 terrainEnvironment") &&
      TERRAIN_DETAIL_FRAGMENT.includes("varying vec4 vTerrainEnvironment") &&
      TERRAIN_DETAIL_COLOR.includes("terrainWaterProximity"),
    "Terrain environment channels must carry hydrology into wet-ground shading.",
  );
  const microStart = rawConfig.grassUltraNearDistance;
  const microEnd = microStart + rawConfig.grassUltraNearTransitionDistance;
  assert(
    1 - smoothstep(microStart, microStart, microEnd) === 1 &&
      1 - smoothstep(microEnd, microStart, microEnd) === 0,
    "Ultra-near ground detail fade must match the grass 6-to-7 metre contract.",
  );

  let pathCoreSamples = 0;
  let pathVergeSamples = 0;
  let fieldSamples = 0;
  const verifyPathParity = (x, z) => {
    const height = terrain.sampleHeight(x, z);
    terrain.samplePathDistances(x, z, pathDistance);
    const main = smoothstep(
      Math.abs(pathDistance.x),
      rawConfig.pathWidth * 0.5 +
        rawConfig.pathEdgeRoughness +
        rawConfig.pathGrassClearance,
      rawConfig.pathWidth * 0.5 +
        rawConfig.pathEdgeRoughness +
        rawConfig.pathGrassClearance +
        PATH_GRASS_FEATHER,
    );
    const branch = smoothstep(
      Math.abs(pathDistance.y),
      rawConfig.pathBranchWidth * 0.5 +
        rawConfig.pathEdgeRoughness +
        rawConfig.pathGrassClearance,
      rawConfig.pathBranchWidth * 0.5 +
        rawConfig.pathEdgeRoughness +
        rawConfig.pathGrassClearance +
        PATH_GRASS_FEATHER,
    );
    const visualMask =
      1 +
      (Math.min(main, branch) - 1) * terrain.samplePathVisibility(height);
    const placementMask = terrain.samplePathGrassMask(x, z, height);
    assert(
      Math.abs(visualMask - placementMask) < 1e-9,
      "Terrain verge mask diverged from grass placement.",
    );
    if (visualMask <= 0.02) pathCoreSamples += 1;
    else if (visualMask < 0.98) pathVergeSamples += 1;
    else fieldSamples += 1;
  };
  for (const fixed of [-611, -173, 227, 673]) {
    for (let moving = -1020; moving <= 1020; moving += 2) {
      verifyPathParity(moving, fixed);
      verifyPathParity(fixed, moving);
    }
  }
  assert(pathCoreSamples > 0, "Path parity must exercise a road core.");
  assert(pathVergeSamples > 0, "Path parity must exercise a feathered verge.");
  assert(fieldSamples > 0, "Path parity must exercise unaffected field ground.");

  const palette = new TerrainSurfacePalette();
  const colorDistance = (left, right) =>
    Math.hypot(
      left.r - right.r,
      left.g - right.g,
      left.b - right.b,
    );
  assert(
    colorDistance(palette.base[0], palette.base[1]) > 0.02 &&
      colorDistance(palette.base[1], palette.base[2]) > 0.02,
    "Meadow, steppe, and alpine terrain palettes must remain visibly distinct.",
  );

  console.log(
    "[terrain-surface] Determinism, bounded ecology, environment semantics, LOD, stone, biome, and path parity verified.",
  );
} finally {
  await server.close();
}
