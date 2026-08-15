# Stone Cluster Distribution and Look-and-Feel Implementation Plan

## Status

- Target branch: `main`
- Scope: stone distribution, geological coherence, cluster composition, grounding, and low-cost visual hierarchy
- Renderer scope: unchanged
- Runtime dependency scope: unchanged
- Performance target: same or lower draw calls, same or lower representative triangle count, no new per-frame procedural work
- Implementation style: deterministic, cached, bounded, KISS, no physics simulation, no iterative world searches

## Objective

Make the procedural stones read as consequences of terrain geology and erosion rather than as individually good-looking rocks scattered by cells.

The current stone assets and renderer are already strong. The main problem is spatial hierarchy. The implementation should therefore redistribute the existing stone budget into coherent geological groups and larger genuinely empty areas rather than add geometry.

The target visual hierarchy is:

```text
geological region
    -> geological cluster
        -> anchor
        -> secondary stones
        -> debris
```

not:

```text
16 m cell
    -> unrelated random rocks
```

## Key decisions after re-evaluating the current code

The earlier version of this plan was directionally correct but left too many implementation choices open. This revision makes the following decisions explicit.

1. Keep `WorldStoneSystem`, `StoneRenderBatchBuilder`, render packing, materials, detail/coarse geometry, streaming radii, and deadline-sliced building unchanged.
2. Do not add another stone LOD. The current detailed/coarse split and the existing small-stone cutoff are enough for this change.
3. Do not add more stone mesh archetypes. The existing pebble, boulder, slab, block, shard, and outcrop families are sufficient.
4. Do not add eight arbitrary art templates. Use four terrain-derived geological processes instead: `compact`, `ridge`, `scree`, and `fan`.
5. Replace ordinary independent per-cell placement with deterministic macro-cluster ownership plus a low-rate singleton fallback.
6. Keep path-verge stones as a separate human-disturbance process.
7. Remove the second recursive verge-spawn path from ordinary stone placement. `addVergeStones` must be the only verge generator.
8. Remove generic parent satellites after the macro-cluster generator is active. The macro cluster itself owns anchor, secondary, and debris relationships.
9. Keep split masses, but make a split consume cluster budget rather than silently adding unlimited extra stones.
10. Use `WorldEcologyField` as the authoritative surface-exposure signal. The current low-frequency stone noise remains useful, but only as geological potential.
11. Do not introduce cluster-level grass decals or a second clearance system in this iteration. Concentrating the existing real stone clearances should create the grounding response naturally. Only add a broader cluster ground response later if visual QA proves it is still necessary.
12. Preserve determinism across cell, chunk, load order, and cache eviction.

## Why the current distribution still looks procedural

`StoneField` currently has two competing ideas:

- a good low-frequency rockiness field that gathers rocks into broad regions;
- a high quiet-cell fallback, `FIELD_STONE_CHANCE = 0.52`, that repopulates many cells that the regional density left empty.

That fallback weakens the large-scale contrast created by the first rule. A 16 m lattice where more than half of otherwise-empty cells can attempt a pebble produces a persistent background of disconnected rocks.

The current system also has two separate path-edge mechanisms:

- the dedicated `addVergeStones` pass;
- a recursive extra satellite branch inside ordinary candidate placement when a stone is near a path.

The dedicated pass is better because it explicitly aligns stones to the path and reasons about the tread footprint. Keep that one and remove the recursive duplicate.

Finally, large stones currently create local satellites. That was useful before a true macro-cluster field existed, but keeping it after adding macro clusters would create clusters inside clusters and make the stone budget difficult to control.

## Hard performance contract

Implementation must satisfy all of these:

- No new work in `WorldStoneSystem.update` except work already caused by chunk reconciliation/building.
- No new draw calls.
- No new textures.
- No new material instances.
- No physics or relaxation simulation.
- No Poisson-disc generation.
- No rejection loop with an unbounded attempt count.
- No per-frame cluster sampling.
- Cluster descriptors and members are deterministic and cacheable.
- Representative visible stone count must not exceed the pre-change baseline.
- Representative triangle count must not exceed the pre-change baseline.
- Existing build-deadline slicing remains authoritative.

The visual improvement must come from correlation and redistribution, not increased geometry.

---

# Architecture

## New file: `src/world/stones/StoneClusterField.ts`

