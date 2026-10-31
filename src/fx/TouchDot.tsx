import React from 'react';
import {ACCENT, SURFACE} from '../config/theme';
import {f} from '../config/timeline';
import {clamp01} from '../lib/ease';

export type TouchDotProps = {
  /** Centre of the touch in the PARENT's logical px (the parent must be position: relative / absolute). */
  x: number;
  y: number;
  /** 0..1 visibility (scales in from 0.6 and fades; the dot is the only thing that ever "fades" here). */
  on: number;
  /** 0..1 press: the dot dips to 82 % and brightens. */
  down: number;
  /** Age in frames of the latest ripple, or null. The ripple lasts f(14) frames (the same look as the desktop cursor click). */
  ripple: number | null;
  /** Dot diameter in logical px. Default 28. */
  size?: number;
};

const RIPPLE_FRAMES = f(14);

/**
 * A translucent white touch dot with a crimson ripple (same ring + faint fill as the desktop cursor's click ripple).
 * Pure: props in, pixels out. It never reads the frame.
 */
export const TouchDot: React.FC<TouchDotProps> = ({x, y, on, down, ripple, size = 28}) => {
  const visible = clamp01(on);
  if (visible <= 0.001) {
    return null;
  }
  const press = clamp01(down);
  const scale = (0.6 + 0.4 * visible) * (1 - 0.18 * press);
  const life = ripple === null ? 1 : clamp01(ripple / RIPPLE_FRAMES);
  const rippleEase = 1 - Math.pow(1 - life, 3);
  const rippleSize = size * (0.7 + 1.9 * rippleEase);

  return (
    <>
      {ripple !== null && life < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: x - rippleSize / 2,
            top: y - rippleSize / 2,
            width: rippleSize,
            height: rippleSize,
            borderRadius: '50%',
            boxSizing: 'border-box',
            border: `2px solid ${ACCENT.base}`,
            background: SURFACE.crimsonGlow(0.2),
            opacity: 0.5 * Math.pow(1 - life, 1.2),
            pointerEvents: 'none',
            zIndex: 9000,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          boxSizing: 'border-box',
          background: `rgba(255, 255, 255, ${(0.34 + 0.2 * press) * visible})`,
          border: `1.5px solid rgba(255, 255, 255, ${0.7 * visible})`,
          boxShadow: `0 3px 14px rgba(0, 0, 0, ${0.45 * visible}), inset 0 0 8px rgba(255, 255, 255, 0.22)`,
          transform: `scale(${scale.toFixed(4)})`,
          pointerEvents: 'none',
          zIndex: 9001,
        }}
      />
    </>
  );
};
