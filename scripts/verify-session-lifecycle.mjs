import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:url";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[session-lifecycle] ${message}`);
  }
}

const main = read("src/main.ts");
const world = read("src/app/WorldApp.ts");
const statsPanel = read("src/app/WorldStatsPanel.ts");
const visualMatrix = read("src/qa/WorldVisualMatrixRunner.ts");
const metrics = read("src/qa/GrassQaMetrics.ts");
const diagnostics = read("src/runtime/WorldDiagnosticsController.ts");
const deerAssets = read("src/creatures/deer/DeerAssets.ts");
const villagerAssets = read("src/character/npc/VillagerAssets.ts");

assert(
  main.includes("let visualMatrix: Disposable | undefined") &&
    main.includes("visualMatrix = runner") &&
    main.includes("disposeRuntimeSafely(") &&
    main.includes('disposeSafely("Application", () => app?.dispose())') &&
    main.includes('disposeSafely("UI controller", () => uiController.dispose())'),
  "Bootstrap must own optional visual QA and isolate cleanup so one failing owner cannot block the application teardown.",
);

assert(
  world.includes("private readonly reveal: WorldRevealController;") &&
    !world.includes("private readonly reveal = new WorldRevealController()") &&
    world.includes('disposeConstructionSafely("Scenic layer", () => scenic?.dispose())') &&
    world.includes('disposeConstructionSafely("Minimap", () => minimap?.dispose())') &&
    world.includes('disposeConstructionSafely("World controls", () => controls?.dispose())') &&
    world.includes('disposeConstructionSafely("Grass trail field", () => grassTrailField.dispose())') &&
    world.includes('disposeConstructionSafely("Terrain streamer", () => terrain?.dispose())') &&
    world.includes('disposeConstructionSafely("Environment", () => environment?.dispose())') &&
    world.includes('disposeConstructionSafely("Renderer", () => this.renderer.dispose())'),
  "World construction must delay the reveal owner and roll back every successfully-created runtime owner when a later constructor step fails.",
);

assert(
  statsPanel.includes("let stats: Stats | undefined") &&
    /catch \(error\) \{[\s\S]*?stats\?\.dispose\(\);[\s\S]*?Optional stats panel unavailable/.test(
      statsPanel,
    ),
  "Stats panel attachment must release a partially initialized profiler before degrading.",
);

assert(
  visualMatrix.includes("private readonly abortController = new AbortController()") &&
    visualMatrix.includes("this.abortController.abort()") &&
    visualMatrix.includes("delete windowWithQa.__FLUFFY_WORLD_VISUAL_QA__") &&
    visualMatrix.includes("this.abortController.signal") &&
    visualMatrix.includes("private disposed = false"),
  "Visual matrix QA must be disposable, abort pending samples, and release its published window API.",
);

assert(
  metrics.includes("signal?: AbortSignal") &&
    metrics.includes("cancelAnimationFrame(frameHandle)") &&
    metrics.includes('signal?.addEventListener("abort", handleAbort, { once: true })') &&
    metrics.includes('signal?.removeEventListener("abort", handleAbort)') &&
    metrics.includes('document.removeEventListener("visibilitychange", handleVisibilityChange)'),
  "QA frame sampling must cancel its RAF and listeners immediately when its owner is disposed.",
);

assert(
  diagnostics.includes("let probe: GrassWorkloadProbe | undefined") &&
    diagnostics.includes("let gpuTimer: GpuFrameTimer | undefined") &&
    diagnostics.includes("let hud: WorldDiagnosticsHud | undefined") &&
    /catch \(error\) \{[\s\S]*?disposeSafely\(hud, "Diagnostics HUD"\);[\s\S]*?disposeSafely\(gpuTimer, "GPU frame timer"\);[\s\S]*?disposeSafely\(probe, "Grass workload probe"\)/.test(
      diagnostics,
    ) &&
    /dispose\(\): void \{[\s\S]*?this\.restoreRenderer\(\);[\s\S]*?disposeSafely\(this\.probe[\s\S]*?disposeSafely\(this\.hud[\s\S]*?disposeSafely\(this\.gpuTimer/.test(
      diagnostics,
    ),
  "Optional diagnostics must roll back partial attachment and isolate teardown failures.",
);

for (const [name, source] of [
  ["Deer assets", deerAssets],
  ["Villager assets", villagerAssets],
]) {
  assert(
    /try \{[\s\S]*?applyActorEnvironmentResponse\(material\);[\s\S]*?return material;[\s\S]*?\} catch \(error\) \{[\s\S]*?material\.dispose\(\);[\s\S]*?throw error;/.test(
      source,
    ) &&
      /try \{[\s\S]*?slots\.set\(slot, mergeActorParts\(list\)\);[\s\S]*?\} finally \{[\s\S]*?part\.geometry\.dispose\(\)/.test(
        source,
      ) &&
      /catch \(error\) \{[\s\S]*?disposeGeometries\(slots\.values\(\)\);[\s\S]*?slots\.clear\(\);[\s\S]*?throw error;/.test(
        source,
      ),
    `${name} must release failed materials, primitive scaffolding, and partially merged geometry.`,
  );
}

console.log(
  "[session-lifecycle] Bootstrap, world construction, diagnostics, QA, stats, and actor asset ownership verified.",
);
