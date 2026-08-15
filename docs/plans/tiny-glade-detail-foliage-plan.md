# Tiny Glade-Inspired Detail Foliage Plan

## Status

- Target branch: `main`
- Scope: small bushes, flowers, ferns, broadleaf plants, seed heads, distribution, clustering, variety, deterministic verification, tuning, and performance protection
- Renderer: preserve the existing detail-foliage atlas/material/instancing architecture
- Runtime dependencies: no new dependencies
- Deployment: manual GitHub Pages deployment; no GitHub Actions
- Principles: KISS, SOLID, deterministic, bounded, allocation-light, configuration-backed, no per-frame procedural generation

## Objective

Make the existing detail-foliage layer read like small authored plant communities rather than an even decorative scatter.

Target hierarchy:

```text
glade
    -> colony
        -> clump
            -> individual plant
```

Target visual rhythm:

```text
quiet grass
    -> coherent daisy pocket
    -> quiet grass
    -> fern/broadleaf pocket beside stone
    -> low shrub anchor
    -> quiet grass
    -> sparse seed-head patch
```

The improvement must come from **correlation, silhouette variety, ecology, and negative space**, not from adding more rendered cards.

---

# Final Architecture Decisions

These decisions should not be re-litigated during implementation unless a deterministic verifier proves a technical problem.

1. Keep one detail-foliage atlas.
2. Keep one detail-foliage material.
3. Keep exactly eight species slots.
4. Keep two atlas phenotype rows.
5. Keep the existing six-vertex instanced card topology.
6. Keep 16 m detail-foliage tiles.
7. Keep the current fade/residency distances.
8. Keep detail foliage non-shadow-casting/non-shadow-receiving.
9. Keep colony/composition work build-time-only.
10. Do not use Poisson-disc placement, neighbor searches, physics, relaxation, or simulation.
11. Do not add colony instance attributes. Resolve all colony decisions into existing matrix scale and packed metadata.
12. Keep candidate density at or below 0.35/m².
13. Replace redundant species instead of increasing the shader species ceiling.
14. Use the existing flat numeric `world.yaml` contract; do not introduce another config system.
15. Use the existing diagnostics-only native DOM GUI style; do not add `lil-gui` or `dat.gui`.

---

# Non-Negotiable Performance Contract

```text
new normal-frame distribution work                 0
new materials                                      0
new runtime textures                               0
new normal draw-call classes                       0
new accent shadows                                 0
new required instance attributes                   0
render-radius increase                             0
physics/Poisson/relaxation                         0
unbounded loops                                    0
species ceiling                                    8
atlas size increase                                0
production density                                 <= 0.35 / m²
production candidates per 16 m tile                <= 90
detail tiles built per frame                       1
average rendered detail cards                      <= current baseline
```

Current reference envelope remains the workload ceiling unless deliberately tightened after implementation:

```text
reference resident cards           ~1,890
reference drawn cards              ~1,488
reviewed worst-case cards           <= 2,070
reviewed detail draws               <= 22
reviewed detail vertices            <= 12,420
vertices per card                   6
```

Wall-clock milliseconds are manual profiling data, not deterministic build gates.

## Candidate-loop budget

For a candidate that has already survived existing terrain/path/stone rejection:

```text
new value-noise fields                         2
lattice corners per field                      4
new lattice-coordinate hashes total            8
new terrain samples                            0
new hydrology samples                          0
new ecology samples                            0
new heap allocations                           0
neighbor queries                               0
```

A lattice hash may be integer-scrambled into several semantic channels after it is computed. That is allowed; do not perform additional world samples to obtain family/tint/age fields.

---

# Exact Species Set

Keep `GRASS_MAX_ACCENT_SPECIES = 8`.

Use exactly:

```text
index 0  grass-tuft
index 1  low-shrub              replaces tall-tuft
index 2  fern
index 3  small-fern
index 4  daisy
index 5  round-bloom
index 6  seed-head
index 7  broadleaf-rosette      replaces sprig
```

Rationale:

- `tall-tuft` overlaps with normal grass and seed-head silhouettes;
- `sprig` is another narrow vertical green form;
- a shrub adds the missing medium-width mass;
- a rosette adds the missing low/wide plant mass;
- replacing instead of adding keeps atlas/material/uniform budgets unchanged.

## Accent categories

Expand the TypeScript-only category union to:

```ts
type GrassAccentCategory =
  | "tuft"
  | "shrub"
  | "fern"
  | "broadleaf"
  | "flower"
  | "seed";
```

This has no shader cost. Do not classify shrubs as ferns merely to avoid adding a semantic enum value.

---

# Exact Distribution Algorithm

## New file

`src/world/grass/WorldDetailFoliageDistribution.ts`

This file owns only deterministic spatial composition.

It must not import Three.js, renderer classes, scene objects, materials, terrain samplers, hydrology, or ecology.

## Public API

```ts
export interface DetailFoliageDistributionSample {
  colony: number;
  clump: number;
  core: number;
  keepMultiplier: number;
  familyRoll: number;
  tintRoll: number;
  maturityRoll: number;
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

`sample()` must allocate nothing.

## Hash

Use the same integer style already used by grass code:

```ts
function latticeHash(x: number, z: number, seed: number): number {
  let value = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}
