import * as THREE from "three";
import {
  CAPE_BOUNDS_EXPANSION,
  CAPE_FLUTTER_FREQUENCY,
  CAPE_FLUTTER_HORIZONTAL_VARIATION,
  CAPE_FLUTTER_PHASE_SPREAD,
} from "./CapeMotionTuning";

const TWO_PI = Math.PI * 2;

interface CapePanelState {
  readonly position: THREE.BufferAttribute;
  readonly basePositions: Float32Array;
  readonly weights: Float32Array;
  readonly phase: number;
  readonly flexScale: number;
  readonly lateralScale: number;
}

export class CapeMotionGeometry {
  private readonly panels: CapePanelState[];

  constructor(
    back: THREE.Group,
    left: THREE.Group,
    right: THREE.Group,
  ) {
    this.panels = [
      ...collectPanels(back, 0, 1, 0.55),
      ...collectPanels(left, Math.PI * 0.7, 0.88, 1),
      ...collectPanels(right, Math.PI * 1.3, 0.88, 1),
    ];
  }

  update(
    elapsedSeconds: number,
    bendX: number,
    bendZ: number,
    flutterAmplitude: number,
  ): void {
    const flutterTime = elapsedSeconds * CAPE_FLUTTER_FREQUENCY * TWO_PI;
    for (const panel of this.panels) {
      const positions = panel.position;
      for (let index = 0; index < positions.count; index += 1) {
        const offset = index * 3;
        const baseX = panel.basePositions[offset];
        const baseY = panel.basePositions[offset + 1];
        const baseZ = panel.basePositions[offset + 2];
        const weight = panel.weights[index];
        const smoothWeight = weight * weight * (3 - 2 * weight);
        const angleX = bendX * panel.flexScale * smoothWeight;
        const angleZ = bendZ * panel.lateralScale * smoothWeight;
        const cosineX = Math.cos(angleX);
        const sineX = Math.sin(angleX);
        const rotatedY = baseY * cosineX - baseZ * sineX;
        let rotatedZ = baseY * sineX + baseZ * cosineX;
        const cosineZ = Math.cos(angleZ);
        const sineZ = Math.sin(angleZ);
        const rotatedX = baseX * cosineZ - rotatedY * sineZ;
        const finalY = baseX * sineZ + rotatedY * cosineZ;
        rotatedZ +=
          Math.sin(
            flutterTime -
              weight * CAPE_FLUTTER_PHASE_SPREAD +
              baseX * CAPE_FLUTTER_HORIZONTAL_VARIATION +
              panel.phase,
          ) *
          flutterAmplitude *
          smoothWeight;
        positions.setXYZ(index, rotatedX, finalY, rotatedZ);
      }
      positions.needsUpdate = true;
    }
  }
}

function collectPanels(
  group: THREE.Group,
  phase: number,
  flexScale: number,
  lateralScale: number,
): CapePanelState[] {
  const panels: CapePanelState[] = [];
  const visited = new Set<THREE.BufferGeometry>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return;
    }
    const geometry = object.geometry;
    if (!(geometry instanceof THREE.BufferGeometry) || visited.has(geometry)) {
      return;
    }
    visited.add(geometry);
    const position = geometry.getAttribute("position");
    if (!(position instanceof THREE.BufferAttribute)) {
      return;
    }

    const basePositions = Float32Array.from(
      position.array as ArrayLike<number>,
    );
    position.setUsage(THREE.DynamicDrawUsage);
    geometry.computeBoundingSphere();
    if (geometry.boundingSphere) {
      geometry.boundingSphere.radius *= CAPE_BOUNDS_EXPANSION;
    }
    panels.push({
      position,
      basePositions,
      weights: createWeights(basePositions, position.count),
      phase,
      flexScale,
      lateralScale,
    });
  });
  return panels;
}

function createWeights(
  positions: Float32Array,
  vertexCount: number,
): Float32Array {
  let top = Number.NEGATIVE_INFINITY;
  let bottom = Number.POSITIVE_INFINITY;
  for (let index = 0; index < vertexCount; index += 1) {
    const y = positions[index * 3 + 1];
    top = Math.max(top, y);
    bottom = Math.min(bottom, y);
  }

  const height = Math.max(top - bottom, Number.EPSILON);
  const weights = new Float32Array(vertexCount);
  for (let index = 0; index < vertexCount; index += 1) {
    weights[index] = THREE.MathUtils.clamp(
      (top - positions[index * 3 + 1]) / height,
      0,
      1,
    );
  }
  return weights;
}
