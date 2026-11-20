import React from 'react';
import {COLORS, TYPE, type TypeSize} from './theme';

/**
 * The only way to put text on a slide. Four sizes, no free font size (R2: nothing under 30 px):
 *   display (200, Sora 800)  headline (76, Sora 800)  sub (40, Inter 500)  body (32, Inter 500)
 * Colour is a tone, not a hex: primary, secondary, muted, accent (R4). Use `accent` for ONE thing per slide.
 */
export type Tone = 'primary' | 'secondary' | 'muted' | 'accent';

const TONES: Record<Tone, string> = {
  primary: COLORS.text,
  secondary: COLORS.textSecondary,
  muted: COLORS.textMuted,
  accent: COLORS.accent,
};

/** The type system forbids these in `style`, so the size, face and colour rules cannot be bypassed. */
type LockedStyle = 'fontSize' | 'fontFamily' | 'fontWeight' | 'font' | 'color' | 'lineHeight';

export type TxtProps = {
  size: TypeSize;
  tone?: Tone;
  as?: 'div' | 'span' | 'p' | 'h1' | 'h2';
  align?: 'left' | 'center' | 'right';
  style?: Omit<React.CSSProperties, LockedStyle>;
  children?: React.ReactNode;
};

export const Txt: React.FC<TxtProps> = ({size, tone = 'primary', as = 'div', align, style, children}) => {
  const t = TYPE[size];
  const Tag = as;
  return (
    <Tag
      style={{
        margin: 0,
        fontFamily: t.family,
        fontWeight: t.weight,
        fontSize: t.size,
        lineHeight: t.lineHeight,
        letterSpacing: t.letterSpacing,
        color: TONES[tone],
        textAlign: align,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};

/** The key word or number of a slide, inline: `<Txt size="headline">Build it. <Accent>Test</Accent> it.</Txt>`. */
export const Accent: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span style={{color: COLORS.accent}}>{children}</span>
);
