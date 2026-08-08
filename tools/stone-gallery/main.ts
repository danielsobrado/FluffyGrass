import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  STONE_ARCHETYPE_IDS,
  resolveStoneRecipe,
  type StoneArchetypeId,
} from "../../src/world/stones/StoneRecipe";
import { generateStoneMesh } from "../../src/world/stones/StoneGeometry";
import { WorldConfigLoader } from "../../src/world/WorldConfigLoader";
import { applyStoneSurfaceShader } from "../../src/world/stones/StoneGrowthShader";
import {
  STONE_PALETTES,
  colorizeStoneVertices,
  type StonePalette,
} from "../../src/world/stones/StonePalette";

/**
 * Look-development probe for the procedural stones. Replicates the world
 * scene's lighting and tone mapping (WorldApp.addLights + ACES) so palette
 * decisions made here hold in production. Not part of the app bundle.
 *
 * URL parameters:
 *   ?palette=meadowSage|steppeTan|graniteGrey|mossy  (default: mixed columns)
 *   ?seed=<number>  offset applied to every stone seed
 *   ?scale=<number> uniform stone scale (default 1)
 *   ?moss=<0..1>    moss amount (default 0.7)
 *   ?chips=0        disable close-range corner chips
 */

const params = new URLSearchParams(window.location.search);
const seedOffset = Number(params.get("seed") ?? "0") | 0;
const paletteParam = params.get("palette");
const scaleParam = Number(params.get("scale") ?? "1");
const focusParam = params.get("focus");
const mossParam = Number(params.get("moss") ?? "0.7");
const growthParam = params.get("growth") ?? "none";
// Chips are the close-range form; the gallery shows them by default.
const chipsParam = params.get("chips") !== "0";

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
if (focusParam) {
  camera.position.set(0.6, 2.6, 6.2);
} else {
  camera.position.set(0, 9.5, 15.5);
}

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.4, 0);
controls.update();

// WorldApp lighting, verbatim: hemisphere + warm sun, no shadows on stones.
scene.add(new THREE.HemisphereLight(0xdceeff, 0x3f3a2d, 1.45));
const sun = new THREE.DirectionalLight(0xfff3d7, 2.4);
sun.position.set(350, 500, 220).normalize().multiplyScalar(60);
scene.add(sun);

// Terrain-coloured ground so palettes are judged against the real backdrop.
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
const config = new WorldConfigLoader().parse(configRequest.responseText);
const material = new THREE.MeshLambertMaterial({ vertexColors: true });
material.dithering = true;
applyStoneSurfaceShader(material, config);

const paletteColumns: StonePalette[] = paletteParam
  ? [
      STONE_PALETTES[paletteParam as keyof typeof STONE_PALETTES] ??
        STONE_PALETTES.meadowSage,
    ]
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

const columns = 8;
const spacing = 2.6;
let totalTriangles = 0;
let totalVertices = 0;

const shownArchetypes: readonly StoneArchetypeId[] = focusParam
  ? [focusParam as StoneArchetypeId]
  : STONE_ARCHETYPE_IDS;

shownArchetypes.forEach((archetype: StoneArchetypeId, row: number) => {
  for (let column = 0; column < columns; column += 1) {
    const seed = (seedOffset + row * 101 + column * 17 + 5) >>> 0;
    const recipe = resolveStoneRecipe(archetype, seed);
    const mesh = generateStoneMesh(recipe, chipsParam);
    totalTriangles += mesh.metrics.triangleCount;
    totalVertices += mesh.metrics.vertexCount;

    const palette =
      paletteColumns[Math.min(column, paletteColumns.length - 1)];
    const colors = new Float32Array(mesh.tones.length * 3);
    colorizeStoneVertices(mesh.tones, mesh.wears, palette, {
      valueScale: 0.94 + ((seed * 2654435761) >>> 28) / 160,
    }, colors);

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
    const centers = new Float32Array(mesh.mosses.length * 3);
    const mossColors = new Float32Array(mesh.mosses.length * 3);
    const lichenColors = new Float32Array(mesh.mosses.length * 3);
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
      mossColors[offset] = palette.moss.r;
      mossColors[offset + 1] = palette.moss.g;
      mossColors[offset + 2] = palette.moss.b;
      lichenColors[offset] = palette.lichen.r;
      lichenColors[offset + 1] = palette.lichen.g;
      lichenColors[offset + 2] = palette.lichen.b;
    }
    geometry.setAttribute("stoneMoss", new THREE.BufferAttribute(mosses, 1));
    geometry.setAttribute("stoneLichen", new THREE.BufferAttribute(lichens, 1));
    geometry.setAttribute("stoneGrowthSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("stoneGrowthCenter", new THREE.BufferAttribute(centers, 3));
    geometry.setAttribute("stoneMossColor", new THREE.BufferAttribute(mossColors, 3));
    geometry.setAttribute("stoneLichenColor", new THREE.BufferAttribute(lichenColors, 3));
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
