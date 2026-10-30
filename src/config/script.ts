/**
 * MiniMe promo — the whole choreography as DATA (patch 07).
 *
 * Every frame number of the chat's story lives here, authored at 30 fps and wrapped in f(). A non-expert can
 * retime the film by editing numbers in this file; nothing else decides WHEN something happens.
 * `src/config/appState.ts` turns these numbers into one AppState per frame, `src/ui/ChatApp.tsx` draws it.
 *
 * Sections: S2 Instant | S3 Team | S4 Control | S5 Organized, then focus / hover / press tables that the
 * app state reads. All on-screen TEXT comes from copy.ts.
 *
 * Deviations from the storyboard (all numbers below are final; the storyboard is the starting point):
 *  - S4: the prompt is typed f1183-f1213 (storyboard f1185-f1225) so the Hire Review card has time to reveal
 *    before "Approve & run" is clicked (storyboard f1235, here f1244). Pause f1262 and Resume f1290 are unchanged.
 *  - S5: search typing starts a little earlier (f1340) so the live filter can be seen before it is cleared.
 */
import {ANSWERS, META_TEXT, PROMPTS, SIDEBAR, STEP_TEXT, UI_TEXT, type ModeId} from './copy';
import type {GraphNodeId} from './graphLayout';
import type {TierKey} from './theme';
import {f} from './timeline';
import {typingEndFrame, type TypingOptions} from '../lib/typing';
import type {EdgeSchedule, NodeSchedule, StatusPhase} from '../ui/graphState';
import type {GraphNodeStatus} from '../ui/RoutingGraph';

// ------------------------------------------------------------------ small helpers
/** A typed string: starts on `start`, its last character lands exactly `options.durationFrames` later. */
export type TypingScript = {text: string; start: number; options: TypingOptions};

const typing = (text: string, startAuthored: number, durationAuthored: number, seed: number): TypingScript => ({
  text,
  start: f(startAuthored),
  options: {durationFrames: f(durationAuthored), seed},
});

/** Frame on which the last character of a typed string appears. */
export const typingEnd = (script: TypingScript): number => typingEndFrame(script.text, script.start, script.options);

/** The "Working… · 3s" counters run faster than the video (the app is shown at about 2.8x speed). */
export const ELAPSED_RATE = 2.8;

type Phase = readonly [authoredFrame: number, status: GraphNodeStatus];
const phases = (...list: readonly Phase[]): StatusPhase[] => list.map(([frame, status]) => ({frame: f(frame), status}));

// ------------------------------------------------------------------ step script type (S3 and S4 panels)
export type StepRun = {
  start: number;
  /** null = the run never finishes inside the film (the S4 audit). */
  end: number | null;
  ms: number;
  summary: string;
};

export type ExpandWindow = {openFrom: number; openTo: number; closeFrom: number; closeTo: number};

export type StepScript = {
  key: string;
  node: GraphNodeId;
  /** Printed as given ("strategist", "Inspector — classifying task"). */
  name: string;
  tier?: TierKey;
  /** Frame the card starts to slide in (8 frames). The first run starts on the same frame. */
  appear: number;
  runs: readonly StepRun[];
  expand?: readonly ExpandWindow[];
  /** Amber note under the summary ("→ sent back to recheck code_writer"). */
  note?: {from: number; to: number; text: string};
  /** Frame of the 6-frame error flash (the verifier finding the missing rate limit). */
  flash?: number;
  /** The card switches to "awaiting approval" while the run is paused (S4). */
  pausable?: boolean;
};

