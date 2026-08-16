import * as THREE from "three";
import { disposeResources } from "../../render/ResourceDisposal";
import {
  WORLD_SKY_HAZE,
  WORLD_SKY_HORIZON,
  WORLD_SKY_SUN,
  WORLD_SKY_ZENITH,
  WORLD_SUN_DIRECTION,
  WORLD_ZELDA_EXPOSURE,
} from "../../app/WorldEnvironmentTuning";

const SKY_RADIUS = 4000;
const SUN_DIRECTION = new THREE.Vector3(...WORLD_SUN_DIRECTION).normalize();

const VERTEX_SHADER = /* glsl */ `
varying vec3 vSkyDirection;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vSkyDirection = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform vec3 uSkyZenith;
uniform vec3 uSkyHorizon;
uniform vec3 uSkyHaze;
uniform vec3 uSkySunDirection;
uniform vec3 uSkySunColor;
varying vec3 vSkyDirection;

void main() {
  vec3 direction = normalize(vSkyDirection);
  float height = direction.y;
  vec3 color = mix(uSkyHorizon, uSkyZenith, smoothstep(-0.04, 0.62, height));
  color = mix(uSkyHaze, color, smoothstep(-0.18, 0.14, height));
  float sunFacing = max(dot(direction, uSkySunDirection), 0.0);
  float glow = pow(sunFacing, 28.0);
  float disc = smoothstep(0.9992, 0.99985, sunFacing);
  color += uSkySunColor * (glow * 0.42 + disc * 1.65);
  gl_FragColor = vec4(color, 1.0);

  // A ShaderMaterial gets none of the output pipeline for free, so both chunks
  // have to be asked for by name. Without them the dome wrote linear radiance
  // straight into an sRGB framebuffer, which is a little over half the intended
  // brightness, and skipped the ACES curve every other material in the scene is
  // graded through.
  //
  // Both are no-ops during the PMREM bake below: the generator forces
  // NoToneMapping and renders into a linear target, so the environment still
  // receives the linear radiance it wants.
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * Painterly sky dome plus a one-time IBL bake for standard/physical materials.
 *
 * Compact profiles keep the dome and skip the PMREM hitch; desktop bakes once
 * at startup so metal, water, and the ranger have something real to reflect.
 */
export class WorldSky {
  private readonly mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private environmentTarget?: THREE.WebGLRenderTarget;
  private disposed = false;

  constructor(
    private readonly scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    compact: boolean,
  ) {
    this.mesh = createSkyMesh(this.scene);
    this.scene.background = null;
    renderer.toneMappingExposure = WORLD_ZELDA_EXPOSURE;

    if (!compact) {
      this.initializeEnvironment(renderer);
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    const environmentTarget = this.environmentTarget;
    this.environmentTarget = undefined;
    if (
      environmentTarget &&
      this.scene.environment === environmentTarget.texture
    ) {
      this.scene.environment = null;
    }
    disposeResources([
      { dispose: () => this.mesh.removeFromParent() },
      this.mesh.geometry,
      this.mesh.material,
      environmentTarget,
    ]);
  }

  private initializeEnvironment(renderer: THREE.WebGLRenderer): void {
    let environmentTarget: THREE.WebGLRenderTarget | undefined;
    let pmrem: THREE.PMREMGenerator | undefined;
    let bakeMaterial: THREE.ShaderMaterial | undefined;
    try {
      pmrem = new THREE.PMREMGenerator(renderer);
      const bakeScene = new THREE.Scene();
      const bakeMesh = new THREE.Mesh(this.mesh.geometry, this.mesh.material.clone());
      bakeMaterial = bakeMesh.material;
      bakeScene.add(bakeMesh);
      environmentTarget = pmrem.fromScene(bakeScene, 0, 0.1, SKY_RADIUS);
      this.scene.environment = environmentTarget.texture;
      this.environmentTarget = environmentTarget;
    } catch (error) {
      if (
        environmentTarget &&
        this.scene.environment === environmentTarget.texture
      ) {
        this.scene.environment = null;
      }
      try {
        disposeResources([environmentTarget]);
      } catch (cleanupError) {
        console.warn(
          "[Drusniel World] Sky environment cleanup failed.",
          cleanupError,
        );
      }
      console.warn(
        "[Drusniel World] Sky environment bake unavailable; continuing without IBL.",
        error,
      );
    } finally {
      if (bakeMaterial) {
        try {
          bakeMaterial.dispose();
        } catch (cleanupError) {
          console.warn(
            "[Drusniel World] Sky bake material cleanup failed.",
            cleanupError,
          );
        }
      }
      if (pmrem) {
        try {
          pmrem.dispose();
        } catch (cleanupError) {
          console.warn(
            "[Drusniel World] Sky PMREM generator cleanup failed.",
            cleanupError,
          );
        }
      }
    }
  }
}

function createSkyMesh(
  scene: THREE.Scene,
): THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> {
  let material: THREE.ShaderMaterial | undefined;
  let geometry: THREE.SphereGeometry | undefined;
  let mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> | undefined;
  try {
    material = new THREE.ShaderMaterial({
      name: "world-sky-dome",
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uSkyZenith: { value: linearColor(WORLD_SKY_ZENITH) },
        uSkyHorizon: { value: linearColor(WORLD_SKY_HORIZON) },
        uSkyHaze: { value: linearColor(WORLD_SKY_HAZE) },
        uSkySunDirection: { value: SUN_DIRECTION.clone() },
        uSkySunColor: { value: linearColor(WORLD_SKY_SUN) },
      },
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      toneMapped: true,
    });
    geometry = new THREE.SphereGeometry(SKY_RADIUS, 32, 16);
    mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1000;
    mesh.name = "world-sky-dome";
    scene.add(mesh);
    return mesh;
  } catch (error) {
    try {
      disposeResources([
        { dispose: () => mesh?.removeFromParent() },
        geometry,
        material,
      ]);
    } catch (cleanupError) {
      console.warn(
        "[Drusniel World] Sky construction cleanup failed.",
        cleanupError,
      );
    }
    throw error;
  }
}

/**
 * Colour management is on, so `new THREE.Color(hex)` has already taken the sRGB
 * literal into the linear working space. Calling `convertSRGBToLinear` on the
 * result, as this did, applied the transfer function a second time and left
 * every sky colour far darker and more olive than the palette it was read from.
 */
function linearColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}
