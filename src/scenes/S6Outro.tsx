import React from 'react';
import type {CSSProperties} from 'react';
import {cameraKey, type CameraKeyframe, type CursorWaypoint} from '../config/camera';
import {BRAND, CAPTIONS, CTA, HEADLINE} from '../config/copy';
import {LOGO_BOUNDS} from '../config/intro';
import {DEVICE_TIMES} from '../config/devices';
import {OUTRO, OUTRO_LAYOUT} from '../config/outro';
import {ACCENT, FONTS, NEUTRAL} from '../config/theme';
import {STAGE, f} from '../config/timeline';
import {Caption} from '../fx/Caption';
import {Glow} from '../fx/Glow';
import {KineticText} from '../fx/KineticText';
import {Spotlight} from '../fx/Spotlight';
import {clamp01, ramp, signatureEase} from '../lib/ease';
import {MiniMeLogo, logoProgress} from '../ui/MiniMeLogo';
import type {GridOpacityFn, SceneOverlayProps, WindowStyleFn} from './sceneTypes';

/**
 * S6 — OUTRO (f1500-1859) — patch 15B: "one workspace, every screen".
 * The persistent <ChatApp/> becomes the screen of a laptop inside <DeviceStage/> (src/ui/devices); a tablet and a phone join it.
 * This file adds the camera, the cursor exit, the nav-sweep hook and the overlays. Tunables: src/config/outro.ts (end card)
 * and src/config/devices.ts (poses and timings of the cluster).
 *
 *   f1500-1560  cut, pull-back, the window floats over the grid, nav light sweep, caption "Chat is just the beginning."
 *   f1560       laptop build: edge-light trace, bezel grows, base slides out, floor glow; wake wipe f1590-1602
 *   f1620       tablet arcs in (power-on mark, wakes f1638)   |  f1650 phone arcs in, boot 0-100 %, impact
 *   f1660-1694  caption "On every screen."; connectors draw on f1680-1710
 *   f1672-1764  camera tour on the phone (taps: sidebar, Working Panel, routing graph sheet), then a glide over the cluster
 *   f1770       final composition: the cluster slides right, the lockup / tagline / CTA settle on the left (done by f1816)
 *   f1816-1839  clean hold  |  f1840-1859 fade to black (the LAST overlay element)
 */

// ---------------------------------------------------------------------------------------------- camera
/**
 * All keys target `outroHero` (zoom 1.0 at padding 72 and scaleBias 1). The first one starts the pull-back at the cut;
 * the later ones keep the background drifting under the logo so nothing is static for more than about 1.5 s.
 * Tilt is clamped to the extended limits (14 deg) by the camera, S6 is in CAMERA_LIMITS.extendedScenes.
 */
export const S6_CAMERA: CameraKeyframe[] = [
  cameraKey(f(1500), 'outroHero', {padding: 72, scaleBias: 0.96, rotateX: 6, rotateY: -13, rotateZ: 0}),
  cameraKey(f(1536), 'outroHero', {padding: 72, scaleBias: 1.06, rotateX: 4, rotateY: -7, rotateZ: 0}),
  // laptop build: the camera pulls back so the laptop sits left-centre at about 60 % of the frame width
  cameraKey(f(1556), 'deviceCluster', {padding: 84, scaleBias: 1, rotateX: 3, rotateY: -5, rotateZ: 0}),
  cameraKey(f(1600), 'deviceCluster', {padding: 84, scaleBias: 1.02, rotateX: 2, rotateY: 2, rotateZ: 0}),
  cameraKey(f(1634), 'deviceCluster', {padding: 84, scaleBias: 0.98, rotateX: 3, rotateY: -3, rotateZ: 0}),
  // the tour: the phone screen is about 960 px tall (>= 900) from about f1690 on
  cameraKey(f(1672), 'devicePhone', {padding: 80, scaleBias: 1, rotateX: 2, rotateY: 4, rotateZ: 0}),
  cameraKey(f(1712), 'devicePhone', {padding: 80, scaleBias: 1.03, rotateX: 1, rotateY: 2, rotateZ: 0}),
  cameraKey(f(1742), 'devicePhone', {padding: 80, scaleBias: 1.05, rotateX: 1, rotateY: 0, rotateZ: 0}),
  // a short glide over the tablet and the laptop, then the final composition (identity camera)
  cameraKey(f(1764), 'deviceCluster', {padding: 70, scaleBias: 1, rotateX: 3, rotateY: -6, rotateZ: 0}),
  cameraKey(f(1774), 'outroStage', {padding: 0, scaleBias: 1, rotateX: 0, rotateY: 0, rotateZ: 0}),
  cameraKey(f(1816), 'outroStage', {padding: 0, scaleBias: 1.015, rotateX: 0, rotateY: 1, rotateZ: 0}),
];

