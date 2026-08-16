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
  "Click to look · WASD move · Shift run · Space jump · F reset · M map";
const FLY_HELP =
  "Click to look · WASD move · Q/E altitude · Shift boost · F reset";

async function bootstrap(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
  if (!canvas) {
    throw new Error("Canvas element #canvas was not found.");
  }

  const params = new URLSearchParams(window.location.search);
  const runtimeConfig = await new RuntimeConfigLoader().load(
    `./config/runtime.yaml?v=${encodeURIComponent(APP_VERSION)}`,
  );
  const profileParam = params.get("profile");
  const profile = resolveRuntimeProfile(runtimeConfig, {
    compact:
      profileParam === "compact"
        ? true
        : profileParam === "desktop"
          ? false
          : undefined,
  });
  document.documentElement.dataset.viewport = profile.compact
    ? "compact"
    : "desktop";

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

  let app: RunnableApp | undefined;
  let diagnostics: Disposable | undefined;
  let actorProof: Disposable | undefined;
  let animationHud: Disposable | undefined;
  let visualMatrix: Disposable | undefined;
  try {
    if (sceneMode === "island") {
      const { IslandApp } = await import("./app/IslandApp");
      const island = new IslandApp(canvas, profile);
      app = island;
      await island.initialize();
    } else {
      const { WorldApp } = await import("./app/WorldApp");
      const world = await WorldApp.create(canvas, profile);
      app = world;
      const character = world.getThirdPersonCharacter();
      if (character) {
        const { AnimationBlendingHud } = await import(
          "./runtime/AnimationBlendingHud"
        );
        const hud = new AnimationBlendingHud();
        hud.attachCharacter(character);
        const detachObserver = world.addFrameObserver((delta) => {
          hud.update(delta);
        });
        animationHud = {
          dispose: () => {
            detachObserver();
            hud.dispose();
          },
        };
      }
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
      if (params.get("qa") === "visual-matrix") {
        const { WorldVisualMatrixRunner } = await import(
          "./qa/WorldVisualMatrixRunner"
        );
        const runner = new WorldVisualMatrixRunner(world.attachVisualMatrix());
        visualMatrix = runner;
        void runner.start();
      }
      if (params.get("actorProof") === "1") {
        const { ActorExtensibilityProof } = await import(
          "./dev/ActorExtensibilityProof"
        );
        actorProof = ActorExtensibilityProof.attach(world);
      }
    }

    app.start();
    let disposed = false;
    window.addEventListener("pagehide", (event) => {
      if (event.persisted || disposed) {
        return;
      }
      disposed = true;
      disposeRuntimeSafely(
        app,
        uiController,
        diagnostics,
        actorProof,
        animationHud,
        visualMatrix,
      );
    });
  } catch (error) {
    disposeRuntimeSafely(
      app,
      uiController,
      diagnostics,
      actorProof,
      animationHud,
      visualMatrix,
    );
    throw error;
  }
}

function disposeRuntimeSafely(
  app: RunnableApp | undefined,
  uiController: UiVisibilityController,
  diagnostics: Disposable | undefined,
  actorProof: Disposable | undefined,
  animationHud: Disposable | undefined,
  visualMatrix: Disposable | undefined,
): void {
  disposeSafely("Animation HUD", () => animationHud?.dispose());
  disposeSafely("Actor proof", () => actorProof?.dispose());
  disposeSafely("Visual matrix", () => visualMatrix?.dispose());
  disposeSafely("Diagnostics", () => diagnostics?.dispose());
  disposeSafely("UI controller", () => uiController.dispose());
  disposeSafely("Application", () => app?.dispose());
}

function disposeSafely(label: string, dispose: () => void): void {
  try {
    dispose();
  } catch (error) {
    console.warn(`[${WORLD_NAME}] ${label} cleanup failed.`, error);
  }
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