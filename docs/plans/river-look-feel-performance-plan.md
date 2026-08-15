# River Look and Feel Performance Plan

Status: implementation specification  
Revision: 3  
Baseline date: 2026-08-15  
Target: FluffyGrass procedural rivers on desktop and compact/mobile profiles

## Goal

Improve river realism and game feel without materially increasing runtime rendering cost.

The water renderer is already strong enough to reveal a better river channel: depth absorption, Fresnel, flow-aligned multi-scale motion, contextual foam, stone wakes, bed caustics, a real depth-tested bed, wet terrain response, and compact/mobile detail scaling already exist.

The remaining weakness is mainly structural. `RiverField.ts` builds a centreline from two sine components and gives a lane a mostly fixed width. `HydrologyField.ts` then reconstructs a mostly symmetric incision from coverage. A sophisticated water shader over a regular channel still reads as procedural.

The governing rule for this work is:

> one deterministic river morphology drives width, depth, bend asymmetry, apparent flow, riffles, sediment, and bank character.

Do not solve each visible effect with an unrelated noise field.

---

# 1. Hard performance contract

These are release constraints, not suggestions.

## Rendering

For R1-R12:

- 0 new mandatory render passes;
- 0 SSR;
- 0 planar reflection cameras;
- 0 scene-colour refraction pass;
- 0 dynamic tessellation;
- 0 new river normal textures;
- 0 new per-chunk materials;
- 0 new water draw calls;
- 0 new water-bed draw calls;
- 0 new water vertex attributes or varyings in the first implementation;
- 0 additional surface-water sampler uniforms;
- 0 additional riverbed sampler uniforms;
- compact/mobile keeps the same macro hydrology as desktop.

The optional character-ripple phase is the only phase allowed to add one small instanced draw.

## CPU river generation

`RiverField.sample()` and helpers are hot chunk-build paths.

Requirements:

- no arrays, objects, closures, vectors, or temporary collections allocated per sample;
- keep the existing reusable lane/sample objects;
- exactly two `Math.sin()` evaluations per candidate lane, as required by the two existing centreline phases;
- calculate `Math.cos()` only for the selected/winning lane;
- do not add Perlin/simplex/value-noise calls to the river sampler;
- do not add a third trigonometric river octave;
- do not raise `WAKE_SAMPLE_COUNT` above 3;
- do not increase terrain streaming frame budgets to hide slower generation.

## Memory/resource ownership

- one shared `WaterMaterialController` per `TerrainStreamer`;
- one shared `WaterBedMaterialController` per `TerrainStreamer`;
- one flow texture and one bed texture remain shared;
- no procedural texture generation during traversal;
- no material/texture/render-target growth while crossing chunks;
- `waterData` remains a `vec4`/4-float attribute;
- `waterInteraction` remains a 2-float attribute;
- extra morphology values remain CPU semantic fields unless visual sign-off proves GPU packing is necessary.

## Performance budgets

Measure against the commit immediately before river implementation on the same machine/browser/build/profile.

For R1-R12:

```text
terrain chunk build median   <= baseline + 5%
terrain chunk build p95      <= baseline + 10%
river-view GPU/frame median  <= baseline + 3%
river-view GPU/frame p95     <= baseline + 5%
draw calls                   exactly unchanged for equivalent view
water sampler uniforms       exactly unchanged
bed sampler uniforms         exactly unchanged
persistent resources         exactly unchanged
```

Water-covered triangle count may move slightly because the real river width changes wet-cell coverage. Do not require identical triangle counts. Treat a sustained increase above 5% in equivalent river views as a reason to inspect coverage/topology before accepting it.

Performance timing in a browser is repeatable, not mathematically deterministic. Logic/geometry tests must be deterministic; timing gates use repeated runs and medians as described later.

Do not compensate for a regression by reducing grass quality, terrain radius, water detail distance, resolution, or another unrelated feature.

---

# 2. Exact implementation map

## Core river structure

| File | Change | Responsibility |
| --- | --- | --- |
| `src/world/hydrology/RiverTuning.ts` | **new** | Structural constants, safe width envelope, morphology weights, cross-section constants. No runtime state. |
| `src/world/hydrology/RiverField.ts` | modify | Compute cached phase values, morphology, analytic bend curvature, local width, lateral coordinate, bed depth, incision depth. |
| `src/world/hydrology/HydrologyField.ts` | modify | Use explicit river incision, reconstruct river water level from the same depth, expose CPU-only river semantic fields. |
| `src/world/TerrainField.ts` | verify/minimal change only | Continue exposing hydrology through the existing sampling path. Do not duplicate river math here. |

## Water surface

| File | Change | Responsibility |
| --- | --- | --- |
| `src/world/hydrology/WaterMaterialTuning.ts` | modify | Non-artist shader constants only; no hidden duplicate YAML values. |
| `src/world/hydrology/WaterMaterialController.ts` | modify | Add uniforms/setter for live river visual tuning. |
| `src/world/hydrology/WaterShader.ts` | modify | Derive local flow energy from existing depth/coverage/normal data; tune river phases/foam/colour without new samples. |

