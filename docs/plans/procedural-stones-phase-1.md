# Phase 1 — Deterministic Core Geometry

## Status

- Parent plan: `procedural-stones-plan.md`
- Revised after implementation. Findings: `procedural-stones-review.md`
- Maps to revised **Stage 1** (with Phase 2)
- State: **implemented** in `src/world/stones/`, gated by `npm run test:stones`

## What changed in this revision

The original Phase 1 was a 1,874-line frozen contract written before any stone
had been rendered. Two of its instructions were wrong in ways only a render or
a watertightness assert could expose:

1. **The clipping algorithm leaked.** Incremental clip-and-cap with a `1e-5`
   merge epsilon produces non-watertight bodies. Replaced — see below.
2. **Look validation was deferred to the end.** The first render caught an
   inverted-winding bug that passed every structural rule the phase listed.
   Stage 0 (the gallery harness) is now prerequisite work.

Kept from the original: the half-space approach itself, the deterministic
random design, the recipe-before-geometry rule, and the golden random vectors,
which were verified genuine by reimplementing the specified algorithm from
scratch.

## Objective

A deterministic low-poly convex stone generator producing clean, grounded
geometry with broad readable faces. The output must already look intentionally
shaped under a plain material — not like a noise-displaced sphere.

## Coordinate and topology conventions

- X width, Y up, Z depth. Right-handed.
- Ground plane at `y = 0`; construction height normalized to `0 … 1`.
- Local origin at the ground-contact centroid projected onto XZ.
- Polygons wound counter-clockwise seen from outside.
- The final mesh is closed, convex, connected and consistently outward-wound.
- Final dimensions in metres.

## Deterministic random

`StoneRandom` — mulberry32, with streams forked **by label** rather than by
consumption order:

```ts
StoneRandom.fromSeed(seed).fork("profile")
```

A child stream's seed depends only on the root seed and the label, so adding a
random draw in one domain can never shift the values another domain resolves.
That is what keeps a stone's silhouette stable when unrelated recipe fields
gain parameters.

Constants: domain `0x53544f4e`, FNV-1a offset `0x811c9dc5` / prime
`0x01000193`, mulberry increment `0x6d2b79f5`.

### Golden vectors (verified)

These reproduce exactly and are safe to keep as a determinism regression check:

| Seed | First five `nextUint32()` |
| --- | --- |
| `0` | `6b4e98b6 d321bab1 e920a785 cfca6851 a81c461e` |
| `1` | `1755fa8b 9867cd8d c05d7eb0 283b2c09 8daefff9` |
| `0xdeadbeef` | `d407663f e0348cfb 61ae8c36 fb8b947e e4ec471f` |

| Label | FNV-1a |
| --- | --- |
| `dimensions` | `c6f8c0b0` |
| `profile` | `4674caee` |
| `cuts` | `79a9ec10` |

## Recipe

A recipe is plain serializable data, fully resolved before any geometry is
built. Fields: archetype, seed, metre dimensions, side angles and radii, taper,
crown scale and bevel height, top tilt, contact inset and bevel height, lean,
cuts, edge-wear strength, embed depth.

Resolution rules that matter:

- **Side angles** — regular spacing plus bounded jitter, then sorted. Jitter up
  to 45% of the regular spacing; the original's 30% left the ring visibly
  regular and stones read as turned rather than broken.
- **Side radii** — per-side jitter, then **one cyclic smoothing pass**
  (`0.25·prev + 0.5·self + 0.25·next`). Without it, independent jitter reads as
  crumpled rather than carved.
- **Lean** — random azimuth, magnitude from the archetype band.
- **Cuts** — elevation from the archetype band, random azimuth. Two cuts whose
  normals have dot product above `0.96` are rotated apart by the golden angle
  up to three times, then dropped. Do not raise the requested count to replace
  a dropped cut.

## Plane construction

Planes use `dot(normal, point) <= constant`, normals unit length.

