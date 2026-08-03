# ThreejsGrass

The Fluffy Grass From Elysium: Simple and Performant! Free Tutorial.

## GitHub Pages deployment

The generated site is published from the `gh-pages` branch. Pushes to `main`
publish automatically through GitHub Actions.

1. In GitHub, open **Settings → Pages**.
2. Select **Deploy from a branch**.
3. Select the `gh-pages` branch and the `/ (root)` folder.
4. To publish manually, run the deployment command from a clean working tree:

```bash
npm ci
npm run deploy:pages
```

The command builds the project, copies `dist/` into a temporary Git worktree, commits the generated site, and pushes it to `gh-pages`.

Optional environment variables:

- `GITHUB_PAGES_BRANCH`: deployment branch, defaults to `gh-pages`.
- `GITHUB_PAGES_REMOTE`: Git remote, defaults to `origin`.
- `ALLOW_DIRTY_DEPLOY=1`: allows deployment with uncommitted changes.
