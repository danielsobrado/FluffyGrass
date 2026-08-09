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
import { APP_VERSION } from "../version";
import { DenseSpawnLocator } from "../world/DenseSpawnLocator";
import { setStoneClearanceField } from "../world/stones/StoneClearance";
import { StoneField } from "../world/stones/StoneField";
import { WorldStoneSystem } from "../world/stones/WorldStoneSystem";
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
const DESKTOP_STREAMING_BUILD_BUDGET_MS = 8;
const COMPACT_STREAMING_BUILD_BUDGET_MS = 5;
const MAX_RUNTIME_DELTA_SECONDS = 0.25;
const SUN_DIRECTION = new THREE.Vector3(350, 500, 220).normalize();
const SUN_SHADOW_DISTANCE = 200;
const SUN_SHADOW_HALF_EXTENT = 7;
const UP_AXIS = new THREE.Vector3(0, 1, 0);

type FrameSubsystem = "controls" | "terrain" | "grass" | "renderer" | "hud";

const FRAME_TIMING_SMOOTHING = 0.1;

export class WorldApp {
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly clock = new THREE.Clock();
  private stats?: Stats;
  private artMenu?: GrassArtMenu;
  private readonly field: TerrainField;
  private readonly terrain: TerrainStreamer;
  private readonly stoneField: StoneField;
  private readonly stones: WorldStoneSystem;
  private readonly grass: WorldGrassSystem;
  private readonly controls: WorldController;
  private readonly hud = document.querySelector<HTMLElement>("#world-stats");
  private sun?: THREE.DirectionalLight;
  private hemisphere?: THREE.HemisphereLight;
  private currentArtDirection?: GrassArtDirection;
  private readonly drawingBufferSize = new THREE.Vector2();
  private readonly shadowAxisX = new THREE.Vector3();
  private readonly shadowAxisY = new THREE.Vector3();
  private readonly pixelRatio: number;
  private readonly flyMode: boolean;
  private frameHandle = 0;
  private watchdogHandle = 0;
  private frameCount = 0;
  private streamingBuildDeadline = Number.POSITIVE_INFINITY;
  private fpsSampleFrames = 0;
  private fpsSampleElapsed = 0;
  private averageFps = 0;
  private lastFrameTimestamp = performance.now();
  private readonly subsystemMs: Record<FrameSubsystem, number> = {
    controls: 0,
    terrain: 0,
    grass: 0,
    renderer: 0,
    hud: 0,
  };
  private hudElapsed = 0;
  private sampledGroundX = Number.NaN;
  private sampledGroundZ = Number.NaN;
  private sampledGroundHeight = 0;
  private running = false;
  private disposed = false;
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
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.pixelRatio = Math.min(window.devicePixelRatio, profile.maxPixelRatio);
    this.applyRendererSize();

    this.field = new TerrainField(config);
    const spawn = new DenseSpawnLocator(this.field, config).find();
    const params = new URLSearchParams(window.location.search);
    const useFlyControls =
      params.get("control") === "fly" || params.get("view") === "aerial";
    this.flyMode = useFlyControls;
    if (params.get("view") === "aerial") {
      spawn.position.y += 48;
      spawn.pitch = THREE.MathUtils.degToRad(-34);
    }

