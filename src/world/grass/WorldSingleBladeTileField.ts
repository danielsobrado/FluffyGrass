import * as THREE from "three";
import type { GrassNearMaterial } from "../../grass/materials/GrassNearMaterial";
import {
  WorldSingleBladeTileFactory,
  type WorldSingleBladeTile,
} from "./WorldSingleBladeTileFactory";

export interface WorldSingleBladeTileFieldOptions {
  namePrefix: string;
  visibilityRadius: number;
  densityMultiplier: number;
  bladeSegments: number;
  receiveShadows: boolean;
  seedSalt: number;
  material: GrassNearMaterial;
  tilesPerFrame: number;
  reconcileEveryFrame: boolean;
  /** Near-fade midpoint and half-width this field's material culls against. */
  lodNearDistance: number;
  lodTransitionDistance: number;
  /**
   * Inside this distance the material's detail-mode test can keep blades the
   * plain near-coverage prefix would exclude, so the draw is never truncated
   * there. Zero for fields whose keep set is a prefix at every distance.
   */
  lodGuardDistance: number;
}

interface TileRequest {
  key: number;
  tileX: number;
  tileZ: number;
  distance: number;
}

/** Below this the tile residency set provably cannot change. */
const RECONCILE_MOVEMENT_EPSILON = 0.25;
/**
 * The CPU reproduces the shader's dither in float64 and stores it as float32,
 * so the two can disagree in the last bit. Widening the kept prefix by this much
 * keeps the truncation strictly conservative; it costs about 0.1% of a tile.
 */
const DITHER_SAFETY_MARGIN = 1 / 1024;

