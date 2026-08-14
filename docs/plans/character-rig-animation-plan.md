# Procedural Character Rig and Animation — Implementation Plan

## Status

- Target branch: `main`
- Scope: planning and implementation contract
- Current state: not started
- Character strategy: procedural geometry + real skeletal rig + procedural animation layers + targeted skinning + IK
- External DCC dependency: none required
- Deployment: manual GitHub Pages deployment; no GitHub Actions
- Goal: evolve the current procedural character into a production-quality articulated character capable of natural locomotion, crouching, hiding, rolling, spell casting, aiming, interacting, and future combat actions without turning `SnowflowCharacter` into a monolithic pose state machine.

## Product goal

The character must remain visually consistent with the existing stylized procedural world while gaining a real animation architecture.

The finished system must support:

- A true `THREE.Bone` hierarchy and `THREE.Skeleton`.
- Smooth, bounded articulation through shoulders, spine, hips, knees, elbows, wrists, neck, feet, and toes.
- Procedural locomotion that retains the current walk/run/jump visual identity.
- Terrain-aware foot placement and pelvis compensation.
- Crouch idle and crouch locomotion.
- A low stance suitable for hiding in tall grass.
- Dodge/evade rolling with controlled root movement and recovery.
- Upper-body action animation while locomotion continues underneath.
- One-hand and two-hand spell-casting poses.
- Arm IK toward dynamic spell or interaction targets.
- Head/look targeting.
- Hand, palm, weapon, back, chest, head, and spell-effect sockets.
- Simple hand/finger pose support for fist, open palm, point, grip, and casting shapes.
- Existing cape, skirt, and hair secondary motion integrated after primary skeletal posing.
- Stable behavior on desktop and compact/mobile profiles.
- Zero per-frame garbage from the animation hot path after initialization.
- Configuration-driven gameplay and animation tuning with validation.
- Static verification for rig structure, animation boundaries, and action transitions.

## Why the current architecture must change

The current character already has a useful articulated object hierarchy: pelvis, torso, neck, head, upper arms, forearms, wrists, thighs, shins, feet, cloak sections, skirt sections, and hair sections. That hierarchy made the first procedural walk/run/jump implementation fast and appropriate.

The limitation is that animation behavior is now concentrated in direct group rotations and state-specific pose equations. Continuing to add crouch, crouch-walk, roll, spell casting, aiming, interactions, attacks, blocks, swimming, and future abilities to the same pose method would create several problems:

- Locomotion and actions would overwrite each other.
- Every combined state would require another special case.
- Arm animation could not cleanly layer over walking.
- Foot placement would remain disconnected from actual terrain contact.
- A roll would mix gameplay movement, collision state, animation, and cape behavior in one method.
- Smooth joints would be difficult because rigid primitive pieces are only parented to pivot groups.
- Joint limits would remain implicit and inconsistent.
- Testing individual animation responsibilities would become difficult.

The target architecture therefore separates skeletal structure, pose generation, blending, IK, gameplay actions, and secondary motion.

## Architectural principles

1. **Preserve visual behavior before adding capability** — the first skeletal milestone must reproduce the existing idle/walk/run/jump behavior closely enough that the migration itself is not also an art-direction rewrite.
2. **One skeleton, multiple layers** — locomotion, actions, additives, IK, and secondary motion must not become separate competing rigs.
3. **Bones own articulation** — gameplay code must not directly rotate render meshes.
4. **Gameplay owns intent** — animation can represent a roll or spell, but controller/action code owns whether the action is allowed and how it affects movement.
5. **Procedural first** — do not require Blender, Mixamo, GLTF animation clips, or an offline asset pipeline to ship the first production system.
6. **Hybrid skinning** — use skinning where deformation matters and rigid bone attachments where it does not. Armor and accessories should not pay a skinning cost merely to follow a bone.
7. **Analytic IK over generic solvers** — use deterministic two-bone leg and arm IK rather than a general CCD/FABRIK system unless future requirements prove it necessary.
8. **Layered pose composition** — base locomotion, upper-body actions, additive motion, IK, and secondary motion are applied in a fixed documented order.
9. **Configuration driven** — tunable speeds, angles, durations, joint limits, blends, and action settings belong in validated configuration/tuning modules rather than being scattered through animation code.
10. **No frame allocations** — pose buffers, scratch quaternions, vectors, masks, and solver state are allocated once.
11. **Small modules** — each animation concern must remain independently testable and within the repository's architecture-size expectations.
12. **Manual deployment remains unchanged** — implementation must not introduce GitHub Actions.

## Non-goals for the first implementation

The following are explicitly outside the initial rig migration:

- A general-purpose animation editor.
- Motion capture support.
- Runtime retargeting between unrelated humanoid skeletons.
- A full inverse-kinematics framework for arbitrary chains.
- Physically simulated cloth for the cape or robe.
- Ragdoll physics.
- Enemy AI or a full stealth detection system.
- A complete combat system.
- Network replication.
- Importing a replacement humanoid model.
- Dozens of individually animated finger bones.

The architecture must leave room for these later without implementing them prematurely.

# 1. Target skeletal contract

## Coordinate convention

The rig must standardize the current world/character convention:

- `+Y` = up.
- `+Z` = character forward in local bind space.
- `+X` = character right.
- Left-side bones use negative local X offsets.
- Bone transforms are relative to the parent bone.
- Bind pose is a neutral standing pose, not a walk-cycle frame.
- Bone local forward/up conventions must be documented once and reused by IK and sockets.

Do not allow individual solvers to invent different axis assumptions.

## Required primary bones

The initial production skeleton should contain these semantic bones:

```text
characterRoot
└── pelvis
    ├── spineLower
    │   └── spineUpper
    │       └── chest
    │           ├── neck
    │           │   └── head
    │           ├── clavicle.L
    │           │   └── upperArm.L
    │           │       └── forearm.L
    │           │           └── hand.L
    │           └── clavicle.R
    │               └── upperArm.R
    │                   └── forearm.R
    │                       └── hand.R
    ├── thigh.L
    │   └── shin.L
    │       └── foot.L
    │           └── toe.L
    └── thigh.R
        └── shin.R
            └── foot.R
                └── toe.R
```

`characterRoot` remains the world-placement/root-motion object. It is not used as an anatomical bone.

## Optional hand bones

Do not begin with a full human hand skeleton. Add only the minimum required controls when spell and grip poses are implemented:

```text
hand.L
├── thumb.L
├── index.L
├── middle.L
└── fingers.L

hand.R
├── thumb.R
├── index.R
├── middle.R
└── fingers.R
```

The grouped `fingers` bone represents ring + little fingers initially.

## Secondary-motion hierarchy

Cape, hair, and skirt should remain separate from the primary locomotion skeleton contract. They may use bones or procedural deformers internally, but they must consume the final primary pose instead of influencing primary locomotion.

Recommended cape hierarchy if/when the current geometry deformation migrates to bones:

```text
capeRoot
├── capeBack.01
│   └── capeBack.02
│       └── capeBack.03
├── capeLeft.01
│   └── capeLeft.02
└── capeRight.01
    └── capeRight.02
```

The existing cape spring/deformation system should remain functional during the skeletal migration. Replacing it is not a prerequisite for the rig.

# 2. Bone IDs and runtime representation

## Stable bone IDs

Introduce a closed semantic bone identifier rather than passing arbitrary strings through hot paths.

Proposed module:

`src/character/rig/CharacterBoneId.ts`

Responsibilities:

- Define all production bone identifiers.
- Define a stable index for each animated bone.
- Provide display/debug names outside the hot path.
- Prevent spelling differences such as `leftUpperArm`, `upper_arm_l`, and `UpperArm.L` from creating multiple contracts.

Do not build a dynamic generic skeleton registry unless a real future requirement needs one.

## Character rig object

Proposed module:

`src/character/rig/CharacterRig.ts`

Responsibilities:

- Own `THREE.Bone` instances.
- Own `THREE.Skeleton`.
- Expose semantic bone lookup by `CharacterBoneId`.
- Expose bind-pose local transforms.
- Expose character sockets.
- Own rigid bone attachments.
- Own skinned meshes that share the skeleton.
- Dispose owned geometry/material resources safely.

It must not:

- Decide locomotion state.
- Read user input.
- Sample terrain.
- Execute IK.
- Implement spell effects.
- Implement cape dynamics.

# 3. Mesh strategy: hybrid rigid + skinned

## Keep rigid attachments where appropriate

The following should normally remain rigid meshes attached to the appropriate bone or socket:

- Shoulder armor.
- Belt components.
- Medallion/chest ornament.
- Bracers.
- Boots where deformation is not visible.
- Hood hardware.
- Weapon props.
- Future staff/sword/shield props.

This is cheaper and visually cleaner than skinning every accessory.

## Skin only geometry that benefits from deformation

Initial skinning candidates:

- Torso/tunic around the waist and shoulders.
- Upper/lower robe regions around pelvis/hips.
- Limb transition geometry where rigid cylinders currently expose disconnected joints.
- Optional shoulder/upper-arm cloth transition.

The goal is not one giant fully skinned mesh. Multiple small `THREE.SkinnedMesh` objects may share the same skeleton where that keeps procedural construction simple.

## Procedural skin-weight generation

Add:

`src/character/rig/CharacterSkinWeights.ts`

The weight generator should:

- Assign at most four influences per vertex.
- Prefer two influences for simple joint bands.
- Use deterministic distance/height bands around joints.
- Normalize every vertex weight set.
- Reject NaN/negative weights.
- Avoid weights on unrelated bones.
- Keep rigid regions at a single weight of 1.0.

Required verification:

- Every skinned vertex has total weight approximately `1.0`.
- No vertex references a bone outside the mesh's allowed influence set.
- No vertex has more than four non-zero influences.
- Bind pose reproduces the generated geometry without visible offset.

# 4. Joint limits

Create one joint-limit contract rather than clamping angles differently in every animation.

Proposed files:

- `src/character/rig/CharacterJointLimits.ts`
- `src/character/rig/CharacterRigTuning.ts`

The first implementation should define conservative limits for:

- Neck pitch/yaw/roll.
- Spine lower pitch/yaw/roll.
- Spine upper pitch/yaw/roll.
- Clavicle elevation/protraction.
- Shoulder pitch/yaw/roll.
- Elbow bend.
- Wrist pitch/yaw/roll.
- Hip pitch/yaw/roll.
- Knee bend.
- Ankle pitch/roll.
- Toe bend.

Joint-limit enforcement belongs after pose generation and before final application, or inside constrained IK where necessary.

The limits must be broad enough for rolling and casting; do not tune them only for walking.

# 5. Pose representation

## Pose buffer

Add:

`src/character/animation/CharacterPose.ts`

Use reusable indexed buffers rather than allocating object maps each frame.

A pose channel needs:

- Local rotation quaternion.
- Optional local translation for bones that legitimately translate, primarily pelvis/root.
- Weight/mask information supplied by the layer, not stored redundantly per bone if avoidable.

Required operations:

- Reset to bind pose.
- Copy.
- Blend two poses.
- Add an additive rotation/translation delta.
- Blend using a bone mask.
- Apply to rig.

The implementation must avoid Euler-angle interpolation. Pose blending uses quaternions.

