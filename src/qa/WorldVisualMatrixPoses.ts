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

export type RiverTuningLandmark =
  | "pool"
  | "riffle"
  | "straight"
  | "insideBend"
  | "outsideBend"
  | "wetBank"
  | "stoneWake";

export function createRiverTuningPose(
  locations: WorldVisualLocations,
  landmark: RiverTuningLandmark,
): WorldVisualPose {
  switch (landmark) {
    case "pool":
      return grazingAlongFlow("qa-river-pool", locations.riverPool, true, 12, 1.5);
    case "riffle":
      return alongFlow("qa-river-riffle", locations.riverRiffle, false, 11, 1.6);
    case "straight":
      return acrossChannel("qa-river-straight", locations.riverStraight, 8, 1.8);
    case "insideBend":
      return acrossChannel("qa-river-inside", locations.riverInsideBend, 7.5, 1.7);
    case "outsideBend":
      return acrossChannel("qa-river-outside", locations.riverOutsideBend, 7.5, 1.7);
    case "wetBank":
      return look("qa-river-wet-bank", locations.wetBank, 5.5, 1.6, 0.7, 0.35);
    case "stoneWake":
      return alongFlow("qa-river-stone-wake", locations.stoneWake, true, 6.5, 1.8);
  }
}

/**
 * Fixed open-meadow poses for the 6-7 m LOD-ring A/B, added outside the scanned
 * landmark set on purpose.
 *
 * Every scanned pose in this seed lands on the riverbank, which is useless for
 * judging near-grass coverage: half the frame is water and the bank slope
 * confounds the distance bands. This point was found by sweeping the terrain
 * field for full grass suitability, near-flat ground, no path within 18 m, and
 * no water or thin grass anywhere within 40 m — 2.1 m of relief over that whole
 * disc, 59 m from the dense-ground spawn so it streams in quickly.
 *
 * Fixed world coordinates rather than a landmark search, because an A/B is only
 * meaningful if both trees frame the identical ground.
 */
const AB_MEADOW: WorldVisualPoint = {
  x: 588,
  y: 5.33,
  z: 372,
  waterDepth: 0,
  waterCoverage: 0,
  riverCoverage: 0,
  lakeCoverage: 0,
  flowX: 0,
  flowZ: 0,
  moisture: 0,
  fertility: 0,
  exposure: 0,
  rockiness: 0,
  disturbance: 0,
  slope: 0,
  pathMask: 1,
  stoneClearance: 1,
  stoneVicinity: 1,
  waterProximity: 0,
  biomeIndex: 0,
  riverMorphology: 0,
  riverBend: 0,
  riverLateral: 0,
  riverFallDrop: 0,
  riverFallStep: 0,
};

function abMeadowPoses(): WorldVisualPose[] {
  // Front-lit: the sun is behind the camera, so what the frame shows is albedo
  // and coverage rather than transmission. The ring is a diffuse-shading and
  // density artefact, and backlight would only mask it.
  const lit = { x: -WORLD_SUN_XZ.x, z: -WORLD_SUN_XZ.z };
  // Perpendicular to the sun. Up-facing normals gain most against a side light,
  // so if any flattening mismatch survives, this is where it shows.
  const side = { x: -WORLD_SUN_XZ.z, z: WORLD_SUN_XZ.x };
  return [
    // Eye level, 12 m back: the 6-7 m band sits across the middle of the frame.
    look("ab-ring-eye", AB_MEADOW, 12, 1.9, lit.x, lit.z),
    look("ab-ring-side", AB_MEADOW, 12, 1.9, side.x, side.z),
    // Raised and looking down, so the whole 0-25 m coverage ramp is visible at
    // once and bare ground reads directly.
    look("ab-ring-down", AB_MEADOW, 14, 7, lit.x, lit.z),
  ];
}

/**
 * A macro stone cluster this seed actually has, at fixed world coordinates.
 *
 * `stoneFormation` cannot find one. Its score rejects any point whose
 * `stoneVicinity` is 1, and around the spawn every sampled point is 1 — the
 * nearest in-world active cluster is 179.8 m away, and the 16 m search step
 * steps over cluster footprints on the way. With every candidate scoring zero
 * the landmark degenerates onto the same coordinates as `rocky`, so both frame
 * bare meadow and the stone system goes unphotographed.
 *
 * Measured against StoneClusterField over the lattice around the spawn: a ridge
 * cluster of budget 7, major radius 11.8 m, suitability 0.33, ground 6.3 m.
 * Fixed coordinates rather than a search, because the whole point is to look at
 * known stone rather than at whatever scored least badly.
 */
