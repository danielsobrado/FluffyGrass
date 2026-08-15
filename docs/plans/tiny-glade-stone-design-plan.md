# Tiny Glade-Inspired Stone Design, Distribution, and Performance Plan

## Status

- Target branch: `main`
- Scope: stone distribution, composition, variety, grounding, weathering, tuning, deterministic verification, and performance protection
- Renderer: preserve the existing renderer/batching/material architecture unless a verifier proves a defect
- Runtime dependencies: no new dependencies
- Tool UI: use the project's existing lightweight native DOM tuning pattern; do not add `lil-gui`/`dat.gui`
- Deployment: manual GitHub Pages deployment; no GitHub Actions
- Principles: KISS, SOLID, deterministic, bounded, cacheable, configuration in YAML, no per-frame procedural generation

## Objective

Move the procedural stone system toward a cozy, authored, miniature-diorama look similar to Tiny Glade while keeping the PoC at the same or lower rendering cost.

The existing system already has the expensive pieces:

- six procedural archetypes: `pebble`, `boulder`, `slab`, `block`, `shard`, `outcrop`;
- deterministic variants;
- shape-quality scoring;
- detailed/coarse geometry;
- biome palettes;
- terrain embedding and grass clearance;
- split masses;
- moss and lichen;
- deterministic caches;
- batched rendering;
- frame-budgeted batch construction.

The largest remaining visual weakness is **composition**, not polygon count.

The target hierarchy is:

```text
geological potential
    -> macro formation
        -> process
            -> anchor/source
            -> secondary family
            -> debris
```

The visual improvement must come mainly from:

1. stronger negative space;
2. small authored-looking formations;
3. clear size hierarchy;
4. family resemblance;
5. agreement with terrain/ecology;
6. better grounding;
7. correlated weathering;
8. restrained silhouettes.

Do not solve the problem by increasing stone render radius, adding textures/materials, adding another LOD, or increasing total visible stone count.

---

# Non-Negotiable Performance Rules

These rules are implementation constraints, not tuning suggestions.

```text
new normal-frame cluster work                  0
macro descriptors queried per 16 m stone cell <= 9
raw conflict neighbors per descriptor          <= 8
member candidates per formation                <= stoneClusterBudgetMax
shipped default member candidates               <= 8
overlap correction moves per member             <= 1
unbounded rejection loops                       0
Poisson-disc / iterative relaxation             0
physics used for placement                       0
new textures                                     0
new materials                                    0
new draw calls                                   0
new stone LODs                                   0
stone render radii changes                       0
```

The formation generator executes only while deterministic stone content is being collected/built. `WorldStoneSystem.update()` must not gain per-frame noise, process classification, cluster simulation, or ecological sampling.

The current renderer contracts remain authoritative:

```text
desktop production stone draws: 49
detailed desktop draws:          9
coarse desktop draws:            40
compact maximum batches:         16
```

The existing production stone build reserves remain the manual hardware targets:

```text
desktop stone build reserve: 2.00 ms
compact stone build reserve: 1.25 ms
```

Wall-clock milliseconds must **not** be used as deterministic build gates because machine load and hardware differ. Deterministic build gates use operation bounds, generated root counts, triangle counts, draw/batch contracts, and exact reproducibility. Timing is a separate manual acceptance check.

---

# Tool UI Decision

The repository already uses a native DOM tuning panel for grass (`<details>`, range/number inputs, buttons). The stone-world probe currently has no GUI. The package does not contain a runtime `lil-gui` dependency.

Therefore implement a **lil-like stone tuning panel with the existing native DOM pattern** rather than adding a GUI package.

Benefits:

- zero runtime dependency increase;
- same interaction pattern as the existing project;
- no production bundle impact because the tuner is under `tools/stone-world`;
- easy YAML export;
- easy URL-based reproducible probes;
- simpler lifecycle and disposal.

Do not import the tuning menu from `WorldApp`.

---

# Exact Files to Add and Change

## New: `src/world/stones/StoneClusterTypes.ts`

Types only.

Define:

```text
StoneClusterProcess = compact | ridge | scree | fan
StoneClusterRole = anchor | secondary | debris
StoneClusterCandidate
StoneClusterDescriptor
StoneClusterMemberSpec
StoneResolvedCluster
```

No renderer imports. No scene objects. No random generation.

## New: `src/world/stones/StoneClusterTuning.ts`

Algorithm constants only.

Put here:

- hash domains;
- process thresholds;
- family relationship tables;
- biome multipliers;
- process multipliers;
- role/orientation spreads;
- conflict-suppression constants;
- overlap constants;
- cache limits;
- golden angle;
- numeric epsilons.

Do **not** put production art controls here when they belong in YAML.

Recommended constants:

```text
RIDGE_CONVEXITY_MIN = 0.25
FAN_CONVEXITY_MAX = -0.25
FAN_SLOPE_MIN = 0.08
CLUSTER_MIN_SPACING_RATIO = 0.68
CLUSTER_INFLUENCE_SEPARATION_RATIO = 0.88
CLUSTER_PRIORITY_RANDOM_SHARE = 0.18
GOLDEN_ANGLE = 2.399963229728653
RAW_CANDIDATE_CACHE_LIMIT = 512
DESCRIPTOR_CACHE_LIMIT = 512
RESOLVED_CLUSTER_CACHE_LIMIT = 256
CACHE_TRIM_RATIO = 0.60
```

## New: `src/world/stones/StoneClusterField.ts`

Own macro geology and final descriptor generation.

Responsibilities:

1. macro lattice;
2. deterministic center jitter;
3. low-frequency geological potential;
4. one shared landform/hydrology/ecology sample per uncached candidate;
5. suitability;
6. raw activation;
7. process classification;
8. macro strike/downhill direction;
9. radius/aspect/budget;
10. cluster-level palette/value/moss DNA;
11. deterministic conflict suppression;
12. bounded raw-candidate and descriptor caches.

Must not import:

- `WorldStoneSystem`;
- materials;
- render batch classes;
- scene objects.

Use `TerrainField.sampleLandform()` for formation-scale slope/direction. Do not use the 1.5 m shading normal to classify or orient a 10-22 m formation.

## New: `src/world/stones/StoneClusterComposition.ts`

Pure formation composition.

Input:

```text
StoneClusterDescriptor
```

Output:

```text
readonly StoneClusterMemberSpec[]
```

Responsibilities:

