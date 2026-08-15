# Tiny Glade-Inspired Stone Design, Distribution, and Look-and-Feel Plan

## Status

- Target branch: `main`
- Scope: stone distribution, cluster composition, archetype variety, grounding, biological growth, shape language, authoring, and verification
- Renderer: keep the existing stone renderer and batching architecture unless verification finds a real defect
- Runtime dependencies: unchanged
- Deployment: manual GitHub Pages deployment; no GitHub Actions
- Engineering principles: KISS, SOLID, deterministic, bounded, cacheable, no per-frame procedural generation

## Objective

Move the procedural stone system toward a cozy, authored, miniature-diorama look similar to Tiny Glade while keeping performance impact minimal.

The current stone system already has the expensive parts needed for a good result:

- six procedural archetypes: `pebble`, `boulder`, `slab`, `block`, `shard`, `outcrop`;
- deterministic variants;
- detailed/coarse geometry;
- shape-quality selection;
- biome palettes;
- terrain embedding and grass clearance;
- split masses;
- moss and lichen;
- deterministic caches;
- frame-budgeted batched rendering.

The main remaining weakness is not mesh detail. It is **composition**.

The world still thinks mostly in terms of individual stones generated from 16 m cells. The target should instead be:

```text
geological potential
    -> macro formation
        -> process
            -> anchor/source
            -> secondary family
            -> debris
```

The visual improvement must come primarily from:

1. strong negative space;
2. small authored-looking formations;
3. size hierarchy;
4. family resemblance;
5. macro terrain agreement;
6. better grounding;
7. correlated weathering;
8. restrained silhouettes.

Do **not** solve this by increasing polygon count, adding PBR texture stacks, increasing render radius, or spawning more stones.

---

# Key Decisions

1. Implement macro formations before further mesh-detail work.
2. Keep the existing six archetypes. They are enough.
3. Replace ordinary independent per-cell placement with deterministic macro clusters plus a rare singleton fallback.
4. Keep `addVergeStones` as the only path-verge generator.
5. Remove generic parent satellites once macro clusters are active.
6. Remove the recursive near-path satellite branch from `placeCandidate`.
7. Use the existing `TerrainLandformField` and `WorldEcologyField` as the environmental source of truth.
8. Use the existing 44 m landform gradient for formation-scale downhill direction. Do **not** use the 1.5 m shading normal to classify or orient a macro formation.
9. Add deterministic conflict suppression between nearby active clusters so jittered formations cannot merge into a rock carpet.
10. Keep all expensive work in deterministic generation/build paths. Add zero normal-frame cluster work.
11. Keep render batches, materials, stone LOD radii, render packing, and shader architecture unchanged.
12. Production tuning stays in `public/config/world.yaml`.
13. Development tuning stays in the `stone-world` tool and never enters `WorldApp`.

---

# Target Visual Language

## Far distance

The player should see a rhythm of rocky formations and quiet ground:

```text
grass grass grass grass grass

           O
       o       .
           .

grass grass grass grass grass grass grass

                         ___
                     __/     o
                         . .

grass grass grass grass
```

Avoid:

```text
.   o   .   O   .   o   .   O   .   o
```

The empty areas are part of the art direction.

## Gameplay distance

A group should usually read in one glance as:

```text
one dominant mass
+ one or two supporting masses
+ several small fragments
```

It should not read as several unrelated rocks of similar importance.

## Close distance

Prefer:

- broad masses;
- friendly irregularity;
- large readable planes;
- a few meaningful cuts;
- partial burial;
- grass overlapping small stones;
- moss/lichen following the same local environment.

Avoid:

- excessive micro-noise;
- many equally sharp corners;
- uniformly exposed bases;
- identical grass holes;
- independent random moss amounts.

---

# Exact File Responsibilities

## New: `src/world/stones/StoneClusterTypes.ts`

Types only. No algorithms and no Three.js scene state.

Define:

```text
StoneClusterProcess = compact | ridge | scree | fan
StoneClusterRole    = anchor | secondary | debris
StoneClusterCandidate
StoneClusterDescriptor
StoneClusterMemberSpec
StoneResolvedCluster
```

This avoids circular ownership between field, composition, and placement code.

## New: `src/world/stones/StoneClusterTuning.ts`

Algorithm constants and static relationship tables only.

Put here:

- hash domains;
- process thresholds;
- family relationship weights;
- biome modifiers;
- orientation spreads;
- deterministic conflict-suppression constants;
- overlap constants;
- cache limits;
- golden-angle constant;
- role constants.

Do not put production art controls here when they belong in YAML.

## New: `src/world/stones/StoneClusterField.ts`

Own macro geology and descriptor generation.

Responsibilities:

- macro lattice;
- center jitter;
- geological potential;
- one shared landform/ecology sample per candidate;
- raw activation;
- process classification;
- macro direction;
- radius/aspect/budget;
- cluster-level palette/value/moss DNA;
- deterministic conflict suppression;
- bounded candidate/descriptor caches.

It must not import renderer classes or materials.

## New: `src/world/stones/StoneClusterComposition.ts`

Pure composition from a final active descriptor.

Responsibilities:

- member roles;
- process-specific normalized offsets;
- anchor family selection;
- secondary/debris family selection;
- scale hierarchy;
- variant non-repetition;
- yaw hierarchy;
- member value/moss variation;
- split-secondary ownership.

It must not sample scene state or perform terrain queries.

## Modify: `src/world/stones/StoneField.ts`

Keep it as orchestration and final physical validation.

It should:

1. query nearby macro descriptors;
2. broad-phase reject formations that cannot touch the 16 m cell;
3. resolve/cache an entire formation once;
4. filter resolved roots into the requested stone cell;
5. evaluate the rare singleton only when the cell intersects no active cluster halo;
6. run path-verge placement after geological placement;
7. perform actual terrain height/normal/path validation;
8. compute sink, grass clearance, granite blend, and final `StoneInstance` data.

