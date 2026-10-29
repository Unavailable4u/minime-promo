import React from 'react';
import {FileCode2} from 'lucide-react';
import {NEUTRAL} from '../config/theme';
import {clamp01, signatureEase} from '../lib/ease';

export type UserMessageProps = {
  /** The message text (pre-wrap, so \n is respected). */
  text: string;
  /**
   * Entrance progress 0..1 (linear; eased inside): slides up 14 px and fades in. The film drives it over 8 frames.
   * Default 1 (fully shown).
   */
  progress?: number;
  /** Attachment / code-reference chips drawn above the bubble. */
  chips?: string[];
  /** Maximum bubble width as a percentage of the message column. Default 80. */
  maxWidthPct?: number;
};

/**
 * User message: right-aligned, bubble bg #262626, rounded 8, px12 py8, 14 px / 1.625.
 * The row carries its own pb 16 (the list's row gap).
 */
export const UserMessage: React.FC<UserMessageProps> = ({text, progress = 1, chips = [], maxWidthPct = 80}) => {
  const p = signatureEase(clamp01(progress));
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        paddingBottom: 16,
        opacity: p,
        transform: `translateY(${14 * (1 - p)}px)`,
      }}
    >
      <div
        style={{
          maxWidth: `${maxWidthPct}%`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
          minWidth: 0,
        }}
      >
        {chips.length > 0 ? (
          <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6}}>
            {chips.map((chip) => (
              <div
                key={chip}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: `1px solid ${NEUTRAL[700]}`,
                  background: NEUTRAL[900],
                  fontSize: 10,
                  lineHeight: '16px',
                  color: NEUTRAL[400],
                }}
              >
                <FileCode2 size={10} color={NEUTRAL[400]} />
                <span>{chip}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div
          style={{
            background: NEUTRAL[800],
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 14,
            lineHeight: 1.625,
            color: NEUTRAL[100],
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};
