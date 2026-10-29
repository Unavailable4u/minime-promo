import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONTS, NEUTRAL, SURFACE, ACCENT} from './config/theme';
import {SCENE_NAMES, TOTAL_FRAMES, sceneAt} from './config/timeline';
import {FontsReady} from './lib/fonts';

/**
 * TEMPORARY placeholder (patch 00).
 * Patch 08 replaces this file with the real master timeline. It only shows the stage
 * background and the current frame so you can confirm the project, fonts and timeline work.
 */
export const MiniMePromo: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = sceneAt(frame);

  return (
    <FontsReady>
      <AbsoluteFill style={{background: SURFACE.stageGradient}}>
        <div
          style={{
            position: 'absolute',
            left: 48,
            bottom: 40,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            fontFamily: FONTS.mono,
            fontSize: 22,
            color: NEUTRAL[400],
          }}
        >
          <span style={{color: ACCENT.base, letterSpacing: '0.08em'}}>TEMPORARY · PATCH 00</span>
          <span>
            frame {frame} / {TOTAL_FRAMES}
          </span>
          <span>
            {scene} · {SCENE_NAMES[scene]}
          </span>
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.heading,
            fontWeight: 800,
            fontSize: 120,
            letterSpacing: '-0.02em',
          }}
        >
          <span style={{color: NEUTRAL[200]}}>Mini</span>
          <span style={{color: ACCENT.wordmarkMe}}>Me</span>
        </div>
      </AbsoluteFill>
    </FontsReady>
  );
};