    this.terrain = new TerrainStreamer(
      this.scene,
      this.field,
      config,
      profile.compact,
      profile.shadows && !useFlyControls,
    );
    this.stoneField = new StoneField(this.field, config);
    setStoneClearanceField(this.stoneField);
    this.stones = new WorldStoneSystem(
      this.scene,
      this.stoneField,
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
    this.addLights();
    this.applyEnvironmentPairing();
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
      FRAME_WATCHDOG_INTERVAL_MS,
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
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored);
    this.controls.dispose();
    this.terrain.dispose();
    this.stones.dispose();
    setStoneClearanceField(undefined);
    this.grass.dispose();
    grassTrailField.dispose();
    this.stats?.dom.remove();
    this.stats = undefined;
    this.artMenu?.dispose();
    this.artMenu = undefined;
    this.renderer.dispose();
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
    if (this.disposed) {
      return;
    }
    this.currentArtDirection = direction;
    this.terrain.setGrassArtDirection(direction);
    this.grass.setArtDirection(direction);
    this.applyEnvironmentPairing();
  };

  private applyEnvironmentPairing(): void {
    const zelda = this.currentArtDirection?.key === "zelda-field";
    this.scene.background = new THREE.Color(zelda ? "#bfd9f2" : "#bfd4df");
    this.scene.fog = new THREE.FogExp2(
      zelda ? "#c2d6b8" : "#bfd4df",
      zelda ? 0.0035 : this.profile.compact ? 0.0016 : 0.00105,
    );
    this.renderer.toneMappingExposure = zelda ? 1.15 : 1;
    if (this.sun) {
      this.sun.color.set(zelda ? "#fff2d8" : "#fff3d7");
      this.sun.intensity = 2.4;
    }
    if (this.hemisphere) {
      this.hemisphere.color.set(zelda ? "#bfd9f2" : "#dceeff");
      this.hemisphere.groundColor.set(zelda ? "#7d8f5a" : "#3f3a2d");
      this.hemisphere.intensity = zelda ? 0.55 : 0.6;
    }
  }

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
      this.grassInitializationError = this.formatError(error);
      this.grassEnabled = false;
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
    this.frameCount += 1;
    const rawDeltaSeconds = this.clock.getDelta();
    const deltaSeconds = THREE.MathUtils.clamp(
      Number.isFinite(rawDeltaSeconds) ? rawDeltaSeconds : 0,
      0,
      MAX_RUNTIME_DELTA_SECONDS,
    );
    const streamingBudgetMs = this.profile.compact
      ? COMPACT_STREAMING_BUILD_BUDGET_MS
      : DESKTOP_STREAMING_BUILD_BUDGET_MS;
    this.streamingBuildDeadline = performance.now() + streamingBudgetMs;
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
    this.updateSunShadow();
  };

  private readonly updateTerrain = (): void => {
    this.terrain.update(
      this.controls.getStreamingPosition(),
      this.streamingBuildDeadline,
    );
    this.stones.update(
      this.controls.getStreamingPosition(),
      this.streamingBuildDeadline,
    );
  };

  private readonly updateGrass = (deltaSeconds: number): void => {
    grassTrailField.render(deltaSeconds);
    const cameraGroundHeight = this.flyMode
      ? this.sampleGroundHeight(this.camera.position)
      : undefined;
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
    const startedAt = performance.now();
    try {
      callback(deltaSeconds);
      this.subsystemMs[subsystem] +=
        (performance.now() - startedAt - this.subsystemMs[subsystem]) *
        FRAME_TIMING_SMOOTHING;
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

  private addLights(): void {
    // Low enough that the sun, not the sky dome, decides a blade's brightness.
    // At the 1.45 this used to sit at, every blade in the field was lit almost
    // identically regardless of which way it faced, which is what made a canopy
    // of eight million blades read as one flat green sheet.
    this.hemisphere = new THREE.HemisphereLight(0xdceeff, 0x3f3a2d, 0.6);
    this.scene.add(this.hemisphere);
    const sun = new THREE.DirectionalLight(0xfff3d7, 2.4);
    sun.position.copy(SUN_DIRECTION).multiplyScalar(SUN_SHADOW_DISTANCE);
    sun.castShadow = this.profile.shadows && !this.flyMode;
    sun.shadow.camera.left = -SUN_SHADOW_HALF_EXTENT;
    sun.shadow.camera.right = SUN_SHADOW_HALF_EXTENT;
    sun.shadow.camera.top = SUN_SHADOW_HALF_EXTENT;
    sun.shadow.camera.bottom = -SUN_SHADOW_HALF_EXTENT;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = SUN_SHADOW_DISTANCE * 2;
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias = 0.02;
    sun.shadow.mapSize.set(
      this.profile.shadowMapSize,
      this.profile.shadowMapSize,
    );
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sun = sun;
    this.updateSunShadow();
  }

  private updateSunShadow(): void {
    const sun = this.sun;
    if (!sun || !sun.castShadow) {
      return;
    }

    const focus = this.controls.getStreamingPosition();
    const texelSize =
      (2 * SUN_SHADOW_HALF_EXTENT) / Math.max(1, this.profile.shadowMapSize);
    const zAxis = SUN_DIRECTION;
    this.shadowAxisX.crossVectors(UP_AXIS, zAxis).normalize();
    this.shadowAxisY.crossVectors(zAxis, this.shadowAxisX);
    const snappedX =
      Math.round(focus.dot(this.shadowAxisX) / texelSize) * texelSize;
    const snappedY =
      Math.round(focus.dot(this.shadowAxisY) / texelSize) * texelSize;
    const alongLight = focus.dot(zAxis);

    sun.target.position
      .copy(this.shadowAxisX)
      .multiplyScalar(snappedX)
      .addScaledVector(this.shadowAxisY, snappedY)
      .addScaledVector(zAxis, alongLight);
    sun.position
      .copy(sun.target.position)
      .addScaledVector(zAxis, SUN_SHADOW_DISTANCE);
    sun.target.updateMatrixWorld();
    sun.updateMatrixWorld();
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
      `Grass submit mid ${grass.submittedMidVertices.toLocaleString()} verts · far ${grass.submittedFarInstances.toLocaleString()} inst · quality T${grass.qualityTier} ${grass.qualityTierSeconds.toFixed(1)}s (${grass.qualityDensityScale.toFixed(2)})`,
      `Frame ctrl ${this.subsystemMs.controls.toFixed(2)} · terr ${this.subsystemMs.terrain.toFixed(2)} · grass ${this.subsystemMs.grass.toFixed(2)} · draw ${this.subsystemMs.renderer.toFixed(2)} ms`,
      `Near tiles ${grass.nearTiles.toLocaleString()} · Tile build ${grass.nearTileBuildMs.toFixed(1)} / peak ${grass.maxNearTileBuildMs.toFixed(1)} ms`,
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
    if (!this.disposed) {
      this.runtimeError = `window: ${this.formatError(event.error ?? event.message)}`;
    }
  };

  private readonly handleUnhandledRejection = (
    event: PromiseRejectionEvent,
  ): void => {
    if (!this.disposed) {
      this.runtimeError = `promise: ${this.formatError(event.reason)}`;
    }
  };

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault();
    if (this.disposed) {
      return;
    }
    this.rendererEnabled = false;
    this.runtimeErrorBeforeContextLoss = this.runtimeError;
    this.runtimeError = CONTEXT_LOST_ERROR;
  };

  private readonly handleContextRestored = (): void => {
    if (this.disposed) {
      return;
    }
    this.rendererEnabled = true;
    if (this.runtimeError === CONTEXT_LOST_ERROR) {
      this.runtimeError = this.runtimeErrorBeforeContextLoss;
    }
    this.runtimeErrorBeforeContextLoss = undefined;
  };

  private readonly handleResize = (): void => {
    if (this.disposed) {
      return;
    }
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.applyRendererSize();
    this.applyGrassViewportScale();
  };
}
