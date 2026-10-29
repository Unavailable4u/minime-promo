/**
 * MiniMe promo — named focus rectangles.
 *
 * Every rectangle is in the UI's LOGICAL 1440x810 space (origin = top-left of the app window, NOT of the stage).
 * The virtual camera (src/fx/Camera.tsx) frames one of these per keyframe; callouts and spotlights can
 * anchor to them too. Add a key here and `FocusName` grows automatically.
 *
 * Geometry assumed (from the app layout): header 48 px, sidebar 256 px, chat box fills the rest,
 * Working Panel 480 px wide when open, composer pinned to the bottom of the chat box.
 *
 * PATCH 03 (app shell) MAY REFINE THESE NUMBERS to the real geometry. If it does, it must edit this file.
 *
 * Panel state matters: rectangles that live in the chat box (composer, messageList, assistantBadge,
 * modeMenu, hiresCard) are written for the layout with the Working Panel CLOSED (chat box = x 256..1440,
 * content column centered on x = 848). While the panel is open the chat box is only 704 px wide
 * (x 256..960), so a scene that frames the composer with the panel open should add its own key
 * (for example `composerPanelOpen`) instead of reusing `composer`.
 */

export type FocusRect = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

export const FOCUS_RECTS = {
  /** Top navigation bar, full width. */
  nav: {x: 0, y: 0, w: 1440, h: 48},
  /** Chats sidebar (search, projects, chat list). */
  sidebar: {x: 0, y: 48, w: 256, h: 762},
  /** The composer card: textarea, mode picker, send button. Panel closed. */
  composer: {x: 468, y: 674, w: 760, h: 112},
  /** The message column (user bubble + assistant answer). Panel closed. */
  messageList: {x: 448, y: 64, w: 800, h: 586},
  /** The assistant's avatar + name + tier label row at the top of an assistant message. Panel closed. */
  assistantBadge: {x: 448, y: 150, w: 380, h: 48},
  /** The whole Working Panel (header, routing graph, step cards). Panel open. */
  workingPanel: {x: 960, y: 48, w: 480, h: 762},
  /** The live routing graph card at the top of the Working Panel. */
  graph: {x: 972, y: 100, w: 456, h: 300},
  /** The scrolling list of step cards under the graph. */
  stepCards: {x: 972, y: 408, w: 456, h: 394},
  /** The mode picker dropdown, opened upward from the composer. */
  modeMenu: {x: 468, y: 396, w: 320, h: 270},
  /** The "Review staffed roles" hire review card inside the chat box. */
  hiresCard: {x: 488, y: 210, w: 720, h: 380},
  /** The entire app window. */
  fullWindow: {x: 0, y: 0, w: 1440, h: 810},
} as const satisfies Record<string, FocusRect>;

export type FocusName = keyof typeof FOCUS_RECTS;

export const FOCUS_NAMES = Object.keys(FOCUS_RECTS) as FocusName[];

/** Look up a focus rectangle (logical UI coordinates). */
export const focusRect = (name: FocusName): FocusRect => FOCUS_RECTS[name];
