/**
 * MiniMe promo — cursor math (pure functions, no React, fully deterministic).
 *
 * getCursorState(frame, waypoints) answers: where is the cursor, how big, how visible, is it pressed,
 * what is it hovering and which click ripples are alive. Everything is in the UI's LOGICAL 1440x810 space.
 *
 * Path rules
 *  - A waypoint's `frame` is the frame the cursor ARRIVES. Between two waypoints the cursor rests at the
 *    first one, then travels along a cubic Bezier that ends exactly on the second waypoint's frame.
 *  - Travel time grows with distance (CURSOR_TRAVEL_MIN..MAX frames) and is shortened if the gap to the
 *    previous waypoint is smaller.
 *  - The curve is never a straight line: both control points are pushed sideways by a seeded amount
 *    (seed = waypoint index, frame and position, so it is stable between renders and edits elsewhere).
 *  - Progress uses overshoot() from lib/ease: it arrives at ~70% of the travel time, then drifts a few
 *    px past the target along the final tangent and settles back (the "overshoot and correct").
 *  - A click scales the arrow 1 -> 0.88 over the 2 frames before the click frame, holds 0.88 on the
 *    click frame, then springs back to 1 over 4 frames. A ripple lives 14 frames from the click frame.
 *  - Before the first waypoint the cursor is invisible; it fades in over CURSOR_FADE_IN_FRAMES so that it
 *    is fully visible on the first waypoint's frame. After the last waypoint it stays where it is.
 */
import type {CursorWaypoint} from '../config/camera';
import {clamp01, mapRange, overshoot, ramp} from '../lib/ease';
import {createRng, hashString} from '../lib/prng';

// -------------------------------------------------------------------- tunables
/** Travel time in frames for the shortest and the longest moves. */
export const CURSOR_TRAVEL_MIN = 14;
export const CURSOR_TRAVEL_MAX = 36;
/** Distance (logical px) at which the travel time reaches CURSOR_TRAVEL_MAX. */
export const CURSOR_TRAVEL_FULL_DISTANCE = 1000;
/** How far the arrow runs past the target, as a fraction of the move (capped by CURSOR_OVERSHOOT_MAX_PX). */
export const CURSOR_OVERSHOOT = 0.05;
export const CURSOR_OVERSHOOT_MAX_PX = 8;
/** Frames the cursor takes to fade in before its first waypoint. */
export const CURSOR_FADE_IN_FRAMES = 8;

/** Click press: scale at the bottom of the dip, frames to go down (before the click) and back up (after). */
export const CLICK_DIP_SCALE = 0.88;
export const CLICK_DOWN_FRAMES = 2;
export const CLICK_UP_FRAMES = 4;
/** Ripple: life in frames, radius range (logical px) and the opacity at the click frame. */
export const RIPPLE_FRAMES = 14;
export const RIPPLE_RADIUS_FROM = 6;
export const RIPPLE_RADIUS_TO = 28;
export const RIPPLE_OPACITY = 0.5;

// ----------------------------------------------------------------------- types
export type CursorRipple = {
  /** Frames since the click (0..RIPPLE_FRAMES-1). Unique among the ripples alive at one frame. */
  age: number;
  /** Where the click happened, UI logical px. */
  x: number;
  y: number;
  /** Radius in UI logical px (the Cursor component compensates for camera zoom). */
  radius: number;
  /** 0.5 at the click, 0 at the end of its life. */
  opacity: number;
};

export type CursorState = {
  /** Tip of the arrow, UI logical px. */
  x: number;
  y: number;
  /** True during the first frames of a click. */
  pressed: boolean;
  /** `hover` of the waypoint the cursor is resting at (undefined while it travels or if none was given). */
  hover: string | undefined;
  /** Arrow scale from the click dip (1 = normal, 0.88 = fully pressed). */
  scale: number;
  /** 0..1 visibility (0 before the cursor's first appearance). */
  opacity: number;
  /** True while the cursor is on its way to the next waypoint. */
  traveling: boolean;
  ripples: CursorRipple[];
};

type Point = {x: number; y: number};

type Segment = {
  from: Point;
  to: Point;
  c1: Point;
  c2: Point;
  /** Unit vector of the curve's end tangent (the direction the overshoot continues in). */
  tangent: Point;
  distance: number;
  start: number;
  duration: number;
};

type Prepared = {
  points: readonly CursorWaypoint[];
  /** segments[i] is the move that ARRIVES at points[i] (null for i = 0 or when there is nothing to animate). */
  segments: readonly (Segment | null)[];
  clicks: readonly CursorWaypoint[];
};

// -------------------------------------------------------------------- building
const buildSegment = (
  prev: CursorWaypoint,
  cur: CursorWaypoint,
  index: number,
): Segment | null => {
  const gap = cur.frame - prev.frame;
  const dx = cur.x - prev.x;
  const dy = cur.y - prev.y;
  const distance = Math.hypot(dx, dy);
  if (gap <= 0 || distance < 0.5) {
    return null; // the cursor simply is at `cur` from cur.frame on
  }

  const wanted = Math.round(
    mapRange(distance, 0, CURSOR_TRAVEL_FULL_DISTANCE, CURSOR_TRAVEL_MIN, CURSOR_TRAVEL_MAX),
  );
  const duration = Math.max(1, Math.min(gap, wanted));

  const ux = dx / distance;
  const uy = dy / distance;
  const perp = {x: -uy, y: ux};

  const rng = createRng(hashString(`${index}:${cur.frame}:${Math.round(cur.x)}:${Math.round(cur.y)}`));
  const sign = rng() < 0.5 ? -1 : 1;
  const bend1 = distance * (0.1 + rng() * 0.1) * sign;
  // Mostly the same side (a clean arc); sometimes the opposite side (a gentle S).
  const bend2 = distance * (0.04 + rng() * 0.08) * (rng() < 0.3 ? -sign : sign);

  const c1 = {
    x: prev.x + ux * distance * 0.28 + perp.x * bend1,
    y: prev.y + uy * distance * 0.28 + perp.y * bend1,
  };
  const c2 = {
    x: cur.x - ux * distance * 0.22 + perp.x * bend2,
    y: cur.y - uy * distance * 0.22 + perp.y * bend2,
  };

  const tx = cur.x - c2.x;
  const ty = cur.y - c2.y;
  const tl = Math.hypot(tx, ty) || 1;

  return {
    from: {x: prev.x, y: prev.y},
    to: {x: cur.x, y: cur.y},
    c1,
    c2,
    tangent: {x: tx / tl, y: ty / tl},
    distance,
    start: cur.frame - duration,
    duration,
  };
};

