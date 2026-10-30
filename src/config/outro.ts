/**
 * MiniMe promo — S6 (Outro) tunables.
 *
 * Every frame number here is AUTHORED AT 30 fps and wrapped in f(), so changing FPS keeps the film in sync.
 * Every pixel number is in STAGE px (1920x1080) unless a comment says otherwise.
 * Edit freely: src/scenes/S6Outro.tsx reads only from here (and from copy.ts for the words).
 *
 * Beat map (120 BPM, beat = 15 f): f1500 = beat 100 (S5 -> S6 cut), f1515 / f1560 = the sweep, f1650 = beat 110
 * (the logo lands), f1710 = beat 114 (fade starts).
 */
import {f} from './timeline';

// ------------------------------------------------------------------ frames
export const OUTRO = {
  // ----- f1500-1560: the hero view
  /** The window starts to float (amplitude ramps 0 -> 1 over floatRamp frames, so there is no jump at the cut). */
  floatStart: f(1500),
  floatRamp: f(30),
  /** The grid floor fades in behind the window while the camera pulls back. */
  gridInStart: f(1500),
  gridInEnd: f(1540),
  /** The specular light sweep across the window (one pass, on the cut). */
  spotlightStart: f(1510),
  spotlightEnd: f(1545),
  /** The caption "Chat is just the beginning." (the exit finishes at captionEnd). */
  captionStart: f(1515),
  captionEnd: f(1582),
  /** The light sweep along the nav tab names (TopNav sweep prop). It never opens a tab. */
  navSweepStart: f(1515),
  navSweepEnd: f(1560),

  // ----- f1560-1600: the window defocuses and dims into the background
  defocusStart: f(1560),
  defocusEnd: f(1600),
  defocusBlurPx: 10,
  defocusBrightness: 0.35,

  // ----- f1600-1739: logo, tagline, CTA
  /** The pen touches down (path 1); path 2 follows 4 f later (src/ui/MiniMeLogo.tsx). */
  drawStart: f(1600),
  /** Beat 110: bloom pulse + 2% hit on the finished mark. */
  impact: f(1650),
  hitDecay: f(6),
  hitAmount: 0.02,
  /** The wordmark slides out of the mark's right edge; the mark shrinks from hero to lockup size meanwhile. */
  wordmarkStart: f(1650),
  wordmarkEnd: f(1672),
  /** The lockup eases up and shrinks to its rest pose (above the tagline). */
  settleStart: f(1660),
  settleEnd: f(1682),
  /** The tagline "Describe a task. Get a team." (KineticText, words 3 f apart). */
  taglineStart: f(1670),
  /** The CTA pill opens from its centre (clip), its label rises, then the url rises. */
  ctaStart: f(1678),
  ctaEnd: f(1696),
  ctaLabelStart: f(1684),
  urlStart: f(1690),
  /** Frames a label / url takes to rise out of its mask. Everything is on screen by f1702, so the lockup holds before the fade. */
  riseFrames: f(12),
  /** The logo glow breathes until breathEnd, then holds still while the film fades to black. */
  breathStart: f(1650),
  breathEnd: f(1710),
  fadeStart: f(1710),
  fadeEnd: f(1739),
} as const;

// ------------------------------------------------------------------ layout
/** Where everything lives on the stage (1920x1080). Centre of the block is about y 520. */
export const OUTRO_LAYOUT = {
  centerX: 960,
  /** The logo is drawn alone at the stage centre, like S0. */
  heroY: 540,
  /** Lockup rest pose: centre of the [mark][wordmark] row, and its scale. */
  restY: 318,
  restScale: 0.9,
  /** Mark width in px (the viewBox is 1024 wide; the painted mark is 0.668 of it) alone / inside the lockup. */
  markSizeAlone: 520,
  markSizeLockup: 250,
  /** Sora 800 wordmark in px (spec: about 120, same as S0). */
  wordmarkSize: 120,
  gapEm: 0.3,
  /** Pen-line width in px at the mark's own size (the hero mark is large, so a thicker pen than the app's 2.5). */
  strokePx: 4,
  /** Tagline: KineticText centre y and size (captions are 56-76 px). */
  taglineY: 506,
  taglineSize: 68,
  /** CTA pill: centre y, height, horizontal padding and label size. */
  ctaY: 650,
  ctaHeight: 78,
  ctaPadX: 52,
  ctaFont: 32,
  /** The url under the pill. */
  urlY: 752,
  urlFont: 28,
  /** Caption distance from the bottom of the stage (default 104; the hero window ends well above it). */
  captionBottom: 88,
} as const;

// ------------------------------------------------------------------ the floating window
/** Slow, deterministic float of the window over the grid floor (amplitudes at full strength). */
export const OUTRO_FLOAT = {
  /** Vertical bob in px and its period in frames. */
  bobPx: 7,
  bobPeriod: f(78),
  /** Depth bob in px (translateZ inside the window's own perspective: 1% of scale per 18 px) and its period. */
  depthPx: 24,
  depthPeriod: f(110),
  depthPhase: 1.0,
  /** Tiny roll in degrees and its period. */
  rollDeg: 0.28,
  rollPeriod: f(140),
  rollPhase: 0.5,
} as const;