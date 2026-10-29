import React from 'react';
import {Img, staticFile} from 'remotion';

/**
 * Emoji -> Twemoji file name (without extension), e.g.
 *   "\u{1F46E}"              -> "1f46e"
 *   "\u265F\uFE0F"           -> "265f"            (FE0F is dropped, like twemoji does)
 *   "\u{1F9D1}\u200D\u{1F4BC}" -> "1f9d1-200d-1f4bc" (ZWJ sequences keep every code point, FE0F included)
 * scripts/fetch-assets.mjs uses the same rule to decide which files to download.
 */
export const emojiFilename = (emoji: string): string => {
  const points = Array.from(emoji).map((ch) => ch.codePointAt(0) as number);
  const hasZwj = points.includes(0x200d);
  return points
    .filter((cp) => hasZwj || cp !== 0xfe0f)
    .map((cp) => cp.toString(16))
    .join('-');
};

/** staticFile() path of the bundled Twemoji SVG for an emoji. */
export const emojiSrc = (emoji: string): string => staticFile(`emoji/${emojiFilename(emoji)}.svg`);

export type EmojiProps = {
  /** The emoji character(s), e.g. a ROLE_CATEGORIES icon. */
  emoji: string;
  /** Rendered width and height in px. Default 16. */
  size?: number;
  style?: React.CSSProperties;
};

/**
 * Renders an emoji from the bundled Twemoji SVGs (public/emoji/, installed by `npm run assets`).
 * Never falls back to system emoji fonts, so every machine renders identical pixels.
 */
export const Emoji: React.FC<EmojiProps> = ({emoji, size = 16, style}) => (
  <Img
    src={emojiSrc(emoji)}
    alt={emoji}
    draggable={false}
    style={{
      width: size,
      height: size,
      display: 'inline-block',
      verticalAlign: 'middle',
      flexShrink: 0,
      objectFit: 'contain',
      ...style,
    }}
  />
);
