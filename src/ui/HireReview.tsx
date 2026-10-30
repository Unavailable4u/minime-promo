import React from 'react';
import {HIRE_ROLES, UI_TEXT} from '../config/copy';
import {ACCENT, FONTS, NEUTRAL, STATUS} from '../config/theme';
import {lerpColor} from '../lib/color';
import {clamp01, ramp, signatureEase} from '../lib/ease';
import {getRoleCategory, roleNameColor} from '../lib/roleIcons';
import {Emoji} from './Emoji';
import type {Rect} from './shellLayout';

/** Frames between two rows of the reveal, and frames one row takes to settle. */
export const HIRE_ROW_STAGGER = 4;
export const HIRE_ROW_FRAMES = 10;
/** Frames from `reveal = 0` until the whole card (header, rows, buttons) has settled. */
export const HIRE_REVEAL_FRAMES = HIRE_ROW_STAGGER * (HIRE_ROLES.length + 1) + HIRE_ROW_FRAMES;

/** Card geometry (card-local px). The review card is 720 x 380 (FOCUS_RECTS.hiresCard); the mini-trace is 720 x 168. */
export const HIRE = {
  w: 720,
  h: 380,
  miniH: 168,
  pad: 16,
  headerH: 44,
  rowsTop: 50,
  rowH: 52,
  footerH: 64,
  editW: 64,
  approveW: 124,
  buttonH: 32,
  buttonGap: 8,
  miniRowH: 24,
} as const;

export type HireReviewProps = {
  /** Frames since the reveal started: header at 0, row i at 4 + 4i, buttons last. Default: finished. */
  reveal?: number;
  /** 0..1 collapse of the review into the mini-trace (rows shrink to compact step rows). Default 0. */
  collapse?: number;
  /** Cursor over "Edit" / "Approve & run". */
  hover?: {edit?: boolean; approve?: boolean};
  /** "Approve & run" press 0..1 (pressed in, then out). Default 0. */
  approvePress?: number;
  /** Statuses of the five mini-trace rows (collapsed view). Default all "pending". */
  miniStatus?: readonly ('pending' | 'running' | 'done')[];
  /** Frame local to the card (pulse of a running mini row). Default 0. */
  frame?: number;
  /**
   * Card width in px. Default 720 (the design width, panel closed). With the Working Panel open the message column
   * is only 672 px wide, so <ChatApp/> passes the column width and the card shrinks with it (rows ellipsize).
   */
  width?: number;
};

/** Card-local rectangles of the buttons (add the card's absolute position yourself). */
export const hireReviewLayout = (width: number = HIRE.w): {card: Rect; edit: Rect; approve: Rect; rows: Rect[]} => {
  const buttonY = HIRE.h - HIRE.footerH + (HIRE.footerH - HIRE.buttonH) / 2;
  const approve = {x: width - HIRE.pad - HIRE.approveW, y: buttonY, w: HIRE.approveW, h: HIRE.buttonH};
  const edit = {x: approve.x - HIRE.buttonGap - HIRE.editW, y: buttonY, w: HIRE.editW, h: HIRE.buttonH};
  const rows = HIRE_ROLES.map((_, i) => ({x: HIRE.pad, y: HIRE.rowsTop + i * HIRE.rowH, w: width - HIRE.pad * 2, h: HIRE.rowH}));
  return {card: {x: 0, y: 0, w: width, h: HIRE.h}, edit, approve, rows};
};

const appearOf = (reveal: number, index: number): {opacity: number; transform: string} => {
  const p = signatureEase(ramp(reveal, index * HIRE_ROW_STAGGER, index * HIRE_ROW_STAGGER + HIRE_ROW_FRAMES));
  return {opacity: p, transform: `translateY(${10 * (1 - p)}px)`};
};

/**
 * "Review staffed roles" card (not in the reference app; built in its visual language): neutral-900, 1 px
 * neutral-800, rounded 8. Header (title + subtitle), five role rows (emoji tile, role name in its role color,
 * purpose, token estimate), footer with "Edit" (ghost) and "Approve & run" (crimson). `collapse` morphs the card
 * into a compact mini-trace of five step rows for after the approval.
 */
