import * as THREE from "three";
import type Stats from "stats-gl";
import {
  GRASS_ART_DIRECTIONS,
  resolveGrassArtDirectionKey,
  type GrassArtDirection,
} from "../grass/GrassArtDirection";
import { grassTrailField } from "../grass/interaction/GrassTrailField";
import { FlyWorldController } from "../controls/FlyWorldController";
import { ThirdPersonController } from "../controls/ThirdPersonController";
import type { WorldController } from "../controls/WorldController";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";
import {
  resolvePixelRatio,
  resolveViewportSize,
} from "../runtime/ViewportSizing";
import { APP_VERSION } from "../version";
import { DenseSpawnLocator } from "../world/DenseSpawnLocator";
import { StoneField } from "../world/stones/StoneField";
import { WorldStoneSystem } from "../world/stones/WorldStoneSystem";
import { TerrainField } from "../world/TerrainField";
import { TerrainStreamer } from "../world/TerrainStreamer";
import type { WorldConfig } from "../world/WorldConfig";
import { WorldConfigLoader } from "../world/WorldConfigLoader";
import { WorldGrassSystem } from "../world/WorldGrassSystem";
import { GrassArtMenu } from "./GrassArtMenu";
import { WorldEnvironmentController } from "./WorldEnvironmentController";
import { WorldFrameMetrics, type WorldFrameSubsystem } from "./WorldFrameMetrics";
import { WorldRuntimeGuard } from "./WorldRuntimeGuard";
import { WorldStatusHud } from "./WorldStatusHud";
import {
  WORLD_COMPACT_GRASS_BUILD_RESERVE_MS,
  WORLD_COMPACT_STONE_BUILD_RESERVE_MS,
  WORLD_COMPACT_STREAMING_BUILD_BUDGET_MS,
  WORLD_DESKTOP_GRASS_BUILD_RESERVE_MS,
  WORLD_DESKTOP_STONE_BUILD_RESERVE_MS,
  WORLD_DESKTOP_STREAMING_BUILD_BUDGET_MS,
  WORLD_FRAME_STALL_THRESHOLD_MS,
  WORLD_FRAME_WATCHDOG_INTERVAL_MS,
  WORLD_MAX_RUNTIME_DELTA_SECONDS,
} from "./WorldAppTuning";

export class WorldApp {
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly clock = new THREE.Clock();
  private stats?: Stats;
  private artMenu?: GrassArtMenu;
  private readonly field: TerrainField;
  private readonly terrain: TerrainStreamer;
  private readonly stones: WorldStoneSystem;
  private readonly grass: WorldGrassSystem;
  private readonly controls: WorldController;
  private readonly environment: WorldEnvironmentController;
  private readonly frameMetrics = new WorldFrameMetrics();
  private readonly runtimeGuard: WorldRuntimeGuard;
  private readonly statusHud = new WorldStatusHud(document.querySelector<HTMLElement>("#world-stats"));
  private readonly drawingBufferSize = new THREE.Vector2();
  private pixelRatio = 1;
  private readonly flyMode: boolean;
  private frameHandle = 0;
  private watchdogHandle = 0;
  private streamingBuildDeadline = Number.POSITIVE_INFINITY;
  private lastFrameTimestamp = performance.now();
  private sampledGroundX = Number.NaN;
  private sampledGroundZ = Number.NaN;
  private sampledGroundHeight = 0;
  private running = false;
  private disposed = false;
  private controlsEnabled = true;
  private terrainEnabled = true;
  private stonesEnabled = true;
  private grassEnabled = true;
  private rendererEnabled = true;
  private hudEnabled = true;
  private grassInitializing = true;
  private grassInitializationError?: string;

  private constructor(
    canvas: HTMLCanvasElement,
    private readonly profile: RuntimeProfile,
    private readonly config: WorldConfig,
  ) {
    this.camera = new THREE.PerspectiveCamera(
      profile.cameraFov,
      resolveViewportSize().aspect,
      0.1,
      5000,
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
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.applyRendererSize();

    this.field = new TerrainField(config);
    const stoneField = new StoneField(this.field, config);
    const spawn = new DenseSpawnLocator(this.field, config, stoneField).find();
    const params = new URLSearchParams(window.location.search);
    const useFlyControls =
      params.get("control") === "fly" || params.get("view") === "aerial";
    this.flyMode = useFlyControls;
    if (params.get("view") === "aerial") {
      spawn.position.y += 48;
      spawn.pitch = THREE.MathUtils.degToRad(-34);
    }
    this.environment = new WorldEnvironmentController(
      this.scene,
      this.renderer,
      profile,
      profile.shadows && !useFlyControls,
    );
    this.terrain = new TerrainStreamer(
      this.scene,
      this.field,
      config,
      profile.compact,
      profile.shadows && !useFlyControls,
    );
    this.stones = new WorldStoneSystem(
      this.scene,
      stoneField,
      config,
      profile.compact,
      profile.shadows && !useFlyControls,
    );
    this.grass = new WorldGrassSystem(
      this.scene,
      this.field,
      config,
      profile,
    );
    const tierOverride = params.get("tier");
    if (tierOverride !== null && /^\d+$/.test(tierOverride)) {
      this.grass.setQualityTierOverride(Number(tierOverride));
    }
    this.applyGrassViewportScale();
    grassTrailField.configure({
      resolution: config.grassTrailResolution,
      coverage: config.grassTrailCoverage,
      recoveryRate: config.grassTrailRecoveryRate,
      freshnessRate: config.grassTrailFreshnessRate,
    });
    if (!useFlyControls) {
      grassTrailField.attach(this.renderer);
    }
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
    this.environment.updateShadow(this.controls.getStreamingPosition());
    this.runtimeGuard = new WorldRuntimeGuard(
      canvas,
      this.handleResize,
      (enabled) => {
        this.rendererEnabled = enabled;
      },
    );
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
      try {
        await app.setupStats();
      } catch (error) {
        console.warn("[Drusniel World] Optional stats panel unavailable.", error);
      }
    }
    void app.initializeGrass();
    return app;
  }

