# Tiny Glade-Inspired Stone Design, Distribution, and Look-and-Feel Plan

## Status

- Target branch: `main`
- Scope: stone design, variety, distribution, clustering, grounding, biological growth, and performance protection
- Renderer: preserve existing architecture unless verification finds a real defect
- Runtime dependencies: unchanged
- Deployment: manual GitHub Pages deployment; no GitHub Actions
- Design principles: KISS, SOLID, deterministic, bounded, cacheable, no per-frame procedural work

## Objective

Move the procedural stone system toward the cozy, authored, miniature-diorama feeling associated with Tiny Glade while keeping performance impact minimal.

The key change is not adding more polygons, textures, or arbitrary stone archetypes. The existing stone system already has strong foundations:

- six procedural archetypes: `pebble`, `boulder`, `slab`, `block`, `shard`, and `outcrop`;
- deterministic variants;
- coherent geological orientation;
- biome-aware palettes;
- terrain embedding;
- split stones;
- moss and lichen growth;
- detailed/coarse geometry;
- deterministic caching;
- batched rendering.

The largest remaining opportunity is **composition**: turning good individual stones into believable small geological stories with strong negative space and visual hierarchy.

---

# Target Visual Language

The stone field should read correctly at three scales.

## Far distance

The player should perceive clear rocky patches separated by meaningful areas of grass.

Avoid an evenly sprinkled field of unrelated rocks.

Desired rhythm:

```text
grass grass grass grass

        ●
      ●   ·
         ·

grass grass grass grass grass grass


                 ▰
              ▰   · ·

grass grass grass
```

Avoid:

```text
·  ●   ·   ●  ·   ●  ·   ●
```

## Gameplay distance

Each visible group should usually have a readable composition:

```text
anchor
  -> secondary stones
  -> debris
```

The stones should share enough orientation, palette, scale hierarchy, and weathering to feel related.

## Close distance

Individual stones should use:

- chunky, friendly irregular silhouettes;
- broad readable planes;
- restrained edge detail;
- limited micro-noise;
- believable grounding;
- natural moss or lichen colonies.

The close-range improvement should come primarily from shape language and grounding rather than expensive material complexity.

---

# Priority 1 — Implement Macro Geological Clusters

The current system still places ordinary stones primarily from the 16 m stone-cell perspective. This is the main structural limitation.

Implement the already-planned macro-cluster architecture so the hierarchy becomes:

```text
geological region
    -> cluster / process
        -> anchor / source
        -> secondary stones
        -> debris
```

Recommended structure:

```text
StoneClusterField
    deterministic macro geology and process classification

StoneClusterComposition
    anchor / secondary / debris composition

StoneField
    terrain validation, path rejection, grounding, and conversion to StoneInstance
```

Use deterministic macro clusters with a bounded fixed neighborhood query.

Recommended initial production values:

```yaml
stoneClusterSpacing: 56
stoneClusterCenterJitter: 0.26
stoneClusterRadiusMin: 10
stoneClusterRadiusMax: 22
stoneClusterAspectMin: 0.58
stoneClusterAspectMax: 0.92
stoneClusterBudgetMin: 4
stoneClusterBudgetMax: 8
stoneClusterCoreRatio: 0.42
stoneClusterShoulderRatio: 0.78
stoneClusterHaloRatio: 1.12
stoneClusterDensityResponse: 6
stoneSingletonChance: 0.10
```

Keep the lookup bounded to a fixed 3x3 macro neighborhood.

Do not perform unbounded rejection sampling, Poisson-disc generation, runtime relaxation, or per-frame cluster evaluation.

---

# Priority 2 — Restore Strong Negative Space

The current quiet-cell fallback is too aggressive for the target art direction.

A high chance of placing a fallback stone in otherwise quiet cells makes empty space disappear and produces visual noise.

Replace the current high-rate quiet-cell repopulation with a low-rate singleton fallback.

Target:

```yaml
stoneSingletonChance: 0.10
```

Meaning:

- most empty cells remain empty;
- occasional isolated stones still exist;
- clusters become visually important;
- meadow areas gain breathing room;
- the world reads as composed rather than uniformly populated.

Reducing background stone noise is expected to improve both visual quality and total visible-root count.

---

