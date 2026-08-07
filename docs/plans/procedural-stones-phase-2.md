# Phase 2 — Archetype Shape Grammar

## Status

- Parent plan: `procedural-stones-plan.md`
- Revised after implementation. Findings: `procedural-stones-review.md`
- Maps to revised **Stage 1** (with Phase 1)
- State: **implemented** in `src/world/stones/StoneRecipe.ts`

## What changed in this revision

- **Eighteen archetypes reduced to six.** Most of the original list was the
  same body under different proportions. A library that large reads as noise
  rather than as a set, and it multiplies the tuning surface for no visual
  gain.
- **Merged into Phase 1.** The original made Phase 2 a separate data-driven
  layer calling `generateFromRecipe` through its own retry loop. In practice
  archetypes *are* the parameter bands of the one generator; the separation was
  bookkeeping, and the nested retry loops it created were the reason the
  original had to forbid calling `generate` at all.
- **Silhouette scoring dropped.** The original specified deterministic
  evaluation over cross-sections, projected silhouettes, lean and cut count,
  with failures triggering retries. Measured rejection rate in the prototype:
  zero across 120 stones. A contact sheet catches what matters here; numeric
  silhouette scoring catches things that were not going wrong.

Kept: one shared generator with curated per-archetype bands, correlated so
random values stay plausible, and domain-separated random streams.

## Objective

Turn the generic convex volume generator into a small library of recognisable
stone families, each identifiable from silhouette alone under one neutral
material.

## The six families

| Archetype | Height ratio | Character | Cuts |
| --- | --- | --- | ---: |
| `pebble` | 0.38–0.60 | Small, squashed, nestles into grass | 0 |
| `boulder` | 0.55–0.95 | Rounded dominant mass, the workhorse | 1–2 |
| `slab` | 0.28–0.45 | Broad and low, wide footprint | 1–2 |
| `block` | 0.55–0.85 | Rectangular weathered mass, strong cuts | 1–3 |
| `shard` | 0.95–1.45 | Taller leaning wedge | 1–2 |
| `outcrop` | 0.50–0.80 | Broad embedded mass reading as bedrock | 1–3 |

Height ratio is relative to `sqrt(width · depth)`; width is normalized to 1 and
world size comes from the placement scale band.

## Per-archetype parameters

Each family declares bands for:

- side-plane count (5–9);
- radius jitter (fraction of base radius);
- taper (how much the profile narrows per unit height);
- crown scale and crown bevel height;
- maximum top tilt;
- contact inset and contact bevel height;
- lean;
- cut count, depth, and normal elevation;
- metre aspect ratios (height, depth);
- edge-wear strength;
- embed depth (fraction of height sunk at placement).

Correlation matters more than range width. `pebble` has zero cuts and a tall
crown bevel, so it reads as worn; `block` has few sides, low jitter and deep
cuts, so it reads as fractured. Widening a band without adjusting its
neighbours is what turns a family into mush.

## Tuning notes from the prototype

Recorded because they were expensive to discover and cheap to lose:

- **`shard` at height ratio 1.2–1.9 reads as a fence post or gravestone**, not
  as the broad leaning wedge the boards show. Reduced to 0.95–1.45; still not
  right, and this is the top open item in Stage 4.
- **Angle jitter below ~40% of regular spacing** leaves the side ring visibly
  regular; stones look turned on a lathe.
- **Skipping the radius smoothing pass** makes stones look crumpled rather than
  carved.
- **`slab` at large placement scales reads as a thin plate.** Needs more
  thickness before scale, not less scale.

## Selection

Archetype selection by biome, slope and altitude is **placement's job**
(Phase 7), not this phase's. This phase only answers "given an archetype and a
seed, what is the recipe?"

## Validation

Covered by the Stage 1 build gate: every archetype × 20 seeds must generate
watertight, grounded, in-budget, deterministic, ≥95% unique geometry. There is
no separate archetype verifier and no archetype-specific rejection scoring.

The real gate is visual: a reviewer must be able to name each family from its
row in the contact sheet.
