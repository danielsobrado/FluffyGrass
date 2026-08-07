# Repository instructions

- Do not add, configure, or use GitHub Actions in this repository. Plans and
  specifications must not propose CI workflows, and no new files may be added
  under `.github/workflows/`.
- Build and verify locally with `npm run build`.
- Publish GitHub Pages manually with `npm run deploy:pages` from a clean working tree.

## Testing and browser automation

- Verification scripts live in `scripts/verify-*.mjs`, are plain Node, and are
  chained from the `build` script. Do not add a test framework.
- Playwright may be used when a task genuinely needs browser automation —
  visual regression capture, multi-step interaction, or anything headless Edge
  plus a throwaway probe page cannot do. Prefer the lighter route first: a root
  probe page plus headless Edge with SwiftShader covers most rendering checks.
- If Playwright is introduced, pin the version and keep it a devDependency. It
  is run locally on demand, never from CI.