  start(): void {
    if (this.running || this.disposed) {
      return;
    }
    this.running = true;
    this.clock.start();
    this.lastFrameTimestamp = performance.now();
    this.frameHandle = requestAnimationFrame(this.render);
    this.watchdogHandle = window.setInterval(
      this.checkFrameHeartbeat,
      WORLD_FRAME_WATCHDOG_INTERVAL_MS,
    );
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.running = false;
    this.clock.stop();
    cancelAnimationFrame(this.frameHandle);
    window.clearInterval(this.watchdogHandle);
    this.runtimeGuard.dispose();
    this.controls.dispose();
    this.terrain.dispose();
    this.stones.dispose();
    this.grass.dispose();
    grassTrailField.dispose();
    this.stats?.dom.remove();
    this.stats = undefined;
    this.artMenu?.dispose();
    this.artMenu = undefined;
    this.environment.dispose();
    this.renderer.dispose();
  }

  private readonly applyGrassArtDirection = (
    direction: GrassArtDirection,
  ): void => {
    if (this.disposed) {
      return;
    }
    this.terrain.setGrassArtDirection(direction);
    this.grass.setArtDirection(direction);
    this.environment.applyArtDirection(direction);
  };

  private async initializeGrass(): Promise<void> {
    try {
      await this.grass.initialize();
      if (this.disposed) {
        return;
      }
      if (new URLSearchParams(window.location.search).get("accentAtlas") === "1") {
        const atlas = this.grass.getDetailFoliageAtlas();
        if (atlas) {
          const { appendDetailFoliageAtlasDebugCanvas } = await import(
            "../world/grass/WorldDetailFoliageAtlasFactory"
          );
          if (!this.disposed) {
            appendDetailFoliageAtlasDebugCanvas(atlas);
          }
        }
      }
    } catch (error) {
      if (this.disposed) {
        return;
      }
      console.error("[Drusniel World] Grass initialization failed.", error);
      this.grassInitializationError = this.runtimeGuard.formatError(error);
      this.grassEnabled = false;
      this.grass.dispose();
      grassTrailField.dispose();
    } finally {
      if (!this.disposed) {
        this.grassInitializing = false;
        this.lastFrameTimestamp = performance.now();
      }
    }
  }

