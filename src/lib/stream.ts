/**
 * MiniMe promo — deterministic "LLM streaming" engine.
 *
 * Reveals a long text in irregular bursts (a burst is 8 to 14 units of weight; about one in ten frames is a short
 * stall) and finishes EXACTLY on `endFrame`. Because the burst weights are normalised to the text length, the
 * per-frame speed adapts to the text: a 1000 character answer over 115 frames averages about 9 characters per frame.
 *
 * Monotonic: the visible length never goes down as the frame grows. Pure: same inputs, same output.
 *
 *   streamedText(text, frame, startFrame, endFrame, seed)   visible string
 *   streamCount(...)                                        visible length = the index where the caret sits
 */
import {clamp01} from './ease';
import {createRng} from './prng';

const BURST_MIN = 8;
const BURST_MAX = 14;
const STALL_CHANCE = 0.1;
const STALL_WEIGHT = 2;

const weightCache = new Map<string, Float64Array>();

/** Cumulative burst weights W[0..n]: W[0] = 0, W[k] = total weight after k frames. */
const cumulativeWeights = (frames: number, seed: number): Float64Array => {
  const key = `${frames}|${seed}`;
  const cached = weightCache.get(key);
  if (cached) {
    return cached;
  }
  const rng = createRng((seed + 0x9e3779b9) >>> 0);
  const cumulative = new Float64Array(frames + 1);
  for (let k = 1; k <= frames; k++) {
    const stall = rng() < STALL_CHANCE;
    const burst = BURST_MIN + rng() * (BURST_MAX - BURST_MIN);
    cumulative[k] = cumulative[k - 1] + (stall ? STALL_WEIGHT : burst);
  }
  weightCache.set(key, cumulative);
  return cumulative;
};

/**
 * Number of characters (or tokens: pass `length` of whatever unit you stream) visible at `frame`.
 * 0 up to and including `startFrame`, `length` from `endFrame` on.
 */
export const streamCount = (length: number, frame: number, startFrame: number, endFrame: number, seed = 0): number => {
  if (length <= 0 || frame <= startFrame) {
    return 0;
  }
  if (frame >= endFrame) {
    return length;
  }
  const frames = Math.max(1, Math.round(endFrame - startFrame));
  const cumulative = cumulativeWeights(frames, seed);
  const k = Math.min(frames, Math.max(0, Math.floor(frame - startFrame)));
  return Math.min(length, Math.round((length * cumulative[k]) / cumulative[frames]));
};

/** The visible part of `text` at `frame`. */
export const streamedText = (text: string, frame: number, startFrame: number, endFrame: number, seed = 0): string =>
  text.slice(0, streamCount(text.length, frame, startFrame, endFrame, seed));

/** Index in `text` where the streaming caret sits (the end of the visible text). */
export const streamCaretIndex = streamCount;

/** Plain linear 0..1 progress of the stream window (for counters, scroll targets and so on). */
export const streamProgress = (frame: number, startFrame: number, endFrame: number): number =>
  endFrame <= startFrame ? (frame >= endFrame ? 1 : 0) : clamp01((frame - startFrame) / (endFrame - startFrame));

/** True while the stream is running: after the start frame and before the end frame. */
export const isStreaming = (frame: number, startFrame: number, endFrame: number): boolean =>
  frame > startFrame && frame < endFrame;
