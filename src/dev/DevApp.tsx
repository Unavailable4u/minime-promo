import React, {useLayoutEffect} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {anchorsAt} from '../config/anchors';
import {layoutAt, panelWidthAt} from '../config/appState';
import {CHAT_RANGE, S4} from '../config/script';
import {FONTS, NEUTRAL, SURFACE} from '../config/theme';
import {SCENE_NAMES, UI_OFFSET, sceneAt} from '../config/timeline';
import {FontsReady} from '../lib/fonts';
import {ChatApp} from '../ui/ChatApp';
import type {Rect} from '../ui/shellLayout';

/**
 * DEV ONLY (patch 07): the persistent <ChatApp/> at full 1920x1080 with NO camera. Not part of the film.
 *
 * The composition runs frames 0..1500 and the frame number IS the global film frame, so the check list of the
 * patch guide works as written:
 *   npx remotion still src/index.ts DevApp out/qa/app-330.png --frame=330
 * Frames before 240 show the initial empty chat (the film shows it from S1 on).
 *
 * Props (Studio side panel, or `--props='{"showAnchors":true}'` on the CLI):
 *   showAnchors  draw every rectangle of anchorsAt(frame) over the real DOM (cursor / callout targets)
 *   measureRows  console.log the estimated vs the real DOM height of every chat row (checks appState's estimates)
 */
export const DEV_APP_FRAMES = CHAT_RANGE.to + 1;

export type DevAppProps = {showAnchors?: boolean; measureRows?: boolean};

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

const AnchorOverlay: React.FC<{frame: number}> = ({frame}) => {
  const a = anchorsAt(frame);
  const panelOpen = panelWidthAt(frame) > 400; // panel anchors are only valid while the panel is open
  const entries: [string, Rect | null, string][] = [
    ['textarea', a.textarea, '#38bdf8'],
    ['send / pause / resume', a.sendButton, '#ec4899'],
    ['mode', a.modeButton, '#a78bfa'],
    ['attach', a.attachButton, '#fbbf24'],
    ['review hires', a.reviewHires, '#34d399'],
    ['hire card', a.hireCard, '#eab308'],
    ['approve', a.approveButton, '#ec4899'],
    ['edit', a.editButton, '#a78bfa'],
    ['save template', panelOpen ? a.saveTemplate : null, '#fbbf24'],
    ['search', a.searchField, '#38bdf8'],
    ['clear', a.searchClear, '#ec4899'],
    ['new chat', a.newChatButton, '#34d399'],
    ['chip', a.attachmentChip, '#fbbf24'],
    ['instant badge', a.instantBadge, '#f59e0b'],
    ['tier badge', a.tierBadge, '#f59e0b'],
    ['paused badge', a.pausedBadge, '#f59e0b'],
    ['graph', panelOpen ? a.panelGraph : null, '#ec4899'],
    ['steps', panelOpen ? a.panelSteps : null, '#f59e0b'],
  ];
  return (
    <>
      {entries.map(([label, rect, color]) => (rect ? outline(rect, color, label) : null))}
      {frame >= S4.mode.menuOpen && frame < S4.mode.menuClose
        ? [0, 1, 2, 3, 4].map((i) => outline(a.modeMenuRow(i), '#a78bfa55', `menu ${i}`))
        : null}
    </>
  );
};

export const DevApp: React.FC<DevAppProps> = ({showAnchors = false, measureRows = false}) => {
  const frame = useCurrentFrame();
  const scene = sceneAt(frame);
  useLayoutEffect(() => {
    if (!measureRows) {
      return;
    }
    // Dev check of the deterministic row-height estimate: log estimated vs real DOM height of every row.
    const column = document.querySelector('[data-chat-column]');
    const real = column ? Array.from(column.children).map((el) => el.getBoundingClientRect().height) : [];
    const est = layoutAt(frame).rows.map((r) => ({key: r.row.key, h: r.height}));
    console.log('ROWS ' + JSON.stringify({frame, rows: est.map((e, i) => ({...e, real: real[i] ?? null}))}));
  }, [frame, measureRows]);
  return (
    <FontsReady>
      <AbsoluteFill style={{background: SURFACE.stageGradient}}>
        <div style={{position: 'absolute', left: UI_OFFSET.x, top: UI_OFFSET.y}}>
          <ChatApp frame={frame} />
          {showAnchors ? <AnchorOverlay frame={frame} /> : null}
        </div>
        <div style={{position: 'absolute', left: 24, top: 24, fontFamily: FONTS.mono, fontSize: 12, color: NEUTRAL[400]}}>
          frame {frame} · {scene} {SCENE_NAMES[scene]}
        </div>
      </AbsoluteFill>
    </FontsReady>
  );
};
