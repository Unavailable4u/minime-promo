import React from 'react';
import {Composition} from 'remotion';
import {DEV_APP_FRAMES, DevApp, type DevAppProps} from './dev/DevApp';
import {DevBrandSheet} from './dev/DevBrandSheet';
import {DevFxSheet} from './dev/DevFxSheet';
import {DEV_GRAPH_FRAMES, DevGraph} from './dev/DevGraph';
import {DEV_MARKDOWN_FRAMES, DevMarkdown} from './dev/DevMarkdown';
import {DEV_PANEL_FRAMES, DevPanel} from './dev/DevPanel';
import {DEV_SHELL_FRAMES, DevShell} from './dev/DevShell';
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
      {/* The main deliverable: 1920x1080 @ 30 fps, 1860 frames (62 s). */}
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
        =====================================================================================================
        DEV-ONLY compositions: NOT part of the film and never rendered by `npm run render`.
        They are test sheets for single components (brand, fx, shell, panel, markdown, graph, app) and show
        up in the Studio sidebar only. Delete any of them (and its file in src/dev/) when you no longer
        need it; nothing in the film imports them.
        There is deliberately NO vertical (1080x1920) composition: the brief says to skip it rather than
        ship one that has not been verified to render correctly.
        =====================================================================================================
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
      <Composition
        id="DevShell"
        component={DevShell}
        durationInFrames={DEV_SHELL_FRAMES}
        fps={FPS}
        width={STAGE.width}
        height={STAGE.height}
      />
      <Composition
        id="DevPanel"
        component={DevPanel}
        durationInFrames={DEV_PANEL_FRAMES}
        fps={FPS}
        width={STAGE.width}
        height={STAGE.height}
      />
      <Composition
        id="DevMarkdown"
        component={DevMarkdown}
        durationInFrames={DEV_MARKDOWN_FRAMES}
        fps={FPS}
        width={STAGE.width}
        height={STAGE.height}
      />
      <Composition
        id="DevGraph"
        component={DevGraph}
        durationInFrames={DEV_GRAPH_FRAMES}
        fps={FPS}
        width={STAGE.width}
        height={STAGE.height}
      />
      <Composition
        id="DevApp"
        component={DevApp}
        durationInFrames={DEV_APP_FRAMES}
        fps={FPS}
        width={STAGE.width}
        height={STAGE.height}
        defaultProps={{showAnchors: false} satisfies DevAppProps}
      />
    </>
  );
};