const STONE_TRUTH: WorldVisualPoint = {
  x: 535.3,
  y: 6.3,
  z: 200.7,
  waterDepth: 0,
  waterCoverage: 0,
  riverCoverage: 0,
  lakeCoverage: 0,
  flowX: 0,
  flowZ: 0,
  moisture: 0,
  fertility: 0,
  exposure: 0,
  rockiness: 0,
  disturbance: 0,
  slope: 0,
  pathMask: 1,
  stoneClearance: 1,
  stoneVicinity: 0,
  waterProximity: 0,
  biomeIndex: 0,
  riverMorphology: 0,
  riverBend: 0,
  riverLateral: 0,
  riverFallDrop: 0,
  riverFallStep: 0,
};

function stoneTruthPoses(): WorldVisualPose[] {
  // Steep and from above for the same reason the s0 poses are: an eye-height
  // camera on sloping ground looks over the crest the cluster sits on.
  return [
    look("s1-truth", STONE_TRUTH, 14, 9, 0.72, 0.5),
    look("s1-truth-close", STONE_TRUTH, 7, 4.5, 0.85, 0.3),
    look("s1-truth-wide", STONE_TRUTH, 26, 16, 0.6, 0.7),
    look("s1-truth-eye", STONE_TRUTH, 11, 1.9, 0.8, 0.4),
  ];
}

export function createWorldVisualPoses(
  locations: WorldVisualLocations,
): WorldVisualPose[] {
  const meadow = locations.meadow;
  return [
    ...stoneTruthPoses(),
    ...abMeadowPoses(),
    ...distancePoses(meadow),
    look("g10-meadow", meadow, 7.5, 2.4, 0.55, 0.55),
    look("g10-water-edge", locations.waterEdge, 6.5, 2.1, 0.7, 0.2),
    look("g10-path-edge", locations.pathEdge, 5.5, 2, 0.8, -0.15),
    look("g10-rocky", locations.rocky, 6, 2.2, 0.4, 0.75),
    // Stone geology needs its own poses: `g10-rocky` follows ecology rockiness,
    // which is not where the macro lattice actually puts formations, so it
    // routinely frames empty meadow. Three ranges read composition, grounding,
    // and silhouette against the sky respectively.
    // Steep three-quarter angles on purpose. A formation sits on whatever slope
    // the geology put it on, and an eye-height camera 9 m away simply looks over
    // the crest into the distance — every shallow framing tried here missed the
    // stones entirely. A camera above the formation cannot be occluded by the
    // ground the formation stands on.
    look("s0-formation", locations.stoneFormation, 8, 6, 0.72, 0.5),
    look("s0-formation-close", locations.stoneFormation, 4.5, 3.4, 0.85, 0.3),
    look("s0-formation-wide", locations.stoneFormation, 16, 12, 0.6, 0.7),
    alongSun("s0-formation-backlight", locations.stoneFormation, true, 7.5, 5.5),
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
    topDown("w0-river-pool-topdown", locations.riverPool, 8),
    grazingAlongFlow("w0-river-pool-grazing", locations.riverPool, true, 12, 1.5),
    topDown("w0-river-riffle-topdown", locations.riverRiffle, 7),
    alongFlow("w0-river-riffle-upstream", locations.riverRiffle, false, 11, 1.6),
    acrossChannel("w0-river-inside-bend", locations.riverInsideBend, 7.5, 1.7),
    acrossChannel("w0-river-outside-bend", locations.riverOutsideBend, 7.5, 1.7),
    acrossChannel("w0-river-straight-cross", locations.riverStraight, 8, 1.8),
    // Looking back upstream at the fall, from the plunge reach it lands in.
    alongFlow("w0-waterfall", locations.waterfall, false, 22, 6),
    alongFlow("w0-waterfall-close", locations.waterfall, false, 11, 3.2),
    grazingAlongFlow("w0-waterfall-wide", locations.waterfall, false, 34, 9),
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

function grazingAlongFlow(
  name: string,
  point: WorldVisualPoint,
  downstream: boolean,
  distance: number,
  height: number,
): WorldVisualPose {
  return alongFlow(name, point, downstream, distance, height);
}

function acrossChannel(
  name: string,
  point: WorldVisualPoint,
  distance: number,
  height: number,
): WorldVisualPose {
  const length = Math.hypot(point.flowX, point.flowZ);
  const dirX = length > 1e-4 ? -point.flowZ / length : -0.63;
  const dirZ = length > 1e-4 ? point.flowX / length : 0.78;
  return look(name, point, distance, height, dirX, dirZ);
}
