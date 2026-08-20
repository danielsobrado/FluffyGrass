import * as THREE from "three";
import type { GrassArtDirection } from "../grass/GrassArtDirection";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";
import { WorldCloudShadowMap } from "../world/sky/WorldCloudShadowMap";
import { WorldCloudShadowSceneIntegrator } from "../world/sky/WorldCloudShadowSceneIntegrator";
import type { WorldCloudShadowUniforms } from "../world/sky/WorldCloudShadowUniforms";
import { WORLD_CLOUD_TIME_WRAP_SECONDS } from "../world/sky/WorldCloudWeather";
import { WorldSky } from "../world/sky/WorldSky";
import { WorldCloudShadowDebugPanel } from "./WorldCloudShadowDebugPanel";
import { WorldCloudEnvironmentLighting } from "./WorldCloudEnvironmentLighting";
import {
  WORLD_DEFAULT_COMPACT_FOG_DENSITY,
  WORLD_DEFAULT_DESKTOP_FOG_DENSITY,
  WORLD_DEFAULT_FOG,
  WORLD_DEFAULT_HEMISPHERE_GROUND,
  WORLD_DEFAULT_HEMISPHERE_INTENSITY,
  WORLD_DEFAULT_HEMISPHERE_SKY,
  WORLD_DEFAULT_SUN,
  WORLD_DEFAULT_SUN_INTENSITY,
  WORLD_SUN_DIRECTION,
  WORLD_SUN_SHADOW_DISTANCE,
  WORLD_SUN_SHADOW_HALF_EXTENT,
} from "./WorldEnvironmentTuning";

const SUN_DIRECTION = new THREE.Vector3(...WORLD_SUN_DIRECTION).normalize();
const UP_AXIS = new THREE.Vector3(0, 1, 0);
const SHADOW_AXIS_X = new THREE.Vector3()
  .crossVectors(UP_AXIS, SUN_DIRECTION)
  .normalize();
const SHADOW_AXIS_Y = new THREE.Vector3()
  .crossVectors(SUN_DIRECTION, SHADOW_AXIS_X)
  .normalize();
const MAX_ENVIRONMENT_DELTA_SECONDS = 0.25;

