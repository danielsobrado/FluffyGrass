import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GrassDevelopmentController } from "../dev/GrassDevelopmentController";
import { GrassSystem } from "../grass/GrassSystem";
import { frameCameraToBounds } from "../runtime/CameraFraming";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";

const ISLAND_MODEL_PATH = "./island.glb";
const DECORATIVE_TEXT_MODEL_PATH = "./fluffy_grass_text.glb";
const MODEL_SCALE = 3;

export class IslandApp {
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly grass: GrassSystem;
  private readonly clock = new THREE.Clock();
  private readonly loader = new GLTFLoader();
  private readonly terrainMaterial = new THREE.MeshPhongMaterial({
    color: "#5e875e",
  });
  private readonly developmentController: GrassDevelopmentController;
  private frameHandle = 0;
  private running = false;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly profile: RuntimeProfile,
  ) {
    this.camera = new THREE.PerspectiveCamera(
      profile.cameraFov,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !profile.compact,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = profile.shadows;
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, profile.maxPixelRatio),
    );
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene.background = new THREE.Color("#eeeeee");
    this.scene.fog = new THREE.FogExp2("#eeeeee", 0.02);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.autoRotate = profile.autoRotate;
    this.controls.autoRotateSpeed = -0.5;
    this.grass = new GrassSystem({ scene: this.scene });
    this.developmentController = new GrassDevelopmentController({
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      controls: this.controls,
      grassSystem: this.grass,
    });
    this.addLights();
    window.addEventListener("resize", this.handleResize);
  }

  async initialize(): Promise<void> {
    const gltf = await this.loader.loadAsync(ISLAND_MODEL_PATH);
    gltf.scene.scale.setScalar(MODEL_SCALE);
    gltf.scene.updateWorldMatrix(true, true);

    const terrain = this.configureIsland(gltf.scene);
    this.scene.add(gltf.scene);
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    frameCameraToBounds(this.camera, this.controls, bounds, this.profile);
    await this.grass.initialize(terrain);

    if (this.profile.showDecorativeText) {
      void this.loadDecorativeText().catch((error) => {
        console.error("[FluffyGrass] Decorative text failed to load.", error);
      });
    }
    void this.developmentController.run().catch((error) => {
      console.error("[FluffyGrass] Development tools failed.", error);
    });
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.clock.start();
    this.frameHandle = requestAnimationFrame(this.render);
  }

  dispose(): void {
    this.running = false;
    this.clock.stop();
    cancelAnimationFrame(this.frameHandle);
    window.removeEventListener("resize", this.handleResize);
    this.controls.dispose();
    this.grass.dispose();
    this.terrainMaterial.dispose();
    this.renderer.dispose();
  }

  private render = (): void => {
    if (!this.running) {
      return;
    }
    this.frameHandle = requestAnimationFrame(this.render);
    const deltaSeconds = this.clock.getDelta();
    this.controls.update();
    this.grass.update(deltaSeconds, this.camera);
    this.renderer.render(this.scene, this.camera);
  };

  private configureIsland(root: THREE.Object3D): THREE.Mesh {
    const bounds = new THREE.Box3();
    const size = new THREE.Vector3();
    let terrain: THREE.Mesh | undefined;
    let largestHorizontalArea = Number.NEGATIVE_INFINITY;

    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }
      child.material = this.terrainMaterial;
      child.receiveShadow = this.profile.shadows;
      bounds.setFromObject(child).getSize(size);
      const horizontalArea = size.x * size.z;
      if (horizontalArea > largestHorizontalArea) {
        largestHorizontalArea = horizontalArea;
        terrain = child;
      }
    });

    if (!terrain) {
      throw new Error("Island model does not contain a terrain mesh.");
    }
    return terrain;
  }

  private addLights(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(100, 100, 100);
    sun.castShadow = this.profile.shadows;
    sun.shadow.mapSize.set(
      this.profile.shadowMapSize,
      this.profile.shadowMapSize,
    );
    this.scene.add(sun);
  }

  private async loadDecorativeText(): Promise<void> {
    const gltf = await this.loader.loadAsync(DECORATIVE_TEXT_MODEL_PATH);
    const material = new THREE.MeshPhongMaterial({ color: 0x333333 });
    gltf.scene.scale.setScalar(MODEL_SCALE);
    gltf.scene.position.y += 0.5;
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
        child.castShadow = this.profile.shadows;
      }
    });
    this.scene.add(gltf.scene);
  }

  private readonly handleResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
