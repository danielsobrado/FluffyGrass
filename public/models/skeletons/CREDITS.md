# Skeleton characters

**KayKit Character Pack: Skeletons (1.0)** by [Kay Lousberg](https://kaylousberg.com).

- Source: <https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0>
- Licence: [CC0 1.0 Universal](http://creativecommons.org/publicdomain/zero/1.0/) — see `LICENSE.txt`.
- Attribution is not required by the licence. It is given here because credit is
  the decent thing to do for work released this generously.

## What was changed

The upstream `.glb` files each carry 95 baked animation clips. This project
animates imported characters through its own actor runtime rather than playing
those clips, so `scripts/prepare-character-assets.mjs` strips them and repacks
the binary chunk, dropping unreferenced buffer views:

| Model | Upstream | Shipped |
| --- | --- | --- |
| `Skeleton_Mage.glb` | 4.76 MB | 0.27 MB |
| `Skeleton_Minion.glb` | 4.81 MB | 0.32 MB |
| `Skeleton_Rogue.glb` | 4.83 MB | 0.34 MB |
| `Skeleton_Warrior.glb` | 4.86 MB | 0.37 MB |

Meshes, skin, skeleton, and texture are otherwise untouched. To refresh from a
newer upstream release, clone the pack and re-run:

```
node scripts/prepare-character-assets.mjs <pack>/Characters/gltf public/models/skeletons
```
