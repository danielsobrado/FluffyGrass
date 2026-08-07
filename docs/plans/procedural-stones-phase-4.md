# Phase 4 — Stylized Colour

## Status

- Parent plan: `procedural-stones-plan.md`
- Revised after implementation. Findings: `procedural-stones-review.md`
  (Finding 3 — this is the most consequential change in the review)
- Maps to revised **Stage 2**
- State: **implemented** in `src/world/stones/StonePalette.ts` and
  `StoneGeometry.ts`

## What changed in this revision

The original specified `MeshToonMaterial` extended through `onBeforeCompile`,
with a five-pixel nearest-filtered gradient texture **owned per material
instance**, and Phase 3's detail fields evaluated analytically in the fragment
shader from fixed-size uniform arrays.

That is replaced by **baked per-vertex colour**. Two reasons.

**It was a different visual language from the ground.** This repository's
terrain and every grass layer are `MeshLambertMaterial` with vertex colours.
Stones on a toon ramp would sit in a scene that is not on one, and read as
imported assets.

**It was architecturally opposed to batching.** Per-material gradient textures
and per-stone detail uniforms mean one material per stone, therefore one draw
call per stone. The original Phase 8 — 768 pre-baked asset sets, a binary pack
format, HTTP byte-range loading, two web workers, reference-counted caches and
instanced batch management — existed almost entirely to recover from that. Both
phases collapse together.

## Objective

The illustrated look — broad value regions, lighter tops, darker cut faces,
pale worn edges — with no textures, no shader code, and no per-stone material.

## Mechanism

### Baked at generation time

`StoneGeometry` writes two scalars per vertex (defined in Phase 3):

- `tone` — palette-ramp position in `[0, 1]`
- `wear` — edge-highlight strength in `[0, 1]`

Geometry carries *shading data*, never final colours. One geometry therefore
serves every biome tint, and recolouring never regenerates topology.

### The band geometry that makes the edge highlight work

Every rim vertex of a convex polyhedron lies on a silhouette edge, so painting
wear at the rim needs interior vertices to interpolate against. Faces above a
minimum area are emitted as **rim → inset ring → centroid**, with the inset
ring at `min(0.16, 0.04 + sqrt(area) · 0.16)` metres.

That pins the highlight into a narrow band along the facet border — the
hand-painted edge line the boards show — instead of a glow smeared to the face
centre. Undersides never band; nothing down there is ever lit.

This is why stone triangle counts are ~3× a naive fan. It is the single
largest contributor to the look and worth every triangle.

### Resolved at chunk merge

`colorizeStoneVertices` maps `(tone, wear)` through a palette into linear
vertex colours, writing directly into the merged chunk attribute at an offset.

The ramp is three-stop (shadow → mid → light) with a gentle quantize toward
thirds at 45% strength: enough banding to read as painted values, not enough to
posterize under real lighting. Wear then blends towards the palette's edge
colour.

Colours are stored **linear**, matching how `TerrainChunk` writes its own
vertex colours. Getting this wrong is invisible in a preview with the wrong
exposure, which is why the gallery harness must replicate `WorldApp.addLights`
and `ACESFilmicToneMapping` exactly.

## Palettes

Four families. Values sit deliberately close to the terrain shader's own rock
colours (`#696b64`, `#85857f`) so stones read as outcrops of the same world.

| Palette | Use | Shadow → mid → light → edge |
| --- | --- | --- |
| `meadowSage` | Meadow lowland | `#5d6353` `#8b9179` `#b4b99e` `#e3e8cc` |
| `steppeTan` | Dry steppe | `#6b5f48` `#98896b` `#c1b191` `#ecdfc0` |
| `graniteGrey` | Alpine and altitude | `#54564f` `#7d7f77` `#a6a79e` `#d8d9cf` |
| `mossy` | Occasional lowland accent | `#525e48` `#788768` `#a3b287` `#d2e0ae` |

Each carries an `edgeStrength` multiplier so some sets stay matte.

Palette **choice** is a placement decision (biome, altitude), not a geometry
decision — see Phase 7. Instances additionally carry a per-instance value
scale and an altitude blend towards granite that echoes the terrain shader's
own rock colouring.

## Consequences

- One `MeshLambertMaterial` for every stone in the world.
- One draw call per chunk, not per stone.
- Zero textures, zero uniform arrays, zero custom shader code.
- Palettes vary per instance for free, because colour is per vertex.
- Fog, shadows, tone mapping and output colour management all work because
  nothing about the standard material was replaced.
- The original Phase 8 becomes unnecessary.

## Validation

The build gate asserts `tone` and `wear` are within `[0, 1]` for every vertex.

Everything else here is judged visually: a contact sheet against the reference
boards, and an in-world capture against the terrain. Known open item — palette
value separation is a little tight under bright sun; shadow values may need to
go darker. That is Stage 4 work.
