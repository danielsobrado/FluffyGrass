# Tiny Glade-Inspired Detail Foliage Plan

## Status

- Target branch: `main`
- Scope: small bushes, flowers, ferns, broadleaf plants, seed heads, distribution, clustering, variety, deterministic verification, tuning, and performance protection
- Renderer: preserve the existing detail-foliage atlas/material/instancing architecture unless a verifier proves a defect
- Runtime dependencies: no new dependencies
- Deployment: manual GitHub Pages deployment; no GitHub Actions
- Principles: KISS, SOLID, deterministic, bounded, configuration-backed, no per-frame procedural generation

## Objective

Move the existing small-plant and flower layer toward a cozy, authored, Tiny Glade-like look while keeping the PoC at approximately the same or lower rendering cost.

The current renderer is already inexpensive and technically sound:

- one shared procedural detail-foliage atlas;
- one shared material;
- instanced six-vertex cards;
- 16 m tiles;
- base density around 0.35 cards/m²;
- no accent shadows;
- deterministic tile builds;
- distance fade around the near field;
- biome-aware species and tint selection;
- ecology sampling already available at placement time;
- quality-governor density reduction already available for compact/degraded tiers.

The largest remaining visual weakness is **composition**, not polygon count.

The target hierarchy is:

```text
glade
    -> colony
        -> clump
            -> individual plant
```

The goal is to make the world read as:

```text
open grass
    -> daisy colony
    -> fern pocket
    -> low shrub
    -> quiet grass
    -> another flower pocket
```

rather than as an even decorative sprinkle of unrelated cards.

The visual improvement should come mainly from:

1. stronger negative space;
2. correlated plant colonies;
3. dominant species within local patches;
4. correlated flower tint families;
5. stronger silhouette variety;
6. ecological agreement;
7. height/age hierarchy;
8. restrained overall counts.

Do not solve the problem by increasing render distance, adding shadows, adding many materials, increasing the shader species ceiling, or substantially increasing the number of visible cards.

---

# Non-Negotiable Performance Contract

These are implementation constraints, not tuning suggestions.

```text
new normal-frame procedural distribution work      0
new materials                                       0
new runtime textures                                0
new normal detail-foliage draw-call classes         0
new accent shadow casting                           0
new required instance attributes                    0
detail foliage render radius changes                0
physics used for placement                          0
iterative relaxation / Poisson placement            0
unbounded rejection loops                           0
species shader-uniform ceiling                      8
atlas dimensions increase                           0
production candidate density                        <= 0.35 / m²
production candidates per 16 m tile                 <= 90
detail-foliage tiles built per frame                1
average rendered detail cards                       <= current baseline
```

All colony, affinity, family, tint, age, and composition decisions must happen only while deterministic detail-foliage tiles are built.

No colony noise, ecology classification, species composition, or clustering logic may be added to the normal per-frame update path.

The current detail-foliage performance reference remains authoritative until a newer measured baseline is deliberately accepted:

```text
reference spawn resident cards     ~1,890
reference spawn drawn cards        ~1,488
reviewed worst-case cards           <= 2,070
reviewed detail-foliage draws       <= 22
reviewed detail vertices            <= 12,420
vertices per card                   6
```

The exact spawn counts are deterministic workload references, not timing promises. CPU/GPU milliseconds vary by hardware and are manual profiling data, not deterministic gates.

## Build-path operation budget

For every candidate that survives the existing cheap terrain/path/stone gates:

```text
new value-noise samples             <= 2
new lattice/hash corner evaluations <= 12 total
new heap allocations from colony sampling          0
new terrain samples                              0
new hydrology samples                            0
new ecology samples                              0
```

Reuse the ecology sample the detail-foliage build already owns. Reuse a mutable distribution sample object exactly as `GrassHabitatSample` is reused today.

Do not allocate arrays, maps, vectors, or temporary objects from the candidate loop for colony math.

## Preserve the current rendering architecture

Keep:

- `WorldDetailFoliageMaterial` as the single detail-foliage material;
- one procedural atlas;
- eight species columns;
- two phenotype rows;
- existing packed `instanceAccent`;
- existing `instanceVariation`, `instanceCoverage`, and `instanceBiome` attributes;
- current six-vertex card geometry;
- current distance fade;
- current per-tile dither sorting and `mesh.count` trimming;
- current no-shadow policy;
- current quality-governor accent density scale;
- current 16 m tile size and visibility radius.

The colony system changes **which candidate survives and what it becomes**, not the renderer.

---

# Core Design Principle

## Spend the budget on correlation, not density

The current system already has enough cards to create visual richness. Candidate positions are relatively evenly stratified and individual species/tints are largely resolved independently.

That produces variety globally but weak local composition.

Instead:

```text
same or fewer cards
+ stronger local relationships
+ more empty space
= richer field
```

A patch with eight related daisies reads as more intentional than eight unrelated accent plants spread evenly over the same area.

---

# Exact Species Decision

Keep `GRASS_MAX_ACCENT_SPECIES = 8`.

Do **not** increase the shader uniform array, atlas width, or species count in this phase.

Replace the two least valuable silhouette duplicates:

```text
index 0  grass-tuft           keep
index 1  tall-tuft            -> low-shrub
index 2  fern                 keep
index 3  small-fern           keep
index 4  daisy                keep
index 5  round-bloom          keep
index 6  seed-head            keep
index 7  sprig                -> broadleaf-rosette
```

Why:

- `tall-tuft` overlaps visually with grass and seed-head silhouettes;
- `sprig` is another narrow green vertical shape;
- `low-shrub` adds a missing medium-width mass;
- `broadleaf-rosette` adds a missing low, wide ground silhouette;
- keeping eight species preserves all current shader and atlas budgets.

