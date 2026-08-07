# Procedural Stylized Stones — Master Plan

## Status

- Revised after implementation review. See `procedural-stones-review.md` for
  the findings and the measurements behind each change.
- Working plan of record: `procedural-stones-revised-plan.md`.
- Phase documents `procedural-stones-phase-1.md` … `-10.md` carry the detail
  for each stage and have been corrected to match this document.
- A prototype of stages 0–3 exists in `src/world/stones/`, builds green, and is
  gated by `npm run test:stones`.

## Product goal

Deterministic procedural stones matching the approved reference boards:

- strong, readable silhouettes;
- a small number of large planar or gently curved faces;
- controlled low-poly faceting;
- stable flattened bases;
- broad deliberate cuts rather than noisy displacement;
- two to five painted colour values per stone, lighter tops, darker cut faces;
- pale worn edges;
- no photographic texture;
- coherent across archetypes, biomes, lighting and distance;
- cheap enough to carry a streamed world.

Procedural but art-directed. Not an unrestricted random rock generator.

## Visual contract

### Required shape language

- Squashed, tapered, leaning, stepped, wedged, slab-like, block-like, or
  rounded primary masses.
- A limited number of large faces.
- Asymmetric silhouettes with clear mass and balance.
- One dominant form with optional secondary cuts.
- Deliberate top planes, side planes, cut faces and ridges.
- Ground contact that looks stable and intentional.

### Required surface language

- Two to five broad colour values per stone.
- Top-facing highlights, darker cut faces and cavities.
- Pale worn edges along facet borders.
- Low-frequency variation only.
- No photographic noise.

### Prohibited results

- Uniformly noise-displaced spheres.
- Crystalline forms.
- Excessive micro-faceting; tiny triangles; fragmented faces.
- Thin unsupported shelves; floating or concave undersides.
- Accidental symmetry.
- Unstable contact areas.
- Self-intersections, inverted geometry, or holes.

## Architectural principles

1. **Look first.** A stone that has not been rendered has not been validated.
   Structural checks pass meshes that are visibly wrong — this was measured;
   see review Finding 1.
2. **Archetype families over one shared generator**, not a generator per rock.
   This is what makes a population read as one asset set.
3. **Shape from intersecting half-spaces**, never from noise-displacing a
   sphere. Broad planes are the style.
4. **Watertight by construction.** Each face is built directly on its own
   plane, then corners are welded across faces. Do not use incremental
   clip-and-cap; it leaks (review Finding 2).
5. **Colour is baked, not shaded.** Geometry carries a palette-ramp position
   and an edge-wear strength per vertex; palettes resolve to vertex colours at
   chunk merge. One `MeshLambertMaterial` for every stone, matching the
   terrain and grass.
6. **Deterministic seeds**, label-forked so a new parameter in one domain
   cannot shift values resolved in another.
7. **Placement is a pure world-space field**, so other systems can query it
   without coupling. This is what makes grass clearance possible.
8. **Reuse the world's existing fields.** Biome, height, normal, and path
   distances all already exist. Do not build parallel ones.
9. **Reject bad outputs** rather than repairing them.
10. **Separate what is fixed from what is tuning.** Freeze only the decisions
    that are expensive to reverse; leave ranges, palettes and densities to be
    settled against pictures.

## Archetype library

Six families, all the same body under different proportions:

| Archetype | Character |
| --- | --- |
| `pebble` | Small, squashed, nestles into grass |
| `boulder` | Rounded dominant mass, the workhorse |
| `slab` | Broad and low, wide footprint |
| `block` | Rectangular weathered mass, strong cuts |
| `shard` | Taller leaning wedge |
| `outcrop` | Broad embedded mass reading as bedrock |

The earlier plan listed eighteen archetypes. Most were the same geometry under
different proportions and would have produced a library that reads as noise
rather than as a set. Add a seventh family only when a contact sheet shows a
silhouette these six cannot reach.

Each archetype defines: side-plane count, radius jitter, taper, crown scale and
bevel, top tilt, contact inset and bevel, lean, cut count and depth, cut normal
elevation, metre aspect ratios, edge-wear strength, and embed depth.

## Stage structure

The old ten-phase sequence deferred all look validation to the end. The
revised sequence puts it first and collapses the phases that existed only to
serve a material choice that has since been replaced.

| Stage | Content | Old phase |
| --- | --- | --- |
| 0 | Gallery harness | was 9 |
| 1 | Shape: core geometry and archetype grammar | was 1 + 2 |
| 2 | Palette and baked vertex colour | replaces 3 + 4 |
| 3 | Placement, world integration, grass clearance | was 7 |
| 4 | Art tuning against the reference boards | new, and the real work |

Cut entirely: the pre-baked asset library and instanced batch runtime (old
Phase 8), which existed only to recover the batching that the old material
choice gave away. Deferred: the four-LOD system (old Phase 6), unearned at
200–400 triangles per stone.

Quality control (old Phase 5) and QA (old Phase 10) are reduced to the checks
that catch real failures and folded into the build gate.

## Configuration

Stone configuration lives in `public/config/world.yaml`, read through the
existing `FlatConfig` and validated by `WorldConfigLoader` like every other
world value. It is not a separate configuration domain.

```yaml
stonesEnabled: 1          # 0 disables placement, rendering and clearance
stoneCellSize: 16         # metres per placement cell
stoneDensity: 0.26        # expected stones per cell before biome factors
stoneVariantsPerArchetype: 6
stoneClusterChance: 0.55
stoneGrassClearanceFeather: 0.55
stoneRadiusDesktop: 6
stoneRadiusCompact: 3
stoneDetailRadius: 3      # beyond this, small stones are omitted
stoneChunksPerFrame: 1
```

## Module layout

```text
src/world/stones/
  StoneRandom.ts          deterministic label-forked streams
  StoneRecipe.ts          archetype specs → resolved recipe
  StoneClipper.ts         half-space planes → watertight convex body
  StoneGeometry.ts        recipe → render mesh with baked tone and wear
  StonePalette.ts         palettes and the tone → linear colour ramp
  StoneField.ts           deterministic world-space placement
  StoneClearance.ts       the hook grass placement samples
  WorldStoneSystem.ts     per-chunk merge, streaming, disposal
  StoneVerification.ts    build-gate checks

scripts/verify-stones.mjs
```

## Verification

One script in the existing verifier style, wired into `npm run build`. It
loads the real modules through Vite SSR rather than re-deriving their maths.

No CI workflows (repository instruction). No test framework. Playwright is
available if a check needs real browser automation, run locally on demand.

## Budgets

| Class | Triangles | Use |
| --- | ---: | --- |
| Small stone | 100–250 | Dense scatter |
| Common stone | 200–400 | General placement |
| Large rock | 300–500 | Outcrops and landmarks |

Measured in the prototype: ≤296 vertices and ≤394 triangles across 120 stones
spanning all six archetypes; ~275k triangles for a full streamed
neighbourhood of roughly 1,000 stones.

## Definition of done

- The gallery contact sheet reads as one coherent set beside the boards.
- Each archetype is identifiable from silhouette alone.
- Shapes use broad intentional planes, not surface noise.
- Every mesh is watertight, convex, grounded and within budget.
- Stones sit in the frame with the terrain rather than on top of it.
- No stone stands on a walking way; no blade grows through a stone.
- Streaming does not hitch.
- `npm run build` passes with the stone verifier.
- `stonesEnabled: 0` cleanly removes the system.
