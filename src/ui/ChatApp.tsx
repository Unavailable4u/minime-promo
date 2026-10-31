import React from 'react';
import {useCurrentFrame} from 'remotion';
import {HIRE_CARD_W, appStateAt, type AppState, type PanelState, type RowState} from '../config/appState';
import {AppWindow} from './AppWindow';
import {AssistantMessage} from './AssistantMessage';
import {ChatBox} from './ChatBox';
import {ChatSidebar} from './ChatSidebar';
import {HireReview} from './HireReview';
import {Markdown} from './Markdown';
import {RoutingGraph} from './RoutingGraph';
import {StepCard} from './StepCard';
import {TopNav} from './TopNav';
import {UserMessage} from './UserMessage';
import {WorkingPanel} from './WorkingPanel';

export type ChatAppProps = {
  /**
   * GLOBAL film frame. Pass it explicitly when <ChatApp/> sits inside a <Sequence> (useCurrentFrame() would then be
   * local). Default: the current frame, which is the global frame when the component is not inside a Sequence.
   */
  frame?: number;
  /** Rim light of the window (the film animates it with the camera): angle in degrees and strength 0..1. */
  rimAngle?: number;
  rimIntensity?: number;
  /** Extra styles for the window box (the film applies the S1 rise: opacity, transform, filter). */
  style?: React.CSSProperties;
  /**
   * Outro teaser (patch 15): 0..1 position of the light travelling across the INACTIVE tab names of the top nav
   * (see TopNav `sweep`). `null` / `undefined` = off. It never activates a tab and never shows any other tab's content.
   */
  navSweep?: number | null;
  /** Peak brightness of the nav sweep 0..1. Default 1. */
  navSweepStrength?: number;
};

/** One message row. Every row component brings its own 16 px bottom padding, except the Hire Review card. */
export const MessageRow: React.FC<{row: RowState; frame: number}> = ({row, frame}) => {
  switch (row.kind) {
    case 'user':
      return <UserMessage text={row.text} progress={row.progress} />;
    case 'working':
      return <AssistantMessage view="working" frame={row.localFrame} progress={row.progress} workingElapsed={row.elapsed} />;
    case 'assistant':
      return (
        <AssistantMessage frame={row.localFrame} progress={row.progress} meta={row.meta} badgeGlow={row.badgeGlow} caret={false}>
          {row.body !== null && row.body !== '' ? <Markdown text={row.body} caret={row.caret} frame={frame} /> : undefined}
        </AssistantMessage>
      );
    case 'hire':
      return (
        <div style={{paddingBottom: 16}}>
          <HireReview
            reveal={row.reveal}
            collapse={row.collapse}
            hover={row.hover}
            approvePress={row.approvePress}
            miniStatus={row.miniStatus}
            frame={row.localFrame}
            width={HIRE_CARD_W}
          />
        </div>
      );
  }
};

/** The Working Panel with its graph and step cards. It is always 480 px wide; AppWindow clips it while it opens. */
export const PanelView: React.FC<{panel: PanelState; frame: number}> = ({panel, frame}) => (
  <div style={{width: '100%', height: '100%', opacity: panel.opacity}}>
    <WorkingPanel
      cascade={panel.cascade}
      taskExcerpt={panel.taskExcerpt}
      routing={panel.routing}
      hover={panel.hover}
      savePress={panel.savePress}
      stepsScrollY={panel.stepsScrollY}
      graph={<RoutingGraph frame={frame} nodes={panel.graph.nodes} edges={panel.graph.edges} />}
    >
      {panel.steps.map((step) => (
        <StepCard
          key={step.key}
          name={step.name}
          status={step.status}
          tier={step.tier}
          ms={step.ms}
          frame={frame}
          appear={step.appear}
          expand={step.expand}
          summary={step.summary}
          note={step.note}
          errorFlash={step.errorFlash}
          from={step.from}
          flip={step.flip}
        />
      ))}
    </WorkingPanel>
  </div>
);

/** Draws one complete AppState (pure: props in, pixels out). Exported for tools that already hold a state. */
export const ChatAppView: React.FC<{state: AppState} & Omit<ChatAppProps, 'frame'>> = ({
  state,
  rimAngle,
  rimIntensity,
  style,
  navSweep,
  navSweepStrength,
}) => (
  <AppWindow
    header={<TopNav sweep={navSweep} sweepStrength={navSweepStrength} />}
    sidebar={<ChatSidebar {...state.sidebar} />}
    panel={state.panel ? <PanelView panel={state.panel} frame={state.frame} /> : null}
    panelWidth={state.panelWidth}
    rimAngle={rimAngle}
    rimIntensity={rimIntensity}
    style={style}
  >
    <ChatBox
      composer={state.composer}
      reviewHires={state.chat.reviewHires}
      reviewHover={state.chat.reviewHover}
      reviewPressed={state.chat.reviewPressed}
      scrollY={state.chat.scrollY}
      emptyState={state.chat.emptyState}
    >
      {state.chat.rows.map((row) => (
        <MessageRow key={row.key} row={row} frame={state.frame} />
      ))}
    </ChatBox>
  </AppWindow>
);

/**
 * The persistent chat app: ONE component whose whole look is a pure function of the global frame, driven by
 * src/config/script.ts through appStateAt(). Scenes never rebuild UI; they only add camera, cursor and overlays.
 *
 * Size: the 1440x810 logical window. Position it yourself (UI_OFFSET on the stage, or inside the Camera world).
 */
export const ChatApp: React.FC<ChatAppProps> = ({
  frame: frameOverride,
  rimAngle,
  rimIntensity,
  style,
  navSweep,
  navSweepStrength,
}) => {
  const current = useCurrentFrame();
  const frame = frameOverride ?? current;
  return (
    <ChatAppView
      state={appStateAt(frame)}
      rimAngle={rimAngle}
      rimIntensity={rimIntensity}
      style={style}
      navSweep={navSweep}
      navSweepStrength={navSweepStrength}
    />
  );
};