/** Matches the GLSL `smoothstep(edge0, edge1, x)` the vertex shader uses. */
function smoothstep(value: number, edge0: number, edge1: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Index of the first entry greater than `value` in an ascending array. */
function upperBound(values: Float32Array, value: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (values[middle] <= value) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
}
/**
 * Cantor-pairs two zig-zag encoded integers into one allocation-free key.
 * Unlike fixed-width bit packing, this stays collision-free when a configured
 * world crosses an arbitrary signed-coordinate boundary.
 */
function tileKey(tileX: number, tileZ: number): number {
  const x = tileX >= 0 ? tileX * 2 : -tileX * 2 - 1;
  const z = tileZ >= 0 ? tileZ * 2 : -tileZ * 2 - 1;
  const sum = x + z;
  return (sum * (sum + 1)) / 2 + z;
}

export class WorldSingleBladeTileField {
  private readonly tiles = new Map<number, WorldSingleBladeTile>();
  private readonly desired = new Set<number>();
  private readonly queue: TileRequest[] = [];
  private readonly requests: TileRequest[] = [];
  private readonly reconciledFocus = new THREE.Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );
  private centerTileX = Number.NaN;
  private centerTileZ = Number.NaN;
  private visibilityRadius: number;
  private lodNearDistance: number;
  private lodTransitionDistance: number;
  private lastBuildMs = 0;
  private maxBuildMs = 0;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly factory: WorldSingleBladeTileFactory,
    private readonly tileSize: number,
    private readonly options: Readonly<WorldSingleBladeTileFieldOptions>,
  ) {
    this.visibilityRadius = options.visibilityRadius;
    this.lodNearDistance = options.lodNearDistance;
    this.lodTransitionDistance = options.lodTransitionDistance;
  }

  /** Art directions with a shorter near fade need fewer resident tiles. */
  setVisibilityRadius(radius: number): void {
    if (radius === this.visibilityRadius) {
      return;
    }
    this.visibilityRadius = radius;
    this.centerTileX = Number.NaN;
    this.centerTileZ = Number.NaN;
  }

  /** Must track whatever `configureLod` was given for this field's material. */
  setLodFade(nearDistance: number, transitionDistance: number): void {
    this.lodNearDistance = nearDistance;
    this.lodTransitionDistance = transitionDistance;
  }

  update(focus: THREE.Vector3): void {
    const tileX = Math.floor(focus.x / this.tileSize);
    const tileZ = Math.floor(focus.z / this.tileSize);
    const tileChanged =
      tileX !== this.centerTileX || tileZ !== this.centerTileZ;

    if (tileChanged) {
      this.centerTileX = tileX;
      this.centerTileZ = tileZ;
    }
    // Reconciling every frame is what keeps the outer near-fade ring complete
    // while moving inside a tile, but it allocates and scans ~140 cells each
    // time. The residency test only depends on the focus position, so a focus
    // that has barely moved cannot change the answer.
    const focusMoved =
      focus.distanceToSquared(this.reconciledFocus) >
      RECONCILE_MOVEMENT_EPSILON * RECONCILE_MOVEMENT_EPSILON;
    if (tileChanged || (this.options.reconcileEveryFrame && focusMoved)) {
      this.reconciledFocus.copy(focus);
      this.reconcile(focus);
    }

    this.processQueue();
    this.updateInstanceCounts(focus);
  }

  /**
   * Trims each tile's draw to the blades that can actually survive the vertex
   * shader's LOD cull.
   *
   * Instances are sorted by dither at build time and the shader keeps a blade
   * when `dither <= coverage`, so the survivors are a prefix of the buffer.
   * Coverage is evaluated at the tile's nearest point — the maximum over the
   * whole tile — so the cut is conservative: it can only ever include blades the
   * shader would have dropped, never exclude one it would have kept.
   */
  private updateInstanceCounts(focus: THREE.Vector3): void {
    const guardDistance = this.options.lodGuardDistance;
    const fadeStart = this.lodNearDistance - this.lodTransitionDistance;
    const fadeEnd = this.lodNearDistance + this.lodTransitionDistance;
    for (const tile of this.tiles.values()) {
      const distance = this.distanceToTile(
        focus.x,
        focus.z,
        tile.tileX * this.tileSize,
        tile.tileZ * this.tileSize,
      );
      if (distance < guardDistance || distance <= fadeStart) {
        tile.mesh.count = tile.bladeCount;
        continue;
      }
      if (distance >= fadeEnd) {
        tile.mesh.count = 0;
        continue;
      }
      const coverage = 1 - smoothstep(distance, fadeStart, fadeEnd);
      tile.mesh.count = upperBound(
        tile.sortedDithers,
        coverage + DITHER_SAFETY_MARGIN,
      );
    }
  }

  getBladeCount(): number {
    let count = 0;
    for (const tile of this.tiles.values()) {
      count += tile.bladeCount;
    }
    return count;
  }

  getTileCount(): number {
    return this.tiles.size;
  }

  getLastBuildMs(): number {
    return this.lastBuildMs;
  }

  getMaxBuildMs(): number {
    return this.maxBuildMs;
  }

  dispose(): void {
    for (const tile of this.tiles.values()) {
      this.scene.remove(tile.mesh);
      this.factory.disposeTile(tile);
    }
    this.tiles.clear();
    this.desired.clear();
    this.queue.length = 0;
  }

  private reconcile(focus: THREE.Vector3): void {
    const offset = Math.max(
      1,
      Math.ceil(this.visibilityRadius / this.tileSize),
    );
    const requests = this.requests;
    requests.length = 0;
    this.desired.clear();

    for (let dz = -offset; dz <= offset; dz += 1) {
      for (let dx = -offset; dx <= offset; dx += 1) {
        const tileX = this.centerTileX + dx;
        const tileZ = this.centerTileZ + dz;
        const originX = tileX * this.tileSize;
        const originZ = tileZ * this.tileSize;
        const distance = this.distanceToTile(
          focus.x,
          focus.z,
          originX,
          originZ,
        );
        if (distance > this.visibilityRadius) {
          continue;
        }

        const key = tileKey(tileX, tileZ);
        this.desired.add(key);
        if (!this.tiles.has(key)) {
          requests.push({ key, tileX, tileZ, distance });
        }
      }
    }

    for (const [key, tile] of this.tiles) {
      if (this.desired.has(key)) {
        continue;
      }
      this.scene.remove(tile.mesh);
      this.factory.disposeTile(tile);
      this.tiles.delete(key);
    }

    requests.sort((left, right) => left.distance - right.distance);
    // Copy rather than spread: `push(...requests)` passes every request as a
    // separate argument, which this runs on every frame.
    this.queue.length = 0;
    for (const request of requests) {
      this.queue.push(request);
    }
  }

  private processQueue(): void {
    let built = 0;
    const startedAt = this.queue.length > 0 ? performance.now() : 0;
    while (built < this.options.tilesPerFrame && this.queue.length > 0) {
      const request = this.queue.shift();
      if (
        !request ||
        !this.desired.has(request.key) ||
        this.tiles.has(request.key)
      ) {
        continue;
      }

      const tile = this.factory.build({
        key: request.key,
        tileX: request.tileX,
        tileZ: request.tileZ,
        densityMultiplier: this.options.densityMultiplier,
        bladeSegments: this.options.bladeSegments,
        receiveShadows: this.options.receiveShadows,
        seedSalt: this.options.seedSalt,
        namePrefix: this.options.namePrefix,
        material: this.options.material,
      });
      if (tile) {
        this.tiles.set(request.key, tile);
        this.scene.add(tile.mesh);
      }
      built += 1;
    }

    if (built > 0) {
      this.lastBuildMs = performance.now() - startedAt;
      this.maxBuildMs = Math.max(this.maxBuildMs, this.lastBuildMs);
    }
  }

  private distanceToTile(
    x: number,
    z: number,
    originX: number,
    originZ: number,
  ): number {
    const distanceX = Math.max(
      originX - x,
      0,
      x - (originX + this.tileSize),
    );
    const distanceZ = Math.max(
      originZ - z,
      0,
      z - (originZ + this.tileSize),
    );
    return Math.hypot(distanceX, distanceZ);
  }
}
