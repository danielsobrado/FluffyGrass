# Tiny Glade-Inspired Detail Foliage Implementation Plan

## Status

- Target branch: `main`
- Target: current FluffyGrass PoC detail-foliage system
- Scope: small bushes, flowers, ferns, broadleaf plants, seed heads, clustered distribution, ecological placement, deterministic tuning, and performance protection
- Renderer: preserve the existing detail-foliage atlas/material/instancing architecture
- Runtime dependencies: no new dependencies
- Deployment: manual GitHub Pages deployment; no GitHub Actions
- Principles: KISS, SOLID, deterministic, bounded, allocation-light, configuration-backed, build-time composition only

This is the final implementation specification. During implementation, do not redesign the system unless a deterministic verifier or a concrete rendering defect proves that one of these decisions is invalid.

---

# Objective

Make the existing detail-foliage layer read like small authored plant communities rather than an even decorative scatter.

Target hierarchy:

```text
glade
    -> colony
        -> clump
            -> individual plant
```

Target rhythm:

```text
quiet grass
    -> coherent daisy pocket
    -> quiet grass
    -> fern/broadleaf pocket beside stone
    -> occasional low-shrub anchor
    -> quiet grass
    -> sparse seed-head pocket
```

The visual improvement must come from:

1. negative space;
2. correlated local families;
3. coherent local flower color;
4. genuinely different silhouettes;
5. ecological agreement;
6. subtle age/height hierarchy;
7. fewer unrelated accents, not more cards.

## Non-goals

Do not:

- add 3D shrub meshes in this phase;
- increase the detail-foliage render radius;
- add shadows to accents;
- add another material;
- add another runtime texture;
- increase the eight-species shader ceiling;
- add instance attributes for colony data;
- use Poisson-disc placement;
- use neighbor searches;
- use physics or relaxation;
- add per-frame colony/ecology work;
- add foliage interaction/trail bending;
- add more flower colors before distribution is proven;
- increase production density above the current 0.35 cards/m².

---

# Current Baseline to Preserve

The current implementation already has the correct cheap rendering architecture:

```text
tile size                         16 m
candidate density                 0.35 / m²
candidates per full tile          90
detail fade midpoint              27 m
detail fade half-width            3 m
visibility radius                 32 m
card topology                     one upright yaw billboard
card geometry                     6 vertices / 4 triangles
species slots                     8
phenotype rows                    2
atlas cell                        112 px + 8 px padding
atlas size                        1024 x 256
materials                         1
detail shadows                    off
detail tiles built per frame      1
normal per-frame distribution     none
```

Important correction: the accent geometry is **not a crossed-card bush mesh**. It is one upright yaw billboard made from two stacked quads sharing the middle row. Shrub and broadleaf art must therefore read correctly from silhouette on that billboard.

Current reviewed workload reference:

```text
reference resident cards          ~1,890
reference drawn cards             ~1,488
reviewed worst-case cards          <= 2,070
reviewed detail draws              <= 22
reviewed detail vertices           <= 12,420
```

These are workload references, not timing promises.

---

# Final Architecture Decisions

1. Keep `WorldDetailFoliageMaterial` as the only detail-foliage material.
2. Keep one procedural atlas.
3. Keep exactly eight species columns.
4. Keep exactly two phenotype rows.
5. Keep the six-vertex billboard geometry.
6. Keep 16 m tiles.
7. Keep the current fade and visibility distances.
8. Keep `castShadow = false` and `receiveShadow = false`.
9. Keep the existing quality-governor accent density multiplier.
10. Keep existing hard terrain/path/stone placement rejection.
11. Add colony/composition only inside tile construction.
12. Keep the existing stratified candidate grid.
13. Add two continuous world-space distribution fields: macro colony + local clump.
14. Use continuous macro channels for colony family/tint/maturity.
15. Use one stable candidate identity hash for all individual decisions.
16. Separate candidate-position randomness from appearance/acceptance randomness.
17. Resolve species/tint indices once when biome profiles load.
18. Keep production art controls in flat `world.yaml`.
19. Keep species/tint weights in `GrassBiomeProfiles.json`.
20. Keep species habitat meaning in TypeScript constants.
21. Use the existing diagnostics-only native DOM tuning pattern.
22. Invalidate/rebuild detail tiles only after a tuning value is committed.
23. Rebuild at the existing one-tile-per-frame rate.
24. Density is tuned last and may go down, never above 0.35 in this phase.

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
physics / Poisson / relaxation                     0
neighbor searches                                  0
unbounded loops                                    0
species ceiling                                    8
atlas dimension increase                           0
production density                                 <= 0.35 / m²
production candidates per 16 m tile                <= 90
detail tiles built per frame                       1
average rendered detail cards                      <= previous same-pose baseline
```

## New candidate-loop work

Only after the candidate has survived the existing cheap terrain/path/stone gates:

```text
continuous distribution fields                     2
lattice corners per field                          4
lattice-coordinate hashes                          8
candidate identity hashes                          1
new terrain samples                                0
new hydrology samples                              0
new ecology samples                                0
new neighbor queries                               0
new allocations introduced by colony logic         0
```

The one candidate identity hash replaces multiple independent per-purpose world-position hashes. Its integer value is scrambled into separate channels.

Existing candidate storage allocations in `WorldDetailFoliageField` are not part of this task. Do not add more allocations to them, but do not widen scope by rewriting the whole tile buffer system unless profiling later proves it useful.

---

# Exact Species Set

Keep:

```ts
GRASS_MAX_ACCENT_SPECIES = 8;
```

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

## Accent categories

Change the source-only semantic union to:

```ts
export type GrassAccentCategory =
  | "tuft"
  | "shrub"
  | "fern"
  | "broadleaf"
  | "flower"
  | "seed";
```

This has no shader cost.

## Exact starting species definitions

Keep existing definitions for grass-tuft, fern, small-fern, daisy, round-bloom, and seed-head.

Use these initial definitions for the two replacements:

```text
low-shrub
    category               shrub
    aspect                 1.10
    windWeight             0.35
    canopyHeightBand       [0.76, 1.18]

broadleaf-rosette
    category               broadleaf
    aspect                 1.15
    windWeight             0.42
    canopyHeightBand       [0.66, 0.92]
```

These are initial art values. The menu does not tune species geometry; change them only after atlas/world visual QA.

## Bounds invariants

The current catalogue maximums are:

```text
maximum canopy-height multiplier    1.72
maximum canopy-width multiplier     1.314
```

The replacements above remain below both:

```text
low-shrub width ceiling             1.18 * 1.10 = 1.298
broadleaf width ceiling             0.92 * 1.15 = 1.058
```

Therefore the new species must not increase `WorldDetailFoliageFactory` analytical bounds.

Add a verifier that fails if either catalogue maximum becomes greater than:

```text
height multiplier > 1.72
width multiplier  > 1.314
```

Do not enlarge the bounds to accommodate this work.

---

# Deterministic Randomness Model

The current builder uses one tile `SeededRandom` for both candidate jitter and accepted-card appearance. Because accepted candidates consume extra PRNG values, changing an acceptance rule can shift the PRNG stream and move later candidate positions.

That is bad for tuning and A/B comparison.

Fix it as part of this implementation.

## Position stream

`WorldDetailFoliageField.ts` keeps one tile-seeded `SeededRandom` used **only** for stratified candidate x/z jitter.

For every candidate, regardless of later rejection, consume exactly:

```text
1 draw for x jitter
1 draw for z jitter
```

Never use that PRNG for:

- height;
- species;
- tint;
- phenotype;
- dither;
- yaw;
- wind;
- AO;
- acceptance.

Result: with the same density, candidate locations do not move when colony/ecology/tint parameters change.

## Candidate identity

For each candidate after x/z is known:

```text
qx = round(x * 100)
qz = round(z * 100)
candidateHash = hashInt2(qx, qz, worldSeed ^ CANDIDATE_SALT)
```

One-centimetre quantization matches the existing world-position hash convention and is much finer than the candidate spacing.

All individual scalar rolls are derived from `candidateHash` with fixed channel salts.

Examples:

```text
biome density roll
distribution keep roll
dominant/companion decision
companion weighted-pick roll
tint coherence decision
individual tint roll
height roll
individual maturity roll
phenotype row roll
yaw roll
dither roll
wind roll
AO micro-variation roll
```

Do not compute a fresh world-position hash for every one of these.

## New pure helper

Add:

`src/world/grass/DetailFoliageRandom.ts`

Responsibilities only:

```ts
export function detailFoliageHashInt2(
  x: number,
  z: number,
  seed: number,
): number;

