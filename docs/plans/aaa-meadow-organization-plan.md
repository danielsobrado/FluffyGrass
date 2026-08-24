# AAA Meadow Organization, Material Separation, and Visual Hierarchy Plan

Status: planned
Baseline date: 2026-08-24
Baseline branch: `main`
Baseline commit checked before writing: `64b1445` (`fix(grass): separate understory leaf forms`)

Companion documents:

- [aaa-world-visual-upgrade-plan.md](aaa-world-visual-upgrade-plan.md)
- [aaa-grass-execution-plan.md](aaa-grass-execution-plan.md)
- [aaa-foreground-grass-clumping-shape-color-plan.md](aaa-foreground-grass-clumping-shape-color-plan.md)
- [aaa-look-audit.md](aaa-look-audit.md)
- [tiny-glade-detail-foliage-plan.md](tiny-glade-detail-foliage-plan.md)

---

## 1. Purpose and assessment of the brief

The review that prompted this document is right about the diagnosis and right
about the ordering. The scene has enough geometry; what it lacks is
**organization, material separation, and visual hierarchy**. This plan turns the
twelve observations into an implementable contract.

Two corrections before the work is specified, because they change what gets
built:

**(a) Several of the requested systems already exist and must be tuned, not
rebuilt.** The repository already ships ecological causality
(`src/world/ecology/WorldEcologyField.ts`), macro dryness/vigour/clearing fields
(`src/grass/GrassFieldVariation.ts`), a 180 m biome partition with a rank
transform (`src/world/grass/WorldBiomeField.ts`), stochastic LOD dither in every
grass layer, flower colony fields with tint coherence
(`src/world/grass/WorldDetailFoliageDistribution.ts`), clump archetypes and
morphology profiles (`src/world/grass/GrassClusterProfile.ts`), and a procedural
terrain substrate with meso/micro noise, path cores, stone-contact soil and a wet
sheen (`src/world/TerrainMaterialShader.ts`). Re-implementing any of these would
regress verification gates that already bound them. Every phase below names the
existing owner and extends it.

**(b) The LOD banding has a specific, findable cause that the brief describes
only by symptom.** It is not that the transitions are non-stochastic — they
already are. It is that **six independent camera-distance schedules share the
same two edge values (28 m and 54 m)**, and one of them (`terrainFarMerge` in
`TERRAIN_DETAIL_COLOR`) is a raw albedo ramp on the ground keyed to camera
distance. Stacked schedules that share edges read as one hard ring no matter how
well each is individually dithered. Section 5 lists all six with line-level
references. This is why "fix visible LOD banding" is correctly first: it is a
small, surgical change with the largest single payoff.

One re-ordering. The brief puts palette last. Half the palette problem is a
**single constant** (`tipLuminanceScale: 1.38` in
`src/grass/materials/GrassPaletteTuning.json`) and a **single preset value**
(`normalUp: 0.76`), both of which change how every later phase is judged.
Phase 7 therefore ships a *provisional* palette move at the end of Phase 1
(Section 6.8) so subsequent phases are tuned against the intended target; the
full palette pass still lands last.

---

## 2. Scope

### In scope

- Camera-distance LOD schedule separation and world-space band jitter across
  grass, detail foliage, and terrain (brief items 3, 11).
- Per-fragment evaluation of the macro ecology fields on the terrain, so ground
  structure survives terrain resolution rings and distance (items 3, 11).
- A new mid-scale **community field** that names vegetation communities and
  drives density, height, accent share, and archetype (items 2, 7, 8).
- Grass/path/soil transition ecology (item 5).
- Terrain substrate: second mottle octave, hollows, moss, soil-hue
  decorrelation, clump-scale contact AO (items 4, 10).
- Near-blade silhouette diversity, rosette clusters, broad blades (item 6).
- Blade lighting separation: normal-flattening schedule, canopy-depth AO,
  clump-core AO (items 9, 10).
- Meadow palette: a global desaturation lever, a new default preset, biome and
  soil colour moves (items 1, 12).

### Out of scope

- Trees, stones, water, clouds, sky, character, wind architecture, interaction
  and trail systems. They may be read from; they are not modified except where a
  uniform they already own is renamed.
- The grass streaming/budget architecture, the impostor atlas baker, and the
  quality governor's contracts.
- New render passes. Everything here is build-time CPU work, existing uniforms,
  or additions to shader chunks that already run.

### Non-negotiable invariants

1. **LOD colour parity.** `verify-lod-color-parity` bounds the p95 near/mid/far
   colour delta. Every colour change goes through
   `setBalancedGrassPaletteColors` / `grassResolvePalette`
   (`src/grass/materials/GrassPaletteShader.ts`) so all LODs move together.
2. **Determinism.** Every field is a pure function of world position and
   `config.seed`. No frame accumulation, no camera dependence in placement.
3. **Reserved bounds.** Anything that can move a vertex further from its root
   must widen the reserved radius in `src/world/grass/GrassRuntimeMath.ts` and
   stay inside `verify-lod-continuity`'s reproduction of it.
4. **Allocation-free hot paths.** Placement loops and per-frame updates allocate
   nothing; new samplers fill caller-owned targets, as `sampleGrassHabitat` does.
5. **Budgets.** No phase may regress `verify-grass-performance` or
   `verify-grass-streaming-performance`. Per-phase budgets are stated inline.

---

## 3. Current architecture map

| Concern | File | Owns |
|---|---|---|
| Ecological causes | `src/world/ecology/WorldEcologyField.ts` | moisture, fertility, exposure, disturbance, rockiness, shade |
| Ecology constants | `src/world/ecology/WorldEcologyTuning.ts` | the coefficients above |
| Macro variation | `src/grass/GrassFieldVariation.ts` | dryness (27 m), vigour (19 m), clearing (7 m), canopy AO |
| Biome partition | `src/world/grass/WorldBiomeField.ts` | 180 m regions, rank transform, per-blade border dither |
| Biome art | `src/grass/biome/GrassBiomeProfiles.json` | palette, density, height/width bands, accent species |
| Grass habitat | `src/world/grass/GrassHabitatField.ts` | density, height, dryness, clumpScale, underlayer, lean, accentChance, openness, archetype |
| Clump morphology | `src/world/grass/GrassClusterProfile.ts` (+ `…Tuning.ts`) | per-archetype tier shares, coverage, lean, plane coherence |
| Near placement | `src/world/grass/WorldSingleBladeTileFactory.ts` | clump grammar, per-instance matrix and `instanceVariation` |
| Near layers | `src/world/grass/WorldNearGrassField.ts` | ultra-near / base / bridge / density-boost bands |
| Blade shader | `src/grass/materials/GrassNearMaterial.ts` | keep test, wind, sub-pixel widening, palette, backlight |
| Palette | `src/grass/materials/GrassPaletteShader.ts` + `GrassPaletteTuning.json` | the one palette function every LOD shares |
| Art presets | `src/grass/GrassArtPresets.json`, `src/grass/GrassArtDirection.ts` | colours, distances, densities |
| Mid/far system | `src/world/WorldGrassSystem.ts` | chunk streaming, mid patches, far impostor groups |
| LOD control | `src/grass/GrassLodController.ts`, `src/grass/GrassLodTuning.ts` | coverage schedules, mid draw truncation |
| Impostors | `src/world/grass/WorldGrassImpostorMaterial.ts` | card shading, stochastic coverage |
| Detail foliage | `src/world/grass/WorldDetailFoliageField.ts`, `…Distribution.ts`, `…Affinity.ts`, `DetailFoliageTuning.ts` | flowers, ferns, tufts, litter |
| Terrain material | `src/world/TerrainMaterialShader.ts`, `src/world/TerrainMaterialController.ts` | the whole ground fragment stage |
| Terrain inputs | `src/world/terrain/TerrainSurfaceField.ts`, `TerrainSurfacePalette.ts`, `TerrainSurfaceNoiseTexture.ts` | per-vertex attributes, palette rows, RGBA noise |
| Terrain geometry | `src/world/TerrainChunk.ts`, `src/world/TerrainStreamer.ts` | vertex attribute writing, resolution rings |
| Path | `src/world/TerrainField.ts` | path distances, `samplePathGrassMask`, `PATH_GRASS_FEATHER` |
| Config | `src/world/WorldConfig.ts`, `WorldConfigSchema.ts`, `WorldConfigValidator.ts`, `public/config/world.yaml` | every lever below |

---

## 4. Phase overview

| Phase | Brief items | Headline change | Risk |
|---|---|---|---|
| 1 | 3, 11 | Separate and jitter every camera-distance schedule; evaluate macro fields per fragment | Medium |
| 2 | 5 | Ragged, ecological path verges; pioneer blades; dirt flecks | Low |
| 3 | 2, 7, 8 | New `WorldCommunityField`; communities drive density/height/accents | Medium |
| 4 | 4, 10 | Substrate: fleck octave, hollows, moss, soil-hue decorrelation, clump AO | Low |
| 5 | 6 | `instanceShape` attribute, rosette clusters, broad blades | Medium |
| 6 | 9, 10 | Normal-up distance schedule, canopy-depth AO, clump-core AO | Low |
| 7 | 1, 12 | Global desaturation lever, new default preset, biome/soil colour moves | Low |

```text
Phase 1 ──┬─> Phase 3 ──> Phase 4 (community-aware substrate)
          │                  ^
          ├─> Phase 2 ───────┘
          │
          └─> Phase 7a (provisional palette)

Phase 5 ──> Phase 6 ──> Phase 7b (full palette)
```

Phases 2, 5, 6 are independent of Phase 3 and can proceed in parallel once
Phase 1 lands. Phase 4's substrate terms can land before Phase 3; only its
community-aware terms wait.

---

## 5. Root-cause analysis

### 5.1 The banding stack (brief item 3)

Every schedule below is a function of **camera distance** and modifies what a
ground or grass pixel looks like. Six of them share edges at 28 m and 54 m.

| # | Schedule | Where | Today | What it changes |
|---|---|---|---|---|
| B1 | `terrainFarMerge` | `TerrainMaterialShader.ts`, `TERRAIN_DETAIL_COLOR` | `smoothstep(uTerrainLodDistances.z, .w, d)` = 28→54 | Mixes ground albedo toward `terrainCanopy`. **A raw colour ramp on the ground.** |
| B2 | `terrainMesoWeight` | same file | `1 - smoothstep(28, 54, d)` | Meso mottling amplitude → variance collapse over the same ring |
| B3 | `terrainMicroWeight` | same file | `1 - smoothstep(6, 7, d)` | Micro grain, dry fibre, path grit. **1 m transition.** |
| B4 | Terrain resolution rings | `TerrainStreamer.ts` L226–231 | Chebyshev chunk distance ≤1 → 25, ≤`radius-1` → 13, else 7 | Vertex spacing 2.67 / 5.33 / 10.67 m at `chunkSize: 64` → the ground's ecology detail halves at a square ring |
| B5 | Detail-foliage fade | `WorldDetailFoliageField.ts` L128–129 | `38 ± 4` | All understory vanishes in an 8 m ring |
| B6 | Mid density falloff | `GrassNearMaterial.ts`, `GRASS_MID_DENSITY_FALLOFF` | `start 28, end 62, floor 0.18` | Blade grain thins from the same 28 m edge |

Supporting evidence in the code itself: `GrassNearMaterial.ts` already carries a
comment about a *previous* instance of exactly this failure —

> "Keying it to `uGrassNearDistance` gave the five near/mid layers five different
> schedules (3.4 m, 9.4 m, 14.6 m), so the two co-located populations inside the
> ultra-near band were lit differently and the handoff at 6-7 m read as a
> brightness ring following the camera."

The fix applied then (one shared shading schedule) was right for *shading*. The
remaining problem is its mirror image: schedules that genuinely must differ have
been left sharing edges.

Three sub-causes are not "dither harder":

- **B1 is a mean shift, not a variance shift.** No amount of stochastic dither
  hides a ramp between two different colours. It has to be re-keyed and widened.
- **B3 is not mean-preserved for `terrainGrit`.** `TERRAIN_DETAIL_COLOR` already
  mean-preserves the dry fibre pulse (`TERRAIN_DRY_FIBRE_PULSE_MEAN`), but
  `terrainGrit = smoothstep(0.64, 0.86, micro.b) * terrainMicroWeight` feeds
  `mix(terrainPathColor, uTerrainPathGrit, terrainGrit * 0.24)` with no such
  correction — so paths brighten at 6–7 m.
- **B4 is a spatial-frequency step, not a colour step.** The macro dryness field
  has a 27 m period and the vigour field 19 m. At the far ring's 10.67 m vertex
  spacing the vigour field is below Nyquist and aliases. This is also brief
  item 11's real cause: the distant meadow does not "lose structure" because of
  geometry LOD, it loses it because **the ground can no longer carry the fields
  that make structure**.

### 5.2 Flat grass lighting (brief item 9)

`normalUp: 0.76` in every preset (`src/grass/GrassArtPresets.json`) and
`normalUp: 0.76` in `public/config/grass.yaml`. In `GrassNearMaterial`'s
`VERTEX_NORMAL`:

```glsl
objectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), uGrassNormalUp));
```

76% of every blade's normal is world up, so blades facing the sun and blades
facing away return nearly the same Lambert response. It also flattens
`grassThinness = 1.0 - abs(dot(normal, grassSunDirection))` in `FRAGMENT_OUTPUT`,
which is the transmission term — so the backlighting the brief asks for is
already implemented correctly and is being suppressed by the same constant.

### 5.3 Identical near silhouettes (brief item 6)

`WorldSingleBladeTileFactory.createSingleBladeGeometry` builds **one** source
blade per segment count and caches it (`getSourceGeometry`). Every near instance
is an affine copy: `matrix.compose(position, align, scale)`. The apex sits at
local x = 0, so every blade is a symmetric isoceles triangle differing only in
width, height, yaw and lean. That is exactly the "many identical thin triangles"
read.

### 5.4 Everything the same hue (brief items 1, 12)

- `tipLuminanceScale: 1.38` in `GrassPaletteTuning.json` scales the tip colour to
  138% of base luminance before shading, on top of already-yellow tips
  (`lush-hero` `tipColor: "#c7dc61"`).
- `TerrainSurfaceField.sample` derives `humidity` from
  `(1 - dryness) * 0.68 + vigor * 0.32 + hydrology.humidityBoost`, and
  `TERRAIN_DETAIL_COLOR` then does
  `terrainSoil = mix(uTerrainSoilDry, uTerrainSoilRich, terrainHumidity)`. Soil
  colour is therefore a **function of grass dryness** — the two can never
  separate, which is precisely the "base terrain, grass blades and understory sit
  too close in hue" complaint.
- `uTerrainSoilDry: "#9a794b"` is the mustard visible where the grass opens.

### 5.5 Distribution reads as noise (brief items 2, 7)

The existing macro fields are all *modulations of the same thing*: dryness
(27 m), vigour (19 m), clearing (7 m), macro patch (36 m). None of them **names a
community**, so every point in the world is "grass, a bit drier/wetter/denser".
There is no field that says "this 25 m patch is a tall-grass colony and that one
is a short sward" and then makes density, height, accent share, understory share
and archetype agree with that statement. Phase 3 adds it.

---

## 6. Phase 1 — LOD band separation and per-fragment macro fields

**Objective.** No camera-distance ring is visible in a settled frame at any
camera height, and the ground's macro structure is independent of terrain
resolution.

### 6.1 New module: `src/grass/GrassLodBanding.ts`

One owner for the world-space wander applied to every distance schedule, with a
CPU function and a GLSL mirror so the two cannot drift.

```ts
/**
 * World-space wander applied to every camera-distance LOD edge.
 *
 * Six schedules in this renderer key off camera distance. Individually each is
 * dithered; together they used to share the same two edge values, which is what
 * turned a stack of soft fades into one hard ring. Offsetting each schedule's
 * *distance* by a low-frequency world-space field breaks the ring into a
 * wandering boundary that no longer follows the camera, without changing any
 * schedule's mean.
 *
 * The field is zero-mean by construction, so a schedule's average coverage over
 * a large area is unchanged and `verify-lod-color-parity`'s budget is untouched.
 */
export const LOD_BAND_JITTER_PERIOD = 46;   // metres per lattice cell
export const LOD_BAND_JITTER_SEED = 0x2f_a5_1b_c7;

/** Zero-mean offset in [-0.5, 0.5], smooth in world space. */
export function sampleLodBandOffset(x: number, z: number): number;

/** GLSL mirror; declares `float grassLodBandOffset(vec2 world)`. */
export const LOD_BAND_GLSL: string;
```

Implementation: reuse the two-octave `patchNoise` construction from
`GrassFieldVariation.ts` (coarse + 0.5 × fine at 2.7×, normalised by 1.5), then
subtract 0.5. Do **not** re-export `GrassFieldVariation`'s private helpers;
duplicate the four lines so the band field can be re-tuned without moving the
ecology fields.

Applied as `effectiveDistance = distance + jitterMetres * grassLodBandOffset(worldXZ)`,
where `jitterMetres` is per-schedule and sized at **0.5 × the schedule's own
half-width**, so a boundary wanders by half its transition width and can never
invert (`start` must stay below `end`).

### 6.2 Schedule separation table

Rule enforced by a new gate (Section 6.7): *no two schedules that affect the same
pixel may have edges within 4 m of each other, and their transition intervals may
not overlap by more than 25% of the narrower interval.*

| Schedule | Owner | Today | Target | Jitter (m) |
|---|---|---|---|---|
| ultra-near blades | `grassUltraNearDistance` / `…TransitionDistance` | 6 ± 1 | **6 ± 3** | 1.5 |
| terrain micro detail | `uTerrainLodDistances.x/y` | 6 → 7 | **9 → 27** (own uniform) | 4.0 |
| grass micro shading fade | `grassMicroDetailFadeStart/End` | 3 → 10 | **3 → 13** | 0 (shading only) |
| near density boost | `grassNearDensityBoostDistance/Transition` | 14 ± 6 | **15 ± 6** | 3.0 |
| near bridge | `grassNearBridgeDistance/Transition` | 18 ± 2 | **22 ± 4** | 2.0 |
| near → mid | preset `nearDistance` / `transitionDistance` | 28 ± 8 | 28 ± 8 (unchanged) | 4.0 |
| mid density falloff | `GRASS_MID_DENSITY_FALLOFF` | 28 → 62 | **36 → 74** | 5.0 |
| detail foliage fade | `DETAIL_FOLIAGE_FADE_DISTANCE/TRANSITION` | 38 ± 4 | **42 ± 12** | 5.0 |
| terrain meso detail | `uTerrainLodDistances.z/w` | 28 → 54 | **46 → 100** (own uniform) | 8.0 |
| terrain canopy merge | `terrainFarMerge` | 28 → 54 | **64 → 136** (own uniform) | 10.0 |
| mid → far | preset `midDistance` / `transitionDistance` | 54 ± 8 | 54 ± 8 (unchanged) | 4.0 |
| far → terrain | preset `farDistance` / `transitionDistance` | 280 ± 8 | unchanged | 6.0 |

The two preset handoffs stay put: they are load-bearing for
`verify-grass-bridge-lod` and `verify-lod-continuity`, and once everything else
moves off their edges they stop being visible on their own.

Ordering constraint to assert in the gate: the canopy merge must not begin before
the mid layer has actually thinned, i.e.
`terrainCanopyMergeStart >= GRASS_MID_DENSITY_FALLOFF.end - 12`.

### 6.3 B1 — re-key and widen the terrain canopy merge

`src/world/TerrainMaterialShader.ts`, in `TERRAIN_DETAIL_FRAGMENT`, replace the
single `uTerrainLodDistances` vec4 with three named ranges plus the jitter
amount:

```glsl
uniform vec2 uTerrainMicroRange;        // (start, end) metres
uniform vec2 uTerrainMesoRange;
uniform vec2 uTerrainCanopyMergeRange;
uniform vec3 uTerrainBandJitter;        // metres for (micro, meso, canopy)
```

In `TERRAIN_DETAIL_COLOR`, compute the wander once and derive each weight from
its own jittered distance:

```glsl
float terrainBandOffset = grassLodBandOffset(vTerrainWorldPosition.xz);
float terrainMicroDistance  = terrainDistance + uTerrainBandJitter.x * terrainBandOffset;
float terrainMesoDistance   = terrainDistance + uTerrainBandJitter.y * terrainBandOffset;
float terrainCanopyDistance = terrainDistance + uTerrainBandJitter.z * terrainBandOffset;

float terrainMicroWeight = 1.0 - smoothstep(
  uTerrainMicroRange.x, uTerrainMicroRange.y, terrainMicroDistance
);
float terrainMesoWeight = 1.0 - smoothstep(
  uTerrainMesoRange.x, uTerrainMesoRange.y, terrainMesoDistance
);
float terrainFarMerge = smoothstep(
  uTerrainCanopyMergeRange.x, uTerrainCanopyMergeRange.y, terrainCanopyDistance
);
```

Use **one** shared `terrainBandOffset` sample, not three: three decorrelated
fields would make the three weights disagree at a point and produce mottling
where a smooth ground is wanted. One field with three different amplitudes
already separates the boundaries in *distance*, which is what matters.

Additionally, weaken the merge itself. Today:

```glsl
terrainSurfaceColor = mix(terrainSurfaceColor, terrainCanopy, terrainFarMerge * terrainCoverage);
```

`terrainCanopy` is `mix(biomeBase, biomeTip, shade.y * 0.42) * (0.78 + macroVar)`
mixed toward dry — a materially different colour from the near ground. Cap the
merge so the ground can never fully become canopy:

```glsl
terrainSurfaceColor = mix(
  terrainSurfaceColor,
  terrainCanopy,
  terrainFarMerge * terrainCoverage * uTerrainCanopyMergeStrength
);
```

with `uTerrainCanopyMergeStrength` from config `terrainCanopyMergeStrength: 0.62`
(range 0–1). The remaining difference is then carried by the impostor cards,
which is where distant canopy colour belongs.

`src/world/TerrainMaterialController.ts` changes:

- Delete `uTerrainLodDistances`; add the four uniforms above, sourced from
  `config.terrainMicroDetailStart/End`, `terrainMesoDetailStart/End`,
  `terrainCanopyMergeStart/End`, `terrainLodBandJitter*`,
  `terrainCanopyMergeStrength`.
- `setGrassArtDirection` currently writes `lod.z = direction.nearDistance` and
  `lod.w = direction.midDistance`. **Remove both writes.** The terrain schedules
  are no longer derived from the grass preset; that derivation is B1's cause.
- Bump `MATERIAL_CACHE_KEY` to
  `world-terrain-ecosystem-surface-v12-band-separation`.

### 6.4 B3 — mean-preserve `terrainGrit`

Mirror the existing `TERRAIN_DRY_FIBRE_PULSE_MEAN` treatment. In
`src/world/terrain/TerrainSurfaceNoiseTexture.ts` add:

```ts
/**
 * Mean of `smoothstep(0.64, 0.86, B)` over the fine channel, measured across the
 * whole 256x256 field at level 0 and quantized exactly as the texture stores it.
 * Held constant as the micro weight fades, for the same reason the fibre mean is:
 * only the speckle may disappear with distance, never the average.
 */
export const TERRAIN_GRIT_PULSE_MEAN = 0.0975;
```

The exact value must be **measured**, not guessed: add a one-off measurement to
`verify-terrain-surface` that recomputes it across the six seeds it already
sweeps and fails if the constant is off by more than 0.004.

Then in `TERRAIN_DETAIL_COLOR`:

```glsl
float terrainGrit = TERRAIN_GRIT_PULSE_MEAN +
  (smoothstep(0.64, 0.86, terrainMicroNoise.b) - TERRAIN_GRIT_PULSE_MEAN) *
  terrainMicroWeight;
```

### 6.5 B4 / item 11 — per-fragment macro fields

New file `src/world/terrain/TerrainMacroFieldShader.ts` exporting
`TERRAIN_MACRO_FIELD_GLSL`: a **bit-exact** GLSL mirror of `hashLattice` and
`valueNoise` from `src/grass/GrassFieldVariation.ts`. `Math.imul` is a 32-bit
signed multiply and GLSL ES 3.0 `uint * uint` is mod 2^32, so the bit patterns
agree; three 0.185 is WebGL2-only, so `uint` and bit operators are available.

```glsl
uint terrainHashLattice(int x, int z, uint seed) {
  uint v = (uint(x) * 374761393u) ^ (uint(z) * 668265263u) ^ seed;
  v = (v ^ (v >> 13u)) * 1274126177u;
  return v ^ (v >> 16u);
}

float terrainHash01(int x, int z, uint seed) {
  return float(terrainHashLattice(x, z, seed)) / 4294967296.0;
}

float terrainValueNoise(vec2 p, uint seed) {
  vec2 cell = floor(p);
  vec2 f = p - cell;
  vec2 w = f * f * (3.0 - 2.0 * f);
  int cx = int(cell.x);
  int cz = int(cell.y);
  float c00 = terrainHash01(cx,     cz,     seed);
  float c10 = terrainHash01(cx + 1, cz,     seed);
  float c01 = terrainHash01(cx,     cz + 1, seed);
  float c11 = terrainHash01(cx + 1, cz + 1, seed);
  return mix(mix(c00, c10, w.x), mix(c01, c11, w.x), w.y);
}

float terrainPatchNoise(vec2 world, float period, uint seed) {
  float coarse = terrainValueNoise(world / period, seed);
  float fine = terrainValueNoise((world * 2.7) / period, seed ^ 0x9e3779b9u);
  return (coarse + fine * 0.5) / 1.5;
}
```

Precision note for the gate: `float(uint)` loses bits above 2^24, so a GLSL
sample can differ from the JS one by at most ~6e-8 relative. The parity gate uses
a 1e-5 tolerance.

Wire-up in `TERRAIN_DETAIL_COLOR`, immediately after the existing attribute
unpack:

```glsl
// Vigour and macro dryness are the two fields that give the ground its
// large-scale structure, and both are sampled per *vertex* today. At the far
// terrain ring one vertex covers 10.67 m, which is under Nyquist for the 19 m
// vigour field: the structure aliases away exactly where the eye needs it.
// Evaluating the same functions per fragment makes ground structure independent
// of terrain resolution, which is what stops the distant meadow collapsing into
// noise and what removes the square ring at the resolution boundary.
float terrainMacroVigor = terrainPatchNoise(
  vTerrainWorldPosition.xz, uTerrainMacroPeriods.x, uTerrainVigorSeed
);
float terrainMacroDryness = terrainPatchNoise(
  vTerrainWorldPosition.xz, uTerrainMacroPeriods.y, uTerrainDrynessSeed
);
terrainVigor = terrainMacroVigor;
terrainDryness = saturate(
  terrainDryness
  + (terrainMacroDryness - vTerrainBiome.w) * uTerrainMacroDrynessStrength
);
```

Two supporting facts make this exact rather than approximate:

- `terrainEcology.y` **is** `sampleGrassMacroVigor(x, z)` verbatim
  (`TerrainSurfaceField.sample`), so the varying can simply be replaced.
- Macro dryness enters `terrainEcology.z` through `sampleGrassHabitat` as
  `sampleGrassMacroDryness(x, z) * GRASS_MACRO_DRYNESS_STRENGTH`. Subtracting the
  vertex value and adding the fragment value removes the double count exactly.
  `uTerrainMacroDrynessStrength` is `GRASS_MACRO_DRYNESS_STRENGTH` (0.22),
  injected as a GLSL literal from the TypeScript constant so it cannot drift.

To supply `vTerrainBiome.w`, widen the biome attribute from `vec3` to `vec4`:

- `src/world/terrain/TerrainSurfaceField.ts`: `TerrainSurfaceTargets.biome`
  becomes `THREE.Vector4`; write
  `targets.biome.set(biome.indexA, biome.indexB, biome.blend, macroDryness)`
  where `macroDryness = sampleGrassMacroDryness(x, z)` (already imported
  transitively; import it explicitly).
- `src/world/TerrainChunk.ts`: `this.biome = new THREE.Vector4()`,
  `this.biomes = new Float32Array(vertexCount * 4)`, offset `* 4`, write four
  components, `new THREE.BufferAttribute(this.biomes, 4)`.
- `src/world/TerrainMaterialShader.ts`: `attribute vec4 terrainBiome;`,
  `varying vec4 vTerrainBiome;`, and pass `.w` through unchanged in
  `TERRAIN_DETAIL_POSITION`.

New uniforms on the controller:

```ts
uTerrainMacroPeriods: { value: new THREE.Vector2(19, 27) },  // vigour, dryness
uTerrainVigorSeed:   { value: 0x27220a95 },                  // VIGOR_SEED
uTerrainDrynessSeed: { value: 0x517cc1b7 },                  // DRYNESS_SEED
```

Seeds and periods must be **imported from `GrassFieldVariation.ts`**, which
means exporting `DRYNESS_PERIOD`, `VIGOR_PERIOD`, `DRYNESS_SEED`, `VIGOR_SEED`
from that module. Three.js uploads `uint` uniforms as `1ui`; declare them as
`uniform uint` in GLSL and set `value` to a plain number — three's
`WebGLUniforms` dispatches on the declared GLSL type, so the JS number is
converted correctly.

**Cost.** Two 2-octave fields = 16 hash evaluations per terrain fragment, each
two integer multiplies and three XOR/shifts. Measured budget: ≤ 0.35 ms on the
reference desktop capture at 1080p with the terrain filling the frame. If
`verify-grass-performance` shows more, gate the fragment path behind
`terrainMesoWeight > 0.001` — beyond the meso range the vertex value is adequate
because the fields are then sub-pixel anyway.

### 6.6 B5 — detail foliage fade

`src/world/grass/WorldDetailFoliageField.ts`:

```ts
export const DETAIL_FOLIAGE_FADE_DISTANCE = 42;
export const DETAIL_FOLIAGE_FADE_TRANSITION = 12;
```

`DETAIL_FOLIAGE_VISIBILITY_RADIUS` is derived from these plus
`DETAIL_FOLIAGE_RESIDENCY_MARGIN`, so the streamed radius grows; confirm against
`verify-world-grass-allocation` and `verify-near-grass-streaming` and raise the
tile budget if the residency set grows past its ceiling.

Additionally, **stagger the fade per species** so the understory does not vanish
as one layer. In `src/world/grass/WorldDetailFoliageMaterial.ts`, the vertex
stage already has a stable per-instance `vPhenotype`; add a per-species offset
derived from the atlas row:

```glsl
// Each species leaves at its own distance. One shared fade removes the whole
// understory across a single ring; spreading the departures over the transition
// turns that ring into a gradual thinning of the community.
float foliageSpeciesFadeOffset =
  (fract(instanceSpecies * 0.61803398875) - 0.5) * uFoliageFadeStagger;
float foliageFadeDistance = uFoliageFadeDistance + foliageSpeciesFadeOffset
  + uFoliageFadeJitter * grassLodBandOffset(foliageWorldPosition.xz);
```

with `uFoliageFadeStagger` = 8 m and `uFoliageFadeJitter` = 5 m.

### 6.7 New verification gate

`scripts/verify-lod-band-separation.mjs`, wired into `npm run build` immediately
after `verify-lod-continuity`, and as `npm run test:lod-bands`.

The script reads the numbers from source rather than duplicating them, following
the pattern already used by `verify-lod-continuity` (TypeScript source parsed
with the `typescript` package, YAML read with the local `readYamlNumber`
helper).

Assertions:

1. **Edge separation.** Build the schedule list from `public/config/world.yaml`,
   `src/grass/GrassArtPresets.json` (every preset), `GrassLodTuning.ts`,
   `GrassNearMaterial.ts` (`GRASS_MID_DENSITY_FALLOFF`), and
   `WorldDetailFoliageField.ts`. For every ordered pair of schedules, assert
   `min(|a.start - b.start|, |a.start - b.end|, |a.end - b.start|, |a.end - b.end|) >= 4`.
2. **Interval overlap.** Assert overlap of the transition intervals is
   `<= 0.25 * min(widthA, widthB)`.
3. **Ordering.** `terrainCanopyMergeStart >= midDensityFalloffEnd - 12`;
   `terrainMesoEnd <= terrainCanopyMergeEnd`; every `start < end`.
4. **Jitter safety.** For every schedule, `jitter * 0.5 < (end - start) * 0.5`,
   so a jittered `start` can never cross a jittered `end`.
5. **Mean preservation.** Numerically integrate each jittered weight over a
   64 000-sample world lattice and assert the mean differs from the unjittered
   weight's mean by `< 0.015` absolute at every one of 40 distance samples.
6. **Macro parity.** Import `GrassFieldVariation.ts` through the vite dev server
   (as `verify-terrain-surface` does), evaluate `sampleGrassMacroVigor` and
   `sampleGrassMacroDryness` at 4 096 positions, and compare against a JS
   re-implementation of the GLSL text extracted from
   `TerrainMacroFieldShader.ts` — parsed, not re-typed — with tolerance 1e-5.
7. **Grit mean.** Assert `TERRAIN_GRIT_PULSE_MEAN` matches the measured mean of
   `smoothstep(0.64, 0.86, B)` within 0.004 for the six seeds.

Extend `verify-terrain-surface` with the `TERRAIN_GRIT_PULSE_MEAN` measurement
and a check that `uTerrainLodDistances` no longer appears in
`TerrainMaterialShader.ts` or `TerrainMaterialController.ts`.

### 6.8 Phase 7a — provisional palette move

Ship with Phase 1 so later phases are judged against the target look. One value
each:

- `src/grass/materials/GrassPaletteTuning.json`: `tipLuminanceScale` 1.38 → 1.30.
- `public/config/world.yaml`: add `grassPaletteDesaturation: 0.06` (the full
  lever is specified in Phase 7; ship the plumbing and a small value now).

Re-run `verify-lod-color-parity`, `verify-grass-dry-lighting`, and
`verify-lod-continuity` — `GRASS_VERTEX_PALETTE_ROOT_PROGRESS` is *derived* from
this JSON by bisection at module load, so it moves automatically, but the parity
residual it bounds must be re-measured.

### 6.9 Acceptance criteria

- A settled 1080p capture from the reference third-person pose shows no ring:
  sample ground luminance along 64 radial rays at 1 m spacing from 4 m to 160 m;
  the first difference of the per-distance median must have no |Δ| above 0.9% of
  frame mean luminance across any 4 m window. Capture through the existing
  `qa/` harness and the `.shots/` convention.
- The macro vigour pattern is visibly continuous across the terrain resolution
  ring in an aerial capture at 90 m altitude.
- `npm run build` passes, including the new gate.
- Frame time on the reference capture within +0.35 ms of the Phase 0 baseline.

---

## 7. Phase 2 — grass, path, and soil blending

**Objective.** Bare ground never reads as a painted polygon; the verge is a
community, not an edge.

### 7.1 Ragged the grass boundary, not just the dirt core

`TERRAIN_DETAIL_COLOR` already roughens the **core**:

```glsl
vec2 terrainCoreDistance = abs(vTerrainPath.xy) + uTerrainPathEdge * terrainEdgeNoise;
```

but leaves the **grass mask** as a clean offset curve:

```glsl
vec2 terrainPathGrassBands = smoothstep(
  terrainPathGrassHalfWidth,
  terrainPathGrassHalfWidth + vec2(uTerrainPathGrassFeather),
  abs(vTerrainPath.xy)
);
```

Apply the same noise, with its own amplitude:

```glsl
// The dirt core has been ragged since paths shipped; the grass edge around it
// has not, which is why the verge reads as a stencil laid over the meadow. The
// two boundaries must be roughened by the same field, or the ragged core simply
// sits inside a clean green cut-out.
vec2 terrainGrassDistance = abs(vTerrainPath.xy) +
  uTerrainPathGrassEdge * terrainEdgeNoise;
vec2 terrainPathGrassBands = smoothstep(
  terrainPathGrassHalfWidth,
  terrainPathGrassHalfWidth + vec2(uTerrainPathGrassFeather),
  terrainGrassDistance
);
```

`uTerrainPathGrassEdge` from config `pathGrassEdgeRoughness: 0.9` (range 0–2.5).
It must exceed `pathEdgeRoughness` (0.5) so the vegetation boundary is *more*
irregular than the mineral one, which is what real trampling produces.

The CPU must agree or blades will float over painted dirt.
`src/world/TerrainField.ts`, `resolvePathGrassMask`:

```ts
// Same roughening the terrain shader applies to the vegetation boundary. The
// shader takes it from the surface noise texture's R channel at
// terrainGroundNoiseWorldSize; the CPU cannot sample that texture, so both
// sides read one shared world-space field instead, and the gate below bounds
// the residual between them.
const edge = samplePathEdgeNoise(x, z) * this.pathGrassEdgeRoughness;
const main = smoothstep(
  Math.abs(distances.x) + edge,
  this.pathGrassHalfWidthMain + clearance,
  this.pathGrassHalfWidthMain + clearance + PATH_GRASS_FEATHER,
);
```

`samplePathEdgeNoise` is a new export of `src/grass/GrassFieldVariation.ts`:
zero-mean, period 6 m, seed `0x1c_2d_8f_43`. The **terrain shader must use this
same function**, not `terrainBaseNoise.r` — replace `terrainEdgeNoise`'s
definition with the GLSL mirror from Phase 1's
`TerrainMacroFieldShader.ts` so core and mask and blades all agree exactly. This
also removes an existing latent mismatch: `terrainEdgeNoise` currently mixes a
64 m and a 29.5 m channel to roughen a boundary whose feature size is ~1 m.

`resolvePathGrassMask` signature is unchanged; `x`/`z` are already available on
the `samplePathGrassMask` path. For the `resolvePathGrassMask` overload used by
terrain chunks (which passes pre-sampled distances), add `x`, `z` parameters —
`TerrainChunk` already holds them.

Because `PATH_MAX_FIELD_SLOPE` and `PATH_CUTOFF_SAFETY` bound the early
rejection in `samplePathDistances`, widening the effective boundary by up to
`pathGrassEdgeRoughness` metres requires the rejection radius to grow by the same
amount. Add it to the cutoff computation and assert in `verify-navigation`
(which already exercises path clearance) that no blade is placed inside the
walkable core.

### 7.2 Pioneer blades

`WorldSingleBladeTileFactory.advanceBuild` currently rejects hard:

```ts
const pathMask = this.field.samplePathGrassMask(x, z, height);
if (pathMask <= 0) {
  continue;
}
```

Replace with a pioneer allowance:

```ts
const pathMask = this.field.samplePathGrassMask(x, z, height);
// A used path is not sterile. A small share of blades survives in the tread —
// shorter, flattened, and thinning toward the compacted centre — which is what
// stops the verge reading as a cut rather than a gradient. The roll is a stable
// world-space hash rather than the job random so the same blades survive at
// every LOD and across rebuilds.
let pioneer = 0;
if (pathMask <= 0) {
  const core = this.field.samplePathCoreAmount(x, z, height);
  const chance = this.worldConfig.grassPathPioneerChance * (1 - core);
  if (this.positionHash01(x, z, PATH_PIONEER_SALT) >= chance) {
    continue;
  }
  pioneer = 1;
}
```

`samplePathCoreAmount` is a new `TerrainField` method mirroring the shader's
`terrainPathCore`: `max` of the two `1 - smoothstep(halfWidth - 0.12, halfWidth + 0.28, coreDistance)`
bands, multiplied by path visibility.

Downstream effects on a pioneer blade:

```ts
const pioneerHeightScale = 1 - pioneer * this.worldConfig.grassPathPioneerHeightLoss;
// applied into verticalScale, alongside stoneContactHeight
const pioneerCoverage = pioneer > 0 ? this.worldConfig.grassPathPioneerCoverage : pathMask;
```

and force the flattened archetype: `habitat.directionalLean = max(habitat.directionalLean, 0.62)`
before `resolveGrassClusterArchetype`, so pioneers use
`GRASS_CLUSTER_FLATTENED`'s existing morphology rather than needing a new one.

Config: `grassPathPioneerChance: 0.06` (0–0.25),
`grassPathPioneerHeightLoss: 0.45` (0–0.7),
`grassPathPioneerCoverage: 0.55` (0–1).

### 7.3 Height and density ramp into the verge

`sampleGrassHabitat` already applies `(1 - disturbance * 0.28)` to height, where
`disturbance = 1 - pathGrassMask`. That coefficient is too weak to read at
walking height. Promote it to config and raise it:

```ts
target.height = Math.max(0.58, Math.min(1.22,
  biomeHeight *
    (1 + moisture * fertility * config.grassWetHeightBoost) *
    (1 - (1 - moisture) * config.grassDryHeightReduction) *
    (1 - disturbance * config.grassDisturbanceHeightReduction) *
    (1 - rockiness * 0.16),
));
```

`grassDisturbanceHeightReduction: 0.52` (was the literal 0.28; range 0–0.8).

### 7.4 Dirt flecks inside the grass

In `TERRAIN_DETAIL_COLOR`, after the underlayer mix and before the thatch mix:

```glsl
// Traffic carries mineral soil up into the vegetation for metres either side of
// a tread. Without it the verge is two flat fields meeting at a line; with it
// the boundary is a gradient of exposure, which is what the eye actually reads
// as a worn edge.
float terrainVergeFleck = smoothstep(0.58, 0.86, terrainMesoNoise.r) *
  terrainMesoWeight;
terrainSurfaceColor = mix(
  terrainSurfaceColor,
  uTerrainPathDust,
  saturate(terrainPathShoulder * uTerrainVergeFleckStrength * terrainVergeFleck)
);
```

`terrainVergeFleck` is **not** mean-preserved on purpose: it belongs to the
near-field verge only, and `terrainPathShoulder` is itself tiny beyond the meso
range. Assert in the band gate that
`terrainVergeFleckStrength * meanFleck * maxShoulder < 0.02` so it cannot
contribute a visible step at the meso boundary.

Config: `terrainVergeFleckStrength: 0.34` (0–0.8).

### 7.5 Compacted core

`uTerrainPathCoreDarkening` is 0.08 — near-invisible. Raise to 0.20 and make it
depth-shaped rather than flat:

```glsl
terrainPathColor *= 1.0 - uTerrainPathCoreDarkening *
  smoothstep(0.15, 1.0, terrainPathCore);
```

### 7.6 Verification

Extend `scripts/verify-spawn.mjs`'s path coverage or add
`scripts/verify-path-verge.mjs` (`npm run test:path-verge`):

- Boundary roughness: sample the CPU `resolvePathGrassMask` and the parsed GLSL
  grass-band expression along 512 transects; assert the 0.5-crossing radius has a
  standard deviation ≥ 0.35 m and that the two agree within 0.05 m.
- Pioneer share: over 200 000 samples inside the tread, assert the surviving
  fraction is within ±15% of `grassPathPioneerChance * (1 - meanCore)`.
- No blade survives where `terrainPathCore > 0.85` (walkability).
- Verge fleck cannot step: the assertion in 7.4.

### 7.7 Acceptance criteria

- The right-hand exposed ground in the reference capture has no straight
  boundary segment longer than 1.5 m.
- Blade height measured in 0.5 m bins from the tread edge rises monotonically
  over at least 3 m.
- `npm run build` passes.

---

## 8. Phase 3 — large-scale ecological patch structure

**Objective.** The meadow is composed of readable communities with transitional
edges, and the same statement drives blades, understory, flowers, and ground.

### 8.1 New module: `src/world/ecology/WorldCommunityField.ts`

Deliberately shaped like `WorldBiomeField.ts` so it inherits that module's proven
rank-transform (which is what makes authored shares *mean* what they say) and its
per-blade border dither.

```ts
export const COMMUNITY_SHORT_SWARD = 0;
export const COMMUNITY_TALL_COLONY = 1;
export const COMMUNITY_BARE_BREAK = 2;
export const COMMUNITY_FLOWER_MEADOW = 3;
export const COMMUNITY_BROADLEAF_UNDERSTORY = 4;
export const COMMUNITY_COUNT = 5;

export interface WorldCommunitySample {
  /** Dominant community at this position. */
  index: number;
  /** Neighbouring community inside the border band; equals `index` outside it. */
  neighborIndex: number;
  /** Share of individuals belonging to `neighborIndex`, in [0, 0.5]. */
  blend: number;
  /**
   * 1 in the interior of a patch, 0 at its edge.
   *
   * Published separately from `blend` because they answer different questions.
   * `blend` is *which* community an individual belongs to; `core` is *how
   * strongly* the community expresses itself here. A colony's edge is not a
   * different colony — it is the same one, thinner and shorter — and without
   * `core` the field would produce hard-walled patches with correct species and
   * wrong density.
   */
  core: number;
  /**
   * How deliberately empty this patch is, in [0, 1].
   *
   * The lever for visual hierarchy: a field where every square metre carries the
   * same amount of incident is exhausting to read regardless of how good each
   * square metre is. This is the term that buys quiet ground for the hero
   * colonies to stand against.
   */
  quiet: number;
}

export function createCommunitySample(): WorldCommunitySample;

export function sampleWorldCommunity(
  x: number,
  z: number,
  config: WorldConfig,
  target: WorldCommunitySample,
): WorldCommunitySample;

/** The single community a plant rooted at (x, z) belongs to. */
export function pickCommunityIndex(
  x: number, z: number, sample: WorldCommunitySample,
): number;

/**
 * Raw-field thresholds equivalent to the rank-transformed share boundaries.
 * Uploaded to the terrain shader so GLSL can reproduce the partition without
 * carrying the rank table.
 */
export function resolveCommunityRawThresholds(): Float32Array;
```

Algorithm:

1. `rawField(x, z)` = two-octave value noise at `config.grassCommunityWorldSize`
   metres per cell, fine octave at 2.4× with weight 0.42, normalised.
   Seed `0x7e_1a_44_9d ^ config.seed`.
2. Rank-transform against a 2 048-sample table built once at module load from a
   lattice with step `period * 0.618`, exactly as `WorldBiomeField` does.
3. Slice the uniform field by cumulative shares from config:
   `grassCommunityShareShortSward: 0.34`, `…TallColony: 0.22`, `…BareBreak: 0.10`,
   `…FlowerMeadow: 0.16`, `…BroadleafUnderstory: 0.18`. Validator normalises them
   to sum to 1 and fails if any is negative.
4. Border half-width `COMMUNITY_BORDER_WIDTH = 0.07` in uniform-field units →
   at a 26 m period, mixed fringes of roughly 3–6 m.
5. `core = smoothstep(COMMUNITY_BORDER_WIDTH, COMMUNITY_BORDER_WIDTH * 2.6, edgeDistance)`.
6. `quiet` = an independent two-octave field at `period * 2.6`, seed
   `0x35_b7_c2_11`, remapped `smoothstep(0.52, 0.86, value)`.
7. `pickCommunityIndex` hashes the root position against `blend`, exactly like
   `pickGrassBiomeIndex`.

The share defaults deliver the hierarchy the brief asks for: 56% mostly grass
(short sward + tall colony), 34% richer mixed vegetation (flower + broadleaf),
10% near-bare gaps, with `quiet` carving hero/quiet contrast inside all of them.

### 8.2 Community response table

New file `src/world/ecology/WorldCommunityResponse.ts`. One frozen table, one
resolver; no behaviour hidden in call sites.

```ts
export interface CommunityResponse {
  density: number;        // multiplier
  height: number;         // multiplier
  accentChance: number;   // multiplier
  understory: number;     // multiplier on GrassHabitatSample.underlayer
  dryness: number;        // additive offset
  clumpScale: number;     // multiplier
}

export const COMMUNITY_RESPONSES: readonly CommunityResponse[] = Object.freeze([
  /* SHORT_SWARD          */ { density: 1.00, height: 0.72, accentChance: 0.35, understory: 0.55, dryness:  0.06, clumpScale: 0.88 },
  /* TALL_COLONY          */ { density: 1.06, height: 1.22, accentChance: 0.55, understory: 0.80, dryness: -0.05, clumpScale: 1.18 },
  /* BARE_BREAK           */ { density: 0.28, height: 0.80, accentChance: 0.30, understory: 0.40, dryness:  0.14, clumpScale: 0.70 },
  /* FLOWER_MEADOW        */ { density: 0.94, height: 0.98, accentChance: 2.10, understory: 1.05, dryness:  0.00, clumpScale: 1.00 },
  /* BROADLEAF_UNDERSTORY */ { density: 0.86, height: 0.92, accentChance: 1.70, understory: 1.35, dryness: -0.04, clumpScale: 1.06 },
]);

const NEUTRAL: CommunityResponse = {
  density: 1, height: 1, accentChance: 1, understory: 1, dryness: 0, clumpScale: 1,
};

/**
 * The community's response at this point, faded toward neutral at patch edges
 * and by the global strength lever. Fading by `core` is what makes colony edges
 * gradients rather than walls, and it is why `core` is a published channel.
 */
export function resolveCommunityResponse(
  sample: WorldCommunitySample,
  strength: number,
  target: CommunityResponse,
): CommunityResponse;
```

`resolveCommunityResponse` lerps `COMMUNITY_RESPONSES[sample.index]` toward
`NEUTRAL` by `1 - sample.core * strength`, then blends toward
`COMMUNITY_RESPONSES[sample.neighborIndex]` by `sample.blend`, then applies the
quiet term:

```ts
// Quiet ground loses incident, not grass. Density is left alone; what falls is
// the accent layer and the clump-scale variety that make a patch busy.
target.accentChance *= 1 - sample.quiet * quietStrength;
target.clumpScale = lerp(target.clumpScale, 1, sample.quiet * quietStrength * 0.7);
```

### 8.3 Wiring into `sampleGrassHabitat`

`src/world/grass/GrassHabitatField.ts` gains one parameter — the resolved
response — rather than the raw sample, so the function stays a pure mapper and
every caller can share one resolution:

```ts
export function sampleGrassHabitat(
  x: number, z: number,
  ecology: WorldEcologySample,
  biomeDensity: number,
  minimumClimateDensityRetention: number,
  heightBandMin: number, heightBandMax: number,
  drynessBias: number,
  accentDensity: number,
  community: CommunityResponse,      // NEW
  config: WorldConfig,
  target: GrassHabitatSample,
): GrassHabitatSample
```

Application points, in the order the existing function already computes them:

```ts
density *= community.density;                    // before the climate floor
// ... existing patchMul, floor, rockiness, disturbance ...
// ... existing clearing (still the only term allowed to reach zero) ...

target.height = clamp(biomeHeight * community.height * (existing terms), 0.58, 1.22);
target.dryness = clamp01(existingDryness + community.dryness);
target.clumpScale = lerp(0.68, 1.27, target.density) * community.clumpScale;
target.underlayer = clamp01(existingUnderlayer * community.understory);
target.accentChance = clamp01(existingAccentChance * community.accentChance);
```

Placing `community.density` **before** the climate retention floor is deliberate:
a bare break should be allowed to fall through to bare ground the same way a
clearing does, and the floor exists to stop *climate* zeroing a meadow, not to
stop composition doing it.

Callers to update (all already own an `(x, z)` and a scratch sample, so add one
`WorldCommunitySample` and one `CommunityResponse` scratch field each):

- `src/world/terrain/TerrainSurfaceField.ts`
- `src/world/grass/WorldSingleBladeTileFactory.ts`
- `src/world/WorldGrassSystem.ts` (mid/far placement)
- `src/world/grass/WorldDetailFoliageField.ts`

### 8.4 Archetype agreement

`resolveGrassClusterArchetype` must not contradict the community. Add the sample
and bias the existing threshold chain:

```ts
export function resolveGrassClusterArchetype(
  habitat: GrassHabitatSample,
  communityIndex: number,      // NEW
  clumpColumn: number,
  clumpRow: number,
  config: WorldConfig,
): number {
  // ... existing roll and identityBias ...
  if (habitat.directionalLean + identityBias > 0.45) return GRASS_CLUSTER_FLATTENED;
  // A short sward is short because it is grazed and shallow-rooted, not because
  // it is dry; naming it SHORT_DRY here is what makes the two systems agree
  // instead of producing tall blades inside a short-sward patch.
  if (communityIndex === COMMUNITY_SHORT_SWARD && roll > 0.25) return GRASS_CLUSTER_SHORT_DRY;
  if (communityIndex === COMMUNITY_TALL_COLONY && habitat.dryness < 0.44) return GRASS_CLUSTER_TALL_WET;
  if (communityIndex === COMMUNITY_BARE_BREAK) return GRASS_CLUSTER_SPARSE_OPEN;
  if (communityIndex === COMMUNITY_FLOWER_MEADOW && habitat.accentChance > 0.15) return GRASS_CLUSTER_ACCENT;
  // ... existing dryness / retention / height / accent rules as fallbacks ...
}
```

### 8.5 Species colonies (brief item 8)

`src/world/grass/DetailFoliageAffinity.ts` scores species against
`WorldEcologySample` today. Add a community term to the same scoring function so
it stays one decision:

```ts
/**
 * Per-species community affinity, in [0, 2]. Multiplied into the habitat score
 * the ecology terms already produce, so a species can be common in a community
 * without becoming unconditional there.
 */
const COMMUNITY_AFFINITY: Readonly<Record<string, readonly number[]>> = Object.freeze({
  //                       short  tall   bare   flower broadleaf
  "daisy":                [ 1.30, 0.55, 0.30,  1.80,  0.45 ],
  "round-bloom":          [ 0.70, 0.75, 0.25,  2.00,  0.55 ],
  "seed-head":            [ 1.10, 1.60, 0.65,  0.55,  0.30 ],
  "grass-tuft":           [ 1.20, 1.45, 0.60,  0.80,  0.75 ],
  "fern":                 [ 0.20, 0.85, 0.10,  0.35,  2.00 ],
  "small-fern":           [ 0.35, 0.80, 0.15,  0.45,  1.85 ],
  "broadleaf-rosette":    [ 0.55, 0.70, 0.30,  0.60,  2.00 ],
  "clover-patch":         [ 1.55, 0.70, 0.35,  1.25,  0.85 ],
  "low-shrub":            [ 0.30, 1.05, 0.55,  0.40,  1.30 ],
  "leaf-litter":          [ 0.60, 0.90, 1.10,  0.55,  1.60 ],
});
```

`scoreDetailFoliageHabitat` multiplies its result by
`lerp(1, COMMUNITY_AFFINITY[species][communityIndex], tuning.communityStrength)`
with `detailFoliageCommunityStrength: 0.8` (0–1).

Two further brief-item-8 requirements:

- **Species-specific colony scale.** `WorldDetailFoliageDistribution` uses one
  `colonyWorldSize` for everything. Add a per-species multiplier
  `colonyScale: number` to `GRASS_ACCENT_SPECIES`
  (`src/grass/biome/GrassAccentSpecies.ts`) — daisies 0.7 (tight drifts), ferns
  1.5 (broad stands), grass tufts 1.2, litter 1.8 — and sample the colony lattice
  at `colonyWorldSize * colonyScale` for the family roll. Because the presence
  field must stay one field (or species would fight over the same ground), only
  the **family/tint/maturity** rolls use the scaled lattice; `presence` and
  `clump` keep the shared lattice.
- **Flower height follows surrounding grass.** In
  `WorldDetailFoliageField`'s placement, scale accent height by the habitat's own
  height rather than only by the species band:
  `heightScale *= lerp(1, habitat.height, tuning.grassHeightCoupling)` with
  `detailFoliageGrassHeightCoupling: 0.55` (0–1). A daisy in a tall colony is a
  taller daisy; today it is the same daisy in taller grass, which is why the
  flowers read as sprinkled on top.

### 8.6 Ground agreement and distant structure

`TerrainSurfaceField` publishes the community so the ground carries the same
statement. Reuse the biome attribute's spare capacity rather than adding a
stream: pack `communityIndex + core * 0.5` into `terrainEcology.x`? No — that
channel is suitability and is load-bearing. Instead extend
`terrainEnvironment` semantics is also full. **Add one new `vec2` attribute**
`terrainCommunity` = `(index, core)`:

- `TerrainSurfaceTargets` gains `community: THREE.Vector2`.
- `TerrainChunk` gains `communities: Float32Array(vertexCount * 2)` and
  `geometry.setAttribute("terrainCommunity", new THREE.BufferAttribute(this.communities, 2))`.
  Cost: 8 bytes per terrain vertex; at the near ring's 25×25 grid over 49 chunks
  that is ~240 KB, acceptable and confirmed against
  `verify-world-grass-allocation`.

But for **distance** (brief item 11) the vertex route fails for the same reason
as Phase 1's B4: the far ring cannot carry a 26 m field. So the terrain shader
reproduces the community partition per fragment using Phase 1's noise mirror plus
uploaded raw thresholds:

```glsl
uniform float uTerrainCommunityThresholds[8];   // raw-field edges, ascending
uniform float uTerrainCommunityPeriod;
uniform uint  uTerrainCommunitySeed;

int terrainResolveCommunity(vec2 world, out float core) {
  float coarse = terrainValueNoise(world / uTerrainCommunityPeriod, uTerrainCommunitySeed);
  float fine = terrainValueNoise(
    (world * 2.4) / uTerrainCommunityPeriod, uTerrainCommunitySeed ^ 0x9e3779b9u
  );
  float field = (coarse + fine * 0.42) / 1.42;
  int index = 0;
  float lower = -1.0;
  float upper = 2.0;
  for (int i = 0; i < ${COMMUNITY_COUNT} - 1; i += 1) {
    if (field >= uTerrainCommunityThresholds[i]) {
      index = i + 1;
      lower = uTerrainCommunityThresholds[i];
    } else {
      upper = uTerrainCommunityThresholds[i];
      break;
    }
  }
  core = smoothstep(0.0, uTerrainCommunityCoreWidth, min(field - lower, upper - field));
  return index;
}
```

`resolveCommunityRawThresholds()` inverts the rank table on the CPU
(`RANK_TABLE[floor(boundary * RANK_SAMPLES)]`) so GLSL compares against raw-field
values and reproduces the partition exactly without carrying the table. The
threshold array is uploaded once at material construction and again whenever the
shares change.

Ground response (in `TERRAIN_DETAIL_COLOR`, after the underlayer mix):

```glsl
float terrainCommunityCore;
int terrainCommunity = terrainResolveCommunity(vTerrainWorldPosition.xz, terrainCommunityCore);
// One statement, four consequences: the ground goes barer in a break, greener
// and damper under a broadleaf stand, drier and paler in a short sward. Without
// this the communities exist only in the geometry and vanish with it at range,
// which is exactly the failure the distant meadow shows today.
vec3 terrainCommunityTint =
  terrainCommunity == ${COMMUNITY_BARE_BREAK} ? uTerrainSoilDry :
  terrainCommunity == ${COMMUNITY_BROADLEAF_UNDERSTORY} ? uTerrainMoss :
  terrainCommunity == ${COMMUNITY_SHORT_SWARD} ? mix(terrainSurfaceColor, vTerrainBiomeDry, 0.34) :
  terrainSurfaceColor;
terrainSurfaceColor = mix(
  terrainSurfaceColor,
  terrainCommunityTint,
  terrainCommunityCore * uTerrainCommunityTintStrength
);
```

`uTerrainCommunityTintStrength` from `terrainCommunityTintStrength: 0.42` (0–1).
`uTerrainMoss` is introduced in Phase 4; until then use
`mix(uTerrainSoilRich, vTerrainBiomeBase.rgb, 0.5)`.

This is the single change that most directly answers brief item 11: at 200 m the
blades are gone, but the ground still shows dark colonies, dry patches and bare
breaks because the ground computes them itself.

### 8.7 Verification

New `scripts/verify-community-field.mjs` (`npm run test:community`), modelled on
`verify-detail-foliage-distribution.mjs`:

1. **Share accuracy.** Over 400 000 world samples, each community's measured
   share is within ±1.5% absolute of its configured share.
2. **Patch scale.** The mean connected-run length along an axis is within
   ±25% of `grassCommunityWorldSize`.
