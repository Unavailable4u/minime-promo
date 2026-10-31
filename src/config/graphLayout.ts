/**
 * MiniMe promo — routing graph layout (patch 06).
 *
 * Node positions, the edge list and the curve math of the routing graph, in a LOGICAL 440 x 300 box
 * (brief Appendix D3). The graph component (src/ui/RoutingGraph.tsx) crops that box with `GRAPH.viewBox`
 * and fits it into the 456 x 288 slot of the Working Panel. All numbers are authored here, in one place.
 *
 * Deviations from the brief's coordinates (the brief says "adjust freely"):
 *  - `documentation_writer` and `market_researcher` sit only 73 px apart but their labels are about 105 and 122 px
 *    wide, so market_researcher's label goes ABOVE its node and the other one stays below.
 *  - The decision node's label ("Worker pool: code_writer (3/5 picked)") is about 215 px wide, so it is drawn to
 *    the RIGHT of the node instead of centered under it.
 */
import {GRAPH_TEXT} from './copy';
import {EDGE_COLORS, EDGE_DASHED, type EdgeReason} from './theme';
import {INPUT_NODE, OUTPUT_NODE, getRoleCategory} from '../lib/roleIcons';

export type Pt = {x: number; y: number};

/** Tunables of the graph, authored once. Sizes are in logical graph units (1 unit ~ 1.04 px in the panel slot). */
export const GRAPH = {
  /** The logical box of Appendix D3. */
  box: {w: 440, h: 300},
  /** The part of the box that is drawn (crops the empty top and bottom). Aspect 440:236. */
  viewBox: {x: 0, y: 50, w: 440, h: 236},
  /** Height of the legend strip at the bottom of the card (two wrapped rows of 11 px text). */
  legendH: 34,
  /** Node radii (real canvas rules). */
  nodeRadius: 11,
  endpointRadius: 13,
  decisionRadius: 7,
  /** The emoji is drawn at radius * emojiScale px (real canvas rule). */
  emojiScale: 1.65,
  ringWidth: 2,
  /** Gap between the node's fill and the inside of its status ring. */
  ringGap: 0,
  labelSize: 11,
  labelColor: '#a3a3a3',
  endpointLabelColor: '#e5e5e5',
  /** Seeded wobble of node positions in graph units. The brief allows 3 px; the slot scale is 1.036, so 2.4 stays below. */
  wobbleAmplitude: 2.4,
  arrowLength: 7,
  arrowHalfWidth: 3.2,
  /** Node fill alpha per state (real canvas rules: pending .22, running .60, otherwise .92). */
  fillAlpha: {default: 0.92, pending: 0.22, running: 0.6},
} as const;

// ------------------------------------------------------------------------ nodes
export type GraphNodeId =
  | 'input'
  | 'inspector'
  | 'strategist'
  | 'market_researcher'
  | 'documentation_writer'
  | 'code_writer'
  | 'test_writer'
  | 'verifier'
  | 'output'
  | 'pool'
  // the S4 audit run (patch 07): the Inspector staffs two roles in parallel
  | 'security_auditor'
  | 'code_reviewer';

export type GraphNodeKind = 'endpoint' | 'role' | 'decision';
export type LabelSide = 'below' | 'above' | 'right';

export type GraphNodeDef = {
  id: GraphNodeId;
  /** Text under (or beside) the node. */
  label: string;
  kind: GraphNodeKind;
  x: number;
  y: number;
  radius: number;
  /** Emoji drawn in the node (none for the decision node). */
  emoji?: string;
  /** Fill color (the role category color). */
  color: string;
  labelSide: LabelSide;
};

const role = (
  id: GraphNodeId,
  x: number,
  y: number,
  labelSide: LabelSide = 'below',
): GraphNodeDef => {
  const category = getRoleCategory(id);
  return {id, label: id, kind: 'role', x, y, radius: GRAPH.nodeRadius, emoji: category.icon, color: category.color, labelSide};
};

export const GRAPH_NODES: Readonly<Record<GraphNodeId, GraphNodeDef>> = {
  input: {
    id: 'input',
    label: INPUT_NODE.label,
    kind: 'endpoint',
    x: 40,
    y: 150,
    radius: GRAPH.endpointRadius,
    emoji: INPUT_NODE.icon,
    color: INPUT_NODE.color,
    labelSide: 'below',
  },
  inspector: role('inspector', 105, 150),
  strategist: role('strategist', 170, 150),
  market_researcher: role('market_researcher', 245, 82, 'above'),
  documentation_writer: role('documentation_writer', 318, 82, 'below'),
  code_writer: role('code_writer', 245, 218),
  test_writer: role('test_writer', 318, 218),
  verifier: role('verifier', 375, 150),
  output: {
    id: 'output',
    label: OUTPUT_NODE.label,
    kind: 'endpoint',
    x: 420,
    y: 150,
    radius: GRAPH.endpointRadius,
    emoji: OUTPUT_NODE.icon,
    color: OUTPUT_NODE.color,
    labelSide: 'below',
  },
  pool: {
    id: 'pool',
    label: GRAPH_TEXT.decisionLabel,
    kind: 'decision',
    x: 205,
    y: 268,
    radius: GRAPH.decisionRadius,
    color: EDGE_COLORS.decision,
    labelSide: 'right',
  },
  // S4 audit run: two roles fan out of the Inspector (positions are authored here, the brief has none for them)
  security_auditor: role('security_auditor', 205, 96, 'above'),
  code_reviewer: role('code_reviewer', 205, 204, 'below'),
};

