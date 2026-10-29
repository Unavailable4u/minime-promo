/**
 * MiniMe promo — app shell geometry (single source of truth).
 *
 * Every number the shell components use for sizes lives in SHELL. `shellLayout()` turns those numbers into
 * rectangles in the UI's LOGICAL 1440x810 space (origin = top-left of the app window). Patch 07 uses these
 * rectangles for cursor targets and callout anchors, and src/config/focus.ts is written from the
 * `panelWidth = 0` result (DevShell's "Anchors" state draws both so drift is visible).
 *
 * Why fixed sizes: the real app lets buttons size to their text. A deterministic film needs cursor targets
 * that never move when a label changes ("Auto" -> "Expert", "Send" -> "Pause"), so the clickable controls
 * have fixed widths here. Text inside them is centered / spaced so it still looks natural.
 */
import {UI} from '../config/timeline';
import {signatureEase} from '../lib/ease';

export const SHELL = {
  /** Top navigation bar (border-bottom included). */
  headerH: 48,
  /** Chats sidebar width (w-64). */
  sidebarW: 256,
  /** Working Panel width when fully open. */
  panelMaxW: 480,
  /** Header of each pane (sidebar, Chat Box, Working Panel). */
  paneHeaderH: 40,
  /** p-4 */
  pad: 16,
  gap: 8,

  // sidebar
  searchStripH: 42, // py8 + 26 input + py8
  searchInputH: 26,
  sidebarIconBox: 22,
  sidebarIconGap: 2,
  sidebarRowH: 33, // py8 + 16 line + 1 border
  projectHeaderH: 28, // py6 + 16 line

  // chat box header
  reviewW: 108,
  reviewH: 26,

  // composer
  controlH: 41,
  attachW: 34,
  modeW: 112,
  sendW: 84,
  /** Line height of the textarea text: 14 px * 1.625. */
  textareaLine: 22.75,
  /** Height of the attachment-chip row (22 chip + 8 gap) when fully visible. */
  attachRowH: 30,

  // mode menu
  menuW: 224,
  menuBorder: 2,
  menuGap: 8, // mb-2
} as const;

export type Rect = {readonly x: number; readonly y: number; readonly w: number; readonly h: number};

export type ShellLayoutOptions = {
  /** Working Panel width 0..480. Default 0 (closed). */
  panelWidth?: number;
  /**
   * RAW 0..1 appear value of the attachment chips (the largest `appear` among them). The layout applies the same
   * easing as <Composer/> to the chip row height. Default 0 (no chips).
   */
  attachmentRow?: number;
  /** Number of text lines in the composer textarea. Default 1. */
  draftLines?: number;
};

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Height of the composer textarea for a number of text lines. */
export const textareaHeight = (lines: number): number =>
  Math.max(SHELL.controlH, 2 + 16 + SHELL.textareaLine * Math.max(1, lines));

/**
 * Height of each mode menu row (Auto, Simple, Fast, Expert, Beast): py8 + 20 label + 16 per hint line + py8.
 * At w 224 only Beast's hint ("Force the full pipeline, skip SGA/cache") wraps, to two lines (so 68 instead of 52).
 * The rows are drawn with these EXACT heights; if you edit a hint in copy.ts, re-check it in DevShell and
 * update this table.
 */
export const MODE_MENU_ROW_HEIGHTS = [52, 52, 52, 52, 68] as const;

export const MODE_MENU_HEIGHT = MODE_MENU_ROW_HEIGHTS.reduce<number>((sum, h) => sum + h, 0) + SHELL.menuBorder;

