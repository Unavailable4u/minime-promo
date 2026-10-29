import React from 'react';
import type {FocusName} from '../config/focus';
import {SURFACE} from '../config/theme';
import {STAGE} from '../config/timeline';
import {clamp01, mapRange} from '../lib/ease';
import {useCameraState} from './Camera';
import {resolveFxPoint, resolveFxRect, useFxFrame, type FxPoint} from './fxUtils';

export type GlowProps = {
  /** First frame of the first pulse (the hit). */
  startFrame: number;
  /**
   * Where the bloom is centered.
   *  - an FxPoint: {x, y} on screen (stage px) or {x, y, space: 'ui'} to follow the camera.
   *  - a FocusName: the center of that rectangle on screen (follows the camera).
   * Default: the center of the stage.
   */
  at?: FocusName | FxPoint;
  /** Diameter in px of the bloom at scale 1 (default 560). */
  size?: number;
  /** Length of one pulse in frames (default 28). */
  frames?: number;
  /** Number of pulses (default 1). Pulses start `gap` frames apart. */
  pulses?: number;
  gap?: number;
  /** Multiplier on the peak opacity (default 1 = 0.5). */
  intensity?: number;
  frame?: number;
};

const SCALE_FROM = 0.6;
const SCALE_TO = 1.4;
const PEAK_OPACITY = 0.5;
const RISE_FRAMES = 2; // 2 frames of build-up so the hit does not pop in a single frame

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);

/**
 * A radial crimson bloom: one hit that swells from scale .6 to 1.4 while its opacity falls .5 -> 0.
 * Use it on a beat (a click landing, the logo completing, the team appearing). Render it in the SCREEN
 * layer so it is not zoomed; give it a `space: 'ui'` point (or a FocusName) and it still follows the UI.
 */
export const Glow: React.FC<GlowProps> = ({
  startFrame,
  at,
  size = 560,
  frames = 28,
  pulses = 1,
  gap = 10,
  intensity = 1,
  frame: frameOverride,
}) => {
  const frame = useFxFrame(frameOverride);
  const camera = useCameraState();

  const alive: {scale: number; opacity: number}[] = [];
  for (let k = 0; k < pulses; k++) {
    const local = frame - (startFrame + k * gap);
    if (local < 0 || local >= frames) {
      continue;
    }
    const life = local / frames;
    alive.push({
      scale: mapRange(easeOutCubic(life), 0, 1, SCALE_FROM, SCALE_TO),
      opacity: PEAK_OPACITY * intensity * Math.pow(1 - life, 1.5) * clamp01((local + 1) / RISE_FRAMES),
    });
  }
  if (alive.length === 0) {
    return null;
  }

  let center: {x: number; y: number};
  if (at === undefined) {
    center = {x: STAGE.width / 2, y: STAGE.height / 2};
  } else if (typeof at === 'string') {
    const rect = resolveFxRect(camera, at);
    center = {x: rect.x + rect.w / 2, y: rect.y + rect.h / 2};
  } else {
    center = resolveFxPoint(camera, at);
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: STAGE.width,
        height: STAGE.height,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    >
      {alive.map((pulse, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: center.x - size / 2,
            top: center.y - size / 2,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle closest-side, ${SURFACE.crimsonGlow(1)} 0%, ${SURFACE.crimsonGlow(0.45)} 38%, ${SURFACE.crimsonGlow(0)} 100%)`,
            opacity: pulse.opacity,
            transform: `scale(${pulse.scale.toFixed(4)})`,
          }}
        />
      ))}
    </div>
  );
};