- anchor/secondary/debris role counts;
- compact/ridge/scree/fan normalized coordinates;
- family-aware archetype choice;
- scale hierarchy;
- variant non-repetition;
- yaw hierarchy;
- member value/moss variation;
- split-secondary slot ownership.

It must not query terrain, paths, scene objects, materials, or WebGL.

## Modify: `src/world/stones/StoneField.ts`

Keep this as orchestration and final physical validation.

Add:

```text
StoneClusterField
StoneClusterComposition
resolved-cluster cache
```

Replace ordinary independent placement with:

```text
collect stone cell
    -> query fixed 3x3 macro descriptors
    -> ignore inactive descriptors
    -> descriptor/cell circle broad phase
    -> resolve/cache complete formation
    -> filter final roots to current 16 m cell
    -> if no active halo intersects cell, evaluate singleton once
    -> add existing path-verge stones
```

Final member validation remains here:

- world bounds;
- local terrain height;
- local terrain normal;
- slope rejection;
- path tread clearance;
- footprint overlap;
- sink;
- grass clearance;
- granite blend;
- tilt;
- final `StoneInstance` conversion.

Remove after macro integration:

```text
FIELD_STONE_CHANCE
ordinary stones-per-cell expected-count placement
generic parent satellites
recursive near-path satellite spawning
StoneField-owned macro sampleRockiness()
StoneField-owned macro sampleStrike()
```

Keep `addVergeStones()` as the single path-verge mechanism.

## Modify: `src/world/WorldConfig.ts`

Add every production cluster control below as a required numeric field.

No optional fallback fields.

## Modify: `src/world/WorldConfigSchema.ts`

Add primitive numeric/integer/range validation using the exact ranges in the configuration section.

## Modify: `src/world/WorldConfigValidator.ts`

Add cross-field invariants:

```text
stoneClusterRadiusMin < stoneClusterRadiusMax
stoneClusterAspectMin <= stoneClusterAspectMax
stoneClusterBudgetMin <= stoneClusterBudgetMax
stoneClusterCoreRatio < stoneClusterShoulderRatio
stoneClusterShoulderRatio < stoneClusterHaloRatio
stoneClusterRadiusMax * stoneClusterHaloRatio <= stoneClusterSpacing * 0.5
```

Do not duplicate those relationships in `WorldConfigLoader`.

## Modify: `public/config/world.yaml`

Add the production controls and shipped starting values from the YAML section below.

This remains the source of truth.

## New: `src/world/stones/StoneClusterVerification.ts`

Own deterministic correctness tests for macro placement/composition.

Tests are detailed below.

## New: `src/world/stones/StoneClusterPerformanceVerification.ts`

Own **deterministic generation-performance contracts** only.

Do not assert wall-clock milliseconds.

Verify:

- fixed neighborhood bounds;
- descriptor/member complexity ceilings;
- fixed-domain generated root counts against the committed baseline;
- fixed-domain triangle counts against the committed baseline;
- no increase in representative visible-root count;
- no increase in representative triangle count;
- cache-size contracts;
- no member generation above budget;
- far collection removes sub-pixel small members as before.

Existing render-performance verifiers continue to own draw calls, packing, detail footprint, batch count, and shader/render contracts.

## New: `qa/stones/stone-performance-baseline.json`

Create **before changing placement behavior**.

Do not invent the numbers in the plan. Measure them from the current `main` implementation using the capture script below.

Store deterministic counts only, for example:

```json
{
  "seed": 123,
  "chunkMin": -6,
  "chunkMax": 6,
  "includeSmall": true,
  "roots": 0,
  "detailedTriangles": 0,
  "coarseTriangles": 0,
  "maxRootsInChunk": 0
}
```

The example zeros are schema examples only; the capture script must replace them with measured values before placement code changes are merged.

Do not store milliseconds in this file.

## New: `scripts/capture-stone-performance-baseline.mjs`

Manual developer utility.

Behavior:

1. load `public/config/world.yaml`;
2. instantiate the production `TerrainField`, `StoneField`, and required render builder through Vite SSR;
3. sample the fixed chunk domain `-6..6` on both axes;
4. count roots with `includeSmall=true`;
5. count representative detailed/coarse triangles using production variant metrics/builder;
6. record max roots in one chunk;
7. write `qa/stones/stone-performance-baseline.json` with stable key order;
8. do not write timestamps or machine-specific values.

Run once on the pre-change implementation to freeze the deterministic baseline.

## Modify: `scripts/verify-stones.mjs`

Add SSR loads for:

```text
StoneClusterVerification.ts
StoneClusterPerformanceVerification.ts
```

Then add their summaries to the existing `[stones] OK` output.

Do not create another top-level stone test command for normal use; keep `npm run test:stones` as the single local stone gate.

## Modify: `package.json`

Add only the manual baseline capture convenience command:

```json
"capture:stone-baseline": "node scripts/capture-stone-performance-baseline.mjs"
```

Do not add a GUI dependency.

Do not add GitHub Actions.

## New: `tools/stone-world/StoneClusterTuningMenu.ts`

Development-only native DOM tuner following `GrassArtMenu` style.

Responsibilities:

- maintain a mutable tool-only copy of stone cluster config;
- render grouped controls;
- normalize dependent values;
- emit changes through one callback;
- debounce rebuilds at 120 ms;
- reset to loaded YAML;
- export the production YAML block;
- copy a reproducible probe URL.

Do not know about Three.js or stone-system lifecycle.

## New: `tools/stone-world/StoneWorldProbeController.ts`

Keep the menu and probe lifecycle separate.

Responsibilities:

- receive base YAML config and current stone overrides;
- keep terrain geometry/terrain field when terrain inputs did not change;
- dispose the previous `WorldStoneSystem` before rebuilding stones;
- create new `StoneField`/`WorldStoneSystem` for changed stone controls;
- drain the static stone probe build;
- expose diagnostics;
- preserve `growth=natural|moss|lichen` probe behavior.

The controller prevents `tools/stone-world/main.ts` from becoming another large mixed-responsibility file.

## New: `tools/stone-world/stone-world.css`

Move the current inline `stone-world.html` styles here and add tuner styling.

No production CSS changes.

## Modify: `tools/stone-world/main.ts`

Refactor into orchestration only:

```text
parse URL
load YAML
construct renderer/scene
build terrain once
construct StoneWorldProbeController
construct StoneClusterTuningMenu
connect menu change -> debounced stone-only rebuild
render
```

Preserve existing URL parameters:

```text
x
z
h
d
span
growth
```