```

Use fixed source salts, not YAML, because changing salts changes world identity rather than art tuning.

Suggested domains:

```ts
const COLONY_SALT = 0x6d2b79f5;
const CLUMP_SALT = 0x1b873593;
const CHANNEL_FAMILY_SALT = 0x9e3779b9;
const CHANNEL_TINT_SALT = 0x85ebca6b;
const CHANNEL_MATURITY_SALT = 0xc2b2ae35;
```

The exact salts may differ during implementation, but once shipped they become deterministic world identity and must be protected by the golden digest.

## Multi-channel corner values

Do **not** sample four separate macro noises for presence/family/tint/maturity.

At each lattice corner:

1. calculate one `latticeHash()`;
2. derive multiple `[0,1)` channels from that integer with fixed integer scramblers;
3. interpolate each channel using the same cubic interpolation weights.

Example channel scrambler:

```ts
function channel01(hash: number, salt: number): number {
  let value = hash ^ salt;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  value = (value ^ (value >>> 16)) >>> 0;
  return value / 4294967296;
}
```

Macro field channels:

```text
channel 0 -> colony presence
channel 1 -> dominant-family roll
channel 2 -> colony tint roll
channel 3 -> colony maturity roll
```

Clump field needs only one interpolated channel.

This keeps the expensive spatial lookup to exactly eight lattice-coordinate hashes per candidate: four macro corners + four clump corners.

## Value-noise interpolation

For a field world size `S`:

```text
u = x / S
v = z / S
ix = floor(u)
iz = floor(v)
fx = u - ix
fz = v - iz
wx = fx² * (3 - 2fx)
wz = fz² * (3 - 2fz)
```

Bilinearly interpolate the four corner channel values using `wx` and `wz`.

Do not use sine noise. Do not add additional octaves.

## Scales

```text
macro scale = detailFoliageColonyWorldSize
clump scale = detailFoliageClumpWorldSize
```

Shipped starting values:

```text
macro = 9 m
clump = 2.25 m
```

The sampler receives world coordinates only. It never receives `tileX` or `tileZ`; therefore a 16 m tile border cannot reset a colony.

## Shape equations

Let:

```text
M = macro presence channel in [0,1]
C = clump channel in [0,1]
Q = quietZoneThreshold
S = colonyStrength
B = backgroundSuppression
```

Use:

```text
macroBand = smoothstep(Q, min(1, Q + 0.40), M)
clumpBand = smoothstep(0.28, 0.72, C)
structured = macroBand * (0.60 + 0.40 * clumpBand)
core = mix(0.5, structured, S)
structuredKeep = mix(1 - B, 1, structured)
keepMultiplier = mix(1, structuredKeep, S)
```

Clamp outputs to `[0,1]`.

Properties:

- `colonyStrength = 0` approximately disables distribution suppression;
- quiet areas retain some rare accents instead of becoming perfectly empty;
- colony cores never gain more than the original candidate population because `keepMultiplier <= 1`;
- clump noise redistributes visual density inside macro patches without increasing candidate density.

Set:

```text
sample.colony = macroBand
sample.clump = clumpBand
sample.core = core
sample.keepMultiplier = keepMultiplier
sample.familyRoll = macro family channel
sample.tintRoll = macro tint channel
sample.maturityRoll = macro maturity channel
```

Do not derive family/tint from the tile PRNG. Those signals must be continuous world-space fields.

---

# Exact Candidate Acceptance

## File

`src/world/grass/WorldDetailFoliageField.ts`

Keep the existing stratified candidate generation. Do not replace it with another point-placement algorithm.

Candidate count:

```ts
requested = Math.max(
  1,
  Math.round(DETAIL_FOLIAGE_TILE_SIZE ** 2 * tuning.density),
);
```

At 16 m and 0.35/m² this is exactly 90 candidates.

## Required evaluation order

```text
1  stratified candidate x/z
2  terrain height
3  suitabilityWithoutSlope hard reject
4  path hard mask reject
5  stone hard-clearance reject
6  terrain normal / slope suitability reject
7  biome sample/profile
8  existing ecology sample
9  existing GrassHabitatSample
10 existing accentChance minimum gate
11 existing biome accentDensity gate
12 distribution.sample(x,z)
13 distribution keep hash gate
14 species/affinity resolution
15 tint resolution
16 height/phenotype resolution
17 matrix/packed instance data
```

Do not call the new value-noise sampler before step 12.

## Distribution keep gate

Use one stable world-position hash:

```ts
const keepRoll = positionHash01(x, z, DETAIL_KEEP_SALT);
if (keepRoll >= distribution.keepMultiplier) {
  continue;
}
```

Use the existing centimetre-style world-position quantization convention where appropriate so rebuilds remain stable.

This gate only removes candidates; it never creates extra candidates.

---

# Exact Ecology and Species Algorithm

## New file

`src/world/grass/DetailFoliageAffinity.ts`

This file owns species habitat scores, colony dominance, compatibility, and tint resolution.

No renderer imports.

## Pre-resolve profile data

Modify `src/grass/biome/GrassBiomeProfile.ts` so each validated accent entry contains:

```ts
export interface GrassBiomeAccentSpecies {
  species: string;
  speciesIndex: number;
  tint: string;
  tintRow: number;
  weight: number;
}
```

Resolve `speciesIndex` and `tintRow` once during profile loading.

`WorldDetailFoliageField.ts` must no longer call `GRASS_ACCENT_SPECIES.find()` or `resolveGrassAccentTintRow()` from candidate weighting loops.

## Preference helper

Use a soft triangular preference:

```ts
function preference(
  value: number,
  target: number,
  tolerance: number,
): number {
  return clamp01(1 - Math.abs(value - target) / tolerance);
}
```

Habitat score is a weighted average, not a product, so one imperfect dimension does not zero a species:

```text
raw = weightedMean(preference_i)
habitatScore = 0.15 + 0.85 * raw
```

The 0.15 floor prevents hard ecological borders. Hard safety is still handled by terrain/path/stone placement masks.

## Static species habitat table

Keep this as a source constant in `DetailFoliageAffinity.ts`; it defines species meaning, not user art tuning.

Recommended starting targets:

| Species | Moisture target/tol | Fertility target/tol | Exposure target/tol | Rockiness target/tol | Disturbance target/tol |
| --- | --- | --- | --- | --- | --- |
| grass-tuft | .50/1.00 | .50/1.00 | .50/1.00 | .50/1.00 | .40/1.00 |
| low-shrub | .55/.55 | .65/.50 | .55/.55 | .35/.55 | .10/.35 |
| fern | .82/.42 | .55/.60 | .25/.45 | .45/.55 | .05/.25 |
| small-fern | .72/.50 | .52/.65 | .30/.50 | .60/.45 | .10/.35 |
| daisy | .55/.55 | .75/.42 | .65/.50 | .25/.60 | .10/.40 |
| round-bloom | .58/.52 | .68/.48 | .55/.55 | .20/.55 | .10/.40 |
| seed-head | .22/.45 | .35/.65 | .80/.45 | .50/.65 | .25/.60 |
| broadleaf-rosette | .72/.45 | .80/.38 | .35/.50 | .20/.50 | .08/.30 |

Suggested importance weights:

```text
moisture      1.0
fertility     1.0
disturbance   1.2
exposure      0.7
rockiness     0.7
```

Species may override one importance where obvious, but avoid a separate tuning parameter for every number.

## Ecology strength

For each biome accent entry:

```text
baseWeight = profileEntry.weight
ecoWeight = habitatScore(species, ecology)
weight = baseWeight * mix(1, ecoWeight, detailFoliageEcologyStrength)
```

All weights must remain finite and non-negative.

## Environmental fringe signals

The hard path and stone masks remain authoritative.

After a candidate has survived them, derive cheap soft fringe signals from the already-known masks:

```text
pathFringe = 4 * pathMask * (1 - pathMask)
stoneFringe = 4 * stoneMask * (1 - stoneMask)
```

Clamp to `[0,1]`.

These peak in transition bands and go to zero both at the rejected core and far from the feature.

Apply only to species weighting, never placement safety.

Starting behavior:

```text
fern/small-fern/broadleaf:
    weight *= 1 + stoneFringeStrength * edgeCompanionStrength * stoneFringe

