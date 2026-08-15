# River Look and Feel Performance Plan

Status: implementation specification  
Revision: 2  
Baseline date: 2026-08-15  
Target: FluffyGrass procedural rivers on desktop and compact/mobile profiles

## Goal

Improve river realism and game feel without materially increasing runtime rendering cost.

The current water renderer is already strong enough to reveal a much better river channel. It already has depth absorption, Fresnel, flow-aligned multi-scale surface motion, contextual foam, stone wakes, shallow caustics, a real depth-tested riverbed, wet terrain response, and compact/mobile detail scaling.

The remaining weakness is primarily structural: `RiverField.ts` still produces a centerline from two sine components and gives each lane a mostly fixed width. `HydrologyField.ts` then carves a largely symmetric depth profile from coverage/bank values. A sophisticated water shader over a regular channel still reads as procedural.

The implementation principle for this pass is:

> one deterministic river morphology drives width, depth, bend asymmetry, apparent flow, riffles, sediment, and bank character.

Do not solve each of those with an unrelated noise field.

---

# Non-negotiable performance constraints

- No SSR.
- No mandatory planar reflections.
- No full fluid/CFD simulation.
- No dynamic tessellation.
- No new full-screen/render-target pass.
- No new river normal texture.
- No per-chunk water material.
- No per-frame procedural texture generation.
- No new CPU allocations in per-sample river/hydrology paths.
- Prefer zero additional water texture samples.
- Prefer zero extra river draw calls except the optional local player-ripple renderer.
- Keep river generation deterministic and continuous in world coordinates.
- Compact/mobile uses the same macro hydrology as desktop.
- Art controls belong in `public/config/world.yaml`; structural mathematical constants belong in a focused tuning module rather than inline in algorithms/shaders.
- No GitHub Actions. Build/test locally and deploy GitHub Pages manually.

Performance target for R1-R10:

- normal frame GPU cost: effectively unchanged;
- water draw-call count: unchanged;
- water texture sample count: unchanged;
- terrain-chunk build p95: no more than 10% above baseline, preferably less than 5%;
- no traversal-time allocations or resource growth.

If a feature fails this budget, simplify the feature before reducing correct depth, Fresnel, absorption, flow direction, or bed ownership.

---

# Implementation map

Primary files:

- `src/world/hydrology/RiverField.ts`
- `src/world/hydrology/HydrologyField.ts`
- `src/world/hydrology/WaterShader.ts`
- `src/world/hydrology/WaterMaterialController.ts`
- `src/world/hydrology/WaterMaterialTuning.ts`
- `src/world/hydrology/WaterBedShader.ts`
- `src/world/hydrology/WaterBedMaterialShader.ts`
- `src/world/hydrology/WaterBedMaterialController.ts`
- `src/world/hydrology/WaterInteractionField.ts`
- `src/world/terrain/TerrainSurfaceField.ts`
- `src/world/TerrainMaterialShader.ts`
- `src/world/TerrainMaterialController.ts`
- `public/config/world.yaml`
- `src/world/WorldConfig.ts`
- `src/world/WorldConfigSchema.ts`
- `src/world/WorldConfigValidator.ts`
- `scripts/verify-hydrology.mjs`
- `scripts/verify-water-flow.mjs`
- `scripts/verify-water-render-contract.mjs`
- `scripts/verify-terrain-surface.mjs`

Optional later files:

- `src/world/hydrology/CharacterWaterRipples.ts`
- `src/world/hydrology/CharacterWaterRippleMaterial.ts`
- a focused river audio controller only after suitable audio assets exist.

Do not create broad new systems when a focused class/function in the existing hydrology package is sufficient.

---

# Configuration additions

Expose only artist-meaningful controls. Do not expose every mathematical coefficient.

Recommended additions to `public/config/world.yaml`:

```yaml
# River morphology. The base lane remains deterministic; these controls vary
# its local width/depth and move the active channel across bends.
riverWidthVariation: 0.08
riverBendBankAsymmetry: 0.05
riverDepthVariation: 0.18
riverBendChannelShift: 0.22
riverBankIncisionScale: 0.10

# Visual velocity remains analytic. These multiply waterFlowSpeed in deep pools
# and shallow energetic sections respectively.
waterRiverPoolFlowScale: 0.78
waterRiverRiffleFlowScale: 1.22
```

Add matching fields to `WorldConfig.ts`, schema/loading, validator, and `verify-config-contracts`.

Suggested validation ranges:

