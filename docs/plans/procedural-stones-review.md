# Procedural Stones — Review of the Phase 1–10 Specifications

## Status

- Reviews: `procedural-stones-plan.md` and `procedural-stones-phase-1.md` … `-10.md`
- Verdict: **sound direction, wrong shape.** Keep the architecture; replace the packaging.
- Evidence: a working prototype built against these documents lives in
  `src/world/stones/` and is gated by `npm run test:stones`. Every claim below
  that says "measured" was measured against it.
- Revised plan: `procedural-stones-revised-plan.md`

## How this review was produced

The specifications were not read in isolation. The core of Phase 1 and Phase 2
was implemented as written, rendered, and compared with the reference boards;
where the result failed, the failure was traced back to the instruction that
caused it. Several of the findings below are things no amount of reading would
have surfaced — they only appear once a stone is on screen.

That is itself the review's headline finding.

## What the specifications get right

These decisions are correct and the revised plan keeps all of them:

- **Half-space clipping, not noise displacement.** This is the single most
  important call in the whole document set and it is right. Broad intentional
  planes are what the reference boards are made of; a displaced sphere cannot
  produce them. Confirmed on screen.
- **One shared generator with archetype parameter families**, rather than a
  generator per rock type. This is what makes a population read as one asset
  set — visible immediately in a gallery contact sheet.
- **Deterministic seeds with label-forked substreams**, so adding a parameter in
  one domain cannot shift values resolved in another. Worth the small cost.
- **A recipe fully resolved before any geometry is built.** Makes the generator
  inspectable and replayable.
- **Rejection over correction.** A bad candidate should fail, not be repaired.
- **Strict flat YAML through the existing `FlatConfig`**, consuming every key
  and rejecting unknown ones. Matches the repo.
- **Verification through Vite SSR with no new test dependency.** Matches the
  repo's existing verifier scripts.
- **A configuration rollback flag.**
- **16-metre placement cells** (Phase 7). Kept verbatim.
- **The golden random vectors in Phase 1 are genuine.** They were checked by
  reimplementing the specified algorithm from scratch: all three seed vectors
  and all five FNV-1a label hashes reproduce exactly. Whoever wrote that
  section ran the code. It is the most trustworthy part of the document set.

## Finding 1 — The sequencing defers the only thing that matters

Phase 1's exit criteria gate on determinism, manifold topology, contact ratio,
convexity tolerance, and thirty-four configuration cross-validations. Its
visual acceptance is one paragraph telling the implementer to "render several
Phase 1 outputs locally," with no gallery required until Phase 9.

For a feature whose entire specification is *make it look like these pictures*,
look validation cannot be the last checkbox on the first phase.

Measured: the first render of the prototype exposed an inverted-winding bug in
seconds — every stone was drawing its interior. That mesh was closed, convex,
connected, manifold, outward-consistent by its own construction, and passed
every structural rule Phase 1 lists. **The spec's entire Phase 1 gate would
have passed it.** Only a picture caught it.

The second render exposed that the archetype ranges as tuned produced
gravestones rather than rocks. The third exposed that the whole population was
reading as scattered gravel rather than deliberate clusters. None of those are
findable in a numeric snapshot; all three are findable in one contact sheet.

**Revision:** the gallery harness is prerequisite work, not Phase 9 tooling.
Build it before the generator, and make "a reviewer compares the contact sheet
with the reference board" the gate on every shape phase.

## Finding 2 — The specified clipping algorithm does not produce watertight bodies

Phase 1 mandates (§ *Half-space clipping algorithm*): Sutherland–Hodgman clip
each existing polygon, collect every generated edge intersection, dedupe those
cap points with `stoneVertexMergeEpsilon`, sort them by angle, and add one cap
polygon. It then forbids a repair path: *"A self-intersection indicates a bug
and must fail verification."*

The problem is that each polygon is cleaned independently — adjacent duplicate
removal, collinear removal, per-polygon epsilon — so the two faces meeting at
one edge can resolve that edge's endpoints differently. The seam then fails to
close. The prohibition on repair leaves an implementer who hits this with no
sanctioned move.

Measured, with a watertightness assert (every undirected edge must border
exactly two faces) over 120 stones spanning six archetypes:

| Corner-merge radius | Result |
| --- | --- |
| `1e-5` — the spec's `stoneVertexMergeEpsilon` | **leaks**: `outcrop:10` has an edge bordering 1 face |
| `1.5e-3` | watertight across all 120 |

The spec's epsilon is roughly two orders of magnitude too tight for the
positional drift that near-parallel plane pairs generate at these dimensions.
That is not a tuning nit: at `1e-5` the generator emits holed meshes and the
spec forbids fixing them.

**Revision, and what the prototype does instead:** build each face *directly on
its own plane* — lay a large quad on the plane, clip it by every other
half-space, keep what survives. A convex body assembled this way is watertight
by construction, with no incremental cap bookkeeping to get wrong. Then weld
corners *across* faces at a radius sized for real drift. Both steps are in
`StoneClipper.ts`; the watertightness assert is in the build gate, so this
class of bug can never regress silently.

