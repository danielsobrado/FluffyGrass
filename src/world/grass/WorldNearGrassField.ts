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
const NEAR_FIELD_ALTITUDE_MARGIN = 4;
const DESKTOP_NEAR_BUILD_BUDGET_MS = 2.5;
const COMPACT_NEAR_BUILD_BUDGET_MS = 1.5;
export class WorldNearGrassField {
  private readonly configLoader = new GrassConfigLoader();
  // The base and detail layers are complementary halves of the same near band
  // and must run with different detailMode values. They used to share one
  // material, which three cannot express: a shared material uploads its custom
  // uniforms once per contiguous run of draws, so whichever layer happened to
  // draw first silently decided the mode for both. Separate materials make the
  // split real.
  private readonly baseMaterial = new GrassNearMaterial({
    name: "world-grass-single-blade-material",
    cacheKey: "grass-near-material-v18-base-vertex-palette",
    detailMode: 1,
    ditherSeed: BASE_SEED_SALT,
    // One triangle per blade, and the layer that covers the most screen area.
    vertexPalette: true,
    interactive: true,
    // This is the layer that owns the band where blades fall below a pixel
    // wide. The two ultra-near layers never reach it, and the mid patches past
    // it are a different representation entirely.
    subPixelWidth: true,
  });
  private readonly baseDetailMaterial = new GrassNearMaterial({
    name: "world-grass-base-detail-material",
    cacheKey: "grass-near-material-v17-detail",
    detailMode: 2,
    ditherSeed: BASE_SEED_SALT,
    interactive: true,
  });
  private readonly ultraNearMaterial = new GrassNearMaterial({
    name: "world-grass-ultra-near-single-blade-material",
    cacheKey: "grass-near-material-v17-ultra",
    detailMode: 0,
    ditherSeed: ULTRA_NEAR_SEED_SALT,
    interactive: true,
  });
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
  ) {}

  initialize(grassConfig?: GrassConfig): Promise<void> {
    if (this.disposed) {
      return Promise.reject(new Error("WorldNearGrassField has been disposed."));
    }
    if (!this.initialization) {
      this.initialization = this.initializeInternal(grassConfig);
    }
    return this.initialization;
  }

  update(
    deltaSeconds: number,
    focus: THREE.Vector3,
    focusGroundHeight?: number,
    buildDeadline = Number.POSITIVE_INFINITY,
  ): void {
    if (!this.initialized || this.disposed) {
      return;
    }

    // Near-blade residency is horizontal, while the shader's LOD distance is
    // three-dimensional. Suspend these dense tiles when a fly camera is high
    // enough that every local blade would be rejected in the vertex shader.
    const nearFieldsEnabled =
      focusGroundHeight === undefined ||
      focus.y - focusGroundHeight <=
        this.resolveBaseVisibilityRadius(this.artDirection) +
          NEAR_FIELD_ALTITUDE_MARGIN;
    this.baseField?.setEnabled(nearFieldsEnabled);
    this.baseDetailedField?.setEnabled(nearFieldsEnabled);
    this.ultraNearField?.setEnabled(nearFieldsEnabled);
    if (!nearFieldsEnabled) {
      return;
    }

    const elapsedSeconds = this.wind.update(deltaSeconds);
    this.baseMaterial.update(elapsedSeconds);
    this.baseDetailMaterial.update(elapsedSeconds);
    this.ultraNearMaterial.update(elapsedSeconds);

    // Build the very close layer first so the player sees the requested
    // density immediately after spawn or a tile crossing.
    const nearBuildBudget = this.profile.compact
      ? COMPACT_NEAR_BUILD_BUDGET_MS
      : DESKTOP_NEAR_BUILD_BUDGET_MS;
    const nearBuildDeadline = Math.min(
      buildDeadline,
      performance.now() + nearBuildBudget,
    );
    // The detail layer reuses the wider base layer's placement buffers. Let it
    // claim any cache hits first, then spend the remaining slice on unique
    // ultra-near density and new base placements.
    this.baseDetailedField?.update(focus, nearBuildDeadline);
    this.ultraNearField?.update(focus, nearBuildDeadline);
    this.baseField?.update(focus, nearBuildDeadline);
  }

  getBladeCount(): number {
    return (
      (this.baseField?.getBladeCount() ?? 0) +
      (this.ultraNearField?.getBladeCount() ?? 0)
    );
  }

  // Report incremental tile-build slices alongside the streamed chunk timings.
  getBuildDiagnostics(): {
    nearTiles: number;
    nearTileBuildMs: number;
    maxNearTileBuildMs: number;
  } {
    const fields = [
      this.baseField,
      this.baseDetailedField,
      this.ultraNearField,
    ];
    let nearTiles = 0;
    let nearTileBuildMs = 0;
    let maxNearTileBuildMs = 0;
    for (const field of fields) {
      if (!field) {
        continue;
      }
      nearTiles += field.getTileCount();
      nearTileBuildMs += field.getLastBuildMs();
      maxNearTileBuildMs = Math.max(maxNearTileBuildMs, field.getMaxBuildMs());
    }
    return { nearTiles, nearTileBuildMs, maxNearTileBuildMs };
  }

  setArtDirection(direction: GrassArtDirection): void {
    this.artDirection = direction;
    this.ultraNearMaterial.applyArtDirection(direction);
    const lodConfig: GrassLodConfig = {
      nearMaxDistance: direction.nearDistance,
      midMaxDistance: direction.midDistance,
      farMaxDistance: direction.farDistance,
      transitionDistance: direction.transitionDistance,
      hysteresisDistance: this.worldConfig.grassHysteresisDistance,
    };
    for (const material of [this.baseMaterial, this.baseDetailMaterial]) {
      material.applyArtDirection(direction);
      material.configureLod(lodConfig);
    }
    // Tiles past the active preset's near fade contribute no blades at all, so
    // there is no reason to build, stream, or draw them. The radius used to be
    // fixed at the maximum across every preset.
    this.baseField?.setVisibilityRadius(
      this.resolveBaseVisibilityRadius(direction),
    );
    this.baseField?.setLodFade(
      direction.nearDistance,
      direction.transitionDistance,
    );
  }

  /**
   * World size of one device pixel per metre of camera distance. Only the base
   * layer compiles the sub-pixel width clamp that reads it.
   */
  setViewportPixelScale(pixelWorldScale: number): void {
    this.baseMaterial.setViewportPixelScale(pixelWorldScale);
  }

  private resolveBaseVisibilityRadius(direction: GrassArtDirection): number {
    return (
      direction.nearDistance +
      direction.transitionDistance +
      SINGLE_BLADE_BOUNDS_MARGIN
    );
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
    this.baseDetailMaterial.material.dispose();
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

    // The base and detail layers partition the same blade set against the same
    // detail radius, so they must agree on every LOD input.
    for (const material of [this.baseMaterial, this.baseDetailMaterial]) {
      material.configure(grassConfig.material, grassConfig.wind);
      material.applyArtDirection(this.artDirection);
      material.configureLod(baseLodConfig);
      material.configureDetailLod(ultraNearLodConfig);
    }
    this.ultraNearMaterial.configure(grassConfig.material, grassConfig.wind);
    this.ultraNearMaterial.applyArtDirection(this.artDirection);
    this.ultraNearMaterial.configureLod(ultraNearLodConfig);
    // Matches the half-width `createSingleBladeGeometry` builds from the mean
    // configured blade width, which is what the sub-pixel clamp widens from.
    this.baseMaterial.setBladeHalfWidth(
      (grassConfig.geometry.bladeWidthMin + grassConfig.geometry.bladeWidthMax) *
        0.25,
    );

    const trailBend = {
      maxAngleRadians: THREE.MathUtils.degToRad(
        this.worldConfig.grassTrailMaxAngleDegrees,
      ),
      wobbleFrequency: this.worldConfig.grassTrailWobbleFrequency,
      wobbleAmplitude: this.worldConfig.grassTrailWobbleAmplitude,
    };
    for (const material of [
      this.baseMaterial,
      this.baseDetailMaterial,
      this.ultraNearMaterial,
    ]) {
      material.configureTrail(trailBend);
    }

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
        visibilityRadius: this.resolveBaseVisibilityRadius(this.artDirection),
        densityMultiplier: 1,
        // The base layer keeps every blade but uses the same one-triangle
        // silhouette as the mid LOD. The segmented ultra-near layer supplies
        // the bend detail that is visible while walking through the grass.
        bladeSegments: 1,
        receiveShadows: false,
        seedSalt: BASE_SEED_SALT,
        material: this.baseMaterial,
        tilesPerFrame: BASE_TILES_PER_FRAME,
        // The shader follows the camera continuously; reconcile the small
        // 8 m tile set as well so moving inside a tile cannot omit the outer
        // near-fade ring.
        reconcileEveryFrame: true,
        lodNearDistance: baseLodConfig.nearMaxDistance,
        lodTransitionDistance: baseLodConfig.transitionDistance,
        // detailMode 1 drops blades inside the detail radius, which is not a
        // prefix of the dither order, so tiles that reach it draw in full.
        // Coverage is 1 that close anyway, so nothing is lost.
        lodGuardDistance:
          ultraNearLodConfig.nearMaxDistance +
          ultraNearLodConfig.transitionDistance,
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
        seedSalt: BASE_SEED_SALT,
        material: this.baseDetailMaterial,
        tilesPerFrame: this.profile.compact
          ? COMPACT_ULTRA_NEAR_TILES_PER_FRAME
          : DESKTOP_ULTRA_NEAR_TILES_PER_FRAME,
        reconcileEveryFrame: true,
        cachedPlacementOnly: true,
        // detailMode 2 keeps `dither <= min(nearCoverage, detailCoverage)`,
        // still a prefix. The detail fade is the tighter of the two.
        lodNearDistance: ultraNearLodConfig.nearMaxDistance,
        lodTransitionDistance: ultraNearLodConfig.transitionDistance,
        lodGuardDistance: 0,
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
          // The margin is what makes a tile resident before its blades can
          // draw: without it the residency radius lands exactly on the fade
          // end, so a tile is requested at the distance where the shader
          // already keeps blades and the whole tile appears at once as soon as
          // the build lands. Both other layers reserve the same lead.
          visibilityRadius:
            this.worldConfig.grassUltraNearDistance +
            this.worldConfig.grassUltraNearTransitionDistance +
            SINGLE_BLADE_BOUNDS_MARGIN,
          densityMultiplier: ultraAdditionalDensity,
          bladeSegments: grassConfig.geometry.bladeSegments,
          receiveShadows: true,
          seedSalt: ULTRA_NEAR_SEED_SALT,
          material: this.ultraNearMaterial,
          tilesPerFrame: this.profile.compact
            ? COMPACT_ULTRA_NEAR_TILES_PER_FRAME
            : DESKTOP_ULTRA_NEAR_TILES_PER_FRAME,
          reconcileEveryFrame: true,
          // detailMode 0: the keep set is the plain near-coverage prefix.
          lodNearDistance: ultraNearLodConfig.nearMaxDistance,
          lodTransitionDistance: ultraNearLodConfig.transitionDistance,
          lodGuardDistance: 0,
        },
      );
    }

    this.initialized = true;
  }
}
