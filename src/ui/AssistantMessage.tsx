import React from 'react';
import {TIER_LABELS, UI_TEXT} from '../config/copy';
import {META_COLORS, NEUTRAL, TIER_COLORS} from '../config/theme';
import {FPS} from '../config/timeline';
import {lerpColor, withAlpha} from '../lib/color';
import {clamp01, signatureEase} from '../lib/ease';
import {AssistantAvatar} from './AssistantAvatar';

export const ASSISTANT_AVATAR_SIZE = 26;

/**
 * What the meta row (first line of the bubble) says.
 *  - routing: neutral "routing…" while the Inspector is still classifying.
 *  - tier: "● Tier N · Label" in the tier color, optional "· ok" and "· elapsed".
 *      `morph` (0..1) cross-masks "routing…" into the tier label and blends the dot from neutral to the tier color
 *      (the Tier 3 reveal). Leave it undefined for a plain, already-decided tier.
 *  - paused: amber-300 "Paused".
 *  - error: red-400 "Error".
 * `elapsed` is a ready-made string ("1.2s", "41s"); the script (patch 07) owns the counting.
 */
export type AssistantMeta =
  | {kind: 'routing'}
  | {kind: 'tier'; tier: 0 | 1 | 2 | 3; ok?: boolean; elapsed?: string; morph?: number}
  | {kind: 'paused'; elapsed?: string}
  | {kind: 'error'; elapsed?: string};

export type AssistantMessageProps = {
  /** Frame local to the message. Only used by the thinking avatar and the caret pulse. Default 0. */
  frame?: number;
  /**
   * Entrance progress 0..1 (linear; eased inside): slides up 14 px and fades in. The film drives it over 8 frames.
   * Default 1.
   */
  progress?: number;
  /**
   * "message" (default): avatar + bubble with a meta row and a body.
   * "working": avatar + dim "Working… · 3s" text, no bubble (the in-flight state before any text exists).
   */
  view?: 'message' | 'working';
  /** "static" = solid crimson mark, "thinking" = looping pen-draw. Default: "thinking" for view="working", else "static". */
  avatar?: 'static' | 'thinking';
  /** Meta row content (message view). Omit to draw no meta row. */
  meta?: AssistantMeta;
  /** 0..1 crimson-free bloom behind the tier badge (uses the tier color). Used for the Tier 3 reveal. */
  badgeGlow?: number;
  /** Elapsed text of the working view, for example "3s". */
  workingElapsed?: string;
  /** Show the 6x16 pulsing streaming caret after the body. Markdown (patch 04) may draw its own and pass false. */
  caret?: boolean;
  /** Maximum bubble width as a percentage of the row. Default 80. */
  maxWidthPct?: number;
  /** The body. Markdown arrives in patch 04; until then any ReactNode. */
  children?: React.ReactNode;
};

const Dot: React.FC<{color: string; glow: number}> = ({color, glow}) => (
  <div
    style={{
      width: 6,
      height: 6,
      borderRadius: 3,
      background: color,
      flexShrink: 0,
      boxShadow: glow > 0 ? `0 0 ${6 + 10 * glow}px ${2 * glow}px ${withAlpha(color, 0.75 * glow)}` : undefined,
    }}
  />
);

/** Tier label, optionally cross-masking from "routing…" (morph 0) to the tier label (morph 1). */
const TierLabel: React.FC<{tier: 0 | 1 | 2 | 3; morph: number | undefined}> = ({tier, morph}) => {
  const color = TIER_COLORS[tier];
  const m = morph === undefined ? 1 : signatureEase(clamp01(morph));
  if (m >= 1) {
    return <span style={{color}}>{TIER_LABELS[tier]}</span>;
  }
  return (
    <span style={{display: 'grid', height: 16, overflow: 'hidden'}}>
      <span
        style={{
          gridArea: '1 / 1',
          color: META_COLORS.routing,
          opacity: 1 - m,
          transform: `translateY(${-16 * m}px)`,
          whiteSpace: 'nowrap',
        }}
      >
        {UI_TEXT.routing}
      </span>
      <span
        style={{
          gridArea: '1 / 1',
          color,
          opacity: m,
          transform: `translateY(${16 * (1 - m)}px)`,
          whiteSpace: 'nowrap',
        }}
      >
        {TIER_LABELS[tier]}
      </span>
    </span>
  );
};

const Tail: React.FC<{ok?: boolean; elapsed?: string}> = ({ok, elapsed}) => (
  <>
    {ok ? <span style={{color: META_COLORS.separator, fontWeight: 400, whiteSpace: 'pre'}}>{` · ${UI_TEXT.ok}`}</span> : null}
    {elapsed ? (
      <span
        style={{
          color: META_COLORS.separator,
          fontWeight: 400,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'pre',
        }}
      >
        {` · ${elapsed}`}
      </span>
    ) : null}
  </>
);

