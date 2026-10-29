import React from 'react';
import {STAT_CHIP} from '../config/copy';
import {ACCENT, FONTS, NEUTRAL} from '../config/theme';
import {FPS, STAGE} from '../config/timeline';
import {ramp} from '../lib/ease';
import {spr} from '../lib/spring';
import {GLASS, GLASS_SHADOW, useFxFrame} from './fxUtils';

export type StatChipProps = {
  startFrame: number;
  /** Frame at which the exit finishes (the chip stays until then). Omit to keep it forever. */
  endFrame?: number;
  specialists?: number;
  rechecks?: number;
  seconds?: number;
  /** Center of the chip on screen, stage px (default: top center). */
  x?: number;
  y?: number;
  /** Frames each number takes to count up (default 34). */
  countFrames?: number;
  /** Font size in px at 1080p (default 30). */
  fontSize?: number;
  frame?: number;
};

const OUT_FRAMES = 10;
const COUNT_DELAY = 8;
const COUNT_STAGGER = 6;
const SEPARATOR = '\u00B7'; // middle dot

/** One number in a box exactly as wide as its final text, right-aligned, so the chip never jitters while counting. */
const Num: React.FC<{text: string; width: number}> = ({text, width}) => (
  <span
    style={{
      display: 'inline-block',
      width: `${width}ch`,
      textAlign: 'right',
      color: NEUTRAL[100],
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    {text}
  </span>
);

/**
 * "7 specialists · 1 recheck · 41.2s" with mono numerals that count up one after another.
 * Defaults come from STAT_CHIP in copy.ts. Render in the SCREEN layer.
 */
export const StatChip: React.FC<StatChipProps> = ({
  startFrame,
  endFrame,
  specialists = STAT_CHIP.specialists,
  rechecks = STAT_CHIP.rechecks,
  seconds = STAT_CHIP.seconds,
  x = STAGE.width / 2,
  y = 120,
  countFrames = 34,
  fontSize = 30,
  frame: frameOverride,
}) => {
  const frame = useFxFrame(frameOverride);
  if (frame < startFrame || (endFrame !== undefined && frame > endFrame)) {
    return null;
  }

  const exit = endFrame === undefined ? 0 : ramp(frame, endFrame - OUT_FRAMES, endFrame);
  const pop = spr(frame, FPS, startFrame, 'uiPop');
  const reveal = Math.min(1, pop) * (1 - exit);

  const count = (index: number): number => {
    const begin = startFrame + COUNT_DELAY + index * COUNT_STAGGER;
    return ramp(frame, begin, begin + countFrames);
  };

  const finalSeconds = seconds.toFixed(1);
  const parts = [
    {value: String(Math.round(specialists * count(0))), width: String(specialists).length, label: 'specialists'},
    {
      value: String(Math.round(rechecks * count(1))),
      width: String(rechecks).length,
      label: rechecks === 1 ? 'recheck' : 'rechecks',
    },
  ];

  const label: React.CSSProperties = {color: NEUTRAL[400], fontWeight: 500};
  const separator = (
    <span style={{color: ACCENT.base, fontWeight: 700, padding: '0 0.55em'}}>{SEPARATOR}</span>
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${(0.94 + 0.06 * Math.min(1.05, pop)).toFixed(4)})`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 999,
          boxShadow: GLASS_SHADOW,
          opacity: reveal,
        }}
      />
      <div
        style={{
          ...GLASS,
          position: 'relative',
          display: 'flex',
          alignItems: 'baseline',
          whiteSpace: 'nowrap',
          padding: `${Math.round(fontSize * 0.46)}px ${Math.round(fontSize * 0.95)}px`,
          borderRadius: 999,
          fontFamily: FONTS.mono,
          fontSize,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          clipPath: `inset(0 ${((1 - reveal) * 100).toFixed(2)}% 0 0 round 999px)`,
          WebkitClipPath: `inset(0 ${((1 - reveal) * 100).toFixed(2)}% 0 0 round 999px)`,
        }}
      >
        <Num text={parts[0].value} width={parts[0].width} />
        <span style={{...label, paddingLeft: '0.5ch'}}>{parts[0].label}</span>
        {separator}
        <Num text={parts[1].value} width={parts[1].width} />
        <span style={{...label, paddingLeft: '0.5ch'}}>{parts[1].label}</span>
        {separator}
        <Num text={(seconds * count(2)).toFixed(1)} width={finalSeconds.length} />
        <span style={{...label, paddingLeft: 0}}>s</span>
      </div>
    </div>
  );
};
