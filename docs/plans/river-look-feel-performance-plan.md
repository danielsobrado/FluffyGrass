# River Look and Feel Performance Plan

Status: implementation plan  
Baseline date: 2026-08-15  
Target: FluffyGrass procedural rivers on desktop and compact/mobile profiles

## Goal

Improve how rivers look and feel without materially increasing runtime cost.

The current water renderer is already sophisticated enough to support convincing rivers. It already has:

- deterministic rivers/lakes;
- depth-based absorption;
- Fresnel reflection;
- flow-aligned multi-scale wave motion;
- contextual foam;
- stone wakes;
- shallow caustics on the real riverbed;
- separate depth-correct bed rendering;
- wet shoreline response;
- compact/mobile detail scaling;
- distance-faded micro detail.

The next quality jump should therefore come mainly from making the river channel itself more natural rather than adding heavier water-rendering techniques.

The guiding principle is:

> improve river structure first, then let the existing water shader reveal that structure.

---

## Constraints

- No SSR.
- No mandatory planar reflections.
- No full fluid or CFD simulation.
- No dynamic tessellation.
- No additional full-screen render passes.
- Prefer zero extra river texture samples.
- Prefer zero extra river draw calls, except an optional local character ripple effect.
- No per-chunk water materials.
- Reuse existing hydrology, terrain noise, flow-noise, stone, and ecology data.
- Keep all river generation deterministic in world space.
- Keep art tuning in `public/config/world.yaml` rather than scattering literals through the code.
- Preserve the same macro river shape on compact/mobile; only micro detail may scale down.
- No GitHub Actions. Build and verification stay local and GitHub Pages deployment stays manual.

---

# Phase R1 — Natural width variation

## Objective

Remove the appearance of a constant-width procedural ribbon.

`RiverField` currently resolves a largely fixed width per river lane while the centreline is driven by sinusoidal meanders. That is fast, but long stretches can look too uniform.

## Work

Introduce slow deterministic width modulation along each river.

Target behavior:

- width varies gradually rather than randomly per sample;
- occasional broad pools;
- occasional narrow runs/riffles;
- wider inside-bend shelves where appropriate;
- tighter outside-bend sections where appropriate;
- no abrupt width discontinuities;
- no repeated visible pattern over short distances.

Reuse existing river phases and deterministic lane data where possible rather than introducing a new noise system.

A suitable first target is roughly ±10–20% local width variation around each lane's base width, clamped to safe hydrology bounds.

## Performance

- chunk-generation cost only;
- no new draw calls;
- no runtime texture sampling;
- no additional per-frame allocations.

## Acceptance

- rivers no longer maintain a visibly constant width over long distances;
- widening and narrowing remains smooth across chunk boundaries;
- river separation constraints remain valid;
- no hydrology discontinuities appear at LOD boundaries.

---

# Phase R2 — Asymmetric river cross-section

## Objective

Give rivers a believable channel shape instead of carving depth mostly from symmetric coverage.

## Work

Resolve a normalized lateral river coordinate:

```text
-1 = left bank
 0 = channel centre
+1 = right bank
```

Use it to shape the channel into:

```text
grass
     \ damp bank
      \__
         \ shallow shelf
          \____
               \ deeper channel
                \____
                     / shallow shelf
                 ___/
              __/
grass _______/
```

The final result must not be perfectly symmetrical.

Use river bend information to shift the deepest channel laterally.

At bends:

- outside bend: deeper channel and steeper bank;
- inside bend: shallower sediment shelf;
- straight section: more balanced section.

The existing river phases should provide enough information to derive bend direction and curvature cheaply.

## Performance

This is terrain/hydrology generation work. It should not add rendering cost.

## Acceptance

- shallow shelves are visible beside deeper channels;
- bends show an obvious depth bias toward the outside bank;
- top-down water benefits automatically from existing depth absorption;
- riverbeds remain continuous across terrain chunks.

---

# Phase R3 — Bend-aware river behavior

## Objective

Make river geometry, bed composition, banks, and flow tell the same story.

## Inside bends

Prefer:

- shallower water;
- broader depositional shelf;
- warmer/finer sediment;
- weaker apparent flow;
- more exposed damp bank where terrain allows.

## Outside bends

Prefer:

- deeper water;
- steeper bank;
- stronger apparent flow;
- more exposed coarse material;
- slightly more stone presence where existing stone logic supports it.

