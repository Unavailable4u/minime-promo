import {measureSpring, spring, type SpringConfig} from 'remotion';

/** The four named spring presets of the MiniMe motion language. */
export const SPRINGS = {
  /** Buttons, chips, small UI pops. */
  uiPop: {damping: 18, stiffness: 170, mass: 0.9},
  /** The window and the Working Panel. */
  panel: {damping: 22, stiffness: 120, mass: 1},
  /** The virtual camera: slow, expensive-feeling. */
  camera: {damping: 26, stiffness: 90, mass: 1.1},
  /** Tiny settle after a click or a hit. */
  settle: {damping: 14, stiffness: 220, mass: 1},
} as const satisfies Record<string, Partial<SpringConfig>>;

export type SpringPreset = keyof typeof SPRINGS;

/**
 * Spring progress 0 -> 1 (may overshoot 1 slightly) that starts at `startFrame`.
 * Returns exactly 0 before the start.
 */
export const spr = (
  frame: number,
  fps: number,
  startFrame: number,
  preset: SpringPreset = 'uiPop',
): number => {
  const local = frame - startFrame;
  if (local <= 0) {
    return 0;
  }
  return spring({frame: local, fps, config: SPRINGS[preset]});
};

/** How many frames a preset needs to settle (useful to schedule things after a spring). */
export const sprDuration = (fps: number, preset: SpringPreset = 'uiPop'): number =>
  measureSpring({fps, config: SPRINGS[preset]});
