import * as THREE from "three";
import type { GrassConfig } from "../../grass/GrassConfig";
import { resolveGrassBladeArcPoint } from "./GrassRuntimeMath";

export class WorldSingleBladeGeometryFactory {
  private readonly geometries = new Map<number, THREE.BufferGeometry>();

  constructor(private readonly config: GrassConfig) {}

  get(bladeSegments: number): THREE.BufferGeometry {
    const segments = Math.max(1, Math.round(bladeSegments));
    let geometry = this.geometries.get(segments);
    if (!geometry) {
      geometry = this.create(segments);
      this.geometries.set(segments, geometry);
    }
    return geometry;
  }

  dispose(): void {
    for (const geometry of this.geometries.values()) {
      geometry.dispose();
    }
    this.geometries.clear();
  }

  private create(segments: number): THREE.BufferGeometry {
    const height =
      (this.config.geometry.bladeHeightMin +
        this.config.geometry.bladeHeightMax) *
      0.5;
    const width =
      (this.config.geometry.bladeWidthMin + this.config.geometry.bladeWidthMax) *
      0.5;
    const positions: number[] = [];
    const uvs: number[] = [];
    const progress: number[] = [];
    const phases: number[] = [];
    const shades: number[] = [];
    const indices: number[] = [];
    const curve = this.config.geometry.bladeCurve;

    if (segments === 1) {
      const tip = resolveGrassBladeArcPoint(height, curve, 1);
      positions.push(
        -width * 0.5,
        0,
        0,
        width * 0.5,
        0,
        0,
        0,
        tip.y,
        tip.z,
      );
      uvs.push(0, 0, 1, 0, 0.5, 1);
      progress.push(0, 0, 1);
      phases.push(0.5, 0.5, 0.5);
      shades.push(0.5, 0.5, 0.5);
      indices.push(0, 1, 2);
    } else {
      for (let segment = 0; segment <= segments; segment += 1) {
        const amount = segment / segments;
        const taper = Math.pow(1 - amount, 0.72);
        const halfWidth = width * taper;
        const point = resolveGrassBladeArcPoint(height, curve, amount);
        positions.push(
          -halfWidth,
          point.y,
          point.z,
          halfWidth,
          point.y,
          point.z,
        );
        uvs.push(0, amount, 1, amount);
        progress.push(amount, amount);
        phases.push(0.5, 0.5);
        shades.push(0.5, 0.5);
      }

      for (let segment = 0; segment < segments; segment += 1) {
        const row = segment * 2;
        indices.push(row, row + 2, row + 1, row + 2, row + 3, row + 1);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute(
      "grassProgress",
      new THREE.Float32BufferAttribute(progress, 1),
    );
    geometry.setAttribute(
      "grassPhase",
      new THREE.Float32BufferAttribute(phases, 1),
    );
    geometry.setAttribute(
      "grassBladeShade",
      new THREE.Float32BufferAttribute(shades, 1),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }
}