// =====================================================================================================
// S2 — INSTANT (f240-f479)
// =====================================================================================================
export const S2 = {
  /** Cursor clicks the textarea: focus ring on. */
  focus: f(258),
  prompt: typing(PROMPTS.instant, 262, 56, 2),
  /** Enter (the key cap flashes near the composer). */
  enter: f(324),
  draftClear: f(326),
  userIn: f(326),
  /** Thinking avatar + "Working… · 1s". */
  working: {start: f(334), end: f(352)},
  /** The Tier 0 meta row appears on `working.end`; the answer streams over `answer`. */
  answer: {text: ANSWERS.instant, start: f(356), end: f(410), seed: 21},
  tier: 0 as const,
  elapsedLabel: META_TEXT.instantElapsed,
  /** The run is "active" (Send turns into Pause) from the Enter until the first tokens arrive. */
  run: {from: f(326), to: f(356)},
  /** Active sidebar row: "New Chat" is erased, then the auto-title types itself. */
  sidebarTitle: {
    from: SIDEBAR.activeChat.title,
    to: SIDEBAR.activeChatAutoTitle,
    eraseStart: f(374),
    typeStart: f(380),
    typeEnd: f(420),
    seed: 8,
  },
  /** The chat scrolls up slightly to make room (permanent, smaller than the 24 px list padding). */
  nudge: {start: f(455), end: f(479), px: 20},
} as const;

// =====================================================================================================
// S3 — THE TEAM (f480-f1079)
// =====================================================================================================
export const S3_STEPS: readonly StepScript[] = [
  {
    key: 'inspector',
    node: 'inspector',
    name: UI_TEXT.inspectorStep,
    appear: f(625),
    runs: [{start: f(625), end: f(650), ms: 1912, summary: STEP_TEXT.inspector}],
    expand: [{openFrom: f(652), openTo: f(662), closeFrom: f(696), closeTo: f(706)}],
  },
  {
    key: 'strategist',
    node: 'strategist',
    name: 'strategist',
    tier: 'adaptive',
    appear: f(690),
    runs: [{start: f(690), end: f(722), ms: 3604, summary: STEP_TEXT.strategist}],
  },
  {
    key: 'market_researcher',
    node: 'market_researcher',
    name: 'market_researcher',
    tier: 'adaptive',
    appear: f(722),
    runs: [{start: f(722), end: f(780), ms: 8420, summary: STEP_TEXT.market_researcher}],
  },
  {
    key: 'code_writer',
    node: 'code_writer',
    name: 'code_writer',
    tier: 'adaptive',
    appear: f(722),
    runs: [
      {start: f(722), end: f(800), ms: 9871, summary: STEP_TEXT.code_writer.first},
      {start: f(876), end: f(900), ms: 3305, summary: STEP_TEXT.code_writer.rerun},
    ],
  },
  {
    key: 'test_writer',
    node: 'test_writer',
    name: 'test_writer',
    tier: 'adaptive',
    appear: f(800),
    runs: [{start: f(800), end: f(836), ms: 6240, summary: STEP_TEXT.test_writer}],
  },
  {
    key: 'verifier',
    node: 'verifier',
    name: 'verifier',
    tier: 'adaptive',
    appear: f(836),
    runs: [
      {start: f(836), end: f(856), ms: 3180, summary: STEP_TEXT.verifier.flag},
      {start: f(900), end: f(912), ms: 2260, summary: STEP_TEXT.verifier.pass},
    ],
    expand: [{openFrom: f(858), openTo: f(866), closeFrom: f(900), closeTo: f(908)}],
    note: {from: f(856), to: f(908), text: STEP_TEXT.verifier.note},
    flash: f(856),
  },
  {
    key: 'documentation_writer',
    node: 'documentation_writer',
    name: 'documentation_writer',
    tier: 'adaptive',
    appear: f(860),
    runs: [{start: f(860), end: f(912), ms: 7134, summary: STEP_TEXT.documentation_writer}],
  },
];

