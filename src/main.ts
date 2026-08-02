import * as THREE from "three";
import Stats from "stats-gl";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as dat from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GrassSystem } from "./grass/GrassSystem";

export class FluffyGrass {
  private readonly loadingManager: THREE.LoadingManager;
  private readonly gltfLoader: GLTFLoader;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly canvas: HTMLCanvasElement;
  private readonly stats: Stats;
  private readonly orbitControls: OrbitControls;
  private readonly gui: dat.GUI;
  private readonly grassSystem: GrassSystem;
  private readonly clock = new THREE.Clock();
  private readonly terrainMaterial: THREE.MeshPhongMaterial;
  private sceneGui!: dat.GUI;

  private readonly sceneProps = {
    fogColor: "#eeeeee",
    terrainColor: "#5e875e",
    fogDensity: 0.02,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.loadingManager = new THREE.LoadingManager();
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.canvas = canvas;
    this.gui = new dat.GUI();
    this.stats = new Stats({ minimal: true });

    this.camera = new THREE.PerspectiveCamera(
      75,
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
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.autoUpdate = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.orbitControls.autoRotate = true;
    this.orbitControls.autoRotateSpeed = -0.5;
    this.orbitControls.enableDamping = true;

    this.terrainMaterial = new THREE.MeshPhongMaterial({
      color: this.sceneProps.terrainColor,
    });

    this.grassSystem = new GrassSystem({ scene: this.scene });

    this.initialize();
  }

  render(): void {
    const deltaSeconds = this.clock.getDelta();
    this.grassSystem.update(deltaSeconds, this.camera);
    this.renderer.render(this.scene, this.camera);
    this.stats.update();
    this.orbitControls.update();
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
    directionalLight.castShadow = true;
    directionalLight.position.set(100, 100, 100);
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.set(2048, 2048);
    this.scene.add(directionalLight);
  }

  private loadModels(): void {
    this.sceneGui
      .addColor(this.sceneProps, "terrainColor")
      .onChange((value) => this.terrainMaterial.color.set(value));

    this.gltfLoader.load(
      "/island.glb",
      (gltf) => {
        let terrainMesh: THREE.Mesh | undefined;

        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = this.terrainMaterial;
            child.receiveShadow = true;
            child.geometry.scale(3, 3, 3);
            terrainMesh = child;
          }
        });

        this.scene.add(gltf.scene);
        if (!terrainMesh) {
          console.error("[FluffyGrass] Island model does not contain a terrain mesh.");
          return;
        }

        void this.grassSystem.initialize(terrainMesh).catch((error) => {
          console.error("[FluffyGrass] Grass initialization failed.", error);
        });
      },
      undefined,
      (error) => console.error("[FluffyGrass] Island model failed to load.", error),
    );

    const textMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    this.gltfLoader.load(
      "/fluffy_grass_text.glb",
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = textMaterial;
            child.geometry.scale(3, 3, 3);
            child.position.y += 0.5;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        this.scene.add(gltf.scene);
      },
      undefined,
      (error) => console.error("[FluffyGrass] Text model failed to load.", error),
    );
  }

  private setupGui(): void {
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
      .onChange((value) => {
        const fog = this.scene.fog;
        if (fog instanceof THREE.FogExp2) {
          fog.density = value;
        }
      });
    this.sceneGui.addColor(this.sceneProps, "fogColor").onChange((value) => {
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
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}

const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
if (!canvas) {
  throw new Error("Canvas element #canvas was not found.");
}

const app = new FluffyGrass(canvas);
app.render();