---

# 1. Deterministic Colony Field

## New file

`src/world/grass/WorldDetailFoliageDistribution.ts`

This module owns only world-space spatial composition.

It must not import:

- `three`;
- scene objects;
- materials;
- GPU buffers;
- renderer state;
- `WorldNearGrassField`;
- `WorldGrassSystem`.

## API

Use an allocation-free target-object API:

```ts
export interface DetailFoliageDistributionSample {
  colonyStrength: number;
  clumpStrength: number;
  coreStrength: number;
  quietSuppression: number;
  familyRoll: number;
  tintRoll: number;
  ageRoll: number;
}

export function createDetailFoliageDistributionSample(): DetailFoliageDistributionSample;

export class WorldDetailFoliageDistribution {
  constructor(seed: number, tuning: DetailFoliageTuning);

  setTuning(tuning: DetailFoliageTuning): void;

  sample(
    x: number,
    z: number,
    target: DetailFoliageDistributionSample,
  ): DetailFoliageDistributionSample;
}
```

The precise shape may vary slightly during implementation, but preserve these properties:

- pure world-position input;
- deterministic uint32 hash domain;
- no tile-coordinate input;
- caller-owned output object;
- no renderer dependency;
- no allocations from `sample()`.

## Spatial scales

Use two continuous world-space value-noise fields:

```text
macro colony scale: YAML-controlled, shipped ~9 m
local clump scale:  YAML-controlled, shipped ~2.25 m
```

Use at most two value-noise octaves total for this layer.

Do not add fractal stacks merely to make the debug map look interesting. The grass/ecology system already provides environmental complexity.

## Tile continuity

The field must not know the 16 m detail tile coordinate. The same `(x, z)` must produce the same result regardless of which tile is currently being built.

Never seed colony identity from `tileX`/`tileZ`.

---

# 2. Species and Ecology Affinity

## New file

`src/world/grass/DetailFoliageAffinity.ts`

This module owns species/category weighting and companion selection.

It may import:

- grass accent species definitions;
- biome profile types;
- `WorldEcologySample` type;
- `DetailFoliageTuning`;
- distribution sample types.

It must not import renderer/material classes.

## Responsibilities

Given:

```text
biome profile
existing ecology sample
existing path mask
existing stone clearance mask
distribution sample
stable world-position hash
```

resolve:

```text
candidate acceptance multiplier
dominant species/family
companion species
flower tint family
age/height bias
```

Use soft weights rather than binary habitat rejection.

Recommended tendencies:

| Family | Moisture | Fertility | Exposure | Rockiness | Disturbance |
| --- | --- | --- | --- | --- | --- |
| daisy | medium | high | medium-high | low-medium | low |
| round bloom | medium | medium-high | medium | low | low |
| fern | high | medium | low-medium | medium | very low |
| small fern | medium-high | medium | low-medium | medium-high | low |
| broadleaf rosette | medium-high | high | low-medium | low | low |
| low shrub | medium | medium-high | medium | low-medium | very low |
| seed head | low | low-medium | high | medium | low-medium |
| grass tuft | broad | broad | broad | broad | broad |

The formulas may be category-based. The tuneable strength of ecology versus colony identity belongs in YAML.

---

# 3. Colonies Choose Families, Not Independent Plants

The current per-card weighted species selection should become colony-biased.

Each macro colony resolves one dominant species/family from the active biome's permitted accent list.

Within an active colony, target:

```text
dominant family     65-80%
compatible plants   20-35%
```

The shipped starting target is controlled by:

```text
detailFoliageDominantFamilyShare: 0.74
```

Do not create a second companion-share setting; it is the remainder.

A fern pocket should mostly read as ferns. A daisy colony should mostly read as daisies. A low-shrub pocket should contain green companions, not random rainbow blooms.

---

# 4. Tint Coherence

Keep the existing tint catalogue.

Do not add more tint uniforms.

Each flowering colony gets a stable dominant tint roll. Individual flowers then inherit that tint family with controlled exceptions.

Example behavior:

```text
white colony
    white dominant
    cream common companion
    pale blue rare companion

lavender colony
    lavender dominant
    pink common companion
    cream rare companion
```

`detailFoliageTintCoherence` controls how often flowers stay inside the colony tint family.

Strong colors such as poppy-red should remain rare accents rather than uniformly distributed markers.

---

# 5. Low Shrub Design

## Modify

`src/grass/biome/GrassAccentSpecies.ts`

Replace `tall-tuft` with `low-shrub` at the existing species slot.

Starting physical intent:

```text
category: fern or new foliage category if truly needed
aspect: wide, roughly 1.1-1.35
windWeight: low, roughly 0.3-0.45
canopyHeightBand: roughly 0.58-1.0
```

Prefer reusing an existing foliage category unless a new category materially improves affinity logic. Do not add a category only for naming convenience.

## Modify

`src/world/grass/WorldDetailFoliageAtlasFactory.ts`

Replace the `tall-tuft` drawing routine with `drawLowShrub()`.

The procedural shrub silhouette must include:

- 4-7 offset branch masses;
- irregular broad leaves;
- uneven top height;
- asymmetric lateral reach;
- one or two visible holes;
- darker/root-heavy center;
- outward leaves breaking the main mass;
- no perfect sphere/hemisphere.

Use the existing two phenotype rows intentionally:

```text
row 0 -> compact / younger shrub
row 1 -> open / mature shrub
```

The rows must change the overall silhouette, not merely the random seed.

Do not add a 3D shrub mesh in this phase.

---

# 6. Broadleaf Rosette Design

## Modify

`src/grass/biome/GrassAccentSpecies.ts`

Replace `sprig` with `broadleaf-rosette` in the existing slot.

Target:

- broad, low card;
- 5-9 leaves;
- radial/semi-radial root layout;
- visible central mass;
- modest wind response;
- lower canopy band than flowers.

## Modify

`src/world/grass/WorldDetailFoliageAtlasFactory.ts`

Add `drawBroadleafRosette()` in the old `sprig` slot.

Phenotypes:

```text
row 0 -> compact radial leaves
row 1 -> slightly open/asymmetric mature leaves
```

---

# 7. Biome Integration

## Modify

`src/grass/biome/GrassBiomeProfiles.json`

Keep biome ownership of species and tint weights.

Remove all references to:

```text
tall-tuft
sprig
```

Add:

```text
low-shrub
broadleaf-rosette
```

Starting direction:

### Meadow

- grass tuft remains common filler;
- fern/small fern remain common green companions;
- broadleaf rosette is clearly present;
- low shrub is uncommon but visible;
- flowers remain less common than green foliage.

### Dry steppe

- seed heads dominate;
- grass tuft remains common;
- low shrub is sparse;
- broadleaf is rare;
- flower colors remain restrained.

### Alpine

- grass tuft and small fern dominate green accents;
- broadleaf remains restrained;
- low shrub is rare;
- pale flowers remain sparse.

Tune exact biome weights in this JSON, not in TypeScript conditionals.

## Modify

`src/grass/biome/GrassBiomeProfile.ts`

Pre-resolve species indices once during profile validation.

Change `GrassBiomeAccentSpecies` so the validated runtime entry includes the resolved species index in addition to its readable species key:

```ts
export interface GrassBiomeAccentSpecies {
  species: string;
  speciesIndex: number;
  tint: string;
  weight: number;
}
```

Resolve `speciesIndex` in `assertAccentSpecies()` using `findGrassAccentSpecies()`.

Why:

- the current build path repeatedly calls `GRASS_ACCENT_SPECIES.find(...)` inside species-weight loops;
- colony/affinity selection will make those loops slightly richer;
- resolving the index once avoids repeated linear catalogue scans without changing JSON authoring.

This is a build-time CPU optimization and should be done before adding the new composition math.

---

# 8. Correlated Height and Age

Use colony core strength to bias scale and phenotype.

```text
colony core
    -> slightly taller
    -> more mature phenotype
    -> fuller plant silhouette

colony fringe
    -> shorter
    -> younger phenotype
    -> more sparse companions
```

Keep the bias subtle.

`detailFoliageCoreHeightBias` is a multiplicative range, not an absolute metre value.

Example at `0.14`:

```text
core influence may add up to about 14% to the species-resolved card height
```

Stable per-instance variation must remain, so colonies do not form perfect radial height gradients.

Do not add another instance attribute. Resolve age/height into:

- existing matrix scale;
- existing phenotype row selection;
- existing packed accent value.

---

# 9. Environmental Edges

Use existing masks as soft signals after their hard safety clearances have been respected.

## Stone fringe

The existing stone-clearance rejection remains authoritative.

Outside the rejected footprint, use the feathered stone mask transition to favor:

- small fern;
- broadleaf rosette;
- occasional low shrub.

Do not create a decorative circular plant ring around every stone.

## Path fringe

The current path exclusion remains authoritative.

Use the safe verge transition to occasionally favor:

- daisies;
- low green companions;
- dry seed-head groups on exposed verges.

Do not produce continuous flower ribbons.

`detailFoliageStoneFringeStrength` and `detailFoliagePathFringeStrength` only affect affinity weighting. They do not weaken the hard placement masks.

---

# 10. Deliberate Negative Space

The colony field must create quiet regions, not only random gaps between individual cards.

Use:

```text
detailFoliageQuietZoneThreshold
detailFoliageBackgroundSuppression
```

Behavior:

```text
below threshold
    -> strongly suppress otherwise valid accents

near/inside a colony
    -> spend the saved cards on coherent local composition
```

Do not compensate by increasing global density.

Desired rhythm:

```text
dense local pocket
quiet grass
small mixed clump
quiet grass
strong flower colony
larger quiet region
fern pocket
```

---

# Exact Configuration Changes

The existing world loader uses a flat numeric YAML contract. Keep it flat.

Do not introduce a nested YAML parser or a second runtime config system for this work.

## Modify

`public/config/world.yaml`

Add this block near the existing macro grass habitat settings:

```yaml
# Detail foliage composition. Rendering radius/material/card topology stay fixed;
# these values only change deterministic tile-build composition.
detailFoliageDensity: 0.35
detailFoliageColonyWorldSize: 9
detailFoliageClumpWorldSize: 2.25
detailFoliageColonyStrength: 0.78
detailFoliageDominantFamilyShare: 0.74
detailFoliageTintCoherence: 0.82
detailFoliageQuietZoneThreshold: 0.32
detailFoliageBackgroundSuppression: 0.62
detailFoliageCoreHeightBias: 0.14
detailFoliageMaturePhenotypeBias: 0.62
detailFoliageEcologyStrength: 0.75
detailFoliageEdgeCompanionStrength: 0.32
detailFoliageStoneFringeStrength: 0.42
detailFoliagePathFringeStrength: 0.22
```

These are starting values, not sacred values. The allowed ranges below are the contract.

## Modify

`src/world/WorldConfig.ts`

Add all fourteen numeric fields to `WorldConfig` using exactly the YAML names above.

Do not add optional config. Production config fails closed today; preserve that behavior.

## Modify

`src/world/WorldConfigSchema.ts`

Add bounded rules:

