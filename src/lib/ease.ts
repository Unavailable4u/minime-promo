import {Easing, interpolate} from 'remotion';

/** Signature MiniMe ease: cubic-bezier(0.65, 0, 0.35, 1) (the brand's logo-draw curve). */
export const signatureEase: (t: number) => number = Easing.bezier(0.65, 0, 0.35, 1);

/** Clamp a number into 0..1. */
export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * Map `value` from [inMin, inMax] to [outMin, outMax].
 * Clamped at both ends by default; pass an easing function to shape it.
 */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  ease?: (t: number) => number,
): number =>
  interpolate(value, [inMin, inMax], [outMin, outMax], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

/** Eased 0..1 progress of `frame` between `start` and `end` (default: signature ease). */
export const ramp = (
  frame: number,
  start: number,
  end: number,
  ease: (t: number) => number = signatureEase,
): number => mapRange(frame, start, end, 0, 1, ease);

/** Signature ease-in-out on a 0..1 input. */
export const easeInOut = (t: number): number => signatureEase(clamp01(t));

/** Ease-out with a slight overshoot past 1 before settling on 1 (strength 1.70158 = classic). */
export const easeOutBack = (t: number, strength = 1.70158): number => {
  const x = clamp01(t) - 1;
  return 1 + x * x * ((strength + 1) * x + strength);
};

/**
 * 0..1 curve that rushes to ~1, overshoots by `amount` (default 6%) and settles back to exactly 1.
 * Used for cursor arrivals and small UI settles.
 */
export const overshoot = (t: number, amount = 0.06): number => {
  const x = clamp01(t);
  if (x >= 1) {
    return 1;
  }
  const rise = signatureEase(Math.min(1, x / 0.7));
  const settle = x <= 0.7 ? 0 : Math.sin(((x - 0.7) / 0.3) * Math.PI);
  return rise + amount * settle;
};
