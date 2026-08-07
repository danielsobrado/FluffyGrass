# Phase 5 — Quality Control

## Status

- Parent plan: `procedural-stones-plan.md`
- Findings: `procedural-stones-review.md` (Finding 8)
- **Heavily reduced.** The checks that catch real failures are folded into the
  build gate; the rest is cut.
- State: **implemented** in `src/world/stones/StoneVerification.ts`

## What changed in this revision

The original was 2,092 lines specifying uniform-density mass properties,
centre-of-mass projection against the support polygon with per-archetype safety
margins, archetype-specific thinness ratios, overhang detection through
horizontal sections, silhouette complexity from nine orthographic projections,
support-function symmetry comparison, underside concavity measurement, material
readability scoring in linear space, and a five-candidate fallback ladder
(requested seed → two rerolls → two canonical fallback seeds → terminal throw).

Measured rejection rate of the implemented generator across 120 stones spanning
all six archetypes: **zero**. Not one candidate failed any structural check.

Most of that machinery guards against states the construction cannot reach.

## What was cut, and why

**Centre-of-mass stability analysis.** Every stone is convex with a flattened
base snapped to `y = 0`. For the centre of mass to project outside the support
polygon needs lean far beyond what the archetype bands permit. The failure mode
is unreachable; a contact-radius floor covers the real case.

**Underside concavity measurement.** The bottom is a single planar polygon by
construction — the `bottom` half-space is applied to every body. It cannot be
concave.

**Symmetry detection.** Accidental symmetry was a risk for the original's
unjittered ring. With per-side angle jitter at 45% of spacing plus radius
smoothing, 120 of 120 stones fingerprint uniquely. Nothing to detect.

**Silhouette complexity scoring from nine projections.** This was numeric
proxying for "does it look right," which a contact sheet answers directly and
better. See review Finding 1: the structural checks passed a mesh that was
rendering its own interior.

**The five-candidate fallback ladder with canonical fallback seeds in YAML.**
Bounded retry is right in principle. A five-stage ceremony with configured
fallback seeds, for a generator with a zero measured rejection rate, is
machinery guarding an empty road.

**Material readability scoring.** Palette contrast is judged by looking at the
stones against the terrain, which is the only test that captures what it is
actually for.

## What survives, in the build gate

Cheap, deterministic, and each one catches a failure that actually occurred
during implementation:

| Check | Caught |
| --- | --- |
| Every undirected edge borders exactly two faces | The clip-and-cap leak (Phase 1) |
| ≥5 faces per body | Over-clipping from bad archetype bands |
| All positions finite | Degenerate plane normalization |
| Minimum Y within tolerance of zero | Grounding regressions |
| Contact radius above a floor | Stones that would balance on a point |
| `tone` and `wear` within `[0, 1]` | Shading data overflow |
| Vertex and triangle budgets | Band-geometry blowup |
| Same seed → identical fingerprint | Non-determinism |
| ≥95% of the population unique | Collapsed variation |

Plus the placement-side checks, which belong to Phase 7: placement determinism
across independent field instances, no grass-clearing stone on a walking way,
clearance ≤ 0.05 under a stone and exactly 1 away from stones, and
`stonesEnabled: 0` disabling everything.

## Failure policy

Reject rather than repair — this principle from the original is kept. A
generation that fails validation is a bug in the archetype bands or the
clipper, and should fail the build loudly rather than be silently swapped for a
fallback asset.

If a real rejection rate ever appears in practice, add bounded retry then —
with the measurement that justified it recorded alongside.
