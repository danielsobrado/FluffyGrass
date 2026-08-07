# Phase 6 — Level of Detail

## Status

- Parent plan: `procedural-stones-plan.md`
- Findings: `procedural-stones-review.md` (Finding 4)
- **Deferred.** One distance cut ships instead. Revisit only when a
  measurement asks for more.
- State: the distance cut is implemented; the LOD system is not, by decision

## What changed in this revision

The original specified four mesh LODs per stone, a bespoke semantic-aware
convex plane reducer (explicitly not QEM, not meshoptimizer, not vertex
clustering), source-region-key material copying so lower levels reuse LOD0's
per-region variation, complementary 4×4 Bayer dithered transitions with
per-instance coverage and phase attributes, per-instance shadow eligibility
enforced through custom instanced depth and distance materials, and
pixel-projected LOD selection.

That machinery is right for this repository's grass, which draws millions of
blades. It is not earned by stones.

## The measurements

- A stone is **200–400 triangles** (measured: ≤394 across 120 stones).
- A full streamed neighbourhood of ~1,000 stones is **~275k triangles**.
- The whole stone system is one draw call per chunk, ~140 chunks at desktop
  radius, sharing one material.

Halving the triangles of something that is already a small fraction of the
frame, at the cost of a bespoke simplifier plus dithered transition plumbing,
is a poor trade. The original conceded a version of this itself: it deferred
impostors specifically because it had no measurements yet. The same reasoning
applies one level up.

## What ships instead

**One distance cut.** Beyond `stoneDetailRadius` chunks from the camera, the
small nestling stones (placement scale below the clear-radius cutoff) are
omitted from the merged chunk entirely.

```yaml
stoneDetailRadius: 3      # chunks; beyond this, small stones are dropped
```

It is one boolean threaded into `collectChunkInstances`. Chunks rebuild when
they cross the band, which is the same event that already rebuilds them on
stream-in. No transition blending is needed because the stones being dropped
are sub-pixel at that distance — which is exactly why they are droppable.

## Why no dithered transition

Dithering exists to hide a silhouette change. Dropping a sub-pixel stone has no
silhouette to change. If a future detail cut removes something visible, it
needs a transition; this one does not.

## When to revisit

Add real LODs when a profile shows stone triangles are a measurable cost on a
target device — not before, and not from a specification written in advance of
that measurement. If it happens, the likely first step is far simpler than the
original's plan: regenerate the same recipe with fewer side planes and no cuts.
The recipe is deterministic, so the low-detail body is derived from the same
parameters and will not read as a different rock.

Impostors are further out still, and would only make sense for dense small-stone
fields, which the distance cut already removes.
