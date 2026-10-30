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
 * PATCH 03 (app shell) REFINED the chat-box rectangles to the real geometry in src/ui/shellLayout.ts
 * (computed with `shellLayout()` and panelWidth = 0). If SHELL numbers change, re-derive these; DevShell's
 * "anchors" state draws the layout rectangles over the real DOM so drift is visible.
 *
 * Panel state matters: rectangles that live in the chat box (composer, messageList, assistantBadge,
 * modeMenu, hiresCard) are written for the layout with the Working Panel CLOSED (chat box = x 256..1440).
 * The message column is LEFT aligned (px 16, so content starts at x = 272) and the composer spans the whole
 * chat box. While the panel is open the chat box is only 704 px wide (x 256..960), so a scene that frames
 * the composer with the panel open should add its own key (for example `composerPanelOpen`:
 * {x: 256, y: 736, w: 704, h: 74}) instead of reusing `composer`.
 *
 * PATCH 05 refined `graph` and `stepCards` to the real Working Panel geometry (src/ui/panelLayout.ts, drawn over
 * the DOM by DevPanel state 5). The other panel parts (traceLink, routingCard, saveTemplate, collapse button) are
 * exported by `panelLayout()` and `stepCardRect(i)`; Hire Review buttons by `hireReviewLayout()` (card-local).
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
  /** The composer row: attach, mode picker, textarea, send. Full chat-box width. Panel closed. */
  composer: {x: 256, y: 736, w: 1184, h: 74},
  /** The message list area between the chat header and the composer. Panel closed. */
  messageList: {x: 256, y: 88, w: 1184, h: 648},
  /**
   * The assistant avatar + the meta row (tier badge) at the top of the FIRST assistant message, which sits under a
   * one-line user bubble. A wrapped (two-line) user prompt pushes it down by about 23 px.
   */
  assistantBadge: {x: 268, y: 164, w: 380, h: 40},
  /** The whole Working Panel (header, routing graph, step cards). Panel open. */
  workingPanel: {x: 960, y: 48, w: 480, h: 762},
  /** The routing graph slot of the Working Panel, under the routing card and "Save as template" (patch 05, panelLayout.ts). */
  graph: {x: 972, y: 218, w: 456, h: 288},
  /** The clipped step-card list under the graph: fits all 7 collapsed cards (34 px, gap 6); scroll with stepsScrollY. */
  stepCards: {x: 972, y: 516, w: 456, h: 282},
  /** The mode picker dropdown (opens upward) together with the mode button under it. */
  modeMenu: {x: 314, y: 467, w: 224, h: 327},
  /** The "Review staffed roles" hire review card inside the chat box. */
  hiresCard: {x: 272, y: 166, w: 720, h: 380},
  /** The entire app window. */
  fullWindow: {x: 0, y: 0, w: 1440, h: 810},
} as const satisfies Record<string, FocusRect>;

export type FocusName = keyof typeof FOCUS_RECTS;

export const FOCUS_NAMES = Object.keys(FOCUS_RECTS) as FocusName[];

/** Look up a focus rectangle (logical UI coordinates). */
export const focusRect = (name: FocusName): FocusRect => FOCUS_RECTS[name];
