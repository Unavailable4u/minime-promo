import React from 'react';
import type {CameraKeyframe, CursorWaypoint} from '../config/camera';
import {INTRO, LOCKUP, LOGO_BOUNDS} from '../config/intro';
import {BRAND} from '../config/copy';
import {ACCENT, FONTS, NEUTRAL} from '../config/theme';
import {Glow} from '../fx/Glow';
import {clamp01, ramp} from '../lib/ease';
import {MiniMeLogo, logoProgress} from '../ui/MiniMeLogo';
import type {GridOpacityFn, SceneOverlayProps} from './sceneTypes';

/**
 * S0 — LOGO (f0-119), plus the lockup's rest above the S1 headline until it leaves (about f232).
 *
 *   f0-8     pure #050505 (the stage backdrop is drawn by MiniMePromo.tsx)
 *   f8-54    the mark pen-draws (path 2 starts 4 f later; the crimson fill takes over from ~f37-40 per path)
 *   f60      beat 4 impact: bloom pulse (Glow: scale .6 -> 1.4, opacity .5 -> 0) + 2% scale hit on the mark
 *   f70-100  "Mini" "Me" slides out of the mark's right edge through a mask (Sora 800, ~120 px)
 *   f100-119 the lockup eases up and shrinks to 55% while the grid floor fades in
 *   f186-208 (S1) the lockup leaves before the camera pushes in: slides up, blurs, fades
 *
 * No camera move and no cursor in S0 (S0_CAMERA / S0_CURSOR are empty); the camera is held by S1_CAMERA.
 */
export const S0_CAMERA: CameraKeyframe[] = [];
export const S0_CURSOR: CursorWaypoint[] = [];

/** Grid floor opacity for the intro: fades in f100-119, out f200-239 (the push-in). */
export const S0_GRID: GridOpacityFn = (frame) =>
  ramp(frame, INTRO.gridInStart, INTRO.gridInEnd) * (1 - ramp(frame, INTRO.gridOutStart, INTRO.gridOutEnd));

/** 0..1..0 impact pulse: up in 2 frames on the beat, then an exponential decay. */
const impactHit = (frame: number): number => {
  const local = frame - INTRO.impact;
  if (local < -1) {
    return 0;
  }
  return clamp01((local + 2) / 2) * Math.exp(-Math.max(0, local) / INTRO.hitDecay);
};

const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/**
 * The logo SVG cropped to its painted bounds: a box exactly as big as the visible mark, with the (overflow
 * visible) SVG offset inside it. Layout, centering and the wordmark gap then work on what the eye sees.
 */
const MarkBox: React.FC<{progress: number; size: number; glow: number}> = ({progress, size, glow}) => {
  const unit = size / LOGO_BOUNDS.viewBoxWidth; // px per viewBox unit
  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        width: (LOGO_BOUNDS.x1 - LOGO_BOUNDS.x0) * unit,
        height: (LOGO_BOUNDS.y1 - LOGO_BOUNDS.y0) * unit,
      }}
    >
      <div style={{position: 'absolute', left: -LOGO_BOUNDS.x0 * unit, top: -LOGO_BOUNDS.y0 * unit}}>
        <MiniMeLogo progress={progress} size={size} glow={glow} strokePx={LOCKUP.strokePx} />
      </div>
    </div>
  );
};

export const S0Logo: React.FC<SceneOverlayProps> = ({frame}) => {
  const exit = ramp(frame, INTRO.lockupExit, INTRO.lockupExitEnd);
  if (frame < INTRO.blackHold || exit >= 1) {
    return null;
  }

  // ----- the pen draw
  const progress = logoProgress(frame, INTRO.drawStart);
  const hit = impactHit(frame);

  // ----- the wordmark slide-out (0..1, signature ease)
  const slide = ramp(frame, INTRO.wordmarkStart, INTRO.wordmarkEnd);
  const markSize = lerp(LOCKUP.markSizeAlone, LOCKUP.markSizeLockup, slide) * (1 + INTRO.hitAmount * hit);
  const glow = frame >= INTRO.impact - 1 ? 0.28 + 0.6 * hit : 0;

  // ----- the settle: up and smaller (f100-119)
  const settle = ramp(frame, INTRO.lockupStart, INTRO.lockupEnd);
  const centerY = lerp(LOCKUP.heroY, LOCKUP.restY, settle);
  const scale = lerp(1, LOCKUP.restScale, settle);

  // ----- the exit (f186-208): slides up, blurs, fades
  const exitY = -90 * exit;
  const blur = 10 * exit;

  // The row is [mark][mask box with the wordmark]. Its width follows its content, so to keep the MARK on the
  // stage center while the wordmark is still hidden, the row is shifted right by half of everything that is
  // not the mark: (rowWidth - markWidth) / 2 = 50% of the row's own width minus half the mark.
  const hidden = 1 - slide;
  const markWidth = ((LOGO_BOUNDS.x1 - LOGO_BOUNDS.x0) / LOGO_BOUNDS.viewBoxWidth) * markSize;
  const shift = `calc(${(hidden * 50).toFixed(3)}% - ${((hidden * markWidth) / 2).toFixed(3)}px)`;

  const wordSize = LOCKUP.wordmarkSize;

  return (
    <>
      <Glow startFrame={INTRO.impact} at={{x: LOCKUP.centerX, y: LOCKUP.heroY}} size={1100} frames={30} intensity={1} frame={frame} />
      <div
        style={{
          position: 'absolute',
          left: LOCKUP.centerX,
          top: centerY + exitY,
          display: 'flex',
          alignItems: 'center',
          opacity: 1 - exit,
          filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
          transform: `translate(-50%, -50%) translateX(${shift}) scale(${scale.toFixed(5)})`,
          transformOrigin: '50% 50%',
          width: 'max-content',
        }}
      >
        <MarkBox progress={progress} size={markSize} glow={glow} />
        {/* The mask box: its left edge is the mark's right edge, so the wordmark appears to slide out of the mark. */}
        <div
          style={{
            overflow: 'hidden',
            padding: '0.16em 0.06em 0.16em 0',
            margin: '-0.16em 0',
            fontFamily: FONTS.heading,
            fontWeight: 800,
            fontSize: wordSize,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          <div
            style={{
              whiteSpace: 'nowrap',
              paddingLeft: `${LOCKUP.gapEm}em`,
              transform: `translateX(${(-hidden * 100).toFixed(3)}%)`,
            }}
          >
            <span style={{color: NEUTRAL[200]}}>{BRAND.mini}</span>
            <span style={{color: ACCENT.wordmarkMe}}>{BRAND.me}</span>
          </div>
        </div>
      </div>
    </>
  );
};
