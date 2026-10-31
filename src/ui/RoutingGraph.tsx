import React, {useId} from 'react';
import {useCurrentFrame} from 'remotion';
import {GRAPH_TEXT} from '../config/copy';
import {
  GRAPH,
  GRAPH_EDGES,
  GRAPH_NODES,
  GRAPH_NODE_ORDER,
  edgeColor,
  edgeCurve,
  edgeIsDashed,
  edgeWidth,
  nodeParent,
  quadLength,
  quadPath,
  quadTangent,
  type GraphEdgeDef,
  type GraphNodeDef,
  type GraphNodeId,
  type Pt,
} from '../config/graphLayout';
import {EDGE_COLORS, FONTS, NEUTRAL, STATUS} from '../config/theme';
import {clamp01, mapRange} from '../lib/ease';
import {withAlpha} from '../lib/color';
import {createRng, hashString} from '../lib/prng';
import {Emoji} from './Emoji';
import {panelLayout} from './panelLayout';

/**
 * MiniMe promo — routing graph (patch 06).
 *
 * An SVG re-creation of the real app's canvas graph (brief §6.4 item 6). It is a dumb component: the caller
 * passes, per node and per edge, how far it has appeared, its status and its ring progress (see
 * src/ui/graphState.ts for helpers that compute those from a schedule). The only thing read from `frame`
 * is decoration: the running pulse and the seeded wobble (at most 3 px).
 *
 * Layout: a card (rounded 8, border #262626, bg #0a0a0a) that fills its parent (the 456 x 288 slot of the
 * Working Panel), the graph on top and a two-row legend strip at the bottom.
 */

export type GraphNodeStatus = 'done' | 'running' | 'error' | 'paused' | 'pending' | 'awaiting';

export type GraphNodeState = {
  /** 0..1 entry progress (use a spring; overshoot above 1 is fine). 0 = not drawn. */
  appear: number;
  status: GraphNodeStatus;
  /** 0..1 draw-on progress of the status ring. Default 1. */
  ring?: number;
  /** While `ring` < 1: the status the ring is changing FROM (drawn full underneath). */
  fromStatus?: GraphNodeStatus;
  /** 0..1 strength of the glow/pulse of a running, paused or awaiting node. Default 1. */
  pulse?: number;
};

export type GraphEdgeState = {
  /** 0..1 draw-on progress of the line. 0 = not drawn. */
  appear: number;
  /** 0..1 strength of the amber halo of a recheck edge (0 = none). Default 1. */
  flow?: number;
};

export type RoutingGraphProps = {
  /** Frame used for the pulse and the wobble. Default: the current frame. */
  frame?: number;
  nodes: Partial<Record<GraphNodeId, GraphNodeState>>;
  /** Keyed by edge id (`from>to`, for example `verifier>code_writer`). */
  edges: Partial<Record<string, GraphEdgeState>>;
  /** 0..1 opacity of the legend strip. Default 1. */
  legend?: number;
  /** Wobble amplitude in graph units, clamped to 3. Default GRAPH.wobbleAmplitude. */
  wobble?: number;
  style?: React.CSSProperties;
};

// ------------------------------------------------------------------ geometry fit
/** Graph units -> slot px: the graph (cropped to GRAPH.viewBox) is fitted into the area above the legend. */
export const graphFit = (width: number, height: number): {scale: number; offsetX: number; offsetY: number} => {
  const areaH = height - GRAPH.legendH;
  const scale = Math.min(width / GRAPH.viewBox.w, areaH / GRAPH.viewBox.h);
  return {
    scale,
    offsetX: (width - GRAPH.viewBox.w * scale) / 2,
    offsetY: (areaH - GRAPH.viewBox.h * scale) / 2,
  };
};

/**
 * Where a node's CENTER is in the UI's logical 1440x810 space (Working Panel open, wobble ignored).
 * Use it for callout anchors and cursor targets.
 */
export const graphNodeUiPoint = (id: GraphNodeId): Pt => {
  const slot = panelLayout().graph;
  const fit = graphFit(slot.w, slot.h);
  const node = GRAPH_NODES[id];
  return {
    x: slot.x + fit.offsetX + (node.x - GRAPH.viewBox.x) * fit.scale,
    y: slot.y + fit.offsetY + (node.y - GRAPH.viewBox.y) * fit.scale,
  };
};