Remove from `StoneField` after migration:

- ordinary independent cell stone-count generation;
- `FIELD_STONE_CHANCE`;
- generic parent satellites;
- recursive path-near satellites;
- local macro `sampleRockiness` ownership;
- local macro `sampleStrike` ownership.

## Modify: `src/world/WorldConfig.ts`

Add all production cluster controls listed below as required numeric fields.

## Modify: `src/world/WorldConfigSchema.ts`

Add primitive type/range/integer validation.

## Modify: `src/world/WorldConfigValidator.ts`

Add cross-field invariants. Keep relational validation out of the loader.

## Modify: `public/config/world.yaml`

Add the shipped production cluster values.

## Modify: `src/world/stones/StoneShapeQuality.ts`

Only after macro distribution is working:

- add a silhouette-spike penalty;
- keep the existing broad-face/tiny-face/profile scoring;
- do not increase best-of-N attempts.

## Modify later, only after gallery comparison: `src/world/stones/StoneRecipe.ts`

Apply the restrained archetype tuning listed in the shape section below.

## New: `src/world/stones/StoneClusterVerification.ts`

Own deterministic distribution/composition verification.

## Modify: `scripts/verify-stones.mjs`

Run the new cluster verification as part of the existing local stone gate.

## New: `tools/stone-world/StoneClusterTuningMenu.ts`

Development-only cluster authoring UI using the project's existing lightweight native DOM pattern.

No new GUI dependency.

---

# Production Configuration

Add to `public/config/world.yaml`:

```yaml
# Macro stone geology. The 56 m spacing intentionally does not divide either
# the 16 m stone cell or 64 m terrain chunk, avoiding visible lattice lock.
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

New meanings:

```text
stoneDensity
    controls macro activation density, not stones-per-16m-cell

stoneClusterChance
    multiplies macro activation probability, not parent satellites
```

Schema ranges:

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

Cross-field validation:

```text
radiusMin < radiusMax
aspectMin <= aspectMax
budgetMin <= budgetMax
coreRatio < shoulderRatio
shoulderRatio < haloRatio
radiusMax * haloRatio <= spacing * 0.5
```

The last constraint keeps influence bounded enough for the fixed neighborhood strategy and prevents very large formations from dominating the macro lattice.

---

# Data Contracts

## `StoneClusterCandidate`

Conceptual immutable fields:

```text
gridX
gridZ
seed
centerX
centerZ
height
geologyPotential
surfaceRockiness
moisture
exposure
fertility
disturbance
landformSlope
landformConvexity
landformGradientX
landformGradientZ
suitability
rawActive
priority
process
strike
direction
majorRadius
minorRadius
influenceRadius
budget
biomeIndex
paletteKey
valueBase
mossBase
```

Do not store references to mutable scratch samples.

## `StoneClusterDescriptor`

Same immutable data as the candidate plus final activation after conflict suppression:

```text
active
```

## `StoneClusterMemberSpec`

Conceptual fields:

```text
index
role
archetype
variantIndex
u
v
rotationY
scale
valueScale
mossMultiplier
splitOwner
```

`u` and `v` are normalized process-local coordinates. Terrain conversion stays in `StoneField`.

---

# Exact Algorithm 1 — Macro Lattice

Use one potential formation per macro cell.

```text
S = stoneClusterSpacing
seed = hashStoneCell(gx, gz, config.seed XOR STONE_CLUSTER_DOMAIN)
rng = StoneRandom.fromSeed(seed)
```

Use a named constant for `STONE_CLUSTER_DOMAIN`.

All random choices below must use labeled forks. Adding a future parameter must not shift the existing random sequence.

---

# Exact Algorithm 2 — Jittered Formation Center

```text
j = stoneClusterCenterJitter

centerX = (gx + 0.5 + rng.fork("center-x").signed(j)) * S
centerZ = (gz + 0.5 + rng.fork("center-z").signed(j)) * S
```

With the shipped values:

```text
S = 56 m
j = 0.26
maximum center movement per axis = 14.56 m
```

The center remains deterministic and unrelated to query order.

---

# Exact Algorithm 3 — Geological Potential

Move the existing low-frequency field from `StoneField` into `StoneClusterField` without changing its first implementation:

```text
coarse = valueNoise(x / 240, z / 240, rockSeed)
fine = valueNoise(
  (x * 2.7) / 240,
  (z * 2.7) / 240,
  rockSeed XOR 0x9e3779b9
)

field = (coarse + fine * 0.4) / 1.4
geologyPotential = smoothstep(field, 0.52, 0.78)
```

Meaning:

```text
geologyPotential = likelihood of a rocky substrate / formation here
```

It is **not** surface rock exposure. Surface exposure already belongs to ecology.

---

# Exact Algorithm 4 — Shared Environment Sampling

For each uncached macro candidate, sample the shared world fields once at the jittered center.

Use reusable scratch objects owned by `StoneClusterField`.

```text
height = field.sampleHeight(centerX, centerZ)
landform = field.sampleLandform(centerX, centerZ, landformScratch)
hydrology = field.sampleHydrology(
  centerX,
  centerZ,
  height,
  hydrologyScratch
)
pathDistances = field.samplePathDistances(centerX, centerZ, pathScratch)
ecology = field.resolveEcology(
  centerX,
  centerZ,
  height,
  hydrology,
  pathDistances,
  ecologyScratch
)
```

Immediately copy numeric values into the candidate descriptor.

Do not create a second stone-specific moisture, soil, slope, or disturbance model.

---

# Exact Algorithm 5 — Suitability

Preserve meadow formations but strongly favor places where the shared ecology exposes rock.

```text
surfaceVisibility = 0.18 + 0.82 * ecology.rockiness
pathSurvival = 1 - 0.90 * ecology.disturbance

