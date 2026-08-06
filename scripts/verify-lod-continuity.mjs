import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function fail(message) {
  throw new Error(`[lod-continuity] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function readYamlNumber(source, key) {
  const value = Number(
    source.match(new RegExp(`^${key}:\\s*([0-9.]+)$`, "m"))?.[1],
  );
  if (!Number.isFinite(value)) {
    fail(`Unable to read ${key} from configuration.`);
  }
  return value;
}

async function importTypeScriptModule(relativePath, sourceOverride) {
  const fileName = resolve(REPOSITORY_ROOT, relativePath);
  const source = sourceOverride ?? readFileSync(fileName, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    fileName,
    reportDiagnostics: true,
  });
  const errors = result.diagnostics?.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors?.length) {
    fail(
      `Unable to transpile ${relativePath}: ${errors
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
        )
        .join("; ")}`,
    );
  }
  const encoded = Buffer.from(result.outputText).toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

const controller = read("src/grass/GrassLodController.ts");
const thirdPersonController = read("src/controls/ThirdPersonController.ts");
const nearMaterial = read("src/grass/materials/GrassNearMaterial.ts");
const sharedPalette = read("src/grass/materials/GrassPaletteShader.ts");
const artDirections = JSON.parse(read("src/grass/GrassArtPresets.json"));
const impostorMaterial = read(
  "src/world/grass/WorldGrassImpostorMaterial.ts",
);
const impostorAtlasFactory = read(
  "src/world/grass/WorldGrassImpostorAtlasFactory.ts",
);
const tuning = read("src/world/grass/WorldGrassImpostorTuning.ts");
const lodTuning = read("src/grass/GrassLodTuning.ts");
const worldGrassSystem = read("src/world/WorldGrassSystem.ts");
const nearField = read("src/world/grass/WorldNearGrassField.ts");
const singleBladeFactory = read(
  "src/world/grass/WorldSingleBladeTileFactory.ts",
);
const worldConfig = read("public/config/world.yaml");
const grassConfig = read("public/config/grass.yaml");

const artDirectionSource = read("src/grass/GrassArtDirection.ts").replace(
  'import presetData from "./GrassArtPresets.json";',
  `const presetData = ${JSON.stringify(artDirections)};`,
);
const artDirectionModule = await importTypeScriptModule(
  "src/grass/GrassArtDirection.ts",
  artDirectionSource,
);
const runtimeMathModule = await importTypeScriptModule(
  "src/world/grass/GrassRuntimeMath.ts",
);
const lodTuningModule = await importTypeScriptModule(
  "src/grass/GrassLodTuning.ts",
);

for (const key of Object.keys(artDirectionModule.GRASS_ART_DIRECTIONS)) {
  assert(
    artDirectionModule.resolveGrassArtDirectionKey(key) === key,
    `Grass-art preset ${key} must resolve to itself.`,
  );
}
for (const invalidKey of [
  null,
  undefined,
  "",
  "unknown",
  "constructor",
  "toString",
  "__proto__",
]) {
  assert(
    artDirectionModule.resolveGrassArtDirectionKey(invalidKey) ===
      artDirectionModule.DEFAULT_GRASS_ART_DIRECTION_KEY,
    `Invalid grass-art key ${String(invalidKey)} must resolve to the default.`,
  );
}

const patchSize = readYamlNumber(worldConfig, "grassPatchSize");
const bladeHeightMax = readYamlNumber(grassConfig, "bladeHeightMax");
const heightVariation = readYamlNumber(grassConfig, "heightVariation");
const windStrength = readYamlNumber(grassConfig, "windStrength");
const cameraMargin = readYamlNumber(grassConfig, "impostorCameraMargin");
const centerHeight = bladeHeightMax * 0.5;
const halfPatch = patchSize * 0.5;
const cardRadius =
  Math.sqrt(halfPatch * halfPatch * 2 + centerHeight * centerHeight) *
  cameraMargin;
const boundsRadius =
  runtimeMathModule.calculateGrassImpostorRootBoundsRadius({
    cardRadius,
    centerHeight,
    footprintScale: lodTuningModule.GRASS_IMPOSTOR_FOOTPRINT_SCALE,
    maximumHorizontalScale:
      lodTuningModule.GRASS_IMPOSTOR_MAX_HORIZONTAL_SCALE,
    maximumVerticalScale:
      lodTuningModule.GRASS_IMPOSTOR_MAX_VERTICAL_SCALE,
    maximumWindDisplacement:
      lodTuningModule.GRASS_IMPOSTOR_MAX_WIND_DISPLACEMENT,
    safetyMargin: lodTuningModule.GRASS_IMPOSTOR_BOUNDS_SAFETY_MARGIN,
  });
const maximumVisibleExtent =
  centerHeight * lodTuningModule.GRASS_IMPOSTOR_MAX_VERTICAL_SCALE +
  Math.hypot(
    cardRadius *
      lodTuningModule.GRASS_IMPOSTOR_MAX_HORIZONTAL_SCALE *
      lodTuningModule.GRASS_IMPOSTOR_FOOTPRINT_SCALE,
    cardRadius * lodTuningModule.GRASS_IMPOSTOR_MAX_VERTICAL_SCALE,
  ) +
  lodTuningModule.GRASS_IMPOSTOR_MAX_WIND_DISPLACEMENT;
assert(
  boundsRadius >= maximumVisibleExtent,
  "The far-impostor root bound must contain every transformed card corner.",
);
assert(
  1 + heightVariation <=
    lodTuningModule.GRASS_IMPOSTOR_MAX_VERTICAL_SCALE,
  "Configured grass height variation exceeds the far-impostor bound.",
);
const maximumWindScale = Math.max(
  ...Object.values(artDirectionModule.GRASS_ART_DIRECTIONS).map(
    (direction) => direction.windStrengthScale,
  ),
);
// Cards shear from root to tip and the shear is scaled by the instance's own
// vertical scale, so the worst case is the product of all four terms. The shear
// factor is read from the shader source rather than repeated here: it used to
// be a literal in both places, and the shader's moved while the gate's did not.
const impostorShearFactor = Number(
  impostorMaterial.match(
    /gustNoise \* 2\.0 - 1\.0\) \* uWindStrength \*\s*\$\{GRASS_IMPOSTOR_WIND_SHEAR_FACTOR/,
  )
    ? lodTuningModule.GRASS_IMPOSTOR_WIND_SHEAR_FACTOR
    : Number.NaN,
);
assert(
  Number.isFinite(impostorShearFactor),
  "The far-impostor shear must be templated from GRASS_IMPOSTOR_WIND_SHEAR_FACTOR.",
);
assert(
  windStrength *
    maximumWindScale *
    impostorShearFactor *
    lodTuningModule.GRASS_IMPOSTOR_MAX_VERTICAL_SCALE <=
    lodTuningModule.GRASS_IMPOSTOR_MAX_WIND_DISPLACEMENT,
  "Configured far-impostor wind exceeds the reserved bounds displacement.",
);
// The shear ramp must span the card, not the (much larger) culling bound.
assert(
  impostorMaterial.includes("uCardRadius: { value: atlas.cardRadius }") &&
    impostorMaterial.includes(
      "position.y / max(uCardRadius, 0.0001) * 0.5 + 0.5",
    ),
  "Impostor shear must ramp across the card's own half-extent.",
);
const horizontalScaleMaximum = Number(
  worldGrassSystem.match(
    /horizontalScale = job\.random\.range\([^,]+,\s*([0-9.]+)\)/,
  )?.[1],
);
assert(
  Number.isFinite(horizontalScaleMaximum) &&
    horizontalScaleMaximum <=
      lodTuningModule.GRASS_IMPOSTOR_MAX_HORIZONTAL_SCALE,
  "Generated horizontal grass scale exceeds the far-impostor bound.",
);
const farCardsPerPatch = readYamlNumber(
  worldConfig,
  "grassFarImpostorsPerPatch",
);
const cardOffset = farCardsPerPatch > 1 ? patchSize * 0.12 : 0;
assert(
  cardOffset *
      (lodTuningModule.GRASS_IMPOSTOR_MAX_VERTICAL_SCALE - 1) <=
    lodTuningModule.GRASS_IMPOSTOR_BOUNDS_SAFETY_MARGIN,
  "Layered-card scale amplification exceeds the bounds safety margin.",
);

let invalidBoundsRejected = false;
try {
  runtimeMathModule.calculateGrassImpostorRootBoundsRadius({
    cardRadius: Number.NaN,
    centerHeight,
    footprintScale: 1,
    maximumHorizontalScale: 1,
    maximumVerticalScale: 1,
    maximumWindDisplacement: 0,
    safetyMargin: 0,
  });
} catch (error) {
  invalidBoundsRejected = error instanceof RangeError;
}
assert(
  invalidBoundsRejected,
  "Invalid impostor bounds input must be rejected.",
);

assert(
  impostorAtlasFactory.includes("texture.colorSpace = THREE.NoColorSpace") &&
    impostorAtlasFactory.includes("texture.premultiplyAlpha = true") &&
    impostorAtlasFactory.includes("encodeDataColor") &&
    impostorAtlasFactory.includes("baseEdgeX") &&
    impostorAtlasFactory.includes("radius: boundsRadius") &&
    !impostorAtlasFactory.includes("new THREE.Color(material.baseColor)"),
  "The far atlas must store palette-neutral data and expose conservative bounds.",
);
assert(
  impostorMaterial.includes("vec3 bladeData = clamp(") &&
    impostorMaterial.includes("grassResolvePalette") &&
    !impostorMaterial.includes("smoothstep(0.08, 0.92, vUv.y)"),
  "The far shader must reconstruct the shared palette from neutral atlas masks.",
);

assert(
  !controller.includes("farAerialVisible"),
  "CPU visibility must not suppress far meshes by aerial angle.",
);
assert(
  !controller.includes("grassDistanceFade") &&
    nearMaterial.includes(
      "grassDither > 1.0 - grassDensityFalloff * (1.0 - grassLodCut)",
    ) &&
    nearMaterial.includes(
      "float grassLodCut = max(grassNearCoverage, grassFarDistanceEntry)",
    ),
  "World mid coverage must be resolved once from world distance in the shader.",
);
assert(
  !/vFarEntry\s*\*\s*vTerrainCoverage\s*\*\s*aerialVisibility/.test(
    impostorMaterial,
  ),
  "Far coverage must stay complementary to the mid distance fade.",
);
assert(
  !nearMaterial.includes("grassPaletteBlend") &&
    !nearMaterial.includes("vGrassCameraDistance"),
  "Real-blade palette must not change with LOD distance.",
);
assert(
  sharedPalette.includes("grassResolvePalette") &&
    sharedPalette.includes("setBalancedGrassPaletteColors") &&
    nearMaterial.includes("GRASS_PALETTE_GLSL") &&
    impostorMaterial.includes("GRASS_PALETTE_GLSL") &&
    nearMaterial.includes("setBalancedGrassPaletteColors") &&
    impostorMaterial.includes("setBalancedGrassPaletteColors"),
  "Real blades and impostors must use the shared palette function.",
);
const paletteTemplate = sharedPalette.slice(
  sharedPalette.indexOf("export const GRASS_PALETTE_GLSL"),
);
const injectedPaletteScalars = [
  ...paletteTemplate.matchAll(/\$\{([^}]+)\}/g),
].map((match) => match[1].trim());
assert(
  injectedPaletteScalars.length > 0 &&
    injectedPaletteScalars.every((expression) =>
      expression.startsWith("toGlslFloat(tuning."),
    ) &&
    sharedPalette.includes("Number.isInteger(value)"),
  "Every generated palette scalar must be emitted as a GLSL float literal.",
);
assert(
  /grassResolvePalette\(\s*uGrassBiomeBase\[grassBiomeRow\],\s*uGrassBiomeTip\[grassBiomeRow\],\s*uGrassBiomeDry\[grassBiomeRow\],/s.test(
    nearMaterial,
  ) &&
    /grassResolvePalette\(\s*uBiomeBase\[biomeRow\],\s*uBiomeTip\[biomeRow\],\s*uBiomeDry\[biomeRow\],\s*bladeData\.r,\s*bladeData\.g,/s.test(
      impostorMaterial,
    ) &&
    nearMaterial.includes("uGrassBiomeShade[grassBiomeRow].y") &&
    impostorMaterial.includes("uBiomeShade[biomeRow].y"),
  "LOD shaders must map shared palette arguments and atlas channels identically.",
);
// Far cards now take the stochastic single-fetch path across the whole range,
// not just past the handoff. The four-tap blend it replaced ran precisely where
// the cards are largest on screen, and the real mid blades still drawing over
// them there hide the difference. What must not come back is a multi-fetch
// filter or a premultiply that would break the semantic channel decode.
assert(
  !impostorMaterial.includes("atlasColor.rgb *= atlasColor.a") &&
    !impostorMaterial.includes("vec4 color00 = sampleFrame") &&
    impostorMaterial.includes("Stable stochastic bilinear selection"),
  "Far atlas filtering must reconstruct the view blend with a single fetch.",
);
assert(
  (impostorMaterial.match(/atlasColor = sampleFrame\(/g) ?? []).length === 2,
  "Far cards must sample the atlas exactly once per fragment (compact and blended paths).",
);
assert(
  impostorMaterial.includes("lights: true") &&
    impostorMaterial.includes("vGrassIrradiance") &&
    impostorMaterial.includes("GRASS_LIGHT_MIX_GLSL") &&
    nearMaterial.includes("GRASS_LIGHT_MIX_GLSL"),
  "Far cards must use the same stylized lighting mix as real blades.",
);
assert(
  impostorMaterial.includes("uBiomeShade") &&
    impostorMaterial.includes("artTipColorStrength") &&
    impostorMaterial.includes("artRootDarkening"),
  "Impostors must receive runtime tip and root palette controls.",
);
// A gust crest lifts blade colour towards the tip. Both representations must do
// it with the same constant and the same formula, or the 44-64 m crossfade
// pulses as one brightens and the other does not. The constant is shared, and
// neither shader may reintroduce a literal for it.
assert(
  nearMaterial.includes("GRASS_GUST_TIP_BOOST") &&
    impostorMaterial.includes("GRASS_GUST_TIP_BOOST") &&
    /uGrassGustTipBoost \* (grassProgress|vGrassProgress)/.test(nearMaterial) &&
    impostorMaterial.includes("uGustTipBoost * bladeData.r"),
  "Gust tip lift must use the shared constant and the same formula at every LOD.",
);
// The biome row indexes bounded uniform arrays; out-of-range indexing is
// undefined behaviour in GLSL ES 3.0, so both shaders must clamp it.
assert(
  nearMaterial.includes("clamp(biome, 0.0, float(GRASS_MAX_BIOMES - 1))") &&
    impostorMaterial.includes("clamp(vBiome, 0.0,"),
  "Biome palette rows must be clamped before indexing the uniform arrays.",
);
assert(
  worldGrassSystem.includes("await this.nearField.initialize(grassConfig)") &&
    worldGrassSystem.includes("this.nearField.update(") &&
    worldGrassSystem.includes("this.cameraPosition"),
  "The dense single-blade fields must remain wired into WorldGrassSystem.",
);
assert(
  !thirdPersonController.includes("WorldNearGrassField"),
  "ThirdPersonController must not create a duplicate near-grass field.",
);
assert(
  nearField.includes("grassUltraNearDensityMultiplier - 1") &&
    nearField.includes("world-grass-ultra-near-blades") &&
    nearField.includes("world-grass-ultra-near-base-detail") &&
    nearField.includes("detailMode: 1") &&
    nearField.includes("detailMode: 2"),
  "Ultra-near must retain segmented base blades plus the independent density layer.",
);
assert(
  singleBladeFactory.includes("segments === 1") &&
    singleBladeFactory.includes(
      "options.receiveShadows && this.profile.shadows",
    ) &&
    nearMaterial.includes("grassProgress > 0.001"),
  "Distant single blades must use the low-cost geometry and guarded vertex path.",
);
assert(
  nearMaterial.includes("bool grassKeepBlade") &&
    nearMaterial.includes("if (!grassKeepBlade)") &&
    nearMaterial.includes("if (grassKeepBlade && grassProgress > 0.001)"),
  "Rejected blades must skip wind and become degenerate before rasterization.",
);
assert(
  worldGrassSystem.includes("mesh.receiveShadow = false") &&
    controller.includes("farthestDistance > farEntryStart") &&
    !worldGrassSystem.includes("world-grass-near-"),
  "Mid/far rendering must avoid distant shadow and pre-transition overdraw.",
);
assert(
  worldGrassSystem.includes("private resolveArtFarDistance") &&
    worldGrassSystem.includes("direction.farDistance") &&
    worldGrassSystem.includes("streamFadeEnd - direction.transitionDistance") &&
    worldGrassSystem.includes(
      "lodConfig.farMaxDistance = this.resolveArtFarDistance(direction)",
    ),
  "Preset far distances must remain capped by the active streamed radius.",
);
assert(
  worldGrassSystem.includes("private getFarImpostorOffsetRadius") &&
    worldGrassSystem.includes(
      "impostorRadius + this.getFarImpostorOffsetRadius()",
    ),
  "Far-impostor bounds must include layered-card offsets.",
);
assert(
  !/impostorAtlasFactory\.create\(\s*variants\.bladeVariants\[index\],\s*grassConfig\.geometry,\s*grassConfig\.material,/s.test(
    worldGrassSystem,
  ),
  "The palette-neutral atlas factory must not depend on display material colors.",
);

const ultraNearDistance = readYamlNumber(
  worldConfig,
  "grassUltraNearDistance",
);
const ultraNearMultiplier = readYamlNumber(
  worldConfig,
  "grassUltraNearDensityMultiplier",
);
const interactionStrength = readYamlNumber(
  worldConfig,
  "grassInteractionStrength",
);
const midBladeFraction = readYamlNumber(
  worldConfig,
  "grassMidBladeFraction",
);
const patchDensityDesktop = readYamlNumber(
  worldConfig,
  "grassBladesPerSquareMeterDesktop",
);
const patchDensityCompact = readYamlNumber(
  worldConfig,
  "grassBladesPerSquareMeterCompact",
);
const nearDensityDesktop = readYamlNumber(
  worldConfig,
  "grassNearBladesPerSquareMeterDesktop",
);
const nearDensityCompact = readYamlNumber(
  worldConfig,
  "grassNearBladesPerSquareMeterCompact",
);
assert(
  ultraNearDistance === 4,
  "Ultra-near grass must remain four metres.",
);
assert(
  ultraNearMultiplier === 2,
  "Ultra-near grass must double density.",
);
assert(
  interactionStrength >= 0.9,
  "Character grass interaction must retain the stronger response.",
);
assert(
  midBladeFraction === 1,
  "Mid grass must retain every source blade.",
);
assert(
  patchDensityDesktop === 72 && nearDensityDesktop === 72,
  "Desktop near and mid density must match at 72 blades/m².",
);
assert(
  patchDensityCompact === 48 && nearDensityCompact === 48,
  "Compact near and mid density must match at 48 blades/m².",
);
assert(
  farCardsPerPatch === 2,
  "Far grass must retain exactly two layered impostors.",
);
const midImpostorUnderfill = Number(
  lodTuning.match(/GRASS_MID_IMPOSTOR_UNDERFILL\s*=\s*([0-9.]+)/)?.[1],
);
assert(
  midImpostorUnderfill === 0,
  "Full-density mid blades must not carry a redundant far-card underfill layer.",
);

const expectedMidDistances = {
  "lush-hero": 54,
  "natural-meadow": 48,
  "golden-hour": 46,
  "cool-highland": 58,
  "dense-emerald": 62,
  "zelda-field": 56,
  windswept: 52,
};
function smoothstep(value, start, end) {
  const amount = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return amount * amount * (3 - 2 * amount);
}
for (const [key, direction] of Object.entries(artDirections)) {
  assert(
    direction.midDistance === expectedMidDistances[key],
    `${direction.label} mid distance must retain its density/performance balance.`,
  );
  const nearFadeEnd = direction.nearDistance + direction.transitionDistance;
  const farEntryStart = direction.midDistance - direction.transitionDistance;
  assert(
    farEntryStart >= nearFadeEnd && farEntryStart - nearFadeEnd <= 16,
    `${direction.label} must avoid both a triple-LOD overlap and a long mid-only band.`,
  );
  for (let sample = 0; sample <= 1000; sample += 1) {
    const distance =
      direction.nearDistance -
      direction.transitionDistance +
      (sample / 1000) * direction.transitionDistance * 2;
    const nearCoverage =
      1 -
      smoothstep(
        distance,
        direction.nearDistance - direction.transitionDistance,
        nearFadeEnd,
      );
    const farEntry = smoothstep(
      distance,
      farEntryStart,
      direction.midDistance + direction.transitionDistance,
    );
    const midCoverage = Math.max(
      0,
      1 - Math.max(nearCoverage, farEntry),
    );
    assert(
      farEntry === 0,
      `${direction.label} far cards entered during the near/mid handoff.`,
    );
    for (const density of [nearDensityDesktop, nearDensityCompact]) {
      const blendedDensity =
        density * nearCoverage + density * midCoverage;
      assert(
        Math.abs(blendedDensity / density - 1) <= 1e-12,
        `${direction.label} density gap at near/mid sample ${sample}.`,
      );
    }
  }
}

const nearBoundsRadius =
  runtimeMathModule.calculateGrassSingleBladeRootBoundsRadius({
    bladeHeight: bladeHeightMax,
    bladeWidth: readYamlNumber(grassConfig, "bladeWidthMax"),
    bladeLean: readYamlNumber(grassConfig, "bladeLeanMax"),
    maximumHorizontalScale: 1.2,
    maximumVerticalScale: 1.22,
    windStrength,
    flutterStrength: readYamlNumber(grassConfig, "flutterStrength"),
    maximumArtWindScale: 2,
    maximumInstanceWindScale: 1.16,
    maximumWindStiffness: 1.12,
    maximumInteractionStrength: Math.max(
      readYamlNumber(worldConfig, "grassInteractionStrength"),
      readYamlNumber(worldConfig, "grassLandingPulseStrength"),
    ),
    interactionVerticalScale: 0.2,
    safetyMargin: 0.08,
  });
assert(
  nearBoundsRadius > bladeHeightMax &&
    singleBladeFactory.includes(
      "calculateGrassSingleBladeRootBoundsRadius",
    ) &&
    singleBladeFactory.includes(
      ".expandByScalar(this.calculateBoundsPadding())",
    ),
  "Near bounds must include configured blade, wind, and interaction displacement.",
);

// Wind bends a blade by rotating it about its root. Translating the vertices
// instead makes a bent blade longer than a straight one, which is both the
// rubbery look the trail bend was rewritten to avoid and a silent overrun of
// the reserved bounds, since those charge a rotation.
assert(
  !nearMaterial.includes("transformed += grassLocalWind") &&
    nearMaterial.includes("transformed.y *= grassWindCos"),
  "Wind must rotate blades about the root, not translate their vertices.",
);
// The gust front is an envelope in [1 - depth, 1]. Adding a second bend term
// instead would push past the wind displacement the bounds reserve.
assert(
  nearMaterial.includes(
    "mix(1.0 - uGrassGustFrontDepth, 1.0, grassGustNoise)",
  ) && nearMaterial.includes("uGrassWindLodScale * grassGustEnvelope"),
  "Gust fronts must scale the configured bend down, never add to it.",
);
assert(
  nearMaterial.includes("grassWidthAxis * (grassSide * uGrassBladeCurvature)"),
  "Blades must carry a normal curved across their width.",
);
// Both single-blade tiles and mid patches must apply the macro field, at the
// same world position and from the same functions, or the terms would show up
// as a brightness step at an LOD handoff instead of as field variation.
for (const [label, source] of [
  ["near tiles", singleBladeFactory],
  ["mid patches", worldGrassSystem],
]) {
  assert(
    source.includes("resolveGrassCanopyAo(") &&
      source.includes("sampleGrassMacroDryness(x, z)") &&
      source.includes("GRASS_MACRO_DRYNESS_STRENGTH"),
    `Grass ${label} must resolve canopy occlusion and macro dryness from the shared field.`,
  );
}
assert(
  singleBladeFactory.includes("CLUMP_MAX_CELL_OFFSET * Math.max(cellWidth") &&
    singleBladeFactory.includes("Math.atan2(offsetX, offsetZ)"),
  "Tufted blades must fan from their clump and stay inside the cached height lattice.",
);

const baseBlend = Number(
  tuning.match(/IMPOSTOR_BASE_COLOR_BLEND\s*=\s*([0-9.]+)/)?.[1],
);
const defaultTipStrength = artDirections["lush-hero"]?.tipColorStrength;
assert(
  Number.isFinite(baseBlend) && baseBlend <= 0.1,
  "Far cards must not flatten the shared blade palette.",
);
assert(
  Number.isFinite(defaultTipStrength) && defaultTipStrength <= 0.4,
  "The default root-to-tip color change is too strong.",
);

for (let sample = 0; sample <= 1000; sample += 1) {
  const farEntry = sample / 1000;
  for (const fieldCoverage of [0.02, 0.25, 0.5, 0.75, 1]) {
    const midCoverage = (1 - farEntry) * fieldCoverage;
    const farCoverage = farEntry * fieldCoverage;
    assert(
      Math.abs(midCoverage + farCoverage - fieldCoverage) <= 1e-12,
      `Coverage gap at transition sample ${sample}.`,
    );
  }
}

console.log(
  "[lod-continuity] Runtime preset, palette, bounds, coverage, and ownership checks passed.",
);
