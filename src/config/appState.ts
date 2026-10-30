/**
 * MiniMe promo — the persistent chat app's state as a PURE function of the global frame (patch 07).
 *
 *   appStateAt(frame): AppState      (useAppState is the same function under the name the patch guide uses)
 *   layoutAt(frame): ChatLayout      (row positions in the UI's logical space; anchors.ts builds on it)
 *   panelWidthAt(frame): number
 *
 * Everything comes from src/config/script.ts (frame numbers) and src/config/copy.ts (text). Nothing here reads
 * the clock, a random source or the DOM. The only "memory" is the auto-scroll: it follows a critically damped
 * spring, which is computed ONCE as a table for all frames (a pure function of the script, identical on every
 * render worker) and then looked up.
 */
import {PROMPTS, SIDEBAR, UI_TEXT, type ModeId} from './copy';
import {
  ELAPSED_RATE,
  FOCUS_EVENTS,
  FOCUS_RAMP_FRAMES,
  HOVER_WINDOWS,
  PRESS_EVENTS,
  PRESS_FRAMES,
  S2,
  S3,
  S4,
  S5,
  SCROLL,
  type HoverTarget,
  type StepScript,
  type TypingScript,
} from './script';
import {FPS, TOTAL_FRAMES} from './timeline';
import type {TierKey} from './theme';
import {signatureEase} from '../lib/ease';
import {spr} from '../lib/spring';
import {isStreaming, streamedText} from '../lib/stream';
import {caretVisible, keystrokeFrames, typedText} from '../lib/typing';
import type {AssistantMeta} from '../ui/AssistantMessage';
import type {ChatSidebarProps, SidebarProject, SidebarRow, SidebarTarget} from '../ui/ChatSidebar';
import type {ComposerAttachment, ComposerProps, ComposerTarget} from '../ui/Composer';
import {graphStateAt} from '../ui/graphState';
import {HIRE} from '../ui/HireReview';
import {estimateMarkdownHeight} from '../ui/Markdown';
import type {RoutingCardProps} from '../ui/RoutingCard';
import type {RoutingGraphProps} from '../ui/RoutingGraph';
import {SHELL, shellLayout} from '../ui/shellLayout';
import {STEP_ERROR_FLASH_FRAMES, STEP_FLIP_FRAMES, type StepStatus} from '../ui/StepCard';

// ------------------------------------------------------------------ small math
/** Linear 0..1 progress of `frame` between `start` and `end` (the UI components ease it themselves). */
const lin = (frame: number, start: number, end: number): number =>
  Math.min(1, Math.max(0, (frame - start) / Math.max(1, end - start)));

/** A click pulse: in over `inF` frames, out over `outF` frames, peak on `center`. */
const pulse = (frame: number, center: number, inF = 2, outF = 4): number =>
  lin(frame, center - inF, center) * (1 - lin(frame, center, center + outF));

/** Eased interpolation between key frames {frame, y}. */
const keyed = (frame: number, keys: readonly {frame: number; y: number}[]): number => {
  if (keys.length === 0) {
    return 0;
  }
  if (frame <= keys[0].frame) {
    return keys[0].y;
  }
  for (let i = 1; i < keys.length; i++) {
    if (frame <= keys[i].frame) {
      const a = keys[i - 1];
      const b = keys[i];
      return a.y + (b.y - a.y) * signatureEase(lin(frame, a.frame, b.frame));
    }
  }
  return keys[keys.length - 1].y;
};

const rampedLabel = (frame: number, start: number): string =>
  `${Math.floor((Math.max(0, frame - start) * ELAPSED_RATE) / FPS)}s`;

/** The S3 counter: linear from 0 to 41.2 s over the run, shown as whole seconds (lands on "41s"). */
const teamElapsedLabel = (frame: number): string =>
  `${Math.floor(S3.elapsed.seconds * lin(frame, S3.elapsed.start, S3.elapsed.end))}s`;

// ------------------------------------------------------------------ interaction tables
const isHover = (frame: number, target: HoverTarget): boolean =>
  HOVER_WINDOWS.some((w) => w.target === target && frame >= w.from && frame < w.to);

