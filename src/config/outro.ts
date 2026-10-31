/**
 * MiniMe promo — S6 (Outro) tunables.
 *
 * Every frame number here is AUTHORED AT 30 fps and wrapped in f(), so changing FPS keeps the film in sync.
 * Every pixel number is in STAGE px (1920x1080) unless a comment says otherwise.
 * src/scenes/S6Outro.tsx reads only from here (and from copy.ts for the words). The device cluster has its own
 * tunables in src/config/devices.ts and the phone's choreography in src/config/mobileScript.ts.
 *
 * PATCH 15B changes (S6 is now f1500-1859, 360 frames = 6 bars):
 *   - REMOVED: the defocus of the window (defocusStart/End/BlurPx/Brightness), the centred hero logo (heroY, restY,
 *     restScale, markSizeAlone), the old settle and the centred lockup. The window is now the laptop of the cluster
 *     and stays sharp to the end.
 *   - NEW: the caption "On every screen." (devicesCaption*), cursorOff, and the end card on the LEFT of the frame
 *     (OUTRO_LAYOUT.leftX ...), retimed to f1770-1816 so it lands while the cluster slides right.
 *   - MOVED: the fade to black is now f1840-1859.
 *
 * Beat map (120 BPM, beat = 15 f): f1500 b100 cut | f1560 b104 laptop build | f1620 b108 tablet | f1650 b110 phone |
 * f1770 b118 final composition | f1800 b120 mark impact | f1840 b122 fade.
 */
import {f} from './timeline';

// ------------------------------------------------------------------ frames
export const OUTRO = {
  // ----- f1500-1560: the hero view (kept from patch 15)
  /** The laptop starts to float (amplitude ramps 0 -> 1 over floatRamp frames, so there is no jump at the cut). */
  floatStart: f(1500),
  floatRamp: f(30),
  /** The grid floor fades in behind the window while the camera pulls back. */
  gridInStart: f(1500),
  gridInEnd: f(1540),
  /** The specular light sweep across the window (one pass, on the cut). */
  spotlightStart: f(1510),
  spotlightEnd: f(1545),
  /** The caption "Chat is just the beginning." (its exit finishes at captionEnd, so it is gone by about f1572). */
  captionStart: f(1515),
  captionEnd: f(1572),
  /** The light sweep along the nav tab names (TopNav sweep prop). It never opens a tab. */
  navSweepStart: f(1515),
  navSweepEnd: f(1560),
  /** The desktop cursor has left the frame long before this; it is not mounted from here on (this half has no cursor). */
  cursorOff: f(1560),

  // ----- f1660-1694: the caption of the device scene (it exits as the camera settles on the phone)
  devicesCaptionStart: f(1660),
  devicesCaptionEnd: f(1694),

  // ----- f1770-1816: the end card on the left (mark, wordmark, tagline, CTA, url)
  /** The pen touches down (path 1); path 2 follows 4 f later (src/ui/MiniMeLogo.tsx). The draw takes drawFrames + 4. */
  drawStart: f(1770),
  drawFrames: f(24),
  /** Beat 120: bloom pulse + 2% hit on the finished mark. */
  impact: f(1800),
  hitDecay: f(6),
  hitAmount: 0.02,
  /** The wordmark slides out of the mark's right edge. */
  wordmarkStart: f(1790),
  wordmarkEnd: f(1808),
  /** The tagline "Describe a task. Get a team." (KineticText, words 3 f apart). */
  taglineStart: f(1786),
  /** The CTA pill opens from its centre (clip), its label rises, then the url rises. */
  ctaStart: f(1796),
  ctaEnd: f(1810),
  ctaLabelStart: f(1800),
  urlStart: f(1804),
  /** Frames a label / url takes to rise out of its mask. Everything is on screen by about f1816. */
  riseFrames: f(12),
  /** The logo glow breathes until breathEnd, then holds still while the film fades to black. */
  breathStart: f(1800),
  breathEnd: f(1840),
  /** The fade to black is the LAST overlay element. */
  fadeStart: f(1840),
  fadeEnd: f(1859),
} as const;

// ------------------------------------------------------------------ layout
/** Where the end card lives on the stage (1920x1080). Everything is left aligned on `leftX` (about x 140-820). */
export const OUTRO_LAYOUT = {
  /** Left edge of the whole end card. */
  leftX: 140,
  /** Lockup row ([mark][wordmark]): centre y and scale. */
  lockupY: 292,
  lockupScale: 0.9,
  /** Mark width in px (the viewBox is 1024 wide; the painted mark is 0.668 of it) inside the lockup. */
  markSizeLockup: 250,
  /** Sora 800 wordmark in px (same as S0). */
  wordmarkSize: 120,
  gapEm: 0.3,
  /** Pen-line width in px at the mark's own size. */
  strokePx: 4,
  /** Tagline: KineticText (two lines, left aligned) centre y and size. */
  taglineY: 492,
  taglineSize: 66,
  /** CTA pill: centre y, height, horizontal padding and label size. */
  ctaY: 676,
  ctaHeight: 78,
  ctaPadX: 52,
  ctaFont: 32,
  /** The url under the pill. */
  urlY: 778,
  urlFont: 28,
  /** Caption distance from the bottom of the stage (default 104). */
  captionBottom: 88,
} as const;

// ------------------------------------------------------------------ the floating laptop
/** Slow, deterministic float of the window / laptop over the grid floor (amplitudes at full strength). */
export const OUTRO_FLOAT = {
  /** Vertical bob in px and its period in frames. */
  bobPx: 7,
  bobPeriod: f(78),
  /** Depth bob in px (translateZ) and its period. */
  depthPx: 24,
  depthPeriod: f(110),
  depthPhase: 1.0,
  /** Tiny roll in degrees and its period. */
  rollDeg: 0.28,
  rollPeriod: f(140),
  rollPhase: 0.5,
} as const;