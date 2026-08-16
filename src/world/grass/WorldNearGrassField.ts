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
  createDetailFoliageTuning,
  detailFoliageTuningEquals,
  normalizeDetailFoliageTuning,
  type DetailFoliageTuning,
} from "./DetailFoliageTuning";
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
const COMPACT_DETAIL_FOLIAGE_SCALE = 0.35;

interface NearFieldBuilder {
  update(focus: THREE.Vector3, buildDeadline?: number): void;
}

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
  private detailFoliageDensityScale: number;
  private detailFoliageTuning: DetailFoliageTuning;
  private initialization?: Promise<void>;
  private artDirection: GrassArtDirection =
    GRASS_ART_DIRECTIONS[DEFAULT_GRASS_ART_DIRECTION_KEY];
  private nearDistanceScale = 1;
  private initialized = false;
  private disposed = false;
  private buildCursor = 0;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly field: TerrainField,
    private readonly worldConfig: WorldConfig,
    private readonly profile: RuntimeProfile,
  ) {
    const windMode = profile.compact ? "sine" : "noise";
    this.baseMaterial = new GrassNearMaterial({
      name: "world-grass-single-blade-material",
      cacheKey: `grass-near-material-v25-base-vertex-palette-${windMode}`,
      detailMode: 1,
      ditherSeed: BASE_SEED_SALT,
      vertexPalette: true,
      interactive: true,
      subPixelWidth: true,
      noiseWind: !profile.compact,
      microWind: !profile.compact,
    });
    this.bridgeMaterial = new GrassNearMaterial({
      name: "world-grass-near-bridge-material",
      cacheKey: `grass-near-material-v25-bridge-vertex-palette-${windMode}`,
      // Outside the bridge-entry radius, using the same dither as LOD0. This
      // makes LOD0 -> bridge a strict partition of one placement set.
      detailMode: 1,
      ditherSeed: BASE_SEED_SALT,
      vertexPalette: true,
      interactive: true,
      subPixelWidth: true,
      // The bridge is a genuine cheaper representation: close sheen is already
      // being handed off and the patch LOD it feeds does not carry it either.
      sheen: false,
      noiseWind: !profile.compact,
      microWind: false,
    });
    this.baseDetailMaterial = new GrassNearMaterial({
      name: "world-grass-base-detail-material",
      cacheKey: `grass-near-material-v25-detail-${windMode}`,
      detailMode: 2,
      ditherSeed: BASE_SEED_SALT,
      interactive: true,
      noiseWind: !profile.compact,
      microWind: !profile.compact,
    });
    this.ultraNearMaterial = new GrassNearMaterial({
      name: "world-grass-ultra-near-single-blade-material",
      cacheKey: `grass-near-material-v25-ultra-${windMode}`,
      detailMode: 0,
      ditherSeed: ULTRA_NEAR_SEED_SALT,
      interactive: true,
      noiseWind: !profile.compact,
      microWind: !profile.compact,
    });
    this.detailFoliageTuning = createDetailFoliageTuning(worldConfig);
    this.detailFoliageDensityScale = profile.compact
      ? COMPACT_DETAIL_FOLIAGE_SCALE
      : 1;
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
        this.resolveBaseVisibilityRadius(
          this.artDirection,
          this.nearDistanceScale,
        ) + NEAR_FIELD_ALTITUDE_MARGIN;
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

    const nearBuildBudget = this.profile.compact
      ? COMPACT_NEAR_BUILD_BUDGET_MS
      : DESKTOP_NEAR_BUILD_BUDGET_MS;
    const nearBuildDeadline = Math.min(
      buildDeadline,
      performance.now() + nearBuildBudget,
    );
    // Rotate the first builder and divide the remaining time between fields.
    // A fixed order let an expensive detail ring consume the whole deadline
    // every frame, leaving the base/bridge tiles visibly empty until later.
    const nearBuildStartedAt = performance.now();
    const baseDeadline = Math.min(
      nearBuildDeadline,
      nearBuildStartedAt + (nearBuildDeadline - nearBuildStartedAt) * 0.5,
    );
    this.baseField?.update(focus, baseDeadline);
    const builders: NearFieldBuilder[] = [];
    if (this.bridgeField) builders.push(this.bridgeField);
    if (this.baseDetailedField) builders.push(this.baseDetailedField);
    if (this.ultraNearField) builders.push(this.ultraNearField);
    if (this.detailFoliageField) builders.push(this.detailFoliageField);
    for (let offset = 0; offset < builders.length; offset += 1) {
      const index = (this.buildCursor + offset) % builders.length;
      const remainingBuilders = builders.length - offset;
      const remainingMs = Math.max(0, nearBuildDeadline - performance.now());
      const fieldDeadline = Math.min(
        nearBuildDeadline,
        performance.now() + remainingMs / remainingBuilders,
      );
      builders[index].update(focus, fieldDeadline);
    }
    if (builders.length > 0) {
      this.buildCursor = (this.buildCursor + 1) % builders.length;
    }
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

  getDetailFoliageTuning(): DetailFoliageTuning {
    return { ...this.detailFoliageTuning };
  }

  setDetailFoliageTuning(tuning: DetailFoliageTuning): void {
    const normalized = normalizeDetailFoliageTuning(tuning);
    if (detailFoliageTuningEquals(this.detailFoliageTuning, normalized)) {
      return;
    }
    this.detailFoliageTuning = { ...normalized };
    this.detailFoliageFactory?.setTuning(this.detailFoliageTuning);
    this.detailFoliageField?.invalidate();
  }

  getBladeCount(): number {
    const baseBlades = this.baseField?.getBladeCount() ?? 0;
    const bridgeBlades = this.bridgeField?.getBladeCount() ?? 0;
    return (
      Math.max(baseBlades, bridgeBlades) +
      (this.ultraNearField?.getBladeCount() ?? 0)
    );
  }

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
      this.resolveBridgeEntryVisibilityRadius(direction),
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
    this.bridgeField?.setInnerCullDistance(
      bridgeEntryLod.nearMaxDistance - bridgeEntryLod.transitionDistance,
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
    this.nearDistanceScale = nearDistanceScale;
    this.detailFoliageEnabled = accentDensityScale > 0;
    this.detailFoliageDensityScale = THREE.MathUtils.clamp(
      accentDensityScale *
        (this.profile.compact ? COMPACT_DETAIL_FOLIAGE_SCALE : 1),
      0,
      1,
    );
    this.detailFoliageField?.setDensityScale(this.detailFoliageDensityScale);

    // The bridge split uses the raw placement dither as its lower boundary.
    // Scaling LOD0's upper boundary independently opens a missing dither range,
    // so the closest exact-placement population stays whole and quality thinning
    // begins with the bridge. This preserves continuity at every governor tier.
    this.baseMaterial.setLodDensityScale(1);
    this.baseDetailMaterial.setLodDensityScale(1);
    this.bridgeMaterial.setLodDensityScale(densityScale);
    this.ultraNearMaterial.setLodDensityScale(
      densityScale * ultraDensityScale,
    );
    this.baseMaterial.setSheenEnabled(sheenEnabled);
    this.baseField?.setDensityScale(1);
    this.baseDetailedField?.setDensityScale(1);
    this.bridgeField?.setDensityScale(densityScale);
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
      this.resolveBridgeEntryVisibilityRadius(
        this.artDirection,
        nearDistanceScale,
      ),
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
    this.bridgeField?.setInnerCullDistance(
      bridgeEntryLod.nearMaxDistance - bridgeEntryLod.transitionDistance,
    );
  }

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
      this.detailFoliageTuning,
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
    this.detailFoliageField.setDensityScale(this.detailFoliageDensityScale);
  }

  private resolveBaseVisibilityRadius(
    direction: GrassArtDirection,
    nearDistanceScale = 1,
  ): number {
    return (
      direction.nearDistance * nearDistanceScale +
      direction.transitionDistance +
      SINGLE_BLADE_BOUNDS_MARGIN
    );
  }

  private resolveBridgeEntryVisibilityRadius(
    direction: GrassArtDirection,
    nearDistanceScale = 1,
  ): number {
    const lod = this.resolveBridgeEntryLodConfig(direction, nearDistanceScale);
    return (
      lod.nearMaxDistance +
      lod.transitionDistance +
      SINGLE_BLADE_BOUNDS_MARGIN
    );
  }

  private resolveBridgeEntryLodConfig(
    direction: GrassArtDirection,
    nearDistanceScale = 1,
  ): GrassLodConfig {
    const preferredTransition =
      this.worldConfig.grassNearBridgeTransitionDistance * nearDistanceScale;
    const preferredFadeEnd =
      (this.worldConfig.grassNearBridgeDistance +
        this.worldConfig.grassNearBridgeTransitionDistance) *
      nearDistanceScale;
    const outerFadeStart =
      direction.nearDistance * nearDistanceScale - direction.transitionDistance;
    const fadeEnd = Math.min(preferredFadeEnd, outerFadeStart);
    const minimumFadeStart =
      this.worldConfig.grassUltraNearDistance +
      this.worldConfig.grassUltraNearTransitionDistance;
    const transitionDistance = Math.max(
      0.01,
      Math.min(
        preferredTransition,
        Math.max(0.01, (fadeEnd - minimumFadeStart) * 0.5),
      ),
    );
    return {
      nearMaxDistance: fadeEnd - transitionDistance,
      midMaxDistance: direction.midDistance,
      farMaxDistance: direction.farDistance,
      transitionDistance,
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
    const worldHalfExtent = this.worldConfig.worldSize * 0.5;
    this.factory = factory;
    this.baseField = new WorldSingleBladeTileField(
      this.scene,
      factory,
      tileSize,
      {
        namePrefix: "world-grass-single-blades",
        visibilityRadius: this.resolveBridgeEntryVisibilityRadius(
          this.artDirection,
        ),
        worldHalfExtent,
        densityMultiplier: 1,
        bladeSegments: 1,
        receiveShadows: false,
        seedSalt: BASE_SEED_SALT,
        material: this.baseMaterial,
        tilesPerFrame: BASE_TILES_PER_FRAME,
        reconcileEveryFrame: true,
        lodNearDistance: bridgeEntryLodConfig.nearMaxDistance,
        lodTransitionDistance: bridgeEntryLodConfig.transitionDistance,
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
        worldHalfExtent,
        densityMultiplier: 1,
        bladeSegments: 1,
        receiveShadows: false,
        seedSalt: BASE_SEED_SALT,
        material: this.bridgeMaterial,
        tilesPerFrame: BASE_TILES_PER_FRAME,
        reconcileEveryFrame: true,
        lodNearDistance: bridgeExitLodConfig.nearMaxDistance,
        lodTransitionDistance: bridgeExitLodConfig.transitionDistance,
        lodInnerCullDistance:
          bridgeEntryLodConfig.nearMaxDistance -
          bridgeEntryLodConfig.transitionDistance,
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
        worldHalfExtent,
        densityMultiplier: 1,
        bladeSegments: grassConfig.geometry.bladeSegments,
        receiveShadows: false,
        seedSalt: BASE_SEED_SALT,
        material: this.baseDetailMaterial,
        tilesPerFrame: this.profile.compact
          ? COMPACT_ULTRA_NEAR_TILES_PER_FRAME
          : DESKTOP_ULTRA_NEAR_TILES_PER_FRAME,
        reconcileEveryFrame: true,
        cachedPlacementOnly: true,
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
          visibilityRadius:
            this.worldConfig.grassUltraNearDistance +
            this.worldConfig.grassUltraNearTransitionDistance +
            SINGLE_BLADE_BOUNDS_MARGIN,
          worldHalfExtent,
          densityMultiplier: ultraAdditionalDensity,
          bladeSegments: grassConfig.geometry.bladeSegments,
          receiveShadows: false,
          seedSalt: ULTRA_NEAR_SEED_SALT,
          material: this.ultraNearMaterial,
          tilesPerFrame: this.profile.compact
            ? COMPACT_ULTRA_NEAR_TILES_PER_FRAME
            : DESKTOP_ULTRA_NEAR_TILES_PER_FRAME,
          reconcileEveryFrame: true,
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
