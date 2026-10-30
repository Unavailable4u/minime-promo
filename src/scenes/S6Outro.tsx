import React from 'react';
import type {CSSProperties} from 'react';
import {CAMERA_PERSPECTIVE, cameraKey, type CameraKeyframe, type CursorWaypoint} from '../config/camera';
import {BRAND, CAPTIONS, CTA, HEADLINE} from '../config/copy';
import {LOGO_BOUNDS} from '../config/intro';
import {OUTRO, OUTRO_FLOAT, OUTRO_LAYOUT} from '../config/outro';
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
 * S6 — OUTRO (f1500-1739) — caption "Chat is just the beginning."
 * The app keeps playing src/config/script.ts (the empty chat, the competitors.pdf chip); this file adds the camera,
 * the cursor exit, the floating / defocusing window, the nav-sweep hook and the overlays. All tunables: src/config/outro.ts.
 *
 *   f1500-1560  camera pulls back from the S5 composer close-up (zoom 2.4) to the hero 3/4 view (target `outroHero`,
 *               tilt up to 14 deg). The window floats over the grid floor; the cursor leaves to the left; one specular
 *               sweep crosses the window (f1510-1545); the nav tab names get a travelling light (f1515-1560, never opens a tab)
 *   f1560-1600  the window defocuses and dims into the background (blur 0 -> 10 px, brightness 1 -> .35)
 *   f1600-1650  the mark pen-draws large at the stage centre (the S0 logic, with OUTRO timings)
 *   f1650       beat 110: bloom pulse + 2% hit; the wordmark slides out of the mark, the lockup rises and shrinks
 *   f1674-      tagline "Describe a task. Get a team." (words 3 f apart), CTA pill (opens from its centre), url
 *   f1650-1710  the logo glow breathes, then holds; f1710-1739 fade to black
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
  cameraKey(f(1596), 'outroHero', {padding: 72, scaleBias: 1.06, rotateX: 2, rotateY: -3, rotateZ: 0}),
  cameraKey(f(1664), 'outroHero', {padding: 72, scaleBias: 0.96, rotateX: 3, rotateY: 3, rotateZ: 0}),
];

// ---------------------------------------------------------------------------------------------- cursor
/**
 * The cursor of S5 rests in the empty chat at about (622, 603) UI px. It cannot fade out and it stays sharp over the
 * blurred window, so it leaves the frame to the LEFT (UI x -760 is off screen at every camera pose of S6) before the
 * defocus starts. It arrives off screen at f1535 (the travel starts about 20-36 f earlier, at the cut).
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
 * The window's own box style for S6. It is the IDENTITY at f1500 (opacity 1, no transform, no filter), so it hands over
 * cleanly from S1_WINDOW. The float amplitude ramps up over floatRamp frames; the defocus is a blur + brightness filter.
 */
export const S6_WINDOW: WindowStyleFn = (frame): CSSProperties => {
  const amp = ramp(frame, OUTRO.floatStart, OUTRO.floatStart + OUTRO.floatRamp);
  const t = frame - OUTRO.floatStart;
  const tau = 2 * Math.PI;

  const bob = amp * OUTRO_FLOAT.bobPx * Math.sin((tau * t) / OUTRO_FLOAT.bobPeriod);
  const depth = amp * OUTRO_FLOAT.depthPx * Math.sin((tau * t) / OUTRO_FLOAT.depthPeriod + OUTRO_FLOAT.depthPhase);
  const roll = amp * OUTRO_FLOAT.rollDeg * Math.sin((tau * t) / OUTRO_FLOAT.rollPeriod + OUTRO_FLOAT.rollPhase);

  const defocus = ramp(frame, OUTRO.defocusStart, OUTRO.defocusEnd);
  const blur = OUTRO.defocusBlurPx * defocus;
  const brightness = 1 - (1 - OUTRO.defocusBrightness) * defocus;

  const filters: string[] = [];
  if (blur > 0.05) {
    filters.push(`blur(${blur.toFixed(2)}px)`);
  }
  if (brightness < 0.999) {
    filters.push(`brightness(${brightness.toFixed(4)})`);
  }

  return {
    opacity: 1,
    transform: `perspective(${CAMERA_PERSPECTIVE}px) translate3d(0, ${bob.toFixed(3)}px, ${depth.toFixed(3)}px) rotateZ(${roll.toFixed(4)}deg)`,
    transformOrigin: '50% 50%',
    filter: filters.length > 0 ? filters.join(' ') : undefined,
  };
};

