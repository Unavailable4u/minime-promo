import React from 'react';
import {ChevronDown, FileText, Paperclip, Pause, Play} from 'lucide-react';
import {MODE_OPTIONS, UI_TEXT, type ModeId} from '../config/copy';
import {ACCENT, FONTS, NEUTRAL, STATUS} from '../config/theme';
import {lerpColor, withAlpha} from '../lib/color';
import {clamp01, mapRange, signatureEase} from '../lib/ease';
import {ModeIcon, ModeMenu} from './ModeMenu';
import {SHELL, textareaHeight} from './shellLayout';

export type ComposerTarget = 'attach' | 'mode' | 'textarea' | 'send';
export type SendState = 'send' | 'pause' | 'resume';

export type ComposerAttachment = {
  id: string;
  name: string;
  /** 0..1 chip entrance (slides up and fades in, and the chip row grows to make room). */
  appear: number;
  /** 0..1 upload progress: below 1 the chip shows a spinner, at 1 it shows a drawn-on check. */
  done: number;
};

export type ComposerProps = {
  /** Local or global frame, only used to rotate the attachment spinner. */
  frame: number;
  /** The text typed so far. Empty = placeholder. */
  draft: string;
  /** Number of text lines the draft occupies (the film's prompts fit on one line). Default 1. */
  draftLines?: number;
  /** Caret blink state (use caretVisible() from typing.ts in patch 04). Default false. */
  caretVisible?: boolean;
  /** Textarea focus ring 0..1 (border -> #525252 plus the 1 px white ring). Default 0. */
  focus?: number;
  /** Selected mode. */
  mode: ModeId;
  /** Open dropdown: `openProgress` drives the menu AND rotates the chevron. null/undefined = closed. */
  menu?: {openProgress: number; hoveredIndex?: number | null} | null;
  /** Send button content. Default 'send'. */
  sendState?: SendState;
  /**
   * 0..1 enabled amount of the Send button (opacity 40% -> 100%). Default: 1 if there is draft text, else 0.
   * Pause and Resume are always fully enabled.
   */
  sendEnable?: number;
  /** Control under the mouse (hover border / brighter send). */
  hover?: ComposerTarget | null;
  /** Control being pressed (translateY 1 px, brightness -6%). */
  pressed?: ComposerTarget | null;
  /** Chips above the controls (file attachments). */
  attachments?: ComposerAttachment[];
  placeholder?: string;
};

const pressStyle = (pressed: boolean): React.CSSProperties => ({
  transform: pressed ? 'translateY(1px)' : undefined,
  filter: pressed ? 'brightness(0.94)' : undefined,
});

/** The spinner: a 270 degree arc turning 12 degrees per frame. Pure function of the frame. */
const Spinner: React.FC<{frame: number; size: number}> = ({frame, size}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{display: 'block'}}>
    <circle cx="8" cy="8" r="6" fill="none" stroke={NEUTRAL[700]} strokeWidth="2" />
    <circle
      cx="8"
      cy="8"
      r="6"
      fill="none"
      stroke={NEUTRAL[300]}
      strokeWidth="2"
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray="0.28 0.72"
      transform={`rotate(${(frame * 12) % 360} 8 8)`}
    />
  </svg>
);

/** The check mark, pen-drawn with `progress` 0..1 (inline SVG, never a text glyph). */
const DrawnCheck: React.FC<{progress: number; size: number}> = ({progress, size}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{display: 'block'}}>
    <path
      d="M3.5 8.5 L6.75 11.5 L12.5 4.75"
      fill="none"
      stroke={STATUS.done}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - clamp01(progress)}
    />
  </svg>
);

/**
 * Composer (bottom of the Chat Box): hairline top border, p-4, controls bottom-aligned in one row:
 *   [attach] [mode picker] [textarea .......................] [send]
 * with an optional chip row (file attachments) above them. Heights/widths are fixed (see shellLayout.ts)
 * so cursor targets never move.
 */