Responsibility:

- own the 56 m macro-cluster lattice;
- derive deterministic cluster centers;
- sample geological potential and the shared terrain ecology at cluster centers;
- decide whether a macro cluster exists;
- classify its geological process;
- derive cluster radius, aspect, direction, and shared DNA;
- cache cluster descriptors with a bounded deterministic-transparent cache;
- expose clusters near a 16 m stone cell.

This class is generation-time only. It is not a runtime render system.

## New file: `src/world/stones/StoneClusterComposition.ts`

Responsibility:

- convert one active cluster descriptor into a bounded list of member specifications;
- assign `anchor`, `secondary`, and `debris` roles;
- choose related archetypes;
- generate local offsets from the geological process;
- generate correlated scale, orientation, palette/value, and moss variation;
- resolve split-anchor composition without exceeding the cluster budget.

It must not sample the renderer or scene.

## New file: `src/world/stones/StoneClusterTuning.ts`

Keep only non-production mathematical constants and static relationship tables here:

- hash domain values;
- role enum/order;
- family-weight tables;
- angular helper constants;
- bounded cache sizes;
- fixed process classification rules that deliberately reuse ecology thresholds.

Production visual knobs belong in YAML, not in this file.

## Modify: `src/world/stones/StoneField.ts`

`StoneField` remains the orchestrator.

Change it to:

1. construct one `StoneClusterField`;
2. ask it for macro clusters that can contribute roots to the requested 16 m cell;
3. resolve cluster members through `StoneClusterComposition`;
4. filter members by root-cell ownership;
5. add the low-rate singleton fallback only when the cell is outside every cluster halo;
6. run the dedicated path-verge pass;
7. preserve world/path/slope/clearance validation;
8. preserve the existing stone variant cache and geometry generation.

Do not add the new macro algorithms directly to the already-large `StoneField.ts`.

## Modify configuration files

- `public/config/world.yaml`
- `src/world/WorldConfig.ts`
- `src/world/WorldConfigSchema.ts`
- `src/world/WorldConfigValidator.ts`

## New verification file

`src/world/stones/StoneClusterVerification.ts`

Wire it into `scripts/verify-stones.mjs`.

No GitHub Actions are required or desired. The repository continues to use local/manual verification and manual GitHub Pages deployment.

---

# Exact configuration

Add these production tuning values to `public/config/world.yaml`:

```yaml
# Macro geological stone clustering. The spacing intentionally does not divide
# the 16 m stone cell or 64 m terrain chunk, which avoids visible lattice lock.
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

Keep the existing:

```yaml
stoneDensity: 0.17
stoneClusterChance: 0.82
```

but change their exact meaning as follows:

- `stoneDensity` controls how frequently eligible macro-cluster cells activate. It no longer controls independent ordinary-rock count per 16 m cell.
- `stoneClusterChance` remains a cluster probability multiplier. It no longer controls local satellite spawning around individual large stones.

This produces a useful property: lowering density removes whole clusters instead of thinning every cluster into weak random scatter.

## Schema ranges

Add exact schema constraints:

```text
stoneClusterSpacing          40 .. 96
stoneClusterCenterJitter     0 .. 0.35
stoneClusterRadiusMin        4 .. 30
stoneClusterRadiusMax        8 .. 40
stoneClusterAspectMin        0.45 .. 0.9
stoneClusterAspectMax        0.6 .. 1
stoneClusterBudgetMin        integer 2 .. 8
stoneClusterBudgetMax        integer 3 .. 12
stoneClusterCoreRatio        0.2 .. 0.6
stoneClusterShoulderRatio    0.5 .. 0.9
stoneClusterHaloRatio        0.9 .. 1.25
stoneClusterDensityResponse  1 .. 12
stoneSingletonChance         0 .. 0.25
```

## Cross-field validation

Add these checks to `validateWorldConfig`:

```text
stoneClusterRadiusMin < stoneClusterRadiusMax
stoneClusterAspectMin <= stoneClusterAspectMax
stoneClusterBudgetMin <= stoneClusterBudgetMax
stoneClusterCoreRatio < stoneClusterShoulderRatio
stoneClusterShoulderRatio < stoneClusterHaloRatio
stoneClusterRadiusMax * stoneClusterHaloRatio <= stoneClusterSpacing * 0.5
stoneClusterCenterJitter <= 0.35
```

The radius/halo/spacing constraint is important. It guarantees that a 3x3 macro-cell neighborhood is sufficient when a stone cell asks which clusters can influence it.

---

# Exact deterministic cluster algorithm

## 1. Macro lattice

Use a square macro lattice with spacing:

```text
S = config.stoneClusterSpacing = 56 m
```

For macro cell `(gx, gz)`, derive the root seed with the existing stone hash utilities:

```text
seed = hashStoneCell(gx, gz, config.seed XOR STONE_CLUSTER_DOMAIN)
rng = StoneRandom.fromSeed(seed)
```

Use a unique fixed `STONE_CLUSTER_DOMAIN` constant in `StoneClusterTuning.ts`.

There is at most one potential macro cluster per 56 m macro cell.

## 2. Jittered center

The virtual center is:

```text
j = config.stoneClusterCenterJitter
centerX = (gx + 0.5 + rng.fork("center-x").signed(j)) * S
centerZ = (gz + 0.5 + rng.fork("center-z").signed(j)) * S
```

With the shipped value `j = 0.26`, the maximum center displacement is 14.56 m per axis.

Do not derive center jitter from random-consumption order. Use labeled forks so adding another DNA field later cannot move existing clusters.

## 3. Geological potential

Move the current two-octave low-frequency stone field out of `StoneField` into `StoneClusterField` and rename its meaning to `sampleGeologyPotential`.

Keep the existing shape exactly for the first implementation:

```text
coarse = valueNoise(x / 240, z / 240, rockSeed)
fine   = valueNoise((x * 2.7) / 240, (z * 2.7) / 240, rockSeed XOR 0x9e3779b9)
field  = (coarse + 0.4 * fine) / 1.4
geologyPotential = smoothstep(field, 0.52, 0.78)
```

This field answers:

```text
is there likely to be rock in the underlying formation here?
```

It must not independently answer surface exposure anymore.

## 4. Shared ecology at the cluster center

At the cluster center sample once:

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
                  scratch,
                )
```

Do not build a second moisture/slope/rock model in the stone system.

`WorldEcologyField.rockiness` already combines landform slope, convexity, alpine exposure, moisture, and soil burial. Reuse it.

## 5. Cluster suitability

Use limiting factors rather than a weighted sum.

```text
surfaceVisibility = 0.18 + 0.82 * ecology.rockiness
pathSurvival      = 1 - 0.90 * ecology.disturbance
suitability       = clamp01(
                      geologyPotential
                      * surfaceVisibility
                      * pathSurvival
                    )
```

Why retain the `0.18` floor on surface visibility:

- rock can remain partly buried in meadow soil;
- meadow clusters should become rare, not impossible;
- fully multiplying by `ecology.rockiness` would remove too much field stone from lowland areas.

Path disturbance is strongly suppressive because the dedicated verge process owns path-edge stones.

## 6. Activation probability

Convert the existing `stoneDensity` to a bounded cluster-frequency response:

```text
densityResponse = 1 - exp(-config.stoneClusterDensityResponse * config.stoneDensity)
```

Then:

```text
suitabilityResponse = smoothstep(suitability, 0.14, 0.72)
activationProbability =
    config.stoneClusterChance
    * densityResponse
    * suitabilityResponse
```

The macro cluster exists only when:

```text
rng.fork("activation").chance(activationProbability)
```

This is the only macro-cluster activation roll.

Do not perform fallback attempts in adjacent positions.

## 7. Geological process classification

Classify the active cluster from landform-scale values, not metre-scale surface noise.

Use these rules in order:

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

`ECOLOGY_ROCK_SLOPE_START` is already the shared ecological threshold where loose material begins to stop resting comfortably on the surface. Reuse it rather than inventing another slope threshold.

The fixed `0.25` convexity and `0.08` fan minimum slope belong in `StoneClusterTuning.ts` as named algorithm constants because they define process classification rather than production density.

## 8. Cluster direction

Compute both directions once per cluster:

```text
strike = sampleStrike(centerX, centerZ)
```

For downhill direction, sample the existing terrain normal at the cluster center:

```text
normal = field.sampleNormal(centerX, centerZ, scratch)
downhillAngle = atan2(normal.z, normal.x)
```

Use:

```text
compact -> strike + rng.fork("direction").signed(0.35)
ridge   -> strike
scree   -> downhillAngle
fan     -> downhillAngle
```

Do not calculate a second height-gradient field.

## 9. Cluster radius

Resolve a suitability-scaled radius:

```text
radiusT = smoothstep(suitability, 0.20, 0.85)
baseRadius = lerp(
  config.stoneClusterRadiusMin,
  config.stoneClusterRadiusMax,
  radiusT
)
majorRadius = baseRadius * rng.fork("radius").range(0.90, 1.10)
```

Clamp the result to the configured min/max after variation.

## 10. Cluster aspect

Start with:

```text
aspect = rng.fork("aspect").range(
  config.stoneClusterAspectMin,
  config.stoneClusterAspectMax
)
```

Bias by process:

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

## 11. Cluster stone budget

The cluster budget depends on suitability, not on random repeated attempts:

```text
budgetT = smoothstep(suitability, 0.25, 0.80)
budget = round(lerp(
  config.stoneClusterBudgetMin,
  config.stoneClusterBudgetMax,
  budgetT
))
```

Clamp to the configured integer range.

`budget` is the maximum number of members the cluster composition creates before terrain/path rejection.

There are no retries to refill rejected members.

This keeps cost strictly bounded.

---

# Cluster member roles

For `budget >= 4`:

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

The anchor always has member index `0`.

Role generation uses independent labeled random forks:

```text
member:0
member:1
...
```

---

# Exact local composition algorithms

Define:

```text
core     = config.stoneClusterCoreRatio      # 0.42
shoulder = config.stoneClusterShoulderRatio  # 0.78
halo     = config.stoneClusterHaloRatio      # 1.12
```

Local coordinates are `(u, v)` where:

- `u` is normalized distance along the cluster direction;
- `v` is normalized distance across it.

World conversion is always:

```text
dirX = cos(direction)
dirZ = sin(direction)
perpX = -dirZ
perpZ = dirX

worldX = centerX + dirX * (u * majorRadius) + perpX * (v * minorRadius)
worldZ = centerZ + dirZ * (u * majorRadius) + perpZ * (v * minorRadius)
```

## Anchor

For `compact` and `ridge`:

```text
u = signed(0.06)
v = signed(0.06)
```

For `scree` and `fan`, place the source slightly uphill of the visual mass:

```text
u = -0.16 + signed(0.04)
v = signed(0.05)
```

## Secondary radial coordinate

For each secondary:

```text
r = lerp(core * 0.55, shoulder * 0.92, random.next())
```

## Debris radial coordinate

For each debris member:

```text
t = sqrt(random.next())
r = lerp(core, halo, t)
```

`sqrt` intentionally gives the shoulder/halo more area without needing rejection sampling.

## Compact process

For secondary and debris:

```text
angle = random.range(0, 2*pi)
u = cos(angle) * r
v = sin(angle) * r
```

This gives a broad irregular oval after the aspect transform.

## Ridge process

For each member:

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

This keeps the main mass aligned to geological strike while allowing small fragments to spread away from it.

## Scree process

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

The cone widens downhill.

## Fan process

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

The fan is wider than scree because it represents material accumulating where the slope relaxes.

## Small positional breakup

After process coordinates are resolved, add one bounded local perturbation:

```text
u += random.fork("jitter-u").signed(0.035)
v += random.fork("jitter-v").signed(0.035)
```

Do not add another world-space noise lookup for individual members.

---

# Archetype relationships

## Anchor selection

Reuse the existing biome/slope archetype tables as the starting point, but anchors may not be `pebble`.

Set pebble weight to zero and renormalize.

Then apply process modifiers before normalization:

```text
compact:
  use level biome weights unchanged except pebble = 0

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

No new archetype is required.

## Secondary family weights

Use this exact relationship table:

| Anchor | Secondary family weights |
|---|---|
| boulder | boulder 0.55, slab 0.20, block 0.15, shard 0.10 |
| slab | slab 0.50, block 0.20, boulder 0.20, shard 0.10 |
| block | block 0.50, shard 0.20, boulder 0.20, slab 0.10 |
| outcrop | block 0.35, shard 0.30, slab 0.20, boulder 0.15 |
| shard | shard 0.50, block 0.25, boulder 0.15, slab 0.10 |

## Debris family weights

Use this exact relationship table:

| Anchor | Debris family weights |
|---|---|
| boulder | pebble 0.70, boulder 0.30 |
| slab | pebble 0.55, slab 0.25, shard 0.20 |
| block | pebble 0.45, block 0.30, shard 0.25 |
| outcrop | pebble 0.35, shard 0.35, block 0.30 |
| shard | pebble 0.45, shard 0.55 |

Do not choose secondary/debris archetypes independently from the anchor.

---

# Exact scale hierarchy

## Anchor

Take the existing archetype scale band `[minScale, maxScale]` and sample only its upper useful range:

```text
anchorScale = lerp(
  minScale,
  maxScale,
  random.range(0.62, 0.92)
)
```

Preserve the current rare landmark-boulder multiplier, but apply it only to:

- an anchor boulder in a highly suitable cluster; or
- a true singleton boulder.

Do not apply it to secondaries or debris.

## Secondary

Let:

```text
normalizedRadius = min(1, abs(r) / halo)
radialScale = lerp(0.72, 0.48, normalizedRadius)
secondaryScale = anchorScale * radialScale * random.range(0.90, 1.08)
```

Clamp to the selected secondary archetype's existing scale band.

## Debris

```text
normalizedRadius = min(1, abs(r) / halo)
radialScale = lerp(0.38, 0.18, normalizedRadius)
debrisScale = anchorScale * radialScale * random.range(0.85, 1.15)
```

Clamp lower bound to `0.22` and upper bound to the selected archetype's existing maximum.

This guarantees a visible statistical size gradient without sorting or iterative optimization.

---

# Exact orientation model

Nearby bedrock should share geology; loose material should show erosion.

Define an axis-angle helper where yaw has period `pi`, not `2*pi`.

For each member:

## Outcrop

```text
yaw = strike + signed(0.18 + roleExtra)
```

## Slab

```text
yaw = strike + signed(0.22 + roleExtra)
```

## Block

```text
yaw = strike + signed(0.28 + roleExtra)
```

## Boulder

Blend 35% from strike toward the cluster process direction using shortest axis-angle distance:

```text
yaw = axisLerp(strike, direction, 0.35) + signed(0.42 + roleExtra)
```

## Shard

```text
yaw = direction + signed(0.38 + roleExtra)
```

## Pebble

```text
yaw = random.range(0, pi)
```

Role extras:

```text
anchor    0.00
secondary 0.10
debris    0.28
```

This creates strong shared bedding in bedrock and visibly looser debris without any extra terrain queries.

---

# Cluster DNA and material correlation

The cluster owns correlated appearance values.

Resolve once:

```text
clusterValueBase = rng.fork("value").range(0.96, 1.03)
clusterMossBias  = rng.fork("moss").range(0.88, 1.12)
```

Use the biome at the anchor/cluster center to choose the cluster base palette.

The existing meadow `mossy` palette chance becomes a cluster-level choice rather than a per-stone choice.

For each member:

```text
valueScale = clamp(
  clusterValueBase + memberRandom.fork("value").signed(0.018),
  0.92,
  1.06
)
```

Refactor moss calculation so the large old independent per-stone random range is removed.

Use:

```text
mossBase = existing biome/altitude/exposure calculation without random factor
moss = clamp01(
  mossBase
  * clusterMossBias
  * memberRandom.fork("moss").range(0.94, 1.06)
)
```

Keep `graniteBlend` per member because altitude can legitimately change across a large formation.

This produces family resemblance without making stones identical.

---

# Terrain/path validation and bounded overlap handling

Cluster composition is generated sequentially in member-index order.

For every member:

1. Resolve archetype, scale, and variant.
2. Convert local coordinates to world coordinates.
3. Reject outside the world margin using the current rule.
4. Sample actual terrain height and normal.
5. Preserve current `SLOPE_REJECT_NY` rejection.
6. Preserve current path tread/footprint rejection.
7. Preserve current terrain sinking and tilt-strength rules.
8. Check overlap against already accepted members of the same cluster.

## Bounded overlap correction

Do not use iterative relaxation.

For a candidate and an accepted member:

```text
minimumDistance = 0.78 * (candidateFootprint + existingFootprint) + 0.12
```

If the candidate is closer:

- move it once directly away from the existing member by the missing distance plus `0.05 m`;
- resample height/normal/path validity once;
- if it still overlaps any accepted member or becomes invalid, drop it.

Maximum correction passes per member: **one**.

There is no retry with another random position.

The cluster therefore has strict bounded generation cost.

---

# Split masses

Preserve split boulder/block compositions, but integrate them with cluster budget.

For an anchor that meets the existing split rules:

- the split roll remains the existing `SPLIT_CHANCE`;
- the split half uses the same variant and palette;
- the split half replaces the first secondary member;
- it does not increase `budget`;
- keep the existing cross-strike break direction and narrow gap logic;
- if the split half is invalid, generate the normal first secondary instead.

A rare standalone singleton may keep the old split behavior because that behavior already exists in the performance baseline.

---

# Removing the old local-cluster behavior

After the macro cluster implementation is verified, delete the old generic satellite block from `StoneField.placeCandidate`:

```text
large parent
    -> chance(stoneClusterChance)
        -> 2..4 satellites
