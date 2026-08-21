# Stone LOD handoff — s2 ladder

Captures `s2-02m` … `s2-32m`, flight camera, desktop viewport, RTX 4080 /
ANGLE D3D11. Read together with `../archetype-softening/`.

## Frame rate is not flat across the ladder

The ladder is often summarised as "144 FPS throughout". The captures do not say
that:

| capture   | FPS   | stone tris | draws | grass draw ms | mid submit |
| --------- | ----- | ---------- | ----- | ------------- | ---------- |
| `s2-13m`  | 144.0 | 74,354     | 24    | 4.25          | 345,206    |
| `s2-18m`  | 144.0 | 71,210     | 21    | 5.73          | 426,097    |
| `s2-24m`  | 82.2  | 71,210     | 22    | 9.53          | 432,676    |

Stone cost is flat: tris, batches and the `stone` frame-controller slice
(0.00–0.01 ms) do not move between 13 m and 24 m. What moves is grass — blade
submission climbs with altitude as more of the mid field enters the frustum, and
the draw slice more than doubles.

So the drop at 24 m is altitude-driven grass submission, not the stone work, and
it does not qualify the stone sign-off. It is recorded here so a later
regression hunt does not start by re-reading the stone system.

## Ground integration is the open item

Across the whole ladder the stones sit on the meadow rather than in it: no
contact occlusion at the seam, no ecological reaction in the grass around the
footprint. That is the subject of the contact-ecology pass, not of any further
geometry or LOD change.