## Straight sections

Keep a more even cross-section and simpler flow.

## Rules

Do not create separate unrelated random fields for each effect.

The intended dependency chain is:

```text
river shape
  -> bend/curvature
  -> local depth
  -> local apparent flow
  -> sediment character
  -> vegetation/bank response
```

This is more convincing than layering independent noise systems.

## Acceptance

- inside and outside bends read differently from normal gameplay distance;
- sediment and depth agree with bend direction;
- visual variation remains deterministic and seamless.

---

# Phase R4 — Pool / run / riffle structure

## Objective

Create recognizable longitudinal river rhythm without fluid simulation.

A convincing river should not have the same depth, width, ripple spacing, and apparent speed everywhere.

Introduce slow deterministic longitudinal modulation that creates transitions such as:

```text
pool -> run -> riffle -> run -> pool
```

## Pool

Prefer:

- wider channel;
- deeper water;
- calmer surface;
- darker/finer bed;
- less foam.

## Run

Prefer:

- moderate width/depth;
- coherent downstream motion;
- low foam;
- visible directional highlights.

## Riffle

Prefer:

- narrower/shallow channel;
- stronger apparent velocity;
- compressed ripple spacing;
- stronger surface-normal energy;
- more visible gravel;
- sparse, broken foam streaks.

## Performance

Drive the feature from existing river phases or one very cheap deterministic longitudinal function.

Do not add a simulation grid.

## Acceptance

- river sections visibly alternate in character;
- riffles look like shallow energetic water, not just white foam;
- pools look calmer and deeper;
- transitions are gradual.

---

# Phase R5 — Locally varying apparent flow

## Objective

Make flow respond to channel structure while preserving the current analytic/procedural water model.

The current shader already receives flow direction and river coverage. Extend the visual response using information already available such as:

- river coverage;
- water depth;
- geometric water slope;
- local channel/riffle classification;
- stone interaction.

Derive a cheap local flow-energy factor conceptually similar to:

```text
flowEnergy =
    channelInfluence
  * slopeInfluence
  * shallowRiffleInfluence
  * obstacleInfluence
```

Use it to modulate existing effects rather than adding a new flow renderer.

Possible uses:

- downstream advection speed;
- ripple wavelength;
- ripple strength;
- flow-sheen stretching;
- riffle intensity;
- wake strength.

Desired behavior:

- slower-looking water beside banks;
- stronger coherent flow near the active channel;
- faster-looking narrow runs;
- calmer broad pools;
- broken motion around stones.

## Performance

- shader ALU only where possible;
- zero new texture samples preferred;
- zero new varyings preferred unless profiling proves one is justified.

## Acceptance

- local channel structure changes the visual speed of the river;
- pools and riffles no longer use the same apparent motion;
- direction remains stable and clearly downstream.

---

# Phase R6 — Shoreline composition variation

## Objective

Remove the impression of a uniform wet strip beside the river.

The existing shoreline already uses shared hydrology proximity. Preserve that architecture.

## Work

Use existing terrain/hydrology/ecology signals to create local shoreline patches of:

- wet mud;
- exposed soil;
- fine gravel;
- coarse gravel;
- isolated stones;
- short wet grass;
- denser grass farther from the bank.

Avoid:

- constant-width dark shoreline rings;
- perfectly mirrored left/right banks;
- decorative gravel borders;
- a second shoreline distance texture.

Bend-aware sediment should influence the shoreline where possible.

## Performance

Reuse existing terrain material inputs and hydrology fields.

No additional shoreline mesh should be required.

## Acceptance

- shoreline material varies along the river;
- exposed wet ground appears naturally;
- grass-to-water transitions are irregular but coherent;
- terrain and grass agree about moisture.

---

# Phase R7 — Hydrology-aware riverbed composition

## Objective

Make the existing riverbed material respond to water energy and channel structure.

The bed already has sand, algae, pebbles/cobbles, and caustics. Do not add a second bed renderer.

## Preferred composition

| River area | Bed character |
| --- | --- |
| Fast narrow channel | larger, cleaner stones |
| Shallow riffle | dense gravel / pebbles |
| Deep slow pool | darker fine sediment |
| Inside bend | sand / silt deposition |
| Outside bend | coarse exposed material |
| Near bank | algae + finer material |
| Behind large stones | small depositional patches |

Use combinations of:

- water depth;
- local river coordinate;
- bend direction;
- flow-energy factor;
- existing procedural bed noise;
- existing stone interaction where appropriate.

Avoid making all pebbles equally visible everywhere.

The current bed should remain readable through shallow water but should not overpower the water surface.

## Performance

Prefer changing how the existing bed texture is interpreted rather than adding texture samples or geometry.

## Acceptance

- riffles show coarser material;
- deep pools show finer/darker sediment;
- bends show plausible depositional differences;
- the bed remains subtle enough that water still reads as water.

---

# Phase R8 — Refine riffle and foam logic

## Objective

Use foam only as evidence of energy.

The current shader already has shoreline, riffle, and stone foam. Refine these signals instead of creating another foam renderer.

## Changes

Reduce the visual role of generic shoreline foam.

Prefer foam from:

- shallow energetic riffles;
- protruding stones;
- narrow fast runs;
- local obstacle wakes.

Keep calm banks almost foam-free.

Riffle readability should primarily come from:

- shallow bed visibility;
- tighter ripple spacing;
- stronger directional surface motion;
- gravel;
- restrained foam streaks.

## Acceptance

- no continuous white river outline;
- calm freshwater banks remain mostly clear;
- riffles still read strongly without excessive foam;
- foam stays stable at distance.

---

# Phase R9 — Better stone-water interaction

## Objective

Improve the existing low-cost stone wake system without increasing simulation complexity.

The existing wake sampler is already appropriately lightweight. Keep the same general architecture.

## Behavior by obstacle

### Tiny submerged stone

- mostly local normal/ripple distortion;
- little or no foam.

### Near-surface stone

- small V-shaped downstream wake;
- mild local surface compression.

### Protruding stone

- visible split-flow impression;
- stronger downstream wake;
- small amount of foam where justified.

### Larger obstacle

- somewhat longer wake;
- wider downstream disturbance;
- no symmetric foam halo.

A subtle upstream compression line immediately before a protruding stone can add a strong sense of water pressure without particles.

## Acceptance

- wake shape is clearly downstream;
- obstacle size/depth changes response;
- fully submerged tiny stones do not create implausible foam rings.

---

# Phase R10 — Subtle context-aware water colour

## Objective

Use the existing shallow/deep/absorption model to reinforce river structure without creating obviously colored zones.

Keep depth as the dominant signal.

Add only restrained modulation such as:

- shallow sediment shelf: slightly warmer/brighter;
- deep channel: slightly cooler/darker;
- fast riffle: slightly clearer/brighter;
- algae-heavy edge: very mild green influence.

This should remain barely noticeable in isolation but useful across a full river scene.

## Performance

Shader arithmetic only.

No new texture is required.

## Acceptance

- river sections gain subtle visual separation;
- depth remains more important than contextual tint;
- no visible color banding along banks or riffles.

---

# Phase R11 — Character-water interaction

## Objective

Make rivers feel connected to gameplay rather than behaving only as animated scenery.

The current water interaction system focuses on stones. Add a tiny local character interaction layer.

## Desired effects

- small expanding ripple when a foot enters water;
- subtle downstream disturbance while walking;
- stronger local wake while running;
- small splash only when velocity/depth warrants it;
- effects stop quickly after leaving water.

## Implementation policy

Do not simulate or deform the whole water surface.

Preferred approach:

- maximum 2–4 active ripple instances;
- one shared geometry/material;
- small local world-space coverage;
- reuse one draw where possible;
- no update work when character is not near/in water;
- compact/mobile may reduce ripple count or splash detail while keeping basic feedback.

This is the one phase where one small additional draw may be worthwhile because the gameplay feedback is disproportionately valuable.

## Acceptance

- entering water creates immediate visible feedback;
- walking and running feel different;
- no persistent ripple spam;
- compact/mobile cost remains negligible.

---

# Phase R12 — River audio

## Objective

Improve perceived river quality without GPU cost.

## Work

Use existing hydrology proximity and local river state to drive a small number of audio layers.

Suggested behavior:

- far from river: silent;
- near calm bank: soft stream ambience;
- near riffle: stronger/faster water layer;
- character enters water: local foot/splash response.

Do not create hundreds of positional river sources.

Prefer one or a small number of controlled sources whose gain/filtering responds to hydrology state.

## Acceptance

