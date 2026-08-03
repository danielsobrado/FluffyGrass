import { RuntimeConfigLoader } from "./runtime/RuntimeConfigLoader";
import { resolveRuntimeProfile } from "./runtime/ViewportProfile";
import { APP_VERSION, BUILD_LABEL } from "./version";

interface RunnableApp {
  start(): void;
}

const WORLD_NAME = "Drusniel World";
const THIRD_PERSON_HELP =
  "Desktop: click, mouse orbit, WASD, Shift run, wheel zoom, F reset · Mobile: left drag move, right drag look, RUN/⌂ · Add ?control=fly for flight";
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

  const versionElement = document.querySelector<HTMLElement>("#build-version");
  const sceneElement = document.querySelector<HTMLElement>("#scene-mode");
  const helpElement = document.querySelector<HTMLElement>("#control-help");
  if (versionElement) {
    versionElement.textContent = `${APP_VERSION} · ${BUILD_LABEL}`;
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
  if (sceneMode === "island") {
    const { IslandApp } = await import("./app/IslandApp");
    const island = new IslandApp(canvas, profile);
    await island.initialize();
    app = island;
  } else {
    const { WorldApp } = await import("./app/WorldApp");
    app = await WorldApp.create(canvas, profile);
  }

  app.start();
}

function resolveSceneLabel(
  sceneMode: "island" | "world",
  flyMode: boolean,
): string {
  if (sceneMode === "island") {
    return `${WORLD_NAME} · Island Regression`;
  }
  return flyMode
    ? `${WORLD_NAME} · Hybrid Far LOD · Flight`
    : `${WORLD_NAME} · Drow Adventurer`;
}

bootstrap().catch((error) => {
  console.error(`[${WORLD_NAME}] Startup failed.`, error);
  const output = document.createElement("pre");
  output.className = "startup-error";
  output.textContent =
    error instanceof Error ? error.stack ?? error.message : String(error);
  document.body.appendChild(output);
});