# Priority 3 — Give Every Cluster a Geological Story

Use four deterministic geological processes.

## Compact

Composition:

```text
1 dominant boulder or slab
2-4 smaller related stones
sparse pebbles
```

Purpose:

- cozy meadow rock groups;
- strong Tiny Glade-like miniature composition;
- asymmetric local landmarks.

Avoid circular arrangements. Prefer irregular triangles, arcs, and offset masses.

## Ridge

Composition:

```text
2-4 slabs / outcrops
shared geological strike
limited debris
```

Purpose:

- exposed bedrock;
- old geological formation;
- directional visual flow.

## Scree

Composition:

```text
larger source upslope
progressively smaller stones downhill
scattered small debris near the end
```

Purpose:

- erosion story;
- slope readability;
- natural size sorting.

## Fan

Composition:

```text
source region
broad downhill wedge
stone size decreases away from source
```

Purpose:

- accumulated debris;
- believable slope process;
- larger-scale authored pattern.

---

# Priority 4 — Enforce Size Hierarchy

A group of similarly sized stones reads procedurally generated.

A cluster should normally have clear hierarchy.

Example:

```text
anchor:       1.7 m
secondary:    0.9 m
secondary:    0.6 m
debris:       0.35 m
debris:       0.24 m
debris:       0.18 m
```

Rules:

- one dominant anchor or source in most clusters;
- maximum one visually competing secondary unless the process specifically needs a pair;
- member scale usually decreases with distance from the anchor/source;
- tiny debris should carry most of the numerical count;
- large stones should remain rare.

This improves visual richness without increasing geometry count.

---

# Priority 5 — Correlate Cluster DNA

Every cluster should derive deterministic shared DNA.

Suggested shared properties:

```text
dominant archetype family
dominant geological strike
palette
weathering baseline
moss baseline
scale hierarchy
preferred variant subset
```

Individual stones then receive small deviations from the shared cluster values.

Example family:

```text
outcrop
slab
slab
boulder
pebble
pebble
```

Avoid fully unrelated mixes such as:

```text
shard
boulder
block
slab
outcrop
pebble
```

unless the terrain process genuinely calls for that diversity.

The goal is **family resemblance**, not uniform duplication.

---

# Priority 6 — Rebalance Archetype Frequency by Biome

Do not add more archetypes. The existing six are sufficient.

The improvement should come from better frequency and context.

## Meadow

Strongly favor:

```text
boulder
pebble
slab
```

Use:

```text
outcrop occasionally
block rarely
shard almost never
```

This keeps meadow stones softer and friendlier.

## Dry / Steppe

Favor:

```text
slab
boulder
block
```

Allow:

```text
some shard
moderate pebble debris
```

## Alpine / Steep

Favor:

```text
outcrop
slab
block
shard
```

Use pebbles as downhill debris.

Strong, sharp archetypes should be contextual rather than globally common.

---

# Priority 7 — Restrained Shape-Language Pass

Only tune individual geometry after macro distribution and composition work is active.

The current shape grammar is already strong:

```text
irregular footprint
-> contact
-> belly
-> shoulder
-> crown
-> top
```

with broad cuts and optional close-range chips.

For the target aesthetic, tune toward:

```text
broader masses
fewer needle-like corners
larger readable planes
less equal-sized facet noise
slightly rounder boulders
very flat, heavy slabs
outcrops wider rather than taller
fewer cuts on ordinary meadow stones
chips concentrated on a few meaningful corners
```

Do not solve weak silhouettes by adding more procedural noise.

Prefer improving macro shape first.

Keep close-range surface grain disabled unless a future visual test proves it necessary.

---

# Priority 8 — Improve Grounding

The stones should feel as though grass and terrain grew around them rather than as though meshes were placed on top of the world.

The existing system already provides:

- archetype-specific embedding;
- grass clearance;
- turf bounce on lower surfaces;
- terrain-normal alignment.

Strengthen those relationships rather than adding decals.

Recommended grounding behavior:

```text
large slab / outcrop
    deeper embed
    slightly clearer immediate footprint

anchor boulder
    moderate embed
    readable grass opening

secondary stone
    partial grass overlap

small pebble / debris
    little or no explicit grass clearance
    allowed to nestle into grass
```

