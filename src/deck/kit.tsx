import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LOGO_HEIGHT, LOGO_TRANSFORM, LOGO_VIEWBOX, LOGO_WIDTH, PATH1_D, PATH2_D} from '../ui/MiniMeLogo';
import {FontsReady} from '../lib/fonts';
import {CANVAS, COLORS, CONTENT, FOOTER, PIN, TOTAL_SLIDES, TYPE} from './theme';
import {Txt, type Tone} from './Txt';

/** The footer logo: the exact MiniMe paths (never redrawn), static, in the footer tone. */
const FooterLogo: React.FC = () => (
  <svg
    viewBox={LOGO_VIEWBOX}
    width={(FOOTER.logoHeight * LOGO_WIDTH) / LOGO_HEIGHT}
    height={FOOTER.logoHeight}
    style={{display: 'block'}}
  >
    <g transform={LOGO_TRANSFORM} fill={FOOTER.logoColor} stroke="none">
      <path d={PATH1_D} />
      <path d={PATH2_D} />
    </g>
  </svg>
);

/** Logo at the left, "n / 15" at the right, 30 px, NEUTRAL[500]. */
export const Footer: React.FC<{n: number}> = ({n}) => (
  <div
    style={{
      position: 'absolute',
      left: CONTENT.x,
      right: CANVAS.width - CONTENT.x - CONTENT.width,
      bottom: FOOTER.bottom,
      height: FOOTER.logoHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <FooterLogo />
    <div
      style={{
        fontFamily: TYPE.body.family,
        fontWeight: TYPE.body.weight,
        fontSize: FOOTER.fontSize,
        lineHeight: 1,
        color: FOOTER.color,
      }}
    >
      {n} / {TOTAL_SLIDES}
    </div>
  </div>
);

export type SlideProps = {
  /** Slide number 1..15. Slide N renders at frame N-1. */
  n: number;
  /** Full-bleed layer behind the content box (for example the cover's logo glow). */
  backdrop?: React.ReactNode;
  /** Hide the footer (default: shown). */
  footer?: boolean;
  /** Extra style for the content box, e.g. a different flex direction. The box is always at (96, 72), 1728 x 920. */
  contentStyle?: React.CSSProperties;
  children?: React.ReactNode;
};

/** Slide shell: dark ground, 1728 x 920 content box at (96, 72), footer. Fonts are awaited before the frame is captured. */
export const Slide: React.FC<SlideProps> = ({n, backdrop, footer = true, contentStyle, children}) => (
  <FontsReady>
    <AbsoluteFill style={{backgroundColor: COLORS.ground, overflow: 'hidden'}}>
      {backdrop}
      <div
        style={{
          position: 'absolute',
          left: CONTENT.x,
          top: CONTENT.y,
          width: CONTENT.width,
          height: CONTENT.height,
          display: 'flex',
          flexDirection: 'column',
          ...contentStyle,
        }}
      >
        {children}
      </div>
      {footer ? <Footer n={n} /> : null}
    </AbsoluteFill>
  </FontsReady>
);

/**
 * Numbered pin, centred on (x, y) inside the nearest positioned parent. Place it over a <Shot> with mapPoint() so it
 * follows the picture if the crop changes. The optional label (30 px or larger) sits to the right or left of the circle.
 */
export const Pin: React.FC<{n: number; x: number; y: number; label?: string; side?: 'right' | 'left'}> = ({
  n,
  x,
  y,
  label,
  side = 'right',
}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
    <div
      style={{
        position: 'absolute',
        left: -PIN.diameter / 2,
        top: -PIN.diameter / 2,
        width: PIN.diameter,
        height: PIN.diameter,
        borderRadius: '50%',
        backgroundColor: COLORS.accent,
        color: COLORS.onAccent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: TYPE.headline.family,
        fontWeight: TYPE.headline.weight,
        fontSize: TYPE.body.size,
        lineHeight: 1,
        boxShadow: `0 0 0 4px ${COLORS.ground}`,
      }}
    >
      {n}
    </div>
    {label ? (
      <div
        style={{
          position: 'absolute',
          top: -PIN.diameter / 2,
          height: PIN.diameter,
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          padding: '0 20px',
          borderRadius: PIN.diameter / 2,
          backgroundColor: COLORS.ground,
          boxShadow: `0 0 0 1px ${COLORS.border}`,
          ...(side === 'right' ? {left: PIN.diameter / 2 + 12} : {right: PIN.diameter / 2 + 12}),
        }}
      >
        <Txt size="body">{label}</Txt>
      </div>
    ) : null}
  </div>
);

/** A big number with its label under it. `value` comes from facts.ts, never typed on the slide. */
export const Numeral: React.FC<{
  value: string | number;
  label?: string;
  tone?: Tone;
  align?: 'left' | 'center' | 'right';
}> = ({value, label, tone = 'primary', align = 'left'}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'}}>
    <Txt size="display" tone={tone} align={align}>
      {typeof value === 'number' ? value.toLocaleString('en-US') : value}
    </Txt>
    {label ? (
      <Txt size="body" tone="secondary" align={align} style={{marginTop: 8}}>
        {label}
      </Txt>
    ) : null}
  </div>
);

/** A small outlined pill, e.g. "Pre-launch". Accent outline by default (it is the slide's one accent). */
export const Badge: React.FC<{children: React.ReactNode; tone?: Tone}> = ({children, tone = 'accent'}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '10px 28px',
      borderRadius: 999,
      border: `2px solid ${tone === 'accent' ? COLORS.accent : COLORS.border}`,
      backgroundColor: COLORS.surface,
      alignSelf: 'flex-start',
    }}
  >
    <Txt size="body" tone={tone}>
      {children}
    </Txt>
  </div>
);
