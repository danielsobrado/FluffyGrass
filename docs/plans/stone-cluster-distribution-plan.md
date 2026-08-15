# Stone Cluster Distribution and Look-and-Feel Implementation Plan

## Status

- Target branch: `main`
- Scope: stone distribution, geological coherence, cluster composition, grounding, and low-cost visual hierarchy
- Renderer: unchanged
- Runtime dependencies: unchanged
- Deployment: manual GitHub Pages deployment; no GitHub Actions
- Performance target: same or lower draw calls and representative triangle count; no new per-frame procedural work

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
- representative detailed/coarse triangles <= pre-change baseline.

---

# Files and responsibilities

## New: `src/world/stones/StoneClusterField.ts`

Pure deterministic macro geology.

Responsibilities:

- 56 m macro lattice;
- jittered potential cluster centers;
- low-frequency geological potential;
- shared ecology/landform sampling at cluster center;
- activation;
- process classification;
- strike/downhill direction;
- radius/aspect;
- shared cluster DNA;
- bounded descriptor cache.

Move the current `sampleRockiness`, `sampleStrike`, and the value-noise support they require out of `StoneField` into this class. Rename `sampleRockiness` to `sampleGeologyPotential` because ecology now owns surface exposure.

## New: `src/world/stones/StoneClusterComposition.ts`

Pure composition from a `StoneClusterDescriptor`.

Responsibilities:

- member budget;
- anchor/secondary/debris roles;
- process-specific local offsets;
- family-aware archetype weights;
- scale hierarchy;
- orientation hierarchy;
- correlated value/moss variation;
- split-secondary specification with fallback-secondary data.

It must not know about Three.js scene/render objects.

## New: `src/world/stones/StoneClusterTuning.ts`

Only non-production mathematical constants/tables:

- cluster hash domain;
- process enum/order;
- role enum/order;
- family relationship tables;
- process classification constants that deliberately reuse ecology semantics;
- axis-angle math constants;
- cache limits.

Production art controls belong in `world.yaml`.

## Modify: `src/world/stones/StoneField.ts`

Keep it as orchestration and final terrain validation.

Add:

- one `StoneClusterField`;
- one `StoneClusterComposition`;
- a bounded cache of fully resolved cluster `StoneInstance[]` keyed by macro cell;
- `getResolvedCluster(gx, gz)`;
- root-cell filtering in `generateCell`;
- low-rate singleton generation.

`getResolvedCluster` resolves the entire cluster once, in member order, before any 16 m cell filters its roots. This is important: overlap correction and anchor validity must see the whole family, not only members that happen to fall in one stone cell.

## Modify configuration

- `public/config/world.yaml`
- `src/world/WorldConfig.ts`
- `src/world/WorldConfigSchema.ts`
- `src/world/WorldConfigValidator.ts`

## New verification

`src/world/stones/StoneClusterVerification.ts`

Wire it into `scripts/verify-stones.mjs`.

---

# Exact YAML configuration

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

Conceptually:

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
biomeIndex
paletteKey
valueBase
mossBias
budget
```

## `StoneClusterMemberSpec`

Conceptually:

```text
clusterSeed
memberIndex
role
localU
localV
archetype
relativeScale/or resolved scale intent
rotation intent
variant seed/index
valueScale
moss bias
optional split metadata
optional fallback-secondary metadata
```

Final terrain height, normal, sink, path validity, clear radius, and final `StoneInstance` remain `StoneField` responsibilities.

---

# Exact macro-cluster algorithm

## 1. Macro lattice

Let:

```text
S = config.stoneClusterSpacing = 56
```

For macro cell `(gx, gz)`:

```text
seed = hashStoneCell(gx, gz, config.seed XOR STONE_CLUSTER_DOMAIN)
rng = StoneRandom.fromSeed(seed)
```

There is at most one potential cluster per macro cell.

Use labeled forks for every independent domain so adding one random field cannot move existing clusters.

## 2. Center jitter

```text
j = config.stoneClusterCenterJitter
centerX = (gx + 0.5 + rng.fork("center-x").signed(j)) * S
centerZ = (gz + 0.5 + rng.fork("center-z").signed(j)) * S
```

At `j = 0.26`, maximum axis displacement is `14.56 m`.

## 3. Geological potential

Keep the current two-octave shape exactly for the first implementation:

```text
coarse = valueNoise(x / 240, z / 240, rockSeed)
fine   = valueNoise((x * 2.7) / 240, (z * 2.7) / 240, rockSeed XOR 0x9e3779b9)
field  = (coarse + 0.4 * fine) / 1.4
geologyPotential = smoothstep(field, 0.52, 0.78)
```

Meaning:

```text
geologicalPotential = likely underlying rock formation
```

It no longer decides visible surface rock by itself.

## 4. Shared environment at the center

Sample once:

```text
height        = terrain.sampleHeight(centerX, centerZ)
landform      = terrain.sampleLandform(centerX, centerZ, landformScratch)
hydrology     = terrain.sampleHydrology(centerX, centerZ, height, hydrologyScratch)
pathDistances = terrain.samplePathDistances(centerX, centerZ, pathScratch)
ecology       = terrain.resolveEcology(
                  centerX,
                  centerZ,
                  height,
                  hydrology,
                  pathDistances,
                  ecologyScratch
                )
