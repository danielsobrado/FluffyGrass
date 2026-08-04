import * as THREE from "three";
import {
  GRASS_ART_DIRECTIONS,
  DEFAULT_GRASS_ART_DIRECTION_KEY,
  type GrassArtDirection,
} from "../../grass/GrassArtDirection";
import type { GrassConfig, GrassLodConfig } from "../../grass/GrassConfig";
import { GrassConfigLoader } from "../../grass/internal/GrassConfigLoader";
import { GrassNearMaterial } from "../../grass/materials/GrassNearMaterial";
import { WindField } from "../../grass/wind/WindField";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import { APP_VERSION } from "../../version";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import { WorldSingleBladeTileFactory } from "./WorldSingleBladeTileFactory";
import { WorldSingleBladeTileField } from "./WorldSingleBladeTileField";

const BASE_SEED_SALT = 0x6a09e667;
const ULTRA_NEAR_SEED_SALT = 0x3c6ef372;
const BASE_TILES_PER_FRAME = 1;
const DESKTOP_ULTRA_NEAR_TILES_PER_FRAME = 2;
const COMPACT_ULTRA_NEAR_TILES_PER_FRAME = 1;
const SINGLE_BLADE_BOUNDS_MARGIN = 2;
const MAXIMUM_ART_NEAR_FADE_DISTANCE = Math.max(
  ...Object.values(GRASS_ART_DIRECTIONS).map(
    (direction) => direction.nearDistance + direction.transitionDistance,
  ),
);