low-shrub:
    weight *= 1 + 0.5 * stoneFringeStrength * edgeCompanionStrength * stoneFringe

daisy/round-bloom:
    weight *= 1 + pathFringeStrength * edgeCompanionStrength * pathFringe

seed-head:
    weight *= 1 + pathFringeStrength * edgeCompanionStrength * pathFringe * habitat.dryness
```

Do not boost all species at an edge; that produces decorative rings.

---

# Exact Colony Dominance Algorithm

The profile continues to own which species are legal in a biome.

## 1. Resolve dominant entry

Use `distribution.familyRoll` to weighted-pick one profile accent entry from the ecology-adjusted weights above.

Because `familyRoll` is a continuous macro field, neighboring candidates usually resolve the same dominant family without any tile-local state or neighbor lookup.

The selected dominant entry supplies:

```text
dominantSpeciesIndex
dominant profile tint candidate
```

## 2. Resolve dominant probability

```text
correlation = smoothstep(0, 0.50, colonyStrength)
pDominant = dominantFamilyShare * correlation * mix(0.90, 1.00, distribution.core)
```

Clamp to `[0, dominantFamilyShare]`.

At shipped tuning, colony cores should land close to the requested ~74% dominant-family share; fringes remain slightly more mixed.

## 3. Individual dominant/companion decision

Use a stable candidate-position hash with a dedicated salt.

```text
if individualRoll < pDominant
    selected species = dominant species
else
    select compatible companion
```

Never consume tile PRNG enumeration state for this decision. It must be stable from world position.

## 4. Companion selection

Weighted-pick from the same biome accent entries with:

```text
companionWeight = ecologyAdjustedWeight * compatibility(dominant, candidate)
```

If all companion weights are zero, fall back to the normal ecology-adjusted biome pick.

## Compatibility rules

Keep compatibility simple and category-based.

Recommended matrix, where `1` is natural, `0.5` is allowed but secondary, and `0.15` is rare:

| Dominant -> Candidate | tuft | shrub | fern | broadleaf | flower | seed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| tuft | 1.00 | .65 | .65 | .75 | .70 | .70 |
| shrub | .90 | 1.00 | .65 | .90 | .30 | .25 |
| fern | .80 | .55 | 1.00 | .90 | .25 | .15 |
| broadleaf | .85 | .75 | .85 | 1.00 | .45 | .20 |
| flower | .85 | .25 | .30 | .65 | .55 | .30 |
| seed | .90 | .30 | .15 | .20 | .30 | 1.00 |

Do not add a huge pairwise species table unless visual QA proves category compatibility insufficient.

---

# Exact Tint Algorithm

Keep the existing tint catalogue and shader uniform count.

## Colony tint

For a selected flowering species:

1. scan the biome profile entries matching `selectedSpeciesIndex`;
2. weighted-pick one tint using `distribution.tintRoll` and the profile entry weights;
3. call that `colonyTintRow`.

This guarantees that a colony tint is legal for the active biome/species.

## Per-flower tint

Use another stable candidate-position hash:

```text
if tintKeepRoll < detailFoliageTintCoherence
    tintRow = colonyTintRow