export const Composer: React.FC<ComposerProps> = ({
  frame,
  draft,
  draftLines = 1,
  caretVisible = false,
  focus = 0,
  mode,
  menu = null,
  sendState = 'send',
  sendEnable,
  hover = null,
  pressed = null,
  attachments = [],
  placeholder = UI_TEXT.composerPlaceholder,
}) => {
  const focusAmount = clamp01(focus);
  const rowH = textareaHeight(draftLines);
  const rowReveal = attachments.reduce((max, a) => Math.max(max, clamp01(a.appear)), 0);
  const chipRowH = SHELL.attachRowH * signatureEase(rowReveal);

  const modeOption = MODE_OPTIONS.find((o) => o.id === mode) ?? MODE_OPTIONS[0];
  const menuOpen = menu ? signatureEase(clamp01(menu.openProgress)) : 0;

  const enabled = sendState !== 'send' ? 1 : clamp01(sendEnable ?? (draft.length > 0 ? 1 : 0));
  const sendOpacity = mapRange(enabled, 0, 1, 0.4, 1);

  const neutralButton = (target: ComposerTarget, extra: React.CSSProperties): React.CSSProperties => ({
    height: SHELL.controlH,
    boxSizing: 'border-box',
    background: NEUTRAL[900],
    border: `1px solid ${hover === target || pressed === target ? NEUTRAL[600] : NEUTRAL[800]}`,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    ...pressStyle(pressed === target),
    ...extra,
  });

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 5,
        boxSizing: 'border-box',
        borderTop: `1px solid ${NEUTRAL[800]}`,
        padding: SHELL.pad,
        background: 'transparent',
      }}
    >
      {/* attachment chips */}
      <div style={{height: chipRowH, overflow: 'hidden'}}>
        <div style={{display: 'flex', gap: 6, paddingBottom: SHELL.gap}}>
          {attachments.map((a) => {
            const p = signatureEase(clamp01(a.appear));
            const done = clamp01(a.done);
            return (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 22,
                  boxSizing: 'border-box',
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: `1px solid ${NEUTRAL[700]}`,
                  background: NEUTRAL[900],
                  fontSize: 11,
                  lineHeight: '16px',
                  color: NEUTRAL[300],
                  opacity: p,
                  transform: `translateY(${8 * (1 - p)}px)`,
                }}
              >
                <FileText size={11} color={NEUTRAL[400]} />
                <span>{a.name}</span>
                <div style={{position: 'relative', width: 11, height: 11}}>
                  <div style={{position: 'absolute', inset: 0, opacity: 1 - done}}>
                    <Spinner frame={frame} size={11} />
                  </div>
                  <div style={{position: 'absolute', inset: 0, opacity: done > 0 ? 1 : 0}}>
                    <DrawnCheck progress={done} size={11} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* controls row */}
      <div style={{display: 'flex', alignItems: 'flex-end', gap: SHELL.gap, height: rowH}}>
        {/* attach */}
        <div style={neutralButton('attach', {width: SHELL.attachW, justifyContent: 'center'})}>
          <Paperclip size={15} color={NEUTRAL[400]} />
        </div>

        {/* mode picker (+ upward menu) */}
        <div style={{position: 'relative', width: SHELL.modeW, height: SHELL.controlH, flexShrink: 0}}>
          <div
            style={{
              ...neutralButton('mode', {width: SHELL.modeW, padding: '0 12px', gap: 8}),
              fontFamily: FONTS.heading,
              letterSpacing: '0.02em',
              fontSize: 14,
              lineHeight: '20px',
              color: NEUTRAL[200],
            }}
          >
            <ModeIcon name={modeOption.icon} size={14} color={NEUTRAL[300]} />
            <span style={{flex: 1}}>{modeOption.label}</span>
            <ChevronDown
              size={13}
              color={NEUTRAL[400]}
              style={{transform: `rotate(${180 * menuOpen}deg)`, flexShrink: 0}}
            />
          </div>
          {menu ? <ModeMenu openProgress={menu.openProgress} hoveredIndex={menu.hoveredIndex} selected={mode} /> : null}
        </div>

        {/* textarea */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            height: rowH,
            boxSizing: 'border-box',
            background: NEUTRAL[900],
            padding: '8px 12px',
            borderRadius: 8,
            border: `1px solid ${
              focusAmount > 0
                ? lerpColor(NEUTRAL[800], NEUTRAL[600], focusAmount)
                : hover === 'textarea'
                  ? NEUTRAL[700]
                  : NEUTRAL[800]
            }`,
            boxShadow: focusAmount > 0 ? `0 0 0 1px ${withAlpha('#ffffff', 0.08 * focusAmount)}` : undefined,
            overflow: 'hidden',
            fontSize: 14,
            lineHeight: `${SHELL.textareaLine}px`,
            ...pressStyle(pressed === 'textarea'),
          }}
        >
          {draft.length === 0 ? (
            <span style={{color: NEUTRAL[500], whiteSpace: 'pre-wrap'}}>{placeholder}</span>
          ) : (
            <span style={{color: NEUTRAL[100], whiteSpace: 'pre-wrap'}}>{draft}</span>
          )}
          {focusAmount > 0 && caretVisible ? (
            <span
              style={{
                display: 'inline-block',
                width: 1.5,
                height: 18,
                marginLeft: 1,
                background: NEUTRAL[100],
                verticalAlign: '-4px',
                position: draft.length === 0 ? 'absolute' : 'static',
                left: draft.length === 0 ? 12 : undefined,
                top: draft.length === 0 ? 10 : undefined,
              }}
            />
          ) : null}
        </div>

        {/* send / pause / resume */}
        <div
          style={{
            width: SHELL.sendW,
            height: SHELL.controlH,
            boxSizing: 'border-box',
            flexShrink: 0,
            borderRadius: 8,
            background:
              pressed === 'send' ? ACCENT.active : hover === 'send' && enabled > 0.5 ? ACCENT.hover : ACCENT.base,
            color: ACCENT.text,
            fontFamily: FONTS.heading,
            fontWeight: 600,
            fontSize: 14,
            lineHeight: '20px',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            opacity: sendOpacity,
            ...pressStyle(pressed === 'send'),
          }}
        >
          {sendState === 'pause' ? <Pause size={14} fill="#ffffff" color="#ffffff" /> : null}
          {sendState === 'resume' ? <Play size={14} fill="#ffffff" color="#ffffff" /> : null}
          <span>
            {sendState === 'send' ? UI_TEXT.send : sendState === 'pause' ? UI_TEXT.pause : UI_TEXT.resume}
          </span>
        </div>
      </div>
    </div>
  );
};