## Riverbed

| File | Change | Responsibility |
| --- | --- | --- |
| `src/world/hydrology/WaterBedMaterialController.ts` | modify | Live bed tuning and reference depth uniform. |
| `src/world/hydrology/WaterBedMaterialShader.ts` | modify | Derive pool/riffle/bank masks from existing data. |
| `src/world/hydrology/WaterBedShader.ts` | modify | Reinterpret existing bed noise as coarse/fine/algae material according to hydrology masks. |

## Shore and stones

| File | Change | Responsibility |
| --- | --- | --- |
| `src/world/TerrainMaterialShader.ts` | modify | Mud/gravel shoreline breakup using already sampled terrain noise. |
| `src/world/TerrainMaterialController.ts` | minimal modify | Add a focused shore gravel colour/uniform only if existing palette cannot express it. |
| `src/world/hydrology/WaterInteractionField.ts` | modify | Broaden existing 3-sample wake downstream; do not add samples. |

## Configuration

| File | Change | Responsibility |
| --- | --- | --- |
| `public/config/world.yaml` | modify | Persistent artist-approved river parameters. This remains the source of truth. |
| `src/world/WorldConfig.ts` | modify | Typed fields. |
| `src/world/WorldConfigSchema.ts` | modify | Parse/default fields using existing config architecture. |
| `src/world/WorldConfigValidator.ts` | modify | Range checks plus combined width-envelope checks. |
| `scripts/verify-config-contracts.mjs` | modify | Assert every YAML field is typed, parsed, validated, and consumed. |

## Development tuning UI

The repository already uses a native `GrassArtMenu` with range controls and YAML export. Follow that pattern instead of introducing lil-gui/dat.gui as another dependency.

| File | Change | Responsibility |
| --- | --- | --- |
| `src/app/RiverArtMenu.ts` | **new** | Native river tuning panel, YAML export/copy, structural reload controls, QA camera shortcuts. |
| `src/dev/RiverDevelopmentConfig.ts` | **new** | Allowlisted session-only tuning overrides used only under `?riverTuning=1`. |
| `src/app/WorldApp.ts` | modify | Apply dev override before construction; create/dispose RiverArtMenu; forward live visual tuning to TerrainStreamer. |
| `src/world/TerrainStreamer.ts` | modify | `setRiverVisualTuning(...)` forwarding to shared water/bed controllers only. No chunk material cloning. |
| `src/style.css` | modify | Styling matching `GrassArtMenu`; reuse existing tuning-menu patterns where practical. |
| `src/main.ts` | minimal or no change | Only change if the chosen menu activation cannot remain inside `WorldApp`; prefer `WorldApp` ownership. |
| `package.json` | modify | Add `test:river` and `test:river-perf-contract` aliases. **Do not add lil-gui/dat.gui runtime dependencies.** |

## Deterministic QA

| File | Change | Responsibility |
| --- | --- | --- |
| `scripts/verify-hydrology.mjs` | modify | Numeric morphology/width/bend/cross-section/determinism invariants. |
| `scripts/verify-water-flow.mjs` | modify | Local-flow equations and river/lake separation. |
| `scripts/verify-water-render-contract.mjs` | modify | Depth ownership, sampler/varying/material invariants. |
| `scripts/verify-terrain-surface.mjs` | modify | Shore wet/mud/gravel semantic contract. |
| `scripts/verify-stones.mjs` | modify | Wake remains 3-sample and downstream. |
| `scripts/verify-river-performance-contract.mjs` | **new** | Static deterministic checks preventing accidental expensive architecture. |
| `src/qa/WorldVisualMatrixLocations.ts` | modify | Find pool/riffle/inside-bend/outside-bend river landmarks from semantic fields. |
| `src/qa/WorldVisualMatrixPoses.ts` | modify | Add repeatable river camera poses. |
| `src/qa/WorldVisualMatrixRunner.ts` | small modify | Include new poses; optionally allow fixed warmup/sample query values while retaining deterministic defaults. |

Optional later gameplay files:

- `src/world/hydrology/CharacterWaterRipples.ts`;
- `src/world/hydrology/CharacterWaterRippleMaterial.ts`.

Do not create these until R1-R12 has been visually and performance signed off.

---

# 3. YAML configuration: exact artist controls

Add these values under the current hydrology/water section of `public/config/world.yaml`.

```yaml
# River morphology. These change generated channel geometry and require a
# rebuild/reload when tuned.
riverWidthVariation: 0.08
riverBendBankAsymmetry: 0.05
riverDepthVariation: 0.18
riverBendChannelShift: 0.22
riverBankIncisionScale: 0.10

# River surface timing. These are visual multipliers and can update live.
waterRiverPoolFlowScale: 0.78
waterRiverRiffleFlowScale: 1.22
waterRiverPoolFrequencyScale: 0.88
waterRiverRiffleFrequencyScale: 1.16

# Foam cause weights. Total foam is still controlled by waterFoamStrength.
waterShoreFoamWeight: 0.18
waterRiffleFoamWeight: 0.42
waterStoneFoamWeight: 0.56
```

