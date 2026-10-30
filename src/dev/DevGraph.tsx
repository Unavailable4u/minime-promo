import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {GraphNodeId} from '../config/graphLayout';
import {FONTS, NEUTRAL, SURFACE} from '../config/theme';
import {f} from '../config/timeline';
import {FontsReady} from '../lib/fonts';
import {PANEL} from '../ui/panelLayout';
import {graphStateAt, type EdgeSchedule, type NodeSchedule} from '../ui/graphState';
import {RoutingGraph} from '../ui/RoutingGraph';

/**
 * DEV ONLY (patch 06): grows the whole routing graph over 240 frames, including the worker-pool decision node
 * and the amber recheck edge. Not part of the film.
 *   npx remotion still src/index.ts DevGraph out/qa/graph-0.png --frame=30
 * Left: the graph at 2x (to inspect it). Right: the graph at 1:1 in its real 456 x 288 panel slot.
 * The beats mirror scene S3 (brief section 9), compressed into 240 frames.
 */
export const DEV_GRAPH_FRAMES = 240;

const NODES: Partial<Record<GraphNodeId, NodeSchedule>> = {
  input: {appear: f(4), phases: [{frame: f(8), status: 'done'}]},
  inspector: {
    appear: f(16),
    phases: [
      {frame: f(22), status: 'running'},
      {frame: f(46), status: 'done'},
    ],
  },
  strategist: {
    appear: f(48),
    phases: [
      {frame: f(54), status: 'running'},
      {frame: f(80), status: 'done'},
    ],
  },
  market_researcher: {
    appear: f(84),
    phases: [
      {frame: f(90), status: 'running'},
      {frame: f(130), status: 'done'},
    ],
  },
  code_writer: {
    appear: f(84),
    phases: [
      {frame: f(90), status: 'running'},
      {frame: f(140), status: 'done'},
      {frame: f(196), status: 'running'}, // re-run after the recheck
      {frame: f(214), status: 'done'},
    ],
  },
  pool: {appear: f(92), phases: [{frame: f(92), status: 'done'}]},
  test_writer: {
    appear: f(142),
    phases: [
      {frame: f(148), status: 'running'},
      {frame: f(164), status: 'done'},
    ],
  },
  verifier: {
    appear: f(166),
    phases: [
      {frame: f(170), status: 'running'},
      {frame: f(182), status: 'error'},
      {frame: f(216), status: 'running'}, // second pass
      {frame: f(228), status: 'done'},
    ],
  },
  documentation_writer: {
    appear: f(168),
    phases: [
      {frame: f(174), status: 'running'},
      {frame: f(212), status: 'done'},
    ],
  },
  output: {appear: f(222), phases: [{frame: f(230), status: 'done'}]},
};

const EDGES: Partial<Record<string, EdgeSchedule>> = {
  'input>inspector': {start: f(14)},
  'inspector>strategist': {start: f(46)},
  'strategist>market_researcher': {start: f(80)},
  'strategist>code_writer': {start: f(80)},
  'pool>code_writer': {start: f(96)},
  'code_writer>test_writer': {start: f(140)},
  'test_writer>verifier': {start: f(164)},
  'market_researcher>documentation_writer': {start: f(130)},
  'verifier>code_writer': {start: f(184), flowTo: f(214)},
  'verifier>output': {start: f(226)},
  'documentation_writer>output': {start: f(214)},
};

const phaseName = (frame: number): string => {
  if (frame < f(14)) return 'Input';
  if (frame < f(46)) return 'Inspector reads the task';
  if (frame < f(84)) return 'strategist';
  if (frame < f(142)) return 'researcher || code_writer + worker pool';
  if (frame < f(166)) return 'test_writer';
  if (frame < f(184)) return 'verifier finds the missing rate limit';
  if (frame < f(216)) return 'amber recheck edge, code_writer re-runs';
  if (frame < f(222)) return 'verifier passes';
  return 'Output lights up';
};

export const DevGraph: React.FC = () => {
  const frame = useCurrentFrame();
  const state = graphStateAt(frame, NODES, EDGES);
  const slotW = 456;
  const slotH = PANEL.graphH;
  return (
    <FontsReady>
      <AbsoluteFill style={{background: SURFACE.stageGradient}}>
        <div style={{position: 'absolute', left: 96, top: 150, width: slotW, height: slotH, transform: 'scale(2.2)', transformOrigin: '0 0'}}>
          <RoutingGraph frame={frame} nodes={state.nodes} edges={state.edges} />
        </div>
        <div style={{position: 'absolute', left: 1180, top: 150, width: slotW, height: slotH}}>
          <RoutingGraph frame={frame} nodes={state.nodes} edges={state.edges} />
        </div>
        <div style={{position: 'absolute', left: 1180, top: 130, fontFamily: FONTS.mono, fontSize: 12, color: NEUTRAL[500]}}>
          1:1 in the Working Panel slot ({slotW} x {slotH})
        </div>
        <div style={{position: 'absolute', left: 24, top: 24, fontFamily: FONTS.mono, fontSize: 14, color: NEUTRAL[400]}}>
          DevGraph · frame {frame} · {phaseName(frame)}
        </div>
      </AbsoluteFill>
    </FontsReady>
  );
};