```

Do not recreate moisture, fertility, exposure, disturbance, or exposed-rock logic inside the stone system.

## 5. Suitability

Use limiting factors:

```text
surfaceVisibility = 0.18 + 0.82 * ecology.rockiness
pathSurvival      = 1 - 0.90 * ecology.disturbance

suitability = clamp01(
  geologyPotential
  * surfaceVisibility
  * pathSurvival
)
```

The `0.18` floor allows rare partly buried lowland geology while still making exposed ridges/slopes much more likely.

## 6. Activation

```text
densityResponse =
  1 - exp(-config.stoneClusterDensityResponse * config.stoneDensity)

suitabilityResponse = smoothstep(suitability, 0.14, 0.72)

activationProbability =
  config.stoneClusterChance
  * densityResponse
  * suitabilityResponse
```

Activate only when:

```text
rng.fork("activation").chance(activationProbability)
```

No fallback center attempts.

## 7. Process classification

Use landform-scale values, in this order:

```text
if landform.slope >= ECOLOGY_ROCK_SLOPE_START:
    process = scree
else if landform.convexity >= 0.25:
    process = ridge
else if landform.convexity <= -0.25 and landform.slope >= 0.08:
    process = fan
else:
    process = compact
```

Reuse `ECOLOGY_ROCK_SLOPE_START` from `WorldEcologyTuning`.

Use named constants in `StoneClusterTuning.ts` for:

```text
STONE_CLUSTER_RIDGE_CONVEXITY = 0.25
STONE_CLUSTER_FAN_CONCAVITY = -0.25
STONE_CLUSTER_FAN_MIN_SLOPE = 0.08
```

## 8. Direction

Move/reuse the existing regional strike sampling in `StoneClusterField`:

```text
strike = sampleStrike(centerX, centerZ)
```

Sample the current terrain normal once:

```text
normal = terrain.sampleNormal(centerX, centerZ, normalScratch)
downhillAngle = atan2(normal.z, normal.x)
```

Process direction:

```text
compact -> strike + rng.fork("direction").signed(0.35)
ridge   -> strike
scree   -> downhillAngle
fan     -> downhillAngle
```

## 9. Radius

```text
radiusT = smoothstep(suitability, 0.20, 0.85)
baseRadius = lerp(
  config.stoneClusterRadiusMin,
  config.stoneClusterRadiusMax,
  radiusT
)
majorRadius = clamp(
  baseRadius * rng.fork("radius").range(0.90, 1.10),
  config.stoneClusterRadiusMin,
  config.stoneClusterRadiusMax
)
```

## 10. Aspect

```text
aspect = rng.fork("aspect").range(
  config.stoneClusterAspectMin,
  config.stoneClusterAspectMax
)
```

Process bias:

```text
compact -> lerp(aspect, 0.95, 0.55)
ridge   -> aspect
scree   -> lerp(aspect, config.stoneClusterAspectMin, 0.45)
fan     -> lerp(aspect, 0.88, 0.45)
```

Then:

```text
minorRadius = majorRadius * aspect
```

## 11. Budget

```text
budgetT = smoothstep(suitability, 0.25, 0.80)
budget = round(lerp(
  config.stoneClusterBudgetMin,
  config.stoneClusterBudgetMax,
  budgetT
))
```

No retries are allowed to refill terrain/path-rejected members.

---

# Role allocation

Because `stoneClusterBudgetMin >= 4`, always use:

```text
anchorCount = 1
secondaryCount = clamp(floor((budget - 1) * 0.35), 1, 2)
debrisCount = budget - 1 - secondaryCount
```

Examples:

```text
budget 4 -> 1 anchor, 1 secondary, 2 debris
budget 6 -> 1 anchor, 1 secondary, 4 debris
budget 8 -> 1 anchor, 2 secondary, 5 debris
```

Member random stream:

```text
rng.fork("member:<index>")
```

---

# Exact local composition

Let:

```text
core     = config.stoneClusterCoreRatio       # 0.42
shoulder = config.stoneClusterShoulderRatio   # 0.78
halo     = config.stoneClusterHaloRatio       # 1.12
```

Local `(u, v)` converts to world coordinates as:

```text
dirX = cos(direction)
dirZ = sin(direction)
perpX = -dirZ
perpZ = dirX

