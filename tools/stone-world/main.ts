import * as THREE from "three";
import { WorldConfigLoader } from "../../src/world/WorldConfigLoader";
import { TerrainField } from "../../src/world/TerrainField";
import { StoneField } from "../../src/world/stones/StoneField";
import { WorldStoneSystem } from "../../src/world/stones/WorldStoneSystem";

/**
 * In-world placement probe: real terrain field, real stone field, real
 * streaming system, with the terrain drawn as a plain vertex-coloured mesh
 * instead of the streamed chunk pipeline. That keeps the page fast enough to
 * screenshot under SwiftShader while still exercising the code that decides
 * where stones stand. Not part of the app bundle.
 *
 * URL parameters:
 *   ?x=<metres>&z=<metres>  camera focus (default: world origin)
 *   ?h=<metres>             camera height above ground (default 26)
 *   ?d=<metres>             camera pull-back distance (default 60)
 *   ?span=<metres>          terrain patch size (default 320)
 */

const params = new URLSearchParams(window.location.search);
const focusX = Number(params.get("x") ?? "0");
const focusZ = Number(params.get("z") ?? "0");
const cameraHeight = Number(params.get("h") ?? "26");
const cameraDistance = Number(params.get("d") ?? "60");
const span = Number(params.get("span") ?? "320");
const growth = params.get("growth") ?? "natural";

const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
const out = document.querySelector<HTMLElement>("#out");
if (!canvas) {
  throw new Error("Canvas #canvas missing.");
}

// A headless capture of a failed probe is just a blank page, which is
// indistinguishable from a slow one. Surface failures into the page itself.
function reportFailure(detail: unknown): void {
  const message = detail instanceof Error ? detail.stack ?? detail.message : String(detail);
  if (out) {
    out.textContent = `PROBE FAILED\n${message}`;
    out.style.color = "#b00";
    out.style.background = "#fff";
  }
  document.title = "Stone world probe · FAILED";
}
window.addEventListener("error", (event) => reportFailure(event.error ?? event.message));
window.addEventListener("unhandledrejection", (event) => reportFailure(event.reason));

