/**
 * Seeded randomness. This is the ONLY allowed source of "random" values in the project
 * (Math.random() would make frames differ between renders).
 */

/** Create a seeded generator (mulberry32). Each call returns a float in [0, 1). */
export const createRng = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Hash a string to an unsigned 32-bit seed (FNV-1a). */
export const hashString = (text: string): number => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** One deterministic value in [0, 1) for a given numeric seed (e.g. a frame number). */
export const rand = (seed: number): number => createRng(seed)();

/** One deterministic value in [min, max) for a given numeric seed. */
export const randRange = (seed: number, min: number, max: number): number =>
  min + rand(seed) * (max - min);

/** One deterministic integer in [min, max] (inclusive) for a given numeric seed. */
export const randInt = (seed: number, min: number, max: number): number =>
  Math.floor(randRange(seed, min, max + 1));

/** One deterministic value in [-amount, amount) for a given numeric seed. */
export const randSigned = (seed: number, amount = 1): number => randRange(seed, -amount, amount);
