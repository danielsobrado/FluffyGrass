# Grass QA and impostor tools

## Deterministic grass QA

Open the application with:

```text
?qa=grass
```

The runner captures four deterministic views: close, near-to-mid transition, aerial, and far. It records frame-time percentiles, renderer draw statistics, visible patch counts, and submitted clump counts.

Optional parameters:

```text
?qa=grass&warmup=1.5&duration=4&download=1
```

When `download=1`, the browser attempts to download the screenshots and JSON report. Download links remain visible if automatic downloads are blocked. The report is also exposed as `window.__FLUFFY_GRASS_QA__`.

## Hemi-octahedral impostor bake

Open the application with:

```text
?grassImpostorBake=1
```

The baker selects the most populated grass patch and renders a deterministic upper-hemisphere octahedral atlas. It produces an albedo/alpha PNG and JSON metadata with view directions, atlas viewports, source bounds, and mapping details.

The metadata is exposed as `window.__FLUFFY_GRASS_IMPOSTOR_BAKE__`.

Current scope is the baker foundation. Normal/roughness, depth/thickness, gutter dilation, and runtime impostor rendering remain future work.
