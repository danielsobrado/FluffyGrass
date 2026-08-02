import { IslandApp } from "./app/IslandApp";
import { WorldApp } from "./app/WorldApp";
import { RuntimeConfigLoader } from "./runtime/RuntimeConfigLoader";
import { resolveRuntimeProfile } from "./runtime/ViewportProfile";
import { APP_VERSION, BUILD_LABEL } from "./version";

interface RunnableApp {
  start(): void;
}

async function bootstrap(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
  if (!canvas) {
    throw new Error("Canvas element #canvas was not found.");
  }

  const runtimeConfig = await new RuntimeConfigLoader().load();
  const profile = resolveRuntimeProfile(runtimeConfig);
  document.documentElement.dataset.viewport = profile.compact
    ? "compact"
    : "desktop";

  const params = new URLSearchParams(window.location.search);
  const sceneMode = params.get("scene") === "island" ? "island" : "world";
  document.body.dataset.scene = sceneMode;
  const versionElement = document.querySelector<HTMLElement>("#build-version");
  const sceneElement = document.querySelector<HTMLElement>("#scene-mode");
  if (versionElement) {
    versionElement.textContent = `${APP_VERSION} · ${BUILD_LABEL}`;
  }
  if (sceneElement) {
    sceneElement.textContent =
      sceneMode === "world"
        ? "Original Coverage · Large World LOD"
        : "Island Regression";
  }
  document.title = `FluffyGrass ${APP_VERSION} · ${sceneMode}`;

  let app: RunnableApp;
  if (sceneMode === "island") {
    const island = new IslandApp(canvas, profile);
    await island.initialize();
    app = island;
  } else {
    app = await WorldApp.create(canvas, profile);
  }

  app.start();
}

bootstrap().catch((error) => {
  console.error("[FluffyGrass] Startup failed.", error);
  const output = document.createElement("pre");
  output.className = "startup-error";
  output.textContent =
    error instanceof Error ? error.stack ?? error.message : String(error);
  document.body.appendChild(output);
});