else
    tintRow = tint row from the selected weighted profile entry
```

Non-flower species keep `tintRow = 0`/none exactly as today.

Do not hardcode white/lavender families in the picker. Those relationships already exist through repeated species entries in `GrassBiomeProfiles.json` and remain art-editable there.

This produces local color coherence without bypassing biome ownership.

---

# Exact Height and Maturity Algorithm

Do **not** multiply card height above the species `canopyHeightBand`.

That would silently invalidate the existing analytical culling bounds.

Instead, correlate the sample **inside** the existing band.

Let `baseHeightRoll` be the existing stable random value in `[0,1]`.

```text
heightRoll = clamp01(
  baseHeightRoll +
  detailFoliageCoreHeightBias * (distribution.core - 0.5)
)

cardHeight = lerp(
  species.canopyHeightBand[0],
  species.canopyHeightBand[1],
  heightRoll
) * canopyHeight
```

Therefore:

```text
cardHeight never exceeds the existing species ceiling
reserved bounds do not need to grow
```

`detailFoliageCoreHeightBias` is therefore a **normalized intra-band shift**, not a percentage scale multiplier.

## Maturity

Use:

```text
maturity = clamp01(
  0.60 * distribution.maturityRoll +
  0.25 * individualAgeRoll +
  0.15 * distribution.core
)
```

Then:

```text
pMatureRow = clamp01(
  detailFoliageMaturePhenotypeBias * (0.35 + 0.65 * maturity)
)
```

Use a stable world-position hash to choose phenotype row 0/1 from `pMatureRow`.

Do not add an age instance attribute.

---

# Exact Shrub and Broadleaf Art Algorithms

## `GrassAccentSpecies.ts`

Starting definitions:

```text
grass-tuft
    category tuft
    existing dimensions

low-shrub
    category shrub
    aspect ~1.20
    windWeight ~0.35
    canopyHeightBand ~[0.62, 0.98]

fern
    existing

small-fern
    existing

daisy
    existing

round-bloom
    existing

seed-head
    existing

broadleaf-rosette
    category broadleaf
    aspect ~1.10
    windWeight ~0.42
    canopyHeightBand ~[0.52, 0.78]
```

Keep all bands inside the analytical ceilings already used by the factory.

## `WorldDetailFoliageAtlasFactory.ts` - low shrub

Replace the old tall-tuft cell with `drawLowShrub(context, random, row)`.

Row 0 - compact/young:

```text
branches            5
branch spread       roughly -0.32..0.32 card width
branch top heights  roughly 0.55..0.86 card height
leaves              14..20
leaf length          roughly 0.08..0.16 card height
center density      high
silhouette holes    1 intentional opening
```

Row 1 - mature/open:

```text
branches            6..7
branch spread       roughly -0.45..0.45
branch top heights  roughly 0.48..0.92
leaves              12..18, slightly larger
center density      lower
silhouette holes    2 openings
one/two lateral leaves extend beyond the central mass
```

Rules:

- use asymmetric branch bases;
- use leaf ellipses/tapered paths, not circles piled into a ball;
- encode normal grass semantic progress/shade channels;
- tint mask remains zero;
- make the root/center darker than outer leaves;
- do not draw a perfect dome.

## `WorldDetailFoliageAtlasFactory.ts` - broadleaf rosette

Replace sprig with `drawBroadleafRosette(context, random, row)`.

Row 0:

```text
leaves            7
angles            radial with jitter
lengths           0.30..0.46 card height
width/length      0.22..0.34
center            compact/dark
```

Row 1:

```text
leaves            6..9
angles            uneven/semi-radial
lengths           0.28..0.52
one side          deliberately more open
center            visible but less compact
```

Each leaf should taper toward its root and tip. Avoid a flower-like petal ring by varying leaf elevation, width, and overlap.

## Atlas budget

Do not change:

```text
DETAIL_FOLIAGE_CELL_RESOLUTION
DETAIL_FOLIAGE_CELL_PADDING
DETAIL_FOLIAGE_VARIANT_ROWS
8 atlas columns
texture filters
mipmap behavior
anisotropy
```

---

# Biome Profile Changes

## `GrassBiomeProfiles.json`

Remove `tall-tuft` and `sprig` entries.

Add shrub/broadleaf entries while keeping flowers subordinate to green forms.

Starting intent, not immutable exact art weights:

### Meadow

```text
grass-tuft            common filler
fern                   common protected green
small-fern             common companion
broadleaf-rosette      clearly visible
low-shrub              uncommon anchor
daisy                  locally common, globally secondary
round-bloom            rarer flower accent
seed-head              sparse
```

### Dry steppe

```text
seed-head              dominant accent
grass-tuft             common
low-shrub              sparse
broadleaf-rosette      rare
flowers                 sparse cream/yellow/red only as profile permits
ferns                   very low/absent according to profile
```

### Alpine

```text
grass-tuft             common
small-fern             common green accent
broadleaf-rosette      restrained
low-shrub              rare
daisy/round-bloom      sparse pale accents
seed-head              profile-dependent
```

Exact global species/tint weights stay in JSON. Do not duplicate them in TypeScript.

---

# Configuration Contract

The world loader is flat numeric YAML. Keep it flat.

## `public/config/world.yaml`

Add near the macro grass habitat settings:

```yaml
# Detail foliage composition. These values change deterministic tile-build
# composition only; renderer topology and radius stay fixed.
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

