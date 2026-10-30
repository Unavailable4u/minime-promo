/**
 * MiniMe promo — small JavaScript tokenizer for the code block (VS Code Dark+ colors).
 *
 * Deliberately tolerant: it never throws and never needs a complete program. An unterminated string or regex ends
 * at the end of its line, an unterminated block comment or template string runs to the end of the input, so a
 * half-typed last line is colored sensibly while the code "streams" in.
 *
 * Token types match the Dark+ names in the master brief (Appendix C):
 *   comment · string · number · keyword (purple control flow) · decl (blue const/let/function/new...) ·
 *   const (blue true/false/null/this...) · func (yellow call or declaration name) · type (teal Capitalized) ·
 *   prop (light blue variables and properties) · plain (punctuation, operators, whitespace)
 * Regex literals use the `string` color (the brief has no separate regex color).
 */
import {TOKEN_COLORS} from '../config/theme';

export type TokenType =
  | 'comment'
  | 'string'
  | 'number'
  | 'keyword'
  | 'decl'
  | 'const'
  | 'func'
  | 'type'
  | 'prop'
  | 'plain';

export type CodeToken = {readonly type: TokenType; readonly text: string};

/** Color of each token type (from theme.ts TOKEN_COLORS). */
export const TOKEN_TYPE_COLOR: Readonly<Record<TokenType, string>> = {
  comment: TOKEN_COLORS.comment,
  string: TOKEN_COLORS.string,
  number: TOKEN_COLORS.number,
  keyword: TOKEN_COLORS.keyword,
  decl: TOKEN_COLORS.decl,
  const: TOKEN_COLORS.const,
  func: TOKEN_COLORS.func,
  type: TOKEN_COLORS.type,
  prop: TOKEN_COLORS.prop,
  plain: TOKEN_COLORS.plain,
};

const DECL_WORDS = new Set([
  'const',
  'let',
  'var',
  'function',
  'class',
  'async',
  'new',
  'typeof',
  'instanceof',
  'delete',
  'void',
  'static',
  'extends',
  'in',
  'of',
]);
const KEYWORD_WORDS = new Set([
  'if',
  'else',
  'return',
  'await',
  'for',
  'while',
  'do',
  'switch',
  'case',
  'break',
  'continue',
  'default',
  'try',
  'catch',
  'finally',
  'throw',
  'import',
  'export',
  'from',
  'as',
  'yield',
]);
const CONST_WORDS = new Set(['true', 'false', 'null', 'undefined', 'this', 'super', 'NaN', 'Infinity']);
/** After these words a "/" starts a regex literal, not a division. */
const REGEX_AFTER_WORDS = new Set(['return', 'typeof', 'case', 'delete', 'void', 'throw', 'in', 'of', 'await', 'yield']);
const REGEX_AFTER_CHARS = '(,=:[!&|?{};+-*%<>~^';

const IDENT_START = /[A-Za-z_$]/;
const IDENT_PART = /[A-Za-z0-9_$]/;
const DIGIT = /[0-9]/;
const NUMBER_RE = /^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?)n?/;

