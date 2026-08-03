# Drusniel World

Drusniel World is a Three.js grass-rendering and third-person character demo focused on dense vegetation, smooth grass LOD transitions, procedural animation, and mobile-friendly performance.

The default experience places an articulated Drow ranger inside a very dense interactive grass field. The closest grass is made from individual blades, while progressively cheaper patch and impostor representations maintain visual density at distance.

## Live demo

- GitHub Pages: [https://danielsobrado.github.io/FluffyGrass/](https://danielsobrado.github.io/FluffyGrass/)
- Add a cache-busting query when testing a new deployment, for example `?v=<commit>`.
- Add `?control=fly` to use the flight controller instead of the third-person character.

## Current feature set

- Double-density individually instanced grass in the ultra-near camera band.
- Dense individually instanced grass throughout the normal near LOD.
- Multi-blade patch geometry for the middle LOD.
- Hemi-octahedral atlas impostors for middle-band underfill and the far LOD.
- Dithered cross-fades between grass representations.
- Streamed terrain and grass chunks.
- Character-driven grass separation and trailing wake.
- Landing shockwave that briefly pushes and flattens nearby grass.
- Third-person walking, running, jumping, camera orbit, zoom, and mobile controls.
- Procedural Drow ranger with layered clothing, cloak, hair, and secondary spring motion.
- Rolling average FPS diagnostics instead of a total frame counter.
- Strict flat YAML configuration with duplicate and unknown-key rejection.

## Grass rendering architecture

The grass system deliberately uses a different representation for each distance band. Dense individual blades are reserved for the closest LODs. Multi-blade patches and impostors are used only when individual blades become too expensive.

The default transition distances come from `public/config/world.yaml`.

| Distance from camera | Representation | Purpose |
| --- | --- | --- |
| `0–3 m` | Two independent single-blade layers | Full 2× blade density where individual blades are most visible. |
| `3–4 m` | Additional single-blade layer dithering out | Removes the extra density without a visible ring. |
| `4–16 m` | Dense individual blades | Maximum normal close-range quality and character interaction. |
| `16–32 m` | Individual blades fading out, patch geometry fading in, impostor underfill rising | Prevents a visible density drop at the first world LOD transition. |
| `32–72 m` | Multi-blade patches plus 72% impostor underfill | Preserves apparent field density without close-range blade cost. |
| `72–88 m` | Patches fading out while impostors rise to full coverage | Smooth transition into the far representation. |
| `88–280 m` | Hemi-octahedral impostors | Cheap view-dependent grass silhouettes near the streamed horizon. |
| Final distance band | Impostors fade into terrain | Avoids a hard grass cutoff at the world edge. |

The main world transition ranges are derived from:

```yaml
grassNearDistance: 24
grassMidDistance: 80
grassFarDistance: 280
grassTransitionDistance: 8
```

The world fade bands are centered at 24 m and 80 m, with an 8 m transition on either side.

### Ultra-near LOD: double individual blades

The first 4 m uses an additional independently seeded single-blade layer. The normal near field remains visible, and the extra layer contributes the same density again. This produces 2× total blade density without duplicating blades at identical positions.

```yaml
grassUltraNearDistance: 4
grassUltraNearTransitionDistance: 1
grassUltraNearDensityMultiplier: 2
```

The extra layer is fully visible through 3 m and uses a stochastic fade from 3–4 m. It is streamed only around the camera and is built before the wider near field after spawn or a tile crossing.

### Normal near LOD: individual blades

The normal near LOD is owned by `WorldNearGrassField` and uses individually instanced blades in streamed 8 m tiles.

Default densities:

```yaml
grassNearBladesPerSquareMeterDesktop: 72
grassNearBladesPerSquareMeterCompact: 48
```

The production `WorldGrassSystem` initializes and updates `WorldNearGrassField` directly. The older streamed multi-blade near mesh remains disabled, so close grass is not represented by patches.

Both close single-blade layers receive the full character interaction deformation. Roots remain planted while blade tips bend and flatten around the character.

### Middle LOD: patches plus underfill

The middle LOD uses procedural multi-blade patch geometry. It is less expensive than storing dense individual blades across the world, but patches alone can expose large gaps when viewed from third-person camera height.

To prevent that density collapse, the existing far impostor mesh is reused as a partial underfill layer. The underfill begins when the near blades start fading and remains at 72% through most of the middle band. The production impostor footprint is widened by 12% to overlap neighboring patch cells and hide exposed terrain seams.

```ts
export const GRASS_MID_IMPOSTOR_UNDERFILL = 0.72;
export const GRASS_IMPOSTOR_FOOTPRINT_SCALE = 1.12;
```

This is intentionally below 100%. Patch geometry still provides local volume and parallax, while impostors fill empty visual space.

### Far LOD: hemi-octahedral impostors

The production renderer bakes a multi-view grass atlas and selects a view through hemi-octahedral direction encoding. The same instanced impostor geometry is used for middle-band underfill and the full far LOD.

The impostor shader includes:

- View-dependent atlas frame selection.
- Optional blending between adjacent atlas frames.
- Wind motion.
- Stochastic coverage dithering.
- Field suitability coverage.
- Terrain-color matching for elevated camera angles.
- Stream fade and terrain-horizon fade.

Reusing the existing impostor draw path is cheaper and simpler than creating a separate middle-distance geometry system.

### LOD continuity rules

The grass LOD system follows these rules:

1. The additional ultra-near layer only adds density; it does not replace the normal near layer.
2. Individual blades never remain as a world-wide distant representation.
3. Multi-blade patches do not render as the closest character-level grass.
4. The impostor underfill appears before the patch-only band becomes visibly sparse.
5. Every transition overlaps through stochastic coverage rather than switching meshes abruptly.
6. Color, wind response, height, and root placement should remain visually compatible across all representations.
7. Terrain and grass streaming radii must be large enough to contain the configured LOD fades.

Run the continuity verification with:

```bash
npm run test:lod
```

The verification also checks that the dense single-blade fields are connected to `WorldGrassSystem`, that the ultra-near distance remains 4 m, that its total density multiplier remains 2×, and that the stronger interaction setting is retained.

## Interactive grass physics

The closest grass uses a GPU deformation field driven by the third-person controller.

### Walking and running wake

The interaction field is a smoothed capsule running from a trailing point to the current character position.

- Grass bends radially away from the capsule.
- Blade tips move more than blade roots.
- Blades flatten slightly under pressure.
- The wake length increases with movement speed.
- The field springs back instead of permanently clearing the grass.
- Both normal and ultra-near single-blade layers use the same interaction state.

Default settings:

```yaml
grassInteractionRadius: 1.55
grassInteractionStrength: 0.94
grassInteractionTrailLength: 2.8
grassInteractionResponse: 7.5
grassInteractionSpeedForFullEffect: 4
```

### Landing pulse

A sufficiently strong landing adds an expanding radial pulse to the grass interaction field. The pulse is strongest near both feet and decays over time.

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

The character is intentionally stylized and procedural. It matches the silhouette, clothing layers, and palette of a Drow ranger rather than attempting photorealistic detail.

### Rig type

The character is articulated, but it is not a conventional skinned skeletal mesh.

It uses a hierarchy of `THREE.Group` transform joints for:

- Root, slope alignment, heading, and body.
- Pelvis, torso, neck, and head.
- Upper arms, forearms, and wrists.
- Thighs, shins, and feet.
- Separate cloak panels.
- Separate skirt panels.
- Separate hair groups.

This transform rig is suitable for the current stylized movement and jump animation. A skinned glTF humanoid rig would be a better long-term choice for complex combat, climbing, hand poses, facial animation, or animation-clip retargeting.

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

The state machine drives:

- Takeoff crouch and arm sweep.
- Leg tuck during ascent.
- Balanced apex pose.
- Landing preparation while falling.
- Knee, hip, and torso compression on impact.
- Recovery back into idle, walking, or running.

### Secondary motion

Cloak and hair groups use damped procedural springs.

- Forward movement pulls the cloak backward.
- Lateral velocity separates the side panels.
- Vertical velocity affects cloak and hair lag.
- Landing applies an impulse to hair and cloak springs.
- Spring integration is sub-stepped to remain stable during low-FPS frames.

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

The on-screen diagnostics report a rolling average FPS and current world state. The average is sampled over time and is more useful than displaying the total number of rendered frames.

Grass diagnostics include active and queued patches, visible LOD layers, estimated blade count, impostor count, and chunk build timing. The blade count includes the streamed normal and ultra-near single-blade fields.

## Configuration

Main world tuning is stored in:

```text
public/config/world.yaml
```

Grass geometry, material, wind, distribution, QA, and impostor-atlas settings are stored in:

```text
public/config/grass.yaml
```

Configuration loading is strict:

- Unknown keys fail startup.
- Duplicate keys fail startup.
- Missing values fail startup.
- Invalid number ranges fail startup.
- Cross-field LOD, streaming, camera, movement, and density constraints are validated.
- The ultra-near transition must be shorter than the ultra-near distance.
- The ultra-near band must end before the normal near-to-middle fade begins.

When adding a world configuration value, update all three locations:

1. `src/world/WorldConfig.ts`
2. `src/world/WorldConfigLoader.ts`
3. `public/config/world.yaml`

## Important source files

```text
src/character/
  CharacterSpring.ts
  DrowCharacterFeatures.ts
  DrowCostumeGeometry.ts
  SnowflowCharacter.ts
  SnowflowCharacterGeometry.ts
  SnowflowCharacterMaterials.ts

src/controls/
  ThirdPersonController.ts
  ThirdPersonInput.ts

src/grass/
  GrassLodController.ts
  GrassLodTuning.ts
  interaction/GrassInteractionField.ts

src/world/
  WorldGrassSystem.ts
  grass/WorldGrassImpostorAtlasFactory.ts
  grass/WorldGrassImpostorMaterial.ts
  grass/WorldGrassPatchGeometryFactory.ts
  grass/WorldNearGrassField.ts
  grass/WorldSingleBladeTileFactory.ts
  grass/WorldSingleBladeTileField.ts
```

## Local development

Requirements:

- Node.js with npm.
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
2. Grass LOD continuity verification.
3. Vite production bundling.

Preview the generated build:

```bash
npm run preview
```

## GitHub Pages deployment

The generated site is published manually from the `gh-pages` branch. This repository does not use GitHub Actions for deployment.

Configure GitHub Pages:

1. Open **Settings → Pages**.
2. Select **Deploy from a branch**.
3. Select the `gh-pages` branch.
4. Select the `/ (root)` folder.

Publish from a clean local working tree:

```bash
npm ci
npm run deploy:pages
```

The deployment script:

1. Builds the Vite application.
2. Copies `dist/` into a temporary Git worktree.
3. Commits the generated site.
4. Pushes it to `gh-pages`.

Optional environment variables:

- `GITHUB_PAGES_BRANCH`: deployment branch, defaults to `gh-pages`.
- `GITHUB_PAGES_REMOTE`: Git remote, defaults to `origin`.
- `ALLOW_DIRTY_DEPLOY=1`: permits deployment with uncommitted changes.

### Pages validation harness

The currently published Pages branch may contain a lightweight standalone validation harness used for direct mobile testing when a full local Vite build is unavailable.

The harness approximates the production renderer:

- Dense nearby individual blades.
- Multi-blade middle patches.
- Three deterministic terrain-aligned underfill clusters per source patch, each using two crossed cards.
- Character wake and mobile controls.

The production application in `main` remains the source of truth. It uses the proper streamed 2× ultra-near layer, normal near field, and baked hemi-octahedral atlas impostors. Running `npm run deploy:pages` replaces the harness with the actual production `dist/` build.

## Attribution

The initial procedural character direction was adapted from the character implementation in [Noniv/snowflow_demo](https://github.com/Noniv/snowflow_demo/tree/main/src/character). Drusniel World ports and extends the concept into a native Three.js transform rig with a different character design, controller, animation state machine, clothing geometry, grass interaction, and jump system.
