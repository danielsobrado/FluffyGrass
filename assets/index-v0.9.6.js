import { applyGrassV096Patch } from "./grass-v0.9.6-patch.js";
import { attachWorldDiagnostics } from "./runtime-diagnostics-v0.9.6.js";
import {
  FlatConfig,
  RuntimeConfigLoader,
  preload,
  resolveRuntimeProfile,
} from "./index-v0.9.6-runtime.js";

const APP_VERSION = "v0.9.6";
const BUILD_LABEL = "2026-08-06";
const WORLD_NAME = "Drusniel World";
const STORAGE_KEY = "drusniel-world-hud-minimized";
const THIRD_PERSON_HELP =
  "Desktop: click, mouse orbit, WASD, Shift run, Space jump, wheel zoom, F reset · Mobile: left drag move, right drag look, JUMP/RUN/⌂ · Add ?control=fly for flight";
const FLY_HELP =
  "Desktop: click, mouse look, WASD, Q/E, Shift, wheel, F reset · Mobile: left drag move, right drag look, ⌂ dense field, ▲/▼ altitude";
const CONFIG_PATTERN = /\/config\/(?:runtime|world|grass)\.yaml$/;

function installVersionedConfigFetch() {
  const nativeFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (input, init) => {
    if (typeof input === "string" || input instanceof URL) {
      const url = new URL(String(input), window.location.href);
      if (url.origin === window.location.origin && CONFIG_PATTERN.test(url.pathname)) {
        url.searchParams.set("v", APP_VERSION);
        return nativeFetch(url, init);
      }
    }
    return nativeFetch(input, init);
  };
}

function initializeUiVisibility() {
  const button = document.querySelector("#ui-toggle");
  if (!button) {
    return;
  }

  let minimized = false;
  try {
    minimized = localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    minimized = false;
  }

  const apply = () => {
    document.documentElement.dataset.uiMinimized = minimized
      ? "true"
      : "false";
    button.textContent = minimized ? "HUD" : "−";
    button.setAttribute("aria-pressed", String(minimized));
    button.setAttribute(
      "aria-label",
      minimized ? "Restore interface" : "Minimize interface",
    );
    button.title = minimized ? "Restore interface" : "Minimize interface";
  };

  apply();
  button.addEventListener("click", () => {
    minimized = !minimized;
    apply();
    try {
      localStorage.setItem(STORAGE_KEY, minimized ? "1" : "0");
    } catch {
      // Persistence is optional.
    }
  });
}

function resolveSceneLabel(sceneMode, flyMode) {
  if (sceneMode === "island") {
    return `${WORLD_NAME} · Island Regression`;
  }
  return flyMode
    ? `${WORLD_NAME} · Continuous Grass LOD · Flight`
    : `${WORLD_NAME} · 2× Ultra-Near Grass · Drow Jump Rig`;
}

async function bootstrap() {
  installVersionedConfigFetch();

  const canvas = document.querySelector("#canvas");
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
  initializeUiVisibility();

  const versionElement = document.querySelector("#build-version");
  const titleElement = document.querySelector(".app-title strong");
  const sceneElement = document.querySelector("#scene-mode");
  const helpElement = document.querySelector("#control-help");
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

  let app;
  if (sceneMode === "island") {
    const { IslandApp } = await import("./IslandApp-Wxcqby58.js");
    const island = new IslandApp(canvas, profile);
    await island.initialize();
    app = island;
  } else {
    const { WorldApp } = await import("./WorldApp-CzuUuJgA.js");
    const world = await WorldApp.create(canvas, profile);
    await applyGrassV096Patch(world);
    attachWorldDiagnostics(world);
    app = world;
  }

  globalThis.__drusnielApp = app;
  app.start();
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

export { APP_VERSION as A, FlatConfig as F, preload as _ };
