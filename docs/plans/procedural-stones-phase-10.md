# Phase 10 — QA, Rollout and Hardening

## Status

- Parent plan: `procedural-stones-plan.md`
- Findings: `procedural-stones-review.md` (Finding 7)
- **Replaced** by one local verifier and a configuration flag
- State: **implemented** as `scripts/verify-stones.mjs`, wired into
  `npm run build`

## What changed in this revision

**CI workflows removed.** The original specified pull-request and scheduled
hardening CI jobs and gated merges on them. `CLAUDE.md` states: *"Do not add,
configure, or use GitHub Actions in this repository."* This project builds and
verifies locally, and every plan must assume that.

**Playwright is fine.** An earlier draft of the review lumped Playwright in
with the CI objection; that was wrong. `CLAUDE.md` now says explicitly that
Playwright may be used when a task genuinely needs browser automation. The
objection was only ever to running it from CI and gating merges on it. Nothing
in the stone work needs it today — the probe-page plus headless-Edge route
produced every image in the review — but it is available when the lighter route
is not enough.

**Scale reduced.** The original also specified a 49,152-case fuzz population,
committed baseline PNGs with fixed RGB error metrics, streaming and
floating-origin stress routes, a release-report schema, configuration migration
tests for a v2 schema that does not exist, and cumulative rollout stages with
per-biome emergency switches and dev-only URL overrides — for a feature that
draws rocks on a hillside.

## What ships instead

### One verifier

`scripts/verify-stones.mjs`, in the same style as the seven existing
`verify-*.mjs` scripts, chained into `npm run build` and available as
`npm run test:stones`.

It loads the real modules through Vite SSR rather than re-deriving their maths.
That is a deliberate departure from the sibling scripts, which reimplement the
formulas they check: a hand-maintained copy of a convex half-space clipper is
exactly the divergence those scripts warn about, and the watertightness check
is only meaningful against the real implementation. Vite is already a
dependency, so this adds nothing.

Checks, geometry side:

- every undirected edge borders exactly two faces (watertightness);
- ≥5 faces per body, all positions finite;
- same seed reproduces an identical fingerprint;
- ≥95% of the population unique;
- minimum Y within tolerance of zero; contact radius above a floor;
- `tone` and `wear` within `[0, 1]`;
- vertex and triangle budgets.

Checks, placement side:

- placement identical across two independent `StoneField` instances;
- no chunk exceeds a sane instance count;
- instance values finite, scale in range, never on a rejected slope;
- no grass-clearing stone stands on a walking way;
- grass clearance ≤ 0.05 under a stone, and exactly 1 well away from stones;
- `stonesEnabled: 0` yields zero instances and clearance 1 everywhere.

Current output:

```
[stones] OK · 120 meshes (120 unique, ≤296 verts, ≤394 tris) · 402 instances across 64 chunks
```

Runtime: seconds. No new dependency, no test framework, no CI.

### One rollback flag

```yaml
stonesEnabled: 0
```

Disables placement, rendering, and grass clearance together. The last of those
matters: an invisible disabled stone that still thinned the grass around it
would be worse than either state, which is why the verifier asserts clearance
returns to 1 when the flag is off.

This replaces the original's cumulative rollout stages, per-biome emergency
switches, master disable, and dev-only URL overrides. There is one world and
one flag.

### Failure isolation

A stone-system failure must never prevent the world from starting. Stones live
in their own frame subsystem alongside terrain and grass, so `WorldApp`'s
existing per-subsystem error handling disables them and keeps rendering — the
same behaviour grass already has.

## Visual regression

Deliberately manual: a human puts the gallery contact sheet beside the
reference boards. The requirement is "does this look like the art," which no
pixel metric encodes. Committed baseline PNGs would drift, need updating on
every legitimate tuning change, and answer a question nobody asked.

If visual regression becomes worth automating — most likely when the look is
final and the risk is silent drift rather than active tuning — Playwright is
the right tool, run locally on demand, with the baselines and thresholds
decided then.

## What "done" means

- `npm run build` passes with the stone verifier.
- The contact sheet reads as one set beside the boards.
- No stone on a walking way; no blade through a stone.
- Streaming does not hitch.
- `stonesEnabled: 0` cleanly removes the system.