const pressedTarget = (frame: number, target: HoverTarget): boolean =>
  PRESS_EVENTS.some((e) => e.target === target && frame >= e.frame - PRESS_FRAMES.before && frame < e.frame + PRESS_FRAMES.after);

const textareaFocusAt = (frame: number): number => {
  let value = 0;
  for (const event of FOCUS_EVENTS) {
    if (event.frame <= frame) {
      const p = lin(frame, event.frame, event.frame + FOCUS_RAMP_FRAMES);
      value = event.on ? p : 1 - p;
    }
  }
  return value;
};

// ------------------------------------------------------------------ geometry
export const panelWidthAt = (frame: number): number => {
  if (frame >= S5.newChat.panelClose) {
    return SHELL.panelMaxW * Math.max(0, 1 - Math.min(1, spr(frame, FPS, S5.newChat.panelClose, 'panel')));
  }
  return SHELL.panelMaxW * Math.min(1, spr(frame, FPS, S3.panel.open, 'panel'));
};

/**
 * Width of the Hire Review card in the chat. The card is designed 720 px wide (panel closed), but it only exists while
 * the Working Panel is open, where the message column is 672 px: the card takes the column width.
 */
export const HIRE_CARD_W = Math.min(
  HIRE.w,
  shellLayout({panelWidth: SHELL.panelMaxW, attachmentRow: 0, draftLines: 1}).chatBox.w - 2 * SHELL.pad,
);

const attachRawAt = (frame: number): number => lin(frame, S5.attach.appear, S5.attach.appear + S5.attach.appearFrames);

// ------------------------------------------------------------------ state types
export type UserRowState = {kind: 'user'; key: string; text: string; progress: number};
export type WorkingRowState = {kind: 'working'; key: string; progress: number; localFrame: number; elapsed: string};
export type AssistantRowState = {
  kind: 'assistant';
  key: string;
  progress: number;
  localFrame: number;
  meta: AssistantMeta;
  badgeGlow: number;
  /** null = no body yet (meta row only). */
  body: string | null;
  /** Streaming caret (drawn by <Markdown/>). */
  caret: boolean;
};
export type HireRowState = {
  kind: 'hire';
  key: string;
  localFrame: number;
  reveal: number;
  collapse: number;
  hover: {edit?: boolean; approve?: boolean};
  approvePress: number;
  miniStatus: readonly ('pending' | 'running' | 'done')[];
};
export type RowState = UserRowState | WorkingRowState | AssistantRowState | HireRowState;

export type StepViewState = {
  key: string;
  name: string;
  status: StepStatus;
  tier?: TierKey;
  ms?: number;
  appear: number;
  expand: number;
  summary?: string;
  note?: string;
  errorFlash: number;
  from?: StepStatus;
  flip: number;
};

export type PanelState = {
  /** Whole-panel opacity (the S3 content fades out when the S4 run takes over). */
  opacity: number;
  /** Frames since the panel cascade started. */
  cascade: number;
  taskExcerpt: string;
  routing: Omit<RoutingCardProps, 'appear'>;
  hover: {save?: boolean};
  savePress: number;
  stepsScrollY: number;
  graph: Pick<RoutingGraphProps, 'nodes' | 'edges'>;
  steps: StepViewState[];
};

export type AppState = {
  frame: number;
  sidebar: ChatSidebarProps;
  /** Visible Working Panel width 0..480 (the chat box reflows). */
  panelWidth: number;
  panel: PanelState | null;
  chat: {
    reviewHires: number;
    reviewHover: boolean;
    reviewPressed: boolean;
    scrollY: number;
    emptyState: boolean;
    rows: RowState[];
  };
  composer: ComposerProps;
};

// ------------------------------------------------------------------ message rows
const working = (key: string, frame: number, start: number, elapsed: string): WorkingRowState => ({
  kind: 'working',
  key,
  progress: lin(frame, start, start + 8),
  localFrame: frame - start,
  elapsed,
});

