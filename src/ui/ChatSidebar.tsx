import React from 'react';
import {FolderPlus, Plus, ChevronLeft, Search, Settings2, X} from 'lucide-react';
import {UI_TEXT} from '../config/copy';
import {ACCENT, FONTS, NEUTRAL, SURFACE} from '../config/theme';
import {lerpColor, withAlpha} from '../lib/color';
import {signatureEase} from '../lib/ease';
import {SHELL} from './shellLayout';

/** Character range (end exclusive) inside the text that is drawn highlighted (search match). */
export type SidebarHighlight = {start: number; end: number};

export type SidebarRow = {
  id: string;
  /** The text to draw. For the auto-title effect pass the partially typed string. */
  title: string;
  /** 0..1 live-filter / slide-in progress. 0 = collapsed and hidden, 1 = fully shown. Default 1. */
  visible?: number;
  /** Search match inside `title`. */
  highlight?: SidebarHighlight | null;
  /** Mouse is over the row. */
  hovered?: boolean;
  /** Draw a thin typing caret after the title (auto-title typing). */
  caret?: boolean;
};

export type SidebarProject = {
  id: string;
  /** Shown uppercase; pass the name as authored (for example "COFFEE CLUB"). */
  name: string;
  /** 0..1 visibility of the project HEADER only (rows carry their own `visible`). Default 1. */
  visible?: number;
  /** Search match inside `name`. */
  highlight?: SidebarHighlight | null;
  rows: SidebarRow[];
};

export type SidebarTarget = 'new-chat' | 'new-folder' | 'collapse' | 'search' | 'clear';

export type ChatSidebarProps = {
  /** Ungrouped rows pinned at the very top (the active chat; a freshly inserted "New Chat" row). */
  topRows: SidebarRow[];
  projects: SidebarProject[];
  /** Ungrouped rows below the projects. */
  rows: SidebarRow[];
  /** id of the active row (lighter background). */
  activeId?: string;
  searchText?: string;
  /** Search field is focused (crimson border). 0..1, default 0. */
  searchFocus?: number;
  /** Blink state of the search caret. */
  searchCaret?: boolean;
  /** Header icon / search control under the mouse. */
  hover?: SidebarTarget | null;
  /** Header icon / search control being pressed. */
  pressed?: SidebarTarget | null;
};

const ROW_BORDER = '#171717';

const renderHighlighted = (text: string, highlight?: SidebarHighlight | null): React.ReactNode => {
  if (!highlight || highlight.end <= highlight.start) {
    return text;
  }
  const start = Math.max(0, Math.min(text.length, highlight.start));
  const end = Math.max(start, Math.min(text.length, highlight.end));
  if (end === start) {
    return text;
  }
  return (
    <>
      {text.slice(0, start)}
      <span
        style={{
          background: withAlpha(ACCENT.base, 0.28),
          color: NEUTRAL[100],
          borderRadius: 2,
          boxShadow: `0 0 0 1px ${withAlpha(ACCENT.base, 0.28)}`,
        }}
      >
        {text.slice(start, end)}
      </span>
      {text.slice(end)}
    </>
  );
};