| Setting | Min | Max | Notes |
| --- | ---: | ---: | --- |
| `detailFoliageDensity` | 0.10 | 0.35 | hard production workload ceiling |
| `detailFoliageColonyWorldSize` | 6 | 16 | metres |
| `detailFoliageClumpWorldSize` | 1 | 4 | metres |
| `detailFoliageColonyStrength` | 0 | 1 | spatial correlation strength |
| `detailFoliageDominantFamilyShare` | 0.50 | 0.90 | dominant colony family share |
| `detailFoliageTintCoherence` | 0.50 | 1 | flower tint family coherence |
| `detailFoliageQuietZoneThreshold` | 0 | 0.70 | macro quiet-region cutoff |
| `detailFoliageBackgroundSuppression` | 0 | 0.90 | suppression below cutoff |
| `detailFoliageCoreHeightBias` | 0 | 0.25 | max multiplicative height bias |
| `detailFoliageMaturePhenotypeBias` | 0 | 1 | mature-row bias in colony core |
| `detailFoliageEcologyStrength` | 0 | 1 | ecology vs colony weighting |
| `detailFoliageEdgeCompanionStrength` | 0 | 0.80 | compatible edge companions |
| `detailFoliageStoneFringeStrength` | 0 | 1 | soft stone fringe weighting |
| `detailFoliagePathFringeStrength` | 0 | 1 | soft path verge weighting |

## Modify

`src/world/WorldConfigValidator.ts`

Add cross-field rules:

```text
detailFoliageClumpWorldSize <= detailFoliageColonyWorldSize * 0.5
```

Reject configurations where the local clump becomes so large that the two scales collapse into one field.

Do not add arbitrary aesthetic cross-rules that belong in visual tuning.

---

# Runtime Tuning Type

## New file

`src/world/grass/DetailFoliageTuning.ts`

Define only the live tuneable subset used by the distribution/factory/menu.

```ts
export interface DetailFoliageTuning {
  density: number;
  colonyWorldSize: number;
  clumpWorldSize: number;
  colonyStrength: number;
  dominantFamilyShare: number;
  tintCoherence: number;
  quietZoneThreshold: number;
  backgroundSuppression: number;
  coreHeightBias: number;
  maturePhenotypeBias: number;
  ecologyStrength: number;
  edgeCompanionStrength: number;
  stoneFringeStrength: number;
  pathFringeStrength: number;
}

export function createDetailFoliageTuning(config: WorldConfig): DetailFoliageTuning;
```

`createDetailFoliageTuning()` copies values from `WorldConfig`. It must not contain alternative production defaults.

YAML is the source of production defaults.

Algorithmic hash salts remain source constants because they are identity/version domains, not art controls.

---

# Exact Placement Integration

## Modify

`src/world/grass/WorldDetailFoliageField.ts`

### Remove

Move the fixed production density out of source:

```text
DETAIL_FOLIAGE_DENSITY
DETAIL_FOLIAGE_DENSITY_CEILING
```

The factory uses `tuning.density` instead.

Keep the fixed structural constants:

- tile size;
- fade distance;
- fade transition;
- residency margin;
- movement epsilon;
- bounds safety values.

Those are renderer/algorithm contracts, not art tuning.

### Add to `WorldDetailFoliageFactory`

Own:

```text
DetailFoliageTuning
WorldDetailFoliageDistribution
reused DetailFoliageDistributionSample
```

Add:

```ts
setTuning(tuning: DetailFoliageTuning): void;
```

### Candidate order

Keep cheap rejections first.

Required build order:

```text
candidate position
    -> height
    -> grass suitability without slope
    -> path hard mask
    -> stone hard clearance
    -> terrain normal / slope suitability
    -> biome sample
    -> existing ecology sample
    -> existing grass habitat sample
    -> biome accent-density gate
    -> colony distribution sample
    -> quiet-zone acceptance
    -> ecology/colony species affinity
    -> dominant/companion species resolution
    -> tint-family resolution
    -> correlated age/height
    -> existing matrix + packed instance metadata
```

Do not run colony value noise for candidates already rejected by terrain/path/stone rules.

### Replace `pickSpecies()`

Move category/ecology/colony weighting to `DetailFoliageAffinity.ts`.

Do not keep two competing species-pick implementations.

### Avoid repeated catalogue scans

Consume `entry.speciesIndex` from the validated biome profile. Do not call `GRASS_ACCENT_SPECIES.find()` inside candidate weighting loops.

### Add invalidation for dev tuning

Add to `WorldDetailFoliageField`:

```ts
invalidate(): void;
```

`invalidate()` must:

- dispose current tile meshes through the existing factory disposal path;
- clear built/empty tile caches;
- clear queued requests;
- mark counts dirty;
- force the next reconcile;
- preserve current enabled/density-governor state.

It is for diagnostics tuning only. Normal gameplay never calls it.

Rebuild still respects `tilesPerFrame: 1`; do not synchronously rebuild every resident tile when a slider changes.

---

# Near Field and Grass System Wiring

## Modify

`src/world/grass/WorldNearGrassField.ts`

Add a `DetailFoliageTuning` field initialized from `WorldConfig`.

`createDetailFoliageLayer()` passes this tuning to `WorldDetailFoliageFactory`.

Add:

```ts
setDetailFoliageTuning(tuning: DetailFoliageTuning): void;
```

Behavior:

```text
store tuning
-> detailFoliageFactory?.setTuning(tuning)
-> detailFoliageField?.invalidate()
```

Do not recreate the atlas or material when distribution settings change.

Do not alter quality-governor density scaling. The governor still multiplies the configured production population down on compact/degraded tiers.

## Modify

`src/world/WorldGrassSystem.ts`

Store the current `DetailFoliageTuning` created from `worldConfig`.

Add:

```ts
getDetailFoliageTuning(): DetailFoliageTuning;
setDetailFoliageTuning(tuning: DetailFoliageTuning): void;
```

