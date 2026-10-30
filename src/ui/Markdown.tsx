import React from 'react';
import {FONTS, NEUTRAL, TIER_COLORS, TOKEN_COLORS} from '../config/theme';
import {withAlpha} from '../lib/color';
import {Caret} from './AssistantMessage';
import {CodeBlock, codeBlockHeight} from './CodeBlock';

/**
 * Small, partial-input-safe Markdown renderer for the streamed answers.
 *
 * Supported: # ## ### headings, paragraphs, **bold**, *italic*, `inline code`, [links](url), ordered and bullet
 * lists (two space indent = nested), > quotes, --- rules, | pipe | tables | (with :---: alignment) and ``` fenced
 * code blocks. Anything else is shown as plain text.
 *
 * It is written for text that GROWS one burst at a time (stream.ts): every prefix of a valid document parses
 * without throwing and without flashing raw markers. A dangling `**`, `*`, backtick or `[` styles the rest of the
 * line, an unterminated fence streams as a code block, a table header with no separator yet is already a table.
 *
 * Pure: the output depends only on `text` (and `frame` for the caret pulse).
 */

// ------------------------------------------------------------------ types
export type MdAlign = 'left' | 'center' | 'right';
export type MdListItem = {text: string; level: number; marker: string};
export type MdBlock =
  | {type: 'heading'; level: 1 | 2 | 3; text: string}
  | {type: 'paragraph'; text: string}
  | {type: 'list'; ordered: boolean; items: MdListItem[]}
  | {type: 'code'; lang: string; code: string}
  | {type: 'table'; header: string[]; align: MdAlign[]; rows: string[][]}
  | {type: 'quote'; text: string}
  | {type: 'hr'};

// ------------------------------------------------------------------ block parser
const FENCE = /^\s*```\s*([\w+-]*)\s*$/;
const HEADING = /^(#{1,3})\s+(.*)$/;
const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const HR = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
const TABLE_ROW = /^\s*\|/;
const TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-*:?\s*)*\|?\s*$/;
/** A last line that is only the start of a marker ("#", "``", "-", ">", "1.") would flash as text: skip it. */
const DANGLING_MARKER = /^\s*(#{1,3}|`{1,2}|-{1,2}|\*|>|\d+\.?)$/;

const splitRow = (line: string): string[] => {
  let t = line.trim();
  if (t.startsWith('|')) {
    t = t.slice(1);
  }
  if (t.endsWith('|')) {
    t = t.slice(0, -1);
  }
  return t.split('|').map((cell) => cell.trim());
};

const alignOf = (cell: string): MdAlign => {
  const c = cell.trim();
  const left = c.startsWith(':');
  const right = c.endsWith(':');
  return left && right ? 'center' : right ? 'right' : 'left';
};

const startsBlock = (line: string): boolean =>
  FENCE.test(line) || HEADING.test(line) || LIST_ITEM.test(line) || QUOTE.test(line) || HR.test(line) || TABLE_ROW.test(line);

/** Parse markdown (possibly cut off anywhere) into blocks. Never throws. */
export const parseMarkdown = (text: string): MdBlock[] => {
  const lines = text.replace(/\r/g, '').split('\n');
  const lastLine = lines.length - 1;
  if (lastLine >= 0 && DANGLING_MARKER.test(lines[lastLine])) {
    lines.pop(); // a half-typed marker
  }

  const blocks: MdBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      i++; // closing fence (or past the end while streaming)
      blocks.push({type: 'code', lang: fence[1], code: body.join('\n')});
      continue;
    }

    if (HR.test(line)) {
      blocks.push({type: 'hr'});
      i++;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({type: 'heading', level: heading[1].length as 1 | 2 | 3, text: heading[2]});
      i++;
      continue;
    }

    if (TABLE_ROW.test(line)) {
      const header = splitRow(line);
      const next = i + 1 < lines.length ? lines[i + 1] : null;
      // header alone at the very end of the text counts as "table in progress"; otherwise a separator is required
      const nextIsLast = i + 1 === lines.length - 1;
      if (next === null || TABLE_SEP.test(next) || (nextIsLast && /^\s*\|[\s:|-]*$/.test(next))) {
        const align = next !== null ? splitRow(next).map(alignOf) : [];
        while (align.length < header.length) {
          align.push('left');
        }
        const rows: string[][] = [];
        i += next === null ? 1 : 2;
        while (i < lines.length && TABLE_ROW.test(lines[i])) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        blocks.push({type: 'table', header, align, rows});
        continue;
      }
    }

    if (QUOTE.test(line)) {
      const parts: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        parts.push((QUOTE.exec(lines[i]) as RegExpExecArray)[1]);
        i++;
      }
      blocks.push({type: 'quote', text: parts.join(' ')});
      continue;
    }

    if (LIST_ITEM.test(line)) {
      const items: MdListItem[] = [];
      const ordered = /^\s*\d/.test(line);
      while (i < lines.length) {
        const m = LIST_ITEM.exec(lines[i]);
        if (m) {
          items.push({text: m[3], level: Math.min(2, Math.floor(m[1].replace(/\t/g, '  ').length / 2)), marker: m[2]});
          i++;
        } else if (lines[i].trim() !== '' && /^\s{2,}\S/.test(lines[i]) && items.length > 0 && !startsBlock(lines[i])) {
          items[items.length - 1].text += ' ' + lines[i].trim(); // wrapped continuation
          i++;
        } else {
          break;
        }
      }
      blocks.push({type: 'list', ordered, items});
      continue;
    }

    // paragraph: runs until a blank line or the start of another block
    const parts: string[] = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !startsBlock(lines[i])) {
      parts.push(lines[i].trim());
      i++;
    }
    blocks.push({type: 'paragraph', text: parts.join(' ')});
  }
  return blocks;
};

