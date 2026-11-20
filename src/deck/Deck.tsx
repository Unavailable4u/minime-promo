import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DeckFonts} from './deckFonts';
import {DECK_FOOTER, Footer} from './kit';
import {missingNeeds, SLIDE_NEEDS} from './rules';
import {inputs} from './data/inputs';
import {text} from './words';
import {Txt} from './Txt';
import {CONTENT, SURFACES, TOTAL_SLIDES} from './theme';
import {S01} from './slides/S01';
import {S02} from './slides/S02';
import {S03} from './slides/S03';
import {S04} from './slides/S04';
import {S05} from './slides/S05';
import {S06} from './slides/S06';
import {S07} from './slides/S07';
import {S08} from './slides/S08';

/**
 * The deck is ONE composition, `MiniMeDeck`: 15 frames, slide N is frame N-1 (guide v2, section 7).
 *
 * BUILT maps a slide number to its component (src/deck/slides/SNN.tsx). Patches D1 to D5 add one line per slide between
 * the two marker comments, e.g. `1: S01,` (keep exactly one entry per line: scripts/lib/deck-data.mjs reads this block).
 * A slide that is not in BUILT shows <Pending> in the Studio and is SKIPPED by `npm run deck`, so it never reaches the PDF.
 */
export const BUILT: Readonly<Record<number, React.FC>> = {
  // BUILT:START
  1: S01,
  2: S02,
  3: S03,
  4: S04,
  5: S05,
  6: S06,
  7: S07,
  8: S08,
  // BUILT:END
};

/** Studio-only placeholder for a slide that is not built yet (or is blocked by a missing open item). Never exported. */
const Pending: React.FC<{n: number}> = ({n}) => {
  const words = text(n);
  const blocked = missingNeeds(n, inputs);
  return (
    <AbsoluteFill style={{backgroundColor: SURFACES.paper.ground}}>
      <div
        style={{
          position: 'absolute',
          left: CONTENT.x,
          top: CONTENT.y,
          width: CONTENT.width,
          height: CONTENT.height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        <Txt size="label" tone="muted">
          Slide {n} of {TOTAL_SLIDES}: pending
        </Txt>
        <Txt size="headline" tone="secondary">
          {words.headline}
        </Txt>
        {blocked.length > 0 ? (
          <Txt size="body" tone="accent">
            Blocked, missing: {blocked.join('; ')}
          </Txt>
        ) : SLIDE_NEEDS[n] ? (
          <Txt size="body" tone="muted">
            Open items for this slide are filled.
          </Txt>
        ) : null}
      </div>
      <Footer n={n} theme="paper" label={DECK_FOOTER} />
    </AbsoluteFill>
  );
};

export const Deck: React.FC = () => {
  const slide = useCurrentFrame() + 1;
  const Built = BUILT[slide];
  return <DeckFonts>{Built ? <Built /> : <Pending n={slide} />}</DeckFonts>;
};
