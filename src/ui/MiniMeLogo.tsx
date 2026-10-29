import React from 'react';
import {ACCENT} from '../config/theme';
import {f} from '../config/timeline';
import {clamp01, mapRange, signatureEase} from '../lib/ease';

/**
 * The MiniMe mark. Path data is EXACT (master Appendix A). Never redraw or "improve" it.
 * public/brand/minime-logo.svg holds the same two paths as a plain SVG file.
 */
export const LOGO_VIEWBOX = '0 0 1024 844';
export const LOGO_WIDTH = 1024;
export const LOGO_HEIGHT = 844;
export const LOGO_TRANSFORM = 'translate(0,844) scale(0.1,-0.1)';
export const LOGO_FILL = ACCENT.base; // #FF2052
export const PATH1_D =
  'M3395 7019 c-69 -13 -229 -67 -290 -97 -111 -56 -224 -142 -341 -264 c-115 -119 -182 -209 -298 -401 -586 -967 -915 -2135 -894 -3173 5 -237 16 -302 78 -468 99 -267 338 -506 613 -616 157 -62 223 -74 427 -74 157 -1 198 3 270 21 379 96 676 370 789 725 51 161 62 249 71 553 9 320 23 421 81 600 65 200 179 377 352 542 127 121 226 191 497 354 461 277 768 565 1079 1014 23 33 80 116 128 185 123 177 173 238 242 295 128 105 248 159 428 190 292 51 639 -33 930 -225 42 -28 80 -49 85 -48 30 10 -214 363 -366 528 -151 163 -274 255 -419 310 -118 46 -196 60 -340 60 -367 0 -682 -152 -930 -449 -116 -138 -134 -164 -325 -446 -82 -121 -188 -259 -221 -289 -21 -19 -21 -19 -47 5 -34 31 -107 130 -229 309 -220 324 -364 503 -495 613 -153 129 -339 217 -521 246 -77 13 -284 12 -354 0z m333 -720 c105 -51 201 -153 350 -371 180 -264 266 -386 325 -460 37 -48 67 -90 67 -95 0 -4 -94 -69 -208 -143 -261 -171 -394 -274 -547 -425 -278 -275 -441 -562 -524 -925 -53 -229 -71 -394 -71 -665 0 -203 -13 -282 -60 -383 -64 -136 -198 -215 -365 -216 -202 0 -347 104 -405 293 -35 112 -24 563 21 871 90 617 257 1158 527 1710 177 363 317 586 440 701 153 144 300 179 450 108z';
export const PATH2_D =
  'M6322 4382 c-113 23 -230 12 -321 -33 c-79 -38 -189 -152 -228 -234 c-35 -74 -67 -171 -78 -236 l-7 -43 l503 0 l502 0 l-6 64 c-9 97 -63 248 -112 315 c-71 96 -142 143 -253 167 z m358 1918 c0 10 161 6 230 -5 c245 -39 428 -124 626 -290 c238 -201 387 -449 549 -919 c143 -415 238 -841 305 -1370 c20 -161 24 -445 6 -550 c-64 -391 -253 -683 -586 -905 c-230 -154 -526 -253 -854 -286 c-146 -14 -453 -7 -586 15 c-492 79 -920 361 -1147 757 c-194 338 -255 821 -158 1244 c130 568 541 933 1084 962 c460 24 841 -189 1039 -582 c125 -250 181 -533 169 -863 c-4 -89 -9 -167 -12 -172 c-4 -6 -314 -10 -830 -10 l-823 0 l15 -67 c36 -161 132 -320 250 -414 c181 -145 435 -221 738 -221 c160 -1 253 11 411 52 c185 48 359 150 458 271 c53 64 119 200 135 277 c25 120 9 355 -50 732 c-94 602 -339 1316 -624 1815 c-120 210 -185 312 -287 447 c-32 42 -58 79 -58 82 z';

/** Pen-draw timing used by the film (authored at 30 fps): each path draws over 42 f, path 2 starts 4 f later. */
export const LOGO_DRAW_FRAMES = f(42);
export const LOGO_PATH2_DELAY_FRAMES = f(4);
/**
 * Path 2's start offset in PROGRESS terms (0..1 of the whole two-path draw).
 * With the film defaults this is 4 / (42 + 4) = 0.0870. Path 1 finishes at progress 1 - offset, path 2 at 1.
 */