// ---------------------------------------------------------------------------------------------- cursor
/**
 * The cursor of S5 rests in the empty chat at about (622, 603) UI px. It cannot fade out and it stays sharp over the
 * blurred window, so it leaves the frame to the LEFT (UI x -760 is off screen at every camera pose of S6) well before
 * the laptop build (it is not mounted from OUTRO.cursorOff on). It arrives off screen at f1535 (the travel starts about 20-36 f earlier, at the cut).
 */
export const S6_CURSOR: CursorWaypoint[] = [{frame: f(1535), x: -760, y: 560, hover: 'idle'}];

// ---------------------------------------------------------------------------------------------- stage hooks
/** Grid floor opacity: fades in with the pull-back (f1500-1540) and stays on to the end. */
export const S6_GRID: GridOpacityFn = (frame) => ramp(frame, OUTRO.gridInStart, OUTRO.gridInEnd);

/**
 * Light sweep across the nav tab names: null (off) outside f1515-1560, otherwise 0..1 (eased).
 * src/scenes/index.ts exports it as navSweepAt(frame); src/MiniMePromo.tsx hands it to <ChatApp navSweep=.../>.
 */
export const S6_NAV_SWEEP = (frame: number): number | null =>
  frame < OUTRO.navSweepStart || frame > OUTRO.navSweepEnd ? null : ramp(frame, OUTRO.navSweepStart, OUTRO.navSweepEnd);

/**
 * Patch 15B: the window is now the screen of the laptop in <DeviceStage/>, whose pose and float come from deviceStateAt().
 * The hook stays as the IDENTITY (opacity 1, no transform, no filter) so src/scenes/index.ts and S1 hand-over keep working.
 */
export const S6_WINDOW: WindowStyleFn = (): CSSProperties => ({opacity: 1});

// ---------------------------------------------------------------------------------------------- overlay
const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/** 0..1..0 impact pulse: up in 2 frames on the beat, then an exponential decay (same as S0). */
const impactHit = (frame: number, at: number): number => {
  const local = frame - at;
  if (local < -1) {
    return 0;
  }
  return clamp01((local + 2) / 2) * Math.exp(-Math.max(0, local) / OUTRO.hitDecay);
};

/** The logo SVG cropped to its painted bounds (same helper as S0): layout works on what the eye sees. */
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
        <MiniMeLogo progress={progress} size={size} glow={glow} strokePx={OUTRO_LAYOUT.strokePx} />
      </div>
    </div>
  );
};

/** One masked line: the child rises out of an overflow:hidden box (translateY 110% -> 0). Nothing fades. */
const RiseMask: React.FC<{enter: number; children: React.ReactNode; style?: CSSProperties}> = ({enter, children, style}) => (
  <div style={{overflow: 'hidden', padding: '0.18em 0.08em', margin: '-0.18em -0.08em'}}>
    <div style={{whiteSpace: 'nowrap', transform: `translateY(${((1 - enter) * 110).toFixed(3)}%)`, ...style}}>{children}</div>
  </div>
);

/** [mark][wordmark] on the left: the mark pen-draws, the wordmark slides out of its right edge (masked). */
const Lockup: React.FC<{frame: number}> = ({frame}) => {
  const progress = logoProgress(frame, OUTRO.drawStart);
  const hit = impactHit(frame, OUTRO.impact);
  const slide = ramp(frame, OUTRO.wordmarkStart, OUTRO.wordmarkEnd);
  const markSize = OUTRO_LAYOUT.markSizeLockup * (1 + OUTRO.hitAmount * hit);

  // glow: nothing before the hit, then a breathing 0.3 +- 0.12 that eases out and holds still from breathEnd on
  const breathAmp = 1 - ramp(frame, OUTRO.breathEnd - f(15), OUTRO.breathEnd);
  const breath = 0.3 + 0.12 * breathAmp * Math.sin((2 * Math.PI * (frame - OUTRO.breathStart)) / f(48));
  const glow = frame >= OUTRO.impact - 1 ? breath + 0.6 * hit : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: OUTRO_LAYOUT.leftX,
        top: OUTRO_LAYOUT.lockupY,
        display: 'flex',
        alignItems: 'center',
        transform: `translateY(-50%) scale(${OUTRO_LAYOUT.lockupScale})`,
        transformOrigin: '0% 50%',
        width: 'max-content',
      }}
    >
      <MarkBox progress={progress} size={markSize} glow={glow} />
      <div
        style={{
          overflow: 'hidden',
          padding: '0.16em 0.06em 0.16em 0',
          margin: '-0.16em 0',
          fontFamily: FONTS.heading,
          fontWeight: 800,
          fontSize: OUTRO_LAYOUT.wordmarkSize,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        <div style={{whiteSpace: 'nowrap', paddingLeft: `${OUTRO_LAYOUT.gapEm}em`, transform: `translateX(${(-(1 - slide) * 100).toFixed(3)}%)`}}>
          <span style={{color: NEUTRAL[200]}}>{BRAND.mini}</span>
          <span style={{color: ACCENT.wordmarkMe}}>{BRAND.me}</span>
        </div>
      </div>
    </div>
  );
};

