import React from 'react';
import type {CSSProperties} from 'react';
import {CAMERA_PERSPECTIVE, cameraKey, type CameraKeyframe, type CursorWaypoint} from '../config/camera';
import {HEADLINE} from '../config/copy';
import {HEADLINE_LAYOUT, INTRO, WINDOW_RISE} from '../config/intro';
import {NEUTRAL} from '../config/theme';
import {FPS, SCENES, STAGE} from '../config/timeline';
import {KineticText} from '../fx/KineticText';
import {ramp} from '../lib/ease';
import {spr} from '../lib/spring';
import type {SceneOverlayProps, WindowStyleFn} from './sceneTypes';

/**
 * S1 — REVEAL (f120-239)
 *
 *   f124      headline line 1 "Describe a task." rises out of its mask (words 3 f apart)
 *   f150      line 2 "Get a team." (word "team." in crimson, underline draws)
 *   f160      the app window rises from below: y +140 -> 0, rotateX 18 -> 6 deg, scale .86 -> .94,
 *             opacity 0 -> 1, window spring. It is dimmed (50%) so the headline stays readable over it.
 *   f196-236  the window settles flat (scale 1, rotateX 0) and brightens while the headline leaves as one block
 *             (slides up, blurs, fades, f200-232); the S0 lockup above it leaves earlier, f186-208
 *   f212-240  the camera pushes in until the window fills 92% of the frame; the spring is 99.8% settled on the f240 beat
 *
 * The headline lives in the camera's SCREEN layer (above the window and the depth of field), the window in the world.
 */

/** Camera: opening pose = the window at its natural size with a small yaw, then the push-in to 92%. */
export const S1_CAMERA: CameraKeyframe[] = [
  // padding 135 -> zoom exactly 1.0 (the window at its UI_OFFSET), a little yaw for the 3/4 feel
  cameraKey(SCENES.S1.start, 'fullWindow', {padding: 135, rotateY: -4}),
  // padding 43 -> zoom 1.227: the 1440x810 window fills 92% of the 1920x1080 frame
  cameraKey(INTRO.cameraPush, 'fullWindow', {padding: 43}),
];

/** No cursor in S1. */
export const S1_CURSOR: CursorWaypoint[] = [];

const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/**
 * The window's own box style for S0-S5 (S6 may override it through S6_WINDOW). Before f160 it is invisible;
 * from f236 on it is the identity (no transform, no filter), so every later scene works on a flat window.
 */
export const S1_WINDOW: WindowStyleFn = (frame): CSSProperties => {
  if (frame < INTRO.windowRise) {
    return {opacity: 0};
  }
  if (frame >= INTRO.windowSettleEnd) {
    return {opacity: 1};
  }

  const rise = spr(frame, FPS, INTRO.windowRise, 'panel'); // may overshoot 1 a little: the soft settle
  const settle = ramp(frame, INTRO.windowSettleStart, INTRO.windowSettleEnd);
  const opacity = ramp(frame, INTRO.windowRise, INTRO.windowRise + INTRO.windowFadeFrames);

  const y = (1 - rise) * WINDOW_RISE.fromY;
  const scale = lerp(lerp(WINDOW_RISE.scaleFrom, WINDOW_RISE.scaleTo, rise), 1, settle);
  const rotateX = lerp(lerp(WINDOW_RISE.rotateXFrom, WINDOW_RISE.rotateXTo, rise), 0, settle);
  const brightness = lerp(INTRO.windowDim, 1, ramp(frame, INTRO.windowBrightenStart, INTRO.windowBrightenEnd));

  return {
    opacity,
    transform: `perspective(${CAMERA_PERSPECTIVE}px) translate3d(0, ${y.toFixed(3)}px, 0) rotateX(${rotateX.toFixed(4)}deg) scale(${scale.toFixed(5)})`,
    transformOrigin: '50% 50%',
    filter: brightness < 0.999 ? `brightness(${brightness.toFixed(4)})` : undefined,
  };
};

export const S1Reveal: React.FC<SceneOverlayProps> = ({frame}) => {
  const exit = ramp(frame, INTRO.headlineExit, INTRO.headlineExitEnd);
  if (frame < INTRO.headlineLine1 || exit >= 1) {
    return null;
  }

  const blur = 18 * exit;
  const lift = -90 * exit;
  const scrim = ramp(frame, INTRO.headlineLine1, INTRO.headlineLine2 + 12) * (1 - exit);

  return (
    <>
      {/* soft scrim: keeps the white headline readable over the dimmed window */}
      <div
        style={{
          position: 'absolute',
          left: STAGE.width / 2 - HEADLINE_LAYOUT.scrimWidth / 2,
          top: HEADLINE_LAYOUT.centerY - HEADLINE_LAYOUT.scrimHeight / 2,
          width: HEADLINE_LAYOUT.scrimWidth,
          height: HEADLINE_LAYOUT.scrimHeight,
          background: `radial-gradient(ellipse closest-side at 50% 50%, rgba(5,5,5,${HEADLINE_LAYOUT.scrimAlpha}) 0%, rgba(5,5,5,${(HEADLINE_LAYOUT.scrimAlpha * 0.55).toFixed(3)}) 55%, rgba(5,5,5,0) 100%)`,
          opacity: scrim,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: HEADLINE_LAYOUT.centerY,
          width: STAGE.width,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `translateY(calc(-50% + ${lift.toFixed(2)}px))`,
          opacity: 1 - exit,
          filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
          pointerEvents: 'none',
        }}
      >
        <KineticText
          lines={[HEADLINE.line1]}
          startFrame={INTRO.headlineLine1}
          fontSize={HEADLINE_LAYOUT.fontSize}
          color={NEUTRAL[100]}
          frame={frame}
        />
        <KineticText
          lines={[HEADLINE.line2]}
          startFrame={INTRO.headlineLine2}
          highlight={HEADLINE.highlight}
          underline
          fontSize={HEADLINE_LAYOUT.fontSize}
          color={NEUTRAL[100]}
          frame={frame}
        />
      </div>
    </>
  );
};
