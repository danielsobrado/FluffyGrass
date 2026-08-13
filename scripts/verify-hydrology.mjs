import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const SAMPLE_STEP = 12;
const EPSILON = 1e-8;

function assert(condition, message) {
  if (!condition) throw new Error(`[hydrology] ${message}`);
}

function assertClose(actual, expected, message, epsilon = EPSILON) {
  assert(
    Math.abs(actual - expected) <= epsilon,
    `${message} Expected ${expected}, received ${actual}.`,
  );
}

const server = await createServer({
  configFile: false,
  root: REPOSITORY_ROOT,
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true },
});

try {
  const THREE = await import("three");
  const { TerrainField } = await server.ssrLoadModule("/src/world/TerrainField.ts");
  const { TerrainChunkBuilder } = await server.ssrLoadModule("/src/world/TerrainChunk.ts");
  const { TerrainSurfaceField } = await server.ssrLoadModule(
    "/src/world/terrain/TerrainSurfaceField.ts",
  );
  const { createHydrologySample } = await server.ssrLoadModule(
    "/src/world/hydrology/HydrologyField.ts",
  );
  const { LakeField, createLakeSample } = await server.ssrLoadModule(
    "/src/world/hydrology/LakeField.ts",
  );
  const {
    WaterInteractionField,
    createWaterInteractionSample,
  } = await server.ssrLoadModule(
    "/src/world/hydrology/WaterInteractionField.ts",
  );
  const {
    WATER_FLOW_NOISE_SIZE,
    sampleWaterFlowNoisePixel,
  } = await server.ssrLoadModule(
    "/src/world/hydrology/WaterFlowNoiseTexture.ts",
  );
  const {
    WATER_BED_NOISE_SIZE,
    sampleWaterBedPixel,
  } = await server.ssrLoadModule("/src/world/hydrology/WaterBedTexture.ts");
  const { WaterMaterialController } = await server.ssrLoadModule(
    "/src/world/hydrology/WaterMaterialController.ts",
  );
  const { WATER_VISIBLE_COVERAGE_THRESHOLD } = await server.ssrLoadModule(
    "/src/world/hydrology/WaterMaterialTuning.ts",
  );
  const { setStoneClearanceField } = await server.ssrLoadModule(
    "/src/world/stones/StoneClearance.ts",
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

  const noiseA = new Float64Array(4);
  const noiseB = new Float64Array(4);
  sampleWaterFlowNoisePixel(17, 29, config.seed, noiseA);
  sampleWaterFlowNoisePixel(
    17 + WATER_FLOW_NOISE_SIZE,
    29 - WATER_FLOW_NOISE_SIZE,
    config.seed,
    noiseB,
  );
  for (let channel = 0; channel < 4; channel += 1) {
    assertClose(
      noiseA[channel],
      noiseB[channel],
      `Water noise channel ${channel} must tile exactly.`,
    );
  }

  // The bed map repeats across open water, so a seam would draw a visible grid
  // of pebbles on the riverbed.
  const bedA = new Float64Array(4);
  const bedB = new Float64Array(4);
  sampleWaterBedPixel(23, 91, config.seed, bedA);
  sampleWaterBedPixel(
    23 + WATER_BED_NOISE_SIZE,
    91 - WATER_BED_NOISE_SIZE,
    config.seed,
    bedB,
  );
  for (let channel = 0; channel < 4; channel += 1) {
    assertClose(
      bedA[channel],
      bedB[channel],
      `Water bed channel ${channel} must tile exactly.`,
    );
  }
  let bedRelief = 0;
  let bedAlgae = 0;
  const bedPixel = new Float64Array(4);
  for (let y = 0; y < WATER_BED_NOISE_SIZE; y += 4) {
    for (let x = 0; x < WATER_BED_NOISE_SIZE; x += 4) {
      sampleWaterBedPixel(x, y, config.seed, bedPixel);
      if (bedPixel[0] > 0.5) bedRelief += 1;
      // Matches the floor WaterBedShader thresholds at, so this tracks the algae
      // that actually reaches the screen rather than the raw noise underneath.
      if (bedPixel[2] > 0.66) bedAlgae += 1;
    }
  }
  const bedPixels = (WATER_BED_NOISE_SIZE / 4) ** 2;
  assert(
    bedRelief > bedPixels * 0.15 && bedRelief < bedPixels * 0.7,
    `Riverbed must carry cobbles standing in crevices, not flat sand or solid stone (${bedRelief}/${bedPixels}).`,
  );
  assert(
    bedAlgae > bedPixels * 0.05 && bedAlgae < bedPixels * 0.5,
    `Riverbed algae must clump into mats rather than vanish or wash over everything (${bedAlgae}/${bedPixels}).`,
  );

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
  let normalizedFlowSamples = 0;
  let wetPoint;
  let riverPoint;
  const lakeLevels = new Map();

  for (let z = -halfWorld; z <= halfWorld; z += SAMPLE_STEP) {
    for (let x = -halfWorld; x <= halfWorld; x += SAMPLE_STEP) {
      const height = terrain.sampleHeight(x, z);
      const dryHeight = dryTerrain.sampleHeight(x, z);
      assert(height <= dryHeight + EPSILON, `Hydrology raised terrain at ${x}, ${z}.`);
      if (dryHeight - height > 0.05) carvedSamples += 1;

      terrain.sampleHydrology(x, z, height, hydrology);
      if (hydrology.riverCoverage > 0.65) {
        riverSamples += 1;
        const flowLength = Math.hypot(hydrology.flowX, hydrology.flowZ);
        assert(
          Math.abs(flowLength - 1) < 1e-6,
          `River flow must stay normalized, received ${flowLength}.`,
        );
        normalizedFlowSamples += 1;
        if (!riverPoint && hydrology.lakeCoverage < 0.01) {
          riverPoint = { x, z, dryHeight };
        }
      }
      if (hydrology.lakeCoverage > 0.65) {
        lakeSamples += 1;
        const levelKey = hydrology.waterLevel.toFixed(5);
        lakeLevels.set(levelKey, (lakeLevels.get(levelKey) ?? 0) + 1);
      }
      if (!wetPoint && hydrology.waterCoverage > 0.65) wetPoint = { x, z, height };

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
    normalizedFlowSamples === riverSamples,
    "Every strong river sample must expose normalized downstream flow.",
  );
  assert(
    [...lakeLevels.values()].some((count) => count >= 4),
    "A lake must expose multiple samples at one exactly flat water level.",
  );
  assert(wetPoint, "Hydrology verification needs at least one open-water point.");
  assert(riverPoint, "Hydrology verification needs a river-only sample.");

  // A lake only ever resolves the spacing cell its sample falls in, so every band
  // it feeds has to reach zero before that cell's edge. When the reserved margin
  // is too small the outer humidity halo is instead cut off mid-value, leaving a
  // step along an invisible grid line. Extra seeds are pinned because containment
  // is a placement property: the shipped seed alone happens to clear the old bound
  // and would leave the regression untested.
  const CONTAINMENT_CELL_RANGE = 12;
  const CONTAINMENT_STEP = 2;
  const CONTAINMENT_NUDGE = 1e-6;
  let containedLakeSamples = 0;
  for (const seed of [config.seed, 7, 5150]) {
    const lakeConfig = { ...config, seed };
    const lakes = new LakeField(lakeConfig);
    const lakeSample = createLakeSample();
    const spacing = lakeConfig.lakeSpacing;
    const bedHeight = lakeConfig.baseHeight - lakeConfig.lakeDepth;
    const extent = CONTAINMENT_CELL_RANGE * spacing;

    for (let cell = -CONTAINMENT_CELL_RANGE; cell <= CONTAINMENT_CELL_RANGE; cell += 1) {
      const boundary = cell * spacing;
      for (let offset = -extent; offset <= extent; offset += CONTAINMENT_STEP) {
        for (const side of [-CONTAINMENT_NUDGE, CONTAINMENT_NUDGE]) {
          for (const [x, z] of [
            [boundary + side, offset],
            [offset, boundary + side],
          ]) {
            lakes.sample(x, z, bedHeight, lakeSample);
            assert(
              lakeSample.coverage === 0 &&
                lakeSample.basin === 0 &&
                lakeSample.proximity === 0,
              `Lake ${lakeSample.coverage > 0 ? "water" : lakeSample.basin > 0 ? "shoreline" : "humidity"} ` +
                `is still ${lakeSample.coverage || lakeSample.basin || lakeSample.proximity} at its own ` +
                `cell edge (${x}, ${z}, seed ${seed}), so the neighbouring cell cuts it off.`,
            );
          }
        }
      }
    }

    // Guard the sweep itself: those edges must be silent because lakes stay clear
    // of them, not because this seed has no lakes to clip. The stride stays well
    // under the narrowest humidity halo, so no live lake is missed.
    for (let z = -extent; z <= extent; z += 40) {
      for (let x = -extent; x <= extent; x += 40) {
        lakes.sample(x, z, bedHeight, lakeSample);
        if (lakeSample.proximity > 0) containedLakeSamples += 1;
      }
    }
  }
  assert(
    containedLakeSamples > 1000,
    `Lake containment sweep only saw ${containedLakeSamples} wet samples, so it proves nothing.`,
  );

  const sensitiveConfig = {
    ...config,
    lakeChance: 0,
    riverMaxAltitude: riverPoint.dryHeight + 9,
  };
  const sensitiveTerrain = new TerrainField(sensitiveConfig);
  const sensitiveHeight = sensitiveTerrain.sampleHeight(riverPoint.x, riverPoint.z);
  const beforeNormal = createHydrologySample();
  sensitiveTerrain.sampleHydrology(
    riverPoint.x,
    riverPoint.z,
    sensitiveHeight,
    beforeNormal,
  );
  assert(
    beforeNormal.riverCoverage > 0.05 && beforeNormal.riverCoverage < 0.95,
    "Call-order regression must exercise the river altitude fade, not a saturated mask.",
  );
  sensitiveTerrain.sampleNormal(riverPoint.x, riverPoint.z, new THREE.Vector3());
  const afterNormal = createHydrologySample();
  sensitiveTerrain.sampleHydrology(
    riverPoint.x,
    riverPoint.z,
    sensitiveHeight,
    afterNormal,
  );
  for (const key of [
    "waterCoverage",
    "waterProximity",
    "humidityBoost",
    "grassMask",
    "waterLevel",
    "riverCoverage",
    "lakeCoverage",
    "flowX",
    "flowZ",
  ]) {
    assertClose(
      afterNormal[key],
      beforeNormal[key],
      `Hydrology ${key} must not depend on intervening normal samples.`,
    );
  }

  const riverConfig = { ...config, lakeChance: 0 };
  const riverTerrain = new TerrainField(riverConfig);
  const riverSurface = new TerrainSurfaceField(riverConfig);
  const waterInteractionField = new WaterInteractionField(riverConfig);
  const chunkX = Math.floor(riverPoint.x / config.chunkSize);
  const chunkZ = Math.floor(riverPoint.z / config.chunkSize);
  const terrainMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  const waterMaterial = new THREE.MeshBasicMaterial({ transparent: true });
  const builder = new TerrainChunkBuilder(
    chunkX,
    chunkZ,
    config.chunkSize,
    config.terrainNearResolution,
    riverTerrain,
    riverSurface,
    waterInteractionField,
    terrainMaterial,
    waterMaterial,
    false,
  );
  let chunk;
  while (!chunk) chunk = builder.advance(1000);
  assert(chunk.waterMesh, "A river terrain chunk must build a water mesh.");
  assert(
    chunk.mesh.geometry.getAttribute("terrainEnvironment")?.itemSize === 4,
    "Terrain must carry altitude/humidity/water/stone environment channels.",
  );
  const terrainIndexCount = chunk.mesh.geometry.getIndex()?.count ?? 0;
  const waterIndexCount = chunk.waterMesh.geometry.getIndex()?.count ?? 0;
  assert(
    waterIndexCount > 0 && waterIndexCount < terrainIndexCount,
    "River water must submit only wet cells instead of the complete terrain grid.",
  );
  assertClose(
    chunk.getTriangleCount(),
    (terrainIndexCount + waterIndexCount) / 3,
    "Terrain diagnostics must include streamed water triangles.",
  );

  const waterData = chunk.waterMesh.geometry.getAttribute("waterData");
  const waterInteraction = chunk.waterMesh.geometry.getAttribute("waterInteraction");
  assert(
    waterData?.itemSize === 4,
    "Water mesh must pack coverage, depth, and downstream flow in one vec4.",
  );
  assert(
    waterInteraction?.itemSize === 2,
    "Water mesh must pack stone-edge and downstream-wake interaction masks.",
  );
  let positiveDepthSamples = 0;
  for (let index = 0; index < waterData.array.length; index += 4) {
    const coverage = waterData.array[index];
    const depth = waterData.array[index + 1];
    const flowLength = Math.hypot(
      waterData.array[index + 2],
      waterData.array[index + 3],
    );
    assert(depth >= 0, "Packed water depth must never be negative.");
    assert(
      flowLength <= coverage + 1e-5,
      "Packed flow magnitude must not exceed visible water coverage.",
    );
    if (coverage > 0.1 && depth > 0.05) positiveDepthSamples += 1;
  }
  assert(
    positiveDepthSamples > 0,
    "A wet chunk must carry real bed-to-surface depth for water absorption.",
  );
  chunk.dispose();
  terrainMaterial.dispose();
  waterMaterial.dispose();

  const fakeStoneField = {
    sampleGrassClearance(x, z) {
      return Math.abs(x) < 0.75 && Math.abs(z) < 0.75 ? 0 : 1;
    },
  };
  setStoneClearanceField(fakeStoneField);
  try {
    const interactionField = new WaterInteractionField(config);
    const interactionHydrology = createHydrologySample();
    interactionHydrology.riverCoverage = 1;
    interactionHydrology.flowX = 1;
    interactionHydrology.flowZ = 0;
    const interaction = createWaterInteractionSample();
    interactionField.sample(0, 0, interactionHydrology, 0, interaction);
    assert(interaction.obstacle > 0.99, "Stone centers must drive water obstacle foam.");
    interactionField.sample(
      config.waterStoneWakeLength,
      0,
      interactionHydrology,
      1,
      interaction,
    );
    assert(
      interaction.wake > 0.5 && interaction.wake < 1,
      "River stone wakes must remain present but taper downstream.",
    );
  } finally {
    setStoneClearanceField(undefined);
  }

  const waterController = new WaterMaterialController(config);
  const shader = {
    uniforms: {},
    vertexShader: "#include <common>\n#include <begin_vertex>",
    fragmentShader: "#include <common>\n#include <normal_fragment_maps>",
  };
  waterController.material.onBeforeCompile(shader, {});
  assert(
    shader.vertexShader.includes("attribute vec4 waterData") &&
      shader.vertexShader.includes("attribute vec2 waterInteraction"),
    "Water shader must consume hydrology and stone-interaction attributes.",
  );
  for (const token of [
    "waterFlowDirection",
    "waterHeightGradient",
    "waterDepthFactor",
    "waterFresnel",
    "waterShoreBand",
    "waterRiverFoam",
    "waterDetailWeight",
    "waterLightingNormal",
    "gl_FrontFacing",
    "waterSampleAdvectedNoise",
    "waterCaustic",
    "waterGlint",
    "waterStoneFoam",
    "waterSampleRiverBed",
    "waterResolveBedPosition",
    "waterBedRelief",
    "waterBedVisibility",
    "uWaterAlgaeStrength",
  ]) {
    assert(shader.fragmentShader.includes(token), `Water shader is missing ${token}.`);
  }
  assert(
    shader.uniforms.uWaterFlowNoise?.value?.isDataTexture === true,
    "Water must bind the generated deterministic flow-noise texture.",
  );
  assert(
    shader.uniforms.uWaterBedNoise?.value?.isDataTexture === true &&
      shader.uniforms.uWaterBedNoise.value.wrapS === THREE.RepeatWrapping &&
      shader.uniforms.uWaterBedNoise.value.wrapT === THREE.RepeatWrapping,
    "Water must bind the riverbed map as a repeating texture.",
  );
  // The bed is sampled at the depth it actually sits at, bent by the wave slope;
  // reading it flat at the surface would paste pebbles onto the water instead.
  const bedCall = shader.fragmentShader.indexOf("waterResolveBedPosition(waterSlope");
  assert(
    bedCall > shader.fragmentShader.indexOf("vec2 waterSlope =") && bedCall > 0,
    "The riverbed lookup must be displaced by the resolved wave slope, not the flat surface.",
  );
  assert(
    shader.fragmentShader.includes(
      `waterCoverageRaw < ${WATER_VISIBLE_COVERAGE_THRESHOLD}`,
    ),
    "CPU water topology and shader clipping must share one coverage threshold.",
  );
  assert(
    shader.fragmentShader.indexOf("dFdx(vWaterWorldPosition)") <
      shader.fragmentShader.indexOf("discard"),
    "Water derivatives must be evaluated before shoreline discard.",
  );
  assert(
    waterController.material.isMeshPhysicalMaterial === true &&
      Math.abs(waterController.material.ior - 1.333) < 1e-6 &&
      Math.abs(waterController.material.roughness - config.waterRoughness) < 1e-9 &&
      waterController.material.transmission === 0,
    "Water must use the physical dielectric BRDF without transmission overhead.",
  );
  assert(
    waterController.material.depthWrite === false &&
      waterController.material.transparent === true &&
      waterController.material.side === THREE.DoubleSide,
    "Water must be transparent, avoid depth writes, and remain visible from below.",
  );
  waterController.dispose();

  console.log(
    `[hydrology] Rivers ${riverSamples}, lakes ${lakeSamples}, carved ${carvedSamples}; flow noise, caustics, glints, stone wakes, depth, and physical water verified.`,
  );
} finally {
  await server.close();
}
