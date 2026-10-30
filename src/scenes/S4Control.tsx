import React from 'react';
import {anchorsAt} from '../config/anchors';
import {cameraKey, type CameraKeyframe, type CursorWaypoint} from '../config/camera';
import {CALLOUTS, CAPTIONS} from '../config/copy';
import {S4} from '../config/script';
import {f} from '../config/timeline';
import {Callout} from '../fx/Callout';
import {Caption} from '../fx/Caption';
import {KEYCAP_ENTER_FRAMES, KeyCap} from '../fx/KeyCap';
import type {SceneOverlayProps} from './sceneTypes';

/**
 * S4 — CONTROL (f1080-1319) — caption "You stay in control."
 * The app plays src/config/script.ts (S4); this file only adds camera, cursor and overlays.
 *
 * The Working Panel is open for the whole scene, so the chat box is x 256..960 and the composer is 704 px wide.
 * Shots (frame = the frame the move STARTS; the camera spring settles about 25 f later):
 *   f1080 controlComposer  pull-in from the S3 two-column shot; the cursor arrives at the mode pill, caption rises
 *   f1096 controlMenu      the menu opens at f1104; hover Simple, Fast, Expert, Beast, settle on Expert (f1140)
 *   f1144 controlHeader    "Review hires" toggle (hover f1158, click f1166)
 *   f1172 controlComposer  click the textarea (f1181), type the prompt (f1183-1213), Enter f1217 with the key cap
 *   f1220 controlHire      the Review staffed roles card scrolls in, Approve & run (hover f1238, click f1244)
 *   f1248 controlPause     graph builds, Pause f1262, paused graph + steps, Resume f1290
 *   f1296 controlWide      pull-back (chat box + panel + composer), settled on the f1320 beat
 */

// ---------------------------------------------------------------------------------------------- timing
const T = {
  cameraComposer: f(1080),
  /** The menu starts to open at f1104 (22 f); the camera leaves 8 f before so it is about 70% there. */
  cameraMenu: S4.mode.menuOpen - f(8),
  /** The menu closes f1142-1154; the cursor leaves for the toggle at f1140. */
  cameraHeader: f(1144),
  /** After the toggle click (f1166) and the first 6 f of its switch animation. */
  cameraTyping: S4.review.hoverEnd,
  /** Enter is f1217, the user bubble f1219: the key cap needs the send button in frame until it is released. */
  cameraHire: S4.hire.start,
  /** The Approve click is f1244; the panel cascades in from f1248. */
  cameraPause: f(1248),
  /** Pull back so the two-column shot is settled on the f1320 beat. */
  cameraBack: f(1296),

  captionStart: f(1080),
  /** Leaves before the camera goes up to the header (a caption over the chat text would be hard to read). */
  captionEnd: f(1142),

  modesCalloutStart: f(1108),
  modesCalloutEnd: f(1142),
  keyCapStart: S4.enter - KEYCAP_ENTER_FRAMES,
  approveCalloutStart: f(1228),
  approveCalloutEnd: f(1256),
  pauseCalloutStart: f(1258),
  pauseCalloutEnd: f(1288),
} as const;

export const S4_CAMERA: CameraKeyframe[] = [
  cameraKey(T.cameraComposer, 'controlComposer', {padding: 72, scaleBias: 0.85, rotateX: 1.2, rotateY: -2}),
  cameraKey(T.cameraMenu, 'controlMenu', {padding: 72, scaleBias: 0.85, rotateX: 0, rotateY: 1.5}),
  cameraKey(T.cameraHeader, 'controlHeader', {padding: 72, scaleBias: 0.8, rotateX: 0.6, rotateY: -1.5}),
  cameraKey(T.cameraTyping, 'controlComposer', {padding: 72, scaleBias: 0.9, rotateX: 0.5, rotateY: 1.2}),
  cameraKey(T.cameraHire, 'controlHire', {padding: 72, scaleBias: 1, rotateX: 0, rotateY: 1.5}),
  cameraKey(T.cameraPause, 'controlPause', {padding: 72, scaleBias: 1, rotateX: 0.3, rotateY: -2}),
  cameraKey(T.cameraBack, 'controlWide', {padding: 72, rotateX: 0, rotateY: 0.5}),
];