3. **Continuity.** `core`, `blend`, and every `CommunityResponse` field are
   continuous: over a 0.001 m probe at 20 000 positions, no output changes by
   more than 0.02 (the same construction and reasoning as the detail-foliage
   gate's 0.011 bound, scaled for the wider smoothstep here).
4. **Threshold parity.** `resolveCommunityRawThresholds()` reproduces the
   rank-transformed partition: classify 100 000 points both ways and assert
   100% agreement.
5. **GLSL parity.** Parse `terrainResolveCommunity` from the shader source and
   evaluate it in JS against `sampleWorldCommunity` at 20 000 points; assert
   identical indices and `|Δcore| < 1e-4`.
6. **Determinism.** Two runs produce identical SHA-256 digests of a 4 096-sample
   trace.
7. **Hierarchy.** Assert `shortSward + tallColony` ∈ [0.50, 0.62] and
   `bareBreak` ∈ [0.06, 0.14], so the configured shares cannot silently drift out
   of the authored hierarchy.

Extend `verify-flower-variety` with a colony-purity assertion: inside a
`FLOWER_MEADOW` patch core, the dominant species share is ≥ 0.55 and ≤ 0.92
(coherent but not monocultural).

### 8.8 Acceptance criteria

- A 60 m aerial capture shows patches whose boundaries a viewer can trace, at a
  scale of roughly 20–35 m.
- Bare breaks show soil, not thinned green.
- Flower groups sit inside flower-meadow patches, with stragglers outside.
- Frame time within +0.15 ms (all new work is build-time except one extra
  fragment-stage noise pair).

---

## 9. Phase 4 — terrain substrate material

**Objective.** Open ground is a material, not a colour.

All changes are in `src/world/TerrainMaterialShader.ts` /
`TerrainMaterialController.ts` unless stated.

### 9.1 Decorrelate soil hue from grass dryness

The current chain makes soil a function of vegetation:

```glsl
vec3 terrainSoil = mix(uTerrainSoilDry, uTerrainSoilRich, terrainHumidity);
```

with `terrainHumidity` derived from `(1 - dryness) * 0.68 + vigor * 0.32 + …` in
`TerrainSurfaceField`. Add a third, independent tone and an independent selector:

```glsl
uniform vec3 uTerrainSoilGrey;
uniform float uTerrainSoilHuePeriod;
uniform uint uTerrainSoilHueSeed;
uniform float uTerrainSoilHueStrength;
```

```glsl
// Soil colour has been a function of how the grass is doing, which is why the
// ground and the canopy could never separate: every term that greened the grass
// also warmed the earth under it. Real soil colour comes from parent material
// and drainage, neither of which the vegetation controls. This field is
// independent of every ecology term on purpose.
float terrainSoilHue = terrainPatchNoise(
  vTerrainWorldPosition.xz, uTerrainSoilHuePeriod, uTerrainSoilHueSeed
);
vec3 terrainSoilBase = mix(uTerrainSoilDry, uTerrainSoilRich, terrainHumidity);
vec3 terrainSoilVariant = terrainSoilHue < 0.42
  ? uTerrainSoilGrey
  : (terrainSoilHue > 0.74 ? uTerrainSoilRich : uTerrainSoilDry);
vec3 terrainSoil = mix(terrainSoilBase, terrainSoilVariant, uTerrainSoilHueStrength);
```

Config: `terrainSoilHueWorldSize: 14` (6–40), `terrainSoilHueStrength: 0.38`
(0–0.8). `uTerrainSoilGrey` = `#7a6f5c`.

### 9.2 Fleck octave

The existing octaves are 64 m (macro), 29.5 m (meso) and 7.4 m (micro). Nothing
occupies the 2–5 m band a walking camera reads as "soil texture". Add one, reusing
the same texture with a third rotation:

```glsl
vec4 terrainFleckNoise = vec4(0.5);
if (terrainMicroWeight > 0.001) {
  mat2 terrainFleckRotation = mat2(0.6, -0.8, 0.8, 0.6);
  vec2 terrainFleckUv = terrainFleckRotation * terrainBaseUv * 18.0 + vec2(0.271, 0.883);
  terrainFleckNoise = textureGrad(
    uTerrainSurfaceNoise,
    terrainFleckUv,
    terrainFleckRotation * terrainBaseDdx * 18.0,
    terrainFleckRotation * terrainBaseDdy * 18.0
  );
}
float terrainFleck = (terrainFleckNoise.r - 0.5) * uTerrainFleckStrength * terrainMicroWeight;
terrainSurfaceColor *= 1.0 + terrainFleck;
```

Zero-mean, so it fades safely at the (now-wide) micro boundary.
`terrainGroundFleckStrength: 0.16` (0–0.4).

Reuse `terrainFleckNoise.g` in `terrainMicroHeight` so the flecks also perturb
the normal:

```glsl
float terrainMicroHeight = (
  (terrainMicroNoise.b - 0.5) * 0.58 +
  (terrainMicroNoise.a - 0.5) * 0.24 +
  (terrainFleckNoise.g - 0.5) * 0.18
) * mix(1.0, 0.58, terrainWaterProximity) * terrainMicroWeight
  + terrainRockRelief * terrainCliff;
```

### 9.3 Hollows

The fragment shader has slope (from derivatives) but no curvature, so
depressions cannot darken. `TerrainLandformField` already computes convexity for
the ecology layer; publish it. Extend the existing `terrainPath` attribute from
`vec3` to `vec4`:

- `TerrainChunk` writes `.w = landform.convexity * 0.5 + 0.5`.
- `TERRAIN_DETAIL_VERTEX`: `attribute vec4 terrainPath; varying vec4 vTerrainPath;`
  (all existing `.xy` / `.z` reads are unchanged).

```glsl
// Depressions collect water, litter and shadow. Without curvature the ground
// has exactly one tone per ecology value, which is what makes an open patch read
// as a flat fill regardless of how much noise is layered on it.
float terrainConcavity = saturate((0.5 - vTerrainPath.w) * 2.0);
terrainHumidity = saturate(terrainHumidity + terrainConcavity * uTerrainHollowMoisture);
terrainSurfaceColor *= 1.0 - uTerrainHollowDarkening * terrainConcavity;
```

Config: `terrainHollowDarkening: 0.14` (0–0.35),
`terrainHollowMoisture: 0.12` (0–0.3).

Note the ordering: apply the humidity lift **before** `terrainSoil` is mixed, and
the darkening **after** the surface colour is assembled but **before** the
canopy merge, so a hollow reads damp at every distance.

### 9.4 Moss and organic matter

```glsl
uniform vec3 uTerrainMoss;          // #4a5f34
uniform float uTerrainMossStrength; // terrainMossStrength: 0.30 (0-0.7)
```

```glsl
// Organic matter, not more grass tint: it accumulates where water sits, light
// is scarce and nothing scours it, and it is a genuinely different material
// from both soil and canopy. Gating on slope is what keeps it out of the banks.
float terrainMossAmount = saturate(
  terrainHumidity * 1.25 - 0.42
) * (1.0 - terrainSlope * 2.2) * smoothstep(0.42, 0.78, terrainFleckNoise.b)
  * (0.35 + 0.65 * terrainConcavity);
terrainSurfaceColor = mix(
  terrainSurfaceColor, uTerrainMoss, saturate(terrainMossAmount) * uTerrainMossStrength
);
```

`terrainFleckNoise.b` gives moss a patchy, colony-like footprint at the fleck
scale rather than a smooth wash.

### 9.5 Clump-scale contact AO (brief item 10, ground half)

The existing `uTerrainCanopyDarkening * terrainCoverage * terrainVigor` term is
smooth over tens of metres. What is missing is **a dark pool under each tuft**.
Mirror the near-grass clump lattice: `WorldSingleBladeTileFactory` uses
`CLUMP_CELLS = 3` cells per `grassNearTileSize` (8 m) tile, so the clump cell is
8/3 ≈ 2.667 m.

```glsl
uniform float uTerrainClumpCell;      // grassNearTileSize / 3
uniform float uTerrainClumpAo;        // terrainClumpContactAo: 0.20 (0-0.45)
uniform uint  uTerrainClumpSeed;
```

```glsl
// The ground under a tuft is darker than the ground between tufts, and the eye
// uses exactly that to decide whether a blade is standing in the earth or
// pasted on it. Sampling the same lattice the blades are placed on is what
// makes the dark pool land under the tuft rather than near it.
vec2 terrainClumpUv = vTerrainWorldPosition.xz / uTerrainClumpCell;
vec2 terrainClumpCell = floor(terrainClumpUv);
float terrainClumpJitterX = terrainHash01(int(terrainClumpCell.x), int(terrainClumpCell.y), uTerrainClumpSeed);
float terrainClumpJitterZ = terrainHash01(int(terrainClumpCell.x), int(terrainClumpCell.y), uTerrainClumpSeed ^ 0x9e3779b9u);
vec2 terrainClumpCenter = terrainClumpCell + vec2(0.35 + 0.30 * terrainClumpJitterX,
                                                  0.35 + 0.30 * terrainClumpJitterZ);
float terrainClumpDistance = length(terrainClumpUv - terrainClumpCenter);
float terrainClumpShade = 1.0 - smoothstep(0.16, 0.52, terrainClumpDistance);
terrainSurfaceColor *= 1.0 - uTerrainClumpAo * terrainClumpShade *
  terrainCoverage * terrainMicroWeight;
```

Gated by `terrainMicroWeight` because a 2.7 m feature is sub-pixel beyond the
micro range and would otherwise alias into shimmer. It is **not** mean-preserved,
so bound its residual step in the band gate: mean of
`terrainClumpShade` over the cell is ~0.075, so the worst-case step at the micro
boundary is `0.20 × 0.075 × 1.0 = 1.5%` — under the 0.9%-per-4 m acceptance
criterion only if the micro range is wide, which is why Phase 1 must land first.
If the measured step exceeds budget, mean-preserve it the same way the fibre
pulse is.

Also add a small **litter ring**: organic accumulation around a clump rather than
under it.

```glsl
float terrainClumpLitter = smoothstep(0.30, 0.50, terrainClumpDistance) *
  (1.0 - smoothstep(0.50, 0.72, terrainClumpDistance));
terrainSurfaceColor = mix(
  terrainSurfaceColor,
  mix(uTerrainMoss, vTerrainBiomeDry * 0.6, terrainDryness),
  terrainClumpLitter * terrainCoverage * terrainMicroWeight * uTerrainClumpLitter
);
```

`terrainClumpLitterStrength: 0.18` (0–0.4).

### 9.6 Verification

Extend `scripts/verify-terrain-surface.mjs`:

- Every new uniform exists in both the shader text and the controller, with the
  config key it claims to read.
- Zero-mean assertions for `terrainFleck` (|mean| < 0.005 over the texture).
- `terrainClumpCell` equals `grassNearTileSize / 3` within 1e-6, read from
  `public/config/world.yaml` and `WorldSingleBladeTileFactory.CLUMP_CELLS`.
- Colour-separation assertion: over 50 000 samples, the Pearson correlation
  between soil luminance and canopy luminance must drop below 0.55 (measure the
  pre-change baseline first and record it in the script's header comment).

### 9.7 Acceptance criteria

- Open ground in the reference capture shows at least three distinguishable
  tones at 5 m and at 25 m.
- Tufts sit in a visible contact shadow.
- Frame time within +0.20 ms.

---

## 10. Phase 5 — blade silhouette diversity and clustering

**Objective.** No two neighbouring near blades share a silhouette; blades grow in
tufts of 2–5 from shared roots.

### 10.1 `instanceShape` attribute

`instanceVariation` is full (x: seed, y: wind scale, z: root AO, w: dryness). Add
a second `vec4`:

| Channel | Meaning | Range |
|---|---|---|
| `.x` | tip drift — lateral apex offset, in source half-widths | −1.2 … 1.2 |
| `.y` | width profile — taper exponent selector | 0 … 1 |
| `.z` | tip damage — 0 pointed, 1 blunt/broken | 0 … 1 |
| `.w` | curve scale — extra bend on the rest arc | 0 … 1 |

Cost: 16 bytes per near instance. At the configured 84 blades/m² over the near
radius the peak resident near instance count is bounded by
`WorldGrassAllocationValidator`; re-run `verify-world-grass-allocation` and raise
the ceiling if needed.

Producers:

- `src/world/grass/WorldSingleBladeTileFactory.ts`: allocate
  `shapes: Float32Array(requestedCount * 4)` alongside `variations` in
  `TileBuildBuffers`, write it in the placement loop, expose
  `shapeAttribute: THREE.InstancedBufferAttribute`, and include it in the
  compaction swap (`swapFloatBlock` at stride 4) and the placement cache.
- `src/grass/GrassGeometryFactory.createInstancedGeometry`: accept and bind
  `instanceShape`, defaulting to a zero-filled buffer so the island regression
  scene and the mid/far layers are unaffected.
- `src/grass/GrassLodController.compactMidInstances`: swap the new attribute too
  if present.

### 10.2 Shape generation

In the placement loop, after `bladeTier` is drawn:

```ts
// Every near blade today is an affine copy of one source triangle, which is why
// a dense patch reads as repeated geometry rather than as a population. These
// four numbers are what a blade actually varies in: which way its tip falls,
// how quickly it narrows, whether it is intact, and how far it bends. All four
// are applied in the vertex shader against the shared source, so the whole
// population still draws in one call.
const shapeOffset = job.bladeCount * 4;
const broad = job.random.next() < this.worldConfig.grassBroadBladeShare;
job.shapes[shapeOffset] =
  job.random.range(-1, 1) * this.worldConfig.grassBladeTipDrift *
  (isUnderstoryBlade ? 1.35 : 1);
job.shapes[shapeOffset + 1] = broad
  ? job.random.range(0.72, 1)         // blunt, leaf-like
  : job.random.range(0, 0.55);        // sharp, grass-like
job.shapes[shapeOffset + 2] =
  job.random.next() < this.worldConfig.grassBladeDamageShare
    ? job.random.range(0.4, 1)
    : 0;
job.shapes[shapeOffset + 3] = THREE.MathUtils.clamp(
  0.5 + (job.random.next() - 0.5) * 1.5 +
    this.clusterProfile.leanTowardMax * 0.3,
  0, 1,
);
```

Broad blades also widen: replace the current
`job.random.range(...biomeProfile.widthBand)` in `horizontalScale` with

```ts
const widthDraw = job.random.range(...biomeProfile.widthBand) *
  (broad ? this.worldConfig.grassBroadBladeWidthScale : 1);
```

and raise `INSTANCE_HORIZONTAL_SCALE_MAX` from 1.2 to **1.9**, which flows into
`calculateGrassSingleBladeRootBoundsRadius` automatically.

Config: `grassBladeTipDrift: 0.9` (0–1.4), `grassBroadBladeShare: 0.09` (0–0.25),
`grassBroadBladeWidthScale: 1.75` (1–2.2),
`grassBladeDamageShare: 0.07` (0–0.2).

### 10.3 Vertex shader application

New compile-time option `shapeVariation?: boolean` on `GrassNearMaterial`, so
only the world's near layers pay for it and the island regression scene is
untouched. Injected after `VERTEX_NORMAL` and before `VERTEX_WIND`, because wind
must bend the *shaped* blade:

```glsl
attribute vec4 instanceShape;
uniform float uGrassShapeTipDriftScale;   // source half-width, metres

// The source blade is tapered with exponent 0.72 at build time. Re-tapering
// would compound the two; correcting the ratio replaces it exactly, and the
// apex guard is required because the source half-width is zero there.
float grassShapeProgress = grassProgress;
float grassSourceTaper = pow(max(1.0 - grassShapeProgress, 0.0), 0.72);
float grassTargetTaper = pow(
  max(1.0 - grassShapeProgress, 0.0),
  mix(0.42, 1.20, instanceShape.y)
);
if (grassSourceTaper > 1e-3) {
  transformed.x *= grassTargetTaper / grassSourceTaper;
}

// A broken tip is blunt, not shorter-with-a-point: it keeps width where an
// intact blade would have none.
float grassTipDamage = instanceShape.z;
if (grassShapeProgress > 0.995) {
  transformed.y *= 1.0 - 0.24 * grassTipDamage;
  transformed.x = mix(
    transformed.x,
    sign(uv.x - 0.5) * uGrassShapeTipDriftScale * 0.42 * grassTipDamage,
    grassTipDamage
  );
}

// Tip drift grows quadratically so roots stay put and only the silhouette's
// upper half leans. This is what breaks the symmetric-isoceles read.
transformed.x += instanceShape.x * uGrassShapeTipDriftScale *
  grassShapeProgress * grassShapeProgress;

// Rest-arc bend. The source arc already carries z; scaling it keeps the blade
// on its own arc rather than inventing a second curve.
transformed.z *= mix(0.55, 1.55, instanceShape.w);
```

`uGrassShapeTipDriftScale` is the source blade's half-width at the root,
`(bladeWidthMin + bladeWidthMax) * 0.5 * 0.5`, uploaded from the grass config.

**Bounds.** `calculateGrassSingleBladeRootBoundsRadius` in
`src/world/grass/GrassRuntimeMath.ts` gains two parameters:

```ts
maximumTipDrift: number;    // metres: tipDrift * halfWidth * hMaxScale
maximumCurveScale: number;  // 1.55
```

folded into `horizontalExtent` and `verticalExtent` respectively.
`verify-lod-continuity` reproduces this function, so update its mirror in the
same commit.

### 10.4 Rosette clusters

The expensive part of placement is the field sampling (height, suitability, path,
stone, biome, ecology, habitat). Emitting several blades from one sample is
nearly free.

In the placement loop, immediately after the matrix for the first blade is
written, add:

```ts
// A tuft is not N independent blades that happen to be close; it is one plant
// with several leaves from one crown. Reusing the sampled ecology and root and
// re-rolling only the presentation is both cheaper than a second sample and
// more correct than one.
const rosetteRoll = this.positionHash01(x, z, ROSETTE_SALT);
if (rosetteRoll < this.worldConfig.grassRosetteChance) {
  const extra = 1 + Math.floor(rosetteRoll * 4 / this.worldConfig.grassRosetteChance) % 4;
  for (let leaf = 0; leaf < extra; leaf += 1) {
    if (job.bladeCount >= job.capacity) break;
    const fan = (leaf + 1) * this.worldConfig.grassRosetteFanRadians *
      (leaf % 2 === 0 ? 1 : -1);
    this.yaw.setFromAxisAngle(this.up, planeYaw + fan);
    // Re-derive `align` from the terrain normal so accumulated multiplies on
    // this.align cannot drift across leaves.
    this.align.setFromUnitVectors(this.up, this.normal);
    this.align.multiply(this.lean).multiply(this.yaw);
    this.scale.set(
      horizontalScale * (0.86 + 0.22 * job.random.next()),
      verticalScale * (0.74 + 0.34 * job.random.next()),
      horizontalScale * (0.86 + 0.22 * job.random.next()),
    );
    this.matrix.compose(this.localPosition, this.align, this.scale);
    this.matrix.toArray(job.matrixValues, job.bladeCount * 16);
    // Copy variation, re-roll only shape + phase.
    job.variations.copyWithin(job.bladeCount * 4, variationOffset, variationOffset + 4);
    job.variations[job.bladeCount * 4] = job.random.next();
    writeShape(job, job.bladeCount, /* re-rolled */);
    job.coverages[job.bladeCount] = job.coverages[job.bladeCount - 1 - leaf];
    job.biomes[job.bladeCount] = biomeIndex;
    job.bladeCount += 1;
  }
}
```

Two correctness requirements the implementer must not skip:

- **Capacity.** `requestedCount` in `createTileBuildBuffers` must be raised by
  `1 + grassRosetteChance * 2.5` so the buffers cannot overflow, and
  `WorldGrassAllocationValidator` must be updated to match.
- **Density conservation.** Rosettes add blades, so the sampled clump density
  must be reduced by the same expected factor or the field densifies:
  `effectiveDensity = habitat.density / (1 + grassRosetteChance * 2.5)`. Assert
  this in `verify-grass-placement`.

Config: `grassRosetteChance: 0.22` (0–0.5),
`grassRosetteFanRadians: 0.42` (0.1–0.9).

### 10.5 Verification

Extend `scripts/verify-grass-placement.mjs`:

- Reproduce shape generation and assert the four channels' distributions:
  tip drift symmetric with |mean| < 0.02; broad share within ±10% relative of
  config; damage share likewise; taper exponent bimodal (Hartigan dip or a simple
  two-cluster check).
- Reproduce the rosette logic and assert total blade count per tile is within
  ±3% of the pre-change count (density conservation).
- Assert `INSTANCE_HORIZONTAL_SCALE_MAX` in the factory matches the value the
  bounds helper is called with.

Extend `scripts/verify-lod-continuity.mjs`:

- Reproduce the widened `calculateGrassSingleBladeRootBoundsRadius` and assert
  the reserved radius covers the worst-case shaped vertex, computed from the GLSL
  text parsed out of `GrassNearMaterial.ts`.

Extend `scripts/verify-grass-shape-continuity.mjs`:

- Assert the near source blade and the mid clump source still agree at the
  handoff after the taper correction is applied at its mean exponent.

### 10.6 Acceptance criteria

- In a 1 m² crop of the near field at the reference pose, no silhouette repeats
  within a 5-blade neighbourhood (verified by eye against a reference crop; the
  gates above bound the distributions that make it true).
- Tufts of 2–5 leaves from a shared root are visible.
- Frame time within +0.15 ms; near vertex count unchanged (±3%).

---

## 11. Phase 6 — grass lighting and contact

**Objective.** Blades separate through light, not only colour.

### 11.1 Normal-flattening schedule

Root cause per Section 5.2. Replace the scalar `uGrassNormalUp` with a distance
schedule so near blades get real facing separation while far cards keep the flat
normal they need for stability.

`src/grass/materials/GrassNearMaterial.ts`:

```glsl
uniform vec2 uGrassNormalUpRange;   // (near, far)
```

`VERTEX_NORMAL` currently runs before `grassMicroFade` is computed, so move the
two `mix` calls into `VERTEX_WIND` immediately after `grassMicroFade`, or hoist
`grassCameraDistance`/`grassMicroFade` above `VERTEX_NORMAL`. The latter is
cleaner and is what this plan specifies: compute `grassWorldRoot`,
`grassCameraDistance` and `grassMicroFade` first, then:

```glsl
// A blade lit the same whether it faces the sun or away from it has no form.
// Flattening the normal toward world up is right for a card that must not
// shimmer at 200 m and wrong for a blade that fills 40 pixels; making it a
// schedule rather than a constant is what gives the near field its light.
float uGrassNormalUpHere = mix(
  uGrassNormalUpRange.y, uGrassNormalUpRange.x, grassMicroFade
);
objectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), uGrassNormalUpHere));
grassBladePlaneNormal = normalize(
  mix(grassBladePlaneNormal, vec3(0.0, 1.0, 0.0), uGrassNormalUpHere)
);
```

Values: near **0.50**, far **0.82**. The far value must equal the impostor
material's flattening so the 54 m handoff does not shift; `verify-lod-color-parity`
already samples across that handoff and will catch a mismatch.

`setArtDirection` writes `uGrassNormalUpRange.y = direction.normalUp` and
`.x = direction.normalUp * config.grassNearNormalUpScale` with
`grassNearNormalUpScale: 0.66` (0.4–1.0), so presets keep one authored value.

### 11.2 Canopy-depth AO

`instanceVariation.z` is `resolveGrassCanopyAo(vigor, suitability)` — a whole-
field term bounded to [0.83, 1]. Add the per-blade depth the brief asks for
("slightly darker vegetation under other vegetation"), computed at build time
where the clump's own top height is already known:

```ts
// A blade standing under its neighbours receives less sky. The clump profile
// already knows how tall its main tier is, so the shortfall of this blade
// against that tier is exactly how deep in the canopy it sits — no neighbour
// search, no runtime cost.
const clumpTop = this.clusterProfile.heightScale *
  this.worldConfig.grassMainHeightScale;
const canopyDepth = THREE.MathUtils.clamp(
  (clumpTop - verticalScale) / Math.max(clumpTop, 1e-3), 0, 1,
);
job.variations[variationOffset + 2] =
  resolveGrassCanopyAo(vigor, suitability) *
  (1 - this.worldConfig.grassCanopyDepthAo * canopyDepth) *
  (1 - this.worldConfig.grassClumpCoreAo * (1 - sampleRadius)) *
  job.random.range(0.992, 1.008);
```

The second factor is the clump-core term: blades near a tuft's centre are more
occluded than blades at its rim.

Config: `grassCanopyDepthAo: 0.26` (0–0.5),
`grassClumpCoreAo: 0.12` (0–0.3).

Because `rootAo` multiplies the whole palette result inside `grassResolvePalette`
(`occlusion = rootLight * bladeVariation * rootAo`), the change is automatically
identical at every LOD — the impostor atlas stores progress and shade, not baked
RGB, and reads the same `vRootAo`.

**Parity risk.** `resolveGrassCanopyAo` currently bounds `rootAo` to
[0.83, 1] and `verify-lod-color-parity` may rely on that range. The new lower
bound is `0.83 × (1 − 0.26) × (1 − 0.12) = 0.541`. Widen the gate's expected
range and re-measure its residual in the same commit.

### 11.3 Ground-contact darkening

`GrassPaletteTuning.json`: `groundContactEnd` 0.27 → **0.33**,
`groundContactStrength` 0.56 → **0.62**. Both feed
`paletteProgressProfile`, so `GRASS_VERTEX_PALETTE_ROOT_PROGRESS` re-derives
automatically; re-run `verify-lod-color-parity`.

### 11.4 Transmission weighting

`FRAGMENT_OUTPUT` already gates transmission on `grassRootAttenuation =
smoothstep(0.12, 0.72, vGrassProgress)`, into-sun, thinness and view facing. This
is correct and needs no change — but it is currently suppressed by the flat
normal via `grassThinness`. Phase 11.1 restores it. Verify with
`verify-grass-dry-lighting` and reduce `backlightStrength` in the presets if the
restored term over-brightens: expect to drop `lush-hero` from 0.34 to ~0.27.

### 11.5 Verification

Extend `scripts/verify-grass-dry-lighting.mjs`:

- Reproduce the normal schedule and assert the near/far flattening values, and
  that the far value matches `WorldGrassImpostorMaterial`'s.
- Assert the sun-facing vs sun-averted Lambert response ratio at 2 m is ≥ 1.9
  (it is ~1.15 today).

Extend `scripts/verify-lod-color-parity.mjs`:

- Widen the `rootAo` sample range to [0.54, 1].
- Assert the p95 near/mid and mid/far deltas stay inside the existing budget.

### 11.6 Acceptance criteria

- Near blades show visible light/shade separation by facing.
- Root contact is visibly dark against the (Phase 4) contact pool.
- No brightness shift at the 28 m or 54 m handoffs (band gate, Section 6.7).

---

## 12. Phase 7 — meadow palette

**Objective.** Muted greens, stronger dark/light grouping, clear material
separation, less yellow.

### 12.1 Global desaturation lever

The cleanest possible intervention: one function that every LOD, the terrain
palette rows, and the impostor rows already route through.

`src/grass/materials/GrassPaletteShader.ts`:

```ts
const desaturationScratch = new THREE.Color();

/**
 * Pulls a palette colour toward its own luminance.
 *
 * Applied after luminance balancing and to the *sources*, so it moves the near
 * blades, the mid blades, the impostor cards and the terrain's grass tint by
 * exactly the same amount — which is what makes a single art lever safe here at
 * all. Because it preserves luminance by construction it cannot move the field's
 * brightness, and so cannot move the LOD parity budget.
 */
export function applyGrassPaletteDesaturation(color: THREE.Color, amount: number): void {
  if (!(amount > 0)) return;
  const value = luminance(color);
  desaturationScratch.setRGB(value, value, value);
  color.lerp(desaturationScratch, Math.min(amount, 1));
}
```

Called at the end of `setBalancedGrassPaletteColors` on all three targets, with
the amount supplied by a new module-level setter
`setGrassPaletteDesaturation(amount)` invoked once from
`WorldApp`/`IslandApp` bootstrap out of `config.grassPaletteDesaturation`.

Config: `grassPaletteDesaturation: 0.14` (0–0.35). Phase 1 ships it at 0.06;
Phase 7 raises it.

### 12.2 Palette tuning

`src/grass/materials/GrassPaletteTuning.json`:

| Key | Today | Target | Why |
|---|---|---|---|
| `tipLuminanceScale` | 1.38 | **1.24** | The single largest "neon" lever; tips are 38% brighter than base before any lighting |
| `shadeLightMinimum` | 0.90 | **0.84** | Stronger dark grouping |
| `shadeLightMaximum` | 1.03 | **1.05** | Stronger light grouping |
| `shadowDesaturation` | 0.50 | **0.44** | Slightly less wash in shadow now that shadows are darker |
| `groundContactEnd` | 0.27 | **0.33** | Phase 6.3 |
| `groundContactStrength` | 0.56 | **0.62** | Phase 6.3 |

All six feed the derived `GRASS_VERTEX_PALETTE_ROOT_PROGRESS` bisection, which
re-solves at module load. `verify-lod-color-parity` re-reads this file and bounds
the residual; expect the residual to move and re-record it.

### 12.3 New default preset

Add to `src/grass/GrassArtPresets.json` and set
`DEFAULT_GRASS_ART_DIRECTION_KEY = "muted-meadow"` in
`src/grass/GrassArtDirection.ts`. Existing presets stay for comparison.

```json
"muted-meadow": {
  "key": "muted-meadow",
  "label": "Muted Meadow",
  "baseColor": "#42702f",
  "tipColor": "#8fae54",
  "dryColor": "#8e8a58",
  "rootDarkening": 0.41,
  "tipColorStrength": 0.30,
  "normalUp": 0.82,
  "ambientBoost": 0.07,
  "backlightStrength": 0.27,
  "impostorBaseColorBlend": 0,
  "impostorColorScale": 0.8,
  "terrainGrassColor": "#5c7a3f",
  "terrainGrassTintStrength": 0.30,
  "densityScale": 0.94,
  "windStrengthScale": 1,
  "flutterStrengthScale": 0.9,
  "nearDistance": 28,
  "midDistance": 54,
  "farDistance": 280,
  "transitionDistance": 8
}
```

`rootDarkening` 0.41 and `tipColorStrength` 0.30 sit inside the
[0.40, 0.48] / [0.28, 0.40] band `GrassPaletteShader`'s
`VERTEX_PALETTE_REFERENCE_*` constants assume and `verify-lod-color-parity`
enforces. `normalUp` is now the **far** value (Phase 6.1), hence 0.82 rather
than 0.76.

### 12.4 Biome and terrain colours

`src/grass/biome/GrassBiomeProfiles.json`:

| Biome | Key | Today | Target |
|---|---|---|---|
| meadow | `tipColor` | `#9ed45a` | `#8cb85a` |
| meadow | `dryColor` | `#b3ac5e` | `#a49a5e` |
| dry-steppe | `baseColor` | `#8a7a38` | `#7d7340` |
| dry-steppe | `tipColor` | `#d4c56a` | `#c0b46c` |
| alpine | `tipColor` | `#6a9a78` | `#639078` |

`src/world/TerrainMaterialController.ts`:

| Uniform | Today | Target |
|---|---|---|
| `uTerrainSoilDry` | `#9a794b` | `#8d7550` |
| `uTerrainSoilRich` | `#5b4931` | `#544433` |
| `uTerrainPathDust` | `#c49a62` | `#b8926a` |
| `uTerrainSoilGrey` | — | `#7a6f5c` (new, Phase 4) |
| `uTerrainMoss` | — | `#4a5f34` (new, Phase 4) |

`GRASS_BIOME_VERSION` in `src/grass/biome/GrassBiomeProfile.ts` must be bumped
from 4 to 5 whenever the profile JSON changes; the loader asserts on it.

### 12.5 Verification

- `verify-lod-color-parity` — re-record residuals; must stay inside the existing
  budget.
- `verify-flower-variety` — flower tints must still separate from the new,
  more-muted foliage; assert minimum CIE ΔE between any flower tint and the
  meadow tip colour ≥ 18.
- `verify-grass-dry-lighting` — dry blades must stay distinguishable from
  healthy ones after desaturation; assert luminance separation ≥ 0.06.

### 12.6 Acceptance criteria

- Mean frame saturation in the reference capture drops by 12–20%.
- The dark/light histogram of the vegetation region becomes bimodal (measure the
  baseline first; target a ≥ 25% increase in the between-cluster variance of a
  two-means split).
- Grass, understory, soil and path are separable by colour alone in a
  false-colour readout.

---

## 13. Configuration summary

All new keys go in `src/world/WorldConfig.ts`, `WorldConfigSchema.ts` (with
range), `WorldConfigValidator.ts` (with cross-checks), and
`public/config/world.yaml` (with a comment explaining the value, per the file's
existing style).

| Key | Default | Range | Phase |
|---|---|---|---|
| `terrainMicroDetailStart` | 9 | 2–30 | 1 |
| `terrainMicroDetailEnd` | 27 | 6–80 | 1 |
| `terrainMesoDetailStart` | 46 | 10–120 | 1 |
| `terrainMesoDetailEnd` | 100 | 20–260 | 1 |
| `terrainCanopyMergeStart` | 64 | 20–200 | 1 |
| `terrainCanopyMergeEnd` | 136 | 40–400 | 1 |
| `terrainCanopyMergeStrength` | 0.62 | 0–1 | 1 |
| `terrainLodBandJitterMicro` | 4 | 0–12 | 1 |
| `terrainLodBandJitterMeso` | 8 | 0–20 | 1 |
| `terrainLodBandJitterCanopy` | 10 | 0–30 | 1 |
| `grassLodBandJitter` | 4 | 0–12 | 1 |
| `grassPaletteDesaturation` | 0.14 (0.06 in P1) | 0–0.35 | 1 / 7 |
| `pathGrassEdgeRoughness` | 0.9 | 0–2.5 | 2 |
| `grassPathPioneerChance` | 0.06 | 0–0.25 | 2 |
| `grassPathPioneerHeightLoss` | 0.45 | 0–0.7 | 2 |
| `grassPathPioneerCoverage` | 0.55 | 0–1 | 2 |
| `grassDisturbanceHeightReduction` | 0.52 | 0–0.8 | 2 |
| `terrainVergeFleckStrength` | 0.34 | 0–0.8 | 2 |
| `grassCommunityWorldSize` | 26 | 14–48 | 3 |
| `grassCommunityStrength` | 0.85 | 0–1 | 3 |
| `grassCommunityQuietStrength` | 0.7 | 0–1 | 3 |
| `grassCommunityShareShortSward` | 0.34 | 0–1 | 3 |
| `grassCommunityShareTallColony` | 0.22 | 0–1 | 3 |
| `grassCommunityShareBareBreak` | 0.10 | 0–1 | 3 |
| `grassCommunityShareFlowerMeadow` | 0.16 | 0–1 | 3 |
| `grassCommunityShareBroadleafUnderstory` | 0.18 | 0–1 | 3 |
| `terrainCommunityTintStrength` | 0.42 | 0–1 | 3 |
| `detailFoliageCommunityStrength` | 0.8 | 0–1 | 3 |
| `detailFoliageGrassHeightCoupling` | 0.55 | 0–1 | 3 |
| `terrainSoilHueWorldSize` | 14 | 6–40 | 4 |
| `terrainSoilHueStrength` | 0.38 | 0–0.8 | 4 |
| `terrainGroundFleckStrength` | 0.16 | 0–0.4 | 4 |
| `terrainHollowDarkening` | 0.14 | 0–0.35 | 4 |
| `terrainHollowMoisture` | 0.12 | 0–0.3 | 4 |
| `terrainMossStrength` | 0.30 | 0–0.7 | 4 |
| `terrainClumpContactAo` | 0.20 | 0–0.45 | 4 |
| `terrainClumpLitterStrength` | 0.18 | 0–0.4 | 4 |
| `grassBladeTipDrift` | 0.9 | 0–1.4 | 5 |
| `grassBroadBladeShare` | 0.09 | 0–0.25 | 5 |
| `grassBroadBladeWidthScale` | 1.75 | 1–2.2 | 5 |
| `grassBladeDamageShare` | 0.07 | 0–0.2 | 5 |
| `grassRosetteChance` | 0.22 | 0–0.5 | 5 |
| `grassRosetteFanRadians` | 0.42 | 0.1–0.9 | 5 |
| `grassNearNormalUpScale` | 0.66 | 0.4–1 | 6 |
| `grassCanopyDepthAo` | 0.26 | 0–0.5 | 6 |
| `grassClumpCoreAo` | 0.12 | 0–0.3 | 6 |

Existing values changed:

| Key / constant | Today | Target | Phase |
|---|---|---|---|
| `grassUltraNearTransitionDistance` | 1 | 3 | 1 |
| `grassNearDensityBoostDistance` | 14 | 15 | 1 |
| `grassNearBridgeDistance` | 18 | 22 | 1 |
| `grassNearBridgeTransitionDistance` | 2 | 4 | 1 |
| `grassMicroDetailFadeEnd` | 10 | 13 | 1 |
| `GRASS_MID_DENSITY_FALLOFF` | 28→62 | 36→74 | 1 |
| `DETAIL_FOLIAGE_FADE_DISTANCE` | 38 | 42 | 1 |
| `DETAIL_FOLIAGE_FADE_TRANSITION` | 4 | 12 | 1 |
| `terrainPathCoreDarkening` | 0.08 | 0.20 | 2 |
| `INSTANCE_HORIZONTAL_SCALE_MAX` | 1.2 | 1.9 | 5 |
| `GrassPaletteTuning.json` (6 keys) | see 12.2 | see 12.2 | 6 / 7 |
| `GRASS_BIOME_VERSION` | 4 | 5 | 7 |

Validator cross-checks to add in `WorldConfigValidator.ts`:

- Every `*Start < *End`, and each jitter `< (end - start)`.
- `terrainCanopyMergeStart >= 74 - 12` (mid falloff end minus slack).
- The five community shares are all `>= 0` and sum to a positive value.
- `pathGrassEdgeRoughness > pathEdgeRoughness`.
- `grassRosetteChance * 2.5 + 1` is reflected in the allocation ceiling.

---

## 14. Verification matrix

| Gate | New / extended | Phase | Guards |
|---|---|---|---|
| `verify-lod-band-separation` (new) | new | 1 | edge separation, overlap, jitter safety, mean preservation, GLSL macro parity, grit mean |
| `verify-terrain-surface` | extended | 1, 4 | grit mean measurement, `uTerrainLodDistances` removal, new uniforms, soil/canopy decorrelation |
| `verify-lod-continuity` | extended | 1, 5 | bounds mirror for shaped blades, schedule constants |
| `verify-lod-color-parity` | extended | 1, 6, 7 | widened `rootAo` range, re-recorded residuals |
| `verify-path-verge` (new) | new | 2 | boundary roughness, CPU/GLSL agreement, pioneer share, walkability |
| `verify-navigation` | extended | 2 | no blade inside the walkable core after the widened cutoff |
| `verify-community-field` (new) | new | 3 | shares, patch scale, continuity, threshold parity, GLSL parity, determinism, hierarchy |
| `verify-detail-foliage-distribution` | extended | 3 | community affinity, per-species colony scale, height coupling |
| `verify-flower-variety` | extended | 3, 7 | colony purity, tint separation from the new foliage colours |
| `verify-ecology` | extended | 3 | community responses do not invert an ecological relationship |
| `verify-grass-placement` | extended | 5 | shape distributions, rosette density conservation, scale ceiling |
| `verify-grass-shape-continuity` | extended | 5 | near/mid silhouette agreement after taper correction |
| `verify-world-grass-allocation` | extended | 5 | `instanceShape` and rosette capacity |
| `verify-grass-dry-lighting` | extended | 6, 7 | normal schedule, facing ratio, dry/healthy separation |
| `verify-grass-performance` | unchanged | all | per-phase budgets |
| `verify-grass-streaming-performance` | unchanged | 1, 5 | widened foliage radius, larger buffers |
| `verify-config-contracts` | extended | all | every new key present in schema, validator, and YAML |

Per repository policy (`CLAUDE.md`), all of this is local: `npm run build` runs
the whole chain, and Pages deployment stays manual via `npm run deploy:pages`.

### Visual QA captures

Use the existing `qa/` harness and `.shots/` convention. Capture at each phase
boundary, from the same seed (`42017`) and the same three poses:

1. **Reference third-person** — the pose in the original screenshot.
2. **Aerial 60 m** — for community structure.
3. **Aerial 90 m, long view** — for LOD banding and distant structure.

Record for each: mean/median luminance, mean saturation, the radial luminance
profile used by Section 6.9, and a two-means split of the vegetation histogram.

---

## 15. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Per-fragment macro noise costs more than budgeted | Frame time | Gate behind `terrainMesoWeight > 0.001`; fall back to the vertex value beyond the meso range, where the field is sub-pixel anyway |
| GLSL/JS hash divergence on some driver | Ground pattern mismatch between blades and terrain | Parity gate at 1e-5 over 4 096 samples; the failure mode is a soft mismatch, not a crash |
| Widening `INSTANCE_HORIZONTAL_SCALE_MAX` to 1.9 inflates reserved bounds and hurts culling | Frame time | Bounds grow by ~0.03 m against a 0.08 m safety margin; measure in `verify-grass-performance` before committing the value |
| Community field fights the existing macro patch field (36 m) | Muddy, doubled structure | Reduce `grassMacroPatchStrength` from 0.52 to 0.34 in the same commit as Phase 3, and assert in `verify-community-field` that the two periods differ by ≥ 25% |
| Rosettes overflow tile buffers | Crash / dropped tiles | Capacity raise + validator cross-check + `verify-world-grass-allocation` |
| Palette moves break `verify-lod-color-parity`'s reference constants | Build failure | `VERTEX_PALETTE_REFERENCE_ROOT_DARKENING`/`…TIP_COLOR_STRENGTH` bound the shipped presets; the new preset is inside them by construction, and the gate re-reads both JSON files |
| Detail-foliage radius growth exceeds the residency ceiling | Streaming stalls | Measured against `verify-near-grass-streaming`; if it binds, raise `DETAIL_FOLIAGE_TILES_PER_FRAME` on desktop only |
| Widened path cutoff radius rejects fewer points, slowing placement | Build-time cost | `PATH_CUTOFF_SAFETY` already carries 2× headroom; measure tile build time in `verify-grass-streaming-performance` |

---

## 16. Definition of done

The plan is complete when all of the following hold on `main`:

1. `npm run build` passes, including the three new gates.
2. The reference third-person capture shows: no camera-distance ring; readable
   20–35 m vegetation communities; bare ground with at least three tones; tufts
   sitting in contact shadow; no repeated blade silhouette in a 5-blade
   neighbourhood; visible facing-based light separation; and a ragged, gradual
   path verge.
3. The 90 m aerial capture shows dark colonies, dry patches and bare breaks at
   200 m.
4. Frame time on the reference capture is within +0.85 ms of the Phase 0
   baseline, and `verify-grass-performance` passes unchanged.
5. Mean frame saturation is 12–20% below baseline and the vegetation histogram is
   measurably more bimodal.
6. Every new config key is documented in `public/config/world.yaml` with a
   comment explaining what it buys, in the style of the surrounding file.
