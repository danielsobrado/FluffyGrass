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
- Hemi-octahedral atlas impostors for the far LOD.
- Dithered cross-fades between grass representations.
- Streamed terrain and grass chunks.
- Procedural walking ways: bare dirt paths worn through the grass field.
- Character-driven grass separation and trailing wake.
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
| `0–4 m` | Two single-blade density layers with segmented detail | Full 2× density and close-range bend detail. |
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

The world fade bands are centered at 24 m and 80 m, with an 8 m transition on either side.

### Ultra-near LOD: double individual blades

The first 4 m uses an additional independently seeded single-blade layer. The normal near field remains visible, and the extra layer contributes the same density again. This produces 2× total blade density without duplicating blades at identical positions.

```yaml
grassUltraNearDistance: 4
grassUltraNearTransitionDistance: 1
grassUltraNearDensityMultiplier: 2
```

The extra layer is fully visible through 4 m and uses a stochastic fade from 4–5 m. It is streamed only around the camera and is built before the wider near field after spawn or a tile crossing.

### Normal near LOD: individual blades

The normal near LOD is owned by `WorldNearGrassField` and uses individually instanced blades in streamed 8 m tiles.

Default densities:

```yaml
grassNearBladesPerSquareMeterDesktop: 72
grassNearBladesPerSquareMeterCompact: 48
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

The production renderer bakes a multi-view grass atlas and selects a view through hemi-octahedral direction encoding. The instanced impostor geometry is used during the mid-to-far crossfade and throughout the far LOD.

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
4. Full-density patches carry the middle band without a redundant impostor layer.
5. Every transition overlaps through stochastic coverage rather than switching meshes abruptly.
6. Color, wind response, height, and root placement should remain visually compatible across all representations.
7. Terrain and grass streaming radii must be large enough to contain the configured LOD fades.

Run the continuity verification with:

```bash
npm run test:lod
```

The verification also checks that the dense single-blade fields are connected to `WorldGrassSystem`, that no duplicate field is owned by `ThirdPersonController`, that the ultra-near distance remains 4 m, that its total density multiplier remains 2×, and that the stronger interaction setting is retained.

## Walking ways

Bare dirt paths are worn through the grassland. A way is the zero contour of a
domain-warped value-noise field: a contour of a continuous field never branches
and never crosses itself, and it wanders for kilometres, which is the shape of a
footpath worn across open country. Two fields at different scales — a main way
and a finer branch — give a network whose ways cross each other. Ways fade out as
the ground climbs out of the rolling grassland onto a mountain flank.

`TerrainField.samplePathDistances` reports the signed distance in metres to each
way's centreline, obtained by dividing the field value by the length of its
gradient. Only the magnitude is an estimate; the sign is always the sign of the
raw field, so a way can only ever be drawn where its contour genuinely runs.

The distances are what both sides of the feature share:

- The terrain writes them into a per-vertex `terrainPath` attribute. A signed
  distance stays close to linear across a cell, so interpolating it between
  vertices metres apart still resolves a three-metre way. The terrain fragment
  shader crumbles the interpolated edge with the detail noise and shades the
  tread from it: mottled soil, a compacted darker centre, and pale grit.
- Grass placement multiplies its suitability by
  `TerrainField.samplePathGrassMask`, so no blade is ever placed on a way. The
  mid and far LODs place a four-metre clump of blades as one instance, so they
  widen the cleared band by the clump's own reach instead of growing across the
  tread.

Grass stops slightly short of the widest the ragged edge can reach, and the soil
fades out across that margin, so the gap does not read as a mown strip.

```yaml
pathWidth: 3
pathBranchWidth: 1.7
pathSpacing: 640
pathEdgeRoughness: 0.5
pathGrassClearance: 0.15
```

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
  TerrainField.ts
  TerrainStreamer.ts
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
2. Grass LOD continuity verification.
3. Grass color-parity verification.
4. Grass performance-envelope verification.
5. Vite production bundling.

Preview the generated build:

```bash
npm run preview
```

## GitHub Pages deployment

The generated site is published manually from the `gh-pages` branch. Repository
instructions explicitly prohibit GitHub Actions; build and deployment checks
must be run locally.

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

## Attribution

The initial procedural character direction was adapted from the character implementation in [Noniv/snowflow_demo](https://github.com/Noniv/snowflow_demo/tree/main/src/character). Drusniel World ports and extends the concept into a native Three.js transform rig with a different character design, controller, animation state machine, clothing geometry, grass interaction, and jump system.
