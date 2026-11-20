import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BRAND} from '../config/copy';
import {DeckFonts} from './deckFonts';
import {Accent, ThemeContext, Txt, useDeckTheme, type Tone} from './Txt';
import {CANVAS, CONTENT, DECK_FONTS, FOOTER, PALETTE, PIN, SURFACES, TOTAL_SLIDES, TYPE, TONES, type DeckTheme} from './theme';

/** Footer: hairline, "Next Inc · MiniMe · Pitch deck" left, "n / 11" right, mono 22 px. */
export const Footer: React.FC<{n: number; theme: DeckTheme; label: string}> = ({n, theme, label}) => {
  const line = SURFACES[theme].line;
  const color = TONES[theme].muted;
  const base = {
    position: 'absolute' as const,
    bottom: FOOTER.textBottom,
    fontFamily: DECK_FONTS.mono,
    fontSize: FOOTER.fontSize,
    lineHeight: 1,
    letterSpacing: '0.02em',
    color,
  };
  return (
    <>
      <div style={{position: 'absolute', left: CONTENT.x, right: CANVAS.width - CONTENT.x - CONTENT.width, top: FOOTER.ruleY, height: 1, backgroundColor: line}} />
      <div style={{...base, left: CONTENT.x}}>{label}</div>
      <div style={{...base, right: CANVAS.width - CONTENT.x - CONTENT.width}}>
        {n} / {TOTAL_SLIDES}
      </div>
    </>
  );
};

/** Page ground: warm paper with two soft colour washes (no grid), or flat ink. Pure CSS, no network. */
const Ground: React.FC<{theme: DeckTheme}> = ({theme}) =>
  theme === 'paper' ? (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.paper,
        backgroundImage: [
          'radial-gradient(1100px 620px at 0% 0%, rgba(212, 20, 63, 0.07), transparent 62%)',
          'radial-gradient(1000px 560px at 100% 0%, rgba(36, 71, 214, 0.05), transparent 62%)',
        ].join(', '),
      }}
    />
  ) : (
    <AbsoluteFill style={{backgroundColor: PALETTE.night}} />
  );

export type SlideProps = {
  /** Slide number 1..11. Slide N renders at frame N-1. */
  n: number;
  /** `paper` (default) or `ink` (the cover and the close). */
  theme?: DeckTheme;
  /** Section tag text, e.g. "The problem"; drawn at the top left as "§ 01 · The problem" (the number follows the slide). */
  tag?: string;
  /** Full-bleed layer between the ground and the content (for example the cover's logo glow). */
  backdrop?: React.ReactNode;
  /** Footer left text (default: the deck name). `false` hides the footer. */
  footer?: string | false;
  /** Extra style for the content box. The box is always at (96, 72), 1728 x 920. */
  contentStyle?: React.CSSProperties;
  children?: React.ReactNode;
};

export const DECK_FOOTER = 'Next Inc · MiniMe · Pitch deck';

/** Slide shell: ground, section tag, 1728 x 920 content box at (96, 72), footer. Fonts are awaited before the frame is captured. */
export const Slide: React.FC<SlideProps> = ({n, theme = 'paper', tag, backdrop, footer = DECK_FOOTER, contentStyle, children}) => (
  <DeckFonts>
    <ThemeContext.Provider value={theme}>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Ground theme={theme} />
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
          {tag ? (
            <Txt size="label" tone="accent" style={{marginBottom: 20}}>
              § {String(n - 1).padStart(2, '0')} · {tag}
            </Txt>
          ) : null}
          {children}
        </div>
        {footer === false ? null : <Footer n={n} theme={theme} label={footer} />}
      </AbsoluteFill>
    </ThemeContext.Provider>
  </DeckFonts>
);

