const BUILD_VERSION = "v0.7.6-fog-uniform-fix";
const ENTRY_URL = new URL(
  `./src/main.ts?v=${encodeURIComponent(BUILD_VERSION)}`,
  document.baseURI,
).href;
const TYPESCRIPT_EXTENSION = ".ts";
const ASSET_PATTERN = /(["'`])\/([^"'`]+\.(?:avif|bin|exr|gif|glb|gltf|hdr|jpe?g|ktx2|mp3|ogg|png|svg|wav|webp))\1/g;
const IMPORT_PATTERN = /((?:\bimport|\bexport)\s+(?:[^"']*?\s+from\s*)?)(["'])([^"']+)\2/g;
const EXTERNAL_MODULES = Object.freeze({
  three: "https://esm.sh/three@0.159.0",
  "stats-gl": "https://esm.sh/stats-gl@2.0.1?bundle",
  "dat.gui": "https://esm.sh/dat.gui@0.7.9?bundle",
});
const moduleCache = new Map();

function showError(error) {
  console.error("[FluffyGrass] Startup failed", error);
  const message = document.createElement("pre");
  message.style.cssText = "position:fixed;inset:1rem;z-index:10000;padding:1rem;overflow:auto;background:#181818;color:#fff;white-space:pre-wrap";
  message.textContent = `FluffyGrass failed to start:\n${error instanceof Error ? error.stack ?? error.message : String(error)}`;
  document.body.appendChild(message);
}

function resolveExternal(specifier) {
  const exact = EXTERNAL_MODULES[specifier];
  if (exact) return exact;
  if (specifier.startsWith("three/")) {
    return `https://esm.sh/three@0.159.0/${specifier.slice("three/".length)}`;
  }
  return null;
}

function resolveLocal(specifier, parentUrl) {
  const resolved = new URL(specifier, parentUrl);
  const fileName = resolved.pathname.slice(resolved.pathname.lastIndexOf("/") + 1);
  if (!fileName.includes(".")) resolved.pathname += TYPESCRIPT_EXTENSION;
  resolved.searchParams.set("v", BUILD_VERSION);
  return resolved.href;
}

function transpile(source, fileName) {
  const compiler = globalThis.ts;
  if (!compiler) throw new Error("The TypeScript compiler could not be loaded.");
  const result = compiler.transpileModule(source, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      target: compiler.ScriptTarget.ES2022,
      module: compiler.ModuleKind.ES2022,
      useDefineForClassFields: true,
      isolatedModules: true,
      removeComments: false,
    },
  });
  const errors = (result.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === compiler.DiagnosticCategory.Error,
  );
  if (errors.length > 0) {
    const details = errors
      .map((diagnostic) => compiler.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
      .join("\n");
    throw new Error(`TypeScript transpilation failed for ${fileName}:\n${details}`);
  }
  return result.outputText;
}

async function readSource(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load ${url}: HTTP ${response.status}`);
  return response.text();
}

async function loadModule(url) {
  const cached = moduleCache.get(url);
  if (cached) return cached;
  const loading = (async () => {
    const source = await readSource(url);
    let code = transpile(source, new URL(url).pathname);
    code = code.replace(ASSET_PATTERN, (_match, quote, assetPath) =>
      `${quote}${new URL(`./${assetPath}`, document.baseURI).href}${quote}`,
    );
    const dependencies = new Map();
    for (const match of code.matchAll(IMPORT_PATTERN)) {
      const specifier = match[3];
      if (dependencies.has(specifier)) continue;
      const externalUrl = resolveExternal(specifier);
      if (externalUrl) {
        dependencies.set(specifier, externalUrl);
        continue;
      }
      if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
        throw new Error(`Unsupported module specifier "${specifier}" in ${url}.`);
      }
      dependencies.set(specifier, await loadModule(resolveLocal(specifier, url)));
    }
    for (const [specifier, dependencyUrl] of dependencies) {
      code = code
        .split(`"${specifier}"`).join(`"${dependencyUrl}"`)
        .split(`'${specifier}'`).join(`'${dependencyUrl}'`);
    }
    code += `\n//# sourceURL=${url}`;
    return URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
  })();
  moduleCache.set(url, loading);
  return loading;
}

async function start() {
  const entryModuleUrl = await loadModule(ENTRY_URL);
  await import(entryModuleUrl);
}

start().catch(showError);
