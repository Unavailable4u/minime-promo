import React from 'react';
import {ACCENT, FONTS, NEUTRAL} from '../config/theme';
import {STAGE} from '../config/timeline';
import {ramp} from '../lib/ease';
import {useFxFrame} from './fxUtils';

export type CaptionProps = {
  /** The full line, for example "Simple asks? Instant." */
  text: string;
  /** The key word(s) inside `text` that turn crimson, for example "Instant." */
  highlight?: string;
  /** Optional second, quieter line. */
  sub?: string;
  /** First frame of the reveal. */
  startFrame: number;
  /** Frame at which the exit finishes (the exit starts EXIT_FRAMES before it). */
  endFrame: number;
  /** Font size in px at 1080p (default 68; keep 56 to 76). */
  fontSize?: number;
  /** Distance from the bottom edge of the stage to the baseline area (default 104, the safe area). */
  bottom?: number;
  frame?: number;
};

const ENTER_FRAMES = 16;
const EXIT_FRAMES = 10;
const SUB_DELAY = 5;

/** Split `text` around `highlight` (first occurrence). No match = no highlight. */
const splitHighlight = (
  text: string,
  highlight?: string,
): {before: string; hit: string; after: string} => {
  if (!highlight) {
    return {before: text, hit: '', after: ''};
  }
  const index = text.indexOf(highlight);
  if (index < 0) {
    return {before: text, hit: '', after: ''};
  }
  return {
    before: text.slice(0, index),
    hit: highlight,
    after: text.slice(index + highlight.length),
  };
};

/**
 * One masked line: the text sits inside an overflow:hidden box and rises from below the box edge
 * (translateY 110% -> 0), then leaves upward on exit. Nothing fades; the mask does the reveal.
 * The vertical padding/negative margin keep descenders and accents from being clipped.
 */
const MaskedLine: React.FC<{
  children: React.ReactNode;
  enter: number;
  exit: number;
  style?: React.CSSProperties;
}> = ({children, enter, exit, style}) => (
  <div
    style={{
      overflow: 'hidden',
      padding: '0.14em 0.06em',
      margin: '-0.14em -0.06em',
    }}
  >
    <div
      style={{
        ...style,
        whiteSpace: 'nowrap',
        transform: `translateY(${((1 - enter) * 110 - exit * 110).toFixed(3)}%)`,
      }}
    >
      {children}
    </div>
  </div>
);

/**
 * The scene caption: one line, bottom-center, in the safe area. Reads straight from copy.ts:
 *   <Caption {...CAPTIONS.instant} startFrame={f(270)} endFrame={f(440)} />
 * Render it in the SCREEN layer (it must not be zoomed by the camera).
 */
export const Caption: React.FC<CaptionProps> = ({
  text,
  highlight,
  sub,
  startFrame,
  endFrame,
  fontSize = 68,
  bottom = 104,
  frame: frameOverride,
}) => {
  const frame = useFxFrame(frameOverride);
  if (frame < startFrame || frame > endFrame) {
    return null;
  }

  const exitStart = endFrame - EXIT_FRAMES;
  const enter = ramp(frame, startFrame, startFrame + ENTER_FRAMES);
  const exit = ramp(frame, exitStart, endFrame);
  const subEnter = ramp(frame, startFrame + SUB_DELAY, startFrame + SUB_DELAY + ENTER_FRAMES);
  const subExit = ramp(frame, exitStart + 2, endFrame);

  const {before, hit, after} = splitHighlight(text, highlight);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: STAGE.width,
        bottom,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: Math.round(fontSize * 0.22),
        pointerEvents: 'none',
        textShadow: '0 4px 32px rgba(0, 0, 0, 0.6)',
      }}
    >
      <MaskedLine
        enter={enter}
        exit={exit}
        style={{
          fontFamily: FONTS.heading,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: NEUTRAL[100],
        }}
      >
        {before}
        {hit ? <span style={{color: ACCENT.base}}>{hit}</span> : null}
        {after}
      </MaskedLine>
      {sub ? (
        <MaskedLine
          enter={subEnter}
          exit={subExit}
          style={{
            fontFamily: FONTS.body,
            fontWeight: 500,
            fontSize: Math.round(fontSize * 0.4),
            lineHeight: 1.3,
            letterSpacing: '-0.005em',
            color: NEUTRAL[400],
          }}
        >
          {sub}
        </MaskedLine>
      ) : null}
    </div>
  );
};
