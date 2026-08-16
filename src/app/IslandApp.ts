import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GrassDevelopmentController } from "../dev/GrassDevelopmentController";
import { GrassSystem } from "../grass/GrassSystem";
import { frameCameraToBounds } from "../runtime/CameraFraming";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";
import {
  resolvePixelRatio,
  resolveViewportSize,
} from "../runtime/ViewportSizing";
import { APP_VERSION } from "../version";

const ISLAND_MODEL_PATH = revisionedAssetPath("./island.glb");
const DECORATIVE_TEXT_MODEL_PATH = revisionedAssetPath("./fluffy_grass_text.glb");
const MODEL_SCALE = 3;
const ISLAND_MAX_DELTA_SECONDS = 0.1;

interface IslandRuntimeResources {
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  grass: GrassSystem;
  terrainMaterial: THREE.MeshPhongMaterial;
}

export class IslandApp {
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly grass: GrassSystem;
  private readonly clock = new THREE.Clock();
  private readonly loader = new GLTFLoader();
  private readonly terrainMaterial: THREE.MeshPhongMaterial;
  private islandRoot?: THREE.Object3D;
  private decorativeRoot?: THREE.Object3D;
  private decorativeMaterial?: THREE.Material;
  private developmentController?: GrassDevelopmentController;
  private frameHandle = 0;
  private running = false;
  private disposed = false;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly profile: RuntimeProfile,
  ) {
    this.camera = new THREE.PerspectiveCamera(
      profile.cameraFov,
      resolveViewportSize().aspect,
      0.1,
      1000,
    );

    const resources = createIslandRuntimeResources(
      this.scene,
      this.camera,
      canvas,
      profile,
    );
    this.renderer = resources.renderer;
    this.controls = resources.controls;
    this.grass = resources.grass;
    this.terrainMaterial = resources.terrainMaterial;

    try {
      window.addEventListener("resize", this.handleResize);
    } catch (error) {
      disposeIslandRuntimeResources(resources);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    const gltf = await this.loader.loadAsync(ISLAND_MODEL_PATH);
    const root = gltf.scene;
    if (this.disposed) {
      disposeObjectGeometry(root);
      disposeObjectMaterials(root);
      return;
    }

    let configured = false;
    try {
      root.scale.setScalar(MODEL_SCALE);
      root.updateWorldMatrix(true, true);
      const terrain = this.configureIsland(root);
      configured = true;
      this.scene.add(root);
      this.islandRoot = root;
      const bounds = new THREE.Box3().setFromObject(root);
      frameCameraToBounds(this.camera, this.controls, bounds, this.profile);
      await this.grass.initialize(terrain);
      if (this.disposed) {
        return;
      }

      if (this.profile.showDecorativeText) {
        void this.loadDecorativeText().catch((error) => {
          if (!this.disposed) {
            console.error("[FluffyGrass] Decorative text failed to load.", error);
          }
        });
      }
      void this.runDevelopmentTools().catch((error) => {
        if (!this.disposed) {
          console.error("[FluffyGrass] Development tools failed.", error);
        }
      });
    } catch (error) {
      if (this.islandRoot === root) {
        this.scene.remove(root);
        this.islandRoot = undefined;
      }
      disposeObjectGeometry(root);
      if (!configured) {
        disposeObjectMaterials(root);
      }
      throw error;
    }
  }

  start(): void {
    if (this.running || this.disposed) {
      return;
    }
    this.running = true;
    this.clock.start();
    this.frameHandle = requestAnimationFrame(this.render);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.running = false;
    this.clock.stop();
    cancelAnimationFrame(this.frameHandle);
    window.removeEventListener("resize", this.handleResize);

    const developmentController = this.developmentController;
    this.developmentController = undefined;
    disposeSafely("Development tools", () => developmentController?.dispose());
    disposeSafely("Orbit controls", () => this.controls.dispose());
    disposeSafely("Grass system", () => this.grass.dispose());
    if (this.islandRoot) {
      const root = this.islandRoot;
      this.islandRoot = undefined;
      disposeSafely("Island geometry", () => {
        this.scene.remove(root);
        disposeObjectGeometry(root);
      });
    }
    if (this.decorativeRoot) {
      const root = this.decorativeRoot;
      this.decorativeRoot = undefined;
      disposeSafely("Decorative geometry", () => {
        this.scene.remove(root);
        disposeObjectGeometry(root);
      });
    }
    const decorativeMaterial = this.decorativeMaterial;
    this.decorativeMaterial = undefined;
    disposeSafely("Decorative material", () => decorativeMaterial?.dispose());
    disposeSafely("Terrain material", () => this.terrainMaterial.dispose());
    disposeSafely("Renderer", () => this.renderer.dispose());
  }

  private render = (): void => {
    if (!this.running || this.disposed) {
      return;
    }
    this.frameHandle = requestAnimationFrame(this.render);
    const rawDeltaSeconds = this.clock.getDelta();
    const deltaSeconds = THREE.MathUtils.clamp(
      Number.isFinite(rawDeltaSeconds) ? rawDeltaSeconds : 0,
      0,
      ISLAND_MAX_DELTA_SECONDS,
    );
    this.controls.update();
    this.grass.update(deltaSeconds, this.camera);
    this.renderer.render(this.scene, this.camera);
  };

  private configureIsland(root: THREE.Object3D): THREE.Mesh {
    const bounds = new THREE.Box3();
    const size = new THREE.Vector3();
    const replacedMaterials = new Set<THREE.Material>();
    let terrain: THREE.Mesh | undefined;
    let largestHorizontalArea = Number.NEGATIVE_INFINITY;

    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }
      collectMaterials(child.material, replacedMaterials);
      child.material = this.terrainMaterial;
      child.receiveShadow = this.profile.shadows;
      bounds.setFromObject(child).getSize(size);
      const horizontalArea = size.x * size.z;
      if (horizontalArea > largestHorizontalArea) {
        largestHorizontalArea = horizontalArea;
        terrain = child;
      }
    });
    disposeMaterialResources(replacedMaterials);

    if (!terrain) {
      throw new Error("Island model does not contain a terrain mesh.");
    }
    return terrain;
  }

  private async loadDecorativeText(): Promise<void> {
    const gltf = await this.loader.loadAsync(DECORATIVE_TEXT_MODEL_PATH);
    const root = gltf.scene;
    if (this.disposed) {
      disposeObjectGeometry(root);
      disposeObjectMaterials(root);
      return;
    }

    const originalMaterials = new Set<THREE.Material>();
    let material: THREE.MeshPhongMaterial | undefined;
    try {
      material = new THREE.MeshPhongMaterial({ color: 0x333333 });
      root.scale.setScalar(MODEL_SCALE);
      root.position.y += 0.5;
      root.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          collectMaterials(child.material, originalMaterials);
          child.material = material!;
          child.castShadow = this.profile.shadows;
        }
      });
      disposeMaterialResources(originalMaterials);
      this.scene.add(root);
      this.decorativeMaterial = material;
      this.decorativeRoot = root;
    } catch (error) {
      this.scene.remove(root);
      disposeObjectGeometry(root);
      disposeObjectMaterials(root);
      disposeMaterialResources(originalMaterials);
      material?.dispose();
      throw error;
    }
  }

  private async runDevelopmentTools(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const qaMode = params.get("qa");
    if (
      params.get("grassImpostorBake") !== "1" &&
      qaMode !== "grass" &&
      qaMode !== "grass-lod"
    ) {
      return;
    }
    const { GrassDevelopmentController } = await import(
      "../dev/GrassDevelopmentController"
    );
    if (this.disposed) {
      return;
    }
    const controller = new GrassDevelopmentController({
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      controls: this.controls,
      grassSystem: this.grass,
    });
    this.developmentController = controller;
    try {
      await controller.run();
    } catch (error) {
      if (this.developmentController === controller) {
        this.developmentController = undefined;
        controller.dispose();
      }
      throw error;
    }
  }

  private applyViewportSize(): void {
    const viewport = resolveViewportSize();
    this.camera.aspect = viewport.aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(resolvePixelRatio(this.profile.maxPixelRatio));
    this.renderer.setSize(viewport.width, viewport.height);
  }

  private readonly handleResize = (): void => {
    if (!this.disposed) {
      this.applyViewportSize();
    }
  };
}