Keep existing controls and expose them in the tuning panel where useful:

```yaml
waterOpacity
waterRippleStrength
waterRippleScale
waterFlowSpeed
waterFoamStrength
waterFresnelStrength
waterDepthFade
waterDetailDistance
waterRoughness
waterFlowNoiseScale
waterFlowNoiseStrength
waterCausticStrength
waterGlintStrength
waterStoneWakeStrength
waterStoneWakeLength
waterBedStrength
waterBedScale
waterBedRefraction
waterAlgaeStrength
```

Do not add YAML controls for every coefficient in the equations. Parameters that describe implementation rather than art direction stay in `RiverTuning.ts` or `WaterMaterialTuning.ts`.

## Validation ranges

```text
riverWidthVariation              0.00 .. 0.12
riverBendBankAsymmetry           0.00 .. 0.08
riverDepthVariation              0.00 .. 0.25
riverBendChannelShift            0.00 .. 0.30
riverBankIncisionScale           0.00 .. 0.20
waterRiverPoolFlowScale          0.60 .. 1.00
waterRiverRiffleFlowScale        1.00 .. 1.40
waterRiverPoolFrequencyScale     0.75 .. 1.00
waterRiverRiffleFrequencyScale   1.00 .. 1.30
waterShoreFoamWeight             0.00 .. 0.40
waterRiffleFoamWeight            0.00 .. 0.80
waterStoneFoamWeight             0.00 .. 1.00
```

Also validate the combined width contract:

```text
maxWidthScale = 1.04 * (1 + riverWidthVariation) *
                (1 + riverBendBankAsymmetry)

minWidthScale = 0.94 * (1 - riverWidthVariation) *
                (1 - riverBendBankAsymmetry)

require maxWidthScale <= 1.18
require minWidthScale >= 0.82
```

Defaults satisfy the old envelope:

```text
max = 1.04 * 1.08 * 1.05 = 1.17936
min = 0.94 * 0.92 * 0.95 = 0.82156
```

---

# 4. River tuning menu: exact behavior

## UI architecture

Create `src/app/RiverArtMenu.ts` following `GrassArtMenu.ts`:

- native `<details>` root;
- native range/number inputs;
- no external UI dependency;
- accessible labels;
- `Export YAML` and clipboard copy;
- proper `dispose()`;
- only present when explicitly requested.

Activation:

```text
?riverTuning=1
```

Require `profile.showGui` as well. Normal production visits must create zero tuning UI objects.

## Menu sections

### A. Channel geometry — reload required

Expose:

```text
Width variation        riverWidthVariation
Bend bank asymmetry    riverBendBankAsymmetry
Depth variation        riverDepthVariation
Channel shift          riverBendChannelShift
Bank incision          riverBankIncisionScale
```

These values affect terrain/water geometry. Do **not** attempt to mutate already-built chunks in place.

When edited:

1. validate the individual value;
2. validate the combined width envelope;
3. mark the panel `Geometry changes pending`;
4. do not partially update existing chunks;
5. user presses `Apply geometry + reload`;
6. serialize only allowlisted river overrides to `sessionStorage`;
7. reload the page;
8. `WorldApp.create()` loads `world.yaml`, then `RiverDevelopmentConfig` applies the session override only when `?riverTuning=1`;
9. run normal `WorldConfigValidator` after merging;
10. create a fresh field/streamer from one coherent config.

Use a versioned session key:

```text
fluffygrass:river-tuning:v1
```

Use `sessionStorage`, not `localStorage`, so temporary art experiments cannot silently survive future browsing sessions.

Provide `Clear preview override + reload`.

## B. River motion — live

Expose:

```text
Base flow             waterFlowSpeed
Pool flow             waterRiverPoolFlowScale
Riffle flow           waterRiverRiffleFlowScale
Pool wavelength       waterRiverPoolFrequencyScale
Riffle wavelength     waterRiverRiffleFrequencyScale
Ripple strength       waterRippleStrength
Ripple scale          waterRippleScale
Flow breakup          waterFlowNoiseStrength
```

On `input`, call:

```text
WorldApp
 -> TerrainStreamer.setRiverVisualTuning(...)
 -> WaterMaterialController.setRiverVisualTuning(...)
 -> update existing uniforms only
```

No material recompilation for numeric uniform changes.

## C. Foam/wakes — live

Expose:

```text
Foam strength         waterFoamStrength
Shore foam            waterShoreFoamWeight
Riffle foam           waterRiffleFoamWeight
Stone foam            waterStoneFoamWeight
Wake strength         waterStoneWakeStrength
Wake length           waterStoneWakeLength
```

