# Tiny Glade-Inspired Detail Foliage Plan

## Status

- Target branch: `main`
- Scope: small bushes, flowers, ferns, broadleaf plants, seed heads, sprigs, distribution, clustering, variety, and performance protection
- Renderer: preserve the existing detail-foliage atlas/material/instancing architecture unless a verifier proves a defect
- Runtime dependencies: no new dependencies
- Deployment: manual GitHub Pages deployment; no GitHub Actions
- Principles: KISS, SOLID, deterministic, bounded, cacheable, configuration in YAML, no per-frame procedural generation

## Objective

Move the existing small-plant and flower layer toward a cozy, authored, Tiny Glade-like look while keeping the PoC at approximately the same rendering cost.

The current renderer is already inexpensive and technically sound:

- one shared procedural detail-foliage atlas;
- one shared material;
- instanced cards;
- 16 m tiles;
- base density around 0.35 cards/m²;
- no accent shadows;
- deterministic tile builds;
- distance fade around the near field;
- biome-aware species and tint selection;
- ecology sampling already available at placement time.

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

Do not solve the problem by increasing render distance, adding shadows, adding many materials, or substantially increasing the number of visible cards.

---

# Non-Negotiable Performance Rules

These are implementation constraints, not tuning suggestions.

```text
new normal-frame procedural distribution work    0
new materials                                     0
new runtime textures                              0
new normal detail-foliage draw-call classes       0
new accent shadow casting                         0
new required instance attributes                  0
detail foliage render radius changes              0
physics used for placement                        0
iterative relaxation / Poisson placement          0
unbounded rejection loops                         0
average rendered detail cards                     <= current baseline
```

All colony and composition decisions must happen only while deterministic detail-foliage tiles are built.

No colony noise, ecology classification, species composition, or clustering logic should be added to the normal per-frame update path.

---

# Core Design Principle

## Spend the budget on correlation, not density

The current system already has enough cards to create visual richness. The problem is that candidate positions are relatively evenly stratified and individual species/tints are largely resolved independently.

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

# 1. Add a deterministic colony field

## New file

`src/world/grass/WorldDetailFoliageDistribution.ts`

This module owns only spatial composition logic.

It must not own:

- Three.js scene objects;
- materials;
- GPU buffers;
- renderer state;
- per-frame updates.

## Responsibilities

Given world coordinates, biome/ecology context, and the world seed, resolve stable values such as:

```text
colonyStrength
colonyId
colonyFamily
clumpStrength
localAge
edgeBias
```

Use world-space deterministic hash/value noise at two scales:

```text
macro colony scale: approximately 6-12 m
local clump scale:   approximately 1-3 m
```

The exact values should be YAML-tunable.

The field must be continuous across 16 m detail-foliage tile boundaries.

Do not seed independently per tile for macro colony identity, otherwise colonies will visibly reset at tile edges.

## Implementation constraints

Use cheap deterministic value noise / lattice hashing similar to the existing grass macro fields.

No texture generation is required.

No iterative point relaxation is required.

No spatial index is required.

---

# 2. Colonies choose families, not independent plants

The current species picker should stop treating every accepted detail card as an almost-independent roll.

Each macro colony should resolve a dominant family from the active biome's allowed accent species.

Examples:

```text
meadow colony A      -> daisy / white
meadow colony B      -> fern
meadow colony C      -> round bloom / lavender
dry-steppe colony    -> seed head / straw
alpine colony        -> small fern + pale flowers
```

Within an active colony, use approximately:

```text
65-80% dominant family
20-35% compatible companion species
```

These ratios should be tunable rather than hardcoded art decisions.

The important property is local family resemblance.

A fern pocket should mostly look like a fern pocket.

A daisy colony should mostly look like daisies.

A low-shrub pocket should not be filled with unrelated flowers merely because the biome permits them globally.

---

# 3. Cluster flower tint as well as species

The existing tint catalogue already gives enough global variety.

Do not add many more colors first.

Instead, assign a dominant tint family to each flower colony.

Example:

```text
white daisy colony
    70% white
    20% cream
    10% pale blue

lavender bloom colony
    70% lavender
    20% pink
    10% cream
```

Rare strong contrast colors such as poppy-red should remain accents, not be scattered uniformly.

This avoids a confetti look while preserving all existing tint options globally.

---

# 4. Reuse the existing ecology field

Do not invent another environmental simulation.

