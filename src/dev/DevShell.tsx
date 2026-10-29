import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SIDEBAR, UI_TEXT, PROMPTS} from '../config/copy';
import {FONTS, NEUTRAL, SURFACE} from '../config/theme';
import {UI_OFFSET} from '../config/timeline';
import {ramp} from '../lib/ease';
import {FontsReady} from '../lib/fonts';
import {AppWindow} from '../ui/AppWindow';
import {AssistantMessage, type AssistantMeta} from '../ui/AssistantMessage';
import {ChatBox} from '../ui/ChatBox';
import {
  ChatSidebar,
  type SidebarProject,
  type SidebarRow,
} from '../ui/ChatSidebar';
import type {ComposerProps} from '../ui/Composer';
import {MODE_MENU_OPEN_FRAMES} from '../ui/ModeMenu';
import {SHELL, shellLayout, type Rect} from '../ui/shellLayout';
import {TopNav} from '../ui/TopNav';
import {UserMessage} from '../ui/UserMessage';

/**
 * DEV ONLY (patch 03): static states of the app shell. Not part of the film.
 *   npx remotion still src/index.ts DevShell out/qa/shell-empty.png --frame=30
 * Each state holds for STATE_FRAMES frames and plays a short local animation so the stagger and the
 * morphs can be scrubbed in the Studio:
 *   0 empty chat | 1 chat with messages | 2 mode menu open | 3 search filter | 4 Review hires ON |
 *   5 thinking + panel open | 6 meta variants | 7 anchors (layout rectangles over the real DOM)
 */
export const STATE_FRAMES = 60;
export const STATE_NAMES = [
  'empty chat',
  'chat with messages',
  'mode menu open',
  'search filter active',
  'Review hires ON',
  'thinking + panel open',
  'meta variants',
  'anchors (layout check)',
] as const;
export const DEV_SHELL_FRAMES = STATE_FRAMES * STATE_NAMES.length;

// ------------------------------------------------------------------ sample data
const SAMPLE_TITLE = SIDEBAR.activeChatAutoTitle;

type SidebarOptions = {
  activeTitle?: string;
  query?: string;
  hoverId?: string;
  /** 0..1 progress of the live filter animation. */
  filter?: number;
};

const buildSidebar = ({activeTitle, query = '', hoverId, filter = 1}: SidebarOptions) => {
  const q = query.trim().toLowerCase();
  const matchRange = (text: string) => {
    if (!q) {
      return null;
    }
    const start = text.toLowerCase().indexOf(q);
    return start < 0 ? null : {start, end: start + q.length};
  };
  // visible goes 1 -> 0 (hidden) or stays 1 (match) as the filter animates
  const vis = (match: boolean) => (!q || match ? 1 : 1 - filter);

  const toRow = (id: string, title: string, projectMatch = false): SidebarRow => {
    const range = matchRange(title);
    return {
      id,
      title,
      visible: vis(range !== null || projectMatch),
      highlight: range,
      hovered: hoverId === id,
    };
  };

  const topRows: SidebarRow[] = [toRow(SIDEBAR.activeChat.id, activeTitle ?? SIDEBAR.activeChat.title)];
  const projects: SidebarProject[] = SIDEBAR.projects.map((p) => {
    const projectMatch = matchRange(p.name) !== null;
    const rows = p.chats.map((c) => toRow(c.id, c.title, projectMatch));
    const anyVisible = projectMatch || rows.some((r) => r.highlight);
    return {
      id: p.id,
      name: p.name,
      highlight: matchRange(p.name),
      visible: vis(anyVisible),
      rows,
    };
  });
  const rows: SidebarRow[] = SIDEBAR.ungrouped.map((c) => toRow(c.id, c.title));
  return {topRows, projects, rows};
};

const CHAT_USER = PROMPTS.instant;
const CHAT_BODY = [
  ['Debounce', ' waits until calls stop for a set delay, then fires once — ideal for search-as-you-type.'],
  ['Throttle', " fires at most once per interval, however often it's called — ideal for scroll and resize handlers."],
] as const;

const SampleBody: React.FC = () => (
  <ul style={{margin: 0, paddingLeft: 20, color: NEUTRAL[300], display: 'flex', flexDirection: 'column', gap: 4}}>
    {CHAT_BODY.map(([bold, rest]) => (
      <li key={bold}>
        <strong style={{color: NEUTRAL[100], fontWeight: 600}}>{bold}</strong>
        {rest}
      </li>
    ))}
  </ul>
);

const baseComposer = (frame: number): ComposerProps => ({
  frame,
  draft: '',
  mode: 'auto',
});