suitability = clamp01(
  geologyPotential
  * surfaceVisibility
  * pathSurvival
)
```

The `0.18` visibility floor is deliberate. Without it, flat meadow clusters almost disappear because ecological surface rockiness is correctly near zero there.

---

# Exact Algorithm 6 — Raw Activation

Convert density into a bounded response:

```text
densityResponse = 1 - exp(-stoneClusterDensityResponse * stoneDensity)
suitabilityResponse = smoothstep(suitability, 0.14, 0.72)

activationProbability = clamp01(
  stoneClusterChance
  * densityResponse
  * suitabilityResponse
)
```

Raw activation:

```text
rawActive = rng.fork("activation").chance(activationProbability)
```

There are no fallback cluster retries.

---

# Exact Algorithm 7 — Process Classification

Use **landform-scale** values, not shading normals.

Constants in `StoneClusterTuning.ts`:

```text
RIDGE_CONVEXITY_MIN = 0.25
FAN_CONVEXITY_MAX = -0.25
FAN_SLOPE_MIN = 0.08
```

Reuse `ECOLOGY_ROCK_SLOPE_START` for scree.

Classification order:

```text
if landform.slope >= ECOLOGY_ROCK_SLOPE_START:
    process = scree
else if landform.convexity >= RIDGE_CONVEXITY_MIN:
    process = ridge
else if landform.convexity <= FAN_CONVEXITY_MAX
     and landform.slope >= FAN_SLOPE_MIN:
    process = fan
else:
    process = compact
```

Order matters: a steep convex shoulder is still scree first.

---

# Exact Algorithm 8 — Formation Direction

## Strike

Move the existing strike field to `StoneClusterField`:

```text
strike = valueNoise(
  centerX / 130,
  centerZ / 130,
  rockSeed XOR 0x5bd1e995
) * PI
```

Strike is an axis, so its period is `PI`, not `2*PI`.

## Downhill

Do not call `sampleNormal()` for macro direction.

The landform field already computed the macro height gradient over a 44 m ring. Convert that gradient to downhill:

```text
gradientLength = hypot(landform.gradientX, landform.gradientZ)

if gradientLength >= 0.02:
    downhillAngle = atan2(
      -landform.gradientZ,
      -landform.gradientX
    )
else:
    downhillAngle = strike
```

The negation is required because the sampled height gradient points toward increasing height; downhill is the opposite direction.

Final process direction:

```text
compact = strike + rng.fork("direction").signed(0.35)
ridge   = strike
scree   = downhillAngle
fan     = downhillAngle
```

This is both cheaper and visually more coherent than sampling metre-scale normal noise for a 10-22 m formation.

---

# Exact Algorithm 9 — Radius, Aspect, and Budget

## Radius

```text
radiusT = smoothstep(suitability, 0.20, 0.85)
baseRadius = lerp(
  stoneClusterRadiusMin,
  stoneClusterRadiusMax,
  radiusT
)

majorRadius = clamp(
  baseRadius * rng.fork("radius").range(0.90, 1.10),
  stoneClusterRadiusMin,
  stoneClusterRadiusMax
)
```

## Aspect

```text
aspect = rng.fork("aspect").range(
  stoneClusterAspectMin,
  stoneClusterAspectMax
)
```

Process bias:

```text
compact: aspect = lerp(aspect, 0.95, 0.55)
ridge:   aspect = aspect
scree:   aspect = lerp(aspect, stoneClusterAspectMin, 0.45)
fan:     aspect = lerp(aspect, 0.88, 0.45)
```

Then:

```text
minorRadius = majorRadius * aspect
influenceRadius = majorRadius * stoneClusterHaloRatio
```

## Budget

```text
budgetT = smoothstep(suitability, 0.25, 0.80)

budget = round(
  lerp(
    stoneClusterBudgetMin,
    stoneClusterBudgetMax,
    budgetT
  )
)

budget = clamp(
  budget,
  stoneClusterBudgetMin,
  stoneClusterBudgetMax
)
```

Never retry to refill rejected members.

---

# Exact Algorithm 10 — Deterministic Cluster Conflict Suppression

This is required to preserve negative space after center jitter.

Without it, two independently active neighboring macro cells can jitter toward one another and form a dense accidental carpet.

Constants:

```text
CLUSTER_MIN_SPACING_RATIO = 0.68
CLUSTER_INFLUENCE_SEPARATION_RATIO = 0.88
CLUSTER_PRIORITY_RANDOM_SHARE = 0.18
```

Candidate priority:

```text
priorityRandom = rng.fork("priority").next()
priority =
  suitability * (1 - CLUSTER_PRIORITY_RANDOM_SHARE)
  + priorityRandom * CLUSTER_PRIORITY_RANDOM_SHARE
```

For a raw-active candidate, examine exactly the eight neighboring macro candidates.

For each raw-active neighbor:

```text
distance = hypot(
  centerX - neighbor.centerX,
  centerZ - neighbor.centerZ
)

minimumSeparation = max(
  S * CLUSTER_MIN_SPACING_RATIO,
  (influenceRadius + neighbor.influenceRadius)
    * CLUSTER_INFLUENCE_SEPARATION_RATIO
)
```

If:

```text
distance >= minimumSeparation
```

there is no conflict.

If there is a conflict, the candidate survives only if it has higher priority.

Exact tie-break:

```text
candidate wins when:
  priority > neighbor.priority

or when equal:
  gridX < neighbor.gridX