const s3Meta = (frame: number): AssistantMeta => {
  if (frame < S3.reveal.morphStart) {
    return {kind: 'routing'};
  }
  return {
    kind: 'tier',
    tier: 3,
    morph: lin(frame, S3.reveal.morphStart, S3.reveal.morphEnd),
    ok: frame >= S3.answer.end,
    elapsed: frame >= S3.reveal.elapsedFrom ? teamElapsedLabel(frame) : undefined,
  };
};

const buildRows = (frame: number): RowState[] => {
  if (frame >= S5.newChat.chatClear) {
    return [];
  }
  const rows: RowState[] = [];

  // ---- S2: Tier 0
  if (frame >= S2.userIn) {
    rows.push({kind: 'user', key: 's2-user', text: PROMPTS.instant, progress: lin(frame, S2.userIn, S2.userIn + 8)});
  }
  if (frame >= S2.working.start && frame < S2.working.end) {
    rows.push(working('s2-work', frame, S2.working.start, rampedLabel(frame, S2.working.start)));
  }
  if (frame >= S2.working.end) {
    rows.push({
      kind: 'assistant',
      key: 's2-assistant',
      progress: lin(frame, S2.working.end, S2.working.end + 6),
      localFrame: frame - S2.working.end,
      meta: {kind: 'tier', tier: S2.tier, ok: true, elapsed: S2.elapsedLabel},
      badgeGlow: 0,
      body: frame >= S2.answer.start ? streamedText(S2.answer.text, frame, S2.answer.start, S2.answer.end, S2.answer.seed) : null,
      caret: isStreaming(frame, S2.answer.start, S2.answer.end),
    });
  }

  // ---- S3: Tier 3
  if (frame >= S3.userIn) {
    rows.push({kind: 'user', key: 's3-user', text: PROMPTS.team, progress: lin(frame, S3.userIn, S3.userIn + 8)});
  }
  if (frame >= S3.working.start && frame < S3.working.end) {
    rows.push(working('s3-work', frame, S3.working.start, teamElapsedLabel(frame)));
  }
  if (frame >= S3.working.end) {
    const glow = Math.max(0, lin(frame, S3.reveal.morphStart, S3.reveal.glowPeak) - lin(frame, S3.reveal.glowPeak, S3.reveal.glowEnd));
    rows.push({
      kind: 'assistant',
      key: 's3-assistant',
      progress: lin(frame, S3.working.end, S3.working.end + 6),
      localFrame: frame - S3.working.end,
      meta: s3Meta(frame),
      badgeGlow: glow,
      body: frame >= S3.answer.start ? streamedText(S3.answer.text, frame, S3.answer.start, S3.answer.end, S3.answer.seed) : null,
      caret: isStreaming(frame, S3.answer.start, S3.answer.end),
    });
  }

  // ---- S4: control
  if (frame >= S4.userIn) {
    rows.push({kind: 'user', key: 's4-user', text: PROMPTS.control, progress: lin(frame, S4.userIn, S4.userIn + 8)});
  }
  if (frame >= S4.hire.start) {
    rows.push({
      kind: 'hire',
      key: 's4-hire',
      localFrame: frame - S4.hire.start,
      reveal: Math.max(0, frame - S4.hire.start) * S4.hire.speed,
      collapse: lin(frame, S4.hire.collapseStart, S4.hire.collapseStart + S4.hire.collapseFrames),
      hover: {edit: isHover(frame, 'edit'), approve: isHover(frame, 'approve')},
      approvePress: pulse(frame, S4.hire.approveClick),
      miniStatus: [0, 1, 2, 3, 4].map((i) => (i < 2 && frame >= S4.hire.miniRunning ? 'running' : 'pending')),
    });
  }
  if (frame >= S4.run.start) {
    if (frame < S4.pause.click) {
      rows.push(working('s4-work-a', frame, S4.run.start, rampedLabel(frame, S4.run.start)));
    } else if (frame < S4.pause.resume) {
      rows.push({
        kind: 'assistant',
        key: 's4-paused',
        progress: lin(frame, S4.pause.click, S4.pause.click + 6),
        localFrame: frame - S4.pause.click,
        meta: {kind: 'paused', elapsed: rampedLabel(frame, S4.run.start)},
        badgeGlow: 0,
        body: null,
        caret: false,
      });
    } else {
      rows.push(working('s4-work-b', frame, S4.pause.resume, rampedLabel(frame, S4.run.start)));
    }
  }
  return rows;
};

