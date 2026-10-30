/**
 * MiniMe promo — S0 (Logo) and S1 (Reveal) tunables.
 *
 * Every frame number here is AUTHORED AT 30 fps and wrapped in f(), so changing FPS keeps the film in sync.
 * Every pixel number is in STAGE px (1920x1080) unless a comment says otherwise.
 * Edit freely: src/scenes/S0Logo.tsx, src/scenes/S1Reveal.tsx and src/MiniMePromo.tsx read only from here.
 *
 * Beat map (120 BPM, beat = 15 f): f60 = beat 4 (logo impact), f240 = beat 16 (S2 cut, camera push has landed).
 */
import {f} from './timeline';

// ------------------------------------------------------------------ frames
export const INTRO = {
  // ----- S0: the logo
  /** Frames of pure #050505 before anything happens (f0-8). */
  blackHold: f(8),
  /** The pen touches down (path 1). Path 2 starts LOGO_PATH2_DELAY_FRAMES later (src/ui/MiniMeLogo.tsx). */
  drawStart: f(8),
  /** Beat 4: bloom pulse + 2% scale hit on the mark. */
  impact: f(60),
  /** Time constant (frames) of the exponential decay of the 2% hit. */
  hitDecay: f(6),
  /** Peak scale added to the mark on the hit (0.02 = 2%). */
  hitAmount: 0.02,
  /** The wordmark slides out of the mark's right edge (f70-100). */
  wordmarkStart: f(70),
  wordmarkEnd: f(100),
  /** The lockup eases up and shrinks to LOCKUP.restScale (f100-119). */
  lockupStart: f(100),
  lockupEnd: f(119),
  /** The lockup leaves above the headline before the camera pushes in (f186-208): slides up, blurs, fades. */
  lockupExit: f(186),
  lockupExitEnd: f(208),
  /** Grid floor: fades in with the settle (f100-119) and out during the push-in (f200-239). */
  gridInStart: f(100),
  gridInEnd: f(119),
  gridOutStart: f(200),
  gridOutEnd: f(239),
  /** The #050505 opener backdrop dissolves into the stage gradient. */
  backdropFadeStart: f(96),
  backdropFadeEnd: f(140),
  /** The drifting crimson stage glow fades in behind the window. */
  stageGlowStart: f(110),
  stageGlowEnd: f(170),

  // ----- S1: the reveal
  /** Headline line 1 / line 2 start rising (words 3 f apart, KineticText). */
  headlineLine1: f(124),
  headlineLine2: f(150),
  /** The headline leaves as one block (slides up, blurs, fades). */
  headlineExit: f(200),
  headlineExitEnd: f(232),
  /** The window rises from below (spring 'panel'); opacity ramps over windowFadeFrames. */
  windowRise: f(160),
  windowFadeFrames: f(14),
  /** The window settles flat (scale 1, rotateX 0) and brightens from windowDim to 1. */
  windowSettleStart: f(196),
  windowSettleEnd: f(236),
  windowDim: 0.5,
  windowBrightenStart: f(196),
  windowBrightenEnd: f(236),
  /** The camera push-in keyframe (the move STARTS here; the 'camera' spring settles about 25 f later). */
  cameraPush: f(212),
  /** Depth of field is on from the S2 cut (the focus rectangle only means something once the camera has moved in). */
  dofOn: f(240),
} as const;

// ------------------------------------------------------------------ the lockup
/**
 * Where the logo lockup lives. The lockup is a flex row [mark][wordmark]; the stage-space position below is the
 * row's CENTER (the S0 component then keeps the MARK on `centerX` while the wordmark is still hidden).
 */
export const LOCKUP = {
  centerX: 960,
  /** Hero position (f8-100): the stage center. */
  heroY: 540,
  /** Rest position (f119 until the exit): above the headline, clear of the rising window. */
  restY: 112,
  /** The lockup shrinks to this scale in the settle (spec: about 55%). */
  restScale: 0.55,
  /** Mark width in px (viewBox width 1024 -> the painted mark is 0.668 of it) when drawn alone / inside the lockup. */
  markSizeAlone: 560,
  markSizeLockup: 250,
  /** Sora 800 wordmark size in px (spec: about 120). */
  wordmarkSize: 120,
  /** Gap between the mark and the wordmark, in em of the wordmark size. */
  gapEm: 0.3,
  /** Pen-line width in px at the mark's own size. The hero mark is large, so it gets a thicker pen than the 2.5 px of the app. */
  strokePx: 4,
} as const;

/**
 * The PAINTED bounds of the mark in viewBox units (0..1024 x 0..844), measured from the exact Appendix A paths with
 * the group transform translate(0,844) scale(0.1,-0.1) applied (SVG path bounding box, both paths together).
 * Layout and centering work on what the eye sees, not on the empty viewBox margin.
 */
export const LOGO_BOUNDS = {
  x0: 157.105,
  x1: 840.75,
  y0: 141,
  y1: 651.414,
  viewBoxWidth: 1024,
} as const;

// ------------------------------------------------------------------ the headline
export const HEADLINE_LAYOUT = {
  /** Vertical center of the two-line headline block. */
  centerY: 552,
  /** KineticText size in px (spec: 56-76 px for captions; the hero headline is bigger). */
  fontSize: 116,
  /** Soft dark scrim behind the headline so white text stays readable over the dimmed window. */
  scrimWidth: 1560,
  scrimHeight: 470,
  scrimAlpha: 0.78,
} as const;

// ------------------------------------------------------------------ the window rise
/** The window's entrance (f160): y +140 -> 0, rotateX 18 -> 6 deg, scale .86 -> .94, opacity 0 -> 1. */
export const WINDOW_RISE = {
  fromY: 140,
  scaleFrom: 0.86,
  scaleTo: 0.94,
  rotateXFrom: 18,
  rotateXTo: 6,
} as const;