```text
riverWidthVariation       0.00 .. 0.12
riverBendBankAsymmetry    0.00 .. 0.08
riverDepthVariation       0.00 .. 0.25
riverBendChannelShift     0.00 .. 0.30
riverBankIncisionScale    0.00 .. 0.20
waterRiverPoolFlowScale   0.60 .. 1.00
waterRiverRiffleFlowScale 1.00 .. 1.40
```

Width validation must also enforce the combined global width contract, not just individual ranges.

With the base width range specified below:

```text
maxWidthScale = 1.04 * (1 + riverWidthVariation) *
                (1 + riverBendBankAsymmetry)
minWidthScale = 0.94 * (1 - riverWidthVariation) *
                (1 - riverBendBankAsymmetry)
```

Require:

```text
maxWidthScale <= 1.18
minWidthScale >= 0.82
```

The proposed defaults give approximately:

```text
max = 1.04 * 1.08 * 1.05 = 1.17936
min = 0.94 * 0.92 * 0.95 = 0.82156
```

so the existing global river-width envelope remains intact.

---

# Structural tuning constants

Add `src/world/hydrology/RiverTuning.ts` rather than scattering these through `RiverField.ts`:

```text
RIVER_BASE_MIN_WIDTH_SCALE = 0.94
RIVER_BASE_MAX_WIDTH_SCALE = 1.04
RIVER_SECONDARY_AMPLITUDE = 0.30
RIVER_SHELF_DEPTH_SHARE = 0.22
RIVER_CHANNEL_DEPTH_SHARE = 0.78
RIVER_SHELF_START = 0.72
RIVER_CHANNEL_INNER = 0.12
RIVER_CHANNEL_OUTER = 0.78
RIVER_DEPTH_EDGE_START = 0.88
RIVER_MORPH_PRIMARY_WEIGHT = 0.72
RIVER_MORPH_SECONDARY_WEIGHT = 0.28
```

Keep existing global safety constants such as the `0.82` minimum and `1.18` maximum width-scale contract.

Only move constants touched by this work. Do not perform an unrelated hydrology-wide refactor.

---

# R1 — Evaluate a richer river sample without additional trigonometry

## Why

The current sampler already calculates the expensive information needed for better river structure:

```text
primaryPhase
secondaryPhase
sin(primaryPhase)
sin(secondaryPhase)
cos(primaryPhase)
cos(secondaryPhase)
```

Use it. Do not add another Perlin/simplex noise lookup and do not add extra sine waves for morphology.

## `RiverLane` changes

Keep reusable lane objects; do not allocate per sample.

Add cached values to the existing `RiverLane` object:

```ts
signedDistance: number;
primarySin: number;
secondarySin: number;
```

`sampleLane()` becomes conceptually:

```ts
const primarySin = Math.sin(primaryPhase);
const secondarySin = Math.sin(secondaryPhase);
const centerZ =
  shape.laneOffset +
  primarySin * shape.amplitude +
  secondarySin * shape.amplitude * RIVER_SECONDARY_AMPLITUDE;

const signedDistance = z - centerZ;

target.signedDistance = signedDistance;
target.distance = Math.abs(signedDistance);
target.primarySin = primarySin;
target.secondarySin = secondarySin;
```

Do not calculate cosine for both candidate lanes. Continue selecting the nearest lane first, then calculate cosine only for the winning lane as the current implementation does.

## `RiverLaneShape` changes

Rename `halfWidth` to `baseHalfWidth` and reserve part of the existing width envelope for local morphology.

In `resolveLaneShape()`:

```ts
const baseWidthScale = lerp(
  RIVER_BASE_MIN_WIDTH_SCALE,
  RIVER_BASE_MAX_WIDTH_SCALE,
  hash(index, seed + 1361),
);

shape.baseHalfWidth = config.riverWidth * baseWidthScale * 0.5;
```

This deliberately narrows the per-lane random range because local morphology and bend asymmetry now consume the rest of the existing `0.82 .. 1.18` safety envelope.

---

# R2 — Exact longitudinal morphology algorithm

## Goal

Generate the pool/run/riffle rhythm from values already computed by `RiverField`.

Define positive morphology as pool-like and negative morphology as riffle-like:

```text
+1 = broad/deep/calm pool tendency
 0 = normal run
-1 = narrow/shallow/energetic riffle tendency
```

After choosing the winning lane, calculate its two cosines for flow as today:

```ts
const primaryCos = Math.cos(lane.primaryPhase);
const secondaryCos = Math.cos(lane.secondaryPhase);
```

Then derive morphology without any additional trigonometric calls:

```ts
const morphology = clamp(
  lane.primarySin * lane.secondarySin * RIVER_MORPH_PRIMARY_WEIGHT +
  primaryCos * secondaryCos * RIVER_MORPH_SECONDARY_WEIGHT,
  -1,
  1,
);
```