The current ecology sample already provides:

```text
moisture
fertility
exposure
disturbance
rockiness
```

Use those existing values to determine species affinity.

Recommended tendencies:

| Family | Moisture | Fertility | Exposure | Rockiness | Disturbance |
| --- | --- | --- | --- | --- | --- |
| daisy | medium | high | medium-high | low-medium | low |
| round bloom | medium | medium-high | medium | low | low |
| large fern | high | medium | low-medium | medium | very low |
| small fern | medium-high | medium | low-medium | medium-high | low |
| broadleaf rosette | medium-high | high | low-medium | low | low |
| low shrub | medium | medium-high | medium | low-medium | very low |
| seed head | low | low-medium | high | medium | low-medium |
| grass tuft / sprig | broad | broad | broad | broad | broad |

These are weights, not hard gates.

Avoid binary ecological rejection where possible because hard thresholds tend to form obvious procedural borders.

---

# 5. Add a true low-shrub / small-bush silhouette

The current accent catalogue contains tufts, ferns, flowers, seed heads, and a sprig, but no real small shrub family.

Add a `low-shrub` family.

## Visual target

The bush should read as a miniature woody/leafy mass rather than a circular sprite.

The procedural atlas cell should include:

- 4-7 offset branch masses;
- irregular broad leaves;
- uneven top height;
- asymmetric lateral reach;
- one or two visible holes in the silhouette;
- darker/root-heavy center;
- a few outward-reaching leaves;
- no perfect hemisphere shape.

## Two phenotype rows

Use the existing two atlas phenotype rows intentionally:

```text
row 0 -> compact / younger shrub
row 1 -> open / mature shrub
```

The two variants should change the whole silhouette, not merely randomize leaf locations.

## Rendering

Keep the current card/billboard/material system.

Do not add full 3D shrub meshes in this phase.

A strong silhouette, shared lighting, fog, palette integration, and wind should be sufficient for the PoC at the intended viewing distance.

---

# 6. Add one broadleaf / rosette family

Flowers + ferns + grass-shaped tufts are not enough silhouette diversity.

Add one broadleaf ground plant.

Suggested form:

- 5-9 wider leaves;
- radial or semi-radial root layout;
- visible center mass;
- broad, low silhouette;
- low canopy position;
- modest wind response.

This gives the layer a fundamentally different shape while remaining a single atlas species.

It is more valuable than adding another flower color.

---

# 7. Keep the species catalogue deliberately small

Do not build dozens of species.

The target should remain approximately 8-10 strongly differentiated families.

Variety should come from:

```text
species
+ two phenotype rows
+ width variation
+ height variation
+ tint variation
+ age/vigor variation
+ colony composition
+ ecological placement
```

This produces more visible variety than many near-identical atlas cells.

If adding the shrub and broadleaf species would exceed the existing bounded shader species array, either replace the least useful visual duplicates or deliberately raise the bounded limit only after verifying the uniform budget on compact devices.

Prefer replacement over expanding limits unless the visual test proves all existing families remain necessary.

---

# 8. Add correlated height and age

Current per-instance scale variation should become partially correlated with colony position.

Resolve an approximate colony-core strength.

Use it to bias:

```text
center/core
    -> stronger vigor
    -> slightly taller plants
    -> more mature phenotype
    -> larger leaves / blooms

outer edge
    -> shorter plants
    -> younger phenotype
    -> more dryness
    -> sparser companions
```

Do not make the gradient mathematically perfect.

Blend core strength with stable per-instance variation so colonies remain irregular.

## Example shrub pocket

```text
1 stronger anchor shrub
1-2 smaller shrubs or broadleaf companions
2-5 low plants
occasional flowers
quiet grass around the outside
```

## Example flower colony

```text
2-3 taller blooms
several canopy-height flowers
shorter young blooms
1-2 compatible green companions
```

All of this should resolve directly into existing instance matrix scale / packed metadata.

No runtime object hierarchy is needed.

---

# 9. Use environmental edges for composition

The current detail layer already evaluates path and stone masks.

Do not only use them as rejection masks.

Use mask transitions as soft compositional signals.

Recommended behavior:

### Stone fringes

Favor:

- small ferns;
- broadleaf plants;
- occasional low shrub;
- moist-looking green companions.

Do not place them directly inside the stone clearance footprint.

Favor the safe outer fringe.

### Path fringes

