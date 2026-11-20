/**
 * MiniMe pitch deck — design tokens (guide section 4). Colours and font stacks are IMPORTED from the film's
 * src/config/theme.ts; nothing is retyped here. The deck is dark so it matches the real (dark) screenshots.
 * R3: two typefaces, Sora (headings, numerals) and Inter (everything else). R4: crimson plus the neutral ramp, nothing else.
 */
import {ACCENT, FONTS, NEUTRAL} from '../config/theme';
import {MIN_TEXT_PX, TOTAL_SLIDES} from './rules';

export {TOTAL_SLIDES, MIN_TEXT_PX};

/** The canvas. Slide N is frame N-1 of the `MiniMeDeck` composition. */
export const CANVAS = {width: 1920, height: 1080} as const;

/** The content box every slide lays out in: starts at (96, 72), 1728 x 920. */
export const CONTENT = {x: 96, y: 72, width: 1728, height: 920} as const;

export const COLORS = {
  ground: NEUTRAL[950],
  surface: NEUTRAL[900],
  border: NEUTRAL[800],
  text: NEUTRAL[100],
  textSecondary: NEUTRAL[400],
  textMuted: NEUTRAL[500],
  /** One thing per slide: the key word or the key number. */
  accent: ACCENT.base,
  onAccent: ACCENT.text,
} as const;

/** Type presets. There is no free font size anywhere in the deck: use <Txt size="..."> (Txt.tsx). */
export const TYPE = {
  /** Display numeral: Sora 800, 160 to 220 px. */
  display: {family: FONTS.heading, weight: 800, size: 200, lineHeight: 1, letterSpacing: '-0.03em'},
  /** Headline: Sora 800, 76 px, two lines at most. */
  headline: {family: FONTS.heading, weight: 800, size: 76, lineHeight: 1.08, letterSpacing: '-0.02em'},
  /** Subline: Inter 500, 40 px. */
  sub: {family: FONTS.body, weight: 500, size: 40, lineHeight: 1.25, letterSpacing: '0'},
  /** Body and labels: Inter 500, 32 px (30 is the floor). */
  body: {family: FONTS.body, weight: 500, size: 32, lineHeight: 1.3, letterSpacing: '0'},
} as const;
export type TypeSize = keyof typeof TYPE;

/** Screenshot frame: 1 px NEUTRAL[800], radius 16, soft shadow. Never stretched, never upscaled past 1.0. */
export const FRAME = {
  borderColor: NEUTRAL[800],
  radius: 16,
  shadow: '0 24px 80px rgba(0,0,0,0.5)',
} as const;

/** Footer: logo 40 px high at the left, "n / 15" at the right, 30 px, NEUTRAL[500]. */
export const FOOTER = {
  logoHeight: 40,
  fontSize: MIN_TEXT_PX,
  color: NEUTRAL[500],
  /** Distance of the footer's bottom edge from the canvas bottom; the content box ends at y = 992, the footer starts at 1016. */
  bottom: 24,
  /** The footer logo is grey so the accent stays reserved for the slide's one key word or number. */
  logoColor: NEUTRAL[500],
} as const;

/** QR: white tile, 4-module quiet zone, 280 px square or larger, URL printed under it at 30 px or larger. */
export const QR = {minSize: 280, quietModules: 4, errorCorrection: 'M'} as const;

/** Numbered pin used on the routing slide. */
export const PIN = {diameter: 64} as const;