// ------------------------------------------------------------------ inline parser
export type MdInline =
  | {type: 'text'; text: string}
  | {type: 'bold' | 'italic' | 'link'; children: MdInline[]; href?: string}
  | {type: 'code'; text: string};

/** Parse inline markup. An unterminated opener (when text follows it) styles the rest of the string. */
export const parseInline = (text: string): MdInline[] => {
  const out: MdInline[] = [];
  let buffer = '';
  const flush = (): void => {
    if (buffer) {
      out.push({type: 'text', text: buffer});
      buffer = '';
    }
  };
  let i = 0;
  const n = text.length;
  while (i < n) {
    const ch = text[i];

    if (ch === '`') {
      const close = text.indexOf('`', i + 1);
      const inner = close < 0 ? text.slice(i + 1) : text.slice(i + 1, close);
      if (inner.length > 0) {
        flush();
        out.push({type: 'code', text: inner});
        i = close < 0 ? n : close + 1;
        continue;
      }
    }

    if (ch === '*' && text[i + 1] === '*') {
      const rest = text.slice(i + 2);
      if (rest.length > 0 && !/^\s/.test(rest)) {
        const close = text.indexOf('**', i + 2);
        const inner = close < 0 ? rest : text.slice(i + 2, close);
        if (inner.length > 0) {
          flush();
          out.push({type: 'bold', children: parseInline(inner)});
          i = close < 0 ? n : close + 2;
          continue;
        }
      }
    }

    if (ch === '*' && text[i + 1] !== '*') {
      const rest = text.slice(i + 1);
      if (rest.length > 0 && !/^\s/.test(rest)) {
        const close = text.indexOf('*', i + 1);
        const inner = close < 0 ? rest : text.slice(i + 1, close);
        if (inner.length > 0 && !(close >= 0 && text[close + 1] === '*')) {
          flush();
          out.push({type: 'italic', children: parseInline(inner)});
          i = close < 0 ? n : close + 1;
          continue;
        }
      }
    }

    if (ch === '[') {
      const closeBracket = text.indexOf(']', i + 1);
      if (closeBracket > i + 1) {
        const label = text.slice(i + 1, closeBracket);
        if (text[closeBracket + 1] === '(') {
          const closeParen = text.indexOf(')', closeBracket + 2);
          flush();
          out.push({
            type: 'link',
            children: parseInline(label),
            href: closeParen < 0 ? text.slice(closeBracket + 2) : text.slice(closeBracket + 2, closeParen),
          });
          i = closeParen < 0 ? n : closeParen + 1;
          continue;
        }
        if (closeBracket + 1 >= n) {
          // "[label]" with nothing after it yet: the "(url)" part is probably still coming
          flush();
          out.push({type: 'link', children: parseInline(label), href: ''});
          i = n;
          continue;
        }
      }
    }

    buffer += ch;
    i++;
  }
  flush();
  return out;
};

/** Plain text of an inline tree (used by the height estimate). */
export const inlineText = (nodes: MdInline[]): string =>
  nodes.map((node) => (node.type === 'text' || node.type === 'code' ? node.text : inlineText(node.children))).join('');

// ------------------------------------------------------------------ style constants
export const MD = {
  fontSize: 14,
  lineH: 22.75, // 14 * 1.625
  blockGap: 8,
  headingSize: {1: 18, 2: 16, 3: 14} as Record<1 | 2 | 3, number>,
  headingLineH: {1: 26, 2: 24, 3: 22.75} as Record<1 | 2 | 3, number>,
  headingTop: 4,
  listIndent: 22, // marker column
  listLevelIndent: 18,
  listGap: 4,
  quotePadLeft: 12,
  tableFont: 13,
  tableLineH: 19.5,
  tablePadY: 6,
  tablePadX: 12,
  hrH: 17,
} as const;

