import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DeckFonts} from './deckFonts';
import {Shot, shotLayout} from './Shot';
import {SHOTS, type ShotId} from './shots';
import {PALETTE} from './theme';
import {ThemeContext, Txt} from './Txt';

/**
 * DEV-ONLY (not part of the deck, never exported): proof that the base crop removes the browser bar and the taskbar.
 * One row per capture: left = the WHOLE source file with the crop box outlined in crimson, right = the cropped result
 * <Shot grid />, both with the source-pixel grid. Render it with:
 *   npx remotion still src/index.ts DeckDevCrop out/deck-crop-proof.png
 */
const SOURCE_W = 800;
const CROPPED_W = 880;

const Row: React.FC<{id: ShotId}> = ({id}) => {
  const def = SHOTS[id];
  const layout = shotLayout({id, width: SOURCE_W, crop: {x: 0, y: 0, w: def.natural.w, h: def.natural.h}});
  const crop = shotLayout({id, width: CROPPED_W}).crop;
  return (
    <div style={{display: 'flex', gap: 32, alignItems: 'flex-start'}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        <Txt size="caption" tone="secondary">
          {id}: whole file {def.natural.w} x {def.natural.h}, crop outlined
        </Txt>
        <Shot id={id} width={SOURCE_W} crop={{x: 0, y: 0, w: def.natural.w, h: def.natural.h}} grid frame={false}>
          <div
            style={{
              position: 'absolute',
              left: crop.x * layout.scale,
              top: crop.y * layout.scale,
              width: crop.w * layout.scale,
              height: crop.h * layout.scale,
              outline: `4px solid ${PALETTE.accentOnInk}`,
              outlineOffset: -2,
            }}
          />
        </Shot>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        <Txt size="caption" tone="secondary">
          after the crop {JSON.stringify(crop)}
        </Txt>
        <Shot id={id} width={CROPPED_W} grid />
      </div>
    </div>
  );
};

export const DevCrop: React.FC = () => (
  <DeckFonts>
    <ThemeContext.Provider value="ink">
    <AbsoluteFill style={{backgroundColor: PALETTE.night, padding: 40, display: 'flex', flexDirection: 'column', gap: 28}}>
      <Row id="chat_nav" />
      <Row id="chat" />
    </AbsoluteFill>
    </ThemeContext.Provider>
  </DeckFonts>
);