`setDetailFoliageTuning()` delegates to `WorldNearGrassField`.

The normal `update()` method must not sample or manipulate distribution fields.

---

# Lil-Like Tuning Menu

The repository already uses a lightweight native DOM tuning menu (`GrassArtMenu`) and does not need a new GUI dependency.

Do **not** add `lil-gui`, `dat.gui`, or another runtime package for this work.

Implement a separate native lil-like panel so grass art direction and detail-foliage world configuration stay SOLID and independent.

## New file

`src/app/DetailFoliageTuningMenu.ts`

Follow the same native DOM pattern as `GrassArtMenu`:

- `<details>` root;
- labeled range/number inputs;
- output values;
- reset button;
- YAML export/copy button;
- disposal-safe event listeners;
- no framework/dependency.

Use the existing `.grass-art-menu` styling class so no CSS change is required unless manual QA proves a layout defect.

## Visibility

Create the menu only when the existing diagnostics GUI conditions are true:

```text
profile.showGui
AND
?diagnostics=1
```

No production UI cost when diagnostics are disabled.

## Menu controls

Use these exact ranges initially:

| Label | Field | Range | Step |
| --- | --- | --- | --- |
| Density | `density` | 0.10-0.35 | 0.01 |
| Colony size | `colonyWorldSize` | 6-16 m | 0.5 |
| Clump size | `clumpWorldSize` | 1-4 m | 0.25 |
| Colony strength | `colonyStrength` | 0-1 | 0.02 |
| Dominant family | `dominantFamilyShare` | 0.50-0.90 | 0.01 |
| Tint coherence | `tintCoherence` | 0.50-1 | 0.01 |
| Quiet threshold | `quietZoneThreshold` | 0-0.70 | 0.02 |
| Background suppression | `backgroundSuppression` | 0-0.90 | 0.02 |
| Core height | `coreHeightBias` | 0-0.25 | 0.01 |
| Mature bias | `maturePhenotypeBias` | 0-1 | 0.02 |
| Ecology influence | `ecologyStrength` | 0-1 | 0.02 |
| Edge companions | `edgeCompanionStrength` | 0-0.80 | 0.02 |
| Stone fringe | `stoneFringeStrength` | 0-1 | 0.02 |
| Path fringe | `pathFringeStrength` | 0-1 | 0.02 |

## Expensive-change behavior

All these controls affect deterministic tile content.

While dragging a range:

- update the displayed numeric output on `input`;
- apply the tuning callback only on `change`/pointer release.

Do not invalidate/rebuild the detail field for every intermediate slider pixel.

After an applied change, tiles rebuild incrementally at the existing one-tile-per-frame budget.

## Reset

`Reset to YAML` restores the `DetailFoliageTuning` snapshot created from the loaded `WorldConfig`.

Do not mutate `WorldConfig` itself.

## YAML export

Export a flat snippet compatible with `public/config/world.yaml`:

```yaml
detailFoliageDensity: 0.35
detailFoliageColonyWorldSize: 9
detailFoliageClumpWorldSize: 2.25
detailFoliageColonyStrength: 0.78
detailFoliageDominantFamilyShare: 0.74
detailFoliageTintCoherence: 0.82
detailFoliageQuietZoneThreshold: 0.32
detailFoliageBackgroundSuppression: 0.62
detailFoliageCoreHeightBias: 0.14
detailFoliageMaturePhenotypeBias: 0.62
detailFoliageEcologyStrength: 0.75
detailFoliageEdgeCompanionStrength: 0.32
detailFoliageStoneFringeStrength: 0.42
detailFoliagePathFringeStrength: 0.22
```

Use the same clipboard + downloaded-YAML fallback pattern as `GrassArtMenu`.

## Modify

`src/app/WorldApp.ts`

Add:

```text
private detailFoliageMenu?: DetailFoliageTuningMenu
```

When diagnostics GUI is enabled, construct it with:

```text
this.grass.getDetailFoliageTuning()
this.grass.setDetailFoliageTuning
```

Dispose it with the rest of the app UI.

Do not put tuning-panel behavior into the render loop.

---

# Exact File Change Map

## New files

### `src/world/grass/DetailFoliageTuning.ts`

- runtime tuning interface;
- `WorldConfig` -> tuning mapper;
- no alternative defaults;
- no renderer imports.

### `src/world/grass/WorldDetailFoliageDistribution.ts`

- world-space colony and clump fields;
- stable rolls for family/tint/age;
- negative-space signal;
- allocation-free sampler;
- no ecology resampling;
- no Three.js.

### `src/world/grass/DetailFoliageAffinity.ts`

- soft ecology/category affinity;
- dominant-family and companion weighting;
- tint-family coherence;
- path/stone fringe affinity only after hard safety masks;
- no renderer imports.

### `src/app/DetailFoliageTuningMenu.ts`

- diagnostics-only native lil-like controls;
- change-on-release behavior;
- Reset to YAML;
- export/copy flat YAML snippet.

### `scripts/verify-detail-foliage-distribution.mjs`

- numeric deterministic verifier;
- golden digest;
- continuity/correlation/negative-space checks;
- no browser automation or new dependency.

## Modified files

### `public/config/world.yaml`

Add the fourteen flat production tuning keys.

### `src/world/WorldConfig.ts`

Add the fourteen config fields.

### `src/world/WorldConfigSchema.ts`

Add the bounded numeric rules from this plan.

### `src/world/WorldConfigValidator.ts`

Add the clump-vs-colony scale relationship validation.

### `src/grass/biome/GrassAccentSpecies.ts`

- replace `tall-tuft` with `low-shrub`;
- replace `sprig` with `broadleaf-rosette`;
- keep species count exactly eight;
- preserve packed index contract.

