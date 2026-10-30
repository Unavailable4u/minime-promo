import React from 'react';
import {Check, Copy} from 'lucide-react';
import {FONTS, NEUTRAL} from '../config/theme';
import {TOKEN_TYPE_COLOR, tokenizeLines} from '../lib/tokenize';

/** Layout numbers shared with the Markdown height estimate. */
export const CODE_BLOCK = {
  headerH: 28,
  padY: 10,
  padX: 12,
  lineH: 20,
  fontSize: 12.5,
  border: 1,
} as const;

export type CodeBlockProps = {
  /** The (possibly partial) code. Partial input is fine: the tokenizer is tolerant. */
  code: string;
  /** Language label shown in the header, for example "js". Empty = no label. */
  lang?: string;
  /** Draw this node (the streaming caret) right after the last character. */
  trailing?: React.ReactNode;
  /** Header Copy button: false = Copy icon, true = green check + "Copied". */
  copied?: boolean;
};

/** Pixel height of a code block with `lines` lines of code (header included). */
export const codeBlockHeight = (lines: number): number =>
  CODE_BLOCK.headerH + CODE_BLOCK.padY * 2 + Math.max(1, lines) * CODE_BLOCK.lineH + CODE_BLOCK.border * 2;

/**
 * Fenced code block, VS Code Dark+ colors. bg #0a0a0a, 1 px #262626, rounded 6, header strip with the language label
 * and a Copy button, then the code in JetBrains Mono 12.5 / 20 px. Long lines clip (no wrapping, no scrollbar).
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({code, lang = '', trailing, copied = false}) => {
  const lines = tokenizeLines(code);
  const lastLine = lines.length - 1;
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '100%',
        background: NEUTRAL[950],
        border: `${CODE_BLOCK.border}px solid ${NEUTRAL[800]}`,
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: CODE_BLOCK.headerH,
          boxSizing: 'border-box',
          padding: '0 10px 0 12px',
          borderBottom: `1px solid ${NEUTRAL[800]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: FONTS.mono,
          fontSize: 11,
          lineHeight: '16px',
          color: NEUTRAL[500],
        }}
      >
        <span>{lang}</span>
        <span style={{display: 'flex', alignItems: 'center', gap: 4, color: copied ? '#4ade80' : NEUTRAL[500]}}>
          {copied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={2} />}
          {copied ? <span>Copied</span> : null}
        </span>
      </div>
      <div
        style={{
          padding: `${CODE_BLOCK.padY}px ${CODE_BLOCK.padX}px`,
          fontFamily: FONTS.mono,
          fontSize: CODE_BLOCK.fontSize,
          lineHeight: `${CODE_BLOCK.lineH}px`,
          color: NEUTRAL[300],
          whiteSpace: 'pre',
          fontVariantLigatures: 'none', // keep "=>" as two characters
        }}
      >
        {lines.map((line, index) => (
          <div key={index} style={{minHeight: CODE_BLOCK.lineH, whiteSpace: 'pre'}}>
            {line.map((token, tokenIndex) => (
              <span key={tokenIndex} style={{color: TOKEN_TYPE_COLOR[token.type]}}>
                {token.text}
              </span>
            ))}
            {index === lastLine ? trailing : null}
          </div>
        ))}
      </div>
    </div>
  );
};
