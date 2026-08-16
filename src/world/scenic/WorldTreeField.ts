import * as THREE from "three";
import { createHydrologySample } from "../hydrology/HydrologyField";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import {
  TREE_CELL_SIZE,
  TREE_MAX_FERTILITY,
  TREE_MAX_ROCKINESS,
  TREE_MAX_WATER_COVERAGE,
  TREE_MIN_FERTILITY,
  TREE_MIN_MOISTURE,
  TREE_MIN_NORMAL_Y,
  TREE_OCCUPANCY,
} from "./WorldScenicTuning";

export interface WorldTreeInstance {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly yaw: number;
  readonly height: number;
  readonly canopyScale: number;
  readonly leanX: number;
  readonly leanZ: number;
}

const TREE_SEED_SALT = 0x54724565;
const HASH_UNIT = 1 / 4294967296;
const normal = new THREE.Vector3();
const hydrology = createHydrologySample();

/**
 * Deterministic lattice of meadow trees. Placement is a pure function of the
 * world seed so streaming and grass-side queries can agree without talking.
 */
export class WorldTreeField {
  private readonly seed: number;

  constructor(
    private readonly field: TerrainField,
    config: WorldConfig,
  ) {
    this.seed = (config.seed ^ TREE_SEED_SALT) >>> 0;
  }

  collect(centerX: number, centerZ: number, radius: number): WorldTreeInstance[] {
    if (
      !Number.isFinite(centerX) ||
      !Number.isFinite(centerZ) ||
      !Number.isFinite(radius) ||
      radius <= 0
    ) {
      return [];
    }

    const trees: WorldTreeInstance[] = [];
    const minX = Math.floor((centerX - radius) / TREE_CELL_SIZE);
    const maxX = Math.floor((centerX + radius) / TREE_CELL_SIZE);
    const minZ = Math.floor((centerZ - radius) / TREE_CELL_SIZE);
    const maxZ = Math.floor((centerZ + radius) / TREE_CELL_SIZE);
    const radiusSquared = radius * radius;

    for (let cellZ = minZ; cellZ <= maxZ; cellZ += 1) {
      for (let cellX = minX; cellX <= maxX; cellX += 1) {
        const tree = this.sampleCell(cellX, cellZ);
        if (!tree) {
          continue;
        }
        const dx = tree.x - centerX;
        const dz = tree.z - centerZ;
        if (dx * dx + dz * dz > radiusSquared) {
          continue;
        }
        trees.push(tree);
      }
    }
    return trees;
  }

  private sampleCell(cellX: number, cellZ: number): WorldTreeInstance | undefined {
    const occupancy = hash(cellX, cellZ, this.seed) * HASH_UNIT;
    if (occupancy > TREE_OCCUPANCY) {
      return undefined;
    }
    const jitterX =
      (hash(cellX, cellZ, this.seed ^ 0x9e3779b9) * HASH_UNIT - 0.5) *
      TREE_CELL_SIZE *
      0.62;
    const jitterZ =
      (hash(cellX, cellZ, this.seed ^ 0x85ebca6b) * HASH_UNIT - 0.5) *
      TREE_CELL_SIZE *
      0.62;
    const x = (cellX + 0.5) * TREE_CELL_SIZE + jitterX;
    const z = (cellZ + 0.5) * TREE_CELL_SIZE + jitterZ;
    const height = this.field.sampleHeight(x, z);
    this.field.sampleNormal(x, z, normal);
    if (normal.y < TREE_MIN_NORMAL_Y) {
      return undefined;
    }
    this.field.sampleHydrology(x, z, height, hydrology);
    if (
      hydrology.waterCoverage > TREE_MAX_WATER_COVERAGE ||
      hydrology.grassMask < 0.85
    ) {
      return undefined;
    }
    const ecology = this.field.sampleEcologyAt(x, z, height);
    if (
      ecology.fertility < TREE_MIN_FERTILITY ||
      ecology.fertility > TREE_MAX_FERTILITY ||
      ecology.moisture < TREE_MIN_MOISTURE ||
      ecology.rockiness > TREE_MAX_ROCKINESS
    ) {
      return undefined;
    }

    const heightRoll = hash(cellX, cellZ, this.seed ^ 0xc2b2ae35) * HASH_UNIT;
    const canopyRoll = hash(cellX, cellZ, this.seed ^ 0x27d4eb2f) * HASH_UNIT;
    const yaw =
      hash(cellX, cellZ, this.seed ^ 0x165667b1) * HASH_UNIT * Math.PI * 2;
    return {
      x,
      y: height,
      z,
      yaw,
      height: 2.4 + heightRoll * 1.8,
      canopyScale: 0.85 + canopyRoll * 0.55,
      leanX: normal.x * 0.18,
      leanZ: normal.z * 0.18,
    };
  }
}

function hash(x: number, z: number, seed: number): number {
  let value = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}
