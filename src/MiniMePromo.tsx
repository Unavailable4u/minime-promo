import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {INTRO} from './config/intro';
import {SURFACE} from './config/theme';
import {FPS, SCENES, STAGE, UI, UI_OFFSET} from './config/timeline';
import {Camera, useCameraState} from './fx/Camera';
import {Cursor} from './fx/Cursor';
import {Grain} from './fx/Grain';
import {GridFloor} from './fx/GridFloor';
import {Vignette} from './fx/Vignette';
import {ramp} from './lib/ease';
import {FontsReady} from './lib/fonts';
import {ALL_CAMERA, ALL_CURSOR, SCENE_OVERLAYS, gridOpacityAt, windowStyleAt} from './scenes';
import {ChatApp} from './ui/ChatApp';

/**
 * MiniMe promo — the master timeline (patch 08).
 *
 * Layer order, bottom to top:
 *   1. stage          gradient #0a0a0a -> #151515, the #050505 opener backdrop, the drifting crimson glow
 *   2. grid floor     intro and outro only (opacity comes from the scenes, see gridOpacityAt)
 *   3. <Camera>       world: the persistent <ChatApp/> (mounted from S1) and the <Cursor/>;
 *                     screen: the scene overlays (captions, callouts, headline, lockup ...)
 *   4. vignette       12%
 *   5. grain          3.5%, re-seeded every frame
 *
 * This file does not know any scene. Cameras, cursor waypoints, overlays, grid and window hooks all come from
 * src/scenes/index.ts, so replacing a scene file in a later patch never requires editing this file.
 * Overlays get the GLOBAL frame as a prop (they are not wrapped in <Sequence>, which would make the frame local).
 */

/** The drifting crimson radial glow behind the window (alpha .10-.18). Pure function of the frame. */
const StageGlow: React.FC<{frame: number}> = ({frame}) => {
  const strength = ramp(frame, INTRO.stageGlowStart, INTRO.stageGlowEnd);
  if (strength <= 0.001) {
    return null;
  }
  const seconds = frame / FPS;
  const x = STAGE.width / 2 + 260 * Math.sin((2 * Math.PI * seconds) / 11 + 0.6);
  const y = STAGE.height / 2 + 150 * Math.sin((2 * Math.PI * seconds) / 8.3 + 2.2);
  const alpha = (0.14 + 0.04 * Math.sin((2 * Math.PI * seconds) / 6.5)) * strength;
  const size = 1500;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle closest-side, ${SURFACE.crimsonGlow(alpha)} 0%, ${SURFACE.crimsonGlow(alpha * 0.45)} 42%, ${SURFACE.crimsonGlow(0)} 100%)`,
        pointerEvents: 'none',
      }}
    />
  );
};

/** The camera's world: the persistent chat app at UI_OFFSET and the global cursor. */
const World: React.FC<{frame: number}> = ({frame}) => {
  const camera = useCameraState();
  // The rim light travels around the border as the camera pans and yaws (a faint, slow glint).
  const rimAngle = 215 - camera.rotY * 5 + (camera.cx - STAGE.width / 2) * 0.04 + frame * 0.12;
  const showApp = frame >= SCENES.S1.start;

  return (
    <>
      {showApp ? (
        <div style={{position: 'absolute', left: UI_OFFSET.x, top: UI_OFFSET.y, width: UI.width, height: UI.height}}>
          <ChatApp frame={frame} rimAngle={rimAngle} rimIntensity={0.55} style={windowStyleAt(frame)} />
        </div>
      ) : null}
      <Cursor waypoints={ALL_CURSOR} frame={frame} />
    </>
  );
};

export const MiniMePromo: React.FC = () => {
  const frame = useCurrentFrame();
  const gridOpacity = gridOpacityAt(frame);
  const backdrop = 1 - ramp(frame, INTRO.backdropFadeStart, INTRO.backdropFadeEnd);

  const overlays = SCENE_OVERLAYS.filter((entry) => frame >= entry.from && frame <= entry.to).map(
    ({id, Overlay}) => <Overlay key={id} frame={frame} />,
  );

  return (
    <FontsReady>
      <AbsoluteFill style={{background: SURFACE.stageGradient, overflow: 'hidden'}}>
        {backdrop > 0.001 ? <AbsoluteFill style={{background: SURFACE.logoStage, opacity: backdrop}} /> : null}
        <StageGlow frame={frame} />
        {gridOpacity > 0.001 ? <GridFloor opacity={gridOpacity} frame={frame} /> : null}

        <Camera keyframes={ALL_CAMERA} dof={frame >= INTRO.dofOn} frame={frame} screen={<>{overlays}</>}>
          <World frame={frame} />
        </Camera>

        <Vignette strength={0.12} />
        <Grain opacity={0.035} frame={frame} />
      </AbsoluteFill>
    </FontsReady>
  );
};
