import { hashStoneCell, hashStoneLabel } from "./StoneRandom";
import type { StoneRecipe } from "./StoneRecipe";
import type { StonePolygon, StoneVec3 } from "./StoneClipper";
import { STONE_INDENTATION_MINIMUM_AREA } from "./StoneGeometryTuning";
import { calculateStonePolygonAreaAndNormal } from "./StoneMeshTopology";

export function addStoneIndentation(
  polygons: StonePolygon[],
  recipe: StoneRecipe,
): StonePolygon[] {
  if (recipe.archetype === "pebble" || recipe.archetype === "shard") {
    return polygons;
  }
  const roll =
    hashStoneCell(recipe.seed, hashStoneLabel(recipe.archetype), 0x4e6f7463) /
    4294967296;
  const indentationCount = roll < 0.02 ? 3 : roll < 0.1 ? 2 : roll < 0.35 ? 1 : 0;
  let result = polygons;
  for (let indentation = 0; indentation < indentationCount; indentation += 1) {
    result = addSingleStoneIndentation(result, recipe, indentation);
  }
  return result;
}

function addSingleStoneIndentation(
  polygons: StonePolygon[],
  recipe: StoneRecipe,
  indentation: number,
): StonePolygon[] {
  const candidates = polygons
    .map((polygon, index) => ({
      polygon,
      index,
      area: calculateStonePolygonAreaAndNormal(polygon)[0],
    }))
    .filter(
      ({ polygon, area }) =>
        (polygon.role === "side" || polygon.role === "top") &&
        polygon.points.length >= 4 &&
        area >= STONE_INDENTATION_MINIMUM_AREA,
    )
    .sort((left, right) => right.area - left.area)
    .slice(0, 4);
  if (candidates.length === 0) return polygons;

  const choice =
    hashStoneCell(recipe.seed, indentation, 0x496e6465) % candidates.length;
  const selected = candidates[choice];
  const face = selected.polygon;
  let centerX = 0;
  let centerY = 0;
  let centerZ = 0;
  for (const point of face.points) {
    centerX += point.x;
    centerY += point.y;
    centerZ += point.z;
  }
  centerX /= face.points.length;
  centerY /= face.points.length;
  centerZ /= face.points.length;

  const [, normalX, normalY, normalZ] =
    calculateStonePolygonAreaAndNormal(face);
  const detailRoll =
    hashStoneCell(recipe.seed, indentation, 0x44657074) / 4294967296;
  const insetScale = 0.62 + detailRoll * 0.14;
  const depth = 0.025 + detailRoll * 0.035;
  const inner = face.points.map((point, corner) => {
    const variation =
      hashStoneCell(recipe.seed, indentation * 17 + corner, 0x496e7365) /
      4294967296;
    const scale = insetScale * (0.86 + variation * 0.24);
    const cornerDepth = depth * (0.82 + variation * 0.28);
    return {
      x: centerX + (point.x - centerX) * scale - normalX * cornerDepth,
      y: centerY + (point.y - centerY) * scale - normalY * cornerDepth,
      z: centerZ + (point.z - centerZ) * scale - normalZ * cornerDepth,
    };
  });
  const floorCenter: StoneVec3 = {
    x: centerX - normalX * depth,
    y: centerY - normalY * depth,
    z: centerZ - normalZ * depth,
  };

  const replacement: StonePolygon[] = [];
  for (let index = 0; index < face.points.length; index += 1) {
    const next = (index + 1) % face.points.length;
    const outerA = face.points[index];
    const outerB = face.points[next];
    const innerA = inner[index];
    const innerB = inner[next];
    replacement.push(
      {
        planeId: `notch-wall:${indentation}:${face.planeId}:${index}:0`,
        role: "cut",
        points: [outerA, outerB, innerB],
      },
      {
        planeId: `notch-wall:${indentation}:${face.planeId}:${index}:1`,
        role: "cut",
        points: [outerA, innerB, innerA],
      },
      {
        planeId: `notch-floor:${indentation}:${face.planeId}:${index}`,
        role: "cut",
        points: [innerA, innerB, floorCenter],
      },
    );
  }

  return [
    ...polygons.slice(0, selected.index),
    ...replacement,
    ...polygons.slice(selected.index + 1),
  ];
}
