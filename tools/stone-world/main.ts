import * as THREE from "three";
import { WorldConfigLoader } from "../../src/world/WorldConfigLoader";
import { validateWorldConfig } from "../../src/world/WorldConfigValidator";
import { TerrainField } from "../../src/world/TerrainField";
import { StoneField } from "../../src/world/stones/StoneField";
import { WorldStoneSystem } from "../../src/world/stones/WorldStoneSystem";
import type { WorldConfig } from "../../src/world/WorldConfig";
import {
  readStoneClusterQueryOverrides,
  StoneClusterTuningMenu,
  STONE_CLUSTER_QUERY_KEYS,
} from "./StoneClusterTuningMenu";

type GrowthMode = "natural" | "moss" | "lichen";

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

function readGrowthMode(value: string | null): GrowthMode {
  if (value === null) return "natural";
  if (value === "natural" || value === "moss" || value === "lichen") {
    return value;
  }
  throw new Error(`Invalid growth=${value}; expected natural, moss, or lichen.`);
}

function reportFailure(detail: unknown): void {
  const message =
    detail instanceof Error ? detail.stack ?? detail.message : String(detail);
  if (out) {
    out.textContent = `PROBE FAILED\n${message}`;
    out.style.color = "#b00";
    out.style.background = "#fff";
  }
  document.title = "Stone world probe · FAILED";
}

const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
const out = document.querySelector<HTMLElement>("#out");
if (!canvas) {
  throw new Error("Canvas #canvas missing.");
}

window.addEventListener("error", (event) =>
  reportFailure(event.error ?? event.message),
);
window.addEventListener("unhandledrejection", (event) =>
  reportFailure(event.reason),
);

const focusX = readNumberParam("x", 0, -1_000_000, 1_000_000);
const focusZ = readNumberParam("z", 0, -1_000_000, 1_000_000);
const cameraHeight = readNumberParam("h", 26, 1, 1000);
const cameraDistance = readNumberParam("d", 60, 1, 2000);
const span = readNumberParam("span", 320, 64, 4096);
const growth = readGrowthMode(params.get("growth"));
const showTuning = params.get("tune") === "1";
const clusterOverrides = readStoneClusterQueryOverrides(params);

const loadedConfig = await new WorldConfigLoader().load("./config/world.yaml");
const halfWorld = loadedConfig.worldSize * 0.5;
const patchHalfSpan = span * 0.5;
if (
  Math.abs(focusX) + patchHalfSpan > halfWorld ||
  Math.abs(focusZ) + patchHalfSpan > halfWorld
) {
  throw new Error(
    `Probe patch around ${focusX},${focusZ} with span ${span} leaves the configured world.`,
  );
}

const probeChunkRadius = Math.max(
  0,
  Math.floor(span / (loadedConfig.chunkSize * 2)) - 1,
);

function withProbeRadius(config: WorldConfig): WorldConfig {
  const stoneRadiusDesktop = Math.min(config.stoneRadiusDesktop, probeChunkRadius);
  const stoneRadiusCompact = Math.min(config.stoneRadiusCompact, probeChunkRadius);
  const stoneDetailRadius = Math.min(config.stoneDetailRadius, stoneRadiusDesktop);
  const stoneDetailRadiusCompact = Math.min(
    config.stoneDetailRadiusCompact,
    stoneDetailRadius,
    stoneRadiusCompact,
  );
  return {
    ...config,
    stoneRadiusDesktop,
    stoneRadiusCompact,
    stoneDetailRadius,
    stoneDetailRadiusCompact,
  };
}

function mergeStoneConfig(base: WorldConfig, overrides: Partial<WorldConfig>): WorldConfig {
  const merged = withProbeRadius({ ...base, ...overrides });
  validateWorldConfig(merged);
  return merged;
}

const config = mergeStoneConfig(loadedConfig, clusterOverrides);
const field = new TerrainField(config);