x = centerX + dirX * (u * majorRadius) + perpX * (v * minorRadius)
z = centerZ + dirZ * (u * majorRadius) + perpZ * (v * minorRadius)
```

## Anchor

Compact/ridge:

```text
u = signed(0.06)
v = signed(0.06)
```

Scree/fan source sits slightly uphill:

```text
u = -0.16 + signed(0.04)
v = signed(0.05)
```

## Secondary radius

```text
r = lerp(core * 0.55, shoulder * 0.92, random.next())
```

## Debris radius

```text
r = lerp(core, halo, sqrt(random.next()))
```

This moves more debris area toward shoulder/halo without rejection sampling.

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

## Final small breakup

```text
u += random.fork("jitter-u").signed(0.035)
v += random.fork("jitter-v").signed(0.035)
```

No additional world-noise lookup per member.

---

# Archetype family algorithm

## Anchor

Start from the existing level-biome or slope weights, set `pebble = 0`, then renormalize.

Process modifiers:

```text
compact:
  no additional modifier

ridge:
  slab    *= 1.35
  outcrop *= 1.35
  boulder *= 0.70

scree:
  use slope weights
  shard   *= 1.25
  outcrop *= 1.15

fan:
  boulder *= 1.25
  slab    *= 1.10
  shard   *= 0.75
  outcrop *= 0.70
```

## Secondary weights

| Anchor | Secondary |
|---|---|
| boulder | boulder 0.55, slab 0.20, block 0.15, shard 0.10 |
| slab | slab 0.50, block 0.20, boulder 0.20, shard 0.10 |
| block | block 0.50, shard 0.20, boulder 0.20, slab 0.10 |
| outcrop | block 0.35, shard 0.30, slab 0.20, boulder 0.15 |
| shard | shard 0.50, block 0.25, boulder 0.15, slab 0.10 |

## Debris weights

| Anchor | Debris |
|---|---|
| boulder | pebble 0.70, boulder 0.30 |
| slab | pebble 0.55, slab 0.25, shard 0.20 |
| block | pebble 0.45, block 0.30, shard 0.25 |
| outcrop | pebble 0.35, shard 0.35, block 0.30 |
| shard | pebble 0.45, shard 0.55 |

No member uses the old generic 70/30 satellite rule.

---

# Exact scale hierarchy

## Anchor

For the existing archetype scale band `[minScale, maxScale]`:

```text
anchorScale = lerp(
  minScale,
  maxScale,
  random.range(0.62, 0.92)
)
```

Keep the rare landmark-boulder multiplier only for an anchor or true singleton, never a secondary/debris member.

## Secondary

```text
normalizedRadius = min(1, abs(r) / halo)
radialScale = lerp(0.72, 0.48, normalizedRadius)
scale = anchorScale * radialScale * random.range(0.90, 1.08)
```

Clamp to the selected archetype's existing scale band.

## Debris

```text
normalizedRadius = min(1, abs(r) / halo)
radialScale = lerp(0.38, 0.18, normalizedRadius)
scale = anchorScale * radialScale * random.range(0.85, 1.15)
```

Clamp to:

```text
minimum = 0.22
maximum = selected archetype existing maximum
```

This creates a statistical size falloff without sorting or iterative optimization.

---

# Orientation algorithm

Yaw is an axis with period `pi`.

Implement an `axisLerp` helper using shortest distance on that axis.

Role extra spread:

```text
anchor    0.00
secondary 0.10
debris    0.28
```

Then:

```text
outcrop: yaw = strike + signed(0.18 + roleExtra)
slab:    yaw = strike + signed(0.22 + roleExtra)
block:   yaw = strike + signed(0.28 + roleExtra)
boulder: yaw = axisLerp(strike, direction, 0.35)
                 + signed(0.42 + roleExtra)