export const LOGO_PATH2_OFFSET = LOGO_PATH2_DELAY_FRAMES / (LOGO_DRAW_FRAMES + LOGO_PATH2_DELAY_FRAMES);

/** Linear 0..1 progress of the full pen-draw for a given frame (start frame + optional custom draw length). */
export const logoProgress = (frame: number, startFrame: number, drawFrames: number = LOGO_DRAW_FRAMES): number =>
  clamp01((frame - startFrame) / (drawFrames + LOGO_PATH2_DELAY_FRAMES));

/** The crimson fill takes over from this fraction of each path's (eased) draw. */
const FILL_TAKEOVER = 0.8;
/** Default stroke width in px at the component's own size (the real app uses 2.5). */
export const LOGO_STROKE_PX = 2.5;

export type MiniMeLogoProps = {
  /** 0..1 pen-draw progress of the whole mark (linear; the component applies the signature ease per path). */
  progress: number;
  /**
   * 0..1 override of the crimson fill opacity for BOTH paths.
   * Leave undefined for the natural behaviour (fill takes over at ~80 percent of each path's draw while the stroke fades).
   * The stroke opacity is always 1 - fill, so fill=1 shows the clean solid mark.
   */
  fill?: number;
  /** Width of the mark in px (height follows the 1024x844 aspect ratio). */
  size: number;
  /** 0..1 crimson glow around the mark. */
  glow?: number;
  /** Path 2 start offset in progress terms. Default LOGO_PATH2_OFFSET. */
  path2Offset?: number;
  /** Stroke width in px at this component's own size. Default 2.5. */
  strokePx?: number;
  style?: React.CSSProperties;
};

/**
 * Pure, props-driven logo. DETERMINISM: dash lengths are NOT measured with getTotalLength().
 * Both paths use pathLength="1" so the dash math is 0..1 and identical on every render worker.
 *
 * DEVIATION from the brief: no vector-effect="non-scaling-stroke". Chrome evaluates dash lengths in screen
 * space when that effect is on, which breaks pathLength normalisation. Instead the stroke width is converted
 * into path units from `size`, so it is exactly `strokePx` screen px at the component's own size.
 */
export const MiniMeLogo: React.FC<MiniMeLogoProps> = ({
  progress,
  fill,
  size,
  glow = 0,
  path2Offset = LOGO_PATH2_OFFSET,
  strokePx = LOGO_STROKE_PX,
  style,
}) => {
  const o = Math.min(0.95, Math.max(0, path2Offset));
  const p = clamp01(progress);
  const local1 = clamp01(p / (1 - o));
  const local2 = clamp01((p - o) / (1 - o));

  const pathProps = (local: number) => {
    const drawn = signatureEase(local);
    const naturalFill = mapRange(drawn, FILL_TAKEOVER, 1, 0, 1);
    const fillAlpha = fill === undefined ? naturalFill : clamp01(fill);
    return {
      fillOpacity: fillAlpha,
      // A zero-length dash with round caps would leave a dot, so hide the stroke before the pen touches down.
      strokeOpacity: local > 0 ? 1 - fillAlpha : 0,
      strokeDashoffset: 1 - drawn,
    };
  };

  // path units -> px: the viewBox is scaled by size/1024 and the group by 0.1
  const pxPerUnit = (size / LOGO_WIDTH) * 0.1;
  const strokeWidth = strokePx / pxPerUnit;

  const g = clamp01(glow);
  const filter =
    g > 0
      ? `drop-shadow(0 0 ${size * 0.05 * g}px rgba(255, 32, 82, ${0.55 * g})) drop-shadow(0 0 ${size * 0.16 * g}px rgba(255, 32, 82, ${0.35 * g}))`
      : undefined;

  const common = {
    pathLength: 1,
    fill: LOGO_FILL,
    stroke: LOGO_FILL,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeDasharray: '1 2',
  };

  return (
    <svg
      width={size}
      height={(size * LOGO_HEIGHT) / LOGO_WIDTH}
      viewBox={LOGO_VIEWBOX}
      role="img"
      aria-label="MiniMe"
      style={{display: 'block', overflow: 'visible', filter, ...style}}
    >
      <g transform={LOGO_TRANSFORM}>
        <path d={PATH1_D} {...common} {...pathProps(local1)} />
        <path d={PATH2_D} {...common} {...pathProps(local2)} />
      </g>
    </svg>
  );
};
