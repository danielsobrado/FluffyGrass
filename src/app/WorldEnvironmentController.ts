import * as THREE from "three";
import type { GrassArtDirection } from "../grass/GrassArtDirection";
import type { RuntimeProfile } from "../runtime/RuntimeConfig";
import {
  WORLD_DEFAULT_COMPACT_FOG_DENSITY,
  WORLD_DEFAULT_DESKTOP_FOG_DENSITY,
  WORLD_DEFAULT_HEMISPHERE_GROUND,
  WORLD_DEFAULT_HEMISPHERE_INTENSITY,
  WORLD_DEFAULT_HEMISPHERE_SKY,
  WORLD_DEFAULT_SKY,
  WORLD_DEFAULT_SUN,
  WORLD_DEFAULT_SUN_INTENSITY,
  WORLD_SUN_DIRECTION,
  WORLD_SUN_SHADOW_DISTANCE,
  WORLD_SUN_SHADOW_HALF_EXTENT,
  WORLD_ZELDA_EXPOSURE,
  WORLD_ZELDA_FOG,
  WORLD_ZELDA_FOG_DENSITY,
  WORLD_ZELDA_HEMISPHERE_GROUND,
  WORLD_ZELDA_HEMISPHERE_INTENSITY,
  WORLD_ZELDA_SKY,
  WORLD_ZELDA_SUN,
} from "./WorldEnvironmentTuning";

const SUN_DIRECTION = new THREE.Vector3(...WORLD_SUN_DIRECTION).normalize();
const UP_AXIS = new THREE.Vector3(0, 1, 0);

export class WorldEnvironmentController {
  private readonly sun: THREE.DirectionalLight;
  private readonly hemisphere: THREE.HemisphereLight;
  private readonly shadowAxisX = new THREE.Vector3();
  private readonly shadowAxisY = new THREE.Vector3();

  constructor(
    private readonly scene: THREE.Scene,
    private readonly renderer: THREE.WebGLRenderer,
    private readonly profile: RuntimeProfile,
    shadowsEnabled: boolean,
  ) {
    this.hemisphere = new THREE.HemisphereLight(
      WORLD_DEFAULT_HEMISPHERE_SKY,
      WORLD_DEFAULT_HEMISPHERE_GROUND,
      WORLD_DEFAULT_HEMISPHERE_INTENSITY,
    );
    this.sun = new THREE.DirectionalLight(
      WORLD_DEFAULT_SUN,
      WORLD_DEFAULT_SUN_INTENSITY,
    );
    this.sun.position
      .copy(SUN_DIRECTION)
      .multiplyScalar(WORLD_SUN_SHADOW_DISTANCE);
    this.sun.castShadow = shadowsEnabled;
    this.configureShadow();
    this.scene.add(this.hemisphere, this.sun, this.sun.target);
    this.applyArtDirection();
  }

  applyArtDirection(direction?: GrassArtDirection): void {
    const zelda = direction?.key === "zelda-field";
    this.scene.background = new THREE.Color(
      zelda ? WORLD_ZELDA_SKY : WORLD_DEFAULT_SKY,
    );
    this.scene.fog = new THREE.FogExp2(
      zelda ? WORLD_ZELDA_FOG : WORLD_DEFAULT_SKY,
      zelda
        ? WORLD_ZELDA_FOG_DENSITY
        : this.profile.compact
          ? WORLD_DEFAULT_COMPACT_FOG_DENSITY
          : WORLD_DEFAULT_DESKTOP_FOG_DENSITY,
    );
    this.renderer.toneMappingExposure = zelda ? WORLD_ZELDA_EXPOSURE : 1;
    this.sun.color.set(zelda ? WORLD_ZELDA_SUN : WORLD_DEFAULT_SUN);
    this.sun.intensity = WORLD_DEFAULT_SUN_INTENSITY;
    this.hemisphere.color.set(
      zelda ? WORLD_ZELDA_SKY : WORLD_DEFAULT_HEMISPHERE_SKY,
    );
    this.hemisphere.groundColor.set(
      zelda ? WORLD_ZELDA_HEMISPHERE_GROUND : WORLD_DEFAULT_HEMISPHERE_GROUND,
    );
    this.hemisphere.intensity = zelda
      ? WORLD_ZELDA_HEMISPHERE_INTENSITY
      : WORLD_DEFAULT_HEMISPHERE_INTENSITY;
  }

  updateShadow(focus: THREE.Vector3): void {
    if (!this.sun.castShadow) {
      return;
    }

    const texelSize =
      (2 * WORLD_SUN_SHADOW_HALF_EXTENT) /
      Math.max(1, this.profile.shadowMapSize);
    this.shadowAxisX.crossVectors(UP_AXIS, SUN_DIRECTION).normalize();
    this.shadowAxisY.crossVectors(SUN_DIRECTION, this.shadowAxisX);
    const snappedX =
      Math.round(focus.dot(this.shadowAxisX) / texelSize) * texelSize;
    const snappedY =
      Math.round(focus.dot(this.shadowAxisY) / texelSize) * texelSize;
    const alongLight = focus.dot(SUN_DIRECTION);

    this.sun.target.position
      .copy(this.shadowAxisX)
      .multiplyScalar(snappedX)
      .addScaledVector(this.shadowAxisY, snappedY)
      .addScaledVector(SUN_DIRECTION, alongLight);
    this.sun.position
      .copy(this.sun.target.position)
      .addScaledVector(SUN_DIRECTION, WORLD_SUN_SHADOW_DISTANCE);
    this.sun.target.updateMatrixWorld();
    this.sun.updateMatrixWorld();
  }

  dispose(): void {
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
    this.sun.shadow.mapSize.set(
      this.profile.shadowMapSize,
      this.profile.shadowMapSize,
    );
  }
}
