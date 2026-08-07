# Drusniel World

Drusniel World is a Three.js grass-rendering and third-person character demo focused on dense vegetation, smooth grass LOD transitions, procedural animation, and mobile-friendly performance.

The default experience places an articulated Drow ranger inside a very dense interactive grass field. The closest grass is made from individual blades, while progressively cheaper patch and impostor representations maintain visual density at distance.

## Live demo

- GitHub Pages: [https://danielsobrado.github.io/FluffyGrass/](https://danielsobrado.github.io/FluffyGrass/)
- Add a cache-busting query when testing a new deployment, for example `?v=<commit>`.
- Add `?control=fly` to use the flight controller instead of the third-person character.

## Current feature set

- Extra individually instanced grass in the ultra-near camera band: 2× total density on desktop and 1.5× on compact devices.
- Dense individually instanced grass throughout the normal near LOD.
- Multi-blade patch geometry for the middle LOD.
- Hemi-octahedral atlas impostors for the far LOD.
- Dithered cross-fades between grass representations.
- Streamed terrain and grass chunks.
- Procedural walking ways: bare dirt paths worn through the grass field.
- Persistent character footfalls, body contact, and grass recovery.
- Landing shockwave that briefly pushes and flattens nearby grass.
- Third-person walking, running, jumping, camera orbit, zoom, and mobile controls.
- Procedural Drow ranger with layered clothing, cloak, hair, and secondary spring motion.
- Rolling average FPS diagnostics instead of a total frame counter.
- Strict flat YAML configuration with duplicate and unknown-key rejection.

## Grass rendering architecture

The grass system deliberately uses a different representation for each distance band. Dense individual blades are reserved for the closest LODs. Multi-blade patches and impostors are used only when individual blades become too expensive.

The default transition distances come from the `lush-hero` art preset.

| Distance from camera | Representation | Purpose |
| --- | --- | --- |
| `0–4 m` | Normal single-blade field plus ultra-near detail layer | Maximum close-range density and bend detail. |
| `4–5 m` | Extra density and segmented detail dithering out | Removes close detail without a visible ring. |
| `5–14 m` | Dense one-triangle individual blades | Maintains normal close-range density and interaction at lower cost. |
| `14–34 m` | Individual blades crossfading to full-density patch geometry | Preserves density through the near/mid transition. |
| `34–44 m` | Full-density patch geometry | Avoids redundant impostor overdraw in the middle band. |
| `44–64 m` | Patch geometry crossfading to impostors | Smoothly enters the far representation. |
| `64–270 m` | Hemi-octahedral impostors | Maintains view-dependent silhouettes near the streamed horizon. |
| `270–290 m` | Impostors fading into terrain | Avoids a hard grass cutoff at the world edge. |

The table shows the default `lush-hero` preset. Runtime preset values in
`src/grass/GrassArtPresets.json` select the active near, mid, far, and transition
distances. The values in `public/config/world.yaml` provide validated world and
streaming limits:

```yaml
grassNearDistance: 24
grassMidDistance: 80
grassFarDistance: 280
grassTransitionDistance: 8
```

### Ultra-near LOD

The first 4 m uses an additional independently seeded single-blade layer. The normal near field remains visible while the extra layer contributes additional density without duplicating blades at identical positions.

```yaml
grassUltraNearDistance: 4
grassUltraNearTransitionDistance: 1
grassUltraNearDensityMultiplier: 2
grassUltraNearDensityMultiplierCompact: 1.5
```

The extra layer is fully visible through 4 m and uses a stochastic fade from 4–5 m. It is streamed only around the camera and is built before the wider near field after spawn or a tile crossing.

### Normal near LOD: individual blades

The normal near LOD is owned by `WorldNearGrassField` and uses individually instanced blades in streamed 8 m tiles.

Default densities:

```yaml
grassNearBladesPerSquareMeterDesktop: 72
grassNearBladesPerSquareMeterCompact: 40
```

The production `WorldGrassSystem` initializes and updates `WorldNearGrassField` directly. `ThirdPersonController` only drives character motion and the shared interaction field, preventing a duplicate grass allocation. The older streamed multi-blade near mesh remains disabled, so close grass is not represented by patches.

Both close single-blade layers receive the full character interaction deformation. Roots remain planted while blade tips bend and flatten around the character.

### Middle LOD: full-density patches

The middle LOD uses procedural multi-blade patch geometry and retains every
source blade. Because that geometry now provides full density, far impostors
remain out of the middle band and enter only during the mid-to-far crossfade.
The production impostor footprint is widened by 12% to overlap neighboring
patch cells and hide exposed terrain seams.

```ts
export const GRASS_MID_IMPOSTOR_UNDERFILL = 0;
export const GRASS_IMPOSTOR_FOOTPRINT_SCALE = 1.12;
```

This removes redundant middle-distance overdraw while patch geometry provides
the full blade density, local volume, and parallax.

### Far LOD: hemi-octahedral impostors

The production renderer bakes a multi-view grass atlas and selects a view through hemi-octahedral direction encoding. One far instance represents four 2×2 m subpatch cards, and the atlas allocation is capped at 2048 pixels per axis.

The impostor shader includes:

- View-dependent atlas frame selection.
- Optional blending between adjacent atlas frames.
- Wind motion.
- Stochastic coverage dithering.
- Field suitability coverage.
- Terrain-color matching for elevated camera angles.
- Stream fade and terrain-horizon fade.

### LOD continuity rules

The grass LOD system follows these rules:

1. The additional ultra-near layer only adds density; it does not replace the normal near layer.
2. Individual blades never remain as a world-wide distant representation.
3. Multi-blade patches do not render as the closest character-level grass.
4. Full-density patches carry the middle band without a redundant impostor layer.
5. Every transition overlaps through stochastic coverage rather than switching meshes abruptly.
6. Color, wind response, height, and root placement should remain visually compatible across all representations.
7. Terrain and grass streaming radii must be large enough to contain the configured LOD fades.

Run the continuity verification with:

```bash
npm run test:lod
```

## Walking ways

Bare dirt paths are worn through the grassland. A way is the zero contour of a
domain-warped value-noise field. Two fields at different scales — a main way and
a finer branch — give a network whose ways cross each other. Ways fade out as
the ground climbs out of the rolling grassland onto a mountain flank.

`TerrainField.samplePathDistances` reports the signed distance in metres to each
way's centreline. The terrain uses that distance for shading and grass placement
uses the same field to keep blades off the tread.

```yaml
pathWidth: 3
pathBranchWidth: 1.7
pathSpacing: 640
pathEdgeRoughness: 0.5
pathGrassClearance: 0.15
```

## Interactive grass physics

The closest grass samples a persistent GPU crush texture centred on the character. The simulation stores contact direction, crush amount, and recency, then decays them over time.

### Walking and running contacts

The controller submits both feet and a body contact. Foot positions follow the character stride and movement direction, so footprints remain visible after the character passes instead of following one temporary capsule.

```yaml
grassInteractionStrength: 0.94
grassInteractionSpeedForFullEffect: 4
grassTrailResolution: 256
grassTrailCoverage: 24
grassTrailRecoveryRate: 0.5
grassTrailFreshnessRate: 1.4
grassFootContactRadius: 0.32
grassFootContactStrength: 1
grassBodyContactRadius: 0.4
grassBodyContactStrength: 0.5
```

### Landing pulse

A sufficiently strong landing adds an expanding radial pulse to the same persistent interaction field.

```yaml
grassLandingPulseRadius: 2.4
grassLandingPulseStrength: 1.05
grassLandingPulseDecay: 5.2
```

## Drow character

The original Snowflow-inspired character was rebuilt as Drusniel, a stylized Drow ranger.

Visual elements include:

- Grey-violet skin.
- Long white hair.
- Long pointed ears.
- Bright eyes.
- Folded-back hood.
- Fur shoulder mantle.
- Layered tunic and split skirt.
- Rear and side cloak panels.
- Leather harness, waist wrap, belt, bracers, medallion, and dagger.

### Rig type

The character uses a hierarchy of `THREE.Group` transform joints rather than a conventional skinned skeletal mesh. This is suitable for the current stylized movement and jump animation. A skinned glTF humanoid rig would be a better long-term choice for complex combat, climbing, hand poses, facial animation, or animation-clip retargeting.

## Jump system

Jumping uses terrain-aware controller physics rather than moving the model with a visual-only animation.

Features:

- Vertical velocity and configurable gravity.
- Stronger gravity while falling.
- Variable jump height while the jump input is held.
- Reduced air control.
- Coyote time after leaving the ground.
- Buffered jump input before landing.
- Terrain collision and landing detection.
- Impact-dependent landing recovery.
- Landing grass pulse.

Default jump configuration:

```yaml
characterJumpSpeed: 7.4
characterGravity: 23
characterFallGravityMultiplier: 1.42
characterAirControl: 0.38
characterCoyoteTime: 0.13
characterJumpBufferTime: 0.14
characterJumpHoldTime: 0.17
characterJumpHoldGravityScale: 0.42
characterLandingRecoveryTime: 0.3
characterLandingImpactForFullEffect: 10.5
```

### Procedural animation state machine

The character transitions through:

```text
idle → walk/run → takeoff → rise → apex → fall → land
```

### Secondary motion

Cloak and hair groups use damped procedural springs. Movement, local acceleration, vertical velocity, and landing impulses drive the cape and hair. Frame deltas and spring inputs are bounded so stalls or invalid values cannot poison the motion state.

## Controls

### Desktop

| Input | Action |
| --- | --- |
| `WASD` or arrow keys | Move |
| `Shift` | Run |
| `Space` | Jump; hold briefly for additional height |
| Mouse movement | Orbit while pointer-locked |
| Mouse wheel | Zoom |
| `F` | Reset to spawn |

### Mobile

- Drag on the left side to move.
- Drag on the right side to orbit the camera.
- `JUMP` jumps and supports short hold duration.
- `RUN` enables sprinting.
- `⌂` resets the character.

### Flight mode

Append `?control=fly` to the URL to disable the third-person controller and use the flight controller.

## Diagnostics

The normal HUD reports rolling FPS and high-level world state. Deeper workload instrumentation is opt-in so it does not wrap the production render path by default.

Use query flags only when needed:

- `?diagnostics=1` enables workload diagnostics.
- `?gpuTiming=1` requests GPU timing when supported.
- `?stats=1` enables the optional `stats-gl` panel.
- `?accentAtlas=1` shows the generated detail-foliage atlas debug view.

## Configuration

Main world tuning is stored in `public/config/world.yaml`. Grass geometry, material, wind, distribution, QA, and impostor-atlas settings are stored in `public/config/grass.yaml`.

Configuration loading is strict:

- Unknown keys fail startup.
- Duplicate keys fail startup.
- Missing values fail startup.
- Invalid number ranges fail startup.
- Cross-field LOD, streaming, camera, movement, and density constraints are validated.
- The far-impostor path requires exactly one instance per 4 m patch; that instance contains four subpatch cards.
- The ultra-near transition must be shorter than the ultra-near distance.
- The ultra-near band must end before the normal near-to-middle fade begins.

When adding a world configuration value, update all three locations:

1. `src/world/WorldConfig.ts`
2. `src/world/WorldConfigLoader.ts`
3. `public/config/world.yaml`

## Local development

Requirements:

- Node.js 20 or newer with npm.
- A browser with WebGL support.

Install and start the development server:

```bash
npm ci
npm run dev
```

Create a production build:

```bash
npm run build
```

The build command runs:

1. TypeScript compilation.
2. Repository production-policy verification, including the no-GitHub-Actions rule.
3. Runtime lifecycle and safety verification.
4. Grass LOD continuity verification.
5. Grass color-parity verification.
6. Grass performance-envelope verification.
7. Grass placement verification.
8. Far-impostor subpatch verification.
9. Character motion verification.
10. Vite production bundling.

Preview the generated build:

```bash
npm run preview
```

## GitHub Pages deployment

The generated site is published manually to the `gh-pages` branch. GitHub Actions are prohibited in this repository, and `npm run build` fails if a workflow YAML file appears under `.github/workflows`.

Configure GitHub Pages:

1. Open **Settings → Pages**.
2. Select **Deploy from a branch**.
3. Select the `gh-pages` branch.
4. Select the `/ (root)` folder.

Publish from a clean, synchronized `main` checkout:

```bash
npm ci
npm run deploy:pages
```

The deployment script refuses to publish if the working tree is dirty, the current branch is not the configured source branch, or local source HEAD differs from the remote source branch. It then builds the application, copies `dist/` into a temporary Git worktree, commits the generated site, and pushes it to `gh-pages`.

Optional environment variables:

- `GITHUB_PAGES_BRANCH`: deployment branch, defaults to `gh-pages`.
- `GITHUB_PAGES_SOURCE_BRANCH`: source branch, defaults to `main`.
- `GITHUB_PAGES_REMOTE`: Git remote, defaults to `origin`.

## Attribution

The initial procedural character direction was adapted from the character implementation in [Noniv/snowflow_demo](https://github.com/Noniv/snowflow_demo/tree/main/src/character). Drusniel World ports and extends the concept into a native Three.js transform rig with a different character design, controller, animation state machine, clothing geometry, grass interaction, and jump system.