### `src/grass/biome/GrassBiomeProfile.ts`

- resolve/store `speciesIndex` during profile validation;
- remove runtime candidate-loop species catalogue searches.

### `src/grass/biome/GrassBiomeProfiles.json`

- remove `tall-tuft` and `sprig` references;
- add shrub/broadleaf weights per biome;
- keep flowers subordinate to green foliage.

### `src/world/grass/WorldDetailFoliageAtlasFactory.ts`

- replace old tall-tuft procedural cell with low shrub;
- replace sprig cell with broadleaf rosette;
- keep 8 columns × 2 rows;
- keep cell resolution/padding/texture settings unchanged.

### `src/world/grass/WorldDetailFoliageField.ts`

- consume `DetailFoliageTuning`;
- remove hardcoded production density;
- add distribution/affinity selection after existing cheap gates;
- reuse output sample objects;
- use pre-resolved species indices;
- add `setTuning()` on factory;
- add `invalidate()` on field;
- preserve geometry/material/attributes/fade/residency.

### `src/world/grass/WorldNearGrassField.ts`

- create/store tuning from world config;
- pass tuning into detail factory;
- expose `setDetailFoliageTuning()`;
- invalidate only detail-foliage tiles after tuning changes;
- leave quality-governor behavior unchanged.

### `src/world/WorldGrassSystem.ts`

- expose tuning getter/setter;
- delegate to near field;
- keep distribution logic completely out of `update()`.

### `src/app/WorldApp.ts`

- create/dispose diagnostics detail-foliage menu;
- wire menu callback to grass system;
- no render-loop tuning logic.

### `scripts/verify-flower-variety.mjs`

- replace tall-tuft/sprig expectations;
- assert low-shrub and broadleaf definitions exist;
- assert atlas contains both procedural routines;
- assert the two shrub phenotypes differ structurally;
- assert the two broadleaf phenotypes differ structurally;
- assert species ceiling remains eight.

### `scripts/verify-grass-performance.mjs`

Add deterministic performance contracts described below.

### `scripts/verify-config-contracts.mjs`

Add rejection tests for new config boundaries/cross-rules.

### `package.json`

Add:

```json
"test:detail-foliage": "node scripts/verify-detail-foliage-distribution.mjs"
```

Run it from `build` before `verify-flower-variety.mjs` / grass performance gates.

### `docs/grass-detail-foliage-plan.md`

After implementation, add a short note that the Tiny Glade composition work is specified and tracked by this plan. Do not duplicate the implementation spec there.

---

# Deterministic Verification

Timing is not deterministic. Geometry counts, hashes, positions, species selection, and config contracts are.

The automated acceptance path must therefore gate deterministic workload and composition properties, while hardware timing stays manual.

## New verifier

`scripts/verify-detail-foliage-distribution.mjs`

Use Vite's existing SSR loader pattern already used by `verify-config-contracts.mjs` so Node can execute the TypeScript modules without adding `tsx`, `ts-node`, or another dependency.

Load:

```text
/src/world/WorldConfigLoader.ts
/src/world/grass/DetailFoliageTuning.ts
/src/world/grass/WorldDetailFoliageDistribution.ts
/src/world/grass/DetailFoliageAffinity.ts
/src/grass/biome/GrassBiomeProfile.ts
```

Load the real `public/config/world.yaml` through a mocked `fetch`, as the existing config verifier already does.

## Test A - exact repeatability

For a fixed set of at least 4,096 world coordinates:

1. sample distribution/affinity once;
2. quantize floating outputs to six decimal places;
3. serialize only deterministic numeric/species/tint outputs;
4. calculate SHA-256 with `node:crypto`;
5. run the complete sample again;
6. assert the second digest is identical.

Keep one reviewed golden digest in the verifier for the shipped world seed/config.

Changing:

- hash domains;
- production tuning;
- species weights;
- distribution equations;

will deliberately change the digest and force an explicit verifier update/review.

Do not include timestamps, map iteration order, GPU values, or random process state in the digest.

## Test B - tile-boundary continuity

Sample continuous distribution values around multiple 16 m boundaries:

```text
x = k * 16 - 0.01
x = k * 16 + 0.01
```

for several positive and negative `k` values and fixed `z` samples.

Assert:

- values remain finite and inside `[0, 1]`;
- colony/clump/core strengths do not exhibit a tile-sized discontinuity;
- the sampler API never receives tile coordinates.

The exact small epsilon delta gate should be based on the mathematical maximum implied by the shipped world-size scales, not an arbitrary screenshot tolerance.

## Test C - local family correlation

In a deterministic meadow test region, evaluate accepted neighbors on a fixed spatial grid.

For neighboring accepted samples within roughly one clump radius, require:

```text
same dominant/selected family ratio >= 0.60
```

Also compute the equivalent independent-biome weighted baseline and require the clustered result to exceed it by a meaningful margin.

The second comparison prevents a profile dominated by one species from passing merely because its global weights were already unbalanced.

## Test D - tint coherence

For neighboring flower pairs inside the same local colony/clump neighborhood:

```text
same compatible tint-family ratio >= 0.65
```

Also require improvement over an independent tint roll from the same biome weights.

## Test E - negative space

Divide a deterministic meadow region into 8 m analysis cells.

Require a healthy band rather than one exact percentage:

```text
quiet cells >= 20%
quiet cells <= 65%
```

A quiet cell is one whose deterministic accent acceptance is below the reviewed threshold.

This prevents both failures:

- uniform confetti everywhere;
- a mostly empty field with a few extreme islands.

## Test F - ecology monotonicity

Use synthetic ecology samples with all other inputs fixed.

Examples:

```text
fern affinity: wet/sheltered > dry/exposed
seed-head affinity: dry/exposed > wet/sheltered
broadleaf affinity: fertile/moist > dry/rocky
low-shrub affinity: low-disturbance > high-disturbance
```

These tests verify direction, not exact artistic weights.

## Test G - bounded output

Across all deterministic samples assert:

```text
all weights finite
all normalized strengths in [0, 1]
valid species index 0..7
valid tint row inside existing tint ceiling
no missing/unknown biome species
```

---

# Deterministic Performance Gates

## Modify `scripts/verify-grass-performance.mjs`

Add the following.

### Density and candidate ceiling

Read `detailFoliageDensity` from `world.yaml`.

Assert:

```text
detailFoliageDensity <= 0.35
round(16 * 16 * detailFoliageDensity) <= 90
```

The menu/schema must not permit a production value above this reviewed ceiling.

### Species/atlas ceiling

Assert:

```text
GRASS_MAX_ACCENT_SPECIES === 8
DETAIL_FOLIAGE_VARIANT_ROWS === 2
atlas columns === species count
```

Keep the current atlas dimensions/settings unchanged.

### Renderer contract

Assert the detail layer still has:

```text
one material type
six-vertex card topology
castShadow = false
receiveShadow = false
16 m tile size
one tile build per frame
same fade/residency constants
no extra instance attribute for colony data
```

### Build-only composition

Statically assert:

- `WorldDetailFoliageDistribution` is referenced from the detail factory/build path;
- it is not referenced from `WorldGrassSystem.update()`;
- it is not referenced from `WorldNearGrassField.update()` except indirectly through queued tile build calls;
- no `sample()` call is added to material/update/controller loops.

### No repeated catalogue lookup

Assert candidate species weighting uses validated `speciesIndex` and the detail field no longer contains candidate-loop calls equivalent to:

```text
GRASS_ACCENT_SPECIES.find(...)
```

### Existing detail workload ceiling

Continue to gate the current reviewed candidate/card/draw/vertex envelope.

If the new composition suppresses more cards, tighten the baseline later. Do not loosen it merely because clustering looks better.

---

# Config Contract Tests

## Modify `scripts/verify-config-contracts.mjs`

Add explicit failures:

1. `detailFoliageDensity: 0.36` must be rejected.
2. `detailFoliageColonyWorldSize: 5` must be rejected.
3. `detailFoliageClumpWorldSize: 5` must be rejected.
4. a config where `clumpWorldSize > colonyWorldSize * 0.5` must be rejected by `WorldConfigValidator`.
5. `detailFoliageDominantFamilyShare: 0.95` must be rejected.
6. `detailFoliageCoreHeightBias: 0.30` must be rejected.
7. an unknown `detailFoliageSomethingElse` key must still fail closed through the existing unknown-key contract.

Also assert the shipped values parse exactly.

---

# Flower / Plant Variety Verification

## Modify `scripts/verify-flower-variety.mjs`

Retain the existing flower tests and add:

```text
low-shrub catalogue entry exists
broadleaf-rosette catalogue entry exists
tall-tuft removed
sprig removed
species count remains 8
low shrub has a wider aspect than the narrow grass/seed forms
broadleaf canopy band is lower than flower/seed-head tops
atlas contains drawLowShrub()
atlas contains drawBroadleafRosette()
low-shrub row 0/1 branches differ structurally
broadleaf row 0/1 layouts differ structurally
```

Do not attempt to prove subjective beauty with substring checks. Structural gates prevent regressions; screenshots/manual inspection decide art quality.

---

# Manual Deterministic Visual QA

Use fixed world seed/config, fixed quality tier, and existing deterministic visual-matrix locations.

Always pin the grass tier during A/B captures so the quality governor cannot change density between images.

Recommended query combination:

```text
?diagnostics=1&tier=0
```

Use the same viewport, device profile, camera pose, grass art preset, and world coordinates before/after.

Capture at minimum:

- meadow;
- path edge;
- rocky area;
- water edge;
- dry steppe;
- alpine;
- one close low-angle plant shot;
- one 10-25 m medium-distance colony shot.

## Meadow acceptance

- obvious small flower colonies;
- obvious quiet grass;
- occasional shrub/broadleaf pockets;
- no rainbow confetti;
- green forms dominate total accents;
- no regular grid rhythm.

## Rocky acceptance

- ferns/broadleaf favor believable protected fringes;
- no plant overlaps inside stone clearance;
- no uniform decorative rings.

## Path acceptance

- interrupted flower/verge pockets;
- no continuous border ribbon;
- low shrubs remain away from tread.

## Water-edge acceptance

- wetter green families become more common gradually;
- no abrupt species wall.

## Dry-steppe acceptance

- seed heads/dry forms dominate;
- broadleaf and flowers are restrained;
- colonies still have negative space.

## Alpine acceptance

- low green forms and pale flowers dominate;
- shrubs remain rare;
- no lush meadow composition copied uphill.

---

# Manual Performance QA

Deterministic gates protect workload structure. Manual profiling protects real frame cost.

At the same fixed camera positions used for visual A/B:

record before/after:

```text
accentCards
accentTiles
renderer draw calls
renderer triangles/vertices where available
nearTileBuildMs / maxNearTileBuildMs
frame CPU/GPU stats on the same device
```

Acceptance:

```text
accent tiles              no architectural increase
accent draw calls         no increase from new material/species groups
resident/drawn cards      <= current deterministic baseline at same pose
per-frame colony work     0
atlas GPU allocation      unchanged
material count            unchanged
instance attribute count  unchanged
```

A small increase in occasional detail-tile build time is acceptable only if:

- it remains inside the existing deadline-sliced near build budget;
- detail remains one tile per frame;
- no frame-time spike becomes visible on compact hardware;
- the deterministic operation ceilings remain satisfied.

