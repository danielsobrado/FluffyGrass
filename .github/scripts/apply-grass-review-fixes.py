from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def write(path: str, source: str) -> None:
    Path(path).write_text(source, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    source = read(path)
    if new in source:
        return
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one match in {path}, found {count}: {old!r}")
    write(path, source.replace(old, new, 1))


def insert_after(path: str, marker: str, addition: str) -> None:
    source = read(path)
    if addition.strip() in source:
        return
    replace_once(path, marker, marker + addition)


def insert_before(path: str, marker: str, addition: str) -> None:
    source = read(path)
    if addition.strip() in source:
        return
    replace_once(path, marker, addition + marker)


SYSTEM = "src/world/WorldGrassSystem.ts"
VERIFY = "scripts/verify-lod-continuity.mjs"

replace_once(
    SYSTEM,
    """    lodConfig.farMaxDistance = Math.min(
      lodConfig.farMaxDistance,
      this.artDirection.farDistance,
    );""",
    """    lodConfig.farMaxDistance = this.resolveArtFarDistance(
      this.artDirection,
    );""",
)

insert_before(
    SYSTEM,
    "  private processBuildQueue(): void {",
    """  private resolveArtFarDistance(direction: GrassArtDirection): number {
    const radius = this.profile.compact
      ? this.worldConfig.grassRadiusCompact
      : this.worldConfig.grassRadiusDesktop;
    const streamFadeEnd = radius * this.worldConfig.chunkSize;
    return Math.min(
      direction.farDistance,
      this.worldConfig.grassFarDistance,
      streamFadeEnd - direction.transitionDistance,
    );
  }

""",
)

replace_once(
    SYSTEM,
    "      const boundsPadding = Math.max(impostorRadius, bladeExtent);",
    """      const boundsPadding = Math.max(
        impostorRadius + this.getFarImpostorOffsetRadius(),
        bladeExtent,
      );""",
)

replace_once(
    SYSTEM,
    """      lodConfig.farMaxDistance = Math.min(
        direction.farDistance,
        this.worldConfig.grassFarDistance,
      );""",
    "      lodConfig.farMaxDistance = this.resolveArtFarDistance(direction);",
)

insert_before(
    SYSTEM,
    "  private createFarImpostorInstances(",
    """  private getFarImpostorOffsetRadius(): number {
    return this.worldConfig.grassFarImpostorsPerPatch > 1
      ? this.worldConfig.grassPatchSize * 0.12
      : 0;
  }

""",
)

replace_once(
    SYSTEM,
    """    const offsetRadius = cardsPerPatch > 1
      ? this.worldConfig.grassPatchSize * 0.12
      : 0;""",
    "    const offsetRadius = this.getFarImpostorOffsetRadius();",
)

insert_after(
    VERIFY,
    'const worldGrassSystem = read("src/world/WorldGrassSystem.ts");',
    '\nconst artDirections = read("src/grass/GrassArtDirection.ts");',
)

insert_after(
    VERIFY,
    """if (!impostorAtlasFactory.includes("shadeScale * material.rootDarkening")) {
  fail("The impostor atlas must share the configured blade-root darkening.");
}""",
    """
if (
  !impostorMaterial.includes("uniform vec3 uTipColor") ||
  !impostorMaterial.includes("uniform float uRootDarkening") ||
  !impostorMaterial.includes("vec3 paletteColor")
) {
  fail("Far grass must reconstruct the active base-to-tip preset palette.");
}
if (
  artDirections.includes("value in GRASS_ART_DIRECTIONS") ||
  !artDirections.includes(
    "Object.prototype.hasOwnProperty.call(GRASS_ART_DIRECTIONS, value)",
  )
) {
  fail("Grass-art query validation must reject inherited object properties.");
}
if (
  !worldGrassSystem.includes("resolveArtFarDistance") ||
  !worldGrassSystem.includes("streamFadeEnd - direction.transitionDistance")
) {
  fail("Runtime art presets must preserve the streamed far-distance cap.");
}
if (
  !worldGrassSystem.includes(
    "impostorRadius + this.getFarImpostorOffsetRadius()",
  ) ||
  !worldGrassSystem.includes(
    "const offsetRadius = this.getFarImpostorOffsetRadius()",
  )
) {
  fail("Layered far-card offsets must be included in culling bounds.");
}""",
)

insert_after(
    VERIFY,
    """const farImpostorsPerPatch = readYamlNumber(
  worldConfig,
  "grassFarImpostorsPerPatch",
);""",
    """
const renderBatchesPerAxis = readYamlNumber(
  worldConfig,
  "grassRenderBatchesPerAxis",
);""",
)

insert_after(
    VERIFY,
    """if (farImpostorsPerPatch < 2) {
  fail("Far grass must use layered full-footprint impostors.");
}""",
    """
if (
  renderBatchesPerAxis > 2 ||
  farImpostorsPerPatch > 2 ||
  midBladeFraction * farImpostorsPerPatch > 2
) {
  fail("Grass mid/far density exceeds the reviewed rendering budget.");
}""",
)
