import * as THREE from "three";
import Stats from "stats-gl";
import { FlyController } from "../controls/FlyController";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";
import { APP_VERSION } from "../version";
import { DenseSpawnLocator } from "../world/DenseSpawnLocator";
import { TerrainField } from "../world/TerrainField";
import { TerrainStreamer } from "../world/TerrainStreamer";
import type { WorldConfig } from "../world/WorldConfig";
import { WorldConfigLoader } from "../world/WorldConfigLoader";
import { WorldGrassSystem } from "../world/WorldGrassSystem";

const HUD_UPDATE_INTERVAL_SECONDS = 0.25;
const ERROR_MESSAGE_MAX_LENGTH = 180;
const FRAME_WATCHDOG_INTERVAL_MS = 500;
const FRAME_STALL_THRESHOLD_MS = 1500;

type FrameSubsystem = "controls" | "terrain" | "grass" | "renderer" | "hud";

export class WorldApp {
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly clock = new THREE.Clock();
  private readonly stats?: Stats;
  private readonly field: TerrainField;
  private readonly terrain: TerrainStreamer;
  private readonly grass: WorldGrassSystem;
  private readonly controls: FlyController;
  private readonly hud = document.querySelector<HTMLElement>("#world-stats");
  private readonly pixelRatio: number;
  private frameHandle = 0;
  private watchdogHandle = 0;
  private frameCount = 0;
  private lastFrameTimestamp = performance.now();
  private hudElapsed = 0;
  private running = false;
  private terrainEnabled = true;
  private grassEnabled = true;
  private rendererEnabled = true;
  private runtimeError?: string;
  private grassInitializationError?: string;

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly profile: RuntimeProfile,
    private readonly config: WorldConfig,
  ) {
    this.camera = new THREE.PerspectiveCamera(
      profile.cameraFov,
      window.innerWidth / window.innerHeight,
      0.1,
      5000,
    );
    this.scene.background = new THREE.Color("#bfd4df");
    this.scene.fog = new THREE.FogExp2(
      "#bfd4df",
      profile.compact ? 0.0016 : 0.00105,
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !profile.compact,
      alpha: false,
      precision: "highp",
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = profile.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.pixelRatio = Math.min(window.devicePixelRatio, profile.maxPixelRatio);
    this.applyRendererSize();
    if (!profile.compact) {
      this.stats = new Stats({ minimal: true });
    }

    this.field = new TerrainField(config);
    const spawn = new DenseSpawnLocator(this.field, config).find();
    if (new URLSearchParams(window.location.search).get("view") === "aerial") {
      spawn.position.y += 48;
      spawn.pitch = THREE.MathUtils.degToRad(-34);
    }
    this.terrain = new TerrainStreamer(
      this.scene,
      this.field,
      config,
      profile.compact,
      profile.shadows,
    );
    this.grass = new WorldGrassSystem(
      this.scene,
      this.field,
      config,
      profile,
    );
    this.controls = new FlyController(
      this.camera,
      canvas,
      config,
      profile,
      spawn,
    );

    console.info(
      `[FluffyGrass] Dense ground spawn X ${spawn.position.x.toFixed(0)} / Z ${spawn.position.z.toFixed(0)} / suitability ${spawn.suitability.toFixed(3)}.`,
    );
    this.addLights();
    this.setupStats();
    this.bindRuntimeEvents();
  }

  static async create(
    canvas: HTMLCanvasElement,
    profile: RuntimeProfile,
  ): Promise<WorldApp> {
    const config = await new WorldConfigLoader().load(
      `./config/world.yaml?v=${encodeURIComponent(APP_VERSION)}`,
    );
    const app = new WorldApp(canvas, profile, config);
    void app.initializeGrass();
    return app;
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.clock.start();
    this.lastFrameTimestamp = performance.now();
    this.frameHandle = requestAnimationFrame(this.render);
    this.watchdogHandle = window.setInterval(
      this.checkFrameHeartbeat,
      FRAME_WATCHDOG_INTERVAL_MS,
    );
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.frameHandle);
    window.clearInterval(this.watchdogHandle);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored);
    this.controls.dispose();
    this.terrain.dispose();
    this.grass.dispose();
    this.renderer.dispose();
    this.stats?.dom.remove();
  }

  private bindRuntimeEvents(): void {
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
    this.canvas.addEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.addEventListener("webglcontextrestored", this.handleContextRestored);
  }

  private async initializeGrass(): Promise<void> {
    try {
      await this.grass.initialize();
    } catch (error) {
      console.error("[FluffyGrass] Grass initialization failed.", error);
      this.grassInitializationError = this.formatError(error);
      this.grassEnabled = false;
    }
  }

  private render = (): void => {
    if (!this.running) {
      return;
    }

    // Schedule first so an exception in any subsystem cannot terminate animation.
    this.frameHandle = requestAnimationFrame(this.render);
    this.lastFrameTimestamp = performance.now();
    this.frameCount += 1;
    const deltaSeconds = this.clock.getDelta();

    this.runFrameSubsystem("controls", () => {
      this.controls.update(deltaSeconds);
      this.constrainCamera();
    });

    if (this.terrainEnabled) {
      this.runFrameSubsystem("terrain", () => {
        this.terrain.update(this.camera.position);
      });
    }

    if (this.grassEnabled) {
      this.runFrameSubsystem("grass", () => {
        this.grass.update(deltaSeconds, this.camera);
      });
    }

    if (this.rendererEnabled) {
      this.runFrameSubsystem("renderer", () => {
        this.renderer.render(this.scene, this.camera);
        this.stats?.update();
      });
    }

    this.runFrameSubsystem("hud", () => {
      this.updateHud(deltaSeconds);
    });
  };

  private readonly checkFrameHeartbeat = (): void => {
    if (!this.running || document.hidden) {
      return;
    }
    const stalledForMs = performance.now() - this.lastFrameTimestamp;
    if (stalledForMs < FRAME_STALL_THRESHOLD_MS) {
      return;
    }

    this.runtimeError = `watchdog: restarted after ${Math.round(stalledForMs)} ms`;
    this.lastFrameTimestamp = performance.now();
    this.clock.stop();
    this.clock.start();
    this.frameHandle = requestAnimationFrame(this.render);
  };

  private runFrameSubsystem(
    subsystem: FrameSubsystem,
    callback: () => void,
  ): void {
    try {
      callback();
    } catch (error) {
      this.recordRuntimeError(subsystem, error);
      if (subsystem === "terrain") {
        this.terrainEnabled = false;
      } else if (subsystem === "grass") {
        this.grassEnabled = false;
      } else if (subsystem === "renderer") {
        this.rendererEnabled = false;
      }
    }
  }

  private recordRuntimeError(subsystem: FrameSubsystem, error: unknown): void {
    const message = `${subsystem}: ${this.formatError(error)}`;
    if (this.runtimeError === message) {
      return;
    }
    this.runtimeError = message;
    console.error(`[FluffyGrass] ${subsystem} frame failure.`, error);
  }

  private formatError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return message.replace(/\s+/g, " ").slice(0, ERROR_MESSAGE_MAX_LENGTH);
  }

  private applyRendererSize(): void {
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private addLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xdceeff, 0x3f3a2d, 1.45));
    const sun = new THREE.DirectionalLight(0xfff3d7, 2.4);
    sun.position.set(350, 500, 220);
    sun.castShadow = this.profile.shadows;
    sun.shadow.camera.left = -180;
    sun.shadow.camera.right = 180;
    sun.shadow.camera.top = 180;
    sun.shadow.camera.bottom = -180;
    sun.shadow.camera.far = 1000;
    sun.shadow.mapSize.set(
      this.profile.shadowMapSize,
      this.profile.shadowMapSize,
    );
    this.scene.add(sun);
  }

  private setupStats(): void {
    if (!this.stats) {
      return;
    }
    this.stats.init(this.renderer);
    this.stats.dom.style.display = "none";
    document.body.appendChild(this.stats.dom);
  }

  private constrainCamera(): void {
    const halfWorld = this.config.worldSize * 0.5 - 2;
    this.camera.position.x = THREE.MathUtils.clamp(
      this.camera.position.x,
      -halfWorld,
      halfWorld,
    );
    this.camera.position.z = THREE.MathUtils.clamp(
      this.camera.position.z,
      -halfWorld,
      halfWorld,
    );
    const terrainHeight = this.field.sampleHeight(
      this.camera.position.x,
      this.camera.position.z,
    );
    this.camera.position.y = THREE.MathUtils.clamp(
      this.camera.position.y,
      terrainHeight + this.config.spawnEyeHeight,
      this.config.mountainHeight + 520,
    );
  }

  private updateHud(deltaSeconds: number): void {
    if (!this.hud) {
      return;
    }
    this.hudElapsed += deltaSeconds;
    if (this.hudElapsed < HUD_UPDATE_INTERVAL_SECONDS) {
      return;
    }
    this.hudElapsed = 0;
    const terrain = this.terrain.getDiagnostics();
    const grass = this.grass.getDiagnostics();
    const render = this.renderer.info.render;
    const groundHeight = this.field.sampleHeight(
      this.camera.position.x,
      this.camera.position.z,
    );
    const grassStatus = this.grassInitializationError
      ? `Grass error: ${this.grassInitializationError}`
      : grass.status;
    this.hud.textContent = [
      `Frame ${this.frameCount.toLocaleString()} · ${this.runtimeError ? "DEGRADED" : "running"}`,
      `XYZ ${this.camera.position.x.toFixed(0)} / ${this.camera.position.y.toFixed(0)} / ${this.camera.position.z.toFixed(0)}`,
      `AGL ${(this.camera.position.y - groundHeight).toFixed(1)} m · Speed ${this.controls.getSpeed().toFixed(0)} m/s`,
      `Input ${this.controls.getInputDiagnostics()}`,
      `Terrain ${terrain.activeChunks} +${terrain.queuedChunks}`,
      grass.ready
        ? `Grass ${grass.clumps.toLocaleString()} patches · ${grass.blades.toLocaleString()} blades · ${grass.impostors.toLocaleString()} impostors`
        : grassStatus,
      `Draws ${render.calls} · Triangles ${render.triangles.toLocaleString()} · Scale ${this.pixelRatio.toFixed(2)} · Build ${grass.lastBuildMs.toFixed(1)} ms`,
      this.runtimeError ? `Error ${this.runtimeError}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  private readonly handleWindowError = (event: ErrorEvent): void => {
    this.runtimeError = `window: ${this.formatError(event.error ?? event.message)}`;
  };

  private readonly handleUnhandledRejection = (
    event: PromiseRejectionEvent,
  ): void => {
    this.runtimeError = `promise: ${this.formatError(event.reason)}`;
  };

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.rendererEnabled = false;
    this.runtimeError = "renderer: WebGL context lost";
  };

  private readonly handleContextRestored = (): void => {
    this.rendererEnabled = true;
    this.runtimeError = undefined;
  };

  private readonly handleResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.applyRendererSize();
  };
}
