import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[island-lifecycle] ${message}`);
  }
}

const island = read("src/app/IslandApp.ts");
const development = read("src/dev/GrassDevelopmentController.ts");
const qaRunner = read("src/qa/GrassQaRunner.ts");

assert(
  island.includes("createIslandRuntimeResources(") &&
    island.includes("disposeIslandRuntimeResources(resources)") &&
    island.includes('disposeSafely("Renderer construction"') &&
    island.includes('disposeSafely("Orbit controls construction"') &&
    island.includes('disposeSafely("Grass system construction"') &&
    island.includes('disposeSafely("Terrain material construction"'),
  "Island renderer, controls, grass, and terrain material must roll back together when construction fails.",
);

assert(
  island.includes("private developmentController?: GrassDevelopmentController") &&
    island.includes("this.developmentController = controller") &&
    island.includes('disposeSafely("Development tools"') &&
    island.indexOf('disposeSafely("Development tools"') <
      island.indexOf('disposeSafely("Orbit controls"'),
  "Island development tools must be owned by the app and disposed before their controls/renderer dependencies.",
);

assert(
  /catch \(error\) \{[\s\S]*?this\.scene\.remove\(root\);[\s\S]*?this\.islandRoot = undefined;[\s\S]*?disposeObjectGeometry\(root\)/.test(
    island,
  ),
  "Failed island initialization must remove and dispose unpublished model geometry.",
);

assert(
  /private render = \(\): void => \{[\s\S]*?try \{[\s\S]*?this\.renderer\.render\(this\.scene, this\.camera\);[\s\S]*?\} catch \(error\) \{[\s\S]*?this\.running = false;[\s\S]*?this\.clock\.stop\(\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?this\.frameHandle = requestAnimationFrame\(this\.render\);/.test(
    island,
  ),
  "Island rendering must schedule the next RAF only after a successful frame so one fault cannot become a permanent exception loop.",
);

assert(
  island.includes("let materialAttached = false") &&
    island.includes("let originalsDisposed = false") &&
    island.includes("if (!originalsDisposed) {") &&
    island.includes("if (!materialAttached) {") &&
    island.includes("disposeObjectMaterials(root)"),
  "Decorative model rollback must release both replaced originals and unpublished replacement material without depending on repeated disposal.",
);

assert(
  development.includes("private readonly abortController = new AbortController()") &&
    development.includes("this.abortController.abort()") &&
    development.includes("this.abortController.signal") &&
    development.includes("this.bakePanel?.remove()") &&
    development.includes("delete windowWithResults.__FLUFFY_GRASS_IMPOSTOR_BAKE__") &&
    development.includes("delete windowWithResults.__FLUFFY_GRASS_QA__") &&
    /const result = await baker\.bake\([\s\S]*?if \(this\.disposed\) \{[\s\S]*?return;[\s\S]*?\}[\s\S]*?createDownloadLinks/.test(
      development,
    ),
  "Island development tools must abort QA, clean published debug state, and suppress late bake publication after disposal.",
);

assert(
  /async run\([\s\S]*?signal\?: AbortSignal[\s\S]*?\): Promise<GrassQaReport>/.test(
    qaRunner,
  ) &&
    qaRunner.includes("sampleFrames(options.warmupSeconds, false, signal)") &&
    /sampleFrames\([\s\S]*?options\.sampleSeconds,[\s\S]*?true,[\s\S]*?signal/.test(
      qaRunner,
    ) &&
    qaRunner.includes("throwIfAborted(signal)") &&
    qaRunner.includes("if (!signal?.aborted) {") &&
    qaRunner.includes('new DOMException("Grass QA aborted.", "AbortError")'),
  "Island grass QA must honor cancellation before rendering/publishing and avoid updating disposed controls.",
);

console.log(
  "[island-lifecycle] Transactional island construction, frame containment, and disposable development QA verified.",
);