Add tool-only stone override query parameters when `Copy probe URL` is used.

## Modify: `stone-world.html`

Remove inline style and add:

```html
<link rel="stylesheet" href="/tools/stone-world/stone-world.css" />
```

Keep the current canvas and diagnostics output.

## Modify: `tsconfig.stone-tools.json`

The current include names only the two `main.ts` files. TypeScript follows imports, so new imported tool files will normally be included transitively.

Prefer leaving the config unchanged unless TypeScript proves otherwise. If explicit includes become necessary, change the stone-world entry to:

```json
"tools/stone-world/**/*.ts"
```

Do not change it pre-emptively.

## Modify later: `src/world/stones/StoneShapeQuality.ts`

Only after macro distribution is accepted.

Add a silhouette-spike penalty while keeping the existing broad-face/profile quality score.

Do not increase `ATTEMPTS = 4`.

## Modify later: `src/world/stones/StoneRecipe.ts`

Only after before/after gallery captures prove the need.

Use the restrained boulder/slab/outcrop changes listed below.

## No change unless a verifier fails

Do not modify these as part of the cluster implementation:

```text
src/world/stones/WorldStoneSystem.ts
src/world/stones/StoneRenderBatchBuilder.ts
src/world/stones/StoneRenderPacking.ts
src/world/stones/StoneRenderInstanceWriter.ts
src/world/stones/StoneGrowthShader.ts
src/world/stones/StoneGrowthField.ts
```

The goal is better placement with the existing renderer.

---

# Production YAML Configuration

Add under the existing procedural-stones section in `public/config/world.yaml`:

```yaml
# Procedural stones.
stonesEnabled: 1
stoneCellSize: 16

# Macro formation activation. Density removes/adds complete formations rather
# than thinning every individual formation.
stoneDensity: 0.17
stoneClusterChance: 0.82
stoneSingletonChance: 0.10

# Macro lattice. 56 m intentionally does not divide the 16 m stone cell or
# 64 m terrain chunk, which reduces visible lattice lock.
stoneClusterSpacing: 56
stoneClusterCenterJitter: 0.26

# Formation footprint.
stoneClusterRadiusMin: 10
stoneClusterRadiusMax: 22
stoneClusterAspectMin: 0.58
stoneClusterAspectMax: 0.92

# Formation composition.
stoneClusterBudgetMin: 4
stoneClusterBudgetMax: 8
stoneClusterCoreRatio: 0.42
stoneClusterShoulderRatio: 0.78
stoneClusterHaloRatio: 1.12
stoneClusterDensityResponse: 6

# Existing variety/render controls remain authoritative.
stoneVariantsPerArchetype: 10
stoneGrassClearanceFeather: 0.4
stoneRadiusDesktop: 6
stoneRadiusCompact: 3
stoneDetailRadius: 2
stoneDetailRadiusCompact: 1
stoneRenderBatchChunksPerAxis: 2
stoneChunksPerFrame: 1
stoneVergeChance: 0.62
stoneGrainStrength: 0
```

New semantics:

```text
stoneDensity
    controls how frequently eligible macro cells activate

stoneClusterChance
    global multiplier on macro activation probability

stoneSingletonChance
    rare isolated-stone probability outside all active formation halos
```

`stoneClusterChance` no longer means “spawn satellites around a parent.”

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

Cross-field validation:

```text
radiusMin < radiusMax
aspectMin <= aspectMax
budgetMin <= budgetMax
coreRatio < shoulderRatio
shoulderRatio < haloRatio
radiusMax * haloRatio <= spacing * 0.5
```

The final invariant is important for bounded queries and negative space.

---

# Stone Tuning Menu — Exact Controls

The menu is development-only. Production values come from YAML.

## Folder: Distribution

| UI label | Config key | Default | Min | Max | Step | Effect |
|---|---|---:|---:|---:|---:|---|
| Formation density | `stoneDensity` | 0.17 | 0.05 | 0.40 | 0.01 | Removes/adds whole eligible formations |
| Formation chance | `stoneClusterChance` | 0.82 | 0.20 | 1.00 | 0.02 | Multiplies activation probability |
| Singleton chance | `stoneSingletonChance` | 0.10 | 0.00 | 0.25 | 0.01 | Controls rare isolated stones |
| Formation spacing | `stoneClusterSpacing` | 56 | 40 | 96 | 2 | Controls macro rhythm and negative space |
| Center jitter | `stoneClusterCenterJitter` | 0.26 | 0.00 | 0.35 | 0.01 | Breaks lattice regularity |

Tune this folder first.

## Folder: Footprint

| UI label | Config key | Default | Min | Max | Step | Effect |
|---|---|---:|---:|---:|---:|---|
| Radius min | `stoneClusterRadiusMin` | 10 | 4 | 30 | 1 | Smallest formation radius |
| Radius max | `stoneClusterRadiusMax` | 22 | 8 | 40 | 1 | Largest formation radius |
| Aspect min | `stoneClusterAspectMin` | 0.58 | 0.45 | 0.90 | 0.01 | Narrowest formation |
| Aspect max | `stoneClusterAspectMax` | 0.92 | 0.60 | 1.00 | 0.01 | Roundest formation |
| Halo | `stoneClusterHaloRatio` | 1.12 | 0.90 | 1.25 | 0.01 | Maximum influence/debris reach |

## Folder: Composition

| UI label | Config key | Default | Min | Max | Step | Effect |
|---|---|---:|---:|---:|---:|---|
| Members min | `stoneClusterBudgetMin` | 4 | 4 | 8 | 1 | Minimum candidate members |
| Members max | `stoneClusterBudgetMax` | 8 | 4 | 12 | 1 | Maximum candidate members |
| Core | `stoneClusterCoreRatio` | 0.42 | 0.20 | 0.60 | 0.01 | Anchor/secondary concentration |
| Shoulder | `stoneClusterShoulderRatio` | 0.78 | 0.50 | 0.90 | 0.01 | Secondary/debris transition |
| Density response | `stoneClusterDensityResponse` | 6 | 1 | 12 | 0.25 | Curvature of density response |

## Folder: Context

Expose the existing path-edge control because it strongly affects stone composition around paths:

| UI label | Config key | Default | Min | Max | Step |
|---|---|---:|---:|---:|---:|
| Path verge chance | `stoneVergeChance` | 0.62 | 0.00 | 1.00 | 0.02 |

Do not expose stone render radii, material detail, shader detail, variant count, or batch size in this art tuner. They are performance/renderer contracts, not composition knobs.