`waterStoneWakeLength` changes CPU interaction geometry for newly built chunks. Treat it as reload-required unless a focused interaction-buffer rebuild already exists. Do not invent such a rebuild solely for the menu.

## D. Bed — live where uniform-backed

Expose:

```text
Bed visibility        waterBedStrength
Bed scale             waterBedScale
Bed refraction        waterBedRefraction
Algae                  waterAlgaeStrength
Caustics               waterCausticStrength
```

`WaterBedMaterialController` updates uniform values in place.

## E. Optics — live

Expose:

```text
Opacity                waterOpacity
Depth absorption       waterDepthFade
Fresnel                waterFresnelStrength
Roughness              waterRoughness
Glint                   waterGlintStrength
```

`waterRoughness` updates `MeshPhysicalMaterial.roughness` and sets no shader define, so it should not force a program rebuild.

## F. QA shortcuts

Add buttons:

```text
Go: Pool
Go: Riffle
Go: Inside bend
Go: Outside bend
Go: Wet bank
Go: Stone wake
```

Do not hardcode coordinates in the menu. Use the same deterministic location resolver as `WorldVisualMatrixLocations.ts` so manual tuning and automated captures observe the same landmarks.

## YAML export workflow

`Export YAML` should output only the relevant keys, in the same order as `world.yaml`, for easy paste/review.

Example:

```yaml
riverWidthVariation: 0.08
riverBendBankAsymmetry: 0.05
riverDepthVariation: 0.18
riverBendChannelShift: 0.22
riverBankIncisionScale: 0.10
waterRiverPoolFlowScale: 0.78
waterRiverRiffleFlowScale: 1.22
waterRiverPoolFrequencyScale: 0.88
waterRiverRiffleFrequencyScale: 1.16
waterShoreFoamWeight: 0.18
waterRiffleFoamWeight: 0.42
waterStoneFoamWeight: 0.56
```

Accepted art values must ultimately be committed to `public/config/world.yaml`. The session override is never the production source of truth.

---

# 5. Structural constants

Create `src/world/hydrology/RiverTuning.ts`.

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
RIVER_GLOBAL_MIN_WIDTH_SCALE = 0.82
RIVER_GLOBAL_MAX_WIDTH_SCALE = 1.18
```

Only move constants touched by this work. Do not perform a general hydrology refactor.

---

# 6. R1 — richer river sample with no additional trig octave

Extend the reused `RiverLane` object:

```ts
signedDistance: number;
primarySin: number;
secondarySin: number;
```

In `sampleLane()`:

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

Do not calculate cosine for both candidates. Pick the nearest lane first.

Rename `halfWidth` to `baseHalfWidth` and reserve the existing width envelope for local morphology:

```ts
const baseWidthScale = lerp(
  RIVER_BASE_MIN_WIDTH_SCALE,
  RIVER_BASE_MAX_WIDTH_SCALE,
  hash(index, seed + 1361),
);

shape.baseHalfWidth = config.riverWidth * baseWidthScale * 0.5;
```

---

# 7. R2 — exact longitudinal morphology

After selecting the winning lane, calculate the same two cosines needed by flow:

```ts
const primaryCos = Math.cos(lane.primaryPhase);
const secondaryCos = Math.cos(lane.secondaryPhase);
```

Derive one continuous morphology signal:

```ts
const morphology = clamp(
  lane.primarySin * lane.secondarySin * RIVER_MORPH_PRIMARY_WEIGHT +
  primaryCos * secondaryCos * RIVER_MORPH_SECONDARY_WEIGHT,
  -1,
  1,
);
```

Interpretation:

```text
+1 = broad/deep/calm pool tendency
 0 = normal run
-1 = narrow/shallow/energetic riffle tendency
```

For QA classification only:

```text
pool candidate   morphology >= +0.35
run              -0.35 < morphology < +0.35
riffle candidate morphology <= -0.35
```

Never quantize geometry using those thresholds.

---

# 8. R3 — exact analytic bend curvature

Current centreline:

```text
z(x) = offset
     + A sin(p)
     + A * secondaryAmplitude * sin(q)
```

First derivative:

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

Tangent length:

```ts
const tangentLength = Math.sqrt(1 + firstDerivative * firstDerivative);
```

Signed curvature:

```ts
const curvature =
  secondDerivative /
  (tangentLength * tangentLength * tangentLength);
```

Normalize:

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

Interpretation:

```text
bend > 0 : inside bend is toward +z
bend < 0 : inside bend is toward -z
```

Do not multiply bend by `flowSign`.

Flow remains:

```ts
target.flowX = flowSign / tangentLength;
target.flowZ = flowSign * firstDerivative / tangentLength;
```

---

# 9. R4 — exact local width and side asymmetry

```ts
const side =
  lane.signedDistance > 0 ? 1 :
  lane.signedDistance < 0 ? -1 : 0;

const morphologyWidth =
  1 + config.riverWidthVariation * morphology;