const S3_GRAPH_NODES: Partial<Record<GraphNodeId, NodeSchedule>> = {
  input: {appear: f(625), phases: phases([628, 'done'])},
  inspector: {appear: f(634), phases: phases([634, 'running'], [650, 'done'])},
  strategist: {appear: f(690), phases: phases([690, 'running'], [722, 'done'])},
  market_researcher: {appear: f(722), phases: phases([722, 'running'], [780, 'done'])},
  code_writer: {
    appear: f(722),
    phases: phases([722, 'running'], [800, 'done'], [876, 'running'], [900, 'done']),
  },
  pool: {appear: f(728), phases: phases([732, 'done'])},
  test_writer: {appear: f(800), phases: phases([800, 'running'], [836, 'done'])},
  verifier: {
    appear: f(836),
    phases: phases([836, 'running'], [856, 'error'], [900, 'running'], [912, 'done']),
  },
  documentation_writer: {appear: f(860), phases: phases([860, 'running'], [912, 'done'])},
  output: {appear: f(916), phases: phases([920, 'done'])},
};

const S3_GRAPH_EDGES: Partial<Record<string, EdgeSchedule>> = {
  'input>inspector': {start: f(630)},
  'inspector>strategist': {start: f(686)},
  'strategist>market_researcher': {start: f(720)},
  'strategist>code_writer': {start: f(720)},
  'pool>code_writer': {start: f(730)},
  'code_writer>test_writer': {start: f(796)},
  'test_writer>verifier': {start: f(832)},
  'market_researcher>documentation_writer': {start: f(856)},
  // the amber recheck edge draws back to code_writer, its particles stop when the verifier passes
  'verifier>code_writer': {start: f(856), drawFrames: f(20), flowTo: f(900)},
  'verifier>output': {start: f(908)},
  'documentation_writer>output': {start: f(908)},
};

export const S3 = {
  /** Cursor clicks the textarea (it is already focused; kept for the scene's cursor data). */
  focus: f(484),
  prompt: typing(PROMPTS.team, 496, 90, 3),
  enter: f(590),
  draftClear: f(592),
  userIn: f(592),
  /** Thinking avatar + "Working… · Ns" until the Inspector has decided. */
  working: {start: f(602), end: f(656)},
  /** Working Panel: width spring (panel preset) and the cascade of its parts. */
  panel: {open: f(604), cascade: f(606)},
  /** Tier reveal: the badge morphs from "routing…" to Tier 3 (amber) with a bloom; the routing card text follows. */
  reveal: {
    routingFrom: f(656),
    morphStart: f(660),
    morphEnd: f(676),
    glowPeak: f(670),
    glowEnd: f(700),
    elapsedFrom: f(676),
  },
  /** Elapsed counter of the meta row and the Working row: linear, lands on `seconds` at `end`. */
  elapsed: {start: f(602), end: f(1030), seconds: META_TEXT.teamSeconds},
  /** The run is active (Send turns into Pause) from the Enter until the answer is complete. */
  run: {from: f(592), to: f(1030)},
  answer: {text: ANSWERS.teamFinal, start: f(916), end: f(1030), seed: 5},
  steps: S3_STEPS,
  /** Scroll of the step list (px) while the expanded verifier card pushes the others down. Eased between keys. */
  stepsScroll: [
    {frame: f(850), y: 0},
    {frame: f(872), y: 48},
    {frame: f(900), y: 48},
    {frame: f(914), y: 0},
  ] as readonly {frame: number; y: number}[],
  routing: {tier: 'adaptive' as TierKey},
  graph: {nodes: S3_GRAPH_NODES, edges: S3_GRAPH_EDGES},
  /** Stat chip window (the chip itself is a scene overlay: "7 specialists · 1 recheck · 41.2s"). */
  stat: {from: f(1030), to: f(1079)},
  /** Cursor clicks "Save as template"; the toast (scene overlay) starts on `toast`. */
  save: {hover: f(1046), hoverEnd: f(1068), click: f(1056), toast: f(1060)},
} as const;