Allow occasional interrupted flower colonies along sunny verge regions.

Avoid continuous decorative ribbons.

Shrubs should generally remain farther from the actual tread.

### Dry/exposed edges

Favor:

- seed heads;
- dry tufts;
- sparse yellow/cream blooms.

Every edge response should remain probabilistic and interrupted.

---

# 10. Create deliberate empty pockets

A natural-looking glade needs negative space.

The colony field should suppress accent foliage strongly in some otherwise valid meadow regions.

Do not compensate immediately by increasing global density.

Desired visual rhythm:

```text
dense local pocket
quiet grass
small mixed clump
quiet grass
strong flower colony
large quiet region
fern pocket
```

The field should not look equally decorated everywhere.

A useful acceptance condition is that a deterministic sample region contains clearly identifiable low-accent zones, not just random gaps between individual cards.

---

# 11. Preserve the current renderer

Phase 1 should require no fundamental renderer rewrite.

Keep:

- existing instanced card geometry;
- existing shared material;
- existing detail-foliage tile lifecycle;
- existing distance fade;
- existing dither trimming;
- existing wind integration;
- existing biome palette integration;
- existing no-shadow policy;
- existing streaming/residency model.

The colony system should only change **which candidate survives and what it becomes**.

The result should still resolve into the current instance data model wherever possible.

---

# 12. Keep global density flat initially

Do not raise `DETAIL_FOLIAGE_DENSITY` during the first implementation.

Ship the first clustering pass at the current density.

If local colonies later prove too thin, increase candidate evaluation only while reducing background acceptance so the final resident/drawn card count remains close to or below the existing baseline.

The current density ceiling can remain a safety gate.

More build-time candidate evaluation is acceptable if it remains bounded and infrequent.

More persistent GPU foliage is not the preferred solution.

---

# Recommended Visual Species Set

| Family | Visual role | Typical grouping |
| --- | --- | --- |
| low shrub | main small bush mass | rare anchor, 1-3 nearby |
| broadleaf rosette | ground-level shape contrast | 2-6 plant pockets |
| large fern | moist/sheltered mass | 2-5 overlapping |
| small fern | fern companion | 3-8 |
| daisy | fine bright flower | 4-12 colony |
| round bloom | stronger flower accent | 3-8 colony |
| seed head | dry vertical punctuation | loose 3-10 group |
| fine sprig / tuft | transitional filler | sparse companions |

Rendered detail foliage should remain dominated by green forms.

Flowers should attract attention through contrast and grouping, not through excessive count.

---

# Suggested Code Structure

## New

### `src/world/grass/WorldDetailFoliageDistribution.ts`

Responsibilities:

- colony field;
- stable colony identity;
- clump field;
- colony-core value;
- local family preference;
- local tint-family preference;
- empty-region suppression.

No renderer imports.

### Optional: `src/world/grass/DetailFoliageAffinity.ts`

Only add this if `WorldDetailFoliageDistribution.ts` becomes too large.

Responsibilities:

- species/ecology affinity scoring;
- compatible-family tables;
- tint-family compatibility.

Keep it pure and allocation-light.

## Modify

### `src/world/grass/WorldDetailFoliageField.ts`

Keep as orchestration and final placement.

Integrate:

```text
candidate world position
    -> existing terrain/path/stone validation
    -> existing ecology sample
    -> biome profile
    -> colony sample
    -> colony/ecology weighted species pick
    -> local age/scale
    -> existing instance packing
```

### `src/grass/biome/GrassAccentSpecies.ts`

Add or replace species for:

```text
low-shrub
broadleaf-rosette
```

Do not expand the bounded species limit automatically.

### `src/world/grass/WorldDetailFoliageAtlasFactory.ts`

Add procedural drawing routines for the new silhouettes.

Keep one atlas.

### `src/grass/biome/GrassBiomeProfiles.json`

Keep biome ownership of allowed species and relative weights.

Do not move production art choices into TypeScript constants.

### `public/config/world.yaml`

Add production tuning such as:

```yaml
detailFoliage:
  colonyWorldSize: 9.0
  clumpWorldSize: 2.0
  colonyStrength: 0.75
  dominantFamilyShare: 0.72
  backgroundSuppression: 0.45
  shrubFrequency: 0.12
  broadleafFrequency: 0.18
  coreHeightBias: 0.14
  edgeCompanionStrength: 0.35
```

Exact shipped values should be tuned visually and validated rather than copied blindly from this example.

