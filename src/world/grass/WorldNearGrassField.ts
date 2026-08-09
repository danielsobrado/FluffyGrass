import * as THREE from "three";
import {
  GRASS_ART_DIRECTIONS,
  DEFAULT_GRASS_ART_DIRECTION_KEY,
  type GrassArtDirection,
} from "../../grass/GrassArtDirection";
import type { GrassConfig, GrassLodConfig } from "../../grass/GrassConfig";
import { GrassConfigLoader } from "../../grass/internal/GrassConfigLoader";
import { GrassNearMaterial } from "../../grass/materials/GrassNearMaterial";
import {
  GRASS_WIND_NOISE_SCALE,
  GRASS_WIND_NOISE_SPEED,
  getGrassWindNoiseTexture,
} from "../../grass/wind/WindNoiseTexture";
import type { RuntimeProfile } from "../../runtime/RuntimeConfig";
import { APP_VERSION } from "../../version";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import { WorldSingleBladeTileFactory } from "./WorldSingleBladeTileFactory";
import { WorldSingleBladeTileField } from "./WorldSingleBladeTileField";
import {
  WorldDetailFoliageAtlasFactory,
  type WorldDetailFoliageAtlas,
} from "./WorldDetailFoliageAtlasFactory";
import { WorldDetailFoliageMaterial } from "./WorldDetailFoliageMaterial";
import {
  DETAIL_FOLIAGE_FADE_DISTANCE,
  DETAIL_FOLIAGE_FADE_TRANSITION,
  WorldDetailFoliageFactory,
  WorldDetailFoliageField,
} from "./WorldDetailFoliageField";

const BASE_SEED_SALT = 0x6a09e667;
const ULTRA_NEAR_SEED_SALT = 0x3c6ef372;
const BASE_TILES_PER_FRAME = 1;
const DESKTOP_ULTRA_NEAR_TILES_PER_FRAME = 2;
const COMPACT_ULTRA_NEAR_TILES_PER_FRAME = 1;
const SINGLE_BLADE_BOUNDS_MARGIN = 2;
const NEAR_FIELD_ALTITUDE_MARGIN = 4;
const DESKTOP_NEAR_BUILD_BUDGET_MS = 2.5;
const COMPACT_NEAR_BUILD_BUDGET_MS = 1.5;
/**
 * Accent tiles are ~90 candidates each and finish well inside a tenth of a
 * millisecond, so one per frame keeps them behind the blade layers in the
 * frame's build slice without ever being the reason a tile is late.
 */
const DETAIL_FOLIAGE_TILES_PER_FRAME = 1;
/** Compact devices carry the layer at a lower share of the same budget. */
const COMPACT_DETAIL_FOLIAGE_SCALE = 0.6;

export class WorldNearGrassField {
  private readonly configLoader = new GrassConfigLoader();
  // The ultra-near detail layer, regular near layer, and bridge are separate
  // materials because their keep masks are different layer-level constants.
  // They intentionally reuse one placement set wherever their residency rings
  // overlap, so changing representation never moves a blade root.
  private readonly baseMaterial: GrassNearMaterial;
  private readonly bridgeMaterial: GrassNearMaterial;
  private readonly baseDetailMaterial: GrassNearMaterial;
  private readonly ultraNearMaterial: GrassNearMaterial;
  private factory?: WorldSingleBladeTileFactory;
  private baseField?: WorldSingleBladeTileField;
  private bridgeField?: WorldSingleBladeTileField;
  private baseDetailedField?: WorldSingleBladeTileField;
  private ultraNearField?: WorldSingleBladeTileField;
  // The accent layer: one atlas, one material, every species and tint resolved
  // from per-instance data. See WorldDetailFoliageField for why it lives here
  // rather than beside the streamed mid patches — it is a near-band layer and
  // suspends with the rest of them when the camera leaves their 3D range.
  private detailFoliageAtlas?: WorldDetailFoliageAtlas;
  private detailFoliageMaterial?: WorldDetailFoliageMaterial;
  private detailFoliageFactory?: WorldDetailFoliageFactory;
  private detailFoliageField?: WorldDetailFoliageField;
  private detailFoliageEnabled = true;
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
    const windMode = profile.compact ? "sine" : "noise";
    this.baseMaterial = new GrassNearMaterial({
      name: "world-grass-single-blade-material",
      cacheKey: `grass-near-material-v21-base-vertex-palette-${windMode}`,
      detailMode: 1,
      ditherSeed: BASE_SEED_SALT,
      vertexPalette: true,
      interactive: true,
      subPixelWidth: true,
      noiseWind: !profile.compact,
    });
    this.bridgeMaterial = new GrassNearMaterial({
      name: "world-grass-near-bridge-material",
      cacheKey: `grass-near-material-v21-bridge-vertex-palette-${windMode}`,
      // Outside the bridge-entry radius, using the same dither as LOD0. This
      // makes LOD0 -> bridge a strict partition of one placement set.
      detailMode: 1,
      ditherSeed: BASE_SEED_SALT,
      vertexPalette: true,
      interactive: true,
      subPixelWidth: true,
      sheen: false,
      noiseWind: !profile.compact,
    });
    this.baseDetailMaterial = new GrassNearMaterial({
      name: "world-grass-base-detail-material",
      cacheKey: `grass-near-material-v21-detail-${windMode}`,
      detailMode: 2,
      ditherSeed: BASE_SEED_SALT,
      interactive: true,
      noiseWind: !profile.compact,
    });
    this.ultraNearMaterial = new GrassNearMaterial({
      name: "world-grass-ultra-near-single-blade-material",
      cacheKey: `grass-near-material-v21-ultra-${windMode}`,
      detailMode: 0,
      ditherSeed: ULTRA_NEAR_SEED_SALT,
      interactive: true,
      noiseWind: !profile.compact,
    });
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