- approaching a river is audible before the player reaches it;
- riffles sound more energetic than pools;
- audio transitions are smooth;
- no meaningful rendering impact.

---

# Performance policy

The river pass should preserve these hard targets:

- 0 new mandatory full-screen/render-target passes;
- 0 SSR;
- 0 planar reflection by default;
- 0 new river normal textures;
- 0 per-chunk material clones;
- 0 dynamic tessellation;
- preferably 0 additional water texture samples;
- preferably 0 extra river draw calls except the optional local player ripple;
- most river-shape work happens during deterministic chunk generation;
- micro water detail continues to fade using the existing distance policy;
- compact/mobile preserves hydrology and macro river identity.

If profiling shows a feature meaningfully threatens the current frame tier, remove that feature before reducing correct depth, flow direction, Fresnel, absorption, or bed ownership.

---

# Recommended implementation order

1. Natural width variation.
2. Asymmetric river cross-section.
3. Inside/outside bend behavior.
4. Pool/run/riffle longitudinal structure.
5. Locally varying apparent flow.
6. Sediment/gravel bank variation.
7. Hydrology-aware bed composition.
8. Refine riffle/stone foam.
9. Improve stone wakes.
10. Subtle context-aware water color.
11. Character ripple/wake interaction.
12. River audio.
13. Final visual tuning and performance comparison.

The first ten phases should require effectively no meaningful change to the render architecture.

---

# Highest-value subset

If scope must be reduced, prioritize these four changes:

1. natural varying river geometry;
2. asymmetric bend-aware depth;
3. locally varying apparent flow;
4. sediment-aware banks and bed.

These address the largest remaining weakness: a good water shader rendered over a river channel that can still look too regular and procedural.

---

# Verification

Extend existing verification rather than creating broad duplicate test infrastructure.

Relevant existing scripts include:

- `scripts/verify-hydrology.mjs`;
- `scripts/verify-water-flow.mjs`;
- `scripts/verify-water-render-contract.mjs`;
- `scripts/verify-terrain-surface.mjs`;
- `scripts/verify-ecology.mjs`;
- `scripts/verify-stones.mjs`.

Useful assertions:

- local river width remains finite and within configured bounds;
- river separation remains safe after width modulation;
- cross-section depth is continuous across chunk boundaries;
- outside-bend channel bias does not invert incorrectly;
- river flow remains normalized/finite;
- generated water depth remains non-negative;
- pool/run/riffle classification is deterministic;
- no new shader texture dependency is accidentally introduced;
- compact/mobile keeps the same macro hydrology.

## Manual visual matrix

Capture at minimum:

- [ ] long straight river section;
- [ ] broad bend from above;
- [ ] inside bend close-up;
- [ ] outside bend close-up;
- [ ] shallow riffle;
- [ ] deep pool;
- [ ] transition from pool to run;
- [ ] transition from run to riffle;
- [ ] wet muddy bank;
- [ ] gravel/sediment bank;
- [ ] protruding stone wake;
- [ ] submerged small stone;
- [ ] character entering shallow water;
- [ ] character walking through water;
- [ ] character running through water;
- [ ] desktop comparison;
- [ ] compact/mobile comparison;
- [ ] moving camera across chunk boundaries;
- [ ] frame-time comparison against baseline.

---

# Definition of done

The river improvement pass is complete when:

- [ ] river width varies naturally without visible discontinuities;
- [ ] channels have asymmetric cross-sections;
- [ ] outside bends are generally deeper than inside bends;
- [ ] inside bends show plausible depositional shelves;
- [ ] pools, runs, and riffles are visually distinguishable;
- [ ] apparent flow responds to local channel structure;
- [ ] shorelines do not read as uniform wet strips;
- [ ] riverbed composition responds to depth, bend, and flow;
- [ ] calm banks do not show continuous foam;
- [ ] stone wakes remain downstream and context-aware;
- [ ] player-water contact has immediate local feedback if R11 ships;
- [ ] compact/mobile retains the same river identity;
- [ ] no mandatory expensive reflection/refraction pass was added;
- [ ] frame-time remains in the same practical tier as the current baseline;
- [ ] `npm run build` passes locally;
- [ ] manual river visual captures are reviewed.

## Deployment

This repository does not use GitHub Actions.

After implementation and local verification:

```bash
npm run build
npm run deploy:pages
```

Run the manual GitHub Pages deployment only from a clean working tree.