const cache = new WeakMap<readonly CursorWaypoint[], Prepared>();

const prepare = (waypoints: readonly CursorWaypoint[]): Prepared => {
  const hit = cache.get(waypoints);
  if (hit) {
    return hit;
  }
  const points = waypoints
    .map((waypoint, index) => ({waypoint, index}))
    .sort((a, b) => a.waypoint.frame - b.waypoint.frame || a.index - b.index)
    .map(({waypoint}) => waypoint);
  const segments = points.map((point, index) =>
    index === 0 ? null : buildSegment(points[index - 1], point, index),
  );
  const prepared: Prepared = {points, segments, clicks: points.filter((p) => p.click)};
  cache.set(waypoints, prepared);
  return prepared;
};

// ------------------------------------------------------------------- evaluating
const bezier = (s: Segment, t: number): Point => {
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return {
    x: w0 * s.from.x + w1 * s.c1.x + w2 * s.c2.x + w3 * s.to.x,
    y: w0 * s.from.y + w1 * s.c1.y + w2 * s.c2.y + w3 * s.to.y,
  };
};

const segmentPosition = (s: Segment, frame: number): Point => {
  const u = clamp01((frame - s.start) / s.duration);
  const o = overshoot(u, CURSOR_OVERSHOOT);
  const p = bezier(s, Math.min(1, o));
  // Past 1 the curve is NOT extrapolated (a cubic would swing wildly); instead the arrow keeps going
  // along the end tangent by a few px and comes back as `o` settles to exactly 1.
  const extra = Math.max(0, o - 1) * Math.min(s.distance, CURSOR_OVERSHOOT_MAX_PX / CURSOR_OVERSHOOT);
  return {x: p.x + s.tangent.x * extra, y: p.y + s.tangent.y * extra};
};

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);

const HIDDEN: CursorState = {
  x: 0,
  y: 0,
  pressed: false,
  hover: undefined,
  scale: 1,
  opacity: 0,
  traveling: false,
  ripples: [],
};

/**
 * The cursor at `frame`. Pure: the same frame and waypoints always give the same result.
 * `waypoints` can be the concatenation of all scene arrays in any order (it is sorted by frame, stable).
 */
export const getCursorState = (frame: number, waypoints: readonly CursorWaypoint[]): CursorState => {
  const {points, segments, clicks} = prepare(waypoints);
  if (points.length === 0) {
    return HIDDEN;
  }

  // Last waypoint already reached (arrival frame <= frame), or -1 before the first one.
  let rest = -1;
  for (let i = 0; i < points.length; i++) {
    if (points[i].frame <= frame) {
      rest = i;
    } else {
      break;
    }
  }

  let x: number;
  let y: number;
  let hover: string | undefined;
  let traveling = false;

  const nextSegment = rest + 1 < points.length ? segments[rest + 1] : null;
  if (rest >= 0 && nextSegment && frame >= nextSegment.start) {
    const p = segmentPosition(nextSegment, frame);
    x = p.x;
    y = p.y;
    traveling = true;
  } else if (rest >= 0) {
    x = points[rest].x;
    y = points[rest].y;
    hover = points[rest].hover;
  } else {
    x = points[0].x;
    y = points[0].y;
  }

  const first = points[0].frame;
  const opacity = ramp(frame, first - CURSOR_FADE_IN_FRAMES, first);

  // ---- clicks: arrow scale, pressed flag, ripples
  let scale = 1;
  let pressed = false;
  const ripples: CursorRipple[] = [];
  for (const click of clicks) {
    const offset = frame - click.frame;
    if (offset >= -CLICK_DOWN_FRAMES && offset < 0) {
      const down = (offset + CLICK_DOWN_FRAMES) / CLICK_DOWN_FRAMES;
      scale = Math.min(scale, 1 - (1 - CLICK_DIP_SCALE) * down);
    } else if (offset >= 0 && offset < CLICK_UP_FRAMES) {
      scale = Math.min(scale, CLICK_DIP_SCALE + (1 - CLICK_DIP_SCALE) * easeOutCubic(offset / CLICK_UP_FRAMES));
    }
    if (offset >= 0 && offset < CLICK_UP_FRAMES - 1) {
      pressed = true;
    }
    if (offset >= 0 && offset < RIPPLE_FRAMES) {
      const life = offset / RIPPLE_FRAMES;
      ripples.push({
        age: offset,
        x: click.x,
        y: click.y,
        radius: RIPPLE_RADIUS_FROM + (RIPPLE_RADIUS_TO - RIPPLE_RADIUS_FROM) * easeOutCubic(life),
        opacity: RIPPLE_OPACITY * (1 - life),
      });
    }
  }

  return {x, y, pressed, hover, scale, opacity, traveling, ripples};
};
