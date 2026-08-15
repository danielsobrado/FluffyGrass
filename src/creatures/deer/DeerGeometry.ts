import * as THREE from "three";
import type { ActorGeometryPart } from "../../actor/geometry/ActorPartMerge";
import {
  QUADRUPED_BODY_HALF_LENGTH,
  QUADRUPED_LOWER_LIMB,
  QUADRUPED_UPPER_LIMB,
} from "../quadruped/QuadrupedRigDefinition";
import { buildDeerEarParts, buildDeerHeadParts } from "./DeerHeadGeometry";
import { DEER_PALETTE } from "./DeerPalette";

const HALF_TURN = Math.PI * 0.5;
/** How far the neck leans forward off vertical, matching its own bone offset. */
const NECK_LEAN = 0.89;

const HIDE = new THREE.Color(DEER_PALETTE.hide);
const BELLY = new THREE.Color(DEER_PALETTE.belly);
const DORSAL = new THREE.Color(DEER_PALETTE.dorsal);
const FACE = new THREE.Color(DEER_PALETTE.face);
const THROAT = new THREE.Color(DEER_PALETTE.throat);
const HOOF = new THREE.Color(DEER_PALETTE.hoof);
const TAIL_FLASH = new THREE.Color(DEER_PALETTE.tailFlash);
const FAWN_SPOT = new THREE.Color(DEER_PALETTE.fawnSpot);

export type DeerVariant = "stag" | "doe" | "fawn";

/** One mesh per slot. Limb slots are shared by the left and right side. */
export type DeerPartSlot =
  | "body"
  | "neck"
  | "head"
  | "earLeft"
  | "earRight"
  | "tailBase"
  | "tailMid"
  | "tailTip"
  | "frontUpper"
  | "frontLower"
  | "frontHoof"
  | "hindUpper"
  | "hindLower"
  | "hindHoof";

interface DeerShape {
  readonly girth: number;
  readonly neckGirth: number;
  readonly headScale: number;
  readonly muzzleLength: number;
  readonly antlers: boolean;
  readonly spots: boolean;
}

/**
 * Three animals off one skeleton.
 *
 * A herd of identical adults reads as a copy-paste, so the roster is a family:
 * a heavier stag carrying a rack, a slimmer doe, and a spotted fawn whose head
 * is proportionally too big for it, which is most of what makes a young animal
 * look young. The fawn is also scaled down as a whole by its actor.
 */
const DEER_SHAPES: Readonly<Record<DeerVariant, DeerShape>> = Object.freeze({
  stag: { girth: 1.06, neckGirth: 1.16, headScale: 1.14, muzzleLength: 0.12, antlers: true, spots: false },
  doe: { girth: 0.97, neckGirth: 0.98, headScale: 1.06, muzzleLength: 0.108, antlers: false, spots: false },
  fawn: { girth: 0.94, neckGirth: 0.86, headScale: 1.3, muzzleLength: 0.076, antlers: false, spots: true },
});

/**
 * Builds every primitive of one variant, grouped by the bone that carries it.
 *
 * The caller merges each group into a single buffer and disposes these sources
 * immediately, so nothing here is retained.
 */
export function buildDeerParts(
  variant: DeerVariant,
): Map<DeerPartSlot, ActorGeometryPart[]> {
  const shape = DEER_SHAPES[variant];
  const coat = shadeCoat(shape.spots);
  const parts = new Map<DeerPartSlot, ActorGeometryPart[]>();

  parts.set("body", buildBody(shape, coat));
  parts.set("neck", buildNeck(shape));
  parts.set(
    "head",
    buildDeerHeadParts({
      headScale: shape.headScale,
      muzzleLength: shape.muzzleLength,
      antlers: shape.antlers,
    }),
  );
  parts.set("earLeft", buildDeerEarParts(-1, shape.headScale));
  parts.set("earRight", buildDeerEarParts(1, shape.headScale));

  parts.set("tailBase", buildTailSegment(0.034, 0.03, 0.085));
  parts.set("tailMid", buildTailSegment(0.03, 0.024, 0.085));
  parts.set("tailTip", buildTailSegment(0.024, 0.009, 0.08));

  parts.set("frontUpper", buildLimbSegment(0.05 * shape.girth, 0.031, QUADRUPED_UPPER_LIMB, 0.055));
  parts.set("frontLower", buildLimbSegment(0.028, 0.019, QUADRUPED_LOWER_LIMB, 0.032));
  parts.set("frontHoof", buildHoof());
  parts.set("hindUpper", buildLimbSegment(0.058 * shape.girth, 0.033, QUADRUPED_UPPER_LIMB, 0.064));
  parts.set("hindLower", buildLimbSegment(0.029, 0.019, QUADRUPED_LOWER_LIMB, 0.034));
  parts.set("hindHoof", buildHoof());
  return parts;
}