or when gridX equal:
  gridZ < neighbor.gridZ
```

Final:

```text
active = rawActive && winsEveryConflict
```

Important implementation rule:

```text
getDescriptor()
    -> getRawCandidate(self)
    -> getRawCandidate(8 neighbors)
    -> conflict suppression
```

`getRawCandidate()` must never call `getDescriptor()`. This prevents recursion.

Use two bounded caches:

```text
raw candidate cache: 512
final descriptor cache: 512
```

Trim oldest-first to roughly 60% when full.

The conflict neighborhood is fixed 3x3 and adds no per-frame cost.

---

# Exact Algorithm 11 — Cell Broad Phase

For one 16 m stone-cell AABB:

```text
[minX,maxX] x [minZ,maxZ]
```

For each descriptor from the fixed 3x3 macro neighborhood:

```text
dx = max(minX - centerX, 0, centerX - maxX)
dz = max(minZ - centerZ, 0, centerZ - maxZ)
```

Skip the descriptor if:

```text
dx*dx + dz*dz > influenceRadius*influenceRadius
```

Required order:

```text
lookup descriptor
-> inactive? skip
-> broad-phase miss? skip
-> resolve/cache whole cluster
-> filter roots to this stone cell
```

Do not resolve members before the broad phase.

---

# Exact Algorithm 12 — Member Roles

For all supported budgets:

```text
anchorCount = 1
secondaryCount = clamp(floor((budget - 1) * 0.35), 1, 2)
debrisCount = budget - anchorCount - secondaryCount
```

Examples:

```text
budget 4 -> 1 anchor + 1 secondary + 2 debris
budget 6 -> 1 anchor + 1 secondary + 4 debris
budget 8 -> 1 anchor + 2 secondaries + 5 debris
```

Member `0` is always the anchor.

Every member uses a labeled fork:

```text
member:0
member:1
...
```

---

# Exact Algorithm 13 — Local Formation Coordinates

Constants:

```text
core = stoneClusterCoreRatio
shoulder = stoneClusterShoulderRatio
halo = stoneClusterHaloRatio
GOLDEN_ANGLE = 2.399963229728653
```

Local coordinates are normalized `(u,v)`.

World transform:

```text
dirX = cos(direction)
dirZ = sin(direction)
perpX = -dirZ
perpZ = dirX

worldX = centerX
       + dirX * (u * majorRadius)
       + perpX * (v * minorRadius)

worldZ = centerZ
       + dirZ * (u * majorRadius)
       + perpZ * (v * minorRadius)
```

## Anchor

Compact/ridge:

```text
u = random.signed(0.06)
v = random.signed(0.06)
```

Scree/fan: source sits slightly upslope:

```text
u = -0.16 + random.signed(0.04)
v = random.signed(0.05)
```

## Secondary radius

```text
r = lerp(
  core * 0.55,
  shoulder * 0.92,
  random.next()
)
```

## Debris radius

Use square-root radial sampling so area grows naturally toward the outside:

```text
t = sqrt(random.next())
r = lerp(core, halo, t)
```

---

# Exact Algorithm 14 — Process Composition

Resolve once per cluster:

```text
phase = rng.fork("composition-phase").range(0, 2*PI)
```

## Compact

Do not use fully independent random angles; that produces accidental piles and circular rings.

Use golden-angle progression with jitter:

```text
angle = phase
      + memberIndex * GOLDEN_ANGLE
      + random.signed(0.28)

u = cos(angle) * r
v = sin(angle) * r
```

This creates stable asymmetric triangular/arc compositions without a relaxation solver.

## Ridge

Alternate members along the strike axis.

```text
side = memberIndex % 2 == 0 ? 1 : -1
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

Positive `u` is downhill.

Secondary:

```text
u = r
v = random.signed(
  r * lerp(0.16, 0.30, r / halo)
)
```

Debris:

```text
u = r
v = random.signed(
  r * lerp(0.22, 0.48, r / halo)
)
```

## Fan

Positive `u` is downhill, but lateral spread grows faster.

Secondary:

```text
u = r
v = random.signed(
  r * lerp(0.24, 0.46, r / halo)
)
```

Debris:

```text
u = r
v = random.signed(
  r * lerp(0.32, 0.68, r / halo)
)
```

## Small positional breakup

After process placement:

```text
u += random.fork("jitter-u").signed(0.035)
v += random.fork("jitter-v").signed(0.035)
```

Do not add another world-noise sample per member.

---

# Exact Algorithm 15 — Anchor Archetype Selection

Reuse the current biome/slope weight tables as the starting point.

For anchors:

1. select level-biome weights for compact/ridge/fan;
2. select slope weights for scree;
3. set `pebble` weight to zero;
4. apply biome modifiers;
5. apply process modifiers;
6. renormalize through the existing weighted picker.

## Biome modifiers

Order is:

```text
pebble, boulder, slab, block, shard, outcrop
```

Meadow:

```text
0.0, 1.20, 1.15, 0.65, 0.15, 0.75
```

Dry/steppe:

```text
0.0, 1.00, 1.15, 1.05, 0.75, 0.95
```

Alpine:

```text
0.0, 0.85, 1.00, 1.10, 1.20, 1.25
```

This makes visually loud shards very rare in ordinary meadow clusters without inventing another archetype.

## Process modifiers

Compact:

```text
no additional modifier
```

Ridge:

```text
slab    *= 1.35
outcrop *= 1.35
boulder *= 0.70
```

Scree:

```text
shard   *= 1.25
outcrop *= 1.15
```

Fan:

```text
boulder *= 1.25
slab    *= 1.10
shard   *= 0.75
outcrop *= 0.70
```

---

# Exact Algorithm 16 — Family-Aware Secondary and Debris Selection

## Secondary family table