## Tool-only actions

Add exactly:

```text
Apply now
Reset YAML
Export YAML
Copy probe URL
```

`Apply now` bypasses the 120 ms debounce.

`Reset YAML` restores values from the YAML loaded when the probe opened.

`Export YAML` copies and downloads only the stone-cluster tuning block plus `stoneDensity`, `stoneClusterChance`, `stoneSingletonChance`, and `stoneVergeChance`.

`Copy probe URL` stores:

```text
x
z
h
d
span
growth
```

plus current tuning values as query parameters.

Query parameters are tool-only overrides. The production config loader must never read them.

## Menu normalization

Normalize before invoking the rebuild callback:

```text
radiusMin <= radiusMax - 1
aspectMin <= aspectMax
budgetMin <= budgetMax
coreRatio <= shoulderRatio - 0.01
shoulderRatio <= haloRatio - 0.01
radiusMax * haloRatio <= spacing * 0.5
```

When one control creates a conflict, prefer clamping the control the user just changed and immediately resync all displayed values.

Example:

```text
maximumRadiusAllowed = spacing * 0.5 / haloRatio
radiusMax = min(radiusMax, maximumRadiusAllowed)
radiusMin = min(radiusMin, radiusMax - 1)
```

Do not allow the tool to construct an invalid production config.

---

# Exact Algorithm — Macro Formation Field

## 1. Macro lattice

One potential formation per macro cell.

```text
S = stoneClusterSpacing
seed = hashStoneCell(gx, gz, config.seed XOR STONE_CLUSTER_DOMAIN)
rng = StoneRandom.fromSeed(seed)
```

All random decisions use labeled forks so adding a future random decision does not shift existing placement.

## 2. Jittered center

```text
j = stoneClusterCenterJitter
centerX = (gx + 0.5 + rng.fork("center-x").signed(j)) * S
centerZ = (gz + 0.5 + rng.fork("center-z").signed(j)) * S
```

With shipped values, maximum center displacement is `14.56 m` per axis.

## 3. Geological potential

Move the existing low-frequency field from `StoneField` without changing its first implementation:

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

This means “rocky substrate is plausible,” not “rock must be visible.”

## 4. Shared environment sample

Once per uncached macro candidate:

```text
height = field.sampleHeight(centerX, centerZ)
landform = field.sampleLandform(centerX, centerZ, landformScratch)
hydrology = field.sampleHydrology(centerX, centerZ, height, hydrologyScratch)
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

Copy numeric values into immutable descriptor data immediately. Never store references to scratch objects.

## 5. Suitability

```text
surfaceVisibility = 0.18 + 0.82 * ecology.rockiness
pathSurvival = 1 - 0.90 * ecology.disturbance

suitability = clamp01(
  geologyPotential
  * surfaceVisibility
  * pathSurvival
)
```

The `0.18` floor deliberately keeps occasional partly buried meadow formations.

## 6. Raw activation

```text
densityResponse = 1 - exp(-stoneClusterDensityResponse * stoneDensity)
suitabilityResponse = smoothstep(suitability, 0.14, 0.72)

activationProbability = clamp01(
  stoneClusterChance
  * densityResponse
  * suitabilityResponse
)

rawActive = rng.fork("activation").chance(activationProbability)
```

No retry.

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

## 8. Formation direction

Strike:

```text
strike = valueNoise(
  centerX / 130,
  centerZ / 130,
  rockSeed XOR 0x5bd1e995
) * PI
```

Macro downhill uses the already-sampled 44 m landform gradient:

```text
gradientLength = hypot(landform.gradientX, landform.gradientZ)

if gradientLength >= 0.02:
    downhillAngle = atan2(-landform.gradientZ, -landform.gradientX)
else:
    downhillAngle = strike
```

Final direction:

```text
compact = strike + rng.fork("direction").signed(0.35)
ridge   = strike
scree   = downhillAngle
fan     = downhillAngle
```

Do not call `sampleNormal()` to derive macro direction.

## 9. Radius/aspect/budget

```text
radiusT = smoothstep(suitability, 0.20, 0.85)
baseRadius = lerp(stoneClusterRadiusMin, stoneClusterRadiusMax, radiusT)
majorRadius = clamp(
  baseRadius * rng.fork("radius").range(0.90, 1.10),
  stoneClusterRadiusMin,
  stoneClusterRadiusMax
)

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

budgetT = smoothstep(suitability, 0.25, 0.80)
budget = round(lerp(stoneClusterBudgetMin, stoneClusterBudgetMax, budgetT))
budget = clamp(budget, stoneClusterBudgetMin, stoneClusterBudgetMax)
```

No retry to refill members rejected later by terrain/path validation.

## 10. Deterministic conflict suppression

Required to protect negative space when two jittered active macro cells move toward one another.

```text
priorityRandom = rng.fork("priority").next()
priority = suitability * 0.82 + priorityRandom * 0.18
```

For a raw-active candidate inspect exactly the eight neighboring raw candidates.

```text
distance = hypot(centerX - neighbor.centerX, centerZ - neighbor.centerZ)

minimumSeparation = max(
  S * 0.68,
  (influenceRadius + neighbor.influenceRadius) * 0.88
)
```

If `distance < minimumSeparation`, only the higher-priority candidate survives.

Tie-break:

```text
higher priority wins
then lower gridX
then lower gridZ
```

Implementation rule:

```text
getDescriptor()
    -> getRawCandidate(self)
    -> getRawCandidate(8 neighbors)
    -> conflict suppression
```

`getRawCandidate()` must never call `getDescriptor()`.

## 11. Cell broad phase

For a 16 m stone-cell AABB:

```text
dx = max(minX - centerX, 0, centerX - maxX)
dz = max(minZ - centerZ, 0, centerZ - maxZ)
```

Skip when:

```text
dx*dx + dz*dz > influenceRadius*influenceRadius
```

Required order:

```text
lookup descriptor
-> inactive? skip
-> broad-phase miss? skip
-> resolve/cache whole formation
-> filter roots to cell
```

Never resolve all neighboring formation members before the broad phase.

---

# Exact Algorithm — Formation Composition

## Roles

```text
anchorCount = 1
secondaryCount = clamp(floor((budget - 1) * 0.35), 1, 2)
debrisCount = budget - anchorCount - secondaryCount
```

Examples:

```text
4 -> 1 anchor + 1 secondary + 2 debris
6 -> 1 anchor + 1 secondary + 4 debris
8 -> 1 anchor + 2 secondary + 5 debris
```

Member `0` is always the anchor.

## Normalized zones

```text
core = stoneClusterCoreRatio
shoulder = stoneClusterShoulderRatio
halo = stoneClusterHaloRatio
```

World transform:

```text
dirX = cos(direction)
dirZ = sin(direction)
perpX = -dirZ
perpZ = dirX