// ---------------------------------------------------------------------------------------------- cursor
// The cursor rests on the "Save as template" row (about (1034, 205)) from S3c. Every position below comes from
// anchorsAt(), so it follows the layout. Hover ids match script.ts HOVER_WINDOWS (mode, review, textarea, approve, send).
const MENU_FULL = S4.mode.menuOpen + f(22);
const MODE = anchorsAt(S4.mode.menuOpen).modeButton;
const menuRow = (index: number) => anchorsAt(MENU_FULL).modeMenuRow(index);
const REVIEW = anchorsAt(S4.review.click).reviewHires;
const TEXTAREA = anchorsAt(S4.focus).textarea;
const SEND = anchorsAt(S4.pause.click).sendButton;
const APPROVE_HOVER_FRAME = S4.hire.approveHover + f(2);
const APPROVE_HOVER = anchorsAt(APPROVE_HOVER_FRAME).approveButton ?? {x: 804, y: 550, w: 124, h: 32};
const APPROVE_CLICK = anchorsAt(S4.hire.approveClick).approveButton ?? {x: 804, y: 538, w: 124, h: 32};

/** A point inside a menu row, a little different on each row so the hand does not look mechanical. */
const rowPoint = (index: number, dx: number, dy = 0): {x: number; y: number} => {
  const row = menuRow(index);
  return {x: Math.round(row.x + dx), y: Math.round(row.y + row.h / 2 + dy)};
};

const MODE_TIP = {x: Math.round(MODE.x + MODE.w * 0.45), y: Math.round(MODE.y + MODE.h * 0.55)};
const REVIEW_TIP = {x: Math.round(REVIEW.x + REVIEW.w * 0.55), y: Math.round(REVIEW.y + REVIEW.h * 0.6)};
/** Right part of the textarea: the typed text grows from the left and never reaches the arrow. */
const TEXTAREA_TIP = {x: Math.round(TEXTAREA.x + TEXTAREA.w * 0.86), y: Math.round(TEXTAREA.y + TEXTAREA.h * 0.55)};
const SEND_TIP = {x: Math.round(SEND.x + SEND.w * 0.42), y: Math.round(SEND.y + SEND.h * 0.55)};
/** Resting spot above the composer while the paused graph is on screen (clear of the "Resume" label). */
const SEND_AWAY = {x: Math.round(SEND.x - 60), y: Math.round(SEND.y - 64)};

const SIMPLE = rowPoint(1, 70);
const FAST = rowPoint(2, 92);
const EXPERT = rowPoint(3, 80);
const BEAST = rowPoint(4, 96, -6);
const EXPERT_BACK = rowPoint(3, 86, 2);