```

That behavior is replaced by the macro cluster's explicit secondary/debris budget.

Also remove the recursive near-path satellite branch from ordinary candidate placement:

```text
margin < 3
    -> placeCandidate(... isSatellite = true)
```

Keep only `addVergeStones` for path-edge composition.

This prevents two independent systems from decorating the same verge.

---

# Root-cell ownership and chunk-boundary continuity

Cluster members are owned by their final root position, not by the macro cell that generated them.

For each resolved member:

```text
ownerCellX = floor(member.x / config.stoneCellSize)
ownerCellZ = floor(member.z / config.stoneCellSize)
```

`StoneField.generateCell(cellX, cellZ)` does this:

```text
1. Find the macro lattice coordinate containing the 16 m cell center.
2. Enumerate the 3x3 macro cells around it.
3. For each active cached cluster, iterate its bounded member list.
4. Keep only members whose owner cell equals (cellX, cellZ).
5. Add singleton fallback only if allowed.
6. Add dedicated verge stones.
```

Because `stoneClusterRadiusMax * stoneClusterHaloRatio <= stoneClusterSpacing * 0.5`, a 3x3 macro neighborhood is sufficient.

No global cluster registry is required.

No cluster can disappear because a neighboring terrain chunk was loaded in a different order.

The current one-cell `CHUNK_SOURCE_CELL_MARGIN` may remain because split/verge placements can still cross their source cell. Macro members themselves do not depend on that margin because they are filtered by final root-cell ownership.

---

# Cluster cache

`StoneClusterField` should cache descriptors and final member specifications by macro-cell key.

Use numeric or compact string keys; either is acceptable because the cache is small and generation-only.

Use bounded insertion-order eviction matching the existing deterministic-cache approach:

```text
limit = 512
trimTo = 320
```

These are performance constants in `StoneClusterTuning.ts`, not YAML art controls.

Cache eviction must never alter results. A regenerated macro cell must produce the exact same descriptor and member list.

---

# Exact singleton fallback

Remove `FIELD_STONE_CHANCE = 0.52`.

A 16 m stone cell may attempt one singleton only when:

- no macro-cluster member root belongs to the cell;
- the cell center lies outside every active cluster halo;
- the dedicated verge pass is not being used as a substitute for this decision.

Use the cell-center geological potential:

```text
singletonProbability =
  config.stoneSingletonChance
  * lerp(0.35, 1.0, geologyPotential)