worldX = centerX + dirX * (u * majorRadius) + perpX * (v * minorRadius)
worldZ = centerZ + dirZ * (u * majorRadius) + perpZ * (v * minorRadius)
```

Anchor:

```text
compact/ridge:
  u = signed(0.06)
  v = signed(0.06)

scree/fan:
  u = -0.16 + signed(0.04)
  v = signed(0.05)
```

Secondary radius:

```text
r = lerp(core * 0.55, shoulder * 0.92, random.next())
```

Debris radius:

```text
t = sqrt(random.next())
r = lerp(core, halo, t)
```

## Compact

Use golden-angle progression instead of independent random angles:

```text
phase = clusterRandom.fork("composition-phase").range(0, 2*PI)
angle = phase + memberIndex * GOLDEN_ANGLE + random.signed(0.28)
u = cos(angle) * r
v = sin(angle) * r
```

## Ridge

```text
side = memberIndex % 2 == 0 ? 1 : -1
u = side * r

secondary: v = random.signed(0.18 * r)
debris:    v = random.signed(0.34 * r)
```

## Scree

Positive `u` is downhill.

```text
secondary:
  u = r
  v = random.signed(r * lerp(0.16, 0.30, r / halo))

debris:
  u = r
  v = random.signed(r * lerp(0.22, 0.48, r / halo))
```

## Fan

```text
secondary:
  u = r
  v = random.signed(r * lerp(0.24, 0.46, r / halo))

debris:
  u = r
  v = random.signed(r * lerp(0.32, 0.68, r / halo))
```

After process placement:

```text
u += random.fork("jitter-u").signed(0.035)
v += random.fork("jitter-v").signed(0.035)
```

Do not sample another world-noise field per member.

---

# Archetype Family Rules

Keep all six archetypes. Improve context instead of adding more meshes.

Anchor order:

```text
pebble, boulder, slab, block, shard, outcrop
```

Biome multipliers for anchors:

```text
meadow: 0.0, 1.20, 1.15, 0.65, 0.15, 0.75
steppe: 0.0, 1.00, 1.15, 1.05, 0.75, 0.95
alpine: 0.0, 0.85, 1.00, 1.10, 1.20, 1.25
```

Process multipliers:

```text
compact:
  no additional multiplier

ridge:
  slab *= 1.35
  outcrop *= 1.35
  boulder *= 0.70

scree:
  shard *= 1.25
  outcrop *= 1.15

fan:
  boulder *= 1.25
  slab *= 1.10
  shard *= 0.75
  outcrop *= 0.70
```

Secondary families:

| Anchor | Secondary weights |
|---|---|
| `boulder` | boulder 0.55, slab 0.20, block 0.15, shard 0.10 |
| `slab` | slab 0.50, block 0.20, boulder 0.20, shard 0.10 |
| `block` | block 0.50, shard 0.20, boulder 0.20, slab 0.10 |
| `outcrop` | block 0.35, shard 0.30, slab 0.20, boulder 0.15 |
| `shard` | shard 0.50, block 0.25, boulder 0.15, slab 0.10 |

Debris families:

| Anchor | Debris weights |
|---|---|
| `boulder` | pebble 0.70, boulder 0.30 |
| `slab` | pebble 0.55, slab 0.25, shard 0.20 |
| `block` | pebble 0.45, block 0.30, shard 0.25 |
| `outcrop` | pebble 0.35, shard 0.35, block 0.30 |
| `shard` | pebble 0.45, shard 0.55 |

Apply biome modifiers before final weighted selection.

---

# Scale, Variant, and Orientation Hierarchy

## Anchor scale

For selected archetype scale band `[min,max]`:

```text
anchorScale = lerp(min, max, random.range(0.62, 0.92))
```

Rare landmark boulder only when:

```text
role == anchor
archetype == boulder
suitability >= 0.70
random.chance(0.06)
```

Keep the existing multiplier `1.7 .. 2.4`.

## Secondary scale

```text
normalizedRadius = min(1, abs(r) / halo)
radialScale = lerp(0.70, 0.46, normalizedRadius)
desired = anchorScale * radialScale * random.range(0.90, 1.08)
secondaryScale = clamp(
  desired,
  max(0.30, selectedBandMin * 0.45),
  selectedBandMax * 0.82
)
```

## Debris scale

```text
normalizedRadius = min(1, abs(r) / halo)
radialScale = lerp(0.36, 0.16, normalizedRadius)
desired = anchorScale * radialScale * random.range(0.85, 1.15)
debrisScale = clamp(desired, 0.22, selectedBandMax * 0.55)
```

## Variant non-repetition

For each archetype maintain a small used-index list within the formation.

```text
start = random.fork("variant").integer(0, variantCount - 1)

for attempt = 0 .. variantCount - 1:
    index = (start + attempt) % variantCount
    if unused for this archetype:
        use index
        break
```

If all are used, fall back to `start`.

No random retry loop.

## Yaw

Role spread:

```text
anchor    0.00
secondary 0.10
debris    0.28
```

Archetype rules:

```text
outcrop: strike + signed(0.18 + roleSpread)
slab:    strike + signed(0.22 + roleSpread)
block:   strike + signed(0.28 + roleSpread)
boulder: axisLerp(strike, direction, 0.35) + signed(0.42 + roleSpread)
shard:   direction + signed(0.38 + roleSpread)
pebble:  random.range(0, PI)
```

Implement `axisLerp()` with `PI` periodicity.

---

# Cluster Color and Weathering DNA

Resolve once per cluster:

```text
valueBase = rng.fork("value-base").range(0.97, 1.03)
mossBias = rng.fork("moss-bias").range(0.90, 1.10)
```

For meadow palette choice:

```text
mossyChance = clamp01(
  0.10
  + ecology.moisture * 0.22
  - ecology.exposure * 0.08
)
```

Choose `mossy` once per formation when the center is sufficiently damp instead of independently per member.

Per member:

```text
valueScale = clamp(
  valueBase + memberRandom.fork("value").signed(0.015),
  0.92,
  1.06
)
```

Environment moss:

```text
altitudeFade =
  smoothstep(height, grassMinAltitude - 4, grassMinAltitude + 10)
  *
  (1 - smoothstep(height, grassMaxAltitude - 45, grassMaxAltitude + 5))