// ------------------------------------------------------------------ row heights and scroll
const CHAR_W = 7.3; // Inter 14 px, the same constant Markdown's estimate uses
const ROW_PAD_BOTTOM = 16;
const BUBBLE_FRAME = 2 + 16; // border + vertical padding of an assistant bubble
const META_H = 16;
const WORKING_ROW_H = 26;

const bodyHeightCache = new Map<string, number>();
const bodyHeight = (row: AssistantRowState, innerWidth: number): number => {
  if (row.body === null || row.body === '') {
    return 0;
  }
  const key = `${row.key}|${Math.round(innerWidth)}|${row.body.length}`;
  const cached = bodyHeightCache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const value = estimateMarkdownHeight(row.body, innerWidth);
  bodyHeightCache.set(key, value);
  return value;
};

/** Height of one message row INCLUDING its 16 px bottom padding, at message column width `colW`. */
const rowHeight = (row: RowState, colW: number): number => {
  switch (row.kind) {
    case 'user': {
      const inner = 0.8 * colW - 24;
      const lines = Math.max(1, Math.ceil((row.text.length * CHAR_W) / inner));
      return 16 + lines * SHELL.textareaLine + ROW_PAD_BOTTOM;
    }
    case 'working':
      return WORKING_ROW_H + ROW_PAD_BOTTOM;
    case 'assistant': {
      // bubble inner width: the bubble is 80% of the row (avatar column included), minus border + padding = 0.8 * column - 26 (measured with DevApp measureRows)
      const body = bodyHeight(row, 0.8 * colW - 26);
      const bubble = BUBBLE_FRAME + META_H + (body > 0 ? 8 + body : 0);
      return Math.max(bubble, 2 + 26) + ROW_PAD_BOTTOM;
    }
    case 'hire':
      return Math.round(HIRE.h + (HIRE.miniH - HIRE.h) * signatureEase(row.collapse)) + ROW_PAD_BOTTOM;
  }
};

type BaseLayout = {
  rows: {row: RowState; offset: number; height: number}[];
  contentH: number;
  viewH: number;
  chatW: number;
  colW: number;
  panelWidth: number;
};

const baseLayoutAt = (frame: number): BaseLayout => {
  const panelWidth = panelWidthAt(frame);
  const shell = shellLayout({panelWidth, attachmentRow: attachRawAt(frame), draftLines: 1});
  const chatW = shell.chatBox.w;
  const colW = chatW - 2 * SHELL.pad;
  let offset = 0;
  const rows = buildRows(frame).map((row) => {
    const height = rowHeight(row, colW);
    const entry = {row, offset, height};
    offset += height;
    return entry;
  });
  return {rows, contentH: SCROLL.topPadding + offset, viewH: shell.messageList.h, chatW, colW, panelWidth};
};

const scrollTargetOf = (layout: BaseLayout, frame: number): number => {
  const follow = Math.max(0, layout.contentH - (layout.viewH - SCROLL.keepAbove));
  return follow + S2.nudge.px * lin(frame, S2.nudge.start, S2.nudge.end);
};

let scrollTable: Float64Array | null = null;

/** Auto-scroll as a table over all frames: a critically damped follower of the target. Pure and cached. */
const scrollSeries = (): Float64Array => {
  if (scrollTable) {
    return scrollTable;
  }
  const table = new Float64Array(TOTAL_FRAMES + 1);
  const w = SCROLL.omega;
  let x = 0;
  let v = 0;
  for (let frame = 0; frame <= TOTAL_FRAMES; frame++) {
    const layout = baseLayoutAt(frame);
    if (layout.rows.length === 0) {
      x = 0;
      v = 0;
    } else {
      const target = scrollTargetOf(layout, frame);
      v += w * w * (target - x) - 2 * w * v;
      x += v;
      if (x < 0) {
        x = 0;
        v = Math.max(0, v);
      }
    }
    table[frame] = x;
  }
  scrollTable = table;
  return table;
};