## `WorldConfig.ts`

Add all fourteen fields as required numbers.

## `WorldConfigSchema.ts`

| Setting | Min | Max | Step in GUI |
| --- | ---: | ---: | ---: |
| `detailFoliageDensity` | 0.10 | 0.35 | 0.01 |
| `detailFoliageColonyWorldSize` | 6 | 16 | 0.5 |
| `detailFoliageClumpWorldSize` | 1 | 4 | 0.25 |
| `detailFoliageColonyStrength` | 0 | 1 | 0.02 |
| `detailFoliageDominantFamilyShare` | 0.50 | 0.90 | 0.01 |
| `detailFoliageTintCoherence` | 0.50 | 1 | 0.01 |
| `detailFoliageQuietZoneThreshold` | 0 | 0.70 | 0.02 |
| `detailFoliageBackgroundSuppression` | 0 | 0.90 | 0.02 |
| `detailFoliageCoreHeightBias` | 0 | 0.25 | 0.01 |
| `detailFoliageMaturePhenotypeBias` | 0 | 1 | 0.02 |
| `detailFoliageEcologyStrength` | 0 | 1 | 0.02 |
| `detailFoliageEdgeCompanionStrength` | 0 | 0.80 | 0.02 |
| `detailFoliageStoneFringeStrength` | 0 | 1 | 0.02 |
| `detailFoliagePathFringeStrength` | 0 | 1 | 0.02 |

## `WorldConfigValidator.ts`

Add only useful cross-field rules:

```text
detailFoliageClumpWorldSize <= detailFoliageColonyWorldSize * 0.5
```

The two scales must remain meaningfully different.

Do not add subjective composition rules to the validator.

---

# Runtime Tuning Object

## New file

`src/world/grass/DetailFoliageTuning.ts`

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

export function createDetailFoliageTuning(
  config: WorldConfig,
): DetailFoliageTuning;
```

YAML is the only production default source.

Do not add a second literal default object in TypeScript.

---

# Exact File-by-File Implementation Map

## New: `src/world/grass/DetailFoliageTuning.ts`

Do:

- define the live tuning type;
- map `WorldConfig` -> tuning;
- copy values, do not retain mutable config reference;
- no renderer imports.

## New: `src/world/grass/WorldDetailFoliageDistribution.ts`

Do:

- implement the two-scale multi-channel value-noise algorithm exactly as above;
- keep hash salts/constants at module scope;
- allocation-free `sample()`;
- no tile coordinates;
- no ecology/terrain access.

Do not:

- use PRNG objects per sample;
- create arrays in `sample()`;
- add more octaves;
- cache per-position samples; at <=90 candidates/tile the cache bookkeeping is not worth it.

## New: `src/world/grass/DetailFoliageAffinity.ts`

Do:

- static species habitat table;
- soft preference score;
- ecology weighting;
- fringe weighting;
- weighted dominant pick;
- category compatibility;
- companion pick;
- colony tint pick.

Keep functions pure and allocation-free.

## Modify: `src/grass/biome/GrassAccentSpecies.ts`

Do:

- add `shrub` and `broadleaf` categories;
- replace species slots 1 and 7;
- keep count exactly 8;
- choose shrub/rosette aspect/wind/bands within existing analytical limits.

## Modify: `src/grass/biome/GrassBiomeProfile.ts`

Do:

- add `speciesIndex` and `tintRow` to validated runtime entries;
- resolve both once;
- keep JSON human-readable strings unchanged;
- keep validation fail-closed.

## Modify: `src/grass/biome/GrassBiomeProfiles.json`

Do:

- replace removed species names;
- tune biome weights;
- keep green forms globally dominant;
- keep color relationships in JSON, not code.

## Modify: `src/world/grass/WorldDetailFoliageAtlasFactory.ts`

Do:

- replace tall-tuft draw path with `drawLowShrub()`;
- replace sprig draw path with `drawBroadleafRosette()`;
- make row 0/1 structurally distinct;
- keep texture dimensions/settings unchanged.

## Modify: `src/world/grass/WorldDetailFoliageField.ts`

Do:

- remove hardcoded production density constant;
- consume `DetailFoliageTuning`;
- own one `WorldDetailFoliageDistribution`;
- own one reused distribution sample object;
- apply distribution only after cheap hard rejects;
- replace old `pickSpecies()` with affinity module;
- use pre-resolved species/tint indices;
- correlate height only inside declared bands;
- keep all existing instance attributes;
- keep dither sort/prefix trimming;
- add `setTuning()` to factory.

### Dev-tuning invalidation

Add to `WorldDetailFoliageField`:

```ts
invalidate(): void;
```

It must:

1. dispose every built tile through existing factory disposal;
2. clear built tiles;
3. clear `emptyTiles`;
4. clear desired/queue state;
5. mark counts dirty;
6. reset reconciliation focus/center so next update repopulates;
7. preserve enabled state and quality-governor density scale.

Do not rebuild synchronously inside `invalidate()`.

## Modify: `src/world/grass/WorldNearGrassField.ts`

Do:

- create tuning from `WorldConfig` once;
- pass it to detail factory;
- expose `getDetailFoliageTuning()` if ownership lives here, or keep getter in system;
- add `setDetailFoliageTuning()`;
- factory `setTuning()` then field `invalidate()`;
- keep quality governor multiplication exactly as today.

Distribution tuning must not enter `update()` beyond normal queued detail tile building.

## Modify: `src/world/WorldGrassSystem.ts`

Do:

- expose copy-safe tuning getter;
- expose setter delegating to near field;
- keep `update()` free of distribution sampling/composition.

## New: `src/app/DetailFoliageTuningMenu.ts`

Do:

- diagnostics-only native `<details>` panel;
- same UX pattern as `GrassArtMenu`;
- controls listed below;
- Reset to YAML;
- flat YAML export/copy;
- apply expensive changes only on `change`, not every slider `input` event.

## Modify: `src/app/WorldApp.ts`

Do:

- construct menu only when `profile.showGui && diagnostics=1`;
- wire getter/setter;
- dispose menu;
- no render-loop code.

## New: `scripts/verify-detail-foliage-distribution.mjs`

Do:

- Vite SSR-load TypeScript modules using the existing verifier pattern;
- load real `world.yaml` with mocked fetch;
- run deterministic algorithm/property tests below;
- no browser dependency.

## Modify: `scripts/verify-flower-variety.mjs`

Do:

- assert new species and removed species;
- assert species count remains 8;
- assert shrub/rosette routines exist;
- assert row-dependent structural branches exist;
- retain current flower gates.

## Modify: `scripts/verify-grass-performance.mjs`

Do:

- read density from YAML;
- enforce 90-candidate ceiling;
- enforce renderer/atlas/species contracts;
- enforce build-only distribution references;
- enforce no new instance attribute;
- enforce no candidate-loop catalogue scan.

## Modify: `scripts/verify-config-contracts.mjs`

Do:

- parse all new shipped values;
- reject out-of-range and scale-collapse configs.

## Modify: `package.json`

Add:

```json
"test:detail-foliage": "node scripts/verify-detail-foliage-distribution.mjs"
```

Place it in `build` before flower-variety and grass-performance verification.

---

# Diagnostics Tuning Menu

## File

`src/app/DetailFoliageTuningMenu.ts`

Use labels/ranges:

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
| Core height bias | `coreHeightBias` | 0-0.25 | 0.01 |
| Mature phenotype | `maturePhenotypeBias` | 0-1 | 0.02 |
| Ecology influence | `ecologyStrength` | 0-1 | 0.02 |
| Edge companions | `edgeCompanionStrength` | 0-0.80 | 0.02 |
| Stone fringe | `stoneFringeStrength` | 0-1 | 0.02 |
| Path fringe | `pathFringeStrength` | 0-1 | 0.02 |

Behavior:

```text
input event
    -> update displayed value only