moisture = smoothstep(ecology.moisture, 0.16, 0.72)
shadeRetention = lerp(1.12, 0.78, ecology.exposure)
drainage = lerp(1.00, 0.72, ecology.rockiness)

mossBase = clamp01(
  moisture * shadeRetention * drainage * altitudeFade
)

environmentMoss = clamp01(
  mossBase
  * mossBias
  * memberRandom.fork("moss").range(0.95, 1.05)
)
```

Keep `StoneGrowthField` and `StoneGrowthShader` unchanged. They continue to handle face susceptibility, exposure, lichen competition, and close-range colony breakup.

---

# Final Terrain Validation, Grounding, and Overlap

`StoneClusterComposition` describes intent. `StoneField` decides whether that member can physically exist.

Resolve in member-index order.

For each member:

1. transform `(u,v)` to world root;
2. reject outside world margin;
3. sample actual height;
4. sample actual local normal;
5. preserve `SLOPE_REJECT_NY`;
6. resolve variant and actual footprint;
7. preserve footprint-aware path rejection;
8. perform at most one overlap correction;
9. compute sink/tilt/clearance;
10. append `StoneInstance`.

If anchor `0` fails, reject the entire formation.

## One-pass overlap correction

```text
minimumDistance =
  0.78 * (candidateFootprint + existingFootprint)
  + 0.12
```

When overlapping:

```text
push = normalize(candidatePosition - existingPosition)
needed = minimumDistance - currentDistance + 0.04
candidate += push * needed
```

Then exactly once:

- resample terrain;
- resample normal;
- rerun path validation;
- recheck accepted member overlaps.

Reject if still invalid.

No second correction pass.

## Role-aware sink

```text
pebble debris: embedMultiplier = 1.25
anchor:        embedMultiplier = 1.08
secondary:     embedMultiplier = 1.03
other debris:  embedMultiplier = 1.00

sink =
  variant.metrics.embed
  * variant.metrics.height
  * scale
  * embedMultiplier
  + (1 - normal.y) * 0.55 * scale
```

## Role-aware grass clearance

```text
contact = variant.metrics.contactRadius * scale

if scale < 0.50:
  clearRadius = 0
else if anchor:
  clearRadius = contact * 0.88 + 0.08
else if secondary:
  clearRadius = contact * 0.72 + 0.06
else if debris and scale < 0.70:
  clearRadius = 0
else:
  clearRadius = contact * 0.45
```

This is deliberate: small stones should often be partly hidden by grass.

---

# Split Masses

Keep the existing broken-boulder/block concept but make it budget-safe.

Rules:

1. only anchor `boulder` or `block` may split;
2. keep split chance `0.28`;
3. both halves use the same variant;
4. both halves use shared palette/value/moss DNA;
5. successful split consumes the first secondary slot;
6. if the half fails validation, generate the normal secondary for that slot;
7. total member candidates never exceeds descriptor budget.

Keep:

```text
breakAngle = strike + PI/2 + signed(0.35)
gap base = 0.08 .. 0.30 m + footprint separation
```

---

# Singleton Algorithm

Only evaluate when the 16 m stone cell intersects **no final active cluster halo**.

```text
singletonSuitability =
  geologyPotential
  * (0.25 + 0.75 * ecology.rockiness)

singletonProbability =
  stoneSingletonChance
  * lerp(0.35, 1.0, singletonSuitability)
```

One roll only.

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

Remove the current high-rate `FIELD_STONE_CHANCE` fallback.

---

# Path Verge Algorithm

`addVergeStones()` remains separate because it represents human disturbance rather than geology.

Keep existing:

- path-distance sampling;
- tangent derivation;
- footprint-aware tread clearance;
- bounded verge stepping;
- small family selection;
- path-aligned yaw;
- overlap check.

Change its regional input to:

```text
regionalStonePotential =
  0.45 * geologyPotential
  + 0.55 * ecology.rockiness

chance = stoneVergeChance
       * (0.35 + 0.65 * regionalStonePotential)
