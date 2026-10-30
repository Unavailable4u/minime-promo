import React from 'react';
import {anchorsAt} from '../config/anchors';
import {cameraKey, type CameraKeyframe, type CursorWaypoint} from '../config/camera';
import {CALLOUTS, CAPTIONS} from '../config/copy';
import {S5} from '../config/script';
import {f} from '../config/timeline';
import {Callout} from '../fx/Callout';
import {Caption} from '../fx/Caption';
import {signatureEase} from '../lib/ease';
import {SHELL, shellLayout} from '../ui/shellLayout';
import type {SceneOverlayProps} from './sceneTypes';

/**
 * S5 — ORGANIZED (f1320-1499) — caption "Every chat, organized."
 * The app plays src/config/script.ts (S5); this file only adds camera, cursor and overlays.
 *
 * The Working Panel is still open at f1320 (S4 left it open) and closes at f1402 with the new chat, so the sidebar
 * shot sees a chat box of x 256..960 and the composer shot a chat box of x 256..1440.
 * Shots (frame = the frame the move STARTS):
 *   f1320 organizeSidebar   whip-pan left from controlWide (spring: 69% there after 8 f, settled before the f1334 click).
 *                           Search hover f1328, click f1334, "coffee" typed f1340-1356 with the live filter, clear
 *                           click f1384, new chat hover f1392, click f1398, the new row slides in f1400-1412, the chat
 *                           clears, the panel closes from f1402.
 *   f1408 organizeComposer  slow-start eased move (signature ease, 25 f) down to the composer: it barely moves for the
 *                           first 6 f, so the "New chat" callout stays glued to the sidebar, and it is settled at f1433.
 *                           Attach hover f1428, click f1434, the chip slides in f1436-1446, spinner, check f1456-1464.
 *   f1466 organizeComposer  a slow push-in (+7%) so the last 34 f never freeze. Nothing moves at f1500: S6 takes over.
 */

// ---------------------------------------------------------------------------------------------- timing
const T = {
  cameraSidebar: f(1320),
  cameraComposer: f(1408),
  cameraPush: f(1466),

  /** Rises with the whip-pan and leaves while the "coffee" filter is still on screen (about 2.4 s on screen). */
  captionStart: f(1320),
  captionEnd: f(1392),

  searchCalloutStart: f(1336),
  searchCalloutEnd: f(1380),
  newChatCalloutStart: f(1390),
  newChatCalloutEnd: f(1422),
  filesCalloutStart: f(1438),
  filesCalloutEnd: f(1486),
} as const;

export const S5_CAMERA: CameraKeyframe[] = [
  cameraKey(T.cameraSidebar, 'organizeSidebar', {padding: 72, rotateX: 0.8, rotateY: -2}),
  cameraKey(T.cameraComposer, 'organizeComposer', {padding: 72, rotateX: 0.4, rotateY: 1.5, ease: signatureEase}),
  cameraKey(T.cameraPush, 'organizeComposer', {padding: 72, scaleBias: 1.07, rotateX: 0.7, rotateY: -1.2}),
];

// ---------------------------------------------------------------------------------------------- cursor
// The cursor rests on the Pause / Resume button of S4 (about (902, 774) UI px) and sweeps across to the sidebar.
// Every position comes from anchorsAt() or shellLayout(), so it follows the layout. Hover ids match script.ts
// HOVER_WINDOWS (search, clear, new-chat, attach); `idle` is free-form.
const SEARCH = anchorsAt(S5.search.click).searchField;
const CLEAR = anchorsAt(S5.search.typing.start).searchClear;
const PLUS = anchorsAt(S5.newChat.click).newChatButton;
const ATTACH = anchorsAt(S5.attach.click).attachButton;
/** The chip once it has fully slid in (the layout is final from f1446). */
const CHIP_DONE = anchorsAt(S5.attach.appear + S5.attach.appearFrames).attachmentChip ?? {x: 272, y: 723, w: 132, h: 22};

/** Right part of the search field: the typed text grows from the left and never reaches it. */
const SEARCH_TIP = {x: Math.round(SEARCH.x + SEARCH.w * 0.62), y: Math.round(SEARCH.y + SEARCH.h * 0.55)};
const CLEAR_TIP = {x: Math.round(CLEAR.x + CLEAR.w * 0.5), y: Math.round(CLEAR.y + CLEAR.h * 0.5)};
/** Left half of the "+" button: the arrow body hangs down and to the right, away from the folder icon. */
const PLUS_TIP = {x: Math.round(PLUS.x + PLUS.w * 0.4), y: Math.round(PLUS.y + PLUS.h * 0.45)};
const ATTACH_TIP = {x: Math.round(ATTACH.x + ATTACH.w * 0.5), y: Math.round(ATTACH.y + ATTACH.h * 0.42)};
/** After the upload the hand moves off the button into the empty chat, clear of the "Drop in files" chip (UI x 441..540, y 722..746). */
const REST_TIP = {x: Math.round(ATTACH.x + 350), y: Math.round(ATTACH.y - 150)};

