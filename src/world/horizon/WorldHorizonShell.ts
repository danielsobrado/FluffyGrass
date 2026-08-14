import * as THREE from "three";
import type { TerrainField } from "../TerrainField";
import type { WorldConfig } from "../WorldConfig";
import {
  createWorldHorizonAxis,
  type WorldHorizonAxis,
} from "./WorldHorizonGrid";
import { WorldHorizonMaterial } from "./WorldHorizonMaterial";
import {
  WORLD_HORIZON_BUILD_BATCH,
  WORLD_HORIZON_BUILD_BUDGET_MS,
  WORLD_HORIZON_RENDER_ORDER,
  WORLD_HORIZON_SINK_DEPTH,
} from "./WorldHorizonTuning";

const HEIGHT_STAGE = 0;
const VERTEX_STAGE = 1;
const INDEX_STAGE = 2;
const FINALIZE_STAGE = 3;
const COMPLETE_STAGE = 4;

export interface WorldHorizonDiagnostics {
  triangles: number;
  complete: boolean;
  progress: number;
}

/**
 * A permanently resident coarse shell of the entire world.
 *
 * The streamed ring reaches 384 m on desktop and 192 m on compact, and outside
 * that radius its chunks are deleted outright. The world is 2048 m across and
 * its fog does not close until roughly 1450 m, so terrain used to end in plain
 * view with four fifths of its contrast intact: a mountain crossing the ring
 * boundary appeared and vanished as a hard edge against the sky.
 *
 * This is the invariant that fixes it — anything capable of breaking the
 * skyline always has a representation. The shell is built once, never
 * unloaded, and never rebuilt, so no mountain can ever pop into existence; the
 * streamed ring only ever overlays detail onto ground that is already there.
 *
 * At a 2 km world the shell can simply cover everything, which is what makes
 * this cheap enough to be unconditional. There is no streaming, no residency
 * set, no LOD selection and no hysteresis to get wrong, and the whole thing is
 * one draw call.
 */