// =====================================================================================================
// S4 — CONTROL (f1080-f1319)
// =====================================================================================================
const S4_STEPS: readonly StepScript[] = [
  {
    key: 'inspector',
    node: 'inspector',
    name: UI_TEXT.inspectorStep,
    appear: f(1252),
    runs: [{start: f(1252), end: f(1256), ms: 1604, summary: ''}],
  },
  {
    key: 'security_auditor',
    node: 'security_auditor',
    name: 'security_auditor',
    tier: 'adaptive',
    appear: f(1257),
    runs: [{start: f(1257), end: null, ms: 0, summary: ''}],
    pausable: true,
  },
  {
    key: 'code_reviewer',
    node: 'code_reviewer',
    name: 'code_reviewer',
    tier: 'adaptive',
    appear: f(1257),
    runs: [{start: f(1257), end: null, ms: 0, summary: ''}],
    pausable: true,
  },
];

const S4_GRAPH_NODES: Partial<Record<GraphNodeId, NodeSchedule>> = {
  input: {appear: f(1250), phases: phases([1252, 'done'])},
  inspector: {appear: f(1252), phases: phases([1252, 'running'], [1256, 'done'])},
  security_auditor: {
    appear: f(1257),
    phases: phases([1257, 'running'], [1262, 'paused'], [1290, 'running']),
  },
  code_reviewer: {
    appear: f(1257),
    phases: phases([1257, 'running'], [1262, 'paused'], [1290, 'running']),
  },
};

const S4_GRAPH_EDGES: Partial<Record<string, EdgeSchedule>> = {
  'input>inspector': {start: f(1250)},
  'inspector>security_auditor': {start: f(1255)},
  'inspector>code_reviewer': {start: f(1255)},
};

export const S4 = {
  mode: {
    menuOpen: f(1104),
    /** Hover sequence: from `frame` on, row `index` is hovered (0 Auto, 1 Simple, 2 Fast, 3 Expert, 4 Beast). */
    hovers: [
      {frame: f(1120), index: 1},
      {frame: f(1125), index: 2},
      {frame: f(1129), index: 3},
      {frame: f(1132), index: 4},
      {frame: f(1137), index: 3},
    ] as readonly {frame: number; index: number}[],
    /** Click on Expert: the pill changes and the menu closes. */
    select: {frame: f(1140), mode: 'expert' as ModeId},
    menuClose: f(1142),
    closeFrames: f(12),
  },
  review: {hover: f(1158), hoverEnd: f(1172), click: f(1166), onFrames: f(10)},
  /** Cursor clicks the textarea again before typing. */
  focus: f(1181),
  prompt: typing(PROMPTS.control, 1183, 30, 4),
  enter: f(1217),
  draftClear: f(1219),
  userIn: f(1219),
  hire: {
    /** The Review card starts to reveal; `speed` squeezes its 34-frame reveal (34 / 1.7 = 20 frames). */
    start: f(1220),
    speed: 1.7,
    approveHover: f(1236),
    approveHoverEnd: f(1248),
    approveClick: f(1244),
    collapseStart: f(1246),
    collapseFrames: f(14),
    /** The first two mini rows start running. */
    miniRunning: f(1254),
  },
  /** The run starts on the approval: Send turns into Pause, the thinking row appears. */
  run: {start: f(1246)},
  /** The old panel content fades out, the audit run's panel cascades in. */
  panel: {fadeOutStart: f(1238), fadeOutEnd: f(1246), cascade: f(1248)},
  pause: {click: f(1262), resume: f(1290)},
  steps: S4_STEPS,
  routing: {tier: 'adaptive' as TierKey},
  graph: {nodes: S4_GRAPH_NODES, edges: S4_GRAPH_EDGES},
} as const;

