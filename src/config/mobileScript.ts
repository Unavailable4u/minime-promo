/**
 * MiniMe promo — the phone's own small script (patch 15B): boot, chat, sidebar drawer, Working Panel drawer, routing
 * graph sheet and the touch dot that drives them. A pure function of the global frame, like appStateAt().
 *
 *   mobileStateAt(frame): MobileState
 *
 * All coordinates are the phone's LOGICAL screen (390 x 844). Every hit is on a beat (beat = 15 f):
 *   f1654-1680 boot 0 -> 100 %  |  f1680-1692 the chat wipes in over the boot screen (scanline, top-down)
 *   f1682      the touch dot appears and travels to the hamburger
 *   f1695 b113 tap hamburger  -> sidebar drawer slides in (10 f), rows stagger 3 f, scrim fades
 *   f1725 b115 tap "<"        -> the drawer closes
 *   f1740 b116 tap panel icon -> Working Panel drawer slides in from the right
 *   f1755 b117 tap "Tap to view routing graph" -> bottom sheet rises, the graph grows (a time-lapse of the S3 run)
 *   f1770 b118 swipe down on the sheet handle -> the sheet closes, then the Working Panel drawer slides out
 * The film's fictional data only: Maya Chen, the D1 sidebar and the D3 answer/steps (via appStateAt()).
 */
import {clamp01, signatureEase} from '../lib/ease';
import {f} from './timeline';

// ------------------------------------------------------------------ layout shared by the components and the touch targets
export const MOBILE_LAYOUT = {
  w: 390,
  h: 844,
  /** The phone frame draws the status bar over the top 50 px and the home indicator over the bottom 26 px. */
  statusH: 50,
  homeH: 26,
  headerH: 44,
  subHeaderH: 40,
  composerH: 64,
  sidebarW: 262,
  panelW: 338,
  /** Touch targets (logical px). */
  hamburger: {x: 26, y: 72},
  panelToggle: {x: 364, y: 72},
  chevron: {x: 238, y: 116},
  graphCard: {x: 221, y: 754, w: 306, h: 58},
  /** The graph sheet: its top edge when fully open, and its handle. */
  sheetTop: 214,
  sheetHandle: {x: 195, y: 232},
} as const;

export const MOBILE_TIMES = {
  bootStart: f(1654),
  bootEnd: f(1680),
  chatWakeStart: f(1680),
  chatWakeEnd: f(1692),
  dotIn: f(1682),
  hamburgerTap: f(1695),
  chevronTap: f(1725),
  panelTap: f(1740),
  graphTap: f(1755),
  swipeStart: f(1770),
  swipeEnd: f(1780),
  sidebarOpenFrames: f(10),
  sidebarCloseFrames: f(10),
  panelOpenFrames: f(12),
  panelCloseFrames: f(10),
  sheetOpenFrames: f(12),
  sheetCloseFrames: f(10),
  /** Graph grow: content frames 690 -> 1040 (the S3 run, played as a time-lapse) while the sheet is open. */
  graphGrowStart: f(1757),
  graphGrowEnd: f(1779),
  /** The sidebar rows (and the panel's step cards) stagger in 3 f apart after the drawer starts to open. */
  rowStagger: 3,
  /** The chat auto-scrolls slowly until here (nothing on the phone is static for long). */
  scrollEnd: f(1800),
} as const;

// ------------------------------------------------------------------ helpers
const lin = (frame: number, start: number, end: number): number => clamp01((frame - start) / Math.max(1, end - start));
const eased = (frame: number, start: number, end: number): number => signatureEase(lin(frame, start, end));

/** Open at `openFrom`, closed again from `closeFrom` (null = stays open). Returns 0..1 (eased). */
const openClose = (frame: number, openFrom: number, openFrames: number, closeFrom: number | null, closeFrames: number): number => {
  const open = eased(frame, openFrom, openFrom + openFrames);
  if (closeFrom === null) {
    return open;
  }
  return open * (1 - eased(frame, closeFrom, closeFrom + closeFrames));
};

/** 0..1..0 press pulse around a tap frame. */
const pulse = (frame: number, tap: number, inF = 2, outF = 5): number => lin(frame, tap - inF, tap) * (1 - lin(frame, tap, tap + outF));

// ------------------------------------------------------------------ the touch dot
type DotKey = {frame: number; x: number; y: number};

const L = MOBILE_LAYOUT;
const M = MOBILE_TIMES;

/** Dot waypoints (arrival frames). Between two keys it glides with the signature ease. */
const DOT_KEYS: readonly DotKey[] = [
  {frame: M.dotIn, x: 292, y: 770},
  {frame: M.hamburgerTap - 1, x: L.hamburger.x, y: L.hamburger.y},
  {frame: M.hamburgerTap + 6, x: L.hamburger.x + 8, y: L.hamburger.y + 14},
  {frame: M.chevronTap - 1, x: L.chevron.x, y: L.chevron.y},
  {frame: M.chevronTap + 5, x: L.chevron.x - 6, y: L.chevron.y + 12},
  {frame: M.panelTap - 1, x: L.panelToggle.x, y: L.panelToggle.y},
  {frame: M.panelTap + 5, x: L.panelToggle.x - 8, y: L.panelToggle.y + 16},
  {frame: M.graphTap - 1, x: L.graphCard.x, y: L.graphCard.y},
  {frame: M.graphTap + 6, x: L.graphCard.x + 10, y: L.graphCard.y - 130},
  {frame: M.swipeStart - 1, x: L.sheetHandle.x, y: L.sheetHandle.y},
  {frame: M.swipeEnd, x: L.sheetHandle.x, y: L.sheetHandle.y + 300},
];