/**
 * Barrel, shoulder and haunch.
 *
 * The two masses matter more than they look: a plain tube has the same
 * cross-section from nose to tail, and real animals are widest at the shoulder
 * and the hip. They are also what the limbs appear to emerge from rather than
 * being stuck onto.
 */
function buildBody(
  shape: DeerShape,
  coat: ActorGeometryPart["shade"],
): ActorGeometryPart[] {
  const girth = shape.girth;
  return [
    // An ellipsoid, not a cylinder. A capped cylinder shows its flat disc at the
    // chest and rump, and no amount of shading hides a hard rim there — it was
    // the single most artificial edge on the old body.
    // Deep and narrow, not round. A deer seen head-on is a thin animal, and a
    // circular cross-section is what made the first pass read as a barrel on
    // legs — the single change that does most to make this look like a deer.
    {
      geometry: new THREE.SphereGeometry(1, 20, 14),
      color: HIDE,
      scaleX: 0.116 * girth,
      scaleY: 0.171 * girth,
      scaleZ: QUADRUPED_BODY_HALF_LENGTH * 1.2,
      shade: coat,
    },
    // The shoulder and haunch masses stay inside the silhouette. Proud of it
    // they stop being anatomy and become two spheres stuck to a body.
    {
      geometry: new THREE.SphereGeometry(1, 12, 10),
      color: HIDE,
      y: 0.004,
      z: QUADRUPED_BODY_HALF_LENGTH * 0.6,
      scaleX: 0.111 * girth,
      scaleY: 0.142 * girth,
      scaleZ: 0.15,
      shade: coat,
    },
    // Kept below the back line. Raised even slightly above it, the haunch stops
    // being a haunch and becomes a hump.
    {
      geometry: new THREE.SphereGeometry(1, 12, 10),
      color: HIDE,
      y: 0.012,
      z: -QUADRUPED_BODY_HALF_LENGTH * 0.66,
      scaleX: 0.124 * girth,
      scaleY: 0.152 * girth,
      scaleZ: 0.165,
      shade: coat,
    },
  ];
}

/**
 * Counter-shading, a dorsal line, and a fawn's dapples.
 *
 * Almost every prey animal is dark on top and pale underneath, which flattens it
 * against the light and is the single cheapest thing that makes a procedural
 * body stop looking like a plastic toy. Reading it off the surface normal rather
 * than off height means it follows the form around the shoulder and haunch for
 * free.
 */
function shadeCoat(spots: boolean): ActorGeometryPart["shade"] {
  return (target, _x, y, z, normalY) => {
    if (normalY > 0.3) {
      target.lerpColors(HIDE, DORSAL, smooth((normalY - 0.3) / 0.7) * 0.6);
    } else if (normalY < -0.3) {
      // The pale underside has to start low and arrive gradually. Taken too far
      // up the flank it stops reading as light and becomes a painted stripe.
      target.lerpColors(HIDE, BELLY, smooth((-normalY - 0.3) / 0.7) * 0.92);
    }
    if (!spots || normalY < -0.35 || normalY > 0.72) {
      return;
    }
    // Two out-of-phase waves make an irregular-looking grid of blobs without a
    // random table. Spots sit on the flank and fade out toward the belly.
    const dapple = Math.sin(z * 34) * Math.sin(y * 26 + z * 11);
    if (dapple > 0.55) {
      target.lerp(FAWN_SPOT, Math.min((dapple - 0.55) * 2.6, 0.85));
    }
  };
}

