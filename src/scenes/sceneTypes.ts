import type {CSSProperties} from 'react';

/**
 * Shared contracts of the scene files (src/scenes/*).
 *
 * Every scene file exports its overlay component plus `SN_CAMERA: CameraKeyframe[]` and `SN_CURSOR: CursorWaypoint[]`.
 * src/scenes/index.ts concatenates them for src/MiniMePromo.tsx, which therefore never changes when a scene is replaced.
 */

/** Props of every scene overlay. `frame` is the GLOBAL film frame (overlays are never wrapped in a <Sequence>). */
export type SceneOverlayProps = {
  frame: number;
};

/** Grid floor opacity (0..1) as a pure function of the global frame. */
export type GridOpacityFn = (frame: number) => number;

/** Extra box style for the app window (opacity / transform / filter) as a pure function of the global frame. */
export type WindowStyleFn = (frame: number) => CSSProperties;
