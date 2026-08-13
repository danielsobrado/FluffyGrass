import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const EPSILON = 1e-6;

function assert(condition, message) {
  if (!condition) throw new Error(`[water-flow] ${message}`);
}

function assertClose(actual, expected, message) {
  assert(
    Math.abs(actual - expected) <= EPSILON,
    `${message} Expected ${expected}, received ${actual}.`,
  );
}

const server = await createServer({
  configFile: false,
  root: REPOSITORY_ROOT,
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true },
});

try {
  const {
    createWaterFlowSample,
    resolveDownhillWaterFlow,
  } = await server.ssrLoadModule(
    "/src/world/hydrology/WaterFlowDirection.ts",
  );

  const resolution = 3;
  const positions = new Float32Array(resolution * resolution * 3);
  const data = new Float32Array(resolution * resolution * 4);
  const coverage = 0.8;

  for (let z = 0; z < resolution; z += 1) {
    for (let x = 0; x < resolution; x += 1) {
      const index = z * resolution + x;
      const positionOffset = index * 3;
      const dataOffset = index * 4;
      positions[positionOffset] = x;
      positions[positionOffset + 1] = -x;
      positions[positionOffset + 2] = z;
      data[dataOffset] = 1;
      data[dataOffset + 1] = 1;
      data[dataOffset + 2] = -coverage;
      data[dataOffset + 3] = 0;
    }
  }

  const center = 4;
  const flow = createWaterFlowSample();
  resolveDownhillWaterFlow(center, resolution, positions, data, flow);
  assertClose(flow.riverCoverage, coverage, "River coverage must be preserved.");
  assertClose(flow.flowX, 1, "Uphill source flow must flip downhill.");
  assertClose(flow.flowZ, 0, "Flow must stay on the river tangent.");
  assertClose(data[center * 4 + 2], coverage, "Packed flow must use corrected direction.");

  data[center * 4 + 2] = coverage;
  resolveDownhillWaterFlow(center, resolution, positions, data, flow);
  assertClose(flow.flowX, 1, "Already-downhill flow must remain unchanged.");

  console.log("[water-flow] Downhill packed surface-flow direction verified.");
} finally {
  await server.close();
}
