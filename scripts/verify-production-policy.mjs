import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const WORKFLOW_DIRECTORY = resolve(REPOSITORY_ROOT, ".github", "workflows");
const DEPLOY_SCRIPT = resolve(REPOSITORY_ROOT, "scripts", "deploy-github-pages.mjs");
const VITE_CONFIG = resolve(REPOSITORY_ROOT, "vite.config.ts");
const GRASS_CONFIG_LOADER = resolve(
  REPOSITORY_ROOT,
  "src",
  "grass",
  "internal",
  "GrassConfigLoader.ts",
);
const PACKAGE_FILE = resolve(REPOSITORY_ROOT, "package.json");
const PACKAGE_LOCK_FILE = resolve(REPOSITORY_ROOT, "package-lock.json");
const NODE_VERSION_FILE = resolve(REPOSITORY_ROOT, ".nvmrc");
const NPM_CONFIG_FILE = resolve(REPOSITORY_ROOT, ".npmrc");
const WORKFLOW_EXTENSIONS = new Set([".yml", ".yaml"]);

function fail(message) {
  throw new Error(`[production-policy] ${message}`);
}

function findWorkflowFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findWorkflowFiles(path));
    } else if (
      entry.isFile() &&
      WORKFLOW_EXTENSIONS.has(extname(entry.name).toLowerCase())
    ) {
      files.push(relative(REPOSITORY_ROOT, path));
    }
  }
  return files;
}

function releaseLine(version) {
  const match = String(version).match(/^(\d+)\.(\d+)\./);
  return match ? `${match[1]}.${match[2]}` : undefined;
}

if (existsSync(WORKFLOW_DIRECTORY)) {
  const workflowFiles = findWorkflowFiles(WORKFLOW_DIRECTORY);
  if (workflowFiles.length > 0) {
    fail(
      `GitHub Actions are not allowed in this repository: ${workflowFiles.join(", ")}.`,
    );
  }
}

const deployScript = readFileSync(DEPLOY_SCRIPT, "utf8");
if (deployScript.includes("ALLOW_DIRTY_DEPLOY")) {
  fail("Manual production deployment must never allow a dirty working tree.");
}
if (
  !deployScript.includes('sourceBranch: process.env.GITHUB_PAGES_SOURCE_BRANCH ?? "main"') ||
  !deployScript.includes("must exactly match") ||
  !deployScript.includes('["status", "--porcelain"]') ||
  !deployScript.includes('run(npmCommand, ["ci", "--no-audit", "--no-fund"])') ||
  !deployScript.includes('run(npmCommand, ["run", "build"])') ||
  deployScript.indexOf('run(npmCommand, ["ci", "--no-audit", "--no-fund"])') >
    deployScript.indexOf('run(npmCommand, ["run", "build"])') ||
  !deployScript.includes('existsSync(join(CONFIG.distDirectory, "index.html"))') ||
  !/function assertSourceStillCurrent\(expectedHead\) \{[\s\S]*?const currentHead = assertRepositoryState\(\);[\s\S]*?currentHead !== expectedHead/.test(
    deployScript,
  ) ||
  !/if \(diff\.status === 0\) \{[\s\S]*?assertSourceStillCurrent\(sourceHead\);[\s\S]*?No deployment changes were detected\./.test(
    deployScript,
  ) ||
  !/git",[\s\S]*?commit[\s\S]*?assertSourceStillCurrent\(sourceHead\);[\s\S]*?git",[\s\S]*?push/.test(
    deployScript,
  )
) {
  fail(
    "Manual deployment must require a clean synchronized source branch, reinstall the committed lockfile with npm ci, run the full production build, revalidate local and remote source state, verify its output, and reject stale builds including no-op publishes.",
  );
}

const viteConfig = readFileSync(VITE_CONFIG, "utf8");
if (
  !viteConfig.includes('const DEPLOYMENT_BASE_PATH = "./"') ||
  !viteConfig.includes("base: DEPLOYMENT_BASE_PATH") ||
  !viteConfig.includes("PUBLIC_ASSET_PATH_PATTERN") ||
  !viteConfig.includes("plugins: [rewriteRootPublicAssetPaths(), includeLegalFiles()]")
) {
  fail(
    "GitHub Pages packaging must keep a relative Vite base and rewrite root public-asset references for repository-subpath deployment.",
  );
}
if (
  !viteConfig.includes('execFileSync("git", ["rev-parse", "--short=12", "HEAD"]') ||
  !viteConfig.includes("`v${packageMetadata.version}+${SOURCE_REVISION}`") ||
  !viteConfig.includes("STONE_GRAIN_ASSET_PATTERN") ||
  !viteConfig.includes("perlinnoise.webp?v=${encodeURIComponent(SOURCE_REVISION)}")
) {
  fail(
    "Runtime config and stable public asset cache keys must include the source revision so a deployment cannot reuse stale files under unchanged public URLs.",
  );
}
const grassConfigLoader = readFileSync(GRASS_CONFIG_LOADER, "utf8");
if (
  !grassConfigLoader.includes('const CONFIG_URL = "./config/grass.yaml"') ||
  !grassConfigLoader.includes("encodeURIComponent(__APP_VERSION__)") ||
  !grassConfigLoader.includes("resolveDefaultConfigUrl()")
) {
  fail(
    "Default grass config loads must include the build revision so island/QA routes cannot reuse stale YAML after deployment.",
  );
}

const packageMetadata = JSON.parse(readFileSync(PACKAGE_FILE, "utf8"));
const buildScript = String(packageMetadata.scripts?.build ?? "");
if (!buildScript.includes("vite build && node scripts/verify-built-site.mjs")) {
  fail(
    "The production build must verify the generated GitHub Pages artifact after Vite finishes.",
  );
}
const packageLock = JSON.parse(readFileSync(PACKAGE_LOCK_FILE, "utf8"));
const packageLockRoot = packageLock.packages?.[""];
if (
  !packageLockRoot ||
  packageLock.name !== packageMetadata.name ||
  packageLock.version !== packageMetadata.version ||
  packageLockRoot.name !== packageMetadata.name ||
  packageLockRoot.version !== packageMetadata.version ||
  packageLockRoot.engines?.node !== packageMetadata.engines?.node
) {
  fail("package-lock.json project metadata must match package.json exactly.");
}
const nodeEngine = String(packageMetadata.engines?.node ?? "");
if (
  nodeEngine.length === 0 ||
  /(?:\^|>=)20(?:\.|\b)/.test(nodeEngine)
) {
  fail("Production tooling must not advertise the end-of-life Node 20 line.");
}
const threeVersion = packageMetadata.dependencies?.three;
const threeTypesVersion = packageMetadata.devDependencies?.["@types/three"];
if (
  !threeVersion ||
  !threeTypesVersion ||
  releaseLine(threeVersion) !== releaseLine(threeTypesVersion)
) {
  fail("Three.js must declare @types/three from the same release line.");
}
const pinnedNodeMajor = readFileSync(NODE_VERSION_FILE, "utf8").trim();
if (pinnedNodeMajor !== "24") {
  fail("Local production tooling must pin the current Node 24 LTS line in .nvmrc.");
}
const npmConfig = readFileSync(NPM_CONFIG_FILE, "utf8");
if (!/^engine-strict\s*=\s*true\s*$/m.test(npmConfig)) {
  fail("npm must enforce package.json engine constraints during install.");
}

console.log("[production-policy] Deployment, Pages artifact, cache, dependency, and runtime policies verified.");