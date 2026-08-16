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
const qaDownloads = read("src/qa/GrassQaDownloads.ts");
const impostorBaker = read("src/grass/impostors/OctahedralImpostorBaker.ts");

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
    development.includes("private bakePanel?: ImpostorDownloadPanel") &&
    development.includes("private qaRunner?: GrassQaRunner") &&
    development.includes("this.abortController.abort()") &&
    development.includes("this.qaRunner?.dispose()") &&
    development.includes("this.bakePanel?.dispose()") &&
    development.includes("this.abortController.signal") &&
    development.includes("delete windowWithResults.__FLUFFY_GRASS_IMPOSTOR_BAKE__") &&
    development.includes("delete windowWithResults.__FLUFFY_GRASS_QA__") &&
    /const result = await baker\.bake\([\s\S]*?if \(this\.disposed\) \{[\s\S]*?return;[\s\S]*?\}[\s\S]*?createDownloadLinks/.test(
      development,
    ) &&
    /finally \{[\s\S]*?if \(!this\.disposed\) \{[\s\S]*?setLodBakeOverride\(false\)/.test(
      development,
    ),
  "Island development tools must own/abort QA, dispose bake downloads, clean published debug state, suppress late publication, and avoid touching disposed dependencies.",
);

assert(
  /async run\([\s\S]*?signal\?: AbortSignal[\s\S]*?\): Promise<GrassQaReport>/.test(
    qaRunner,
  ) &&
    qaRunner.includes("sampleFrames(options.warmupSeconds, false, signal)") &&
    /sampleFrames\([\s\S]*?options\.sampleSeconds,[\s\S]*?true,[\s\S]*?signal/.test(
      qaRunner,
    ) &&
    qaRunner.includes("this.throwIfUnavailable(signal)") &&
    qaRunner.includes("this.downloads.dispose()") &&
    qaRunner.includes("!signal?.aborted && !this.disposed") &&
    qaRunner.includes('new DOMException("Grass QA aborted.", "AbortError")'),
  "Island grass QA must honor cancellation/disposal before rendering or publishing and own its download resources.",
);

assert(
  qaDownloads.includes("private readonly objectUrls = new Set<string>()") &&
    qaDownloads.includes("private readonly timeoutHandles = new Set<number>()") &&
    qaDownloads.includes("URL.revokeObjectURL(objectUrl)") &&
    qaDownloads.includes("window.clearTimeout(handle)") &&
    qaDownloads.includes("this.panel?.remove()") &&
    qaDownloads.includes("signal?: AbortSignal") &&
    qaDownloads.includes("this.disposed || signal?.aborted"),
  "Grass QA downloads must revoke blob URLs, cancel scheduled clicks, remove their panel, and reject captures after teardown.",
);

assert(
  impostorBaker.includes("export interface ImpostorDownloadPanel") &&
    impostorBaker.includes("const objectUrls = new Set<string>()") &&
    impostorBaker.includes("const timeoutHandles = new Set<number>()") &&
    impostorBaker.includes("URL.revokeObjectURL(objectUrl)") &&
    impostorBaker.includes("window.clearTimeout(handle)") &&
    /dispose: \(\): void => \{[\s\S]*?panel\.remove\(\);/.test(impostorBaker),
  "Impostor bake download panels must own and revoke every blob URL and delayed revocation timer.",
);

console.log(
  "[island-lifecycle] Transactional island construction, frame containment, and disposable QA/impostor download ownership verified.",
);
