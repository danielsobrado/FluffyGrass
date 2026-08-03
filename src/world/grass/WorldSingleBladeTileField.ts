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
  seedSalt: number;
  material: GrassNearMaterial;
  tilesPerFrame: number;
  reconcileEveryFrame: boolean;
}

interface TileRequest {
  key: string;
  tileX: number;
  tileZ: number;
  distance: number;
}

export class WorldSingleBladeTileField {
  private readonly tiles = new Map<string, WorldSingleBladeTile>();
  private readonly desired = new Set<string>();
  private readonly queue: TileRequest[] = [];
  private centerTileX = Number.NaN;
  private centerTileZ = Number.NaN;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly factory: WorldSingleBladeTileFactory,
    private readonly tileSize: number,
    private readonly options: Readonly<WorldSingleBladeTileFieldOptions>,
  ) {}

  update(focus: THREE.Vector3): void {
    const tileX = Math.floor(focus.x / this.tileSize);
    const tileZ = Math.floor(focus.z / this.tileSize);
    const tileChanged =
      tileX !== this.centerTileX || tileZ !== this.centerTileZ;

    if (tileChanged) {
      this.centerTileX = tileX;
      this.centerTileZ = tileZ;
    }
    if (tileChanged || this.options.reconcileEveryFrame) {
      this.reconcile(focus);
    }

    this.processQueue();
  }

  getBladeCount(): number {
    let count = 0;
    for (const tile of this.tiles.values()) {
      count += tile.bladeCount;
    }
    return count;
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
      Math.ceil(this.options.visibilityRadius / this.tileSize),
    );
    const requests: TileRequest[] = [];
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
        if (distance > this.options.visibilityRadius) {
          continue;
        }

        const key = `${tileX}:${tileZ}`;
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
    this.queue.length = 0;
    this.queue.push(...requests);
  }

  private processQueue(): void {
    let built = 0;
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
        ...request,
        densityMultiplier: this.options.densityMultiplier,
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