const Row: React.FC<{row: SidebarRow; active: boolean; indent: boolean}> = ({row, active, indent}) => {
  const v = Math.min(1, Math.max(0, row.visible ?? 1));
  if (v <= 0.001) {
    return null;
  }
  const e = signatureEase(v);
  return (
    <div
      style={{
        height: SHELL.sidebarRowH * e,
        overflow: 'hidden',
        opacity: e,
        transform: `translateX(${-10 * (1 - e)}px)`,
      }}
    >
      <div
        style={{
          height: SHELL.sidebarRowH,
          boxSizing: 'border-box',
          padding: `8px 12px 8px ${indent ? 24 : 12}px`,
          borderBottom: `1px solid ${ROW_BORDER}`,
          background: active ? SURFACE.activeRow : row.hovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 12,
            lineHeight: '16px',
            color: NEUTRAL[200],
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >
          {renderHighlighted(row.title, row.highlight)}
          {row.caret ? (
            <span
              style={{
                display: 'inline-block',
                width: 1.5,
                height: 12,
                marginLeft: 1,
                background: NEUTRAL[300],
                verticalAlign: '-2px',
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

const ProjectHeader: React.FC<{project: SidebarProject}> = ({project}) => {
  const v = Math.min(1, Math.max(0, project.visible ?? 1));
  if (v <= 0.001) {
    return null;
  }
  const e = signatureEase(v);
  return (
    <div style={{height: SHELL.projectHeaderH * e, overflow: 'hidden', opacity: e}}>
      <div
        style={{
          height: SHELL.projectHeaderH,
          boxSizing: 'border-box',
          padding: '6px 12px',
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontSize: 10,
            lineHeight: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: ACCENT.base,
            fontWeight: 500,
          }}
        >
          {renderHighlighted(project.name, project.highlight)}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
          <Plus size={11} color={NEUTRAL[500]} />
          <Settings2 size={11} color={NEUTRAL[500]} />
        </div>
      </div>
    </div>
  );
};

const IconButton: React.FC<{
  children: (color: string) => React.ReactNode;
  baseColor: string;
  hovered: boolean;
  pressed: boolean;
}> = ({children, baseColor, hovered, pressed}) => {
  const color = hovered || pressed ? NEUTRAL[200] : baseColor;
  return (
    <div
      style={{
        width: SHELL.sidebarIconBox,
        height: SHELL.sidebarIconBox,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: hovered || pressed ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        transform: pressed ? 'translateY(1px)' : undefined,
        filter: pressed ? 'brightness(0.94)' : undefined,
      }}
    >
      {children(color)}
    </div>
  );
};

/**
 * Chats sidebar, 256 px wide: header (Chats + new chat / new folder / collapse), search field, then
 * [topRows] [projects with their rows] [rows]. Pure: the live filter, the typed auto-title and the new-chat
 * slide-in are all expressed through per-row `visible`, `title`, `caret` and `highlight`.
 */
export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  topRows,
  projects,
  rows,
  activeId,
  searchText = '',
  searchFocus = 0,
  searchCaret = false,
  hover = null,
  pressed = null,
}) => {
  const focus = Math.min(1, Math.max(0, searchFocus));
  const searchHover = hover === 'search' && focus < 1;

  return (
    <div
      style={{
        width: SHELL.sidebarW,
        height: '100%',
        boxSizing: 'border-box',
        borderRight: `1px solid ${NEUTRAL[800]}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* header */}
      <div
        style={{
          height: SHELL.paneHeaderH,
          flexShrink: 0,
          boxSizing: 'border-box',
          padding: '0 12px',
          borderBottom: `1px solid ${NEUTRAL[800]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{fontSize: 12, lineHeight: '16px', fontWeight: 500, color: NEUTRAL[400]}}>
          {UI_TEXT.chatsTitle}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: SHELL.sidebarIconGap}}>
          <IconButton baseColor={NEUTRAL[400]} hovered={hover === 'new-chat'} pressed={pressed === 'new-chat'}>
            {(c) => <Plus size={14} color={c} />}
          </IconButton>
          <IconButton baseColor={NEUTRAL[400]} hovered={hover === 'new-folder'} pressed={pressed === 'new-folder'}>
            {(c) => <FolderPlus size={14} color={c} />}
          </IconButton>
          <IconButton baseColor={NEUTRAL[500]} hovered={hover === 'collapse'} pressed={pressed === 'collapse'}>
            {(c) => <ChevronLeft size={14} color={c} />}
          </IconButton>
        </div>
      </div>

      {/* search */}
      <div
        style={{
          height: SHELL.searchStripH,
          flexShrink: 0,
          boxSizing: 'border-box',
          padding: '8px 12px',
        }}
      >
        <div
          style={{
            position: 'relative',
            height: SHELL.searchInputH,
            boxSizing: 'border-box',
            borderRadius: 4,
            background: 'rgba(0, 0, 0, 0.3)',
            border: `1px solid ${
              focus > 0 ? lerpColor(NEUTRAL[800], ACCENT.base, focus) : searchHover ? NEUTRAL[600] : NEUTRAL[800]
            }`,
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Search size={11} color={NEUTRAL[500]} style={{flexShrink: 0}} />
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 12,
              lineHeight: '16px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              color: searchText.length > 0 ? NEUTRAL[200] : NEUTRAL[500],
            }}
          >
            {searchText.length > 0 ? searchText : UI_TEXT.searchPlaceholder}
            {focus > 0 && searchCaret ? (
              <span
                style={{
                  display: 'inline-block',
                  width: 1,
                  height: 13,
                  marginLeft: 1,
                  background: NEUTRAL[200],
                  verticalAlign: '-2px',
                  position: searchText.length === 0 ? 'absolute' : 'static',
                  left: searchText.length === 0 ? 26 : undefined,
                  top: searchText.length === 0 ? 6 : undefined,
                }}
              />
            ) : null}
          </div>
          {searchText.length > 0 ? (
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: hover === 'clear' || pressed === 'clear' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              }}
            >
              <X size={11} color={hover === 'clear' || pressed === 'clear' ? NEUTRAL[200] : NEUTRAL[500]} />
            </div>
          ) : null}
        </div>
      </div>

      {/* list */}
      <div style={{flex: 1, minHeight: 0, overflow: 'hidden', fontFamily: FONTS.body}}>
        {topRows.map((row) => (
          <Row key={row.id} row={row} active={row.id === activeId} indent={false} />
        ))}
        {projects.map((project) => (
          <div key={project.id}>
            <ProjectHeader project={project} />
            {project.rows.map((row) => (
              <Row key={row.id} row={row} active={row.id === activeId} indent />
            ))}
          </div>
        ))}
        {rows.map((row) => (
          <Row key={row.id} row={row} active={row.id === activeId} indent={false} />
        ))}
      </div>
    </div>
  );
};