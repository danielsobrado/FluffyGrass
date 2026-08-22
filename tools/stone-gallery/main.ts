import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  STONE_ARCHETYPE_IDS,
  type StoneArchetypeId,
} from "../../src/world/stones/StoneRecipe";
import { resolveQualityStoneRecipe } from "../../src/world/stones/StoneShapeQuality";
import { generateStoneMesh } from "../../src/world/stones/StoneGeometry";
import { WorldConfigLoader } from "../../src/world/WorldConfigLoader";
import {
  WORLD_DEFAULT_HEMISPHERE_GROUND,
  WORLD_DEFAULT_HEMISPHERE_INTENSITY,
  WORLD_DEFAULT_HEMISPHERE_SKY,
  WORLD_DEFAULT_SUN,
  WORLD_DEFAULT_SUN_INTENSITY,
  WORLD_SUN_DIRECTION,
} from "../../src/app/WorldEnvironmentTuning";
import { resolveStoneVertexWetness } from "../../src/world/stones/StoneWetness";
import { applyStoneSurfaceShader } from "../../src/world/stones/StoneGrowthShader";
import {
  STONE_PALETTES,
  colorizeStoneVertices,
  type StonePalette,
  type StonePaletteKey,
} from "../../src/world/stones/StonePalette";

type GrowthMode = "none" | "moss" | "lichen";

const params = new URLSearchParams(window.location.search);

function readNumberParam(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = params.get(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(
      `Invalid ${name}=${raw}; expected a number in [${minimum}, ${maximum}].`,
    );
  }
  return value;
}

function isArchetype(value: string): value is StoneArchetypeId {
  return (STONE_ARCHETYPE_IDS as readonly string[]).includes(value);
}

function isPalette(value: string): value is StonePaletteKey {
  return Object.prototype.hasOwnProperty.call(STONE_PALETTES, value);
}

function readGrowthMode(value: string | null): GrowthMode {
  if (value === null) return "none";
  if (value === "none" || value === "moss" || value === "lichen") {
    return value;
  }
  throw new Error(`Invalid growth=${value}; expected none, moss, or lichen.`);
}

const seedOffset = Math.trunc(
  readNumberParam("seed", 0, -2147483648, 2147483647),
);
const paletteParam = params.get("palette");
if (paletteParam !== null && !isPalette(paletteParam)) {
  throw new Error(`Unknown stone palette: ${paletteParam}.`);
}
const scaleParam = readNumberParam("scale", 1, 0.05, 20);
const focusParam = params.get("focus");
if (focusParam !== null && !isArchetype(focusParam)) {
  throw new Error(`Unknown stone archetype: ${focusParam}.`);
}
const mossParam = readNumberParam("moss", 0.7, 0, 1);
/** Waterline as a share of body height, for inspecting the wet-stone response. */
const wetParam = readNumberParam("wet", 0, 0, 1);
const growthParam = readGrowthMode(params.get("growth"));
const chipsParam = params.get("chips") !== "0";
/** Contact shading and edge softness only read at close range; frame for it. */
const columnsParam = Math.trunc(readNumberParam("columns", 8, 1, 16));
const distanceParam = readNumberParam("dist", 0, 0, 80);

const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
const out = document.querySelector<HTMLElement>("#out");
if (!canvas) {
  throw new Error("Canvas #canvas missing.");
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#bfd4df");

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);
if (distanceParam > 0) {
  camera.position.set(0, distanceParam * 0.34, distanceParam);
} else if (focusParam) {
  camera.position.set(0.6, 2.6, 6.2);
} else {
  camera.position.set(0, 9.5, 15.5);
}

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.4, 0);
controls.update();