export const HireReview: React.FC<HireReviewProps> = ({
  reveal = 999,
  collapse = 0,
  hover,
  approvePress = 0,
  miniStatus,
  frame = 0,
  width = HIRE.w,
}) => {
  const c = signatureEase(clamp01(collapse));
  const press = signatureEase(clamp01(approvePress));
  const layout = hireReviewLayout(width);
  const height = Math.round(HIRE.h + (HIRE.miniH - HIRE.h) * c);
  const approveBg = lerpColor(hover?.approve || press > 0 ? ACCENT.hover : ACCENT.base, ACCENT.active, press);

  return (
    <div
      style={{
        position: 'relative',
        boxSizing: 'border-box',
        width,
        height,
        background: NEUTRAL[900],
        border: `1px solid ${NEUTRAL[800]}`,
        borderRadius: 8,
        overflow: 'hidden',
        color: NEUTRAL[200],
      }}
    >
      {/* header */}
      <div style={{position: 'absolute', left: HIRE.pad, right: HIRE.pad, top: 14, ...appearOf(reveal, 0)}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 10}}>
          <div style={{fontFamily: FONTS.heading, fontSize: 14, lineHeight: '20px', fontWeight: 600, color: NEUTRAL[100]}}>
            {UI_TEXT.hireReviewTitle}
          </div>
          <div style={{fontSize: 12, lineHeight: '16px', color: NEUTRAL[500]}}>{UI_TEXT.hireReviewSubtitle}</div>
        </div>
      </div>

      {/* review rows (fade out while collapsing) */}
      <div style={{position: 'absolute', inset: 0, opacity: 1 - clamp01(c * 2.2), pointerEvents: 'none'}}>
        {HIRE_ROLES.map((role, i) => {
          const rect = layout.rows[i];
          const category = getRoleCategory(role.name);
          return (
            <div
              key={role.name}
              style={{
                position: 'absolute',
                left: rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderTop: i === 0 ? `1px solid ${NEUTRAL[800]}` : undefined,
                borderBottom: `1px solid ${NEUTRAL[800]}`,
                ...appearOf(reveal, i + 1),
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: NEUTRAL[800],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Emoji emoji={category.icon} size={16} />
              </div>
              <div style={{width: 140, flexShrink: 0, fontSize: 13, lineHeight: '18px', fontWeight: 500, color: roleNameColor(role.name)}}>
                {role.name}
              </div>
              <div style={{flex: 1, fontSize: 12, lineHeight: '16px', color: NEUTRAL[400], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                {role.purpose}
              </div>
              <div style={{fontSize: 11, lineHeight: '16px', color: NEUTRAL[600], fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>
                ~{role.tokens} tokens
              </div>
            </div>
          );
        })}

        {/* buttons */}
        <div style={{position: 'absolute', inset: 0, ...appearOf(reveal, HIRE_ROLES.length + 1)}}>
          <div
            style={{
              position: 'absolute',
              left: layout.edit.x,
              top: layout.edit.y,
              width: layout.edit.w,
              height: layout.edit.h,
              boxSizing: 'border-box',
              borderRadius: 6,
              border: `1px solid ${hover?.edit ? NEUTRAL[600] : NEUTRAL[700]}`,
              background: hover?.edit ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0)',
              color: hover?.edit ? NEUTRAL[100] : NEUTRAL[300],
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {UI_TEXT.hireEdit}
          </div>
          <div
            style={{
              position: 'absolute',
              left: layout.approve.x,
              top: layout.approve.y,
              width: layout.approve.w,
              height: layout.approve.h,
              boxSizing: 'border-box',
              borderRadius: 6,
              background: approveBg,
              color: ACCENT.text,
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${1 - 0.04 * press})`,
              whiteSpace: 'nowrap',
            }}
          >
            {UI_TEXT.hireApprove}
          </div>
        </div>
      </div>

      {/* mini-trace rows (fade in while collapsing) */}
      <div style={{position: 'absolute', inset: 0, opacity: clamp01((c - 0.35) / 0.65), pointerEvents: 'none'}}>
        {HIRE_ROLES.map((role, i) => {
          const status = miniStatus?.[i] ?? 'pending';
          const category = getRoleCategory(role.name);
          const pulse = 0.5 + 0.5 * Math.sin((frame / 30) * Math.PI * 2 * 1.1);
          const dot = status === 'done' ? STATUS.done : status === 'running' ? STATUS.running : STATUS.pending;
          return (
            <div
              key={role.name}
              style={{
                position: 'absolute',
                left: HIRE.pad,
                right: HIRE.pad,
                top: 40 + i * HIRE.miniRowH,
                height: HIRE.miniRowH,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                lineHeight: '16px',
              }}
            >
              <div style={{width: 6, height: 6, borderRadius: 3, background: dot, opacity: status === 'running' ? 0.55 + 0.45 * pulse : 1}} />
              <Emoji emoji={category.icon} size={14} />
              <span style={{fontWeight: 500, color: roleNameColor(role.name)}}>{role.name}</span>
              <span style={{flex: 1}} />
              <span style={{color: status === 'done' ? STATUS.done : status === 'running' ? STATUS.running : NEUTRAL[600]}}>{status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