export class WorldNearGrassField {
  private readonly configLoader = new GrassConfigLoader();
  private readonly baseMaterial = new GrassNearMaterial();
  private readonly ultraNearMaterial = new GrassNearMaterial();
  private readonly wind = new WindField();
  private factory?: WorldSingleBladeTileFactory;
  private baseField?: WorldSingleBladeTileField;
  private baseDetailedField?: WorldSingleBladeTileField;
  private ultraNearField?: WorldSingleBladeTileField;
  private initialization?: Promise<void>;
  private artDirection: GrassArtDirection =
    GRASS_ART_DIRECTIONS[DEFAULT_GRASS_ART_DIRECTION_KEY];
  private initialized = false;
  private disposed = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly field: TerrainField,
    private readonly worldConfig: WorldConfig,
    private readonly profile: RuntimeProfile,
  ) {
    this.baseMaterial.material.name = "world-grass-single-blade-material";
    this.ultraNearMaterial.material.name =
      "world-grass-ultra-near-single-blade-material";
  }

  initialize(grassConfig?: GrassConfig): Promise<void> {
    if (this.disposed) {
      return Promise.reject(new Error("WorldNearGrassField has been disposed."));
    }
    if (!this.initialization) {
      this.initialization = this.initializeInternal(grassConfig);
    }
    return this.initialization;
  }

  update(deltaSeconds: number, focus: THREE.Vector3): void {
    if (!this.initialized || this.disposed) {
      return;
    }

    const elapsedSeconds = this.wind.update(deltaSeconds);
    this.baseMaterial.update(elapsedSeconds);
    this.ultraNearMaterial.update(elapsedSeconds);

    // Build the very close layer first so the player sees the requested
    // density immediately after spawn or a tile crossing.
    this.ultraNearField?.update(focus);
    this.baseDetailedField?.update(focus);
    this.baseField?.update(focus);
  }

  getBladeCount(): number {
    return (
      (this.baseField?.getBladeCount() ?? 0) +
      (this.ultraNearField?.getBladeCount() ?? 0)
    );
  }

  setArtDirection(direction: GrassArtDirection): void {
    this.artDirection = direction;
    this.baseMaterial.applyArtDirection(direction);
    this.ultraNearMaterial.applyArtDirection(direction);
    this.baseMaterial.configureLod({
      nearMaxDistance: direction.nearDistance,
      midMaxDistance: direction.midDistance,
      farMaxDistance: direction.farDistance,
      transitionDistance: direction.transitionDistance,
      hysteresisDistance: this.worldConfig.grassHysteresisDistance,
    });
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.initialized = false;
    this.baseField?.dispose();
    this.baseDetailedField?.dispose();
    this.ultraNearField?.dispose();
    this.baseField = undefined;
    this.baseDetailedField = undefined;
    this.ultraNearField = undefined;
    this.factory?.dispose();
    this.factory = undefined;
    this.baseMaterial.material.dispose();
    this.ultraNearMaterial.material.dispose();
  }

  private async initializeInternal(
    providedGrassConfig?: GrassConfig,
  ): Promise<void> {
    const grassConfig =
      providedGrassConfig ??
      (await this.configLoader.load(
        `./config/grass.yaml?v=${encodeURIComponent(APP_VERSION)}`,
      ));
    if (this.disposed) {
      return;
    }

    const baseLodConfig: GrassLodConfig = {
      nearMaxDistance: this.artDirection.nearDistance,
      midMaxDistance: this.artDirection.midDistance,
      farMaxDistance: this.artDirection.farDistance,
      transitionDistance: this.artDirection.transitionDistance,
      hysteresisDistance: this.worldConfig.grassHysteresisDistance,
    };
    const ultraTransitionHalf =
      this.worldConfig.grassUltraNearTransitionDistance * 0.5;
    const ultraNearLodConfig: GrassLodConfig = {
      nearMaxDistance:
        this.worldConfig.grassUltraNearDistance + ultraTransitionHalf,
      midMaxDistance: this.worldConfig.grassMidDistance,
      farMaxDistance: this.worldConfig.grassFarDistance,
      transitionDistance: ultraTransitionHalf,
      hysteresisDistance: 0,
    };

    this.baseMaterial.configure(grassConfig.material, grassConfig.wind);
    this.baseMaterial.applyArtDirection(this.artDirection);
    this.baseMaterial.configureLod(baseLodConfig);
    this.baseMaterial.configureDetailLod(ultraNearLodConfig);
    this.ultraNearMaterial.configure(grassConfig.material, grassConfig.wind);
    this.ultraNearMaterial.applyArtDirection(this.artDirection);
    this.ultraNearMaterial.configureLod(ultraNearLodConfig);

    const factory = new WorldSingleBladeTileFactory(
      this.field,
      this.worldConfig,
      this.profile,
      grassConfig,
    );
    const tileSize = this.worldConfig.grassNearTileSize;
    this.factory = factory;
    this.baseField = new WorldSingleBladeTileField(
      this.scene,
      factory,
      tileSize,
      {
        namePrefix: "world-grass-single-blades",
        visibilityRadius:
          MAXIMUM_ART_NEAR_FADE_DISTANCE +
          SINGLE_BLADE_BOUNDS_MARGIN,
        densityMultiplier: 1,
        // The base layer keeps every blade but uses the same one-triangle
        // silhouette as the mid LOD. The segmented ultra-near layer supplies
        // the bend detail that is visible while walking through the grass.
        bladeSegments: 1,
        receiveShadows: false,
        detailMode: 1,
        interactionDistance:
          this.worldConfig.grassInteractionRadius +
          this.worldConfig.grassInteractionTrailLength,
        seedSalt: BASE_SEED_SALT,
        material: this.baseMaterial,
        tilesPerFrame: BASE_TILES_PER_FRAME,
        // The shader follows the camera continuously; reconcile the small
        // 8 m tile set as well so moving inside a tile cannot omit the outer
        // near-fade ring.
        reconcileEveryFrame: true,
      },
    );

    this.baseDetailedField = new WorldSingleBladeTileField(
      this.scene,
      factory,
      tileSize,
      {
        namePrefix: "world-grass-ultra-near-base-detail",
        visibilityRadius:
          this.worldConfig.grassUltraNearDistance +
          this.worldConfig.grassUltraNearTransitionDistance +
          SINGLE_BLADE_BOUNDS_MARGIN,
        densityMultiplier: 1,
        bladeSegments: grassConfig.geometry.bladeSegments,
        receiveShadows: true,
        detailMode: 2,
        interactionDistance:
          this.worldConfig.grassInteractionRadius +
          this.worldConfig.grassInteractionTrailLength,
        seedSalt: BASE_SEED_SALT,
        material: this.baseMaterial,
        tilesPerFrame: this.profile.compact
          ? COMPACT_ULTRA_NEAR_TILES_PER_FRAME
          : DESKTOP_ULTRA_NEAR_TILES_PER_FRAME,
        reconcileEveryFrame: true,
      },
    );

    const ultraAdditionalDensity =
      this.worldConfig.grassUltraNearDensityMultiplier - 1;
    if (ultraAdditionalDensity > 0) {
      this.ultraNearField = new WorldSingleBladeTileField(
        this.scene,
        factory,
        tileSize,
        {
          namePrefix: "world-grass-ultra-near-blades",
          visibilityRadius:
            this.worldConfig.grassUltraNearDistance +
            this.worldConfig.grassUltraNearTransitionDistance,
          densityMultiplier: ultraAdditionalDensity,
          bladeSegments: grassConfig.geometry.bladeSegments,
          receiveShadows: true,
          detailMode: 0,
          interactionDistance:
            this.worldConfig.grassInteractionRadius +
            this.worldConfig.grassInteractionTrailLength,
          seedSalt: ULTRA_NEAR_SEED_SALT,
          material: this.ultraNearMaterial,
          tilesPerFrame: this.profile.compact
            ? COMPACT_ULTRA_NEAR_TILES_PER_FRAME
            : DESKTOP_ULTRA_NEAR_TILES_PER_FRAME,
          reconcileEveryFrame: true,
        },
      );
    }

    this.initialized = true;
  }
}