const MetaRow: React.FC<{meta: AssistantMeta; glow: number}> = ({meta, glow}) => {
  const g = clamp01(glow);
  let dotColor: string = META_COLORS.routingDot;
  let label: React.ReactNode = null;
  let tail: React.ReactNode = null;
  let glowColor: string | null = null;

  switch (meta.kind) {
    case 'routing': {
      dotColor = META_COLORS.routingDot;
      label = <span style={{color: META_COLORS.routing}}>{UI_TEXT.routing}</span>;
      break;
    }
    case 'tier': {
      const m = meta.morph === undefined ? 1 : signatureEase(clamp01(meta.morph));
      dotColor = lerpColor(META_COLORS.routingDot, TIER_COLORS[meta.tier], m);
      label = <TierLabel tier={meta.tier} morph={meta.morph} />;
      tail = <Tail ok={meta.ok} elapsed={meta.elapsed} />;
      glowColor = TIER_COLORS[meta.tier];
      break;
    }
    case 'paused': {
      dotColor = META_COLORS.paused;
      label = <span style={{color: META_COLORS.paused}}>{UI_TEXT.paused}</span>;
      tail = <Tail elapsed={meta.elapsed} />;
      break;
    }
    case 'error': {
      dotColor = META_COLORS.error;
      label = <span style={{color: META_COLORS.error}}>{UI_TEXT.error}</span>;
      tail = <Tail elapsed={meta.elapsed} />;
      break;
    }
  }

  return (
    <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 6, height: 16}}>
      {glowColor !== null && g > 0 ? (
        <div
          style={{
            // 340x60 box with an explicitly sized ellipse (130 x 26 px) so the bloom fades to 0 before the box
            // edges and never shows a hard top / bottom edge.
            position: 'absolute',
            left: -30,
            top: -22,
            width: 340,
            height: 60,
            background: `radial-gradient(ellipse 130px 26px at 110px 30px, ${withAlpha(glowColor, 0.3 * g)} 0%, ${withAlpha(glowColor, 0)} 100%)`,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <Dot color={dotColor} glow={glowColor !== null ? g : 0} />
      <div style={{position: 'relative', display: 'flex', alignItems: 'center', fontSize: 12, lineHeight: '16px', fontWeight: 500}}>
        {label}
        {tail}
      </div>
    </div>
  );
};

/** 6x16 streaming caret. The pulse is a pure function of the frame (about 1.25 Hz). */
const Caret: React.FC<{frame: number}> = ({frame}) => {
  const pulse = 0.5 + 0.5 * Math.sin((frame / FPS) * Math.PI * 2 * 1.25);
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 16,
        marginLeft: 2,
        verticalAlign: '-3px',
        background: NEUTRAL[400],
        opacity: 0.35 + 0.65 * pulse,
      }}
    />
  );
};

/**
 * Assistant message: [avatar 26 px, mt 2] gap 8 [bubble]. Bubble = bg #171717, 1 px #262626, rounded 8, px12 py8,
 * 14 px / 1.625, children spaced 8 px, meta row first. The row carries its own pb 16.
 */
export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  frame = 0,
  progress = 1,
  view = 'message',
  avatar,
  meta,
  badgeGlow = 0,
  workingElapsed,
  caret = false,
  maxWidthPct = 80,
  children,
}) => {
  const p = signatureEase(clamp01(progress));
  const avatarMode = avatar ?? (view === 'working' ? 'thinking' : 'static');
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: view === 'working' ? 'center' : 'flex-start',
    gap: 8,
    paddingBottom: 16,
    opacity: p,
    transform: `translateY(${14 * (1 - p)}px)`,
  };

  if (view === 'working') {
    return (
      <div style={rowStyle}>
        <AssistantAvatar mode={avatarMode} frame={frame} size={ASSISTANT_AVATAR_SIZE} />
        <div style={{fontSize: 14, lineHeight: '20px', color: NEUTRAL[500]}}>
          {UI_TEXT.working}
          {workingElapsed ? (
            <span style={{color: META_COLORS.separator, fontVariantNumeric: 'tabular-nums', whiteSpace: 'pre'}}>
              {` · ${workingElapsed}`}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <AssistantAvatar mode={avatarMode} frame={frame} size={ASSISTANT_AVATAR_SIZE} style={{marginTop: 2}} />
      <div
        style={{
          maxWidth: `${maxWidthPct}%`,
          minWidth: 0,
          boxSizing: 'border-box',
          background: NEUTRAL[900],
          border: `1px solid ${NEUTRAL[800]}`,
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 14,
          lineHeight: 1.625,
          color: NEUTRAL[200],
          overflowWrap: 'anywhere',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {meta ? <MetaRow meta={meta} glow={badgeGlow} /> : null}
        {children !== undefined && children !== null ? (
          <div>
            {children}
            {caret ? <Caret frame={frame} /> : null}
          </div>
        ) : caret ? (
          <div>
            <Caret frame={frame} />
          </div>
        ) : null}
      </div>
    </div>
  );
};
