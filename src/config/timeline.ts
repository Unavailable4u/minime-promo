/**
 * MiniMe promo — timeline.
 *
 * All frame numbers in this project are AUTHORED AT 30 fps (the numbers in the storyboard).
 * Wrap authored numbers in f(), sec() or beat() so that changing FPS keeps the film in sync.
 *   f(n)     authored frame number  -> frame at the current FPS
 *   sec(s)   seconds                -> frames
 *   beat(n)  musical beats (120 BPM)-> frames
 *   bar(n)   bars (4 beats)         -> frames
 */

export const BASE_FPS = 30; // the frame rate the storyboard numbers were written for
export const FPS = 30; // the frame rate the film renders at
export const BPM = 120;

/** Authored 30 fps frame number -> frame number at the current FPS. */
export const f = (authoredFrame: number): number => Math.round((authoredFrame * FPS) / BASE_FPS);

/** Seconds -> frames. */
export const sec = (seconds: number): number => Math.round(seconds * FPS);

/** Frames per beat (15 at 30 fps / 120 BPM). */
export const BEAT = Math.round((FPS * 60) / BPM);
/** Frames per bar (60 at 30 fps / 120 BPM). */
export const BAR = BEAT * 4;

/** Beats -> frames. beat(4) === 60 at 30 fps. */
export const beat = (beats: number): number => Math.round(beats * BEAT);
/** Bars -> frames. bar(2) === 120 at 30 fps. */
export const bar = (bars: number): number => Math.round(bars * BAR);

/** 29 bars = 1740 frames = 58 s at 30 fps. */
export const TOTAL_FRAMES = f(1740);

// ------------------------------------------------------------------ geometry
/** The video frame. */
export const STAGE = {width: 1920, height: 1080} as const;

/** The app UI is designed at this logical size; the virtual camera does all zooming. */
export const UI = {width: 1440, height: 810} as const;

/** Top-left of the logical UI box on the stage (the UI is centered). */
export const UI_OFFSET = {
  x: (STAGE.width - UI.width) / 2, // 240
  y: (STAGE.height - UI.height) / 2, // 135
} as const;

// -------------------------------------------------------------------- scenes
/**
 * Scene ranges. `start` and `end` are both INCLUSIVE frame numbers; `duration` = end - start + 1.
 *   S0 Logo 0-119 | S1 Reveal 120-239 | S2 Instant 240-479 | S3 Team 480-1079
 *   S4 Control 1080-1319 | S5 Organized 1320-1499 | S6 Outro 1500-1739
 */
const makeScene = (firstAuthored: number, lastAuthored: number) => {
  const start = f(firstAuthored);
  const duration = f(lastAuthored + 1) - start;
  return {start, end: start + duration - 1, duration} as const;
};

export const SCENES = {
  S0: makeScene(0, 119),
  S1: makeScene(120, 239),
  S2: makeScene(240, 479),
  S3: makeScene(480, 1079),
  S4: makeScene(1080, 1319),
  S5: makeScene(1320, 1499),
  S6: makeScene(1500, 1739),
} as const;

export type SceneId = keyof typeof SCENES;

export const SCENE_ORDER: readonly SceneId[] = ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

export const SCENE_NAMES: Record<SceneId, string> = {
  S0: 'Logo',
  S1: 'Reveal',
  S2: 'Instant',
  S3: 'Team',
  S4: 'Control',
  S5: 'Organized',
  S6: 'Outro',
};

/** Which scene does this global frame belong to? Frames past the end return the last scene. */
export const sceneAt = (frame: number): SceneId => {
  for (const id of SCENE_ORDER) {
    if (frame <= SCENES[id].end) {
      return id;
    }
  }
  return 'S6';
};

/** Frame relative to the start of a scene (negative before the scene starts). */
export const sceneLocalFrame = (frame: number, id: SceneId): number => frame - SCENES[id].start;