  update(
    elapsedSeconds: number,
    focus: THREE.Vector3,
    focusGroundHeight?: number,
    buildDeadline = Number.POSITIVE_INFINITY,
  ): void {
    if (!this.initialized || this.disposed) {
      return;
    }

    this.baseMaterial.update(elapsedSeconds);
    this.bridgeMaterial.update(elapsedSeconds);
    this.baseDetailMaterial.update(elapsedSeconds);
    this.ultraNearMaterial.update(elapsedSeconds);
    this.detailFoliageMaterial?.update(elapsedSeconds);

    // Near-blade residency is horizontal, while the shader's LOD distance is
    // three-dimensional. Suspend these dense tiles when a fly camera is high
    // enough that every local blade would be rejected in the vertex shader.
    const nearFieldsEnabled =
      focusGroundHeight === undefined ||
      focus.y - focusGroundHeight <=
        this.resolveBaseVisibilityRadius(this.artDirection) +
          NEAR_FIELD_ALTITUDE_MARGIN;
    this.baseField?.setEnabled(nearFieldsEnabled);
    this.bridgeField?.setEnabled(nearFieldsEnabled);
    this.baseDetailedField?.setEnabled(nearFieldsEnabled);
    this.ultraNearField?.setEnabled(nearFieldsEnabled);
    this.detailFoliageField?.setEnabled(
      nearFieldsEnabled && this.detailFoliageEnabled,
    );
    if (!nearFieldsEnabled) {
      return;
    }

    // Build the very close layer first so the player sees the requested
    // density immediately after spawn or a tile crossing.
    const nearBuildBudget = this.profile.compact
      ? COMPACT_NEAR_BUILD_BUDGET_MS
      : DESKTOP_NEAR_BUILD_BUDGET_MS;
    const nearBuildDeadline = Math.min(
      buildDeadline,
      performance.now() + nearBuildBudget,
    );
    // Detail tiles reuse LOD0 placement buffers. The bridge is updated after
    // LOD0 so overlap tiles are cache hits; beyond LOD0 residency it becomes
    // the placement owner, replacing the work the old near field did there.
    this.baseDetailedField?.update(focus, nearBuildDeadline);
    this.ultraNearField?.update(focus, nearBuildDeadline);
    this.baseField?.update(focus, nearBuildDeadline);
    this.bridgeField?.update(focus, nearBuildDeadline);
    // Accents last: they are the layer whose absence for one more frame is
    // least visible, so they spend whatever the blade layers left.
    this.detailFoliageField?.update(focus, nearBuildDeadline);
  }

  getDetailFoliageAtlas(): WorldDetailFoliageAtlas | undefined {
    return this.detailFoliageAtlas;
  }

  getDetailFoliageDiagnostics(): {
    accentCards: number;
    accentTiles: number;
  } {
    return {
      accentCards: this.detailFoliageField?.getDrawnInstanceCount() ?? 0,
      accentTiles: this.detailFoliageField?.getTileCount() ?? 0,
    };
  }