```

With the shipped `stoneSingletonChance = 0.10`, quiet terrain therefore gets at most a 3.5-10% singleton attempt rate rather than 52%.

Archetype weights:

```text
pebble  0.75
boulder 0.20
slab    0.05
```

Normal path, slope, world-boundary, sinking, and clearance rules still apply.

The existing rare landmark-boulder rule may apply to the 20% singleton boulder path.

This preserves punctuation between clusters without recreating uniform scatter.

---

# Path verge behavior

Keep `addVergeStones` conceptually unchanged because it already does the correct work:

- checks whether a way is nearby;
- samples path distance;
- derives the tangent;
- walks candidates to the verge band;
- aligns stones along the way;
- rejects tread overlap;
- weights frequency by geological context.

Only two changes are required:

1. use cluster/geological potential terminology consistently;
2. remove the second recursive verge-spawn mechanism from ordinary placement.

Do not make macro clusters align to the path. Geological formations and moved verge stones represent different causes and should stay separate.

---

# Grass and ground response

Do not add a new cluster-wide grass-clearance field in the first implementation.

Reason:

- the existing `StoneInstance.clearRadius` already clears grass around meaningful footprints;
- concentrating real stones into clusters automatically creates connected local gaps;
- tiny debris already has `clearRadius = 0` and should nestle in grass;
- a synthetic cluster halo would risk clearing grass where no visible rock actually exists.

After implementation, inspect close-range cluster grounding. Only if clusters still appear pasted onto grass should a second phase add a weak union-of-footprints ground response. It is not part of the first implementation.

---

# LOD behavior

Do not add another stone LOD state.

Keep the existing behavior:

- detailed chunks use detailed geometry and include small stones;
- non-detailed chunks use coarse geometry and drop members below the existing small-scale cutoff;
- render batches remain merged exactly as today.

The new scale hierarchy naturally makes debris disappear first because debris is the smallest role.

That achieves the desired visual LOD without changing `WorldStoneSystem` or adding transition state.

---

# Implementation sequence

## Step 0 — Capture the current baseline before changing placement

Before modifying distribution, add a deterministic baseline capture to the existing stone verification tooling.

Record for fixed representative windows:

- total roots;
- roots by archetype;
- roots by scale band;
- total render triangles for detailed and coarse modes;
- visible stone count at desktop radius;
- draw calls;
- maximum roots in one 16 m cell.

Commit the baseline as:

```text
qa/baselines/stones/stone-distribution-v1.json
```

Do this first so later performance claims compare against real existing output rather than memory.

## Step 1 — Configuration contract

Modify:

- `public/config/world.yaml`
- `WorldConfig.ts`
- `WorldConfigSchema.ts`
- `WorldConfigValidator.ts`

Run configuration verification before touching placement.

## Step 2 — Add `StoneClusterField`

Implement:

- macro lattice;
- center jitter;
- geology potential;
- ecology sampling;
- activation;
- process classification;
- dimensions;
- DNA;
- bounded cache.

Add deterministic unit-style verification for descriptors before connecting them to `StoneField`.

## Step 3 — Add `StoneClusterComposition`

Implement:

- role budget;
- exact local process formulas;
- family-aware archetype selection;
- scale hierarchy;
- orientation hierarchy;
- correlated value/moss;
- split consuming secondary budget;
- bounded single-pass overlap correction.

Verify composition entirely without rendering.

## Step 4 — Integrate into `StoneField`

Replace independent ordinary count generation with root-cell filtering of nearby macro-cluster members.

Keep existing geometry/variant lookup and terrain/path validation.

## Step 5 — Replace the quiet singleton fallback

Delete `FIELD_STONE_CHANCE` and implement `stoneSingletonChance` exactly as specified.

## Step 6 — Remove duplicate local clustering

Delete:

- generic 2-4 satellite spawning around large ordinary stones;
- recursive near-path satellite spawning.

Keep:

- split mass behavior through the composition layer;
- dedicated verge generation.

## Step 7 — Add cluster verification and baseline comparison

Wire `StoneClusterVerification.ts` into `scripts/verify-stones.mjs`.

## Step 8 — Visual QA

Use the existing stone-world/gallery tools and world QA views. Tune only YAML values after the algorithmic checks pass.

---

# Exact verification requirements

## Determinism

For at least 256 fixed macro cells:

- descriptor fingerprint must be identical across repeated generation;
- result must be identical after cache eviction/rebuild;
- labeled random forks must keep center, activation, and DNA stable when unrelated composition fields are evaluated in a different order.

## Chunk/cell continuity

For clusters crossing a 16 m cell boundary:

- collecting either owner cell first must return the same roots;
- collecting a terrain chunk before or after its neighbor must return the same roots;
- no member may appear twice;
- no member may disappear because the macro center belongs to another stone cell.

## Quiet terrain

Across at least 2,048 eligible non-verge cells outside active cluster halos:

```text
observed singleton attempt rate <= stoneSingletonChance + 0.025
```

With the shipped configuration this means at most 12.5% in the statistical verification window.

The majority of those cells should remain empty after validation.

## Cluster hierarchy

Across at least 128 accepted clusters:

- exactly one anchor specification before terrain rejection;
- configured member specification count stays within `stoneClusterBudgetMin..Max`;
- median secondary scale < median anchor scale;
- median debris scale < median secondary scale;
- debris outer-half median scale < debris inner-half median scale.

## Geological direction

For `ridge` clusters:

- mean absolute cross-strike normalized coordinate must be lower than mean along-strike coordinate.

For `scree` clusters:

- mean debris `u` must be positive;
- debris mean downhill projection must exceed secondary mean downhill projection;
- debris lateral spread must increase with downhill distance.

For `fan` clusters:

- outer-half debris lateral spread must exceed inner-half debris lateral spread.

## Family correlation

For every anchor archetype, verify that generated secondary/debris archetypes come only from its defined relationship table.

No cluster member may independently use the old satellite 70/30 pebble/boulder rule.

## Path behavior

Verify:

- no normal cluster member violates the current path footprint clearance;
- dedicated verge stones still appear;
- no duplicate recursive verge satellite path remains.

## Performance

Against `stone-distribution-v1.json`:

```text
representative total stone roots <= baseline
representative detailed triangles <= baseline
representative coarse triangles <= baseline
active draw calls <= baseline
```

The renderer should be unchanged, so any draw-call increase is a failure.

Build-slice timing may vary by hardware, but the static verification must also prove:

- macro-cluster member budget is bounded;
- macro-cell neighborhood query count is fixed at 9;
- overlap correction is at most one pass per member;
- cluster cache is bounded;
- no per-frame sampling path was added.

---

# Visual QA matrix

Inspect at minimum:

1. clean meadow with no obvious stone every 16 m;
2. meadow containing one compact family;
3. transition from clean meadow into rocky ground;
4. dry slope with scree clearly flowing downhill;
5. convex ridge with slabs/outcrops sharing strike;
6. concave lower slope with a widening accumulation fan;
7. alpine exposed rock;
8. wet lowland where clusters are rarer and more moss-correlated;
9. path verge with kicked-aside small stones but no decorative kerb line;
10. close cluster grounding in grass;
11. detailed-to-coarse stone handoff;
12. small debris disappearance outside the detail radius;
13. cluster spanning multiple 16 m stone cells;
14. cluster spanning a 64 m terrain chunk edge.

The desired visual rhythm is:

```text
clean ground
    -> isolated punctuation
    -> coherent family
    -> strong geological cluster
    -> clean ground