## Finding 3 — Phase 4's material choice fights the renderer it ships into

Phase 4 freezes `MeshToonMaterial`, extended via `onBeforeCompile`, with a
five-pixel nearest-filtered gradient texture **owned per material instance**,
and Phase 3's surface details evaluated analytically in the fragment shader
from fixed-size uniform arrays.

Two problems.

**It is a different visual language from the ground.** This repo's terrain and
every grass layer are `MeshLambertMaterial` with vertex colours. Stones on a
toon ramp sit in a scene that is not on one. They would read as imported.

**It is architecturally opposed to batching.** Per-material gradient textures
and per-stone detail uniforms mean one material per stone, which means one draw
per stone. Phase 8 then spends an entire specification clawing that back:
768 pre-baked asset sets, a deterministic binary pack, HTTP byte-range loading,
two web workers, reference-counted caches, and per-instance attribute-packed
`InstancedMesh` batches. **That whole phase is downstream of a Phase 4 choice.**

**Revision, and what the prototype does instead:** bake the painted look into
the geometry as two scalar attributes — a palette-ramp position (`tone`) and an
edge-highlight strength (`wear`) per corner — and resolve the actual colours
into vertex colours when a chunk is merged. Consequences, all measured:

- one `MeshLambertMaterial` for every stone in the world, matching the terrain;
- one draw call per chunk, not per stone;
- zero textures, zero uniform arrays, zero shader code;
- palettes vary per instance for free, because colour is per vertex;
- **Phase 8 becomes unnecessary.** No library, no pack format, no workers, no
  cache, no instanced batching. Measured cost of the thing it was protecting
  against: ~90 ms peak to merge a chunk, and a chunk is built once when it
  streams in.

The soft painted edge line the boards show comes from face geometry, not
shading: larger faces emit a rim ring, an inset ring, and a centroid, so the
highlight is pinned into a narrow band along the facet border. That survives
merging and instancing because it is just vertices.

## Finding 4 — Four LODs with dithered transitions are not earned

Phase 6 specifies four LODs per stone, a bespoke semantic-aware convex plane
reducer (explicitly not QEM, not meshoptimizer), source-region-key material
copying, complementary 4×4 Bayer dithered transitions, and per-instance shadow
eligibility with custom instanced depth materials.

The grass system in this repo genuinely needs that machinery — it draws
millions of blades. Stones do not. Measured: a stone is 200–400 triangles, and
a full streamed neighbourhood of ~1,000 stones is ~275k triangles total.

The complexity-to-saving ratio is bad, and the spec concedes the point itself:
Phase 6 defers impostors precisely because it has no measurements yet.

**Revision:** ship one detail cut — a chunk-distance radius beyond which the
small nestling stones are simply omitted. One boolean, already in the
prototype (`stoneDetailRadius`). Revisit real LODs only if a measurement asks
for them, and measure before designing.

## Finding 5 — Phase 7 invents a second, conflicting biome system

Phase 7 defines seven biome IDs with its own classifier over height, normal,
moisture, drainage, and coast proximity.

This repo already has a biome field. `src/world/grass/WorldBiomeField.ts` is a
rank-transformed two-octave noise field sliced by `worldShare`, with dithered
per-blade borders, and `GrassBiomeProfiles.json` defines exactly three:
meadow, dry-steppe, alpine. Grass species, density, accent flora, height bands
and wind damping all key off it.

Two disagreeing biome maps in one world means stones change family and palette
at a boundary the grass does not acknowledge — visibly wrong, and a permanent
maintenance seam.

**Revision:** stones read `sampleGrassBiome` / `pickGrassBiomeIndex`, the same
functions the grass reads. Three biomes, not seven. Where stones need
something the grass field does not provide (how *rocky* a region is), add one
independent low-frequency field for that alone — which is what the prototype's
rockiness field is.

## Finding 6 — The specifications never mention the integration that matters most

Across all 22,521 lines there is no requirement that **grass stop growing
through stones.**

Phase 7 covers slope, elevation, path clearance, embed depth, exclusion zones,
collision descriptors, drainage fields, and origin rebasing. It does not cover
the one thing a player will notice immediately at 72 blades per square metre.

This is also the cheapest possible feature, because the repo already
established the pattern: `TerrainField.samplePathGrassMask` is exactly this,
for walking ways, and all three grass placement paths already call it.

**Revision:** stone placement is a pure world-space field, so grass can query
it without the systems being coupled — `sampleStoneGrassClearance(x, z,
extraRadius)`, shaped deliberately like the path mask. Wired into all three
placement paths in the prototype. The build gate asserts that clearance under
a stone is ≤ 0.05 and exactly 1 well away from any stone.

## Finding 7 — Phase 10's CI automation contradicts repository policy

