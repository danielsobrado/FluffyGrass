import * as THREE from "three";
import Stats from "stats-gl";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as dat from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GrassDevelopmentController } from "./dev/GrassDevelopmentController";
import { GrassSystem } from "./grass/GrassSystem";
import { frameCameraToBounds } from "./runtime/CameraFraming";
import type { RuntimeProfile } from "./runtime/RuntimeConfig";
import { RuntimeConfigLoader } from "./runtime/RuntimeConfigLoader";
import { resolveRuntimeProfile } from "./runtime/ViewportProfile";

const ISLAND_MODEL_PATH = "./island.glb";
const DECORATIVE_TEXT_MODEL_PATH = "./fluffy_grass_text.glb";
const FORCE_CONTROLS_QUERY = "controls";

export class FluffyGrass {
  private readonly loadingManager: THREE.LoadingManager;
  private readonly gltfLoader: GLTFLoader;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly canvas: HTMLCanvasElement;
  private readonly stats: Stats;
  private readonly orbitControls: OrbitControls;
  private readonly gui?: dat.GUI;
  private readonly grassSystem: GrassSystem;
  private readonly developmentController: GrassDevelopmentController;
  private readonly clock = new THREE.Clock();
  private readonly terrainMaterial: THREE.MeshPhongMaterial;
  private sceneGui?: dat.GUI;
  private sceneBounds?: THREE.Box3;

  private readonly sceneProps = {
    fogColor: "#eeeeee",
    terrainColor: "#5e875e",
    fogDensity: 0.02,
  };

