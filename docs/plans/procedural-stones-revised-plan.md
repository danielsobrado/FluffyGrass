# Procedural Stylized Stones — Revised Plan

## Status

- Supersedes `procedural-stones-plan.md` and `procedural-stones-phase-1.md` … `-10.md`
- Rationale for every departure: `procedural-stones-review.md`
- A prototype of stages 0–3 exists in `src/world/stones/`, builds green, and is
  gated by `npm run test:stones`. Stage 4 (art tuning) is the open work.

## Goal

Procedural stones matching the reference boards: strong readable silhouettes,
a few broad faces per stone, flat stable bases, two-to-five painted value
regions, pale worn edges, no photographic texture. Low-poly, deterministic,
placed by biome / altitude / slope / walking way, and cheap enough to carry a
streamed world.

## What is fixed, and what is tuning

The distinction the old documents missed. Only these are expensive to change
later, so only these are frozen:

**Fixed**

1. Shape comes from **intersecting half-spaces**, never from displacing a
   sphere with noise. Broad planes are the style.
2. Each face is built **directly on its own plane** (clip a large quad by every
   other half-space), then corners are **welded across faces**. Watertight by
   construction. Do not reintroduce incremental clip-and-cap — see review
   Finding 2 for the measurements.
3. Colour is **baked per-vertex**, not shaded. Geometry carries `tone` (palette
   ramp position) and `wear` (edge highlight strength); a palette resolves to
   vertex colours at chunk merge. **One `MeshLambertMaterial` for all stones**,
   matching the terrain and grass.
4. Determinism: label-forked substreams, recipe fully resolved before geometry.
5. Placement is a **pure world-space field**. Anything may query "what stands
   near (x, z)?" without coupling. This is what makes grass clearance possible.
6. Stones read the repo's **existing** biome field (`WorldBiomeField`), never a
   private one.
7. `stonesEnabled: 0` removes stones **and** every downstream effect.

**Tuning** — everything else. Archetype ranges, scale bands, palette hexes,
density, cluster chance, weights. These are settled by looking at pictures, and
they will change many times. They live in `StoneRecipe.ts` / `StoneField.ts`
constants and `world.yaml`; none of them belongs in a frozen contract.

## Stage 0 — Gallery harness (do this first)

The old plan made this Phase 9 tooling. It is prerequisite: the first render
of the prototype caught an inverted-winding bug that passed every structural
rule Phase 1 specified.

- A page at the repo **root** (`stone-gallery.html` + `tools/stone-gallery/`).
  Root matters: `TerrainStreamer` loads `./perlinnoise.webp` relative to the
  page, so a subdirectory silently 404s into a black fallback texture.
- Must replicate `WorldApp.addLights` and `ACESFilmicToneMapping` exactly, or
  colours calibrate against the wrong exposure.
- Ground plane in the terrain's own grass colour, so palettes are judged
  against the real backdrop.
- Archetype rows × seed columns, with `?focus=<archetype>` for close-ups.
- Screenshot via headless Edge + SwiftShader (see the visual-check notes; the
  full `WorldApp` is too slow under SwiftShader, which is why the probes are
  separate pages).

**Done when** a contact sheet can be put beside the reference board.

## Stage 1 — Shape

Merges old Phases 1 and 2. One generator, archetype parameter families over it.

- `StoneRandom` — mulberry32, label-forked. The Phase 1 golden vectors are
  genuine and worth keeping as a regression check if determinism across
  refactors ever matters.
- `StoneRecipe` — archetype spec bands → immutable resolved recipe. Six
  families: pebble, boulder, slab, block, shard, outcrop. The old plan's
  eighteen archetypes are mostly the same body under different proportions;
  add more only when a contact sheet shows a silhouette the six cannot reach.
- `StoneClipper` — planes from the recipe (bottom, tilted top, tapered side
  ring, contact bevel ring, crown bevel ring, then broad cuts measured against
  the current body and pushed clear of the contact footprint), face-per-plane
  construction, cross-face weld.
- `StoneGeometry` — metre-space transform with lean shear (lean multiplies by
  `y`, so the contact plane is preserved), recentre on the contact centroid,
  flat-shaded faces, baked `tone`/`wear`, rim + inset ring + centroid on larger
  faces so the edge highlight is a band rather than a glow.

**Done when** the contact sheet reads as one coherent asset set, each family is
identifiable by silhouette, and the watertightness assert passes.

## Stage 2 — Palette