export const S4_CURSOR: CursorWaypoint[] = [
  // Arrives at the mode pill (hover window f1098-1110) and presses it on f1104: the menu opens upward.
  {frame: f(1098), x: MODE_TIP.x, y: MODE_TIP.y, hover: 'mode'},
  {frame: S4.mode.menuOpen, x: MODE_TIP.x + 4, y: MODE_TIP.y + 1, click: true, hover: 'mode'},
  // Up through the opening menu, then down the rows in step with S4.mode.hovers (Simple, Fast, Expert, Beast, back to Expert).
  {frame: S4.mode.hovers[0].frame, x: SIMPLE.x, y: SIMPLE.y, hover: 'menu-simple'},
  {frame: S4.mode.hovers[1].frame, x: FAST.x, y: FAST.y, hover: 'menu-fast'},
  {frame: S4.mode.hovers[2].frame, x: EXPERT.x, y: EXPERT.y, hover: 'menu-expert'},
  {frame: S4.mode.hovers[3].frame, x: BEAST.x, y: BEAST.y, hover: 'menu-beast'},
  {frame: S4.mode.hovers[4].frame, x: EXPERT_BACK.x, y: EXPERT_BACK.y, hover: 'menu-expert'},
  {frame: S4.mode.select.frame, x: EXPERT_BACK.x + 1, y: EXPERT_BACK.y, click: true, hover: 'menu-expert'},
  // To the "Review hires" toggle: arrives on the hover window (f1158), presses on f1166.
  {frame: S4.review.hover, x: REVIEW_TIP.x, y: REVIEW_TIP.y, hover: 'review'},
  {frame: S4.review.click, x: REVIEW_TIP.x + 3, y: REVIEW_TIP.y + 1, click: true, hover: 'review'},
  // Back down to the textarea: click, then the prompt types.
  {frame: S4.focus, x: TEXTAREA_TIP.x, y: TEXTAREA_TIP.y, click: true, hover: 'textarea'},
  // Over the Approve button of the Review card (the card is still scrolling up: the points are taken at the frame).
  // The tip is on the lower right of the button so the arrow hangs below it and "Approve & run" stays readable.
  {
    frame: APPROVE_HOVER_FRAME,
    x: Math.round(APPROVE_HOVER.x + APPROVE_HOVER.w * 0.9),
    y: Math.round(APPROVE_HOVER.y + 24),
    hover: 'approve',
  },
  {
    frame: S4.hire.approveClick,
    x: Math.round(APPROVE_CLICK.x + APPROVE_CLICK.w * 0.9),
    y: Math.round(APPROVE_CLICK.y + 24),
    click: true,
    hover: 'approve',
  },
  // Send turned into Pause: hover window f1256-1268, click f1262.
  {frame: f(1256), x: SEND_TIP.x, y: SEND_TIP.y, hover: 'send'},
  {frame: S4.pause.click, x: SEND_TIP.x + 3, y: SEND_TIP.y + 1, click: true, hover: 'send'},
  // Steps aside so the "Resume" label and the paused graph can be read, then comes back for the Resume click.
  {frame: f(1272), x: SEND_AWAY.x, y: SEND_AWAY.y, hover: 'paused-graph'},
  {frame: f(1284), x: SEND_TIP.x - 2, y: SEND_TIP.y, hover: 'send'},
  {frame: S4.pause.resume, x: SEND_TIP.x + 2, y: SEND_TIP.y + 1, click: true, hover: 'send'},
];

// ---------------------------------------------------------------------------------------------- overlay
const KEYCAP_UI = {x: Math.round(SEND.x + SEND.w / 2), y: Math.round(SEND.y - 8 - 28)};
/** The Approve callout freezes on the last known button position: the card collapses from f1246 and the button goes away. */
const APPROVE_LAST_FRAME = f(1252);
const MODES_ANCHOR_ROW = menuRow(2);

export const S4Control: React.FC<SceneOverlayProps> = ({frame}) => {
  const approve = anchorsAt(Math.min(frame, APPROVE_LAST_FRAME)).approveButton;

  return (
    <>
      <Caption {...CAPTIONS.control} startFrame={T.captionStart} endFrame={T.captionEnd} frame={frame} />
      <Callout
        text={CALLOUTS.modes}
        anchor={{x: MODES_ANCHOR_ROW.x + MODES_ANCHOR_ROW.w - 8, y: MODES_ANCHOR_ROW.y + MODES_ANCHOR_ROW.h / 2, space: 'ui'}}
        side="right"
        distance={96}
        startFrame={T.modesCalloutStart}
        endFrame={T.modesCalloutEnd}
        frame={frame}
      />
      <KeyCap startFrame={T.keyCapStart} at={{x: KEYCAP_UI.x, y: KEYCAP_UI.y, space: 'ui'}} frame={frame} />
      {approve ? (
        <Callout
          text={CALLOUTS.approveFirst}
          anchor={{x: approve.x + approve.w / 2, y: approve.y + approve.h, space: 'ui'}}
          side="bottom"
          distance={60}
          startFrame={T.approveCalloutStart}
          endFrame={T.approveCalloutEnd}
          frame={frame}
        />
      ) : null}
      <Callout
        text={CALLOUTS.pauseAnytime}
        anchor={{x: SEND.x + SEND.w / 2, y: SEND.y, space: 'ui'}}
        side="top"
        distance={84}
        startFrame={T.pauseCalloutStart}
        endFrame={T.pauseCalloutEnd}
        frame={frame}
      />
    </>
  );
};
