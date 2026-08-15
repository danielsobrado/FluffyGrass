# Stone Cluster Distribution and Look-and-Feel Plan

## Objective

Improve the procedural stone clusters so they read as terrain-driven geological formations rather than randomly scattered decorative rocks, while keeping performance impact minimal.

The implementation should evolve the existing stone placement model rather than replace the renderer. The current system already provides deterministic cached cells, biome and altitude weighting, geological strike, terrain alignment, downhill scree, split masses, moss and environmental response, batched geometry, near/far geometry, and frame-budgeted streaming.

The main remaining weakness is the macro distribution. Individual stones are visually strong, but the world can still read as grass plus randomly scattered good-looking rocks rather than terrain whose geology caused the rocks to appear where they are.

## Hard performance constraints

All changes in this plan should follow these rules:

- No new per-frame procedural work.
- No additional draw calls in the normal world renderer.
- No new textures required.
- No increase in normal-world stone triangle count.
- Prefer equal or slightly fewer visible stones overall.
- Keep all distribution intelligence inside deterministic cached `StoneField` generation.
- Preserve the existing batched rendering, near/far geometry, streaming, and build-deadline architecture.

The target is a large visual improvement through better composition, correlation, and spatial hierarchy rather than more geometry.

## Current system strengths to preserve

The existing implementation already has several important features that should remain intact:

- 16 m deterministic stone cells.
- Low-frequency rockiness field.
- Biome and altitude density weighting.
- Slope-dependent stone family selection.
- Shared geological strike for nearby stones.
- Downhill-directed scree satellites.
- Split boulder/block masses.
- Path-verge placement.
- Terrain sinking and slope alignment.
- Grass clearance around larger stones.
- Moss and granite response based on environmental conditions.
- Cached geometry variants.
- Detailed and coarse geometry paths.
- Batched stone rendering.
- Deadline-sliced render-batch construction.

These are already the correct foundations. The next step should improve how stones relate to one another spatially.

## Main distribution issue

The current quiet-cell fallback uses a relatively high singleton probability:

```text
FIELD_STONE_CHANCE = 0.52
```

When normal density resolves to zero, more than half of otherwise empty cells can still attempt to place an isolated pebble. With 16 m cells, this creates a persistent background of disconnected stones across terrain that should sometimes be genuinely clean.

At the same time, `stoneClusterChance` is already high and large stones already create satellites. Increasing cluster probability further is therefore unlikely to solve the visual problem.

The better direction is:

- fewer unrelated singleton stones;
- stronger spatial hierarchy inside rocky areas;
- more genuinely empty terrain;
- roughly the same total stone budget redistributed into more meaningful compositions.

## Target spatial hierarchy

Stone placement should operate visually at three scales:

```text
Geological region
    -> stone cluster
        -> individual rock
```

rather than mostly:

```text
cell
    -> independent random rocks
```

The world should clearly contain rocky formations separated by quieter terrain.

---

## Phase 1 — Reduce quiet-cell singleton noise

### Change

Remove or substantially reduce the unconditional quiet-cell singleton behavior.

Instead of:

```text
empty cell -> 52% chance of pebble
```

prefer behavior conceptually closer to:

```text
quiet empty cell      -> usually remain empty
cluster edge          -> occasional loose stone
geological cluster    -> concentrated family of stones
```

### Why

Natural landscapes benefit from high spatial variance:

- clean grass;
- isolated stone;
- small pair;
- strong cluster;
- scree or outcrop;
- clean grass again.

Large quiet zones give the eye somewhere to rest and make actual clusters visually stronger.

### Performance

Likely improves rendering performance slightly because fewer low-value isolated stones are generated and rendered.

---

## Phase 2 — Add a mid-scale cluster occupancy field

### Change

Keep the existing approximately 240 m rockiness field, but add a second deterministic field around roughly 40-70 m.

The scales should have distinct responsibilities:

```text
~240 m  geological region: this hillside is rocky
~50 m   cluster field: an outcrop or stone family exists here
~2-10 m individual composition: actual rocks belonging to it
```

The cluster field should use the same cheap hash/value-noise style already present in `StoneField`.

Do not introduce Poisson sampling, iterative relaxation, physics, or runtime searches.

### Important rule

This field should redistribute the current stone budget rather than increase it.

A rocky region can have fewer occupied cells but higher visual concentration inside selected cluster zones.

### Performance

Negligible. The extra deterministic noise samples happen only during cached cell generation.