// ------------------------------------------------------------------ demo scene
type DemoProps = {state: number; local: number};

const Demo: React.FC<DemoProps> = ({state, local}) => {
  const caretOn = Math.floor(local / 8) % 2 === 0;
  const stateIsPanel = state === 5;
  const panelWidth = stateIsPanel ? Math.round(480 * ramp(local, 0, 30)) : 0;

  let sidebar = buildSidebar({});
  let activeId: string | undefined = SIDEBAR.activeChat.id;
  let searchText = '';
  let searchFocus = 0;
  let composer: ComposerProps = baseComposer(local);
  let reviewHires = 0;
  let reviewHover = false;
  let scrollY = 0;
  let emptyState = false;
  let messages: React.ReactNode = null;
  let hoverSidebar: 'new-chat' | 'clear' | null = null;
  let sidebarFocusCaret = false;

  const userRow = (progress = 1) => <UserMessage key="u" text={CHAT_USER} progress={progress} />;

  switch (state) {
    case 0: {
      emptyState = true;
      composer = {...composer, focus: 1, caretVisible: caretOn};
      break;
    }
    case 1: {
      sidebar = buildSidebar({activeTitle: SAMPLE_TITLE, hoverId: 'pricing-teardown'});
      composer = {...baseComposer(local), draft: ''};
      messages = (
        <>
          {userRow(ramp(local, 0, 8))}
          <AssistantMessage
            key="a"
            frame={local}
            progress={ramp(local, 8, 16)}
            meta={{kind: 'tier', tier: 0, ok: true, elapsed: '1.2s'}}
            caret
          >
            <SampleBody />
          </AssistantMessage>
        </>
      );
      break;
    }
    case 2: {
      const openProgress = Math.min(1, local / MODE_MENU_OPEN_FRAMES);
      composer = {...baseComposer(local), menu: {openProgress, hoveredIndex: local > 30 ? 4 : local > 26 ? 3 : null}};
      messages = userRow();
      break;
    }
    case 3: {
      searchText = PROMPTS.search;
      searchFocus = 1;
      sidebarFocusCaret = caretOn;
      hoverSidebar = local > 40 ? 'clear' : null;
      sidebar = buildSidebar({activeTitle: SAMPLE_TITLE, query: PROMPTS.search, filter: ramp(local, 0, 24)});
      messages = (
        <>
          {userRow()}
          <AssistantMessage frame={local} meta={{kind: 'tier', tier: 0, ok: true, elapsed: '1.2s'}}>
            <SampleBody />
          </AssistantMessage>
        </>
      );
      break;
    }
    case 4: {
      reviewHires = ramp(local, 0, 14);
      reviewHover = local < 14;
      composer = {...baseComposer(local), draft: PROMPTS.control, focus: 1, caretVisible: caretOn};
      emptyState = true;
      break;
    }
    case 5: {
      composer = {...baseComposer(local), draft: '', sendState: 'pause'};
      messages = (
        <>
          <UserMessage text={PROMPTS.team} />
          <AssistantMessage
            frame={local}
            avatar="thinking"
            meta={{kind: 'tier', tier: 3, morph: ramp(local, 20, 50), elapsed: undefined}}
            badgeGlow={Math.sin(Math.PI * ramp(local, 20, 50))}
          >
            <div style={{color: NEUTRAL[400]}}>…</div>
          </AssistantMessage>
        </>
      );
      break;
    }
    case 6: {
      const metas: AssistantMeta[] = [
        {kind: 'routing'},
        {kind: 'tier', tier: 0, ok: true, elapsed: '1.2s'},
        {kind: 'tier', tier: 3, ok: true, elapsed: '41s'},
        {kind: 'paused', elapsed: '23s'},
        {kind: 'error', elapsed: '9s'},
      ];
      messages = (
        <>
          <AssistantMessage frame={local} view="working" avatar="thinking" workingElapsed="3s" />
          {metas.map((meta, i) => (
            <AssistantMessage key={i} frame={local} meta={meta} maxWidthPct={55}>
              <div style={{color: NEUTRAL[300]}}>Body text sits 8 px under the meta row.</div>
            </AssistantMessage>
          ))}
        </>
      );
      break;
    }
    default: {
      // 7: anchors. A populated shell with a mode menu and an attachment chip, panel open half way.
      composer = {
        ...baseComposer(local),
        draft: PROMPTS.control,
        focus: 1,
        menu: {openProgress: 1, hoveredIndex: 1},
        attachments: [{id: 'a', name: UI_TEXT.attachmentName, appear: 1, done: 1}],
      };
      messages = userRow();
      break;
    }
  }

  const attachmentAppear = composer.attachments?.reduce((m, a) => Math.max(m, a.appear), 0) ?? 0;
  const layout = shellLayout({panelWidth: state === 7 ? 0 : panelWidth, attachmentRow: attachmentAppear});

  return (
    <div style={{position: 'absolute', left: UI_OFFSET.x, top: UI_OFFSET.y}}>
      <AppWindow
        panelWidth={panelWidth}
        rimAngle={local * 6}
        rimIntensity={state === 0 ? 1 : 0}
        header={<TopNav sweep={state === 6 ? ramp(local, 0, 59) : null} />}
        sidebar={
          <ChatSidebar
            {...sidebar}
            activeId={activeId}
            searchText={searchText}
            searchFocus={searchFocus}
            searchCaret={sidebarFocusCaret}
            hover={hoverSidebar ?? (state === 0 ? 'new-chat' : null)}
          />
        }
        panel={
          stateIsPanel ? (
            <div style={{height: '100%'}}>
              {/* stand-in only: the real Working Panel is patch 05 */}
              <div
                style={{
                  height: SHELL.paneHeaderH,
                  boxSizing: 'border-box',
                  padding: '0 16px',
                  borderBottom: `1px solid ${NEUTRAL[800]}`,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 12,
                  fontWeight: 500,
                  color: NEUTRAL[400],
                }}
              >
                {UI_TEXT.workingPanelTitle}
              </div>
            </div>
          ) : null
        }
      >
        <ChatBox
          composer={composer}
          reviewHires={reviewHires}
          reviewHover={reviewHover}
          scrollY={scrollY}
          emptyState={emptyState}
        >
          {messages}
        </ChatBox>
      </AppWindow>

      {state === 7 ? <AnchorOverlay layout={layout} /> : null}
    </div>
  );
};

