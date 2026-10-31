import React from 'react';
import {ClipboardCheck, Menu, PanelRight} from 'lucide-react';
import {NAV_TABS, UI_TEXT} from '../../config/copy';
import {MOBILE_LAYOUT as L} from '../../config/mobileScript';
import {ACCENT, FONTS, NEUTRAL} from '../../config/theme';

const scale = (press: number): React.CSSProperties => ({transform: `scale(${(1 - 0.16 * press).toFixed(3)})`});

export type MobileHeaderProps = {
  /** 0..1 press of the hamburger / the panel toggle. */
  pressMenu: number;
  pressPanel: number;
};

/** Header (hamburger, tab strip with Chat active, panel toggle) and the "Chat Box / Review hires" sub-header (reference 7). */
export const MobileHeader: React.FC<MobileHeaderProps> = ({pressMenu, pressPanel}) => (
  <div style={{position: 'absolute', left: 0, top: L.statusH, width: L.w}}>
    <div style={{height: L.headerH, position: 'relative', borderBottom: `1px solid ${NEUTRAL[800]}`, boxSizing: 'border-box'}}>
      <div style={{position: 'absolute', left: L.hamburger.x - 12, top: 10, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', ...scale(pressMenu)}}>
        <Menu size={20} color={NEUTRAL[300]} />
      </div>
      <div style={{position: 'absolute', left: 52, right: 52, top: 0, height: L.headerH, display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', whiteSpace: 'nowrap'}}>
        {NAV_TABS.slice(0, 3).map((name, i) => (
          <div
            key={name}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontFamily: FONTS.heading,
              fontWeight: 600,
              fontSize: 13,
              background: i === 0 ? ACCENT.base : 'transparent',
              color: i === 0 ? ACCENT.text : NEUTRAL[400],
            }}
          >
            {name}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: L.panelToggle.x - 12, top: 10, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', ...scale(pressPanel)}}>
        <PanelRight size={19} color={NEUTRAL[300]} />
      </div>
    </div>
    <div style={{height: L.subHeaderH, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${NEUTRAL[800]}`, boxSizing: 'border-box'}}>
      <span style={{fontSize: 12, fontWeight: 500, color: NEUTRAL[400]}}>{UI_TEXT.chatBoxTitle}</span>
      <span style={{display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 10px', borderRadius: 6, border: `1px solid ${NEUTRAL[800]}`, fontFamily: FONTS.heading, fontSize: 12, color: NEUTRAL[500]}}>
        <ClipboardCheck size={12} color={NEUTRAL[500]} />
        {UI_TEXT.reviewHires}
      </span>
    </div>
  </div>
);
