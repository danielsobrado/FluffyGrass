import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[world-visibility] ${message}`);
  }
}

const system = read("src/render/visibility/WorldVisibilitySystem.ts");
const terrainOcclusion = read("src/render/visibility/TerrainOcclusionCuller.ts");
const loader = read("src/render/visibility/WorldVisibilityConfigLoader.ts");
const tree = read("src/world/scenic/WorldTreeSystem.ts");
const stones = read("src/world/stones/WorldStoneSystem.ts");
const stoneBuilder = read("src/world/stones/StoneRenderBatchBuilder.ts");
const app = read("src/app/WorldApp.ts");
const viewport = read("src/app/WorldViewportController.ts");
const config = read("public/config/visibility.yaml");

assert(
  system.includes("this.frustum.intersectsSphere(sphere)") &&
    system.includes("isBelowProjectedSize") &&
    system.includes("this.terrainOcclusion.isOccluded(") &&
    terrainOcclusion.includes("terrainOcclusionRayCount") &&
    terrainOcclusion.includes("this.staticOcclusion.clear()") &&
    terrainOcclusion.includes("occlusionCacheHits"),
  "Shared visibility must combine frustum, projected-size, conservative terrain LOS, and movement-gated static caching.",
);
assert(
  tree.includes("private readonly cells = new Map<string, TreeRenderCell>()") &&
    tree.includes("frustumCulled = true") &&
    !tree.includes("frustumCulled = false") &&
    tree.includes("visibility.testStaticSphere(") &&
    tree.includes("terrainOcclusion: !shadowRelevant") &&
    tree.includes("renderVisible = cameraVisible || shadowRelevant"),
  "Trees must be spatially batched and preserve nearby shadow casters when camera visibility rejects them.",
);
assert(
  stoneBuilder.includes("readonly maxScale: number") &&
    stoneBuilder.includes("job.maxScale = Math.max(job.maxScale, instance.scale)") &&
    stones.includes("result.maxScale * this.visibilityConfig.stoneFeatureRadiusScale") &&
    stones.includes("visibility.testStaticSphere(") &&
    stones.includes("terrainOcclusion: !shadowRelevant") &&
    stones.includes("batch.mesh.castShadow = shadowRelevant"),
  "Stone batches must expose a feature-size bound and use the shared visibility pipeline without dropping nearby shadow casters.",
);
assert(
  loader.includes('fetchConfigText(url, "world visibility config")') &&
    config.includes("screenSpaceEnabled: 1") &&
    config.includes("terrainOcclusionEnabled: 0") &&
    config.includes("occlusionReuseDistance:") &&
    config.includes("shadowDistance:"),
  "Visibility tuning must be externalized to the validated YAML configuration.",
);
assert(
  app.includes("loadWorldAppConfiguration()") &&
    app.includes("new WorldVisibilitySystem(this.field, visibilityConfig)") &&
    app.includes("this.visibility.update(this.camera)") &&
    app.includes("stoneBuildDeadline,\n      this.visibility") &&
    viewport.includes("this.visibility?.setViewportHeight(bufferHeight)"),
  "The composition root must refresh one shared camera visibility state and provide its viewport scale to every consumer.",
);

console.log(
  "[world-visibility] Shared frustum, screen-space, terrain LOS, spatial tree cells, shadow preservation, and stone integration verified.",
);