Why this works:

- products of the existing phase components naturally contain sum/difference frequencies;
- the result produces longer longitudinal zones instead of pixel-scale/random variation;
- it is deterministic across chunk boundaries;
- it costs only multiplies/adds after the trig already required for centerline and flow.

Do not quantize morphology into three hard states. Pools/runs/riffles are interpretations of one continuous signal.

For debugging/tests only:

```text
pool candidate   morphology >= +0.35
run              -0.35 < morphology < +0.35
riffle candidate morphology <= -0.35
```

Rendering and carving must use the continuous value.

---

# R3 — Exact bend/curvature algorithm

## Goal

Know which side of the river is the inside bend and which is the outside bend using the existing analytic centerline.

The river centerline is:

```text
z(x) = offset
     + A sin(p)
     + A * secondaryAmplitude * sin(q)
```

where:

```text
p = x * primaryFrequency + phasePrimary
q = x * secondaryFrequency + phaseSecondary
```

First derivative, already equivalent to the current flow tangent:

```ts
const firstDerivative =
  primaryCos * amplitude * primaryFrequency +
  secondaryCos * amplitude * RIVER_SECONDARY_AMPLITUDE * secondaryFrequency;
```

Second derivative:

```ts
const secondDerivative =
  -lane.primarySin * amplitude * primaryFrequency * primaryFrequency -
  lane.secondarySin * amplitude * RIVER_SECONDARY_AMPLITUDE *
    secondaryFrequency * secondaryFrequency;
```

Reuse the existing tangent length:

```ts
const tangentLength = Math.sqrt(1 + firstDerivative * firstDerivative);
```

Signed geometric curvature:

```ts
const curvature =
  secondDerivative /
  (tangentLength * tangentLength * tangentLength);
```

Normalize against the lane's maximum analytic second-derivative scale:

```ts
const curvatureReference = Math.max(
  1e-9,
  amplitude * (
    primaryFrequency * primaryFrequency +
    RIVER_SECONDARY_AMPLITUDE * secondaryFrequency * secondaryFrequency
  ),
);

const bend = clamp(curvature / curvatureReference, -1, 1);
```

Interpretation in the current `x/z` river representation:

```text
bend > 0 : centre of curvature is toward +z
bend < 0 : centre of curvature is toward -z
```

The inside bend is on the same signed side as `bend`; the outside bend is opposite.

Do **not** multiply bend by `flowSign`. Reversing downstream direction does not change which geometric bank is inside/outside.

Keep flow direction normalized exactly as today:

```ts
target.flowX = flowSign / tangentLength;
target.flowZ = flowSign * firstDerivative / tangentLength;
```

---

# R4 — Exact local width and asymmetric banks

## Goal

Use morphology and bend to vary river width without violating the existing separation/coverage envelope.

For the selected lane:

```ts
const side =
  lane.signedDistance > 0 ? 1 :
  lane.signedDistance < 0 ? -1 : 0;

const morphologyWidth =
  1 + config.riverWidthVariation * morphology;

const bendSide = bend * side;
// bendSide > 0 is the inside bank.
const bendWidth =
  1 + config.riverBendBankAsymmetry * bendSide;

const localHalfWidth =
  lane.shape.baseHalfWidth * morphologyWidth * bendWidth;
```

This gives:

- positive morphology/pools: wider;
- negative morphology/riffles: narrower;
- inside bend: slightly wider depositional side;
- outside bend: slightly tighter/cut-bank side.

Use `localHalfWidth` for all three existing river masks:

```text
coverage
bank
proximity
```

Do not calculate width once for coverage and differently for ecology/wetness.

The existing edge feather remains world-space and unchanged unless visual testing proves the shoreline becomes too sharp.

---

# R5 — Exact asymmetric cross-section and bed depth

## Goal

Replace the current mostly symmetric coverage-based river incision with a shallow shelf + shifted deep channel.

After resolving `localHalfWidth`:

```ts
const lateral = clamp(
  lane.signedDistance / Math.max(localHalfWidth, 1e-6),
  -1,
  1,
);
const absLateral = Math.abs(lateral);
```

Move the deep channel toward the outside bend:

```ts
const channelCenter =
  -bend * config.riverBendChannelShift;
```

Build three cheap masks using the existing `smoothstep(value, min, max)` helper semantics.

Edge mask, guaranteeing depth reaches zero at the bank:

```ts
const edgeMask =
  1 - smoothstep(absLateral, RIVER_DEPTH_EDGE_START, 1);
```

