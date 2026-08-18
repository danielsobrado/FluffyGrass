import * as THREE from "three";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";
import { resolvePixelRatio, resolveViewportSize } from "../runtime/ViewportSizing";
import type { WorldVisibilitySystem } from "../render/visibility/WorldVisibilitySystem";
import type { WorldGrassSystem } from "../world/WorldGrassSystem";

export class WorldViewportController {
  private readonly drawingBufferSize = new THREE.Vector2();
  private pixelRatio = 1;
  private visibility?: WorldVisibilitySystem;
  private grass?: WorldGrassSystem;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly profile: RuntimeProfile,
  ) {}

  initialize(): void {
    this.applyRendererSize();
  }

  attachVisibility(visibility: WorldVisibilitySystem): void {
    this.visibility = visibility;
    this.applyProjectionScales();
  }

  attachGrass(grass: WorldGrassSystem): void {
    this.grass = grass;
    this.applyProjectionScales();
  }

  resize(): void {
    this.camera.aspect = resolveViewportSize().aspect;
    this.camera.updateProjectionMatrix();
    this.applyRendererSize();
    this.applyProjectionScales();
  }

  getPixelRatio(): number {
    return this.pixelRatio;
  }

  private applyRendererSize(): void {
    const viewport = resolveViewportSize();
    this.pixelRatio = resolvePixelRatio(this.profile.maxPixelRatio);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(viewport.width, viewport.height);
  }

  private applyProjectionScales(): void {
    const bufferHeight = this.renderer.getDrawingBufferSize(
      this.drawingBufferSize,
    ).y;
    if (bufferHeight <= 0) {
      return;
    }
    this.visibility?.setViewportHeight(bufferHeight);
    const halfFovTangent = Math.tan(
      THREE.MathUtils.degToRad(this.camera.fov) * 0.5,
    );
    this.grass?.setViewportPixelScale((2 * halfFovTangent) / bufferHeight);
  }
}
