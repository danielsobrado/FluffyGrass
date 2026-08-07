import { RuntimeConfigLoader } from "./runtime/RuntimeConfigLoader";
import { UiVisibilityController } from "./runtime/UiVisibilityController";
import { resolveRuntimeProfile } from "./runtime/ViewportProfile";
import { APP_VERSION, BUILD_LABEL } from "./version";

interface RunnableApp {
  start(): void;
  dispose(): void;
}

interface Disposable {
  dispose(): void;
}

const WORLD_NAME = "Drusniel World";
const THIRD_PERSON_HELP =
  "Desktop: click, mouse orbit, WASD, Shift run, Space jump, wheel zoom, F reset · Mobile: left drag move, right drag look, JUMP/RUN/⌂ · Add ?control=fly for flight";
const FLY_HELP =
  "Desktop: click, mouse look, WASD, Q/E, Shift, wheel, F reset · Mobile: left drag move, right drag look, ⌂ dense field, ▲/▼ altitude";

async function bootstrap(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
  if (!canvas) {
    throw new Error("Canvas element #canvas was not found.");
  }

  const runtimeConfig = await new RuntimeConfigLoader().load(
    `./config/runtime.yaml?v=${encodeURIComponent(APP_VERSION)}`,
  );
  const profile = resolveRuntimeProfile(runtimeConfig);
  document.documentElement.dataset.viewport = profile.compact
    ? "compact"
    : "desktop";

  const params = new URLSearchParams(window.location.search);
  const sceneMode = params.get("scene") === "island" ? "island" : "world";
  const flyMode =
    sceneMode === "world" &&
    (params.get("control") === "fly" || params.get("view") === "aerial");
  document.body.dataset.scene = sceneMode;
  document.body.dataset.control = flyMode ? "fly" : "third-person";
  const uiController = new UiVisibilityController();
  uiController.initialize();

  const versionElement = document.querySelector<HTMLElement>("#build-version");
  const titleElement = document.querySelector<HTMLElement>(".app-title strong");
  const sceneElement = document.querySelector<HTMLElement>("#scene-mode");
  const helpElement = document.querySelector<HTMLElement>("#control-help");
  if (versionElement) {
    versionElement.textContent = `${APP_VERSION} · ${BUILD_LABEL}`;
  }
  if (titleElement) {
    titleElement.textContent = `${WORLD_NAME} · ${APP_VERSION}`;
  }
  if (sceneElement) {
    sceneElement.textContent = resolveSceneLabel(sceneMode, flyMode);
  }
  if (helpElement && sceneMode === "world") {
    helpElement.textContent = flyMode ? FLY_HELP : THIRD_PERSON_HELP;
  }
  document.title =
    sceneMode === "world"
      ? `${WORLD_NAME} · ${APP_VERSION}`
      : `${WORLD_NAME} · Island Regression`;

  let app: RunnableApp;
  let diagnostics: Disposable | undefined;
  if (sceneMode === "island") {
    const { IslandApp } = await import("./app/IslandApp");
    const island = new IslandApp(canvas, profile);
    await island.initialize();
    app = island;
  } else {
    const { WorldApp } = await import("./app/WorldApp");
    const world = await WorldApp.create(canvas, profile);
    const diagnosticsEnabled =
      params.get("diagnostics") === "1" ||
      params.get("gpuTiming") === "1" ||
      params.get("stats") === "1";
    if (diagnosticsEnabled) {
      const { WorldDiagnosticsController } = await import(
        "./runtime/WorldDiagnosticsController"
      );
      diagnostics = WorldDiagnosticsController.attach(world, {
        gpuTiming: params.get("gpuTiming") === "1",
        statsPanelEnabled: params.get("stats") === "1",
      });
    }
    app = world;
  }

  app.start();
  window.addEventListener(
    "pagehide",
    (event) => {
      if (event.persisted) {
        return;
      }
      diagnostics?.dispose();
      uiController.dispose();
      app.dispose();
    },
    { once: true },
  );
}

function resolveSceneLabel(
  sceneMode: "island" | "world",
  flyMode: boolean,
): string {
  if (sceneMode === "island") {
    return `${WORLD_NAME} · Island Regression`;
  }
  return flyMode
    ? `${WORLD_NAME} · Continuous Grass LOD · Flight`
    : `${WORLD_NAME} · 2× Ultra-Near Grass · Drow Jump Rig`;
}

bootstrap().catch((error) => {
  console.error(`[${WORLD_NAME}] Startup failed.`, error);
  const output = document.createElement("pre");
  output.className = "startup-error";
  output.setAttribute("role", "alert");
  const message = error instanceof Error ? error.message : String(error);
  output.textContent = `Unable to start ${WORLD_NAME}. ${message}`;
  document.body.appendChild(output);
});