export const scrollAt = (frame: number): number => {
  const table = scrollSeries();
  return table[Math.min(TOTAL_FRAMES, Math.max(0, Math.round(frame)))];
};

export type ChatLayout = {
  /** Rows with their ABSOLUTE top in the UI's logical space (scroll applied) and their height. */
  rows: {row: RowState; top: number; height: number}[];
  scrollY: number;
  panelWidth: number;
  chatW: number;
  colW: number;
  /** x of the message column (left edge of the rows) in logical UI space. */
  columnX: number;
};

/** Where every message row is at `frame`, in logical UI coordinates. anchors.ts uses it for cursor / callout targets. */
export const layoutAt = (frame: number): ChatLayout => {
  const base = baseLayoutAt(frame);
  const scrollY = scrollAt(frame);
  const listTop = SHELL.headerH + SHELL.paneHeaderH;
  return {
    rows: base.rows.map(({row, offset, height}) => ({row, top: listTop + SCROLL.topPadding + offset - scrollY, height})),
    scrollY,
    panelWidth: base.panelWidth,
    chatW: base.chatW,
    colW: base.colW,
    columnX: SHELL.sidebarW + SHELL.pad,
  };
};

// ------------------------------------------------------------------ sidebar
const lastKeystroke = (script: TypingScript, frame: number): number | undefined => {
  let last: number | undefined;
  for (const k of keystrokeFrames(script.text, script.start, script.options)) {
    if (k <= frame) {
      last = k;
    }
  }
  return last;
};

const SEARCH_CHANGES: readonly number[] = [
  ...keystrokeFrames(S5.search.typing.text, S5.search.typing.start, S5.search.typing.options),
  S5.search.clear,
];

const queryAt = (frame: number): string =>
  frame >= S5.search.clear ? '' : typedText(S5.search.typing.text, frame, S5.search.typing.start, S5.search.typing.options);

const matchRange = (text: string, query: string): {start: number; end: number} | null => {
  if (!query) {
    return null;
  }
  const start = text.toLowerCase().indexOf(query);
  return start < 0 ? null : {start, end: start + query.length};
};

/** Visible amount 0..1 of a row / header whose "matches the query" rule is `matches`. Animates after each flip. */
const filterVisible = (frame: number, matches: (query: string) => boolean): number => {
  for (let i = SEARCH_CHANGES.length - 1; i >= 0; i--) {
    const c = SEARCH_CHANGES[i];
    if (c > frame) {
      continue;
    }
    const before = matches(queryAt(c - 1));
    const after = matches(queryAt(c));
    if (before !== after) {
      const p = lin(frame, c, c + S5.search.filterFrames);
      return after ? p : 1 - p;
    }
  }
  return matches(queryAt(frame)) ? 1 : 0;
};

/** The auto-title of the active row as a typing script (same schedule as `activeTitleAt`, used for the caret). */
const TITLE_TYPING: TypingScript = {
  text: S2.sidebarTitle.to,
  start: S2.sidebarTitle.typeStart,
  options: {durationFrames: S2.sidebarTitle.typeEnd - S2.sidebarTitle.typeStart, seed: S2.sidebarTitle.seed},
};

const activeTitleAt = (frame: number): string => {
  const t = S2.sidebarTitle;
  if (frame < t.eraseStart) {
    return t.from;
  }
  if (frame < t.typeStart) {
    const remaining = t.from.length - Math.floor(t.from.length * lin(frame, t.eraseStart, t.typeStart));
    return t.from.slice(0, remaining);
  }
  return typedText(TITLE_TYPING.text, frame, TITLE_TYPING.start, TITLE_TYPING.options);
};