const bendSide = bend * side;
// bendSide > 0 = inside bank.
const bendWidth =
  1 + config.riverBendBankAsymmetry * bendSide;

const localHalfWidth =
  lane.shape.baseHalfWidth * morphologyWidth * bendWidth;
```

Use this same `localHalfWidth` for:

- river coverage;
- bank mask;
- proximity mask;
- normalized lateral coordinate.

Do not let terrain ecology and visible water use different width equations.

---

# 10. R5 — exact asymmetric cross-section

```ts
const lateral = clamp(
  lane.signedDistance / Math.max(localHalfWidth, 1e-6),
  -1,
  1,
);
const absLateral = Math.abs(lateral);

const channelCenter =
  -bend * config.riverBendChannelShift;

const edgeMask =
  1 - smoothstep(absLateral, RIVER_DEPTH_EDGE_START, 1);

const shelf =
  RIVER_SHELF_DEPTH_SHARE *
  (1 - smoothstep(absLateral, RIVER_SHELF_START, 1));

const channelDistance = Math.abs(lateral - channelCenter);
const channel =
  RIVER_CHANNEL_DEPTH_SHARE *
  (1 - smoothstep(
    channelDistance,
    RIVER_CHANNEL_INNER,
    RIVER_CHANNEL_OUTER,
  ));

const section = clamp((shelf + channel) * edgeMask, 0, 1);

const depthScale =
  1 + config.riverDepthVariation * morphology;

const bedDepth =
  config.riverDepth * section * depthScale * altitudeMask;
```

Expected physical result:

```text
pool     = wider + deeper
riffle   = narrower + shallower
outside  = deep channel shifted toward cut bank
inside   = broader shallow depositional shelf
edge     = depth smoothly approaches zero
```

Extend reused `RiverSample`:

```ts
morphology: number;
bend: number;
lateral: number;
bedDepth: number;
incisionDepth: number;
```

Also expose CPU-only semantics from `HydrologySample`:

```ts
riverMorphology: number;
riverBend: number;
riverLateral: number;
```

These fields are for QA, ecology/debugging, and tuning-camera selection. Do not automatically pack them into water geometry.

---

# 11. R6 — terrain carving owns one real depth

Replace the old river-depth reconstruction in `HydrologyField.carveHeight()`.

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

For river surface level:

```ts
const riverWaterLevel =
  carvedHeight + river.incisionDepth + config.waterSurfaceOffset;
```

Then the existing geometry calculation:

```text
waterData.y = waterLevel - terrainHeight
```

becomes the real local channel depth.

Do not recompute river depth in `WaterChunkGeometry.ts`.

---

# 12. R7 — visual flow energy from data already on the GPU

Add controller uniforms:

```text
uWaterRiverReferenceDepth
uWaterRiverPoolFlowScale
uWaterRiverRiffleFlowScale
uWaterRiverPoolFrequencyScale
uWaterRiverRiffleFrequencyScale
uWaterShoreFoamWeight
uWaterRiffleFoamWeight
uWaterStoneFoamWeight
```

Reference depth:

```text
riverDepth + waterSurfaceOffset
```

In `WaterShader.ts`, after depth/coverage/normal are available:

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

float waterRiverFrequencyScale = mix(
  uWaterRiverPoolFrequencyScale,
  uWaterRiverRiffleFrequencyScale,
  waterEnergy01
);
```

Use local speed/frequency only in river motion:

- advected river noise;
- river phases A/B/C;
- flow sheen;
- riffle motion.

Do not speed up lake timing.

No new texture sample, varying, draw, or render target.

---

# 13. R8 — riffle and foam hierarchy

```glsl
float waterRiffleEnergy =
  waterRiverAmount *
  waterDetailWeight *
  waterShallowEnergy *
  smoothstep(0.52, 0.88, waterEnergy01);
```

Gate the existing riffle pattern with this signal.

Final foam combination:

```glsl
float waterFoamAmount = saturate(
  (
    waterShoreBand * uWaterShoreFoamWeight +
    waterRiverFoam * uWaterRiffleFoamWeight +
    waterStoneFoam * uWaterStoneFoamWeight
  ) * uWaterFoamStrength
);
```

Hierarchy:

```text
stone/obstacle foam > energetic riffle foam > generic shoreline foam
```

A calm freshwater bank must not become a continuous white outline.

---

# 14. R9 — riverbed composition with zero extra texture samples

Add only the reference-depth uniform to the bed controller.

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

Reinterpret the already sampled `pebble` channel:

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

Algae:

```glsl
algae *= clamp(
  1.0 + bedBank * 0.25 - bedRiffle * 0.30,
  0.55,
  1.25
);
```

Pool darkening:

```glsl
waterBedColor *= 1.0 - bedPool * 0.06;
```

Texture sample count remains exactly as before.

Do not add explicit bend/lateral GPU attributes in this pass. The geometry itself already makes inside shelves shallower and outside channels deeper.

---