// ------------------------------------------------------------------ anchors overlay
const outline = (rect: Rect, color: string, label: string): React.ReactNode => (
  <div
    key={label}
    style={{
      position: 'absolute',
      left: rect.x,
      top: rect.y,
      width: rect.w,
      height: rect.h,
      outline: `1px solid ${color}`,
      outlineOffset: -1,
      pointerEvents: 'none',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: -11,
        fontFamily: FONTS.mono,
        fontSize: 9,
        lineHeight: '10px',
        color,
        background: 'rgba(0,0,0,0.75)',
        padding: '0 2px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  </div>
);

const AnchorOverlay: React.FC<{layout: ReturnType<typeof shellLayout>}> = ({layout}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 810, pointerEvents: 'none'}}>
    {outline(layout.newChatButton, '#22d3ee', 'new')}
    {outline(layout.newFolderButton, '#22d3ee', 'folder')}
    {outline(layout.collapseButton, '#22d3ee', 'collapse')}
    {outline(layout.searchField, '#22d3ee', 'search')}
    {outline(layout.reviewHires, '#a3e635', 'review hires')}
    {outline(layout.attachmentRow, '#f59e0b', 'chips')}
    {outline(layout.composer, '#e879f9', 'composer')}
    {outline(layout.attachButton, '#a3e635', 'attach')}
    {outline(layout.modeButton, '#a3e635', 'mode')}
    {outline(layout.textarea, '#a3e635', 'textarea')}
    {outline(layout.sendButton, '#a3e635', 'send')}
    {outline(layout.modeMenu, '#f59e0b', 'mode menu')}
    {outline(layout.modeMenuRow(1), '#f59e0b', 'row 1')}
    {outline(layout.modeMenuRow(4), '#f59e0b', 'row 4 (beast)')}
    {outline(layout.messageList, '#38bdf8', 'message list')}
  </div>
);

// ------------------------------------------------------------------ composition
export const DevShell: React.FC = () => {
  const frame = useCurrentFrame();
  const state = Math.min(STATE_NAMES.length - 1, Math.floor(frame / STATE_FRAMES));
  const local = frame - state * STATE_FRAMES;

  return (
    <FontsReady>
      <AbsoluteFill style={{background: SURFACE.stageGradient}}>
        <Demo state={state} local={local} />
        <div
          style={{
            position: 'absolute',
            left: 24,
            top: 24,
            fontFamily: FONTS.mono,
            fontSize: 16,
            color: NEUTRAL[500],
          }}
        >
          DevShell · state {state}: {STATE_NAMES[state]} · local frame {local}
        </div>
      </AbsoluteFill>
    </FontsReady>
  );
};