/** A card: soft surface, hairline, rounded. Content goes inside; give it width and height with `style`. */
export const Card: React.FC<{style?: React.CSSProperties; accent?: boolean; children?: React.ReactNode}> = ({style, accent = false, children}) => {
  const theme = useDeckTheme();
  const s = SURFACES[theme];
  return (
    <div
      style={{
        boxSizing: 'border-box',
        backgroundColor: s.card,
        border: `1px solid ${accent ? TONES[theme].accent : s.line}`,
        borderRadius: 18,
        boxShadow: accent ? `0 0 0 3px ${theme === 'paper' ? 'rgba(212, 20, 63, 0.12)' : 'rgba(255, 74, 107, 0.2)'}` : '0 8px 24px rgba(40, 28, 12, 0.07)',
        padding: 28,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Numbered pin, centred on (x, y) inside the nearest positioned parent. Place it over a <Shot> with mapPoint() so it
 * follows the picture if the crop changes. The optional label (mono, 22 px) sits to the right or left of the circle.
 */
export const Pin: React.FC<{n: number; x: number; y: number; label?: string; side?: 'right' | 'left'}> = ({n, x, y, label, side = 'right'}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
    <div
      style={{
        position: 'absolute',
        left: -PIN.diameter / 2,
        top: -PIN.diameter / 2,
        width: PIN.diameter,
        height: PIN.diameter,
        borderRadius: '50%',
        backgroundColor: PALETTE.accent,
        color: PALETTE.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: DECK_FONTS.mono,
        fontWeight: 600,
        fontSize: TYPE.label.size,
        lineHeight: 1,
        boxShadow: '0 6px 18px rgba(212, 20, 63, 0.45), 0 0 0 4px rgba(255, 255, 255, 0.9)',
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
          backgroundColor: PALETTE.paperCard,
          boxShadow: `0 6px 18px rgba(0, 0, 0, 0.25), 0 0 0 1px ${PALETTE.paperLine}`,
          ...(side === 'right' ? {left: PIN.diameter / 2 + 10} : {right: PIN.diameter / 2 + 10}),
        }}
      >
        <span style={{fontFamily: DECK_FONTS.mono, fontWeight: 500, fontSize: TYPE.caption.size, color: PALETTE.ink}}>{label}</span>
      </div>
    ) : null}
  </div>
);

/**
 * A numbered pin that sits in the flow (legends, column heads, captions) instead of over a screenshot. Same look as <Pin>
 * (crimson disc, white mono numeral, white ring); not positioned. Pass `size` for a smaller one in a dense legend.
 */
export const PinDot: React.FC<{n: number; size?: number}> = ({n, size = PIN.diameter}) => (
  <div
    style={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: '50%',
      backgroundColor: PALETTE.accent,
      color: PALETTE.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: DECK_FONTS.mono,
      fontWeight: 600,
      fontSize: TYPE.label.size,
      lineHeight: 1,
      boxShadow: '0 6px 18px rgba(212, 20, 63, 0.35), 0 0 0 3px rgba(255, 255, 255, 0.9)',
    }}
  >
    {n}
  </div>
);

/**
 * Splits a "Name: caption" label (words.ts) at the first colon into [name, caption]. `capitalise` upper-cases the first letter
 * of the caption (for a caption set on its own line). A label without a colon comes back as [label, ''].
 */
export const splitLabel = (label: string, capitalise = false): [string, string] => {
  const at = label.indexOf(': ');
  if (at < 0) {
    return [label, ''];
  }
  const rest = label.slice(at + 2);
  return [label.slice(0, at), capitalise ? rest.charAt(0).toUpperCase() + rest.slice(1) : rest];
};

/**
 * A chevron path: ink arrow-shaped steps that nest into each other, left to right ("Prompt, PRD, Architecture, Blueprint").
 * The text is light on the ink fill, so the steps read the same on a paper page.
 */
export const ChevronPath: React.FC<{steps: readonly string[]}> = ({steps}) => {
  const notch = 22;
  const gap = 8;
  return (
    <div style={{display: 'flex', alignItems: 'center'}}>
      {steps.map((step, i) => (
        <div
          key={step}
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            marginLeft: i === 0 ? 0 : gap - notch,
            padding: `0 ${notch + 12}px 0 ${i === 0 ? 28 : notch + 14}px`,
            backgroundColor: PALETTE.ink,
            clipPath: `polygon(0 0, calc(100% - ${notch}px) 0, 100% 50%, calc(100% - ${notch}px) 100%, 0 100%, ${i === 0 ? 0 : notch}px 50%)`,
          }}
        >
          <ThemeContext.Provider value="ink">
            <Txt size="caption" tone="primary" style={{whiteSpace: 'nowrap'}}>
              {step}
            </Txt>
          </ThemeContext.Provider>
        </div>
      ))}
    </div>
  );
};