/** The crimson CTA pill (it opens from its centre like an iris on one axis) and the url under it, left aligned. */
const CallToAction: React.FC<{frame: number}> = ({frame}) => {
  const open = ramp(frame, OUTRO.ctaStart, OUTRO.ctaEnd);
  const label = ramp(frame, OUTRO.ctaLabelStart, OUTRO.ctaLabelStart + OUTRO.riseFrames);
  const url = ramp(frame, OUTRO.urlStart, OUTRO.urlStart + OUTRO.riseFrames);
  if (frame < OUTRO.ctaStart) {
    return null;
  }
  const inset = ((1 - open) * 50).toFixed(3);
  return (
    <>
      <div style={{position: 'absolute', left: OUTRO_LAYOUT.leftX, top: OUTRO_LAYOUT.ctaY, display: 'flex', transform: 'translateY(-50%)'}}>
        <div
          style={{
            height: OUTRO_LAYOUT.ctaHeight,
            padding: `0 ${OUTRO_LAYOUT.ctaPadX}px`,
            borderRadius: OUTRO_LAYOUT.ctaHeight / 2,
            background: ACCENT.base,
            boxShadow: `0 14px 48px rgba(255, 32, 82, ${(0.38 * open).toFixed(3)})`,
            clipPath: `inset(0 ${inset}% 0 ${inset}% round ${OUTRO_LAYOUT.ctaHeight / 2}px)`,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <RiseMask enter={label} style={{fontFamily: FONTS.heading, fontWeight: 700, fontSize: OUTRO_LAYOUT.ctaFont, lineHeight: 1.1, letterSpacing: '-0.01em', color: ACCENT.text}}>
            {CTA.label}
          </RiseMask>
        </div>
      </div>
      <div style={{position: 'absolute', left: OUTRO_LAYOUT.leftX + 4, top: OUTRO_LAYOUT.urlY, transform: 'translateY(-50%)'}}>
        <RiseMask enter={url} style={{fontFamily: FONTS.mono, fontWeight: 500, fontSize: OUTRO_LAYOUT.urlFont, lineHeight: 1.2, letterSpacing: '0.01em', color: NEUTRAL[400]}}>
          {CTA.url}
        </RiseMask>
      </div>
    </>
  );
};

export const S6Outro: React.FC<SceneOverlayProps> = ({frame}) => {
  const fade = ramp(frame, OUTRO.fadeStart, OUTRO.fadeEnd, signatureEase);
  return (
    <>
      <Spotlight startFrame={OUTRO.spotlightStart} endFrame={OUTRO.spotlightEnd} target="fullWindow" intensity={0.12} radius={14} frame={frame} />
      <Caption {...CAPTIONS.outro} startFrame={OUTRO.captionStart} endFrame={OUTRO.captionEnd} bottom={OUTRO_LAYOUT.captionBottom} frame={frame} />
      <Caption {...CAPTIONS.devices} startFrame={OUTRO.devicesCaptionStart} endFrame={OUTRO.devicesCaptionEnd} bottom={OUTRO_LAYOUT.captionBottom} frame={frame} />

      {/* the phone arrives on beat 110: a bloom on the cluster (the 2 % scale hit is in deviceStateAt) */}
      <Glow startFrame={DEVICE_TIMES.impact} at={{x: 1300, y: 640}} size={1100} frames={f(30)} intensity={0.7} frame={frame} />

      {frame >= OUTRO.drawStart ? (
        <>
          <Glow startFrame={OUTRO.impact} at={{x: OUTRO_LAYOUT.leftX + 120, y: OUTRO_LAYOUT.lockupY}} size={900} frames={f(30)} intensity={1} frame={frame} />
          <Lockup frame={frame} />
        </>
      ) : null}

      {frame >= OUTRO.taglineStart ? (
        <div style={{position: 'absolute', left: OUTRO_LAYOUT.leftX, top: OUTRO_LAYOUT.taglineY, transform: 'translateY(-50%)', pointerEvents: 'none'}}>
          <KineticText
            lines={[HEADLINE.line1, HEADLINE.line2]}
            startFrame={OUTRO.taglineStart}
            highlight={HEADLINE.highlight}
            fontSize={OUTRO_LAYOUT.taglineSize}
            color={NEUTRAL[100]}
            align="left"
            frame={frame}
          />
        </div>
      ) : null}

      <CallToAction frame={frame} />

      {/* the fade to black is the LAST element of the overlay */}
      {fade > 0.001 ? <div style={{position: 'absolute', left: 0, top: 0, width: STAGE.width, height: STAGE.height, background: '#000', opacity: fade, pointerEvents: 'none'}} /> : null}
    </>
  );
};
