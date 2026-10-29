import React from 'react';
import {Composition} from 'remotion';
import {MiniMePromo} from './MiniMePromo';
import {PreviewScale} from './PreviewScale';
import {FPS, STAGE, TOTAL_FRAMES} from './config/timeline';

/** Same timeline as MiniMePromo, rendered at half size for fast iteration. */
const MiniMePromoPreview: React.FC = () => (
  <PreviewScale>
    <MiniMePromo />
  </PreviewScale>
);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* The main deliverable: 1920x1080 @ 30 fps, 1740 frames (58 s). */}
      <Composition
        id="MiniMePromo"
        component={MiniMePromo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={STAGE.width}
        height={STAGE.height}
      />
      {/* Same timeline at 960x540 for quick previews. */}
      <Composition
        id="MiniMePromo-Preview"
        component={MiniMePromoPreview}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={STAGE.width / 2}
        height={STAGE.height / 2}
      />
    </>
  );
};
