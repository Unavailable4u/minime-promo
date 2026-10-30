import React from 'react';
import {ChevronRight} from 'lucide-react';
import {TIER_STEP_LABELS} from '../config/copy';
import {NEUTRAL, STATUS, STEP_CARD} from '../config/theme';
import type {TierKey} from '../config/theme';
import {FPS} from '../config/timeline';
import {lerpColor} from '../lib/color';
import {clamp01, signatureEase} from '../lib/ease';
import {getRoleCategory, roleNameColor, ROLE_ERROR_COLOR, tierText} from '../lib/roleIcons';
import {Emoji} from './Emoji';
import {PANEL} from './panelLayout';

export type StepStatus = 'done' | 'running' | 'error' | 'awaiting' | 'pending';

export type StepCardProps = {
  /** Role as the app prints it: "strategist", "code_writer", or "Inspector — classifying task". */
  name: string;
  status: StepStatus;
  /** Tier text on the card (10 px). Default "adaptive" -> "Tier 3 · adaptive". */
  tier?: TierKey;
  /** Duration shown as "done · 6933ms" (also after an error: "error · 812ms"). */
  ms?: number;
  /** Frame local to the card, for the pulses (running text, awaiting ring). Default 0. */
  frame?: number;
  /** Entrance 0..1 (linear; eased inside): fades in and slides up 8 px. Default 1. */
  appear?: number;
  /** Expand progress 0..1: the body unfolds, the chevron turns. Default 0. */
  expand?: number;
  /** Body text (neutral-300). Without it the body has no summary line. */
  summary?: string;
  /** Recheck note under the summary, e.g. "→ sent back to recheck code_writer". */
  note?: string;
  /** 0..1 error tint on top of the current chrome (the 6-frame verifier flash). Default 0. */
  errorFlash?: number;
  /** Status the card is flipping AWAY from (a re-run: done -> running). Used with `flip`. */
  from?: StepStatus;
  /** 0..1 progress of the flip from `from` to `status`. Default 1 (no flip). */
  flip?: number;
  /** Hover (the cursor is over the card): border one step brighter. */
  hover?: boolean;
};

/** Frames of the verifier error flash. */
export const STEP_ERROR_FLASH_FRAMES = 6;
/** Frames of the done -> running flip. */
export const STEP_FLIP_FRAMES = 8;

const BODY_CHAR_W = 6.3; // Inter 12 px
const BODY_LINE_H = 16;

const wrap = (text: string | undefined, widthPx: number): number =>
  text ? Math.max(1, Math.ceil((text.length * BODY_CHAR_W) / widthPx)) : 0;

/** Height of the expanded body (0 if there is nothing to show). Used for the unfold and for scroll math. */
export const stepBodyHeight = (summary: string | undefined, note: string | undefined, cardWidth = 456): number => {
  const inner = cardWidth - 24 - 2;
  const lines = wrap(summary, inner) + wrap(note, inner);
  return lines === 0 ? 0 : 1 + 16 + lines * BODY_LINE_H + (summary && note ? 4 : 0);
};

/** Total height of a card for a given expand progress. */
export const stepCardHeight = (props: Pick<StepCardProps, 'summary' | 'note' | 'expand'>, cardWidth = 456): number =>
  PANEL.stepH + Math.round(stepBodyHeight(props.summary, props.note, cardWidth) * signatureEase(clamp01(props.expand ?? 0)));

const chromeOf = (status: StepStatus) => STEP_CARD[status];

const StatusText: React.FC<{status: StepStatus; ms?: number; frame: number}> = ({status, ms, frame}) => {
  const pulse = 0.5 + 0.5 * Math.sin((frame / FPS) * Math.PI * 2 * 1.1);
  const mono = {fontVariantNumeric: 'tabular-nums', whiteSpace: 'pre'} as const;
  switch (status) {
    case 'running':
      return <span style={{color: STATUS.running, opacity: 0.55 + 0.45 * pulse, ...mono}}>running</span>;
    case 'done':
      return (
        <span style={mono}>
          <span style={{color: STATUS.done}}>done</span>
          {ms !== undefined ? <span style={{color: NEUTRAL[500]}}>{` · ${Math.round(ms)}ms`}</span> : null}
        </span>
      );
    case 'error':
      return (
        <span style={mono}>
          <span style={{color: ROLE_ERROR_COLOR}}>error</span>
          {ms !== undefined ? <span style={{color: NEUTRAL[500]}}>{` · ${Math.round(ms)}ms`}</span> : null}
        </span>
      );
    case 'awaiting':
      return <span style={{color: STATUS.awaiting, opacity: 0.6 + 0.4 * pulse, ...mono}}>awaiting approval</span>;
    case 'pending':
      return <span style={{color: NEUTRAL[600], ...mono}}>pending</span>;
  }
};

