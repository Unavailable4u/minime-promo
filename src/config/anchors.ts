/**
 * MiniMe promo — anchor points for cursor waypoints and callouts (patch 07).
 *
 * `anchorsAt(frame)` returns the rectangle of every control the scenes aim at, in the UI's LOGICAL 1440x810 space
 * (origin = top-left of the app window), following the things that move: the composer grows when the attachment
 * chip appears, the chat box narrows when the Working Panel opens, message rows move with the auto-scroll.
 * Feed a point into `<Cursor waypoints>` as `{x, y}` (use `anchorPoint(rect)` for the center) and into
 * `<Callout anchor={{x, y, space: 'ui'}}>`.
 *
 * Why this file is not part of script.ts (as the patch guide says): it needs the layout and scroll engine of
 * appState.ts, and appState.ts imports script.ts. Putting it in script.ts would create an import cycle.
 *
 * `null` = that control does not exist at this frame (for example the Approve button before the card appears).
 */
import {HIRE_CARD_W, layoutAt, panelWidthAt, type RowState} from './appState';
import {S5} from './script';
import {hireReviewLayout} from '../ui/HireReview';
import {panelLayout} from '../ui/panelLayout';
import {rectCenter, SHELL, shellLayout, type Rect} from '../ui/shellLayout';
import {lerpFraction} from './anchorsMath';

export type Anchors = {
  textarea: Rect;
  sendButton: Rect;
  /** Send turns into Pause / Resume in place: same rectangle. */
  pauseButton: Rect;
  resumeButton: Rect;
  modeButton: Rect;
  modeMenu: Rect;
  modeMenuRow: (index: number) => Rect;
  reviewHires: Rect;
  /** The Review staffed roles card (S4), `null` before it appears. */
  hireCard: Rect | null;
  approveButton: Rect | null;
  editButton: Rect | null;
  /** "Save as template" in the Working Panel (valid once the panel is fully open). */
  saveTemplate: Rect;
  searchField: Rect;
  searchClear: Rect;
  newChatButton: Rect;
  attachButton: Rect;
  /** The competitors.pdf chip above the controls. */
  attachmentChip: Rect | null;
  /** Tier badge (avatar + meta row) of the S2 answer. */
  instantBadge: Rect | null;
  /** Tier badge of the S3 answer (routing… -> Tier 3). */
  tierBadge: Rect | null;
  /** The meta row of the paused S4 message. */
  pausedBadge: Rect | null;
  /** Routing graph slot and step-card list of the Working Panel (panel open). */
  panelGraph: Rect;
  panelSteps: Rect;
};

/** Center point of a rectangle. */
export const anchorPoint = rectCenter;

const BADGE_W = 240;
const CHIP_W = 150;
const CHIP_H = 22;

const badgeRect = (columnX: number, top: number): Rect => ({
  // avatar 26 + gap 8, then the bubble border 1 + padding 12; the meta row starts 1 + 8 below the bubble top
  x: columnX + 26 + 8 + 12 + 1,
  y: top + 9,
  w: BADGE_W,
  h: 16,
});

export const anchorsAt = (frame: number): Anchors => {
  const layout = layoutAt(frame);
  const attachRaw = Math.min(1, Math.max(0, lerpFraction(frame, S5.attach.appear, S5.attach.appear + S5.attach.appearFrames)));
  const shell = shellLayout({panelWidth: panelWidthAt(frame), attachmentRow: attachRaw, draftLines: 1});
  const panel = panelLayout();

  const rowOf = (key: string): {row: RowState; top: number; height: number} | undefined =>
    layout.rows.find((r) => r.row.key === key);

  const hire = rowOf('s4-hire');
  const hireCard: Rect | null = hire ? {x: layout.columnX, y: hire.top, w: HIRE_CARD_W, h: hire.height - 16} : null;
  const hireButtons = hireReviewLayout(HIRE_CARD_W);
  const hireVisible = hire !== undefined && hire.row.kind === 'hire' && hire.row.collapse < 0.5;

  const s2 = rowOf('s2-assistant');
  const s3 = rowOf('s3-assistant');
  const paused = rowOf('s4-paused');

  const chipRow = shell.attachmentRow;

  return {
    textarea: shell.textarea,
    sendButton: shell.sendButton,
    pauseButton: shell.sendButton,
    resumeButton: shell.sendButton,
    modeButton: shell.modeButton,
    modeMenu: shell.modeMenu,
    modeMenuRow: shell.modeMenuRow,
    reviewHires: shell.reviewHires,
    hireCard,
    approveButton:
      hireCard && hireVisible
        ? {x: hireCard.x + hireButtons.approve.x, y: hireCard.y + hireButtons.approve.y, w: hireButtons.approve.w, h: hireButtons.approve.h}
        : null,
    editButton:
      hireCard && hireVisible
        ? {x: hireCard.x + hireButtons.edit.x, y: hireCard.y + hireButtons.edit.y, w: hireButtons.edit.w, h: hireButtons.edit.h}
        : null,
    saveTemplate: panel.saveTemplate,
    searchField: shell.searchField,
    searchClear: shell.searchClear,
    newChatButton: shell.newChatButton,
    attachButton: shell.attachButton,
    attachmentChip: attachRaw > 0 ? {x: chipRow.x, y: shell.composer.y + 1 + SHELL.pad, w: CHIP_W, h: CHIP_H} : null,
    instantBadge: s2 ? badgeRect(layout.columnX, s2.top) : null,
    tierBadge: s3 ? badgeRect(layout.columnX, s3.top) : null,
    pausedBadge: paused ? badgeRect(layout.columnX, paused.top) : null,
    panelGraph: panel.graph,
    panelSteps: panel.steps,
  };
};