const dotPosition = (frame: number): {x: number; y: number} => {
  if (frame <= DOT_KEYS[0].frame) {
    return {x: DOT_KEYS[0].x, y: DOT_KEYS[0].y};
  }
  for (let i = 1; i < DOT_KEYS.length; i++) {
    if (frame <= DOT_KEYS[i].frame) {
      const a = DOT_KEYS[i - 1];
      const b = DOT_KEYS[i];
      const p = eased(frame, a.frame, b.frame);
      return {x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p};
    }
  }
  const last = DOT_KEYS[DOT_KEYS.length - 1];
  return {x: last.x, y: last.y};
};

/** Every moment a ripple starts: the four taps and the start of the swipe. */
const RIPPLE_STARTS = [M.hamburgerTap, M.chevronTap, M.panelTap, M.graphTap, M.swipeStart] as const;
const TAPS = [M.hamburgerTap, M.chevronTap, M.panelTap, M.graphTap] as const;

// ------------------------------------------------------------------ state
export type MobileState = {
  /** The boot screen is drawn (until the chat has fully wiped in). */
  bootOn: boolean;
  /** 0..1 linear progress shown as "070%". */
  bootProgress: number;
  /** 0..1 the chat wipes in over the boot screen, top-down (linear; the frame draws the scanline). */
  chatReveal: number;
  /** Chat auto-scroll in px. */
  scrollY: number;
  /** 0..1 drawer / sheet progress (eased). */
  sidebar: number;
  panel: number;
  sheet: number;
  /** Frames since the sidebar started to open (for the row stagger). */
  sidebarLocal: number;
  panelLocal: number;
  /** Film content frame used for the panel's step cards. */
  panelFrame: number;
  /** Film content frame used for the graph inside the sheet (grows while the sheet is open). */
  graphFrame: number;
  /** Touch dot. `ripple` is the age in frames of the latest ripple or null. */
  touch: {on: number; x: number; y: number; down: number; ripple: number | null};
  /** 0..1 press of each target (a small scale dip). */
  press: {hamburger: number; chevron: number; panelToggle: number; graphCard: number};
};

export const mobileStateAt = (frame: number): MobileState => {
  const sidebar = openClose(frame, M.hamburgerTap + 2, M.sidebarOpenFrames, M.chevronTap + 2, M.sidebarCloseFrames);
  const panel = openClose(frame, M.panelTap + 2, M.panelOpenFrames, M.swipeEnd + 2, M.panelCloseFrames);
  const sheet = openClose(frame, M.graphTap + 2, M.sheetOpenFrames, M.swipeStart + 2, M.sheetCloseFrames);

  // touch dot: visible from dotIn to just after the swipe
  const dot = dotPosition(frame);
  const dotOn = eased(frame, M.dotIn - 3, M.dotIn + 3) * (1 - eased(frame, M.swipeEnd + 2, M.swipeEnd + 8));

  let ripple: number | null = null;
  for (const start of RIPPLE_STARTS) {
    const age = frame - start;
    if (age >= 0 && age <= f(14)) {
      ripple = age;
    }
  }
  // the swipe is a held press from just before swipeStart to swipeEnd
  const swiping = frame >= M.swipeStart - 2 && frame <= M.swipeEnd ? lin(frame, M.swipeStart - 2, M.swipeStart) : 0;
  const tapDown = Math.max(...TAPS.map((tap) => pulse(frame, tap)));

  return {
    bootOn: frame >= M.bootStart - f(2) && frame < M.chatWakeEnd,
    bootProgress: lin(frame, M.bootStart, M.bootEnd),
    chatReveal: lin(frame, M.chatWakeStart, M.chatWakeEnd),
    scrollY: 150 * eased(frame, M.chatWakeStart, M.scrollEnd),
    sidebar,
    panel,
    sheet,
    sidebarLocal: frame - (M.hamburgerTap + 2),
    panelLocal: frame - (M.panelTap + 2),
    panelFrame: 1040,
    graphFrame: 690 + 350 * lin(frame, M.graphGrowStart, M.graphGrowEnd),
    touch: {on: dotOn, x: dot.x, y: dot.y, down: Math.max(tapDown, swiping), ripple},
    press: {
      hamburger: pulse(frame, M.hamburgerTap),
      chevron: pulse(frame, M.chevronTap),
      panelToggle: pulse(frame, M.panelTap),
      graphCard: pulse(frame, M.graphTap),
    },
  };
};
