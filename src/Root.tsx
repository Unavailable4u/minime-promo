import React from 'react';
import {Composition} from 'remotion';
import {DevBrandSheet} from './dev/DevBrandSheet';
import {DevFxSheet} from './dev/DevFxSheet';
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

      {/*
        DEV-ONLY compositions (not part of the film). Each dev patch adds one here.
        Remove or keep them out of the final deliverable list in patch 17.
      */}
      <Composition
        id="DevBrandSheet"
        component={DevBrandSheet}
        durationInFrames={150}
        fps={FPS}
        width={STAGE.width}
        height={STAGE.height}
      />
      <Composition
        id="DevFxSheet"
        component={DevFxSheet}
        durationInFrames={300}
        fps={FPS}
        width={STAGE.width}
        height={STAGE.height}
      />
    </>
  );
};