## Bone masks

Add:

`src/character/animation/CharacterBoneMask.ts`

Required masks:

- Full body.
- Lower body.
- Upper body.
- Spine + arms.
- Left arm.
- Right arm.
- Head/neck.
- Hands.

Masks should be static immutable data, not rebuilt every frame.

# 6. Animation composition order

The production update order must be explicit and stable:

1. Resolve gameplay/action intent.
2. Generate base locomotion pose.
3. Blend locomotion state transitions.
4. Apply action layer using a bone mask.
5. Apply additive breathing/lean/look-prep motion.
6. Enforce pre-IK joint constraints where needed.
7. Apply pelvis/leg terrain IK.
8. Apply arm/interaction/spell IK.
9. Apply head/look IK.
10. Enforce final joint limits.
11. Apply pose to bones.
12. Update sockets/world matrices.
13. Apply cape/skirt/hair secondary motion.
14. Update effect systems attached to sockets.

No module may silently change this order.

# 7. Animation graph

Add:

`src/character/animation/CharacterAnimationGraph.ts`

The graph coordinates layers but should not contain the mathematical implementation of every pose.

## Base locomotion states

Initial base states:

- `idle`
- `walk`
- `run`
- `crouchIdle`
- `crouchWalk`
- `takeoff`
- `rise`
- `apex`
- `fall`
- `land`
- `roll`

Future states such as swim/climb must be addable without changing the pose-buffer abstraction.

## Action states

Initial action-layer states:

- `none`
- `spellWindup`
- `spellCharge`
- `spellRelease`
- `spellRecover`
- `interact`

Do not add melee states until a combat requirement exists.

## Transition requirements

Every transition defines:

- Source state(s).
- Destination state.
- Entry condition.
- Minimum residence time if required.
- Blend duration.
- Whether movement remains player-controlled.
- Whether the action may be interrupted.
- Whether upper-body actions survive the base-state transition.

Transition tuning belongs in validated configuration/tuning data.

# 8. Preserve current locomotion first

## Migration objective

Before implementing crouch or spells, port the existing visual behavior to the new pose/layer system.

The first skeletal locomotion implementation must reproduce:

- Idle breathing/bob.
- Walk gait.
- Run gait.
- Acceleration lean.
- Stride-driven arm opposition.
- Takeoff compression.
- Rise pose.
- Apex tuck.
- Fall pose.
- Landing compression and recovery.
- Slope alignment.
- Existing cape/hair response.

Do not redesign the gait during the migration unless a defect prevents the skeletal architecture.

## Proposed modules

- `src/character/animation/CharacterLocomotionLayer.ts`
- `src/character/animation/CharacterLocomotionTuning.ts`
- `src/character/animation/CharacterGait.ts`

`CharacterGait` owns stride phase and planted-foot phase semantics so grass interaction, foot IK, and visual leg motion can share the same gait timing rather than re-deriving unrelated phases.

# 9. State blending

All base-state changes must blend rather than snap.

Add:

`src/character/animation/CharacterPoseBlender.ts`

Requirements:

- Preserve the previous pose at transition start.
- Generate the destination pose continuously.
- Blend using normalized transition progress.
- Support easing curves from a small fixed set.
- Avoid restarting a blend when the destination state remains unchanged.
- Handle interruption by using the current blended pose as the new transition source.
- No allocation on interruption.

Initial recommended blend ranges should be tuned visually, not fixed in this document.

# 10. Terrain-aware leg IK

## Solver choice

Use an analytic two-bone solver for each leg.

Add:

- `src/character/ik/TwoBoneIk.ts`
- `src/character/ik/CharacterLegIk.ts`
- `src/character/ik/CharacterLegIkTuning.ts`

Do not introduce CCD/FABRIK for the legs.

## Foot target sampling

For each foot:

1. Resolve the animated foot's expected horizontal position.
2. Sample terrain height below/around that point.
3. Sample terrain normal.
4. Construct a desired ankle/foot target with sole clearance.
5. Determine whether the current gait phase considers the foot planted.
6. Blend IK strongly while planted and weakly/zero while swinging.
7. Solve hip and knee.
8. Align foot pitch/roll partially to the surface normal.
9. Apply toe adjustment only when useful.

## Pelvis compensation

Before solving individual legs:

- Determine whether either requested foot target would overextend its leg.
- Lower/raise pelvis within bounded limits so both legs remain feasible.
- Smooth pelvis correction over time.
- Never allow IK compensation to create vertical jitter from terrain micro-noise.

A small spatial/temporal filter is acceptable. Do not resample terrain excessively per frame.

## IK acceptance criteria

- Standing on a slope: both feet contact terrain without obvious penetration.
- One foot on higher terrain: corresponding knee bends naturally.
- Walking uphill/downhill: planted feet do not skate excessively.
- Running: IK fades enough to preserve the authored/procedural gait.
- Jumping/falling: ground IK is disabled until landing contact becomes relevant.
- No knee inversion.
- No leg stretch beyond configured tolerance.
- No visible frame-to-frame ankle jitter on normal terrain.

# 11. Crouch and hiding stance

## Gameplay stance

Introduce an explicit stance independent from animation state:

```text
standing
crouched
```

Future prone states are not required.

Proposed module:

`src/character/actions/CharacterStance.ts`

The controller/action layer owns stance intent. The animation graph consumes it.

## Crouch pose requirements

A correct crouch must coordinate:

- Pelvis down and slightly back.
- Hip flexion.
- Knee flexion.
- Ankle compensation.
- Torso forward lean.
- Spine compensation so the head remains readable.
- Clavicle/shoulder relaxation.
- Reduced vertical head height.
- Feet remaining planted through IK.

