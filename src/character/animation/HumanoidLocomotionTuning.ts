/**
 * Numerical constants for the humanoid locomotion layer.
 *
 * These were the player's shipped pose equations before the actor migration and
 * are reproduced here unchanged, so the ported locomotion matches the recorded
 * baseline rather than quietly redesigning the gait.
 */

/** Metres of travel per full gait cycle. The grass trail stamps feet from it. */
export const HUMANOID_STRIDE_LENGTH_METERS = 1.55;
/** Fraction of the cycle each foot spends planted. */
export const HUMANOID_STANCE_DUTY_FACTOR = 0.62;

export const HUMANOID_TAKEOFF_DURATION_SECONDS = 0.11;
export const HUMANOID_APEX_VELOCITY_THRESHOLD = 1.15;
export const HUMANOID_IDLE_SPEED_THRESHOLD = 0.08;
export const HUMANOID_RUN_SPEED_FRACTION = 0.72;

// A positive arm rotation swings the hand behind the hip, and the cloak side
// panels only sweep clear of the body once the character is running — so an
// even arc pushed the hands through the cloth at walking pace. Damp the back
// half of the swing and bias the whole arc forward instead of shortening it.
export const HUMANOID_ARM_BACKSWING_SCALE = 0.55;
export const HUMANOID_ARM_FORWARD_BIAS = 0.09;

export const HUMANOID_THIGH_SWING = 0.68;
export const HUMANOID_SHIN_SWING = 0.5;
export const HUMANOID_IDLE_BREATH_FREQUENCY = 1.7;
export const HUMANOID_IDLE_BREATH_AMPLITUDE = 0.004;

/** Transition durations between locomotion states, in seconds. */
export const HUMANOID_TRANSITION_DEFAULT_SECONDS = 0.16;
export const HUMANOID_TRANSITION_AIRBORNE_SECONDS = 0.09;
export const HUMANOID_TRANSITION_LANDING_SECONDS = 0.06;
