import { createAtlasRuntime } from "./grass-v0.9.6-atlas.js";
import { patchFragmentShader, patchVertexShader } from "./grass-v0.9.6-shader.js";

const RELEASE_VERSION = "v0.9.6";

function updateImpostorMaterial(impostorMaterial, atlas) {
  const material = impostorMaterial.material;
  const uniforms = impostorMaterial.uniforms;
  material.vertexShader = patchVertexShader(material.vertexShader);
  material.fragmentShader = patchFragmentShader(material.fragmentShader);
  material.name = "world-grass-subpatch-hemi-octahedral-impostor";
  material.needsUpdate = true;

  uniforms.uAtlas.value = atlas.texture;
  uniforms.uViewsPerAxis.value = atlas.viewsPerAxis;
  uniforms.uSubpatchesPerAxis = { value: atlas.subpatchesPerAxis };
  uniforms.uFrameResolution.value = atlas.frameResolution;
  uniforms.uPadding.value = atlas.padding;
  uniforms.uAtlasSize.value = atlas.atlasSize;
  uniforms.uCenterHeight.value = atlas.centerHeight;
  uniforms.uCardRadius.value = atlas.cardRadius;
  uniforms.uCardsPerPatch.value = 1;
}

function updateExistingFarGroups(grass, oldAtlas, newAtlas, material) {
  const extraBounds = Math.max(0, newAtlas.radius - oldAtlas.radius);
  for (const group of grass.farGroups ?? []) {
    if (group.mesh.material !== material) {
      continue;
    }
    const oldGeometry = group.mesh.geometry;
    const sharedAttributes = {
      variation: oldGeometry.getAttribute("instanceVariation"),
      coverage: oldGeometry.getAttribute("instanceCoverage"),
      biome: oldGeometry.getAttribute("instanceBiome"),
    };
    const replacement = grass.geometryFactory.createInstancedGeometry(
      newAtlas.geometry,
      sharedAttributes.variation.array,
      undefined,
      sharedAttributes,
      sharedAttributes.biome.array,
    );
    replacement.instanceCount = oldGeometry.instanceCount;
    group.mesh.geometry = replacement;

    for (const name of Object.keys(oldGeometry.attributes)) {
      oldGeometry.deleteAttribute(name);
    }
    oldGeometry.setIndex(null);
    oldGeometry.dispose();

    if (extraBounds > 0) {
      group.bounds.expandByScalar(extraBounds);
      group.boundingSphere = group.bounds.getBoundingSphere(
        group.boundingSphere,
      );
    }
  }
}

export async function applyGrassV096Patch(world) {
  const grass = world?.grass;
  if (!grass) {
    throw new Error("The v0.9.6 release patch requires WorldApp grass internals.");
  }
  await grass.initialize();

  if (grass.__v096Patched === true) {
    return;
  }
  const materials = grass.impostorMaterials;
  if (!Array.isArray(materials) || materials.length === 0) {
    throw new Error("The v0.9.6 release patch found no far grass materials.");
  }

  const variants = grass.patchGeometryFactory.createLodVariants(
    grass.grassConfig.geometry,
    grass.worldConfig,
    grass.profile.compact,
    grass.worldConfig.seed,
    materials.length,
    0x9e3779b9 / 4294967296,
  );
  const createAtlas = createAtlasRuntime(world, materials[0].atlas);

  for (let index = 0; index < materials.length; index += 1) {
    const impostorMaterial = materials[index];
    const oldAtlas = impostorMaterial.atlas;
    const oldTexture = oldAtlas.texture;
    const oldGeometry = oldAtlas.geometry;
    const newAtlas = createAtlas(
      variants.bladeVariants[index],
      grass.grassConfig.geometry,
      grass.worldConfig.grassPatchSize,
      grass.grassConfig.impostor,
    );

    updateImpostorMaterial(impostorMaterial, newAtlas);
    updateExistingFarGroups(
      grass,
      oldAtlas,
      newAtlas,
      impostorMaterial.material,
    );
    Object.assign(oldAtlas, newAtlas);
    oldTexture.dispose();
    oldGeometry.dispose();
  }

  grass.__v096Patched = true;
  console.info(
    `[Drusniel World] ${RELEASE_VERSION} far-grass release patch applied.`,
  );
}
