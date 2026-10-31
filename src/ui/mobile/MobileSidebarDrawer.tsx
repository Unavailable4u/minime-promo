import React from 'react';
import {Bell, ChevronLeft, FolderPlus, MoreVertical, Plus, Search, Settings2} from 'lucide-react';
import {SIDEBAR, UI_TEXT, USER} from '../../config/copy';
import {MOBILE_LAYOUT as L, MOBILE_TIMES} from '../../config/mobileScript';
import {ACCENT, FONTS, NEUTRAL} from '../../config/theme';
import {clamp01, signatureEase} from '../../lib/ease';

export type MobileSidebarDrawerProps = {
  /** 0..1 open progress (eased by the script). */
  open: number;
  /** Frames since the drawer started to open (rows stagger 3 f apart). */
  local: number;
  pressChevron: number;
};

const Row: React.FC<{title: string; enter: number; active?: boolean}> = ({title, enter, active}) => (
  <div style={{height: 41, boxSizing: 'border-box', padding: '0 12px 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${NEUTRAL[900]}`, background: active ? '#1a1a1a' : 'transparent', opacity: enter, transform: `translateX(${(-12 * (1 - enter)).toFixed(2)}px)`}}>
    <span style={{fontSize: 13, color: NEUTRAL[200], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{title}</span>
    <MoreVertical size={14} color={NEUTRAL[500]} />
  </div>
);

/** The sidebar drawer (reference 8): slides from the left over a dimmed chat. Fictional data only (Maya Chen, the D1 sidebar). */
export const MobileSidebarDrawer: React.FC<MobileSidebarDrawerProps> = ({open, local, pressChevron}) => {
  const o = clamp01(open);
  if (o <= 0.001) {
    return null;
  }
  const stagger = (i: number): number => signatureEase(clamp01((local - 4 - i * MOBILE_TIMES.rowStagger) / 8));
  let index = 0;
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: L.w, height: L.h, background: `rgba(0,0,0,${(0.55 * o).toFixed(3)})`}} />
      <div
        style={{
          position: 'absolute',
          left: -L.sidebarW * (1 - o),
          top: L.statusH,
          width: L.sidebarW,
          height: L.h - L.statusH - L.homeH,
          background: '#101010',
          boxShadow: 'inset -1px 0 0 #262626, 8px 0 30px rgba(0,0,0,0.5)',
          fontFamily: FONTS.body,
          overflow: 'hidden',
        }}
      >
        <div style={{height: 44, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderBottom: `1px solid ${NEUTRAL[800]}`, boxSizing: 'border-box'}}>
          <span style={{fontFamily: FONTS.heading, fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em', color: NEUTRAL[200]}}>
            Mini<span style={{color: ACCENT.wordmarkMe}}>Me</span>
          </span>
          <span style={{flex: 1}} />
          <Bell size={15} color={NEUTRAL[400]} />
          <span style={{width: 22, height: 22, borderRadius: '50%', background: NEUTRAL[800], color: NEUTRAL[300], fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{USER.initial}</span>
          <span style={{fontSize: 12, color: NEUTRAL[300]}}>{USER.name}</span>
        </div>
        <div style={{height: 44, display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', boxSizing: 'border-box'}}>
          <span style={{fontSize: 12, fontWeight: 500, color: NEUTRAL[400], flex: 1}}>{UI_TEXT.chatsTitle}</span>
          <Plus size={16} color={NEUTRAL[400]} />
          <FolderPlus size={16} color={NEUTRAL[400]} style={{marginLeft: 6}} />
          <span style={{display: 'flex', marginLeft: 6, transform: `scale(${(1 - 0.18 * pressChevron).toFixed(3)})`}}>
            <ChevronLeft size={17} color={NEUTRAL[300]} />
          </span>
        </div>
        <div style={{margin: '0 12px 8px', height: 30, borderRadius: 6, border: `1px solid ${NEUTRAL[800]}`, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', boxSizing: 'border-box', fontSize: 12, color: NEUTRAL[500]}}>
          <Search size={13} color={NEUTRAL[500]} />
          <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{UI_TEXT.searchPlaceholder}</span>
        </div>
        <Row title={SIDEBAR.activeChatAutoTitle} enter={stagger(index++)} active />
        {SIDEBAR.projects.map((project) => (
          <React.Fragment key={project.id}>
            <div style={{height: 32, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: stagger(index)}}>
              <span style={{fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: ACCENT.base}}>{`${project.name} · ${project.chats.length}`}</span>
              <Settings2 size={13} color={NEUTRAL[500]} />
            </div>
            {project.chats.map((chat) => (
              <Row key={chat.id} title={chat.title} enter={stagger(index++)} />
            ))}
          </React.Fragment>
        ))}
        {SIDEBAR.ungrouped.slice(0, 2).map((chat) => (
          <Row key={chat.id} title={chat.title} enter={stagger(index++)} />
        ))}
      </div>
    </>
  );
};