Algorithmic safety constants and hash salts remain TypeScript constants.

---

# Verification Plan

## Static / deterministic verification

Extend `scripts/verify-flower-variety.mjs` where appropriate and add a dedicated distribution verifier if needed.

Recommended checks:

1. same world seed + coordinates produce identical colony/species/tint results;
2. tile boundaries do not reset colony identity;
3. same-family near-neighbor correlation is substantially stronger than random independent placement;
4. same-tint-family near-neighbor correlation is stronger than random independent placement;
5. empty accent regions exist in a deterministic sample area;
6. total candidate and accepted counts remain bounded;
7. average accepted card count does not exceed the agreed baseline;
8. no new per-frame distribution sampling appears in update paths;
9. no new detail foliage material is introduced;
10. no new shadow casting is enabled;
11. biome-specific species constraints remain respected;
12. path and stone clearances remain respected.

## Visual QA

Use the existing visual matrix positions where possible:

- meadow;
- path edge;
- rocky area;
- water edge;
- alpine;
- dry steppe.

Add close and medium detail-foliage captures if the current matrix does not expose colony structure clearly enough.

Acceptance criteria:

### Meadow

- clear small flower colonies;
- some obvious quiet grass;
- occasional bush/leaf pockets;
- no rainbow confetti;
- flowers still secondary to grass.

### Rocky

- ferns/broadleaf favor believable protected fringes;
- plants do not overlap stone footprints;
- no uniform ring decoration around rocks.

### Path edge

- interrupted flower/verge pockets;
- no continuous border ribbon;
- shrubs stay away from the tread.

### Water edge

- greener/moist plant families increase naturally;
- no abrupt species wall.

### Dry steppe

- seed heads and dry forms dominate;
- flowers remain sparse and muted.

### Alpine

- lower forms and restrained pale flowers;
- shrubs rare or absent if the profile excludes them.

---

# Performance Acceptance

Preserve the existing detail-foliage renderer budget as the reference.

The implementation is successful only if the richer visual result comes primarily from composition rather than a larger GPU workload.

Track at minimum:

```text
resident detail cards
drawn detail cards
resident detail tiles
detail draw calls
detail vertices
CPU tile-build candidate count
```

The desired outcome is:

```text
visual richness: noticeably higher
average cards:    same or lower
draw calls:       unchanged architecture
per-frame CPU:    unchanged
```

---

# Implementation Order

## Phase F1 - colony distribution

- add deterministic macro colony field;
- add local clump field;
- add empty-region suppression;
- keep existing species and atlas unchanged;
- keep density unchanged;
- verify tile-boundary continuity and deterministic results.

## Phase F2 - family coherence

- make colonies select dominant families;
- add compatible companions;
- correlate tint families;
- preserve biome ownership;
- verify local neighbor correlation.

## Phase F3 - shrub and broadleaf silhouettes

- add or replace catalogue entries for low shrub and broadleaf rosette;
- implement two strong phenotypes for each;
- keep one atlas and one material;
- verify silhouette readability at close/medium distance.

## Phase F4 - ecological affinities

- wire moisture/fertility/exposure/disturbance/rockiness weights;
- add soft stone/path fringe behavior;
- avoid hard procedural borders;
- validate all visual matrix habitats.

## Phase F5 - height/age hierarchy

- correlate size with colony-core strength;
- add mature/young phenotype bias;
- preserve stable random variation;
- keep matrix packing and draw path unchanged.

## Phase F6 - performance and final art tuning

- compare resident/drawn counts to baseline;
- tune colony size and background suppression in YAML;
- reduce global accents if local colonies create enough richness;
- update verifiers and documentation;
- run static build/verification suite;
- leave manual gameplay and visual acceptance for final hardware testing.

---

# Recommended Priority

Do **not** begin by increasing flower detail or adding many new colors.

The existing flower system already has useful height variation, multiple silhouettes, petal/calyx structure, branched phenotypes, tint variation, and stable shader phenotype variation.

The largest missing step toward the target look is **authored-looking plant communities**.

Priority:

```text
1. distribution / negative space
2. dominant local families
3. tint coherence
4. low shrub + broadleaf silhouettes
5. ecological agreement
6. age/height hierarchy
7. only then density tuning
```

The intended result is a field that looks richer while potentially rendering slightly fewer accent cards:

> Fewer things, placed with more meaning.