export const S5_CURSOR: CursorWaypoint[] = [
  // Arrives on the search field with the hover window (f1328), presses it on f1334 (focus ring, caret).
  {frame: S5.search.hover, x: SEARCH_TIP.x, y: SEARCH_TIP.y, hover: 'search'},
  {frame: S5.search.click, x: SEARCH_TIP.x + 2, y: SEARCH_TIP.y + 1, click: true, hover: 'search'},
  // Over the (x) for the hover window f1380-1390, click on f1384 (the query clears, the hidden rows slide back).
  {frame: f(1380), x: CLEAR_TIP.x, y: CLEAR_TIP.y, hover: 'clear'},
  {frame: S5.search.clear, x: CLEAR_TIP.x + 1, y: CLEAR_TIP.y + 1, click: true, hover: 'clear'},
  // The "+" new-chat button: hover window f1392-1404, click on f1398.
  {frame: S5.newChat.hover, x: PLUS_TIP.x, y: PLUS_TIP.y, hover: 'new-chat'},
  {frame: S5.newChat.click, x: PLUS_TIP.x + 1, y: PLUS_TIP.y + 1, click: true, hover: 'new-chat'},
  // Straight down the sidebar edge to the Paperclip while the camera follows: hover f1428-1440, click on f1434.
  {frame: S5.attach.hover, x: ATTACH_TIP.x, y: ATTACH_TIP.y, hover: 'attach'},
  {frame: S5.attach.click, x: ATTACH_TIP.x + 2, y: ATTACH_TIP.y + 1, click: true, hover: 'attach'},
  // Stays on the button until the chip has slid in (f1446), then glides off (f1447-1470) so the spinner and the check can be read.
  {frame: f(1470), x: REST_TIP.x, y: REST_TIP.y, hover: 'idle'},
];

// ---------------------------------------------------------------------------------------------- overlay
/** 24 px lower than the default 104: with the sidebar shot at zoom 1.60 the caption then clears the dim "Working..." line of the S4 chat. */
const CAPTION_BOTTOM = 80;

// Callout anchors are UI logical points: the callouts follow the camera.
const LIST_TOP = shellLayout().sidebarListTop;
/** Right edge of the first sidebar row: where the new "New Chat" row slides in at f1400. */
const NEW_ROW_DOT = {x: SHELL.sidebarW - 12, y: Math.round(LIST_TOP + SHELL.sidebarRowH / 2)};
const SEARCH_DOT = {x: Math.round(SEARCH.x + SEARCH.w - 2), y: Math.round(SEARCH.y + SEARCH.h / 2)};
const CHIP_DOT = {x: Math.round(CHIP_DONE.x + CHIP_DONE.w - 4), y: Math.round(CHIP_DONE.y + CHIP_DONE.h / 2)};

export const S5Organized: React.FC<SceneOverlayProps> = ({frame}) => (
  <>
    <Caption {...CAPTIONS.organized} startFrame={T.captionStart} endFrame={T.captionEnd} bottom={CAPTION_BOTTOM} frame={frame} />
    <Callout
      text={CALLOUTS.searchEverything}
      anchor={{x: SEARCH_DOT.x, y: SEARCH_DOT.y, space: 'ui'}}
      side="right"
      distance={96}
      startFrame={T.searchCalloutStart}
      endFrame={T.searchCalloutEnd}
      frame={frame}
    />
    <Callout
      text={CALLOUTS.newChat}
      anchor={{x: NEW_ROW_DOT.x, y: NEW_ROW_DOT.y, space: 'ui'}}
      side="right"
      distance={96}
      startFrame={T.newChatCalloutStart}
      endFrame={T.newChatCalloutEnd}
      frame={frame}
    />
    <Callout
      text={CALLOUTS.dropFiles}
      anchor={{x: CHIP_DOT.x, y: CHIP_DOT.y, space: 'ui'}}
      side="right"
      distance={96}
      startFrame={T.filesCalloutStart}
      endFrame={T.filesCalloutEnd}
      frame={frame}
    />
  </>
);