Do not use wall-clock timing as a build-failing test.

---

# Tuning Workflow

Tune in this order. Do not start with species colors.

## 1. Negative space

Tune:

```text
Quiet threshold
Background suppression
Colony size
```

Goal: readable quiet regions and irregular macro patches.

## 2. Colony coherence

Tune:

```text
Colony strength
Dominant family
Clump size
```

Goal: colonies read as related plants without becoming monoculture circles.

## 3. Flower color coherence

Tune:

```text
Tint coherence
```

Then adjust biome flower weights/tints in `GrassBiomeProfiles.json` only if needed.

## 4. Ecology

Tune:

```text
Ecology influence
Stone fringe
Path fringe
Edge companions
```

Goal: ecology explains distribution without forming obvious procedural borders.

## 5. Age/height

Tune:

```text
Core height
Mature bias
```

Goal: slight internal hierarchy, never a perfect mound.

## 6. Density last

Only lower density if coherent colonies already provide enough richness.

Do not increase above 0.35 in this phase.

---

# Implementation Phases

## Phase F1 - config and pure distribution

Change:

- `public/config/world.yaml`;
- `WorldConfig.ts`;
- `WorldConfigSchema.ts`;
- `WorldConfigValidator.ts`;
- add `DetailFoliageTuning.ts`;
- add `WorldDetailFoliageDistribution.ts`;
- add deterministic verifier.

Acceptance:

- config tests green;
- deterministic digest stable;
- continuity test green;
- no renderer changes yet.

## Phase F2 - profile lookup optimization and family coherence

Change:

- `GrassBiomeProfile.ts` pre-resolved species indices;
- add `DetailFoliageAffinity.ts`;
- integrate distribution/affinity into `WorldDetailFoliageField.ts`;
- keep current species/atlas unchanged for this phase.

Acceptance:

- neighbor family correlation gate green;
- negative-space gate green;
- current detail render budget unchanged.

## Phase F3 - shrub and broadleaf silhouettes

Change:

- `GrassAccentSpecies.ts`;
- `GrassBiomeProfiles.json`;
- `WorldDetailFoliageAtlasFactory.ts`;
- `verify-flower-variety.mjs`.

Acceptance:

- exactly eight species;
- atlas dimensions unchanged;
- one material;
- new silhouettes readable in atlas debug and world.

## Phase F4 - ecology and edge affinities

Change:

- `DetailFoliageAffinity.ts`;
- detail field integration only if needed.

Acceptance:

- synthetic ecology monotonicity gate green;
- rocky/path/water visual checks believable;
- hard path/stone clearances unchanged.

## Phase F5 - age/height hierarchy

Change:

- distribution/affinity age output;
- detail factory scale/phenotype selection.

Acceptance:

- no new instance attributes;
- no bounds regression;
- visual colonies have subtle internal hierarchy.

## Phase F6 - tuning UI

Change:

- add `DetailFoliageTuningMenu.ts`;
- `WorldNearGrassField.ts` tuning setter/invalidation;
- `WorldGrassSystem.ts` getter/setter;
- `WorldApp.ts` diagnostics wiring.

Acceptance:

- GUI exists only with diagnostics;
- slider display updates while dragging;
- expensive rebuild applies only on change/release;
- rebuild stays one tile per frame;
- Reset to YAML works;
- YAML export parses through `WorldConfigLoader` when merged into the production config.

## Phase F7 - final performance gates and docs

Change:

- `verify-grass-performance.mjs`;
- `verify-config-contracts.mjs`;
- `package.json`;
- `docs/grass-detail-foliage-plan.md` status note.

Run:

```text
npm run test:detail-foliage
npm run test:flower-variety
npm run test:config
npm run test:grass-performance
npm run test:grass-placement
npm run build
```

No GitHub Actions. Final deployment remains the existing manual GitHub Pages path.

---

# Definition of Done

The work is complete only when all are true:

```text
[ ] plant distribution forms visible colonies instead of uniform sprinkle
[ ] meaningful quiet grass regions exist
[ ] flower tint reads as local families, not confetti
[ ] low shrub adds a real medium-width bush silhouette
[ ] broadleaf rosette adds a low/wide ground silhouette
[ ] species count remains exactly 8
[ ] atlas dimensions remain unchanged
[ ] material count remains unchanged
[ ] no new normal draw-call class exists
[ ] no detail shadows are added
[ ] no new instance attribute is added
[ ] production density remains <= 0.35/m²
[ ] max production candidates remain <= 90 per 16 m tile
[ ] distribution sampling happens only during tile build
[ ] no new terrain/hydrology/ecology resampling exists
[ ] deterministic golden digest passes
[ ] tile-boundary continuity passes
[ ] family/tint correlation gates pass
[ ] negative-space gate passes
[ ] ecology direction tests pass
[ ] config rejection tests pass
[ ] flower/plant structural verifier passes
[ ] grass performance verifier passes
[ ] full npm build passes
[ ] fixed-pose visual matrix looks better
[ ] manual compact-device profiling shows no meaningful performance regression
```

---

# Recommended Priority

Do **not** begin by increasing flower detail, adding more colors, increasing render radius, or raising density.

The existing flower system already has useful height variation, multiple silhouettes, petal/calyx structure, branched phenotypes, tint variation, and stable shader phenotype variation.

The largest missing step toward the target look is **authored-looking plant communities**.

Priority:

```text
1. deterministic distribution / negative space
2. dominant local families
3. tint coherence
4. low shrub + broadleaf silhouettes
5. ecological agreement
6. age/height hierarchy
7. density tuning last
```

The intended result is a field that looks richer while rendering the same or fewer accent cards:

> Fewer things, placed with more meaning.