- Four palettes: meadow sage, steppe tan, granite grey, mossy. Values sit
  deliberately near the terrain's own rock colours (`#696b64` / `#85857f`) so
  stones read as outcrops of the same world.
- Three-stop ramp with a gentle quantize — enough banding to read as painted
  values, not enough to posterize under real lighting.
- Colours stored **linear**, matching how `TerrainChunk` writes its vertex
  colours.
- Per-instance value scale, plus an altitude blend towards granite that echoes
  the terrain shader's own rock colouring.

**Done when** stones sit in the frame with the terrain rather than on top of it.

## Stage 3 — Placement and integration

Keeps the old Phase 7's 16-metre cells; drops its parallel biome system.

- **Rockiness field** — one independent low-frequency two-octave field that
  gathers stones into rocky hillsides and leaves clean meadows between. This is
  the thing the grass biome field does not provide.
- **Biome and altitude** — `sampleGrassBiome` for family and palette weights;
  an altitude boost towards granite and towards the exposed families.
- **Slope** — level ground gets pebbles, boulders, slabs; slopes turn to
  outcrops, blocks, shards. Reject beyond the slope limit rather than forcing.
- **Walking ways** — reject anything that would block the tread, using the
  existing `samplePathDistances`. Then *encourage* small stones on the verge
  just past the clearance, so ways read as lined rather than sterile.
- **Clusters** — larger grounded masses seed satellites sharing their palette,
  skipped when the satellite would cross a terrain break and float.
- **Terrain alignment** — partial, by family. Pebbles ride the ground; shards
  keep their vertical character.
- **Grass clearance** — `sampleStoneGrassClearance(x, z, extraRadius)`, shaped
  like `samplePathGrassMask`, wired into all three grass placement paths
  (near single-blade tiles, mid patches, detail foliage). Patches clear on
  centre only; per-blade precision lives in the near tiles. This is the
  integration the old documents omitted entirely.
- **Rendering** — one merged vertex-coloured mesh per chunk, one draw call,
  culled by the chunk's own bounds, rebuilt only on stream-in or detail-band
  crossing. Small stones are dropped beyond `stoneDetailRadius`.

**Done when** stones stream without hitching, no stone stands on a path, and no
blade grows through a stone.

## Stage 4 — Art tuning (the open work)

Everything above is mechanism. This stage is the actual product, and it is
iterative: change values, re-shoot the contact sheet and the in-world probe,
compare with the boards, repeat.

Known open items from the prototype's current state:

- Shards read as menhirs / gravestones rather than the broad leaning wedges the
  boards show. Height ratio is still too high relative to footprint.
- Slabs read as thin plates at larger scales; they need more thickness.
- Clusters are configured but do not yet read as clusters on screen — satellite
  distance and count need work against a picture.
- The size hierarchy is flat: the population needs more genuinely large hero
  masses and fewer mid stones.
- Palette value separation is a little tight under bright sun; shadow values
  may need to go darker.

**Done when** a reviewer puts the contact sheet beside the reference board and
agrees they belong to the same game.

## Verification

One script, `scripts/verify-stones.mjs`, in the existing verifier style, wired
into `npm run build`. It loads the real modules through Vite SSR rather than
re-deriving their maths — a hand-maintained copy of a convex clipper is exactly
the divergence the other verifiers warn about.

It checks: watertightness (every undirected edge borders exactly two faces),
per-seed determinism, uniqueness across the population, triangle and vertex
budgets, ground contact, tone/wear ranges, placement determinism across
independent field instances, that no grass-clearing stone stands on a walking
way, that clearance under a stone is ≤ 0.05 and exactly 1 away from stones,
and that `stonesEnabled: 0` disables everything.

No GitHub Actions (repository instruction), no Playwright, no test framework,
no new dependency. Visual review is a human and a contact sheet.

## Explicitly not doing

Each of these was specified in the old documents; the review explains each cut.

- Toon material, per-material gradient textures, shader-evaluated detail fields.
- Four-LOD system, semantic plane reduction, Bayer dithered transitions.
- Pre-baked 768-asset library, binary pack format, HTTP byte ranges, web
  workers, reference-counted asset cache, instanced batch manager.
- A private seven-biome classifier.
- Centre-of-mass stability analysis, five-stage canonical fallback ladder.
- 49,152-case fuzz suite, committed baseline PNGs, cumulative rollout stages,
  release-report schema.

Revisit any of them when a measurement asks for it. None currently does.