shard:   yaw = direction + signed(0.38 + roleExtra)
pebble:  yaw = random.range(0, pi)
```

Bedrock stays correlated; loose debris becomes progressively freer.

---

# Cluster DNA

Resolve once per cluster:

```text
valueBase = rng.fork("value").range(0.96, 1.03)
mossBias  = rng.fork("moss").range(0.88, 1.12)
```

Use the biome at cluster center for the base palette. The existing meadow `mossy` palette roll becomes cluster-level, not per-stone.

Per member:

```text
valueScale = clamp(
  valueBase + memberRandom.fork("value").signed(0.018),
  0.92,
  1.06
)
```

Refactor moss so the old broad independent per-stone random multiplier is removed:

```text
mossBase = existing biome/altitude/environment calculation without random
moss = clamp01(
  mossBase
  * cluster.mossBias
  * memberRandom.fork("moss").range(0.94, 1.06)
)
```

Keep `graniteBlend` per member because altitude legitimately varies across a formation.

---

# Final cluster resolution in `StoneField`

Add:

```text
getResolvedCluster(gx, gz): readonly StoneInstance[]
```

Algorithm:

```text
1. descriptor = clusterField.get(gx, gz)
2. if inactive -> []
3. specs = composition.create(descriptor)
4. resolve anchor first
5. if anchor is invalid -> [] for the entire cluster
6. accepted = [anchor]
7. resolve remaining specs in memberIndex order
8. apply at most one overlap correction per member
9. rejected member is dropped; do not retry/refill
10. cache final accepted StoneInstance[] by macro-cell key
```

The anchor-invalid rule is mandatory. A cluster must never leave a trail of secondary/debris stones without its source.

## Existing validity rules to preserve

For each member:

- world boundary margin;
- actual terrain height;
- actual terrain normal;
- `SLOPE_REJECT_NY`;
- path tread/footprint clearance;
- terrain sink;
- tilt strength;
- `clearRadius` behavior;
- biome palette/granite logic;
- variant/geometry identity.

## Bounded overlap correction

For candidate and each already accepted member:

```text
minimumDistance = 0.78 * (candidateFootprint + existingFootprint) + 0.12
```

If too close:

1. move the candidate once directly away from the closest conflicting member by `missingDistance + 0.05 m`;
2. resample height, normal, and path validity once;
3. recheck all accepted members once;
4. if still invalid/overlapping, drop it.

No second correction pass.

---

# Split anchor handling

For anchor `block` or `boulder` that meets the existing split criteria:

- keep the current `SPLIT_CHANCE`;
- keep the same-variant relationship;
- keep the cross-strike break direction and narrow gap;
- represent the split half as the first secondary slot;
- if the split half is invalid, use the precomputed normal secondary fallback for that slot;
- never increase `budget` because of a split.

A true singleton may keep existing split behavior because that cost already exists in the baseline.

---

# Root-cell ownership

A final resolved member belongs to:

```text
ownerCellX = floor(instance.x / config.stoneCellSize)
ownerCellZ = floor(instance.z / config.stoneCellSize)
```

`StoneField.generateCell(cellX, cellZ)`:

```text
1. compute macro cell containing the 16 m cell center
2. enumerate fixed 3x3 macro cells
3. call getResolvedCluster for each
4. append only instances whose owner cell == requested cell
5. if no cluster member belongs to the cell, evaluate singleton eligibility
6. run addVergeStones
```

Because the full cluster is resolved/cached before filtering, neighboring 16 m cells see the exact same family and overlap decisions.

The current `CHUNK_SOURCE_CELL_MARGIN` may remain for split/verge behavior. Macro members themselves are owned by their final root cell.

---

# Caches

Use two transparent bounded caches:

## Descriptor cache in `StoneClusterField`

```text
limit = 512
trimTo = 320
```

## Resolved-cluster cache in `StoneField`

```text
limit = 320
trimTo = 192
```

These are performance constants in `StoneClusterTuning.ts`.

Eviction must change only recomputation frequency, never output.

---

# Exact singleton fallback

Delete:

```text
FIELD_STONE_CHANCE = 0.52
```

A cell may attempt one singleton only when:

- no resolved macro member root belongs to the cell;
- the cell center lies outside every active cluster's `halo` ellipse;
- the point is not being created through the dedicated verge process.

Probability:

```text
singletonProbability =
  config.stoneSingletonChance
  * lerp(0.35, 1.0, geologyPotentialAtCellCenter)
