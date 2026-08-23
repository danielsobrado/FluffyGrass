/**
 * Scoring a stone the way it is actually looked at.
 *
 * Every other shape metric in this system measures object space: face areas,
 * support radii, ring ratios. None of them know that a stone is seen from a
 * camera set above and behind the player, so a body can score well on paper and
 * still present a smooth dome in play -- the silhouette is what the eye reads
 * first, and nothing was measuring it.
 *
 * Two things are measured here, both on the projected outline:
 *
 * - How the outline's turning is distributed. A convex hull always turns
 *   through a full circle in total; what separates a rock from a dome is
 *   whether that turning arrives in a few decisive corners or is spread evenly
 *   over many small ones. This is the screen-space form of dominant planes.
 * - How close the outline is to a circle, which is the tell that no plane is
 *   dominant at all.
 *
 * Both are averaged over a ring of viewpoints and then re-weighted toward the
 * worst of them, because a body that reads well from three sides and as a cone
 * from the fourth is not a good body: the player walks around it.
 */

import type { StonePolygon, StoneVec3 } from "./StoneClipper";
import { calculateStonePolygonAreaAndNormal } from "./StoneMeshTopology";

/**
 * Depression angles the outline is judged from, in radians.
 *
 * Derived from the gameplay rig in `world.yaml` -- a camera 4.5 m back at 38
 * degrees of elevation, looking 1.05 m up -- which puts a stone a few metres
 * ahead of the player somewhere in this band. It is a heuristic about how rocks
 * are looked at rather than a binding of the runtime camera: quality scoring
 * runs at bake time and must not move when a player tilts the view.
 */
const VIEW_PITCHES: readonly number[] = [0.31, 0.52];

/** Viewpoints around the body. The player walks around it; so does this. */
const VIEW_AZIMUTHS = 8;

/** Corners that count as carrying the outline's structure. */
const DOMINANT_CORNERS = 4;

/** Weight on the least flattering view, against the average of them all. */
const WORST_VIEW_WEIGHT = 0.35;

/** 5 degree steps, so 45, 60, 90, 120 and 180 all land on whole samples. */
const SYMMETRY_SAMPLES = 72;
const SYMMETRY_SHIFTS: readonly number[] = [9, 12, 18, 24, 36];

/**
 * Normalized support difference at which a body counts as fully irregular.
 * Below it, the body is repeating itself to some degree.
 */
const SYMMETRY_TOLERANCE = 0.12;

const HULL_EPSILON = 1e-9;

interface Point2 {
  readonly x: number;
  readonly y: number;
}

/**
 * How strongly this body reads as a placed set of planes rather than a dome,
 * from the angles it is actually seen at. Roughly [-1, 1].
 */
export function scoreStoneSilhouette(faces: readonly StonePolygon[]): number {
  const points = collectPoints(faces);
  if (points.length < 4) return 0;

  let total = 0;
  let worst = Number.POSITIVE_INFINITY;
  let views = 0;
  for (const pitch of VIEW_PITCHES) {
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    for (let step = 0; step < VIEW_AZIMUTHS; step += 1) {
      const azimuth = (step / VIEW_AZIMUTHS) * Math.PI * 2;
      const cosAzimuth = Math.cos(azimuth);
      const sinAzimuth = Math.sin(azimuth);
      // Screen right is horizontal by construction, so the projection keeps the
      // world's up direction upright -- the same framing the player has.
      const rightX = -sinAzimuth;
      const rightZ = cosAzimuth;
      const upX = -sinPitch * cosAzimuth;
      const upY = cosPitch;
      const upZ = -sinPitch * sinAzimuth;

      const projected: Point2[] = points.map((point) => ({
        x: point.x * rightX + point.z * rightZ,
        y: point.x * upX + point.y * upY + point.z * upZ,
      }));
      const score = scoreOutline(convexHull(projected));
      total += score;
      worst = Math.min(worst, score);
      views += 1;
    }
  }
  if (views === 0) return 0;
  const mean = total / views;
  return mean * (1 - WORST_VIEW_WEIGHT) + worst * WORST_VIEW_WEIGHT;
}

/**
 * How nearly this body repeats itself under rotation, in [0, 1].
 *
 * A radial generator leaves its fingerprint here: sample the horizontal support
 * radius all the way round and a body built from evenly spaced sides will match
 * itself when turned by a whole fraction of a circle. Real stones do not, and
 * the point of measuring it is to reject the ones that do rather than to hope
 * jitter hid it.
 */