// ------------------------------------------------------------------ inline render
const renderInline = (nodes: MdInline[], keyPrefix: string): React.ReactNode[] =>
  nodes.map((node, index) => {
    const key = `${keyPrefix}.${index}`;
    switch (node.type) {
      case 'text':
        return <React.Fragment key={key}>{node.text}</React.Fragment>;
      case 'bold':
        return (
          <strong key={key} style={{color: NEUTRAL[100], fontWeight: 600}}>
            {renderInline(node.children, key)}
          </strong>
        );
      case 'italic':
        return (
          <em key={key} style={{fontStyle: 'italic'}}>
            {renderInline(node.children, key)}
          </em>
        );
      case 'link':
        return (
          <span key={key} style={{color: TIER_COLORS[1], textDecoration: 'underline', textUnderlineOffset: 2}}>
            {renderInline(node.children, key)}
          </span>
        );
      case 'code':
        return (
          <code
            key={key}
            style={{
              fontFamily: FONTS.mono,
              fontSize: 12.5,
              fontVariantLigatures: 'none',
              color: TOKEN_COLORS.inlineCode,
              background: withAlpha(NEUTRAL[100], 0.07),
              borderRadius: 4,
              padding: '1px 5px',
            }}
          >
            {node.text}
          </code>
        );
    }
  });

const Inline: React.FC<{text: string; id: string; trailing?: React.ReactNode}> = ({text, id, trailing}) => (
  <>
    {renderInline(parseInline(text), id)}
    {trailing}
  </>
);