Do not implement crouch by translating only the root/pelvis.

## Crouch locomotion

Crouch walk must:

- Use a shorter stride.
- Reduce gait frequency/speed appropriately.
- Keep knees bent throughout the cycle.
- Reduce arm swing.
- Keep center of mass low.
- Preserve foot IK.
- Transition smoothly to/from standing locomotion.

## Hiding support

The rig phase only needs to expose useful character data for future stealth logic:

- Current stance.
- Approximate head height.
- Approximate body visibility height.
- Whether the character is moving.

A later stealth system may compare those values with grass/cover height. Enemy awareness logic is out of scope.

# 12. Roll/dodge action

## Responsibility split

Animation alone must not move the gameplay character independently of the controller.

Add:

- `src/character/actions/CharacterRollAction.ts`
- `src/character/actions/CharacterActionState.ts`

The roll action should expose a normalized action phase and desired movement profile. The third-person controller applies approved root displacement to gameplay position.

## Roll phases

Recommended semantic phases:

1. `anticipation`
2. `compression`
3. `launch`
4. `rotation`
5. `recovery`

Durations are tuning values.

## Roll pose requirements

During the roll:

- Pelvis lowers before launch.
- Spine curls.
- Head tucks.
- Knees draw toward the torso.
- Arms protect the head/chest rather than remaining in locomotion swing.
- Root orientation follows the roll direction.
- Recovery plants feet before returning full movement control.
- Cape motion receives a roll/action impulse or strongly damped fold target rather than clipping through the whole body.

## Gameplay requirements

- Roll direction is captured at action start.
- Direction does not oscillate with later input.
- Movement distance is deterministic from config.
- Steering during the roll is either disabled or deliberately bounded.
- Roll cannot start while already rolling.
- Roll cannot start in incompatible airborne states unless explicitly designed later.
- Camera remains stable and does not inherit the visual body's full somersault rotation.
- Character world root must not rotate the camera upside down.

No invulnerability frames are required by the rig plan; that belongs to future combat design.

# 13. Upper-body action layer

Add:

`src/character/animation/CharacterActionLayer.ts`

This layer must be able to animate chest/spine/clavicles/arms/hands while the lower body continues locomotion.

Examples:

- Walk while charging a spell.
- Stand while two-hand casting.
- Crouch while holding a readied spell.
- Aim one hand while the opposite arm remains relaxed.

The layer uses masks; it must not manually restore leg pose values after modifying them.

# 14. Spell-casting architecture

## Spell animation is target driven

The rig should not hardcode one spell visual effect. It should expose animation intent:

```text
castMode
castProgress
primaryHandTarget
secondaryHandTarget
lookTarget
spellDirection
chargeAmount
releasePulse
```

Proposed modules:

- `src/character/actions/CharacterSpellAction.ts`
- `src/character/animation/CharacterSpellPose.ts`
- `src/character/animation/CharacterSpellTuning.ts`

## Initial cast modes

Implement only enough modes to prove the architecture:

- `oneHand`
- `twoHand`

Future weapon/staff modes must not require changing the pose buffer.

## Spell phases

Recommended semantic phases:

1. `windup`
2. `charge`
3. `release`
4. `recover`

`charge` may be held for a bounded or gameplay-controlled duration.

## Spell pose behavior

One-hand cast:

- Chest turns partly toward target.
- Casting clavicle follows shoulder elevation.
- Upper arm aims generally toward the target.
- Elbow maintains a natural bend using IK pole control.
- Hand/palm points toward the spell target.
- Opposite arm uses a supporting or balanced pose.
- Head looks toward target within neck limits.

Two-hand cast:

- Both clavicles participate.
- Chest/spine carry more of the turn.
- Hands converge around a configurable spell center.
- Elbows remain separated enough to avoid collapsing into the torso.
- Release may add a short additive recoil/expansion.

# 15. Arm IK

Add:

`src/character/ik/CharacterArmIk.ts`

Reuse the generic analytic `TwoBoneIk` primitive where possible.

Requirements:

- Shoulder origin comes from the final chest/clavicle pose.
- Hand target may be world- or character-local and is resolved once.
- Elbow pole direction is explicitly controlled to prevent elbow flipping.
- Arm reach is clamped to feasible length.
- Clavicle contributes to large reaches before the elbow/shoulder is forced to limits.
- IK blend can be less than 1.0 so procedural spell pose and target correction combine naturally.
- Left and right arms solve independently.

Acceptance criteria:

- Hand can target points above, below, left, right, and forward within reasonable reach.
- Elbow does not suddenly flip at the centerline.
- Shoulder does not detach visually from torso.
- Walking continues under an upper-body cast.
- A moving target does not cause visible one-frame snapping.

# 16. Look IK

Add:

`src/character/ik/CharacterLookIk.ts`

Distribute look rotation across:

- `spineUpper` small contribution.
- `neck` medium contribution.
- `head` final contribution.

Requirements:

- Clamp yaw/pitch.
- Smooth target acquisition and release.
- Disable or reduce look IK during roll phases where the body pose should dominate.
- Allow spell actions to provide a high-priority look target.
- Idle look behavior may be added later; do not invent random head motion in the first implementation.

# 17. Character sockets

Add:

`src/character/rig/CharacterSockets.ts`

Required initial sockets:

- `hand.L`
- `hand.R`
- `palm.L`
- `palm.R`
- `weapon.L`
- `weapon.R`
- `backWeapon`
- `chest`
- `head`
- `spellOrigin`

Sockets are reusable `THREE.Object3D`/`THREE.Group` attachments parented to bones.

Effect/render systems receive socket world transforms rather than querying arbitrary bone geometry.

The spell system must not depend on the character mesh implementation to find a palm position.