```

With `stoneSingletonChance = 0.10`, the attempt rate is only 3.5-10%.

Archetype weights:

```text
pebble  0.75
boulder 0.20
slab    0.05
```

Then apply existing world, slope, path, sinking, tilt, palette, moss, and clearance rules.

The rare landmark-boulder rule may apply to the singleton boulder branch.

---

# Path verge

Keep `addVergeStones` as the only verge generator.

Preserve its existing behavior:

- path visibility check;
- path-distance band;
- tangent derivation;
- movement to the verge;
- footprint-aware tread clearance;
- alignment along the way;
- geological weighting;
- local overlap rejection.

Remove the recursive near-path satellite branch from ordinary placement.

Macro geology must not align to a path. Geological clusters and kicked-aside verge stones represent different causes.

---

# Grass/ground response

Do not add a cluster-wide clearance halo now.

Reason:

- large existing stones already clear grass by footprint;
- clustering those real clearances creates connected gaps naturally;
- tiny debris correctly has `clearRadius = 0` and should nestle into grass;
- a synthetic halo could clear visible grass where no visible stone exists.

Only add a broader ground response in a later visual pass if close-up QA proves it is still needed.

---

# LOD

Do not modify the renderer or add a new stone LOD.

Keep:

- detailed chunks: detailed geometry + small members;
- non-detailed chunks: coarse geometry + existing small-scale cutoff;
- current batch merging.

Because debris is intentionally smallest, it disappears first automatically.

---

# Implementation order

## Step 0 — Capture baseline first

Before changing placement, extend verification to record the current distribution in:

```text
qa/baselines/stones/stone-distribution-v1.json
```

Record fixed representative windows with:

- root count;
- roots by archetype;
- roots by scale band;
- maximum roots in one 16 m cell;
- detailed triangles;
- coarse triangles;
- desktop visible roots;
- draw calls.

This file is the hard comparison target for the new distribution.

## Step 1 — Configuration

Modify and validate:

- `world.yaml`;
- `WorldConfig.ts`;
- `WorldConfigSchema.ts`;
- `WorldConfigValidator.ts`.

## Step 2 — `StoneClusterField`

Implement descriptor generation and descriptor determinism tests before integrating placement.

## Step 3 — `StoneClusterComposition`

Implement member specs, family correlation, scale hierarchy, orientation, split/fallback, and pure composition verification.

## Step 4 — Full-cluster resolver in `StoneField`

Resolve/caches complete clusters, then filter final roots by 16 m cell ownership.

## Step 5 — Singleton replacement

Remove `FIELD_STONE_CHANCE` and implement the exact 10% maximum singleton model.

## Step 6 — Remove duplicate legacy clustering

Remove:

- generic parent satellite generation;
- recursive near-path satellite generation.

Keep:

- split masses through cluster composition;
- true singleton split if retained;
- dedicated verge generation.

## Step 7 — Verification/baseline gate

Wire `StoneClusterVerification.ts` into `scripts/verify-stones.mjs` and compare against the captured baseline.

## Step 8 — Visual QA and YAML-only tuning

After algorithmic verification passes, tune only YAML visual values. Do not change formulas to chase one screenshot.

---

# Exact verification gates

## Determinism

For at least 256 fixed macro cells:

- descriptor fingerprint identical on repeat;
- final resolved-cluster fingerprint identical on repeat;
- both identical after cache eviction/rebuild;
- center/activation/DNA unchanged if unrelated fork evaluation order changes.

## Cell/chunk continuity

For clusters crossing boundaries:

- same roots regardless of which 16 m cell is generated first;
- same roots regardless of terrain chunk load order;
- no duplicate root;
- no missing root because macro center is in another cell/chunk.

## Anchor integrity

For every accepted cluster:

- exactly one anchor;
- if anchor resolution fails, final cluster count is zero;
- no secondary/debris-only cluster is allowed.

## Quiet cells

Across at least 2,048 eligible non-verge cells outside active halos:

```text
observed singleton attempt rate <= config.stoneSingletonChance + 0.025
```

For shipped config:

```text
<= 12.5%
```

## Budget/hierarchy

Across at least 128 active descriptors:

- spec count is within configured 4-8 shipped range;
- one anchor;
- 1-2 secondaries;
- median secondary scale < median anchor scale;
- median debris scale < median secondary scale;
- outer-half debris median scale < inner-half debris median scale.

## Direction

Ridge:

- mean absolute cross-strike coordinate < mean absolute along-strike coordinate.

Scree:

- mean debris downhill `u > 0`;
- debris mean downhill projection > secondary mean downhill projection;
- debris lateral spread increases with downhill distance.

Fan:

- outer-half debris lateral spread > inner-half debris lateral spread.

## Family correlation

Every secondary/debris archetype must come from its anchor's declared relationship table.

## Path

- no normal cluster member violates current footprint-aware path clearance;
- verge generation remains present;
- recursive ordinary-placement verge satellite path no longer exists.

## Performance

Against `stone-distribution-v1.json`:

```text
representative root count <= baseline
representative detailed triangles <= baseline
representative coarse triangles <= baseline
active draw calls <= baseline
```

Also verify structurally:

```text
macro neighbor queries per stone cell = 9
max cluster members = configured maximum
max overlap correction passes/member = 1
descriptor cache bounded
resolved cluster cache bounded
no new per-frame cluster path
```

---

# Visual QA matrix

Check at minimum:

1. clean meadow without visible 16 m stone rhythm;
2. compact meadow family;
3. clean-to-rocky transition;
4. dry slope scree flowing downhill;
5. ridge slabs/outcrops sharing strike;
6. widening lower-slope fan;
7. alpine exposed rock;
8. wet lowland with fewer/more correlated mossy stones;
9. path verge without decorative kerb regularity;
10. close grounding in grass;
11. detailed/coarse handoff;
12. small debris disappearing first;
13. cluster crossing a stone-cell boundary;
14. cluster crossing a terrain-chunk boundary.

Desired rhythm:

```text
clean ground
    -> occasional singleton
    -> coherent family
    -> strong formation
    -> clean ground