Shallow shelf:

```ts
const shelf =
  RIVER_SHELF_DEPTH_SHARE *
  (1 - smoothstep(absLateral, RIVER_SHELF_START, 1));
```

Deep active channel:

```ts
const channelDistance = Math.abs(lateral - channelCenter);
const channel =
  RIVER_CHANNEL_DEPTH_SHARE *
  (1 - smoothstep(
    channelDistance,
    RIVER_CHANNEL_INNER,
    RIVER_CHANNEL_OUTER,
  ));
```

Final normalized section:

```ts
const section = clamp((shelf + channel) * edgeMask, 0, 1);
```

Longitudinal depth variation:

```ts
const depthScale =
  1 + config.riverDepthVariation * morphology;
```

Physical bed depth:

```ts
const bedDepth =
  config.riverDepth * section * depthScale * altitudeMask;
```

Expected behavior:

- pool morphology: wider + deeper;
- riffle morphology: narrower + shallower;
- outside bend: channel core shifts toward that bank;
- inside bend: broader shallow shelf;
- bank edge: depth smoothly approaches zero.

Add to `RiverSample`:

```ts
morphology: number;
bend: number;
lateral: number;
bedDepth: number;
incisionDepth: number;
```

These are scalar fields on the reused sample object, not allocations.

---

# R6 — Exact terrain carving and water-depth ownership

## `HydrologyField.carveHeight()`

The river owns its channel depth. `HydrologyField` should no longer reconstruct river depth from arbitrary `coverage * 0.72 + bank * 0.28` weights.

Retain a small bank-shoulder incision so the dry/wet transition does not become a vertical lip:

```ts
const shoulderIncision =
  config.riverDepth *
  config.riverBankIncisionScale *
  river.bank *
  (1 - river.coverage);

river.incisionDepth = river.bedDepth + shoulderIncision;

let carved = height - river.incisionDepth;
```

Lake carving remains unchanged.

## `HydrologyField.sample()`

For river water, reconstruct the surface from the carved bed plus exactly the incision used to create it:

```ts
const riverWaterLevel =
  carvedHeight + river.incisionDepth + config.waterSurfaceOffset;
```

Use the lake level when the current lake basin is active exactly as today.

This is intentionally simple:

```text
source terrain
  - incisionDepth
  = river bed

river bed
  + incisionDepth
  + waterSurfaceOffset
  = river surface
```

The water mesh's existing `waterData.y = waterLevel - terrainHeight` therefore becomes a direct representation of the real local section depth rather than an unrelated coverage approximation.

Do not add a second CPU river-depth calculation in `WaterChunkGeometry.ts`.

---

# R7 — Visual flow energy from existing GPU data

## Goal

Make pools look slower and riffles look faster without packing another per-vertex river attribute.

Do **not** add morphology/bend varyings in the first pass. The structural work already expresses morphology through actual depth and coverage, which the water shader receives.

## `WaterMaterialController.ts`

Add three uniforms:

```text
uWaterRiverReferenceDepth = riverDepth + waterSurfaceOffset
uWaterRiverPoolFlowScale = waterRiverPoolFlowScale
uWaterRiverRiffleFlowScale = waterRiverRiffleFlowScale
```

One-time uniforms have negligible runtime cost.

## `WaterShader.ts`

Immediately after resolving `waterDepth`, `waterCoverageRaw`, and `waterGeometricNormal`:

```glsl
float waterRiverDepthRatio =
  waterDepth / max(0.1, uWaterRiverReferenceDepth);

float waterChannelCore = smoothstep(
  0.40,
  0.92,
  waterCoverageRaw
);

float waterShallowEnergy = 1.0 - smoothstep(
  0.72,
  1.02,
  waterRiverDepthRatio
);

float waterSurfaceSlopeEnergy = saturate(
  (1.0 - waterGeometricNormal.y) * 6.0
);

float waterEnergy01 = saturate(
  waterShallowEnergy * 0.82 +
  waterSurfaceSlopeEnergy * 0.18
);

float waterLocalFlowScale = mix(
  uWaterRiverPoolFlowScale,
  uWaterRiverRiffleFlowScale,
  waterEnergy01
);

waterLocalFlowScale *= mix(
  0.82,
  1.0,
  waterChannelCore
);

float waterLocalFlowSpeed =
  uWaterFlowSpeed * waterLocalFlowScale;
```

Use `waterLocalFlowSpeed` only for river motion. Lakes retain their existing calm wave timing.

Replace river uses of `uWaterFlowSpeed` in:

- advected river noise speed;
- river phase A/B/C time terms;
- flow sheen timing;
- riffle timing where appropriate.