// =====================================================================================================
// S5 — ORGANIZED (f1320-f1499)
// =====================================================================================================
export const S5 = {
  search: {
    hover: f(1328),
    click: f(1334),
    focusFrames: f(6),
    typing: typing(PROMPTS.search, 1340, 16, 6),
    /** Cursor clicks the (x): the query clears, the hidden rows slide back. */
    clear: f(1384),
    blurFrom: f(1386),
    blurFrames: f(6),
    /** Rows animate out / in over this many frames after the keystroke that changes their match. */
    filterFrames: f(10),
  },
  newChat: {
    hover: f(1392),
    click: f(1398),
    /** The new row slides in (rowFrames), becomes active, the chat empties and the panel closes. */
    rowIn: f(1400),
    rowFrames: f(12),
    chatClear: f(1400),
    panelClose: f(1402),
    rowId: 'new-chat-2',
  },
  attach: {
    hover: f(1428),
    click: f(1434),
    /** The chip slides in (appearFrames), the spinner turns, then the check draws on. */
    appear: f(1436),
    appearFrames: f(10),
    doneFrom: f(1456),
    doneFrames: f(8),
  },
} as const;

// =====================================================================================================
// Interaction tables (focus, hover, press): the app state reads them; scenes aim their cursor at them.
// =====================================================================================================
/** Textarea focus: on/off events (each eases over 6 frames). */
export const FOCUS_EVENTS: readonly {frame: number; on: boolean}[] = [
  {frame: S2.focus, on: true},
  {frame: S4.mode.menuOpen, on: false},
  {frame: S4.focus, on: true},
  {frame: S5.search.click, on: false},
];
export const FOCUS_RAMP_FRAMES = f(6);

export type HoverTarget =
  | 'textarea'
  | 'attach'
  | 'mode'
  | 'send'
  | 'review'
  | 'approve'
  | 'edit'
  | 'save'
  | 'search'
  | 'clear'
  | 'new-chat';

export type HoverWindow = {from: number; to: number; target: HoverTarget};

/** While the cursor rests on a control, its hover style shows. Match your cursor waypoints to these windows. */
export const HOVER_WINDOWS: readonly HoverWindow[] = [
  {from: f(254), to: f(266), target: 'textarea'},
  {from: f(480), to: f(500), target: 'textarea'},
  {from: f(1098), to: f(1110), target: 'mode'},
  {from: S4.review.hover, to: S4.review.hoverEnd, target: 'review'},
  {from: f(1178), to: f(1192), target: 'textarea'},
  {from: S4.hire.approveHover, to: S4.hire.approveHoverEnd, target: 'approve'},
  {from: f(1256), to: f(1268), target: 'send'},
  {from: f(1284), to: f(1296), target: 'send'},
  {from: S3.save.hover, to: S3.save.hoverEnd, target: 'save'},
  {from: S5.search.hover, to: f(1340), target: 'search'},
  {from: f(1380), to: f(1390), target: 'clear'},
  {from: S5.newChat.hover, to: f(1404), target: 'new-chat'},
  {from: S5.attach.hover, to: f(1440), target: 'attach'},
];

export type PressTarget = HoverTarget;

/** A click: the control shows its pressed state from `frame - 1` for 4 frames. */
export const PRESS_EVENTS: readonly {frame: number; target: PressTarget}[] = [
  {frame: S4.mode.menuOpen, target: 'mode'},
  {frame: S4.review.click, target: 'review'},
  {frame: S4.pause.click, target: 'send'},
  {frame: S4.pause.resume, target: 'send'},
  {frame: S3.save.click, target: 'save'},
  {frame: S5.search.click, target: 'search'},
  {frame: S5.search.clear, target: 'clear'},
  {frame: S5.newChat.click, target: 'new-chat'},
  {frame: S5.attach.click, target: 'attach'},
];
export const PRESS_FRAMES = {before: 1, after: 3} as const;

// =====================================================================================================
// Chat list scrolling
// =====================================================================================================
export const SCROLL = {
  /** The newest text stays about this many px above the composer. */
  keepAbove: 120,
  /** Critically damped follower, 1/frame: higher = snappier. */
  omega: 0.28,
  /** Padding at the top of the message list (px). */
  topPadding: 24,
} as const;

/** The film shows the chat between these frames (DevApp renders this range). */
export const CHAT_RANGE = {from: f(240), to: f(1500)} as const;