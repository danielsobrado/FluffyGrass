# ThreejsGrass

The Fluffy Grass From Elysium: Simple and Performant! Free Tutorial.

## Drusniel World controls

The default world mode uses the procedural Drow character controller.

- Desktop: `WASD` or arrow keys to move, `Shift` to run, `Space` to jump,
  mouse movement to orbit, mouse wheel to zoom, and `F` to reset.
- Mobile: left-side drag to move, right-side drag to look, plus `JUMP`, `RUN`,
  and reset buttons.
- Add `?control=fly` to the URL to use the flight controller.

The character uses an articulated transform rig with separate torso, neck,
wrists, legs, layered skirt, cloak panels, and hair groups. Jumping includes
buffering, coyote time, variable-height gravity, reduced air control, procedural
takeoff/rise/apex/fall/landing poses, spring-driven cloak and hair movement, and
a landing pulse through the closest single-blade grass LOD.

## GitHub Pages deployment

The generated site is published manually from the `gh-pages` branch. This
repository does not use GitHub Actions for deployment.

1. In GitHub, open **Settings → Pages**.
2. Select **Deploy from a branch**.
3. Select the `gh-pages` branch and the `/ (root)` folder.
4. Publish from a clean local working tree:

```bash
npm ci
npm run deploy:pages
```

The command builds the project, copies `dist/` into a temporary Git worktree,
commits the generated site, and pushes it to `gh-pages`.

Optional environment variables:

- `GITHUB_PAGES_BRANCH`: deployment branch, defaults to `gh-pages`.
- `GITHUB_PAGES_REMOTE`: Git remote, defaults to `origin`.
- `ALLOW_DIRTY_DEPLOY=1`: allows deployment with uncommitted changes.