```

Do not add any other path-edge spawn path.

---

# Restrained Shape Pass — Only After Distribution

Do not mix mesh tuning into macro-distribution debugging.

## `StoneShapeQuality.ts`

Add an isolated silhouette-spike penalty.

For every footprint side:

```text
neighborMean = (previousRadius + nextRadius) * 0.5
spike = abs(currentRadius - neighborMean) / meanRadius
```

Free thresholds:

```text
pebble   0.12
boulder  0.16
slab     0.18
block    0.24
shard    0.34
outcrop  0.22
```

```text
excess = max(0, spike - threshold)
spikePenalty = average(excess)
score -= spikePenalty * 3.2
```

Keep best-of-four selection.

## `StoneRecipe.ts`

Initial comparison values only after gallery screenshots.

Boulder:

```text
radiusJitter        0.14 .. 0.24
silhouetteAsymmetry 0.08 .. 0.15
cutCount            1 .. 2
cutDepth            0.06 .. 0.13
sideCount           keep 10 .. 12
```

Slab:

```text
topScale    0.76 .. 0.92
heightRatio 0.36 .. 0.52
embed       0.26 .. 0.40
```

Outcrop:

```text
heightRatio 0.38 .. 0.58
depthRatio  1.15 .. 1.75
embed       0.32 .. 0.48
```

Keep pebble/block/shard geometry initially. Keep `stoneGrainStrength: 0`.

---

# Caching and Allocation Guidelines

Use bounded deterministic caches:

```text
raw candidate cache:       512
descriptor cache:          512
resolved cluster cache:    256
stone-cell cache:          keep current policy
variant cache:             keep current policy
```

At capacity:

```text
trim oldest-first to approximately 60%
```

Eviction must only change recomputation frequency.

## Allocation rules in hot build paths

- reuse `TerrainLandform`, hydrology, ecology, normal, and path scratch objects;
- do not create `Vector2`/`Vector3` per candidate/member;
- descriptors/member specs should be plain small objects created only on cache miss/formation resolution;
- no arrays with unbounded growth;
- member arrays reserve/implicitly remain bounded by `stoneClusterBudgetMax`;
- use squared distances until a true distance is needed for correction;
- do circle/AABB broad phase before member resolution;
- do not stringify coordinates in inner loops if a packed numeric key is practical and readable;
- never perform mesh generation per placed stone; continue using archetype/variant cache;
- do not add per-member noise octaves beyond the specified labeled random jitter.

---

# Deterministic Performance Baseline

Before changing `StoneField` placement behavior:

```bash
npm run capture:stone-baseline
```

Commit the resulting:

```text
qa/stones/stone-performance-baseline.json
```

The baseline must be generated from the current pre-change `main` code and current `public/config/world.yaml`.

Use fixed domain:

```text
chunkX = -6 .. 6
chunkZ = -6 .. 6
```

Record:

```text
total roots includeSmall=true
total roots includeSmall=false
max roots in one chunk
representative detailed triangles
representative coarse triangles
```

Do not record:

```text
performance.now()
CPU milliseconds
GPU milliseconds
FPS
timestamp
host name
```

Those values are not deterministic.

After macro implementation, `StoneClusterPerformanceVerification` must require:

```text
representative roots <= frozen baseline
representative triangles <= frozen baseline
```

If the new visual result genuinely requires more geometry, change the design first. Do not casually raise the baseline.

A baseline increase requires an explicit documented reason and manual visual/performance approval.

---

# Deterministic Verification — Exact Tests

Add these to `StoneClusterVerification.ts` and `StoneClusterPerformanceVerification.ts`.

Use the real shipped YAML and production classes through the existing Vite SSR verifier path.

## Fixed macro domain

```text
gx = -18 .. 18
gz = -18 .. 18
```

This is `1369` potential macro cells.

## A. Raw candidate determinism

Construct two independent `TerrainField` + `StoneClusterField` graphs with identical config.

Require canonical equality for all 1369 raw candidates.

## B. Final descriptor determinism

Require canonical equality after conflict suppression.

## C. Query-order independence

Query in:

1. row-major;
2. reverse row-major;
3. deterministic shuffled order.

Require identical descriptor strings.

## D. Cache-eviction independence

Query enough coordinates to exceed raw/descriptor cache limits, then re-query the original fixed set.

Require exact equality.

## E. Conflict invariant

For every neighboring pair of final active descriptors:

```text
distance >= production minimumSeparation
```

## F. Budget invariant

For every active formation:

```text
memberSpecs.length <= descriptor.budget
resolvedInstances.length <= descriptor.budget
```

## G. Anchor invariant

Every non-empty resolved formation:

```text
member 0 role == anchor
exactly one anchor
```

If anchor validation fails, resolved formation is empty.

## H. Split-budget invariant

A successful split consumes the first secondary slot and cannot make the candidate count exceed budget.

## I. Variant uniqueness

If occurrences of one archetype in a formation are `<= stoneVariantsPerArchetype`, all its `variantIndex` values must be unique.

## J. Cell ownership

Every final root maps to exactly one 16 m stone cell by final world root coordinate.

Collecting neighboring chunks must not duplicate roots.

## K. Query complexity

For every sampled 16 m cell:

```text
macro descriptor coordinates considered <= 9
```

For every final descriptor:

```text
conflict neighbors considered <= 8
```

Prefer testing the pure neighbor-enumeration functions used by production code rather than maintaining a second copy of the math in the verifier.

## L. Cold-chunk descriptor bound

For all possible phase alignments of a 64 m terrain chunk against the 56 m macro lattice, require:

```text
unique macro descriptors touched <= 25
```

This is a deterministic geometry bound, not a timing test.

## M. Overlap pass invariant

Production overlap resolution exposes/uses a helper that performs at most one correction. Verify a deliberately overlapping test formation cannot loop or perform a second movement.

Do not add a runtime counter just for this test; test the pure correction function directly.

## N. Path contract

No accepted non-pebble geological member may overlap the protected tread according to the existing footprint-aware path test.

## O. No lattice lock sanity test

Across active descriptors:

- center offsets are not all identical;
- roots are not quantized to 16 m boundaries;
- roots are not quantized to 64 m boundaries.

Do not turn this into a fragile statistical beauty test.

## P. Far-small-stone contract

For every fixed test chunk:

```text
collectChunkInstances(..., false) roots
```

must be a subset of:

```text
collectChunkInstances(..., true) roots
```

and every removed root must be below the existing small-stone cutoff.

## Q. Deterministic count baseline

Using `qa/stones/stone-performance-baseline.json`:

```text
total roots <= baseline roots
max roots/chunk <= baseline max unless a cluster concentrates roots while total still falls
representative detailed triangles <= baseline
representative coarse triangles <= baseline
```

For `max roots/chunk`, allow a small explicitly documented cluster concentration tolerance if needed, because clustering intentionally concentrates roots. Total roots and triangles remain hard non-increase gates.

## R. Existing renderer performance contracts

Do not duplicate these tests. Continue running:

- `StoneRenderPerformanceVerification.ts`;
- `StoneSystemPerformanceVerification.ts`;
- `StoneShaderPerformanceVerification.ts`;
- existing runtime/geometry/growth verification.

They already own batching, packed vertex streams, detail footprint, shader cost contracts, and production draw layout.

---

# Canonical Serialization for Determinism Tests

Serialize candidate/descriptor/member fields in a fixed order.

Quantize only floating-point values derived from terrain/trigonometry:

```text
position / height / radius 1e-4
angles                     1e-6
scale / moss / value       1e-6
```

Keep integers/enums exact.

Use a local FNV-1a 32-bit helper only for compact output reporting.

Equality uses canonical strings, not hashes, so a collision cannot hide a failure.

No hashing dependency.

---

# Manual Performance Acceptance

Deterministic tests protect algorithmic cost. Manual tests protect real frame behavior.

Run the normal game, not only the static stone-world probe, because the production streamer applies real frame deadlines.

Desktop target:

```text
stone build slice p95 <= 2.00 ms
no repeated > 4 ms stone spikes during normal traversal
queue drains after crossing a terrain chunk
no sustained stone queue growth
```

Compact target:

```text
stone build slice p95 <= 1.25 ms
no sustained queue growth
no increase in production draw-count contract
```

If deterministic complexity/count tests pass but timings fail on one machine:

1. profile first;
2. check cache misses and duplicated terrain/ecology sampling;
3. check member-resolution broad-phase order;
4. check accidental allocations;
5. do not raise render radius or frame budget;
6. do not weaken deterministic gates before finding the regression.

---

# Performance Tuning Order

If the implementation is too expensive, change art controls in this order:

```text
1. reduce stoneSingletonChance
2. reduce stoneClusterBudgetMax
3. reduce stoneClusterChance
4. reduce stoneDensity
5. reduce stoneClusterRadiusMax if large formations resolve too often
```

Do **not** first reduce visual quality by changing geometry detail radius or renderer packing.

If the world is visually too empty:

```text
1. raise stoneClusterChance slightly
2. raise stoneDensity slightly
3. raise densityResponse if eligible areas are too sparse
4. only then consider budget
```

If the world becomes a rock carpet:

```text
1. lower singleton chance
2. increase spacing
3. reduce radius/halo
4. lower cluster chance
5. keep conflict suppression enabled
```

If formations look too uniform:

```text
adjust center jitter / aspect range / spacing
```

Do not add more members merely to create variety.

---

# Exact Local Test Commands

After each implementation pass run the narrow gate first:

```bash
npm run test:stones
```

When config fields change:

```bash
npm run test:config
npm run test:stones
```

When stone-world tooling changes:

```bash
npm run test:stone-tools
```

Before considering the work complete:

```bash
npm run test:config
npm run test:stones
npm run test:stone-tools
npm run build
```

Manual visual test:

```bash
npm run dev
```

Then use reproducible `stone-world.html` URLs copied from the tuning menu.

After manual acceptance only, deployment remains the existing manual path:

```bash
npm run deploy:pages
```

No GitHub Actions are required or added.

---

# Visual QA Matrix

Capture before/after views at fixed locations.

At minimum:

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
close moss formation
wide world view
```