| Anchor | Secondary weights |
|---|---|
| `boulder` | boulder 0.55, slab 0.20, block 0.15, shard 0.10 |
| `slab` | slab 0.50, block 0.20, boulder 0.20, shard 0.10 |
| `block` | block 0.50, shard 0.20, boulder 0.20, slab 0.10 |
| `outcrop` | block 0.35, shard 0.30, slab 0.20, boulder 0.15 |
| `shard` | shard 0.50, block 0.25, boulder 0.15, slab 0.10 |

Apply the same biome modifiers before the final weighted pick.

## Debris family table

| Anchor | Debris weights |
|---|---|
| `boulder` | pebble 0.70, boulder 0.30 |
| `slab` | pebble 0.55, slab 0.25, shard 0.20 |
| `block` | pebble 0.45, block 0.30, shard 0.25 |
| `outcrop` | pebble 0.35, shard 0.35, block 0.30 |
| `shard` | pebble 0.45, shard 0.55 |

For debris only, do not zero pebble weight.

This is the main anti-randomness rule: a formation looks like fragments of related geology rather than one sample from every available mesh family.

---

# Exact Algorithm 17 — Scale Hierarchy

Keep the existing archetype scale bands as the source for normal anchor size.

## Anchor

For archetype band `[minScale,maxScale]`:

```text
anchorScale = lerp(
  minScale,
  maxScale,
  random.range(0.62, 0.92)
)
```

The existing rare landmark-boulder multiplier is allowed only when:

```text
role == anchor
archetype == boulder
suitability >= 0.70
random.chance(0.06)
```

Use the existing multiplier range:

```text
1.7 .. 2.4
```

Never apply it to secondaries or debris.

## Secondary

```text
normalizedRadius = min(1, abs(r) / halo)
radialScale = lerp(0.70, 0.46, normalizedRadius)
desired = anchorScale
        * radialScale
        * random.range(0.90, 1.08)
```

Clamp:

```text
minimum = max(0.30, selectedBandMin * 0.45)
maximum = selectedBandMax * 0.82
secondaryScale = clamp(desired, minimum, maximum)
```

## Debris

```text
normalizedRadius = min(1, abs(r) / halo)
radialScale = lerp(0.36, 0.16, normalizedRadius)
desired = anchorScale
        * radialScale
        * random.range(0.85, 1.15)
```

Clamp:

```text
minimum = 0.22
maximum = selectedBandMax * 0.55
debrisScale = clamp(desired, minimum, maximum)
```

The size sequence should therefore naturally move from one strong mass to smaller fragments.

---

# Exact Algorithm 18 — Variant Non-Repetition

Do not repeatedly roll random variants and retry.

For each archetype inside one cluster keep a tiny list of used variant indices.

```text
start = memberRandom.fork("variant").integer(0, variantCount - 1)
```

Then perform a bounded linear probe:

```text
for attempt = 0 .. variantCount - 1:
    index = (start + attempt) % variantCount
    if index not used for this archetype:
        choose index
        mark used
        stop
```

If every variant has already been used, fall back to `start`.

With the shipped `10` variants per archetype and at most `8` cluster members, normal clusters should not repeat the same variant for the same family.

No extra mesh is generated; the existing variant cache remains authoritative.

---

# Exact Algorithm 19 — Orientation Hierarchy

Treat geological yaw as an axis where appropriate.

Role spread:

```text
anchor    = 0.00
secondary = 0.10
debris    = 0.28
```

Per archetype:

```text
outcrop:
  yaw = strike + signed(0.18 + roleSpread)

slab:
  yaw = strike + signed(0.22 + roleSpread)

block:
  yaw = strike + signed(0.28 + roleSpread)

boulder:
  yaw = axisLerp(strike, direction, 0.35)
      + signed(0.42 + roleSpread)

shard:
  yaw = direction + signed(0.38 + roleSpread)

pebble:
  yaw = random.range(0, PI)
```

Implement `axisLerp()` with `PI` periodicity so interpolation takes the shortest geological-axis route.

Bedrock remains ordered; loose fragments become progressively less ordered.

---

# Exact Algorithm 20 — Cluster Palette and Value DNA

Resolve once per cluster:

```text
valueBase = rng.fork("value-base").range(0.97, 1.03)
mossBias = rng.fork("moss-bias").range(0.90, 1.10)
```

Base palette comes from cluster-center biome.

For meadow only, choose `mossy` at cluster level rather than per stone:

```text
mossyChance = clamp01(
  0.10
  + ecology.moisture * 0.22
  - ecology.exposure * 0.08
)

if basePalette == meadowSage
   and ecology.moisture >= 0.42
   and rng.fork("mossy-palette").chance(mossyChance):
    palette = mossy
```

Per member:

```text
valueScale = clamp(
  valueBase + memberRandom.fork("value").signed(0.015),
  0.92,
  1.06
)
```

This creates family resemblance without making every stone the same color.

---

# Exact Algorithm 21 — Environment Moss from Shared Ecology

Replace the large independent random multiplier in the current placement-level moss calculation.

Use the actual ecology already sampled by the formation.

Altitude fade remains aligned to the grass altitude band:

```text
altitudeFade =
  smoothstep(
    height,
    grassMinAltitude - 4,
    grassMinAltitude + 10
  )
  *
  (1 - smoothstep(
    height,
    grassMaxAltitude - 45,
    grassMaxAltitude + 5
  ))
```

Cluster moss base:

```text
moisture = smoothstep(ecology.moisture, 0.16, 0.72)
shadeRetention = lerp(1.12, 0.78, ecology.exposure)
drainage = lerp(1.00, 0.72, ecology.rockiness)

mossBase = clamp01(
  moisture
  * shadeRetention
  * drainage
  * altitudeFade
)
```