  constructor(
    canvas: HTMLCanvasElement,
    private readonly profile: RuntimeProfile,
  ) {
    this.loadingManager = new THREE.LoadingManager();
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.canvas = canvas;
    this.stats = new Stats({ minimal: true });

    const controlsRequested =
      new URLSearchParams(window.location.search).get(FORCE_CONTROLS_QUERY) ===
      "1";
    if (profile.showGui || controlsRequested) {
      this.gui = new dat.GUI();
    }

    document.documentElement.dataset.viewport = profile.compact
      ? "compact"
      : "desktop";

    this.camera = new THREE.PerspectiveCamera(
      profile.cameraFov,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(-17, 12, -10);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.sceneProps.fogColor);
    this.scene.fog = new THREE.FogExp2(
      this.sceneProps.fogColor,
      this.sceneProps.fogDensity,
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      precision: "highp",
    });
    this.renderer.shadowMap.enabled = profile.shadows;
    this.renderer.shadowMap.autoUpdate = profile.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, profile.maxPixelRatio),
    );

    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.orbitControls.autoRotate = profile.autoRotate;
    this.orbitControls.autoRotateSpeed = -0.5;
    this.orbitControls.enableDamping = true;
    this.orbitControls.enablePan = !profile.compact;
    this.orbitControls.rotateSpeed = profile.compact ? 0.55 : 1;

    this.terrainMaterial = new THREE.MeshPhongMaterial({
      color: this.sceneProps.terrainColor,
    });

    this.grassSystem = new GrassSystem({ scene: this.scene });
    this.developmentController = new GrassDevelopmentController({
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      controls: this.orbitControls,
      grassSystem: this.grassSystem,
    });

    this.initialize();
  }

  render(): void {
    const deltaSeconds = this.clock.getDelta();
    this.orbitControls.update();
    this.grassSystem.update(deltaSeconds, this.camera);
    this.renderer.render(this.scene, this.camera);
    this.stats.update();
    requestAnimationFrame(() => this.render());
  }

  private initialize(): void {
    this.setupGui();
    this.setupStats();
    this.loadModels();
    this.setupEventListeners();
    this.addLights();
  }

  private addLights(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.castShadow = this.profile.shadows;
    directionalLight.position.set(100, 100, 100);
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.set(
      this.profile.shadowMapSize,
      this.profile.shadowMapSize,
    );
    this.scene.add(directionalLight);
  }

  private loadModels(): void {
    this.sceneGui
      ?.addColor(this.sceneProps, "terrainColor")
      .onChange((value: string) => this.terrainMaterial.color.set(value));

    this.gltfLoader.load(
      ISLAND_MODEL_PATH,
      (gltf) => {
        let terrainMesh: THREE.Mesh | undefined;

        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = this.terrainMaterial;
            child.receiveShadow = this.profile.shadows;
            child.geometry.scale(3, 3, 3);
            terrainMesh = child;
          }
        });

        this.scene.add(gltf.scene);
        if (!terrainMesh) {
          console.error("[FluffyGrass] Island model does not contain a terrain mesh.");
          return;
        }

        this.sceneBounds = new THREE.Box3().setFromObject(gltf.scene);
        frameCameraToBounds(
          this.camera,
          this.orbitControls,
          this.sceneBounds,
          this.profile,
        );

        void this.grassSystem
          .initialize(terrainMesh)
          .then(() => {
            void this.developmentController.run().catch((error) => {
              console.error("[FluffyGrass] Development tools failed.", error);
            });
          })
          .catch((error) => {
            console.error("[FluffyGrass] Grass initialization failed.", error);
          });
      },
      undefined,
      (error) => console.error("[FluffyGrass] Island model failed to load.", error),
    );

    if (this.profile.showDecorativeText) {
      this.loadDecorativeText();
    }
  }

  private loadDecorativeText(): void {
    const textMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    this.gltfLoader.load(
      DECORATIVE_TEXT_MODEL_PATH,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = textMaterial;
            child.geometry.scale(3, 3, 3);
            child.position.y += 0.5;
            child.castShadow = this.profile.shadows;
            child.receiveShadow = this.profile.shadows;
          }
        });
        this.scene.add(gltf.scene);
      },
      undefined,
      (error) => console.error("[FluffyGrass] Text model failed to load.", error),
    );
  }

  private setupGui(): void {
    if (!this.gui) {
      return;
    }

    this.gui.close();
    const guiContainer = this.gui.domElement.parentElement as HTMLDivElement;
    guiContainer.style.zIndex = "9999";
    guiContainer.style.position = "fixed";
    guiContainer.style.top = "0";
    guiContainer.style.left = "0";
    guiContainer.style.right = "auto";
    guiContainer.style.display = "block";

    this.sceneGui = this.gui.addFolder("Scene Properties");
    this.sceneGui.add(this.orbitControls, "autoRotate").name("Auto Rotate");
    this.sceneGui
      .add(this.sceneProps, "fogDensity", 0, 0.05, 0.000001)
      .onChange((value: number) => {
        const fog = this.scene.fog;
        if (fog instanceof THREE.FogExp2) {
          fog.density = value;
        }
      });
    this.sceneGui.addColor(this.sceneProps, "fogColor").onChange((value: string) => {
      this.scene.fog?.color.set(value);
      this.scene.background = new THREE.Color(value);
    });

    this.grassSystem.attachGui(this.sceneGui);
    this.sceneGui.open();
  }

  private setupStats(): void {
    this.stats.init(this.renderer);
    this.stats.dom.style.bottom = "45px";
    this.stats.dom.style.top = "auto";
    this.stats.dom.style.left = "auto";
    this.stats.dom.style.display = "none";
    document.body.appendChild(this.stats.dom);
  }

  private setupEventListeners(): void {
    window.addEventListener("resize", this.handleResize, false);
    this.stats.dom.addEventListener("click", () => {
      console.info("[FluffyGrass] Render statistics", this.renderer.info.render);
    });
  }

  private readonly handleResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.fov = this.profile.cameraFov;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.profile.maxPixelRatio),
    );

    if (this.sceneBounds) {
      frameCameraToBounds(
        this.camera,
        this.orbitControls,
        this.sceneBounds,
        this.profile,
      );
    }
  };
}

async function start(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
  if (!canvas) {
    throw new Error("Canvas element #canvas was not found.");
  }

  const runtimeConfig = await new RuntimeConfigLoader().load();
  const profile = resolveRuntimeProfile(runtimeConfig);
  const app = new FluffyGrass(canvas, profile);
  app.render();
}

void start().catch((error) => {
  console.error("[FluffyGrass] Application startup failed.", error);
});