change / pointer release
    -> validate normalized tuning
    -> call setDetailFoliageTuning()
    -> invalidate detail tiles only
    -> rebuild at existing 1 tile/frame budget
```

Do not rebuild all visible tiles on every slider pixel.

## Reset

`Reset to YAML` restores the immutable snapshot made from the loaded production `WorldConfig`.

## Export

Export exactly the flat YAML keys used by production config.

Use the same clipboard + downloaded-file fallback pattern as `GrassArtMenu`.

---

# Deterministic Verification

Timing is intentionally excluded from automated correctness gates.

## Test 1 - golden distribution digest

In `verify-detail-foliage-distribution.mjs`:

Use a fixed 64 x 64 grid = 4,096 samples:

```text
x = -128 + ix * 4
z = -128 + iz * 4
ix, iz = 0..63
```

For each point serialize, in fixed field order:

```text
colony
clump
core
keepMultiplier
familyRoll
tintRoll
maturityRoll
```

Quantize floats to six decimals.

Hash the resulting UTF-8 text with SHA-256.

Run sampling twice in the same test and require identical digests.

After the initial implementation is reviewed visually, commit the digest as a golden constant. Future equation/salt/config changes must deliberately update it.

Do not invent the digest in this plan; calculate it from the implementation.

## Test 2 - tile-boundary continuity

For:

```text
k = -8..8
z in [-97.3, -31.2, 0.7, 42.9, 111.4]
epsilon = 0.001 m
```

sample:

```text
x1 = k * 16 - epsilon
x2 = k * 16 + epsilon
```

Repeat swapping x/z.

For continuous outputs `colony`, `clump`, `core`, `keepMultiplier`, require:

```text
abs(a - b) <= 0.01
```

The 0.01 gate is conservative for cubic interpolation across 0.002 m even at the minimum supported 1 m clump scale.

Do **not** continuity-gate discrete species/tint results; discrete weighted-pick thresholds can legitimately change across a continuous roll contour.

## Test 3 - no tile identity input

Statically assert `WorldDetailFoliageDistribution.ts` contains no `tileX`, `tileZ`, `DETAIL_FOLIAGE_TILE_SIZE`, or tile-key dependency.

## Test 4 - output bounds

Across the 4,096 grid samples require all distribution outputs finite and inside `[0,1]`.

## Test 5 - colony negative space

Analyze a 256 x 256 m meadow-like distribution region using 8 m analysis cells.

For each 8 m cell, sample a 4 x 4 subgrid and calculate mean `keepMultiplier`.

Define a quiet analysis cell as:

```text
mean keepMultiplier < 0.55
```

With shipped tuning require:

```text
quiet cells >= 20%
quiet cells <= 60%
```

This rejects both uniform confetti and an almost-empty world.

## Test 6 - family correlation

Use a deterministic synthetic meadow ecology sample and the real meadow profile.

Sample candidate-like points on a fixed grid at approximately 0.75 m spacing.

For accepted neighboring pairs within `clumpWorldSize`:

```text
same selected species/category ratio >= 0.60
```

Also compute an independent baseline using the same profile/ecology weights but independent position rolls.

Require:

```text
clustered same-family ratio >= baseline + 0.12
```

The baseline comparison prevents a globally dominant species from cheating the test.

## Test 7 - tint correlation

For neighboring selected flower pairs within `clumpWorldSize`:

```text
same tint row ratio >= 0.65
clustered tint ratio >= independent baseline + 0.12
```

If the deterministic region contains too few flower pairs, enlarge the fixed region; do not relax the rule dynamically.

## Test 8 - ecology direction

With all non-ecology inputs fixed, require:

```text
fern(wet,sheltered)           > fern(dry,exposed)
smallFern(wet,rocky)          > smallFern(dry,smooth)
broadleaf(fertile,moist)      > broadleaf(dry,poor)
lowShrub(lowDisturbance)      > lowShrub(highDisturbance)
seedHead(dry,exposed)         > seedHead(wet,sheltered)
```

Test direction, not exact numeric art weights.

## Test 9 - deterministic weighted picks

For the same profile/ecology/distribution/world position, call species/tint resolution repeatedly and require exact species index + tint row equality.

## Test 10 - legal output

Across deterministic samples require:

```text
speciesIndex in 0..7
tintRow in existing tint ceiling
selected species exists in active biome profile
no NaN/Infinity weights
sum of selectable weights > 0 or documented fallback used
```

---

# Deterministic Performance Verification

## `verify-grass-performance.mjs`

Add exact assertions:

```text
detailFoliageDensity <= 0.35
round(16 * 16 * detailFoliageDensity) <= 90
GRASS_MAX_ACCENT_SPECIES === 8
DETAIL_FOLIAGE_VARIANT_ROWS === 2
DETAIL_FOLIAGE_TILE_SIZE === 16
DETAIL_FOLIAGE_TILES_PER_FRAME === 1
```

Also statically assert:

```text
castShadow = false
receiveShadow = false
no new instance attribute named for colony/clump/age/tint-family
WorldDetailFoliageDistribution referenced from build/factory path
WorldDetailFoliageDistribution not sampled from WorldGrassSystem.update
WorldDetailFoliageDistribution not sampled from material update paths
WorldDetailFoliageField candidate loop does not GRASS_ACCENT_SPECIES.find(...)
validated profile entries contain speciesIndex and tintRow
```

Keep existing card/draw/vertex envelope. Do not loosen it because the visual result is better.

---

# Config Verification

## `verify-config-contracts.mjs`

Add explicit rejection tests:

```text
detailFoliageDensity: 0.36                    reject
detailFoliageColonyWorldSize: 5               reject
detailFoliageClumpWorldSize: 5                reject
clumpWorldSize > colonyWorldSize * 0.5         reject
detailFoliageDominantFamilyShare: 0.95         reject
detailFoliageCoreHeightBias: 0.30              reject
detailFoliageSomethingElse: 1                  reject unknown key
```

Also assert all shipped values parse exactly.

---

# Plant/Atlas Structural Verification

## `verify-flower-variety.mjs`

Keep existing flower checks and add:

```text
low-shrub exists
broadleaf-rosette exists
tall-tuft absent
sprig absent
species count exactly 8
category union includes shrub/broadleaf
low-shrub aspect wider than narrow seed forms
broadleaf top lower than flower/seed-head maxima
drawLowShrub exists
drawBroadleafRosette exists
both routines branch on phenotype row
atlas columns still equal species count
variant rows still 2
```

Do not try to prove beauty with regex. Structural verifiers protect implementation contracts; fixed screenshots/manual inspection decide aesthetics.

---

# Manual Visual QA

Use deterministic world/config, fixed tier, fixed viewport, fixed camera and same grass art preset.

Recommended URL:

```text
?diagnostics=1&tier=0
```

Capture before/after at:

- meadow;
- path verge;
- rocky patch;
- water edge;
- dry steppe;
- alpine;
- close low-angle shrub/broadleaf view;
- 10-25 m medium-distance colony view.

## Acceptance

### Meadow

- clear flower colonies;
- clear quiet grass regions;
- green forms still dominate;
- shrub/broadleaf pockets visible but not everywhere;
- no rainbow confetti;
- no square/tile rhythm.

### Rock

- fern/broadleaf bias appears on protected fringe;
- no plant inside hard stone clearance;
- no uniform ring around every rock.

### Path

- occasional interrupted flower pockets;
- no flower ribbon/kerb;
- shrub kept away from tread by existing hard mask.

### Water

- wetter species become more common gradually;
- no abrupt habitat wall.

### Dry steppe

- seed/dry forms dominate;
- broadleaf/flowers restrained;
- negative space remains.

### Alpine

- low green/pale forms dominate;
- shrubs rare;
- does not look like copied meadow composition.

---

# Manual Performance QA

At identical fixed poses record before/after:

```text
accentCards
accentTiles
renderer draw calls
renderer triangles/vertices where available
nearTileBuildMs
maxNearTileBuildMs
frame CPU/GPU stats on the same desktop
frame CPU/GPU stats on the same compact device
```

Acceptance:

```text
normal per-frame distribution CPU        none
accent draw architecture                 unchanged
material count                           unchanged
atlas GPU allocation                     unchanged
instance attribute count                 unchanged
resident/drawn cards                     <= previous same-pose baseline
```

An occasional small detail-tile build-time increase is acceptable only if it stays inside the existing near-build deadline and does not create visible compact-device spikes.

Do not create automated millisecond pass/fail gates.

---

# Tuning Order

Tune in this exact order.

## 1. Negative space

```text
Quiet threshold
Background suppression
Colony size
```

Goal: irregular readable quiet regions.

## 2. Colony form

```text
Colony strength
Clump size
```

Goal: pockets rather than uniform scatter or perfect blobs.

## 3. Family coherence

```text
Dominant family
```

Goal: recognizable plant communities without monoculture everywhere.

## 4. Tint coherence

```text
Tint coherence
```

Only then adjust species/tint weights in `GrassBiomeProfiles.json`.

## 5. Ecology/edges

```text
Ecology influence
Edge companions
Stone fringe
Path fringe
```

Goal: environment explains composition without decorative borders.

## 6. Internal hierarchy

```text
Core height bias
Mature phenotype
```

Goal: subtle young/mature variation entirely inside existing height bands.

## 7. Density last

Lower density if clustering makes the field rich enough.

Do not raise above 0.35 in this phase.

---

# Implementation Phases

## F1 - config + tuning model

Change:

- `public/config/world.yaml`;
- `WorldConfig.ts`;
- `WorldConfigSchema.ts`;
- `WorldConfigValidator.ts`;
- add `DetailFoliageTuning.ts`.

Pass:

```text
npm run test:config
```

## F2 - pure distribution

Add:

- `WorldDetailFoliageDistribution.ts`;
- initial `verify-detail-foliage-distribution.mjs` distribution tests.

Pass:

- output bounds;
- repeatability;
- continuity;
- negative-space range;
- no renderer changes yet.

## F3 - profile pre-resolution + affinity

Change:

- `GrassBiomeProfile.ts`;
- add `DetailFoliageAffinity.ts`;
- extend deterministic verifier.

Pass:

- species/tint deterministic picks;
- ecology-direction tests;
- family/tint correlation tests.

## F4 - field integration

Change:

- `WorldDetailFoliageField.ts`.

Pass:

- <=90 candidates/tile;
- no new instance attributes;
- no extra world/ecology samples;
- distribution only after cheap hard gates;
- workload envelope unchanged or lower.

## F5 - shrub + broadleaf art

Change:

- `GrassAccentSpecies.ts`;
- `GrassBiomeProfiles.json`;
- `WorldDetailFoliageAtlasFactory.ts`;
- `verify-flower-variety.mjs`.

Pass:

- exactly eight species;
- atlas size unchanged;
- structural tests green;
- atlas debug visually readable.

## F6 - live diagnostics tuning

Change:

- `WorldNearGrassField.ts`;
- `WorldGrassSystem.ts`;
- add `DetailFoliageTuningMenu.ts`;
- `WorldApp.ts`.

Pass:

- diagnostics-only menu;
- change-on-release rebuild;
- one tile/frame rebuild;
- Reset to YAML;
- valid flat YAML export.

## F7 - final gates

Change:

- `verify-grass-performance.mjs`;
- `verify-config-contracts.mjs`;
- `package.json`;
- status note in `docs/grass-detail-foliage-plan.md` after implementation.

Run:

```text
npm run test:detail-foliage
npm run test:flower-variety
npm run test:config
npm run test:grass-performance
npm run test:grass-placement
npm run build
```

No GitHub Actions. Deploy manually with the existing GitHub Pages command after manual visual/hardware acceptance.

---

# Definition of Done

```text
[ ] visible plant colonies replace uniform sprinkle
[ ] meaningful quiet grass regions exist
[ ] local flower tint is coherent rather than confetti-like
[ ] low shrub provides a medium-width bush silhouette
[ ] broadleaf rosette provides a low/wide silhouette
[ ] ecology explains where families appear
[ ] path/stone hard clearances are unchanged
[ ] no square/tile distribution rhythm is visible
[ ] species count remains exactly 8
[ ] atlas dimensions remain unchanged
[ ] material count remains unchanged
[ ] draw-call architecture remains unchanged
[ ] no detail shadows added
[ ] no instance attribute added
[ ] production density <= 0.35/m²
[ ] max candidates <= 90 per 16 m tile
[ ] only 2 new value-noise fields sampled per surviving candidate
[ ] distribution sampler allocates nothing
[ ] no new terrain/hydrology/ecology samples
[ ] distribution/composition runs only during tile build
[ ] height correlation stays within existing species bands
[ ] deterministic digest passes
[ ] tile-boundary continuity passes
[ ] negative-space range passes
[ ] family correlation passes
[ ] tint correlation passes
[ ] ecology direction passes
[ ] config rejection tests pass
[ ] flower/plant structural verifier passes
[ ] grass performance verifier passes
[ ] full npm build passes
[ ] fixed-pose visual matrix is materially better
[ ] compact-device profiling shows no meaningful regression
```

---

# Priority

Do not begin by increasing flower detail, adding colors, increasing render radius, or raising density.

Implement in this priority:

```text
1  deterministic colony/negative-space field
2  profile pre-resolution
3  ecology + dominant-family selection
4  tint coherence
5  field integration
6  shrub/broadleaf silhouettes
7  diagnostics tuning
8  density reduction/tuning last
```

The intended result is simple:

> Fewer unrelated decorations. More believable little plant communities.