Per member:

```text
environmentMoss = clamp01(
  mossBase
  * mossBias
  * memberRandom.fork("moss").range(0.95, 1.05)
)
```

Keep the existing render-time `StoneGrowthField` and `StoneGrowthShader` behavior. They already derive moss/lichen from local face susceptibility, exposure, height, palette, and granite blend.

Do not add another growth texture.

---

# Exact Algorithm 22 — Final Terrain Validation

`StoneClusterComposition` generates intent. `StoneField` decides whether the intended member can physically exist.

Resolve members in ascending index order.

For every member:

1. convert `(u,v)` to world `(x,z)`;
2. reject outside the world margin;
3. sample actual `height`;
4. sample actual `normal` using the existing local normal path;
5. preserve `SLOPE_REJECT_NY`;
6. resolve variant metrics and footprint;
7. preserve current footprint-aware path rejection;
8. perform one bounded overlap correction if needed;
9. compute sink/tilt/clearance;
10. append the final `StoneInstance`.

## Anchor failure

If member `0` fails world, terrain, slope, or path validation:

```text
reject the entire cluster
```

Do not leave debris with no source mass.

---

# Exact Algorithm 23 — One-Pass Overlap Correction

Use actual footprint radii, not grass-clearance radii.

For every already accepted member:

```text
minimumDistance =
  0.78 * (candidateFootprint + existingFootprint)
  + 0.12
```

If candidate distance is below the minimum, perform **one** correction only.

```text
push = normalize(candidatePosition - existingPosition)
```

If distance is nearly zero, use the candidate's process-local outward direction.

Move by:

```text
needed = minimumDistance - currentDistance + 0.04
candidate += push * needed
```

Then exactly once:

- resample terrain height;
- resample normal;
- re-run path validation;
- re-check all accepted member overlaps.

If still invalid, reject the member.

No iterative relaxation.

---

# Exact Algorithm 24 — Grounding and Grass Integration

Keep the existing archetype embed metric and slope sink, but make grounding role-aware.

Embed multiplier:

```text
if role == debris and archetype == pebble:
    embedMultiplier = 1.25
else if role == anchor:
    embedMultiplier = 1.08
else if role == secondary:
    embedMultiplier = 1.03
else:
    embedMultiplier = 1.00
```

Final sink:

```text
sink =
  variant.metrics.embed
  * variant.metrics.height
  * scale
  * embedMultiplier
  + (1 - normal.y) * 0.55 * scale
```

Grass clearance:

```text
contact = variant.metrics.contactRadius * scale
```

If:

```text
scale < 0.50
```

then:

```text
clearRadius = 0
```

Otherwise:

```text
anchor:
  clearRadius = contact * 0.88 + 0.08

secondary:
  clearRadius = contact * 0.72 + 0.06

debris:
  clearRadius = scale < 0.70
    ? 0
    : contact * 0.45
```

This deliberately allows grass to overlap smaller members instead of creating identical circular holes around every visible stone.

Keep the existing grass-clearance feather.

---

# Exact Algorithm 25 — Tilt

Keep the current archetype tilt strengths initially:

```text
pebble   0.85
shard    0.22
outcrop  0.65
slab     0.65
other    0.45
```

Do not add process-level random tilt before visual testing. The existing normal alignment already supplies terrain contact and more random tilt would fight the coherent yaw improvements.

---

# Exact Algorithm 26 — Split Masses

Keep the existing split concept but make it budget-safe.

Rules:

1. only an anchor `boulder` or `block` can split;
2. keep `SPLIT_CHANCE = 0.28`;
3. keep the same `variantIndex` for both halves;
4. keep shared palette/value/moss DNA;
5. successful split consumes the **first secondary slot**;
6. if the split half fails terrain/path validation, generate the normal first secondary instead;
7. total candidate members never exceeds the descriptor budget.

Keep the current break principle:

```text
breakAngle = strike + PI/2 + signed(0.35)
```

and current gap range:

```text
0.08 .. 0.30 m
```

plus footprint separation.

---

# Exact Algorithm 27 — Singleton Fallback

Only evaluate a singleton if the current 16 m stone cell does **not** intersect the halo of any final active macro cluster.

At cell center:

```text
singletonSuitability =
  geologyPotential
  * (0.25 + 0.75 * ecology.rockiness)
```

Probability:

```text
singletonProbability =
  stoneSingletonChance
  * lerp(0.35, 1.0, singletonSuitability)
```

One roll only:

```text
random.fork("singleton").chance(singletonProbability)
```

Family:

```text
70% pebble
22% boulder
8% slab
```

Position:

```text
x = cellOriginX + random.range(0.20, 0.80) * stoneCellSize
z = cellOriginZ + random.range(0.20, 0.80) * stoneCellSize
```

Use the same final terrain/path validation as cluster members.

The old `FIELD_STONE_CHANCE = 0.52` must be removed.

---

# Exact Algorithm 28 — Path Verge Stones

Keep `addVergeStones` separate because it represents **human disturbance**, not geology.

Preserve:

- path-distance field;
- tangent calculation;
- footprint-aware tread clearance;
- small-stone family;
- path alignment;
- bounded verge stepping;
- overlap checks.

Change only its regional density input:

```text
regionalStonePotential =
  0.45 * geologyPotential
  + 0.55 * ecology.rockiness
```

Then:

```text
chance = stoneVergeChance
       * (0.35 + 0.65 * regionalStonePotential)
```

This keeps displaced stones near paths where either underlying geology or exposed rock makes them plausible.

Do not add any second path-edge spawning path.

---

# Restrained Shape-Language Pass

Do this only after macro distribution screenshots are good. Otherwise shape changes make distribution debugging harder.

