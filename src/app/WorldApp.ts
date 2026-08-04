import * as THREE from "three";
import type Stats from "stats-gl";
import {
  GRASS_ART_DIRECTIONS,
  resolveGrassArtDirectionKey,
  type GrassArtDirection,
} from "../grass/GrassArtDirection";
import { FlyWorldController } from "../controls/FlyWorldController";
import { ThirdPersonController } from "../controls/ThirdPersonController";
import type { WorldController } from "../controls/WorldController";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";
import { APP_VERSION } from "../version";
import { DenseSpawnLocator } from "../world/DenseSpawnLocator";
import { TerrainField } from "../world/TerrainField";
import { TerrainStreamer } from "../world/TerrainStreamer";
import type { WorldConfig } from "../world/WorldConfig";
import { WorldConfigLoader } from "../world/WorldConfigLoader";
import { WorldGrassSystem } from "../world/WorldGrassSystem";
import { GrassArtMenu } from "./GrassArtMenu";

const HUD_UPDATE_INTERVAL_SECONDS = 0.25;
const FPS_SAMPLE_INTERVAL_SECONDS = 1;
const ERROR_MESSAGE_MAX_LENGTH = 180;
const FRAME_WATCHDOG_INTERVAL_MS = 500;
const FRAME_STALL_THRESHOLD_MS = 1500;
const CONTEXT_LOST_ERROR = "renderer: WebGL context lost";

type FrameSubsystem = "controls" | "terrain" | "grass" | "renderer" | "hud";

export class WorldApp {
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly clock = new THREE.Clock();
  private stats?: Stats;
  private artMenu?: GrassArtMenu;
  private readonly field: TerrainField;
  private readonly terrain: TerrainStreamer;
  private readonly grass: WorldGrassSystem;
  private readonly controls: WorldController;
  private readonly hud = document.querySelector<HTMLElement>("#world-stats");
  private readonly pixelRatio: number;
  private frameHandle = 0;
  private watchdogHandle = 0;
  private frameCount = 0;
  private fpsSampleFrames = 0;
  private fpsSampleElapsed = 0;
  private averageFps = 0;
  private lastFrameTimestamp = performance.now();
  private hudElapsed = 0;
  private sampledGroundX = Number.NaN;
  private sampledGroundZ = Number.NaN;
  private sampledGroundHeight = 0;
  private running = false;
  private controlsEnabled = true;
  private terrainEnabled = true;
  private grassEnabled = true;
  private rendererEnabled = true;
  private hudEnabled = true;
  private grassInitializing = true;
  private runtimeError?: string;
  private runtimeErrorBeforeContextLoss?: string;
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

    this.field = new TerrainField(config);
    const spawn = new DenseSpawnLocator(this.field, config).find();
    const params = new URLSearchParams(window.location.search);
    const useFlyControls =
      params.get("control") === "fly" || params.get("view") === "aerial";
    if (params.get("view") === "aerial") {
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
    const artKey = resolveGrassArtDirectionKey(params.get("grassArt"));
    this.applyGrassArtDirection(GRASS_ART_DIRECTIONS[artKey]);
    if (profile.showGui) {
      this.artMenu = new GrassArtMenu(artKey, this.applyGrassArtDirection);
    }
    this.controls = useFlyControls
      ? new FlyWorldController(
          this.camera,
          canvas,
          config,
          profile,
          spawn,
        )
      : new ThirdPersonController(
          this.scene,
          this.camera,
          canvas,
          this.field,
          config,
          profile,
          spawn,
        );

    console.info(
      `[Drusniel World] Dense ground spawn X ${spawn.position.x.toFixed(0)} / Z ${spawn.position.z.toFixed(0)} / suitability ${spawn.suitability.toFixed(3)} / controls ${this.controls.getMode()}.`,
    );
    this.addLights();
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
    if (
      !profile.compact &&
      new URLSearchParams(window.location.search).get("stats") === "1"
    ) {
      await app.setupStats();
    }
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
    this.clock.stop();
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
    this.artMenu?.dispose();
  }

  private bindRuntimeEvents(): void {
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
    this.canvas.addEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.addEventListener("webglcontextrestored", this.handleContextRestored);
  }

  private readonly applyGrassArtDirection = (
    direction: GrassArtDirection,
  ): void => {
    this.terrain.setGrassArtDirection(direction);
    this.grass.setArtDirection(direction);
  };

  private async initializeGrass(): Promise<void> {
    try {
      await this.grass.initialize();
    } catch (error) {
      console.error("[Drusniel World] Grass initialization failed.", error);
      this.grassInitializationError = this.formatError(error);
      this.grassEnabled = false;
    } finally {
      this.grassInitializing = false;
      this.lastFrameTimestamp = performance.now();
    }
  }

  private render = (): void => {
    if (!this.running) {
      return;
    }

    this.frameHandle = requestAnimationFrame(this.render);
    this.lastFrameTimestamp = performance.now();
    this.frameCount += 1;
    const deltaSeconds = this.clock.getDelta();
    this.updateAverageFps(deltaSeconds);

    if (this.controlsEnabled) {
      this.runFrameSubsystem("controls", this.updateControls, deltaSeconds);
    }

    if (this.terrainEnabled) {
      this.runFrameSubsystem("terrain", this.updateTerrain, deltaSeconds);
    }

    if (this.grassEnabled) {
      this.runFrameSubsystem("grass", this.updateGrass, deltaSeconds);
    }

    if (this.rendererEnabled) {
      this.runFrameSubsystem("renderer", this.renderScene, deltaSeconds);
    }

    if (this.hudEnabled) {
      this.runFrameSubsystem("hud", this.updateHud, deltaSeconds);
    }
  };

