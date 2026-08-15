import * as THREE from "three";
import {
  WORLD_SUN_XZ,
  type WorldVisualLocations,
  type WorldVisualPoint,
} from "./WorldVisualMatrixLocations";

export interface WorldVisualPose {
  name: string;
  camera: THREE.Vector3;
  target: THREE.Vector3;
}

const LOOK_HEIGHT = 1.15;

export function createWorldVisualPoses(
  locations: WorldVisualLocations,
): WorldVisualPose[] {
  const meadow = locations.meadow;
  return [
    ...distancePoses(meadow),
    look("g10-meadow", meadow, 7.5, 2.4, 0.55, 0.55),
    look("g10-water-edge", locations.waterEdge, 6.5, 2.1, 0.7, 0.2),
    look("g10-path-edge", locations.pathEdge, 5.5, 2, 0.8, -0.15),
    look("g10-rocky", locations.rocky, 6, 2.2, 0.4, 0.75),
    look("g10-slope", locations.slope, 8, 2.6, -0.55, 0.7),
    look("g10-dry", locations.dry, 7, 2.3, -0.8, 0.25),
    look("g10-steppe", locations.steppe, 8, 2.4, 0.35, 0.8),
    look("g10-alpine", locations.alpine, 8.5, 2.8, -0.7, 0.45),
    look("g10-grazing", meadow, 18, 1.35, 0.95, 0.3),
    look("g10-grazing-horizon", meadow, 42, 1.15, 0.98, 0.12),
    look("g10-meadow-gameplay", meadow, 32, 1.9, 0.82, 0.28),
    look("g10-elevated", meadow, 4, 42, 0.2, 0.2),
    alongSun("g10-sun-front", meadow, false, 8, 2.2),
    alongSun("g10-backlight", meadow, true, 8, 2.2),
    look("g10-character-walk", meadow, 5.4, 1.9, 0.9, 0.2),
    look("g10-character-run", meadow, 6.2, 1.7, 0.95, 0.08),
    look("g7-lod-ultra", meadow, 5.5, 1.8, 0.78, 0.42),
    look("g7-lod-bridge", meadow, 18, 2.1, 0.78, 0.42),
    look("g7-lod-near", meadow, 28, 2.6, 0.78, 0.42),
    look("g7-lod-mid", meadow, 55, 3.4, 0.78, 0.42),
    look("g7-lod-far", meadow, 90, 6.5, 0.78, 0.42),
    look("g7-lod-horizon", meadow, 160, 8, 0.92, 0.18),
    topDown("w0-river-shallow-topdown", locations.riverShallow, 7.5),
    grazing("w0-river-shallow-grazing", locations.riverShallow),
    grazing("w0-river-medium", locations.riverMedium, 14, 2.4),
    topDown("w0-lake-deep", locations.lakeDeep, 11),
    look("w0-shore", locations.shore, 7, 1.8, 0.85, 0.15),
    look("w0-wet-bank", locations.wetBank, 5.5, 1.6, 0.7, 0.35),
    look("w0-grass-water", locations.waterEdge, 6.5, 1.7, 0.9, 0.05),
    alongFlow("w0-stone-wake", locations.stoneWake, true, 6.5, 1.8),
    alongSun("w0-sun-glint", locations.riverShallow, false, 11, 1.7),
    alongSun("w0-away-from-sun", locations.riverShallow, true, 11, 1.7),
    alongFlow("w0-upstream", locations.riverMedium, false, 10, 1.9),
    alongFlow("w0-downstream", locations.riverMedium, true, 10, 1.9),
    look("w13-character-in-front", locations.shore, 5.2, 1.85, 0.95, 0.05),
    look("w13-character-submerged", locations.waistDeep, 4.8, 1.7, 0.8, 0.2),
    topDown("w13-cape-over-bed", locations.kneeDeep, 4.2),
    grazing("w13-detail-near", locations.riverShallow, 8, 1.6),
    grazing("w13-detail-far", locations.riverShallow, 130, 18),
  ];
}

function distancePoses(point: WorldVisualPoint): WorldVisualPose[] {
  const bands: Array<[string, number, number]> = [
    ["g0-02m", 2.2, 1.35],
    ["g0-08m", 8, 2.4],
    ["g0-20m", 20, 4.2],
    ["g0-50m", 50, 8],
    ["g0-120m", 120, 16],
    ["g0-far", 250, 28],
  ];
  return bands.map(([name, distance, height]) =>
    look(name, point, distance, height, 0.72, 0.72),
  );
}

function look(
  name: string,
  point: WorldVisualPoint,
  distance: number,
  height: number,
  dirX: number,
  dirZ: number,
): WorldVisualPose {
  const length = Math.hypot(dirX, dirZ) || 1;
  return {
    name,
    camera: new THREE.Vector3(
      point.x - (dirX / length) * distance,
      point.y + height,
      point.z - (dirZ / length) * distance,
    ),
    target: new THREE.Vector3(point.x, point.y + LOOK_HEIGHT, point.z),
  };
}

function topDown(
  name: string,
  point: WorldVisualPoint,
  height: number,
): WorldVisualPose {
  return {
    name,
    camera: new THREE.Vector3(point.x + 0.35, point.y + height, point.z + 0.28),
    target: new THREE.Vector3(point.x, point.y + 0.05, point.z),
  };
}

function grazing(
  name: string,
  point: WorldVisualPoint,
  distance = 12,
  height = 1.45,
): WorldVisualPose {
  return look(name, point, distance, height, 0.92, 0.18);
}

function alongSun(
  name: string,
  point: WorldVisualPoint,
  backlight: boolean,
  distance: number,
  height: number,
): WorldVisualPose {
  const sign = backlight ? 1 : -1;
  return look(
    name,
    point,
    distance,
    height,
    WORLD_SUN_XZ.x * sign,
    WORLD_SUN_XZ.z * sign,
  );
}

function alongFlow(
  name: string,
  point: WorldVisualPoint,
  downstream: boolean,
  distance: number,
  height: number,
): WorldVisualPose {
  const length = Math.hypot(point.flowX, point.flowZ);
  const dirX = length > 1e-4 ? point.flowX / length : 0.78;
  const dirZ = length > 1e-4 ? point.flowZ / length : 0.63;
  const sign = downstream ? 1 : -1;
  return look(name, point, distance, height, dirX * sign, dirZ * sign);
}