```

not constant background scatter.

---

# Acceptance criteria

The work is complete only when all are true:

1. `FIELD_STONE_CHANCE = 0.52` no longer exists.
2. Quiet cells outside cluster halos use the configured 10% maximum singleton path.
3. Macro clusters come from a deterministic 56 m jittered lattice.
4. Cluster activation uses both geological potential and `WorldEcologyField.rockiness`.
5. Cluster process is terrain-derived: compact, ridge, scree, or fan.
6. Every cluster has a bounded configured budget.
7. Every normal cluster has one anchor plus related secondary/debris roles.
8. Secondary/debris family choice depends on the anchor family.
9. Stone scale decreases statistically away from the anchor/source.
10. Ridge compositions follow geological strike.
11. Scree and fan compositions flow downhill.
12. Bedrock orientation is more coherent than loose debris orientation.
13. Cluster value/moss variation is correlated rather than independently random over the full range.
14. Generic local parent satellites are removed.
15. The recursive near-path satellite branch is removed.
16. `addVergeStones` remains the only path-verge generator.
17. Existing split masses survive but consume cluster budget.
18. Existing path, slope, world-boundary, sinking, tilt, grass-clearance, and geometry rules remain valid.
19. No new stone renderer or stone LOD is introduced.
20. No new draw calls are introduced.
21. No new per-frame procedural work is introduced.
22. Representative root count does not exceed the captured baseline.
23. Representative detailed/coarse triangle counts do not exceed the captured baseline.
24. Determinism survives cache eviction and load-order changes.
25. `npm run` stone/config/build verification used by the repository passes locally before manual deployment.

## Final target

The player should stop seeing:

```text
nice procedural stones placed across grass
```

and start seeing:

```text
bedrock exposure, fracture, scree, and accumulated debris that belong to the terrain
```

The important result is not more stones. It is stronger causality with the same or lower rendering cost.