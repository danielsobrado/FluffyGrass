import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

const CONFIG = Object.freeze({
  branch: process.env.GITHUB_PAGES_BRANCH ?? "gh-pages",
  remote: process.env.GITHUB_PAGES_REMOTE ?? "origin",
  distDirectory: resolve(REPOSITORY_ROOT, "dist"),
  allowDirty: process.env.ALLOW_DIRTY_DEPLOY === "1",
});

function log(message) {
  console.log(`[github-pages] ${message}`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? REPOSITORY_ROOT,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !options.allowFailure) {
    const details = result.stderr?.trim();
    throw new Error(
      details || `Command failed (${result.status}): ${command} ${args.join(" ")}`,
    );
  }

  return result;
}

function hasRemoteBranch() {
  const result = run(
    "git",
    ["ls-remote", "--exit-code", "--heads", CONFIG.remote, CONFIG.branch],
    { capture: true, allowFailure: true },
  );

  return result.status === 0;
}

function assertRepositoryState() {
  run("git", ["rev-parse", "--is-inside-work-tree"], { capture: true });

  const status = run("git", ["status", "--porcelain"], { capture: true });
  if (!CONFIG.allowDirty && status.stdout.trim()) {
    throw new Error(
      "The working tree has uncommitted changes. Commit them first or set ALLOW_DIRTY_DEPLOY=1.",
    );
  }
}

function clearWorktree(directory) {
  for (const entry of readdirSync(directory)) {
    if (entry === ".git") {
      continue;
    }

    rmSync(join(directory, entry), { force: true, recursive: true });
  }
}

function build() {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  log("Building the production site...");
  run(npmCommand, ["run", "build"]);

  if (!existsSync(join(CONFIG.distDirectory, "index.html"))) {
    throw new Error("The build completed without dist/index.html.");
  }
}

function deploy() {
  assertRepositoryState();
  build();

  const deploymentDirectory = mkdtempSync(join(tmpdir(), "fluffygrass-pages-"));
  let worktreeAdded = false;

  try {
    const remoteBranchExists = hasRemoteBranch();
    const sourceRef = remoteBranchExists
      ? `${CONFIG.remote}/${CONFIG.branch}`
      : "HEAD";

    if (remoteBranchExists) {
      run("git", ["fetch", CONFIG.remote, CONFIG.branch]);
    }

    run("git", ["worktree", "add", "--detach", deploymentDirectory, sourceRef]);
    worktreeAdded = true;

    clearWorktree(deploymentDirectory);
    cpSync(CONFIG.distDirectory, deploymentDirectory, { recursive: true });
    writeFileSync(join(deploymentDirectory, ".nojekyll"), "", "utf8");

    run("git", ["add", "--all"], { cwd: deploymentDirectory });

    const diff = run("git", ["diff", "--cached", "--quiet"], {
      cwd: deploymentDirectory,
      capture: true,
      allowFailure: true,
    });

    if (diff.status === 0) {
      log("No deployment changes were detected.");
      return;
    }

    run(
      "git",
      ["commit", "-m", "deploy: update GitHub Pages"],
      { cwd: deploymentDirectory },
    );
    run(
      "git",
      ["push", CONFIG.remote, `HEAD:${CONFIG.branch}`],
      { cwd: deploymentDirectory },
    );

    log(`Published dist/ to ${CONFIG.remote}/${CONFIG.branch}.`);
  } finally {
    if (worktreeAdded) {
      run("git", ["worktree", "remove", "--force", deploymentDirectory], {
        allowFailure: true,
      });
    }
    rmSync(deploymentDirectory, { force: true, recursive: true });
  }
}

try {
  deploy();
} catch (error) {
  console.error(
    `[github-pages] Deployment failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
