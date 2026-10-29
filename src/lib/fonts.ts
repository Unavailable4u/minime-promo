import React, {useEffect, useState} from 'react';
import {useDelayRender} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadJetBrainsMono} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadSora} from '@remotion/google-fonts/Sora';

export {FONTS} from '../config/theme';

/**
 * Fonts: Sora (headings, buttons, nav, captions), Inter (UI body), JetBrains Mono (code, timings).
 * They load through @remotion/google-fonts. Patch 01 vendors the files into public/fonts so rendering
 * works fully offline; until then the first run needs internet to fetch them once.
 */
const sora = loadSora('normal', {weights: ['600', '700', '800'], subsets: ['latin']});
const inter = loadInter('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']});
const mono = loadJetBrainsMono('normal', {weights: ['400', '500', '600'], subsets: ['latin']});

/** Family names exactly as they are registered in the browser. */
export const FONT_FAMILIES = {
  sora: sora.fontFamily,
  inter: inter.fontFamily,
  mono: mono.fontFamily,
} as const;

/** Resolves when all three fonts are ready. */
export const fontsReady: Promise<void> = Promise.all([
  sora.waitUntilDone(),
  inter.waitUntilDone(),
  mono.waitUntilDone(),
]).then(() => undefined);

/**
 * Wrap the film in <FontsReady> so frames are never captured before the fonts are loaded.
 * It holds the render open (delayRender) until the fonts resolve, and fails loudly if they cannot load.
 */
export const FontsReady: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const [handle] = useState(() => delayRender('Loading MiniMe fonts (Sora, Inter, JetBrains Mono)'));

  useEffect(() => {
    fontsReady
      .then(() => continueRender(handle))
      .catch((err: unknown) => cancelRender(err));
  }, [handle, continueRender, cancelRender]);

  return React.createElement(React.Fragment, null, children);
};
