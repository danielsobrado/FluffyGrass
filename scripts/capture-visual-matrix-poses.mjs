// Captures every visual-matrix pose matching a substring, in ONE browser
// session. Booting the world costs minutes, so a script that reboots per pose
// spends nearly all its time on startup.
//
// Usage: node scripts/capture-visual-matrix-poses.mjs <substring> <outDir> [devPort]
// Requires a dev server already running (npm run dev -- --port <devPort>).
//
// Env overrides: FLUFFY_BROWSER (browser binary), FLUFFY_CDP_PORT,
// FLUFFY_GRASS_LAYER (near/base/boost/bridge/mid/far isolation),
// FLUFFY_PROFILE (desktop/compact runtime profile),
// FLUFFY_NO_TERRAIN (hide terrain and water through the isolation harness),
// FLUFFY_NO_GRASS (hide every grass population through the isolation harness),
// FLUFFY_NO_WATER (hide only water through the isolation harness).
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { setTimeout as sleep } from "node:timers/promises";

const RAW_WANTED = (process.argv[2] ?? "s0-formation").toLowerCase();
const EXACT_POSE = RAW_WANTED.startsWith("=");
const WANTED = EXACT_POSE ? RAW_WANTED.slice(1) : RAW_WANTED;
const OUT_DIR = process.argv[3] ?? ".tmp-screenshots/poses";
const DEV_PORT = parsePort(process.argv[4] ?? 5221, "dev server");
const GRASS_LAYER = process.env.FLUFFY_GRASS_LAYER;
const RUNTIME_PROFILE = process.env.FLUFFY_PROFILE;
const GRASS_LAYER_QUERY = GRASS_LAYER
  ? `&grassLayer=${encodeURIComponent(GRASS_LAYER)}`
  : "";
const NO_TERRAIN_QUERY = process.env.FLUFFY_NO_TERRAIN === "1"
  ? "&noTerrain=1"
  : "";
const NO_GRASS_QUERY = process.env.FLUFFY_NO_GRASS === "1"
  ? "&noGrass=1"
  : "";
const NO_WATER_QUERY = process.env.FLUFFY_NO_WATER === "1"
  ? "&noWater=1"
  : "";
const PROFILE_QUERY = RUNTIME_PROFILE
  ? `&profile=${encodeURIComponent(RUNTIME_PROFILE)}`
  : "";
const URL_BASE = `http://localhost:${DEV_PORT}/?qa=visual-matrix&control=fly&stats=1&debug=1${GRASS_LAYER_QUERY}${NO_TERRAIN_QUERY}${NO_GRASS_QUERY}${NO_WATER_QUERY}${PROFILE_QUERY}`;
const PORT = parsePort(process.env.FLUFFY_CDP_PORT ?? 9333, "CDP");
// Chrome rather than Edge on purpose. Other capture scripts in this project
// open with `taskkill /IM msedge.exe /F`, which kills every Edge on the machine
// regardless of profile or debugging port. A Chrome profile owned by this CDP
// port isolates concurrent capture sessions; two sessions cannot legitimately
// share the same CDP port anyway.
const BROWSER =
  process.env.FLUFFY_BROWSER ??
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
const PROFILE_TAG = `chrome-profile-capture-${PORT}-owned`;
const PROFILE = `${tmpdir().split("\\").join("/")}/${PROFILE_TAG}`;

mkdirSync(OUT_DIR, { recursive: true });

function parsePort(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`invalid ${label} port: ${value}`);
  }
  return parsed;
}

/**
 * Kill only the browser this CDP port owns. The port-specific profile tag is
 * part of the browser command line and cannot overlap a different valid port.
 */