// Synchronous on purpose. Headless capture fires its screenshot at the `load`
// event, and `load` does not wait for a module's top-level `await` to settle —
// so an async config fetch means the capture lands on an empty page and the
// browser exits before the scene exists. Blocking here keeps the whole build
// inside module evaluation, which `load` does wait for.
const configRequest = new XMLHttpRequest();
configRequest.open("GET", "./config/world.yaml", false);
configRequest.send();
const loadedConfig = new WorldConfigLoader().parse(configRequest.responseText);
// Keep every streamed stone over the finite terrain patch rendered by this
// probe. Production streams terrain and stones together; the probe does not.
const probeChunkRadius = Math.max(
  1,
  Math.floor(span / (loadedConfig.chunkSize * 2)) - 1,
);
const config = {
  ...loadedConfig,
  stoneRadiusDesktop: Math.min(
    loadedConfig.stoneRadiusDesktop,
    probeChunkRadius,
  ),
  stoneRadiusCompact: Math.min(
    loadedConfig.stoneRadiusCompact,
    probeChunkRadius,
  ),
};
const field = new TerrainField(config);
const stoneField = new StoneField(field, config);
if (growth === "moss" || growth === "lichen") {
  const collect = stoneField.collectChunkInstances.bind(stoneField);
  stoneField.collectChunkInstances = ((...args: Parameters<typeof collect>) => {
    const instances = collect(...args);
    for (const instance of instances) {
      const mutable = instance as {
        moss: number;
        paletteKey: "meadowSage" | "steppeTan" | "graniteGrey" | "mossy";
        graniteBlend: number;
      };
      if (growth === "moss") {
        mutable.moss = 0.95;
        mutable.paletteKey = "mossy";
        mutable.graniteBlend = 0;
      } else {
        mutable.moss = 0.03;
        mutable.paletteKey = "graniteGrey";
        mutable.graniteBlend = 1;
      }
    }
    return instances;
  }) as typeof stoneField.collectChunkInstances;
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#bfd4df");
scene.fog = new THREE.FogExp2("#bfd4df", 0.00105);

// WorldApp lighting, verbatim.
scene.add(new THREE.HemisphereLight(0xdceeff, 0x3f3a2d, 1.45));
const sun = new THREE.DirectionalLight(0xfff3d7, 2.4);
sun.position.set(350, 500, 220).normalize().multiplyScalar(200);
scene.add(sun);

// Terrain patch: same height and colour fields the streamer uses.
const resolution = 192;
const terrainGeometry = new THREE.PlaneGeometry(
  span,
  span,
  resolution - 1,
  resolution - 1,
);
terrainGeometry.rotateX(-Math.PI / 2);
const terrainPositions = terrainGeometry.getAttribute("position");
const terrainColors = new Float32Array(terrainPositions.count * 3);
const normalScratch = new THREE.Vector3();
const colorScratch = new THREE.Color();
const pathScratch = new THREE.Vector2();
/** Matches TerrainStreamer's uTerrainPathSoil, so ways read the same here. */
const PATH_SOIL_COLOR = new THREE.Color("#574833");
for (let index = 0; index < terrainPositions.count; index += 1) {
  const x = terrainPositions.getX(index) + focusX;
  const z = terrainPositions.getZ(index) + focusZ;
  const height = field.sampleHeight(x, z);
  terrainPositions.setX(index, x);
  terrainPositions.setZ(index, z);
  terrainPositions.setY(index, height);
  field.sampleNormal(x, z, normalScratch);
  const suitability = field.sampleGrassSuitability(
    x,
    z,
    height,
    normalScratch,
  );
  field.sampleColor(x, z, height, normalScratch, suitability, colorScratch);

  // Tint the walking ways into the patch. The real soil comes from the
  // terrain shader, which this probe does not run, so without this the ways
  // are invisible here — and a verge of stones lining an invisible way cannot
  // be judged at all.
  field.samplePathDistances(x, z, pathScratch);
  const visibility = field.samplePathVisibility(height);
  if (visibility > 0.01) {
    const tread = Math.min(
      1,
      Math.max(
        1 -
          Math.abs(pathScratch.x) /
            (config.pathWidth * 0.5 + config.pathEdgeRoughness),
        1 -
          Math.abs(pathScratch.y) /
            (config.pathBranchWidth * 0.5 + config.pathEdgeRoughness),
      ),
    );
    if (tread > 0) {
      const soil = tread * visibility;
      colorScratch.lerp(PATH_SOIL_COLOR, soil);
    }
  }

  terrainColors[index * 3] = colorScratch.r;
  terrainColors[index * 3 + 1] = colorScratch.g;
  terrainColors[index * 3 + 2] = colorScratch.b;
}
terrainGeometry.setAttribute(
  "color",
  new THREE.BufferAttribute(terrainColors, 3),
);
terrainGeometry.computeVertexNormals();
scene.add(
  new THREE.Mesh(
    terrainGeometry,
    new THREE.MeshLambertMaterial({ vertexColors: true }),
  ),
);

const stones = new WorldStoneSystem(scene, stoneField, config, false, false);
const focus = new THREE.Vector3(focusX, 0, focusZ);
// Force every chunk in range to build in one go rather than over frames.
stones.update(focus, Number.POSITIVE_INFINITY);
for (let pass = 0; pass < 400; pass += 1) {
  stones.update(focus, Number.POSITIVE_INFINITY);
}

const groundHeight = field.sampleHeight(focusX, focusZ);
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  3000,
);
camera.position.set(
  focusX - cameraDistance * 0.7,
  groundHeight + cameraHeight,
  focusZ + cameraDistance * 0.7,
);
camera.lookAt(focusX, groundHeight + 2, focusZ);

const diagnostics = stones.getDiagnostics();
if (out) {
  out.textContent =
    `focus ${focusX} / ${focusZ} · ${growth} growth · ground ${groundHeight.toFixed(1)} m\n` +
    `${diagnostics.stones} stones · ${diagnostics.activeChunks} chunks · ` +
    `${diagnostics.triangles.toLocaleString()} tris · ` +
    `build peak ${diagnostics.maxBuildMs.toFixed(1)} ms`;
}

// Keep drawing rather than rendering once. The page loads its config through
// fetch, so headless capture can fire before the scene exists; a standing
// render loop makes any capture time after build a valid one.
function frame(): void {
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();
document.title = "Stone world probe · ready";
