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

async function importTypeScriptModule(relativePath) {
  const fileName = resolve(REPOSITORY_ROOT, relativePath);
  const result = ts.transpileModule(readFileSync(fileName, "utf8"), {
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
const impostorMaterial = read(
  "src/world/grass/WorldGrassImpostorMaterial.ts",
);
const impostorAtlasFactory = read(
  "src/world/grass/WorldGrassImpostorAtlasFactory.ts",
);
const worldGrassSystem = read("src/world/WorldGrassSystem.ts");
const nearField = read("src/world/grass/WorldNearGrassField.ts");
const worldConfig = read("public/config/world.yaml");
const grassConfig = read("public/config/grass.yaml");

const artDirectionModule = await importTypeScriptModule(
  "src/grass/GrassArtDirection.ts",
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
assert(
  windStrength * maximumWindScale * 0.22 <=
    lodTuningModule.GRASS_IMPOSTOR_MAX_WIND_DISPLACEMENT,
  "Configured far-impostor wind exceeds the reserved bounds displacement.",
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
    impostorAtlasFactory.includes("encodeDataColor") &&
    impostorAtlasFactory.includes("radius: boundsRadius") &&
    !impostorAtlasFactory.includes("new THREE.Color(material.baseColor)"),
  "The far atlas must store palette-neutral data and expose conservative bounds.",
);
assert(
  impostorMaterial.includes("float bladeProgress = clamp(atlasData.r") &&
    impostorMaterial.includes("float bladeShade = clamp(atlasData.g") &&
    impostorMaterial.includes("float bladeDryness = clamp(atlasData.b") &&
    !impostorMaterial.includes("smoothstep(0.08, 0.92, vUv.y)"),
  "The far shader must reconstruct color from per-blade atlas masks.",
);

assert(
  !controller.includes("farAerialVisible"),
  "CPU visibility must not suppress far meshes by aerial angle.",
);
assert(
  /patch\.midMesh\.userData\.grassDistanceFade\s*=\s*1\s*;/.test(
    controller,
  ),
  "World mid coverage must not be applied twice.",
);
assert(
  nearMaterial.includes("grassPaletteBlend") &&
    nearMaterial.includes("vGrassCameraDistance"),
  "Real-blade colors must converge toward the far palette by distance.",
);
assert(
  worldGrassSystem.includes("await this.nearField.initialize(grassConfig)") &&
    worldGrassSystem.includes(
      "this.nearField.update(deltaSeconds, this.cameraPosition)",
    ),
  "The dense single-blade fields must remain wired into WorldGrassSystem.",
);
assert(
  !thirdPersonController.includes("WorldNearGrassField"),
  "ThirdPersonController must not create a duplicate near-grass field.",
);
assert(
  nearField.includes("grassUltraNearDensityMultiplier - 1") &&
    nearField.includes("world-grass-ultra-near-blades"),
  "The ultra-near layer must retain independent single-blade instances.",
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
  farCardsPerPatch >= 2,
  "Far grass must retain layered impostors.",
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