For each view verify:

- empty ground is common and intentional;
- one dominant mass is readable;
- secondaries do not visually compete with anchor;
- debris generally gets smaller away from source;
- members share family resemblance;
- meadow shards are rare;
- ridge members share strike;
- scree/fan follows macro downhill, not micro-normal noise;
- no 16 m, 56 m, or 64 m grid is visible;
- bases look buried;
- small debris can disappear partly into grass;
- grass clearances are not identical circles;
- weathering reads as shared microclimate;
- no chunk-border duplicate or discontinuity appears;
- near/coarse LOD preserves the same formation identity.

The existing `qa/aaa-look` fixed viewpoints should be reused where they cover meadow, dry, alpine, rocky, path edge, and water edge scenes rather than inventing unrelated camera locations.

---

# Implementation Order

## Pass 0 — Freeze baseline

Before changing placement behavior:

1. add `scripts/capture-stone-performance-baseline.mjs`;
2. add `capture:stone-baseline` package script;
3. run it on current `main`;
4. commit `qa/stones/stone-performance-baseline.json`;
5. capture current fixed visual QA screenshots;
6. record current stone-world diagnostics.

Do not invent target counts.

## Pass 1 — Configuration and macro field

Implement:

- `StoneClusterTypes.ts`;
- `StoneClusterTuning.ts`;
- `StoneClusterField.ts`;
- config interface/schema/validator/YAML fields;
- raw activation;
- process classification;
- landform-derived downhill;
- conflict suppression;
- deterministic descriptor verification.

No renderer or mesh changes.

## Pass 2 — Composition

Implement `StoneClusterComposition.ts`:

- roles;
- process geometry;
- golden-angle compact layout;
- family tables;
- biome/process modifiers;
- size hierarchy;
- variant non-repetition;
- orientation hierarchy;
- cluster DNA;
- split slot ownership.

## Pass 3 — `StoneField` integration

Replace independent ordinary placement with:

```text
fixed macro query
-> broad phase
-> cached whole-formation resolution
-> cell ownership filtering
-> singleton fallback
-> existing path verge
```

Remove:

```text
FIELD_STONE_CHANCE
generic parent satellites
recursive near-path satellite spawning
```

Preserve final path/world/slope validation.

## Pass 4 — Grounding/ecology

Add:

- role-aware sink;
- role-aware grass clearance;
- ecology-driven formation moss base;
- cluster-level mossy palette choice.

Do not change growth shaders.

## Pass 5 — Deterministic performance gates

Add:

- `StoneClusterPerformanceVerification.ts`;
- baseline comparison;
- complexity-bound tests;
- far-small-stone contract;
- `verify-stones.mjs` integration.

Run full stone gate before shape tuning.

## Pass 6 — Stone-world tuner

Add:

- `StoneClusterTuningMenu.ts`;
- `StoneWorldProbeController.ts`;
- `stone-world.css`;
- refactored `tools/stone-world/main.ts`;
- HTML stylesheet link;
- YAML export;
- reproducible probe URL;
- read-only diagnostics.

Do not add lil-gui/dat.gui.

## Pass 7 — Optional shape pass

Only after distribution is visually accepted:

1. add silhouette-spike scoring;
2. compare gallery captures;
3. apply restrained boulder/slab/outcrop recipe tuning if the captures justify it;
4. rerun all existing geometry/topology/profile verifiers.

## Pass 8 — Final acceptance

Run:

```text
config verification
stone verification
stone-tool TypeScript verification
full production build
manual desktop traversal
manual compact traversal
fixed visual QA matrix
```

Deploy manually only after acceptance.

---

# Definition of Done

The work is complete only when all are true:

1. ordinary stones are formation-driven rather than independently scattered by 16 m cells;
2. quiet areas contain meaningful negative space;
3. compact/ridge/scree/fan formations are visually distinct;
4. formations have clear anchor/secondary/debris hierarchy;
5. nearby members look geologically related;
6. meadow strongly favors softer boulder/slab/pebble language;
7. sharp shards are contextual;
8. macro downhill uses the existing landform gradient;
9. neighboring jittered formations cannot merge into an accidental carpet;
10. small stones nestle into grass;
11. weathering agrees with shared ecology;
12. descriptor/member results survive query-order changes and cache eviction;
13. fixed neighborhood and budget complexity limits pass deterministically;
14. fixed-domain root count does not exceed the frozen pre-change baseline;
15. fixed-domain representative triangles do not exceed the frozen pre-change baseline;
16. existing 49-draw desktop production contract remains intact;
17. detailed/coarse draw split remains 9/40;
18. compact batching remains within the existing renderer verifier contract;
19. normal-frame cluster cost remains zero;
20. stone render radii remain unchanged;
21. no new textures/materials/runtime GUI dependencies are added;
22. `npm run test:stones`, `npm run test:stone-tools`, and `npm run build` pass;
23. manual desktop/compact build slices remain within their existing reserves;
24. deployment remains manual GitHub Pages with no GitHub Actions.

The expected result is a **smarter formation generator producing fewer, better-related stones**, not a more expensive renderer.