export function scoreStoneRotationalSymmetry(
  faces: readonly StonePolygon[],
): number {
  const points = collectPoints(faces);
  if (points.length < 4) return 0;

  const support = new Float64Array(SYMMETRY_SAMPLES);
  let mean = 0;
  for (let sample = 0; sample < SYMMETRY_SAMPLES; sample += 1) {
    const angle = (sample / SYMMETRY_SAMPLES) * Math.PI * 2;
    const dirX = Math.cos(angle);
    const dirZ = Math.sin(angle);
    let maximum = Number.NEGATIVE_INFINITY;
    for (const point of points) {
      const projection = point.x * dirX + point.z * dirZ;
      if (projection > maximum) maximum = projection;
    }
    support[sample] = maximum;
    mean += maximum;
  }
  mean /= SYMMETRY_SAMPLES;
  if (!(mean > HULL_EPSILON)) return 0;

  let strongest = 0;
  for (const shift of SYMMETRY_SHIFTS) {
    let difference = 0;
    for (let sample = 0; sample < SYMMETRY_SAMPLES; sample += 1) {
      difference += Math.abs(
        support[sample] - support[(sample + shift) % SYMMETRY_SAMPLES],
      );
    }
    const normalized = difference / SYMMETRY_SAMPLES / mean;
    strongest = Math.max(
      strongest,
      Math.max(0, 1 - normalized / SYMMETRY_TOLERANCE),
    );
  }
  return strongest;
}

function collectPoints(faces: readonly StonePolygon[]): StoneVec3[] {
  const points: StoneVec3[] = [];
  for (const face of faces) {
    if (face.role === "bottom") continue;
    const [area] = calculateStonePolygonAreaAndNormal(face);
    if (!(area > 0)) continue;
    for (const point of face.points) points.push(point);
  }
  return points;
}

function scoreOutline(hull: readonly Point2[]): number {
  if (hull.length < 3) return 0;
  const edges: number[] = [];
  const turns: number[] = [];
  let perimeter = 0;
  let doubleArea = 0;
  for (let index = 0; index < hull.length; index += 1) {
    const current = hull[index];
    const next = hull[(index + 1) % hull.length];
    const previous = hull[(index + hull.length - 1) % hull.length];
    const length = Math.hypot(next.x - current.x, next.y - current.y);
    edges.push(length);
    perimeter += length;
    doubleArea += current.x * next.y - next.x * current.y;

    const inX = current.x - previous.x;
    const inY = current.y - previous.y;
    const outX = next.x - current.x;
    const outY = next.y - current.y;
    const cross = inX * outY - inY * outX;
    const dot = inX * outX + inY * outY;
    turns.push(Math.abs(Math.atan2(cross, dot)));
  }
  if (!(perimeter > HULL_EPSILON)) return 0;

  turns.sort((left, right) => right - left);
  let dominantTurn = 0;
  const corners = Math.min(DOMINANT_CORNERS, turns.length);
  for (let index = 0; index < corners; index += 1) {
    dominantTurn += turns[index];
  }
  const turnConcentration = dominantTurn / (Math.PI * 2);

  edges.sort((left, right) => right - left);
  let longRun = 0;
  const runs = Math.min(3, edges.length);
  for (let index = 0; index < runs; index += 1) {
    longRun += edges[index];
  }
  longRun /= perimeter;

  const area = Math.abs(doubleArea) * 0.5;
  const circularity = (4 * Math.PI * area) / (perimeter * perimeter);

  return turnConcentration * 0.9 + longRun * 0.7 - circularity * 0.9;
}

/** Monotone chain, counter-clockwise, without collinear runs. */
function convexHull(points: readonly Point2[]): Point2[] {
  if (points.length < 3) return [...points];
  const sorted = [...points].sort(
    (left, right) => left.x - right.x || left.y - right.y,
  );
  const build = (source: readonly Point2[]): Point2[] => {
    const chain: Point2[] = [];
    for (const point of source) {
      while (chain.length >= 2) {
        const a = chain[chain.length - 2];
        const b = chain[chain.length - 1];
        const cross =
          (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
        if (cross > HULL_EPSILON) break;
        chain.pop();
      }
      chain.push(point);
    }
    chain.pop();
    return chain;
  };
  return [...build(sorted), ...build([...sorted].reverse())];
}
