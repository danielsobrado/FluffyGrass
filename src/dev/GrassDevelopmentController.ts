import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GrassSystem } from "../grass/GrassSystem";
import { OctahedralImpostorBaker } from "../grass/impostors/OctahedralImpostorBaker";
import { GrassQaRunner } from "../qa/GrassQaRunner";

interface GrassDevelopmentDependencies {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  grassSystem: GrassSystem;
}

interface WindowWithBakeResult extends Window {
  __FLUFFY_GRASS_IMPOSTOR_BAKE__?: unknown;
}

export class GrassDevelopmentController {
  private started = false;

  constructor(private readonly dependencies: GrassDevelopmentDependencies) {}

  async run(): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;

    const params = new URLSearchParams(window.location.search);
    if (params.get("grassImpostorBake") === "1") {
      await this.runImpostorBake();
    }

    const qaMode = params.get("qa");
    if (qaMode === "grass" || qaMode === "grass-lod") {
      const qaConfig = this.dependencies.grassSystem.getQaConfig();
      const runner = new GrassQaRunner(this.dependencies);
      await runner.run({
        warmupSeconds: this.readNonNegativeNumber(
          params,
          "warmup",
          qaConfig.warmupSeconds,
        ),
        sampleSeconds: this.readPositiveNumber(
          params,
          "duration",
          qaConfig.sampleSeconds,
        ),
        download: params.get("download") === "1",
      });
    }
  }

  private async runImpostorBake(): Promise<void> {
    const target = this.dependencies.grassSystem.getImpostorBakeTarget();
    if (!target) {
      throw new Error("No grass patch is available for impostor baking.");
    }

    const { controls } = this.dependencies;
    const previousEnabled = controls.enabled;
    const previousAutoRotate = controls.autoRotate;
    controls.enabled = false;
    controls.autoRotate = false;
    this.dependencies.grassSystem.setLodBakeOverride(true);

    try {
      const baker = new OctahedralImpostorBaker(this.dependencies.renderer);
      const result = await baker.bake({
        scene: this.dependencies.scene,
        source: target.object,
        bounds: target.bounds,
        config: this.dependencies.grassSystem.getImpostorConfig(),
      });
      baker.createDownloadLinks(result, `grass-impostor-${target.patchId}`);
      (window as WindowWithBakeResult).__FLUFFY_GRASS_IMPOSTOR_BAKE__ =
        result.metadata;
      console.info("[FluffyGrass] Impostor bake complete", result.metadata);
    } finally {
      controls.enabled = previousEnabled;
      controls.autoRotate = previousAutoRotate;
      this.dependencies.grassSystem.setLodBakeOverride(false);
    }
  }

  private readNonNegativeNumber(
    params: URLSearchParams,
    key: string,
    fallback: number,
  ): number {
    const rawValue = params.get(key);
    if (!rawValue) {
      return fallback;
    }

    const value = Number(rawValue);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }

  private readPositiveNumber(
    params: URLSearchParams,
    key: string,
    fallback: number,
  ): number {
    const rawValue = params.get(key);
    if (!rawValue) {
      return fallback;
    }

    const value = Number(rawValue);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
}
