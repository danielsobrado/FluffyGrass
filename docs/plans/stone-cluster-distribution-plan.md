# Stone Cluster Distribution and Look-and-Feel Implementation Plan

## Status

- Target branch: `main`
- Scope: stone distribution, geological coherence, cluster composition, grounding, deterministic authoring, and performance protection
- Renderer: unchanged unless an existing regression is found
- Runtime dependencies: unchanged
- Deployment: manual GitHub Pages deployment; no GitHub Actions
- Performance target: same or lower draw calls, same or lower representative triangle count, no new per-frame procedural work
- Design rules: deterministic, bounded, KISS, SOLID, cacheable, no physics simulation, no unbounded searches

## Objective

Make the stones read as consequences of terrain geology and erosion rather than as individually good-looking rocks scattered by 16 m cells.

The desired hierarchy is:

```text
geological region
    -> cluster/process
        -> anchor/source
        -> secondary stones
        -> debris
```

The improvement must come from distribution and correlation, not from more geometry.

---

# Decisions

1. Keep `WorldStoneSystem`, `StoneRenderBatchBuilder`, render packing, materials, detailed/coarse geometry, streaming radii, and deadline-sliced building unchanged.
2. Do not add another stone LOD. The current detailed/coarse split and small-stone cutoff are enough.
3. Do not add more mesh archetypes. Pebble, boulder, slab, block, shard, and outcrop are sufficient.
4. Do not use a library of arbitrary hand-authored cluster templates. Use four terrain-derived processes: `compact`, `ridge`, `scree`, and `fan`.
5. Replace ordinary independent per-cell placement with deterministic macro clusters plus a low-rate singleton fallback.
6. Use `WorldEcologyField` as the authoritative surface-exposure model. Keep the current low-frequency stone noise only as geological potential.
7. Keep `addVergeStones` as the only path-verge generator. Remove the second recursive near-path satellite path.
8. Remove generic 2-4 parent satellites after macro clusters are active.
9. Preserve split masses, but a split must consume one secondary slot from the cluster budget.
10. Do not add a cluster-wide grass decal/clearance field in this iteration. Existing per-stone clearances should create the grounding response naturally.
11. Preserve deterministic results across cache eviction, cell order, chunk order, and load/unload.
12. Do not add a new GUI dependency. The existing project tuning UI is a custom `<details>` panel, not lil-gui. Stone authoring should use the same lightweight pattern in the stone-world probe.
13. Production YAML remains the source of truth. The tuning menu is an authoring aid and exports a YAML snippet; it does not persist settings itself.

---

# Problems in the current placement

## Quiet-cell repopulation

The current:

```text
FIELD_STONE_CHANCE = 0.52
```

repopulates many cells that the macro rockiness field left empty. With 16 m cells this creates a persistent background of unrelated stones and weakens the contrast between clean meadow and rocky formation.

Replace it with the exact singleton algorithm in this document.

## Duplicate path-edge logic

There are currently two ways to create extra path-edge stones:

- `addVergeStones`;
- recursive `placeCandidate(... isSatellite = true)` near a path.

Keep only `addVergeStones`. It already reasons about path distance, footprint, tangent, and alignment.

## Local satellites become redundant

The current large-parent satellite rule was useful before true macro clustering. Once macro clusters own anchor/secondary/debris relationships, keeping local satellites would create clusters inside clusters and make the budget unpredictable.

Remove the generic satellite block after the new cluster verification passes.

---

# Hard performance contract

The implementation must satisfy all of these:

- no new work in `WorldStoneSystem.update` beyond existing reconciliation/build work;
- no new draw calls;
- no new textures;
- no new material instances;
- no physics;
- no Poisson-disc generation;
- no unbounded rejection/relaxation loop;
- no per-frame cluster sampling;
- fixed 3x3 macro-cell query per stone cell;
- fixed maximum members per macro cluster;
- maximum one overlap-correction move per member;
- bounded descriptor/member caches;
- representative visible roots <= pre-change baseline;
- representative detailed/coarse triangles <= pre-change baseline;
- stone batch vertex payload remains <= 36 bytes/vertex and uses the existing three vertex streams;
- desktop production stone batching remains 49 draw calls at the shipped radius/batch settings;
- desktop material split remains 9 detailed + 40 coarse stone draws;
- compact maximum stone batches remain 16 at the shipped radius/batch settings;
- existing renderer batching ratios remain within `StoneRenderPerformanceVerification` limits;
- no change may raise `stoneRadiusDesktop`, `stoneRadiusCompact`, `stoneDetailRadius`, or `stoneDetailRadiusCompact` to compensate for visual tuning.

The visual improvement must come from better placement, not from spending more render budget.

---

# Existing frame-time budgets to respect

The world already reserves these streaming/build slices:

```text
desktop total streaming build budget: 8.00 ms
desktop stone reserve:                2.00 ms
compact total streaming build budget: 5.00 ms
compact stone reserve:                1.25 ms
```

The cluster work belongs only inside stone build/collection work. It must never migrate into the normal render/update path.

Wall-clock timings vary by machine, so they are not deterministic build gates. They are manual performance acceptance checks in the stone-world probe.

Recommended hardware acceptance:

```text
desktop stone build slice p95 <= 2.00 ms
compact stone build slice p95 <= 1.25 ms
no repeated > 4 ms stone spikes during normal walking/flight
no sustained queue growth after crossing one terrain chunk
```

If these fail but deterministic complexity/count gates pass, profile before changing the algorithm. Do not weaken the frame budgets by default.

---

# Algorithmic cost ceilings

These ceilings are deterministic and should be tested.

With the shipped configuration:

```text
stone cell                         16 m
terrain chunk                      64 m
macro cluster spacing              56 m
macro query around each stone cell 3 x 3
max cluster budget                 8 members
```

A 64 m terrain chunk contains 4 x 4 stone cells.

Across any phase alignment, those cells can touch at most three base macro coordinates per axis. Expanding each by the required one-cell macro neighborhood gives at most:

```text
5 x 5 = 25 unique macro descriptors
```

per cold chunk collection.

Therefore enforce:

```text
max unique macro descriptors touched by one cold 64 m chunk <= 25
max candidate members in one resolved cluster <= 8
max member overlap moves <= 1 per candidate
max macro neighbor checks per 16 m stone cell = 9
```

Do not resolve all 25 potential clusters into members blindly. Use descriptor-first broad-phase intersection before resolving a cluster.

## Cheap cluster/cell broad phase

For a cluster descriptor:

```text
influenceRadius = majorRadius * stoneClusterHaloRatio
```

For the current stone cell AABB `[minX,maxX] x [minZ,maxZ]`:

```text
dx = max(minX - centerX, 0, centerX - maxX)
dz = max(minZ - centerZ, 0, centerZ - maxZ)
```

Skip member resolution when:

```text
dx*dx + dz*dz > influenceRadius*influenceRadius
```

This circle test is intentionally conservative. It is cheaper and simpler than rotated ellipse/AABB intersection and cannot incorrectly remove a valid cluster member.

Order must be:

```text
lookup descriptor
-> inactive? skip
-> broad-phase miss? skip
-> resolve/cache cluster members
-> filter roots to current 16 m stone cell
```

not:

```text
resolve every nearby cluster
-> discover afterward that it cannot touch the cell
```

---

# Files and exact responsibilities

## New: `src/world/stones/StoneClusterField.ts`

Pure deterministic macro geology.

Responsibilities:

- own the 56 m macro lattice;
- derive jittered potential cluster centers;
- own low-frequency geological potential;
- sample shared ecology/landform once at the cluster center;
- decide activation;
- classify `compact`, `ridge`, `scree`, or `fan`;
- resolve strike/downhill direction;
- resolve radius/aspect;
- resolve shared cluster DNA;
- expose descriptor lookup by macro coordinates;
- hold a bounded descriptor cache;
- expose deterministic counters only to verification/debug callers if needed, never to the render loop.

Move the current `sampleRockiness`, `sampleStrike`, and the value-noise support they require out of `StoneField` into this class. Rename `sampleRockiness` to `sampleGeologyPotential` because ecology owns surface exposure.

Do not import `WorldStoneSystem`, scene objects, materials, or render code here.

## New: `src/world/stones/StoneClusterComposition.ts`

Pure composition from a `StoneClusterDescriptor`.

Responsibilities:

- derive member budget;
- assign anchor/secondary/debris roles;
- generate process-specific local offsets;
- choose family-aware archetypes;
- derive scale hierarchy;
- derive orientation hierarchy;
- derive correlated value/moss variation;
- specify split-secondary candidates and fallback-secondary data.

The composition class must not sample Three.js scene/render state.

Prefer returning small immutable member specifications. `StoneField` performs final terrain/path validation and converts them to `StoneInstance`.

## New: `src/world/stones/StoneClusterTuning.ts`

Only non-production mathematical constants/tables:

- cluster hash domain;
- process enum/order;
- role enum/order;
- family relationship tables;
- process-classification constants that deliberately reuse ecology semantics;
- axis-angle helpers/constants;
- cache limits.

Production art controls belong in YAML.

Suggested cache limits:

```text
descriptor cache limit: 512
resolved-cluster cache limit: 256
```

When a cache reaches its limit, trim oldest-first to approximately 60% of capacity, matching the existing transparent deterministic cache style. Cache eviction must only change recomputation frequency, never results.

## Modify: `src/world/stones/StoneField.ts`

Keep it as orchestration and final terrain validation.

Do exactly this:

1. construct one `StoneClusterField`;
2. construct one `StoneClusterComposition`;
3. add a bounded resolved-cluster cache keyed by macro coordinates;
4. replace independent ordinary-stone count generation with macro cluster lookup;
5. for each 16 m cell, query exactly the surrounding 3x3 macro cells;
6. perform the descriptor broad-phase circle/AABB test before resolving members;
7. resolve an entire active/intersecting cluster once via `getResolvedCluster(gx,gz)`;
8. filter accepted roots to the current 16 m stone cell;
9. if the cell lies outside every active cluster halo, evaluate the singleton algorithm once;
10. run `addVergeStones` after geological placement;
11. preserve world bounds, path clearance, slope rejection, sinking, grass clearance, palette/granite behavior, variant selection, and tilt rules;
12. remove the recursive path-near satellite spawn;
13. remove generic parent satellites;
14. preserve split masses using the cluster-budget rules below.

`getResolvedCluster` must resolve the whole cluster before any 16 m cell filters roots. Otherwise overlap correction, anchor validity, and split ownership can depend on which stone cell was requested first.

## Modify: `src/world/WorldConfig.ts`

Add typed numeric fields for all production cluster parameters listed below.

No optional fields. The world config remains strict and complete.

## Modify: `src/world/WorldConfigSchema.ts`

Add primitive range/integer validation for every new cluster parameter using the exact ranges below.

## Modify: `src/world/WorldConfigValidator.ts`

Add cross-field invariants for radius, aspect, budget, and zone ordering.

Do not put those relationships in the loader.

## Modify: `public/config/world.yaml`

Add the shipped values below in the existing procedural-stones section.

This file is the production source of truth.

## New: `src/world/stones/StoneClusterVerification.ts`

Own deterministic distribution and complexity verification.

Do not mix geometry watertightness tests into it; `StoneVerification.ts` already owns geometry.

## Modify: `scripts/verify-stones.mjs`

Load and execute `StoneClusterVerification.ts` alongside existing geometry/runtime/growth/performance verifiers.

Keep `npm run test:stones` as the one local stone gate.

## New: `tools/stone-world/StoneClusterTuningMenu.ts`

Development/authoring-only tuning UI.

Use the same native DOM approach as `GrassArtMenu`: `<details>`, labels, range/number inputs, buttons. Do not install lil-gui/dat.gui.