```

---

# Acceptance criteria

The work is complete only when:

1. `FIELD_STONE_CHANCE = 0.52` is gone.
2. Quiet non-cluster cells use the configured 10% maximum singleton attempt model.
3. Macro clusters use the deterministic 56 m jittered lattice.
4. Activation uses both geological potential and shared ecology rockiness.
5. Processes are terrain-derived: compact, ridge, scree, fan.
6. Every cluster has a bounded 4-8 shipped budget.
7. An invalid anchor invalidates the entire cluster.
8. Secondary/debris families depend on the anchor.
9. Scale statistically decreases away from the source.
10. Ridge compositions follow strike.
11. Scree/fan compositions flow downhill.
12. Bedrock yaw is more coherent than debris yaw.
13. Value/moss are cluster-correlated.
14. Split masses consume cluster budget.
15. Generic parent satellites are removed.
16. Recursive near-path satellites are removed.
17. `addVergeStones` is the only verge generator.
18. Existing world/path/slope/sink/tilt/clearance/geometry rules remain valid.
19. No renderer change or new LOD is introduced.
20. No new draw calls are introduced.
21. No new per-frame procedural work is introduced.
22. Representative roots and triangles do not exceed the captured baseline.
23. Determinism survives cache eviction and load-order changes.
24. Existing local config/stone/build verification passes before manual deployment.

## Final target

The player should stop seeing:

```text
nice procedural stones scattered across grass
```

and start seeing:

```text
bedrock exposure, fracture, scree, and accumulated debris that belong to the terrain
```

The correct result uses the same or fewer stones, but makes their placement explain itself.