import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {STAGE} from './config/timeline';

/**
 * Renders the full 1920x1080 film scaled down to the composition size (used by MiniMePromo-Preview).
 * Rule for the whole project: lay everything out with STAGE / UI constants,
 * never with useVideoConfig().width/height, so this scaling always works.
 */
export const PreviewScale: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {width} = useVideoConfig();
  const scale = width / STAGE.width;

  return (
    <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden', display: 'block'}}>
      <div
        style={{
          position: 'relative',
          flexShrink: 0, // never let a flex parent squash the 1920x1080 stage
          width: STAGE.width,
          height: STAGE.height,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
