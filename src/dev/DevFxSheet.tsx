import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CAPTIONS, CALLOUTS, HEADLINE} from '../config/copy';
import {
  cameraKey,
  type CameraKeyframe,
  type CursorWaypoint,
} from '../config/camera';
import {FOCUS_RECTS, type FocusName} from '../config/focus';
import {ACCENT, FONTS, NEUTRAL, SURFACE} from '../config/theme';
import {STAGE, UI, UI_OFFSET} from '../config/timeline';
import {Callout} from '../fx/Callout';
import {Camera} from '../fx/Camera';
import {Caption} from '../fx/Caption';
import {Cursor, getCursorState} from '../fx/Cursor';
import {Glow} from '../fx/Glow';
import {GridFloor} from '../fx/GridFloor';
import {Grain} from '../fx/Grain';
import {KeyCap} from '../fx/KeyCap';
import {KineticText} from '../fx/KineticText';
import {Spotlight} from '../fx/Spotlight';
import {StatChip} from '../fx/StatChip';
import {Toast} from '../fx/Toast';
import {Vignette} from '../fx/Vignette';
import {FontsReady} from '../lib/fonts';

/**
 * DEV ONLY (patch 02): FX sheet. Not part of the film.
 *   npx remotion studio src/index.ts          then open "DevFxSheet"
 *   npx remotion still src/index.ts DevFxSheet out/qa/fx-050.png --frame=50
 *
 * There is no ChatApp yet, so the "app" is a stand-in window that outlines every named focus rectangle.
 * What to look at (300 frames):
 *   0-45     KineticText headline (masked word rise, underline), camera on fullWindow, grid floor behind
 *   46-60    KeyCap pops, is pressed 6 f; cursor clicks on 50 (press dip, ripple, glow)
 *   55-120   camera to the composer (tilt -3 deg) with a caption and a callout above the composer
 *   120-185  camera to the Working Panel (tilt +3 deg), light sweep, cursor clicks on 140
 *   150-235  stat chip counts up
 *   185-245  camera to the graph, callout on its left edge; toast slides up at 205 and lives 40 f
 *   245-300  back to fullWindow (normal tilt limits apply from frame 240 on), outro caption
 */

// ------------------------------------------------------------------- the film data
const CAMERA: CameraKeyframe[] = [
  cameraKey(0, 'fullWindow'),
  cameraKey(55, 'composer', {padding: 300, rotateY: -3, rotateX: 1}),
  cameraKey(120, 'workingPanel', {padding: 150, rotateY: 3, rotateX: 1}),
  cameraKey(185, 'graph', {padding: 240, rotateY: 2}),
  cameraKey(245, 'fullWindow', {padding: 72}),
];

const CURSOR: CursorWaypoint[] = [
  {frame: 22, x: 700, y: 400, hover: 'messageList'},
  {frame: 50, x: 1180, y: 744, click: true, hover: 'send'},
  {frame: 100, x: 1090, y: 200, hover: 'graph'},
  {frame: 140, x: 1200, y: 330, click: true, hover: 'graph node'},
  {frame: 200, x: 1180, y: 560, hover: 'stepCards'},
  {frame: 238, x: 400, y: 400},
  {frame: 272, x: 700, y: 730, click: true, hover: 'composer'},
];

// ------------------------------------------------------------------- stand-in app
const PLACEHOLDER_COLORS: Partial<Record<FocusName, string>> = {
  nav: '#38bdf8',
  sidebar: '#a78bfa',
  composer: ACCENT.base,
  messageList: '#34d399',
  assistantBadge: '#fbbf24',
  workingPanel: '#22d3ee',
  graph: '#ec4899',
  stepCards: '#f59e0b',
  modeMenu: '#64748b',
  hiresCard: '#eab308',
};

const FocusBox: React.FC<{name: FocusName}> = ({name}) => {
  const rect = FOCUS_RECTS[name];
  const color = PLACEHOLDER_COLORS[name] ?? NEUTRAL[500];
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        boxSizing: 'border-box',
        border: `1px dashed ${color}`,
        borderRadius: 6,
        background: `${color}14`,
        color,
        fontFamily: FONTS.mono,
        fontSize: 12,
        padding: '4px 6px',
      }}
    >
      {name}
    </div>
  );
};

const StandInApp: React.FC<{hover: string | undefined}> = ({hover}) => (
  <div
    style={{
      position: 'absolute',
      left: UI_OFFSET.x,
      top: UI_OFFSET.y,
      width: UI.width,
      height: UI.height,
      borderRadius: 14,
      overflow: 'hidden',
      background: SURFACE.appBody,
      boxShadow: `${SURFACE.glowRing}, 0 40px 120px rgba(0,0,0,0.6)`,
    }}
  >
    {(['sidebar', 'workingPanel', 'messageList', 'composer', 'graph', 'stepCards', 'nav'] as const).map((name) => (
      <FocusBox key={name} name={name} />
    ))}
    <div
      style={{
        position: 'absolute',
        left: 276,
        top: 6,
        fontFamily: FONTS.mono,
        fontSize: 14,
        color: NEUTRAL[300],
      }}
    >
      {`cursor hover: ${hover ?? '(none)'}`}
    </div>
  </div>
);

// -------------------------------------------------------------------- the sheet
export const DevFxSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const cursor = getCursorState(frame, CURSOR);

  return (
    <FontsReady>
      <AbsoluteFill style={{background: SURFACE.stageGradient}}>
        <GridFloor />
        <Camera
          keyframes={CAMERA}
          screen={
            <>
              {/* headline, then it rises out */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: STAGE.width,
                  height: STAGE.height,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <KineticText
                  lines={[HEADLINE.line1, HEADLINE.line2]}
                  startFrame={4}
                  exitFrame={38}
                  highlight={HEADLINE.highlight}
                  underline
                  fontSize={104}
                />
              </div>

              <Spotlight startFrame={118} endFrame={152} target="workingPanel" />
              <Glow startFrame={50} at={{x: 1180, y: 744, space: 'ui'}} />
              <Glow startFrame={140} at={{x: 1200, y: 330, space: 'ui'}} pulses={2} />
              <KeyCap startFrame={46} at={{x: 1180, y: 640, space: 'ui'}} />

              <Caption {...CAPTIONS.instant} startFrame={62} endFrame={128} />
              <Callout text={CALLOUTS.answeredInstantly} anchor="composer" side="top" startFrame={70} endFrame={118} />

              <StatChip startFrame={150} endFrame={236} />
              <Callout text={CALLOUTS.everyStepTraced} anchor="graph" side="left" startFrame={192} endFrame={240} />
              <Toast startFrame={205} life={40} />

              <Caption {...CAPTIONS.outro} startFrame={252} endFrame={298} />
            </>
          }
        >
          <StandInApp hover={cursor.hover} />
          <Cursor waypoints={CURSOR} />
        </Camera>
        <Vignette />
        <Grain />
        <div
          style={{
            position: 'absolute',
            left: 40,
            top: 28,
            fontFamily: FONTS.mono,
            fontSize: 20,
            color: NEUTRAL[500],
          }}
        >
          {`DevFxSheet  f${frame}`}
        </div>
      </AbsoluteFill>
    </FontsReady>
  );
};
