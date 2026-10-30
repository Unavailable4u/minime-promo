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
  // ---- PATCH 09 (S2 Instant) ----
  instantComposer: {x: 256, y: 620, w: 1184, h: 160},
  instantChat: {x: 10, y: 130, w: 1380, h: 460},
  instantAnswer: {x: 250, y: 150, w: 720, h: 340},
  // ---- PATCH 10 (S3a Team: prompt, panel opens, Inspector, tier reveal) ----
  /** The Working Panel opening: the top of the panel (header .. graph) plus a strip of the reflowing chat on its left. */
  teamPanel: {x: 760, y: 48, w: 680, h: 480},
  /** The Inspector push: graph slot + the first step card, with a little chat on the left. */
  teamInspector: {x: 900, y: 200, w: 540, h: 380},
  /** The tier badge of the S3 answer with the user bubble above it (chat column, panel open). */
  teamBadge: {x: 262, y: 300, w: 520, h: 180},
  /** Wide two-column shot: chat badge on the left, routing card + graph on the right. */
  teamReveal: {x: 256, y: 100, w: 1184, h: 380},
  // ---- PATCH 11 (S3b Team: the run and the recheck) ----
  /** The top of the Working Panel (routing card .. graph .. first step cards) with a strip of chat on its left. */
  teamRun: {x: 760, y: 150, w: 680, h: 420},
  /** The routing graph slot with a little chat on the left (graph units x 1.036: slot x 972..1428, y 218..506). */
  teamGraph: {x: 880, y: 200, w: 560, h: 330},
  /** Recheck moment: the lower graph (verifier -> code_writer edge) and the step list, chat strip on the left for the callout chip. */
  teamRecheck: {x: 760, y: 240, w: 680, h: 540},
  /** Pull-back: the whole chat column on the left, the whole panel on the right. */
  teamTwoColumn: {x: 256, y: 88, w: 1184, h: 640},
  // ---- PATCH 12 (S3c Team: final answer, stat chip, save-template toast) ----
  /**
   * The streaming answer. The auto-scroll (script.ts SCROLL) keeps the newest line about 120 px above the composer,
   * so while the answer streams the newest text always sits in this band (the bubble bottom is at y 555-690 and
   * the caret about 25 px above it). The band is deliberately taller than the text it follows: one static rect
   * serves the whole stream and the camera only orbits it. Panel open (chat box x 256..960).
   */
  answerStream: {x: 262, y: 216, w: 700, h: 520},
  /** The top of the Working Panel: routing card, "Save as template" row and the whole routing graph. */
  teamSave: {x: 760, y: 104, w: 680, h: 430},
  // ---- PATCH 13 (S4 Control: mode menu, Review hires, approve, pause / resume) ----
  // The Working Panel is OPEN for the whole of S4 (it opened at f604), so the chat box is x 256..960 and the composer
  // is 704 px wide. The mode button is left-aligned in the composer, so the menu rectangle is the same as with the
  // panel closed. Every rect below was checked against anchorsAt() (src/config/anchors.ts).
  /** Composer with the panel open: attach, mode pill (314..426), textarea (434..852), send (860..944). */
  controlComposer: {x: 256, y: 690, w: 704, h: 120},
  /**
   * The mode menu (x 314..538, y 467..745, opens upward) with the mode pill under it. The rect is wide on the right so
   * the callout chip has room, and its centre sits at y 640 so the caption stays on the empty stage under the window.
   */
  controlMenu: {x: 256, y: 450, w: 704, h: 380},
  /** Chat header with the "Review hires" toggle (836..944, 55..81) and a strip of the panel header on its right. */
  controlHeader: {x: 520, y: 48, w: 560, h: 170},
  /** The Review staffed roles card once it has scrolled into place (card y about 206..586), with the user bubble above. */
  controlHire: {x: 262, y: 150, w: 700, h: 470},
  /** The routing graph, the step cards and the Pause / Resume button (860..944, 753..794): one shot for the pause. */
  controlPause: {x: 760, y: 218, w: 680, h: 592},
  /** The whole chat box and the whole panel, composer included (teamTwoColumn stops at y 728 and cuts the Pause button). */
  controlWide: {x: 256, y: 88, w: 1184, h: 722},
  // ---- PATCH 14 (S5 Organized: sidebar search, new chat, attachment) ----
  /**
   * The sidebar from the top nav down to the lower rows, plus a wide strip of the chat box on its right. The rect is wide
   * on purpose: the camera centres on it, so the sidebar sits on the left of the stage and the callout chips and the
   * bottom-centre caption fall over the chat box. The height (585) fixes the zoom at 1.60 and keeps the nav row whole.
   * The Working Panel is still open up to f1402.
   */
  organizeSidebar: {x: 0, y: 48, w: 900, h: 585},
  /**
   * The bottom-left of the chat box with the Working Panel CLOSED (f1402 on): chip row (y 706..745), attach button
   * (272..306, 753..794), mode pill, start of the textarea. The empty chat's faint logo watermark (UI y about 380..435)
   * is deliberately out of frame. Zoom 2.34.
   */
  organizeComposer: {x: 256, y: 600, w: 760, h: 210},
  // ---- PATCH 15 (S6 Outro: hero 3/4 view) ----
  /**
   * The whole window with extra stage on every side, shifted so the window sits in the upper part of the frame and the
   * caption has empty stage under it. The rect is wider and taller than the window on purpose: with padding 72 it gives
   * zoom 1.0 at scaleBias 1, the window centre sits about 70 px above the stage centre, and the depth-of-field mask
   * (it blurs outside the focus rect) only touches the far edges of the stage, not the grid floor next to the window.
   */
  outroHero: {x: -168, y: 7, w: 1776, h: 936},
} as const satisfies Record<string, FocusRect>;

export type FocusName = keyof typeof FOCUS_RECTS;

export const FOCUS_NAMES = Object.keys(FOCUS_RECTS) as FocusName[];

/** Look up a focus rectangle (logical UI coordinates). */
export const focusRect = (name: FocusName): FocusRect => FOCUS_RECTS[name];
