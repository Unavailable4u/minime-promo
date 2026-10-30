/**
 * MiniMe promo — routing graph state helpers (patch 06).
 *
 * Turn a simple SCHEDULE (frame numbers authored with f()/sec()/beat()) into the props of <RoutingGraph/>:
 * a node's spring entry, its status changes with the ring draw-on, an edge's draw-on and particle window.
 * Patch 07's script builds its graph states with these, so the graph grows from data.
 */
import {FPS, f} from '../config/timeline';
import type {GraphNodeId} from '../config/graphLayout';
import {GRAPH_EDGES, GRAPH_NODE_ORDER} from '../config/graphLayout';
import {ramp} from '../lib/ease';
import {spr} from '../lib/spring';
import type {GraphEdgeState, GraphNodeState, GraphNodeStatus, RoutingGraphProps} from './RoutingGraph';

/** Frames the ring of a finishing (done / error) node needs to draw on. */
export const GRAPH_RING_DRAW_FRAMES = f(12);
/** Frames the ring of a node that starts running needs to draw on. */
export const GRAPH_RING_START_FRAMES = f(8);
/** Frames an edge needs to draw from source to target. */
export const GRAPH_EDGE_DRAW_FRAMES = f(14);
/** Frames the particles of an edge fade in / out. */
export const GRAPH_FLOW_FADE_FRAMES = f(8);

export type StatusPhase = {frame: number; status: GraphNodeStatus};

export type NodeSchedule = {
  /** Frame the node starts to pop in (spring `uiPop`, travelling out of its parent). */
  appear: number;
  /** Status changes in time order. Before the first phase the node is `pending`. A status may repeat (re-run). */
  phases?: readonly StatusPhase[];
};

export type EdgeSchedule = {
  /** Frame the line starts to draw. */
  start: number;
  drawFrames?: number;
  /** Frame the particles start (default: when the line has arrived). */
  flowFrom?: number;
  /** Frame the particles fade out (default: they never stop). */
  flowTo?: number;
};

/** State of one node at `frame`, or undefined while it has not appeared yet. */
export const nodeStateAt = (frame: number, schedule: NodeSchedule): GraphNodeState | undefined => {
  if (frame <= schedule.appear) {
    return undefined;
  }
  const appear = spr(frame, FPS, schedule.appear, 'uiPop');
  const phases = schedule.phases ?? [];
  let index = -1;
  for (let i = 0; i < phases.length; i++) {
    if (phases[i].frame <= frame) {
      index = i;
    }
  }
  if (index < 0) {
    return {appear, status: 'pending', ring: 1};
  }
  const phase = phases[index];
  const previous: GraphNodeStatus = index > 0 ? phases[index - 1].status : 'pending';
  if (phase.status === 'pending') {
    return {appear, status: 'pending', ring: 1};
  }
  const drawFrames =
    phase.status === 'done' || phase.status === 'error' ? GRAPH_RING_DRAW_FRAMES : GRAPH_RING_START_FRAMES;
  const ring = ramp(frame, phase.frame, phase.frame + drawFrames);
  return {appear, status: phase.status, ring, fromStatus: ring < 1 ? previous : undefined};
};

/** State of one edge at `frame`, or undefined before it starts. */
export const edgeStateAt = (frame: number, schedule: EdgeSchedule): GraphEdgeState | undefined => {
  if (frame < schedule.start) {
    return undefined;
  }
  const draw = schedule.drawFrames ?? GRAPH_EDGE_DRAW_FRAMES;
  const appear = ramp(frame, schedule.start, schedule.start + draw);
  const flowFrom = schedule.flowFrom ?? schedule.start + draw;
  let flow = ramp(frame, flowFrom, flowFrom + GRAPH_FLOW_FADE_FRAMES);
  if (schedule.flowTo !== undefined) {
    flow *= 1 - ramp(frame, schedule.flowTo, schedule.flowTo + GRAPH_FLOW_FADE_FRAMES);
  }
  return {appear, flow};
};

/** All node and edge states of a whole graph schedule at `frame`, ready for <RoutingGraph nodes edges />. */
export const graphStateAt = (
  frame: number,
  nodeSchedules: Partial<Record<GraphNodeId, NodeSchedule>>,
  edgeSchedules: Partial<Record<string, EdgeSchedule>>,
): Pick<RoutingGraphProps, 'nodes' | 'edges'> => {
  const nodes: RoutingGraphProps['nodes'] = {};
  for (const id of GRAPH_NODE_ORDER) {
    const schedule = nodeSchedules[id];
    const state = schedule ? nodeStateAt(frame, schedule) : undefined;
    if (state) {
      nodes[id] = state;
    }
  }
  const edges: RoutingGraphProps['edges'] = {};
  for (const def of GRAPH_EDGES) {
    const schedule = edgeSchedules[def.id];
    const state = schedule ? edgeStateAt(frame, schedule) : undefined;
    if (state) {
      edges[def.id] = state;
    }
  }
  return {nodes, edges};
};
