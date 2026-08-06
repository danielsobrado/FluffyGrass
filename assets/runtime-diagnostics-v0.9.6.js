const HUD_UPDATE_INTERVAL_MS = 250;
const FAR_INDICES_PER_CARD = 6;
const LINE_PREFIX = "Far submit ";

export function attachWorldDiagnostics(app) {
  const renderer = app?.renderer;
  const scene = app?.scene;
  const grass = app?.grass;
  const element = document.querySelector("#world-stats");
  if (!renderer || !scene || !grass || !element) {
    return undefined;
  }

  const instrumented = new WeakSet();
  const originalRender = renderer.render;
  let submittedCards = 0;
  let lastHudUpdate = 0;
  let baseText = stripDiagnosticLine(element.textContent ?? "");
  let renderedText = "";

  const observer = new MutationObserver(() => {
    const current = element.textContent ?? "";
    if (current === renderedText) {
      return;
    }
    baseText = stripDiagnosticLine(current);
    renderHud();
  });
  observer.observe(element, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  function instrumentFarMeshes() {
    for (const group of grass.farGroups ?? []) {
      const mesh = group.mesh;
      if (!mesh || instrumented.has(mesh)) {
        continue;
      }
      instrumented.add(mesh);
      const original = mesh.onBeforeRender;
      mesh.onBeforeRender = (...args) => {
        const indexCount =
          mesh.geometry.index?.count ??
          mesh.geometry.getAttribute("position")?.count ??
          0;
        submittedCards +=
          Math.floor(indexCount / FAR_INDICES_PER_CARD) *
          Math.max(0, mesh.count);
        original.call(mesh, ...args);
      };
    }
  }

  function renderHud() {
    const line = `${LINE_PREFIX}${Math.round(submittedCards).toLocaleString()} cards`;
    renderedText = [baseText, line].filter(Boolean).join("\n");
    if (element.textContent !== renderedText) {
      element.textContent = renderedText;
    }
  }

  renderer.render = function renderWithDiagnostics(renderScene, camera) {
    if (renderScene !== scene) {
      return originalRender.call(renderer, renderScene, camera);
    }
    submittedCards = 0;
    instrumentFarMeshes();
    const result = originalRender.call(renderer, renderScene, camera);
    const now = performance.now();
    if (now - lastHudUpdate >= HUD_UPDATE_INTERVAL_MS) {
      lastHudUpdate = now;
      renderHud();
    }
    return result;
  };

  return {
    dispose() {
      renderer.render = originalRender;
      observer.disconnect();
    },
  };
}

function stripDiagnosticLine(value) {
  return value
    .split("\n")
    .filter((line) => !line.startsWith(LINE_PREFIX))
    .join("\n");
}