  private updateAverageFps(deltaSeconds: number): void {
    this.fpsSampleFrames += 1;
    this.fpsSampleElapsed += deltaSeconds;
    if (this.fpsSampleElapsed < FPS_SAMPLE_INTERVAL_SECONDS) {
      if (this.averageFps === 0 && this.fpsSampleElapsed > 0) {
        this.averageFps = this.fpsSampleFrames / this.fpsSampleElapsed;
      }
      return;
    }
    this.averageFps = this.fpsSampleFrames / this.fpsSampleElapsed;
    this.fpsSampleFrames = 0;
    this.fpsSampleElapsed = 0;
  }

  private readonly updateControls = (deltaSeconds: number): void => {
    this.controls.update(deltaSeconds);
    if (this.controls.getMode() === "fly") {
      this.constrainCamera();
    }
  };

  private readonly updateTerrain = (): void => {
    this.terrain.update(this.controls.getStreamingPosition());
  };

  private readonly updateGrass = (deltaSeconds: number): void => {
    this.grass.update(deltaSeconds, this.camera);
  };

  private readonly renderScene = (): void => {
    this.renderer.render(this.scene, this.camera);
    this.stats?.update();
  };

  private readonly checkFrameHeartbeat = (): void => {
    if (!this.running || document.hidden) {
      return;
    }
    if (this.grassInitializing) {
      this.lastFrameTimestamp = performance.now();
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
    cancelAnimationFrame(this.frameHandle);
    this.frameHandle = requestAnimationFrame(this.render);
  };

  private runFrameSubsystem(
    subsystem: FrameSubsystem,
    callback: (deltaSeconds: number) => void,
    deltaSeconds: number,
  ): void {
    try {
      callback(deltaSeconds);
    } catch (error) {
      this.recordRuntimeError(subsystem, error);
      if (subsystem === "controls") {
        this.controlsEnabled = false;
      } else if (subsystem === "terrain") {
        this.terrainEnabled = false;
      } else if (subsystem === "grass") {
        this.grassEnabled = false;
      } else if (subsystem === "renderer") {
        this.rendererEnabled = false;
      } else {
        this.hudEnabled = false;
      }
    }
  }

  private recordRuntimeError(subsystem: FrameSubsystem, error: unknown): void {
    const message = `${subsystem}: ${this.formatError(error)}`;
    if (this.runtimeError === message) {
      return;
    }
    this.runtimeError = message;
    console.error(`[Drusniel World] ${subsystem} frame failure.`, error);
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

  private async setupStats(): Promise<void> {
    const { default: StatsPanel } = await import("stats-gl");
    this.stats = new StatsPanel({ minimal: true });
    this.stats.init(this.renderer);
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
    const terrainHeight = this.sampleGroundHeight(this.camera.position);
    this.camera.position.y = THREE.MathUtils.clamp(
      this.camera.position.y,
      terrainHeight + this.config.spawnEyeHeight,
      this.config.mountainHeight + 520,
    );
  }

  private readonly updateHud = (deltaSeconds: number): void => {
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
    const focus = this.controls.getStreamingPosition();
    const groundHeight = this.sampleGroundHeight(focus);
    const grassStatus = this.grassInitializationError
      ? `Grass error: ${this.grassInitializationError}`
      : grass.status;
    this.hud.textContent = [
      `Frame ${this.frameCount.toLocaleString()} · ${this.averageFps.toFixed(1)} FPS · ${this.runtimeError ? "DEGRADED" : "running"} · ${this.controls.getMode()}`,
      `Focus ${focus.x.toFixed(0)} / ${focus.y.toFixed(0)} / ${focus.z.toFixed(0)}`,
      `Camera ${this.camera.position.x.toFixed(0)} / ${this.camera.position.y.toFixed(0)} / ${this.camera.position.z.toFixed(0)}`,
      `AGL ${(focus.y - groundHeight).toFixed(1)} m · Speed ${this.controls.getSpeed().toFixed(1)} m/s`,
      `Input ${this.controls.getInputDiagnostics()}`,
      `Terrain ${terrain.activeChunks} +${terrain.queuedChunks} · Build ${terrain.lastBuildMs.toFixed(1)} / peak ${terrain.maxBuildMs.toFixed(1)} ms`,
      grass.ready
        ? `Grass ${grass.clumps.toLocaleString()} patches · ${grass.blades.toLocaleString()} blades · ${grass.impostors.toLocaleString()} impostors`
        : grassStatus,
      `Draws ${render.calls} · Triangles ${render.triangles.toLocaleString()} · Scale ${this.pixelRatio.toFixed(2)} · Build ${grass.lastBuildMs.toFixed(1)} / peak ${grass.maxBuildMs.toFixed(1)} ms`,
      this.runtimeError ? `Error ${this.runtimeError}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  };

  private sampleGroundHeight(position: THREE.Vector3): number {
    const { x, z } = position;
    if (x !== this.sampledGroundX || z !== this.sampledGroundZ) {
      this.sampledGroundX = x;
      this.sampledGroundZ = z;
      this.sampledGroundHeight = this.field.sampleHeight(x, z);
    }
    return this.sampledGroundHeight;
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
    this.runtimeErrorBeforeContextLoss = this.runtimeError;
    this.runtimeError = CONTEXT_LOST_ERROR;
  };

  private readonly handleContextRestored = (): void => {
    this.rendererEnabled = true;
    if (this.runtimeError === CONTEXT_LOST_ERROR) {
      this.runtimeError = this.runtimeErrorBeforeContextLoss;
    }
    this.runtimeErrorBeforeContextLoss = undefined;
  };

  private readonly handleResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.applyRendererSize();
  };
}