Responsibilities:

- expose only production-relevant cluster parameters;
- enforce input min/max locally;
- normalize dependent ranges before applying;
- debounce rebuild requests;
- export a YAML snippet;
- provide Reset-to-YAML;
- optionally copy a shareable query string for the current probe location and tuning values.

It must not be imported by production `WorldApp`.

## New: `tools/stone-world/stone-world.css`

Move stone-world probe styling out of the HTML and add styles for the tuning menu.

Keep tool CSS isolated from `src/style.css` so production CSS does not grow for an authoring-only feature.

## Modify: `stone-world.html`

Replace the inline style block with:

```html
<link rel="stylesheet" href="/tools/stone-world/stone-world.css" />
```

Keep the existing canvas/output elements.

## Modify: `tools/stone-world/main.ts`

Refactor the current one-shot construction into small functions:

```text
load config
build terrain once
create/recreate stone probe
update output diagnostics
render frame
```

Exact behavior:

- terrain remains unchanged while only stone cluster tuning changes;
- dispose the previous `WorldStoneSystem` before replacement;
- create a new `StoneField` with the overridden stone config;
- create a new `WorldStoneSystem`;
- drain its static probe build exactly as the tool already does;
- refresh stone count, triangles, draw calls, and build peak output;
- rebuild after a 120 ms debounce while sliders are moving;
- no rebuilding every animation frame.

The existing `growth=moss|lichen` probe override must continue to work after refactoring.

## No change: `src/app/WorldApp.ts`

Do not add live stone tuning to the production world in this iteration.

Reason:

- it would require making the production stone subsystem replaceable;
- it would add lifecycle complexity to the main game for an authoring-only need;
- the stone-world probe already exists specifically to inspect stone distribution;
- tuning there keeps the production runtime untouched.

The normal world remains the final visual verification target after values are copied into `world.yaml`.

## No change: stone renderer files

Do not modify unless verification proves a real renderer defect:

- `src/world/stones/WorldStoneSystem.ts`
- `src/world/stones/StoneRenderBatchBuilder.ts`
- `src/world/stones/StoneRenderPacking.ts`
- `src/world/stones/StoneRenderInstanceWriter.ts`
- stone shader/material files

---

# Exact production YAML configuration

Add:

```yaml
# Macro stone geology. 56 m intentionally does not divide the 16 m stone cell
# or 64 m terrain chunk, preventing visible lattice lock.
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

Keep:

```yaml
stoneDensity: 0.17
stoneClusterChance: 0.82
```

New semantics:

- `stoneDensity`: controls how often eligible macro cells activate; reducing it removes whole clusters instead of thinning every cluster.
- `stoneClusterChance`: activation multiplier for eligible macro clusters; no longer controls local satellites.

## Schema ranges

```text
stoneClusterSpacing          40 .. 96
stoneClusterCenterJitter     0 .. 0.35
stoneClusterRadiusMin        4 .. 30
stoneClusterRadiusMax        8 .. 40
stoneClusterAspectMin        0.45 .. 0.90
stoneClusterAspectMax        0.60 .. 1.00
stoneClusterBudgetMin        integer 4 .. 8
stoneClusterBudgetMax        integer 4 .. 12
stoneClusterCoreRatio        0.20 .. 0.60
stoneClusterShoulderRatio    0.50 .. 0.90
stoneClusterHaloRatio        0.90 .. 1.25
stoneClusterDensityResponse  1 .. 12
stoneSingletonChance         0 .. 0.25
```

## Cross-field validation

Require:

```text
stoneClusterRadiusMin < stoneClusterRadiusMax
stoneClusterAspectMin <= stoneClusterAspectMax
stoneClusterBudgetMin <= stoneClusterBudgetMax
stoneClusterCoreRatio < stoneClusterShoulderRatio
stoneClusterShoulderRatio < stoneClusterHaloRatio
stoneClusterRadiusMax * stoneClusterHaloRatio <= stoneClusterSpacing * 0.5
```

The last rule guarantees a fixed 3x3 macro-cell neighborhood is sufficient.

---

# Which parameters belong in the tuning menu

The menu exists to tune visuals, not expose every internal constant.

## Distribution section

Expose:

```text
stoneDensity
stoneClusterChance
stoneSingletonChance
stoneClusterSpacing
```

Recommended authoring UI ranges/steps:

```text
Density            0.05 .. 0.40  step 0.01
Cluster chance     0.20 .. 1.00  step 0.02
Singleton chance   0.00 .. 0.25  step 0.01
Cluster spacing    40   .. 96    step 2 m
```

These are the first parameters to tune because they determine macro rhythm and clean-space frequency.

## Cluster size section

Expose:

```text
stoneClusterRadiusMin
stoneClusterRadiusMax
stoneClusterAspectMin
stoneClusterAspectMax
stoneClusterCenterJitter
```

UI ranges/steps:

```text
Radius min      4.0 .. 30.0  step 1 m
Radius max      8.0 .. 40.0  step 1 m
Aspect min     0.45 .. 0.90 step 0.01
Aspect max     0.60 .. 1.00 step 0.01
Center jitter  0.00 .. 0.35 step 0.01
```

Normalize immediately in the menu:

```text
radiusMin <= radiusMax - 1
aspectMin <= aspectMax
radiusMax * haloRatio <= spacing * 0.5
```

If spacing is reduced so the radius invariant would fail, reduce `radiusMax` automatically rather than letting the probe enter an invalid state.

## Composition section

Expose:

```text
stoneClusterBudgetMin
stoneClusterBudgetMax
stoneClusterCoreRatio
stoneClusterShoulderRatio
stoneClusterHaloRatio
stoneClusterDensityResponse
```

UI ranges/steps:

```text
Budget min       4 .. 8    step 1
Budget max       4 .. 12   step 1
Core ratio     0.20 .. 0.60 step 0.01
Shoulder ratio 0.50 .. 0.90 step 0.01
Halo ratio     0.90 .. 1.25 step 0.01
Density curve  1.0 .. 12.0 step 0.25
```

Normalize:

```text
budgetMin <= budgetMax
core < shoulder
shoulder < halo
radiusMax * halo <= spacing * 0.5
```

## Do not expose in the menu

Keep these algorithmic constants in `StoneClusterTuning.ts`:

- convexity threshold for `ridge`;
- convexity threshold for `fan`;
- minimum fan slope;
- orientation spreads by archetype/role;
- parent-family relationship weights;
- overlap correction factor;
- random hash domains;
- cache sizes.

Those define algorithm behavior. Turning them into live art knobs would create too many interacting variables and make reproducible tuning harder.

## Menu actions

Add exactly these buttons:

```text
Apply now
Reset YAML
Export YAML
Copy probe URL
```

`Apply now` bypasses the debounce.

`Reset YAML` restores values from the loaded `world.yaml`.

`Export YAML` copies/downloads only the stone cluster block, including `stoneDensity` and `stoneClusterChance`.

`Copy probe URL` includes:

```text
x
z
h
d
span
growth
```

and current tuning values as query parameters. This makes visual comparisons reproducible without modifying YAML.

Query overrides are tool-only. The production world loader must not read them.

---

# Data contracts

## `StoneClusterProcess`

```text
compact | ridge | scree | fan
```

## `StoneClusterRole`

```text
anchor | secondary | debris
```

## `StoneClusterDescriptor`

Conceptual fields:

```text
gridX
gridZ
seed
centerX
centerZ
height
geologyPotential
surfaceRockiness
suitability
process
strike
direction
majorRadius
minorRadius
budget
biomeIndex
paletteKey
valueBase
mossBias
```

Descriptor fields must be values, not mutable references to shared scratch objects.

---

# Exact deterministic cluster algorithm

## 1. Macro lattice

Use:

```text
S = stoneClusterSpacing = 56 m
```

For macro cell `(gx,gz)`:

```text
seed = hashStoneCell(gx, gz, config.seed XOR STONE_CLUSTER_DOMAIN)
rng  = StoneRandom.fromSeed(seed)
```

There is at most one potential macro cluster per macro cell.

Use a named fixed domain constant in `StoneClusterTuning.ts`.

## 2. Jittered center

```text
j = stoneClusterCenterJitter
centerX = (gx + 0.5 + rng.fork("center-x").signed(j)) * S
centerZ = (gz + 0.5 + rng.fork("center-z").signed(j)) * S
```

With `j=0.26`, maximum displacement is 14.56 m per axis.

Use labeled forks. Adding another random field later must not move existing centers.

## 3. Geological potential

Move the existing two-octave stone field into `StoneClusterField` and keep its first implementation mathematically unchanged:

```text
coarse = valueNoise(x / 240, z / 240, rockSeed)
fine   = valueNoise((x * 2.7) / 240, (z * 2.7) / 240, rockSeed XOR 0x9e3779b9)
field  = (coarse + 0.4 * fine) / 1.4
geologyPotential = smoothstep(field, 0.52, 0.78)
```

It means:

```text
underlying formation is likely rocky here
```

not:

```text
surface must show rock here
```

## 4. Shared ecology at cluster center

Sample once per uncached descriptor:

```text
height        = field.sampleHeight(centerX, centerZ)
landform      = field.sampleLandform(centerX, centerZ, scratch)
hydrology     = field.sampleHydrology(centerX, centerZ, height, scratch)
pathDistances = field.samplePathDistances(centerX, centerZ, scratch)
ecology       = field.resolveEcology(
                  centerX,
                  centerZ,
                  height,
                  hydrology,
                  pathDistances,
                  scratch
                )
```

Do not create another stone moisture/slope/soil model.

## 5. Suitability

```text
surfaceVisibility = 0.18 + 0.82 * ecology.rockiness
pathSurvival      = 1 - 0.90 * ecology.disturbance
suitability       = clamp01(
                      geologyPotential
                      * surfaceVisibility
                      * pathSurvival
                    )
```

The 0.18 floor keeps rare partly buried meadow formations possible.

## 6. Activation

```text
densityResponse = 1 - exp(-stoneClusterDensityResponse * stoneDensity)
suitabilityResponse = smoothstep(suitability, 0.14, 0.72)
activationProbability =
    stoneClusterChance
    * densityResponse
    * suitabilityResponse
```

The cluster exists only when:

```text
rng.fork("activation").chance(activationProbability)
```

No fallback cluster attempts.

## 7. Process classification

Use landform-scale values:

```text
if landform.slope >= ECOLOGY_ROCK_SLOPE_START:
    scree
else if landform.convexity >= 0.25:
    ridge
else if landform.convexity <= -0.25 and landform.slope >= 0.08:
    fan
else:
    compact