const sidebarAt = (frame: number): ChatSidebarProps => {
  const query = queryAt(frame);
  const newRowIn = frame >= S5.newChat.rowIn;
  const activeId = newRowIn ? S5.newChat.rowId : SIDEBAR.activeChat.id;
  const titleTyping = frame >= S2.sidebarTitle.eraseStart && frame < S2.sidebarTitle.typeEnd + 10;

  const rowOf = (id: string, title: string, projectName?: string): SidebarRow => {
    const matches = (q: string): boolean =>
      q === '' || title.toLowerCase().includes(q) || (projectName !== undefined && projectName.toLowerCase().includes(q));
    return {id, title, visible: filterVisible(frame, matches), highlight: matchRange(title, query)};
  };

  const topRows: SidebarRow[] = [];
  if (newRowIn) {
    topRows.push({
      id: S5.newChat.rowId,
      title: UI_TEXT.newChatTitle,
      visible: lin(frame, S5.newChat.rowIn, S5.newChat.rowIn + S5.newChat.rowFrames),
    });
  }
  const activeRow = rowOf(SIDEBAR.activeChat.id, activeTitleAt(frame));
  activeRow.caret = titleTyping && caretVisible(frame, {lastKeystrokeFrame: lastKeystroke(TITLE_TYPING, frame)});
  topRows.push(activeRow);

  const projects: SidebarProject[] = SIDEBAR.projects.map((project) => {
    const projectMatches = (q: string): boolean =>
      q === '' || project.name.toLowerCase().includes(q) || project.chats.some((c) => c.title.toLowerCase().includes(q));
    return {
      id: project.id,
      name: project.name,
      highlight: matchRange(project.name, query),
      visible: filterVisible(frame, projectMatches),
      rows: project.chats.map((chat) => rowOf(chat.id, chat.title, project.name)),
    };
  });
  const rows: SidebarRow[] = SIDEBAR.ungrouped.map((chat) => rowOf(chat.id, chat.title));

  const searchFocus = lin(frame, S5.search.click, S5.search.click + S5.search.focusFrames) *
    (1 - lin(frame, S5.search.blurFrom, S5.search.blurFrom + S5.search.blurFrames));

  const hover: SidebarTarget | null = isHover(frame, 'clear') && query !== ''
    ? 'clear'
    : isHover(frame, 'search')
      ? 'search'
      : isHover(frame, 'new-chat')
        ? 'new-chat'
        : null;
  const pressed: SidebarTarget | null = pressedTarget(frame, 'clear') && query !== ''
    ? 'clear'
    : pressedTarget(frame, 'search')
      ? 'search'
      : pressedTarget(frame, 'new-chat')
        ? 'new-chat'
        : null;

  return {
    topRows,
    projects,
    rows,
    activeId,
    searchText: query,
    searchFocus,
    searchCaret: caretVisible(frame, {lastKeystrokeFrame: lastKeystroke(S5.search.typing, frame)}),
    hover,
    pressed,
  };
};

// ------------------------------------------------------------------ composer
const DRAFTS: readonly {typing: TypingScript; clear: number}[] = [
  {typing: S2.prompt, clear: S2.draftClear},
  {typing: S3.prompt, clear: S3.draftClear},
  {typing: S4.prompt, clear: S4.draftClear},
];

const draftAt = (frame: number): {text: string; sendEnable: number} => {
  for (const d of DRAFTS) {
    if (frame >= d.typing.start && frame < d.clear) {
      return {
        text: typedText(d.typing.text, frame, d.typing.start, d.typing.options),
        sendEnable: lin(frame, d.typing.start, d.typing.start + 4),
      };
    }
  }
  return {text: '', sendEnable: 0};
};

const modeAt = (frame: number): ModeId => (frame >= S4.mode.select.frame ? S4.mode.select.mode : 'auto');

const hoveredMenuIndex = (frame: number): number | null => {
  let index: number | null = null;
  for (const h of S4.mode.hovers) {
    if (frame >= h.frame) {
      index = h.index;
    }
  }
  return index;
};