/** Draw / stack order of the nodes (also the order of the dev checks). */
export const GRAPH_NODE_ORDER: readonly GraphNodeId[] = [
  'input',
  'inspector',
  'strategist',
  'market_researcher',
  'documentation_writer',
  'code_writer',
  'test_writer',
  'verifier',
  'output',
  'pool',
  'security_auditor',
  'code_reviewer',
];

// ------------------------------------------------------------------------ edges
export type GraphEdgeDef = {
  id: string;
  from: GraphNodeId;
  to: GraphNodeId;
  reason: EdgeReason;
  /** Signed sideways offset of the curve's control point in graph units (0 = straight). */
  bend: number;
};

const edge = (from: GraphNodeId, to: GraphNodeId, reason: EdgeReason, bend = 0): GraphEdgeDef => ({
  id: `${from}>${to}`,
  from,
  to,
  reason,
  bend,
});

export const GRAPH_EDGES: readonly GraphEdgeDef[] = [
  edge('input', 'inspector', 'plan'),
  edge('inspector', 'strategist', 'plan'),
  edge('strategist', 'market_researcher', 'plan'),
  edge('strategist', 'code_writer', 'plan'),
  edge('market_researcher', 'documentation_writer', 'plan'),
  edge('code_writer', 'test_writer', 'plan'),
  edge('test_writer', 'verifier', 'plan'),
  // the recheck edge: amber and curved, so it does not run over test_writer -> verifier
  edge('verifier', 'code_writer', 'recheck', -34),
  edge('verifier', 'output', 'plan'),
  edge('documentation_writer', 'output', 'plan'),
  edge('pool', 'code_writer', 'decision'),
  // S4 audit run
  edge('inspector', 'security_auditor', 'plan'),
  edge('inspector', 'code_reviewer', 'plan'),
];

export const edgeColor = (reason: EdgeReason): string => EDGE_COLORS[reason];
export const edgeIsDashed = (reason: EdgeReason): boolean => EDGE_DASHED.has(reason);

/** Stroke width of an edge by reason. */
export const edgeWidth = (reason: EdgeReason): number => (reason === 'recheck' ? 1.8 : reason === 'decision' ? 1.2 : 1.4);

/**
 * The node an entering node "grows out of": the source of its first incoming edge that is not a recheck
 * or a decision edge, or (for the decision node) its own target. Undefined for the first node (Input).
 */
export const nodeParent = (id: GraphNodeId): GraphNodeId | undefined => {
  const plan = GRAPH_EDGES.find((e) => e.to === id && e.reason !== 'recheck' && e.reason !== 'decision');
  if (plan) {
    return plan.from;
  }
  const decision = GRAPH_EDGES.find((e) => e.from === id && e.reason === 'decision');
  return decision?.to;
};

// ------------------------------------------------------------------- curve math
/** A quadratic Bezier (a straight edge is the case control point = midpoint). */
export type QuadCurve = {p0: Pt; c: Pt; p1: Pt};

const unit = (dx: number, dy: number): Pt => {
  const len = Math.hypot(dx, dy) || 1;
  return {x: dx / len, y: dy / len};
};

/**
 * The curve of an edge between two node centers, trimmed so it starts `startInset` px outside the source
 * and ends `endInset` px outside the target (the arrow tip lands at the end point).
 */
export const edgeCurve = (a: Pt, b: Pt, startInset: number, endInset: number, bend: number): QuadCurve => {
  const mid = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
  const n = unit(b.y - a.y, -(b.x - a.x)); // right-hand normal of a -> b in screen space
  const c = {x: mid.x + n.x * bend, y: mid.y + n.y * bend};
  const dStart = unit(c.x - a.x, c.y - a.y);
  const dEnd = unit(b.x - c.x, b.y - c.y);
  return {
    p0: {x: a.x + dStart.x * startInset, y: a.y + dStart.y * startInset},
    c,
    p1: {x: b.x - dEnd.x * endInset, y: b.y - dEnd.y * endInset},
  };
};

/** Point at t (0..1). */
export const quadPoint = (q: QuadCurve, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * q.p0.x + 2 * u * t * q.c.x + t * t * q.p1.x,
    y: u * u * q.p0.y + 2 * u * t * q.c.y + t * t * q.p1.y,
  };
};

/** Unit tangent at t (0..1). */
export const quadTangent = (q: QuadCurve, t: number): Pt =>
  unit(
    2 * (1 - t) * (q.c.x - q.p0.x) + 2 * t * (q.p1.x - q.c.x),
    2 * (1 - t) * (q.c.y - q.p0.y) + 2 * t * (q.p1.y - q.c.y),
  );

/** Approximate arc length (16 segments). */
export const quadLength = (q: QuadCurve): number => {
  let length = 0;
  let prev = q.p0;
  for (let i = 1; i <= 16; i++) {
    const p = quadPoint(q, i / 16);
    length += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return length;
};

/** SVG path data of the curve. */
export const quadPath = (q: QuadCurve): string =>
  `M ${q.p0.x.toFixed(2)} ${q.p0.y.toFixed(2)} Q ${q.c.x.toFixed(2)} ${q.c.y.toFixed(2)} ${q.p1.x.toFixed(2)} ${q.p1.y.toFixed(2)}`;