## `StoneShapeQuality.ts` — add silhouette-spike penalty

The existing quality score already rewards broad primary faces and penalizes tiny faces. Add one explicit measure for isolated radial spikes.

For every side radius:

```text
neighborMean = (previousRadius + nextRadius) * 0.5
spike = abs(currentRadius - neighborMean) / meanRadius
```

Per-archetype free threshold:

```text
pebble   0.12
boulder  0.16
slab     0.18
block    0.24
shard    0.34
outcrop  0.22
```

Penalty:

```text
excess = max(0, spike - threshold)
spikePenalty = average(excess over all sides)
```

Add to `scoreStoneShape()`:

```text
score -= spikePenalty * 3.2
```

Do not increase `ATTEMPTS = 4`.

This rejects accidental needle-like silhouette noise without making shards soft.

## `StoneRecipe.ts` — initial art-direction tuning

Only apply these after before/after gallery captures.

### Boulder

Current goal: softer weathered mass with fewer procedural cuts.

Change starting bands to:

```text
radiusJitter:          0.14 .. 0.24
silhouetteAsymmetry:   0.08 .. 0.15
cutCount:              1 .. 2
cutDepth:              0.06 .. 0.13
```

Keep side count `10 .. 12`.

### Slab

Goal: flatter, heavier, more embedded.

Starting changes:

```text
topScale:              0.76 .. 0.92
heightRatio:           0.36 .. 0.52
embed:                 0.26 .. 0.40
```

### Outcrop

Goal: broader geological mass rather than a tall prop.

Starting changes:

```text
heightRatio:           0.38 .. 0.58
depthRatio:            1.15 .. 1.75
embed:                 0.32 .. 0.48
```

### Pebble

Keep existing geometry unless gallery inspection shows a specific failure. Distribution and grass overlap matter more than more pebble detail.

### Block

Keep geometry initially. Frequency and family context are the first problems to solve.

### Shard

Keep its sharp geometry. Reduce its frequency contextually instead of softening the archetype until it no longer has a purpose.

Keep `stoneGrainStrength: 0`.

---

# Caching Contract

Use deterministic bounded caches.

```text
raw candidate cache:       512
descriptor cache:          512
resolved cluster cache:    256
existing stone-cell cache: keep current policy
existing variant cache:    keep current policy
```

When a cluster cache reaches capacity:

```text
trim oldest-first to about 60% of capacity
```

Map insertion order is sufficient, matching the existing transparent deterministic cache style.

Eviction may change recomputation frequency only. It must never change generated results.

---

# Performance Contract

Do not change the renderer to pay for the art improvement.

Hard requirements:

| Metric | Requirement |
|---|---|
| New per-frame cluster work | `0` |
| Macro neighbor query | fixed `3x3` |
| Conflict query | fixed `3x3` raw candidates |
| Cluster member candidates | bounded by YAML budget |
| Default max members | `8` |
| Overlap correction | maximum `1` move/member |
| Poisson-disc / relaxation | none |
| Physics | none |
| New textures | `0` |
| New materials | `0` |
| Extra stone LOD | none |
| Stone render radius | unchanged |
| Draw calls | no increase |
| Representative triangle count | no increase |
| Representative visible root count | no increase |

Keep existing shipped batching expectations:

```text
desktop stone batches: 49
detailed desktop draws: 9
coarse desktop draws: 40
compact maximum batches: 16
```

Keep existing streaming budgets:

```text
desktop stone build reserve: 2.00 ms
compact stone build reserve: 1.25 ms
```

These wall-clock budgets are manual hardware checks, not deterministic CI-style gates.

No GitHub Actions are added.

---

# Deterministic Complexity Ceilings

With:

```text
stone cell = 16 m
terrain chunk = 64 m
macro spacing = 56 m
```

keep:

```text
max macro neighbor checks per 16 m cell = 9
max unique macro descriptors touched by one cold 64 m chunk <= 25
max resolved member candidates per cluster = stoneClusterBudgetMax
max overlap correction passes per member = 1
```

Do descriptor/cell circle broad-phase rejection before resolving cluster members.

---

# Verification — Exact Required Tests

Add to `StoneClusterVerification.ts`.

## A. Raw candidate determinism

Construct two independent `TerrainField` + `StoneClusterField` instances with the same shipped config.

Sample:

```text
gx = -18 .. 18
gz = -18 .. 18
```

Require canonical candidate equality.

## B. Final descriptor determinism

Repeat the same domain and require equality after conflict suppression.

## C. Query-order independence

Query descriptors in:

1. row-major order;
2. reverse order;
3. deterministic shuffled order.

Require identical canonical results.

## D. Cache-eviction independence

Query enough macro coordinates to force cache eviction, then re-query a known earlier set.

Require identical canonical descriptors and members.

## E. Conflict-suppression invariant

For every pair of final active descriptors in neighboring macro cells:

```text
distance >= minimumSeparation
```

as calculated by the production conflict rule.

## F. Budget invariant

For every active cluster:

```text
candidate member count <= descriptor.budget
```

and:

```text
accepted member count <= descriptor.budget
```

## G. Anchor invariant

Every non-empty resolved cluster has exactly one anchor and it is member `0`.

If anchor validation fails, the resolved cluster is empty.

## H. Split-budget invariant

A successful split consumes the first secondary slot and never increases total candidate count beyond budget.

## I. Variant-repetition invariant

When one archetype appears no more times than `stoneVariantsPerArchetype`, its members have unique variant indices inside that cluster.

## J. Cell ownership invariant

Every resolved root belongs to exactly one 16 m stone cell based on its final world root coordinate.

Collecting neighboring chunks must not duplicate the same root.

## K. No lattice lock

