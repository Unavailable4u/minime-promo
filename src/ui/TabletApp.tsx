import React from 'react';
import {appStateAt} from '../config/appState';
import {FONTS, NEUTRAL, SURFACE} from '../config/theme';
import {ChatBox} from './ChatBox';
import {MessageRow, PanelView} from './ChatApp';

export const TABLET_LAYOUT = {w: 1180, h: 820, chatW: 700, panelW: 480} as const;

export type TabletAppProps = {
  /** The film frame the content is built from (appStateAt is pure for any frame). */
  contentFrame: number;
};

/**
 * The tablet layout: the desktop chat column (700 px) + the Working Panel (480 px), no sidebar and no top nav, so no
 * third design exists. Pure: props in, pixels out. Reuses ChatBox, MessageRow and PanelView.
 */
export const TabletApp: React.FC<TabletAppProps> = ({contentFrame}) => {
  const state = appStateAt(contentFrame);
  const rows = state.chat.rows.filter((row) => row.key.startsWith('s3'));
  return (
    <div style={{position: 'relative', width: TABLET_LAYOUT.w, height: TABLET_LAYOUT.h, display: 'flex', background: SURFACE.appBody, color: NEUTRAL[100], fontFamily: FONTS.body, overflow: 'hidden'}}>
      <div style={{width: TABLET_LAYOUT.chatW, height: '100%', position: 'relative'}}>
        <ChatBox
          composer={state.composer}
          reviewHires={state.chat.reviewHires}
          scrollY={state.chat.scrollY}
          emptyState={false}
        >
          {rows.map((row) => (
            <MessageRow key={row.key} row={row} frame={state.frame} />
          ))}
        </ChatBox>
      </div>
      <div style={{width: TABLET_LAYOUT.panelW, height: '100%', position: 'relative', boxShadow: 'inset 1px 0 0 #262626'}}>
        {state.panel ? <PanelView panel={state.panel} frame={state.frame} /> : null}
      </div>
    </div>
  );
};