Avoid identical circular grass clearances around every stone.

Small stones should frequently be partly hidden by blades.

This is a high-value visual improvement with almost no render cost.

---

# Priority 9 — Correlate Moss and Lichen as Colonies

Do not add another material or texture layer.

Use the existing biological growth system but correlate it at cluster level.

Example:

```text
cluster dampness:     0.65
anchor moss:          0.72
secondary A moss:     0.61
secondary B moss:     0.68
exposed fragment:     0.38
```

Rules:

- neighboring stones share a dampness baseline;
- local orientation/exposure still modifies individual growth;
- sheltered lowland groups favor moss;
- dry exposed formations favor lichen;
- alpine bare rock should retain lower total biological coverage;
- growth should cross multiple faces naturally instead of appearing as isolated random spots.

The group should look as though it experienced the same microclimate for years.

---

# Priority 10 — Add Cheap Anti-Repetition Rules

Use deterministic generation-time rules.

## Variant repetition

Do not repeat the same `variantIndex` twice in a small cluster unless the available variant pool requires it.

## Anchor competition

Avoid two similarly sized dominant anchors directly beside each other unless the geological process explicitly creates a paired formation.

## Size progression

Secondary scale should generally decrease with distance from the source or anchor.

## Palette consistency

Neighboring members in one cluster should use compatible palette and granite-blend values.

## Strong-shape cooldown

`shard` and similarly visually loud forms should have local cooldown logic so they do not repeat frequently.

## Orientation

Derive dominant yaw from geological strike or downhill direction, then apply only bounded member deviation.

## Split masses

A split mass must:

- clearly read as pieces of the same original stone;
- share palette, weathering, and approximate orientation;
- consume one secondary slot from the cluster budget.

## Nearby clusters

If two clusters nearly merge into a dense carpet, prefer strengthening one readable formation over preserving every potential member.

No runtime simulation is required.

---

# Path Verge Stones

Keep the specialized existing path-verge generator.

It has a clear environmental story:

- the path was cut through existing rocky ground;
- small displaced stones sit outside the tread;
- their long axis aligns with the path;
- their density depends on local rockiness.

Do not duplicate this behavior inside generic cluster satellites.

Once macro clusters are active:

- keep `addVergeStones`;
- remove the second recursive path-near satellite behavior;
- do not add decorative continuous stone kerbs.

Paths should feel worn through the landscape, not intentionally bordered everywhere.

---

# Renderer and LOD Strategy

Preserve the current rendering architecture.

Do not add:

```text
new draw calls
new materials
new textures
physics
Poisson-disc generation
per-frame procedural noise
runtime relaxation
third stone LOD
higher stone render radius
```

Keep:

- detailed/coarse geometry split;
- current stone render radii;
- far removal of sub-pixel small stones;
- deterministic cached generation;
- frame-budgeted batch building;
- existing batch packing and instance writing.

The visual improvement must come from **placement, hierarchy, and correlation**, not higher rendering cost.

---

# Performance Contract

The implementation must satisfy these gates.

| Metric | Requirement |
|---|---|
| Stone draw calls | no increase |
| Visible stone roots | less than or equal to current representative baseline |
| Representative triangles | less than or equal to current baseline |
| Per-frame cluster calculations | 0 |
| Cluster query | fixed 3x3 macro neighborhood |
| Cluster members | bounded, initially 4-8 |
| Overlap correction | maximum one adjustment per candidate |
| Cluster caches | bounded |
| New textures | 0 |
| New materials | 0 |
| Stone render distance | unchanged |

Preserve the existing shipped batching expectations:

```text
desktop stone batches: 49
detailed desktop draws: 9
coarse desktop draws: 40
compact maximum batches: 16
```

Do not loosen these numbers to compensate for art changes.

---

# Caching

Cluster generation must remain deterministic and cacheable.

Suggested bounded caches:

```text
descriptor cache:       512
resolved cluster cache: 256
```

When capacity is reached:

- evict oldest-first;
- trim to approximately 60% capacity;
- cache eviction may change recomputation frequency only;
- cache eviction must never change the generated world.

---

# Implementation Order

## Pass A — Distribution

Implement:

