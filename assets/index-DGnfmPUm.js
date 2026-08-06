import { attachWorldDiagnostics } from "./runtime-diagnostics-v1.js";

const APP_VERSION = "v0.9.5";
const BUILD_LABEL = "2026-08-06";
const WORLD_NAME = "Drusniel World";
const THIRD_PERSON_HELP =
  "Desktop: click, mouse orbit, WASD, Shift run, Space jump, wheel zoom, F reset · Mobile: left drag move, right drag look, JUMP/RUN/⌂ · Add ?control=fly for flight";
const FLY_HELP =
  "Desktop: click, mouse look, WASD, Q/E, Shift, wheel, F reset · Mobile: left drag move, right drag look, ⌂ dense field, ▲/▼ altitude";
const STORAGE_KEY = "drusniel-world-hud-minimized";
const PRELOAD_REL = "modulepreload";
const preloaded = Object.create(null);

class FlatConfig {
  constructor(name, values) {
    this.name = name;
    this.values = values;
    this.unreadKeys = new Set(values.keys());
  }

  static parse(source, name) {
    const values = new Map();
    for (const [index, rawLine] of source.split(/\r?\n/).entries()) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }
      const separator = line.indexOf(":");
      if (separator <= 0) {
        throw new Error(`Invalid ${name} config at line ${index + 1}.`);
      }
      const key = line.slice(0, separator).trim();
      const rawValue = line.slice(separator + 1).trim();
      if (!rawValue) {
        throw new Error(`Missing value for ${key} at line ${index + 1}.`);
      }
      if (values.has(key)) {
        throw new Error(
          `Duplicate ${name} config value ${key} at line ${index + 1}.`,
        );
      }
      const value = FlatConfig.stripQuotes(rawValue, name, index + 1);
      if (!value) {
        throw new Error(`Missing value for ${key} at line ${index + 1}.`);
      }
      values.set(key, value);
    }
    return new FlatConfig(name, values);
  }

  read(key) {
    const value = this.values.get(key);
    if (value === undefined) {
      throw new Error(`Missing ${this.name} config value: ${key}.`);
    }
    this.unreadKeys.delete(key);
    return value;
  }

  assertFullyConsumed() {
    if (this.unreadKeys.size === 0) {
      return;
    }
    const keys = [...this.unreadKeys].sort();
    throw new Error(
      `Unknown ${this.name} config value${keys.length === 1 ? "" : "s"}: ${keys.join(", ")}.`,
    );
  }

  static stripQuotes(value, name, line) {
    const first = value[0];
    const last = value[value.length - 1];
    const firstQuoted = first === '"' || first === "'";
    const lastQuoted = last === '"' || last === "'";
    if (firstQuoted !== lastQuoted || (firstQuoted && first !== last)) {
      throw new Error(`Invalid quoted ${name} config value at line ${line}.`);
    }
    return firstQuoted ? value.slice(1, -1) : value;
  }
}

function preload(loader, dependencies = [], baseUrl = import.meta.url) {
  const promises = dependencies.map((dependency) => {
    const href = new URL(dependency, baseUrl).href;
    if (preloaded[href]) {
      return undefined;
    }
    preloaded[href] = true;

    const isCss = href.endsWith(".css");
    const selector = isCss ? '[rel="stylesheet"]' : "";
    if (document.querySelector(`link[href="${href}"]${selector}`)) {
      return undefined;
    }

    const link = document.createElement("link");
    link.rel = isCss ? "stylesheet" : PRELOAD_REL;
    if (!isCss) {
      link.as = "script";
    }
    link.crossOrigin = "";
    link.href = href;
    document.head.appendChild(link);

    if (!isCss) {
      return undefined;
    }
    return new Promise((resolve, reject) => {
      link.addEventListener("load", resolve, { once: true });
      link.addEventListener(
        "error",
        () => reject(new Error(`Unable to preload CSS for ${href}`)),
        { once: true },
      );
    });
  });

  return Promise.all(promises).then(() => loader()).catch((error) => {
    const event = new Event("vite:preloadError", { cancelable: true });
    event.payload = error;
    window.dispatchEvent(event);
    if (!event.defaultPrevented) {
      throw error;
    }
  });
}