/** Tokenize a (possibly partial) piece of JavaScript. Concatenating all token texts gives back `code`. */
export const tokenizeJs = (code: string): CodeToken[] => {
  const tokens: CodeToken[] = [];
  const sig: {last: CodeToken | null} = {last: null}; // last token that is not pure whitespace
  let i = 0;
  const n = code.length;

  const push = (type: TokenType, text: string): void => {
    const token: CodeToken = {type, text};
    tokens.push(token);
    if (text.trim().length > 0) {
      sig.last = token;
    }
  };

  const nextSignificantChar = (from: number): string => {
    let j = from;
    while (j < n && (code[j] === ' ' || code[j] === '\t')) {
      j++;
    }
    return j < n ? code[j] : '';
  };

  const regexAllowed = (): boolean => {
    const prev = sig.last;
    if (prev === null) {
      return true;
    }
    if (prev.type === 'plain') {
      const ch = prev.text[prev.text.length - 1];
      return REGEX_AFTER_CHARS.includes(ch);
    }
    if (prev.type === 'keyword' || prev.type === 'decl') {
      return REGEX_AFTER_WORDS.has(prev.text);
    }
    return false;
  };

  while (i < n) {
    const ch = code[i];

    // whitespace (kept, may contain newlines)
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      let j = i + 1;
      while (j < n && (code[j] === ' ' || code[j] === '\t' || code[j] === '\n' || code[j] === '\r')) {
        j++;
      }
      push('plain', code.slice(i, j));
      i = j;
      continue;
    }

    // comments
    if (ch === '/' && code[i + 1] === '/') {
      let j = i + 2;
      while (j < n && code[j] !== '\n') {
        j++;
      }
      push('comment', code.slice(i, j));
      i = j;
      continue;
    }
    if (ch === '/' && code[i + 1] === '*') {
      const close = code.indexOf('*/', i + 2);
      const j = close < 0 ? n : close + 2;
      push('comment', code.slice(i, j));
      i = j;
      continue;
    }

    // strings
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < n && code[j] !== ch && code[j] !== '\n') {
        if (code[j] === '\\' && j + 1 < n && code[j + 1] !== '\n') {
          j++;
        }
        j++;
      }
      if (j < n && code[j] === ch) {
        j++; // include the closing quote
      }
      push('string', code.slice(i, j));
      i = j;
      continue;
    }
    if (ch === '`') {
      let j = i + 1;
      while (j < n && code[j] !== '`') {
        if (code[j] === '\\' && j + 1 < n) {
          j++;
        }
        j++;
      }
      if (j < n) {
        j++;
      }
      push('string', code.slice(i, j));
      i = j;
      continue;
    }

    // numbers
    if (DIGIT.test(ch) || (ch === '.' && DIGIT.test(code[i + 1] ?? ''))) {
      const match = NUMBER_RE.exec(code.slice(i, i + 40));
      if (match && match[0].length > 0) {
        push('number', match[0]);
        i += match[0].length;
        continue;
      }
    }

    // identifiers and keywords
    if (IDENT_START.test(ch)) {
      let j = i + 1;
      while (j < n && IDENT_PART.test(code[j])) {
        j++;
      }
      const word = code.slice(i, j);
      const prev = sig.last;
      const afterDot = prev !== null && prev.type === 'plain' && prev.text === '.';
      const callNext = nextSignificantChar(j) === '(';
      let type: TokenType;
      if (afterDot) {
        type = callNext ? 'func' : 'prop';
      } else if (DECL_WORDS.has(word)) {
        type = 'decl';
      } else if (KEYWORD_WORDS.has(word)) {
        type = 'keyword';
      } else if (CONST_WORDS.has(word)) {
        type = 'const';
      } else if (prev !== null && prev.type === 'decl' && prev.text === 'function') {
        type = 'func';
      } else if (prev !== null && prev.type === 'decl' && prev.text === 'class') {
        type = 'type';
      } else if (callNext) {
        type = 'func';
      } else if (/^[A-Z]/.test(word)) {
        type = 'type';
      } else {
        type = 'prop';
      }
      push(type, word);
      i = j;
      continue;
    }

    // regex literal or division
    if (ch === '/' && regexAllowed()) {
      let j = i + 1;
      let inClass = false;
      while (j < n && code[j] !== '\n') {
        const c = code[j];
        if (c === '\\' && j + 1 < n && code[j + 1] !== '\n') {
          j += 2;
          continue;
        }
        if (c === '[') {
          inClass = true;
        } else if (c === ']') {
          inClass = false;
        } else if (c === '/' && !inClass) {
          break;
        }
        j++;
      }
      if (j < n && code[j] === '/') {
        j++;
        while (j < n && /[a-z]/.test(code[j])) {
          j++; // flags
        }
      }
      push('string', code.slice(i, j));
      i = j;
      continue;
    }

    // punctuation and operators: one character at a time (keeps the "." and "(" checks simple)
    push('plain', ch);
    i++;
  }

  // merge neighbouring plain tokens (punctuation + whitespace) to keep the DOM small
  const merged: CodeToken[] = [];
  for (const token of tokens) {
    const last = merged[merged.length - 1];
    if (last && last.type === 'plain' && token.type === 'plain') {
      merged[merged.length - 1] = {type: 'plain', text: last.text + token.text};
    } else {
      merged.push(token);
    }
  }
  return merged;
};

/** Tokens grouped per line (a token that spans a newline, such as a block comment, is split). */
export const tokenizeLines = (code: string): CodeToken[][] => {
  const lines: CodeToken[][] = [[]];
  for (const token of tokenizeJs(code)) {
    const parts = token.text.split('\n');
    parts.forEach((part, index) => {
      if (index > 0) {
        lines.push([]);
      }
      const text = part.endsWith('\r') ? part.slice(0, -1) : part;
      if (text.length > 0) {
        lines[lines.length - 1].push({type: token.type, text});
      }
    });
  }
  return lines;
};