---

## Phase 3 — Anchor-driven clusters

### Change

Give significant clusters an explicit visual hierarchy.

A useful model is:

```text
Anchor
- 1 large outcrop, boulder, slab, or block

Secondary stones
- 1-3 medium related pieces

Debris
- 2-6 small fragments or pebbles
```

Use a fixed cluster stone budget so this does not increase total geometry.

For example, instead of producing:

```text
3 independent stones + 4 satellites
```

prefer:

```text
1 anchor + 2 secondary stones + 4 debris stones
```

The number of rendered rocks can remain identical while the composition becomes much more intentional.

### Anchor rules

Good anchor candidates:

- large boulder;
- slab;
- block;
- outcrop.

Do not use every large rock as an anchor. Solitary landmarks should remain possible.

---

## Phase 4 — Parent-aware stone families

### Current issue

Current satellites are primarily chosen as pebbles or boulders regardless of the parent archetype. This can weaken geological coherence.

### Change

Make companion archetype probabilities depend on the anchor.

| Anchor | Likely companions |
|---|---|
| Boulder | smaller boulders, then pebbles |
| Slab | slabs/fragments, then pebbles |
| Outcrop | blocks, shards, then scree |
| Block | smaller blocks, angular debris |
| Shard | shards, small angular debris |

No new archetypes are required.

### Why

The six existing archetypes already provide enough variety. The next gain comes from using them as related geological families rather than independent decorations.

### Performance

Negligible. This is only weighted selection during generation.

---

## Phase 5 — Radial size hierarchy

### Change

Size should generally decrease away from a cluster anchor.

Use a cheap normalized radial factor:

```text
distanceFromAnchor / clusterRadius
```

and bias scale based on that value.

Conceptually:

```text
source / anchor
    large blocks
        medium stones
            small stones
                pebbles
```

This is especially important for scree.

### Scree behavior

Near the source:

- larger blocks;
- angular fragments.

Further downhill:

- medium stones.

At the outer edge:

- pebbles and small debris.

### Performance

Effectively free arithmetic during generation.

---

## Phase 6 — Terrain-shaped cluster footprints

Do not use one circular satellite distribution for all terrain.

### Flat meadow

Use a broad irregular oval.

```text
       o
   . O   .
      o
  .       .
```

### Slope

Stretch the cluster downhill.

```text
       O
      o o
       o
      . .
       .
       v
```

### Ridge

Stretch approximately along geological strike.

```text
.  o  O  o  .  o
-----------------> strike
```

### Foot of slope

Create a wider accumulation fan.

### Implementation

Reuse terrain normals and the existing downhill direction logic wherever possible.

Avoid extra height samples when the terrain normal already provides sufficient direction.

### Why

A few deterministic directional biases can imply long-term geological and erosion processes without any simulation.

---

## Phase 7 — Separate bedrock orientation from loose debris orientation

The existing geological strike is valuable and should remain, but different stone types should respond differently.

### Bedrock-like types

For:

- outcrop;
- slab;
- block.

Use:

- stronger alignment to shared strike;
- lower yaw variation;
- stronger family coherence.

### Boulder

Use:

- moderate strike correlation;
- moderate yaw variation.

### Loose debris

For:

- pebble;
- loose shard.

Use:

- stronger downhill-flow influence;
- substantially more rotation variation;
- weaker strike correlation.

### Result

The placement communicates two processes at once:

```text
bedrock geology + erosion
```

rather than one generic procedural placement rule.

---

## Phase 8 — Cluster DNA

### Change

Give each cluster one deterministic parent seed controlling shared characteristics.

Useful shared properties:

- dominant palette;
- dominant stone family;
- strike;
- average weathering;
- average angularity;
- moss tendency;
- average value/lightness;
- size profile.

Each stone should then deviate slightly from the cluster value rather than sampling its entire appearance independently.

Example:

```text
clusterValue = 0.97
stoneA = 0.96
stoneB = 0.99
stoneC = 0.97
stoneD = 0.95
```

rather than unrelated values across the full allowed range.

### Why

Small correlated differences make nearby stones read as material from the same geological formation.

### Performance

No additional materials or textures are required. Only deterministic scalar values change.

---

## Phase 9 — Better cluster grounding

Individual stone grounding is already strong through:

- mesh embedding;
- slope-dependent sinking;
- contact radius;
- grass clearance;
- moss/environment response.

Extend the same logic slightly at cluster scale.

### Desired response

