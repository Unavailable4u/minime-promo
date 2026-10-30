import React from 'react';
import {ClipboardCheck} from 'lucide-react';
import {UI_TEXT} from '../config/copy';
import {FONTS, NEUTRAL} from '../config/theme';
import {lerpColor} from '../lib/color';
import {clamp01} from '../lib/ease';
import {Composer, type ComposerProps} from './Composer';
import {MiniMeLogo} from './MiniMeLogo';
import {SHELL} from './shellLayout';

export type ChatBoxProps = {
  /** "Review hires" toggle 0..1 (0 = off, 1 = on). Colors blend between the two states. Default 0. */
  reviewHires?: number;
  /** Mouse over the toggle. */
  reviewHover?: boolean;
  /** Toggle being pressed. */
  reviewPressed?: boolean;
  /**
   * Auto-scroll: the message column is shifted UP by this many px (translateY(-scrollY)).
   * The parent animates it with a spring and keeps the newest text about 120 px above the composer.
   */
  scrollY?: number;
  /** Show the quiet empty state (a faint mark in the middle of the list). Default false. */
  emptyState?: boolean;
  /** Composer props (draft, mode, menu, send state, chips...). */
  composer: ComposerProps;
  /** Message rows: <UserMessage/>, <AssistantMessage/>, the HireReview card... Each row brings its own pb 16. */
  children?: React.ReactNode;
};

/**
 * Chat Box: 40 px header ("Chat Box" + Review hires toggle), the message list (px 16, py 24, rows pb 16) and
 * the composer pinned to the bottom. Its width is whatever the AppWindow leaves (1184 px with the Working
 * Panel closed, 704 px with it fully open), so it reflows without any prop of its own.
 */
export const ChatBox: React.FC<ChatBoxProps> = ({
  reviewHires = 0,
  reviewHover = false,
  reviewPressed = false,
  scrollY = 0,
  emptyState = false,
  composer,
  children,
}) => {
  const on = clamp01(reviewHires);
  const offBorder = reviewHover || reviewPressed ? NEUTRAL[600] : NEUTRAL[800];

  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column', position: 'relative'}}>
      {/* header */}
      <div
        style={{
          height: SHELL.paneHeaderH,
          flexShrink: 0,
          boxSizing: 'border-box',
          padding: '0 16px',
          borderBottom: `1px solid ${NEUTRAL[800]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{fontSize: 12, lineHeight: '16px', fontWeight: 500, color: NEUTRAL[400]}}>
          {UI_TEXT.chatBoxTitle}
        </div>
        <div
          style={{
            width: SHELL.reviewW,
            height: SHELL.reviewH,
            boxSizing: 'border-box',
            borderRadius: 6,
            border: `1px solid ${lerpColor(offBorder, NEUTRAL[500], on)}`,
            background: lerpColor('rgba(38, 38, 38, 0)', 'rgba(38, 38, 38, 0.7)', on),
            color: lerpColor(NEUTRAL[500], NEUTRAL[200], on),
            fontFamily: FONTS.heading,
            fontSize: 12,
            lineHeight: '16px',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            transform: reviewPressed ? 'translateY(1px)' : undefined,
            filter: reviewPressed ? 'brightness(0.94)' : undefined,
          }}
        >
          <ClipboardCheck size={12} color={lerpColor(NEUTRAL[500], NEUTRAL[200], on)} />
          <span>{UI_TEXT.reviewHires}</span>
        </div>
      </div>

      {/* message list */}
      <div style={{flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden'}}>
        {emptyState ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.06,
            }}
          >
            <MiniMeLogo progress={1} fill={1} size={120} />
          </div>
        ) : null}
        <div data-chat-column style={{padding: '24px 16px', transform: `translateY(${-scrollY}px)`}}>
          {children}
        </div>
      </div>

      <Composer {...composer} />
    </div>
  );
};