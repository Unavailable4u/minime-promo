import React from 'react';
import {FONTS, NEUTRAL} from '../config/theme';
import {FPS, STAGE} from '../config/timeline';
import {ramp} from '../lib/ease';
import {spr} from '../lib/spring';
import {useCameraState} from './Camera';
import {GLASS, GLASS_SHADOW, resolveFxPoint, useFxFrame, type FxPoint} from './fxUtils';

export type KeyCapProps = {
  /** First frame of the pop-in. The key is pressed `ENTER_FRAMES` later. */
  startFrame: number;
  /** Where the key sits (center). {x, y} = stage px; add space: 'ui' to follow the camera. Default: bottom center. */
  at?: FxPoint;
  /** Frames the key stays pressed down (default 6). */
  hold?: number;
  /** Optional word beside the arrow, for example "Enter". Default: just the arrow. */
  label?: string;
  /** Key size in px (default 56). */
  size?: number;
  frame?: number;
};

/** Frames from the pop-in to the press. */
export const KEYCAP_ENTER_FRAMES = 4;
const EXIT_FRAMES = 5;

/** Total life of a key cap in frames: pop-in, pressed, wipe-out. */
export const keyCapLife = (hold = 6): number => KEYCAP_ENTER_FRAMES + hold + EXIT_FRAMES;

/**
 * The tiny enter-key chip: pops in, is pressed for `hold` frames (6 by default: it dips and darkens),
 * releases and leaves through a bottom-up mask wipe. The return arrow is an inline SVG (the font
 * subsets have no reliable arrow glyph). Render it in the SCREEN layer.
 */
export const KeyCap: React.FC<KeyCapProps> = ({
  startFrame,
  at = {x: STAGE.width / 2, y: STAGE.height - 220},
  hold = 6,
  label,
  size = 56,
  frame: frameOverride,
}) => {
  const frame = useFxFrame(frameOverride);
  const camera = useCameraState();
  const pressFrame = startFrame + KEYCAP_ENTER_FRAMES;
  const endFrame = pressFrame + hold + EXIT_FRAMES;
  if (frame < startFrame || frame > endFrame) {
    return null;
  }

  const center = resolveFxPoint(camera, at);
  const pop = spr(frame, FPS, startFrame, 'settle');
  const exit = ramp(frame, pressFrame + hold, endFrame);
  const reveal = Math.min(1, pop) * (1 - exit);

  // Press: dips over 2 frames, stays down for `hold`, springs back during the exit.
  const down = ramp(frame, pressFrame - 1, pressFrame + 1) * (1 - ramp(frame, pressFrame + hold, pressFrame + hold + 2));
  const scale = (0.78 + 0.22 * Math.min(1.08, pop)) * (1 - 0.07 * down);
  const drop = 3 * down;

  const iconSize = Math.round(size * 0.46);
  const radius = Math.round(size * 0.26);

  return (
    <div
      style={{
        position: 'absolute',
        left: center.x,
        top: center.y,
        transform: `translate(-50%, -50%) translateY(${drop.toFixed(2)}px) scale(${scale.toFixed(4)})`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius,
          boxShadow: down > 0.5 ? '0 4px 12px rgba(0,0,0,0.4)' : GLASS_SHADOW,
          opacity: reveal,
        }}
      />
      <div
        style={{
          ...GLASS,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Math.round(size * 0.2),
          minWidth: size,
          height: size,
          padding: label ? `0 ${Math.round(size * 0.3)}px` : 0,
          boxSizing: 'border-box',
          borderRadius: radius,
          background: `linear-gradient(180deg, rgba(255,255,255,${(0.1 - 0.06 * down).toFixed(3)}) 0%, rgba(255,255,255,0.03) 100%), rgba(${Math.round(18 - 8 * down)},${Math.round(18 - 8 * down)},${Math.round(18 - 8 * down)},0.7)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,${(0.14 * (1 - down)).toFixed(3)}), inset 0 -${Math.round(3 * (1 - down))}px 0 rgba(0,0,0,0.35)`,
          fontFamily: FONTS.mono,
          fontWeight: 600,
          fontSize: Math.round(size * 0.3),
          letterSpacing: '-0.01em',
          color: NEUTRAL[100],
          clipPath: `inset(${((1 - reveal) * 100).toFixed(2)}% 0 0 0 round ${radius}px)`,
          WebkitClipPath: `inset(${((1 - reveal) * 100).toFixed(2)}% 0 0 0 round ${radius}px)`,
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{display: 'block'}}
        >
          <polyline points="9 10 4 15 9 20" />
          <path d="M20 4v7a4 4 0 0 1-4 4H4" />
        </svg>
        {label ? <span>{label}</span> : null}
      </div>
    </div>
  );
};