Near significant clusters:

- slightly less grass directly under and between large rocks;
- more irregular grass at the outer edge;
- exposed-ground tendency immediately downhill from larger formations;
- tiny stones remain allowed inside grass;
- large stones remain visibly embedded.

### Implementation rule

Reuse the existing stone-clearance system rather than introducing decals or another texture layer.

### Visual goal

Avoid:

```text
rock sitting on grass
```

Prefer:

```text
grass and soil grew around the rock formation
```

---

## Phase 10 — Small library of composition templates

### Change

Introduce approximately 5-8 mathematical composition templates.

These are placement templates, not meshes or new assets.

Suggested templates:

1. Solitary landmark.
2. Asymmetric pair.
3. Parent plus two children.
4. Broken slab.
5. Compact outcrop.
6. Elongated ridge.
7. Downhill scree.
8. Partially buried field stones.

A template should contain only normalized relationships such as:

- offset;
- relative scale;
- preferred family role;
- orientation bias.

Then procedurally:

- rotate according to geological strike or downhill direction;
- distort offsets by roughly 20-30%;
- vary scales;
- select compatible archetypes;
- apply cluster DNA.

### Why

This provides art-directed compositions while keeping the system procedural.

### Performance

Near-zero cost. No additional draw calls, textures, or asset memory are needed.

---

## Phase 11 — Preserve occasional solitary stones

Do not make every stone visibly belong to a cluster.

The world still needs:

- isolated pebbles;
- occasional lone boulder;
- occasional two-rock relationship;
- rare landmark rocks.

The difference is that solitary stones should become punctuation between geological groups rather than a uniformly distributed background.

Preserve the existing rare landmark-boulder behavior.

---

## Phase 12 — Core, shoulder, and halo cluster edges

Avoid clusters with an obvious procedural boundary.

Use three visual zones.

### Core

- anchor;
- medium stones;
- highest debris density.

### Shoulder

- fewer medium stones;
- mostly small rocks.

### Halo

- sparse pebbles and small fragments.

Then stop.

Use a smooth radial probability curve and an irregular elliptical footprint rather than a perfect circle.

This avoids the common pattern:

```text
dense rocks | suddenly empty terrain
```

---

## Phase 13 — Stronger ecology correlation

Stone placement should reuse the environmental information already available in the world instead of behaving like an independent decoration layer.

Useful inputs include:

- slope;
- altitude;
- biome;
- ridge/landform character;
- wetness and water proximity;
- path disturbance;
- grass habitat;
- existing rockiness.

The important improvement is correlation between these signals.

### Meadow depression

Prefer:

- few stones;
- more buried stones;
- more moss where appropriate.

### Meadow ridge

Prefer:

- occasional exposed stone group.

### Dry slope

Prefer:

- angular exposed cluster;
- downhill fragments.

### Alpine ridge

Prefer:

- larger slab/outcrop families.

### Water margin

Prefer:

- smaller and more rounded groups;
- placements that continue to obey existing water depth and render rules.

### Path

Preserve the existing kicked-aside verge logic rather than replacing it.

---

## Phase 14 — Do not add more mesh archetypes yet

The current system already has:

- pebble;
- boulder;
- slab;
- block;
- shard;
- outcrop;
- multiple variants per archetype;
- detailed/coarse geometry;
- split masses;
- biological growth.

This is enough combinatorial variety.

The weak point is composition, not asset count.

Adding more meshes now would increase:

- geometry cache size;
- generation complexity;
- QA surface;
- visual inconsistency;

for less benefit than better cluster placement.

---

## Phase 15 — Earlier micro-debris disappearance

The renderer already excludes very small stones from farther chunks. Continue pushing this principle through cluster design.

### Near

Render:

- anchor;
- secondary stones;
- tiny debris.

### Mid

Render:

- anchor;
- medium secondary stones;
- no tiny debris.

### Far

Render:

- anchor;
- possibly one major secondary stone.

The important cluster silhouette remains while low-value triangle noise disappears.

This should reduce cost rather than increase it.

---

## Recommended implementation order

