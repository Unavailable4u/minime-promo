import React from 'react';
import {anchorsAt} from '../../config/anchors';
import {cameraKey, type CameraKeyframe, type CursorWaypoint} from '../../config/camera';
import {CALLOUTS, CAPTIONS} from '../../config/copy';
import {S3} from '../../config/script';
import {f} from '../../config/timeline';
import {Callout} from '../../fx/Callout';
import {Caption} from '../../fx/Caption';
import {Glow} from '../../fx/Glow';
import {KEYCAP_ENTER_FRAMES, KeyCap} from '../../fx/KeyCap';
import {stepCardRect} from '../../ui/panelLayout';
import type {SceneOverlayProps} from '../sceneTypes';

/**
 * S3 part A (f480-699) — caption "Big asks? A whole team."
 * Prompt typing, Enter, the Working Panel opening, the Inspector card, the Tier 3 reveal.
 * The app plays src/config/script.ts (S3); this file only adds camera, cursor and overlays.
 * Part B (s3/S3b.tsx) takes over the camera at f690.
 *
 * Zoom reference (1080p; chat text 14 px, panel text 12 px, graph labels 11 px; scales computed with poseForKeyframe):
 *   instantComposer 1.60 -> 22.5 px | messageList 1.53 -> 21.4 px | teamPanel 1.95 -> 23.4 px
 *   teamInspector 2.04 -> 24.5 px   | teamBadge 2.08 -> 25 px      | teamReveal 1.61 -> 22.5 px (wide, short moment)
 */

const T = {
  cameraComposer: S3.focus - f(4),
  /** Slow orbit while the prompt types, so the held shot never freezes. */
  cameraOrbit: f(536),
  /** Tilt up to the chat 4 f BEFORE the user bubble (same trick as S2: the spring is only 34% done after 4 f). */
  cameraChat: S3.userIn - 4,
  /** The panel starts to spring open at S3.panel.open (f604); the camera leaves 2 f later. */
  cameraPanel: S3.panel.open + f(2),
  /** The Inspector step card appears at f625; the push settles while it runs. */
  cameraInspector: f(624),
  /** The tier badge morphs f660-676: the camera is already there. */
  cameraBadge: f(654),
  cameraReveal: f(682),

  cursorClick: f(490),
  cursorAway: f(520),
  cursorInspector: f(636),
  /** Leaves the Inspector card before its summary opens (f652) so it never covers the text. */
  cursorStepList: f(670),

  /** Rises on the f510 beat while the prompt types; leaves before the panel opens (the panel needs the room). */
  captionStart: f(510),
  captionEnd: S3.panel.open,

  keyCapStart: S3.enter - KEYCAP_ENTER_FRAMES,

  inspectorCalloutStart: f(625),
  inspectorCalloutEnd: f(660),
  /** The dot is measured from the finished badge, so it waits until the morph (f660-676) is 50% done. */
  tierCalloutStart: f(668),
  tierCalloutEnd: f(700),

  /** Bloom on the Tier 3 morph (morph runs f660-676, `S3.reveal.glowPeak` is f670). */
  glowStart: S3.reveal.glowPeak - f(2),
} as const;

export const S3A_CAMERA: CameraKeyframe[] = [
  cameraKey(T.cameraComposer, 'instantComposer', {padding: 72, scaleBias: 1.07, rotateX: 1.5, rotateY: -2}),
  cameraKey(T.cameraOrbit, 'instantComposer', {padding: 72, scaleBias: 1.07, rotateX: 0.6, rotateY: 1.6}),
  cameraKey(T.cameraChat, 'messageList', {padding: 72, scaleBias: 1.06, rotateX: 0, rotateY: 1.5}),
  cameraKey(T.cameraPanel, 'teamPanel', {padding: 72, rotateX: 0, rotateY: -2.5}),
  cameraKey(T.cameraInspector, 'teamInspector', {padding: 110, scaleBias: 0.9, rotateX: 0.5, rotateY: -2}),
  cameraKey(T.cameraBadge, 'teamBadge', {padding: 90, scaleBias: 0.62, rotateX: 0, rotateY: 2}),
  cameraKey(T.cameraReveal, 'teamReveal', {padding: 63, scaleBias: 1.06, rotateX: 0, rotateY: 0.5}),
];

const TEXTAREA = anchorsAt(S3.focus).textarea;
const CLICK_X = Math.round(TEXTAREA.x + TEXTAREA.w * 0.66);
const CLICK_Y = Math.round(TEXTAREA.y + TEXTAREA.h / 2);
const INSPECTOR_CARD = stepCardRect(0);

export const S3A_CURSOR: CursorWaypoint[] = [
  // S2 leaves the cursor resting at (900, 330); it travels to the textarea and clicks before the first keystroke.
  {frame: T.cursorClick, x: CLICK_X, y: CLICK_Y, click: true, hover: 'textarea'},
  // Out of the way of the typed text (which grows to the right along y = textarea center).
  {frame: T.cursorAway, x: 1160, y: 690},
  // Under the Inspector card's empty middle, clear of its name (left) and "done · 1912ms" (right).
  {frame: T.cursorInspector, x: INSPECTOR_CARD.x + 296, y: INSPECTOR_CARD.y + INSPECTOR_CARD.h + 6, hover: 'inspector-step'},
  // Down to the (still empty) step list, where part B picks it up.
  {frame: T.cursorStepList, x: INSPECTOR_CARD.x + 392, y: INSPECTOR_CARD.y + 128},
];

const SEND = anchorsAt(S3.enter).sendButton;
const KEYCAP_UI = {x: Math.round(SEND.x + SEND.w / 2), y: Math.round(SEND.y - 8 - 28)};
/** Callout dot on the tier badge, measured from the left of the badge rect: just after the tier label. */
const BADGE_TEXT_END = 196;

export const S3a: React.FC<SceneOverlayProps> = ({frame}) => {
  const badge = anchorsAt(frame).tierBadge;

  return (
    <>
      <Caption {...CAPTIONS.team} startFrame={T.captionStart} endFrame={T.captionEnd} frame={frame} />
      <KeyCap startFrame={T.keyCapStart} at={{x: KEYCAP_UI.x, y: KEYCAP_UI.y, space: 'ui'}} frame={frame} />
      <Callout
        text={CALLOUTS.inspectorReads}
        anchor={{x: INSPECTOR_CARD.x + 113, y: INSPECTOR_CARD.y + INSPECTOR_CARD.h, space: 'ui'}}
        side="bottom"
        distance={78}
        startFrame={T.inspectorCalloutStart}
        endFrame={T.inspectorCalloutEnd}
        frame={frame}
      />
      {badge ? (
        <>
          <Glow
            startFrame={T.glowStart}
            at={{x: badge.x + BADGE_TEXT_END * 0.5, y: badge.y + badge.h / 2, space: 'ui'}}
            size={520}
            intensity={0.9}
            frame={frame}
          />
          <Callout
            text={CALLOUTS.tier3Team}
            anchor={{x: badge.x + BADGE_TEXT_END, y: badge.y + badge.h / 2, space: 'ui'}}
            side="right"
            distance={96}
            shift={-30}
            startFrame={T.tierCalloutStart}
            endFrame={T.tierCalloutEnd}
            frame={frame}
          />
        </>
      ) : null}
    </>
  );
};