# 15. R10 — shoreline composition using existing terrain samples

Reuse:

```text
terrainWaterProximity
terrainCoverage
terrainBaseNoise
terrainMesoNoise
terrainMicroNoise
```

No new shoreline texture.

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

Use the existing rich wet-soil colour for mud. Add one focused shore-gravel colour only if the existing terrain palette cannot express it.

Expected sequence:

```text
water
 -> submerged gravel/sediment
 -> irregular exposed mud/gravel
 -> short damp vegetation
 -> normal grass
```

---

# 16. R11 — stone wake refinement, still three samples

Keep:

```text
WAKE_SAMPLE_COUNT = 3
```

Change radius with downstream progress:

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

Result: narrow/strong near obstacle, wider/weaker downstream, same number of stone-field queries.

---

# 17. R12 — subtle water-colour reinforcement

Depth stays dominant.

```glsl
float waterPoolTint =
  waterRiverAmount *
  smoothstep(1.05, 1.30, waterRiverDepthRatio);

float waterRiffleTint =
  waterRiverAmount *
  waterShallowEnergy *
  waterEnergy01;

waterSurfaceColor *=
  1.0 - waterPoolTint * 0.035 +
  waterRiffleTint * 0.025;
```

Do not add another colour texture or palette unless visual testing proves the existing shallow/deep colours cannot express the result.

---

# 18. Optional R13 — character-water interaction

Only after R1-R12 passes visual/performance review.

Architecture:

```text
CharacterWaterRipples
  one shared geometry
  one small ShaderMaterial
  one InstancedMesh
  max 4 desktop
  max 2 compact
```

Spawn only on dry->wet transition or a real submerged footfall.

Suggested thresholds:

```text
minimum visible depth  0.08 m
minimum foot speed     0.35 m/s
full run strength      4.5 m/s
```

Ripple:

```ts
radius = 0.18 + age * 1.15;
width = 0.055 + age * 0.018;
opacity = strength * Math.exp(-age * 2.8);
center += flowDirection * age * 0.22 * config.waterFlowSpeed;
```

Expire at `age >= 1.6 s` or `opacity < 0.02`.

No ripple texture is required.

---

# 19. Deterministic automated testing

## Important distinction

River **logic** can and must be deterministic.

GPU/frame timing cannot be perfectly deterministic because the browser, OS scheduler, driver, thermal state, and GPU frequency vary. Performance testing is therefore controlled/repeatable, using repeated runs and medians.

## Fixed baseline config

All deterministic river tests use the committed world config unless a test explicitly constructs a boundary config.

Current canonical seed:

```text
seed = 42017
```

Never use `Math.random()` in tests or river generation.

## `verify-hydrology.mjs`

Sample a fixed grid covering several river lanes and fixed edge/boundary coordinates.

At minimum:

```text
x: -768 .. +768 in 8 m steps
z: -768 .. +768 in 8 m steps
```

Use fixed source heights covering lowland and altitude fade cases.

Assertions:

### Exact repeatability

Call the same sample twice and compare:

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

Use exact equality where the same function/path is repeated in one runtime. Use the existing float tolerance only when comparing values produced through different construction paths.

### Finite values

Every scalar above must be finite.

### Width envelope

```text
0.82 - 1e-9 <= localWidthScale <= 1.18 + 1e-9
```

### Flow normalization

For active river samples:

```text
abs(sqrt(flowX^2 + flowZ^2) - 1) <= 1e-6
```

### Straight-section symmetry

For `abs(bend) < 0.05`, mirrored lateral positions:

```text
abs(depth(+u) - depth(-u)) <= tolerance
```

Use `u = 0.45` and `u = 0.70`.

### Bend asymmetry

For `bend >= 0.45`:

```text
outside = negative lateral
inside  = positive lateral

depth(outside, |u|=0.45) > depth(inside, |u|=0.45)
```

Reverse sides for negative bend.

### Statistical pool/riffle relation

Across the fixed grid:

```text
mean width(morphology >= +0.35)
  > mean width(morphology <= -0.35)

mean center depth(morphology >= +0.35)
  > mean center depth(morphology <= -0.35)
```

### Continuity

Along each selected lane, sample `x` every 1 m across at least 512 m and assert no discontinuous width/depth step. Do not test for zero derivative; test bounded neighboring deltas derived from maximum configured variation.

### Chunk seam

For positions exactly on chunk boundaries and +/- `1e-6` around them, compare values from neighboring chunk-generation paths. River identity cannot depend on chunk index.

## `verify-river-performance-contract.mjs`

This is a static deterministic guard, not a stopwatch benchmark.

Assert source contracts such as:

```text
RiverField.ts has only the expected two centreline Math.sin calls
cosine remains selected-lane logic
WAKE_SAMPLE_COUNT === 3
WaterShader declares only uWaterFlowNoise as its water sampler
WaterBedMaterialShader declares only uWaterBedNoise as its bed sampler
waterData BufferAttribute itemSize === 4
waterInteraction BufferAttribute itemSize === 2
no riverMorphology/riverBend/riverLateral GPU attribute or varying exists
TerrainStreamer still owns one shared surface and one shared bed controller
```