`CLAUDE.md` states: *"Do not add, configure, or use GitHub Actions in this
repository."*

Phase 10 specifies PR and scheduled CI workflows (decision 13, deliverables
list) and gates merges on them (decisions 37, 41). That is the part to remove:
this project builds and verifies locally, and every plan must assume that.

**Playwright itself is fine.** An earlier draft of this review lumped it in
with the CI objection; that was wrong and is corrected here. Playwright is a
reasonable tool when a task genuinely needs browser automation, and
`CLAUDE.md` now says so explicitly. The objection was only ever to running it
from CI and to gating merges on it. For most stone work the lighter route wins
anyway — a root probe page plus headless Edge with SwiftShader is what
produced every image in this review — but nothing prevents reaching for
Playwright when that is not enough.

Phase 10 also specifies a 49,152-case fuzz population, committed baseline
PNGs, a release-report schema, and cumulative rollout stages with per-biome
emergency switches — for a feature that currently draws rocks on a hillside.

**Revision:** one verifier script in the existing style
(`scripts/verify-stones.mjs`), wired into `npm run build` beside the other
seven. It checks watertightness, determinism, budgets, ground contact,
placement determinism across field instances, path clearance, grass clearance,
and that the rollback flag disables everything. It runs in seconds and needs
no new dependency. Visual review stays a human looking at a contact sheet.

### An honest note on the repository's own state

While applying this finding it turned out the repository *does* contain two
tracked workflows — `.github/workflows/validate.yml` (build on PR) and
`deploy-github-pages.yml` (publish on push to `main`) — actively maintained,
with their action SHAs pinned recently. They predate this work and were not
touched by it.

So the instruction in `CLAUDE.md` and the contents of `.github/workflows/`
disagree. The instruction is what governs planning documents: no specification
in this directory may propose new CI automation. Whether the two existing
workflows should stay is a separate decision for the repository owner, and is
deliberately left alone here.

## Finding 8 — Several validation systems guard against impossible states

- **Phase 5's centre-of-mass / support-polygon stability analysis.** Every
  stone is convex with a flattened base snapped to `y = 0`. Toppling requires
  lean beyond what the configuration permits. One contact-radius assertion
  covers the real case.
- **Phase 5's five-candidate fallback ladder** (requested seed, two rerolls,
  two canonical fallbacks, terminal throw). Measured rejection rate in the
  prototype across 120 stones: zero. Bounded retry is right; a five-stage
  ceremony with canonical fallback seeds in YAML is not.
- **Phase 3's analytic surface details** — grooves, bands, hairline cracks and
  recesses as shader-evaluated descriptors bound to plane IDs. The boards'
  actual surface content is a few broad value regions and pale worn edges.
  Baked tone and wear deliver that at zero runtime cost. Revisit cracks later
  as a texture-free vertex effect if close inspection asks for them.

## Finding 9 — The documents are too large to survive contact with the work

22,521 lines across eleven documents, each declaring itself an "implementation
contract" whose deviations require amending the document first. Phase 1 alone
is 1,874 lines and specifies file names, class APIs, exact algorithm text,
epsilon values, and a thirty-four rule config validation matrix — before one
stone has been looked at.

The prototype that reaches a working, integrated, build-gated state is about
1,400 lines of source. The specification for its first phase is longer than
the entire implementation.

The cost is not just writing time. A frozen contract written ahead of the
first render encodes untested guesses at exactly the level of detail that
makes them expensive to walk back — Finding 2 is precisely this, an algorithm
frozen in prose that does not work, with amendment required to fix it.

**Revision:** specify the decisions that are expensive to change (shape
mechanism, colour mechanism, determinism model, integration seams, rollback)
and leave the values to tuning against pictures. That is what
`procedural-stones-revised-plan.md` does, in a fraction of the length.

## Summary of disposition

Every document listed below has been **rewritten in place** to match this
review. None is a superseded relic: each now describes what should actually be
built, records the measurements behind its changes, and keeps the tuning notes
that were expensive to discover.

| Old phase | Disposition |
| --- | --- |
| Plan (`-plan.md`) | Rewritten; visual contract and archetype language survive |
| 1 — core geometry | **Keep, with the clipping algorithm replaced** (Finding 2) |
| 2 — archetype grammar | Keep, merged into the shape stage |
| 3 — semantic regions & detail | **Cut**; replaced by baked tone/wear (Findings 3, 8) |
| 4 — stylized material | **Replace**; vertex colours, not toon + per-stone textures |
| 5 — quality control | Reduce to the asserts that catch real failures (Finding 8) |
| 6 — LOD system | **Defer**; one distance cut instead (Finding 4) |
| 7 — placement | Keep the cell model; use the repo's biome field; **add grass clearance** |
| 8 — caching, library, instancing | **Cut**; unnecessary once Finding 3 is applied |
| 9 — authoring bench | Reduce to the gallery harness, and build it **first** |
| 10 — QA & rollout | **Replace**; one local verifier, no CI workflows |
