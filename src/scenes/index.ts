/**
 * Scene barrel (patch 08). src/MiniMePromo.tsx imports ONLY from here, so replacing a scene file in a later
 * patch never requires editing the master timeline.
 *
 * What a scene file must export (names are fixed, N = scene number):
 *   - its overlay component            (S0Logo, S1Reveal, S2Instant, S3Team, S4Control, S5Organized, S6Outro)
 *   - SN_CAMERA: CameraKeyframe[]      (S3: S3_CAMERA, concatenated from s3/S3a, S3b, S3c)
 *   - SN_CURSOR: CursorWaypoint[]
 * Optional hooks: S0_GRID / S6_GRID (grid floor opacity), S1_WINDOW / S6_WINDOW (window box style).
 */
import type {ComponentType} from 'react';
import type {CameraKeyframe, CursorWaypoint} from '../config/camera';
import {INTRO} from '../config/intro';
import {SCENES, TOTAL_FRAMES} from '../config/timeline';
import {S0_CAMERA, S0_CURSOR, S0_GRID, S0Logo} from './S0Logo';
import {S1_CAMERA, S1_CURSOR, S1_WINDOW, S1Reveal} from './S1Reveal';
import {S2_CAMERA, S2_CURSOR, S2Instant} from './S2Instant';
import {S3_CAMERA, S3_CURSOR, S3Team} from './S3Team';
import {S4_CAMERA, S4_CURSOR, S4Control} from './S4Control';
import {S5_CAMERA, S5_CURSOR, S5Organized} from './S5Organized';
import {S6_CAMERA, S6_CURSOR, S6_GRID, S6_WINDOW, S6Outro} from './S6Outro';
import type {GridOpacityFn, SceneOverlayProps, WindowStyleFn} from './sceneTypes';

export * from './sceneTypes';
export {S0_CAMERA, S0_CURSOR, S0_GRID, S0Logo} from './S0Logo';
export {S1_CAMERA, S1_CURSOR, S1_WINDOW, S1Reveal} from './S1Reveal';
export {S2_CAMERA, S2_CURSOR, S2Instant} from './S2Instant';
export {S3_CAMERA, S3_CURSOR, S3Team} from './S3Team';
export {S4_CAMERA, S4_CURSOR, S4Control} from './S4Control';
export {S5_CAMERA, S5_CURSOR, S5Organized} from './S5Organized';
export {S6_CAMERA, S6_CURSOR, S6_GRID, S6_WINDOW, S6Outro} from './S6Outro';

// ------------------------------------------------------------------ camera + cursor
/** Every camera keyframe of the film. Order does not matter, frames do (the camera sorts them). */
export const ALL_CAMERA: CameraKeyframe[] = [
  ...S0_CAMERA,
  ...S1_CAMERA,
  ...S2_CAMERA,
  ...S3_CAMERA,
  ...S4_CAMERA,
  ...S5_CAMERA,
  ...S6_CAMERA,
];

/** Every cursor waypoint of the film (UI logical coordinates). */
export const ALL_CURSOR: CursorWaypoint[] = [
  ...S0_CURSOR,
  ...S1_CURSOR,
  ...S2_CURSOR,
  ...S3_CURSOR,
  ...S4_CURSOR,
  ...S5_CURSOR,
  ...S6_CURSOR,
];

// ------------------------------------------------------------------ overlays
export type SceneOverlayEntry = {
  id: string;
  /** First and last GLOBAL frame (inclusive) in which the overlay is mounted. The overlay hides itself outside its own timing. */
  from: number;
  to: number;
  Overlay: ComponentType<SceneOverlayProps>;
};

/** Overlays may outlive their scene a little (exit animations, captions fading over the next cut). */
const OVERLAY_TAIL = 30;

export const SCENE_OVERLAYS: readonly SceneOverlayEntry[] = [
  // S0's lockup stays on screen above the S1 headline until INTRO.lockupExitEnd (f208).
  {id: 'S0', from: SCENES.S0.start, to: INTRO.lockupExitEnd, Overlay: S0Logo},
  {id: 'S1', from: SCENES.S1.start, to: SCENES.S1.end, Overlay: S1Reveal},
  {id: 'S2', from: SCENES.S2.start, to: SCENES.S2.end + OVERLAY_TAIL, Overlay: S2Instant},
  {id: 'S3', from: SCENES.S3.start, to: SCENES.S3.end + OVERLAY_TAIL, Overlay: S3Team},
  {id: 'S4', from: SCENES.S4.start, to: SCENES.S4.end + OVERLAY_TAIL, Overlay: S4Control},
  {id: 'S5', from: SCENES.S5.start, to: SCENES.S5.end + OVERLAY_TAIL, Overlay: S5Organized},
  {id: 'S6', from: SCENES.S6.start, to: TOTAL_FRAMES, Overlay: S6Outro},
];

// ------------------------------------------------------------------ stage hooks
/** Grid floor opacity at a frame: the intro fade (S0_GRID) or the outro fade (S6_GRID), whichever is brighter. */
export const gridOpacityAt: GridOpacityFn = (frame) => Math.max(S0_GRID(frame), S6_GRID(frame));

/** The app window's own box style at a frame: the S6 override from the outro on, otherwise the S1 rise. */
export const windowStyleAt: WindowStyleFn = (frame) =>
  S6_WINDOW !== null && frame >= SCENES.S6.start ? S6_WINDOW(frame) : S1_WINDOW(frame);