If shader helper files own texture calls, inspect the complete water shader source set rather than only one file.

Add:

```json
"test:river-perf-contract": "node scripts/verify-river-performance-contract.mjs"
```

and include it in `npm run build` near the existing water verification scripts.

## `test:river`

Add a convenience script:

```json
"test:river": "npm run test:config && npm run test:hydrology && npm run test:water-flow && npm run test:water-render && npm run test:terrain-surface && npm run test:stones && npm run test:river-perf-contract"
```

---

# 20. Deterministic visual landmarks

Extend `HydrologySample` with the CPU-only river morphology/bend/lateral values and feed those to `WorldVisualMatrixLocations.ts`.

Add landmarks:

```text
riverPool
riverRiffle
riverInsideBend
riverOutsideBend
riverStraight
```

Suggested scoring rules:

## Pool

```text
riverCoverage >= 0.35
riverMorphology >= 0.45
waterDepth >= 0.7
```

Score higher morphology and depth.

## Riffle

```text
riverCoverage >= 0.35
riverMorphology <= -0.45
waterDepth between 0.08 and 1.0
```

Score lower morphology and shallower valid depth.

## Inside bend

```text
riverCoverage >= 0.20
abs(riverBend) >= 0.45
abs(riverLateral) between 0.40 and 0.80
sign(riverLateral) == sign(riverBend)
```

## Outside bend

Same, but:

```text
sign(riverLateral) != sign(riverBend)
```

## Straight

```text
riverCoverage >= 0.35
abs(riverBend) <= 0.08
abs(riverMorphology) <= 0.25
```

Use deterministic fallback ordering if a perfect candidate is not found.

Add camera poses in `WorldVisualMatrixPoses.ts` for top-down and grazing views of these points. Use the resolved flow vector to orient at least one upstream/downstream camera rather than arbitrary world axes.

The tuning menu's QA buttons must reuse these resolved landmarks.

---

# 21. Repeatable browser performance procedure

Use a production build, not Vite development mode.

```bash
npm run build
npm run preview
```

Use the same machine, browser version, viewport, device pixel ratio, power mode, and profile for before/after captures.

Recommended URLs:

```text
Desktop:
?qa=visual-matrix&profile=desktop&gpuTiming=1

Compact:
?qa=visual-matrix&profile=compact&gpuTiming=1
```

Do not add `stats=1` when GPU timing is being measured because the current diagnostics controller intentionally disables its GPU timer while the stats panel is enabled.

For a controlled comparison:

1. close unrelated GPU-heavy apps/tabs;
2. use the production bundle;
3. fix viewport to 1920x1080 desktop and one documented compact viewport, e.g. 412x915;
4. keep browser zoom at 100%;
5. keep DPR identical between compared runs;
6. visit the same visual-matrix pose;
7. warm up at least 4 seconds after the pose is stable;
8. sample at least 3 seconds for performance review, even if quick visual captures use a shorter default;
9. run the complete river pose set 5 times;
10. discard the first full run as shader/cache warm-up if it is an obvious outlier;
11. compare the median of the remaining runs;
12. record p95 where the metrics system exposes it;
13. record draw calls and triangles alongside timing.

Performance pass criteria are the budgets from section 1.

If timing regresses but draw calls/samplers do not, profile fragment coverage first: wider rivers may increase transparent pixels even when shader architecture is unchanged.

---

# 22. Manual tuning procedure

Use this order so one parameter does not hide another problem.

## Step 1 — channel shape only

Set visual effects close to neutral and tune:

```text
riverWidthVariation
riverBendBankAsymmetry
riverDepthVariation
riverBendChannelShift
riverBankIncisionScale
```

Inspect Pool, Riffle, Inside bend, Outside bend, Straight.

Do not tune foam yet.

## Step 2 — flow motion

Tune:

```text
waterRiverPoolFlowScale
waterRiverRiffleFlowScale
waterRiverPoolFrequencyScale
waterRiverRiffleFrequencyScale
waterRippleStrength
waterRippleScale
```

Acceptance:

- direction is obvious without foam;
- pool noticeably calmer than riffle;
- riffle motion is tighter but not noisy;
- no aliasing at distance.

## Step 3 — depth/optics

Tune:

```text
waterDepthFade
waterOpacity
waterFresnelStrength
waterRoughness
waterGlintStrength
```

Do not make deeper water believable by simply increasing opacity.

## Step 4 — bed

Tune:

```text
waterBedStrength
waterBedScale
waterBedRefraction
waterAlgaeStrength
waterCausticStrength
```

Riffle gravel should be readable; pool bed should be subtler.

## Step 5 — foam/wakes last

Tune:

```text
waterFoamStrength
waterShoreFoamWeight
waterRiffleFoamWeight
waterStoneFoamWeight
waterStoneWakeStrength
waterStoneWakeLength
```

If the river only reads as flowing after increasing foam, go back to motion/depth instead.

## Step 6 — export

Export YAML from the menu, paste approved values into `public/config/world.yaml`, clear session overrides, reload without overrides, then run all tests from the committed YAML.

---

# 23. Required verification commands

During implementation, run focused checks after every logical commit:

```bash
npm run test:config
npm run test:hydrology
npm run test:water-flow
npm run test:water-render
npm run test:terrain-surface
npm run test:stones
npm run test:river-perf-contract
```

After the phase is integrated:

```bash
npm run test:river
npm run build
```

Before manual GitHub Pages deployment:

```bash
npm run build
npm run deploy:pages
```

No GitHub Actions are used.

---

# 24. Commit sequence

## Commit 1 — config + morphology

Files:

- `public/config/world.yaml`
- `WorldConfig.ts`
- `WorldConfigSchema.ts`
- `WorldConfigValidator.ts`
- `RiverTuning.ts`
- `RiverField.ts`
- `verify-config-contracts.mjs`
- `verify-hydrology.mjs`

Implement R1-R4.

## Commit 2 — cross-section/depth

Files:

- `RiverField.ts`
- `HydrologyField.ts`
- `verify-hydrology.mjs`
- visual-location semantic fields if needed for testing

Implement R5-R6.

## Commit 3 — surface flow/foam

Files:

- `WaterMaterialController.ts`
- `WaterMaterialTuning.ts`
- `WaterShader.ts`
- `verify-water-flow.mjs`
- `verify-water-render-contract.mjs`

Implement R7-R8 and R12.

## Commit 4 — bed

Files:

- `WaterBedMaterialController.ts`
- `WaterBedMaterialShader.ts`
- `WaterBedShader.ts`
- `verify-water-render-contract.mjs`

Implement R9.

## Commit 5 — shore/wakes

Files:

- `TerrainMaterialShader.ts`
- `TerrainMaterialController.ts` only if required
- `WaterInteractionField.ts`
- `verify-terrain-surface.mjs`
- `verify-stones.mjs`

Implement R10-R11.

## Commit 6 — tuning/QA tooling

Files:

- `RiverArtMenu.ts`
- `RiverDevelopmentConfig.ts`
- `WorldApp.ts`
- `TerrainStreamer.ts`
- material-controller live setters
- `style.css`
- `WorldVisualMatrixLocations.ts`
- `WorldVisualMatrixPoses.ts`
- `WorldVisualMatrixRunner.ts`
- `verify-river-performance-contract.mjs`
- `package.json`

## Commit 7 — optional gameplay feel

Character ripples only after the structural pass is signed off.

---

# 25. What not to implement

Do not add in this pass:

- SSR;
- planar reflection cameras;
- scene-colour refraction pass;
- fluid simulation grid;
- compute water simulation;
- Gerstner geometry waves for rivers;
- tessellated water;
- foam particles along banks;
- shoreline decals;
- shoreline distance textures;
- pool/riffle textures;
- extra sand/gravel bed textures;
- extra river normal maps;
- a third river sine octave;
- explicit morphology/bend GPU attributes before depth-driven rendering is visually tested;
- lil-gui/dat.gui simply for river tuning when the project already has a native tuning-menu pattern.

---

# 26. Definition of done

The pass is complete when:

- [ ] width varies smoothly and always stays inside the 0.82-1.18 safety envelope;
- [ ] pools/runs/riffles come from one continuous deterministic morphology signal;
- [ ] strong bends have broader inside shelves and deeper outside channels;
- [ ] carving uses explicit cross-section depth rather than arbitrary coverage weighting;
- [ ] water depth reaching the shader is the actual generated channel depth;
- [ ] pool flow is calmer/longer and riffle flow faster/tighter without new simulation;
- [ ] quiet banks are nearly foam-free;
- [ ] riffles read from depth + bed + motion before foam;
- [ ] bed composition responds to depth/energy with unchanged texture samples;
- [ ] shore mud/gravel breakup uses existing terrain samples;
- [ ] stone wake quality improves without exceeding 3 stone samples;
- [ ] no bed/pebble/caustic overlays the character;
- [ ] no extra mandatory water draw call, texture, render pass, or GPU attribute was introduced in R1-R12;
- [ ] desktop and compact/mobile share identical macro hydrology;
- [ ] deterministic river tests pass from committed YAML;
- [ ] static performance-contract test passes;
- [ ] repeated production-build browser measurements remain within the performance budgets;
- [ ] tuning menu can export the exact approved YAML subset;
- [ ] clearing tuning overrides reproduces the committed `world.yaml` result;
- [ ] `npm run build` passes;
- [ ] manual visual matrix is reviewed.

The highest-value stopping point is R1-R12. Character ripples and audio are secondary to getting the river structure, depth, motion, bed, and banks coherent first.
