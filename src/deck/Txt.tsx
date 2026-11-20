import React, {createContext, useContext} from 'react';
import {TONES, TYPE, type DeckTheme, type Tone, type TypeSize} from './theme';

/**
 * The only way to put text on a slide. Eight sizes, no free font size (nothing under 22 px):
 *   cover (124)  display (132 numerals)  headline (80)  sub (42 italic)  body (32)  label (24 mono caps)  caption (22 mono)  code (24 mono)
 * Colour is a tone, not a hex: primary, secondary, muted, accent, data. The tone's colour follows the slide's theme
 * (paper or ink) through context, so the same slide code works on both grounds. Use `accent` for ONE thing per slide.
 */
export type {Tone};

export const ThemeContext = createContext<DeckTheme>('paper');
export const useDeckTheme = (): DeckTheme => useContext(ThemeContext);

/** The type system forbids these in `style`, so the size, face and colour rules cannot be bypassed. */
type LockedStyle = 'fontSize' | 'fontFamily' | 'fontWeight' | 'fontStyle' | 'font' | 'color' | 'lineHeight' | 'textTransform';

export type TxtProps = {
  size: TypeSize;
  tone?: Tone;
  as?: 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3';
  align?: 'left' | 'center' | 'right';
  /** Use the medium weight (500) of the serif faces. */
  strong?: boolean;
  style?: Omit<React.CSSProperties, LockedStyle>;
  children?: React.ReactNode;
};

export const Txt: React.FC<TxtProps> = ({size, tone = 'primary', as = 'div', align, strong = false, style, children}) => {
  const t = TYPE[size];
  const theme = useDeckTheme();
  const Tag = as;
  return (
    <Tag
      style={{
        margin: 0,
        fontFamily: t.family,
        fontWeight: strong && t.family === TYPE.body.family ? 500 : t.weight,
        fontStyle: t.style,
        fontSize: t.size,
        lineHeight: t.lineHeight,
        letterSpacing: t.letterSpacing,
        textTransform: t.caps ? 'uppercase' : undefined,
        color: TONES[theme][tone],
        textAlign: align,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};

/** The key word or number of a slide, inline: `<Txt size="headline">Build it. <Accent>Test</Accent> it.</Txt>`. */
export const Accent: React.FC<{children: React.ReactNode}> = ({children}) => {
  const theme = useDeckTheme();
  return <span style={{color: TONES[theme].accent}}>{children}</span>;
};

/** Inline italic (serif) emphasis inside running text. */
export const Em: React.FC<{children: React.ReactNode}> = ({children}) => <em style={{fontStyle: 'italic'}}>{children}</em>;