// ------------------------------------------------------------------------ looks
const fillAlphaFor = (status: GraphNodeStatus): number =>
  status === 'pending' ? GRAPH.fillAlpha.pending : status === 'running' ? GRAPH.fillAlpha.running : GRAPH.fillAlpha.default;

const statusColor = (status: GraphNodeStatus): string => STATUS[status];

const TAU = Math.PI * 2;

/** Smooth seeded wobble of one node, never larger than `amplitude` on either axis. */
const wobbleOf = (id: string, frame: number, amplitude: number): Pt => {
  const rng = createRng(hashString(id));
  const p = Array.from({length: 8}, () => rng());
  const wave = (periodA: number, periodB: number, phaseA: number, phaseB: number): number =>
    0.62 * Math.sin(TAU * (frame / periodA + phaseA)) + 0.38 * Math.sin(TAU * (frame / periodB + phaseB));
  return {
    x: amplitude * wave(88 + p[0] * 40, 51 + p[1] * 20, p[2], p[3]),
    y: amplitude * wave(79 + p[4] * 40, 47 + p[5] * 20, p[6], p[7]),
  };
};

/** Soft 0..1 oscillation (period about 42 frames, phase per node). */
const pulseOf = (id: string, frame: number): number => {
  const phase = (hashString(`pulse:${id}`) % 1000) / 1000;
  return 0.5 + 0.5 * Math.sin(TAU * (frame / 42 + phase));
};


const safeId = (text: string): string => text.replace(/[^a-zA-Z0-9]/g, '_');

// ------------------------------------------------------------------- status ring
const Ring: React.FC<{
  radius: number;
  status: GraphNodeStatus;
  progress: number;
  frame: number;
  osc: number;
  pulse: number;
}> = ({radius, status, progress, frame, osc, pulse}) => {
  const width = GRAPH.ringWidth;
  const color = statusColor(status);
  if (status === 'pending') {
    return <circle r={radius} fill="none" stroke={color} strokeWidth={width} strokeDasharray="2 2" opacity={progress} />;
  }
  if (status === 'paused' || status === 'awaiting') {
    const beat = 1 - pulse * 0.45 * (1 - osc);
    return (
      <circle
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray="3 2.2"
        strokeDashoffset={-frame * 0.12}
        opacity={beat * progress}
      />
    );
  }
  const strokeOpacity = status === 'running' ? 1 - pulse * 0.3 * (1 - osc) : 1;
  if (progress >= 0.999) {
    return <circle r={radius} fill="none" stroke={color} strokeWidth={width} opacity={strokeOpacity} />;
  }
  if (progress <= 0.001) {
    return null;
  }
  return (
    <circle
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth={width}
      pathLength={1}
      strokeDasharray="1 2"
      strokeDashoffset={1 - progress}
      transform="rotate(-90)"
      opacity={strokeOpacity}
    />
  );
};

// -------------------------------------------------------------------------- node
type ResolvedNode = {
  def: GraphNodeDef;
  state: GraphNodeState;
  /** Current center (entry travel + wobble). */
  pos: Pt;
  scale: number;
};

const resolveNodes = (
  nodes: RoutingGraphProps['nodes'],
  frame: number,
  amplitude: number,
): Partial<Record<GraphNodeId, ResolvedNode>> => {
  const out: Partial<Record<GraphNodeId, ResolvedNode>> = {};
  for (const id of GRAPH_NODE_ORDER) {
    const state = nodes[id];
    if (!state || state.appear <= 0.001) {
      continue;
    }
    const def = GRAPH_NODES[id];
    const parentId = nodeParent(id);
    const parentDef = parentId && nodes[parentId] ? GRAPH_NODES[parentId] : def;
    const wob = wobbleOf(id, frame, def.kind === 'endpoint' ? amplitude * 0.5 : amplitude);
    const k = state.appear;
    out[id] = {
      def,
      state,
      pos: {
        x: parentDef.x + (def.x - parentDef.x) * k + wob.x,
        y: parentDef.y + (def.y - parentDef.y) * k + wob.y,
      },
      scale: Math.min(1.08, 0.5 + 0.5 * k),
    };
  }
  return out;
};

