import React from 'react';
import type {FocusName} from '../config/focus';
import {ACCENT, FONTS, NEUTRAL} from '../config/theme';
import {FPS, STAGE} from '../config/timeline';
import {ramp} from '../lib/ease';
import {spr} from '../lib/spring';
import {useCameraState} from './Camera';
import {
  GLASS,
  GLASS_SHADOW,
  estimateTextWidth,
  resolveFxPoint,
  resolveFxRect,
  useFxFrame,
  type FxPoint,
} from './fxUtils';

export type CalloutSide = 'left' | 'right' | 'top' | 'bottom';

export type CalloutProps = {
  /** 4 words max (copy.ts CALLOUTS). */
  text: string;
  /**
   * What the callout points at.
   *  - a FocusName: the dot sits just inside that rectangle's edge facing the chip.
   *  - an FxPoint: the dot sits exactly there ({x, y, space: 'ui'} follows the camera).
   */
  anchor: FocusName | FxPoint;
  /** Which side of the anchor the chip sits on (default 'right'). The chip is always OUTSIDE the target. */
  side?: CalloutSide;
  /** Screen px from the dot to the chip edge (default 96, minimum 56). */
  distance?: number;
  /** Slide the chip along the edge, in screen px (default 0). */
  shift?: number;
  /** For a FocusName anchor: how far inside the edge the dot sits, in px (default 14). */
  inset?: number;
  startFrame: number;
  endFrame: number;
  /** Font size in px at 1080p (default 24; keep 22 to 26). */
  fontSize?: number;
  frame?: number;
};

const MIN_DISTANCE = 56;
const SAFE_MARGIN = 56;
const PAD_X = 20;
const PAD_Y = 11;
const DOT = 10;
const OUT_FRAMES = 10;

const DIRECTION: Record<CalloutSide, {x: number; y: number}> = {
  right: {x: 1, y: 0},
  left: {x: -1, y: 0},
  top: {x: 0, y: -1},
  bottom: {x: 0, y: 1},
};

/** Where the chip's box sits relative to its attach point, as a CSS translate. */
const CHIP_TRANSLATE: Record<CalloutSide, string> = {
  right: 'translate(0, -50%)',
  left: 'translate(-100%, -50%)',
  top: 'translate(-50%, -100%)',
  bottom: 'translate(-50%, 0)',
};

/** clip-path inset() that reveals the chip starting from the side its leader line attaches to. */
const wipe = (side: CalloutSide, reveal: number, radius: number): string => {
  const hidden = `${((1 - reveal) * 100).toFixed(2)}%`;
  switch (side) {
    case 'right':
      return `inset(0 ${hidden} 0 0 round ${radius}px)`;
    case 'left':
      return `inset(0 0 0 ${hidden} round ${radius}px)`;
    case 'top':
      return `inset(${hidden} 0 0 0 round ${radius}px)`;
    default:
      return `inset(0 0 ${hidden} 0 round ${radius}px)`;
  }
};

/**
 * A small glass chip with a thin leader line and a dot, pointing at something in the app.
 * The anchor is projected through the live camera, so the callout stays glued to the UI during moves.
 * Reveal is a MASK wipe out of the dot (not a fade) with a spring; exit retraces it.
 *
 * Render in the SCREEN layer of <Camera screen={...}>. Frame the shot with enough padding on the chip's
 * side (about chip width + distance) or the chip is clamped to the safe margin and may crowd the target.
 */