For active descriptors in the sample domain, verify center offsets are not all identical and cluster roots do not quantize to 16 m or 64 m boundaries.

This is an algorithmic sanity check, not a statistical beauty score.

## L. Path contract

No accepted non-pebble geological member may overlap the protected tread according to the existing footprint-aware path test.

## M. Shape quality

Keep all existing watertightness/topology/quality verifiers and add spike-penalty regression coverage when the shape pass lands.

---

# Canonical Verification Serialization

Serialize descriptor/member fields in fixed order.

Quantize only floating-point values derived from terrain/trigonometry:

```text
position / height / radius: 1e-4
angles:                     1e-6
scale / moss / value:       1e-6
```

Keep enums and integers exact.

Use a local FNV-1a 32-bit helper for compact regression reporting, but compare canonical strings as the real equality check so a hash collision cannot hide a failure.

Do not add a hashing dependency.

---

# Visual QA Matrix

Capture the existing stone-world viewpoints before the implementation and again after every pass.

At minimum inspect:

```text
quiet meadow
meadow compact formation
dry/steppe formation
alpine formation
ridge
moderate slope
steep scree
fan/hollow edge
path verge
water edge
high-altitude exposed rock
split anchor
close-up moss cluster
wide world view
```

For each view check:

- empty ground is common and intentional;
- one dominant mass is readable;
- secondaries do not compete with the anchor;
- debris decreases in size away from the source;
- cluster members share a family;
- shards are rare in meadow;
- ridges share strike;
- scree/fans share macro downhill direction;
- no 16 m, 56 m, or 64 m lattice is visible;
- bases look buried rather than placed;
- small debris can disappear partly into grass;
- grass openings are not identical circles;
- moss reads as shared microclimate;
- no chunk-border discontinuity appears;
- LOD changes preserve the same formation identity.

---

# Stone-World Tuning Tool

Expose only production-relevant controls:

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

Do not expose:

- process thresholds;
- family tables;
- hash salts;
- conflict constants;
- overlap constants;
- orientation tables;
- cache sizes.

Those are algorithm behavior, not useful art knobs.

Actions:

```text
Apply now
Reset YAML
Export YAML
Copy probe URL
```

Use a 120 ms debounce for slider changes.

Changing stone cluster tuning should rebuild the stone probe only, not terrain every frame.

Production values always come from YAML.

---

# Implementation Order

## Pass 0 — Capture Baseline

Before changing behavior:

1. capture current stone-world screenshots at the visual QA locations;
2. record current stone counts, triangles, draw calls, and build peak from the existing diagnostics;
3. save the representative values in the stone verification notes or plan implementation log;
4. do not invent replacement target counts before measuring the current build.

## Pass 1 — Macro Field

Implement:

- `StoneClusterTypes.ts`;
- `StoneClusterTuning.ts`;
- `StoneClusterField.ts`;
- production config/schema/validator fields;
- raw activation;
- macro process classification;
- landform-derived downhill;
- conflict suppression;
- descriptor verification.

Do not change rendering or stone meshes.

## Pass 2 — Composition

Implement `StoneClusterComposition.ts`:

- roles;
- process geometry;
- golden-angle compact layout;
- family tables;
- biome modifiers;
- size hierarchy;
- variant non-repetition;
- orientation hierarchy;
- cluster DNA;
- split-slot ownership.

## Pass 3 — StoneField Integration

Replace ordinary independent placement with:

```text
fixed macro query
-> descriptor broad phase
-> cached whole-cluster resolution
-> cell root filtering
-> singleton fallback
-> existing path verge
```

Remove:

```text
FIELD_STONE_CHANCE
generic parent satellites
recursive near-path satellite spawning
```

Preserve all final path/world/slope safety checks.

## Pass 4 — Grounding and Ecology

Apply:

- role-aware sink;
- role-aware grass clearance;
- ecology-driven cluster moss base;
- cluster-level mossy palette choice.

Keep shaders/materials unchanged.

## Pass 5 — Shape Pass

Only after cluster distribution is visually accepted:

1. add silhouette-spike scoring;
2. compare the stone gallery;
3. apply the boulder/slab/outcrop recipe changes above;
4. leave pebble/block/shard alone unless a specific screenshot demonstrates a problem.

## Pass 6 — Tooling and Final Verification

Add:

- cluster tuning menu;
- YAML export;
- deterministic cluster verification;
- performance comparison against the Pass 0 baseline;
- final world screenshots.

Run the existing static/build/stone verification locally. Deployment remains manual to GitHub Pages.

---

# Definition of Done

The plan is complete when all of the following are true:

1. ordinary stones are formation-driven rather than independently scattered by 16 m cells;
2. quiet meadow contains substantial negative space;
3. compact, ridge, scree, and fan formations are visually distinguishable;
4. each formation has an anchor/secondary/debris hierarchy;
5. neighboring members visibly belong to the same stone family;
6. meadow strongly favors soft boulder/slab/pebble language;
7. sharp shards are contextual rather than globally frequent;
8. macro downhill decisions use landform gradient, not micro shading normals;
9. neighboring jittered clusters cannot collapse into an accidental rock carpet;
10. small stones nestle into grass instead of punching identical clearance holes;
11. moss/lichen agrees with shared ecology and remains handled by the existing growth renderer;
12. deterministic results survive cache eviction and query-order changes;
13. draw calls do not increase;
14. representative triangles and visible roots do not increase over the measured baseline;
15. normal-frame cluster cost remains zero;
16. stone render radii and LOD architecture remain unchanged;
17. no new runtime dependencies are added;
18. no GitHub Actions are introduced.

The expected result is not a more complicated stone renderer. It is a **smarter formation generator** that produces fewer, better-related stones with stronger silhouette hierarchy and much better negative space.