/**
 * Step card. Collapsed height 34 (py8 + 16 + 2 border); row = chevron, role emoji, role name (500, role color),
 * tier text (10 px neutral-600), right aligned status text. Chrome (border + bg) per status from theme STEP_CARD.
 * Pure: the script sets status / expand / flip / errorFlash per frame.
 */
export const StepCard: React.FC<StepCardProps> = ({
  name,
  status,
  tier = 'adaptive',
  ms,
  frame = 0,
  appear = 1,
  expand = 0,
  summary,
  note,
  errorFlash = 0,
  from,
  flip = 1,
  hover = false,
}) => {
  const a = signatureEase(clamp01(appear));
  const e = signatureEase(clamp01(expand));
  const f = from !== undefined ? signatureEase(clamp01(flip)) : 1;
  const flash = clamp01(errorFlash);
  const prevStatus = from ?? status;

  const base = from !== undefined ? chromeOf(prevStatus) : chromeOf(status);
  const target = chromeOf(status);
  const err = STEP_CARD.error;
  let border = lerpColor(lerpColor(base.border, target.border, f), err.border, flash);
  const bg = lerpColor(lerpColor(base.bg, target.bg, f), err.bg, flash);
  const awaiting = (f >= 0.5 ? status : prevStatus) === 'awaiting';
  if (awaiting) {
    const pulse = 0.5 + 0.5 * Math.sin((frame / FPS) * Math.PI * 2 * 1.1);
    border = lerpColor(STEP_CARD.awaiting.border, '#eab308', 0.5 * pulse);
  } else if (hover) {
    border = lerpColor(border, NEUTRAL[600], 0.6);
  }

  const category = getRoleCategory(name);
  const isError = status === 'error';
  const nameColor = lerpColor(roleNameColor(name, {error: isError}), ROLE_ERROR_COLOR, flash);
  const bodyH = stepBodyHeight(summary, note);
  const bodyShown = Math.round(bodyH * e);

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '100%',
        flexShrink: 0,
        border: `1px ${awaiting ? 'dashed' : 'solid'} ${border}`,
        background: bg,
        borderRadius: 8,
        overflow: 'hidden',
        fontSize: 12,
        lineHeight: '16px',
        opacity: a,
        transform: `translateY(${8 * (1 - a)}px)`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', height: 32, boxSizing: 'border-box'}}>
        <ChevronRight
          size={12}
          strokeWidth={2}
          color={NEUTRAL[500]}
          style={{flexShrink: 0, transform: `rotate(${90 * e}deg)`}}
        />
        <Emoji emoji={category.icon} size={14} />
        <span style={{fontWeight: 500, color: nameColor, whiteSpace: 'nowrap'}}>{name}</span>
        <span style={{fontSize: 10, color: NEUTRAL[600], whiteSpace: 'nowrap'}}>{tierText(tier)}</span>
        <span style={{flex: 1}} />
        {from !== undefined && f < 1 ? (
          <span style={{display: 'grid', height: 16, overflow: 'hidden', justifyItems: 'end'}}>
            <span style={{gridArea: '1 / 1', opacity: 1 - f, transform: `translateY(${-16 * f}px)`}}>
              <StatusText status={prevStatus} ms={ms} frame={frame} />
            </span>
            <span style={{gridArea: '1 / 1', opacity: f, transform: `translateY(${16 * (1 - f)}px)`}}>
              <StatusText status={status} ms={ms} frame={frame} />
            </span>
          </span>
        ) : (
          <StatusText status={status} ms={ms} frame={frame} />
        )}
      </div>
      {bodyH > 0 ? (
        <div style={{height: bodyShown, overflow: 'hidden', opacity: clamp01(e * 1.4)}}>
          <div style={{borderTop: `1px solid ${NEUTRAL[800]}`, padding: '8px 12px', height: bodyH, boxSizing: 'border-box'}}>
            {summary ? <div style={{color: NEUTRAL[300]}}>{summary}</div> : null}
            {note ? <div style={{color: '#f59e0b', marginTop: summary ? 4 : 0}}>{note}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

/** Re-export so scripts can type the labels they put on cards. */
export {TIER_STEP_LABELS};