const menuAt = (frame: number): ComposerProps['menu'] => {
  const m = S4.mode;
  if (frame < m.menuOpen) {
    return null;
  }
  if (frame < m.menuClose) {
    return {openProgress: lin(frame, m.menuOpen, m.menuOpen + 22), hoveredIndex: hoveredMenuIndex(frame)};
  }
  if (frame < m.menuClose + m.closeFrames) {
    return {openProgress: 1 - lin(frame, m.menuClose, m.menuClose + m.closeFrames), hoveredIndex: null};
  }
  return null;
};

const sendStateAt = (frame: number): NonNullable<ComposerProps['sendState']> => {
  if ((frame >= S2.run.from && frame < S2.run.to) || (frame >= S3.run.from && frame < S3.run.to)) {
    return 'pause';
  }
  if (frame >= S4.run.start && frame < S5.newChat.chatClear) {
    return frame >= S4.pause.click && frame < S4.pause.resume ? 'resume' : 'pause';
  }
  return 'send';
};

const composerAt = (frame: number): ComposerProps => {
  const draft = draftAt(frame);
  const focus = textareaFocusAt(frame);
  const searchFocused = frame >= S5.search.click && frame < S5.search.blurFrom;
  let last: number | undefined;
  for (const d of DRAFTS) {
    const k = lastKeystroke(d.typing, frame);
    if (k !== undefined && (last === undefined || k > last)) {
      last = k;
    }
  }
  const hover: ComposerTarget | null = isHover(frame, 'send')
    ? 'send'
    : isHover(frame, 'mode')
      ? 'mode'
      : isHover(frame, 'attach')
        ? 'attach'
        : isHover(frame, 'textarea')
          ? 'textarea'
          : null;
  const pressed: ComposerTarget | null = pressedTarget(frame, 'send')
    ? 'send'
    : pressedTarget(frame, 'mode')
      ? 'mode'
      : pressedTarget(frame, 'attach')
        ? 'attach'
        : null;

  const attachments: ComposerAttachment[] =
    frame >= S5.attach.appear
      ? [
          {
            id: 'competitors',
            name: UI_TEXT.attachmentName,
            appear: attachRawAt(frame),
            done: lin(frame, S5.attach.doneFrom, S5.attach.doneFrom + S5.attach.doneFrames),
          },
        ]
      : [];

  return {
    frame,
    draft: draft.text,
    draftLines: 1,
    caretVisible: focus > 0.5 && !searchFocused && caretVisible(frame, {lastKeystrokeFrame: last}),
    focus,
    mode: modeAt(frame),
    menu: menuAt(frame),
    sendState: sendStateAt(frame),
    sendEnable: draft.sendEnable,
    hover,
    pressed,
    attachments,
  };
};

