# Stone reference match: closing the gap to a weathered boulder formation

## Status

- Target branch: `main`
- Status: **phases 0-5 landed; surface micro-detail and mineral zoning still open**
- Baseline: `06e5174`
- Scope: stone body massing, formation fracture, ground integration, dry sheen, palette
- Renderer: no new materials, textures, draws, or runtime dependencies
- Judged with: `npm run shots:stones`, `scripts/diagnose-stone-shape.mjs`, `scripts/diagnose-stone-shading.mjs`

## Why

A reference-image review proposed adding silhouette penalties, sector-specific ring
suppression, dominant-plane construction, fracture splitting, mineral zoning, contact
cleanup and moss selectivity. Six of the seven already shipped. This is the same pattern
[aaa-look-audit.md](aaa-look-audit.md) records, and the same lesson applies: *"the system
exists" and "the system reads" are different claims, and only the second one is about the
look.* The work below is why the shipped systems did not read.

## Two defects found by instrumenting

**The art-direction scorer judged a body that never ships.** `scoreStoneShape` scored
`buildStonePolyhedron(recipe)`, but `generateStoneMesh` applies `leanX`/`leanZ` shear and
`width`/`height`/`depth` scale *after* the clipper returns. Every term in the scorer is a
proportion, so `heightRatio`, `depthRatio` and `lean` could not influence selection at
all, and `scoreStoneSilhouette` -- whose entire purpose is judging a stone the way it is
looked at -- was reading an isotropic upright body. `shapedBody()` in
`StoneShapeQuality.ts` now applies the mesh transform before scoring. Silhouette
-0.121 -> -0.072 from this alone.

**Boundary healing perturbed the mated-fragment rim.** `healBoundaryGaps` chose cluster
representatives by iterating a `Set` in insertion order, which follows the face list --
and two halves of one body do not share a face list. A rim corner could snap on one half
and not the other, so the pair no longer met. It surfaced as `break outlines diverge by
0.0114` (under `HEAL_RADIUS` 1.2e-2) once sharper sectors produced near-degenerate rim
geometry. `fracture`-role points are now pinned as representatives and the rest ordered by
position. Mated formations 63 -> 64.

## What the measurements corrected

| Hypothesis | Measured |
| --- | --- |
| Edge chamfers round the silhouette | Removing all 12.2 `edge-bevel` planes moves the score 0.005 |
| Sector count is the dome | 8-10 -> 5-7 moved silhouette -0.162 -> -0.150 only |
| Concavity clamp suppresses the massing | Relaxing it moved nothing on its own |
| Something makes a hard tonal band | No step in any baked channel; the belt was `heightShade` ramping over 0.6 of body height |

The score is dominated by **circularity** (0.887, contributing -0.799 of a -0.12 total)
over **21 hull corners per view**. That is an elevation-profile property, not a sector
count: the profile was a barrel with a bulging belly narrowing through three bands.

`MAJOR_SHARE` was **not** widened. The plan proposed 0.64-0.80; the constant's own comment
records that a wider range was already tried and reverted because it "left the minor piece
a thin wedge rather than a companion mass."

## Changes

**Massing** (`StoneRecipe.ts`, `StoneProfile.ts`) -- `sideCount` 8-10 -> 5-7 with jitter
and asymmetry raised to compensate; `bellyBulge` to ~0 so contact/belly/shoulder are
near-collinear; `topScale` 0.74-0.94 for a broad crown; `heightRatio` 0.56-0.86 and
`lean` 0.14-0.32 and `topTiltMax` 0.38 for a wedge; `RIDGE_CHANCE.boulder` 0.44 -> 0.18.
New `lobeSharpness`, `maximumRise` and `crownStraightness` per family.

**Fracture** (`StoneFormation.ts`, `StoneClusterTuning.ts`, `StoneClipper.ts`) --
`FRACTURE_TILT_LIMIT` 0.26 -> 0.38 (`fragmentIsViable` already rejects a lid, so the
viability gate decides, not this number); `FORMATION_GAP_MAX` 0.09 -> 0.15 so a crack can
hold its own shadow; `MINIMUM_MAJOR_CUT_AREA_SHARE` 0.055 -> 0.09.

**Tone** (`StoneVertexShading.ts`, `StoneGeometryTuning.ts`) -- `heightShade` ramped over
0.26 instead of 0.6 of body height. It was drawing exactly the belt that `contactShade`
beside it is documented as being kept shallow to avoid. New
`STONE_TONE_DOWNWARD_COMPRESSION` stops an underside being painted to the palette shadow
and then darkened again by the light that already knows it faces down.

**Material** (`StoneGrowthShader.ts`, `world.yaml`) -- `WET_SHEEN` generalised to `SHEEN`
with a broad weak dry lobe (`STONE_DRY_SHEEN_POWER` 16, strength 0.075), unbranched.
`stoneGrainNormalStrength` 0 -> 0.05 at `stoneGrainSize` 1.6. The albedo grain term stays
at zero. The `world.yaml` justification was rewritten rather than left contradicting its
own values.

**Ground** (`StoneRecipe.ts`) -- boulder `embed` 0.18-0.28 -> 0.24-0.36.

**Probe** (`tools/stone-gallery/main.ts`) -- shadow map matched to production *quality*
(grid-sized frustum, production metres-per-texel) rather than its frustum; `?grass=1`
blade cards at the contact rim; grain-texture gate corrected to match
`WorldStoneSystem` (`strength > 0 || normalStrength > 0`) -- gating on the albedo term
alone silently dropped the whole grain path in the configuration that ships. Also fixed a
pre-existing `StoneWetness` type error that had `npm run test:stone-tools` failing on
`main`.

## Result

| Metric | Before | After |
| --- | --- | --- |
| silhouette (shipped body) | -0.121 | -0.078 |
| mated formations | 63 | 64 |
| max verts / tris per body | 340 / 276 | 341 / 276 |
| desktop draws | 49 | 49 |

Budgets are 1500 verts / 1000 tris, so the bodies still use about a quarter of what is
paid for. Triangle count is not the constraint and never was.

## Still open

1. **Mineral zoning does not read.** `resolveCornerWeathering` correlates with height, so
   crust and stain reinforce the vertical gradient instead of making the 3-5 broad regions
   the reference has. Lowering the noise frequency is the next move.
2. **Hull corners are still 21 per view.** The 5-ring loft gives four vertical bands and
   about ten outline corners per side. Reaching the reference's 6-9 corner outline wants a
   per-archetype ring count, which is a structural change to `resolveStoneProfile` and its
   consumers.
3. **Shaded flanks cannot be lifted from inside stone scope.** The world runs sun 4.15
   against hemisphere 0.34, so the fill is ~3% of the key and no ramp change to
   `SKY_SIDE_AMBIENT` moves a shaded face. The ratio is deliberate
   (`WorldEnvironmentTuning`: "a strong sun against a weak fill gives cast shadows real
   weight"). Matching the reference's mid-grey shadowed faces is a world-lighting
   decision.
