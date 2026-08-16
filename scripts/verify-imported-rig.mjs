import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const MODEL_DIRECTORY = resolve(REPOSITORY_ROOT, "public/models/skeletons");

function fail(message) {
  throw new Error(`[imported-rig] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
}

/** Reads the JSON chunk of a binary glTF. */
function readGlbJson(path) {
  const buffer = readFileSync(path);
  if (buffer.readUInt32LE(0) !== 0x46546c67) {
    fail(`${path} is not a binary glTF.`);
  }
  const jsonLength = buffer.readUInt32LE(12);
  return {
    json: JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8")),
    bytes: buffer.length,
  };
}

const binding = read("src/character/gltf/KayKitHumanoidBinding.ts");
const loader = read("src/character/gltf/GltfCharacterLoader.ts");

// Bones the binding resolves with requireIndex must exist in every shipped
// model, or the actor throws at load time in front of the player.
const REQUIRED_BONES = [
  "root",
  "hips",
  "chest",
  "head",
  "upperarm.l",
  "lowerarm.l",
  "wrist.l",
  "upperarm.r",
  "lowerarm.r",
  "wrist.r",
  "upperleg.l",
  "lowerleg.l",
  "foot.l",
  "upperleg.r",
  "lowerleg.r",
  "foot.r",
];
// Chain segments, as root -> mid -> end. Each hop must be a direct parent link
// with a positive rest length or the shared solver cannot use it.
const CHAINS = [
  ["upperleg.l", "lowerleg.l", "foot.l"],
  ["upperleg.r", "lowerleg.r", "foot.r"],
  ["upperarm.l", "lowerarm.l", "wrist.l"],
  ["upperarm.r", "lowerarm.r", "wrist.r"],
];

const models = readdirSync(MODEL_DIRECTORY).filter((entry) =>
  entry.toLowerCase().endsWith(".glb"),
);
assert(models.length > 0, "No prepared character models are present.");

let checkedChains = 0;
for (const model of models) {
  const path = resolve(MODEL_DIRECTORY, model);
  const { json, bytes } = readGlbJson(path);

  // The preparation step exists so the shipped asset carries neither the
  // pack's baked clips nor a per-model copy of the shared atlas.
  assert(
    (json.animations ?? []).length === 0,
    `${model} still carries ${(json.animations ?? []).length} baked animation clips; run scripts/prepare-character-assets.mjs.`,
  );
  assert(
    (json.images ?? []).length === 0 && (json.textures ?? []).length === 0,
    `${model} still embeds imagery, which the runtime would have to fetch back out through a blob: URL that connect-src refuses.`,
  );
  assert(
    bytes < 1_000_000,
    `${model} is ${(bytes / 1e6).toFixed(2)} MB; prepared characters are expected to stay well under 1 MB.`,
  );

  const nodes = json.nodes ?? [];
  const skins = json.skins ?? [];
  assert(skins.length === 1, `${model} must expose exactly one skin.`);
  const joints = skins[0].joints;
  const nameOf = new Map();
  for (const joint of joints) {
    nameOf.set(nodes[joint].name.toLowerCase(), joint);
  }
  for (const bone of REQUIRED_BONES) {
    assert(
      nameOf.has(bone),
      `${model} has no bone "${bone}", which the KayKit binding resolves as required.`,
    );
  }

  const parentOf = new Map();
  nodes.forEach((node, index) => {
    for (const child of node.children ?? []) {
      parentOf.set(child, index);
    }
  });
  for (const [rootName, midName, endName] of CHAINS) {
    const root = nameOf.get(rootName);
    const mid = nameOf.get(midName);
    const end = nameOf.get(endName);
    assert(
      parentOf.get(mid) === root,
      `${model}: ${midName} is not a direct child of ${rootName}, so the chain rest length would be wrong.`,
    );
    assert(
      parentOf.get(end) === mid,
      `${model}: ${endName} is not a direct child of ${midName}.`,
    );
    for (const [childName, child] of [
      [midName, mid],
      [endName, end],
    ]) {
      const translation = nodes[child].translation ?? [0, 0, 0];
      const length = Math.hypot(...translation);
      assert(
        length > 1e-6,
        `${model}: segment to ${childName} has no length, so it cannot be solved.`,
      );
      // The imported rigs run their limbs along +Y where this project's
      // procedural rigs run theirs along -Y. Chain axes are derived from the
      // bind offsets precisely so neither convention needs a special case; if
      // that ever stops holding, the derivation is what to fix.
      assert(
        translation[1] / length > 0.9,
        `${model}: segment to ${childName} no longer runs along +Y, so the imported axis assumption in the binding is stale.`,
      );
      checkedChains += 1;
    }
  }

  // Control rigs ship inside the joint list and must be excluded by the
  // binding rather than posed.
  const controlBones = [...nameOf.keys()].filter(
    (name) =>
      name.includes("ik") ||
      name.startsWith("control-") ||
      name.startsWith("handslot"),
  );
  assert(
    controlBones.length > 0,
    `${model} unexpectedly has no control bones; the exclusion rule may now be silently matching nothing.`,
  );
}

assert(
  binding.includes("isKayKitControlBone") &&
    binding.includes('boneName.includes("IK")') &&
    binding.includes('boneName.startsWith("control-")'),
  "The KayKit binding must keep excluding the pack's IK and control bones from the pose.",
);
assert(
  !loader.includes("AnimationMixer") && !loader.includes("gltf.animations"),
  "Imported characters are animated procedurally; the loader must not reach for baked clips.",
);
assert(
  loader.includes("sharedTextures") && loader.includes("flipY = false"),
  "The pack atlas must be shared across characters and sampled with the glTF orientation.",
);
assert(
  loader.includes("request.catch((error) =>") &&
    loader.includes("sharedTextures.get(url) === pending") &&
    loader.includes("sharedTextures.delete(url)"),
  "A failed shared atlas request must leave the cache retryable instead of pinning a rejected promise forever.",
);
assert(
  /const gltf = await loader\(\)\.loadAsync\(url\);[\s\S]*?try \{[\s\S]*?return \{[\s\S]*?skinnedMeshes,[\s\S]*?\};[\s\S]*?\} catch \(error\) \{[\s\S]*?disposeGltfScene\(gltf\.scene\)/.test(
    loader,
  ) &&
    loader.includes("const skeletons = new Set<THREE.Skeleton>()") &&
    loader.includes("skeletons.add(skinned.skeleton)") &&
    loader.includes("disposeResources([") &&
    loader.includes("...geometries") &&
    loader.includes("...materials") &&
    loader.includes("...skeletons"),
  "Failed imported-character validation or atlas loading must release scene geometry, materials, and skeleton GPU resources before rethrowing.",
);

console.log(
  `[imported-rig] ${models.length} prepared characters verified: clips and imagery stripped, required bones present, ${checkedChains} chain segments direct and +Y aligned, control bones excluded.`,
);