// Stone paint is judged against exposure, so the probe has to stand under the
// world's own lights. A brighter ambient here would flatten every value read
// and send tuning off toward colours that go dark in the real field.
scene.add(
  new THREE.HemisphereLight(
    WORLD_DEFAULT_HEMISPHERE_SKY,
    WORLD_DEFAULT_HEMISPHERE_GROUND,
    WORLD_DEFAULT_HEMISPHERE_INTENSITY,
  ),
);
const sun = new THREE.DirectionalLight(
  WORLD_DEFAULT_SUN,
  WORLD_DEFAULT_SUN_INTENSITY,
);
sun.position.set(...WORLD_SUN_DIRECTION).normalize().multiplyScalar(60);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshLambertMaterial({
    color: new THREE.Color(growthParam === "none" ? "#466f3a" : "#66543a"),
  }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const configRequest = new XMLHttpRequest();
configRequest.open("GET", "/config/world.yaml", false);
configRequest.send();
if (configRequest.status !== 200 && configRequest.status !== 0) {
  throw new Error(`Unable to load world config: HTTP ${configRequest.status}.`);
}
const config = new WorldConfigLoader().parse(configRequest.responseText);
const material = new THREE.MeshLambertMaterial({ vertexColors: true });
material.dithering = true;
applyStoneSurfaceShader(material, config);

const paletteColumns: StonePalette[] = paletteParam
  ? [STONE_PALETTES[paletteParam]]
  : [
      STONE_PALETTES.meadowSage,
      STONE_PALETTES.meadowSage,
      STONE_PALETTES.graniteGrey,
      STONE_PALETTES.graniteGrey,
      STONE_PALETTES.steppeTan,
      STONE_PALETTES.steppeTan,
      STONE_PALETTES.mossy,
      STONE_PALETTES.mossy,
    ];

const columns = columnsParam;
const spacing = 2.6;
const GROWTH_EPSILON = 1e-4;
let totalTriangles = 0;
let totalVertices = 0;

const shownArchetypes: readonly StoneArchetypeId[] = focusParam
  ? [focusParam]
  : STONE_ARCHETYPE_IDS;

shownArchetypes.forEach((archetype: StoneArchetypeId, row: number) => {
  for (let column = 0; column < columns; column += 1) {
    const seed = (seedOffset + row * 101 + column * 17 + 5) >>> 0;
    const recipe = resolveQualityStoneRecipe(archetype, seed);
    const mesh = generateStoneMesh(recipe, chipsParam);
    totalTriangles += mesh.metrics.triangleCount;
    totalVertices += mesh.metrics.vertexCount;

    const palette =
      paletteColumns[Math.min(column, paletteColumns.length - 1)];
    const colors = new Float32Array(mesh.tones.length * 3);
    colorizeStoneVertices(
      mesh.tones,
      mesh.wears,
      mesh.bounces,
      mesh.weatherings,
      mesh.cavities,
      undefined,
      palette,
      {
        valueScale: 0.94 + ((seed * 2654435761) >>> 28) / 160,
      },
      colors,
    );

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(mesh.positions, 3),
    );
    geometry.setAttribute("normal", new THREE.BufferAttribute(mesh.normals, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mosses = new Float32Array(mesh.mosses.length);
    const lichens = new Float32Array(mesh.mosses.length);
    const seeds = new Float32Array(mesh.mosses.length);
    const growthPositions = new Float32Array(mesh.mosses.length * 3);
    const mossColors = new Float32Array(mesh.mosses.length * 3);
    const wets = new Float32Array(mesh.mosses.length);
    const beddings = new Float32Array(mesh.mosses.length);
    const lichenColors = new Float32Array(mesh.mosses.length * 3);
    const inverseGrowthRadius =
      0.5 / Math.max(mesh.metrics.footprintRadius, GROWTH_EPSILON);
    const inverseGrowthHeight =
      1 / Math.max(mesh.metrics.height, GROWTH_EPSILON);
    for (let vertex = 0; vertex < mesh.mosses.length; vertex += 1) {
      mosses[vertex] =
        growthParam === "moss"
          ? Math.max(
              Math.min(1, mesh.mosses[vertex] * (1.5 + mossParam)),
              mossParam * 0.82,
            )
          : 0;
      lichens[vertex] = growthParam === "lichen" ? 0.82 : 0;
      seeds[vertex] = (seed % 104729) / 104729;
      const offset = vertex * 3;
      growthPositions[offset] = mesh.positions[offset] * inverseGrowthRadius;
      growthPositions[offset + 1] =
        mesh.positions[offset + 1] * inverseGrowthHeight;
      growthPositions[offset + 2] =
        mesh.positions[offset + 2] * inverseGrowthRadius;
      mossColors[offset] = palette.moss.r;
      mossColors[offset + 1] = palette.moss.g;
      mossColors[offset + 2] = palette.moss.b;
      lichenColors[offset] = palette.lichen.r;
      lichenColors[offset + 1] = palette.lichen.g;
      lichenColors[offset + 2] = palette.lichen.b;
      wets[vertex] =
        wetParam > 0
          ? resolveStoneVertexWetness(
              { strength: 1, topY: mesh.metrics.height * wetParam },
              mesh.positions[offset + 1],
            )
          : 0;
      beddings[vertex] = mesh.metrics.bedding;
    }
    geometry.setAttribute("stoneWet", new THREE.BufferAttribute(wets, 1));
    geometry.setAttribute(
      "stoneBedding",
      new THREE.BufferAttribute(beddings, 1),
    );
    geometry.setAttribute(
      "stoneWeathering",
      new THREE.BufferAttribute(mesh.weatherings, 1),
    );
    geometry.setAttribute("stoneMoss", new THREE.BufferAttribute(mosses, 1));
    geometry.setAttribute("stoneLichen", new THREE.BufferAttribute(lichens, 1));
    geometry.setAttribute("stoneGrowthSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute(
      "stoneGrowthPosition",
      new THREE.BufferAttribute(growthPositions, 3),
    );
    geometry.setAttribute(
      "stoneMossColor",
      new THREE.BufferAttribute(mossColors, 3),
    );
    geometry.setAttribute(
      "stoneLichenColor",
      new THREE.BufferAttribute(lichenColors, 3),
    );
    geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));

    const object = new THREE.Mesh(geometry, material);
    const rowScale =
      archetype === "pebble"
        ? 0.4
        : archetype === "outcrop"
          ? 1.3
          : archetype === "slab"
            ? 1.15
            : 1;
    const scale = scaleParam * rowScale;
    object.scale.setScalar(scale);
    object.position.set(
      (column - (columns - 1) / 2) * spacing,
      -mesh.metrics.embed * mesh.metrics.height * scale * 0.5,
      (row - (shownArchetypes.length - 1) / 2) * spacing,
    );
    object.rotation.y = (seed % 360) * (Math.PI / 180);
    scene.add(object);
  }
});

if (out) {
  out.textContent = `${shownArchetypes.length * columns} stones · ${totalTriangles.toLocaleString()} tris · ${totalVertices.toLocaleString()} verts · rows: ${shownArchetypes.join(", ")}`;
}

function render(): void {
  renderer.render(scene, camera);
}
controls.addEventListener("change", render);
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
});
render();
(window as unknown as { __STONES_READY?: boolean }).__STONES_READY = true;
document.title = "Stone gallery probe · ready";