// ------------------------------------------------------------------ working panel
const stepViewAt = (
  frame: number,
  step: StepScript,
  pause: {click: number; resume: number} | null,
): StepViewState | null => {
  if (frame < step.appear) {
    return null;
  }
  let idx = -1;
  step.runs.forEach((run, i) => {
    if (run.start <= frame) {
      idx = i;
    }
  });
  const run = step.runs[Math.max(0, idx)];
  const running = idx >= 0 && (run.end === null || frame < run.end);
  const paused = pause !== null && step.pausable === true && frame >= pause.click && frame < pause.resume;

  let status: StepStatus = idx < 0 ? 'pending' : running ? 'running' : 'done';
  if (running && paused) {
    status = 'awaiting';
  }

  let from: StepStatus | undefined;
  let flip = 1;
  if (idx >= 0) {
    if (!running && run.end !== null && frame < run.end + STEP_FLIP_FRAMES) {
      from = 'running';
      flip = lin(frame, run.end, run.end + STEP_FLIP_FRAMES);
    } else if (running && idx > 0 && frame < run.start + STEP_FLIP_FRAMES) {
      from = 'done';
      flip = lin(frame, run.start, run.start + STEP_FLIP_FRAMES);
    } else if (pause !== null && step.pausable === true && running) {
      if (paused && frame < pause.click + STEP_FLIP_FRAMES) {
        from = 'running';
        flip = lin(frame, pause.click, pause.click + STEP_FLIP_FRAMES);
      } else if (!paused && frame >= pause.resume && frame < pause.resume + STEP_FLIP_FRAMES) {
        from = 'awaiting';
        flip = lin(frame, pause.resume, pause.resume + STEP_FLIP_FRAMES);
      }
    }
  }

  let summary = '';
  for (const r of step.runs) {
    if (r.end !== null && r.end <= frame) {
      summary = r.summary;
    }
  }
  if (summary === '') {
    summary = step.runs[0]?.summary ?? '';
  }

  let expand = 0;
  for (const w of step.expand ?? []) {
    expand = Math.max(expand, lin(frame, w.openFrom, w.openTo) * (1 - lin(frame, w.closeFrom, w.closeTo)));
  }

  const note = step.note && frame >= step.note.from && frame < step.note.to ? step.note.text : undefined;
  const errorFlash =
    step.flash !== undefined && frame >= step.flash ? 1 - lin(frame, step.flash, step.flash + STEP_ERROR_FLASH_FRAMES) : 0;

  return {
    key: step.key,
    name: step.name,
    status,
    tier: step.tier,
    ms: status === 'done' ? run.ms : undefined,
    appear: lin(frame, step.appear, step.appear + 8),
    expand,
    summary,
    note,
    errorFlash,
    from,
    flip,
  };
};

const panelAt = (frame: number, panelWidth: number): PanelState | null => {
  if (frame < S3.panel.open || panelWidth < 0.5) {
    return null;
  }
  if (frame < S4.panel.cascade) {
    const steps = S3.steps.map((step) => stepViewAt(frame, step, null)).filter((s): s is StepViewState => s !== null);
    return {
      opacity: 1 - lin(frame, S4.panel.fadeOutStart, S4.panel.fadeOutEnd),
      cascade: frame - S3.panel.cascade,
      taskExcerpt: PROMPTS.teamExcerpt,
      routing: {
        tier: S3.routing.tier,
        fromTier: 'routing',
        morph: lin(frame, S3.reveal.morphStart + 2, S3.reveal.morphEnd + 2),
      },
      hover: {save: isHover(frame, 'save')},
      savePress: pulse(frame, S3.save.click),
      stepsScrollY: keyed(frame, S3.stepsScroll),
      graph: graphStateAt(frame, S3.graph.nodes, S3.graph.edges),
      steps,
    };
  }
  const pause = {click: S4.pause.click, resume: S4.pause.resume};
  const steps = S4.steps.map((step) => stepViewAt(frame, step, pause)).filter((s): s is StepViewState => s !== null);
  return {
    opacity: 1,
    cascade: frame - S4.panel.cascade,
    taskExcerpt: PROMPTS.control,
    routing: {tier: S4.routing.tier},
    hover: {},
    savePress: 0,
    stepsScrollY: 0,
    graph: graphStateAt(frame, S4.graph.nodes, S4.graph.edges),
    steps,
  };
};

// ------------------------------------------------------------------ the selector
/** The complete chat state at any global frame (pure). Frames before 240 give the initial empty chat, frames after 1500 hold the last state. */
export const appStateAt = (frame: number): AppState => {
  const panelWidth = panelWidthAt(frame);
  const rows = buildRows(frame);
  return {
    frame,
    sidebar: sidebarAt(frame),
    panelWidth,
    panel: panelAt(frame, panelWidth),
    chat: {
      reviewHires: signatureEase(lin(frame, S4.review.click, S4.review.click + S4.review.onFrames)),
      reviewHover: isHover(frame, 'review'),
      reviewPressed: pressedTarget(frame, 'review'),
      scrollY: scrollAt(frame),
      emptyState: rows.length === 0,
      rows,
    },
    composer: composerAt(frame),
  };
};

/** Same function under the name used by the patch guide. It is NOT a React hook: it reads no context. */
export const useAppState = (frame: number): AppState => appStateAt(frame);