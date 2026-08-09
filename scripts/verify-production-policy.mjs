import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const WORKFLOW_DIRECTORY = resolve(REPOSITORY_ROOT, ".github", "workflows");
const DEPLOY_SCRIPT = resolve(REPOSITORY_ROOT, "scripts", "deploy-github-pages.mjs");
const VITE_CONFIG = resolve(REPOSITORY_ROOT, "vite.config.ts");
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

console.log("[production-policy] Deployment and runtime cache policies verified.");