```

Reuse `ECOLOGY_ROCK_SLOPE_START`. Put only the `0.25` and `0.08` algorithm constants in `StoneClusterTuning.ts`.

## 8. Direction

```text
strike = sampleStrike(centerX, centerZ)
normal = field.sampleNormal(centerX, centerZ, scratch)
downhillAngle = atan2(normal.z, normal.x)
```

Then:

```text
compact -> strike + rng.fork("direction").signed(0.35)
ridge   -> strike
scree   -> downhillAngle
fan     -> downhillAngle
```

Do not derive a second terrain gradient.

## 9. Radius

```text
radiusT = smoothstep(suitability, 0.20, 0.85)
baseRadius = lerp(stoneClusterRadiusMin, stoneClusterRadiusMax, radiusT)
majorRadius = clamp(
  baseRadius * rng.fork("radius").range(0.90, 1.10),
  stoneClusterRadiusMin,
  stoneClusterRadiusMax
)
```

## 10. Aspect

```text
aspect = rng.fork("aspect").range(
  stoneClusterAspectMin,
  stoneClusterAspectMax
)
```

Process bias:

```text
compact -> lerp(aspect, 0.95, 0.55)
ridge   -> aspect
scree   -> lerp(aspect, stoneClusterAspectMin, 0.45)
fan     -> lerp(aspect, 0.88, 0.45)
```

Then:

```text
minorRadius = majorRadius * aspect
```

## 11. Budget

```text
budgetT = smoothstep(suitability, 0.25, 0.80)
budget = round(lerp(stoneClusterBudgetMin, stoneClusterBudgetMax, budgetT))
budget = clamp(budget, stoneClusterBudgetMin, stoneClusterBudgetMax)
```

No retries to refill rejected members.

---

# Member roles

For the valid configured range `budget >= 4`:

```text
anchorCount = 1
secondaryCount = clamp(floor((budget - 1) * 0.35), 1, 2)
debrisCount = budget - anchorCount - secondaryCount
```

Examples:

```text
budget 4 -> 1 anchor, 1 secondary, 2 debris
budget 6 -> 1 anchor, 1 secondary, 4 debris
budget 8 -> 1 anchor, 2 secondary, 5 debris
```

Anchor is always member `0`.

Use independent labeled forks:

```text
member:0
member:1
...
```

---

# Exact composition geometry

Define normalized zones:

```text
core     = stoneClusterCoreRatio      # 0.42
shoulder = stoneClusterShoulderRatio  # 0.78
halo     = stoneClusterHaloRatio      # 1.12
```

Local `(u,v)` coordinates are transformed by:

```text
dirX  = cos(direction)
dirZ  = sin(direction)
perpX = -dirZ
perpZ = dirX

worldX = centerX + dirX * (u * majorRadius) + perpX * (v * minorRadius)
worldZ = centerZ + dirZ * (u * majorRadius) + perpZ * (v * minorRadius)
```

## Anchor

`compact` and `ridge`:

```text
u = signed(0.06)
v = signed(0.06)
```

`scree` and `fan`:

```text
u = -0.16 + signed(0.04)
v = signed(0.05)
```

## Secondary radial coordinate

```text
r = lerp(core * 0.55, shoulder * 0.92, random.next())
```

## Debris radial coordinate

```text
t = sqrt(random.next())
r = lerp(core, halo, t)
```

## Compact

```text
angle = random.range(0, 2*pi)
u = cos(angle) * r
v = sin(angle) * r
```

## Ridge

```text
side = random.chance(0.5) ? -1 : 1
u = side * r
```

Secondary:

```text
v = random.signed(0.18 * r)
```

Debris:

```text
v = random.signed(0.34 * r)
```

## Scree

Downhill is positive `u`.

Secondary:

```text
u = r
v = random.signed(r * lerp(0.16, 0.30, r / halo))
```

Debris:

```text
u = r
v = random.signed(r * lerp(0.22, 0.48, r / halo))
```

## Fan

Downhill is positive `u`.

Secondary:

```text
u = r
v = random.signed(r * lerp(0.24, 0.46, r / halo))
```

Debris:

```text
u = r
v = random.signed(r * lerp(0.32, 0.68, r / halo))
```

## Positional breakup

After process placement:

```text
u += random.fork("jitter-u").signed(0.035)
v += random.fork("jitter-v").signed(0.035)
```

Do not sample another world noise field per member.

---

# Archetype relationships

## Anchor selection

Reuse existing biome/slope tables, but set pebble weight to zero and renormalize.

Process modifiers:

```text
compact:
  base level-biome weights, pebble = 0

ridge:
  slab    *= 1.35
  outcrop *= 1.35
  boulder *= 0.70
  pebble   = 0

scree:
  use slope weights
  shard   *= 1.25
  outcrop *= 1.15
  pebble   = 0

fan:
  boulder *= 1.25
  slab    *= 1.10
  shard   *= 0.75
  outcrop *= 0.70
  pebble   = 0
