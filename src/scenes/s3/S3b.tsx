import React from 'react';
import {appStateAt} from '../../config/appState';
import {cameraKey, type CameraKeyframe, type CursorWaypoint} from '../../config/camera';
import {CALLOUTS} from '../../config/copy';
import {GRAPH, GRAPH_NODES} from '../../config/graphLayout';
import {f} from '../../config/timeline';
import {Callout} from '../../fx/Callout';
import {Glow} from '../../fx/Glow';
import {PANEL, panelLayout} from '../../ui/panelLayout';
import {graphFit} from '../../ui/RoutingGraph';
import {stepCardHeight} from '../../ui/StepCard';
import type {SceneOverlayProps} from '../sceneTypes';

/**
 * S3 part B (f690-915) — the team run and the recheck.
 * Strategist, then market_researcher and code_writer in parallel (worker-pool decision at f728), test_writer,
 * the verifier flags the missing rate limit (f856), the amber edge sends the work back, code_writer re-runs,
 * documentation_writer finishes, the verifier passes, the Output node lights at f916.
 * The app plays src/config/script.ts (S3); this file only adds camera, cursor and overlays.
 * Part C (s3/S3c.tsx) takes over the camera after f916.
 *
 * Zoom (1080p; panel text 12 px, graph labels 11 graph units = 11.4 px, chat text 14 px):
 *   teamRun 2.23 -> 26.8 / 25.4 px | teamGraph 2.21 -> 26.5 / 25 px, pushing to 2.4 (the camera maximum) at f786
 *   teamRecheck 1.82 -> 21.8 / 20.7 px | teamTwoColumn 1.46 -> 17.5 / 16.6 px (pull-back, a transition)
 */

// ---------------------------------------------------------------------------------------------- geometry
const GRAPH_SLOT = panelLayout().graph;
const FIT = graphFit(GRAPH_SLOT.w, GRAPH_SLOT.h);

/** A routing-graph node center in the UI's logical space (the graph slot of the panel, fully open). */
const graphNodeUi = (id: keyof typeof GRAPH_NODES): {x: number; y: number} => {
  const node = GRAPH_NODES[id];
  return {
    x: GRAPH_SLOT.x + FIT.offsetX + (node.x - GRAPH.viewBox.x) * FIT.scale,
    y: GRAPH_SLOT.y + FIT.offsetY + (node.y - GRAPH.viewBox.y) * FIT.scale,
  };
};

/**
 * Rectangle of a step card in the UI's logical space at `frame`, including expanded cards above it and the list's
 * scroll. `null` while the card does not exist yet. Reads the same app state the panel draws.
 */
const stepCardAt = (frame: number, key: string): {x: number; y: number; w: number; h: number} | null => {
  const panel = appStateAt(frame).panel;
  if (!panel) {
    return null;
  }
  const list = panelLayout().steps;
  let y = list.y - panel.stepsScrollY;
  for (const step of panel.steps) {
    const h = stepCardHeight({summary: step.summary, note: step.note, expand: step.expand}, list.w);
    if (step.key === key) {
      return {x: list.x, y, w: list.w, h};
    }
    y += h + PANEL.stepGap;
  }
  return null;
};

/** A collapsed step card's rectangle at a frame where nothing above it is expanded (cursor waypoints are static). */
const settledCard = (frame: number, key: string): {x: number; y: number; w: number; h: number} =>
  stepCardAt(frame, key) ?? {x: 0, y: 0, w: 0, h: 0};

// ---------------------------------------------------------------------------------------------- timing
/** The Output node lights (script.ts S3 graph: output appears f916). */
/** The last of the team finishes; the Output node appears on the next beat of the story. */
const OUTPUT_AT = f(916);

const T = {
  cameraRun: f(690),
  cameraGraph: f(736),
  cameraGraphPush: f(786),
  /** The push to the step list starts while test_writer finishes (f836), so it lands on the flag at f856. */
  cameraRecheck: f(830),
  /** Pull back so the two-column shot is settled when the Output node lights. */
  cameraTwoColumn: f(888),

  cursorStrategist: f(716),
  cursorVerifier: f(866),

  calloutStart: f(862),
  calloutEnd: f(892),

  /** Success bloom on the Output node. */
  bloomStart: OUTPUT_AT,
} as const;

export const S3B_CAMERA: CameraKeyframe[] = [
  cameraKey(T.cameraRun, 'teamRun', {padding: 72, rotateX: 0.5, rotateY: -2.5}),
  cameraKey(T.cameraGraph, 'teamGraph', {padding: 72, scaleBias: 0.78, rotateX: 0, rotateY: 1.5}),
  cameraKey(T.cameraGraphPush, 'teamGraph', {padding: 72, scaleBias: 0.86, rotateX: 0.8, rotateY: 0.2}),
  cameraKey(T.cameraRecheck, 'teamRecheck', {padding: 72, scaleBias: 1.05, rotateX: 0, rotateY: 1.5}),
  cameraKey(T.cameraTwoColumn, 'teamTwoColumn', {padding: 72, rotateX: 0, rotateY: 0.5}),
];

// The cursor continues from S3a (rests at about (1364, 644) from f670): it settles on the empty middle of the
// strategist card (clear of the name on the left and "done · 3604ms" on the right), then follows the verifier card.
const STRATEGIST = settledCard(T.cursorStrategist, 'strategist');
const VERIFIER_FINAL = settledCard(T.cursorVerifier + f(8), 'verifier');

export const S3B_CURSOR: CursorWaypoint[] = [
  {frame: T.cursorStrategist, x: STRATEGIST.x + 260, y: STRATEGIST.y + STRATEGIST.h / 2, hover: 'step-strategist'},
  {frame: T.cursorVerifier, x: VERIFIER_FINAL.x + 260, y: VERIFIER_FINAL.y + 17, hover: 'step-verifier'},
];

const OUTPUT_UI = graphNodeUi('output');

export const S3b: React.FC<SceneOverlayProps> = ({frame}) => {
  // The callout chip sits to the LEFT of the verifier card, over the empty lower part of the chat column.
  const card = frame >= T.calloutStart && frame <= T.calloutEnd ? stepCardAt(frame, 'verifier') : null;

  return (
    <>
      {card ? (
        <Callout
          text={CALLOUTS.verifierSendsBack}
          anchor={{x: card.x + 10, y: card.y + 17, space: 'ui'}}
          side="left"
          distance={96}
          startFrame={T.calloutStart}
          endFrame={T.calloutEnd}
          frame={frame}
        />
      ) : null}
      <Glow
        startFrame={T.bloomStart}
        at={{x: OUTPUT_UI.x, y: OUTPUT_UI.y, space: 'ui'}}
        size={380}
        intensity={0.75}
        frames={30}
        frame={frame}
      />
    </>
  );
};