/**
 * How each founder photo (public/deck/people/) is framed inside the round portrait: `x`/`y` is the middle of the face as a fraction of
 * the picture (0..1), `zoom` is the picture's displayed width divided by the circle's diameter (bigger = closer). The face sits 40%
 * from the top of the circle, so head and shoulders fit. A photo that is not listed uses DEFAULT_PORTRAIT_FRAME: add a row when a
 * new founder photo is added to data/inputs.ts and look at the slide.
 */
const PORTRAIT_FRAMES: Readonly<Record<string, {x: number; y: number; zoom: number}>> = {
  'shuaib-islam.jpg': {x: 0.49, y: 0.3, zoom: 2.08},
  'shaikh-muhammad.jpg': {x: 0.455, y: 0.25, zoom: 1.875},
};
const DEFAULT_PORTRAIT_FRAME = {x: 0.5, y: 0.27, zoom: 1.9} as const;

/** A founder's photo as a head-and-shoulders circle (the file is never edited; the crop is CSS only). `photo` is a file in public/deck/people/. */
export const Portrait: React.FC<{photo: string; size: number}> = ({photo, size}) => {
  const theme = useDeckTheme();
  const frame = PORTRAIT_FRAMES[photo] ?? DEFAULT_PORTRAIT_FRAME;
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: SURFACES[theme].line,
        boxShadow: `0 0 0 4px ${SURFACES[theme].card}, 0 0 0 5px ${SURFACES[theme].line}, ${SURFACES[theme].shadow}`,
      }}
    >
      <Img
        src={staticFile(`deck/people/${photo}`)}
        style={{
          position: 'absolute',
          left: size / 2,
          top: size * 0.4,
          width: size * frame.zoom,
          maxWidth: 'none',
          transform: `translate(${-frame.x * 100}%, ${-frame.y * 100}%)`,
        }}
      />
    </div>
  );
};

/** SVG `strokeDasharray` value for a dashed line: `dashes(8, 8)` -> "8 8". */
export const dashes = (dash: number, gap: number): string => `${dash} ${gap}`;

/** SVG `viewBox` value for a drawing that is `width` x `height` px: `viewBoxOf(900, 330)` -> "0 0 900 330". */
export const viewBoxOf = (width: number, height: number): string => `0 0 ${width} ${height}`;

/** Big serif numeral with an optional smaller "of N" and a mono caption under it. `value` comes from facts.ts. */
export const Stat: React.FC<{
  value: string | number;
  of?: string | number;
  caption?: string;
  tone?: Tone;
  align?: 'left' | 'center' | 'right';
}> = ({value, of, caption, tone = 'primary', align = 'left'}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'}}>
    <div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
      <Txt size="display" tone={tone}>
        {typeof value === 'number' ? value.toLocaleString('en-US') : value}
      </Txt>
      {of !== undefined ? (
        <Txt size="sub" tone="muted">
          of {typeof of === 'number' ? of.toLocaleString('en-US') : of}
        </Txt>
      ) : null}
    </div>
    {caption ? (
      <Txt size="caption" tone="secondary" align={align} style={{marginTop: 10}}>
        {caption}
      </Txt>
    ) : null}
  </div>
);

/** A rounded pill with a dot, in italic serif, like "• Random per task". */
export const Pill: React.FC<{children: React.ReactNode; tone?: Tone}> = ({children, tone = 'accent'}) => {
  const theme = useDeckTheme();
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 26px 10px 20px',
        borderRadius: 999,
        border: `1px solid ${TONES[theme][tone]}`,
        backgroundColor: theme === 'paper' ? 'rgba(212, 20, 63, 0.06)' : 'rgba(255, 74, 107, 0.1)',
        alignSelf: 'flex-start',
      }}
    >
      <span style={{width: 14, height: 14, borderRadius: '50%', backgroundColor: TONES[theme][tone]}} />
      <Txt size="sub" tone="primary">
        {children}
      </Txt>
    </div>
  );
};

/** The MiniMe wordmark as text: "Mini" in the primary tone, "Me" in the accent. */
export const Wordmark: React.FC = () => (
  <Txt size="headline" as="span">
    {BRAND.mini}
    <Accent>{BRAND.me}</Accent>
  </Txt>
);