```

## Secondary family table

| Anchor | Secondary weights |
|---|---|
| boulder | boulder 0.55, slab 0.20, block 0.15, shard 0.10 |
| slab | slab 0.50, block 0.20, boulder 0.20, shard 0.10 |
| block | block 0.50, shard 0.20, boulder 0.20, slab 0.10 |
| outcrop | block 0.35, shard 0.30, slab 0.20, boulder 0.15 |
| shard | shard 0.50, block 0.25, boulder 0.15, slab 0.10 |

## Debris family table

| Anchor | Debris weights |
|---|---|
| boulder | pebble 0.70, boulder 0.30 |
| slab | pebble 0.55, slab 0.25, shard 0.20 |
| block | pebble 0.45, block 0.30, shard 0.25 |
| outcrop | pebble 0.35, shard 0.35, block 0.30 |
| shard | pebble 0.45, shard 0.55 |

---

# Exact scale hierarchy

## Anchor

From existing archetype scale band `[minScale,maxScale]`:

```text
anchorScale = lerp(minScale, maxScale, random.range(0.62, 0.92))
```

Rare landmark-boulder multiplier is allowed only for:

- a boulder anchor in a highly suitable cluster; or
- a true singleton boulder.

Never for secondaries or debris.

## Secondary

```text
normalizedRadius = min(1, abs(r) / halo)
radialScale = lerp(0.72, 0.48, normalizedRadius)
secondaryScale = anchorScale * radialScale * random.range(0.90, 1.08)
```

Clamp to the selected archetype scale band.

## Debris

```text
normalizedRadius = min(1, abs(r) / halo)
radialScale = lerp(0.38, 0.18, normalizedRadius)
debrisScale = anchorScale * radialScale * random.range(0.85, 1.15)
```

Clamp lower bound to `0.22` and upper bound to the selected archetype maximum.

---

# Orientation model

Yaw is treated as an axis with period `pi` where appropriate.

Role extras:

```text
anchor    0.00
secondary 0.10
debris    0.28
```

Per archetype:

```text
outcrop: yaw = strike + signed(0.18 + roleExtra)
slab:    yaw = strike + signed(0.22 + roleExtra)
block:   yaw = strike + signed(0.28 + roleExtra)
boulder: yaw = axisLerp(strike, direction, 0.35) + signed(0.42 + roleExtra)
shard:   yaw = direction + signed(0.38 + roleExtra)
pebble:  yaw = random.range(0, pi)
```

This keeps bedrock coherent and loose debris visibly less ordered.

---

# Cluster DNA

Resolve once per cluster:

```text
clusterValueBase = rng.fork("value").range(0.96, 1.03)
clusterMossBias  = rng.fork("moss").range(0.88, 1.12)
```

Choose base palette from the cluster-center biome.

The meadow `mossy` chance becomes a cluster-level choice instead of independent per-stone noise.

Per member:

```text
valueScale = clamp(
  clusterValueBase + memberRandom.fork("value").signed(0.018),
  0.92,
  1.06
)
```

Refactor moss so its large independent random multiplier is removed:

```text
mossBase = existing biome/altitude/exposure result without random factor
moss = clamp01(
  mossBase
  * clusterMossBias
  * memberRandom.fork("moss").range(0.94, 1.06)
)
```

Keep `graniteBlend` per member because elevation can change across a formation.

---

# Terrain/path validation and overlap

Resolve members sequentially in member-index order.

For every candidate:

1. resolve archetype, scale, variant, and footprint;
2. transform local offset to world coordinates;
3. reject outside current world margin;
4. sample actual terrain height and normal;
5. preserve `SLOPE_REJECT_NY`;
6. preserve current path tread/footprint rejection;
7. preserve sinking and tilt rules;
8. test against already accepted members in the same cluster.

## Anchor rule

If anchor member `0` fails terrain/world/path/slope validation, reject the entire cluster and return `[]`.

Never render secondaries/debris without their geological source.

## Overlap broad rule

```text
minimumDistance = 0.78 * (candidateFootprint + existingFootprint) + 0.12
```

If overlapping, perform at most one correction:

```text
pushDirection = normalized(candidatePosition - existingPosition)
```

If distance is nearly zero, use the candidate's process-local radial direction.

Move outward by:

```text
needed = minimumDistance - currentDistance + 0.04
```

Then resample terrain/path once.

If still invalid or overlapping, reject the candidate.

No second correction pass.

---

# Split-mass budget

Keep split boulder/block compositions, but they cannot add an unbudgeted member.

Rules:

1. only anchor boulder/block may split;
2. retain current split chance and shared variant concept;
3. a successful split consumes the first secondary slot;
4. if split-half terrain/path validation fails, generate the normal secondary for that slot;
5. total generated member candidates never exceeds cluster budget.

This preserves the useful broken-mass look without increasing density unpredictably.

---

# Singleton algorithm

Only consider a singleton when the stone cell does not intersect the halo of any active macro cluster.

At the cell center sample/reuse geological potential and ecology.

Define:

```text
singletonSuitability = geologyPotential * (0.25 + 0.75 * ecology.rockiness)
```

Then:

```text
singletonProbability =
  stoneSingletonChance
  * lerp(0.35, 1.0, singletonSuitability)
