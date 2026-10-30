/**
 * MiniMe promo — deterministic typing engine.
 *
 * A pure function of the frame: "what is in the textarea at frame N". The schedule (when each character appears)
 * is computed once per (text, options) from the seeded PRNG and cached, so the same frame always gives the same
 * string on every render worker.
 *
 *   typedText(text, frame, startFrame)            visible string
 *   typingEndFrame(text, startFrame, opts)        frame at which the LAST character has appeared
 *   keystrokeFrames(text, startFrame, opts)       one frame per character (use it to place key-tick SFX)
 *   caretVisible(frame, opts)                     blink state (16 frame period)
 *
 * The first character appears ON `startFrame`. Pauses are authored at 30 fps and scale with FPS.
 */
import {BASE_FPS, FPS} from '../config/timeline';
import {createRng, hashString} from './prng';

export type TypingOptions = {
  /** Average speed. Default 30 characters per second (about 1 character per frame at 30 fps). */
  charsPerSec?: number;
  /** +- fraction of random variation of each character gap. Default 0.4 (+-40%). */
  jitter?: number;
  /** Extra seed so two identical strings can type differently. Default 0. */
  seed?: number;
  /**
   * Retime: stretch or squeeze the whole schedule so the LAST character appears exactly this many frames after
   * `startFrame`. The rhythm (jitter and pauses) is kept, only the speed changes. Use it to land typing on a beat.
   */
  durationFrames?: number;
};

const DEFAULTS = {charsPerSec: 30, jitter: 0.4, seed: 0} as const;

/** Micro pauses, in frames authored at 30 fps (scaled to FPS). */
const PAUSE_WORD = 0.7; // after a space (between words)
const PAUSE_SOFT = 2.5; // after , ; :
const PAUSE_END = 5; // after . ! ?
const FPS_SCALE = FPS / BASE_FPS;

const pauseAfter = (ch: string): number => {
  if (ch === ' ') {
    return PAUSE_WORD * FPS_SCALE;
  }
  if (ch === ',' || ch === ';' || ch === ':') {
    return PAUSE_SOFT * FPS_SCALE;
  }
  if (ch === '.' || ch === '!' || ch === '?') {
    return PAUSE_END * FPS_SCALE;
  }
  return 0;
};

const scheduleCache = new Map<string, readonly number[]>();

/**
 * Frame offset (relative to the start frame, fractional) at which each character becomes visible.
 * offsets[0] is 0. Monotonic non-decreasing. Empty text gives an empty array.
 */
export const typingSchedule = (text: string, options: TypingOptions = {}): readonly number[] => {
  const {charsPerSec, jitter, seed} = {...DEFAULTS, ...options};
  const duration = options.durationFrames;
  const key = `${charsPerSec}|${jitter}|${seed}|${duration ?? ''}|${FPS}|${text}`;
  const cached = scheduleCache.get(key);
  if (cached) {
    return cached;
  }

  const rng = createRng((hashString(text) + Math.imul(seed, 7919)) >>> 0);
  const base = FPS / charsPerSec;
  const offsets: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (i === 0) {
      offsets.push(0);
      continue;
    }
    const gap = base * (1 + jitter * (rng() * 2 - 1)) + pauseAfter(text[i - 1]);
    offsets.push(offsets[i - 1] + gap);
  }

  if (duration !== undefined && offsets.length > 1) {
    const last = offsets[offsets.length - 1];
    if (last > 0) {
      const k = duration / last;
      for (let i = 0; i < offsets.length; i++) {
        offsets[i] *= k;
      }
    }
  }

  scheduleCache.set(key, offsets);
  return offsets;
};

/** How many characters are visible at `frame`. */
export const typedCount = (text: string, frame: number, startFrame: number, options: TypingOptions = {}): number => {
  const elapsed = frame - startFrame;
  if (elapsed < 0 || text.length === 0) {
    return 0;
  }
  const offsets = typingSchedule(text, options);
  // binary search: number of offsets <= elapsed
  let lo = 0;
  let hi = offsets.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (offsets[mid] <= elapsed) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
};

/** The visible string at `frame`. */
export const typedText = (text: string, frame: number, startFrame: number, options: TypingOptions = {}): string =>
  text.slice(0, typedCount(text, frame, startFrame, options));

/** Total length of the typing in frames (the offset of the last character, rounded up). 0 for empty text. */
export const typingDuration = (text: string, options: TypingOptions = {}): number => {
  const offsets = typingSchedule(text, options);
  return offsets.length === 0 ? 0 : Math.ceil(offsets[offsets.length - 1]);
};

/** The frame on which the last character has appeared. Schedule the Enter key a few frames after it. */
export const typingEndFrame = (text: string, startFrame: number, options: TypingOptions = {}): number =>
  startFrame + typingDuration(text, options);

/**
 * The (integer) frame on which each character appears, one entry per character.
 * Several characters can share a frame; skip repeats if you place one sound per frame.
 */
export const keystrokeFrames = (text: string, startFrame: number, options: TypingOptions = {}): number[] =>
  typingSchedule(text, options).map((offset) => startFrame + Math.ceil(offset));

export type CaretOptions = {
  /** Blink period in frames. Default 16 (visible for the first half, hidden for the second). */
  period?: number;
  /** Frame of the most recent keystroke: the caret stays solid for `solidFrames` after it, like a real caret. */
  lastKeystrokeFrame?: number;
  /** Default 10. */
  solidFrames?: number;
};

/** Blinking caret on a 16 frame period (frame-based, never a timer). */
export const caretVisible = (frame: number, options: CaretOptions = {}): boolean => {
  const {period = 16, lastKeystrokeFrame, solidFrames = 10} = options;
  if (lastKeystrokeFrame !== undefined) {
    const since = frame - lastKeystrokeFrame;
    if (since >= 0 && since < solidFrames) {
      return true;
    }
  }
  const half = Math.max(1, period / 2);
  const phase = (((frame % period) + period) % period);
  return phase < half;
};
