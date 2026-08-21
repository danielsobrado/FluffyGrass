# Canopy evaluation at 84 blades/m²

Deterministic desktop captures of the healthy `AB_MEADOW` landmark after the
canopy-closure pass. All three poses use the same front-lit bearing so density
is not being hidden by backlight or compared across different ecology.

## Views

| Capture | Camera purpose | AGL | FPS | Near submit | Near tris | Grass draw |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `g11-canopy-third-person` | Normal gameplay-height read | 2.1 m | 144 | 273k | 507k | 3.38 ms |
| `g11-canopy-blade-height` | Root-channel stress test | 0.7 m | 144 | 266k | 495k | 2.71 ms |
| `g11-canopy-elevated-35deg` | Projected coverage at exactly 35° | 9.2 m | 144 | 302k | 556k | 3.10 ms |

ANGLE reports the RTX 4080 D3D11 path, WebGL 2, and `NO_ERROR` in every frame.
The full telemetry is retained in `capture-report-g11-canopy.json`.

## Visual read

- Third person: the meadow reads as one canopy after the immediate foreground.
  The short tier carries the base while taller blades remain individually
  readable. There are no large healthy-clump core holes.
- Blade height: this is the strictest view. The low canopy holds, but a few
  locally traceable soil channels remain between similarly oriented foreground
  groups. They are a shading/distribution issue rather than evidence that the
  whole meadow needs another density increase.
- Elevated 35°: projected coverage remains coherent across distance, without a
  near-to-mid density ring. Exposed ground is mottled rather than forming broad
  continuous openings.

## Decision

Keep desktop meadow density at **84 blades/m²**. The 96-blade A/B increased near
submissions materially for only a modest visual gain. If the remaining
blade-height soil channels need another pass, prefer darker vegetation residue
under the canopy or less-correlated clump orientation/distribution. Do not raise
global meadow density first.