```

With shipped `stoneSingletonChance = 0.10`, probability is approximately 3.5%-10% instead of the current 52% fallback.

One roll only:

```text
random.fork("singleton").chance(singletonProbability)
```

Singleton family:

```text
70% pebble
22% boulder
8% slab
```

Keep the existing rare landmark-boulder possibility under its current geological restrictions.

---

# Path-verge stones

`addVergeStones` remains separate from geology clusters because it represents human disturbance.

Keep:

- path-distance sampling;
- path tangent alignment;
- footprint-aware tread clearance;
- rockiness weighting;
- small-scale selection;
- overlap check.

Change its regional input from the old surface `rockiness` meaning to the new geological potential/cluster suitability value as appropriate.

Do not let macro clusters deliberately populate the tread and do not add another path-edge spawning rule.

---

# Deterministic verification design

## Principle

Deterministic verification must never depend on camera timing, WebGL, wall-clock speed, random test order, or visual judgment.

Use the real production `TerrainField`, config, cluster field, composition, and `StoneField` through Vite SSR, exactly like the current stone verification path.

## Canonical cluster signature

Add a verification-only canonical serializer in `StoneClusterVerification.ts`.

For each descriptor/member serialize fields in a fixed order.

Quantize only values that are derived through trigonometric/terrain floating-point calculations:

```text
position/height/radius: 1e-4
angles:                 1e-6
scale/moss/value:       1e-6
```

Integer/string/enum values remain exact.

Hash the canonical UTF-8 string with a small local FNV-1a 32-bit helper in the verification file. Do not add a hashing dependency.

The hash is for compact regression reporting. Equality tests should also compare canonical strings so a hash collision cannot hide a failure.

## Fixed sample domain

Use shipped seed/config and sample macro coordinates:

```text
gx = -18 .. 18
gz = -18 .. 18
```

This is:

```text
37 x 37 = 1369 potential macro cells
```

large enough to exercise multiple biomes/landforms while remaining cheap for a local build gate.

For chunk/cell tests sample stone cells covering at least:

```text
chunkX = -6 .. 6
chunkZ = -6 .. 6
```

with deterministic strides where a complete full grid is not required.

## Required test A: descriptor determinism

Construct two independent:

```text
TerrainField
StoneClusterField
```

instances from the same config.

For all 1369 macro coordinates require canonical descriptor equality.

## Required test B: member determinism

For every active descriptor in the fixed domain, compose twice through independent fields and require exact canonical member equality.

## Required test C: query-order independence

Collect the same fixed chunk set in three orders:

```text
row-major
reverse row-major
deterministic shuffled order using fixed seed 0x51c1a57e
```

Build a map:

```text
chunkKey -> canonical StoneInstance signature
```

Every map must match exactly.

This catches hidden dependence on cache insertion/generation order.

## Required test D: cache-eviction independence

1. capture signatures for a fixed central set of macro clusters and chunks;
2. request enough distant descriptors/resolved clusters to exceed both cache limits and force eviction;
3. request the original set again;
4. require identical canonical signatures.

## Required test E: chunk-boundary ownership

For adjacent chunks around `(0,0)`:

- collect each independently;
- every root must appear in exactly one chunk based on `[min,max)` root ownership;
- no duplicate `(x,z,archetype,variantIndex)` root identity across adjacent chunks;
- cluster members crossing chunk boundaries must preserve the same cluster/member identity regardless of which chunk is queried first.

## Required test F: budget bounds

Across the fixed macro domain:

```text
candidate member count <= stoneClusterBudgetMax
accepted member count <= candidate member count
accepted active cluster with members must contain anchor
```

No cluster may exceed 8 candidates under shipped YAML.

## Required test G: anchor invariant

Inject or locate deterministic cases where anchor validation fails.

Require resolved cluster result to be empty.

No debris-only cluster is valid.

## Required test H: process-direction statistics

Do not require each random member to obey a perfect line. Test aggregate geometry.

For active `scree` clusters with at least three accepted members:

```text
mean debris u > anchor u
```

For `fan` clusters:

```text
outer-half mean |v/u| >= inner-half mean |v/u|
```

For `ridge` clusters:

```text
variance along u > variance along v
```

For `compact` clusters:

```text
both axes have non-zero spread
```

Require at least one tested cluster for each process. If the shipped 1369-cell domain does not contain one process, expand deterministically until it does rather than skipping the assertion.

## Required test I: size hierarchy

Across all tested clusters with debris:

Require statistical means:

```text
mean anchor scale > mean secondary scale
mean secondary scale > mean debris scale
```

Also require at least 65% of individual clusters with all three roles to satisfy the same ordering. This allows legitimate archetype-band clamps without losing the global hierarchy.

## Required test J: singleton rate

Across a fixed large set of eligible non-cluster stone cells, record singleton attempts accepted before terrain/path rejection.

Require the raw deterministic roll rate to stay within:

```text
0% <= rate <= stoneSingletonChance + 0.02
```

and require it to be dramatically below the old 52% fallback.

Do not assert an exact visual stone count from singleton terrain rejection.

## Required test K: complexity counters

Instrument only verification/debug paths or derive counts from deterministic calls.

Require:

```text
neighbor macro checks per stone cell == 9
unique macro descriptor keys touched by one cold 64 m chunk <= 25
member candidates per cluster <= configured max
member correction passes <= member candidates
```

Any change that violates these needs an explicit plan update before implementation.

## Required test L: existing renderer budgets

Existing `StoneRenderPerformanceVerification` and `StoneSystemPerformanceVerification` must still pass unchanged:

```text
49 desktop batched stone draws
9 detailed + 40 coarse desktop draws
16 compact maximum batches at shipped settings
<= 36 bytes per vertex
3 vertex streams
packed normalized Int16/Uint8 contracts retained
precomputed bounding box and sphere retained
```

Do not update those expected values just because cluster placement changed.

---

# Distribution regression metrics

`StoneClusterVerification.ts` should print a deterministic summary for the shipped world config:

```text
potential macro cells
active clusters
active cluster percentage
process counts: compact/ridge/scree/fan
candidate members
accepted members
anchors/secondaries/debris
singleton rolls/accepted
mean accepted members per active cluster
mean anchor/secondary/debris scale
max members in one cluster
```

The first implementation should record this summary in the console but avoid hard-coding every percentage as a permanent contract immediately.

Hard-code only safety/behavior invariants at first.

After visual approval, commit a compact regression fingerprint for the shipped configuration. Future intentional art tuning then requires explicitly updating that fingerprint in the same commit as the YAML change.

This avoids freezing the first tuning values before they are visually approved while still giving long-term deterministic regression protection.

---

# Performance verification workflow

## Deterministic local gate

Run:

```bash
npm run test:stones
```

It must cover:

```text
stone geometry
stone profiles
runtime variants
stone growth
cluster determinism/distribution
render packing/performance
production stone-system batching
```

Then run the full production gate:

```bash
npm run build
```

No GitHub Actions are added.

## Authoring probe

Run:

```bash
npm run dev
```

Open:

```text
/stone-world.html?tune=1&x=0&z=0&span=320
```

Use the tool to inspect several deterministic locations and export candidate YAML.

The probe output should show at minimum:

```text
focus x/z
growth mode
stone roots
active render batches
draw calls
triangles
latest build ms
peak build ms
active macro clusters in probe bounds
process counts
accepted cluster members
singletons
```

Add process/member counts to the tool output from generation diagnostics; do not add them to the production HUD unless they prove useful after implementation.

## Manual frame-cost checks

After committing candidate YAML, test the real world with:

```text
?diagnostics=1&control=fly
```

Fly repeatedly across chunk boundaries through:

- quiet meadow;
- rocky area;
- slope/scree;
- alpine;
- path edge;
- water edge.

Observe existing HUD fields:

```text
Stones ... tris ... Build last/peak ms
Frame ... stone ... ms
Draws ... Triangles ...
```

Acceptance:

```text
no higher steady-state stone draw count
no visible queue that continually grows
no repeated stone build spikes above the intended reserve
no obvious FPS regression versus the pre-change baseline in the same camera route
```

Because hardware timings are noisy, compare the same route/build/browser/profile at least three times before declaring a regression.

---

# Visual tuning procedure

Tune in this order. Do not adjust all knobs at once.

## Pass 1: macro rhythm

Only change:

```text
stoneDensity
stoneClusterChance
stoneSingletonChance
stoneClusterSpacing
```

Goal:

- visibly clean meadow intervals;
- recognizable rocky regions;
- no regular 56 m rhythm visible from aerial view;
- singleton rocks feel exceptional.

Do not touch radius/budget yet.

## Pass 2: cluster footprint

Tune:

```text
radius min/max
aspect min/max
center jitter
```

Goal:

- clusters large enough to read as formations;
- no obvious circles;
- ridges/scree visibly directional;
- no neighboring clusters merging into continuous carpet.

## Pass 3: composition density

Tune:

```text
budget min/max
core/shoulder/halo ratios
density response
```

Goal:

- one readable anchor;
- secondaries support silhouette;
- debris fades outward;
- no decorative ring of pebbles.

## Pass 4: validate process rules

Do not tune algorithm constants first.

Inspect examples of:

```text
compact
ridge
scree
fan
```

If one process consistently looks wrong across many seeds/locations, change its algorithm in `StoneClusterTuning.ts`/composition and add a deterministic test. Do not hide an algorithm defect by compensating with global density.

## Pass 5: production verification

Copy/export the chosen values into `public/config/world.yaml`.

Run:

```bash
npm run test:stones
npm run build
```

Then verify in the real world diagnostics route.

---

# Deterministic visual locations

Reuse the existing visual-location system rather than hardcoding arbitrary camera coordinates forever.

At minimum inspect the deterministic categories already available in `WorldVisualMatrixLocations`:

```text
meadow
pathEdge
rocky
slope
dry
steppe
alpine
waterEdge
```

The stone-world probe can still use explicit `x/z` URLs for reproducible screenshots once a useful location has been found.

Recommended final visual matrix:

```text
meadow:       mostly clean, occasional field stone
rocky:        compact/ridge cluster hierarchy clear
slope:        scree points downhill
alpine:       exposed slab/outcrop families
steppe/dry:   angular sparse clusters
pathEdge:     dedicated verge logic, no tread blockage
waterEdge:    no floating/submerged placement regression
```

---

# Implementation sequence

Implement in this exact order so failures stay attributable.

## Step 1 - config contract

Change:

```text
public/config/world.yaml
src/world/WorldConfig.ts
src/world/WorldConfigSchema.ts
src/world/WorldConfigValidator.ts
```

Run:

```bash
npm run test:config
```

Do not change stone distribution yet.

## Step 2 - cluster descriptor field

Add:

```text
src/world/stones/StoneClusterTuning.ts
src/world/stones/StoneClusterField.ts
```

Move geological potential/strike logic out of `StoneField` without changing old placement yet.

Add descriptor determinism tests.

Run:

```bash
npm run test:stones
```

## Step 3 - composition

Add:

```text
src/world/stones/StoneClusterComposition.ts
```

Implement roles, process offsets, families, scale/orientation DNA.

Test composition independently before wiring it into chunk collection.

## Step 4 - StoneField integration

Modify:

```text
src/world/stones/StoneField.ts
```

Wire descriptor broad phase, resolved-cluster cache, root ownership, singleton fallback, split budget, and path-verge cleanup.

Add query-order/cache-eviction/chunk-boundary tests immediately.

## Step 5 - performance gates

Extend:

```text
src/world/stones/StoneClusterVerification.ts
scripts/verify-stones.mjs
```

Confirm existing renderer performance verifiers remain unchanged and passing.

## Step 6 - authoring tool

Add/modify:

```text
tools/stone-world/StoneClusterTuningMenu.ts
tools/stone-world/stone-world.css
tools/stone-world/main.ts
stone-world.html
```

Implement debounced deterministic rebuild and YAML export.

## Step 7 - tuning

Use the menu and deterministic locations.

Only commit final values to:

```text
public/config/world.yaml
```

Do not bake tuned values into TypeScript.

## Step 8 - full validation

Run:

```bash
npm run test:config
npm run test:stones
npm run build
```

Then manual world diagnostics and visual matrix.

---

# Acceptance criteria

The change is complete only when all of these are true.

## Visual

1. Quiet meadows have substantially larger genuinely clean areas than before.
2. Rocky terrain reads as formations rather than uniform scatter.
3. Major clusters have anchor/secondary/debris hierarchy.
4. Scree runs downhill.
5. Ridge clusters read along geological strike.
6. Fan clusters widen downhill.
7. Nearby stones have correlated material/weathering without becoming identical.
8. Singleton stones remain possible but uncommon.
9. Paths retain kicked-aside verge stones without decorative kerb regularity.
10. No cluster renders debris after its anchor was rejected.

## Deterministic

11. Independent field instances produce identical descriptors and members.
12. Chunk query order does not change output.
13. Cache eviction does not change output.
14. Root ownership is unique across chunk boundaries.
15. Candidate count never exceeds cluster budget.
16. One member receives at most one overlap correction.
17. The shipped deterministic summary/fingerprint is reproducible.

## Performance

18. No new per-frame cluster work.
19. No new draw calls.
20. Desktop shipped batching remains 49 stone draws, 9 detailed + 40 coarse.
21. Compact shipped batching remains at most 16 stone batches.
22. Stone vertex payload remains <= 36 bytes/vertex and three streams.
23. Representative roots and triangle count do not exceed the pre-change baseline.
24. Cold-chunk cluster descriptor touches remain <= 25.
25. Production build/streaming queue remains bounded during traversal.
26. Hardware probe shows no meaningful frame-time regression under the same route/profile.

## Maintainability

27. `StoneField.ts` becomes smaller or at minimum does not absorb the new cluster algorithms directly.
28. Production knobs live in YAML.
29. Algorithm constants live in `StoneClusterTuning.ts`.
30. Authoring UI stays out of production `WorldApp`.
31. No GitHub Actions are added.
32. Manual GitHub Pages deployment remains unchanged.

---

# Final target

The world should no longer read as:

```text
grass + randomly scattered good stone assets
```

It should read as:

```text
terrain geology
-> exposed formation
-> anchor rock mass
-> related fragments
-> erosion/debris
-> clean terrain again
```

The preferred result uses the same or fewer rendered stones than the current implementation, but places those stones where each one contributes to a coherent geological story.
