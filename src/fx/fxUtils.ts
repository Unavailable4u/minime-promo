/**
 * MiniMe promo — shared helpers for the FX components (src/fx/*).
 *
 * FRAME CONVENTION: every FX component takes `startFrame` / `endFrame` in the frame domain of
 * `useCurrentFrame()` at the place it is rendered. The film renders FX at the top level (no <Sequence>
 * wrapper), so these are GLOBAL frames. If you must render one inside a <Sequence>, pass `frame=` to
 * override (every FX component accepts it).
 */
import type {CSSProperties} from 'react';
import {useCurrentFrame} from 'remotion';
import {FOCUS_RECTS, type FocusName} from '../config/focus';
import {STAGE} from '../config/timeline';
import {
  projectUiPoint,
  projectUiRect,
  type CameraState,
  type StageRect,
} from './cameraMath';

/** The current frame, or an explicit override. */
export const useFxFrame = (override?: number): number => {
  const current = useCurrentFrame();
  return override ?? current;
};

/** Which coordinate space a point/rect is written in. `screen` = stage pixels (1920x1080) after the camera. */
export type FxSpace = 'screen' | 'ui';

/**
 * A point to anchor an overlay to.
 *   space 'screen' (default): fixed on screen, stage pixels.
 *   space 'ui': a point in the app's logical 1440x810 space; it FOLLOWS the camera.
 */
export type FxPoint = {x: number; y: number; space?: FxSpace};

/** Same idea for a rectangle. */
export type FxRect = {x: number; y: number; w: number; h: number; space?: FxSpace};

/** Resolve an FxPoint to screen pixels for the given camera state. */
export const resolveFxPoint = (state: CameraState, point: FxPoint): {x: number; y: number} =>
  point.space === 'ui' ? projectUiPoint(state, point.x, point.y) : {x: point.x, y: point.y};

/**
 * Resolve a focus name or FxRect to a screen rectangle (bounding box on screen, so tilt is accounted for).
 * A focus name always lives in UI space and follows the camera.
 */
export const resolveFxRect = (state: CameraState, target: FocusName | FxRect): StageRect => {
  if (typeof target === 'string') {
    return projectUiRect(state, FOCUS_RECTS[target]);
  }
  if (target.space === 'ui') {
    return projectUiRect(state, target);
  }
  return {x: target.x, y: target.y, w: target.w, h: target.h};
};

/** Rough text width in px (we cannot measure text deterministically). Good enough to keep chips on screen. */
export const estimateTextWidth = (text: string, fontSize: number, em = 0.56): number =>
  text.length * fontSize * em;

/** The frosted-glass look shared by callouts, the stat chip, the toast and the key cap. */
export const GLASS: CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%), rgba(18,18,18,0.62)',
  border: '1px solid rgba(255,255,255,0.14)',
  backdropFilter: 'blur(16px) saturate(140%)',
  WebkitBackdropFilter: 'blur(16px) saturate(140%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
};

/** Soft drop shadow to put on a SIBLING under a glass element (a filter on an ancestor would kill its blur). */
export const GLASS_SHADOW = '0 14px 36px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.35)';

/** A full-stage, click-through layer. */
export const LAYER: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: STAGE.width,
  height: STAGE.height,
  pointerEvents: 'none',
};