function applyGrowth(stoneField: StoneField): StoneField {
  if (growth !== "moss" && growth !== "lichen") {
    return stoneField;
  }
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
  return stoneField;
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#bfd4df");
scene.fog = new THREE.FogExp2("#bfd4df", 0.00105);
scene.add(new THREE.HemisphereLight(0xdceeff, 0x3f3a2d, 1.45));
const sun = new THREE.DirectionalLight(0xfff3d7, 2.4);
sun.position.set(350, 500, 220).normalize().multiplyScalar(200);
scene.add(sun);

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
const PATH_SOIL_COLOR = new THREE.Color("#574833");
for (let index = 0; index < terrainPositions.count; index += 1) {
  const x = terrainPositions.getX(index) + focusX;
  const z = terrainPositions.getZ(index) + focusZ;
  const height = field.sampleHeight(x, z);
  terrainPositions.setX(index, x);
  terrainPositions.setZ(index, z);
  terrainPositions.setY(index, height);
  field.sampleNormal(x, z, normalScratch);
  const suitability = field.sampleGrassSuitability(x, z, height, normalScratch);
  field.sampleColor(
    x,
    z,
    height,
    suitability,
    field.sampleEcologyAt(x, z, height),
    colorScratch,
  );
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
      colorScratch.lerp(PATH_SOIL_COLOR, tread * visibility);
    }
  }
  terrainColors[index * 3] = colorScratch.r;
  terrainColors[index * 3 + 1] = colorScratch.g;
  terrainColors[index * 3 + 2] = colorScratch.b;
}
terrainGeometry.setAttribute("color", new THREE.BufferAttribute(terrainColors, 3));
terrainGeometry.computeVertexNormals();
scene.add(
  new THREE.Mesh(
    terrainGeometry,
    new THREE.MeshLambertMaterial({ vertexColors: true }),
  ),
);

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

let stoneField = applyGrowth(new StoneField(field, config));
let stones = new WorldStoneSystem(scene, stoneField, config, false, false);
const focus = new THREE.Vector3(focusX, 0, focusZ);

function drainStoneBuild(system: WorldStoneSystem): void {
  system.update(focus, Number.POSITIVE_INFINITY);
  for (let pass = 0; pass < 400; pass += 1) {
    system.update(focus, Number.POSITIVE_INFINITY);
  }
}

function refreshDiagnostics(): void {
  const diagnostics = stones.getDiagnostics();
  const summary = stoneField.summarizeBounds(
    focusX - patchHalfSpan,
    focusZ - patchHalfSpan,
    focusX + patchHalfSpan,
    focusZ + patchHalfSpan,
  );
  if (!out) {
    return;
  }
  out.textContent =
    `focus ${focusX} / ${focusZ} · ${growth} growth · ground ${groundHeight.toFixed(1)} m\n` +
    `${diagnostics.stones} stones · ${diagnostics.activeChunks} batches · ` +
    `${diagnostics.drawCalls} draws · ${diagnostics.triangles.toLocaleString()} tris\n` +
    `build last ${diagnostics.lastBuildMs.toFixed(1)} ms · peak ${diagnostics.maxBuildMs.toFixed(1)} ms\n` +
    `clusters ${summary.activeClusters} · compact ${summary.compact} ridge ${summary.ridge} ` +
    `scree ${summary.scree} fan ${summary.fan}\n` +
    `members ${summary.acceptedMembers} · splits ${summary.splits} · singletons ${summary.singletons}`;
}

drainStoneBuild(stones);
refreshDiagnostics();

function rebuildStones(nextConfig: WorldConfig): void {
  stones.dispose();
  stoneField = applyGrowth(new StoneField(field, nextConfig));
  stones = new WorldStoneSystem(scene, stoneField, nextConfig, false, false);
  drainStoneBuild(stones);
  refreshDiagnostics();
}

if (showTuning) {
  new StoneClusterTuningMenu(
    config,
    (nextConfig) => {
      rebuildStones(withProbeRadius(nextConfig));
    },
    (current) => {
      const next = new URLSearchParams(params);
      next.set("tune", "1");
      next.set("x", String(focusX));
      next.set("z", String(focusZ));
      next.set("h", String(cameraHeight));
      next.set("d", String(cameraDistance));
      next.set("span", String(span));
      next.set("growth", growth);
      for (const key of STONE_CLUSTER_QUERY_KEYS) {
        next.set(key, String(current[key]));
      }
      return `${window.location.pathname}?${next.toString()}`;
    },
  );
}

function frame(): void {
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();
document.title = "Stone world probe · ready";
