import React from 'react';
import {FPS} from '../config/timeline';
import {easeInOut, clamp01} from '../lib/ease';
import {MiniMeLogo} from './MiniMeLogo';

/**
 * The real "thinking" loop, in seconds (700 ms draw, path 2 delayed 90 ms, 480 ms hold, 340 ms fade, 140 ms rest).
 * At 30 fps that is about 21 f draw, 3 f delay, 14 f hold, 10 f fade, 4 f rest = 52.5 f per cycle.
 * The cycle is computed in seconds from the frame, so it stays correct if FPS changes.
 */
export const AVATAR_LOOP = {
  draw: 0.7,
  path2Delay: 0.09,
  hold: 0.48,
  fade: 0.34,
  rest: 0.14,
} as const;

const DRAW_TOTAL = AVATAR_LOOP.draw + AVATAR_LOOP.path2Delay; // 0.79 s until both paths are drawn
const FADE_START = DRAW_TOTAL + AVATAR_LOOP.hold; // 1.27 s
const CYCLE = FADE_START + AVATAR_LOOP.fade + AVATAR_LOOP.rest; // 1.75 s

/** Length of one thinking loop in frames (52.5 at 30 fps). */
export const AVATAR_LOOP_FRAMES = CYCLE * FPS;

export type AssistantAvatarProps = {
  /** "static" = the solid crimson mark. "thinking" = the looping pen-draw. */
  mode: 'static' | 'thinking';
  /** Frame local to the message (only used by "thinking"). */
  frame: number;
  /** Box size in px. Default 26. */
  size?: number;
  style?: React.CSSProperties;
};

/** State of the thinking loop at a local frame. Exported so tests and dev sheets can inspect it. */
export const thinkingState = (frame: number): {progress: number; opacity: number} => {
  const t = (((frame / FPS) % CYCLE) + CYCLE) % CYCLE; // seconds into the cycle, always >= 0
  const progress = clamp01(t / DRAW_TOTAL);
  const opacity = 1 - easeInOut((t - FADE_START) / AVATAR_LOOP.fade); // 1 until the fade, 0 during the rest
  return {progress, opacity};
};

export const AssistantAvatar: React.FC<AssistantAvatarProps> = ({mode, frame, size = 26, style}) => {
  const box: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  if (mode === 'static') {
    return (
      <div style={box}>
        <MiniMeLogo progress={1} fill={1} size={size} />
      </div>
    );
  }

  const {progress, opacity} = thinkingState(frame);
  return (
    <div style={{...box, opacity}}>
      <MiniMeLogo progress={progress} size={size} path2Offset={AVATAR_LOOP.path2Delay / DRAW_TOTAL} />
    </div>
  );
};
