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
  private hudElapsed = 0;
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
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, profile.maxPixelRatio),
    );
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (!profile.compact) {
      this.stats = new Stats({ minimal: true });
    }

    this.field = new TerrainField(config);
    const spawn = new DenseSpawnLocator(this.field, config).find();
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
    window.addEventListener("resize", this.handleResize);
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
    this.render();
  }

  dispose(): void {
    window.removeEventListener("resize", this.handleResize);
    this.controls.dispose();
    this.terrain.dispose();
    this.grass.dispose();
    this.renderer.dispose();
    this.stats?.dom.remove();
  }

  private async initializeGrass(): Promise<void> {
    try {
      await this.grass.initialize();
    } catch (error) {
      console.error("[FluffyGrass] Grass initialization failed.", error);
      this.grassInitializationError =
        error instanceof Error ? error.message : String(error);
    }
  }

  private render = (): void => {
    const deltaSeconds = this.clock.getDelta();
    this.controls.update(deltaSeconds);
    this.constrainCamera();
    this.terrain.update(this.camera.position);
    this.grass.update(deltaSeconds, this.camera);
    this.renderer.render(this.scene, this.camera);
    this.stats?.update();
    this.updateHud(deltaSeconds);
    requestAnimationFrame(this.render);
  };

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
      `XYZ ${this.camera.position.x.toFixed(0)} / ${this.camera.position.y.toFixed(0)} / ${this.camera.position.z.toFixed(0)}`,
      `AGL ${(this.camera.position.y - groundHeight).toFixed(1)} m · Speed ${this.controls.getSpeed().toFixed(0)} m/s`,
      `Terrain ${terrain.activeChunks} +${terrain.queuedChunks}`,
      grass.ready
        ? `Grass ${grass.clumps.toLocaleString()} patches · ${grass.blades.toLocaleString()} blades · ${grass.impostors.toLocaleString()} impostors`
        : grassStatus,
      `Draws ${render.calls} · Triangles ${render.triangles.toLocaleString()} · Build ${grass.lastBuildMs.toFixed(1)} ms`,
    ].join("\n");
  }

  private readonly handleResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.profile.maxPixelRatio),
    );
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