// ------------------------------------------------------------------ block render
const BlockView: React.FC<{block: MdBlock; id: string; trailing?: React.ReactNode; first: boolean}> = ({
  block,
  id,
  trailing,
  first,
}) => {
  switch (block.type) {
    case 'heading': {
      return (
        <div
          style={{
            marginTop: first ? 0 : MD.headingTop,
            fontFamily: FONTS.heading,
            fontWeight: 600,
            color: NEUTRAL[100],
            fontSize: MD.headingSize[block.level],
            lineHeight: `${MD.headingLineH[block.level]}px`,
            letterSpacing: block.level === 1 ? '-0.01em' : undefined,
          }}
        >
          <Inline text={block.text} id={id} trailing={trailing} />
        </div>
      );
    }
    case 'paragraph': {
      return (
        <div style={{color: NEUTRAL[200]}}>
          <Inline text={block.text} id={id} trailing={trailing} />
        </div>
      );
    }
    case 'quote': {
      return (
        <div
          style={{
            borderLeft: `2px solid ${NEUTRAL[600]}`,
            paddingLeft: MD.quotePadLeft,
            color: NEUTRAL[400],
          }}
        >
          <Inline text={block.text} id={id} trailing={trailing} />
        </div>
      );
    }
    case 'hr': {
      return (
        <div style={{height: MD.hrH, display: 'flex', alignItems: 'center'}}>
          <div style={{flex: 1, height: 1, background: NEUTRAL[800]}} />
          {trailing}
        </div>
      );
    }
    case 'list': {
      return (
        <div style={{display: 'flex', flexDirection: 'column', gap: MD.listGap}}>
          {block.items.map((item, index) => {
            const isLast = index === block.items.length - 1;
            return (
              <div
                key={index}
                style={{display: 'flex', paddingLeft: item.level * MD.listLevelIndent, color: NEUTRAL[200]}}
              >
                <span
                  style={{
                    width: MD.listIndent,
                    flexShrink: 0,
                    color: NEUTRAL[500],
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {block.ordered ? item.marker : '•'}
                </span>
                <span style={{minWidth: 0}}>
                  <Inline text={item.text} id={`${id}.${index}`} trailing={isLast ? trailing : undefined} />
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    case 'table': {
      const columns = Math.max(block.header.length, ...block.rows.map((row) => row.length));
      const cell = (text: string | undefined, col: number, row: number, isHeader: boolean, isLastCell: boolean) => {
        const Tag = isHeader ? 'th' : 'td';
        return (
          <Tag
            key={col}
            style={{
              textAlign: block.align[col] ?? 'left',
              padding: `${MD.tablePadY}px ${MD.tablePadX}px`,
              borderRight: col < columns - 1 ? `1px solid ${NEUTRAL[800]}` : undefined,
              borderBottom: isHeader || row < block.rows.length - 1 ? `1px solid ${NEUTRAL[800]}` : undefined,
              fontWeight: isHeader ? 600 : 400,
              color: isHeader ? NEUTRAL[100] : NEUTRAL[300],
              background: isHeader ? withAlpha(NEUTRAL[100], 0.04) : undefined,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            <Inline text={text ?? ''} id={`${id}.${row}.${col}`} trailing={isLastCell ? trailing : undefined} />
          </Tag>
        );
      };
      const lastRow = block.rows.length - 1;
      // the caret goes into the last cell that has text
      const lastRowCells = lastRow >= 0 ? block.rows[lastRow] : block.header;
      let caretCol = lastRowCells.length - 1;
      while (caretCol > 0 && (lastRowCells[caretCol] ?? '') === '') {
        caretCol--;
      }
      return (
        <div
          style={{
            alignSelf: 'flex-start',
            maxWidth: '100%',
            border: `1px solid ${NEUTRAL[800]}`,
            borderRadius: 6,
            overflow: 'hidden',
            fontSize: MD.tableFont,
            lineHeight: `${MD.tableLineH}px`,
          }}
        >
          <table style={{borderCollapse: 'separate', borderSpacing: 0, minWidth: 320}}>
            <thead>
              <tr>
                {Array.from({length: columns}, (_, col) =>
                  cell(block.header[col], col, -1, true, lastRow < 0 && col === caretCol),
                )}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {Array.from({length: columns}, (_, col) =>
                    cell(row[col], col, r, false, r === lastRow && col === caretCol),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'code': {
      return <CodeBlock code={block.code} lang={block.lang} trailing={trailing} />;
    }
  }
};

export type MarkdownProps = {
  /** The (possibly partial) markdown. */
  text: string;
  /** Draw the streaming caret after the last character. Pass false once the stream is done. Default false. */
  caret?: boolean;
  /** Frame local to the message, for the caret pulse. Default 0. */
  frame?: number;
};

/** Markdown body. Put it inside <AssistantMessage caret={false}> and let it own the caret. */
export const Markdown: React.FC<MarkdownProps> = ({text, caret = false, frame = 0}) => {
  const blocks = parseMarkdown(text);
  const caretNode = caret ? <Caret frame={frame} /> : null;
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: MD.blockGap, fontSize: MD.fontSize, lineHeight: `${MD.lineH}px`}}>
      {blocks.map((block, index) => (
        <BlockView
          key={index}
          block={block}
          id={`b${index}`}
          first={index === 0}
          trailing={index === blocks.length - 1 ? caretNode : undefined}
        />
      ))}
      {blocks.length === 0 ? <div>{caretNode}</div> : null}
    </div>
  );
};

// ------------------------------------------------------------------ height estimate
/** Average advance of one character, in px (Inter at 14 px). */
const CHAR_W = 7.3;

const wrappedLines = (chars: number, widthPx: number, charW: number): number =>
  Math.max(1, Math.ceil((chars * charW) / Math.max(40, widthPx)));

/**
 * Deterministic estimate of the rendered height of `text` in a column `widthPx` wide (the bubble's INNER width).
 * Patch 07 uses it to drive the auto-scroll without measuring the DOM. Accuracy is a few percent: it counts wrapped
 * lines from character counts. DevMarkdown prints estimate vs real height so the constants can be re-tuned.
 */
export const estimateMarkdownHeight = (text: string, widthPx: number): number => {
  const blocks = parseMarkdown(text);
  let total = 0;
  blocks.forEach((block, index) => {
    let h = 0;
    switch (block.type) {
      case 'heading':
        h = (index === 0 ? 0 : MD.headingTop) + MD.headingLineH[block.level] * wrappedLines(inlineText(parseInline(block.text)).length, widthPx, CHAR_W * (MD.headingSize[block.level] / 14));
        break;
      case 'paragraph':
        h = MD.lineH * wrappedLines(inlineText(parseInline(block.text)).length, widthPx, CHAR_W);
        break;
      case 'quote':
        h = MD.lineH * wrappedLines(inlineText(parseInline(block.text)).length, widthPx - MD.quotePadLeft - 2, CHAR_W);
        break;
      case 'hr':
        h = MD.hrH;
        break;
      case 'list':
        h =
          block.items.reduce(
            (sum, item) =>
              sum +
              MD.lineH *
                wrappedLines(
                  inlineText(parseInline(item.text)).length,
                  widthPx - MD.listIndent - item.level * MD.listLevelIndent,
                  CHAR_W,
                ),
            0,
          ) +
          MD.listGap * (block.items.length - 1);
        break;
      case 'table': {
        const rowH = MD.tableLineH + MD.tablePadY * 2 + 1;
        h = rowH * (1 + block.rows.length) + 1;
        break;
      }
      case 'code':
        h = codeBlockHeight(block.code === '' ? 1 : block.code.split('\n').length);
        break;
    }
    total += h + (index > 0 ? MD.blockGap : 0);
  });
  return Math.round(total);
};
