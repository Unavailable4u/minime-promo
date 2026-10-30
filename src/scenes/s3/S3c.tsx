import React from 'react';
import {anchorsAt} from '../../config/anchors';
import {cameraKey, type CameraKeyframe, type CursorWaypoint} from '../../config/camera';
import {CALLOUTS, UI_TEXT} from '../../config/copy';
import {S3} from '../../config/script';
import {f} from '../../config/timeline';
import {Callout} from '../../fx/Callout';
import {useCameraState} from '../../fx/Camera';
import {projectUiPoint} from '../../fx/cameraMath';
import {estimateTextWidth} from '../../fx/fxUtils';
import {StatChip} from '../../fx/StatChip';
import {Toast} from '../../fx/Toast';
import type {SceneOverlayProps} from '../sceneTypes';

/**
 * S3 part C (f916-1079) — the final answer, the stat chip and the save-template toast.
 *
 * The app plays src/config/script.ts (S3): the Output node lights at f916, the Tier 3 answer streams f916-f1030 (H2,
 * intro, ordered list, pricing table row by row, code block with live colours, blockquote), the elapsed counter lands
 * on 41s, "Save as template" is hovered f1046 and clicked f1056. This file only adds camera, cursor and overlays.
 *
 * Shots (frame = the frame the move STARTS; the camera spring settles about 25 f later):
 *   f916  hold the two-column pull-back of S3b so the Output bloom (S3b, f916-946) is seen
 *   f924  answerStream  Z 1.80 -> chat 25 px, table 21.6 px, code 22.5 px (the newest text always sits in this band)
 *   f958  answerStream  slow push + orbit, f992 orbit back (the stream is the motion, the camera only breathes)
 *   f1030 teamSave      Z 1.96 -> panel text 23.5 px; the answer is complete, the camera pans to routing card,
 *                       "Save as template" and the whole graph
 *   f1064 teamTwoColumn pull-back; it is still settling when S4 starts its own move at f1080
 *
 * Overlays: stat chip (f1030, counts up, leaves on the f1080 beat), callout "Every step traced" on the graph,
 * toast "Saved as workflow template" next to the Save row (life 40 f from S3.save.toast).
 */

// ---------------------------------------------------------------------------------------------- timing
const T = {
  /** The two-column shot of S3b is still settled here; the push to the answer starts a few frames after the bloom. */
  cameraAnswer: f(924),
  cameraOrbitA: f(958),
  cameraOrbitB: f(992),
  /** The answer is complete at S3.answer.end: now the camera may leave the chat. */
  cameraPanel: S3.answer.end,
  cameraBack: f(1064),

  /** Starts while the pan to the panel is still travelling; the exit (10 f) begins at f1066, after the click. */
  calloutStart: f(1034),
  calloutEnd: f(1076),

  /** The chip counts up from S3.stat.from and stays through the hand-off, wiping out on the f1080 beat. */
  chipStart: S3.stat.from,
  chipEnd: f(1090),
  chipCountFrames: 22,
} as const;

export const S3C_CAMERA: CameraKeyframe[] = [
  cameraKey(T.cameraAnswer, 'answerStream', {padding: 72, scaleBias: 1, rotateX: 0, rotateY: 1.5}),
  cameraKey(T.cameraOrbitA, 'answerStream', {padding: 72, scaleBias: 1.06, rotateX: 0.4, rotateY: -0.6}),
  cameraKey(T.cameraOrbitB, 'answerStream', {padding: 72, scaleBias: 1.02, rotateX: -0.2, rotateY: 1.2}),
  cameraKey(T.cameraPanel, 'teamSave', {padding: 72, scaleBias: 0.9, rotateX: 0.5, rotateY: -2}),
  cameraKey(T.cameraBack, 'teamTwoColumn', {padding: 72, rotateX: 0, rotateY: 0.5}),
];

// ---------------------------------------------------------------------------------------------- cursor
// The cursor rests on the verifier card from S3b (about (1232, 685), off screen while the camera is on the chat).
// It leaves in time to arrive over the Save row on S3.save.hover (the travel takes up to 36 f), then presses it.
// The arrow's tip goes on the BOTTOM edge of the row (still inside it, so the hover and press states fire) and the
// arrow hangs down into the gap above the graph card: the label "Save as template" stays readable at the click.
const SAVE = anchorsAt(S3.save.hover).saveTemplate;
const SAVE_TIP_Y = Math.round(SAVE.y + SAVE.h - 3);

export const S3C_CURSOR: CursorWaypoint[] = [
  {frame: S3.save.hover, x: SAVE.x + 56, y: SAVE_TIP_Y, hover: 'save'},
  {frame: S3.save.click, x: SAVE.x + 62, y: SAVE_TIP_Y, click: true, hover: 'save'},
];

// ---------------------------------------------------------------------------------------------- overlay
/**
 * The stat chip lives in the dimmed chat strip left of the panel (top), together with the toast (at the height of the
 * Save row) and the callout (at the height of the graph): every annotation sits on the chat side and none of them
 * covers the panel, the graph or the step cards they talk about. Stage px; the strip is x 0..690 once the pan settles.
 */
const CHIP = {x: 350, y: 120, fontSize: 24} as const;

/** Toast: same width formula as fx/Toast.tsx, used to put its right edge a fixed gap left of the Working Panel. */
const TOAST_FONT = 26;
const TOAST_GAP = 28;
const toastWidth = (text: string, fontSize: number): number => {
  const icon = Math.round(fontSize * 1.15);
  const padX = Math.round(fontSize * 0.75);
  return estimateTextWidth(text, fontSize, 0.55) + icon + 14 + padX * 2;
};

/** The toast sits left of the panel at the height of the Save row, so it never covers the row or the graph. */
const SaveToast: React.FC<{frame: number}> = ({frame}) => {
  const camera = useCameraState();
  const save = anchorsAt(frame).saveTemplate;
  const edge = projectUiPoint(camera, 960, save.y + save.h / 2);
  const x = edge.x - TOAST_GAP - toastWidth(UI_TEXT.toastSavedTemplate, TOAST_FONT) / 2;
  return <Toast startFrame={S3.save.toast} x={x} y={edge.y} fontSize={TOAST_FONT} frame={frame} />;
};

export const S3c: React.FC<SceneOverlayProps> = ({frame}) => (
  <>
    <StatChip
      startFrame={T.chipStart}
      endFrame={T.chipEnd}
      countFrames={T.chipCountFrames}
      x={CHIP.x}
      y={CHIP.y}
      fontSize={CHIP.fontSize}
      frame={frame}
    />
    <Callout
      text={CALLOUTS.everyStepTraced}
      anchor="graph"
      side="left"
      distance={96}
      startFrame={T.calloutStart}
      endFrame={T.calloutEnd}
      frame={frame}
    />
    <SaveToast frame={frame} />
  </>
);
