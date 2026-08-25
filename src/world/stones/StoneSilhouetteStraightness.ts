/**
 * Screen-space detection for the one ruler-straight run that can dominate an
 * otherwise good low-poly stone. Broad facets remain desirable; only their
 * share of the complete gameplay-view outline is measured here.
 */

import type { StonePolygon, StoneVec3 } from "./StoneClipper";
import { calculateStonePolygonAreaAndNormal } from "./StoneMeshTopology";
import {
  visitStoneProjectedHulls,
  type StoneProjectedPoint,
} from "./StoneSilhouetteQuality";

/** Small projected turns read as one continuous edge at gameplay scale. */
const STRAIGHT_CHAIN_MAX_TURN = (10 * Math.PI) / 180;
const LENGTH_EPSILON = 1e-9;

interface StoneStraightnessViewMetrics {
  readonly dominantEdgeShare: number;
  readonly dominantStraightChainShare: number;
}

export interface StoneStraightnessMetrics {
  readonly views: number;
  readonly meanDominantEdgeShare: number;
  readonly worstDominantEdgeShare: number;
  readonly meanStraightChainShare: number;
  readonly worstStraightChainShare: number;
}

function collectVisiblePoints(faces: readonly StonePolygon[]): StoneVec3[] {
  const points: StoneVec3[] = [];
  for (const face of faces) {
    if (face.role === "bottom") continue;
    const [area] = calculateStonePolygonAreaAndNormal(face);
    if (!(area > 0)) continue;
    for (const point of face.points) points.push(point);
  }
  return points;
}

function edgeTurn(
  previous: StoneProjectedPoint,
  current: StoneProjectedPoint,
  next: StoneProjectedPoint,
): number {
  const inX = current.x - previous.x;
  const inY = current.y - previous.y;
  const outX = next.x - current.x;
  const outY = next.y - current.y;
  return Math.abs(
    Math.atan2(inX * outY - inY * outX, inX * outX + inY * outY),
  );
}

function measureView(
  hull: readonly StoneProjectedPoint[],
): StoneStraightnessViewMetrics {
  if (hull.length < 3) {
    return { dominantEdgeShare: 0, dominantStraightChainShare: 0 };
  }

  const edgeLengths = hull.map((point, index) => {
    const next = hull[(index + 1) % hull.length];
    return Math.hypot(next.x - point.x, next.y - point.y);
  });
  const perimeter = edgeLengths.reduce((sum, length) => sum + length, 0);
  if (!(perimeter > LENGTH_EPSILON)) {
    return { dominantEdgeShare: 0, dominantStraightChainShare: 0 };
  }

  let longestEdge = 0;
  let longestChain = 0;
  for (let start = 0; start < hull.length; start += 1) {
    longestEdge = Math.max(longestEdge, edgeLengths[start]);
    let chainLength = edgeLengths[start];
    for (let step = 1; step < hull.length; step += 1) {
      const junction = (start + step) % hull.length;
      const previous = hull[(junction + hull.length - 1) % hull.length];
      const current = hull[junction];
      const next = hull[(junction + 1) % hull.length];
      if (edgeTurn(previous, current, next) > STRAIGHT_CHAIN_MAX_TURN) break;
      chainLength += edgeLengths[junction];
    }
    longestChain = Math.max(longestChain, chainLength);
  }

  return {
    dominantEdgeShare: longestEdge / perimeter,
    dominantStraightChainShare: longestChain / perimeter,
  };
}

/** Measure straight outline dominance over all gameplay-like camera views. */
export function measureStoneSilhouetteStraightness(
  faces: readonly StonePolygon[],
): StoneStraightnessMetrics {
  const points = collectVisiblePoints(faces);
  let views = 0;
  let edgeTotal = 0;
  let chainTotal = 0;
  let worstDominantEdgeShare = 0;
  let worstStraightChainShare = 0;

  visitStoneProjectedHulls(points, (hull) => {
    const metrics = measureView(hull);
    edgeTotal += metrics.dominantEdgeShare;
    chainTotal += metrics.dominantStraightChainShare;
    worstDominantEdgeShare = Math.max(
      worstDominantEdgeShare,
      metrics.dominantEdgeShare,
    );
    worstStraightChainShare = Math.max(
      worstStraightChainShare,
      metrics.dominantStraightChainShare,
    );
    views += 1;
  });

  return {
    views,
    meanDominantEdgeShare: views > 0 ? edgeTotal / views : 0,
    worstDominantEdgeShare,
    meanStraightChainShare: views > 0 ? chainTotal / views : 0,
    worstStraightChainShare,
  };
}