  getBladeCount(): number {
    // LOD0 and bridge are complementary views of the same base placement set.
    // Count the wider owner once, then add only the independently seeded extra
    // ultra-near density.
    return (
      (this.bridgeField?.getBladeCount() ?? this.baseField?.getBladeCount() ?? 0) +
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
      this.bridgeField,
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
    const bridgeEntryLod = this.resolveBridgeEntryLodConfig(direction);
    const bridgeExitLod = this.resolveBridgeExitLodConfig(direction);
    const ultraNearLod = this.resolveUltraNearLodConfig();

    this.ultraNearMaterial.applyArtDirection(direction);
    this.bridgeMaterial.applyArtDirection(direction);
    this.detailFoliageMaterial?.applyArtDirection(direction);
    for (const material of [this.baseMaterial, this.baseDetailMaterial]) {
      material.applyArtDirection(direction);
      material.configureLod(bridgeEntryLod);
      material.configureDetailLod(ultraNearLod);
    }
    this.bridgeMaterial.configureLod(bridgeExitLod);
    this.bridgeMaterial.configureDetailLod(bridgeEntryLod);

    this.baseField?.setVisibilityRadius(
      this.resolveBridgeEntryVisibilityRadius(),
    );
    this.baseField?.setLodFade(
      bridgeEntryLod.nearMaxDistance,
      bridgeEntryLod.transitionDistance,
    );
    this.bridgeField?.setVisibilityRadius(
      this.resolveBaseVisibilityRadius(direction),
    );
    this.bridgeField?.setLodFade(
      bridgeExitLod.nearMaxDistance,
      bridgeExitLod.transitionDistance,
    );
  }

  /**
   * World size of one device pixel per metre of camera distance. LOD0 and the
   * bridge both use the same sub-pixel width rule through the handoff.
   */
  setViewportPixelScale(pixelWorldScale: number): void {
    this.baseMaterial.setViewportPixelScale(pixelWorldScale);
    this.bridgeMaterial.setViewportPixelScale(pixelWorldScale);
  }

  setQuality(
    densityScale: number,
    ultraDensityScale: number,
    sheenEnabled: boolean,
    nearDistanceScale = 1,
    accentDensityScale = 1,
  ): void {
    // The accent scale is ramped by the governor like every other tier scalar,
    // so a tier change dissolves the layer through the same dither the distance
    // fade uses instead of dropping half of it in one frame.
    this.detailFoliageEnabled = accentDensityScale > 0;
    this.detailFoliageField?.setDensityScale(
      accentDensityScale *
        (this.profile.compact ? COMPACT_DETAIL_FOLIAGE_SCALE : 1),
    );
    this.baseMaterial.setLodDensityScale(densityScale);
    this.bridgeMaterial.setLodDensityScale(densityScale);
    this.baseDetailMaterial.setLodDensityScale(densityScale);
    this.ultraNearMaterial.setLodDensityScale(
      densityScale * ultraDensityScale,
    );
    this.baseMaterial.setSheenEnabled(sheenEnabled);
    this.baseField?.setDensityScale(densityScale);
    this.bridgeField?.setDensityScale(densityScale);
    this.baseDetailedField?.setDensityScale(densityScale);
    this.ultraNearField?.setDensityScale(densityScale * ultraDensityScale);

    const bridgeEntryLod = this.resolveBridgeEntryLodConfig(
      this.artDirection,
      nearDistanceScale,
    );
    const bridgeExitLod = this.resolveBridgeExitLodConfig(
      this.artDirection,
      nearDistanceScale,
    );
    this.baseMaterial.configureLod(bridgeEntryLod);
    this.baseDetailMaterial.configureLod(bridgeEntryLod);
    this.bridgeMaterial.configureDetailLod(bridgeEntryLod);
    this.bridgeMaterial.configureLod(bridgeExitLod);
    this.baseField?.setVisibilityRadius(
      this.resolveBridgeEntryVisibilityRadius(nearDistanceScale),
    );
    this.baseField?.setLodFade(
      bridgeEntryLod.nearMaxDistance,
      bridgeEntryLod.transitionDistance,
    );
    this.bridgeField?.setVisibilityRadius(
      bridgeExitLod.nearMaxDistance +
        bridgeExitLod.transitionDistance +
        SINGLE_BLADE_BOUNDS_MARGIN,
    );
    this.bridgeField?.setLodFade(
      bridgeExitLod.nearMaxDistance,
      bridgeExitLod.transitionDistance,
    );
  }

  /**
   * Bakes the accent atlas and stands up its material, factory, and field. The
   * atlas is a single 1024 × 256 canvas drawn once at init — the same cost and
   * the same lifetime as the impostor atlas beside it.
   */
  private createDetailFoliageLayer(grassConfig: GrassConfig): void {
    const atlas = new WorldDetailFoliageAtlasFactory().create();
    const material = new WorldDetailFoliageMaterial(
      atlas,
      grassConfig.material,
      grassConfig.wind,
      {
        fadeDistance: DETAIL_FOLIAGE_FADE_DISTANCE,
        fadeTransition: DETAIL_FOLIAGE_FADE_TRANSITION,
        noiseWind: !this.profile.compact,
      },
    );
    material.applyArtDirection(this.artDirection);
    if (!this.profile.compact) {
      material.setWindNoise(
        getGrassWindNoiseTexture(),
        GRASS_WIND_NOISE_SCALE,
        GRASS_WIND_NOISE_SPEED,
      );
    }
    const factory = new WorldDetailFoliageFactory(
      this.field,
      this.worldConfig,
      grassConfig,
      material,
    );
    this.detailFoliageAtlas = atlas;
    this.detailFoliageMaterial = material;
    this.detailFoliageFactory = factory;
    this.detailFoliageField = new WorldDetailFoliageField(
      this.scene,
      factory,
      material,
      {
        namePrefix: "world-grass-detail-foliage",
        tilesPerFrame: DETAIL_FOLIAGE_TILES_PER_FRAME,
      },
    );
    this.detailFoliageField.setDensityScale(
      this.profile.compact ? COMPACT_DETAIL_FOLIAGE_SCALE : 1,
    );
  }

  private resolveBaseVisibilityRadius(direction: GrassArtDirection): number {
    return (
      direction.nearDistance +
      direction.transitionDistance +
      SINGLE_BLADE_BOUNDS_MARGIN
    );
  }

  private resolveBridgeEntryVisibilityRadius(nearDistanceScale = 1): number {
    return (
      this.worldConfig.grassNearBridgeDistance * nearDistanceScale +
      this.worldConfig.grassNearBridgeTransitionDistance * nearDistanceScale +
      SINGLE_BLADE_BOUNDS_MARGIN
    );
  }

  private resolveBridgeEntryLodConfig(
    direction: GrassArtDirection,
    nearDistanceScale = 1,
  ): GrassLodConfig {
    return {
      nearMaxDistance:
        this.worldConfig.grassNearBridgeDistance * nearDistanceScale,
      midMaxDistance: direction.midDistance,
      farMaxDistance: direction.farDistance,
      transitionDistance:
        this.worldConfig.grassNearBridgeTransitionDistance * nearDistanceScale,
      hysteresisDistance: this.worldConfig.grassHysteresisDistance,
    };
  }

  private resolveBridgeExitLodConfig(
    direction: GrassArtDirection,
    nearDistanceScale = 1,
  ): GrassLodConfig {
    return {
      nearMaxDistance: direction.nearDistance * nearDistanceScale,
      midMaxDistance: direction.midDistance,
      farMaxDistance: direction.farDistance,
      transitionDistance: direction.transitionDistance,
      hysteresisDistance: this.worldConfig.grassHysteresisDistance,
    };
  }

  private resolveUltraNearLodConfig(): GrassLodConfig {
    const ultraTransitionHalf =
      this.worldConfig.grassUltraNearTransitionDistance * 0.5;
    return {
      nearMaxDistance:
        this.worldConfig.grassUltraNearDistance + ultraTransitionHalf,
      midMaxDistance: this.worldConfig.grassMidDistance,
      farMaxDistance: this.worldConfig.grassFarDistance,
      transitionDistance: ultraTransitionHalf,
      hysteresisDistance: 0,
    };
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.initialized = false;
    this.baseField?.dispose();
    this.bridgeField?.dispose();
    this.baseDetailedField?.dispose();
    this.ultraNearField?.dispose();
    this.detailFoliageField?.dispose();
    this.baseField = undefined;
    this.bridgeField = undefined;
    this.baseDetailedField = undefined;
    this.ultraNearField = undefined;
    this.detailFoliageField = undefined;
    this.factory?.dispose();
    this.factory = undefined;
    this.detailFoliageFactory?.dispose();
    this.detailFoliageFactory = undefined;
    this.baseMaterial.material.dispose();
    this.bridgeMaterial.material.dispose();
    this.baseDetailMaterial.material.dispose();
    this.ultraNearMaterial.material.dispose();
    this.detailFoliageMaterial?.dispose();
    this.detailFoliageMaterial = undefined;
    this.detailFoliageAtlas = undefined;
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

    const bridgeEntryLodConfig = this.resolveBridgeEntryLodConfig(
      this.artDirection,
    );
    const bridgeExitLodConfig = this.resolveBridgeExitLodConfig(
      this.artDirection,
    );
    const ultraNearLodConfig = this.resolveUltraNearLodConfig();

    // LOD0 and the segmented detail layer partition the same blade set against
    // the ultra-near radius. LOD0 then partitions into the bridge using the
    // bridge entry radius, while the bridge owns the old outer near residency.
    for (const material of [this.baseMaterial, this.baseDetailMaterial]) {
      material.configure(grassConfig.material, grassConfig.wind);
      material.applyArtDirection(this.artDirection);
      material.configureLod(bridgeEntryLodConfig);
      material.configureDetailLod(ultraNearLodConfig);
    }
    this.bridgeMaterial.configure(grassConfig.material, grassConfig.wind);
    this.bridgeMaterial.applyArtDirection(this.artDirection);
    this.bridgeMaterial.configureLod(bridgeExitLodConfig);
    this.bridgeMaterial.configureDetailLod(bridgeEntryLodConfig);
    this.ultraNearMaterial.configure(grassConfig.material, grassConfig.wind);
    this.ultraNearMaterial.applyArtDirection(this.artDirection);
    this.ultraNearMaterial.configureLod(ultraNearLodConfig);
    if (!this.profile.compact) {
      const texture = getGrassWindNoiseTexture();
      for (const material of [
        this.baseMaterial,
        this.bridgeMaterial,
        this.baseDetailMaterial,
        this.ultraNearMaterial,
      ]) {
        material.setWindNoise(
          texture,
          GRASS_WIND_NOISE_SCALE,
          GRASS_WIND_NOISE_SPEED,
        );
      }
    }
    // Matches the half-width `createSingleBladeGeometry` builds from the mean
    // configured blade width, which is what the sub-pixel clamp widens from.
    const sourceBladeHalfWidth =
      (grassConfig.geometry.bladeWidthMin + grassConfig.geometry.bladeWidthMax) *
      0.25;
    this.baseMaterial.setBladeHalfWidth(sourceBladeHalfWidth);
    this.bridgeMaterial.setBladeHalfWidth(sourceBladeHalfWidth);

    const trailBend = {
      maxAngleRadians: THREE.MathUtils.degToRad(
        this.worldConfig.grassTrailMaxAngleDegrees,
      ),
      wobbleFrequency: this.worldConfig.grassTrailWobbleFrequency,
      wobbleAmplitude: this.worldConfig.grassTrailWobbleAmplitude,
    };
    for (const material of [
      this.baseMaterial,
      this.bridgeMaterial,
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
        visibilityRadius: this.resolveBridgeEntryVisibilityRadius(),
        densityMultiplier: 1,
        // LOD0 and bridge use the same one-triangle silhouette. The bridge is
        // a representation boundary, not a new placement population.
        bladeSegments: 1,
        receiveShadows: false,
        seedSalt: BASE_SEED_SALT,
        material: this.baseMaterial,
        tilesPerFrame: BASE_TILES_PER_FRAME,
        reconcileEveryFrame: true,
        lodNearDistance: bridgeEntryLodConfig.nearMaxDistance,
        lodTransitionDistance: bridgeEntryLodConfig.transitionDistance,
        // detailMode 1 also removes the one-triangle copy inside ultra-near.
        // That second keep test is not a prefix until its own fade is finished.
        lodGuardDistance:
          ultraNearLodConfig.nearMaxDistance +
          ultraNearLodConfig.transitionDistance,
      },
    );

    this.bridgeField = new WorldSingleBladeTileField(
      this.scene,
      factory,
      tileSize,
      {
        namePrefix: "world-grass-near-bridge",
        visibilityRadius: this.resolveBaseVisibilityRadius(this.artDirection),
        densityMultiplier: 1,
        bladeSegments: 1,
        receiveShadows: false,
        seedSalt: BASE_SEED_SALT,
        material: this.bridgeMaterial,
        tilesPerFrame: BASE_TILES_PER_FRAME,
        reconcileEveryFrame: true,
        lodNearDistance: bridgeExitLodConfig.nearMaxDistance,
        lodTransitionDistance: bridgeExitLodConfig.transitionDistance,
        // During the bridge-entry fade the keep set is an interval in dither
        // space rather than a prefix, so CPU count trimming starts only after
        // that exact-placement handoff is complete.
        lodGuardDistance:
          bridgeEntryLodConfig.nearMaxDistance +
          bridgeEntryLodConfig.transitionDistance,
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
      (this.profile.compact
        ? this.worldConfig.grassUltraNearDensityMultiplierCompact
        : this.worldConfig.grassUltraNearDensityMultiplier) - 1;
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

    this.createDetailFoliageLayer(grassConfig);
    this.initialized = true;
  }
}