function createIslandRuntimeResources(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
  profile: RuntimeProfile,
): IslandRuntimeResources {
  let renderer: THREE.WebGLRenderer | undefined;
  let controls: OrbitControls | undefined;
  let grass: GrassSystem | undefined;
  let terrainMaterial: THREE.MeshPhongMaterial | undefined;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !profile.compact,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = profile.shadows;
    const viewport = resolveViewportSize();
    camera.aspect = viewport.aspect;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(resolvePixelRatio(profile.maxPixelRatio));
    renderer.setSize(viewport.width, viewport.height);

    scene.background = new THREE.Color("#eeeeee");
    scene.fog = new THREE.FogExp2("#eeeeee", 0.02);
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.autoRotate = profile.autoRotate;
    controls.autoRotateSpeed = -0.5;
    grass = new GrassSystem({ scene });
    terrainMaterial = new THREE.MeshPhongMaterial({ color: "#5e875e" });
    addIslandLights(scene, profile);

    return { renderer, controls, grass, terrainMaterial };
  } catch (error) {
    disposeSafely("Grass system construction", () => grass?.dispose());
    disposeSafely("Orbit controls construction", () => controls?.dispose());
    disposeSafely("Terrain material construction", () => terrainMaterial?.dispose());
    disposeSafely("Renderer construction", () => renderer?.dispose());
    throw error;
  }
}