# 18. Hand poses

Add:

`src/character/animation/CharacterHandPose.ts`

Initial semantic poses:

- `relaxed`
- `fist`
- `open`
- `point`
- `grip`
- `cast`

Hand poses should be parameterized/blendable rather than six unrelated hard switches where practical.

Finger articulation is applied after arm IK so the hand orientation is stable first.

# 19. Secondary motion integration

## Cape

Keep `CapeMotion` as the production cape system during the rig migration.

Refactor only its input contract if necessary so it can consume:

- Character local velocity.
- Vertical velocity.
- Acceleration/turning.
- Grounded/airborne state.
- Landing impact.
- Roll phase.
- Crouch/stance.

During roll:

- Reduce uncontrolled outward spread.
- Bias cloth toward the body during the tightest rotation.
- Add recovery impulse as the character stands.

Do not replace the cape with expensive cloth physics.

## Hair

Hair remains spring-driven and follows the final head transform.

## Skirt/robe

Skirt sections should respond to:

- Leg pose.
- Crouch amount.
- Horizontal speed.
- Vertical velocity.
- Roll phase.

The robe must not remain in a standing silhouette while knees are deeply crouched.

# 20. Controller and gameplay integration

## Keep `ThirdPersonController` focused

Do not put pose equations into the controller.

The controller should eventually own/coordinate only:

- Movement intent.
- Jump intent.
- Stance intent.
- Action requests.
- World position/velocity.
- Terrain collision/grounding.
- Camera behavior.

A dedicated character action coordinator should resolve whether crouch, roll, or spell actions are active.

Recommended modules:

- `src/character/actions/CharacterActionController.ts`
- `src/character/actions/CharacterActionConfig.ts`

## Animation input snapshot

Replace an ever-growing positional parameter list with a stable snapshot consumed by `SnowflowCharacter`/animation graph.

It should contain only runtime facts needed by animation, for example:

```text
position
velocity
facing
groundNormal
grounded
speed
runSpeed
acceleration
distanceTravelled
verticalVelocity
jumpStarted
landed
landingImpact
stance
rollState
spellState
lookTarget
```

Do not pass raw input devices into character animation.

# 21. Camera behavior for new actions

Crouch:

- Camera target lowers smoothly with effective head/torso height.
- Do not instantly snap the camera down on stance toggle.

Roll:

- Camera follows gameplay root, not the visual body's somersault orientation.
- Apply only a bounded optional action offset if testing proves it improves readability.
- Prevent camera-terrain collision exactly as normal movement does.

Spell casting:

- No forced cinematic camera in the first implementation.
- Optional mild look-target assistance may be added later through explicit gameplay requirements.

# 22. Input integration

Input bindings are implemented only after the underlying action is functional and testable from a development hook.

Recommended semantic input actions:

- `toggleCrouch` or `holdCrouch` — choose one behavior deliberately.
- `roll`
- `castPrimary`
- `castSecondary` only when there is a second gameplay spell requirement.

Desktop and touch input must map to the same semantic action API.

Do not couple animation code to keyboard key codes or DOM buttons.

# 23. Configuration plan

Gameplay-visible tuning belongs in `public/config/world.yaml` with schema validation when it is genuinely product tuning.

Likely future world config values include:

```yaml
# Character stance/action gameplay tuning.
characterCrouchSpeedMultiplier: ...
characterCrouchTransitionTime: ...
characterRollDistance: ...
characterRollDuration: ...
characterRollRecoveryTime: ...
characterSpellWindupTime: ...
characterSpellReleaseTime: ...
characterSpellRecoveryTime: ...
```

Low-level implementation constants that are not expected to be product tuning belong in dedicated `*Tuning.ts` modules rather than YAML.

Examples:

- Numerical epsilons.
- Solver iteration-free thresholds.
- Bone-name/index layout.
- Static mask definitions.
- Fixed coordinate conventions.

Every new YAML field must update:

- `WorldConfig`.
- `WORLD_CONFIG_SCHEMA`.
- Cross-field validation if needed.
- `public/config/world.yaml`.
- Config contract verification.

# 24. Proposed source layout

Target organization:

```text
src/character/
  SnowflowCharacter.ts

  rig/
    CharacterBoneId.ts
    CharacterRig.ts
    CharacterRigBuilder.ts
    CharacterRigTuning.ts
    CharacterJointLimits.ts
    CharacterSkinWeights.ts
    CharacterSockets.ts

  animation/
    CharacterPose.ts
    CharacterBoneMask.ts
    CharacterPoseBlender.ts
    CharacterAnimationGraph.ts
    CharacterLocomotionLayer.ts
    CharacterLocomotionTuning.ts
    CharacterGait.ts
    CharacterActionLayer.ts
    CharacterSpellPose.ts
    CharacterSpellTuning.ts
    CharacterHandPose.ts

  ik/
    TwoBoneIk.ts
    CharacterLegIk.ts
    CharacterLegIkTuning.ts
    CharacterArmIk.ts
    CharacterLookIk.ts

  actions/
    CharacterActionState.ts
    CharacterActionConfig.ts
    CharacterActionController.ts
    CharacterStance.ts
    CharacterRollAction.ts
    CharacterSpellAction.ts

  secondary/
    CapeMotion.ts
    CapeMotionGeometry.ts
    CapeMotionTuning.ts
```

Existing files may be moved incrementally rather than in one large rename commit. Avoid churn that makes functional changes harder to review.

# 25. Migration strategy

The migration must remain bisectable and visually testable after every phase.

Do not perform a flag-day rewrite.

## Compatibility bridge

During early phases:

- Keep the public `SnowflowCharacter.update(...)` contract stable where practical.
- Build the new skeleton behind the existing character facade.
- Keep current cape/hair systems connected.
- Port one responsibility at a time.
- Delete old pivot/group animation only after equivalent skeletal behavior is active and verified.

A temporary migration adapter is acceptable if it has an explicit TODO and is removed by the cleanup phase.

# 26. Implementation phases

## Phase 0 — Baseline and regression contract

**Status:** pending

### Work

- Capture current rig hierarchy and important local transforms.
- Record current character dimensions: total height, shoulder width, hip width, arm lengths, leg lengths, foot dimensions.
- Record current locomotion state thresholds and landing/takeoff timing.
- Add a static character-rig verification script before restructuring.
- Add deterministic pose-snapshot checks for representative locomotion inputs.
- Define performance baseline on compact/mobile and desktop.

### Files

- Add `scripts/verify-character-rig.mjs` or equivalent TypeScript verifier.
- Extend `package.json` build verification chain manually; no GitHub Actions.

### Acceptance gate

- Existing build/tests pass.
- Baseline verifier can detect a missing arm/leg joint.
- Current visual behavior remains unchanged.

---

## Phase 1 — Real skeleton and semantic rig

**Status:** pending

### Work

- Create `CharacterBoneId`.
- Build the `THREE.Bone` hierarchy.
- Create `THREE.Skeleton`.
- Reattach current rigid procedural body pieces to semantic bones without changing appearance.
- Add clavicles, lower/upper spine, chest, neck, and toes even if initial animation leaves some at bind pose.
- Add socket infrastructure.

### Acceptance gate

- Character looks substantially identical in bind/idle pose.
- Every required bone exists exactly once.
- Bone hierarchy verifier passes.
- Existing cape/hair/skirt attachments still follow the character.
- No per-frame allocations introduced.

---

## Phase 2 — Pose buffers and locomotion port

**Status:** pending

### Work

- Add reusable pose buffers.
- Add quaternion blending.
- Add bone masks.
- Port current idle/walk/run/takeoff/rise/apex/fall/land math to `CharacterLocomotionLayer`.
- Make `SnowflowCharacter` orchestrate rather than directly calculate every bone rotation.
- Keep existing gait timing initially.

### Acceptance gate

- Existing locomotion states visually match the pre-rig baseline closely.
- No direct render-mesh rotations remain in locomotion code.
- All animation goes through semantic bones/pose buffers.
- Jump/cape behavior remains intact.

---

## Phase 3 — Animation graph and state blending

**Status:** pending

### Work

- Add the animation graph.
- Add transition blending.
- Move locomotion state selection out of raw pose generation.
- Ensure interrupted transitions continue from current blended pose.
- Add architecture verifier rules preventing `SnowflowCharacter` from regrowing into a pose monolith.

### Acceptance gate

- Idle↔walk↔run transitions are smooth.
- Landing recovery blends cleanly to idle/walk/run.
- Rapid direction/speed changes do not cause pose snapping.
- No large per-frame object churn.

---

## Phase 4 — Foot IK and pelvis compensation

**Status:** pending

### Work

- Add analytic two-bone solver.
- Add per-foot terrain targets.
- Share gait plant phase.
- Add pelvis height compensation.
- Add foot normal alignment.
- Add smoothing appropriate for terrain micro-detail.

### Acceptance gate

- Standing/walking on representative slopes looks grounded.
- Feet do not visibly penetrate normal terrain.
- Knees do not flip.
- Running remains visually energetic rather than over-constrained.
- IK automatically disables while airborne.

---

## Phase 5 — Targeted skinning and joint quality

**Status:** pending

### Work

- Identify the most visibly rigid joint transitions after real articulation exists.
- Add procedural skin weights to those regions only.
- Improve shoulder/hip/elbow/knee geometry where the new motion range exposes gaps.
- Keep armor/accessories rigid.

### Acceptance gate

- Crouch-ready knee/hip range does not expose unacceptable gaps.
- Raised arms do not visibly disconnect shoulders.
- Skin weights validate.
- Character remains within mobile performance budget.

---

## Phase 6 — Crouch and crouch locomotion

**Status:** pending

### Work

- Add stance state.
- Add crouch pose parameter.
- Add crouch idle.
- Add crouch walk.
- Integrate feet/pelvis IK.
- Add camera target height transition.
- Add controller speed multiplier.
- Add input only after development controls prove animation behavior.

### Acceptance gate

- Character can enter/exit crouch while idle and moving.
- Feet stay grounded.
- Head/body visibly lower enough for cover gameplay.
- Crouch does not look like a vertically scaled standing animation.
- Mobile control remains usable.

---

## Phase 7 — Roll/dodge

**Status:** pending

### Work

- Add action controller/state.
- Add deterministic roll phases.
- Add root-displacement profile owned by gameplay action/controller.
- Add curled skeletal roll pose.
- Decouple camera orientation from visual body rotation.
- Add cape/skirt roll response.
- Add roll input after the action API is stable.

### Acceptance gate

- Roll distance/duration are deterministic.
- Roll works from idle/walk/run.
- Camera remains readable.
- Character returns to locomotion without snapping.
- Cape does not explode outward or obviously clip through the body for most of the roll.

---

## Phase 8 — Upper-body layering

**Status:** pending

### Work

- Add upper-body action mask/layer.
- Demonstrate a non-spell test pose while walking/running/crouching.
- Verify locomotion legs remain untouched.
- Add chest/clavicle contribution.

### Acceptance gate

- Upper body can animate independently while lower body continues locomotion.
- State transitions do not erase active upper-body actions.
- Layering remains deterministic and testable.

---

## Phase 9 — Arm IK, look IK, sockets

**Status:** pending

### Work