Do not globally speed up lake wave components.

## Riffle wavelength

Shallow energetic flow should also look tighter, not only faster.

Calculate:

```glsl
float waterRiverFrequencyScale = mix(
  0.88,
  1.16,
  waterEnergy01
);
```

Put `0.88` and `1.16` in `WaterMaterialTuning.ts` and interpolate them into the generated GLSL rather than leaving new magic numbers inline.

Multiply only river spatial phase frequencies by `waterRiverFrequencyScale`.

Expected result:

```text
deep pool   -> slower, longer surface structures
normal run  -> existing baseline feel
riffle      -> faster, tighter directional structures
bank edge   -> reduced apparent velocity
```

No new texture sample, varying, draw, or render target is required.

---

# R8 — Riffle and foam algorithm

## Goal

Riffles should read from shallow depth + fast directional motion + visible gravel. Foam is secondary evidence.

Reuse `waterShallowEnergy`, `waterEnergy01`, `waterDetailWeight`, and the existing riffle pattern.

Define:

```glsl
float waterRiffleEnergy =
  waterRiverAmount *
  waterDetailWeight *
  waterShallowEnergy *
  smoothstep(0.52, 0.88, waterEnergy01);
```

Then gate the existing procedural riffle pattern with this value instead of allowing comparable riffle foam throughout the river.

Recommended foam composition after tuning:

```glsl
float waterFoamAmount = saturate(
  (
    waterShoreBand * 0.18 +
    waterRiverFoam * 0.42 +
    waterStoneFoam * 0.56
  ) * uWaterFoamStrength
);
```

The exact coefficients should live in `WaterMaterialTuning.ts` if implementation touches them.

The important change is the hierarchy:

```text
stone/obstacle foam > energetic riffle foam > generic shoreline foam
```

Calm freshwater banks must not produce a continuous white outline.

---

# R9 — Hydrology-aware riverbed using zero extra samples

## Goal

Make the existing bed texture change character with the real channel depth instead of looking statistically similar everywhere.

Do not add another bed texture.

## `WaterBedMaterialController.ts`

Add the same one-time reference-depth uniform:

```text
uWaterRiverReferenceDepth = riverDepth + waterSurfaceOffset
```

## `WaterBedMaterialShader.ts`

Derive:

```glsl
float bedDepthRatio =
  waterBedDepth / max(0.1, uWaterRiverReferenceDepth);

float bedChannelCore = smoothstep(
  0.42,
  0.90,
  waterBedCoverageRaw
);

float bedRiffle =
  waterBedRiverAmount *
  (1.0 - smoothstep(0.72, 1.02, bedDepthRatio));

float bedPool =
  waterBedRiverAmount *
  smoothstep(1.04, 1.28, bedDepthRatio);

float bedBank =
  waterBedRiverAmount *
  (1.0 - smoothstep(0.45, 0.88, waterBedCoverageRaw));
```

Pass these masks into `waterSampleRiverBed()` or perform the composition immediately after the existing base sample.

Modify the existing `pebble` interpretation rather than sampling another texture:

```glsl
float coarseBias =
  bedRiffle * 0.26 +
  bedChannelCore * 0.05 -
  bedPool * 0.18;

pebble = saturate(pebble + coarseBias);

float fineDeposition = saturate(
  bedPool * 0.22 +
  bedBank * 0.12
);

pebble *= 1.0 - fineDeposition;
```

Algae should prefer calmer bank zones and retreat from energetic riffles:

```glsl
algae *= clamp(
  1.0 + bedBank * 0.25 - bedRiffle * 0.30,
  0.55,
  1.25
);
```

Deep pools can be slightly darker using the existing color result:

```glsl
waterBedColor *= 1.0 - bedPool * 0.06;
```

Keep the current texture sample count unchanged:

- base riverbed sample: unchanged;
- algae sample: unchanged;
- caustic samples: unchanged;
- no new sample for sediment classification.

### Deliberate first-pass limitation

Do not add explicit bend/lateral attributes merely to make inside-bend sand and outside-bend gravel more literal. The new geometry already creates shallow inside shelves and a deeper outside channel. First verify how much sediment distinction naturally emerges from depth and coverage.

Only if visual sign-off proves that insufficient should a later revision consider packing one additional scalar. Do not pay that bandwidth cost pre-emptively.

---

# R10 — Shoreline composition using existing terrain samples

## Goal

Break the uniform wet strip using data already sampled by `TerrainMaterialShader.ts`.

The shader already has:

```text
terrainWaterProximity
terrainCoverage
terrainBaseNoise
terrainMesoNoise
terrainMicroNoise
```