- `StoneClusterField`;
- `StoneClusterComposition`;
- bounded resolved-cluster cache;
- fixed 3x3 macro lookup;
- low-rate singleton fallback;
- broad-phase cluster/cell rejection.

Remove:

- high-rate quiet-cell repopulation;
- generic parent satellites;
- duplicate path-near satellite behavior.

Keep:

- specialized path verge placement;
- terrain/path/slope validation;
- grass clearance;
- split-stone support.

## Pass B — Composition

Add:

- anchor / secondary / debris roles;
- compact / ridge / scree / fan composition;
- shared cluster DNA;
- scale hierarchy;
- variant non-repetition;
- family-aware archetype choice;
- bounded orientation variation;
- split-secondary budget accounting.

## Pass C — Art Tuning

After the distribution is visually correct:

- rebalance archetype frequencies;
- soften common meadow silhouettes;
- tune slab weight and flatness;
- make outcrops broader;
- reduce unnecessary cuts/chips;
- tune embedding by role;
- tune moss/lichen cluster correlation.

Do not increase geometry complexity until these cheaper adjustments have been evaluated.

## Pass D — QA and Performance

Extend the stone-world probe with lightweight development-only cluster tuning.

Expose only useful production parameters:

```text
stoneDensity
stoneClusterChance
stoneSingletonChance
stoneClusterSpacing
stoneClusterRadiusMin
stoneClusterRadiusMax
stoneClusterAspectMin
stoneClusterAspectMax
stoneClusterCenterJitter
stoneClusterBudgetMin
stoneClusterBudgetMax
stoneClusterCoreRatio
stoneClusterShoulderRatio
stoneClusterHaloRatio
stoneClusterDensityResponse
```

Keep algorithmic thresholds and hash constants out of the art UI.

Support:

```text
Apply now
Reset YAML
Export YAML
Copy probe URL
```

Production values remain in `public/config/world.yaml`.

The authoring UI must never be imported by the production `WorldApp`.

---

# Verification Matrix

Visually inspect at minimum:

```text
meadow flat ground
dry / steppe ground
alpine ground
moderate slope
steep slope
path edge
water edge
high-altitude exposed rock
quiet meadow negative-space area
large compact cluster
ridge cluster
scree cluster
fan cluster
```

For every case verify:

- cluster hierarchy is obvious;
- empty space remains meaningful;
- no visible cell lattice appears;
- neighboring stones feel related;
- large stones remain rare;
- strong shapes do not repeat excessively;
- stones look embedded rather than placed;
- grass does not create identical circular holes;
- moss/lichen is environmentally coherent;
- no chunk-border discontinuity appears;
- deterministic reloads produce identical placement.

---

# Static Verification

Add deterministic cluster tests to the existing stone verification command.

Verify:

```text
same seed + same coordinates -> identical cluster
cache eviction -> identical regenerated cluster
cell query order -> identical result
chunk query order -> identical result
3x3 macro neighborhood ceiling respected
cluster member budget respected
one overlap correction maximum respected
world bounds respected
path tread rejected
slope gates respected
singleton rate bounded
variant repetition rule respected
split masses consume cluster budget
```

Keep geometry watertightness and shape verification in the existing geometry-specific verification code.

---

# Effort Allocation

Recommended emphasis:

```text
70% distribution and composition
20% grounding and environmental correlation
10% individual mesh tuning
```

The existing stones are already technically mature.

The largest visual gain comes from changing the world model from:

```text
individual stones inside 16 m cells
```

to:

```text
geological formations with hierarchy, process, family resemblance, and empty space
```

That change offers the strongest Tiny Glade-like improvement with the smallest performance risk.

---

# Definition of Done

The work is complete when:

- stones form readable geological groups rather than uniform scatter;
- meadows contain large intentional areas with no stones;
- each cluster has clear scale hierarchy;
- meadow, dry, and alpine regions have distinct but coherent stone character;
- common stones have softer, broader Tiny Glade-like silhouettes;
- small stones naturally nestle into grass;
- moss and lichen correlate across local formations;
- no new render materials, textures, or draw calls are introduced;
- visible stone and triangle counts do not exceed the representative pre-change baseline;
- no per-frame cluster generation exists;
- deterministic verification passes;
- `npm run test:stones` remains the single local stone verification gate;
- manual GitHub Pages deployment remains unchanged.