// ---------------------------------------------------------------------------------------------- overlay
const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/** 0..1..0 impact pulse: up in 2 frames on the beat, then an exponential decay (same as S0). */
const impactHit = (frame: number): number => {
  const local = frame - OUTRO.impact;
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

const Lockup: React.FC<{frame: number}> = ({frame}) => {
  const progress = logoProgress(frame, OUTRO.drawStart);
  const hit = impactHit(frame);

  // the wordmark slide-out (0..1) and the mark shrinking from hero to lockup size meanwhile
  const slide = ramp(frame, OUTRO.wordmarkStart, OUTRO.wordmarkEnd);
  const markSize = lerp(OUTRO_LAYOUT.markSizeAlone, OUTRO_LAYOUT.markSizeLockup, slide) * (1 + OUTRO.hitAmount * hit);

  // the settle: up and a little smaller
  const settle = ramp(frame, OUTRO.settleStart, OUTRO.settleEnd);
  const centerY = lerp(OUTRO_LAYOUT.heroY, OUTRO_LAYOUT.restY, settle);
  const scale = lerp(1, OUTRO_LAYOUT.restScale, settle);

  // glow: nothing before the hit, then a breathing 0.3 +- 0.12 that eases out and holds still from breathEnd on
  const breathAmp = 1 - ramp(frame, OUTRO.breathEnd - f(15), OUTRO.breathEnd);
  const breath = 0.3 + 0.12 * breathAmp * Math.sin((2 * Math.PI * (frame - OUTRO.breathStart)) / f(48));
  const glow = frame >= OUTRO.impact - 1 ? breath + 0.6 * hit : 0;

  // keep the MARK on the stage centre while the wordmark is still hidden (the S0 trick)
  const hidden = 1 - slide;
  const markWidth = ((LOGO_BOUNDS.x1 - LOGO_BOUNDS.x0) / LOGO_BOUNDS.viewBoxWidth) * markSize;
  const shift = `calc(${(hidden * 50).toFixed(3)}% - ${((hidden * markWidth) / 2).toFixed(3)}px)`;

  return (
    <div
      style={{
        position: 'absolute',
        left: OUTRO_LAYOUT.centerX,
        top: centerY,
        display: 'flex',
        alignItems: 'center',
        transform: `translate(-50%, -50%) translateX(${shift}) scale(${scale.toFixed(5)})`,
        transformOrigin: '50% 50%',
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
        <div
          style={{
            whiteSpace: 'nowrap',
            paddingLeft: `${OUTRO_LAYOUT.gapEm}em`,
            transform: `translateX(${(-hidden * 100).toFixed(3)}%)`,
          }}
        >
          <span style={{color: NEUTRAL[200]}}>{BRAND.mini}</span>
          <span style={{color: ACCENT.wordmarkMe}}>{BRAND.me}</span>
        </div>
      </div>
    </div>
  );
};

/** The crimson CTA pill (it opens from its centre like an iris on one axis) and the url under it. */
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
      <div style={{position: 'absolute', left: 0, top: OUTRO_LAYOUT.ctaY, width: STAGE.width, display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)'}}>
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
      <div style={{position: 'absolute', left: 0, top: OUTRO_LAYOUT.urlY, width: STAGE.width, display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)'}}>
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
      <Caption
        {...CAPTIONS.outro}
        startFrame={OUTRO.captionStart}
        endFrame={OUTRO.captionEnd}
        bottom={OUTRO_LAYOUT.captionBottom}
        frame={frame}
      />

      {frame >= OUTRO.drawStart ? (
        <>
          <Glow startFrame={OUTRO.impact} at={{x: OUTRO_LAYOUT.centerX, y: OUTRO_LAYOUT.heroY}} size={1100} frames={f(30)} intensity={1} frame={frame} />
          <Lockup frame={frame} />
        </>
      ) : null}

      {frame >= OUTRO.taglineStart ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: OUTRO_LAYOUT.taglineY,
            width: STAGE.width,
            display: 'flex',
            justifyContent: 'center',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          <KineticText
            lines={[HEADLINE.full]}
            startFrame={OUTRO.taglineStart}
            highlight={HEADLINE.highlight}
            fontSize={OUTRO_LAYOUT.taglineSize}
            color={NEUTRAL[100]}
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
