import React, {useEffect, useState} from 'react';
import {staticFile, useDelayRender} from 'remotion';
import {FontsReady} from '../lib/fonts';

/**
 * Fonts of the deck. JetBrains Mono comes from the film's vendored fonts (src/lib/fonts.ts, awaited by <FontsReady>).
 * Newsreader (serif, SIL Open Font License, from the @fontsource/newsreader package) is vendored in public/fonts/ and is
 * loaded here with the FontFace API, so rendering stays offline. Frames are never captured before both are ready.
 */
const FACES = [
  {weight: 400, style: 'normal', file: 'Newsreader-400-normal-latin.woff2'},
  {weight: 500, style: 'normal', file: 'Newsreader-500-normal-latin.woff2'},
  {weight: 400, style: 'italic', file: 'Newsreader-400-italic-latin.woff2'},
  {weight: 500, style: 'italic', file: 'Newsreader-500-italic-latin.woff2'},
] as const;

let loading: Promise<void> | null = null;
const loadNewsreader = (): Promise<void> => {
  if (!loading) {
    loading = Promise.all(
      FACES.map(async (face) => {
        const font = new FontFace('Newsreader', `url(${staticFile(`fonts/${face.file}`)}) format('woff2')`, {
          weight: String(face.weight),
          style: face.style,
          display: 'block',
        });
        await font.load();
        document.fonts.add(font);
      }),
    ).then(() => undefined);
  }
  return loading;
};

const NewsreaderReady: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const [handle] = useState(() => delayRender('Loading deck font (Newsreader)'));
  useEffect(() => {
    loadNewsreader()
      .then(() => continueRender(handle))
      .catch((err: unknown) => cancelRender(err));
  }, [handle, continueRender, cancelRender]);
  return <>{children}</>;
};

/** Wrap every deck frame in this. */
export const DeckFonts: React.FC<{children: React.ReactNode}> = ({children}) => (
  <FontsReady>
    <NewsreaderReady>{children}</NewsreaderReady>
  </FontsReady>
);
