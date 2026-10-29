/**
 * MiniMe promo — camera + cursor data contracts and tunables.
 *
 * Scene patches (S0..S6) fill in `CameraKeyframe[]` and `CursorWaypoint[]` arrays; src/MiniMePromo.tsx
 * concatenates them. The camera itself lives in src/fx/Camera.tsx, the cursor in src/fx/Cursor.tsx.
 * All numbers in this file are meant to be edited.
 */
import type {FocusName} from './focus';
import type {SceneId} from './timeline';

// ------------------------------------------------------------------ contracts
/**
 * One camera move.
 *
 * `frame`     the frame at which the camera STARTS moving toward this pose (it holds the previous pose
 *             until then). The first keyframe is the opening pose, whatever its frame. The move settles
 *             about `CAMERA_SETTLE_FRAMES` later (src/fx/cameraMath.ts), so for a landing on a beat, start
 *             the move one settle-time earlier. Author with f()/beat()/sec().
 * `target`    which named focus rectangle (src/config/focus.ts) to frame.
 * `padding`   empty margin in STAGE pixels kept around the target on every side after framing
 *             (bigger padding = looser shot; leave room here for callouts).
 * `scaleBias` multiplier on the solved zoom. 1 = the target exactly fills the stage minus padding,
 *             1.1 = 10% tighter, 0.9 = 10% looser.
 * `rotateX/Y/Z` tilt in degrees. Clamped to CAMERA_LIMITS according to the scene `frame` belongs to.
 * `ease`      optional 0..1 -> 0..1 curve. When given, it replaces the camera spring for the move to
 *             this keyframe and runs over CAMERA_SETTLE_FRAMES frames.
 */
export type CameraKeyframe = {
  frame: number;
  target: FocusName;
  padding: number;
  scaleBias: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  ease?: (t: number) => number;
};

/**
 * One cursor stop, in the UI's LOGICAL 1440x810 space.
 *
 * `frame`  the frame the cursor ARRIVES at (x, y). It travels there along a curved path that lasts
 *          about 14 to 36 frames depending on distance, and rests at the previous waypoint until then.
 * `click`  true = a click lands exactly on `frame` (press dip, release, ripple).
 * `hover`  free-form id of the thing under the cursor while it rests here (the script/UI reads it from
 *          getCursorState().hover to draw hover states).
 */
export type CursorWaypoint = {
  frame: number;
  x: number;
  y: number;
  click?: boolean;
  hover?: string;
};

// -------------------------------------------------------------------- tunables
/** CSS perspective distance in px for the camera tilt. */
export const CAMERA_PERSPECTIVE = 1800;

export const CAMERA_LIMITS = {
  /** Zoom is clamped to this range after padding and bias are applied. */
  minScale: 0.5,
  maxScale: 2.4,
  /** Tilt limits in degrees for normal scenes. */
  normal: {rotateX: 6, rotateY: 5, rotateZ: 3},
  /** Tilt limits in degrees for the intro and outro scenes. */
  extended: {rotateX: 14, rotateY: 14, rotateZ: 6},
  /** Scenes that use the extended limits (decided by the scene a keyframe's `frame` falls in). */
  extendedScenes: ['S0', 'S1', 'S6'] as readonly SceneId[],
} as const;

/** Default padding / bias used by `cameraKey()` when a scene does not care. */
export const CAMERA_DEFAULTS = {
  padding: 72,
  scaleBias: 1,
} as const;

/** Held shots never freeze: a slow two-axis sinusoidal drift of the whole camera, in stage pixels. */
export const CAMERA_DRIFT = {
  px: 2,
  periodSecondsX: 5.2,
  periodSecondsY: 7.3,
  phaseX: 0.4,
  phaseY: 2.1,
} as const;

/** Depth-of-field illusion: everything outside the focus rectangle gets this blur and dim. */
export const CAMERA_DOF = {
  blurPx: 1.2,
  dim: 0.12,
  /** Soft edge width in stage px between the sharp focus area and the blurred area. */
  feather: 90,
} as const;

// -------------------------------------------------------------------- authoring
/**
 * Short way to write a keyframe:
 *   cameraKey(f(240), 'composer', {padding: 220, rotateY: -3})
 * Anything not given defaults to CAMERA_DEFAULTS and zero tilt.
 */
export const cameraKey = (
  frame: number,
  target: FocusName,
  options: Partial<Omit<CameraKeyframe, 'frame' | 'target'>> = {},
): CameraKeyframe => ({
  frame,
  target,
  padding: options.padding ?? CAMERA_DEFAULTS.padding,
  scaleBias: options.scaleBias ?? CAMERA_DEFAULTS.scaleBias,
  rotateX: options.rotateX ?? 0,
  rotateY: options.rotateY ?? 0,
  rotateZ: options.rotateZ ?? 0,
  ease: options.ease,
});