function disposeIslandRuntimeResources(resources: IslandRuntimeResources): void {
  disposeSafely("Grass system construction", () => resources.grass.dispose());
  disposeSafely("Orbit controls construction", () => resources.controls.dispose());
  disposeSafely("Terrain material construction", () =>
    resources.terrainMaterial.dispose(),
  );
  disposeSafely("Renderer construction", () => resources.renderer.dispose());
}

function addIslandLights(scene: THREE.Scene, profile: RuntimeProfile): void {
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(100, 100, 100);
  sun.castShadow = profile.shadows;
  sun.shadow.mapSize.set(profile.shadowMapSize, profile.shadowMapSize);
  scene.add(sun);
}

function disposeSafely(label: string, dispose: () => void): void {
  try {
    dispose();
  } catch (error) {
    console.warn(`[FluffyGrass] ${label} cleanup failed.`, error);
  }
}

function revisionedAssetPath(path: string): string {
  return `${path}?v=${encodeURIComponent(APP_VERSION)}`;
}

function collectMaterials(
  material: THREE.Material | THREE.Material[],
  target: Set<THREE.Material>,
): void {
  if (Array.isArray(material)) {
    for (const entry of material) {
      target.add(entry);
    }
    return;
  }
  target.add(material);
}

function disposeObjectMaterials(root: THREE.Object3D): void {
  const materials = new Set<THREE.Material>();
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      collectMaterials(child.material, materials);
    }
  });
  disposeMaterialResources(materials);
}

function disposeMaterialResources(materials: Iterable<THREE.Material>): void {
  const textures = new Set<THREE.Texture>();
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture) {
        textures.add(value);
      }
    }
    material.dispose();
  }
  for (const texture of textures) {
    texture.dispose();
  }
}

function disposeObjectGeometry(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      geometries.add(child.geometry);
    }
  });
  for (const geometry of geometries) {
    geometry.dispose();
  }
}
