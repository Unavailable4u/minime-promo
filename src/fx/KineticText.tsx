import React from 'react';
import {ACCENT, FONTS, NEUTRAL} from '../config/theme';
import {ramp} from '../lib/ease';
import {useFxFrame} from './fxUtils';

export type KineticTextProps = {
  /** One string per visual line, for example [HEADLINE.line1, HEADLINE.line2]. */
  lines: readonly string[];
  /** Frame the first word starts rising. */
  startFrame: number;
  /** Optional frame at which the words start leaving (they rise out through the top of their mask). */
  exitFrame?: number;
  /** A whole word (punctuation included, for example "team.") that turns crimson. */
  highlight?: string;
  /** Draw an underline under the highlight word after it has risen. */
  underline?: boolean;
  /** Frames between consecutive words (default 3). */
  stagger?: number;
  fontSize?: number;
  weight?: 600 | 700 | 800;
  color?: string;
  highlightColor?: string;
  align?: 'left' | 'center';
  lineHeight?: number;
  letterSpacing?: string;
  fontFamily?: string;
  style?: React.CSSProperties;
  frame?: number;
};

const RISE_FRAMES = 18;
const UNDERLINE_DELAY = 12;
const UNDERLINE_FRAMES = 22;

/**
 * Staggered, masked word reveal used for the headline and tagline. Each word rises out of its own
 * overflow:hidden box, 3 frames after the previous one. Nothing fades.
 * Render in the SCREEN layer (or anywhere not zoomed by the camera).
 */
export const KineticText: React.FC<KineticTextProps> = ({
  lines,
  startFrame,
  exitFrame,
  highlight,
  underline = false,
  stagger = 3,
  fontSize = 120,
  weight = 800,
  color = NEUTRAL[100],
  highlightColor = ACCENT.base,
  align = 'center',
  lineHeight = 1.08,
  letterSpacing = '-0.02em',
  fontFamily = FONTS.heading,
  style,
  frame: frameOverride,
}) => {
  const frame = useFxFrame(frameOverride);
  let wordIndex = 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        fontFamily,
        fontWeight: weight,
        fontSize,
        lineHeight,
        letterSpacing,
        color,
        ...style,
      }}
    >
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} style={{display: 'flex', gap: '0.26em'}}>
          {line
            .split(' ')
            .filter(Boolean)
            .map((word) => {
              const index = wordIndex++;
              const start = startFrame + index * stagger;
              const enter = ramp(frame, start, start + RISE_FRAMES);
              const exit =
                exitFrame === undefined
                  ? 0
                  : ramp(
                      frame,
                      exitFrame + index * stagger,
                      exitFrame + index * stagger + RISE_FRAMES,
                    );
              const isHighlight = highlight !== undefined && word === highlight;
              const translate = (1 - enter) * 110 - exit * 110;

              const underlineProgress =
                underline && isHighlight
                  ? ramp(
                      frame,
                      start + UNDERLINE_DELAY,
                      start + UNDERLINE_DELAY + UNDERLINE_FRAMES,
                    ) *
                    (1 - exit)
                  : 0;

              return (
                <div key={`${lineIndex}-${index}`} style={{position: 'relative'}}>
                  <div
                    style={{
                      overflow: 'hidden',
                      padding: '0.12em 0.04em',
                      margin: '-0.12em -0.04em',
                    }}
                  >
                    <div
                      style={{
                        whiteSpace: 'nowrap',
                        color: isHighlight ? highlightColor : undefined,
                        transform: `translateY(${translate.toFixed(3)}%)`,
                      }}
                    >
                      {word}
                    </div>
                  </div>
                  {underlineProgress > 0 ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: `${-0.04 * fontSize}px`,
                        height: Math.max(4, Math.round(fontSize * 0.055)),
                        borderRadius: 999,
                        background: highlightColor,
                        transformOrigin: '0% 50%',
                        transform: `scaleX(${underlineProgress.toFixed(4)})`,
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
};