export class WorldHorizonShell {
  private readonly axis: WorldHorizonAxis;
  private readonly worldHalfExtent: number;
  private readonly materialController: WorldHorizonMaterial;
  private readonly heights: Float32Array;
  private readonly positions: Float32Array;
  private readonly normals: Float32Array;
  private readonly colors: Float32Array;
  private readonly indices: Uint16Array | Uint32Array;
  private readonly normal = new THREE.Vector3();
  private readonly color = new THREE.Color();
  private mesh?: THREE.Mesh;
  private stage = HEIGHT_STAGE;
  private nextHeight = 0;
  private nextVertex = 0;
  private nextCell = 0;
  private disposed = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly field: TerrainField,
    config: WorldConfig,
    compact: boolean,
  ) {
    this.axis = createWorldHorizonAxis(
      config.worldSize,
      config.horizonSpacing,
      config.horizonApronRings,
      config.horizonApronGrowth,
    );
    this.worldHalfExtent = config.worldSize * 0.5;
    const radius = compact
      ? config.terrainRadiusCompact
      : config.terrainRadiusDesktop;
    this.materialController = new WorldHorizonMaterial(
      radius * config.chunkSize,
      (radius + 1) * config.chunkSize,
    );

    const vertexCount = this.axis.size * this.axis.size;
    const cells = this.axis.size - 1;
    this.heights = new Float32Array(vertexCount);
    this.positions = new Float32Array(vertexCount * 3);
    this.normals = new Float32Array(vertexCount * 3);
    this.colors = new Float32Array(vertexCount * 3);
    this.indices =
      vertexCount <= 65535
        ? new Uint16Array(cells * cells * 6)
        : new Uint32Array(cells * cells * 6);
  }

  /**
   * Advances the one-time build. Once complete, only the streaming-focus
   * uniform is refreshed each frame.
   *
   * The shell shares the terrain streamer's failure domain, and a fault here
   * would otherwise take streaming down with it. Since the only work this does
   * is its own build, containing a fault by abandoning that build degrades the
   * world back to exactly the streamed ring rather than to no terrain at all.
   */
  update(streamingFocus: THREE.Vector3, buildDeadline = Number.POSITIVE_INFINITY): void {
    if (this.disposed) {
      return;
    }
    // Terrain residency follows the controller focus, not always the camera.
    // Use that same focus so neither side of the square ring exposes a trench.
    this.materialController.update(streamingFocus);
    if (this.stage === COMPLETE_STAGE) {
      return;
    }
    const deadline = Math.min(
      performance.now() + WORLD_HORIZON_BUILD_BUDGET_MS,
      buildDeadline,
    );

    try {
      while (this.stage < COMPLETE_STAGE) {
        if (performance.now() >= deadline) {
          return;
        }
        if (this.stage === HEIGHT_STAGE) {
          this.advanceHeights(deadline);
        } else if (this.stage === VERTEX_STAGE) {
          this.advanceVertices(deadline);
        } else if (this.stage === INDEX_STAGE) {
          this.advanceIndices(deadline);
        } else {
          this.finalize();
        }
      }
    } catch (error) {
      console.error("[Drusniel World] Horizon shell build failed.", error);
      this.dispose();
    }
  }

  getDiagnostics(): WorldHorizonDiagnostics {
    const cells = this.axis.size - 1;
    const total = this.heights.length * 2 + cells * cells;
    const done =
      this.nextHeight + this.nextVertex + this.nextCell;
    return {
      triangles: this.mesh ? cells * cells * 2 : 0,
      complete: this.stage === COMPLETE_STAGE,
      progress: this.stage === COMPLETE_STAGE ? 1 : done / total,
    };
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = undefined;
    }
    this.materialController.dispose();
  }

  /**
   * Heights come first and complete before shading starts. Normals are central
   * differences across the grid, so a vertex needs its neighbours in all four
   * directions; deriving them from the finished height grid costs one terrain
   * sample per vertex instead of the five `sampleNormal` would charge.
   */
  private advanceHeights(deadline: number): void {
    const { positions: axis, size } = this.axis;
    const total = this.heights.length;
    while (this.nextHeight < total) {
      const limit = Math.min(total, this.nextHeight + WORLD_HORIZON_BUILD_BATCH);
      while (this.nextHeight < limit) {
        const column = this.nextHeight % size;
        const row = (this.nextHeight - column) / size;
        this.heights[this.nextHeight] = this.field.sampleHeight(
          axis[column],
          axis[row],
        );
        this.nextHeight += 1;
      }
      if (performance.now() >= deadline) {
        break;
      }
    }
    if (this.nextHeight >= total) {
      this.stage = VERTEX_STAGE;
    }
  }

  private advanceVertices(deadline: number): void {
    const { positions: axis, size } = this.axis;
    const total = this.heights.length;
    while (this.nextVertex < total) {
      const limit = Math.min(total, this.nextVertex + WORLD_HORIZON_BUILD_BATCH);
      while (this.nextVertex < limit) {
        this.writeVertex(this.nextVertex, axis, size);
        this.nextVertex += 1;
      }
      if (performance.now() >= deadline) {
        break;
      }
    }
    if (this.nextVertex >= total) {
      this.stage = INDEX_STAGE;
    }
  }

  private writeVertex(
    index: number,
    axis: Float32Array,
    size: number,
  ): void {
    const column = index % size;
    const row = (index - column) / size;
    const x = axis[column];
    const z = axis[row];
    const height = this.heights[index];
    this.resolveNormal(column, row, axis, size);

    // Colour is read at the nearest point inside the world, not at the vertex.
    // Grass suitability is defined as zero beyond the world bounds, and feeding
    // that straight into the palette turns the whole apron to bare soil — a
    // brown ring around the horizon exactly where the eye is looking for haze.
    // The height stays the real one, so the silhouette out there is genuine
    // terrain; only its colouring is carried outward from the edge it adjoins.
    const half = this.worldHalfExtent;
    const shadeX = x < -half ? -half : x > half ? half : x;
    const shadeZ = z < -half ? -half : z > half ? half : z;
    const suitability = this.field.sampleGrassSuitability(
      shadeX,
      shadeZ,
      height,
      this.normal,
    );
    this.field.sampleColor(
      shadeX,
      shadeZ,
      height,
      suitability,
      this.field.sampleEcologyAt(shadeX, shadeZ, height),
      this.color,
    );

    const offset = index * 3;
    this.positions[offset] = x;
    this.positions[offset + 1] = height;
    this.positions[offset + 2] = z;
    this.normals[offset] = this.normal.x;
    this.normals[offset + 1] = this.normal.y;
    this.normals[offset + 2] = this.normal.z;
    this.colors[offset] = this.color.r;
    this.colors[offset + 1] = this.color.g;
    this.colors[offset + 2] = this.color.b;
  }

  /**
   * Central differences over the real neighbour spacing. The apron rings are
   * not evenly spaced, so dividing by a nominal step would tilt the shell's
   * shading progressively as the cells widen.
   */
  private resolveNormal(
    column: number,
    row: number,
    axis: Float32Array,
    size: number,
  ): void {
    const last = size - 1;
    const west = column > 0 ? column - 1 : 0;
    const east = column < last ? column + 1 : last;
    const north = row > 0 ? row - 1 : 0;
    const south = row < last ? row + 1 : last;
    const slopeX =
      (this.heights[row * size + east] - this.heights[row * size + west]) /
      Math.max(1e-6, axis[east] - axis[west]);
    const slopeZ =
      (this.heights[south * size + column] - this.heights[north * size + column]) /
      Math.max(1e-6, axis[south] - axis[north]);
    this.normal.set(-slopeX, 1, -slopeZ).normalize();
  }

  private advanceIndices(deadline: number): void {
    const size = this.axis.size;
    const cells = size - 1;
    const total = cells * cells;
    while (this.nextCell < total) {
      const limit = Math.min(total, this.nextCell + WORLD_HORIZON_BUILD_BATCH * 8);
      while (this.nextCell < limit) {
        const column = this.nextCell % cells;
        const row = (this.nextCell - column) / cells;
        const corner = row * size + column;
        const offset = this.nextCell * 6;
        this.indices[offset] = corner;
        this.indices[offset + 1] = corner + size;
        this.indices[offset + 2] = corner + 1;
        this.indices[offset + 3] = corner + 1;
        this.indices[offset + 4] = corner + size;
        this.indices[offset + 5] = corner + size + 1;
        this.nextCell += 1;
      }
      if (performance.now() >= deadline) {
        break;
      }
    }
    if (this.nextCell >= total) {
      this.stage = FINALIZE_STAGE;
    }
  }

  private finalize(): void {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(this.normals, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(this.indices, 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    // The sink displaces vertices downward in the vertex shader, which the
    // bounds computed from the source positions do not know about.
    if (geometry.boundingSphere) {
      geometry.boundingSphere.radius += WORLD_HORIZON_SINK_DEPTH;
    }

    const mesh = new THREE.Mesh(geometry, this.materialController.material);
    mesh.name = "world-horizon-shell";
    mesh.receiveShadow = false;
    mesh.castShadow = false;
    mesh.renderOrder = WORLD_HORIZON_RENDER_ORDER;
    this.mesh = mesh;
    this.scene.add(mesh);
    this.stage = COMPLETE_STAGE;
  }
}
