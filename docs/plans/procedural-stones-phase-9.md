# Phase 9 — Gallery Harness and Authoring Tools

## Status

- Parent plan: `procedural-stones-plan.md`
- Findings: `procedural-stones-review.md` (Finding 1)
- **Promoted to Stage 0 and reduced.** This is now prerequisite work, not the
  ninth phase.
- State: **implemented** as two local probe pages

## What changed in this revision

**Promoted.** The original made authoring tools the ninth of ten phases. That
ordering is the review's headline finding: the first render of the prototype
caught an inverted-winding bug — every stone drawing its interior — that passed
every structural rule Phase 1 specified. A gallery is not a convenience for
late-stage tuning; it is the only instrument that validates the actual
requirement.

**Reduced.** The original specified a full `?scene=stone-bench` authoring
application: a reducer-driven state controller, in-memory YAML draft editing
parsed through the production loaders, URL state with `replaceState` /
`pushState` semantics, debounced regeneration with stale-result disposal,
per-stage inspection stopping after any of Phases 1–6, semantic debug overlays,
contact-sheet rendering with manifests, clipboard actions, and preset export.

That is a tool for a team tuning stones daily. What the work needs is a picture
of many stones under production lighting.

## What ships instead

Two local probe pages, following the repository's existing convention
(`lod-blink`, `trail-probe`): a root HTML entry plus a `tools/` module, served
by the dev server only, gitignored, and never a build input.

### `stone-gallery.html` + `tools/stone-gallery/`

Archetype rows × seed columns × palette columns, on a ground plane in the
terrain's own grass colour.

| Parameter | Effect |
| --- | --- |
| `?focus=<archetype>` | Single row, close camera |
| `?palette=<key>` | Force one palette across all columns |
| `?seed=<n>` | Offset every stone's seed |
| `?scale=<n>` | Uniform scale multiplier |

### `stone-world.html` + `tools/stone-world/`

Real terrain field, real stone field, real streaming system, with the terrain
drawn as a plain vertex-coloured patch instead of the streamed chunk pipeline.
Fast enough to screenshot while still exercising the code that decides where
stones stand.

| Parameter | Effect |
| --- | --- |
| `?x=`, `?z=` | World focus in metres |
| `?h=`, `?d=` | Camera height and pull-back |
| `?span=` | Terrain patch size |

## Two constraints that are not optional

**Put probe pages at the site root.** `TerrainStreamer` loads
`./perlinnoise.webp` relative to the page, so from a subdirectory it 404s,
Three silently binds its 1×1 black fallback, and every texture-driven detail
renders as a flat constant. This is recorded because it costs an hour to
rediscover.

**Replicate `WorldApp.addLights` and `ACESFilmicToneMapping` exactly.**
Otherwise material colours calibrate against the wrong exposure and every
palette decision made in the gallery is wrong in the world.

## Capture

Headless Edge with SwiftShader renders Three fine:

```bash
msedge --headless=new --disable-gpu --use-gl=swiftshader --enable-unsafe-swiftshader --window-size=1600,900 --screenshot=<abs-path> <url>
```

Gotchas: Edge caches the Vite html-proxy chunk, so restart Vite after editing a
probe page; the launcher returns before the browser exits, so wait before
reading the file; and `--virtual-time-budget` is unusable against the full
`WorldApp` — its watchdog reads the clock jumps as hangs. That is why the
probes are separate lightweight pages rather than the real scene.

Playwright is available if a capture ever needs real interaction or a proper
visual-diff harness. Nothing here does today, and the probe-page route is
faster to iterate with.

## If a real bench is ever wanted

Build it when tuning becomes a daily activity with a named owner, and build the
parts that hurt: seed stepping, live archetype-band sliders, and a contact-sheet
export. Skip the YAML draft editor — stone shape parameters live in TypeScript
constants precisely so they can be edited directly.
