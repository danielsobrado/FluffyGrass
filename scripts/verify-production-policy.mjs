import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const WORKFLOW_DIRECTORY = resolve(REPOSITORY_ROOT, ".github", "workflows");
const DEPLOY_SCRIPT = resolve(REPOSITORY_ROOT, "scripts", "deploy-github-pages.mjs");
const WORKFLOW_EXTENSIONS = new Set([".yml", ".yaml"]);

function fail(message) {
  throw new Error(`[production-policy] ${message}`);
}

if (existsSync(WORKFLOW_DIRECTORY)) {
  const workflowFiles = readdirSync(WORKFLOW_DIRECTORY, {
    recursive: true,
    withFileTypes: true,
  })
    .filter(
      (entry) =>
        entry.isFile() &&
        WORKFLOW_EXTENSIONS.has(extname(entry.name).toLowerCase()),
    )
    .map((entry) => entry.name);

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
  !deployScript.includes('["status", "--porcelain"]')
) {
  fail("Manual deployment must require a clean source branch synchronized with its remote.");
}

console.log("[production-policy] No-Actions and manual deployment policies verified.");
