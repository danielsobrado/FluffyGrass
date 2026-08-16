import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const DIST_DIRECTORY = resolve(REPOSITORY_ROOT, "dist");
const PUBLIC_DIRECTORY = resolve(REPOSITORY_ROOT, "public");
const INDEX_FILE = resolve(DIST_DIRECTORY, "index.html");
const LOCAL_REFERENCE_PATTERN = /\b(?:src|href)=["']([^"']+)["']/g;
const ABSOLUTE_LOCAL_REFERENCE_PATTERN = /\b(?:src|href)=["']\/(?!\/)/;
const ABSOLUTE_CSS_URL_PATTERN = /url\(\s*["']?\/(?!\/)/i;
const ABSOLUTE_RUNTIME_ASSET_PATTERN =
  /(["'`])\/(?!\/)[^"'`]*\.(?:glb|gltf|png|jpe?g|webp|svg|ya?ml|json)(?:\?[^"'`]*)?\1/i;

function fail(message) {
  throw new Error(`[built-site] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function listFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
}

function resolveLocalReference(reference) {
  if (
    reference.startsWith("#") ||
    reference.startsWith("//") ||
    /^[a-z][a-z0-9+.-]*:/i.test(reference)
  ) {
    return undefined;
  }
  const cleanReference = reference.split(/[?#]/, 1)[0];
  if (!cleanReference) {
    return undefined;
  }
  const path = resolve(DIST_DIRECTORY, cleanReference);
  const distPrefix = `${DIST_DIRECTORY}${sep}`;
  if (path !== DIST_DIRECTORY && !path.startsWith(distPrefix)) {
    fail(`Generated HTML reference escapes dist/: ${reference}.`);
  }
  return path;
}

assert(existsSync(INDEX_FILE), "dist/index.html is missing.");
const html = readFileSync(INDEX_FILE, "utf8");
assert(
  !ABSOLUTE_LOCAL_REFERENCE_PATTERN.test(html),
  "Generated index.html contains a root-absolute local asset reference that will break repository-subpath GitHub Pages deployment.",
);

const references = Array.from(
  html.matchAll(LOCAL_REFERENCE_PATTERN),
  (match) => match[1],
);
let localScriptCount = 0;
let localStyleCount = 0;
for (const reference of references) {
  const path = resolveLocalReference(reference);
  if (!path) {
    continue;
  }
  assert(
    existsSync(path) && statSync(path).isFile(),
    `Generated index.html references a missing file: ${reference}.`,
  );
  if (/\.js(?:[?#]|$)/i.test(reference)) {
    localScriptCount += 1;
  }
  if (/\.css(?:[?#]|$)/i.test(reference)) {
    localStyleCount += 1;
  }
}
assert(localScriptCount > 0, "Generated index.html does not reference a local JavaScript bundle.");
assert(localStyleCount > 0, "Generated index.html does not reference a local stylesheet.");

const builtFiles = listFiles(DIST_DIRECTORY);
for (const path of builtFiles) {
  const extension = extname(path).toLowerCase();
  if (extension !== ".css" && extension !== ".js") {
    continue;
  }
  const source = readFileSync(path, "utf8");
  const builtPath = relative(DIST_DIRECTORY, path);
  if (extension === ".css") {
    assert(
      !ABSOLUTE_CSS_URL_PATTERN.test(source),
      `Generated stylesheet contains a root-absolute url(...): ${builtPath}.`,
    );
  } else {
    assert(
      !ABSOLUTE_RUNTIME_ASSET_PATTERN.test(source),
      `Generated JavaScript contains a root-absolute runtime asset path: ${builtPath}.`,
    );
  }
}

for (const sourcePath of listFiles(PUBLIC_DIRECTORY)) {
  const publicPath = relative(PUBLIC_DIRECTORY, sourcePath);
  const builtPath = resolve(DIST_DIRECTORY, publicPath);
  assert(
    existsSync(builtPath) && statSync(builtPath).isFile(),
    `Public runtime asset was not copied to dist/: ${publicPath}.`,
  );
  assert(
    statSync(builtPath).size === statSync(sourcePath).size,
    `Public runtime asset changed size during copy: ${publicPath}.`,
  );
}

for (const legalFile of ["LICENSE", "THIRD_PARTY_NOTICES.md"]) {
  const path = resolve(DIST_DIRECTORY, legalFile);
  assert(
    existsSync(path) && statSync(path).isFile() && statSync(path).size > 0,
    `Generated site is missing ${legalFile}.`,
  );
}

console.log(
  `[built-site] Pages-relative index/bundles, ${references.length} HTML references, copied public assets, and legal files verified.`,
);