import React from 'react';
import {ChevronRight} from 'lucide-react';
import {UI_TEXT} from '../config/copy';
import {NEUTRAL, NEUTRAL_ALPHA} from '../config/theme';
import type {TierKey} from '../config/theme';
import {clamp01, signatureEase} from '../lib/ease';
import {tierText} from '../lib/roleIcons';
import {PANEL} from './panelLayout';

export type RoutingCardProps = {
  /** Which tier the card describes. "instant" reads "Instant response — no pipeline". Default "adaptive". */
  tier?: TierKey;
  /** The tier the text is morphing AWAY from (the moment the Inspector decides). Used with `morph`. */
  fromTier?: TierKey;
  /** 0..1 progress of the text morph from `fromTier` to `tier`. Default 1. */
  morph?: number;
  /** Details open 0..1 (chevron turns, trace lines unfold). Default 0. */
  open?: number;
  /** Trace lines shown when open (neutral-400, 11 px). */
  details?: readonly string[];
  /** Cursor over the summary. */
  hover?: boolean;
  /** 0..1 fade/slide in (the panel passes its cascade value). Default 1. */
  appear?: number;
};

const LINE = 16;
const DETAIL_LINE = 15;

export const routingCardHeight = (details: readonly string[] | undefined, open: number): number =>
  PANEL.routingH + (details && details.length > 0 ? Math.round((details.length * DETAIL_LINE + 12) * signatureEase(clamp01(open))) : 0);

const summaryText = (tier: TierKey): string => (tier === 'instant' ? UI_TEXT.routingInstant : tierText(tier));

/**
 * Routing card ("details" style): rounded 8, 1 px #262626, bg rgba(10,10,10,.5), 12 px. Summary px8 py6:
 * "Tier 3 · adaptive" (neutral-300) + " · routing trace" (neutral-600) behind a rotating chevron.
 */
export const RoutingCard: React.FC<RoutingCardProps> = ({
  tier = 'adaptive',
  fromTier,
  morph = 1,
  open = 0,
  details,
  hover = false,
  appear = 1,
}) => {
  const a = signatureEase(clamp01(appear));
  const o = signatureEase(clamp01(open));
  const m = fromTier === undefined ? 1 : signatureEase(clamp01(morph));
  const hasDetails = details !== undefined && details.length > 0;
  const tail = <span style={{color: NEUTRAL[600], whiteSpace: 'pre'}}>{` · ${UI_TEXT.routingTrace}`}</span>;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '100%',
        border: `1px solid ${hover ? NEUTRAL[700] : NEUTRAL[800]}`,
        background: NEUTRAL_ALPHA.n950a50,
        borderRadius: 8,
        overflow: 'hidden',
        fontSize: 12,
        lineHeight: `${LINE}px`,
        opacity: a,
        transform: `translateY(${8 * (1 - a)}px)`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', height: PANEL.routingH - 2, boxSizing: 'border-box'}}>
        <ChevronRight size={12} strokeWidth={2} color={NEUTRAL[500]} style={{flexShrink: 0, transform: `rotate(${90 * o}deg)`}} />
        {m >= 1 ? (
          <span style={{color: NEUTRAL[300], whiteSpace: 'pre'}}>{summaryText(tier)}</span>
        ) : (
          <span style={{display: 'grid', height: LINE, overflow: 'hidden'}}>
            <span
              style={{gridArea: '1 / 1', color: NEUTRAL[300], opacity: 1 - m, transform: `translateY(${-LINE * m}px)`, whiteSpace: 'pre'}}
            >
              {summaryText(fromTier as TierKey)}
            </span>
            <span
              style={{gridArea: '1 / 1', color: NEUTRAL[300], opacity: m, transform: `translateY(${LINE * (1 - m)}px)`, whiteSpace: 'pre'}}
            >
              {summaryText(tier)}
            </span>
          </span>
        )}
        {tail}
      </div>
      {hasDetails ? (
        <div style={{height: Math.round((details.length * DETAIL_LINE + 12) * o), overflow: 'hidden', opacity: clamp01(o * 1.4)}}>
          <div style={{borderTop: `1px solid ${NEUTRAL[800]}`, padding: '6px 8px', fontSize: 11, lineHeight: `${DETAIL_LINE}px`, color: NEUTRAL[400]}}>
            {details.map((line, index) => (
              <div key={index} style={{whiteSpace: 'pre'}}>
                {line}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