/** All key rectangles of the shell in logical UI coordinates. */
export const shellLayout = (options: ShellLayoutOptions = {}) => {
  const panelW = clamp(options.panelWidth ?? 0, 0, SHELL.panelMaxW);
  const attach = signatureEase(clamp(options.attachmentRow ?? 0, 0, 1));
  const lines = options.draftLines ?? 1;

  const bodyY = SHELL.headerH;
  const bodyH = UI.height - SHELL.headerH;

  const chatX = SHELL.sidebarW;
  const chatW = UI.width - SHELL.sidebarW - panelW;
  const chatR = chatX + chatW;

  // ---- sidebar
  const sidebarHeaderY = bodyY;
  const iconY = sidebarHeaderY + (SHELL.paneHeaderH - SHELL.sidebarIconBox) / 2;
  const collapseX = SHELL.sidebarW - 12 - SHELL.sidebarIconBox;
  const folderX = collapseX - SHELL.sidebarIconGap - SHELL.sidebarIconBox;
  const plusX = folderX - SHELL.sidebarIconGap - SHELL.sidebarIconBox;
  const searchY = bodyY + SHELL.paneHeaderH + (SHELL.searchStripH - SHELL.searchInputH) / 2;

  // ---- chat box
  const chatHeaderY = bodyY;
  const rowH = textareaHeight(lines);
  const composerH = 1 + SHELL.pad + SHELL.attachRowH * attach + rowH + SHELL.pad;
  const composerY = UI.height - composerH;
  const rowY = composerY + 1 + SHELL.pad + SHELL.attachRowH * attach;
  const controlY = rowY + rowH - SHELL.controlH; // fixed-height buttons are bottom aligned
  const attachX = chatX + SHELL.pad;
  const modeX = attachX + SHELL.attachW + SHELL.gap;
  const textareaX = modeX + SHELL.modeW + SHELL.gap;
  const sendX = chatR - SHELL.pad - SHELL.sendW;
  const textareaW = sendX - SHELL.gap - textareaX;

  return {
    window: {x: 0, y: 0, w: UI.width, h: UI.height},
    header: {x: 0, y: 0, w: UI.width, h: SHELL.headerH},
    sidebar: {x: 0, y: bodyY, w: SHELL.sidebarW, h: bodyH},
    sidebarHeader: {x: 0, y: sidebarHeaderY, w: SHELL.sidebarW, h: SHELL.paneHeaderH},
    newChatButton: {x: plusX, y: iconY, w: SHELL.sidebarIconBox, h: SHELL.sidebarIconBox},
    newFolderButton: {x: folderX, y: iconY, w: SHELL.sidebarIconBox, h: SHELL.sidebarIconBox},
    collapseButton: {x: collapseX, y: iconY, w: SHELL.sidebarIconBox, h: SHELL.sidebarIconBox},
    searchField: {x: 12, y: searchY, w: SHELL.sidebarW - 24, h: SHELL.searchInputH},
    /** The clear (x) button inside the search field, visible while it has text. */
    searchClear: {x: SHELL.sidebarW - 12 - 1 - 8 - 16, y: searchY + (SHELL.searchInputH - 16) / 2, w: 16, h: 16},
    /** First sidebar list row starts here. */
    sidebarListTop: bodyY + SHELL.paneHeaderH + SHELL.searchStripH,

    chatBox: {x: chatX, y: bodyY, w: chatW, h: bodyH},
    chatHeader: {x: chatX, y: chatHeaderY, w: chatW, h: SHELL.paneHeaderH},
    reviewHires: {
      x: chatR - SHELL.pad - SHELL.reviewW,
      y: chatHeaderY + (SHELL.paneHeaderH - SHELL.reviewH) / 2,
      w: SHELL.reviewW,
      h: SHELL.reviewH,
    },
    messageList: {
      x: chatX,
      y: bodyY + SHELL.paneHeaderH,
      w: chatW,
      h: composerY - (bodyY + SHELL.paneHeaderH),
    },
    composer: {x: chatX, y: composerY, w: chatW, h: composerH},
    attachButton: {x: attachX, y: controlY, w: SHELL.attachW, h: SHELL.controlH},
    modeButton: {x: modeX, y: controlY, w: SHELL.modeW, h: SHELL.controlH},
    textarea: {x: textareaX, y: rowY, w: textareaW, h: rowH},
    sendButton: {x: sendX, y: controlY, w: SHELL.sendW, h: SHELL.controlH},
    /** The attachment chip row (full height) above the controls. */
    attachmentRow: {
      x: attachX,
      y: composerY + 1 + SHELL.pad,
      w: chatW - 2 * SHELL.pad,
      h: SHELL.attachRowH * attach,
    },
    /** The mode menu opens upward from the mode button, 8 px above it. */
    modeMenu: {
      x: modeX,
      y: controlY - SHELL.menuGap - MODE_MENU_HEIGHT,
      w: SHELL.menuW,
      h: MODE_MENU_HEIGHT,
    },
    /** Rectangle of mode menu row `index` (0 = Auto ... 4 = Beast); hover targets for the cursor. */
    modeMenuRow: (index: number): Rect => {
      const i = Math.max(0, Math.min(MODE_MENU_ROW_HEIGHTS.length - 1, Math.round(index)));
      const above = MODE_MENU_ROW_HEIGHTS.slice(0, i).reduce<number>((sum, h) => sum + h, 0);
      return {
        x: modeX,
        y: controlY - SHELL.menuGap - MODE_MENU_HEIGHT + 1 + above,
        w: SHELL.menuW,
        h: MODE_MENU_ROW_HEIGHTS[i],
      };
    },

    panel: {x: UI.width - panelW, y: bodyY, w: panelW, h: bodyH},
  };
};

export type ShellLayout = ReturnType<typeof shellLayout>;

/** Center point of a rectangle (cursor waypoints usually aim here). */
export const rectCenter = (r: Rect): {x: number; y: number} => ({x: r.x + r.w / 2, y: r.y + r.h / 2});