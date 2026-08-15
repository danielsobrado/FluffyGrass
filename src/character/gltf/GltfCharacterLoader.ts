import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface LoadedGltfCharacter {
  /** The imported scene graph. Whoever loaded it owns disposal. */
  readonly scene: THREE.Group;
  /** Bones of the character's single skin, in the pack's own joint order. */
  readonly skinBones: THREE.Bone[];
  readonly skeleton: THREE.Skeleton;
  readonly skinnedMeshes: THREE.SkinnedMesh[];
}

let sharedLoader: GLTFLoader | undefined;
const sharedTextures = new Map<string, Promise<THREE.Texture>>();

function loader(): GLTFLoader {
  sharedLoader ??= new GLTFLoader();
  return sharedLoader;
}

/**
 * Loads a pack's colour atlas once, however many characters use it.
 *
 * Every character in a pack shares one gradient atlas, so the preparation step
 * strips the embedded copies and this loads the single file instead — one
 * download and one GPU texture rather than one per character. It also keeps the
 * site's `connect-src 'self'` policy intact, which the loader's blob: fetch for
 * embedded imagery would otherwise trip over.
 */
function sharedTexture(url: string): Promise<THREE.Texture> {
  let pending = sharedTextures.get(url);
  if (pending === undefined) {
    pending = new THREE.TextureLoader().loadAsync(url).then((texture) => {
      // glTF samples with the origin at the top left and stores colour in sRGB.
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      return texture;
    });
    sharedTextures.set(url, pending);
  }
  return pending;
}

/**
 * Loads one skinned character and hands back the pieces the actor layer needs.
 *
 * Deliberately thin: it resolves the skin and its bones and does nothing else.
 * Turning those bones into a rig definition is a separate, pack-specific step,
 * and animating them is the shared runtime's job.
 *
 * Any animation clips in the file are ignored. This project drives imported
 * characters procedurally, and the shipped assets have had their clips stripped
 * at preparation time.
 */
export async function loadGltfCharacter(
  url: string,
  textureUrl?: string,
): Promise<LoadedGltfCharacter> {
  const gltf = await loader().loadAsync(url);
  const skinnedMeshes: THREE.SkinnedMesh[] = [];
  gltf.scene.traverse((object) => {
    if ((object as THREE.SkinnedMesh).isSkinnedMesh === true) {
      skinnedMeshes.push(object as THREE.SkinnedMesh);
    }
  });
  if (skinnedMeshes.length === 0) {
    throw new Error(`${url} contains no skinned mesh.`);
  }

  const skeleton = skinnedMeshes[0].skeleton;
  for (const mesh of skinnedMeshes) {
    if (mesh.skeleton !== skeleton) {
      throw new Error(
        `${url} has more than one skeleton; the actor rig expects a single skin per character.`,
      );
    }
    // Imported characters are lit by the same sun and sky as everything else.
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
  }

  if (textureUrl !== undefined) {
    const atlas = await sharedTexture(textureUrl);
    for (const mesh of skinnedMeshes) {
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const material of materials) {
        const standard = material as THREE.MeshStandardMaterial;
        standard.map = atlas;
        standard.needsUpdate = true;
      }
    }
  }

  return {
    scene: gltf.scene,
    skinBones: skeleton.bones.slice(),
    skeleton,
    skinnedMeshes,
  };
}

/** Releases the geometry and materials of a loaded character. */
export function disposeGltfCharacter(character: LoadedGltfCharacter): void {
  const materials = new Set<THREE.Material>();
  character.scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh !== true) {
      return;
    }
    mesh.geometry.dispose();
    if (Array.isArray(mesh.material)) {
      for (const material of mesh.material) {
        materials.add(material);
      }
    } else if (mesh.material) {
      materials.add(mesh.material);
    }
  });
  for (const material of materials) {
    // The colour atlas is deliberately not disposed: it is shared by every
    // character in the pack, so freeing it here would blank the ones still on
    // screen. It lives as long as the page does.
    material.dispose();
  }
  character.scene.removeFromParent();
}
