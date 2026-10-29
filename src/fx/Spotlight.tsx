import React from 'react';
import type {FocusName} from '../config/focus';
import {STAGE} from '../config/timeline';
import {mapRange, ramp} from '../lib/ease';
import {useCameraState} from './Camera';
import {resolveFxRect, useFxFrame, type FxRect} from './fxUtils';

export type SpotlightProps = {
  /** First and last frame of the sweep. Nothing is drawn outside this range. */
  startFrame: number;
  endFrame: number;
  /**
   * What the light sweeps across: a FocusName or an FxRect (follows the camera when space is 'ui').
   * Default: the whole stage.
   */
  target?: FocusName | FxRect;
  /** Slant of the light band in degrees (default 18). */
  angle?: number;
  /** Band width as a fraction of the target width (default 0.3, at least 140 px). */
  band?: number;
  /** Peak whiteness of the band, 0..1 (default 0.16). */
  intensity?: number;
  /** Corner radius of the lit area in UI px, scaled with the camera (default 14; use the window's radius). */
  radius?: number;
  /** 'ltr' (default) or 'rtl'. */
  direction?: 'ltr' | 'rtl';
  frame?: number;
};

/**
 * A specular light sweep: a soft, slanted white band that glides across a rectangle once, like light
 * catching glass. Clipped to the rectangle, additive ('screen'), eased with the signature curve.
 * Render it in the SCREEN layer (it reads the camera to stay on its target).
 */
export const Spotlight: React.FC<SpotlightProps> = ({
  startFrame,
  endFrame,
  target,
  angle = 18,
  band = 0.3,
  intensity = 0.16,
  radius = 14,
  direction = 'ltr',
  frame: frameOverride,
}) => {
  const frame = useFxFrame(frameOverride);
  const camera = useCameraState();
  if (frame < startFrame || frame > endFrame) {
    return null;
  }

  const rect =
    target === undefined
      ? {x: 0, y: 0, w: STAGE.width, h: STAGE.height}
      : resolveFxRect(camera, target);
  const followsUi = typeof target === 'string' || (target !== undefined && target.space === 'ui');
  const cornerRadius = target === undefined ? 0 : radius * (followsUi ? camera.scale : 1);

  const bandWidth = Math.max(140, rect.w * band);
  const progress = ramp(frame, startFrame, endFrame);
  const travel = mapRange(progress, 0, 1, -bandWidth * 1.6, rect.w + bandWidth * 0.6);
  const left = direction === 'ltr' ? travel : rect.w - travel - bandWidth;
  const slant = direction === 'ltr' ? -angle : angle;
  const peak = intensity;

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        overflow: 'hidden',
        borderRadius: cornerRadius,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left,
          top: '-25%',
          width: bandWidth,
          height: '150%',
          transform: `skewX(${slant}deg)`,
          background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,${(peak * 0.45).toFixed(3)}) 36%, rgba(255,255,255,${peak.toFixed(3)}) 50%, rgba(255,255,255,${(peak * 0.45).toFixed(3)}) 64%, rgba(255,255,255,0) 100%)`,
        }}
      />
    </div>
  );
};
