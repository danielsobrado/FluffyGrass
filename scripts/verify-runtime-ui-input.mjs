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
    throw new Error(`[runtime-ui-input] ${message}`);
  }
}

const main = read("src/main.ts");
const hud = read("src/runtime/AnimationBlendingHud.ts");
const input = read("src/controls/ThirdPersonInput.ts");
const controller = read("src/controls/ThirdPersonController.ts");
const joystick = read("src/controls/MobileJoystick.ts");
const fly = read("src/controls/FlyController.ts");

assert(
  main.includes('const animationHudEnabled = params.get("diagnostics") === "1"') &&
    main.includes("if (character && animationHudEnabled)") &&
    main.includes("let detachObserver: (() => void) | undefined") &&
    main.indexOf("animationHud = {") < main.indexOf("hud.attachCharacter(character)"),
  "The skeletal blending HUD must stay diagnostics-only and publish its cleanup owner before attachment can fail.",
);
assert(
  /try \{[\s\S]*?document\.body\.appendChild\(this\.container\);[\s\S]*?this\.bindEvents\(\);[\s\S]*?\} catch \(error\) \{[\s\S]*?window\.removeEventListener\("keydown", this\.handleKeyDown\);[\s\S]*?this\.container\.remove\(\);[\s\S]*?throw error;/.test(
    hud,
  ) &&
    hud.includes("Crouch: C · Dodge roll: R") &&
    !hud.includes("this.character.setCrouch(") &&
    !hud.includes("this.character.triggerRoll(") &&
    hud.includes("this.character?.clearLookTarget()"),
  "The diagnostics HUD must roll back failed publication and keep gameplay crouch/roll actions owned by the real controller/input path.",
);

const bootstrapTry = main.indexOf("  try {");
const uiInitialize = main.indexOf("uiController.initialize()", bootstrapTry);
const bootstrapCatch = main.indexOf("  } catch (error) {", bootstrapTry);
assert(
  bootstrapTry >= 0 && uiInitialize > bootstrapTry && uiInitialize < bootstrapCatch,
  "UI initialization must run inside bootstrap's cleanup transaction.",
);

const setJumpStart = input.indexOf("const setJump = (");
const setSprintStart = input.indexOf("const setSprint = (", setJumpStart);
const jumpSource = input.slice(setJumpStart, setSprintStart);
const sprintSource = input.slice(setSprintStart, input.indexOf("document.body.appendChild(controls)", setSprintStart));
assert(
  setJumpStart >= 0 &&
    setSprintStart > setJumpStart &&
    jumpSource.indexOf("button.setPointerCapture(event.pointerId)") >= 0 &&
    jumpSource.indexOf("button.setPointerCapture(event.pointerId)") <
      jumpSource.indexOf("this.mobileJumpHeld = active") &&
    sprintSource.indexOf("button.setPointerCapture(event.pointerId)") >= 0 &&
    sprintSource.indexOf("button.setPointerCapture(event.pointerId)") <
      sprintSource.indexOf("this.mobileSprint = active"),
  "Mobile JUMP/RUN held state must not publish before pointer capture succeeds.",
);

assert(
  controller.includes(
    "if (this.input.consumeJump() && !this.character.isRolling())",
  ) &&
    /this\.jumpBufferRemaining = 0;[\s\S]*?this\.jumpHoldRemaining = 0;[\s\S]*?this\.character\.triggerRoll\(\)/.test(
      controller,
    ),
  "Rolls must take precedence over same-frame or active-roll jump requests so action triggers cannot remain queued across landing.",
);

assert(
  controller.includes("private coyoteJumpAvailable = true") &&
    /if \(wasGrounded\) \{[\s\S]*?this\.coyoteJumpAvailable = true;/.test(
      controller,
    ) &&
    /const canUseCoyoteTime =[\s\S]*?this\.coyoteJumpAvailable[\s\S]*?characterCoyoteTime/.test(
      controller,
    ) &&
    /this\.jumpBufferRemaining > 0[\s\S]*?this\.coyoteJumpAvailable = false;[\s\S]*?this\.grounded = false;/.test(
      controller,
    ),
  "Coyote time must be consumed by a real jump so a second takeoff press cannot reset vertical velocity.",
);

const pointerDownStart = joystick.indexOf("private readonly handlePointerDown");
const pointerMoveStart = joystick.indexOf("private readonly handlePointerMove", pointerDownStart);
const pointerDownSource = joystick.slice(pointerDownStart, pointerMoveStart);
assert(
  pointerDownStart >= 0 &&
    pointerMoveStart > pointerDownStart &&
    pointerDownSource.indexOf("this.element.setPointerCapture(event.pointerId)") >= 0 &&
    pointerDownSource.indexOf("this.element.setPointerCapture(event.pointerId)") <
      pointerDownSource.indexOf("this.pointerId = event.pointerId"),
  "Joystick active state must not publish before pointer capture succeeds.",
);

const pointerReleaseStart = joystick.indexOf("private readonly handlePointerRelease");
const lostCaptureStart = joystick.indexOf(
  "private readonly handleLostPointerCapture",
  pointerReleaseStart,
);
const releaseSource = joystick.slice(pointerReleaseStart, lostCaptureStart);
const lostSource = joystick.slice(lostCaptureStart);
assert(
  /try \{[\s\S]*?releasePointerCapture[\s\S]*?\} finally \{[\s\S]*?this\.reset\(\);[\s\S]*?this\.onInput\(\);/.test(
    releaseSource,
  ) &&
    lostSource.includes("this.reset()") &&
    lostSource.includes("this.onInput()"),
  "Joystick release and spontaneous capture loss must always clear movement and notify the input owner.",
);

assert(
  /constructor\([\s\S]*?try \{[\s\S]*?this\.bindEvents\(\);[\s\S]*?this\.createMobileControls\(\);[\s\S]*?\} catch \(error\) \{[\s\S]*?this\.unbindEvents\(\);[\s\S]*?this\.canvas\.style\.touchAction = this\.previousTouchAction;[\s\S]*?throw error;/.test(
    fly,
  ) &&
    /dispose\(\): void \{[\s\S]*?this\.unbindEvents\(\);/.test(fly) &&
    fly.includes("private unbindEvents(): void"),
  "Fly input construction must roll back partially-bound listeners and canvas state, using the same unbind path as normal disposal.",
);

assert(
  fly.includes("button.setPointerCapture(event.pointerId)") &&
    fly.includes('button.addEventListener("lostpointercapture"') &&
    !fly.includes('button.addEventListener("pointerleave", deactivate)'),
  "Compact flight vertical controls must capture their pointer and clear thrust after release, cancellation, or spontaneous capture loss.",
);

console.log(
  "[runtime-ui-input] Diagnostics ownership, action/coyote precedence, and transactional compact/fly input verified.",
);