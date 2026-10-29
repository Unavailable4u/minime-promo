/**
 * MiniMe promo — tiny color helpers (pure, deterministic).
 * Used to blend UI states (for example the "Review hires" toggle off -> on) from a 0..1 progress value,
 * because CSS transitions are forbidden in this project.
 */

export type Rgba = {r: number; g: number; b: number; a: number};

/** Parses #rgb, #rrggbb, #rrggbbaa, rgb(), rgba() and "transparent". Throws on anything else. */
export const parseColor = (input: string): Rgba => {
  const c = input.trim().toLowerCase();
  if (c === 'transparent') {
    return {r: 0, g: 0, b: 0, a: 0};
  }
  if (c.startsWith('#')) {
    let hex = c.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((ch) => ch + ch)
        .join('');
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
      };
    }
  }
  const match = c.match(/^rgba?\(([^)]+)\)$/);
  if (match) {
    const parts = match[1].split(',').map((p) => parseFloat(p.trim()));
    if (parts.length >= 3 && parts.every((p) => Number.isFinite(p))) {
      return {r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1};
    }
  }
  throw new Error(`parseColor: unsupported color "${input}"`);
};

const toCss = ({r, g, b, a}: Rgba): string =>
  `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Math.round(a * 1000) / 1000})`;

/**
 * Blend two colors. `t` is clamped to 0..1.
 * A fully transparent end keeps the other end's RGB (so transparent -> crimson fades in as crimson,
 * not as a muddy dark mix).
 */
export const lerpColor = (from: string, to: string, t: number): string => {
  const k = Math.min(1, Math.max(0, t));
  const a = parseColor(from);
  const b = parseColor(to);
  const ra = a.a === 0 ? b : a;
  const rb = b.a === 0 ? a : b;
  return toCss({
    r: ra.r + (rb.r - ra.r) * k,
    g: ra.g + (rb.g - ra.g) * k,
    b: ra.b + (rb.b - ra.b) * k,
    a: a.a + (b.a - a.a) * k,
  });
};

/** Same color with a different alpha (0..1). */
export const withAlpha = (color: string, alpha: number): string =>
  toCss({...parseColor(color), a: Math.min(1, Math.max(0, alpha))});
