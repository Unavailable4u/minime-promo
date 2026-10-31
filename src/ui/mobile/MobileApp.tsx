import React from 'react';
import {Paperclip, Send, Sparkles} from 'lucide-react';
import {appStateAt, type RowState} from '../../config/appState';
import {MOBILE_LAYOUT as L, type MobileState} from '../../config/mobileScript';
import {ACCENT, FONTS, NEUTRAL, SURFACE} from '../../config/theme';
import {TouchDot} from '../../fx/TouchDot';
import {AssistantMessage} from '../AssistantMessage';
import {Markdown} from '../Markdown';
import {UserMessage} from '../UserMessage';
import {MobileBoot} from './MobileBoot';
import {MobileGraphSheet} from './MobileGraphSheet';
import {MobileHeader} from './MobileHeader';
import {MobilePanelDrawer} from './MobilePanelDrawer';
import {MobileSidebarDrawer} from './MobileSidebarDrawer';

export type MobileAppProps = {
  state: MobileState;
  /** Film content frame of the chat (the finished Tier 3 run). */
  contentFrame: number;
};

const Row: React.FC<{row: RowState; frame: number}> = ({row, frame}) => {
  if (row.kind === 'user') {
    return <UserMessage text={row.text} progress={1} maxWidthPct={88} />;
  }
  if (row.kind === 'assistant') {
    return (
      <AssistantMessage frame={row.localFrame} progress={1} meta={row.meta} caret={false} maxWidthPct={100}>
        {row.body ? <Markdown text={row.body} caret={false} frame={frame} /> : undefined}
      </AssistantMessage>
    );
  }
  return null;
};

/**
 * The phone app (390 x 844 logical px): boot screen, chat, sidebar drawer, Working Panel drawer, routing graph sheet and
 * the touch dot. Pure: everything comes from mobileStateAt() and appStateAt(). Fictional data only.
 */
export const MobileApp: React.FC<MobileAppProps> = ({state, contentFrame}) => {
  const app = appStateAt(contentFrame);
  const rows = app.chat.rows.filter((row) => row.key.startsWith('s3'));
  return (
    <div style={{position: 'relative', width: L.w, height: L.h, background: SURFACE.appBody, color: NEUTRAL[100], fontFamily: FONTS.body, overflow: 'hidden'}}>
      {/* chat */}
      <div style={{position: 'absolute', left: 0, top: L.statusH + L.headerH + L.subHeaderH, width: L.w, height: L.h - L.statusH - L.headerH - L.subHeaderH - L.composerH - L.homeH, overflow: 'hidden'}}>
        <div style={{padding: '18px 12px', transform: `translateY(${-state.scrollY}px)`}}>
          {rows.map((row) => (
            <Row key={row.key} row={row} frame={app.frame} />
          ))}
        </div>
      </div>
      <MobileHeader pressMenu={state.press.hamburger} pressPanel={state.press.panelToggle} />
      {/* composer */}
      <div style={{position: 'absolute', left: 0, top: L.h - L.homeH - L.composerH, width: L.w, height: L.composerH, boxSizing: 'border-box', padding: '12px', display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${NEUTRAL[800]}`, background: SURFACE.appBody}}>
        <Paperclip size={18} color={NEUTRAL[500]} />
        <Sparkles size={18} color={NEUTRAL[500]} />
        <div style={{flex: 1, height: 38, borderRadius: 8, border: `1px solid ${NEUTRAL[800]}`, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13, color: NEUTRAL[500], boxSizing: 'border-box'}}>Describe a task...</div>
        <div style={{width: 38, height: 38, borderRadius: 8, background: ACCENT.base, opacity: 0.55, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Send size={16} color="#fff" />
        </div>
      </div>
      <MobileSidebarDrawer open={state.sidebar} local={state.sidebarLocal} pressChevron={state.press.chevron} />
      <MobilePanelDrawer open={state.panel} local={state.panelLocal} contentFrame={state.panelFrame} pressGraph={state.press.graphCard} />
      <MobileGraphSheet open={state.sheet} graphFrame={state.graphFrame} />
      <TouchDot x={state.touch.x} y={state.touch.y} on={state.touch.on} down={state.touch.down} ripple={state.touch.ripple} />
      {/* boot screen: the chat wipes in top-down, the boot screen is pulled off DOWNWARD with a bright scanline on its edge */}
      {state.bootOn ? (
        <div style={{position: 'absolute', left: 0, top: state.chatReveal * L.h, width: L.w, height: L.h - state.chatReveal * L.h, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: -state.chatReveal * L.h, width: L.w, height: L.h}}>
            <MobileBoot width={L.w} height={L.h} progress={state.bootProgress} />
          </div>
        </div>
      ) : null}
      {state.bootOn && state.chatReveal > 0 && state.chatReveal < 1 ? (
        <div style={{position: 'absolute', left: 0, top: state.chatReveal * L.h - 1.5, width: L.w, height: 3, background: `linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.95) 30%, ${ACCENT.base} 70%, rgba(255,255,255,0))`, boxShadow: '0 0 14px rgba(255,32,82,0.8)'}} />
      ) : null}
    </div>
  );
};