const NodeGlyph: React.FC<{node: ResolvedNode; frame: number; gradients: Record<string, string>}> = ({node, frame, gradients}) => {
  const {def, state, pos, scale} = node;
  const ringP = clamp01(state.ring ?? 1);
  const pulse = clamp01(state.pulse ?? 1);
  const osc = pulseOf(def.id, frame);
  const r = def.radius;
  const status = state.status;
  const from = state.fromStatus;
  const opacity = clamp01(state.appear * 2.2);

  // fill / emoji cross-fade from the previous status look to the new one while the ring draws on
  const alphaTo = fillAlphaFor(status);
  const alphaFrom = from && ringP < 1 ? fillAlphaFor(from) : alphaTo;
  const fillAlpha = alphaFrom + (alphaTo - alphaFrom) * ringP;
  const emojiTo = status === 'pending' ? 0.55 : 1;
  const emojiFrom = from && ringP < 1 ? (from === 'pending' ? 0.55 : 1) : emojiTo;
  const emojiOpacity = emojiFrom + (emojiTo - emojiFrom) * ringP;

  // glow: running and paused nodes breathe; a finishing node gets one soft green bloom while its ring draws
  let glowKey: string | null = null;
  let glowOpacity = 0;
  if (status === 'running') {
    glowKey = 'running';
    glowOpacity = pulse * (0.38 + 0.3 * osc);
  } else if (status === 'paused' || status === 'awaiting') {
    glowKey = 'paused';
    glowOpacity = pulse * (0.22 + 0.28 * osc);
  } else if (status === 'done' && ringP < 1) {
    glowKey = 'done';
    glowOpacity = 0.7 * Math.sin(Math.PI * ringP);
  }

  const ringRadius = r + GRAPH.ringGap + GRAPH.ringWidth / 2;

  if (def.kind === 'decision') {
    return (
      <g transform={`translate(${pos.x} ${pos.y}) scale(${scale})`} opacity={opacity}>
        <circle r={r} fill={withAlpha(def.color, 0.45)} />
        <circle r={ringRadius} fill="none" stroke={def.color} strokeWidth={GRAPH.ringWidth} strokeDasharray="2 2" />
        <path
          d="M 0 3.1 V 0.5 M 0 0.5 L -2.4 -2.6 M 0 0.5 L 2.4 -2.6"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  }

  const emojiSize = r * GRAPH.emojiScale;
  return (
    <g transform={`translate(${pos.x} ${pos.y}) scale(${scale})`} opacity={opacity}>
      {glowKey ? <circle r={r * 3.3} fill={`url(#${gradients[glowKey]})`} opacity={clamp01(glowOpacity)} /> : null}
      <circle r={r} fill={withAlpha(def.color, fillAlpha)} />
      {from && ringP < 1 ? (
        <Ring radius={ringRadius} status={from} progress={1} frame={frame} osc={osc} pulse={pulse} />
      ) : null}
      <Ring radius={ringRadius} status={status} progress={from && ringP < 1 ? ringP : status === 'pending' ? 1 : ringP} frame={frame} osc={osc} pulse={pulse} />
      {def.emoji ? (
        <foreignObject x={-emojiSize / 2} y={-emojiSize / 2} width={emojiSize} height={emojiSize} style={{overflow: 'visible'}}>
          <div style={{width: emojiSize, height: emojiSize, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: emojiOpacity}}>
            <Emoji emoji={def.emoji} size={emojiSize} style={{display: 'block'}} />
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
};

const NodeLabel: React.FC<{node: ResolvedNode}> = ({node}) => {
  const {def, state, pos} = node;
  const endpoint = def.kind === 'endpoint';
  const r = def.radius + GRAPH.ringWidth;
  let x = pos.x;
  let y = pos.y;
  let anchor: 'middle' | 'start' = 'middle';
  if (def.labelSide === 'below') {
    y = pos.y + r + 11;
  } else if (def.labelSide === 'above') {
    y = pos.y - r - 4;
  } else {
    x = pos.x + r + 5;
    y = pos.y + 4;
    anchor = 'start';
  }
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily={FONTS.body}
      fontSize={GRAPH.labelSize}
      fontWeight={endpoint ? 700 : 400}
      fill={endpoint ? GRAPH.endpointLabelColor : GRAPH.labelColor}
      stroke={NEUTRAL[950]}
      strokeWidth={3.4}
      strokeLinejoin="round"
      paintOrder="stroke"
      opacity={clamp01((state.appear - 0.3) * 2.2)}
    >
      {def.label}
    </text>
  );
};

// -------------------------------------------------------------------------- edge
const EdgeLine: React.FC<{
  def: GraphEdgeDef;
  state: GraphEdgeState;
  from: Pt;
  to: Pt;
  frame: number;
  uid: string;
}> = ({def, state, from, to, frame, uid}) => {
  const appear = clamp01(state.appear);
  if (appear <= 0.001) {
    return null;
  }
  const color = edgeColor(def.reason);
  const width = edgeWidth(def.reason);
  const dashed = edgeIsDashed(def.reason);
  const rFrom = GRAPH_NODES[def.from].radius + GRAPH.ringWidth + 1.5;
  const rTo = GRAPH_NODES[def.to].radius + GRAPH.ringWidth + 1.5;
  const curve = edgeCurve(from, to, rFrom, rTo, def.bend);
  const d = quadPath(curve);
  const maskId = `${uid}-m-${safeId(def.id)}`;
  const lineOpacity = def.reason === 'plan' ? 0.85 : def.reason === 'decision' ? 0.9 : 1;

  // arrowhead at the end, once the line has nearly arrived
  const tip = curve.p1;
  const tangent = quadTangent(curve, 1);
  const angle = (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI;
  const arrowOpacity = mapRange(appear, 0.8, 1, 0, 1) * lineOpacity;

  // the recheck edge keeps its soft amber halo (strength = flow); there are no moving particles on any edge
  const flow = clamp01(state.flow ?? 1);

  return (
    <g>
      {dashed ? (
        <>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={GRAPH.box.w} height={GRAPH.box.h}>
            <path d={d} fill="none" stroke="#ffffff" strokeWidth={6} pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - appear} />
          </mask>
          <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray="3 3" mask={`url(#${maskId})`} opacity={lineOpacity} />
        </>
      ) : appear >= 0.999 ? (
        <path d={d} fill="none" stroke={color} strokeWidth={width} opacity={lineOpacity} />
      ) : (
        <path d={d} fill="none" stroke={color} strokeWidth={width} pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - appear} opacity={lineOpacity} />
      )}
      {def.reason === 'recheck' && flow > 0.001 ? (
        <path d={d} fill="none" stroke={color} strokeWidth={width + 4} opacity={0.14 * flow} />
      ) : null}
      <polygon
        points={`0,0 ${-GRAPH.arrowLength},${-GRAPH.arrowHalfWidth} ${-GRAPH.arrowLength},${GRAPH.arrowHalfWidth}`}
        fill={color}
        opacity={arrowOpacity}
        transform={`translate(${tip.x} ${tip.y}) rotate(${angle}) scale(${0.7 + 0.3 * mapRange(appear, 0.8, 1, 0, 1)})`}
      />
    </g>
  );
};

// ------------------------------------------------------------------------ legend
const LegendRing: React.FC<{color: string; dashed?: boolean}> = ({color, dashed}) => (
  <svg width={12} height={12} viewBox="0 0 12 12" style={{display: 'block', flexShrink: 0}}>
    <circle cx={6} cy={6} r={4.2} fill="none" stroke={color} strokeWidth={1.8} strokeDasharray={dashed ? '1.8 1.8' : undefined} />
  </svg>
);

const LegendLine: React.FC<{color: string; dashed?: boolean}> = ({color, dashed}) => (
  <svg width={16} height={12} viewBox="0 0 16 12" style={{display: 'block', flexShrink: 0}}>
    <line x1={1} y1={6} x2={15} y2={6} stroke={color} strokeWidth={1.6} strokeDasharray={dashed ? '3 2.4' : undefined} />
  </svg>
);

const GraphLegend: React.FC<{opacity: number}> = ({opacity}) => {
  const L = GRAPH_TEXT.legend;
  const item = (key: string, swatch: React.ReactNode, label: string) => (
    <span key={key} style={{display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'}}>
      {swatch}
      {label}
    </span>
  );
  const row = (key: string, children: React.ReactNode) => (
    <div key={key} style={{display: 'flex', justifyContent: 'center', columnGap: 14, height: 14}}>
      {children}
    </div>
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: 8,
        right: 8,
        bottom: 5,
        height: GRAPH.legendH - 8,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        rowGap: 3,
        fontFamily: FONTS.body,
        fontSize: 11,
        lineHeight: '14px',
        color: NEUTRAL[400],
        opacity,
      }}
    >
      {row(
        'status',
        <>
          {item('done', <LegendRing color={STATUS.done} />, L.done)}
          {item('running', <LegendRing color={STATUS.running} />, L.running)}
          {item('error', <LegendRing color={STATUS.error} />, L.error)}
          {item('awaiting', <LegendRing color={STATUS.awaiting} dashed />, L.awaiting)}
        </>,
      )}
      {row(
        'rest',
        <>
          {item('pending', <LegendRing color={STATUS.pending} dashed />, L.pending)}
          {item('requested', <LegendLine color={EDGE_COLORS.requested} />, L.requested)}
          {item('decision', <LegendLine color={EDGE_COLORS.decision} dashed />, L.decision)}
        </>,
      )}
    </div>
  );
};

// ---------------------------------------------------------------------- the card
export const RoutingGraph: React.FC<RoutingGraphProps> = ({frame: frameOverride, nodes, edges, legend = 1, wobble = GRAPH.wobbleAmplitude, style}) => {
  const current = useCurrentFrame();
  const frame = frameOverride ?? current;
  const uid = safeId(useId());
  const amplitude = Math.min(3, Math.max(0, wobble));
  const resolved = resolveNodes(nodes, frame, amplitude);

  const gradients = {
    running: `${uid}-glow-running`,
    paused: `${uid}-glow-paused`,
    done: `${uid}-glow-done`,
  };
  const glowStop = (id: string, color: string) => (
    <radialGradient key={id} id={id}>
      <stop offset="0%" stopColor={color} stopOpacity={0.75} />
      <stop offset="45%" stopColor={color} stopOpacity={0.22} />
      <stop offset="100%" stopColor={color} stopOpacity={0} />
    </radialGradient>
  );

  const edgeNodes = (id: GraphNodeId): Pt => resolved[id]?.pos ?? {x: GRAPH_NODES[id].x, y: GRAPH_NODES[id].y};

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        borderRadius: 8,
        border: `1px solid ${NEUTRAL[800]}`,
        background: NEUTRAL[950],
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: GRAPH.legendH}}>
        <svg
          width="100%"
          height="100%"
          viewBox={`${GRAPH.viewBox.x} ${GRAPH.viewBox.y} ${GRAPH.viewBox.w} ${GRAPH.viewBox.h}`}
          preserveAspectRatio="xMidYMid meet"
          style={{display: 'block', overflow: 'visible'}}
        >
          <defs>
            {glowStop(gradients.running, STATUS.running)}
            {glowStop(gradients.paused, STATUS.paused)}
            {glowStop(gradients.done, STATUS.done)}
          </defs>
          {/* edges first, nodes on top of them, labels on top of everything */}
          {GRAPH_EDGES.map((def) => {
            const state = edges[def.id];
            return state ? (
              <EdgeLine key={def.id} def={def} state={state} from={edgeNodes(def.from)} to={edgeNodes(def.to)} frame={frame} uid={uid} />
            ) : null;
          })}
          {GRAPH_NODE_ORDER.map((id) => {
            const node = resolved[id];
            return node ? <NodeGlyph key={id} node={node} frame={frame} gradients={gradients} /> : null;
          })}
          {GRAPH_NODE_ORDER.map((id) => {
            const node = resolved[id];
            return node ? <NodeLabel key={id} node={node} /> : null;
          })}
        </svg>
      </div>
      <GraphLegend opacity={clamp01(legend)} />
    </div>
  );
};
