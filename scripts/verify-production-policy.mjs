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
  !deployScript.includes("assertSourceStillCurrent(sourceHead)")
) {
  fail(
    "Manual deployment must require a clean synchronized source branch and reject stale builds.",
  );
}

const viteConfig = readFileSync(VITE_CONFIG, "utf8");
if (
  !viteConfig.includes('execFileSync("git", ["rev-parse", "--short=12", "HEAD"]') ||
  !viteConfig.includes("`v${packageMetadata.version}+${SOURCE_REVISION}`")
) {
  fail(
    "Runtime config cache keys must include the source revision so a deployment cannot reuse stale YAML under an unchanged package version.",
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
const packageLock = JSON.parse(readFileSync(PACKAGE_LOCK_FILE, "utf8"));
const packageLockRoot = packageLock.packages?.[""];
if (
  !packageLockRoot ||
  packageLockRoot.name !== packageMetadata.name ||
  packageLockRoot.version !== packageMetadata.version ||
  packageLockRoot.engines?.node !== packageMetadata.engines?.node
) {
  fail("package-lock.json root metadata must match package.json exactly.");
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

console.log("[production-policy] Deployment, cache, dependency, and runtime policies verified.");
