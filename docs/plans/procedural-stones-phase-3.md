# Phase 3 — Semantic Regions and Surface Detail

## Status

- Parent plan: `procedural-stones-plan.md`
- Findings: `procedural-stones-review.md` (Findings 3 and 8)
- **Cut.** Replaced by baked per-vertex shading data, defined in Phase 4.
- State: not implemented, and not planned

## Why this phase was cut

The original Phase 3 was 2,650 lines specifying a semantic region model
(top / side / underside / cut / recessed / ridge / contact classification bound
to stable plane IDs), plus grooves, weathering bands, hairline cracks and
shallow recesses as *analytic descriptors* evaluated in the fragment shader
from fixed-size uniform arrays, plus namespaced geometry attributes, plus
separate semantic and detail fingerprints.

Three reasons it does not survive.

**It buys a look the references do not ask for.** The boards' surface content
is a few broad value regions and pale worn edges. There are no hairline cracks
to speak of, and the grooves that exist are silhouette features — they belong
to the shape, which is what Phase 1's cut planes already produce.

**Its delivery mechanism blocks batching.** Per-stone uniform arrays mean one
material per stone, which means one draw call per stone. That is the same root
cause that forced the original Phase 8 to exist. Cutting this phase and
Phase 4's toon material together removes both.

**Semantic classification was solving an addressing problem that no longer
exists.** Its purpose was to tell the shader which face is which. When shading
values are baked per vertex at generation time, the generator already knows the
face role — it just writes the right number. No IDs, no region keys, no
attribute splitting, no fingerprints.

## What replaces it

`StoneGeometry.ts` bakes two scalars per vertex during generation:

- **`tone`** — position on the palette ramp, from the face's plane role
  (`top` 0.92, `top-bevel` 0.76, `cut` 0.60, `side` 0.50, `contact-bevel` 0.34,
  `bottom` 0.08), plus a per-face hash jitter for facet patchwork, plus a
  height gradient and a mild upward-facing bias.
- **`wear`** — edge-highlight strength, from the dihedral angle at each shared
  edge, modulated by a per-position hash so the highlight swells and fades
  along an edge the way a painted one does, and biased towards the crown so
  contact edges stay matte.

Both are resolved to linear vertex colours at chunk merge (Phase 4). Cost at
runtime: zero. Cost per vertex: two floats.

## The one thing worth keeping from the original

Face **plane roles** — `top`, `side`, `cut`, `contact-bevel`, `top-bevel`,
`bottom` — survive as the input to `tone`. They come free from Phase 1's plane
construction and need no separate classification pass, adjacency analysis, or
eligibility scoring.

## If close inspection later asks for cracks

Revisit as a **texture-free vertex effect**, not as shader uniforms: darken
`tone` along a small number of chosen edges at generation time. That keeps the
single-material, single-draw property. Do not reintroduce per-stone uniform
arrays.

Nothing currently asks for this. Judge it from a close-up contact sheet, not
from a specification.