Do not add a shoreline texture or mesh.

Use the existing narrow wet-band principle and derive exposed material patches:

```glsl
float shoreBand = smoothstep(
  0.94,
  1.0,
  terrainWaterProximity
);

float shoreExposure =
  shoreBand * (1.0 - terrainCoverage * 0.75);

float shorePatch = clamp(
  0.55 +
  (terrainBaseNoise.r - 0.5) * 0.90 +
  (terrainMesoNoise.g - 0.5) * 0.65,
  0.0,
  1.0
);

float shoreMud =
  shoreExposure *
  (1.0 - smoothstep(0.46, 0.63, shorePatch));

float shoreGravel =
  shoreExposure *
  smoothstep(0.68, 0.84, shorePatch);
```

Use the existing rich wet-soil color for `shoreMud`.

Do not reuse a path-specific uniform as the permanent semantic source for shore gravel. Add a focused shoreline gravel color to the terrain material tuning/controller if the current palette lacks one.

The existing wet sheen remains driven by exposed wet ground; do not make grass itself glossy.

Expected sequence:

```text
water
 -> submerged gravel/sediment
 -> irregular exposed mud/gravel
 -> short damp vegetation
 -> normal grass
```

No additional terrain texture sample is necessary because all masks use values already loaded for normal terrain shading.

---

# R11 — Stone wake refinement without more samples

`WaterInteractionField.ts` currently takes three upstream clearance samples. Keep the sample count at three.

The current wake uses a fixed expanded-clearance radius. Make the radius grow downstream so the wake broadens naturally:

```ts
for (let index = 1; index <= WAKE_SAMPLE_COUNT; index += 1) {
  const progress = index / WAKE_SAMPLE_COUNT;
  const distance = config.waterStoneWakeLength * progress;

  const wakeRadius =
    STONE_INTERACTION_EXTRA_RADIUS *
    (0.70 + progress * 0.80);

  const upstreamClearance = sampleStoneGrassClearance(
    x - flowX * distance,
    z - flowZ * distance,
    wakeRadius,
  );

  const upstreamObstacle = clamp01(1 - upstreamClearance);
  const strength = lerp(0.85, 0.55, progress);
  wake = Math.max(wake, upstreamObstacle * strength);
}
```

Result:

- wake starts narrow and strong;
- wake becomes wider and weaker downstream;
- no extra stone-field queries beyond the existing three;
- no symmetric foam halo needs to be added.

Do not add particle spray for ordinary stream stones.

---

# R12 — Subtle water-color reinforcement

Depth remains the main color driver. Context tint should be almost invisible when viewed alone.

Reuse the flow/depth masks already calculated in `WaterShader.ts`.

After the current shallow/deep absorption mix and before Fresnel:

```glsl
float waterPoolTint =
  waterRiverAmount *
  smoothstep(1.05, 1.30, waterRiverDepthRatio);

float waterRiffleTint =
  waterRiverAmount *
  waterShallowEnergy *
  waterEnergy01;

waterSurfaceColor *=
  1.0 - waterPoolTint * 0.035 + waterRiffleTint * 0.025;
```

If a hue shift is desired after visual testing, interpolate toward the existing shallow/deep colors. Do not introduce a new palette unless the current colors cannot express the result.

No extra sample.

---

# R13 — Character-water interaction: one optional tiny draw

This is the only planned feature allowed to add a draw because it directly improves game feel.

Do not modify the whole water mesh dynamically.

## Architecture

Create a focused local renderer with at most four active ripple instances:

```text
CharacterWaterRipples
  - one shared quad/ring geometry
  - one small ShaderMaterial
  - one InstancedMesh
  - maxInstances = 4 desktop
  - maxInstances = 2 compact
```

The mesh exists once and is hidden when there are no active ripples.

## Spawn condition

At each foot/contact point, query existing hydrology/terrain contact data.

Spawn only on a dry -> wet transition or on a new footfall while submerged enough to see a disturbance.

Suggested thresholds:

```text
minimum visible depth: 0.08 m
minimum foot speed:    0.35 m/s
run/full-strength:     4.5 m/s
```

Do not spawn every frame.

## Ripple state

Each instance stores:

```text
originXZ
spawnTime
strength
flowDirection
```

At time `age`:

```ts
radius = 0.18 + age * 1.15;
width = 0.055 + age * 0.018;
opacity = strength * Math.exp(-age * 2.8);
center += flowDirection * age * 0.22 * config.waterFlowSpeed;
```

Expire at:

```text
age >= 1.6 s
or opacity < 0.02
```

