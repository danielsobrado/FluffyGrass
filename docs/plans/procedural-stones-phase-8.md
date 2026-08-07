# Phase 8 — Runtime Performance, Caching and Instancing

## Status

- Parent plan: `procedural-stones-plan.md`
- Findings: `procedural-stones-review.md` (Finding 3)
- **Cut.** The problem it solved was created by the original Phase 4.
- State: not implemented, and not planned

## Why this phase was cut

The original was 2,301 lines specifying a pre-baked library of exactly
`12 × 8 × 8 = 768` stone asset sets, deterministic manifest JSON plus a
little-endian binary pack, HTTP byte-range loading with a full-file fallback,
two web workers for exact dynamic generation, reference-counted asset caches
with deterministic LRU eviction, and per-decoded-asset `InstancedMesh` batches
with packed slots, swap-remove deletion, CPU frustum culling, per-instance LOD
coverage and dither-phase attributes, and custom instanced depth materials for
shadow eligibility.

Almost all of it exists to recover batching that the original Phase 4 gave
away. Phase 4 mandated `MeshToonMaterial` with a gradient texture **owned per
material instance** and per-stone detail uniforms — which means one material
per stone, therefore one draw call per stone. At that point a world full of
stones genuinely does need an asset library, a cache, and an instanced batch
manager to claw performance back.

Fix the cause and the entire phase evaporates.

## What replaces it

Baked per-vertex colour (revised Phase 4) plus per-chunk merging (revised
Phase 7):

| Original mechanism | Replacement |
| --- | --- |
| 768-entry pre-baked library | 36 lazily generated variants (6 per archetype), cached in a `Map` |
| Binary pack + manifest + byte ranges | Nothing. Generation is cheap. |
| Two web workers | Nothing. Generation happens inline during chunk build. |
| Reference-counted LRU asset cache | Chunk geometries disposed on unload |
| Per-asset `InstancedMesh` batches | One merged mesh per chunk |
| Per-instance dither and coverage attributes | Nothing. No LOD transitions to blend. |
| Custom instanced depth materials | Nothing. One standard material. |

## The measurements that justify cutting it

- **Generation cost:** ~90 ms peak to merge an entire chunk, once, when it
  streams in. Inside the existing streaming budget at one chunk per frame.
- **Variant count:** 36 unique meshes for the whole world, generated on first
  use and never regenerated. A pre-baked library of 768 is 20× more assets than
  the system uses.
- **Draw calls:** one per chunk, ~140 at desktop streaming radius, all sharing
  one `MeshLambertMaterial`. Instancing cannot improve on this — a chunk holds
  many *different* variants, so per-variant instancing would raise draw calls,
  not lower them.
- **Triangles:** ~275k for a full streamed neighbourhood.

## What was worth keeping

Three ideas from the original survive in simpler form:

- **Deterministic variant identity.** Variants are keyed by archetype and
  index, derived from the world seed. Same key, same mesh, always.
- **A bounded variant set.** `stoneVariantsPerArchetype` caps unique geometry
  so the world cannot accumulate unbounded meshes. Currently 6.
- **Disposal on unload.** Chunk geometries are disposed when the chunk leaves
  the streaming radius.

## When to revisit

If stones ever become a measured bottleneck, the order to try things is:

1. Lower `stoneDensity` or `stoneDetailRadius` — configuration, no code.
2. Reduce `stoneVariantsPerArchetype` if variant memory matters.
3. Only then consider real LODs (revised Phase 6).

Do not reintroduce a baked asset pipeline without a measurement showing that
generation cost — not draw calls, not triangles — is the actual problem. It
currently is not.