- Implement arm IK with elbow poles.
- Implement clavicle participation.
- Implement look IK.
- Finalize required sockets.
- Add debug visualization for hand targets, elbow poles, foot targets, and socket axes behind a development-only flag.

### Acceptance gate

- Both hands can track moving targets without elbow flipping.
- Head tracks target within limits.
- Socket transforms are stable and correct after animation/IK.
- Debug visualization has no production cost when disabled.

---

## Phase 10 — Spell casting

**Status:** pending

### Work

- Add spell action phases.
- Add one-hand cast.
- Add two-hand cast.
- Add open/cast hand poses.
- Drive palm/spell origin sockets.
- Expose release pulse/event for a separate spell-effect system.
- Support casting while idle and walking first; evaluate crouch casting afterward.

### Acceptance gate

- One-hand and two-hand casts read clearly from front/back/side.
- Hands aim at target through IK.
- Locomotion continues under compatible cast modes.
- Spell effects can attach to sockets without knowing bone geometry.
- Animation action emits one deterministic release event per cast.

---

## Phase 11 — Hand articulation and interaction foundation

**Status:** pending

### Work

- Add minimal finger bones.
- Add relaxed/fist/open/point/grip/cast poses.
- Add interaction reach target through arm IK.
- Prove gripping a simple procedural prop/socket attachment.

### Acceptance gate

- Hand silhouettes visibly differ by pose.
- Grip pose can hold a prop without arbitrary prop-specific offsets in animation code.
- Finger complexity remains small and performant.

---

## Phase 12 — Secondary-motion polish

**Status:** pending

### Work

- Tune cape for crouch/roll/casting.
- Tune skirt for deep knee/hip bends.
- Tune hair for aggressive action motion.
- Ensure secondary motion consumes final skeletal pose/action facts.
- Add secondary-motion reset behavior for teleport/reset.

### Acceptance gate

- Crouch and roll do not leave cloth in a standing pose.
- Teleport/reset produces no delayed cloth explosion.
- Casting arm motion and cape motion do not fight each other.

---

## Phase 13 — Performance, verification, and cleanup

**Status:** pending

### Work

- Profile animation CPU cost on compact/mobile and desktop.
- Confirm no per-frame allocations in steady locomotion/action updates.
- Confirm shared skeleton/skinned-mesh matrix updates are bounded.
- Remove migration adapters and obsolete group-pose code.
- Split any file that violates architecture-size rules.
- Expand `verify-character-motion` or replace it with focused rig/animation/action verifiers.
- Update this plan's status section and phase checkboxes.
- Manual visual regression test on GitHub Pages build.

### Acceptance gate

- Full production build passes.
- Character verifier passes.
- Config verifier passes.
- Architecture verifier passes.
- Motion verifier passes.
- Desktop and compact/mobile remain within reviewed performance budget.
- No deprecated parallel character pose path remains.

# 27. Verification plan

## Static rig verification

The verifier should assert:

- Every required primary bone exists once.
- Bone parent relationships match the declared hierarchy.
- No required bone has zero/NaN scale.
- Limb segment lengths are positive and within expected ranges.
- Left/right limb lengths remain approximately symmetric unless deliberately changed.
- Socket parents are correct.
- Joint limits are finite and ordered.
- Pose buffer size matches the bone ID count.

## Skinning verification

Assert:

- Skin index values are valid integers within the skeleton.
- Skin weights are finite and non-negative.
- Weight sums are approximately one.
- Maximum active influences per vertex is four.
- Rigid regions remain rigid where specified.

## Animation verification

Create deterministic test snapshots for:

- Idle.
- Mid-walk left-foot plant.
- Mid-walk right-foot plant.
- Full run.
- Takeoff compression.
- Apex.
- Fall.
- Full landing impact.
- Crouch idle.
- Crouch walk.
- Mid-roll.
- One-hand cast at forward target.
- Two-hand cast at elevated target.

Assertions should test invariants rather than fragile exact floating-point art values where possible.

Examples:

- Knees bend in the correct direction.
- Crouch pelvis/head is lower than standing.
- Roll torso/head is tucked relative to standing.
- Casting hand points approximately toward target.
- Opposite locomotion arms remain phase-opposed.
- Joint limits are never exceeded after final solve.

## Runtime visual matrix

Manual checks must include:

- Front view.
- Rear view.
- Left/right side views.
- Flat ground.
- Moderate uphill/downhill.
- Uneven terrain under each foot.
- Idle/walk/run transitions.
- Jump from idle.
- Jump while running.
- Land and immediately move.
- Crouch while idle.
- Crouch while moving.
- Stand while moving.
- Roll from idle/walk/run.
- Roll near slope changes.
- Cast while idle.
- Cast while walking.
- Cast at target above/below the character.
- Rapid action cancellation where allowed.
- Reset/teleport during normal movement and after actions.

# 28. Performance contract

The character is a single important hero object, so correctness and visual quality matter more than micro-optimizing every quaternion. The system must still obey these rules:

- Allocate bones, pose buffers, masks, solver scratch objects, and socket objects once.
- No new arrays/maps/object literals in steady-state `update` methods.
- No string-based bone lookup in the per-frame hot path.
- No generic iterative IK for two-bone limbs.
- Avoid recomputing world matrices multiple times inside separate solvers; establish a deliberate update boundary.
- Terrain foot sampling must be bounded and must reuse existing terrain APIs efficiently.
- Debug helpers must be disabled and non-updating in production.
- Skin only the geometry that needs deformation.
- Keep cape/cloth procedural and bounded.

Measure before introducing caching that complicates code.

# 29. Failure and reset behavior

All animation/action state must reset cleanly after:

- Character reset.
- Teleport.
- Mode switch if the character is deactivated.
- Invalid/NaN external target.
- Lost spell target.
- Interrupted action.

Reset must:

- Clear action state.
- Clear blend history.
- Restore bind/idle-compatible pose.
- Reset IK filters.
- Reset cape/hair/skirt springs.
- Update socket transforms before effects resume.

No solver may retain a stale world-space target after teleport.

# 30. Logging and error policy

Production code should not spam animation diagnostics every frame.

Use errors for initialization contract failures such as:

- Missing required bone.
- Invalid skeleton index.
- Impossible config/joint-limit range.
- Invalid skin-weight construction.

Use development-only diagnostics for:

- Current locomotion/action state.
- IK target visualization.
- Joint-limit hits.
- Pose-layer weights.

Do not silently continue with a malformed skeleton.

# 31. Refactoring constraints

During implementation:

- Keep `SnowflowCharacter` as a facade/orchestrator.
- Keep geometry generation independent from gameplay action decisions.
- Keep IK independent from DOM/input.
- Keep action state independent from Three.js render geometry.
- Keep spell visuals/effects separate from spell body animation.
- Keep cape/hair/skirt secondary motion separate from locomotion pose generation.
- Do not create a general engine framework unless more than the character needs it.
- Prefer composition over inheritance.
- Remove obsolete code once the replacement is verified.

# 32. Expected end-state responsibilities

## `SnowflowCharacter`

Should eventually do little more than:

1. Receive an animation input snapshot.
2. Ask the animation graph for the primary pose.
3. Apply IK/layers through the graph pipeline.
4. Apply the final pose to the rig.
5. Update secondary motion.
6. Expose state/sockets needed by the app.
7. Dispose resources.

It should not contain several hundred lines of per-state limb equations.

## `ThirdPersonController`

Should own:

- Movement and grounding.
- Jump physics.
- Gameplay root position.
- Camera.
- Semantic action requests.

It should not own:

- Elbow angles.
- Knee pose equations.
- Spell hand positions.
- Cape geometry deformation.

## Animation graph

Should own:

- State selection from animation facts.
- Pose layer order.
- Transition blending.
- Action masks.
- Solver orchestration.

It should not own:

- Keyboard/touch state.
- Terrain generation internals.
- Spell particle rendering.

# 33. Definition of done

The character-rig project is complete when all of the following are true:

- [ ] Current procedural character appearance is preserved or deliberately improved.
- [ ] Character uses a real semantic bone hierarchy.
- [ ] Skeleton structure is statically verified.
- [ ] Current idle/walk/run/jump/land behavior is ported to pose layers.
- [ ] Locomotion state transitions blend smoothly.
- [ ] Feet use terrain-aware IK with pelvis compensation.
- [ ] Targeted skinning removes the worst rigid-joint artifacts.
- [ ] Character can crouch and crouch-walk.
- [ ] Crouch exposes useful low-profile data for future hiding logic.
- [ ] Character can perform a deterministic dodge roll.
- [ ] Camera remains stable during roll.
- [ ] Upper-body actions layer over locomotion.
- [ ] Both arms support target-driven IK.
- [ ] Head/look IK works within joint limits.
- [ ] Character exposes stable hand/palm/chest/head/spell sockets.
- [ ] Character supports one-hand and two-hand spell-casting poses.
- [ ] Minimal hand/finger poses support open/fist/point/grip/cast silhouettes.
- [ ] Cape, skirt, and hair respond correctly to crouch/roll/cast actions.
- [ ] Reset/teleport clears animation and solver state safely.
- [ ] Animation hot path produces no meaningful steady-state garbage.
- [ ] Desktop performance remains acceptable.
- [ ] Compact/mobile performance remains acceptable.
- [ ] Full repository build and static verification pass.
- [ ] Obsolete direct-pivot pose implementation is removed.
- [ ] This plan is updated with final implementation status.

# 34. Recommended implementation order for commits

Keep commits small enough to review and revert independently. A practical sequence is:

1. `test(character): establish rig and pose regression baseline`
2. `refactor(character): add semantic skeletal rig`
3. `refactor(character): add pose buffers and masks`
4. `refactor(character): port procedural locomotion to pose layer`
5. `feat(character): add animation transition blending`
6. `feat(character): add analytic leg IK and pelvis compensation`
7. `feat(character): improve procedural joint skinning`
8. `feat(character): add crouch stance and crouch locomotion`
9. `feat(character): add roll action and root-motion profile`
10. `feat(character): add upper-body animation layer`
11. `feat(character): add arm and look IK`
12. `feat(character): add semantic sockets`
13. `feat(character): add procedural spell-casting poses`
14. `feat(character): add minimal hand articulation`
15. `polish(character): integrate secondary motion with actions`
16. `test(character): expand action and IK verification`
17. `refactor(character): remove migration pose path`
18. `perf(character): profile and remove verified hot-path waste`
19. `docs(character): mark rig plan complete`

Do not combine all phases into one commit.

# 35. First implementation checkpoint

The first coding checkpoint should stop after **Phase 2** if necessary.

At that point the project should already have:

- A real skeleton.
- Semantic bone IDs.
- A pose buffer.
- Bone masks.
- Existing locomotion running through the new system.
- Existing cape/hair behavior intact.
- No crouch/roll/spell features yet.

That checkpoint proves the foundation before action complexity is added.

The second major checkpoint should stop after **Phase 6**:

- Smooth animation graph.
- Foot IK.
- Targeted skinning.
- Crouch/crouch walk.

The third major checkpoint should stop after **Phase 10**:

- Roll.
- Layered upper-body actions.
- Arm/look IK.
- Sockets.
- Spell casting.

This sequencing prevents feature work from hiding architectural defects in the rig foundation.
