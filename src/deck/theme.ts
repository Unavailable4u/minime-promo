/**
 * MiniMe pitch deck — design tokens (guide v2, section 4).
 *
 * v2 look (reset in D1 after review): an editorial "paper and ink" deck in the spirit of the MiniLocker deck and the five
 * reference templates: warm paper pages with a faint grid, a serif for headlines and body, a mono face for labels and
 * captions, dark framed screenshots with numbered pins, big serif numerals, and two bookend slides (cover, close) on ink.
 * It does NOT have to match the MiniMe app's dark crimson look; the screenshots bring that, the pages around them are neutral.
 *
 * Two typefaces: Newsreader (serif: headlines, body, numerals, italic sublines; vendored in public/fonts) and JetBrains
 * Mono (labels, captions, code; already vendored for the film). Colours: ink and paper neutrals, ONE accent (crimson) for the
 * key word or number of a slide, and ONE data colour (cobalt) for measured or positive numbers.
 */
import {FONTS} from '../config/theme';
import {MIN_TEXT_PX, TOTAL_SLIDES} from './rules';

export {TOTAL_SLIDES, MIN_TEXT_PX};

/** The canvas. Slide N is frame N-1 of the `MiniMeDeck` composition. */
export const CANVAS = {width: 1920, height: 1080} as const;

/** The content box every slide lays out in: starts at (96, 72), 1728 x 920. The footer lives below it. */
export const CONTENT = {x: 96, y: 72, width: 1728, height: 920} as const;

export type DeckTheme = 'paper' | 'ink';

/** Raw palette. Slides never type a hex: they use tones (Txt) and the helpers in kit.tsx. */
export const PALETTE = {
  paper: '#F2EFE8',
  paperCard: '#FBF9F4',
  paperLine: '#DCD5C6',
  ink: '#15161B',
  inkSoft: '#4B4B53',
  inkMuted: '#7C7B80',
  accent: '#D4143F', // crimson on paper
  accentOnInk: '#FF4A6B', // the same crimson, lifted for dark grounds
  cobalt: '#2447D6', // measured / positive numbers on paper
  cobaltOnInk: '#7C9BFF',
  night: '#0D0D11',
  nightCard: '#17171D',
  nightLine: 'rgba(255, 255, 255, 0.14)',
  onNight: '#F4F1EA',
  onNightSoft: '#B2AFA7',
  onNightMuted: '#85837D',
  white: '#FFFFFF',
} as const;

export type Tone = 'primary' | 'secondary' | 'muted' | 'accent' | 'data';

/** Text colour per theme and tone. */
export const TONES: Record<DeckTheme, Record<Tone, string>> = {
  paper: {
    primary: PALETTE.ink,
    secondary: PALETTE.inkSoft,
    muted: PALETTE.inkMuted,
    accent: PALETTE.accent,
    data: PALETTE.cobalt,
  },
  ink: {
    primary: PALETTE.onNight,
    secondary: PALETTE.onNightSoft,
    muted: PALETTE.onNightMuted,
    accent: PALETTE.accentOnInk,
    data: PALETTE.cobaltOnInk,
  },
};

/** Surfaces per theme: card fill, hairline, page ground. */
export const SURFACES: Record<DeckTheme, {ground: string; card: string; line: string; shadow: string}> = {
  paper: {
    ground: PALETTE.paper,
    card: PALETTE.paperCard,
    line: PALETTE.paperLine,
    shadow: '0 18px 50px rgba(40, 28, 12, 0.16)',
  },
  ink: {
    ground: PALETTE.night,
    card: PALETTE.nightCard,
    line: PALETTE.nightLine,
    shadow: '0 24px 70px rgba(0, 0, 0, 0.55)',
  },
};

export const DECK_FONTS = {
  serif: "'Newsreader', 'Iowan Old Style', 'Palatino Linotype', Georgia, 'Times New Roman', serif",
  mono: FONTS.mono,
} as const;

/**
 * Type presets. There is no free font size anywhere in the deck: use <Txt size="...">. Nothing is under MIN_TEXT_PX (22).
 *   cover     the cover title only
 *   display   big numerals (serif, light)
 *   headline  slide title, two lines at most
 *   sub       italic serif subline
 *   body      serif running text
 *   label     mono caps: section tags, column heads (letter-spaced)
 *   caption   mono: captions, units, short labels
 *   code      mono: commands, file names, URLs
 */
export const TYPE = {
  cover: {family: DECK_FONTS.serif, weight: 400, style: 'normal', size: 124, lineHeight: 1.0, letterSpacing: '-0.02em', caps: false},
  display: {family: DECK_FONTS.serif, weight: 400, style: 'normal', size: 132, lineHeight: 1.0, letterSpacing: '-0.02em', caps: false},
  headline: {family: DECK_FONTS.serif, weight: 400, style: 'normal', size: 80, lineHeight: 1.05, letterSpacing: '-0.015em', caps: false},
  sub: {family: DECK_FONTS.serif, weight: 400, style: 'italic', size: 42, lineHeight: 1.2, letterSpacing: '0', caps: false},
  body: {family: DECK_FONTS.serif, weight: 400, style: 'normal', size: 32, lineHeight: 1.28, letterSpacing: '0', caps: false},
  label: {family: DECK_FONTS.mono, weight: 500, style: 'normal', size: 24, lineHeight: 1.25, letterSpacing: '0.1em', caps: true},
  caption: {family: DECK_FONTS.mono, weight: 400, style: 'normal', size: 22, lineHeight: 1.4, letterSpacing: '0', caps: false},
  code: {family: DECK_FONTS.mono, weight: 500, style: 'normal', size: 24, lineHeight: 1.35, letterSpacing: '0', caps: false},
} as const;
export type TypeSize = keyof typeof TYPE;

/** Screenshot frame (screenshots are dark app UI, so they get a hairline and a soft shadow on both grounds). */
export const FRAME = {radius: 14} as const;

/** Footer: mono 22 px, a hairline above, "Next Inc · MiniMe · Pitch deck" at the left and "n / 11" at the right. */
export const FOOTER = {ruleY: 1016, textBottom: 22, fontSize: MIN_TEXT_PX} as const;

/** QR: white tile, 4-module quiet zone, 280 px square or larger, URL printed under it. */
export const QR = {minSize: 280, quietModules: 4, errorCorrection: 'M'} as const;

/** Numbered pin used on annotated screenshots. */
export const PIN = {diameter: 56} as const;