export function detailFoliagePositionHash(
  x: number,
  z: number,
  seed: number,
  salt: number,
): number;

export function detailFoliageChannel01(
  hash: number,
  salt: number,
): number;
```

No Three.js. No PRNG object. No config.

Use:

```ts
function detailFoliageHashInt2(
  x: number,
  z: number,
  seed: number,
): number {
  let value = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

function detailFoliagePositionHash(
  x: number,
  z: number,
  seed: number,
  salt: number,
): number {
  return detailFoliageHashInt2(
    Math.round(x * 100),
    Math.round(z * 100),
    (seed ^ salt) >>> 0,
  );
}

function detailFoliageChannel01(hash: number, salt: number): number {
  let value = hash ^ salt;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  value = (value ^ (value >>> 16)) >>> 0;
  return value / 4294967296;
}
```

Source salts are identity constants, not YAML art controls.

Use these candidate domains so implementation does not invent them ad hoc:

```ts
const CANDIDATE_SALT = 0x517cc1b7;
const BIOME_DENSITY_CHANNEL_SALT = 0xa24baed5;
const DISTRIBUTION_KEEP_CHANNEL_SALT = 0x9fb21c65;
const DOMINANT_DECISION_SALT = 0x68e31da4;
const COMPANION_PICK_SALT = 0xb5297a4d;
const TINT_COHERENCE_SALT = 0x1b56c4e9;
const TINT_PICK_SALT = 0xd3a2646c;
const HEIGHT_SALT = 0xfd7046c5;
const INDIVIDUAL_MATURITY_SALT = 0xb55a4f09;
const PHENOTYPE_SALT = 0x7f4a7c15;
const YAW_SALT = 0x94d049bb;
const DITHER_SALT = 0x369dea0f;
const WIND_SALT = 0xdb4f0b91;
const AO_SALT = 0xbb67ae85;
```

Keep the current tile-position seed domain for `positionRandom`; only its *usage* changes. This minimizes unrelated world-layout change while removing acceptance-dependent PRNG consumption.

Once shipped, changing these salts intentionally changes world identity and must update the golden deterministic digest.

---

# Exact Distribution Algorithm

## New file

`src/world/grass/WorldDetailFoliageDistribution.ts`

Own only continuous spatial composition.

Must not import:

- Three.js;
- renderer/material classes;
- terrain;
- hydrology;
- ecology;
- tile coordinates.

## API

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

export function createDetailFoliageDistributionSample():
  DetailFoliageDistributionSample;

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

`sample()` allocates nothing.

## Fixed domains

Use two hash domains:

```ts
const COLONY_SALT = 0x6d2b79f5;
const CLUMP_SALT = 0x1b873593;

const CHANNEL_PRESENCE_SALT = 0x27d4eb2f;
const CHANNEL_FAMILY_SALT = 0x9e3779b9;
const CHANNEL_TINT_SALT = 0x85ebca6b;
const CHANNEL_MATURITY_SALT = 0xc2b2ae35;
const CHANNEL_CLUMP_SALT = 0x165667b1;
```

Use:

```text
colony lattice seed = worldSeed ^ COLONY_SALT
clump lattice seed  = worldSeed ^ CLUMP_SALT
```

## Multi-channel macro field

At each of the four macro lattice corners:

1. call `detailFoliageHashInt2()` once;
2. derive four channels from that integer:
   - presence;
   - family;
   - tint;
   - maturity.

Do not run four separate value-noise fields.

At each of the four clump lattice corners:

1. call `detailFoliageHashInt2()` once;
2. derive only the clump channel.

Total lattice-coordinate hashes per sample:

```text
4 macro + 4 clump = 8
```

## Value-noise interpolation

For field size `S`:

```text
u  = x / S
v  = z / S
ix = floor(u)
iz = floor(v)
fx = u - ix
fz = v - iz

wx = fx² * (3 - 2fx)
wz = fz² * (3 - 2fz)
```

For each channel:

```text
lower = lerp(c00, c10, wx)
upper = lerp(c01, c11, wx)
value = lerp(lower, upper, wz)
```

No sine noise. No extra octave. No texture.

## Production starting scales

Use:

```text
detailFoliageColonyWorldSize: 11
detailFoliageClumpWorldSize: 2.25
```

The macro scale is deliberately larger than the previous 9 m proposal. At the current ~30 m visible radius, 11 m gives fewer, more legible communities instead of many small procedural patches.

## Shape equations

Let:

```text
M = macro presence channel
C = clump channel
Q = quietZoneThreshold
S = colonyStrength
B = backgroundSuppression
```

Use exactly:

```text
macroBand = smoothstep(Q, min(1, Q + 0.40), M)
clumpBand = smoothstep(0.28, 0.72, C)

structured =
    macroBand *
    (0.60 + 0.40 * clumpBand)

core =
    mix(0.50, structured, S)

structuredKeep =
    mix(1 - B, 1, structured)

keepMultiplier =
    mix(1, structuredKeep, S)
```

Clamp final outputs to `[0,1]`.

Set:

```text
sample.colony        = macroBand
sample.clump         = clumpBand
sample.core          = core
sample.keepMultiplier= keepMultiplier
sample.familyRoll    = interpolated macro family channel
sample.tintRoll      = interpolated macro tint channel
sample.maturityRoll  = interpolated macro maturity channel
```

Properties:

- `S = 0` disables the new distribution suppression;
- `keepMultiplier <= 1`, so the new layer can only remove candidates;
- quiet areas still retain rare survivors;
- clump detail changes local density inside macro colonies;
- family/tint/maturity remain spatially correlated;
- no tile coordinate can create a seam.

---

# Exact Candidate Pipeline

## File

`src/world/grass/WorldDetailFoliageField.ts`

Keep the existing stratified grid.

Candidate count:

```ts
const requested = Math.max(
  1,
  Math.round(
    DETAIL_FOLIAGE_TILE_SIZE *
      DETAIL_FOLIAGE_TILE_SIZE *
      tuning.density,
  ),
);
```

At 16 m and 0.35/m²:

```text
requested = 90
```

## Required order

For each candidate:

```text
1   consume exactly two position-PRNG values for x/z
2   calculate height
3   grass suitability without slope
4   reject if below MIN_SUITABILITY
5   sample path mask
6   reject hard path core
7   sample stone clearance
8   reject hard stone clearance
9   sample normal
10  calculate complete grass suitability
11  reject if below MIN_SUITABILITY
12  sample biome/profile
13  sample existing ecology once
14  fill existing reusable GrassHabitatSample
15  reject existing accentChance minimum
16  compute candidateHash once
17  apply existing biome accentDensity gate using candidateHash channel
18  distribution.sample(x, z)
19  apply distribution keep gate using candidateHash channel
20  resolve species/tint with affinity module
21  resolve height inside species band
22  resolve mature/young phenotype
23  resolve yaw/dither/wind/AO from candidateHash channels
24  write existing matrix and packed instance metadata
```

Do not:

- call distribution before the hard placement gates;
- resample ecology;
- create a new random generator per candidate;
- use the position PRNG after step 1;
- add candidate neighbor checks.

## Biome-density gate

Replace the current dedicated world-position hash with a candidate channel:

```text
biomeDensityRoll =
    detailFoliageChannel01(candidateHash, BIOME_DENSITY_CHANNEL_SALT)

if biomeDensityRoll >= profile.accentDensity:
    reject
```

This preserves the same behavior while avoiding another world-position hash.

## Distribution keep gate

```text
keepRoll =
    detailFoliageChannel01(candidateHash, DISTRIBUTION_KEEP_CHANNEL_SALT)

if keepRoll >= distribution.keepMultiplier:
    reject
```

This gate only removes candidates.

---

# Biome Profile Runtime Resolution

## File

`src/grass/biome/GrassBiomeProfile.ts`

The JSON authoring shape and runtime shape should be separate.

Do not add resolved numeric fields directly to a literal default type that is also used as source data.

Use an internal/source shape:

```ts
interface GrassBiomeAccentSpeciesSource {
  species: string;
  tint?: string;
  weight: number;
}
```

Runtime shape:

```ts
export interface GrassBiomeAccentSpecies {
  species: string;
  speciesIndex: number;
  tint: string;
  tintRow: number;
  weight: number;
}
```

Rename the fallback to make its role obvious:

```text
DEFAULT_ACCENT_SPECIES_SOURCE
```

Route both JSON entries and fallback entries through the same resolution function.

Add a deterministic build-cost ceiling:

```ts
export const GRASS_MAX_ACCENT_PROFILE_ENTRIES = 16;
```

Reject any biome `accentSpecies` array longer than 16. The proposed meadow list has 13 entries, so this leaves art headroom while bounding the repeated weighted scans.

For each source entry:

1. validate species string;
2. resolve `findGrassAccentSpecies()`;
3. fail if absent;
4. validate tint;
5. resolve tint row once;
6. validate weight;
7. freeze the resolved runtime object.

After this change, candidate loops must not call:

```text
GRASS_ACCENT_SPECIES.find(...)
resolveGrassAccentTintRow(...)
```

Profile loading does those lookups once.

---

# Exact Affinity and Selection Algorithm

## New file

`src/world/grass/DetailFoliageAffinity.ts`

Responsibilities:

- species habitat scoring;
- edge weighting;
- dominant colony entry;
- dominant-vs-companion decision;
- companion selection;
- flower tint resolution.

No renderer imports. No allocations in the hot selection functions.

## Output target

Use a reusable target, not a newly allocated `{ speciesIndex, tintRow }` on every candidate:

```ts
export interface DetailFoliageSelection {
  speciesIndex: number;
  tintRow: number;
}

export function createDetailFoliageSelection():
  DetailFoliageSelection;

export function resolveDetailFoliageSelection(
  profile: GrassBiomeProfile,
  ecology: WorldEcologySample,
  habitatDryness: number,
  pathMask: number,
  stoneMask: number,
  distribution: DetailFoliageDistributionSample,
  candidateHash: number,
  tuning: DetailFoliageTuning,
  target: DetailFoliageSelection,
): boolean;
```

Return `false` only if no legal positive-weight selection is possible.

The factory owns one reused `DetailFoliageSelection`.

## Preference helper

```ts
function preference(
  value: number,
  target: number,
  tolerance: number,
): number {
  return clamp01(1 - Math.abs(value - target) / tolerance);
}
```

## Exact habitat score

Importance weights:

```text
moisture       1.0
fertility      1.0
exposure       0.7
rockiness      0.7
disturbance    1.2
sum            4.6
```

For species habitat target/tolerance values:

| Species | Moisture | Fertility | Exposure | Rockiness | Disturbance |
| --- | --- | --- | --- | --- | --- |
| grass-tuft | .50/1.00 | .50/1.00 | .50/1.00 | .50/1.00 | .40/1.00 |
| low-shrub | .55/.55 | .65/.50 | .55/.55 | .35/.55 | .10/.35 |
| fern | .82/.42 | .55/.60 | .25/.45 | .45/.55 | .05/.25 |
| small-fern | .72/.50 | .52/.65 | .30/.50 | .60/.45 | .10/.35 |
| daisy | .55/.55 | .75/.42 | .65/.50 | .25/.60 | .10/.40 |
| round-bloom | .58/.52 | .68/.48 | .55/.55 | .20/.55 | .10/.40 |
| seed-head | .22/.45 | .35/.65 | .80/.45 | .50/.65 | .25/.60 |
| broadleaf-rosette | .72/.45 | .80/.38 | .35/.50 | .20/.50 | .08/.30 |

Compute:

```text
raw =
  (
    pref(moisture)    * 1.0 +
    pref(fertility)   * 1.0 +
    pref(exposure)    * 0.7 +
    pref(rockiness)   * 0.7 +
    pref(disturbance) * 1.2
  ) / 4.6

habitatScore =
    0.15 + 0.85 * raw
```

The 0.15 floor prevents ecological hard walls.

Do not add species-specific importance weights in the first implementation. The target/tolerance table is enough and keeps the system understandable.

## Ecology weighting

For every profile accent entry:

```text
ecologyAdjustedWeight =
    entry.weight *
    mix(
      1,
      habitatScore(species, ecology),
      tuning.ecologyStrength
    )
```

## Path/stone fringe signals

Hard masks remain authoritative.

After hard rejection:

```text
pathFringe  = clamp01(4 * pathMask  * (1 - pathMask))
stoneFringe = clamp01(4 * stoneMask * (1 - stoneMask))
```

Apply:

```text
fern / small-fern / broadleaf:
    weight *=
      1 +
      tuning.stoneFringeStrength *
      tuning.edgeCompanionStrength *
      stoneFringe

low-shrub:
    weight *=
      1 +
      0.5 *
      tuning.stoneFringeStrength *
      tuning.edgeCompanionStrength *
      stoneFringe

daisy / round-bloom:
    weight *=
      1 +
      tuning.pathFringeStrength *
      tuning.edgeCompanionStrength *
      pathFringe

seed-head:
    weight *=
      1 +
      tuning.pathFringeStrength *
      tuning.edgeCompanionStrength *
      pathFringe *
      habitatDryness
```

Grass-tuft gets no edge boost.

No edge formula may modify candidate acceptance or hard clearances.

---

# Exact Weighted Pick

Do not allocate temporary arrays.

For any weighted scan:

```text
total = sum(positive finite weights)
if total <= 0:
    fail/fallback as defined

target = clamp01(roll) * total

lastPositive = none
for each entry in stable profile order:
    if weight <= 0:
        continue
    lastPositive = entry
    target -= weight
    if target <= 0:
        return entry

return lastPositive
```

Returning `lastPositive` avoids floating-point tail failure when `roll` is extremely close to one.

Profile array order is deterministic and already frozen.

---

# Exact Colony Dominance Algorithm

## Dominant entry

Use `distribution.familyRoll` to weighted-pick one profile entry using the ecology- and edge-adjusted weights.

Because `familyRoll` is a continuous macro field, neighboring candidates tend to choose the same dominant species.

Repeated profile entries for the same flower species naturally sum their species probability through repeated weighted intervals.

## Dominant probability

Use:

```text
correlation =
    smoothstep(0, 0.50, tuning.colonyStrength)

localCoherence =
    mix(0.90, 1.00, distribution.core)

pDominant =
    clamp01(
      tuning.dominantFamilyShare *
      correlation *
      localCoherence
    )
```

At the shipped starting `colonyStrength = 0.80`, correlation is fully enabled. Colony cores are close to the configured dominant share; fringes remain slightly more mixed.

## Individual decision

```text
dominantRoll =
    candidateChannel(candidateHash, DOMINANT_DECISION_SALT)

if dominantRoll < pDominant:
    selectedSpecies = dominantSpecies
else:
    selectedSpecies = compatible companion
```

## Category compatibility

Use exactly this starting matrix:

| Dominant -> Candidate | tuft | shrub | fern | broadleaf | flower | seed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| tuft | 1.00 | .65 | .65 | .75 | .70 | .70 |
| shrub | .90 | 1.00 | .65 | .90 | .30 | .25 |
| fern | .80 | .55 | 1.00 | .90 | .25 | .15 |
| broadleaf | .85 | .75 | .85 | 1.00 | .45 | .20 |
| flower | .85 | .25 | .30 | .65 | .55 | .30 |
| seed | .90 | .30 | .15 | .20 | .30 | 1.00 |

Companion weight:

```text
companionWeight =
    ecologyAndEdgeAdjustedWeight *
    compatibility(dominantCategory, candidateCategory)
```

Use a candidate hash channel for the companion weighted-pick roll.

If all companion weights are zero, fall back to the normal ecology/edge-adjusted biome weighted pick.

Do not add a species-pair matrix unless visual QA later proves category compatibility insufficient.

---

# Exact Tint Algorithm

Tint remains owned by `GrassBiomeProfiles.json`.

Do not hardcode white/lavender/pink families in TypeScript.

## Colony tint

For the selected flowering species:

1. scan profile entries with `entry.speciesIndex === selectedSpeciesIndex`;
2. sum their positive **raw profile `entry.weight`** values;
3. weighted-pick a tint using `distribution.tintRoll`;
4. result is `colonyTintRow`.

Do not allocate a filtered list.

Use raw tint weights intentionally: once the species is already selected, habitat and edge multipliers are identical for every tint entry of that species and therefore cancel from the tint ratio. Recomputing them would add work without changing the result.

## Per-flower tint

Use:

```text
tintCoherenceRoll =
    candidateChannel(candidateHash, TINT_COHERENCE_SALT)

if tintCoherenceRoll < tuning.tintCoherence:
    tintRow = colonyTintRow
else:
    tintRow = weighted profile tint for the same species
```

Use another candidate hash channel for the individual weighted tint roll.

Non-flower species use:

```text
tintRow = 0
```

The atlas B channel is zero for untinted foliage, so this remains visually neutral.

---

# Exact Height and Maturity Algorithm

Do not scale card height above a species `canopyHeightBand`.

That would require larger analytical bounds.

## Height

```text
baseHeightRoll =
    candidateChannel(candidateHash, HEIGHT_SALT)

heightRoll =
    clamp01(
      baseHeightRoll +
      tuning.coreHeightBias *
      (distribution.core - 0.50)
    )

cardHeight =
    lerp(
      species.canopyHeightBand[0],
      species.canopyHeightBand[1],
      heightRoll
    ) *
    canopyHeight
```

`coreHeightBias` is a normalized shift **inside the declared band**, not a scale multiplier.

## Maturity

```text
individualMaturityRoll =
    candidateChannel(candidateHash, INDIVIDUAL_MATURITY_SALT)

maturity =
    clamp01(
      0.60 * distribution.maturityRoll +
      0.25 * individualMaturityRoll +
      0.15 * distribution.core
    )

pMatureRow =
    clamp01(
      tuning.maturePhenotypeBias *
      (0.35 + 0.65 * maturity)
    )
```

Then:

```text
phenotypeRoll =
    candidateChannel(candidateHash, PHENOTYPE_SALT)

variantRow =
    phenotypeRoll < pMatureRow ? 1 : 0
```

No age attribute is added.

---

# Existing Appearance Rolls

Replace accepted-card `SeededRandom` appearance draws with candidate hash channels.

Use:

```text
yaw =
    candidateChannel(candidateHash, YAW_SALT) *
    TWO_PI

dither =
    candidateChannel(candidateHash, DITHER_SALT)

windScale =
    lerp(0.84, 1.16, candidateChannel(candidateHash, WIND_SALT)) *
    profile.windDamping

rootAo =
    resolveGrassCanopyAo(vigor, suitability) *
    lerp(0.99, 1.01, candidateChannel(candidateHash, AO_SALT))
```

This makes appearance stable under acceptance-rule changes and removes accepted-card PRNG coupling.

Keep current:

```text
coverage =
    habitatSample.density *
    pathMask *
    stoneMask
```

Keep current packed attribute:

```text
packGrassAccent(speciesIndex, variantRow, tintRow)
```

Keep dither sorting and `mesh.count` prefix trimming unchanged.

---

# Exact Shrub Art Algorithm

## File

`src/world/grass/WorldDetailFoliageAtlasFactory.ts`

Replace the old `tall-tuft` draw path with:

```ts
drawLowShrub(...)
```

The shrub must read as a leafy miniature mass on **one billboard**, not as a circular blob.

## Row 0 - compact/young

Use deterministic ranges:

```text
main branch groups                 5
horizontal branch centers         -0.32 .. +0.32 cell width
branch top                         0.55 .. 0.86 cell height
leaves                             14 .. 20
leaf length                        0.08 .. 0.16 cell height
leaf width/length                  0.38 .. 0.58
intentional silhouette holes       1
center density                     high
```

## Row 1 - mature/open

```text
main branch groups                 6 .. 7
horizontal branch centers         -0.45 .. +0.45
branch top                         0.48 .. 0.92
leaves                             12 .. 18
leaf length                        0.10 .. 0.18
leaf width/length                  0.38 .. 0.60
intentional silhouette holes       2
center density                     medium
lateral breaker leaves             1 .. 2
```

## Drawing rules

- asymmetric branch locations;
- no mirrored left/right half;
- no circle clusters;
- tapered elliptical leaves;
- some overlap, but preserve visible negative holes;
- root/center darker than outer leaves;
- outer leaves lighter toward tips;
- no tint mask;
- semantic R/G channels stay compatible with `grassResolvePalette`;
- leave transparent gaps large enough to survive mip reduction;
- do not draw single-pixel stems/leaves that disappear before the 27-30 m fade.

---

# Exact Broadleaf-Rosette Art Algorithm

Replace the old `sprig` path with:

```ts
drawBroadleafRosette(...)
```

## Row 0 - compact

```text
leaves                             7
base angular spacing               2π / 7
angle jitter                       ±0.18 rad
leaf length                        0.30 .. 0.46 cell height
leaf width/length                  0.22 .. 0.34
root offset radius                 0.00 .. 0.04
center mass                        compact/dark
```

## Row 1 - mature/asymmetric

```text
leaves                             6 .. 9
base angular spacing               2π / leafCount
angle jitter                       ±0.28 rad
leaf length                        0.28 .. 0.52
leaf width/length                  0.22 .. 0.36
one side length multiplier         0.78 .. 0.92
opposite side multiplier           1.00 .. 1.10
center mass                        visible, less compact
```

Each leaf:

- tapers at root;
- widens through the lower/middle section;
- tapers to tip;
- has slight curvature;
- varies shade along its length;
- uses no tint mask.

Avoid a flower-petal-ring appearance by varying length, width, angle, root offset, and overlap.

---

# Atlas Contract

Do not change:

```text
DETAIL_FOLIAGE_CELL_RESOLUTION     112
DETAIL_FOLIAGE_CELL_PADDING        8
DETAIL_FOLIAGE_VARIANT_ROWS        2
species columns                    8
atlas width                        1024
atlas height                       256
LinearMipmapLinearFilter
LinearFilter
generateMipmaps = true
anisotropy = 4
premultiplyAlpha = true
NoColorSpace
```

No third-party assets.

---

# Exact Biome Profile Starting Weights

These are the initial implementation values. They should be committed first, then tuned only after fixed-pose visual QA.

Keep all existing palette/density/height/wind fields unchanged.

## Meadow

Use:

```json
[
  { "species": "daisy", "tint": "white", "weight": 1.20 },
  { "species": "daisy", "tint": "cream", "weight": 0.70 },
  { "species": "daisy", "tint": "sky-blue", "weight": 0.25 },

  { "species": "round-bloom", "tint": "pink", "weight": 0.35 },
  { "species": "round-bloom", "tint": "lavender", "weight": 0.25 },
  { "species": "round-bloom", "tint": "buttercup", "weight": 0.15 },
  { "species": "round-bloom", "tint": "poppy-red", "weight": 0.10 },

  { "species": "fern", "tint": "none", "weight": 1.70 },
  { "species": "small-fern", "tint": "none", "weight": 1.00 },
  { "species": "grass-tuft", "tint": "none", "weight": 3.60 },
  { "species": "broadleaf-rosette", "tint": "none", "weight": 1.70 },
  { "species": "low-shrub", "tint": "none", "weight": 0.55 },
  { "species": "seed-head", "tint": "straw", "weight": 0.25 }
]
```

Green foliage remains dominant. Shrub is an occasional anchor. Seed heads are rare.

## Dry steppe

Use:

```json
[
  { "species": "seed-head", "tint": "straw", "weight": 4.00 },
  { "species": "grass-tuft", "tint": "none", "weight": 2.50 },
  { "species": "low-shrub", "tint": "none", "weight": 0.65 },
  { "species": "broadleaf-rosette", "tint": "none", "weight": 0.25 },

  { "species": "round-bloom", "tint": "buttercup", "weight": 0.50 },
  { "species": "round-bloom", "tint": "cream", "weight": 0.20 },
  { "species": "round-bloom", "tint": "poppy-red", "weight": 0.08 }
]
```

Do not carry `tall-tuft` forward. Seed heads provide the tall dry silhouette.

## Alpine

Use:

```json
[
  { "species": "grass-tuft", "tint": "none", "weight": 4.00 },
  { "species": "small-fern", "tint": "none", "weight": 1.20 },
  { "species": "broadleaf-rosette", "tint": "none", "weight": 0.70 },
  { "species": "low-shrub", "tint": "none", "weight": 0.12 },

  { "species": "daisy", "tint": "white", "weight": 0.65 },
  { "species": "daisy", "tint": "cream", "weight": 0.30 },
  { "species": "daisy", "tint": "sky-blue", "weight": 0.30 },

  { "species": "round-bloom", "tint": "lavender", "weight": 0.55 },
  { "species": "round-bloom", "tint": "pink", "weight": 0.20 }
]
```

Shrubs remain very rare. Pale flower forms stay secondary to low green foliage.

---

# Production Configuration

The current world config loader is flat numeric YAML. Keep it flat.

## `public/config/world.yaml`

Add near the existing macro grass habitat settings:

```yaml
# Detail foliage composition. These affect deterministic tile-build composition
# only; material, atlas, topology, LOD, and render radius stay fixed.
detailFoliageDensity: 0.35
detailFoliageColonyWorldSize: 11
detailFoliageClumpWorldSize: 2.25
detailFoliageColonyStrength: 0.80
detailFoliageDominantFamilyShare: 0.76
detailFoliageTintCoherence: 0.86
detailFoliageQuietZoneThreshold: 0.34
detailFoliageBackgroundSuppression: 0.68
detailFoliageCoreHeightBias: 0.12
detailFoliageMaturePhenotypeBias: 0.62
detailFoliageEcologyStrength: 0.72
detailFoliageEdgeCompanionStrength: 0.30
detailFoliageStoneFringeStrength: 0.38
detailFoliagePathFringeStrength: 0.18
```

These are the initial production values for implementation. Fine-tune them with the diagnostics menu only after F1-F5 are working.

---

# Runtime Tuning Contract

## New file

`src/world/grass/DetailFoliageTuning.ts`

Define:

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
```

Also define one shared limits table:

```ts
export const DETAIL_FOLIAGE_TUNING_LIMITS = {
  density: { min: 0.10, max: 0.35, step: 0.01 },
  colonyWorldSize: { min: 6, max: 16, step: 0.5 },
  clumpWorldSize: { min: 1, max: 4, step: 0.25 },
  colonyStrength: { min: 0, max: 1, step: 0.02 },
  dominantFamilyShare: { min: 0.50, max: 0.90, step: 0.01 },
  tintCoherence: { min: 0.50, max: 1, step: 0.01 },
  quietZoneThreshold: { min: 0, max: 0.70, step: 0.02 },
  backgroundSuppression: { min: 0, max: 0.90, step: 0.02 },
  coreHeightBias: { min: 0, max: 0.25, step: 0.01 },
  maturePhenotypeBias: { min: 0, max: 1, step: 0.02 },
  ecologyStrength: { min: 0, max: 1, step: 0.02 },
  edgeCompanionStrength: { min: 0, max: 0.80, step: 0.02 },
  stoneFringeStrength: { min: 0, max: 1, step: 0.02 },
  pathFringeStrength: { min: 0, max: 1, step: 0.02 },
} as const;
```

Use this table from:

- `WorldConfigSchema.ts`;
- `DetailFoliageTuningMenu.ts`;
- runtime normalization;
- deterministic config verification.

Do not duplicate ranges in three files.

## Functions

Implement:

```ts
export function createDetailFoliageTuning(
  config: WorldConfig,
): DetailFoliageTuning;

export function normalizeDetailFoliageTuning(
  tuning: DetailFoliageTuning,
): DetailFoliageTuning;

export function detailFoliageTuningEquals(
  left: DetailFoliageTuning,
  right: DetailFoliageTuning,
): boolean;
```

`normalizeDetailFoliageTuning()`:

1. clamps each value to shared limits;
2. enforces:
   ```text
   clumpWorldSize <= colonyWorldSize * 0.5
   ```
3. returns a copy.

`WorldConfigLoader` still rejects invalid production YAML; normalization exists for diagnostics/live input only.

---

# World Config Files

## `src/world/WorldConfig.ts`

Add the fourteen required numeric fields exactly matching YAML names.

## `src/world/WorldConfigSchema.ts`

Use `DETAIL_FOLIAGE_TUNING_LIMITS` for minimum/maximum values.

No optional keys.

## `src/world/WorldConfigValidator.ts`

Add:

```text
detailFoliageClumpWorldSize <=
    detailFoliageColonyWorldSize * 0.5
```

Do not add subjective art rules to the production validator.

---

# Detail Field Integration

## `WorldDetailFoliageFactory`

Own:

```text
DetailFoliageTuning
WorldDetailFoliageDistribution
one reused DetailFoliageDistributionSample
one reused DetailFoliageSelection
```

Add:

```ts
setTuning(tuning: DetailFoliageTuning): void;
```

Setter:

1. normalize/copy;
2. update distribution tuning;
3. do not rebuild itself;
4. field invalidation is owned by `WorldDetailFoliageField` caller.

## Candidate positions

Rename the tile PRNG to make its role explicit:

```text
positionRandom
```

It may be used only for x/z stratified jitter.

No `random.range()` or `random.next()` for accepted-card appearance after x/z.

## Dither

Candidate dither comes from candidate hash channel. It remains sorted ascending exactly as today.

Quality-governor `densityScale` and prefix `mesh.count` trimming remain unchanged.

## Matrix/buffer layout

Do not change:

```text
instanceMatrix
instanceVariation vec4
instanceCoverage
instanceBiome
instanceAccent
```

Do not add:

```text
instanceColony
instanceClump
instanceAge
instanceTintFamily
```

---

# Detail Field Invalidation for Diagnostics

## `WorldDetailFoliageField.invalidate()`

Implement:

```ts
invalidate(): void;
```

It must:

1. dispose every built tile through `factory.disposeTile()`;
2. remove tile meshes from scene;
3. clear `tiles`;
4. clear `emptyTiles`;
5. clear `desired`;
6. clear `queue`;
7. clear reusable request state as needed;
8. set `countsDirty = true`;
9. reset center tile coordinates;
10. reset reconciled/count focus sentinels;
11. preserve `enabled`;
12. preserve quality-governor `densityScale`;
13. not rebuild synchronously.

The next normal `update()` repopulates at `tilesPerFrame = 1`.

If new normalized tuning equals current tuning, do nothing and do not invalidate.

This path is diagnostics-only, so synchronous disposal of the small resident tile set is acceptable. Do not add production retirement machinery only for the tuning panel.

---

# Near Field / Grass System Wiring

## `src/world/grass/WorldNearGrassField.ts`

Create one tuning object from loaded `WorldConfig`.

Pass it into `WorldDetailFoliageFactory`.

Add:

```ts
getDetailFoliageTuning(): DetailFoliageTuning;
setDetailFoliageTuning(tuning: DetailFoliageTuning): void;
```

Getter returns a copy.

Setter:

```text
normalize
-> equality check
-> store copy
-> factory.setTuning()
-> detailFoliageField.invalidate()
```

Do not:

- recreate atlas;
- recreate material;
- alter quality-governor rules.

## `src/world/WorldGrassSystem.ts`

Expose copy-safe delegating getter/setter.

`update()` must remain free of distribution sampling and tuning logic.

---

# Diagnostics Tuning Menu

## New file

`src/app/DetailFoliageTuningMenu.ts`

Use the same native DOM approach as `GrassArtMenu`.

Do not add a GUI library.

Create only when:

```text
profile.showGui
AND
?diagnostics=1
```

## Controls

Use the shared `DETAIL_FOLIAGE_TUNING_LIMITS` table.

Labels:

```text
Density
Colony size
Clump size
Colony strength
Dominant family
Tint coherence
Quiet threshold
Background suppression
Core height bias
Mature phenotype
Ecology influence
Edge companions
Stone fringe
Path fringe
```

## Interaction

On `input`:

```text
update displayed value only
```

On `change`:

```text
copy edited values
-> normalize
-> resync controls if cross-field normalization changed a value
-> if unchanged: stop
-> callback setDetailFoliageTuning()
```

Do not invalidate every slider pixel.

## Reset

`Reset to YAML` restores the immutable snapshot made from the loaded production tuning.

## Export

Export a flat YAML snippet using the production key names.

Use the same clipboard + download fallback pattern as `GrassArtMenu`.

---

# Exact File Change Map

## New files

### `src/world/grass/DetailFoliageRandom.ts`

- deterministic integer hash primitives;
- position hash;
- channel scrambler;
- no renderer/config dependency.

### `src/world/grass/DetailFoliageTuning.ts`

- tuning interface;
- shared limits;
- WorldConfig mapping;
- normalization;
- equality helper.

### `src/world/grass/WorldDetailFoliageDistribution.ts`

- two-scale continuous distribution;
- four macro channels;
- one clump channel;
- allocation-free sample.

### `src/world/grass/DetailFoliageAffinity.ts`

- habitat table;
- habitat score;
- edge weights;
- weighted pick;
- dominant/companion selection;
- tint selection;
- reusable output target.

### `src/app/DetailFoliageTuningMenu.ts`

- diagnostics-only native controls;
- change-on-release;
- Reset to YAML;
- YAML export.

### `scripts/verify-detail-foliage-distribution.mjs`

- deterministic distribution and selection tests.

## Modified files

### `public/config/world.yaml`

Add final fourteen production values.

### `src/world/WorldConfig.ts`

Add fourteen fields.

### `src/world/WorldConfigSchema.ts`

Use shared tuning limits.

### `src/world/WorldConfigValidator.ts`

Add clump/colony scale rule.

### `src/grass/biome/GrassAccentSpecies.ts`

- add `shrub` and `broadleaf` categories;
- replace slots 1 and 7;
- keep count exactly eight.

### `src/grass/biome/GrassBiomeProfile.ts`

- separate source and resolved accent entry shapes;
- pre-resolve `speciesIndex` and `tintRow`;
- route defaults through the same resolver.

### `src/grass/biome/GrassBiomeProfiles.json`

Use exact starting weights in this plan.

### `src/world/grass/WorldDetailFoliageAtlasFactory.ts`

- replace tall-tuft with shrub art;
- replace sprig with rosette art;
- keep atlas dimensions/settings unchanged.

### `src/world/grass/WorldDetailFoliageField.ts`

- consume tuning;
- split position PRNG from appearance;
- use one candidate hash;
- integrate distribution and affinity;
- use reusable selection/distribution targets;
- remove hot-loop species/tint catalogue lookups;
- correlate height inside bands;
- keep current buffers/render path.

### `src/world/grass/WorldNearGrassField.ts`

- create/store tuning;
- pass to factory;
- getter/setter;
- invalidate detail only on changed tuning.

### `src/world/WorldGrassSystem.ts`

- delegate tuning getter/setter.

### `src/app/WorldApp.ts`

- create/dispose diagnostics tuning menu.

### `scripts/verify-flower-variety.mjs`

- new species/art structure/bounds checks.

### `scripts/verify-grass-performance.mjs`

- workload, RNG separation, renderer, and build-only checks.

### `scripts/verify-config-contracts.mjs`

- new config pass/fail cases.

### `package.json`

Add:

```json
"test:detail-foliage": "node scripts/verify-detail-foliage-distribution.mjs"
```

Run it from `build` before flower-variety and grass-performance verification.

### `docs/grass-detail-foliage-plan.md`

After implementation only: add a short shipped-status pointer to this plan. Do not duplicate this specification.

---

# Deterministic Verification

Automated gates protect determinism, workload, and structural behavior. Subjective art quality remains manual.

## Test 1 - distribution golden digest

Use a fixed 64 x 64 = 4,096 point grid:

```text
x = -128 + ix * 4
z = -128 + iz * 4
ix, iz = 0..63
```

Serialize in fixed field order:

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

Calculate SHA-256.

Run the complete sample twice and require equal digests.

After the first implementation is visually accepted, freeze:

```text
DISTRIBUTION_GOLDEN_SHA256
```

Do not invent a digest in advance.

## Test 2 - full selection golden digest

Use the same 4,096 coordinates with:

```text
real meadow profile
synthetic ecology:
    moisture       0.62
    fertility      0.72
    exposure       0.55
    disturbance    0.08
    rockiness      0.22
habitatDryness     0.28
pathMask           0.88
stoneMask          0.92
```

For each point:

1. calculate candidateHash;
2. distribution sample;
3. distribution keep decision;
4. if kept, resolve species/tint;
5. serialize:
   ```text
   keep flag
   speciesIndex or -1
   tintRow or -1
   ```

SHA-256 the fixed-order output.

After visual acceptance freeze:

```text
SELECTION_GOLDEN_SHA256
```

This second digest intentionally catches changes to:

- species weights;
- affinity table;
- compatibility;
- tint logic;
- candidate hash channels.

## Test 3 - tile-boundary continuity

For:

```text
k = -8..8
fixed other-axis samples:
    -97.3
    -31.2
    0.7
    42.9
    111.4
epsilon = 0.001 m
```

Sample both sides of every x and z 16 m boundary.

For:

```text
colony
clump
core
keepMultiplier
familyRoll
tintRoll
maturityRoll
```

require:

```text
abs(left - right) <= 0.011
```

Why 0.011 is the contract:

- cubic interpolation derivative is at most 1.5 per normalized cell;
- minimum clump scale is 1 m;
- the 0.002 m cross-boundary span changes raw clump noise by at most 0.003;
- `smoothstep(0.28, 0.72, C)` has maximum derivative `1.5 / 0.44`;
- therefore the worst clump-band change is about `0.01023`;
- macro channels are lower frequency and the final core/keep equations are bounded mixtures.

The verifier should retain this derivation next to the assertion. Do not replace it with a screenshot tolerance.

Also statically assert the distribution API contains no tile coordinate input.

## Test 4 - output bounds

Across deterministic grids:

```text
all distribution outputs finite
all distribution outputs in [0,1]
all weights finite and >= 0
```

## Test 5 - negative space

Analyze 256 x 256 m.

Divide into 8 m analysis cells.

Inside every 8 m cell sample a 4 x 4 grid and calculate mean `keepMultiplier`.

Quiet cell:

```text
mean keepMultiplier < 0.55
```

Shipped tuning must satisfy:

```text
quiet cells       20% .. 60%
mean keepMultiplier 0.58 .. 0.82
```

The mean gate prevents passing by creating a few extreme empty cells while leaving the rest nearly uniform.

## Test 6 - family correlation

Use a deterministic 128 x 128 sample grid at 1 m spacing with the same synthetic meadow ecology.

Compare right/down neighboring kept samples only.

For neighbors within `clumpWorldSize` require:

```text
same category ratio >= 0.60
```

Also compute a baseline that uses the same ecology-adjusted profile weights but independent candidate rolls with no macro family channel.

Require:

```text
clustered same-species ratio >= independent baseline + 0.10
```

Do not dynamically relax the threshold.

## Test 7 - tint correlation

For neighboring kept flower pairs:

```text
same tint row ratio >= 0.65
clustered same-tint ratio >= independent baseline + 0.12
```

If the fixed region does not contain at least 100 flower pairs, enlarge the fixed test region once in source. Do not make the test adapt at runtime.

## Test 8 - ecology directions

With all other inputs fixed:

```text
fern(wet,sheltered)           > fern(dry,exposed)
smallFern(wet,rocky)          > smallFern(dry,smooth)
broadleaf(fertile,moist)      > broadleaf(dry,poor)
lowShrub(lowDisturbance)      > lowShrub(highDisturbance)
seedHead(dry,exposed)         > seedHead(wet,sheltered)
daisy(fertile,open)           > daisy(poor,disturbed)
```

Test direction only, not exact score.

## Test 9 - legal selections

Across fixed samples:

```text
speciesIndex 0..7
tintRow inside current tint ceiling
selected species exists in active biome profile
non-flower tint row resolves to 0
weighted pick has deterministic fallback
```

## Test 10 - tuning normalization

Test:

```text
clump > colony/2 is normalized in live tuning
production loader rejects the same invalid relationship
equal normalized tuning does not cause an invalidation request
```

---

# Config Contract Verification

Add explicit production rejection cases:

```text
detailFoliageDensity: 0.36                         reject
detailFoliageColonyWorldSize: 5                    reject
detailFoliageClumpWorldSize: 5                     reject
clump > colony * 0.5                               reject
detailFoliageDominantFamilyShare: 0.95              reject
detailFoliageCoreHeightBias: 0.30                   reject
detailFoliageSomethingElse: 1                       reject unknown key
```

Also assert all shipped values parse exactly.

---

# Plant / Atlas Structural Verification

Extend `verify-flower-variety.mjs`.

Keep all current flower checks.

Add:

```text
low-shrub exists at index 1
broadleaf-rosette exists at index 7
tall-tuft absent
sprig absent
species count exactly 8
category union includes shrub/broadleaf
GRASS_MAX_ACCENT_PROFILE_ENTRIES === 16
every profile accentSpecies.length <= 16

maximum canopy height <= 1.72
maximum canopy width  <= 1.314

low-shrub aspect > seed-head aspect
broadleaf maximum height < daisy maximum height
broadleaf maximum height < seed-head maximum height

drawLowShrub exists
drawBroadleafRosette exists
both routines branch structurally on phenotype row

atlas columns = 8
variant rows = 2
atlas width = 1024
atlas height = 256
```

Do not try to prove subjective beauty with regex.

---

# Grass Performance Verification

Extend `verify-grass-performance.mjs`.

Assert:

```text
detailFoliageDensity <= 0.35
round(16 * 16 * density) <= 90
DETAIL_FOLIAGE_TILE_SIZE === 16
DETAIL_FOLIAGE_VARIANT_ROWS === 2
GRASS_MAX_ACCENT_SPECIES === 8
DETAIL_FOLIAGE_TILES_PER_FRAME === 1
```

Renderer contract:

```text
one detail material
castShadow = false
receiveShadow = false
same 6-vertex / 4-triangle card
same fade/residency constants
same four custom instance attributes
no colony/clump/age/tint-family attribute
```

Build-only contract:

```text
WorldDetailFoliageDistribution referenced from factory/build path
no distribution.sample in WorldGrassSystem.update
no distribution.sample in material update
no distribution.sample in controller/render loop
```

RNG separation contract:

```text
positionRandom is used only for candidate x/z jitter
exactly two positionRandom draws per requested candidate
accepted-card appearance uses candidate hash channels
no accepted-card SeededRandom.range/next calls
```

Lookup contract:

```text
candidate loop contains no GRASS_ACCENT_SPECIES.find
candidate loop contains no resolveGrassAccentTintRow
resolved profile entry contains speciesIndex + tintRow
every biome accentSpecies length <= 16
```

With the 16-entry ceiling, keep selection to a small bounded number of linear scans. Do not sort or allocate temporary weight arrays in the candidate loop.

Do not loosen the existing card/draw/vertex envelope.

---

# Manual Baseline Before Implementation

Before F1 code changes, record current `main` at the existing deterministic visual-matrix locations.

Use fixed:

```text
world config
grass art preset
quality tier = 0
viewport
device profile
camera pose
```

Record:

```text
accentCards
accentTiles
renderer draw calls
renderer triangles/vertices if available
nearTileBuildMs
maxNearTileBuildMs
desktop frame stats
compact-device frame stats
```

Capture:

- meadow;
- path verge;
- rocky patch;
- water edge;
- dry steppe;
- alpine;
- close low-angle accent shot;
- 10-25 m medium-distance accent field.

Keep these as the before reference for final F7 comparison.

---

# Manual Visual Acceptance

## Meadow

Must show:

- obvious quiet grass regions;
- coherent flower pockets;
- broadleaf pockets;
- occasional low shrub;
- green foliage dominant overall;
- no rainbow confetti;
- no 16 m tile rhythm;
- no obvious 11 m lattice squares.

## Rock

Must show:

- fern/broadleaf preference around believable protected transition regions;
- hard stone clearance still respected;
- no uniform plant rings around stones.

## Path

Must show:

- occasional interrupted flower pockets;
- no continuous flower border;
- shrub absent from hard tread.

## Water edge

Must show:

- gradual increase in moisture-loving foliage;
- no abrupt species wall.

## Dry steppe

Must show:

- seed heads clearly dominant;
- shrubs sparse;
- broadleaf rare;
- flowers muted/sparse;
- negative space preserved.

## Alpine

Must show:

- low green forms dominant;
- pale flowers restrained;
- shrubs rare;
- no meadow-like lush composition.

## Close shrub/broadleaf

Must show:

- shrub reads as irregular leafy mass, not a circle;
- transparent silhouette holes remain visible;
- rosette reads as leaves, not petals;
- no obvious billboard edge-on disappearance due current yaw-facing behavior.

## Medium distance

At 10-25 m:

- colonies read before individual cards;
- flower color reads as local patches;
- detail disappears naturally into grass before the 30 m fade.

---

# Manual Performance Acceptance

At identical before/after poses:

```text
normal per-frame distribution CPU        none
detail material count                    unchanged
atlas allocation                         unchanged
instance attribute count                 unchanged
detail draw architecture                 unchanged
resident/drawn cards                     <= previous same-pose baseline
```

A small increase in occasional detail tile build time is acceptable only if:

- the existing near build deadline is respected;
- detail still builds one tile per frame;
- no visible compact-device spike appears;
- deterministic operation bounds remain satisfied.

Do not add automated millisecond pass/fail gates.

---

# Tuning Order

Do not tune everything at once.

## 1. Negative space

Tune:

```text
Quiet threshold
Background suppression
Colony size
```

Target:

```text
quiet cells 20-60%
mean keepMultiplier 0.58-0.82
```

## 2. Colony shape

Tune:

```text
Colony strength
Clump size
```

Goal: irregular pockets, not smooth circles and not procedural speckle.

## 3. Family coherence

Tune:

```text
Dominant family
```

Goal: recognizable communities without monoculture everywhere.

## 4. Tint coherence

Tune:

```text
Tint coherence
```

Only after this should biome tint weights be adjusted.

## 5. Ecology/edges

Tune:

```text
Ecology influence
Edge companions
Stone fringe
Path fringe
```

Goal: environment explains composition without decorative borders.

## 6. Internal hierarchy

Tune:

```text
Core height bias
Mature phenotype
```

Goal: subtle age/height relationships entirely inside existing bounds.

## 7. Density last

If the result is rich enough, reduce density.

Never raise above 0.35 in this phase.

---

# Implementation Phases

## F0 - baseline

No code changes.

- record fixed-pose visual/performance baseline;
- preserve captures/metrics for final comparison.

## F1 - config + pure tuning/random helpers

Add/change:

- `public/config/world.yaml`;
- `WorldConfig.ts`;
- `WorldConfigSchema.ts`;
- `WorldConfigValidator.ts`;
- `DetailFoliageRandom.ts`;
- `DetailFoliageTuning.ts`.

Pass:

```text
npm run test:config
npm run build
```

No renderer/placement behavior change yet except config shape.

## F2 - pure distribution

Add:

- `WorldDetailFoliageDistribution.ts`;
- initial `verify-detail-foliage-distribution.mjs`.

Pass:

- repeatability;
- distribution golden generation;
- continuity;
- output bounds;
- negative-space range.

No renderer integration yet.

## F3 - profile pre-resolution + affinity

Change/add:

- `GrassBiomeProfile.ts`;
- `DetailFoliageAffinity.ts`;
- extend deterministic verifier.

Pass:

- source/resolved profile validation;
- ecology direction;
- deterministic picks;
- family correlation;
- tint correlation;
- selection golden generation.

No world rendering integration yet.

## F4 - field integration + deterministic RNG separation

Change:

- `WorldDetailFoliageField.ts`.

Pass:

- <=90 candidates/tile;
- candidate positions independent from acceptance/appearance;
- no new instance attributes;
- no extra terrain/hydrology/ecology samples;
- distribution after hard gates only;
- workload envelope unchanged or lower;
- `npm run test:grass-performance`.

## F5 - species + atlas + biome art

Change:

- `GrassAccentSpecies.ts`;
- `GrassBiomeProfiles.json`;
- `WorldDetailFoliageAtlasFactory.ts`;
- `verify-flower-variety.mjs`.

Pass:

- exactly eight species;
- bounds do not grow;
- atlas dimensions unchanged;
- structural verifier green;
- atlas debug route visually approved;
- world fixed-pose visuals materially improved.

## F6 - diagnostics tuning

Change:

- `WorldNearGrassField.ts`;
- `WorldGrassSystem.ts`;
- `DetailFoliageTuningMenu.ts`;
- `WorldApp.ts`.

Pass:

- diagnostics-only panel;
- input does not rebuild;
- change commits once;
- equal tuning does not invalidate;
- rebuild remains one tile/frame;
- Reset to YAML works;
- YAML export is valid.

Tune in the documented order.

After final visual tuning:

- update `world.yaml`;
- freeze both golden SHA-256 values.

## F7 - final gates + documentation

Change:

- `verify-grass-performance.mjs`;
- `verify-config-contracts.mjs`;
- `package.json`;
- `docs/grass-detail-foliage-plan.md` status pointer.

Run:

```text
npm run test:detail-foliage
npm run test:flower-variety
npm run test:config
npm run test:grass-performance
npm run test:grass-placement
npm run build
```

Then run fixed-pose manual visual/performance comparison on desktop and compact hardware.

No GitHub Actions.

Deploy manually using the existing GitHub Pages command only after acceptance.

---

# Definition of Done

```text
[ ] visible colonies replace uniform sprinkle
[ ] meaningful quiet grass regions exist
[ ] local flower tint is coherent
[ ] low shrub reads as a real small leafy mass
[ ] broadleaf rosette reads as a low/wide plant
[ ] ecology explains local family distribution
[ ] path/stone hard clearances are unchanged
[ ] no visible 16 m tile rhythm
[ ] no obvious macro lattice squares

[ ] species count exactly 8
[ ] atlas remains 1024 x 256
[ ] variant rows remain 2
[ ] maximum height multiplier <= 1.72
[ ] maximum width multiplier <= 1.314
[ ] material count unchanged
[ ] draw-call architecture unchanged
[ ] no detail shadows
[ ] no new instance attribute
[ ] render radius unchanged

[ ] production density <= 0.35/m²
[ ] candidates <= 90/tile
[ ] only two new continuous noise fields
[ ] eight lattice hashes/sample
[ ] one candidate identity hash
[ ] candidate position RNG consumes exactly two draws/candidate
[ ] appearance/acceptance do not consume position RNG
[ ] distribution sampler allocates nothing
[ ] affinity selection allocates nothing
[ ] no new terrain/hydrology/ecology samples
[ ] distribution/composition runs only during tile build
[ ] height correlation stays within declared species bands

[ ] source/resolved biome profile split implemented
[ ] speciesIndex/tintRow pre-resolved
[ ] candidate loop has no species/tint catalogue lookup

[ ] distribution golden digest passes
[ ] selection golden digest passes
[ ] tile continuity passes
[ ] negative-space gates pass
[ ] family correlation passes
[ ] tint correlation passes
[ ] ecology direction passes
[ ] tuning normalization passes
[ ] config rejection tests pass
[ ] plant structural verifier passes
[ ] grass performance verifier passes
[ ] full npm build passes

[ ] fixed-pose visuals materially better than baseline
[ ] same-pose resident/drawn detail cards <= baseline
[ ] compact-device profiling shows no meaningful regression
```

---

# Final Priority

Implement in this order:

```text
1  baseline
2  deterministic random/tuning infrastructure
3  continuous colony/negative-space field
4  profile pre-resolution
5  ecology + dominant-family/tint selection
6  field integration with stable candidate positions
7  shrub/broadleaf silhouettes
8  diagnostics tuning
9  density reduction only if visually safe
10 freeze deterministic goldens
```

The intended result is:

> Fewer unrelated decorations. Larger quiet spaces. Small, coherent plant communities that look authored while costing the same or less to render.