| Role | Plane |
| --- | --- |
| `bottom` | `(0, -1, 0)`, constant `0` — keeps `y >= 0` |
| `top` | `(tiltX, 1, tiltZ)`, constant `1` |
| `side` | `(cos a, taper, sin a)`, constant `radius` |
| `contact-bevel` | `(cos a, -inset/bevelHeight, sin a)`, constant `radius - inset` |
| `top-bevel` | `(cos a, slope, sin a)` from crown scale and bevel height |
| `cut` | recipe normal, constant measured against the current body |

Side planes carry the taper in the Y component, so the profile narrows with
height. Contact bevels inset the footprint at `y = 0` and hand back to the side
plane at the bevel height.

### Cut constants

Cuts resolve sequentially against the body built so far, so depth is a fraction
of the real projected span:

```
span      = maxProjection - minProjection
candidate = maxProjection - depthFraction * span
guarded   = max(candidate, maxGroundProjection + groundClearance)
```

The guard stops a cut undermining the base the stone stands on. If the
resulting effective depth falls below the minimum, skip the cut silently.

## Body construction — the corrected algorithm

**Do not use incremental clip-and-cap.** The original specification clipped
each existing polygon with Sutherland–Hodgman, collected edge intersections,
and assembled one cap per plane. Because each polygon is cleaned independently
— adjacent-duplicate removal, collinear removal, per-polygon epsilon — the two
faces meeting at an edge can resolve that edge's endpoints differently, and the
seam fails to close.

Measured over 120 stones across six archetypes, asserting that every undirected
edge borders exactly two faces:

| Corner-merge radius | Result |
| --- | --- |
| `1e-5` (the original spec) | leaks: `outcrop:10` has an edge bordering one face |
| `1.5e-3` | watertight across all 120 |

### Use face-per-plane construction instead

For each plane:

1. Lay a large quad on the plane, wound counter-clockwise about the outward
   normal. Verify the winding with Newell's method and reverse if it disagrees
   — cheap, and it makes the construction immune to basis mistakes. *(An
   inverted basis here is exactly the bug that passed every structural check in
   the first prototype render.)*
2. Clip that quad by every **other** half-space (Sutherland–Hodgman).
3. Clean adjacent duplicates and collinear points.
4. Keep the result if it has ≥3 points and area above the minimum.

A plane made redundant by tighter neighbours simply yields nothing. A convex
body assembled this way is watertight by construction: there is no incremental
cap bookkeeping to get wrong.

### Then weld corners across faces

Faces are computed independently, so one geometric corner — where three or more
planes meet — arrives once per adjacent face with float drift that grows on
near-parallel plane pairs. Snap those onto one shared representative within
`1.5e-3`. This step is not optional; without it the body still leaks.

## Final transform and grounding

After clipping, in normalized space:

```
x' = width * (x + leanX * y)
y' = height * y
z' = depth * (z + leanZ * y)
```

Lean multiplies by `y`, so the contact plane is preserved exactly. Snap
vertices within tolerance to `y = 0`, then subtract the contact centroid in XZ
so placement rotation pivots where the stone actually stands. Do not recentre
vertically.

## Mesh output

Flat-shaded: every face owns its vertices and its own normal. Faces are emitted
as fans; larger faces additionally carry an inset ring and centroid, defined in
Phase 4 where the shading data lives.

Per-vertex attributes: `position`, `normal`, and the baked `tone` and `wear`
scalars. No UVs.

## Validation

Enforced by `StoneVerification.ts` in the build gate:

- every undirected edge borders exactly two faces (watertightness);
- ≥5 faces per body;
- all positions finite;
- minimum Y within tolerance of zero;
- contact radius above a floor;
- vertex and triangle budgets;
- same seed reproduces an identical fingerprint;
- ≥95% of the population unique.

Measured: 120 meshes, 120 unique, ≤296 vertices, ≤394 triangles, zero
rejections.

## Out of scope

Materials, palettes, semantic regions, LODs, caching, placement, collision.

Shape configuration lives as typed constants in `StoneRecipe.ts`, not a
separate YAML domain. These are tuning values settled against pictures; a
strict config schema around them buys nothing and slows iteration.
