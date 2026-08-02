const SOURCE_FILES = Object.freeze({
  material: "./src/GrassMaterial.ts",
  main: "./src/main.ts",
});

const PUBLIC_ASSET_PATH_PATTERN =
  /(["'`])\/([^"'`]+\.(?:avif|basis|bin|exr|gif|glb|gltf|hdr|jpe?g|ktx2|mp3|ogg|png|svg|wav|webp))\1/g;

function showError(error) {
  console.error("[FluffyGrass] Startup failed", error);

  const message = document.createElement("pre");
  message.style.cssText =
    "position:fixed;inset:1rem;z-index:10000;padding:1rem;overflow:auto;background:#181818;color:#fff;white-space:pre-wrap";
  message.textContent = `FluffyGrass failed to start:\n${error instanceof Error ? error.stack ?? error.message : String(error)}`;
  document.body.appendChild(message);
}

async function readSource(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load ${path}: HTTP ${response.status}`);
  }

  return response.text();
}

function transpile(source, fileName) {
  const compiler = globalThis.ts;
  if (!compiler) {
    throw new Error("The TypeScript compiler could not be loaded.");
  }

  return compiler.transpileModule(source, {
    fileName,
    compilerOptions: {
      target: compiler.ScriptTarget.ES2022,
      module: compiler.ModuleKind.ES2022,
      useDefineForClassFields: true,
    },
  }).outputText;
}

async function start() {
  const [materialSource, rawMainSource] = await Promise.all([
    readSource(SOURCE_FILES.material),
    readSource(SOURCE_FILES.main),
  ]);

  const materialModule = transpile(materialSource, SOURCE_FILES.material);
  const materialUrl = URL.createObjectURL(
    new Blob([materialModule], { type: "text/javascript" }),
  );

  const mainSource = rawMainSource.replace(
    PUBLIC_ASSET_PATH_PATTERN,
    (_match, quote, assetPath) => `${quote}./${assetPath}${quote}`,
  );

  let mainModule = transpile(mainSource, SOURCE_FILES.main);
  mainModule = mainModule.replace(
    /from\s+["']\.\/GrassMaterial["'];?/,
    `from "${materialUrl}";`,
  );

  const mainUrl = URL.createObjectURL(
    new Blob([mainModule], { type: "text/javascript" }),
  );

  try {
    await import(mainUrl);
  } finally {
    URL.revokeObjectURL(mainUrl);
  }
}

start().catch(showError);
