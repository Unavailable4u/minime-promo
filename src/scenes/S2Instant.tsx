import React from 'react';
import {anchorsAt} from '../config/anchors';
import {cameraKey, type CameraKeyframe, type CursorWaypoint} from '../config/camera';
import {CALLOUTS, CAPTIONS} from '../config/copy';
import {S2} from '../config/script';
import {SCENES, f} from '../config/timeline';
import {Callout} from '../fx/Callout';
import {Caption} from '../fx/Caption';
import {KEYCAP_ENTER_FRAMES, KeyCap} from '../fx/KeyCap';
import type {SceneOverlayProps} from './sceneTypes';

/**
 * S2 — INSTANT (f240-479) — caption "Simple asks? Instant."
 * The app plays src/config/script.ts (S2); this file only adds camera, cursor and overlays.
 * Zoom reference (1080p, 14 px chat text): composer 1.60 -> 22.5 px, messageList 1.53 -> 21 px,
 * instantChat 1.30 -> 18.2 px, answer push 1.55 -> 1.78 -> 25 px.
 */

const T = {
  cameraComposer: f(240),
  /** Tilt-up starts 4 f BEFORE the user bubble (f326): the camera spring is 34% done after 4 f, 69% after 8. */
  cameraChat: S2.userIn - 4,
  cameraWide: f(368),
  cameraPushA: f(405),
  cameraPushB: f(420),
  cameraBack: f(455),

  cursorEnter: f(240),
  cursorSlideAway: f(300),
  cursorFollow: f(348),

  /** Rises on the f300 beat into the empty stage below the composer. */
  captionStart: f(300),
  captionEnd: SCENES.S2.end - f(5),

  keyCapStart: S2.enter - KEYCAP_ENTER_FRAMES,

  calloutStart: f(410),
  calloutEnd: f(455),
} as const;

export const S2_CAMERA: CameraKeyframe[] = [
  cameraKey(T.cameraComposer, 'instantComposer', {padding: 72, scaleBias: 1.07, rotateX: 1.5, rotateY: -2}),
  cameraKey(T.cameraChat, 'messageList', {padding: 72, scaleBias: 1.06, rotateX: 0, rotateY: 1.5}),
  cameraKey(T.cameraWide, 'instantChat', {padding: 63, rotateX: 0, rotateY: 1}),
  cameraKey(T.cameraPushA, 'instantAnswer', {padding: 110, scaleBias: 0.66, rotateY: 1.5}),
  cameraKey(T.cameraPushB, 'instantAnswer', {padding: 110, scaleBias: 0.755, rotateY: 2.5}),
  cameraKey(T.cameraBack, 'instantChat', {padding: 63, rotateX: 0, rotateY: 0}),
];

const TEXTAREA = anchorsAt(S2.focus).textarea;
const CLICK_X = Math.round(TEXTAREA.x + TEXTAREA.w * 0.66);
const CLICK_Y = Math.round(TEXTAREA.y + TEXTAREA.h / 2);

export const S2_CURSOR: CursorWaypoint[] = [
  {frame: T.cursorEnter, x: 1404, y: 838},
  {frame: S2.focus, x: CLICK_X, y: CLICK_Y, click: true, hover: 'textarea'},
  {frame: T.cursorSlideAway, x: 1118, y: 690},
  {frame: T.cursorFollow, x: 900, y: 330},
];

const SEND = anchorsAt(S2.enter).sendButton;
const KEYCAP_UI = {x: Math.round(SEND.x + SEND.w / 2), y: Math.round(SEND.y - 8 - 28)};
/** Callout dot, measured from the left of the badge rect: just after the elapsed time. */
const BADGE_TEXT_END = 182;

export const S2Instant: React.FC<SceneOverlayProps> = ({frame}) => {
  const badge = anchorsAt(frame).instantBadge;

  return (
    <>
      <Caption {...CAPTIONS.instant} startFrame={T.captionStart} endFrame={T.captionEnd} frame={frame} />
      <KeyCap startFrame={T.keyCapStart} at={{x: KEYCAP_UI.x, y: KEYCAP_UI.y, space: 'ui'}} frame={frame} />
      {badge ? (
        <Callout
          text={CALLOUTS.answeredInstantly}
          anchor={{x: badge.x + BADGE_TEXT_END, y: badge.y + badge.h / 2, space: 'ui'}}
          side="right"
          distance={96}
          shift={-30}
          startFrame={T.calloutStart}
          endFrame={T.calloutEnd}
          frame={frame}
        />
      ) : null}
    </>
  );
};
