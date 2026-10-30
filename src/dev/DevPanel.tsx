import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PROMPTS, SIDEBAR} from '../config/copy';
import {FONTS, NEUTRAL, SURFACE} from '../config/theme';
import {UI_OFFSET} from '../config/timeline';
import {ramp} from '../lib/ease';
import {FontsReady} from '../lib/fonts';
import {AppWindow} from '../ui/AppWindow';
import {ChatBox} from '../ui/ChatBox';
import {ChatSidebar} from '../ui/ChatSidebar';
import {HireReview, HIRE} from '../ui/HireReview';
import {PANEL, panelLayout, stepCardRect} from '../ui/panelLayout';
import {RoutingCard} from '../ui/RoutingCard';
import type {Rect} from '../ui/shellLayout';
import {STEP_ERROR_FLASH_FRAMES, STEP_FLIP_FRAMES, StepCard, type StepCardProps} from '../ui/StepCard';
import {TopNav} from '../ui/TopNav';
import {UserMessage} from '../ui/UserMessage';
import {WorkingPanel} from '../ui/WorkingPanel';

/**
 * DEV ONLY (patch 05): Working Panel, step cards, routing card, Hire Review. Not part of the film.
 *   npx remotion still src/index.ts DevPanel out/qa/panel-0.png --frame=45
 * Each state holds STATE_FRAMES frames and plays a short local animation:
 *   0 panel opens + cascade, 7 steps in different statuses | 1 verifier error flash + expand, code_writer re-run flip
 *   2 routing card morph + details | 3 Hire Review reveal, hover Edit, press Approve | 4 collapse to mini-trace
 *   5 anchors (panelLayout rectangles over the real DOM)
 */
export const PANEL_STATE_FRAMES = 60;
export const PANEL_STATE_NAMES = [
  'panel opens + 7 steps',
  'error flash, expand, re-run flip',
  'routing card morph + details',
  'Hire Review reveal + press',
  'Hire Review mini-trace',
  'anchors (layout check)',
] as const;
export const DEV_PANEL_FRAMES = PANEL_STATE_FRAMES * PANEL_STATE_NAMES.length;

type Step = Omit<StepCardProps, 'frame'>;

/** The seven steps of the Tier 3 run in a mix of statuses (the real timings come with the script in patch 07). */
const stepsFor = (state: number, local: number): Step[] => {
  const flashT = state === 1 ? local : 99;
  const expand = state === 1 ? ramp(local, 8, 22) : state === 5 ? 0 : 0;
  const flip = state === 1 ? ramp(local, 28, 28 + STEP_FLIP_FRAMES) : 1;
  return [
    {name: 'Inspector — classifying task', status: 'done', ms: 1912, tier: 'adaptive'},
    {name: 'strategist', status: 'done', ms: 6933},
    {name: 'market_researcher', status: 'awaiting', summary: 'Waiting for the pool size to be approved.'},
    {
      name: 'code_writer',
      status: 'running',
      from: state === 1 ? 'done' : undefined,
      flip,
      ms: 11326,
      summary: 'Writing the signup endpoint with input validation.',
    },
    {name: 'test_writer', status: 'done', ms: 8120},
    {
      name: 'verifier',
      status: 'error',
      ms: 4210,
      errorFlash: state === 1 ? 1 - ramp(flashT, 0, STEP_ERROR_FLASH_FRAMES) : 0,
      expand,
      summary: 'No rate limit on POST /signup. The endpoint accepts unlimited requests per IP.',
      note: '→ sent back to recheck code_writer',
    },
    {name: 'documentation_writer', status: 'pending'},
  ];
};

const GraphPlaceholder: React.FC = () => (
  <div
    style={{
      height: '100%',
      boxSizing: 'border-box',
      border: `1px dashed ${NEUTRAL[700]}`,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONTS.mono,
      fontSize: 11,
      color: NEUTRAL[600],
    }}
  >
    routing graph slot (patch 06) · 456 x {PANEL.graphH}
  </div>
);

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
        right: 0,
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

const Anchors: React.FC = () => {
  const p = panelLayout();
  return (
    <>
      {outline(p.header, '#38bdf8', 'header')}
      {outline(p.collapseButton, '#38bdf8', 'collapse')}
      {outline(p.traceLink, '#a78bfa', 'traceLink')}
      {outline(p.excerpt, '#a78bfa', 'excerpt')}
      {outline(p.routingCard, '#34d399', 'routingCard')}
      {outline(p.saveTemplate, '#fbbf24', 'saveTemplate')}
      {outline(p.graph, '#ec4899', 'graph')}
      {outline(p.steps, '#f59e0b', 'steps')}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => outline(stepCardRect(i), '#ffffff55', `${i}`))}
    </>
  );
};

