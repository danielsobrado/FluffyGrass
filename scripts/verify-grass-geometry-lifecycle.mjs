import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[grass-geometry-lifecycle] ${message}`);
  }
}

const source = read("src/grass/GrassGeometryFactory.ts");

assert(
  source.includes('import { disposeResources } from "../render/ResourceDisposal"') &&
    /createLodVariants\([\s\S]*?let near: THREE\.BufferGeometry\[\] = \[\];[\s\S]*?let mid: THREE\.BufferGeometry\[\] = \[\];[\s\S]*?try \{[\s\S]*?return \{ near, mid \};[\s\S]*?catch \(error\)[\s\S]*?disposeGrassGeometryResources\(\[\.\.\.near, \.\.\.mid\]/.test(
      source,
    ),
  "LOD variant creation must roll back already completed near/mid geometries when a later variant fails.",
);

assert(
  /createInstancedGeometry\([\s\S]*?const geometry = new THREE\.InstancedBufferGeometry\(\);[\s\S]*?try \{[\s\S]*?return geometry;[\s\S]*?catch \(error\)[\s\S]*?disposeGrassGeometryResources\(\[geometry\], "instanced geometry"\)/.test(
    source,
  ),
  "Instanced geometry setup must release its unpublished geometry on failure.",
);

assert(
  /private createVariants\([\s\S]*?const variants: THREE\.BufferGeometry\[\] = \[\];[\s\S]*?try \{[\s\S]*?variants\.push\([\s\S]*?return variants;[\s\S]*?catch \(error\)[\s\S]*?disposeGrassGeometryResources\(variants, "partial variant set"\)/.test(
    source,
  ),
  "Variant-set creation must release geometries completed before a later variant fails.",
);

assert(
  /private createClump\([\s\S]*?const geometry = new THREE\.BufferGeometry\(\);[\s\S]*?try \{[\s\S]*?geometry\.computeBoundingSphere\(\);[\s\S]*?return geometry;[\s\S]*?catch \(error\)[\s\S]*?disposeGrassGeometryResources\(\[geometry\], "clump geometry"\)/.test(
    source,
  ),
  "Clump geometry must clean a partially configured BufferGeometry before rethrowing.",
);

assert(
  /disposeInstancedMesh\([\s\S]*?geometry\.setIndex\(null\);[\s\S]*?disposeResources\(\[[\s\S]*?geometry,[\s\S]*?preserveSharedInstanceData \? undefined : mesh/.test(
    source,
  ),
  "Instanced mesh teardown must attempt geometry and mesh cleanup independently.",
);

console.log(
  "[grass-geometry-lifecycle] Variant, clump, instanced-geometry, and mesh ownership verified.",
);