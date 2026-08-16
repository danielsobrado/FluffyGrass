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
    throw new Error(`[character-lifecycle] ${message}`);
  }
}

const materials = read("src/character/SnowflowCharacterMaterials.ts");
const geometry = read("src/character/SnowflowCharacterGeometry.ts");
const features = read("src/character/DrowCharacterFeatures.ts");
const character = read("src/character/SnowflowCharacter.ts");
const controller = read("src/controls/ThirdPersonController.ts");

assert(
  materials.includes('import { disposeResources } from "../render/ResourceDisposal"') &&
    materials.includes("const owned: THREE.MeshStandardMaterial[] = []") &&
    materials.includes("owned.push(material)") &&
    materials.includes("disposeResources(owned)") &&
    /function createMaterial\([\s\S]*?try \{[\s\S]*?applyActorEnvironmentResponse\(material\);[\s\S]*?return material;[\s\S]*?\} catch \(error\) \{[\s\S]*?disposeResources\(\[material\]\)/.test(
      materials,
    ),
  "Character material construction must own every created material and release partial sets without masking the setup failure.",
);

const costumeBuild = geometry.indexOf("addDrowCostumeGeometry(rig, materials, geometries)");
const scenePublication = geometry.indexOf("scene.add(root)", costumeBuild);
assert(
  geometry.includes('import { disposeResources } from "../render/ResourceDisposal"') &&
    geometry.includes("let rigInstance: ActorRigInstance | undefined") &&
    costumeBuild >= 0 &&
    scenePublication > costumeBuild &&
    geometry.includes("disposeResources([rigInstance, ...geometries, ...materialList])") &&
    geometry.includes("Character rig construction cleanup failed.") &&
    /function addMesh\([\s\S]*?geometries\.push\(geometry\);[\s\S]*?const mesh = new THREE\.Mesh\(geometry, material\)/.test(
      geometry,
    ),
  "Character rig construction must publish only after body/costume completion and track geometry before mesh attachment can fail.",
);

assert(
  /function addMesh\([\s\S]*?rig\.geometries\.push\(geometry\);[\s\S]*?const mesh = new THREE\.Mesh\(geometry, material\)/.test(
    features,
  ),
  "Drow feature geometry must enter rig ownership before mesh creation or attachment can fail.",
);

assert(
  character.includes("const resources = createSnowflowCharacterResources(") &&
    character.includes("function createSnowflowCharacterResources(") &&
    character.includes("const rig = buildSnowflowCharacter(scene, scale)") &&
    character.includes("disposeSafely(\"cloth construction\", () => cloth?.dispose())") &&
    character.includes("disposeSnowflowRig(rig)") &&
    character.includes("if (!this.disposed) {\n      this.profile.facts.crouched = crouched") &&
    character.includes("private disposed = false"),
  "Player-character orchestration must roll back post-rig failures and keep mutators inert after disposal.",
);

assert(
  controller.includes("const character = new SnowflowCharacter(") &&
    controller.includes("input = new ThirdPersonInput(canvas, profile, config)") &&
    controller.includes("character.dispose()") &&
    controller.includes('disposeControllerResource("Third-person input"') &&
    controller.includes('disposeControllerResource("Third-person character"') &&
    controller.includes("grassInteractionField.deactivate()") &&
    controller.includes("private disposed = false"),
  "Third-person controller construction and teardown must release character/input ownership independently.",
);

console.log(
  "[character-lifecycle] Materials, rig/feature publication, character resources, and controller ownership verified.",
);