| Phase | Change | Visual gain | Performance impact |
|---|---|---:|---:|
| 1 | Reduce quiet-cell singleton distribution | Very high | Improves |
| 2 | Add 40-70 m cluster occupancy field | Very high | Tiny generation-only cost |
| 3 | Redistribute current stone budget into anchor/secondary/debris | Very high | Neutral |
| 4 | Parent-aware archetype families | High | Negligible |
| 5 | Radial size hierarchy | High | Negligible |
| 6 | Terrain-shaped cluster footprints | High | Negligible |
| 7 | Bedrock vs loose-debris orientation | High | Negligible |
| 8 | Cluster-shared palette/weathering/value | Medium-high | Negligible |
| 9 | Better grass/soil response around groups | Medium-high | Low |
| 10 | Composition templates | High | Neutral |
| 11 | Preserve controlled solitary stones | Medium | Neutral |
| 12 | Core/shoulder/halo falloff | High | Negligible |
| 13 | Stronger ecology correlation | High | Low generation-only |
| 14 | Avoid new mesh archetypes | Prevents unnecessary cost | Improves maintainability |
| 15 | More aggressive micro-debris distance filtering | Medium | Improves |

---

## Suggested data model direction

Keep the implementation simple and deterministic.

A possible internal cluster descriptor could conceptually contain:

```text
cluster seed
cluster center
cluster radius
cluster aspect
cluster direction
cluster archetype family
cluster palette/value bias
cluster moss/weathering bias
cluster composition template
cluster stone budget
```

This does not need to become a persistent runtime object if that complicates the design. It can exist transiently during deterministic cell generation and resolve directly into existing `StoneInstance` values.

Prefer extending the current `StoneField` responsibilities over introducing a new runtime subsystem unless separation becomes clearly necessary.

---

## Configuration guidance

Keep artistic tuning in configuration rather than hardcoding values where practical.

Potential parameters include:

```yaml
stoneClusterFieldWorldSize: 52
stoneClusterOccupancyStrength: 0.8
stoneClusterCoreRadiusScale: 0.45
stoneClusterShoulderRadiusScale: 0.78
stoneClusterHaloDensity: 0.18
stoneClusterAspectMin: 0.7
stoneClusterAspectMax: 1.8
stoneClusterDirectionStrength: 0.75
stoneClusterScaleFalloff: 0.65
stoneSingletonChance: 0.12
```

Exact values should be tuned visually and validated against the existing stone performance checks rather than copied blindly from this plan.

Do not add configuration switches that are not useful for production tuning.

---

## QA requirements

### Visual checks

Verify at minimum:

- clean meadow;
- meadow with one small cluster;
- rocky meadow transition;
- dry slope;
- strong downhill scree;
- ridge/outcrop composition;
- alpine rocks;
- water-edge stones;
- path verge;
- close-range grounding;
- mid-range silhouette;
- far-range disappearance.

### Distribution checks

Add deterministic verification for:

- identical results for the same seed and coordinates;
- stable cluster membership across chunk boundaries;
- no obvious 16 m cell boundaries;
- clusters crossing source-cell boundaries correctly;
- controlled singleton rate;
- cluster stone budget enforcement;
- size decreasing statistically away from anchors;
- slope clusters biased downhill;
- ridge clusters correlated with strike;
- parent-aware family selection;
- no overlap/interpenetration regressions;
- path-clearance guarantees preserved;
- grass-clearance guarantees preserved.

### Performance checks

The change should not regress:

- active stone draw calls;
- normal-world triangle count;
- build-slice CPU budget;
- chunk streaming behavior;
- cell cache behavior;
- geometry cache reuse.

Where possible, require the same or lower overall stone count for representative world samples.

---

## Acceptance criteria

The work is complete when the following are true:

1. Quiet meadows contain visibly larger clean areas than before.
2. Rocky regions form recognizable geological families rather than uniform scatter.
3. Major clusters have readable anchor, secondary, and debris hierarchy.
4. Cluster composition changes appropriately with slope and landform.
5. Nearby stones look materially related without becoming identical.
6. Scree visibly flows downhill.
7. Bedrock-like stones visibly share stronger orientation than loose debris.
8. Cluster edges fade naturally through core, shoulder, and halo zones.
9. Paths, water, grass clearance, sinking, moss, and existing stone rules remain correct.
10. No new runtime draw calls are introduced.
11. No new per-frame procedural work is introduced.
12. Representative triangle count does not increase.
13. Determinism and chunk-boundary continuity remain intact.
14. Existing stone verification and performance checks continue to pass.

## Final visual target

The world should no longer read as:

```text
grass + randomly scattered nice-looking rocks
```

It should read as:

```text
terrain whose geology caused rocks to appear where they are
```

The preferred result uses the same or slightly fewer visible stones than today, with substantially stronger composition and geological coherence.