/**
 * The neck, laid along the bone's own diagonal.
 *
 * The head sits up and forward of the neck joint, so a plain vertical cylinder
 * left a visible gap that the old body simply lived with. This points the
 * geometry where the skeleton actually goes.
 */
function buildNeck(shape: DeerShape): ActorGeometryPart[] {
  const girth = shape.neckGirth;
  const throat: ActorGeometryPart["shade"] = (target, _x, _y, _z, normalY) => {
    if (normalY < 0) {
      target.lerpColors(FACE, THROAT, smooth(-normalY) * 0.9);
    }
  };
  return [
    // Long enough to reach back inside the chest. The old neck started at its
    // own joint, which left the head floating clear of the body with a flat
    // cylinder cap facing the camera.
    {
      geometry: new THREE.CylinderGeometry(0.056 * girth, 0.099 * girth, 0.32, 12, 4),
      color: FACE,
      rotationX: NECK_LEAN,
      y: 0.022,
      z: 0,
      shade: throat,
    },
    // Buried in the chest so the taper's base cap is never visible.
    {
      geometry: new THREE.SphereGeometry(0.098 * girth, 10, 8),
      color: FACE,
      y: -0.075,
      z: -0.12,
      shade: throat,
    },
  ];
}

function buildTailSegment(
  topRadius: number,
  bottomRadius: number,
  length: number,
): ActorGeometryPart[] {
  return [
    {
      geometry: new THREE.CylinderGeometry(bottomRadius, topRadius, length, 8, 2),
      color: DORSAL,
      rotationX: -HALF_TURN,
      z: -length * 0.5,
      shade: (target, _x, _y, _z, normalY) => {
        // The white underside is the whole point of a deer's tail: it is the
        // signal that flashes when one of them decides to leave.
        if (normalY < 0.1) {
          target.lerpColors(DORSAL, TAIL_FLASH, smooth((0.1 - normalY) / 1.1));
        }
      },
    },
  ];
}

/**
 * One limb segment: a taper with a joint swell at its top.
 *
 * Deer legs are thin, and thin tapered cylinders butted end to end read as a
 * pipe. The swell gives the elbow and hock somewhere to be.
 */
function buildLimbSegment(
  topRadius: number,
  bottomRadius: number,
  length: number,
  jointRadius: number,
): ActorGeometryPart[] {
  const shade: ActorGeometryPart["shade"] = (target, _x, y) => {
    // Legs darken toward the ground, which is both true of deer and useful:
    // it stops four pale sticks from drawing the eye away from the body.
    const low = THREE.MathUtils.clamp(-y / Math.max(length, 0.001), 0, 1);
    target.lerpColors(HIDE, FACE, smooth(low));
  };
  return [
    {
      geometry: new THREE.CylinderGeometry(topRadius, bottomRadius, length, 9, 2),
      color: HIDE,
      y: -length * 0.5,
      shade,
    },
    // A joint, not a knob: barely wider than the limb and flattened, so it
    // suggests bone under skin instead of a ball bearing.
    {
      geometry: new THREE.SphereGeometry(jointRadius, 9, 7),
      color: HIDE,
      scaleX: 0.82,
      scaleY: 0.72,
      shade,
    },
  ];
}

/** A cloven hoof: two toes and a dewclaw, all in one dark buffer. */
function buildHoof(): ActorGeometryPart[] {
  const parts: ActorGeometryPart[] = [];
  for (const side of [-1, 1] as const) {
    parts.push({
      geometry: new THREE.CylinderGeometry(0.02, 0.024, 0.058, 6),
      color: HOOF,
      x: side * 0.013,
      y: -0.026,
      z: 0.012,
      rotationX: 0.16,
    });
  }
  parts.push({
    geometry: new THREE.SphereGeometry(0.014, 6, 5),
    color: HOOF,
    y: -0.006,
    z: -0.022,
  });
  return parts;
}

function smooth(value: number): number {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}