class RuntimeConfigLoader {
  async load(url = "./config/runtime.yaml") {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Unable to load runtime config from ${url}: HTTP ${response.status}`,
      );
    }
    return this.parse(await response.text());
  }

  parse(source) {
    const config = FlatConfig.parse(source, "runtime");
    const result = Object.freeze({
      compactMaxWidth: this.readPositiveNumber(config, "compactMaxWidth"),
      desktop: Object.freeze(this.readTier(config, "desktop")),
      compact: Object.freeze(this.readTier(config, "compact")),
    });
    config.assertFullyConsumed();
    return result;
  }

  readTier(config, prefix) {
    return {
      cameraFov: this.readRange(config, `${prefix}CameraFov`, 30, 90),
      cameraMargin: this.readRange(config, `${prefix}CameraMargin`, 1, 3),
      cameraElevation: this.readRange(
        config,
        `${prefix}CameraElevation`,
        0.1,
        3,
      ),
      maxPixelRatio: this.readRange(
        config,
        `${prefix}MaxPixelRatio`,
        0.5,
        3,
      ),
      autoRotate: this.readBoolean(config, `${prefix}AutoRotate`),
      shadows: this.readBoolean(config, `${prefix}Shadows`),
      shadowMapSize: this.readPowerOfTwo(config, `${prefix}ShadowMapSize`),
      showGui: this.readBoolean(config, `${prefix}ShowGui`),
      showDecorativeText: this.readBoolean(
        config,
        `${prefix}ShowDecorativeText`,
      ),
    };
  }

  readBoolean(config, key) {
    const value = config.read(key).toLowerCase();
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    throw new Error(`Runtime config value ${key} must be true or false.`);
  }

  readPowerOfTwo(config, key) {
    const value = this.readPositiveInteger(config, key);
    if ((value & (value - 1)) !== 0) {
      throw new Error(`Runtime config value ${key} must be a power of two.`);
    }
    return value;
  }

  readPositiveInteger(config, key) {
    const value = this.readPositiveNumber(config, key);
    if (!Number.isInteger(value)) {
      throw new Error(`Runtime config value ${key} must be an integer.`);
    }
    return value;
  }

  readPositiveNumber(config, key) {
    const value = this.readNumber(config, key);
    if (value <= 0) {
      throw new Error(`Runtime config value ${key} must be positive.`);
    }
    return value;
  }

  readRange(config, key, minimum, maximum) {
    const value = this.readNumber(config, key);
    if (value < minimum || value > maximum) {
      throw new Error(
        `Runtime config value ${key} must be between ${minimum} and ${maximum}.`,
      );
    }
    return value;
  }

  readNumber(config, key) {
    const value = Number(config.read(key));
    if (!Number.isFinite(value)) {
      throw new Error(`Runtime config value ${key} must be a number.`);
    }
    return value;
  }
}

function resolveRuntimeProfile(config) {
  const compact =
    window.innerWidth <= config.compactMaxWidth ||
    window.matchMedia("(pointer: coarse)").matches ||
    (navigator.maxTouchPoints > 0 &&
      /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent));
  const tier = compact ? config.compact : config.desktop;
  return Object.freeze({ ...tier, compact });
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

async function bootstrap() {
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
    attachWorldDiagnostics(world, {
      gpuTiming: params.get("gpuTiming") === "1",
      statsPanelEnabled: params.get("stats") === "1",
    });
    app = world;
  }

  globalThis.__drusnielApp = app;
  app.start();
}

function resolveSceneLabel(sceneMode, flyMode) {
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

export { APP_VERSION as A, FlatConfig as F, preload as _ };