  private render = (): void => {
    if (!this.running || this.disposed) {
      return;
    }

    this.frameHandle = requestAnimationFrame(this.render);
    this.lastFrameTimestamp = performance.now();
    const rawDeltaSeconds = this.clock.getDelta();
    const deltaSeconds = THREE.MathUtils.clamp(
      Number.isFinite(rawDeltaSeconds) ? rawDeltaSeconds : 0,
      0,
      WORLD_MAX_RUNTIME_DELTA_SECONDS,
    );
    const streamingBudgetMs = this.profile.compact
      ? WORLD_COMPACT_STREAMING_BUILD_BUDGET_MS
      : WORLD_DESKTOP_STREAMING_BUILD_BUDGET_MS;
    this.streamingBuildDeadline = performance.now() + streamingBudgetMs;
    this.frameMetrics.beginFrame(deltaSeconds);

    if (this.controlsEnabled) {
      this.runFrameSubsystem("controls", this.updateControls, deltaSeconds);
    }

    if (this.terrainEnabled) {
      this.runFrameSubsystem("terrain", this.updateTerrain, deltaSeconds);
    }

    if (this.stonesEnabled) {
      this.runFrameSubsystem("stones", this.updateStones, deltaSeconds);
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

  private readonly updateControls = (deltaSeconds: number): void => {
    this.controls.update(deltaSeconds);
    if (this.controls.getMode() === "fly") {
      this.constrainCamera();
    }
    this.environment.updateShadow(this.controls.getStreamingPosition());
  };

  private readonly updateTerrain = (): void => {
    const grassBuildReserveMs = this.profile.compact
      ? WORLD_COMPACT_GRASS_BUILD_RESERVE_MS
      : WORLD_DESKTOP_GRASS_BUILD_RESERVE_MS;
    const stoneBuildReserveMs = this.profile.compact
      ? WORLD_COMPACT_STONE_BUILD_RESERVE_MS
      : WORLD_DESKTOP_STONE_BUILD_RESERVE_MS;
    const terrainBuildDeadline = this.streamingBuildDeadline - grassBuildReserveMs - stoneBuildReserveMs;
    this.terrain.update(
      this.controls.getStreamingPosition(),
      terrainBuildDeadline,
    );
  };

  private readonly updateStones = (): void => {
    const grassBuildReserveMs = this.profile.compact
      ? WORLD_COMPACT_GRASS_BUILD_RESERVE_MS
      : WORLD_DESKTOP_GRASS_BUILD_RESERVE_MS;
    const stoneBuildDeadline = this.streamingBuildDeadline - grassBuildReserveMs;
    this.stones.update(this.controls.getStreamingPosition(), stoneBuildDeadline);
  };

  private readonly updateGrass = (deltaSeconds: number): void => {
    grassTrailField.render(deltaSeconds);
    const cameraGroundHeight = this.flyMode ? this.sampleGroundHeight(this.camera.position) : undefined;
    this.grass.update(
      deltaSeconds,
      this.camera,
      cameraGroundHeight,
      this.streamingBuildDeadline,
    );
  };

  private readonly renderScene = (): void => {
    this.renderer.render(this.scene, this.camera);
    this.stats?.update();
  };

  private readonly checkFrameHeartbeat = (): void => {
    if (!this.running || this.disposed || document.hidden) {
      return;
    }
    if (this.grassInitializing) {
      this.lastFrameTimestamp = performance.now();
      return;
    }
    const stalledForMs = performance.now() - this.lastFrameTimestamp;
    if (stalledForMs < WORLD_FRAME_STALL_THRESHOLD_MS) {
      return;
    }

    this.runtimeGuard.recordWatchdogRestart(stalledForMs);
    this.lastFrameTimestamp = performance.now();
    this.clock.stop();
    this.clock.start();
    cancelAnimationFrame(this.frameHandle);
    this.frameHandle = requestAnimationFrame(this.render);
  };

  private runFrameSubsystem(
    subsystem: WorldFrameSubsystem,
    callback: (deltaSeconds: number) => void,
    deltaSeconds: number,
  ): void {
    try {
      this.frameMetrics.measure(subsystem, callback, deltaSeconds);
    } catch (error) {
      this.runtimeGuard.recordSubsystemFailure(subsystem, error);
      if (subsystem === "controls") {
        this.controlsEnabled = false;
      } else if (subsystem === "terrain") {
        this.terrainEnabled = false;
      } else if (subsystem === "stones") {
        this.stonesEnabled = false;
        this.stones.dispose();
      } else if (subsystem === "grass") {
        this.grassEnabled = false;
        this.grass.dispose();
        grassTrailField.dispose();
      } else if (subsystem === "renderer") {
        this.rendererEnabled = false;
      } else {
        this.hudEnabled = false;
      }
    }
  }

  private applyRendererSize(): void {
    const viewport = resolveViewportSize();
    this.pixelRatio = resolvePixelRatio(this.profile.maxPixelRatio);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(viewport.width, viewport.height);
  }

  private applyGrassViewportScale(): void {
    const bufferHeight = this.renderer.getDrawingBufferSize(
      this.drawingBufferSize,
    ).y;
    if (bufferHeight <= 0) {
      return;
    }
    const halfFovTangent = Math.tan(
      THREE.MathUtils.degToRad(this.camera.fov) * 0.5,
    );
    this.grass.setViewportPixelScale((2 * halfFovTangent) / bufferHeight);
  }

  private async setupStats(): Promise<void> {
    const { default: StatsPanel } = await import("stats-gl");
    if (this.disposed) {
      return;
    }
    const stats = new StatsPanel({ minimal: true });
    stats.init(this.renderer);
    if (this.disposed) {
      stats.dom.remove();
      return;
    }
    document.body.appendChild(stats.dom);
    this.stats = stats;
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
    if (!this.statusHud.shouldUpdate(deltaSeconds)) {
      return;
    }
    const terrain = this.terrain.getDiagnostics();
    const stones = this.stones.getDiagnostics();
    const grass = this.grass.getDiagnostics();
    const focus = this.controls.getStreamingPosition();
    this.statusHud.render({
      frameCount: this.frameMetrics.getFrameCount(),
      averageFps: this.frameMetrics.getAverageFps(),
      runtimeError: this.runtimeGuard.error,
      controlMode: this.controls.getMode(),
      focus,
      camera: this.camera.position,
      groundHeight: this.sampleGroundHeight(focus),
      speed: this.controls.getSpeed(),
      inputDiagnostics: this.controls.getInputDiagnostics(),
      terrain,
      stones,
      grass,
      grassInitializationError: this.grassInitializationError,
      render: this.renderer.info.render,
      pixelRatio: this.pixelRatio,
      frameTimings: this.frameMetrics.getTimings(),
    });
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

  private readonly handleResize = (): void => {
    if (this.disposed) {
      return;
    }
    this.camera.aspect = resolveViewportSize().aspect;
    this.camera.updateProjectionMatrix();
    this.applyRendererSize();
    this.applyGrassViewportScale();
  };
}