export class WorldEnvironmentController {
  private readonly sun: THREE.DirectionalLight;
  private readonly hemisphere: THREE.HemisphereLight;
  private readonly sky: WorldSky;
  private readonly cloudLighting: WorldCloudEnvironmentLighting;
  private readonly cloudShadow: WorldCloudShadowMap;
  private readonly cloudShadowIntegrator: WorldCloudShadowSceneIntegrator;
  private readonly sunShadowsAvailable: boolean;
  private readonly shadowMapSize: number;
  private readonly shadowTexelSize: number;
  private cloudShadowDebug?: WorldCloudShadowDebugPanel;
  private shadowFocusX = Number.NaN;
  private shadowFocusY = Number.NaN;
  private shadowFocusZ = Number.NaN;
  private elapsedSeconds = 0;
  private disposed = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly renderer: THREE.WebGLRenderer,
    private readonly profile: RuntimeProfile,
    shadowsEnabled: boolean,
  ) {
    this.sunShadowsAvailable = shadowsEnabled;
    this.hemisphere = new THREE.HemisphereLight(
      WORLD_DEFAULT_HEMISPHERE_SKY,
      WORLD_DEFAULT_HEMISPHERE_GROUND,
      WORLD_DEFAULT_HEMISPHERE_INTENSITY,
    );
    this.sun = new THREE.DirectionalLight(
      WORLD_DEFAULT_SUN,
      WORLD_DEFAULT_SUN_INTENSITY,
    );
    this.cloudLighting = new WorldCloudEnvironmentLighting(
      this.scene,
      this.renderer,
      this.profile,
      this.sun,
      this.hemisphere,
    );
    this.cloudShadow = new WorldCloudShadowMap(this.renderer, this.profile);
    this.cloudShadowIntegrator = new WorldCloudShadowSceneIntegrator(
      this.scene,
      this.cloudShadow.getUniforms(),
    );
    this.shadowMapSize = Math.max(
      1,
      Math.min(
        this.profile.shadowMapSize,
        this.renderer.capabilities.maxTextureSize,
      ),
    );
    this.shadowTexelSize =
      (2 * WORLD_SUN_SHADOW_HALF_EXTENT) / this.shadowMapSize;
    this.sun.position
      .copy(SUN_DIRECTION)
      .multiplyScalar(WORLD_SUN_SHADOW_DISTANCE);
    this.sun.castShadow = shadowsEnabled;
    this.configureShadow();

    let sky: WorldSky | undefined;
    try {
      sky = new WorldSky(this.scene, this.renderer, this.profile);
      this.sky = sky;
      this.scene.add(this.hemisphere, this.sun, this.sun.target);
      this.cloudShadowDebug = WorldCloudShadowDebugPanel.createIfRequested(
        this.scene,
        {
          getDiagnostics: () => this.getCloudShadowDiagnostics(),
          readPixels: (target) => this.cloudShadow.readDebugPixels(target),
          setSpatialEnabled: (enabled) => this.setCloudShadowsEnabled(enabled),
          setDirectAttenuationEnabled: (enabled) =>
            this.setCloudDirectAttenuationEnabled(enabled),
          setSunShadowsEnabled: (enabled) =>
            this.setSunShadowsEnabled(enabled),
        },
      );
      this.applyArtDirection();
    } catch (error) {
      disposeSafely(this.cloudShadowDebug, "Cloud shadow diagnostics");
      disposeSafely(sky, "Sky");
      disposeSafely(this.cloudShadowIntegrator, "Cloud shadow integration");
      disposeSafely(this.cloudShadow, "Cloud shadow map");
      disposeSafely(this.cloudLighting, "Cloud lighting");
      disposeSafely(this.sun.shadow, "Sun shadow");
      this.scene.remove(this.hemisphere, this.sun, this.sun.target);
      throw error;
    }
  }

  getCloudShadowUniforms(): WorldCloudShadowUniforms {
    return this.cloudShadow.getUniforms();
  }

  getCloudShadowDiagnostics(): ReturnType<WorldCloudShadowMap["getDiagnostics"]> & {
    patchedMaterials: number;
  } {
    return {
      ...this.cloudShadow.getDiagnostics(),
      ...this.cloudShadowIntegrator.getDiagnostics(),
    };
  }

  setCloudShadowsEnabled(enabled: boolean): void {
    this.cloudShadow.setEnabled(enabled);
  }

  setCloudDirectAttenuationEnabled(enabled: boolean): void {
    this.cloudLighting.setDirectAttenuationEnabled(enabled);
  }

  setSunShadowsEnabled(enabled: boolean): void {
    this.sun.castShadow = this.sunShadowsAvailable && enabled;
    this.sun.shadow.needsUpdate = true;
  }

  applyArtDirection(_direction?: GrassArtDirection): void {
    if (this.disposed) {
      return;
    }
    this.scene.fog = new THREE.FogExp2(
      WORLD_DEFAULT_FOG,
      this.profile.compact
        ? WORLD_DEFAULT_COMPACT_FOG_DENSITY
        : WORLD_DEFAULT_DESKTOP_FOG_DENSITY,
    );
    this.cloudLighting.apply();
  }

  update(deltaSeconds: number, focus: THREE.Vector3): void {
    if (this.disposed || !isFiniteVector(focus)) {
      return;
    }
    const safeDelta = THREE.MathUtils.clamp(
      Number.isFinite(deltaSeconds) ? deltaSeconds : 0,
      0,
      MAX_ENVIRONMENT_DELTA_SECONDS,
    );
    this.elapsedSeconds =
      (this.elapsedSeconds + safeDelta) % WORLD_CLOUD_TIME_WRAP_SECONDS;
    this.cloudLighting.update(safeDelta, focus, this.elapsedSeconds);
    this.cloudShadow.update(
      focus,
      this.elapsedSeconds,
      this.cloudLighting.getDirectTransmittance(),
    );
    this.cloudShadowIntegrator.update(safeDelta);
    this.cloudShadowDebug?.update(safeDelta);
    this.sky.update(this.elapsedSeconds, focus);
    this.updateShadow(focus);
  }

  updateShadow(focus: THREE.Vector3): void {
    if (
      this.disposed ||
      !this.sun.castShadow ||
      !Number.isFinite(focus.x) ||
      !Number.isFinite(focus.y) ||
      !Number.isFinite(focus.z)
    ) {
      return;
    }
    if (
      focus.x === this.shadowFocusX &&
      focus.y === this.shadowFocusY &&
      focus.z === this.shadowFocusZ
    ) {
      return;
    }
    this.shadowFocusX = focus.x;
    this.shadowFocusY = focus.y;
    this.shadowFocusZ = focus.z;

    const snappedX =
      Math.round(focus.dot(SHADOW_AXIS_X) / this.shadowTexelSize) *
      this.shadowTexelSize;
    const snappedY =
      Math.round(focus.dot(SHADOW_AXIS_Y) / this.shadowTexelSize) *
      this.shadowTexelSize;
    const alongLight = focus.dot(SUN_DIRECTION);

    this.sun.target.position
      .copy(SHADOW_AXIS_X)
      .multiplyScalar(snappedX)
      .addScaledVector(SHADOW_AXIS_Y, snappedY)
      .addScaledVector(SUN_DIRECTION, alongLight);
    this.sun.position
      .copy(this.sun.target.position)
      .addScaledVector(SUN_DIRECTION, WORLD_SUN_SHADOW_DISTANCE);
    this.sun.target.updateMatrixWorld();
    this.sun.updateMatrixWorld();
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    disposeSafely(this.cloudShadowDebug, "Cloud shadow diagnostics");
    this.cloudShadowDebug = undefined;
    disposeSafely(this.sky, "Sky");
    disposeSafely(this.cloudShadowIntegrator, "Cloud shadow integration");
    disposeSafely(this.cloudShadow, "Cloud shadow map");
    disposeSafely(this.cloudLighting, "Cloud lighting");
    disposeSafely(this.sun.shadow, "Sun shadow");
    this.scene.remove(this.hemisphere, this.sun, this.sun.target);
  }

  private configureShadow(): void {
    this.sun.shadow.camera.left = -WORLD_SUN_SHADOW_HALF_EXTENT;
    this.sun.shadow.camera.right = WORLD_SUN_SHADOW_HALF_EXTENT;
    this.sun.shadow.camera.top = WORLD_SUN_SHADOW_HALF_EXTENT;
    this.sun.shadow.camera.bottom = -WORLD_SUN_SHADOW_HALF_EXTENT;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = WORLD_SUN_SHADOW_DISTANCE * 2;
    this.sun.shadow.camera.updateProjectionMatrix();
    this.sun.shadow.normalBias = 0.02;
    this.sun.shadow.radius = 3;
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.mapSize.set(this.shadowMapSize, this.shadowMapSize);
  }
}

function isFiniteVector(value: THREE.Vector3): boolean {
  return (
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.z)
  );
}

function disposeSafely(resource: { dispose(): void } | undefined, label: string): void {
  if (!resource) {
    return;
  }
  try {
    resource.dispose();
  } catch (error) {
    console.warn(`[Drusniel World] ${label} cleanup failed.`, error);
  }
}
