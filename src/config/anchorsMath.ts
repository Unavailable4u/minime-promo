/**
 * MiniMe promo — tiny math helper of anchors.ts (patch 07).
 *
 * Kept in its own file so anchors.ts can read "how far along is this frame range" without importing the whole
 * app state engine twice.
 */

/** Linear fraction of `frame` between `start` and `end`: 0 at `start`, 1 at `end`, NOT clamped (callers clamp). */
export const lerpFraction = (frame: number, start: number, end: number): number => (frame - start) / Math.max(1, end - start);