const Demo: React.FC<{state: number; local: number}> = ({state, local}) => {
  const hireState = state === 3 || state === 4;
  const panelOpen = !hireState;
  const panelWidth = panelOpen ? (state === 0 ? Math.round(480 * ramp(local, 0, 30)) : 480) : 0;
  const cascade = state === 0 ? local - 12 : 999;

  let routing: React.ComponentProps<typeof RoutingCard> = {tier: 'adaptive'};
  if (state === 2) {
    routing = {
      tier: 'adaptive',
      fromTier: 'instant',
      morph: ramp(local, 4, 24),
      open: ramp(local, 30, 44),
      details: ['inspector → tier 3 (adaptive)', 'reason: multi-part build task', 'worker pool: auto'],
    };
  }

  const steps = stepsFor(state, local);
  const hireReveal = state === 3 ? local : 999;
  const hover = state === 3 ? {edit: local > 20 && local < 34, approve: local >= 34} : undefined;
  const press = state === 3 ? Math.sin(Math.PI * ramp(local, 44, 56)) : 0;
  const collapse = state === 4 ? ramp(local, 4, 22) : 0;
  const miniStatus = state === 4 ? (local > 44 ? ['done', 'done', 'running', 'pending', 'pending'] : local > 30 ? ['done', 'running', 'pending', 'pending', 'pending'] : ['running', 'pending', 'pending', 'pending', 'pending']) as ('done' | 'running' | 'pending')[] : undefined;

  return (
    <div style={{position: 'absolute', left: UI_OFFSET.x, top: UI_OFFSET.y}}>
      <AppWindow
        panelWidth={panelWidth}
        header={<TopNav />}
        sidebar={<ChatSidebar topRows={[{id: SIDEBAR.activeChat.id, title: SIDEBAR.activeChatAutoTitle, visible: 1}]} projects={[]} rows={[]} activeId={SIDEBAR.activeChat.id} />}
        panel={
          panelOpen ? (
            <WorkingPanel
              cascade={cascade}
              taskExcerpt={PROMPTS.teamExcerpt}
              routing={routing}
              hover={state === 0 && local > 40 ? {save: true} : undefined}
              graph={<GraphPlaceholder />}
              stepsScrollY={state === 1 ? 70 * ramp(local, 8, 22) : 0}
            >
              {steps.map((step, i) => (
                <StepCard key={i} frame={local} appear={state === 0 ? ramp(local, 30 + i * 3, 40 + i * 3) : 1} {...step} />
              ))}
            </WorkingPanel>
          ) : null
        }
      >
        <ChatBox composer={{frame: local, draft: '', mode: 'auto'}} reviewHires={hireState ? 1 : 0}>
          <UserMessage text={hireState ? PROMPTS.control : PROMPTS.team} />
          {hireState ? (
            <div style={{paddingBottom: 16}}>
              <HireReview reveal={hireReveal} collapse={collapse} hover={hover} approvePress={press} miniStatus={miniStatus} frame={local} />
            </div>
          ) : null}
        </ChatBox>
      </AppWindow>
      {state === 5 ? <Anchors /> : null}
      {state === 3 ? (
        <>
          {/* where the Hire Review sits vs FOCUS_RECTS.hiresCard, plus the button rectangles */}
          {outline({x: 272, y: 166, w: HIRE.w, h: HIRE.h}, '#eab308', 'hiresCard (focus.ts)')}
        </>
      ) : null}
    </div>
  );
};

export const DevPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const state = Math.min(PANEL_STATE_NAMES.length - 1, Math.floor(frame / PANEL_STATE_FRAMES));
  const local = frame - state * PANEL_STATE_FRAMES;
  return (
    <FontsReady>
      <AbsoluteFill style={{background: SURFACE.stageGradient}}>
        <Demo state={state === 5 ? 5 : state} local={local} />
        <div style={{position: 'absolute', left: 24, top: 24, fontFamily: FONTS.mono, fontSize: 12, color: NEUTRAL[400]}}>
          state {state}: {PANEL_STATE_NAMES[state]} · local frame {local}
        </div>
      </AbsoluteFill>
    </FontsReady>
  );
};