function killOwnBrowsers() {
  try {
    execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | ` +
          `Where-Object { $_.CommandLine -like '*${PROFILE_TAG}*' } | ` +
          `ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`,
      ],
      { stdio: "ignore" },
    );
  } catch {
    /* none running */
  }
}

killOwnBrowsers();
// A dying Chrome keeps the profile lock for a moment, and a launch into a
// locked profile exits without ever opening the debugging port ("no CDP
// target"). Give it room.
await sleep(5000);

const child = spawn(
  BROWSER,
  [
    "--headless=new",
    "--use-angle=d3d11",
    "--ignore-gpu-blocklist",
    "--enable-gpu-rasterization",
    `--remote-debugging-port=${PORT}`,
    "--window-size=1280,720",
    `--user-data-dir=${PROFILE}`,
    "--no-first-run",
    // Headless Chrome still parks a renderer it considers occluded: the frame
    // counter froze at 168 mid-stream while the terrain queue sat at +143.
    // Without these the world never finishes booting and every capture is the
    // "Finding the meadow…" overlay.
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--disable-background-timer-throttling",
    "about:blank",
  ],
  { stdio: "ignore" },
);

let cleanedUp = false;
function cleanupBrowser() {
  if (cleanedUp) {
    return;
  }
  cleanedUp = true;
  child.kill();
  killOwnBrowsers();
}
process.once("exit", cleanupBrowser);

async function target() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = list.find((entry) => entry.type === "page");
      if (page?.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch {
      /* not up */
    }
    await sleep(250);
  }
  throw new Error("no CDP target");
}

const socket = new WebSocket(await target());
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener("open", resolveOpen, { once: true });
  socket.addEventListener("error", rejectOpen, { once: true });
});
let nextId = 0;
const pending = new Map();
socket.addEventListener("close", () => {
  console.log("!! CDP socket closed");
});
socket.addEventListener("error", (event) => {
  console.log("!! CDP socket error", String(event?.message ?? ""));
});
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  const resolver = pending.get(message.id);
  if (resolver) {
    pending.delete(message.id);
    resolver(message.result ?? message.error);
  }
});
const send = (method, params = {}) => {
  const id = (nextId += 1);
  socket.send(JSON.stringify({ id, method, params }));
  // A crashed renderer never answers, and an unanswered promise silently
  // drains the event loop instead of failing. Time out loudly.
  return new Promise((resolveResponse) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      console.log(`!! CDP timeout on ${method}`);
      resolveResponse(undefined);
    }, 60000);
    pending.set(id, (value) => {
      clearTimeout(timer);
      resolveResponse(value);
    });
  });
};
const evaluate = async (expression) =>
  (
    await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
  )?.result?.value;

await send("Page.enable");
await send("Runtime.enable");
await send("Page.navigate", { url: URL_BASE });

let poses = null;
let lastSeen = "none";
for (let attempt = 0; attempt < 600; attempt += 1) {
  const state = await evaluate(
    `(() => { const q = window.__FLUFFY_WORLD_VISUAL_QA__;
      return q ? JSON.stringify({ s: q.status, p: q.poses }) : null; })()`,
  );
  if (state) {
    const parsed = JSON.parse(state);
    if (parsed.s !== lastSeen) {
      lastSeen = parsed.s;
      console.log(`  [${attempt}s] status ${parsed.s}`);
    }
    if (parsed.s === "ready" || parsed.s === "posed") {
      poses = parsed.p;
      break;
    }
    if (parsed.s === "error") {
      throw new Error("visual matrix reported error");
    }
  }
  await sleep(1000);
}
if (!poses) {
  throw new Error(`visual matrix never became ready (last: ${lastSeen})`);
}

/**
 * The QA harness reports `ready` as soon as its landmark scan finishes, which
 * happens while the app is still behind its "Finding the meadow…" veil — a
 * capture taken then is a flat green card with a caption.
 *
 * Poll `#world-reveal[data-revealed]`, NOT the page text. `WorldRevealController`
 * reveals by setting that attribute, which CSS turns into `opacity: 0`; the
 * element and its caption stay in the DOM forever, so `innerText` still reads
 * "Finding the meadow…" long after the world is visible and a text gate waits
 * for something that can never happen.
 */
let booted = false;
for (let attempt = 0; attempt < 300; attempt += 1) {
  const state = await evaluate(
    `(() => { const v = document.querySelector('#world-reveal');
      return v ? v.dataset.revealed || 'pending' : 'gone'; })()`,
  );
  if (state === "true" || state === "gone") {
    booted = true;
    console.log(`  revealed after ${attempt}s (${state})`);
    break;
  }
  if (attempt % 30 === 29) {
    console.log(`  [${attempt}s] veil still up`);
  }
  await sleep(1000);
}
if (!booted) {
  throw new Error("world veil never lifted");
}
// The veil fades over 0.7 s; capture through it and the frame is milky.
await sleep(2000);

const matches = poses
  .map((name, index) => ({ name, index }))
  .filter((entry) => {
    const candidate = entry.name.toLowerCase();
    return EXACT_POSE ? candidate === WANTED : candidate.includes(WANTED);
  });
console.log(`poses: ${poses.length}, matched "${WANTED}": ${matches.length}`);
if (matches.length === 0) {
  console.log(poses.join("\n"));
  throw new Error(`no pose matching ${WANTED}`);
}

const captures = [];

for (const { name, index } of matches) {
  console.log(`\n=== ${name} (index ${index}) ===`);
  // Establish the exact camera transform before measuring. The first sample is
  // deliberately discarded because its newly visible near tiles may be queued.
  await evaluate(
    `window.__FLUFFY_WORLD_VISUAL_QA__.apply(${index}).then(() => true)`,
  );
  let settled = false;
  let stableSamples = 0;
  let lastGrassQueue = Number.NaN;
  let lastNearResident = Number.NaN;
  for (let attempt = 0; attempt < 150; attempt += 1) {
    const text = (await evaluate(`document.body.innerText || ''`)) ?? "";
    const terrain = /Terrain\s+(\d+)\s*\+(\d+)/.exec(text);
    const stones = /Stones\s+(\d+)\s*·\s*(\d+)\s*\+(\d+)/.exec(text);
    const grass = /pending\s+(\d+)/.exec(text);
    const nearResident = /Near resident\s+([\d,.]+)([kM]?)/.exec(text);
    // All counters must actually parse. Treating an unmatched HUD as zero is
    // how the first run "settled" on a world that had not started streaming.
    const terrainQueue = terrain ? Number(terrain[2]) : Number.NaN;
    const stoneQueue = stones ? Number(stones[3]) : Number.NaN;
    // Some isolation modes omit the visibility line entirely. A stable sentinel
    // still lets near-residency prove that the camera has stopped rebuilding.
    const grassQueue = grass ? Number(grass[1]) : -1;
    const nearResidentCount = nearResident
      ? Number(nearResident[1].replaceAll(",", "")) *
        (nearResident[2] === "M" ? 1_000_000 : nearResident[2] === "k" ? 1_000 : 1)
      : Number.NaN;
    if (attempt % 20 === 19) {
      console.log(
        `  settling ${attempt}s terrain +${terrainQueue} stone +${stoneQueue} grass +${grassQueue} resident ${nearResidentCount}`,
      );
    }
    if (
      terrainQueue === 0 &&
      stoneQueue === 0 &&
      grassQueue === lastGrassQueue &&
      nearResidentCount === lastNearResident
    ) {
      stableSamples += 1;
    } else {
      stableSamples = 0;
    }
    lastGrassQueue = grassQueue;
    lastNearResident = nearResidentCount;
    if (stableSamples >= 5) {
      await sleep(3000);
      settled = true;
      break;
    }
    await sleep(1000);
  }
  console.log(settled ? "  settled" : "  WARNING: never settled");
  const captureJson = await evaluate(
    `window.__FLUFFY_WORLD_VISUAL_QA__.apply(${index}).then((capture) => JSON.stringify(capture))`,
  );
  if (!captureJson) {
    throw new Error(`visual matrix did not return capture telemetry for ${name}`);
  }
  captures.push(JSON.parse(captureJson));
  const isolationHud =
    (await evaluate(
      `document.querySelector('#world-isolation-hud')?.textContent || ''`,
    )) ?? "";
  if (!isolationHud.includes("hook=active")) {
    throw new Error(
      `isolation harness did not intercept the world render: ${isolationHud || "HUD missing"}`,
    );
  }
  console.log(isolationHud);
  const hud = await evaluate(
    `(document.body.innerText || '').split(String.fromCharCode(10)).slice(0, 14).join(String.fromCharCode(10))`,
  );
  console.log(hud);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  if (shot?.data) {
    const out = `${OUT_DIR}/desktop-${name}.png`;
    writeFileSync(out, Buffer.from(shot.data, "base64"));
    console.log("  wrote", out);
  }
}

const runtimeReportJson = await evaluate(
  `JSON.stringify(window.__FLUFFY_WORLD_VISUAL_QA__.report || null)`,
);
const runtimeReport = runtimeReportJson ? JSON.parse(runtimeReportJson) : null;
const reportPath = `${OUT_DIR}/capture-report-${WANTED.replaceAll(/[^a-z0-9-]+/g, "-")}.json`;
writeFileSync(
  reportPath,
  `${JSON.stringify(
    {
      version: 1,
      sourceRevision: captures[0]?.hud?.match(/v[\d.]+\+([0-9a-f]+)/)?.[1] ?? null,
      requestedPoseFilter: WANTED,
      runtimeProfile: RUNTIME_PROFILE ?? "desktop",
      grassLayer: GRASS_LAYER ?? "combined",
      terrainVisible: process.env.FLUFFY_NO_TERRAIN !== "1",
      grassVisible: process.env.FLUFFY_NO_GRASS !== "1",
      waterVisible: process.env.FLUFFY_NO_WATER !== "1",
      runtime: runtimeReport,
      captures,
    },
    null,
    2,
  )}\n`,
);
console.log("wrote", reportPath);

socket.close();
cleanupBrowser();
process.removeListener("exit", cleanupBrowser);