export const Callout: React.FC<CalloutProps> = ({
  text,
  anchor,
  side = 'right',
  distance = 96,
  shift = 0,
  inset = 14,
  startFrame,
  endFrame,
  fontSize = 24,
  frame: frameOverride,
}) => {
  const frame = useFxFrame(frameOverride);
  const camera = useCameraState();
  if (frame < startFrame || frame > endFrame) {
    return null;
  }

  // ---- where the dot is
  let dot: {x: number; y: number};
  if (typeof anchor === 'string') {
    const rect = resolveFxRect(camera, anchor);
    const midX = rect.x + rect.w / 2;
    const midY = rect.y + rect.h / 2;
    dot =
      side === 'right'
        ? {x: rect.x + rect.w - inset, y: midY}
        : side === 'left'
          ? {x: rect.x + inset, y: midY}
          : side === 'top'
            ? {x: midX, y: rect.y + inset}
            : {x: midX, y: rect.y + rect.h - inset};
  } else {
    dot = resolveFxPoint(camera, anchor);
  }

  // ---- where the chip attaches (kept fully on screen using an estimated width)
  const dir = DIRECTION[side];
  const gap = Math.max(MIN_DISTANCE, distance);
  const chipW = estimateTextWidth(text, fontSize) + PAD_X * 2;
  const chipH = fontSize * 1.2 + PAD_Y * 2;

  let attachX = dot.x + dir.x * gap + (dir.x === 0 ? shift : 0);
  let attachY = dot.y + dir.y * gap + (dir.y === 0 ? shift : 0);

  const left = side === 'right' ? attachX : side === 'left' ? attachX - chipW : attachX - chipW / 2;
  const top = side === 'bottom' ? attachY : side === 'top' ? attachY - chipH : attachY - chipH / 2;
  const clampDx = Math.min(0, STAGE.width - SAFE_MARGIN - (left + chipW)) + Math.max(0, SAFE_MARGIN - left);
  const clampDy = Math.min(0, STAGE.height - SAFE_MARGIN - (top + chipH)) + Math.max(0, SAFE_MARGIN - top);
  attachX += clampDx;
  attachY += clampDy;

  // ---- timing: dot pops, line draws, chip wipes out of the line's end. Exit retraces it.
  const exit = ramp(frame, endFrame - OUT_FRAMES, endFrame);
  const dotPop = spr(frame, FPS, startFrame, 'settle') * (1 - exit);
  const lineDraw = ramp(frame, startFrame + 2, startFrame + 12) * (1 - exit);
  const chipSpring = spr(frame, FPS, startFrame + 5, 'uiPop');
  const reveal = Math.min(1, chipSpring) * (1 - exit);
  const settle = 0.94 + 0.06 * Math.min(1.05, chipSpring); // tiny scale-up while it wipes in

  // ---- the leader line
  const lineDx = attachX - dot.x;
  const lineDy = attachY - dot.y;
  const lineLength = Math.hypot(lineDx, lineDy);
  const lineAngle = (Math.atan2(lineDy, lineDx) * 180) / Math.PI;

  const radius = Math.round(chipH / 2.6);

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: STAGE.width, height: STAGE.height, pointerEvents: 'none'}}>
      {/* leader line */}
      <div
        style={{
          position: 'absolute',
          left: dot.x,
          top: dot.y - 0.5,
          width: lineLength,
          height: 1,
          background: 'rgba(255, 255, 255, 0.42)',
          transformOrigin: '0 50%',
          transform: `rotate(${lineAngle.toFixed(3)}deg) scaleX(${lineDraw.toFixed(4)})`,
        }}
      />
      {/* dot */}
      <div
        style={{
          position: 'absolute',
          left: dot.x - DOT / 2,
          top: dot.y - DOT / 2,
          width: DOT,
          height: DOT,
          borderRadius: '50%',
          background: ACCENT.base,
          boxShadow: `0 0 0 ${Math.round(DOT * 0.5)}px rgba(255, 32, 82, 0.22), 0 0 14px rgba(255, 32, 82, 0.7)`,
          transform: `scale(${dotPop.toFixed(4)})`,
        }}
      />
      {/* chip: shadow sibling (unclipped), then the clipped glass chip */}
      <div
        style={{
          position: 'absolute',
          left: attachX,
          top: attachY,
          transform: `${CHIP_TRANSLATE[side]} scale(${settle.toFixed(4)})`,
          transformOrigin:
            side === 'right' ? '0% 50%' : side === 'left' ? '100% 50%' : side === 'top' ? '50% 100%' : '50% 0%',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radius,
            boxShadow: GLASS_SHADOW,
            opacity: reveal,
          }}
        />
        <div
          style={{
            ...GLASS,
            position: 'relative',
            padding: `${PAD_Y}px ${PAD_X}px`,
            borderRadius: radius,
            whiteSpace: 'nowrap',
            fontFamily: FONTS.body,
            fontWeight: 600,
            fontSize,
            lineHeight: 1.2,
            letterSpacing: '-0.005em',
            color: NEUTRAL[100],
            clipPath: wipe(side, reveal, radius),
            WebkitClipPath: wipe(side, reveal, radius),
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};
