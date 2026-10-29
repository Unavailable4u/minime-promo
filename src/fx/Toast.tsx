import React from 'react';
import {UI_TEXT} from '../config/copy';
import {FONTS, NEUTRAL, STATUS} from '../config/theme';
import {FPS, STAGE} from '../config/timeline';
import {ramp} from '../lib/ease';
import {spr} from '../lib/spring';
import {GLASS, GLASS_SHADOW, estimateTextWidth, useFxFrame} from './fxUtils';

export type ToastProps = {
  /** First frame of the slide-up. */
  startFrame: number;
  /** How long the toast lives in frames, exit included (default 40). */
  life?: number;
  /** Text (default: UI_TEXT.toastSavedTemplate). */
  text?: string;
  /** Center of the toast at rest, stage px (default: bottom center, above the caption). */
  x?: number;
  y?: number;
  /** Font size in px at 1080p (default 26). */
  fontSize?: number;
  frame?: number;
};

const ENTER_SLIDE = 36; // px it rises from
const OUT_FRAMES = 10;
const ICON_GAP = 14;

/**
 * "Saved as workflow template": a glass pill with a green check that slides up with a spring, rests,
 * then sinks back out through its own mask (clip from the top). Lives exactly `life` frames.
 * The check is an inline SVG (no text glyph). Render it in the SCREEN layer.
 */
export const Toast: React.FC<ToastProps> = ({
  startFrame,
  life = 40,
  text = UI_TEXT.toastSavedTemplate,
  x = STAGE.width / 2,
  y = STAGE.height - 230,
  fontSize = 26,
  frame: frameOverride,
}) => {
  const frame = useFxFrame(frameOverride);
  const endFrame = startFrame + life;
  if (frame < startFrame || frame > endFrame) {
    return null;
  }

  const exit = ramp(frame, endFrame - OUT_FRAMES, endFrame);
  const rise = spr(frame, FPS, startFrame, 'uiPop');
  const reveal = Math.max(0, Math.min(1, rise)) * (1 - exit);
  const slide = (1 - Math.min(1.04, rise)) * ENTER_SLIDE + exit * ENTER_SLIDE * 0.6;

  const icon = Math.round(fontSize * 1.15);
  const padX = Math.round(fontSize * 0.75);
  const padY = Math.round(fontSize * 0.46);
  const height = Math.max(icon, fontSize * 1.2) + padY * 2;
  const width = estimateTextWidth(text, fontSize, 0.55) + icon + ICON_GAP + padX * 2;
  const radius = Math.round(height / 2.4);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${slide.toFixed(2)}px)`,
        pointerEvents: 'none',
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
          display: 'flex',
          alignItems: 'center',
          gap: ICON_GAP,
          whiteSpace: 'nowrap',
          minWidth: Math.round(width * 0.9),
          padding: `${padY}px ${padX}px`,
          borderRadius: radius,
          fontFamily: FONTS.body,
          fontWeight: 600,
          fontSize,
          lineHeight: 1.2,
          letterSpacing: '-0.005em',
          color: NEUTRAL[100],
          clipPath: `inset(${((1 - reveal) * 100).toFixed(2)}% 0 0 0 round ${radius}px)`,
          WebkitClipPath: `inset(${((1 - reveal) * 100).toFixed(2)}% 0 0 0 round ${radius}px)`,
        }}
      >
        <svg width={icon} height={icon} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}>
          <circle cx="12" cy="12" r="11" fill={STATUS.done} />
          <path
            d="M7 12.5 L10.4 15.9 L17 8.8"
            fill="none"
            stroke="#06240f"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{text}</span>
      </div>
    </div>
  );
};