## Analytic ring shader

No ripple texture is needed.

For local radial coordinate `r`:

```glsl
float outer = smoothstep(radius + width, radius, r);
float inner = smoothstep(radius, radius - width, r);
float ring = max(0.0, outer - inner);
alpha *= ring;
```

The visual should be mostly normal/specular disturbance with restrained alpha, not a bright white circle.

Splash particles remain out of scope for the first pass. Add them only if the ring/wake feedback is clearly insufficient.

---

# R14 — River audio, optional after visuals

Audio has a much larger perceived-quality return than expensive reflection passes, but do not implement it until appropriate audio assets exist.

Use a small number of sources, not sources tiled along the river.

At the player position, sample hydrology at a low rate such as 10 Hz and smooth values over time.

Conceptual gains:

```ts
const nearRiver = smoothstep(waterProximity, 0.10, 0.85);
const riffle = riverCoverage * shallowEnergy;

calmGainTarget = nearRiver * (1 - riffle * 0.65);
riffleGainTarget = nearRiver * riffle;
```

Use exponential smoothing, not abrupt gain changes:

```ts
value += (target - value) * (1 - Math.exp(-dt * 4));
```

Character splash sounds are event-driven from the same entry/footfall events used by R13.

---

# Data-flow rule

The intended dependency chain after implementation is:

```text
RiverField analytic centreline
  -> curvature/bend
  -> one longitudinal morphology signal
  -> local width
  -> asymmetric cross-section
  -> real local water depth
  -> shader apparent velocity/riffle energy
  -> bed material composition
  -> shoreline exposure
```

This is the core of the plan.

Do not create separate random fields for:

```text
pool locations
riffle locations
width variation
depth variation
foam variation
sediment variation
```

Those should be consequences of the same river structure.

---

# Recommended implementation sequence

## Commit 1 — river morphology and width

Files:

- `RiverTuning.ts` new
- `RiverField.ts`
- config/schema/validator
- `verify-hydrology.mjs`

Implement R1-R4 only.

Acceptance before continuing:

- width remains inside the old global envelope;
- morphology is deterministic;
- flow remains unit length;
- no chunk seam.

## Commit 2 — bend-aware cross-section

Files:

- `RiverField.ts`
- `HydrologyField.ts`
- `verify-hydrology.mjs`

Implement R5-R6.

Acceptance:

- outside bend is deeper than mirrored inside sample for strong bends;
- pool candidate is deeper/wider than riffle candidate;
- water depth remains non-negative;
- lakes unchanged.

## Commit 3 — depth-driven visual flow

Files:

- `WaterMaterialController.ts`
- `WaterMaterialTuning.ts`
- `WaterShader.ts`
- `verify-water-flow.mjs`
- `verify-water-render-contract.mjs`

Implement R7-R8 and R12.

Acceptance:

- no new texture sample;
- no new varying;
- pools visibly calmer than riffles;
- foam no longer outlines quiet banks.

## Commit 4 — riverbed composition

Files:

- `WaterBedMaterialController.ts`
- `WaterBedMaterialShader.ts`
- `WaterBedShader.ts`
- water render verifier

Implement R9.

Acceptance:

- exact same bed texture count;
- shallow energetic zones look coarser;
- deeper pool zones look finer/darker;
- bed never overlays character.

## Commit 5 — shoreline and wake polish

Files:

- `TerrainMaterialShader.ts`
- `TerrainMaterialController.ts`
- terrain tuning if needed
- `WaterInteractionField.ts`
- `verify-terrain-surface.mjs`
- stone/water verification

Implement R10-R11.

## Commit 6 — gameplay feel

Only after the no-cost structural/rendering work is visually signed off.

Implement R13. R14 remains optional based on available audio assets.

---

# Exact automated verification

Extend existing scripts rather than creating broad duplicate test infrastructure.

## River width bounds

Sample many deterministic positions across several river lanes.

Assert:

```text
localHalfWidth / (riverWidth * 0.5) >= 0.82 - epsilon
localHalfWidth / (riverWidth * 0.5) <= 1.18 + epsilon
```

Also assert the config-level combined min/max formulas.

## Determinism

For the same seed/x/z/height, repeated samples must match exactly for:

```text
coverage
bank
proximity
flowX
flowZ
morphology
bend
lateral
bedDepth
incisionDepth
```

## Flow normalization

Where river coverage is active:

```text
abs(sqrt(flowX^2 + flowZ^2) - 1) <= 1e-6
```

## Cross-section symmetry on straight runs

For `abs(bend) < 0.05`, mirrored lateral positions should have nearly equal depth:

```text
abs(depth(+u) - depth(-u)) <= smallTolerance
```

## Bend asymmetry

For `bend >= 0.45`, compare equal offsets:

```text
outside = negative lateral
inside  = positive lateral

depth(outside at |u|=0.45) > depth(inside at |u|=0.45)
```

Reverse sides for negative bend.

## Pool/riffle relation

Across a large deterministic sample set:

```text
mean width(morphology >= +0.35)
  > mean width(morphology <= -0.35)

mean center depth(morphology >= +0.35)
  > mean center depth(morphology <= -0.35)
```

Do not require every individual sample to satisfy a global statistical rule when bend geometry legitimately modifies it.

## Bank continuity

Sample a river along x at small increments and ensure width/depth changes remain finite and continuous. No hard morphology classification may enter carving.

## Chunk seam contract

Evaluate identical world positions from neighboring chunk-generation paths and require equal hydrology values within existing float tolerances.

## Depth contract

Where water is visible:

```text
waterLevel >= terrainBedHeight
waterData.y >= 0
finite(waterData.y)
```

## Render contract

Static verification should assert:

- surface shader still has no bed texture ownership;
- bed material remains opaque/depth-writing/depth-tested;
- new river visual-flow logic uses no additional sampler uniform;
- compact/mobile uses the same river morphology config;
- water controller remains shared across chunks.

---

# Manual visual matrix

Capture desktop and compact/mobile for:

- [ ] 150-300 m river overview: width must not read constant;
- [ ] long straight/run section;
- [ ] strong positive bend from above;
- [ ] strong negative bend from above;
- [ ] inside-bend shallow shelf close-up;
- [ ] outside-bend deep channel close-up;
- [ ] pool candidate;
- [ ] riffle candidate;
- [ ] pool -> run transition;
- [ ] run -> riffle transition;
- [ ] shallow top-down bed visibility;
- [ ] grazing-angle river flow;
- [ ] irregular wet mud/gravel bank;
- [ ] protruding stone wake;
- [ ] quiet bank with almost no foam;
- [ ] direct sun highlight in pool;
- [ ] direct sun highlight in riffle;
- [ ] character fully in front of shallow river;
- [ ] character partly submerged;
- [ ] camera moving across chunk boundary;
- [ ] camera moving past `waterDetailDistance`;
- [ ] before/after frame-time and draw-call comparison.

If R13 is implemented:

- [ ] walking foot entry;
- [ ] running foot entry;
- [ ] ripple drift downstream;
- [ ] ripple expiration/no spam;
- [ ] compact max-two ripple behavior.

---

# What not to implement in this pass

Do not add:

- screen-space reflections;
- planar reflection cameras;
- scene-color refraction pass;
- fluid simulation grid;
- compute-shader water simulation;
- Gerstner-style geometry displacement for ordinary rivers;
- tessellated river surfaces;
- foam particles along the entire bank;
- shoreline decals;
- a shoreline distance texture;
- a separate pool/riffle noise texture;
- extra bed textures for sand/gravel classes;
- explicit bend/lateral GPU attributes unless depth-driven bed composition proves insufficient in visual review.

Those are all worse cost/benefit than improving the deterministic channel structure first.

---

# Definition of done

The river pass is complete when all of these are true:

- [ ] River width varies smoothly while staying inside the existing safe width envelope.
- [ ] Pools/runs/riffles emerge from one continuous deterministic morphology signal.
- [ ] Strong bends have wider inside shelves and deeper outside channels.
- [ ] River carving uses the explicit cross-section depth rather than arbitrary coverage weighting.
- [ ] Water depth passed to the existing renderer reflects the new channel structure.
- [ ] Pools appear calmer/slower and riffles faster/tighter without a new simulation.
- [ ] Quiet banks are nearly foam-free.
- [ ] Riffles read from depth, gravel, motion, and only then foam.
- [ ] Riverbed composition responds to depth/energy without additional texture samples.
- [ ] Shoreline mud/gravel breakup reuses existing terrain samples.
- [ ] Stone wakes broaden and weaken downstream without increasing the three-sample CPU budget.
- [ ] Bed/pebbles/caustics never render over the character.
- [ ] Desktop and compact/mobile share identical macro hydrology.
- [ ] No mandatory new render pass, texture, or water draw call was introduced in R1-R12.
- [ ] Build and existing static verification pass.
- [ ] Manual visual matrix is reviewed.
- [ ] Performance remains in the same frame-rate tier.

The highest-value stopping point, if scope must be reduced, is R1-R10. Character ripples and audio improve feel further, but the structural river work should be completed first.