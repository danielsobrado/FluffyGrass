# Phase 7 — World Placement and Integration

## Status

- Parent plan: `procedural-stones-plan.md`
- Revised after implementation. Findings: `procedural-stones-review.md`
  (Findings 5 and 6)
- Maps to revised **Stage 3**
- State: **implemented** in `StoneField.ts`, `StoneClearance.ts`,
  `WorldStoneSystem.ts`

## What changed in this revision

**The private biome system is gone.** The original defined seven biome IDs
with its own classifier over height, normal, moisture, drainage and coast
proximity. This world already has a biome field —
`src/world/grass/WorldBiomeField.ts`, a rank-transformed two-octave noise field
sliced by `worldShare`, with three profiles in `GrassBiomeProfiles.json`
(meadow, dry-steppe, alpine). Grass species, density, accent flora, height
bands and wind damping all key off it. Two disagreeing biome maps would make
stones change family at boundaries the grass does not acknowledge.

**Grass clearance was added.** Across all 22,521 lines of the original
specifications there was no requirement that grass stop growing through stones.
At 72 blades per square metre that is the first thing a player sees.

**Deferred: collision descriptors, exclusion-zone providers, the drainage
field, and origin rebasing.** None has a consumer yet. Origin rebasing in
particular is speculative — this world is 2,048 m across and has no floating-
origin system to be compatible with.

**Kept verbatim:** 16-metre placement cells, deterministic placement from world
seed and cell coordinates, rejection rather than forcing, partial terrain
alignment by family, and placement data (yaw, scale, embed) staying out of the
asset recipe.

## Objective

Place stones in believable groups — no repetition, no floating, no clipping, no
biome mismatch — as a pure function of world position.

## The purity requirement

Placement must be a **pure world-space field**: any system can ask "what stands
near (x, z)?" and get the answer the streamer used, without the two systems
being coupled. This is not architectural taste. It is what makes grass
clearance possible, and it mirrors how `TerrainField` already exposes path
distances to the grass.

Cells are cached, but the cache is transparent — dropping it changes nothing.

## Placement inputs

Evaluated per 16 m cell, then per candidate:

**Rockiness** — one independent low-frequency two-octave field that gathers
stones into rocky hillsides and leaves clean meadows between. This is the only
new field, and it exists because it is the one thing the grass biome field
does not express.

**Biome** — `sampleGrassBiome` / `pickGrassBiomeIndex`, the same functions the
grass calls. Drives archetype weights, palette, and a density multiplier
(meadow 1.0, dry-steppe 1.4, alpine 1.7).

**Altitude** — a low fade near `grassMinAltitude` and a boost approaching
`grassMaxAltitude`, plus a blend towards the granite palette that echoes the
terrain shader's own rock colouring.

**Slope** — from the terrain normal. Below `normal.y` 0.62 the candidate is
rejected outright. Between 0.62 and 0.86 the slope family applies (outcrops,
blocks, shards); above it the level family (pebbles, boulders, slabs).

**Walking ways** — `samplePathDistances`, with the same clearance the grass
uses plus the stone's own footprint. Anything that would block the tread is
rejected.

## Composition rules

**Verges.** A candidate just beyond the path clearance (margin under 3 m) can
seed one extra small stone, so ways read as lined by kicked-aside rock rather
than sterile. A pebble may also survive *on* the verge itself at low
probability. Nothing larger ever does.

**Clusters.** A large grounded mass (boulder, outcrop, slab, block above scale
0.9) seeds one to three satellites at a footprint-relative distance, sharing
its palette. A satellite whose terrain height differs from its parent by more
than the parent's scale is skipped — that is a terrain break, and a stone
across it would float or bury itself.

**Overlap.** Non-satellite candidates reject against already-placed stones in
the same cell using combined clear radii. Satellites skip the check because
they are placed around their parent deliberately.

**Rare landmarks.** A boulder in a rocky region has a small chance of scaling
up 1.7–2.4×, anchoring a field.

## Terrain fitting

Stones lean into the slope by a per-family fraction of the terrain normal:

| Family | Alignment | Rationale |
| --- | ---: | --- |
| `pebble` | 0.85 | Rides the ground |
| `slab`, `outcrop` | 0.65 | Beds into the surface |
| `boulder`, `block` | 0.45 | Partly settled |
| `shard` | 0.22 | Preserves intentional vertical character |

Sink combines the recipe's embed fraction with a slope term. Geometry is never
modified — this is all instance transform.

## Grass clearance

The integration the original omitted.

```ts
sampleStoneGrassClearance(x, z, extraRadius = 0): number
```

Deliberately shaped like `TerrainField.samplePathGrassMask`: 1 well clear of
every stone, 0 under one, with a configurable feather. Registered through a
module-level hook (`StoneClearance.ts`) following the `grassTrailField`
precedent, so scenes without stones — the island regression, isolated probes —
simply never register a field and the sampler is a constant 1.

Wired into all three grass placement paths:

| Path | Behaviour |
| --- | --- |
| Near single-blade tiles | Per-blade, full precision |
| Mid patches (`WorldGrassSystem`) | Centre only — clearing by the patch's whole reach would ring every boulder with a bare halo at mid distance |
| Detail foliage accents | Plus 0.3 m, since accent cards are wider than blades |

Stones below the clear-scale cutoff have `clearRadius` 0 and nestle into grass
instead of clearing it, which is what small stones should do.

## Rendering

One **merged** vertex-coloured mesh per terrain chunk.

Merging rather than instancing is deliberate: a chunk holds a dozen or two
*different* low-poly variants, so per-variant `InstancedMesh` would multiply
draw calls for no batching win. One baked mesh costs a single draw, culls with
the chunk's bounds, and lets every instance carry its own palette in vertex
colours for free.

Rebuilds happen only on stream-in or detail-band crossing, so the merge cost is
a streaming cost, not a frame cost. Measured: ~90 ms peak per chunk build,
inside the existing streaming budget at one chunk per frame.

Variant meshes are generated lazily and cached forever — six per archetype,
36 total.

## Validation

In the build gate:

- placement is identical across two independent `StoneField` instances;
- no chunk exceeds a sane instance count;
- all instance values finite, scale in range, never on a rejected slope;
- no grass-clearing stone stands on a walking way;
- clearance under a stone ≤ 0.05, and exactly 1 well away from any stone;
- `stonesEnabled: 0` yields zero instances and clearance 1 everywhere.

## Open tuning items

Clusters are configured but do not yet read as clusters on screen — satellite
count and distance need work against a picture. The size hierarchy is flat;
the population needs more genuinely large hero masses and fewer mid stones.
Both are Stage 4.
